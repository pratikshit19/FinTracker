import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Plus, Hash, Tag, CreditCard, Activity, Wallet, ShieldCheck, ArrowRight
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/lib/CurrencyContext';
import { buildMonthSummary, cn } from '@/lib/utils';
import { StatCard } from '@/components/dashboard/StatCard';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { FinancialAdvisor } from '@/components/dashboard/FinancialAdvisor';
import type { Expense, ExpenseInsert, Budget, Goal } from '@/types';

export const DashboardPage = () => {
  const { formatAmount } = useCurrency();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  
  // Core Profile Data
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [savingsTarget, setSavingsTarget] = useState(5000);
  const [minLeftover, setMinLeftover] = useState(2000);
  
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'quick-add') {
      setFormOpen(true);
      setSearchParams(params => {
        params.delete('action');
        return params;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [expensesRes, budgetsRes, goalsRes, subsRes, profileRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active'),
      supabase.from('profiles').select('monthly_income, savings_target, min_leftover').eq('id', user.id).single()
    ]);

    if (expensesRes.data) setExpenses(expensesRes.data as Expense[]);
    if (budgetsRes.data) setBudgets(budgetsRes.data as Budget[]);
    if (goalsRes.data) setGoals(goalsRes.data as Goal[]);
    if (subsRes.data) setSubscriptions(subsRes.data);
    
    if (profileRes.data) {
      setMonthlyIncome(profileRes.data.monthly_income || 0);
      setSavingsTarget(profileRes.data.savings_target || 5000);
      setMinLeftover(profileRes.data.min_leftover || 2000);
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summary = buildMonthSummary(expenses, currentYear, currentMonth);

  const handleAdd = async (data: ExpenseInsert) => {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('expenses').insert({ ...data, user_id: user.id });
    await fetchData();
    setFormOpen(false);
    setSubmitting(false);
  };

  const handleEdit = async (data: ExpenseInsert) => {
    if (!editTarget) return;
    setSubmitting(true);
    await supabase.from('expenses').update(data).eq('id', editTarget.id);
    await fetchData();
    setEditTarget(undefined);
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handlePayBill = async (bill: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setLoading(true);
    
    await supabase.from('expenses').insert({
      user_id: user.id,
      title: `Bill: ${bill.name}`,
      amount: bill.amount,
      category: 'Utilities',
      date: new Date().toISOString().split('T')[0]
    });

    const nextDate = new Date(bill.next_billing || bill.date);
    if (bill.billing_cycle === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    else if (bill.billing_cycle === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
    else nextDate.setMonth(nextDate.getMonth() + 1);

    await supabase.from('subscriptions').update({
      next_billing: nextDate.toISOString().split('T')[0]
    }).eq('id', bill.id);

    await fetchData();
  };

  // Core Math
  const fixedExpenses = subscriptions.reduce((sum, sub) => {
    if (sub.billing_cycle === 'monthly') return sum + sub.amount;
    if (sub.billing_cycle === 'yearly') return sum + sub.amount / 12;
    if (sub.billing_cycle === 'weekly') return sum + sub.amount * 4.33;
    return sum;
  }, 0);

  const disposableIncome = Math.max(0, monthlyIncome - fixedExpenses);
  const freeToSpend = disposableIncome - savingsTarget - minLeftover;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full pb-12">
      {/* Hero Welcome Row */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-surface)] border border-[var(--border)] p-6 rounded-xl relative overflow-hidden"
      >
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Pratikshit!</h1>
          <p className="text-[var(--text-muted)] mt-1 flex items-center gap-2">
            <Activity size={14} className="text-[var(--success)]" />
            Your dashboard is ready. Keep up the good work.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6">
            <Plus size={18} className="mr-2" /> Add Expense
          </Button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 blur-[100px] rounded-full -mr-32 -mt-32" />
      </motion.div>

      {/* Financial Advisor Row */}
      {!loading && monthlyIncome > 0 && (
        <FinancialAdvisor
          income={monthlyIncome}
          fixedExpenses={fixedExpenses}
          totalSpent={summary.totalSpent}
          budgets={budgets}
          goals={goals.filter(g => g.name !== 'Wealth Vault' && g.name !== 'Savings Config')}
          upcomingBills={subscriptions.filter(s => {
            if (!s.next_billing) return false;
            const nextDate = new Date(s.next_billing);
            const now = new Date();
            return (nextDate.getMonth() === now.getMonth() && nextDate.getFullYear() === now.getFullYear()) || nextDate < now;
          })}
          categorySpent={summary.categoryBreakdown}
          onPayBill={handlePayBill}
        />
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <Skeleton className="md:col-span-12 h-24 rounded-2xl" />
          <div className="md:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
          <Skeleton className="md:col-span-8 h-64 rounded-3xl" />
          <Skeleton className="md:col-span-4 h-64 rounded-3xl" />
          <Skeleton className="md:col-span-12 h-[500px] rounded-3xl" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* This Month's Flow Banner */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 to-transparent pointer-events-none" />
            
            <div className="flex items-center gap-3 md:w-1/5 relative z-10">
              <div className="h-10 w-10 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center shrink-0">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Salary</p>
                <p className="font-bold text-lg">{formatAmount(monthlyIncome)}</p>
              </div>
            </div>

            <ArrowRight size={16} className="text-[var(--text-muted)] hidden md:block" />

            <div className="flex items-center gap-3 md:w-1/5 relative z-10">
              <div className="h-10 w-10 rounded-full bg-[var(--danger-subtle)] text-[var(--danger)] flex items-center justify-center shrink-0">
                <Activity size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Fixed Bills</p>
                <p className="font-bold text-lg">{formatAmount(fixedExpenses)}</p>
              </div>
            </div>

            <ArrowRight size={16} className="text-[var(--text-muted)] hidden md:block" />

            <div className="flex items-center gap-3 md:w-1/5 relative z-10">
              <div className="h-10 w-10 rounded-full bg-[var(--info-subtle)] text-[var(--info)] flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Savings & Buffer</p>
                <p className="font-bold text-lg">{formatAmount(savingsTarget + minLeftover)}</p>
              </div>
            </div>

            <ArrowRight size={16} className="text-[var(--text-muted)] hidden md:block" />

            <div className="flex items-center justify-end gap-3 md:w-1/4 relative z-10 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border)]">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Free to Spend</p>
                <p className={cn("font-black text-xl", freeToSpend < 0 ? "text-[var(--danger)]" : "text-[var(--accent)]")}>
                  {formatAmount(freeToSpend)}
                </p>
              </div>
            </div>
          </div>

          {/* Main Stats Area */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <StatCard
              title="Monthly Spent"
              value={summary.totalSpent}
              icon={<CreditCard size={18} />}
              color="var(--accent)"
              index={0}
            />
            <StatCard
              title="Avg/Day"
              value={summary.avgPerDay}
              icon={<TrendingUp size={18} />}
              color="var(--warning)"
              index={1}
            />
            <StatCard
              title="Transactions"
              value={summary.transactionCount}
              icon={<Hash size={18} />}
              color="var(--success)"
              isCurrency={false}
              index={2}
            />
            <StatCard
              title="Top Category"
              value={summary.topCategory as any}
              icon={<Tag size={18} />}
              color="var(--info)"
              isCurrency={false}
              index={3}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-[var(--accent)]" />
                Daily Spending Trend
              </h3>
              <SpendingChart data={summary.dailySpend} height={250} />
            </div>

            <div className="lg:col-span-1 h-full">
              <CategoryBreakdown breakdown={summary.categoryBreakdown} total={summary.totalSpent} />
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="w-full">
            <RecentTransactions
              expenses={expenses}
              onDelete={handleDelete}
              onEdit={exp => { setEditTarget(exp); setFormOpen(true); }}
            />
          </div>
        </div>
      )}

      <TransactionForm
        open={formOpen}
        onOpenChange={open => { setFormOpen(open); if (!open) setEditTarget(undefined); }}
        onSubmit={editTarget ? handleEdit : handleAdd}
        defaultValues={editTarget}
        loading={submitting}
      />
    </div>
  );
};

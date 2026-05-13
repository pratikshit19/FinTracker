import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingCart, TrendingUp, Calendar, Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/lib/CurrencyContext';
import { buildMonthSummary } from '@/lib/utils';
import { StatCard } from '@/components/dashboard/StatCard';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton, CardSkeleton, TransactionSkeleton } from '@/components/ui/Skeleton';

import { BudgetCard } from '@/components/dashboard/BudgetCard';
import { GoalCard } from '@/components/dashboard/GoalCard';
import { ChevronRight, ArrowRight, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { FinancialHealthScore } from '@/components/dashboard/FinancialHealthScore';
import { PredictiveBillCalendar } from '@/components/dashboard/PredictiveBillCalendar';
import { MoneyFlowMap } from '@/components/dashboard/MoneyFlowMap';
import { Hash, Tag, CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import type { Expense, ExpenseInsert, Budget, Goal } from '@/types';


export const DashboardPage = () => {
  const { formatAmount } = useCurrency();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | undefined>();
  const [submitting, setSubmitting] = useState(false);

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
      supabase.from('profiles').select('monthly_income').eq('id', user.id).single()
    ]);

    if (expensesRes.data) setExpenses(expensesRes.data as Expense[]);
    if (budgetsRes.data) setBudgets(budgetsRes.data as Budget[]);
    if (goalsRes.data) setGoals(goalsRes.data as Goal[]);
    if (subsRes.data) setSubscriptions(subsRes.data);
    if (profileRes.data) setMonthlyIncome(profileRes.data.monthly_income || 0);

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

  const monthName = now.toLocaleString('default', { month: 'long' });

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
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
            Your financial health score is looking strong this month.
          </p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6">
            <Plus size={18} className="mr-2" /> Add Expense
          </Button>
        </div>
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 blur-[100px] rounded-full -mr-32 -mt-32" />
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
          <Skeleton className="md:col-span-4 md:row-span-2 h-full min-h-[400px] rounded-3xl" />
          <Skeleton className="md:col-span-4 h-64 rounded-3xl" />
          <Skeleton className="md:col-span-4 h-64 rounded-3xl" />
          <Skeleton className="md:col-span-12 h-[500px] rounded-3xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Main Stats Area (Top Left) */}
          <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-4">

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

          {/* Bill Calendar (Top Right) */}
          <div className="md:col-span-4 md:row-span-2">
            <PredictiveBillCalendar
              bills={subscriptions.map(s => ({
                id: s.id,
                name: s.name,
                amount: s.amount,
                date: s.next_billing,
                isHighImpact: s.amount > 1000
              }))}
            />
          </div>

          {/* Health Score (Middle Left) */}
          <div className="md:col-span-4 h-full">
            <FinancialHealthScore
              score={Math.min(100, Math.max(20, (
                (budgets.length > 0 ? (1 - (summary.totalSpent / (budgets.reduce((s, b) => s + b.monthly_limit, 0) || 1))) * 40 : 20) +
                (goals.length > 0 ? (goals.reduce((s, g) => s + (g.current_amount / g.target_amount), 0) / goals.length) * 40 : 20) +
                20
              )))}
              details={{
                savingsRatio: goals.length > 0 ? 85 : 40,
                budgetAdherence: budgets.length > 0 ? Math.min(100, (1 - (summary.totalSpent / (budgets.reduce((s, b) => s + b.monthly_limit, 0) || 1))) * 100) : 50,
                goalProgress: goals.length > 0 ? (goals.reduce((s, g) => s + (g.current_amount / g.target_amount), 0) / goals.length) * 100 : 30
              }}
            />
          </div>

          {/* Spending Trend Chart (Middle Center) */}
          <div className="md:col-span-4 h-full">
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 h-full">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-[var(--accent)]" />
                Daily Spending Trend
              </h3>
              <SpendingChart data={summary.dailySpend} height={180} />
            </div>
          </div>

          {/* Money Flow Map (Full Width Large Tile) */}
          <div className="md:col-span-12 lg:col-span-8">
            <MoneyFlowMap
              salary={monthlyIncome}
              subscriptions={subscriptions.reduce((s, sub) => s + sub.amount, 0)}
              budgets={budgets.reduce((s, b) => s + b.monthly_limit, 0)}
              savings={goals.reduce((s, g) => s + (g.current_amount || 0), 0) / 12}
            />
          </div>

          {/* Category Breakdown (Bottom Right Small) */}
          <div className="md:col-span-12 lg:col-span-4">
            <CategoryBreakdown breakdown={summary.categoryBreakdown} total={summary.totalSpent} />
          </div>

          {/* Recent Transactions (Full Width Bottom) */}
          <div className="md:col-span-12">
            <RecentTransactions
              expenses={expenses}
              onDelete={handleDelete}
              onEdit={exp => { setEditTarget(exp); setFormOpen(true); }}
            />
          </div>
        </div>
      )}

      {/* Form Modal */}
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



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
import { BudgetCard } from '@/components/dashboard/BudgetCard';
import { GoalCard } from '@/components/dashboard/GoalCard';
import { ChevronRight, ArrowRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FinancialHealthScore } from '@/components/dashboard/FinancialHealthScore';
import { PredictiveBillCalendar } from '@/components/dashboard/PredictiveBillCalendar';
import type { Expense, ExpenseInsert, Budget, Goal } from '@/types';

export const DashboardPage = () => {
  const { formatAmount } = useCurrency();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
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

    const [expensesRes, budgetsRes, goalsRes, subsRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', user.id),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active')
    ]);

    if (expensesRes.data) setExpenses(expensesRes.data as Expense[]);
    if (budgetsRes.data) setBudgets(budgetsRes.data as Budget[]);
    if (goalsRes.data) setGoals(goalsRes.data as Goal[]);
    if (subsRes.data) setSubscriptions(subsRes.data);
    
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const summary = buildMonthSummary(expenses, currentYear, currentMonth);
  const prevMonthSummary = buildMonthSummary(expenses, currentYear, currentMonth - 1);

  const calcChange = (curr: number, prev: number) =>
    prev === 0 ? undefined : ((curr - prev) / prev) * 100;

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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{monthName} {currentYear} overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }} id="add-expense-btn" size="sm" className="hidden sm:flex">
            <Plus size={15} /> Add Expense
          </Button>
          <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }} size="icon" className="sm:hidden">
            <Plus size={18} />
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Top Row: Core Insights (FGO & Calendar) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* FGO Health Score - Compact & Informative */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <FinancialHealthScore 
                score={Math.min(100, Math.max(20, (
                  (budgets.length > 0 ? (1 - (summary.totalSpent / (budgets.reduce((s,b) => s + b.monthly_limit, 0) || 1))) * 40 : 20) +
                  (goals.length > 0 ? (goals.reduce((s,g) => s + (g.current_amount / g.target_amount), 0) / goals.length) * 40 : 20) +
                  20
                )))}
                details={{
                  savingsRatio: goals.length > 0 ? 85 : 40,
                  budgetAdherence: budgets.length > 0 ? Math.min(100, (1 - (summary.totalSpent / (budgets.reduce((s,b) => s + b.monthly_limit, 0) || 1))) * 100) : 50,
                  goalProgress: goals.length > 0 ? (goals.reduce((s,g) => s + (g.current_amount / g.target_amount), 0) / goals.length) * 100 : 30
                }}
              />
              {/* Primary Stat as a sub-card */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  title="Transactions"
                  value={summary.transactionCount}
                  icon={<ShoppingCart size={14} />}
                  color="var(--success)"
                  isCurrency={false}
                  index={0}
                />
                <StatCard
                  title="Avg/Day"
                  value={summary.avgPerDay}
                  icon={<TrendingUp size={14} />}
                  color="var(--warning)"
                  index={1}
                />
              </div>
            </div>

            {/* Bill Calendar - More Prominent */}
            <div className="lg:col-span-7">
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
          </div>

          {/* Quick Summary Bar - Optimized for Mobile */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-wrap items-center gap-y-4 gap-x-6 p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]"
          >
            <div className="flex items-center gap-2 w-full sm:w-auto pb-2 sm:pb-0 border-b sm:border-b-0 border-[var(--border)] sm:mr-2">
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">{monthName} Overview</span>
            </div>
            
            <div className="flex flex-1 items-center justify-between sm:justify-start sm:gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-tighter">Total Outflow</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">{formatAmount(summary.totalSpent)}</span>
              </div>
              <div className="hidden sm:block h-8 w-px bg-[var(--border)]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-tighter">Top Category</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">{summary.topCategory}</span>
              </div>
              <div className="hidden sm:block h-8 w-px bg-[var(--border)]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-tighter">Budget Left</span>
                <span className="text-sm font-bold text-[var(--success)]">{formatAmount(Math.max(0, budgets.reduce((s,b) => s + b.monthly_limit, 0) - summary.totalSpent))}</span>
              </div>
            </div>
          </motion.div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SpendingChart data={summary.dailySpend} />
            </div>
            <CategoryBreakdown breakdown={summary.categoryBreakdown} total={summary.totalSpent} />
          </div>

          {/* Budgets & Goals Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[var(--text-primary)]">Budget Trackers</h3>
                <Link to="/budgets" className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1">
                  View All Budgets <ArrowRight size={12} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map((b, i) => (
                  <BudgetCard
                    key={b.id}
                    category={b.category}
                    limit={b.monthly_limit}
                    spent={summary.categoryBreakdown[b.category] || 0}
                    index={i}
                  />
                ))}
                {budgets.length === 0 && (
                  <div className="md:col-span-2 bg-[var(--bg-surface)] border border-dashed border-[var(--border)] rounded-2xl p-8 text-center">
                    <p className="text-xs text-[var(--text-muted)]">No budgets set yet. Start planning your spending!</p>
                    <Link to="/budgets">
                      <Button variant="link" size="sm" className="mt-2 text-[var(--accent)]">Set Budget</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[var(--text-primary)]">Top Goal</h3>
                <Link to="/budgets" className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  More
                </Link>
              </div>
              {goals[0] ? (
                <GoalCard
                  name={goals[0].name}
                  target={goals[0].target_amount}
                  current={goals[0].current_amount}
                  deadline={goals[0].deadline}
                  monthlySavings={5000} // Simplified for preview
                />
              ) : (
                <div className="bg-[var(--bg-surface)] border border-dashed border-[var(--border)] rounded-2xl p-8 h-[220px] flex flex-col items-center justify-center text-center">
                  <p className="text-xs text-[var(--text-muted)]">No active goals.</p>
                  <Link to="/budgets">
                    <Button variant="link" size="sm" className="mt-2 text-[var(--accent)]">Add Goal</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Transactions */}
          <RecentTransactions
            expenses={expenses}
            onDelete={handleDelete}
            onEdit={exp => { setEditTarget(exp); setFormOpen(true); }}
          />
        </>
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

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, ShoppingCart, TrendingUp, Calendar, Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { buildMonthSummary, formatCurrency } from '@/lib/utils';
import { StatCard } from '@/components/dashboard/StatCard';
import { SpendingChart } from '@/components/dashboard/SpendingChart';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { BudgetCard } from '@/components/dashboard/BudgetCard';
import { GoalCard } from '@/components/dashboard/GoalCard';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Expense, ExpenseInsert, Budget, Goal } from '@/types';

export const DashboardPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
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

    const [expensesRes, budgetsRes, goalsRes] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', user.id).limit(2),
      supabase.from('goals').select('*').eq('user_id', user.id).limit(1)
    ]);

    if (expensesRes.data) setExpenses(expensesRes.data as Expense[]);
    if (budgetsRes.data) setBudgets(budgetsRes.data as Budget[]);
    if (goalsRes.data) setGoals(goalsRes.data as Goal[]);
    
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
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Spent"
              value={summary.totalSpent}
              icon={<DollarSign size={16} />}
              color="var(--accent)"
              change={calcChange(summary.totalSpent, prevMonthSummary.totalSpent)}
              index={0}
            />
            <StatCard
              title="Transactions"
              value={summary.transactionCount}
              icon={<ShoppingCart size={16} />}
              color="var(--success)"
              change={calcChange(summary.transactionCount, prevMonthSummary.transactionCount)}
              isCurrency={false}
              index={1}
            />
            <StatCard
              title="Avg per Day"
              value={summary.avgPerDay}
              icon={<TrendingUp size={16} />}
              color="var(--warning)"
              changeLabel="This month"
              index={2}
            />
            <StatCard
              title="This Month"
              value={summary.totalSpent}
              icon={<Calendar size={16} />}
              color="var(--info)"
              changeLabel={`Top: ${summary.topCategory}`}
              index={3}
            />
          </div>

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

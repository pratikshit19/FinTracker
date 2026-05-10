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
import type { Expense, ExpenseInsert } from '@/types';

export const DashboardPage = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (!error && data) setExpenses(data as Expense[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const summary = buildMonthSummary(expenses, currentYear, currentMonth);
  const prevMonthSummary = buildMonthSummary(expenses, currentYear, currentMonth - 1);

  const calcChange = (curr: number, prev: number) =>
    prev === 0 ? undefined : ((curr - prev) / prev) * 100;

  const handleAdd = async (data: ExpenseInsert) => {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('expenses').insert({ ...data, user_id: user.id });
    await fetchExpenses();
    setFormOpen(false);
    setSubmitting(false);
  };

  const handleEdit = async (data: ExpenseInsert) => {
    if (!editTarget) return;
    setSubmitting(true);
    await supabase.from('expenses').update(data).eq('id', editTarget.id);
    await fetchExpenses();
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

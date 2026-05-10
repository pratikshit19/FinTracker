import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, ArrowDownUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { ALL_CATEGORIES, formatCurrency, cn } from '@/lib/utils';
import type { Expense, ExpenseCategory, ExpenseInsert } from '@/types';

type SortField = 'date' | 'amount' | 'title';
type SortDir   = 'asc' | 'desc';

export const TransactionsPage = () => {
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState<string>('all');
  const [sortField, setSortField]   = useState<SortField>('date');
  const [sortDir, setSortDir]       = useState<SortDir>('desc');
  const [formOpen, setFormOpen]     = useState(false);
  const [editTarget, setEditTarget] = useState<Expense | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('expenses').select('*').order('date', { ascending: false });
    if (data) setExpenses(data as Expense[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const filtered = expenses
    .filter(e => {
      const q = search.toLowerCase();
      const matchSearch = !q || e.title.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
      const matchCat = category === 'all' || e.category === category;
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date')   cmp = a.date.localeCompare(b.date);
      if (sortField === 'amount') cmp = a.amount - b.amount;
      if (sortField === 'title')  cmp = a.title.localeCompare(b.title);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

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

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {filtered.length} records · Total: {formatCurrency(totalFiltered)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }} id="add-transaction-btn" size="sm" className="hidden sm:flex">
            <Plus size={15} /> Add Transaction
          </Button>
          <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }} size="icon" className="sm:hidden">
            <Plus size={18} />
          </Button>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative group">
          <Input
            placeholder="Search transactions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search size={14} className="group-focus-within:text-[var(--accent)] transition-colors" />}
            className="w-full h-11 bg-[var(--bg-elevated)]/50 border-[var(--border)] focus:bg-[var(--bg-elevated)] transition-all"
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category Dropdown */}
          <div className="flex-1">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category-filter" className="w-full h-10 bg-[var(--bg-elevated)]/50 border-[var(--border)] px-4">
                <div className="flex items-center gap-2">
                  <Filter size={13} className="text-[var(--text-muted)]" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
                <SelectItem value="all">All Categories</SelectItem>
                {ALL_CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Buttons Row */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-elevated)]/30 rounded-xl border border-[var(--border)] overflow-x-auto no-scrollbar">
            {(['date', 'amount', 'title'] as SortField[]).map(f => (
              <button
                key={f}
                onClick={() => toggleSort(f)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                  sortField === f 
                    ? "bg-[var(--accent)] text-white shadow-sm" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                )}
              >
                <ArrowDownUp size={12} className={cn("transition-transform", sortField === f && sortDir === 'asc' ? "rotate-180" : "")} />
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
      ) : (
        <RecentTransactions
          expenses={filtered}
          onDelete={handleDelete}
          onEdit={exp => { setEditTarget(exp); setFormOpen(true); }}
          limit={filtered.length}
          title="All Transactions"
        />
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

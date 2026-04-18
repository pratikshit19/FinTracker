import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/Select';
import { ALL_CATEGORIES } from '@/lib/utils';
import type { Expense, ExpenseCategory, ExpenseInsert } from '@/types';

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ExpenseInsert) => Promise<void>;
  defaultValues?: Expense;
  loading?: boolean;
}

const today = new Date().toISOString().split('T')[0];

export const TransactionForm = ({
  open, onOpenChange, onSubmit, defaultValues, loading
}: TransactionFormProps) => {
  const [form, setForm] = useState<ExpenseInsert>({
    title:    defaultValues?.title    ?? '',
    amount:   defaultValues?.amount   ?? 0,
    category: defaultValues?.category ?? 'Other',
    date:     defaultValues?.date     ?? today,
    notes:    defaultValues?.notes    ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseInsert, string>>>({});

  const isEditing = !!defaultValues;

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.amount || form.amount <= 0) e.amount = 'Amount must be greater than 0';
    if (!form.date) e.date = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
    setForm({ title: '', amount: 0, category: 'Other', date: today, notes: '' });
    setErrors({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details below.' : 'Record a new expense to your tracker.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Title"
            placeholder="e.g. Grocery run"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            error={errors.title}
            leftIcon={<FileText size={14} />}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Amount ($)"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount || ''}
              onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              error={errors.amount}
              leftIcon={<DollarSign size={14} />}
            />
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              error={errors.date}
              leftIcon={<Calendar size={14} />}
            />
          </div>

          {/* Category Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide flex items-center gap-1.5">
              <Tag size={12} /> Category
            </label>
            <Select
              value={form.category}
              onValueChange={val => setForm(f => ({ ...f, category: val as ExpenseCategory }))}
            >
              <SelectTrigger id="category-select">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Textarea
            label="Notes (optional)"
            placeholder="Any additional details..."
            rows={2}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              <Plus size={15} />
              {isEditing ? 'Save Changes' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

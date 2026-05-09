import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard, Calendar, Tag, Repeat } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/Select';
import { useCurrency } from '@/lib/CurrencyContext';

export type BillingCycle = 'weekly' | 'monthly' | 'yearly';

export interface SubscriptionInsert {
  name: string;
  amount: number;
  billing_cycle: BillingCycle;
  category: string;
  next_billing: string;
  status: 'active' | 'cancelled' | 'paused';
}

interface SubscriptionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SubscriptionInsert) => Promise<void>;
  defaultValues?: any;
  loading?: boolean;
}

const today = new Date().toISOString().split('T')[0];

const SUB_CATEGORIES = [
  'Entertainment', 'Gym', 'Cloud Storage', 'Software/SaaS', 'Education', 'Utility', 'Other'
];

export const SubscriptionForm = ({
  open, onOpenChange, onSubmit, defaultValues, loading
}: SubscriptionFormProps) => {
  const { currency } = useCurrency();
  const [form, setForm] = useState<SubscriptionInsert>({
    name:          '',
    amount:        0,
    billing_cycle: 'monthly',
    category:      'Entertainment',
    next_billing:  today,
    status:        'active',
  });

  useEffect(() => {
    if (defaultValues) {
      setForm({
        name:          defaultValues.name          ?? '',
        amount:        defaultValues.amount        ?? 0,
        billing_cycle: defaultValues.billing_cycle ?? 'monthly',
        category:      defaultValues.category      ?? 'Entertainment',
        next_billing:  defaultValues.next_billing  ?? today,
        status:        defaultValues.status        ?? 'active',
      });
    } else {
      setForm({
        name:          '',
        amount:        0,
        billing_cycle: 'monthly',
        category:      'Entertainment',
        next_billing:  today,
        status:        'active',
      });
    }
  }, [defaultValues, open]);

  const [errors, setErrors] = useState<Partial<Record<keyof SubscriptionInsert, string>>>({});

  const isEditing = !!defaultValues;

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.amount || form.amount <= 0) e.amount = 'Amount must be greater than 0';
    if (!form.next_billing) e.next_billing = 'Billing date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update your recurring payment details.' : 'Track a new subscription or membership.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Service Name"
            placeholder="e.g. Netflix, Spotify, Gold's Gym"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            error={errors.name}
            leftIcon={<CreditCard size={14} />}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Amount (${currency})`}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.amount || ''}
              onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
              error={errors.amount}
              leftIcon={<span className="text-[10px] font-bold">{currency}</span>}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide flex items-center gap-1.5">
                <Repeat size={12} /> Cycle
              </label>
              <Select
                value={form.billing_cycle}
                onValueChange={val => setForm(f => ({ ...f, billing_cycle: val as BillingCycle }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide flex items-center gap-1.5">
                <Tag size={12} /> Category
              </label>
              <Select
                value={form.category}
                onValueChange={val => setForm(f => ({ ...f, category: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUB_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              label="Next Billing"
              type="date"
              value={form.next_billing}
              onChange={e => setForm(f => ({ ...f, next_billing: e.target.value }))}
              error={errors.next_billing}
              leftIcon={<Calendar size={14} />}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              <Plus size={15} />
              {isEditing ? 'Save' : 'Add Subscription'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

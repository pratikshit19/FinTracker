import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard, Calendar, Repeat, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/lib/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { SubscriptionForm, type SubscriptionInsert } from '@/components/subscriptions/SubscriptionForm';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  billing_cycle: 'monthly' | 'yearly' | 'weekly';
  category: string;
  next_billing: string;
  status: 'active' | 'cancelled' | 'paused';
}

export const SubscriptionsPage = () => {
  const { formatAmount } = useCurrency();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subscription | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [viewFilter, setViewFilter] = useState<'monthly' | 'yearly'>('monthly');

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('next_billing', { ascending: true });
    if (!error && data) setSubscriptions(data as Subscription[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  const handleAdd = async (data: SubscriptionInsert) => {
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('subscriptions').insert({ ...data, user_id: user.id });
    if (!error) await fetchSubscriptions();
    setFormOpen(false);
    setSubmitting(false);
  };

  const handleEdit = async (data: SubscriptionInsert) => {
    if (!editTarget) return;
    setSubmitting(true);
    const { error } = await supabase.from('subscriptions').update(data).eq('id', editTarget.id);
    if (!error) await fetchSubscriptions();
    setEditTarget(undefined);
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('subscriptions').delete().eq('id', id);
    if (!error) setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  const totalMonthly = subscriptions
    .filter(s => s.status === 'active')
    .reduce((acc, s) => {
      if (s.billing_cycle === 'monthly') return acc + s.amount;
      if (s.billing_cycle === 'yearly') return acc + (s.amount / 12);
      if (s.billing_cycle === 'weekly') return acc + (s.amount * 4.33);
      return acc;
    }, 0);

  const filteredSubs = subscriptions.filter(s => {
    if (viewFilter === 'monthly') return s.billing_cycle === 'monthly' || s.billing_cycle === 'weekly';
    return s.billing_cycle === 'yearly';
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recurring Payments</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your SIPs, family support, and subscriptions</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle Switch in Header */}
          <div className="flex p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)]">
            {(['monthly', 'yearly'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setViewFilter(view)}
                className={`relative px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  viewFilter === view 
                    ? 'text-white' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {viewFilter === view && (
                  <motion.div
                    layoutId="view-toggle"
                    className="absolute inset-0 bg-[var(--accent)] rounded-lg shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 capitalize">{view}</span>
              </button>
            ))}
          </div>
          <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }} id="add-sub-btn" size="sm" className="hidden sm:flex">
            <Plus size={15} /> Add Payment
          </Button>

          <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }} size="icon" className="sm:hidden">
            <Plus size={18} />
          </Button>
        </div>
      </motion.div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[var(--accent)] text-white border-none">
          <CardContent className="p-5 flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wider opacity-80">Total Monthly</p>
            <p className="text-3xl font-bold">{formatAmount(totalMonthly)}</p>
            <p className="text-xs opacity-70 mt-1">Across {subscriptions.length} active services</p>
          </CardContent>
        </Card>
        
        <Card className="border-dashed border-[var(--border)]">
          <CardContent className="p-5 flex items-center justify-between h-full">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-[var(--info-subtle)] flex items-center justify-center text-[var(--info)]">
                <Repeat size={20} />
              </div>
              <div>
                <p className="text-sm font-medium">Auto-Detection</p>
                <p className="text-xs text-[var(--text-muted)]">Scan receipts to find subscriptions</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              Setup Scanner <ArrowRight size={14} />
            </Button>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSubs.length === 0 ? (
            <Card className="lg:col-span-2 border-dashed">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center mb-4">
                  <CreditCard size={32} className="text-[var(--text-muted)]" />
                </div>
                <h3 className="text-lg font-semibold">No {viewFilter} payments</h3>
                <p className="text-sm text-[var(--text-muted)] max-w-xs mt-1">
                  You don't have any {viewFilter} recurring payments tracked yet.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => { setEditTarget(undefined); setFormOpen(true); }}>
                  Add {viewFilter} Payment
                </Button>

              </CardContent>
            </Card>
          ) : (
            filteredSubs.map((sub, i) => (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="hover:border-[var(--accent)]/30 transition-all cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center text-xl">
                          {sub.category === 'Investment/SIP' ? '📈' : 
                           sub.category === 'Family Support' ? '🏠' : 
                           sub.category === 'Bill/Rent' ? '🧾' : 
                           sub.name.charAt(0)}
                        </div>

                        <div>
                          <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{sub.name}</h3>
                          <p className="text-xs text-[var(--text-muted)]">{sub.category} • {sub.billing_cycle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[var(--text-primary)]">{formatAmount(sub.amount)}</p>
                        <Badge variant={sub.status === 'active' ? 'success' : 'muted'} className="mt-1">
                          {sub.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <Calendar size={12} />
                        <span>Next bill: {formatDate(sub.next_billing)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-[var(--danger)] hover:bg-[var(--danger-subtle)]" onClick={(e) => { e.stopPropagation(); handleDelete(sub.id); }}>Delete</Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setEditTarget(sub); setFormOpen(true); }}>Edit</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Form Modal */}
      <SubscriptionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={editTarget ? handleEdit : handleAdd}
        defaultValues={editTarget}
        loading={submitting}
      />
    </div>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard, Calendar, Repeat, ArrowRight, ChevronLeft, ChevronRight, AlertTriangle, List } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/lib/CurrencyContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn, formatDate } from '@/lib/utils';
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

export const FixedExpensesPage = () => {
  const { formatAmount } = useCurrency();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subscription | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [viewFilter, setViewFilter] = useState<'monthly' | 'yearly'>('monthly');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const filteredSubs = activeSubscriptions.filter(s => {
    if (viewFilter === 'monthly') return s.billing_cycle === 'monthly' || s.billing_cycle === 'weekly';
    return s.billing_cycle === 'yearly';
  });

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const getSubscriptionsForDay = (day: number) => {
    return filteredSubs.filter(s => {
      const billDate = new Date(s.next_billing);
      return billDate.getDate() === day;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fixed Expenses</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your SIPs, family support, and recurring fixed costs</p>
        </div>

        <div className="flex justify-end w-full xl:w-auto">
          <Button onClick={() => { setEditTarget(undefined); setFormOpen(true); }} id="add-sub-btn" size="sm" className="h-8 gap-2 w-full sm:w-auto">
            <Plus size={15} /> Add Payment
          </Button>
        </div>
      </motion.div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-[var(--accent)] text-white border-none">
          <CardContent className="p-5 flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wider opacity-80">Total Monthly</p>
            <p className="text-3xl font-bold">{formatAmount(totalMonthly)}</p>
            <p className="text-xs opacity-70 mt-1">Across {activeSubscriptions.length} active services</p>
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

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex flex-shrink-0 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-1">
          {(['list', 'calendar'] as const).map((mode) => {
            const Icon = mode === 'list' ? List : Calendar;
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                aria-label={mode === 'list' ? 'List view' : 'Calendar view'}
                className={`relative flex h-8 w-9 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
                  viewMode === mode
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                }`}
              >
                {viewMode === mode && (
                  <motion.div
                    layoutId="view-toggle"
                    className="absolute inset-0 rounded-md"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                  />
                )}
                <Icon size={14} className="relative z-10" />
              </button>
            );
          })}
        </div>

        <div className="inline-flex flex-shrink-0 flex-wrap items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-1">
          {(['monthly', 'yearly'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setViewFilter(view)}
              className={`relative min-w-[76px] h-8 rounded-md px-3 text-[11px] font-semibold transition-all duration-200 ${
                viewFilter === view
                  ? 'text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {viewFilter === view && (
                <motion.div
                  layoutId="frequency-toggle"
                  className="absolute inset-0 bg-[var(--accent)] rounded-md shadow-sm"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }}
                />
              )}
              <span className="relative z-10 capitalize">{view}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-[var(--border)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-elevated)]/50">
              <div className="text-sm font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}><ChevronLeft size={16} /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}><ChevronRight size={16} /></Button>
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--bg-elevated)]/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-3 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {blanks.map(b => (
                <div key={`blank-${b}`} className="aspect-square border-b border-r border-[var(--border)] bg-[var(--bg-base)]/20" />
              ))}
              {days.map(day => {
                const daySubs = getSubscriptionsForDay(day);
                const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();

                return (
                  <div key={day} className={cn(
                    "aspect-square border-b border-r border-[var(--border)] p-1 sm:p-2 relative group hover:bg-[var(--bg-elevated)] transition-colors",
                    isToday && "bg-[var(--accent-subtle)]"
                  )}>
                    <span className={cn(
                      "text-[10px] font-bold",
                      isToday ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
                    )}>{day}</span>
                    <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                      {daySubs.map(s => (
                        <div key={s.id} className="h-1.5 sm:h-2 w-full rounded-full bg-[var(--accent)] opacity-80" title={s.name} />
                      ))}
                    </div>
                    {daySubs.length > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-elevated)]/90 p-2 z-10 pointer-events-none">
                        <div className="text-[8px] font-bold text-center">
                          {daySubs.length} bill{daySubs.length > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Calendar size={16} className="text-[var(--accent)]" />
              Month Summary
            </h3>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">Total Bills</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    {formatAmount(filteredSubs.reduce((acc, s) => acc + s.amount, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-muted)]">Active Services</span>
                  <span className="text-sm font-bold text-[var(--text-primary)]">{filteredSubs.length}</span>
                </div>
              </CardContent>
            </Card>

            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 mt-6">
              <AlertTriangle size={16} className="text-[var(--danger)]" />
              Upcoming Danger Zones
            </h3>
            <div className="space-y-3">
              {filteredSubs
                .sort((a, b) => new Date(a.next_billing).getDate() - new Date(b.next_billing).getDate())
                .slice(0, 4)
                .map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center text-xs font-bold border border-[var(--border)]">
                        {new Date(sub.next_billing).getDate()}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{sub.name}</p>
                        <p className="text-[9px] text-[var(--text-muted)] uppercase tracking-tighter">{sub.billing_cycle}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-[var(--accent)]">{formatAmount(sub.amount)}</p>
                  </div>
                ))}
              {filteredSubs.length === 0 && (
                <div className="p-8 text-center border border-dashed border-[var(--border)] rounded-2xl">
                  <CreditCard size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
                  <p className="text-xs text-[var(--text-muted)]">No recurring bills found.</p>
                </div>
              )}
            </div>
          </div>
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

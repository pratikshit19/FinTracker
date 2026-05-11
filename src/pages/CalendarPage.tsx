import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertTriangle, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/lib/CurrencyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  next_billing: string;
  billing_cycle: string;
}

export const CalendarPage = () => {
  const { formatAmount } = useCurrency();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (data) setSubscriptions(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const getSubscriptionsForDay = (day: number) => {
    return subscriptions.filter(s => {
      const billDate = new Date(s.next_billing);
      // For simplicity, we match by the day of the month
      return billDate.getDate() === day;
    });
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bill Calendar</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Track and predict your recurring expenses</p>
        </div>
        <div className="flex items-center gap-2 bg-[var(--bg-elevated)] rounded-xl p-1 border border-[var(--border)]">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}><ChevronLeft size={16} /></Button>
          <span className="text-xs font-bold px-2 min-w-[100px] text-center">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}><ChevronRight size={16} /></Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-2 border-[var(--border)] overflow-hidden">
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

        {/* Sidebar: Upcoming Bills Detail */}
        <div className="space-y-4">
          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CalendarIcon size={16} className="text-[var(--accent)]" />
            Month Summary
          </h3>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Total Bills</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  {formatAmount(subscriptions.reduce((acc, s) => acc + s.amount, 0))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)]">Active Services</span>
                <span className="text-sm font-bold text-[var(--text-primary)]">{subscriptions.length}</span>
              </div>
            </CardContent>
          </Card>

          <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2 mt-6">
            <AlertTriangle size={16} className="text-[var(--danger)]" />
            Upcoming Danger Zones
          </h3>
          <div className="space-y-3">
            {subscriptions
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
            {subscriptions.length === 0 && (
              <div className="p-8 text-center border border-dashed border-[var(--border)] rounded-2xl">
                <CreditCard size={24} className="mx-auto text-[var(--text-muted)] mb-2" />
                <p className="text-xs text-[var(--text-muted)]">No recurring bills found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

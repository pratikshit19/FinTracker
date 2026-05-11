import { motion } from 'framer-motion';
import { Calendar, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn, formatDate } from '@/lib/utils';

interface Bill {
  id: string;
  name: string;
  amount: number;
  date: string;
  isHighImpact?: boolean;
}

interface PredictiveBillCalendarProps {
  bills: Bill[];
}

export const PredictiveBillCalendar = ({ bills }: PredictiveBillCalendarProps) => {
  const { formatAmount } = useCurrency();
  
  // Sort bills by date (day of month)
  const sortedBills = [...bills].sort((a, b) => {
    const dayA = new Date(a.date).getDate();
    const dayB = new Date(b.date).getDate();
    return dayA - dayB;
  });

  // Group bills by urgency
  const today = new Date();
  const next7Days = new Date();
  next7Days.setDate(today.getDate() + 7);

  return (
    <Card className="h-full border-[var(--border)] bg-[var(--bg-surface)]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--accent)]" />
            <CardTitle className="text-sm font-bold">Predictive Bill Calendar</CardTitle>
          </div>
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Danger Zones</span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {sortedBills.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-[var(--text-muted)] italic">No upcoming bills detected.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedBills.map((bill, i) => {
                const billDate = new Date(bill.date);
                const isUpcoming = billDate <= next7Days && billDate >= today;
                
                return (
                  <motion.div
                    key={bill.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all",
                      isUpcoming 
                        ? "bg-[var(--danger-subtle)]/40 border-[var(--danger)]/20" 
                        : "bg-[var(--bg-elevated)]/50 border-[var(--border)]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex flex-col items-center justify-center w-10 h-10 rounded-lg shrink-0",
                        isUpcoming ? "bg-[var(--danger)] text-white" : "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                      )}>
                        <span className="text-[8px] font-bold uppercase leading-none">{billDate.toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-sm font-bold leading-none">{billDate.getDate()}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{bill.name}</p>
                        {isUpcoming && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <AlertTriangle size={10} className="text-[var(--danger)]" />
                            <span className="text-[9px] font-bold text-[var(--danger)] uppercase tracking-tight">Danger Zone</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[var(--text-primary)]">{formatAmount(bill.amount)}</p>
                      <p className="text-[9px] text-[var(--text-muted)]">Automatic</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-[var(--border)]/50">
            <Link to="/calendar" className="w-full group flex items-center justify-between text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <span>VIEW FULL CALENDAR</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

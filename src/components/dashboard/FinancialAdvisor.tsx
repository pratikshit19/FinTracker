import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, CheckCircle2, Lightbulb, 
  TrendingDown, ArrowUpRight, Sparkles,
  ArrowRight, ShieldCheck, Wallet
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn } from '@/lib/utils';
import type { Budget, Goal } from '@/types';

interface FinancialAdvisorProps {
  income: number;
  fixedExpenses: number;
  totalSpent: number;
  budgets: Budget[];
  goals: Goal[];
  upcomingBills: any[];
  categorySpent: Record<string, number>;
  onPayBill?: (bill: any) => void;
}

export const FinancialAdvisor = ({
  income,
  fixedExpenses,
  totalSpent,
  budgets,
  goals,
  upcomingBills,
  categorySpent,
  onPayBill
}: FinancialAdvisorProps) => {
  const { formatAmount } = useCurrency();
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate() + 1;
  
  const initialBuffer = income - fixedExpenses;
  const remainingBuffer = initialBuffer - totalSpent;
  const totalPlannedSavings = goals.reduce((s, g) => s + (g.monthly_contribution || 0), 0);
  
  const overdueBills = upcomingBills.filter(b => new Date(b.next_billing || b.date) < now);
  const dueTodayBills = upcomingBills.filter(b => {
    const d = new Date(b.next_billing || b.date);
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  });

  const isFixedDone = upcomingBills.length === 0;
  const dailySafeSpend = Math.max(0, (remainingBuffer - totalPlannedSavings) / daysLeft);
  
  // Build Insights
  const insights = [];
  
  // 1. URGENT: Overdue or Due Today Bills
  if (overdueBills.length > 0 || dueTodayBills.length > 0) {
    const urgentBills = [...overdueBills, ...dueTodayBills];
    insights.push({
      type: 'critical',
      icon: <AlertCircle className="text-white" size={20} />,
      title: 'ACTION REQUIRED',
      message: `You have ${urgentBills.length} urgent bill(s) due now. Pay these immediately to stay on top of your fixed expenses.`,
      action: 'Pay Priority Bills',
      variant: 'danger',
      bills: urgentBills
    });
  }

  // 2. Savings Health & Buffer Management
  if (isFixedDone) {
    if (remainingBuffer > totalPlannedSavings) {
      insights.push({
        type: 'success',
        icon: <ShieldCheck className="text-[var(--success)]" size={20} />,
        title: 'Fixed Expenses Cleared',
        message: `All priority bills are done. You have ${formatAmount(remainingBuffer)} remaining for the month.`,
        action: `Daily Safe Spend: ${formatAmount(dailySafeSpend)}`,
        variant: 'success'
      });
    } else if (remainingBuffer > 0) {
      insights.push({
        type: 'warning',
        icon: <TrendingDown className="text-[var(--warning)]" size={20} />,
        title: 'Buffer Tight',
        message: `Your remaining buffer (${formatAmount(remainingBuffer)}) is less than your savings goal (${formatAmount(totalPlannedSavings)}).`,
        action: 'Cut discretionary spending now.',
        variant: 'warning'
      });
    } else {
      insights.push({
        type: 'critical',
        icon: <AlertCircle className="text-white" size={20} />,
        title: 'NEGATIVE BUFFER',
        message: 'You have exhausted your monthly buffer. Any further spending will come from your savings or future income.',
        action: 'STOP UNNECESSARY SPENDING',
        variant: 'danger'
      });
    }
  } else if (insights.length === 0) {
    // Upcoming bills but not due today
    insights.push({
      type: 'info',
      icon: <Wallet className="text-[var(--accent)]" size={20} />,
      title: 'Upcoming Commitments',
      message: `You have ${upcomingBills.length} upcoming bills. Total: ${formatAmount(upcomingBills.reduce((s, b) => s + b.amount, 0))}.`,
      action: 'Keep this money aside.',
      variant: 'default'
    });
  }

  // 3. Smart Allocation / Budget Cut
  if (isFixedDone && remainingBuffer < totalPlannedSavings * 1.2) {
    const spendyCategories = budgets
      .map(b => ({
        category: b.category,
        limit: b.monthly_limit,
        spent: categorySpent[b.category] || 0,
        remaining: b.monthly_limit - (categorySpent[b.category] || 0)
      }))
      .filter(b => b.remaining > 0 && (
        b.category.toLowerCase().includes('shop') || 
        b.category.toLowerCase().includes('entert') || 
        b.category.toLowerCase().includes('food') ||
        b.category.toLowerCase().includes('dine')
      ))
      .sort((a, b) => b.remaining - a.remaining);
      
    if (spendyCategories.length > 0) {
      const target = spendyCategories[0];
      insights.push({
        type: 'advice',
        icon: <Lightbulb className="text-[var(--warning)]" size={20} />,
        title: 'Smart Allocation',
        message: `To avoid a negative buffer, we suggest cutting ${formatAmount(target.remaining * 0.5)} from "${target.category}".`,
        action: 'Update Budget Limits',
        variant: 'default'
      });
    }
  }

  if (income === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold flex items-center gap-2 text-[var(--text-primary)]">
          <Sparkles size={16} className="text-[var(--accent)]" />
          Proactive Financial Guidance
        </h3>
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
          Action Oriented
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {insights.map((insight, i) => (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -2 }}
              className="h-full"
            >
              <Card className={cn(
                "h-full border-[var(--border)] transition-all overflow-hidden relative",
                insight.variant === 'danger' ? "bg-[var(--danger)] text-white border-none shadow-lg shadow-[var(--danger)]/20" : 
                insight.variant === 'success' ? "bg-[var(--success-subtle)]/30 border-[var(--success)]/20" :
                "bg-[var(--bg-elevated)]/50"
              )}>
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={cn(
                      "p-2.5 rounded-2xl shadow-sm",
                      insight.variant === 'danger' ? "bg-white/20" : "bg-[var(--bg-surface)]"
                    )}>
                      {insight.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className={cn(
                        "text-xs font-bold uppercase tracking-wider",
                        insight.variant === 'danger' ? "text-white" : "text-[var(--text-primary)]"
                      )}>
                        {insight.title}
                      </h4>
                      <p className={cn(
                        "text-[11px] mt-1.5 leading-relaxed font-medium",
                        insight.variant === 'danger' ? "text-white/90" : "text-[var(--text-muted)]"
                      )}>
                        {insight.message}
                      </p>
                    </div>
                  </div>
                  
                  {insight.bills && onPayBill && (
                    <div className="mb-4 space-y-2">
                      {insight.bills.map((bill: any) => (
                        <div key={bill.id} className="flex items-center justify-between p-2 rounded-lg bg-white/10 border border-white/10">
                          <span className="text-[10px] font-bold">{bill.name}</span>
                          <button 
                            onClick={() => onPayBill(bill)}
                            className="px-3 py-1 rounded-md bg-white text-[var(--danger)] text-[9px] font-bold hover:bg-white/90 transition-colors"
                          >
                            PAY NOW
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className={cn(
                    "mt-auto pt-4 border-t flex items-center justify-between",
                    insight.variant === 'danger' ? "border-white/20" : "border-[var(--border)]/50"
                  )}>
                    <span className={cn(
                      "text-[10px] font-bold tracking-tight",
                      insight.variant === 'danger' ? "text-white" : "text-[var(--text-secondary)]"
                    )}>
                      {insight.action}
                    </span>
                    <ArrowRight size={14} className={insight.variant === 'danger' ? "text-white" : "text-[var(--text-muted)]"} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

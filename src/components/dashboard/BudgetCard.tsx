import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, TrendingUp, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/lib/CurrencyContext';

interface BudgetCardProps {
  category: string;
  spent: number;
  limit: number;
  index?: number;
  onEdit?: () => void;
}

export const BudgetCard = ({ category, spent, limit, index = 0, onEdit }: BudgetCardProps) => {
  const { formatAmount } = useCurrency();
  const percentage = Math.min((spent / limit) * 100, 100);
  const isOver = spent > limit;
  const isWarning = spent > limit * 0.8 && spent <= limit;

  const getStatusColor = () => {
    if (isOver) return 'var(--danger)';
    if (isWarning) return 'var(--warning)';
    return 'var(--accent)';
  };

  const getStatusBg = () => {
    if (isOver) return 'var(--danger-subtle)';
    if (isWarning) return 'var(--warning-subtle)';
    return 'var(--accent-subtle)';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-sm overflow-hidden relative group"
    >
      {/* Background Glow */}
      <div 
        className="absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-5 transition-opacity group-hover:opacity-10"
        style={{ backgroundColor: getStatusColor() }}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[var(--text-primary)]">{category}</span>
            <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Monthly Budget</span>
          </div>
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-all opacity-0 group-hover:opacity-100"
            >
              <Edit3 size={12} />
            </button>
          )}
        </div>
        <div className={cn(
          "px-2.5 py-1 rounded-full flex items-center gap-1.5",
          isOver ? "bg-[var(--danger-subtle)] text-[var(--danger)]" : 
          isWarning ? "bg-[var(--warning-subtle)] text-[var(--warning)]" : 
          "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
        )}>
          {isOver ? <AlertCircle size={12} /> : isWarning ? <TrendingUp size={12} /> : <CheckCircle2 size={12} />}
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {isOver ? 'Over Limit' : isWarning ? 'Warning' : 'On Track'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-[var(--text-primary)]">
              {formatAmount(spent)}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Spent so far</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-[var(--text-secondary)]">
              {formatAmount(limit)}
            </span>
            <p className="text-[10px] text-[var(--text-muted)] font-medium">Budget limit</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-2 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border)]/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: getStatusColor() }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-[var(--text-muted)]">
              {percentage.toFixed(0)}% Utilized
            </span>
            {isOver && (
              <span className="text-[10px] font-bold text-[var(--danger)] animate-pulse">
                Exceeded by {formatAmount(spent - limit)}
              </span>
            )}
            {isWarning && !isOver && (
              <span className="text-[10px] font-bold text-[var(--warning)]">
                Approaching limit
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Proactive Tip (Simulated AI Tip for UI) */}
      {(isWarning || isOver) && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]/50">
          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed italic">
            "You've used {percentage.toFixed(0)}% of your {category} budget. Try to limit non-essential {category} purchases for the next few days to stay on track."
          </p>
        </div>
      )}
    </motion.div>
  );
};

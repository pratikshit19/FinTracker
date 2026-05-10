import { motion } from 'framer-motion';
import { Target, Calendar, TrendingUp, ChevronRight, Edit3 } from 'lucide-react';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  name: string;
  target: number;
  current: number;
  deadline?: string;
  monthlySavings: number;
  index?: number;
  onEdit?: () => void;
}

export const GoalCard = ({ name, target, current, deadline, monthlySavings, index = 0, onEdit }: GoalCardProps) => {
  const { formatAmount } = useCurrency();
  const percentage = Math.min((current / target) * 100, 100);
  
  // Smart ETA Calculation
  const remaining = target - current;
  const monthsToReach = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : Infinity;
  
  const getEtaText = () => {
    if (percentage >= 100) return 'Goal Reached! 🎉';
    if (monthsToReach === Infinity) return 'Set a savings plan to reach this goal';
    
    const completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + monthsToReach);
    const dateString = completionDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    
    if (monthsToReach === 1) return `Likely to reach in 1 month (${dateString})`;
    if (monthsToReach < 12) return `Likely to reach in ${monthsToReach} months (${dateString})`;
    const years = (monthsToReach / 12).toFixed(1);
    return `Likely to reach in ${years} years (${dateString})`;
  };

  const getIdealContribution = () => {
    if (!deadline || percentage >= 100) return null;
    
    const targetDate = new Date(deadline);
    const today = new Date();
    const monthsRemaining = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
    
    if (monthsRemaining <= 0) return target - current; // Must save all now
    return Math.ceil((target - current) / monthsRemaining);
  };

  const idealContribution = getIdealContribution();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-sm group hover:border-[var(--accent)]/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
            <Target size={20} />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">{name}</h3>
            <div className="flex items-center gap-1.5">
              <Calendar size={10} className="text-[var(--text-muted)]" />
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                {deadline ? `Target: ${new Date(deadline).toLocaleDateString()}` : 'No deadline'}
              </span>
            </div>
          </div>
        </div>
        {onEdit && (
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[var(--accent)] bg-[var(--accent-subtle)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm z-10"
          >
            <Edit3 size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Edit</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              {formatAmount(current)}
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Saved</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-[var(--text-secondary)]">
              {formatAmount(target)}
            </span>
            <p className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Target</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border)]/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.2, ease: "circOut" }}
              className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] rounded-full relative"
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] translate-x-[-100%] animate-[shimmer_2s_infinite]" />
            </motion.div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[var(--accent)]">
              {percentage.toFixed(1)}% Completed
            </span>
            <div className="flex items-center gap-1 text-[var(--success)]">
              <TrendingUp size={10} />
              <span className="text-[10px] font-bold">On track</span>
            </div>
          </div>
        </div>

        {/* AI Prediction Box */}
        <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] mt-0.5">
              <TrendingUp size={12} />
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed">
                <span className="text-[var(--text-primary)] font-bold">Projected Completion:</span> {getEtaText()}
              </p>
              <p className="text-[9px] text-[var(--text-muted)]">
                Based on your current plan of {formatAmount(monthlySavings)}/mo
              </p>
            </div>
          </div>

          {idealContribution !== null && (
            <div className="pt-2 border-t border-[var(--border)]/50">
              <div className="flex items-start gap-2">
                <div className={cn(
                  "p-1.5 rounded-lg mt-0.5",
                  monthlySavings >= idealContribution ? "bg-[var(--success-subtle)] text-[var(--success)]" : "bg-[var(--warning-subtle)] text-[var(--warning)]"
                )}>
                  <Calendar size={12} />
                </div>
                <div>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium leading-relaxed">
                    <span className="text-[var(--text-primary)] font-bold">Ideal Contribution:</span> {formatAmount(idealContribution)}/mo
                  </p>
                  <p className="text-[9px] text-[var(--text-muted)]">
                    {monthlySavings >= idealContribution 
                      ? "Great! You are contributing more than needed to meet your deadline." 
                      : `You need to save ${formatAmount(idealContribution - monthlySavings)} more each month to reach your goal by ${new Date(deadline!).toLocaleDateString()}.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

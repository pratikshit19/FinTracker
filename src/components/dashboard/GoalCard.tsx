import { motion } from 'framer-motion';
import { Target, Calendar, TrendingUp, ChevronRight, Edit3, Minus, Plus } from 'lucide-react';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
  monthlySavings: number;
  index?: number;
  onEdit?: () => void;
  onUpdateAllocation?: (id: string, newAmount: number) => void;
  onTransfer?: () => void;
  totalMonthlyTarget?: number;
}

export const GoalCard = ({ 
  id, name, target, current, deadline, monthlySavings, index = 0, onEdit, onUpdateAllocation, onTransfer, totalMonthlyTarget = 10000 
}: GoalCardProps) => {
  const { formatAmount } = useCurrency();
  const percentage = Math.min((current / target) * 100, 100);
  const monthlyPercentage = Math.round((monthlySavings / (totalMonthlyTarget || 1)) * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-[var(--bg-elevated)]/30 border border-[var(--border)] rounded-2xl p-5 group hover:border-[var(--accent)]/30 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
            <Target size={18} />
          </div>
          <h3 className="font-bold text-[var(--text-primary)]">{name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {onTransfer && (
            <button 
              onClick={onTransfer}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[var(--success)] bg-[var(--success-subtle)] border border-[var(--success)]/20 hover:border-[var(--success)] transition-all"
            >
              <Plus size={12} />
              <span className="text-[10px] font-bold uppercase">Add Funds</span>
            </button>
          )}
          {onEdit && (
            <button 
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[var(--accent)] bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)] transition-all"
            >
              <Edit3 size={12} />
              <span className="text-[10px] font-bold uppercase">Edit</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              className="h-full bg-[var(--success)]"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-[var(--text-primary)]">{formatAmount(current)}</span>
              <span className="text-[10px] text-[var(--text-muted)]">/ {formatAmount(target)}</span>
            </div>
            {deadline && (
              <span className="text-[10px] text-[var(--text-muted)]">
                Target: {new Date(deadline).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Projected Info (Optional) */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} className="text-[var(--accent)]" />
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Dynamic Growth</span>
          </div>
          <span className="text-[10px] font-bold text-[var(--text-primary)]">Manual Allocation Mode</span>
        </div>
      </div>
    </motion.div>
  );
};

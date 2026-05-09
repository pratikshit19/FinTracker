import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color?: string;
  index?: number;
  isCurrency?: boolean;
}

export const StatCard = ({
  title, value, change, changeLabel, icon, color = 'var(--accent)', index = 0, isCurrency = true
}: StatCardProps) => {
  const { formatAmount } = useCurrency();
  const isPositive = (change ?? 0) > 0;
  const isNeutral = change === undefined || change === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: 'easeOut' }}
    >
      <Card className="hover:border-[var(--border)] hover:bg-[var(--bg-hover)] transition-all duration-200 group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest">{title}</p>
            <span
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
              style={{ background: `${color}20`, color }}
            >
              {icon}
            </span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mb-1.5">
            {isCurrency ? formatAmount(value) : value.toLocaleString()}
          </p>
          {!isNeutral && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', isPositive ? 'text-[var(--danger)]' : 'text-[var(--success)]')}>
              {isPositive
                ? <TrendingUp size={12} />
                : change !== undefined && change < 0
                  ? <TrendingDown size={12} />
                  : <Minus size={12} />
              }
              <span>{Math.abs(change ?? 0).toFixed(1)}% {changeLabel ?? 'vs last month'}</span>
            </div>
          )}
          {isNeutral && changeLabel && (
            <p className="text-xs text-[var(--text-muted)]">{changeLabel}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

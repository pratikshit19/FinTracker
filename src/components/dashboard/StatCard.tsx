import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="h-fit"
    >
      <Card className="h-full border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)]/50 transition-all cursor-pointer overflow-hidden group relative">
        {/* Decorative background glow */}
        <div 
          className="absolute -right-4 -top-4 w-16 h-16 blur-2xl rounded-full opacity-0 group-hover:opacity-20 transition-opacity"
          style={{ background: color }}
        />
        
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm" style={{ color }}>
              {icon}
            </div>
            {!isNeutral && (
              <Badge variant={isPositive ? 'danger' : 'success'} className="px-1.5 py-0 text-[10px]">
                {isPositive ? '+' : '-'}{Math.abs(change ?? 0).toFixed(0)}%
              </Badge>
            )}
          </div>
          
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 truncate">
              {title}
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {isCurrency ? formatAmount(value) : value.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>

  );
};

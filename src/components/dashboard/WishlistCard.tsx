import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Clock, AlertCircle, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn } from '@/lib/utils';
import type { WishlistItem } from '@/types';

interface WishlistCardProps {
  item: WishlistItem;
  freeToSpend: number;
  onApprove: (item: WishlistItem) => void;
  onReject: (id: string) => void;
}

export const WishlistCard = ({ item, freeToSpend, onApprove, onReject }: WishlistCardProps) => {
  const { formatAmount } = useCurrency();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; mins: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const created = new Date(item.created_at).getTime();
      const now = new Date().getTime();
      const diff = created + (48 * 60 * 60 * 1000) - now;

      if (diff <= 0) {
        setTimeLeft(null);
      } else {
        const hours = Math.floor((diff / (1000 * 60 * 60)));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft({ hours, mins });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [item.created_at]);

  const isCoolingOff = timeLeft !== null;
  const isAffordable = freeToSpend >= item.amount;

  return (
    <Card className="hover:border-[var(--accent)]/30 transition-all group overflow-hidden bg-[var(--bg-surface)] border-[var(--border)] relative">
      {isCoolingOff && (
        <div className="absolute top-0 right-0 left-0 h-1 bg-[var(--warning)]/20 overflow-hidden">
          <motion.div 
            initial={{ width: '100%' }}
            animate={{ width: `${(timeLeft.hours / 48) * 100}%` }}
            className="h-full bg-[var(--warning)]" 
          />
        </div>
      )}
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--accent)] border border-white/5 shadow-inner">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">{item.name}</h3>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                {isCoolingOff ? (
                  <><Clock size={12} className="text-[var(--warning)]" /> Cooling off...</>
                ) : (
                  <><Check size={12} className="text-[var(--success)]" /> Ready for decision</>
                )}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-[var(--text-primary)] tracking-tight">{formatAmount(item.amount)}</p>
          </div>
        </div>

        {isCoolingOff ? (
          <div className="flex flex-col gap-2">
            <div className="bg-[var(--warning-subtle)]/20 border border-[var(--warning)]/20 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--warning)]">
                <Clock size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Time Remaining</span>
              </div>
              <span className="text-sm font-black text-[var(--warning)] font-mono">{timeLeft.hours}h {timeLeft.mins}m</span>
            </div>
            <Button 
              variant="outline" 
              className="h-8 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-subtle)]/20 hover:border-[var(--danger)]/30 border-[var(--border)] border-dashed w-full"
              onClick={() => onReject(item.id)}
            >
              <X size={14} className="mr-1.5" /> Cancel Item
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {!isAffordable && (
              <div className="flex items-start gap-2 bg-[var(--danger-subtle)]/20 border border-[var(--danger)]/20 p-2.5 rounded-lg text-xs text-[var(--danger)]">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p>Purchasing this will exceed your Free to Spend buffer by <b>{formatAmount(item.amount - freeToSpend)}</b>.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="h-10 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-subtle)]/20 hover:border-[var(--danger)]/30 border-[var(--border)] border-dashed"
                onClick={() => onReject(item.id)}
              >
                <X size={14} className="mr-1.5" /> I don't need it
              </Button>
              <Button 
                className={cn(
                  "h-10 text-xs font-bold shadow-md",
                  !isAffordable 
                    ? "bg-[var(--danger)] hover:bg-[var(--danger-hover)] text-white" 
                    : "bg-[var(--success)] hover:bg-[var(--success)]/90 text-white"
                )}
                onClick={() => onApprove(item)}
              >
                <Check size={14} className="mr-1.5" /> Buy it
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

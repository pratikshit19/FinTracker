import { motion } from 'framer-motion';
import { 
  ShieldCheck, TrendingDown, Lightbulb, 
  ArrowRight, AlertCircle, Sparkles, 
  Scissors, Tv, PiggyBank, HeartHandshake
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { Subscription } from '@/types';

export interface SubscriptionRecommendation {
  id: string;
  title: string;
  message: string;
  impact: 'Medium' | 'High' | 'Critical' | 'Strategic';
  actionLabel: string;
}

interface SubscriptionAuditProps {
  subscriptions: Subscription[];
  income: number;
  onDismissRecommendation: (id: string) => void;
  dismissedIds: string[];
}

export const SubscriptionAudit = ({ 
  subscriptions, 
  income, 
  onDismissRecommendation,
  dismissedIds
}: SubscriptionAuditProps) => {
  const { formatAmount } = useCurrency();
  
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const totalMonthly = activeSubs.reduce((acc, s) => {
    if (s.billing_cycle === 'monthly') return acc + s.amount;
    if (s.billing_cycle === 'yearly') return acc + (s.amount / 12);
    if (s.billing_cycle === 'weekly') return acc + (s.amount * 4.33);
    return acc;
  }, 0);

  const ratio = totalMonthly / income;
  const isHighFixed = ratio > 0.6;

  const getRecommendations = () => {
    const recs: Record<string, SubscriptionRecommendation> = {};
    const categories: Record<string, Subscription[]> = {};
    
    // Group by category for redundancy check
    activeSubs.forEach(s => {
      if (!categories[s.category]) categories[s.category] = [];
      categories[s.category].push(s);
    });

    activeSubs.forEach(s => {
      if (dismissedIds.includes(s.id)) return;

      // 1. Redundancy Logic: Multiple subs in same non-essential category
      const nonEssentialCategories = ['Entertainment', 'Software/SaaS', 'Lifestyle', 'Other'];
      if (nonEssentialCategories.includes(s.category) && categories[s.category].length > 1) {
        recs[s.id] = {
          id: s.id,
          title: 'Redundant Service?',
          message: `You have ${categories[s.category].length} services in ${s.category}. Consider consolidating to save.`,
          impact: 'Medium',
          actionLabel: 'Review'
        };
      }

      // 2. High Impact Logic: Any single discretionary sub > 2% of income
      const isDiscretionary = !['Bill/Rent', 'Family Support', 'Investment/SIP', 'Healthcare', 'Education'].includes(s.category);
      if (isDiscretionary && s.amount > (income * 0.02)) {
        recs[s.id] = {
          id: s.id,
          title: 'High Cost Item',
          message: `This single cost is ${((s.amount / income) * 100).toFixed(1)}% of your income. Is there a cheaper alternative?`,
          impact: 'High',
          actionLabel: 'Optimize'
        };
      }

      // 3. Specific Logic (The "Haircut/Netflix" type specific matches)
      if (s.name.toLowerCase().includes('netflix') && s.amount > 199) {
        recs[s.id] = {
          id: s.id,
          title: 'Downgrade Possible',
          message: `Switching to a mobile/standard plan could save you ~${formatAmount(s.amount - 199)}/mo.`,
          impact: 'Medium',
          actionLabel: 'Downgrade'
        };
      }

      if ((s.name.toLowerCase().includes('hair') || s.name.toLowerCase().includes('salon')) && s.amount > 500) {
        recs[s.id] = {
          id: s.id,
          title: 'Premium Service',
          message: `Your current stylist cost is high. Local alternatives typically charge ${formatAmount(200-500)}.`,
          impact: 'High',
          actionLabel: 'Find Cheaper'
        };
      }

      // 4. Critical Logic: Investment vs Buffer
      if (s.category === 'Investment/SIP' && isHighFixed && s.amount > (income * 0.15)) {
        recs[s.id] = {
          id: s.id,
          title: 'Cashflow Rebalance',
          message: 'Your investments are impacting your daily buffer. Consider a temporary 5% trim.',
          impact: 'Critical',
          actionLabel: 'Rebalance'
        };
      }
    });

    return recs;
  };

  const recommendations = getRecommendations();
  const recCount = Object.keys(recommendations).length;
  const totalPotentialSavings = Object.values(recommendations).length * 400; // Estimated 400 per rec

  if (income === 0 || recCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className={cn(
        "p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all",
        isHighFixed ? "bg-[var(--danger-subtle)]/20 border-[var(--danger)]/30" : "bg-[var(--accent-subtle)]/20 border-[var(--accent)]/30"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
            isHighFixed ? "bg-[var(--danger)] text-white" : "bg-[var(--accent)] text-white"
          )}>
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Smart Savings Audit</h3>
              <Badge variant={isHighFixed ? 'danger' : 'success'} className="text-[8px] h-4">
                {isHighFixed ? 'High Fixed Burden' : 'Optimal'}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Detected <span className="font-bold text-[var(--text-primary)]">{recCount} opportunities</span> to free up your monthly buffer after analyzing your {activeSubs.length} payments.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Potential Savings</p>
            <p className="text-sm font-black text-[var(--success)]">~{formatAmount(totalPotentialSavings)}/mo</p>
          </div>
          <ArrowRight className="text-[var(--text-muted)] hidden md:block" size={16} />
        </div>
      </div>
    </motion.div>
  );
};

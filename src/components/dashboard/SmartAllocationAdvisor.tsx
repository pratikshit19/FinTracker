import { motion } from 'framer-motion';
import { 
  Wallet, Target, ShoppingBag, 
  ChevronRight, AlertCircle, Sparkles,
  TrendingUp, PiggyBank, Coffee
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn, ESSENTIAL_CATEGORIES } from '@/lib/utils';
import type { Budget, Goal } from '@/types';

interface SmartAllocationAdvisorProps {
  income: number;
  fixedExpenses: number;
  totalSpent: number;
  budgets: Budget[];
  goals: Goal[];
  categorySpent: Record<string, number>;
}

export const SmartAllocationAdvisor = ({
  income,
  fixedExpenses,
  totalSpent,
  budgets,
  goals,
  categorySpent
}: SmartAllocationAdvisorProps) => {
  const { formatAmount } = useCurrency();
  
  const initialBuffer = income - fixedExpenses;
  const remainingBuffer = Math.max(0, initialBuffer - totalSpent);
  const totalPlannedSavings = goals.reduce((s, g) => s + (g.monthly_contribution || 0), 0);
  const totalBudgets = budgets.reduce((s, b) => s + b.monthly_limit, 0);
  
  // Realignment Logic for the Advisor
  const isBufferTight = initialBuffer < (totalPlannedSavings + totalBudgets);
  
  const savingsAllocation = Math.min(initialBuffer * 0.4, totalPlannedSavings); // Example logic: Prioritize savings
  const spendingAllocation = initialBuffer - savingsAllocation;

  return (
    <Card className="h-full border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      <CardHeader className="pb-2 border-b border-[var(--border)]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Smart Allocation Map</CardTitle>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-[9px] font-bold uppercase tracking-widest">
            Priority Flow
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Initial Buffer Section */}
        <div className="p-5 bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--bg-surface)] border-b border-[var(--border)]/50">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Initial Budget Buffer</span>
            <span className="text-[10px] font-bold text-[var(--success)] uppercase tracking-widest">After Fixed Costs</span>
          </div>
          <div className="text-3xl font-bold text-[var(--text-primary)]">
            {formatAmount(initialBuffer)}
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-2 flex items-center gap-1">
            <AlertCircle size={10} />
            This is your total pool for Savings & Variable Spending
          </p>
        </div>

        {/* The Allocation Plan */}
        <div className="p-5 space-y-5">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">The Allocation Plan</h4>
            
            {/* Savings Goal */}
            <div className="flex items-center justify-between group cursor-help">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                  <Target size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">Monthly Savings</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Secure this amount first</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-green-500">{formatAmount(totalPlannedSavings)}</p>
                <div className="h-1 w-16 bg-[var(--bg-elevated)] rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-green-500 w-full" />
                </div>
              </div>
            </div>

            {/* Smart Spending */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)]">
                  <ShoppingBag size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">Variable Spending</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Shopping, Food, Others</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-[var(--accent)]">{formatAmount(initialBuffer - totalPlannedSavings)}</p>
                <div className="h-1 w-16 bg-[var(--bg-elevated)] rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-[var(--accent)] w-[60%]" />
                </div>
              </div>
            </div>
          </div>

          {/* Proactive Advice Section */}
          <div className="pt-5 border-t border-[var(--border)]/50">
            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)]/50 border border-[var(--border)] flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-[var(--warning)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)]">Advisor Insight</span>
              </div>
              
              <div className="space-y-2">
                {isBufferTight ? (
                  <>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                      "Your buffer is tight relative to your goals. We suggest <span className="text-[var(--warning)] font-bold">reducing Shopping by 30%</span> and avoiding dining out this week."
                    </p>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
                      <Coffee size={12} className="text-yellow-600" />
                      <span className="text-[10px] font-medium text-yellow-700">Eating out is currently high impact.</span>
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    "You're in the green! After savings, you have <span className="text-[var(--success)] font-bold">{formatAmount(remainingBuffer - (totalPlannedSavings - (categorySpent['Savings'] || 0)))}</span> left for guilt-free spending."
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* View Details Link */}
        <div className="p-4 bg-[var(--bg-elevated)]/30 border-t border-[var(--border)]/50 flex items-center justify-between group cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest group-hover:text-[var(--accent)] transition-colors">
            Analyze Full Money Flow
          </span>
          <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
};

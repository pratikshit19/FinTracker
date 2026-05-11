import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Heart, TrendingUp, AlertCircle, ChevronDown, ChevronUp, Target, Wallet, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface FinancialHealthScoreProps {
  score: number;
  details: {
    savingsRatio: number;
    budgetAdherence: number;
    goalProgress: number;
  };
}

export const FinancialHealthScore = ({ score, details }: FinancialHealthScoreProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 80) return 'text-[var(--success)]';
    if (score >= 60) return 'text-[var(--accent)]';
    if (score >= 40) return 'text-[var(--warning)]';
    return 'text-[var(--danger)]';
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const getScoreIcon = () => {
    if (score >= 60) return <ShieldCheck className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  return (
    <Card className="overflow-hidden border-[var(--border)] bg-[var(--bg-surface)]">
      <CardContent className="p-6">
        <div className="flex flex-col items-center">
          <div className="w-full flex items-center justify-center gap-6">
            <div className="relative flex items-center justify-center shrink-0">
              {/* Pulsating Circle */}
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className={cn(
                  "absolute w-32 h-32 rounded-full",
                  score >= 60 ? "bg-[var(--accent)]" : "bg-[var(--warning)]"
                )}
              />
              
              {/* SVG Progress Circle */}
              <svg className="w-28 h-28 transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-[var(--bg-elevated)]"
                />
                <motion.circle
                  cx="56"
                  cy="56"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="314.159"
                  initial={{ strokeDashoffset: 314.159 }}
                  animate={{ strokeDashoffset: 314.159 - (314.159 * score) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={getScoreColor()}
                />
              </svg>
              
              <div className="absolute flex flex-col items-center">
                <span className={cn("text-3xl font-bold tracking-tight", getScoreColor())}>{Math.round(score)}</span>
                <span className="text-[8px] uppercase font-bold tracking-widest text-[var(--text-muted)]">FGO SCORE</span>
              </div>
            </div>

            <div className="flex flex-col items-start text-left min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("text-lg font-bold", getScoreColor())}>{getScoreLabel()}</span>
                <div className={getScoreColor()}>{getScoreIcon()}</div>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Your score is calculated based on savings, budget adherence, and goal velocity.
              </p>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full mt-6 pt-6 border-t border-[var(--border)] space-y-6"
              >
                {/* Category Progress Bars moved here */}
                <div className="w-full grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1 items-center">
                    <div className="h-1 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--accent)] transition-all duration-1000" style={{ width: `${details.savingsRatio}%` }} />
                    </div>
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Savings</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    <div className="h-1 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--success)] transition-all duration-1000" style={{ width: `${details.budgetAdherence}%` }} />
                    </div>
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Budget</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    <div className="h-1 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--warning)] transition-all duration-1000" style={{ width: `${details.goalProgress}%` }} />
                    </div>
                    <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Goals</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border)]">
                    <div className="p-2 rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)]"><Wallet size={14} /></div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Savings Ratio</p>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-0.5">Your savings rate is at {details.savingsRatio}%. We recommend aim for 20% to build long-term wealth.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border)]">
                    <div className="p-2 rounded-lg bg-[var(--success-subtle)] text-[var(--success)]"><Zap size={14} /></div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Budget Discipline</p>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-0.5">You've utilized {100 - details.budgetAdherence}% of your planned budget. Staying below 90% is ideal.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-elevated)]/50 border border-[var(--border)]">
                    <div className="p-2 rounded-lg bg-[var(--warning-subtle)] text-[var(--warning)]"><Target size={14} /></div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Goal Velocity</p>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-0.5">Your goals are {details.goalProgress}% on track. Increasing contributions by 5% could save 3 months.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-4 text-[10px] font-bold tracking-widest uppercase text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors gap-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <><ChevronUp size={12} /> SHOW LESS</> : <><ChevronDown size={12} /> SHOW DEEP DIVE</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

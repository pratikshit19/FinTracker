import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingDown, AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AIInsight } from '@/types';

interface AIInsightCardProps {
  insight: AIInsight | null;
  loading: boolean;
  onRefresh: () => void;
}

const ScoreRing = ({ score }: { score: number }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth="5" />
        <circle
          cx="32" cy="32" r={radius} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className="text-lg font-bold" style={{ color }}>{score}</span>
    </div>
  );
};

export const AIInsightCard = ({ insight, loading, onRefresh }: AIInsightCardProps) => (
  <Card className="border-[var(--accent)]/20 bg-[var(--accent-subtle)]/30">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[var(--accent)]" />
          <CardTitle className="text-[var(--accent)]">AI Analysis</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading} className="h-7 w-7">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-10 gap-3"
          >
            <Loader2 size={28} className="animate-spin text-[var(--accent)]" />
            <p className="text-sm text-[var(--text-muted)]">Analyzing your expenses…</p>
          </motion.div>
        ) : insight ? (
          <motion.div
            key="insight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            {/* Score + Summary */}
            <div className="flex items-start gap-4">
              <ScoreRing score={insight.score} />
              <div>
                <p className="text-xs text-[var(--text-muted)] mb-1">Financial Health Score</p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{insight.summary}</p>
              </div>
            </div>

            {/* Anomalies */}
            {insight.anomalies.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-[var(--warning)] uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle size={11} /> Anomalies Detected
                </p>
                {insight.anomalies.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)] bg-[var(--warning-subtle)] border border-[var(--warning)]/20 rounded-[var(--radius-sm)] px-3 py-2">
                    <span className="text-[var(--warning)] mt-0.5">⚡</span> {a}
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-[var(--success)] uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle size={11} /> Recommendations
              </p>
              {insight.recommendations.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                >
                  <span className="text-[var(--success)] font-bold shrink-0">{i + 1}.</span>
                  <span>{r}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-10 gap-2 text-center"
          >
            <TrendingDown size={28} className="text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)]">No insights yet</p>
            <p className="text-xs text-[var(--text-muted)]">Add some transactions and click refresh</p>
          </motion.div>
        )}
      </AnimatePresence>
    </CardContent>
  </Card>
);

import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCurrency } from '@/lib/CurrencyContext';
import { TrendingDown, Info } from 'lucide-react';

interface MoneyFlowSpiderProps {
  salary: number;
  subscriptions: number;
  budgets: number;
  savings: number;
}

export const MoneyFlowSpider = ({ 
  salary = 40000, 
  subscriptions = 0, 
  budgets = 0, 
  savings = 0 
}: MoneyFlowSpiderProps) => {
  const { formatAmount } = useCurrency();

  const fixedCosts = subscriptions;
  const personalBudgetBuffer = Math.max(0, salary - fixedCosts);
  const savingsBuffer = Math.max(0, personalBudgetBuffer - budgets);
  const leftover = Math.max(0, savingsBuffer - savings);

  const data = [
    { subject: 'Income', A: 100, fullMark: 100, actual: salary },
    { subject: 'Fixed Costs', A: (fixedCosts / salary) * 100, fullMark: 100, actual: fixedCosts },
    { subject: 'Savings Buffer', A: (savingsBuffer / salary) * 100, fullMark: 100, actual: savingsBuffer },
    { subject: 'Cash Leftover', A: (leftover / salary) * 100, fullMark: 100, actual: leftover },
  ];

  return (
    <Card className="h-full border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingDown size={16} className="text-[var(--accent)]" />
            Financial Flow Spider
          </CardTitle>
          <div className="h-6 w-6 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-muted)] cursor-help group relative">
            <Info size={12} />
            <div className="absolute right-0 top-full mt-2 w-48 p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
              Visualizes how your salary is distributed across different financial buckets.
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="var(--border)" strokeWidth={0.5} />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
              />
              <Radar
                name="Money Flow"
                dataKey="A"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="var(--accent)"
                fillOpacity={0.15}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Main Outflow</p>
            <p className="text-xs font-bold text-[var(--text-primary)]">
              {data.reduce((prev, curr) => (curr.subject !== 'Income' && curr.actual > prev.actual) ? curr : prev).subject}
            </p>
          </div>
          <div className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Efficiency</p>
            <p className="text-xs font-bold text-[var(--success)]">
              {((leftover / salary) * 100).toFixed(0)}% Leftover
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

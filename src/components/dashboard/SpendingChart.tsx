import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCurrency } from '@/lib/CurrencyContext';

interface SpendingChartProps {
  data: { date: string; amount: number }[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label, formatAmount }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2 shadow-[var(--shadow-lg)]">
        <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-tighter mb-1">{label}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {formatAmount(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export const SpendingChart = ({ data, height = 220 }: SpendingChartProps) => {
  const { formatAmount, getCurrencySymbol } = useCurrency();
  const symbol = getCurrencySymbol();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-[var(--text-muted)] text-sm italic" style={{ height }}>
        No transactions this month
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
          axisLine={false} tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
          axisLine={false} tickLine={false}
          tickFormatter={v => `${symbol}${v}`}
        />
        <Tooltip content={(props) => <CustomTooltip {...props} formatAmount={formatAmount} />} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="var(--accent)"
          strokeWidth={3}
          fill="url(#spendGrad)"
          dot={false}
          activeDot={{ r: 5, fill: 'var(--accent)', strokeWidth: 2, stroke: 'var(--bg-surface)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};


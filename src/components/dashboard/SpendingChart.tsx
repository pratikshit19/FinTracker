import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCurrency } from '@/lib/CurrencyContext';

interface SpendingChartProps {
  data: { date: string; amount: number }[];
}

const CustomTooltip = ({ active, payload, label, formatAmount }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2 shadow-[var(--shadow-lg)]">
        <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {formatAmount(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export const SpendingChart = ({ data }: SpendingChartProps) => {
  const { formatAmount, currency } = useCurrency();
  const symbol = currency === 'INR' ? '₹' : '$'; // Simple fallback for YAxis

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Spending</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-[var(--text-muted)] text-sm">
            No transactions yet this month
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `${symbol}${v}`}
              />
              <Tooltip content={(props) => <CustomTooltip {...props} formatAmount={formatAmount} />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#spendGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

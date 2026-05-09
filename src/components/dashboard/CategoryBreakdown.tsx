import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/utils';
import type { ExpenseCategory } from '@/types';
import { useCurrency } from '@/lib/CurrencyContext';

interface CategoryBreakdownProps {
  breakdown: Record<string, number>;
  total: number;
}

const CustomTooltip = ({ active, payload, formatAmount }: any) => {
  if (active && payload?.length) {
    const { name, value } = payload[0];
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-sm)] px-3 py-2 shadow-[var(--shadow-lg)]">
        <p className="text-xs text-[var(--text-muted)]">{name}</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{formatAmount(value)}</p>
      </div>
    );
  }
  return null;
};

export const CategoryBreakdown = ({ breakdown, total }: CategoryBreakdownProps) => {
  const { formatAmount } = useCurrency();
  const data = Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>By Category</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-[var(--text-muted)] text-sm">
            No data yet
          </div>
        ) : (
          <div className="flex gap-6 items-center">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CATEGORY_COLORS[entry.name as ExpenseCategory] ?? '#6b7280'}
                    />
                  ))}
                </Pie>
                  <Tooltip content={(props) => <CustomTooltip {...props} formatAmount={formatAmount} />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex-1 flex flex-col gap-2 min-w-0">
              {data.slice(0, 5).map(({ name, value }) => {
                const pct = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                const color = CATEGORY_COLORS[name as ExpenseCategory] ?? '#6b7280';
                return (
                  <div key={name} className="flex items-center gap-2 min-w-0">
                    <span className="text-sm shrink-0">{CATEGORY_ICONS[name as ExpenseCategory] ?? '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-xs text-[var(--text-secondary)] truncate">{name}</span>
                        <span className="text-xs text-[var(--text-muted)] ml-2 shrink-0">{pct}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

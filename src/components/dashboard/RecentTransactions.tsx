import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CATEGORY_COLORS, CATEGORY_ICONS, formatDate } from '@/lib/utils';
import type { Expense, ExpenseCategory } from '@/types';
import { useCurrency } from '@/lib/CurrencyContext';

interface RecentTransactionsProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  limit?: number;
  title?: string;
}

export const RecentTransactions = ({
  expenses, onDelete, onEdit, limit = 8, title = 'Recent Transactions'
}: RecentTransactionsProps) => {
  const { formatAmount } = useCurrency();
  const displayed = expenses.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <span className="text-4xl mb-3">💸</span>
            <p className="text-sm font-medium text-[var(--text-secondary)]">No transactions yet</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Add your first expense to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            <AnimatePresence initial={false}>
              {displayed.map((expense, i) => {
                const color = CATEGORY_COLORS[expense.category as ExpenseCategory] ?? '#6b7280';
                const icon = CATEGORY_ICONS[expense.category as ExpenseCategory] ?? '📦';
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10, height: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    className="flex items-center gap-3 px-5 py-3.5 group hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    {/* Icon */}
                    <span
                      className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-base"
                      style={{ background: `${color}18` }}
                    >
                      {icon}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{expense.title}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-medium">{formatDate(expense.date)}</p>
                    </div>

                    {/* Amount & Category */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-sm font-bold text-[var(--text-primary)] tabular-nums">
                        {formatAmount(expense.amount)}
                      </p>
                      <Badge
                        variant="muted"
                        className="text-[9px] py-0.5 h-auto px-2 uppercase tracking-wider font-bold border-none"
                        style={{ color, background: `${color}15` }}
                      >
                        {expense.category}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 ml-1">
                      <button 
                        onClick={() => onEdit(expense)} 
                        className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all active:scale-90"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button 
                        onClick={() => onDelete(expense.id)} 
                        className="p-2 rounded-full hover:bg-[var(--danger-subtle)] text-[var(--text-muted)] hover:text-[var(--danger)] transition-all active:scale-90"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

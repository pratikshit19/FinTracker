import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DailyReceiptModal } from '@/components/transactions/DailyReceiptModal';
import { NoSpendDay } from '@/components/dashboard/NoSpendDay';
import { getCategoryColor, getCategoryIcon, formatDate } from '@/lib/utils';
import { useState } from 'react';

import type { Expense, ExpenseCategory } from '@/types';
import { useCurrency } from '@/lib/CurrencyContext';

interface DailyLogsListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  limit?: number;
  title?: React.ReactNode;
}

export const DailyLogsList = ({
  expenses, onEdit, limit = 8, title = 'Daily Logs'
}: DailyLogsListProps) => {
  const { formatAmount } = useCurrency();
  const [selectedDay, setSelectedDay] = useState<{ dateStr: string; expenses: Expense[]; total: number } | null>(null);
  const displayed = expenses.slice(0, limit);

  const groupedExpenses = displayed.reduce((acc, curr) => {
    const existing = acc.find(g => g.dateStr === curr.date);
    if (existing) {
      existing.expenses.push(curr);
      existing.total += curr.amount;
    } else {
      acc.push({ dateStr: curr.date, expenses: [curr], total: curr.amount });
    }
    return acc;
  }, [] as { dateStr: string; expenses: Expense[]; total: number }[]);

  return (
    <>
      <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {displayed.length === 0 ? (
          <NoSpendDay />
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            <AnimatePresence initial={false}>
              {groupedExpenses.map((group, groupIndex) => (
                <motion.div
                  key={group.dateStr}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.05 }}
                  onClick={() => setSelectedDay(group)}
                  className="flex items-center justify-between px-5 py-4 group hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center border border-[var(--border)] group-hover:scale-105 transition-transform shadow-sm">
                      <span className="text-sm font-bold text-[var(--text-secondary)]">
                        {new Date(group.dateStr).getDate()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{formatDate(group.dateStr)}</p>
                      <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                        {group.expenses.length} transaction{group.expenses.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-[var(--text-primary)] font-mono tabular-nums tracking-tight">
                      {formatAmount(group.total)}
                    </span>
                    <span className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors opacity-50 group-hover:opacity-100 group-hover:translate-x-1 duration-200">
                      <ChevronRight size={16} />
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>

    {selectedDay && (
      <DailyReceiptModal
        dateStr={selectedDay.dateStr}
        expenses={selectedDay.expenses}
        onClose={() => setSelectedDay(null)}
        onEdit={(exp) => {
          setSelectedDay(null);
          onEdit(exp);
        }}
      />
    )}
    </>
  );
};

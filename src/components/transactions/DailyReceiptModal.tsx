import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useCurrency } from '@/lib/CurrencyContext';
import type { Expense } from '@/types';

interface DailyReceiptModalProps {
  dateStr: string;
  expenses: Expense[];
  onClose: () => void;
  onEdit: (expense: Expense) => void;
}

export const DailyReceiptModal = ({ dateStr, expenses, onClose, onEdit }: DailyReceiptModalProps) => {
  const { formatAmount } = useCurrency();

  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm max-h-[90vh] flex flex-col"
        >
          {/* Top Zig-Zag */}
          <div className="h-4 w-full shrink-0" style={{
            background: 'linear-gradient(135deg, var(--bg-surface) 25%, transparent 25%) -8px 0, linear-gradient(225deg, var(--bg-surface) 25%, transparent 25%) -8px 0',
            backgroundSize: '16px 16px',
            backgroundColor: 'transparent'
          }}></div>

          <div className="bg-[var(--bg-surface)] px-6 sm:px-8 py-6 shadow-2xl relative border-x border-[var(--border)] font-mono overflow-y-auto overflow-x-hidden flex-1 no-scrollbar">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--bg-hover)] z-10"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center mb-6 mt-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)] text-center tracking-tight uppercase">FINTRACE</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-widest">Daily Summary</p>
            </div>

            {/* Date */}
            <div className="flex justify-between items-end border-b border-dashed border-[var(--border)] pb-4 mb-5">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date</span>
              <span className="text-sm font-bold text-[var(--text-primary)] uppercase">{formatDate(dateStr)}</span>
            </div>

            {/* Items */}
            <div className="space-y-4 mb-4">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest block mb-1">Transactions</span>
              {expenses.map(exp => (
                <div key={exp.id} className="group relative border-b border-dashed border-[var(--border-subtle)] pb-3 last:border-0 last:pb-0 flex items-center pr-2">
                   <div className="flex-1 flex justify-between items-start gap-4">
                     <div className="flex flex-col flex-1 min-w-0">
                       <span className="text-sm font-medium text-[var(--text-primary)] leading-tight truncate">{exp.title}</span>
                       <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5 truncate">{exp.category}</span>
                     </div>
                     <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums shrink-0 mt-0.5">{formatAmount(exp.amount)}</span>
                   </div>
                   
                   {/* Hover Edit Action */}
                   <div className="absolute top-1/2 -translate-y-1/2 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-[var(--bg-surface)] via-[var(--bg-surface)] to-transparent pl-4 pr-1 py-2 flex items-center">
                     <button 
                       onClick={(e) => { e.stopPropagation(); onClose(); onEdit(exp); }} 
                       className="p-1.5 rounded-md bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all active:scale-90 shadow-sm border border-[var(--border)]"
                       title="Edit"
                     >
                       <Pencil size={12} />
                     </button>
                   </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center border-t border-dashed border-[var(--border)] pt-4 pb-4 mt-4">
              <span className="text-base font-bold text-[var(--text-primary)] uppercase tracking-widest">Total</span>
              <span className="text-xl font-black text-[var(--text-primary)] tracking-tighter tabular-nums">
                {formatAmount(total)}
              </span>
            </div>

            {/* Barcode Mock */}
            <div className="flex justify-center opacity-40 mb-2 mt-6 shrink-0">
              <div className="h-10 w-full flex justify-between mx-4 gap-0.5">
                {[...Array(30)].map((_, i) => (
                  <div key={i} className="bg-[var(--text-primary)] h-full" style={{ width: `${Math.random() * 4 + 1}px` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Zig-Zag */}
          <div className="h-4 w-full rotate-180 shrink-0" style={{
            background: 'linear-gradient(135deg, var(--bg-surface) 25%, transparent 25%) -8px 0, linear-gradient(225deg, var(--bg-surface) 25%, transparent 25%) -8px 0',
            backgroundSize: '16px 16px',
            backgroundColor: 'transparent'
          }}></div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Printer, Share } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getCategoryIcon, getCategoryColor, formatDate } from '@/lib/utils';
import { useCurrency } from '@/lib/CurrencyContext';
import type { Expense } from '@/types';

interface ReceiptModalProps {
  expense: Expense | null;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
}

export const ReceiptModal = ({ expense, onClose, onEdit }: ReceiptModalProps) => {
  const { formatAmount } = useCurrency();

  if (!expense) return null;

  const color = getCategoryColor(expense.category);
  const icon = getCategoryIcon(expense.category);

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
          className="relative w-full max-w-sm"
        >
          {/* Top Zig-Zag */}
          <div className="h-4 w-full" style={{
            background: 'linear-gradient(135deg, var(--bg-surface) 25%, transparent 25%) -8px 0, linear-gradient(225deg, var(--bg-surface) 25%, transparent 25%) -8px 0',
            backgroundSize: '16px 16px',
            backgroundColor: 'transparent'
          }}></div>

          <div className="bg-[var(--bg-surface)] px-8 py-6 shadow-2xl relative border-x border-[var(--border)] font-mono">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--bg-hover)]"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center mb-8 mt-2">
              <div 
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4 border-2"
                style={{ borderColor: `${color}40`, backgroundColor: `${color}15`, color }}
              >
                {icon}
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] text-center tracking-tight">FINTRACE</h2>
              <p className="text-xs text-[var(--text-muted)] font-mono mt-1 uppercase tracking-widest">Digital Receipt</p>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-dashed border-[var(--border)] pb-4">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date</span>
                <span className="text-sm font-mono text-[var(--text-primary)]">{formatDate(expense.date)}</span>
              </div>
              
              <div className="flex justify-between items-end border-b border-dashed border-[var(--border)] pb-4">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Category</span>
                <span className="text-sm font-medium" style={{ color }}>{expense.category}</span>
              </div>

              <div className="flex justify-between items-start border-b border-dashed border-[var(--border)] pb-4">
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1">Item</span>
                <span className="text-sm font-medium text-[var(--text-primary)] text-right max-w-[180px] leading-tight">{expense.title}</span>
              </div>

              {expense.notes && (
                <div className="flex justify-between items-start border-b border-dashed border-[var(--border)] pb-4">
                  <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-1">Notes</span>
                  <span className="text-xs text-[var(--text-secondary)] text-right max-w-[180px] italic">{expense.notes}</span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between items-center pt-4 pb-8">
                <span className="text-base font-bold text-[var(--text-primary)] uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">
                  {formatAmount(expense.amount)}
                </span>
              </div>
            </div>

            {/* Barcode Mock */}
            <div className="flex justify-center opacity-40 mb-6">
              <div className="h-10 w-full flex justify-between mx-4 gap-0.5">
                {[...Array(30)].map((_, i) => (
                  <div key={i} className="bg-[var(--text-primary)] h-full" style={{ width: `${Math.random() * 4 + 1}px` }} />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" className="w-full text-xs gap-2" onClick={() => { onClose(); onEdit(expense); }}>
                <Pencil size={12} /> Edit
              </Button>
            </div>
          </div>

          {/* Bottom Zig-Zag */}
          <div className="h-4 w-full rotate-180" style={{
            background: 'linear-gradient(135deg, var(--bg-surface) 25%, transparent 25%) -8px 0, linear-gradient(225deg, var(--bg-surface) 25%, transparent 25%) -8px 0',
            backgroundSize: '16px 16px',
            backgroundColor: 'transparent'
          }}></div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

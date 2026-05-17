import { motion } from 'framer-motion';
import { Sparkles, Coffee } from 'lucide-react';

export const NoSpendDay = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <motion.div 
        className="relative mb-6"
        initial={{ y: 0 }}
        animate={{ y: [-8, 8, -8] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        <div className="w-20 h-20 rounded-full bg-[var(--success-subtle)] flex items-center justify-center relative z-10 border border-[var(--success)]/20 shadow-[0_0_40px_rgba(34,197,94,0.15)]">
          <Coffee size={32} className="text-[var(--success)]" />
        </div>
        
        {/* Floating elements */}
        <motion.div 
          className="absolute -top-2 -right-2 text-[var(--accent)]"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
        >
          <Sparkles size={16} />
        </motion.div>
      </motion.div>

      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        No Spend Day!
      </h3>
      <p className="text-sm text-[var(--text-muted)] max-w-[250px] mx-auto leading-relaxed">
        Awesome job keeping your wallet closed today. Every zero-spend day gets you closer to your goals.
      </p>
    </div>
  );
};

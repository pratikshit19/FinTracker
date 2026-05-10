import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500); // Allow exit animation to finish
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-[var(--bg-base)] flex flex-col items-center justify-center p-6"
        >
          {/* Logo Animation */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.8, 
              ease: [0.16, 1, 0.3, 1],
              opacity: { duration: 0.4 }
            }}
            className="relative"
          >
            <div className="h-20 w-20 rounded-[22px] bg-gradient-to-br from-[var(--accent)] to-[#8b5cf6] flex items-center justify-center shadow-2xl shadow-[var(--accent)]/20">
              <Sparkles size={40} className="text-white" />
            </div>
            
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-[var(--accent)] blur-2xl opacity-20 -z-10 animate-pulse" />
          </motion.div>

          {/* Text Content */}
          <div className="mt-8 text-center">
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-bold tracking-tight bg-gradient-to-b from-[var(--text-primary)] to-[var(--text-muted)] bg-clip-text text-transparent"
            >
              FinTrace
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-[var(--text-muted)] text-sm mt-2 font-medium tracking-wide uppercase"
            >
              Master Your Money
            </motion.p>
          </div>

          {/* Loading Indicator */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-16 w-32 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden"
          >
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                ease: "easeInOut" 
              }}
              className="h-full w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

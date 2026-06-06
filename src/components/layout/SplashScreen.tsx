import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Logo3D } from './Logo3D';

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
            <div className="h-44 w-44 flex items-center justify-center relative z-10">
              <Logo3D width="100%" height="100%" zoom={5.2} animate="spinFloat" animateSpeed={1.5} />
            </div>

            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-[var(--accent)] blur-3xl opacity-20 -z-10 animate-pulse animate-duration-[3000ms]" />
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

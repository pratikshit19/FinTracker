import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, LayoutDashboard, List, PieChart, Calendar, Loader2, CheckCircle2, X, Coins } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Toggle on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setSuccess(false);
      setLoading(false);
    }
  }, [open]);

  const closePalette = () => setOpen(false);

  // Pages for quick navigation
  const pages = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={16} /> },
    { name: 'Transactions', path: '/transactions', icon: <List size={16} /> },
    { name: 'Budgets & Goals', path: '/budgets', icon: <PieChart size={16} /> },
    { name: 'AI Wealth Coach', path: '/wealth-coach', icon: <Coins size={16} /> },
    { name: 'Calendar', path: '/calendar', icon: <Calendar size={16} /> },
  ];

  const filteredPages = pages.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  
  // Heuristic: if the query contains a number, assume they might be trying to log an expense
  const containsNumber = /\d/.test(query);
  const isAILoggingPossible = query.length > 3 && containsNumber;

  const handleAILog = async () => {
    if (!query) return;
    setLoading(true);
    try {
      // --- Smart Local Parser (no external API needed) ---
      // 1. Extract amount: find the first number in the string
      const amountMatch = query.match(/[\d,]+(\.[\d]{1,2})?/);
      const amount = amountMatch ? parseFloat(amountMatch[0].replace(/,/g, '')) : 0;

      // 2. Categorize by keyword matching
      const lower = query.toLowerCase();
      let category = 'Other';
      if (/food|eat|lunch|dinner|breakfast|snack|coffee|cafe|restaurant|zomato|swiggy|pizza|burger|biryani|chai|tea/.test(lower)) category = 'Food';
      else if (/cab|uber|ola|taxi|metro|bus|fuel|petrol|diesel|auto|rickshaw|train|flight|transport/.test(lower)) category = 'Transport';
      else if (/electricity|water|gas|internet|wifi|bill|utility|rent|maintenance/.test(lower)) category = 'Utilities';
      else if (/shop|buy|purchase|amazon|flipkart|myntra|clothes|shirt|shoe|gadget|phone/.test(lower)) category = 'Shopping';
      else if (/movie|netflix|spotify|game|concert|show|party|fun|entertainment/.test(lower)) category = 'Entertainment';
      else if (/doctor|medicine|gym|pharmacy|hospital|health|medical/.test(lower)) category = 'Health';

      // 3. Extract title: strip number and common filler words
      const raw = query
        .replace(/[\d,]+(\.[\d]{1,2})?/g, '')
        .replace(/\b(spent|spend|paid|pay|bought|got|for|on|rs|inr|rupees|₹|rupee|bucks)\b/gi, '')
        .trim()
        .replace(/\s+/g, ' ');
      const title = raw.charAt(0).toUpperCase() + raw.slice(1) || 'Expense';

      // 4. Insert into Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated. Please log in again.');

      const { error } = await supabase.from('expenses').insert({
        user_id: user.id,
        title,
        amount,
        category,
        date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        closePalette();
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      console.error('Quick Log Failed:', err);
      alert(err.message || 'Failed to log expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageNavigate = (path: string) => {
    navigate(path);
    closePalette();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePalette}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50"
          >
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden flex flex-col">
              
              {/* Search Bar */}
              <div className="flex items-center px-4 h-16 border-b border-[var(--border)] relative">
                <Search size={20} className="text-[var(--text-muted)] shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isAILoggingPossible && !loading && !success) {
                      e.preventDefault();
                      handleAILog();
                    } else if (e.key === 'Escape') {
                      closePalette();
                    }
                  }}
                  placeholder="Ask AI to log an expense, or search pages..."
                  className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 px-4 text-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                  autoComplete="off"
                  spellCheck="false"
                  disabled={loading || success}
                />
                <button 
                  onClick={closePalette}
                  className="p-1 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                
                {success && (
                  <div className="flex flex-col items-center justify-center py-12 text-[var(--success)]">
                    <CheckCircle2 size={48} className="mb-4" />
                    <p className="font-bold text-lg">Expense Logged Successfully!</p>
                  </div>
                )}

                {!success && query.length > 0 && isAILoggingPossible && (
                  <div className="mb-2">
                    <p className="px-3 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">AI Actions</p>
                    <button
                      onClick={handleAILog}
                      disabled={loading}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-4 rounded-xl text-left transition-colors group",
                        loading ? "bg-[var(--bg-elevated)] opacity-70 cursor-not-allowed" : "hover:bg-[var(--accent)]/10 text-[var(--text-primary)]"
                      )}
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        loading ? "bg-[var(--bg-hover)] text-[var(--text-muted)]" : "bg-[var(--accent)] text-white group-hover:scale-105"
                      )}>
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-bold", loading ? "" : "group-hover:text-[var(--accent)] transition-colors")}>
                          {loading ? 'Analyzing and Logging...' : 'Log via AI'}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] truncate max-w-[400px]">
                          "{query}"
                        </p>
                      </div>
                      {!loading && (
                        <div className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded text-[10px] font-bold text-[var(--text-muted)]">
                          ENTER
                        </div>
                      )}
                    </button>
                  </div>
                )}

                {!success && !loading && (
                  <div>
                    <p className="px-3 py-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Navigation</p>
                    {filteredPages.length > 0 ? (
                      <div className="space-y-1">
                        {filteredPages.map((page) => (
                          <button
                            key={page.path}
                            onClick={() => handlePageNavigate(page.path)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-primary)]"
                          >
                            <span className="text-[var(--text-muted)]">{page.icon}</span>
                            <span className="text-sm font-semibold">{page.name}</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-4 text-sm text-[var(--text-muted)]">No pages found.</p>
                    )}
                  </div>
                )}

              </div>
              
              {/* Footer */}
              {!success && (
                <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)]">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] font-mono text-[10px]">↑↓</kbd> to navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] font-mono text-[10px]">↵</kbd> to select
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--bg-surface)] font-mono text-[10px]">ESC</kbd> to close
                  </span>
                </div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

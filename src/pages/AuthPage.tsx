import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { AuthMode } from '@/types';

export const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Check your email to confirm your account.');
      }
    } catch (err: any) {
      setError(err.message ?? 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-9 w-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lg animate-pulse-glow">
            <TrendingUp size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Fintrack</span>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-7 shadow-[var(--shadow-lg)]">
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">
            {mode === 'login' ? 'Sign in to your Fintrack account' : 'Start tracking your expenses with AI'}
          </p>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <Input
              id="auth-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              leftIcon={<Mail size={14} />}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="auth-password" className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <Lock size={14} />
                </span>
                <input
                  id="auth-password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-10 pl-9 pr-10 rounded-[var(--radius-sm)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-[var(--danger)] bg-[var(--danger-subtle)] border border-[var(--danger)]/20 rounded-[var(--radius-sm)] px-3 py-2"
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-[var(--success)] bg-[var(--success-subtle)] border border-[var(--success)]/20 rounded-[var(--radius-sm)] px-3 py-2"
              >
                {success}
              </motion.p>
            )}

            <Button type="submit" loading={loading} className="mt-1 w-full">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-[var(--text-muted)]">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
                className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-5">
          Smart expense tracking powered by AI
        </p>
      </motion.div>
    </div>
  );
};

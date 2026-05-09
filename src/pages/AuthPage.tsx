import { useState, useEffect } from 'react';
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

  useEffect(() => {
    // Check if we just landed from a redirect
    if (window.location.hash || window.location.search.includes('code=')) {
      console.log('[AuthPage] Redirect detected, checking session...');
      setLoading(true);
      const timer = setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[AuthPage] Session check result:', session?.user?.email || 'none');
        if (session) {
          // Redirect handled by App.tsx session listener
        } else {
          setLoading(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

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
  const handleGoogleLogin = async () => {
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
          skipBrowserRedirect: false,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message ?? 'An error occurred with Google Login');
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
          <span className="text-xl font-bold tracking-tight">FinTrace</span>
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[var(--border)]"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold"><span className="bg-[var(--bg-surface)] px-2 text-[var(--text-muted)]">Or continue with</span></div>
          </div>

          <Button
            variant="outline"
            className="w-full gap-3 h-11"
            onClick={handleGoogleLogin}
            loading={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.85 2.22c1.67-1.54 2.64-3.81 2.64-6.57z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.85-2.22c-.79.53-1.8.85-3.11.85-2.39 0-4.41-1.61-5.14-3.78H.9v2.33C2.39 15.93 5.47 18 9 18z" fill="#34A853" />
              <path d="M3.86 10.67c-.19-.56-.3-1.16-.3-1.78s.11-1.22.3-1.78V4.78H.9c-.64 1.28-1 2.73-1 4.22s.36 2.94 1 4.22l2.96-2.55z" fill="#FBBC05" />
              <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.89 11.43 0 9 0 5.47 0 2.39 2.07.9 5.08l2.96 2.33c.73-2.17 2.75-3.78 5.14-3.78z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </Button>

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

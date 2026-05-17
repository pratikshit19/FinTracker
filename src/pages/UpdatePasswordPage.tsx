import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';

export const UpdatePasswordPage = ({ onComplete }: { onComplete: () => void }) => {
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      setSuccess('Password updated successfully!');
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      setError(err.message ?? 'An error occurred updating password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm px-1"
      >
        <div className="flex justify-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-[var(--accent-subtle)] border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)] shadow-[0_0_30px_rgba(var(--accent),0.2)]">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 sm:p-7 shadow-[var(--shadow-lg)]">
          <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1 text-center">
            Set New Password
          </h1>
          <p className="text-sm text-[var(--text-muted)] mb-6 text-center leading-relaxed">
            Please enter your new password to secure your account.
          </p>

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="new-password" className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <Lock size={14} />
                </span>
                <input
                  id="new-password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-10 pl-9 pr-10 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all outline-none"
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

            <Button type="submit" loading={loading} className="mt-2 w-full" disabled={!!success}>
              Update Password
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

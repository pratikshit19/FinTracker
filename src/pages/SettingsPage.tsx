import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Trash2, LogOut, Settings, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNavigate } from 'react-router-dom';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleDeleteAllExpenses = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('expenses').delete().eq('user_id', user.id);
      setMsg('All expenses deleted successfully.');
    }
    setDeleteConfirm(false);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
          <Settings size={16} className="text-[var(--text-secondary)]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your account</p>
        </div>
      </motion.div>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/30 flex items-center justify-center">
              <User size={22} className="text-[var(--accent)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{email}</p>
              <p className="text-xs text-[var(--text-muted)]">Supabase Auth</p>
            </div>
          </div>
          <Input
            label="Email"
            value={email}
            readOnly
            className="opacity-60 cursor-not-allowed"
          />
          <p className="text-xs text-[var(--text-muted)]">
            Email changes require re-authentication. Use Supabase dashboard.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-[var(--danger)]/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-[var(--danger)]" />
            <CardTitle className="text-[var(--danger)]">Danger Zone</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {msg && (
            <p className="text-xs text-[var(--success)] bg-[var(--success-subtle)] border border-[var(--success)]/20 rounded-[var(--radius-sm)] px-3 py-2">
              {msg}
            </p>
          )}
          <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] bg-[var(--danger-subtle)]/40 border border-[var(--danger)]/15">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Delete All Expenses</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Permanently delete all your transaction data</p>
            </div>
            <Button
              variant="danger"
              size="sm"
              loading={loading}
              onClick={handleDeleteAllExpenses}
            >
              <Trash2 size={13} />
              {deleteConfirm ? 'Confirm?' : 'Delete'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sign out */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Sign Out</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">End your current session</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut size={13} /> Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-xs text-[var(--text-muted)] text-center">
        Fintrack v1.0 · Built with Supabase + Gemini AI
      </p>
    </div>
  );
};

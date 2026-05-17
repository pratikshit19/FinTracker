import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Trash2, LogOut, Settings, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { useCurrency, CURRENCIES } from '@/lib/CurrencyContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { AvatarUpload } from '@/components/settings/AvatarUpload';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { Check } from 'lucide-react';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { currency, setCurrency } = useCurrency();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('5000');
  const [minLeftover, setMinLeftover] = useState('2000');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initialUsername, setInitialUsername] = useState('');
  const [initialIncome, setInitialIncome] = useState('');
  const [initialSavingsTarget, setInitialSavingsTarget] = useState('5000');
  const [initialMinLeftover, setInitialMinLeftover] = useState('2000');
  const [initialAvatar, setInitialAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [msg, setMsg] = useState('');

  const hasChanges = username !== initialUsername || avatarUrl !== initialAvatar || monthlyIncome !== initialIncome || savingsTarget !== initialSavingsTarget || minLeftover !== initialMinLeftover;

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        console.log('[Settings] Loading profile for user:', user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, monthly_income, savings_target, min_leftover')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.warn('[Settings] Profile not found or error:', error);
        } else if (profile) {
          setUsername(profile.username || '');
          setMonthlyIncome(profile.monthly_income?.toString() || '0');
          setSavingsTarget(profile.savings_target?.toString() || '5000');
          setMinLeftover(profile.min_leftover?.toString() || '2000');
          setAvatarUrl(profile.avatar_url);
          setInitialUsername(profile.username || '');
          setInitialIncome(profile.monthly_income?.toString() || '0');
          setInitialSavingsTarget(profile.savings_target?.toString() || '5000');
          setInitialMinLeftover(profile.min_leftover?.toString() || '2000');
          setInitialAvatar(profile.avatar_url);
        }
      }
    };
    loadProfile();
  }, []);

  const handleUpdateProfile = async () => {
    setProfileLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log('[Settings] Saving profile...', { id: user.id, username, avatar_url: avatarUrl });
      
      // Use upsert to ensure the row exists
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          username, 
          avatar_url: avatarUrl,
          monthly_income: parseFloat(monthlyIncome) || 0,
          savings_target: parseFloat(savingsTarget) || 5000,
          min_leftover: parseFloat(minLeftover) || 2000,
          updated_at: new Date().toISOString() 
        });
      
      if (error) {
        console.error('[Settings] Save error:', error);
        setMsg('Error: ' + error.message);
      } else {
        console.log('[Settings] Save successful');
        setInitialUsername(username);
        setInitialIncome(monthlyIncome);
        setInitialSavingsTarget(savingsTarget);
        setInitialMinLeftover(minLeftover);
        setInitialAvatar(avatarUrl);
        setMsg('Profile updated successfully!');
        setTimeout(() => setMsg(''), 3000);
      }
    }
    setProfileLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleRestartOnboarding = () => {
    localStorage.removeItem('fintrace_onboarded');
    window.location.reload();
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
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center">
            <Settings size={16} className="text-[var(--text-secondary)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your account and preferences</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut} className="w-full sm:w-auto">
          <LogOut size={13} /> Sign Out
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Profile */}
          <Card className="h-full">
            <CardHeader><CardTitle>Profile Details</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                <AvatarUpload 
                  url={avatarUrl} 
                  onUpload={(url) => setAvatarUrl(url)} 
                />
                <div className="flex-1 flex flex-col gap-4 w-full">
                  <Input
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="How should we call you?"
                  />
                  <Input
                    label="Email"
                    value={email}
                    readOnly
                    className="opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>
              
              <AnimatePresence>
                {hasChanges && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Button 
                      className="w-full gap-2" 
                      onClick={handleUpdateProfile} 
                      loading={profileLoading}
                    >
                      <Check size={16} /> Save Profile Changes
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-[10px] text-[var(--text-muted)] text-center">
                User ID: {email} · Email changes require re-authentication.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Preferences */}
          <Card>
            <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Select value={currency} onValueChange={(val: any) => setCurrency(val)}>
                <SelectTrigger label="Primary Currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <div className="flex items-center gap-2">
                        <span className="w-5 text-xs font-mono text-[var(--text-muted)]">{c.symbol}</span>
                        <span>{c.name} ({c.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-[var(--text-muted)]">
                This will update all dashboard values and transaction history.
              </p>
            </CardContent>
          </Card>

          {/* Income Settings */}
          <Card>
            <CardHeader><CardTitle>Financial Profile</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Input
                label="Monthly Income (Salary)"
                type="number"
                placeholder="e.g. 33000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                leftIcon={<span className="text-xs font-bold text-[var(--text-muted)]">{CURRENCIES.find(c => c.code === currency)?.symbol || '$'}</span>}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Monthly Savings Target"
                  type="number"
                  placeholder="e.g. 5000"
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(e.target.value)}
                  leftIcon={<span className="text-xs font-bold text-[var(--text-muted)]">{CURRENCIES.find(c => c.code === currency)?.symbol || '$'}</span>}
                />
                <Input
                  label="Minimum Month-End Leftover"
                  type="number"
                  placeholder="e.g. 2000"
                  value={minLeftover}
                  onChange={(e) => setMinLeftover(e.target.value)}
                  leftIcon={<span className="text-xs font-bold text-[var(--text-muted)]">{CURRENCIES.find(c => c.code === currency)?.symbol || '$'}</span>}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Your entire dashboard is calculated from these three numbers: <strong>Income – Savings – Leftover = Free to Spend</strong>.
              </p>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
            <CardContent>
              <ThemeSelector />
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
              <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border)]">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Restart Setup Wizard</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Re-run the initial onboarding sequence</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestartOnboarding}
                >
                  Restart
                </Button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-[var(--radius-sm)] bg-[var(--danger-subtle)]/40 border border-[var(--danger)]/15">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Delete All Expenses</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Permanently delete all transaction data</p>
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
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-8 border-t border-[var(--border)] flex flex-col items-center gap-2">
        <p className="text-xs text-[var(--text-muted)]">
          FinTrace v1.0 · Built with Supabase + Gemini AI
        </p>
        <div className="flex items-center gap-4">
          <Button variant="link" size="sm" className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Privacy Policy</Button>
          <div className="h-3 w-px bg-[var(--border)]" />
          <Button variant="link" size="sm" className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Terms of Service</Button>
        </div>
      </div>
    </div>
  );
};

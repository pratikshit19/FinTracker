import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, LayoutDashboard, ArrowLeftRight, Sparkles, Settings, CreditCard, User, Plus, Coins } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { CommandPalette } from '@/components/CommandPalette';

const BOTTOM_NAV = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Home'      },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'Expenses'  },
  { to: '/fixed-expenses', icon: CreditCard,       label: 'Fixed'     },
  { to: '/wealth-coach',   icon: Coins,            label: 'Coach'     },
  { to: '/insights',      icon: Sparkles,        label: 'Insights'  },
  { to: '/settings',      icon: Settings,        label: 'Settings'  },
];

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();

    const channel = supabase
      .channel('header_profile')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, payload => {
        setProfile(payload.new as any);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 lg:ml-56 w-full min-h-screen flex flex-col min-w-0">

        {/* ── Mobile top bar ─────────────────────────────── */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-5 py-4 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border)] w-full max-w-[100vw] overflow-hidden">
          <button
            id="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-6 w-6 rounded-full bg-[var(--accent)] flex items-center justify-center overflow-hidden shrink-0 border border-[var(--border)]">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={12} className="text-white" />
              )}
            </div>
            <span className="font-bold text-xs tracking-tight text-[var(--text-primary)] truncate">
              {profile?.username || 'FinTrace'}
            </span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 px-5 py-6 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-24 lg:pb-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto">
            <CommandPalette />
            <Outlet />
          </div>
        </div>
      </main>

      {/* ── Mobile bottom nav ─────────────────────────────── */}
      <nav
        aria-label="Primary mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 mx-auto flex items-center justify-between gap-1 rounded-t-[1.25rem] bg-[var(--bg-surface)]/98 backdrop-blur-xl border-t border-[var(--border)] shadow-[0_-10px_40px_rgba(15,23,42,0.08)] safe-area-pb px-2 py-2 w-full max-w-5xl"
      >
        {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) =>
              cn(
                'group flex-1 min-w-0 rounded-3xl px-2 py-2 transition duration-200 ease-out text-[10px] font-semibold flex flex-col items-center justify-center gap-1',
                isActive
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Global Mobile FAB for Quick Add ─────────────────────────────── */}
      <button
        onClick={() => navigate('/dashboard?action=quick-add')}
        className="lg:hidden fixed bottom-24 right-5 z-40 h-14 w-14 rounded-full bg-[var(--accent)] text-white shadow-xl shadow-[var(--accent)]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        aria-label="Quick Add Expense"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

    </div>
  );
};

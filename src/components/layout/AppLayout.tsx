import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Menu, LayoutDashboard, ArrowLeftRight, Sparkles, Settings, CreditCard, User } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const BOTTOM_NAV = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Home'      },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'Expenses'  },
  { to: '/fixed-expenses', icon: CreditCard,       label: 'Fixed Expenses'  },
  { to: '/insights',      icon: Sparkles,        label: 'Insights'  },
  { to: '/settings',      icon: Settings,        label: 'Settings'  },
];

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);

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
            <Outlet />
          </div>
        </div>
      </main>

      {/* ── Mobile bottom nav ─────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border)] safe-area-pb w-full">
        {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-0 py-2 px-1 text-[10px] font-medium transition-colors min-w-0',
                isActive
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

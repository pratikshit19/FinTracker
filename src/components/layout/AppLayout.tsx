import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Menu, LayoutDashboard, ArrowLeftRight, Sparkles, Settings } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

const BOTTOM_NAV = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Home'      },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'Expenses'  },
  { to: '/insights',      icon: Sparkles,        label: 'Insights'  },
  { to: '/settings',      icon: Settings,        label: 'Settings'  },
];

export const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 lg:ml-56 min-h-screen flex flex-col">

        {/* ── Mobile top bar ─────────────────────────────── */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3.5 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border)]">
          <button
            id="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            className="h-8 w-8 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-[var(--accent)] flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">F</span>
            </div>
            <span className="font-semibold text-sm tracking-tight text-[var(--text-primary)]">Fintrack</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 pb-24 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ── Mobile bottom nav ─────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border)] safe-area-pb">
        {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 text-[10px] font-medium transition-colors',
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

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ArrowLeftRight, Sparkles, Settings, LogOut, TrendingUp, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/insights',      icon: Sparkles,         label: 'AI Insights' },
  { to: '/settings',      icon: Settings,         label: 'Settings'   },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-[var(--accent)] flex items-center justify-center shrink-0">
            <TrendingUp size={14} className="text-white" />
          </div>
          <span className="font-semibold text-[var(--text-primary)] tracking-tight">Fintrack</span>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm transition-all duration-150 group',
                isActive
                  ? 'text-[var(--text-primary)] bg-[var(--bg-hover)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-[var(--accent)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon
                  size={16}
                  className={cn(
                    'transition-colors',
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'
                  )}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[var(--border)]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-[var(--radius-sm)] text-sm text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--danger-subtle)] transition-all duration-150"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-56 flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] z-40">
        <SidebarContent />
      </aside>

      {/* ── Mobile drawer ───────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="lg:hidden fixed left-0 top-0 h-full w-64 flex flex-col bg-[var(--bg-surface)] border-r border-[var(--border)] z-50 shadow-[var(--shadow-lg)]"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

import { useState, useEffect } from 'react';
import {
  BrowserRouter, Routes, Route, Navigate
} from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { InsightsPage } from '@/pages/InsightsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { Spinner } from '@/components/ui/Spinner';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[var(--text-muted)]">Loading Fintrack…</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={session ? <Navigate to="/dashboard" replace /> : <AuthPage />}
        />

        {/* Protected */}
        {session ? (
          <Route element={<AppLayout />}>
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/insights"     element={<InsightsPage />} />
            <Route path="/settings"     element={<SettingsPage />} />
            <Route path="*"             element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

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
import { FixedExpensesPage } from '@/pages/FixedExpensesPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { Spinner } from '@/components/ui/Spinner';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { Onboarding } from '@/components/layout/Onboarding';
import { UpdatePasswordPage } from '@/pages/UpdatePasswordPage';
import { WealthCoachPage } from '@/pages/WealthCoachPage';


function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('fintrace_onboarded') !== 'true';
  });
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [authError, setAuthError] = useState<string>('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('fintrace_theme') || 'default';
    if (savedTheme !== 'default') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  useEffect(() => {
    // Get initial session
    const checkInitialSession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const errorDescription = hashParams.get('error_description');

      if (errorDescription) {
        console.log('[Auth] Error from redirect:', errorDescription);
        setAuthError(errorDescription.replace(/\+/g, ' '));
        window.history.replaceState(null, '', window.location.pathname);
        setLoading(false);
        return;
      }

      // Check if we have a fragment in the URL (typical for OAuth redirects)
      const hasAuthData = window.location.hash || window.location.search.includes('code=');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('[Auth] Session found immediately');
        setSession(session);
        setLoading(false);
      } else if (hasAuthData) {
        console.log('[Auth] Redirect detected, polling for session...');
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          const { data: { session: polledSession } } = await supabase.auth.getSession();
          if (polledSession) {
            console.log('[Auth] Polled session found!');
            setSession(polledSession);
            setLoading(false);
            clearInterval(interval);
          } else if (attempts > 20) { // Increased to 20 attempts
            console.log('[Auth] Polling timed out');
            setLoading(false);
            clearInterval(interval);
          }
        }, 500);
      } else {
        setLoading(false);
      }
    };

    checkInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Event:', event, session?.user?.email);
      setSession(session);
      if (event === 'SIGNED_IN') setLoading(false);
      if (event === 'INITIAL_SESSION' && session) setLoading(false);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (showOnboarding && !isPasswordRecovery) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  if (isPasswordRecovery) {
    return <UpdatePasswordPage onComplete={() => setIsPasswordRecovery(false)} />;
  }

  if (showSplash && !isPasswordRecovery) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[var(--text-muted)]">Checking Session…</p>
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
          element={session ? <Navigate to="/dashboard" replace /> : <AuthPage initialError={authError} />}
        />

        {/* Protected */}
        {session ? (
          <Route element={<AppLayout />}>
            <Route path="/dashboard"    element={<DashboardPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/budgets"      element={<BudgetsPage />} />
            <Route path="/fixed-expenses" element={<FixedExpensesPage />} />
            <Route path="/insights"     element={<InsightsPage />} />
            <Route path="/wealth-coach" element={<WealthCoachPage />} />
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

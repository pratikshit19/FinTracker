-- ============================================================
-- FinTrace — Complete Supabase Database Setup
-- Run this entire script once in the Supabase SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS + DROP POLICY IF EXISTS.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- 1. PROFILES
--    One row per auth user. Created automatically on signup
--    via the trigger below.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username        TEXT,
  avatar_url      TEXT,
  currency        TEXT        DEFAULT 'INR',
  monthly_income  NUMERIC(10,2) DEFAULT 0,
  savings_target  NUMERIC(10,2) DEFAULT 5000,
  min_leftover    NUMERIC(10,2) DEFAULT 2000,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile row (with username pre-filled from email) whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, currency, monthly_income)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), NULL, 'INR', 0)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────
-- 2. EXPENSES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.expenses (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT          NOT NULL,
  amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  category    TEXT          NOT NULL,
  date        DATE          NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ   DEFAULT NOW() NOT NULL
);


-- ─────────────────────────────────────────────────────────────
-- 3. BUDGETS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.budgets (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category      TEXT          NOT NULL,
  monthly_limit NUMERIC(10,2) NOT NULL DEFAULT 1 CHECK (monthly_limit > 0),
  created_at    TIMESTAMPTZ   DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, category)
);


-- ─────────────────────────────────────────────────────────────
-- 4. GOALS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.goals (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT          NOT NULL,
  target_amount         NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
  current_amount        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  monthly_contribution  NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (monthly_contribution >= 0),
  deadline              DATE,
  created_at            TIMESTAMPTZ   DEFAULT NOW() NOT NULL
);


-- ─────────────────────────────────────────────────────────────
-- 5. SUBSCRIPTIONS  (Fixed Expenses / SIPs / Recurring Payments)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT          NOT NULL,
  amount        NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  billing_cycle TEXT          NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly')),
  category      TEXT          NOT NULL DEFAULT 'Other',
  next_billing  DATE          NOT NULL,
  status        TEXT          NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused')),
  created_at    TIMESTAMPTZ   DEFAULT NOW() NOT NULL
);


-- ─────────────────────────────────────────────────────────────
-- 6. WISHLIST
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlist (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT          NOT NULL,
  amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  status      TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  TIMESTAMPTZ   DEFAULT NOW() NOT NULL
);


-- ─────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY (RLS)
--    Every table is locked down so users can only see/edit
--    their own rows. DROP POLICY IF EXISTS makes re-runs safe.
-- ─────────────────────────────────────────────────────────────

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expenses_select_own" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert_own" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update_own" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete_own" ON public.expenses;
CREATE POLICY "expenses_select_own" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "expenses_insert_own" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_update_own" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "expenses_delete_own" ON public.expenses FOR DELETE USING (auth.uid() = user_id);

-- budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "budgets_select_own" ON public.budgets;
DROP POLICY IF EXISTS "budgets_insert_own" ON public.budgets;
DROP POLICY IF EXISTS "budgets_update_own" ON public.budgets;
DROP POLICY IF EXISTS "budgets_delete_own" ON public.budgets;
CREATE POLICY "budgets_select_own" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert_own" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update_own" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "budgets_delete_own" ON public.budgets FOR DELETE USING (auth.uid() = user_id);

-- goals
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "goals_select_own" ON public.goals;
DROP POLICY IF EXISTS "goals_insert_own" ON public.goals;
DROP POLICY IF EXISTS "goals_update_own" ON public.goals;
DROP POLICY IF EXISTS "goals_delete_own" ON public.goals;
CREATE POLICY "goals_select_own" ON public.goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert_own" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update_own" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goals_delete_own" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own" ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subscriptions_update_own" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_delete_own" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

-- wishlist
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wishlist_select_own" ON public.wishlist;
DROP POLICY IF EXISTS "wishlist_insert_own" ON public.wishlist;
DROP POLICY IF EXISTS "wishlist_update_own" ON public.wishlist;
DROP POLICY IF EXISTS "wishlist_delete_own" ON public.wishlist;
CREATE POLICY "wishlist_select_own" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "wishlist_insert_own" ON public.wishlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wishlist_update_own" ON public.wishlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "wishlist_delete_own" ON public.wishlist FOR DELETE USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 8. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS expenses_user_date_idx       ON public.expenses      (user_id, date DESC);
CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx ON public.subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS budgets_user_category_idx    ON public.budgets       (user_id, category);
CREATE INDEX IF NOT EXISTS goals_user_created_idx       ON public.goals         (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wishlist_user_status_idx     ON public.wishlist      (user_id, status);


-- ─────────────────────────────────────────────────────────────
-- 9. STORAGE BUCKET  (for avatar image uploads)
--    Creates the "avatars" bucket as public so uploaded
--    profile pictures can be served without auth.
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_upload"        ON storage.objects;
DROP POLICY IF EXISTS "avatars_read"          ON storage.objects;
DROP POLICY IF EXISTS "avatars_update_delete" ON storage.objects;

-- Allow authenticated users to upload avatars
CREATE POLICY "avatars_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "avatars_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow users to update/delete their own uploads
CREATE POLICY "avatars_update_delete" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ─────────────────────────────────────────────────────────────
-- Done! All 6 tables, RLS policies, auto-profile trigger,
-- performance indexes, and storage bucket are configured.
-- You can safely delete supabase_schema.sql — this file
-- is the single source of truth.
-- ─────────────────────────────────────────────────────────────

-- ============================================================
-- FinTracker — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- 1. Create expenses table
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  amount      numeric(10,2) not null check (amount > 0),
  category    text not null,
  date        date not null,
  notes       text,
  created_at  timestamptz default now() not null
);

-- 2. Create subscriptions table (New!)
create table if not exists public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  name            text not null,
  amount          numeric(10,2) not null check (amount > 0),
  billing_cycle   text not null check (billing_cycle in ('monthly', 'yearly', 'weekly')),
  category        text not null, -- e.g., 'Entertainment', 'Gym', 'Cloud Storage'
  next_billing    date not null,
  status          text default 'active' check (status in ('active', 'cancelled', 'paused')),
  created_at      timestamptz default now() not null
);

-- 3. Create profiles table (Added monthly_income)
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text,
  avatar_url      text,
  currency        text default 'INR',
  monthly_income  numeric(10,2) default 0,
  updated_at      timestamptz default now()
);

-- 4. Create budgets table
create table if not exists public.budgets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  category        text not null,
  monthly_limit   numeric(10,2) not null check (monthly_limit > 0),
  created_at      timestamptz default now() not null,
  unique(user_id, category)
);

-- 5. Create goals table
create table if not exists public.goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  name            text not null,
  target_amount   numeric(10,2) not null check (target_amount > 0),
  current_amount  numeric(10,2) default 0 check (current_amount >= 0),
  monthly_contribution numeric(10,2) default 0 check (monthly_contribution >= 0),
  deadline        date,
  created_at      timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.expenses enable row level security;
alter table public.subscriptions enable row level security;
alter table public.profiles enable row level security;
alter table public.budgets enable row level security;
alter table public.goals enable row level security;

-- RLS Policies: Expenses
create policy "Users can view own expenses" on public.expenses for select using (auth.uid() = user_id);
create policy "Users can insert own expenses" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses" on public.expenses for update using (auth.uid() = user_id);
create policy "Users can delete own expenses" on public.expenses for delete using (auth.uid() = user_id);

-- RLS Policies: Subscriptions
create policy "Users can view own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can insert own subscriptions" on public.subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can update own subscriptions" on public.subscriptions for update using (auth.uid() = user_id);
create policy "Users can delete own subscriptions" on public.subscriptions for delete using (auth.uid() = user_id);

-- RLS Policies: Profiles
create policy "Users can view any profile" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- RLS Policies: Budgets
create policy "Users can view own budgets" on public.budgets for select using (auth.uid() = user_id);
create policy "Users can insert own budgets" on public.budgets for insert with check (auth.uid() = user_id);
create policy "Users can update own budgets" on public.budgets for update using (auth.uid() = user_id);
create policy "Users can delete own budgets" on public.budgets for delete using (auth.uid() = user_id);

-- RLS Policies: Goals
create policy "Users can view own goals" on public.goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.goals for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on public.goals for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on public.goals for delete using (auth.uid() = user_id);

-- Trigger: Automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url, currency, monthly_income)
  values (new.id, split_part(new.email, '@', 1), null, 'INR', 0);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes for performance
create index if not exists expenses_user_date_idx on public.expenses (user_id, date desc);
create index if not exists subscriptions_user_status_idx on public.subscriptions (user_id, status);
create index if not exists budgets_user_category_idx on public.budgets (user_id, category);
create index if not exists goals_user_created_idx on public.goals (user_id, created_at desc);

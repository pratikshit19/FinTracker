-- ============================================================
-- Fintrack — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Create expenses table
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

-- Enable Row Level Security
alter table public.expenses enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users can view own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- Index for faster queries by user + date
create index if not exists expenses_user_date_idx
  on public.expenses (user_id, date desc);

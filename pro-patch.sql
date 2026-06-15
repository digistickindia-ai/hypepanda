-- =====================================================
-- HypePanda — Creator Pro subscription patch
-- Run in Supabase SQL Editor (safe to re-run).
-- =====================================================

-- Pro status on profiles
alter table profiles add column if not exists is_pro boolean default false;
alter table profiles add column if not exists pro_until timestamptz;       -- 30-day pass expiry
alter table profiles add column if not exists profile_views int default 0; -- simple analytics

-- Profile view log (who viewed a creator) — for Pro analytics
create table if not exists profile_views_log (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id) on delete cascade,
  viewer_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);
alter table profile_views_log enable row level security;

drop policy if exists "creators see own views" on profile_views_log;
create policy "creators see own views" on profile_views_log for select to authenticated
  using (creator_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "anyone logs a view" on profile_views_log;
create policy "anyone logs a view" on profile_views_log for insert to authenticated with check (true);

-- Pro purchase records
create table if not exists pro_payments (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id) on delete cascade,
  amount int,
  cf_order_id text,
  status text default 'created',  -- created | paid | failed
  created_at timestamptz default now()
);
alter table pro_payments enable row level security;

drop policy if exists "creators see own pro payments" on pro_payments;
create policy "creators see own pro payments" on pro_payments for select to authenticated
  using (creator_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "creators insert own pro payments" on pro_payments;
create policy "creators insert own pro payments" on pro_payments for insert to authenticated with check (creator_id = auth.uid());

drop policy if exists "creators update own pro payments" on pro_payments;
create policy "creators update own pro payments" on pro_payments for update to authenticated using (creator_id = auth.uid());

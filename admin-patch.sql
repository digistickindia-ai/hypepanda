-- =====================================================
-- HypePanda — Admin panel patch
-- Run this in Supabase SQL Editor (safe to re-run).
-- =====================================================

-- 1) Suspended flag for users
alter table profiles add column if not exists suspended boolean default false;

-- 2) Admins can update ANY profile (to suspend/verify users)
drop policy if exists "admins update any profile" on profiles;
create policy "admins update any profile" on profiles for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- 3) Admins can delete deals (cancel/remove)
drop policy if exists "admins delete deals" on deals;
create policy "admins delete deals" on deals for delete to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- profiles are already readable by all authenticated users (existing policy),
-- so admins can already SEE every profile. Good.

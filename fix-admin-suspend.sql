-- ===== Fix: admin suspend / update-any-profile not taking effect =====
-- Run in Supabase SQL Editor. The previous admin update policy was missing a
-- WITH CHECK clause, so updates to other users' profiles (like suspend) could
-- be silently blocked. This recreates it with both USING and WITH CHECK.

drop policy if exists "admins update any profile" on profiles;
create policy "admins update any profile" on profiles for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- Make sure the suspended column exists (safe to re-run).
alter table profiles add column if not exists suspended boolean default false;

-- ===== Creator Instagram verification workflow =====
-- Run this in Supabase SQL Editor.

alter table profiles add column if not exists verification_status text default 'none';
-- values: 'none' (not submitted) | 'pending' (awaiting admin) | 'verified' | 'rejected'

alter table profiles add column if not exists instagram_url text;
-- the full link the creator submits, e.g. https://instagram.com/handle

alter table profiles add column if not exists email text;
-- stored so admin can email the creator on verification (auth.users email isn't directly joinable from client)

-- Backfill existing emails from auth.users
update profiles p set email = u.email from auth.users u where p.id = u.id and p.email is null;

-- ===== FIX: admin update policy needs WITH CHECK =====
-- Without "with check", admin updates to OTHER users' profiles silently fail
-- (the row passes "using" but fails the implicit check), so Verify did nothing.
drop policy if exists "admins update any profile" on profiles;
create policy "admins update any profile" on profiles for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- Existing connected accounts (if any) should count as verified
update profiles set verification_status = 'verified' where instagram_connected = true and (verification_status is null or verification_status = 'none');

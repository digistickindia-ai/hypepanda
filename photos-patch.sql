-- =====================================================
-- HypePanda — Creator profile photos patch
-- Run in Supabase SQL Editor (safe to re-run).
-- Photos show on the creator's own profile grid (no approval needed).
-- =====================================================

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id) on delete cascade,
  photo_url text,
  storage_path text,
  created_at timestamptz default now()
);

alter table photos enable row level security;

drop policy if exists "photos readable by authed" on photos;
create policy "photos readable by authed" on photos for select to authenticated using (true);

drop policy if exists "creators manage own photos" on photos;
create policy "creators manage own photos" on photos for insert to authenticated with check (creator_id = auth.uid());

drop policy if exists "creators delete own photos" on photos;
create policy "creators delete own photos" on photos for delete to authenticated
  using (creator_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

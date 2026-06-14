-- =====================================================
-- HypePanda — Showcase / portfolio videos patch
-- Run in Supabase SQL Editor (safe to re-run).
-- =====================================================

-- 1) Portfolio videos table
create table if not exists portfolio (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id) on delete cascade,
  video_url text,                 -- public URL from Supabase Storage
  storage_path text,              -- path inside the bucket (for deletes)
  caption text,
  status text default 'pending',  -- pending | approved | rejected
  created_at timestamptz default now()
);

alter table portfolio enable row level security;

-- Creators see + manage their own videos
drop policy if exists "creators see own portfolio" on portfolio;
create policy "creators see own portfolio" on portfolio for select to authenticated
  using (
    creator_id = auth.uid()
    or status = 'approved'                                   -- anyone signed in can see APPROVED work
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)  -- admins see all
  );

drop policy if exists "creators insert own portfolio" on portfolio;
create policy "creators insert own portfolio" on portfolio for insert to authenticated
  with check (creator_id = auth.uid());

drop policy if exists "creators delete own portfolio" on portfolio;
create policy "creators delete own portfolio" on portfolio for delete to authenticated
  using (creator_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- Admins approve/reject (update)
drop policy if exists "admins update portfolio" on portfolio;
create policy "admins update portfolio" on portfolio for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- 2) Track that a creator has submitted their required showcase
alter table profiles add column if not exists showcase_done boolean default false;

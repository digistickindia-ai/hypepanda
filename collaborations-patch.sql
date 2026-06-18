-- ===== Managed model: collaborations (Digistick coordinates everything) =====
-- Run in Supabase SQL Editor (safe to re-run).
-- Brands request a collaboration with a creator; the HypePanda team coordinates
-- everything. Payment is handled OFFLINE; the app only tracks status.

create table if not exists collaborations (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references profiles(id) on delete cascade,     -- the business/agency who requested
  creator_id uuid references profiles(id) on delete cascade,   -- the requested creator
  brief text,                                                  -- what the brand wants (optional note)
  status text default 'requested',                             -- requested | in_progress | completed | cancelled
  payment_status text default 'pending',                       -- pending | paid (tracked manually by team, offline)
  amount int,                                                  -- agreed amount, filled by team (INR, optional)
  team_notes text,                                             -- internal notes (admin only)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table collaborations enable row level security;

-- Brand and creator can each see collaborations they're part of; admin sees all
drop policy if exists "see own collaborations" on collaborations;
create policy "see own collaborations" on collaborations for select to authenticated
  using (
    brand_id = auth.uid()
    or creator_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

-- Brand can create a collaboration request
drop policy if exists "brand requests collaboration" on collaborations;
create policy "brand requests collaboration" on collaborations for insert to authenticated
  with check (brand_id = auth.uid());

-- Only admin (team) can update status / payment / notes / amount
drop policy if exists "admin updates collaborations" on collaborations;
create policy "admin updates collaborations" on collaborations for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

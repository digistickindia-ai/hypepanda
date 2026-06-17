-- ===== Business + Agency onboarding & multi-brand model =====
-- Run in Supabase SQL Editor (safe to re-run).

-- ---- Business / brand profile fields ----
alter table profiles add column if not exists category text;          -- what they sell (e.g. Skincare, Apparel)
alter table profiles add column if not exists website text;
alter table profiles add column if not exists instagram_handle_biz text;
alter table profiles add column if not exists audience_age text;       -- e.g. "18-24", "25-34"
alter table profiles add column if not exists audience_gender text;    -- "all" | "women" | "men"
alter table profiles add column if not exists audience_cities text;    -- comma list
alter table profiles add column if not exists target_niches text;      -- comma list of creator niches they want

-- ---- Agency profile fields ----
alter table profiles add column if not exists team_size text;          -- "1-5", "6-20", "20+"
alter table profiles add column if not exists verticals text;          -- comma list of categories they work across

-- ---- Client brands (an agency HAS many brands) ----
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid references profiles(id) on delete cascade,
  name text not null,
  category text,
  website text,
  instagram_handle text,
  created_at timestamptz default now()
);

alter table brands enable row level security;

drop policy if exists "agency reads own brands" on brands;
create policy "agency reads own brands" on brands for select to authenticated
  using (agency_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "agency inserts own brands" on brands;
create policy "agency inserts own brands" on brands for insert to authenticated
  with check (agency_id = auth.uid());

drop policy if exists "agency updates own brands" on brands;
create policy "agency updates own brands" on brands for update to authenticated
  using (agency_id = auth.uid()) with check (agency_id = auth.uid());

drop policy if exists "agency deletes own brands" on brands;
create policy "agency deletes own brands" on brands for delete to authenticated
  using (agency_id = auth.uid());

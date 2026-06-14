-- =====================================================
-- HypePanda — Database setup
-- Paste ALL of this into Supabase -> SQL Editor -> New query -> Run
-- =====================================================

-- 1) The profiles table: one row per signed-in user.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text default 'creator',              -- creator | business | agency
  full_name text,
  username text unique,
  bio text,
  city text,
  niche text,                               -- e.g. Beauty, Fashion, Food
  instagram_handle text,
  instagram_connected boolean default false,
  followers int,                            -- pulled from Instagram later
  rate_per_post int,                        -- creator's asking rate in INR
  avatar_url text,
  onboarding_done boolean default false,
  created_at timestamptz default now()
);

-- 2) Turn on Row Level Security (each user only touches their own row).
alter table profiles enable row level security;

-- Anyone signed in can READ profiles (needed so businesses can browse creators).
create policy "profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

-- A user can INSERT only their own row.
create policy "users can insert own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- A user can UPDATE only their own row.
create policy "users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- 3) Auto-create a blank profile the moment someone signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Done. Your database is ready for HypePanda.

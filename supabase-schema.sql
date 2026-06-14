-- =====================================================
-- HypePanda — Full marketplace database
-- Paste ALL of this into Supabase -> SQL Editor -> Run.
-- Safe to run more than once.
-- =====================================================

-- ---------- PROFILES (creators, businesses, agencies) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text default 'creator',              -- creator | business | agency
  full_name text,
  username text unique,
  bio text,
  city text,
  -- creator fields
  niche text,
  instagram_handle text,
  instagram_connected boolean default false,
  instagram_user_id text,
  followers int,
  engagement_rate numeric,
  rate_per_post int,
  avatar_url text,
  -- business fields
  company_name text,
  -- shared
  is_admin boolean default false,
  onboarding_done boolean default false,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

drop policy if exists "profiles readable by authed" on profiles;
create policy "profiles readable by authed" on profiles for select to authenticated using (true);

drop policy if exists "users insert own profile" on profiles;
create policy "users insert own profile" on profiles for insert to authenticated with check (auth.uid() = id);

drop policy if exists "users update own profile" on profiles;
create policy "users update own profile" on profiles for update to authenticated using (auth.uid() = id);

-- ---------- DEALS (collab offers) ----------
create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references profiles(id) on delete cascade,
  creator_id uuid references profiles(id) on delete cascade,
  title text,
  brief text,
  amount int,                               -- gross: what the business pays (INR)
  commission_pct int default 10,            -- HypePanda's cut (%)
  payout_amount int,                        -- what the creator receives (amount - commission)
  status text default 'pending',            -- pending|accepted|declined|paid|in_progress|delivered|completed|cancelled
  payment_status text default 'unpaid',     -- unpaid|secured|paid_out
  cashfree_order_id text,
  paid_out_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table deals enable row level security;

drop policy if exists "deals visible to parties" on deals;
create policy "deals visible to parties" on deals for select to authenticated
  using (
    auth.uid() = business_id
    or auth.uid() = creator_id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true)
  );

drop policy if exists "admins update any deal" on deals;
create policy "admins update any deal" on deals for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "business creates deals" on deals;
create policy "business creates deals" on deals for insert to authenticated
  with check (auth.uid() = business_id);

drop policy if exists "parties update deals" on deals;
create policy "parties update deals" on deals for update to authenticated
  using (auth.uid() = business_id or auth.uid() = creator_id);

-- ---------- MESSAGES ----------
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references deals(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  body text,
  created_at timestamptz default now()
);

alter table messages enable row level security;

drop policy if exists "messages visible to deal parties" on messages;
create policy "messages visible to deal parties" on messages for select to authenticated
  using (exists (select 1 from deals d where d.id = deal_id and (d.business_id = auth.uid() or d.creator_id = auth.uid())));

drop policy if exists "deal parties send messages" on messages;
create policy "deal parties send messages" on messages for insert to authenticated
  with check (sender_id = auth.uid() and exists (select 1 from deals d where d.id = deal_id and (d.business_id = auth.uid() or d.creator_id = auth.uid())));

-- ---------- NOTIFICATIONS ----------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  kind text,                                -- offer|accepted|message|payment
  text text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

drop policy if exists "users see own notifications" on notifications;
create policy "users see own notifications" on notifications for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "users update own notifications" on notifications;
create policy "users update own notifications" on notifications for update to authenticated
  using (user_id = auth.uid());

drop policy if exists "authed insert notifications" on notifications;
create policy "authed insert notifications" on notifications for insert to authenticated
  with check (true);

-- ---------- auto-create profile on signup ----------
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

-- ---------- realtime for messages + notifications ----------
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table deals;

-- =====================================================
-- MAKE YOURSELF ADMIN (run after you've signed in once)
-- Replace the email with the Google account you log in with.
-- =====================================================
-- update profiles set is_admin = true
-- where id = (select id from auth.users where email = 'you@gmail.com');

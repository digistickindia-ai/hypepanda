-- ===== Team-mediated messaging (HypePanda team ↔ each user) =====
-- Run in Supabase SQL Editor (safe to re-run).
-- No brand↔creator direct messages. Every message is between a user and the
-- HypePanda team, optionally tied to a collaboration.

create table if not exists team_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,   -- the brand or creator in this thread
  collab_id uuid references collaborations(id) on delete set null, -- optional link to a collaboration
  from_team boolean default false,                          -- true = sent by HypePanda team (admin)
  body text not null,
  read_by_user boolean default false,                       -- has the user seen team's message
  read_by_team boolean default false,                       -- has the team seen the user's message
  created_at timestamptz default now()
);

create index if not exists team_messages_user_idx on team_messages(user_id, created_at);
create index if not exists team_messages_collab_idx on team_messages(collab_id, created_at);

alter table team_messages enable row level security;

-- A user sees only their own thread; admins see everything.
drop policy if exists "user reads own thread" on team_messages;
create policy "user reads own thread" on team_messages for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- A user can send a message into their own thread (from_team must be false).
drop policy if exists "user sends to team" on team_messages;
create policy "user sends to team" on team_messages for insert to authenticated
  with check (user_id = auth.uid() and from_team = false);

-- Admin (team) can insert into any thread.
drop policy if exists "team sends to user" on team_messages;
create policy "team sends to user" on team_messages for insert to authenticated
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

-- Both user and admin can update read flags.
drop policy if exists "update read flags" on team_messages;
create policy "update read flags" on team_messages for update to authenticated
  using (user_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true))
  with check (user_id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin = true));

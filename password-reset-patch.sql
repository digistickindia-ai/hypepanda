-- ===== Password reset via link (sent through Resend API) =====
-- Run in Supabase SQL Editor (safe to re-run).

create table if not exists password_resets (
  token uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  email text,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '1 hour'),
  used boolean default false
);

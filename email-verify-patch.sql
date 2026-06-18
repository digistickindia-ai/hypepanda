-- ===== Email verification via link (sent through Brevo API) =====
-- Run in Supabase SQL Editor (safe to re-run).

alter table profiles add column if not exists email_verified boolean default false;

-- Tokens for the verification links. The link carries the token; visiting the
-- verify page marks the matching profile email_verified = true.
create table if not exists email_verifications (
  token uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  email text,
  created_at timestamptz default now(),
  used boolean default false
);

-- Existing Google-login users have already proven their email, so mark verified.
update profiles set email_verified = true
where (email_verified is null or email_verified = false)
  and id in (select id from auth.users where confirmed_at is not null);

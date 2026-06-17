-- ===== Profile picture + phone =====
-- Run in Supabase SQL Editor (safe to re-run).

alter table profiles add column if not exists avatar_url text;  -- (may already exist)
alter table profiles add column if not exists phone text;

-- Profile photos reuse the existing public "showcase" storage bucket
-- under avatars/{userId}.  No new bucket needed.

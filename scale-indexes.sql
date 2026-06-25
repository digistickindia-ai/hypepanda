-- ===== Scale: performance indexes (safe / skips missing tables) =====
-- Run in Supabase SQL Editor (safe to re-run). Each index is wrapped so that
-- if a table or column doesn't exist in this database, it's skipped instead of erroring.

do $$
declare
  stmts text[] := array[
    'create index if not exists profiles_role_idx on profiles(role)',
    'create index if not exists profiles_is_admin_idx on profiles(is_admin) where is_admin = true',
    'create index if not exists profiles_created_idx on profiles(created_at desc)',
    'create index if not exists collab_brand_idx on collaborations(brand_id, updated_at desc)',
    'create index if not exists collab_creator_idx on collaborations(creator_id, updated_at desc)',
    'create index if not exists collab_status_idx on collaborations(status)',
    'create index if not exists collab_updated_idx on collaborations(updated_at desc)',
    'create index if not exists notif_user_idx on notifications(user_id, created_at desc)',
    'create index if not exists team_msg_unread_idx on team_messages(read_by_team) where read_by_team = false and from_team = false',
    'create index if not exists team_msg_created_idx on team_messages(created_at desc)',
    'create index if not exists team_msg_user_created_idx on team_messages(user_id, created_at desc)',
    'create index if not exists portfolio_creator_idx on portfolio(creator_id)',
    'create index if not exists portfolio_status_idx on portfolio(status)',
    'create index if not exists photos_creator_idx on photos(creator_id)',
    'create index if not exists pro_pay_user_idx on pro_payments(user_id)',
    'create index if not exists pviews_creator_idx on profile_views_log(creator_id)',
    'create index if not exists deals_status_idx on deals(status)',
    'create index if not exists deals_business_idx on deals(business_id)',
    'create index if not exists deals_creator_idx on deals(creator_id)'
  ];
  s text;
begin
  foreach s in array stmts loop
    begin
      execute s;
    exception
      when undefined_table then raise notice 'skipped (table missing): %', s;
      when undefined_column then raise notice 'skipped (column missing): %', s;
    end;
  end loop;
end $$;

-- ===== Admin message threads function (paginated inbox) =====
create or replace function admin_message_threads(limit_n int default 30, offset_n int default 0)
returns table (
  user_id uuid,
  last_body text,
  last_from_team boolean,
  last_at timestamptz,
  unread int
)
language sql
security definer
as $$
  with threads as (
    select distinct on (tm.user_id)
      tm.user_id, tm.body as last_body, tm.from_team as last_from_team, tm.created_at as last_at
    from team_messages tm
    order by tm.user_id, tm.created_at desc
  ),
  counts as (
    select user_id, count(*)::int as unread
    from team_messages
    where from_team = false and read_by_team = false
    group by user_id
  )
  select t.user_id, t.last_body, t.last_from_team, t.last_at,
         coalesce(c.unread, 0) as unread
  from threads t
  left join counts c on c.user_id = t.user_id
  order by t.last_at desc
  limit limit_n offset offset_n;
$$;

revoke all on function admin_message_threads(int, int) from public;
grant execute on function admin_message_threads(int, int) to authenticated;

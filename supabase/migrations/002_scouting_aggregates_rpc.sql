-- 002_scouting_aggregates_rpc.sql
-- Scout question: "Across these games, what did each player do?"
-- One set-based query returns per-player event totals, optionally narrowed to
-- one game or a date range, so the browser never sums event lists itself.

create or replace function public.player_event_totals(
  p_game_id text default null,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  player_id text,
  full_name text,
  jersey_number smallint,
  "position" text,
  games_scouted bigint,
  goals bigint,
  assists bigint,
  shots bigint,
  hits bigint,
  takeaways bigint,
  giveaways bigint,
  saves bigint,
  penalties bigint,
  total_events bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id,
    p.full_name,
    p.jersey_number,
    p.position,
    count(distinct e.game_id),
    count(*) filter (where e.event_type = 'goal'),
    count(*) filter (where e.event_type = 'assist'),
    count(*) filter (where e.event_type = 'shot'),
    count(*) filter (where e.event_type = 'hit'),
    count(*) filter (where e.event_type = 'takeaway'),
    count(*) filter (where e.event_type = 'giveaway'),
    count(*) filter (where e.event_type = 'save'),
    count(*) filter (where e.event_type = 'penalty'),
    count(*)
  from public.scouting_events e
  join public.players p on p.id = e.player_id
  join public.games g on g.id = e.game_id
  where (p_game_id is null or e.game_id = p_game_id)
    and (p_from is null or g.played_at >= p_from)
    and (p_to is null or g.played_at < p_to)
  group by p.id, p.full_name, p.jersey_number, p.position
  order by count(*) filter (where e.event_type = 'goal') desc,
           count(*) filter (where e.event_type = 'assist') desc,
           p.full_name;
$$;

comment on function public.player_event_totals(text, timestamptz, timestamptz) is
  'Per-player scouting event totals, optionally for one game or a played_at range [p_from, p_to).';

-- Functions are executable by PUBLIC by default; limit to the roles the app uses.
-- security invoker means callers still need table access (RLS applies in Sprint 4).
revoke execute on function public.player_event_totals(text, timestamptz, timestamptz) from public, anon;
grant execute on function public.player_event_totals(text, timestamptz, timestamptz) to service_role, authenticated;

-- 20250321000000_hockey_staff_rls.sql
-- Per-role row-level security for hockey staff, implementing
-- docs/security/rls-policy-spec.md. Section names in comments match the spec.
-- Default deny: RLS stays on for every table; only the allows below exist.

-- ---------------------------------------------------------------------------
-- Identity linkage: caller's staff role from staff_members (never from the client)
-- ---------------------------------------------------------------------------
create or replace function public.current_staff_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select sm.role from public.staff_members sm where sm.user_id = (select auth.uid())
$$;

comment on function public.current_staff_role() is
  'Role of the signed-in staff member (coaching | scouting | medical), or null. Used by every RLS policy.';

revoke execute on function public.current_staff_role() from public, anon;
grant execute on function public.current_staff_role() to authenticated;

-- ---------------------------------------------------------------------------
-- New table: player_health_notes (spec: medical / sports-science records)
-- ---------------------------------------------------------------------------
create table public.player_health_notes (
  id uuid primary key default gen_random_uuid(),
  player_id text not null references public.players (id) on delete restrict,
  recorded_on date not null default current_date,
  category text not null
    constraint player_health_notes_category_valid check (category in ('wellness', 'injury', 'load', 'return_to_play')),
  availability text not null default 'available'
    constraint player_health_notes_availability_valid check (availability in ('available', 'limited', 'out')),
  notes text,
  recorded_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index player_health_notes_player_id_idx on public.player_health_notes (player_id);

alter table public.player_health_notes enable row level security;

-- ---------------------------------------------------------------------------
-- Table: players and games (spec: SELECT for all staff roles; no writes)
-- ---------------------------------------------------------------------------
alter table public.players enable row level security;
alter table public.games enable row level security;

create policy players_select_staff on public.players
  for select to authenticated
  using ((select public.current_staff_role()) in ('coaching', 'scouting', 'medical'));

create policy games_select_staff on public.games
  for select to authenticated
  using ((select public.current_staff_role()) in ('coaching', 'scouting', 'medical'));

-- ---------------------------------------------------------------------------
-- Table: scouting_events (spec: coaching + scouting read; scouting writes; medical denied)
-- ---------------------------------------------------------------------------
alter table public.scouting_events enable row level security;

create policy scouting_events_select_coaching_scouting on public.scouting_events
  for select to authenticated
  using ((select public.current_staff_role()) in ('coaching', 'scouting'));

create policy scouting_events_insert_scouting on public.scouting_events
  for insert to authenticated
  with check ((select public.current_staff_role()) = 'scouting');

create policy scouting_events_update_scouting on public.scouting_events
  for update to authenticated
  using ((select public.current_staff_role()) = 'scouting')
  with check ((select public.current_staff_role()) = 'scouting');
-- No DELETE policy: scouting history is kept (spec).

-- ---------------------------------------------------------------------------
-- Table: player_health_notes (spec: medical only; no exceptions for coaching/scouting)
-- ---------------------------------------------------------------------------
create policy player_health_notes_select_medical on public.player_health_notes
  for select to authenticated
  using ((select public.current_staff_role()) = 'medical');

create policy player_health_notes_insert_medical on public.player_health_notes
  for insert to authenticated
  with check ((select public.current_staff_role()) = 'medical' and recorded_by = (select auth.uid()));

create policy player_health_notes_update_medical on public.player_health_notes
  for update to authenticated
  using ((select public.current_staff_role()) = 'medical')
  with check ((select public.current_staff_role()) = 'medical' and recorded_by = (select auth.uid()));
-- No DELETE policy (spec).

-- ---------------------------------------------------------------------------
-- Cross-cutting rule 4: grants follow policies. anon gets nothing.
-- ---------------------------------------------------------------------------
revoke all on public.players, public.games, public.scouting_events, public.player_health_notes from anon;
grant select on public.players, public.games, public.scouting_events, public.player_health_notes to authenticated;
grant insert, update on public.scouting_events, public.player_health_notes to authenticated;
grant select, insert, update, delete on public.player_health_notes to service_role;

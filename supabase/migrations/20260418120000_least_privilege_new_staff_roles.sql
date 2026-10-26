-- 20260418120000_least_privilege_new_staff_roles.sql
-- Adds the assistant scout and video analyst with least privilege.
--
-- Contract: docs/access/access-matrix-v2.md
-- Findings: docs/access/overgrant-audit.md (marks 3 and 4)
-- Key rule: docs/access/service-role-key-rule.md (no staff path uses the service role;
--           this file grants nothing to service_role beyond what already exists)
--
-- Touches: public.staff_members (role values), public.players, public.games,
--          public.scouting_events (policies), new view public.scouting_player_board.
-- Does not touch: public.player_health_notes. Its medical-only policies stay as they are,
--          so medical records and sports-science data (category, availability, notes)
--          remain sealed from both new roles.
-- Medical-flag columns deliberately absent from the shared view:
--          player_health_notes.availability, player_health_notes.category, player_health_notes.notes.
--
-- Role labels reuse the existing staff_members.role system: 'assistant_scout', 'video_analyst'.

-- ---------------------------------------------------------------------------
-- Role values (audit mark 4): allow the two new job labels, nothing else.
-- ---------------------------------------------------------------------------
alter table public.staff_members drop constraint staff_members_role_valid;
alter table public.staff_members add constraint staff_members_role_valid
  check (role in ('coaching', 'scouting', 'medical', 'assistant_scout', 'video_analyst'));

-- ---------------------------------------------------------------------------
-- Game data: roster and schedule (matrix: See only for all five roles)
-- ---------------------------------------------------------------------------
-- Allow: coaching, scouting, medical (unchanged), assistant scout, video analyst may SEE players.
drop policy players_select_staff on public.players;
create policy players_select_staff on public.players
  for select to authenticated
  using ((select public.current_staff_role()) in ('coaching', 'scouting', 'medical', 'assistant_scout', 'video_analyst'));

-- Allow: same five roles may SEE games. No role may write players or games.
drop policy games_select_staff on public.games;
create policy games_select_staff on public.games
  for select to authenticated
  using ((select public.current_staff_role()) in ('coaching', 'scouting', 'medical', 'assistant_scout', 'video_analyst'));

-- ---------------------------------------------------------------------------
-- Scouting notes (scouting_events)
-- ---------------------------------------------------------------------------
-- Allow: coaching, scouting (unchanged), assistant scout, video analyst may SEE scouting events.
-- Deny: medical (no clause), unchanged.
drop policy scouting_events_select_coaching_scouting on public.scouting_events;
create policy scouting_events_select_scouting_staff on public.scouting_events
  for select to authenticated
  using ((select public.current_staff_role()) in ('coaching', 'scouting', 'assistant_scout', 'video_analyst'));

-- Allow: scouting (unchanged) and assistant scout may ADD new scouting events.
-- Deny: video analyst, coaching, medical may not add.
drop policy scouting_events_insert_scouting on public.scouting_events;
create policy scouting_events_insert_scouting_staff on public.scouting_events
  for insert to authenticated
  with check ((select public.current_staff_role()) in ('scouting', 'assistant_scout'));

-- Edit stays scouting-only (scouting_events_update_scouting, unchanged): the assistant
-- scout may add but not edit, and the video analyst may neither. No delete policy exists.

-- ---------------------------------------------------------------------------
-- Shared scouting view (matrix shared-view rule; audit mark 3)
-- ---------------------------------------------------------------------------
-- One row per active player with scouting activity counts. Columns are listed by name and
-- include no medical or sports-science column. security_invoker = true makes it run with the
-- viewer's own rights, so the RLS policies above still decide which rows each role sees.
create view public.scouting_player_board
with (security_invoker = true)
as
select
  p.id,
  p.full_name,
  p.jersey_number,
  p.position,
  count(e.id) as event_count,
  count(distinct e.game_id) as games_scouted,
  max(g.played_at) as last_scouted_at
from public.players p
left join public.scouting_events e on e.player_id = p.id
left join public.games g on g.id = e.game_id
where p.is_active
group by p.id, p.full_name, p.jersey_number, p.position;

comment on view public.scouting_player_board is
  'Shared scouting board: roster plus scouting activity counts. No medical flags. Runs as the caller (security_invoker).';

-- Allow: signed-in staff may SELECT the view; rows still pass through each table's RLS.
-- Deny: anon and PUBLIC get nothing.
revoke all on public.scouting_player_board from public, anon;
grant select on public.scouting_player_board to authenticated;

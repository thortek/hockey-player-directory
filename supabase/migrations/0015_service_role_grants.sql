-- 0015_service_role_grants.sql
-- New Supabase projects no longer auto-grant table privileges to API roles.
-- The server's secret key (service_role) needs them to read and write the
-- scouting tables. anon and authenticated stay ungranted until Sprint 4 adds
-- per-role RLS policies.

grant select, insert, update, delete
  on public.players, public.games, public.scouting_events
  to service_role;

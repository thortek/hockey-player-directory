# Over-grant audit — before adding the assistant scout and video analyst

Judged against `docs/access/new-roles-brief.md`. This is an inventory of existing access and where it is wider than a job needs. It does **not** rebuild staff sign-in, the server session checks, or the existing row-level security policies, does not decide service-key use (that is `docs/access/service-role-key-rule.md`), and adds no policy text.

Roles judged: coaching, scouting, medical (existing), assistant scout and video analyst (new; not yet in the database: `staff_members.role` only accepts the three existing values, so today any account given either new job would match no policy and see nothing).

Sources read: `supabase/migrations/001_scouting_schema.sql`, `0015_service_role_grants.sql`, `002_scouting_aggregates_rpc.sql`, `003_staff_members.sql`, `20250321000000_hockey_staff_rls.sql`; everything under `src/server/`, `src/routes/`, `src/lib/`.

## Raw inventory

### Tables and columns

| Table | Columns | Defined in | Who can reach it today |
|---|---|---|---|
| `players` | id, full_name, jersey_number, position, team_name, is_active, created_at, updated_at | `001_scouting_schema.sql` | Read: coaching, scouting, medical (`players_select_staff`). Write: service role only. anon: none |
| `games` | id, played_at, opponent, is_home, venue, status, created_at | `001_scouting_schema.sql` | Read: coaching, scouting, medical (`games_select_staff`). Write: service role only |
| `scouting_events` | id, player_id, game_id, event_type, period, clock_seconds, notes, created_at, updated_at | `001_scouting_schema.sql` | Read: coaching, scouting (`scouting_events_select_coaching_scouting`). Insert/update: scouting. Delete: none. Medical: none |
| `player_health_notes` | id, player_id, recorded_on, category (wellness, injury, load, return_to_play), availability (available, limited, out), notes, recorded_by, created_at, updated_at | `20250321000000_hockey_staff_rls.sql` | Read/insert/update: medical only. Delete: none |
| `staff_members` | user_id, role, display_name, created_at | `003_staff_members.sql` | Read own row: any signed-in user. Write: service role only |

### Database views

None found. Searched `supabase/migrations/*.sql` for `create view` / `create or replace view`; no matches.

### Database functions

| Function | Defined in | Runs as | Who can execute |
|---|---|---|---|
| `player_event_totals(p_game_id, p_from, p_to)` | `002_scouting_aggregates_rpc.sql` | caller (`security invoker`), so RLS on `scouting_events` applies | authenticated, service_role (not anon). Medical gets an empty result |
| `current_staff_role()` | `20250321000000_hockey_staff_rls.sql` | owner (`security definer`), reads only the caller's own `staff_members.role` | authenticated |

### Server functions

| Server function | File | Who can reach it | Data client |
|---|---|---|---|
| `getPlayers`, `getPlayer`, `getGames`, `getDirectorySummary` | `src/server/directory.ts` | Anyone, signed in or not | **Service role** (secret key), reads `players` and `games` only |
| `fetchPlayers`, `fetchPlayer`, `fetchGames`, `fetchGame`, `fetchScoutingEvents`, `fetchPlayerEventTotals` | `src/server/scouting.ts` | Signed-in staff (`requireSession()`); rows filtered by RLS | Caller's own client |
| `runScoutingMutation` | `src/server/scouting-mutations.ts` | Signed-in staff; RLS allows only scouting to write events; player/game writes match no policy | Caller's own client |
| `getScoutingNotes`, `getHealthNotes` | `src/server/scouting-notes.ts` | Signed-in staff; RLS filters | Caller's own client |
| `getCurrentStaff` | `src/server/get-current-staff.ts` | Signed-in staff | Caller's own client |

### Shared screens and routes

| Route | File | Who can open it | Medical flags on it? |
|---|---|---|---|
| `/`, `/players`, `/players/$playerId`, `/games` | `src/routes/index.tsx`, `src/routes/players/*`, `src/routes/games/index.tsx` | Anyone | No. Searched for `availability`, `injur`, `health`: no matches |
| `/scouting` (staff overview) | `src/routes/scouting/index.tsx` | Any signed-in staff | **Yes, by design for medical**: the "Medical and sports-science notes" section renders `availability` and `category` from `getHealthNotes`. Non-medical staff get an empty list from RLS, but the section heading is visible to every role |
| `/scouting/players`, `/scouting/events`, `/scouting/aggregates` | `src/routes/scouting/*.tsx` | Any signed-in staff | No medical columns. Searched the same words: no matches |

## Medical and sports-science data

| Hit | Who can | Who must not |
|---|---|---|
| `player_health_notes` (all columns, including `availability` and `category = 'load'` for sports-science) | Medical staff can read and write it through `getHealthNotes` and the RLS policies in `20250321000000_hockey_staff_rls.sql` | Coaching, scouting, assistant scout, and video analyst must not read or change any row; no policy grants them today |
| `availability` and `category` shown on `/scouting` (`src/routes/scouting/index.tsx`) | Medical staff see them | Every other role must not; today they receive zero rows, so nothing renders |
| Service role on `player_health_notes` (`grant … to service_role` in the RLS migration) | Only code holding the secret key; today no request path reads this table with it | Any staff request must not reach it through the secret key |

Search words used: `health`, `injur`, `availability`, `medical`, `wellness`, `load`, `return_to_play`, across `src/` and `supabase/migrations/`. Sports-science data has no separate table; it lives in `player_health_notes` (`category` = `load` or `wellness`).

The brief and the cited files agree: only medical reaches medical or sports-science data.

## Learner marks (over-grants)

| # | Role with too much | Why the job doesn't need it (brief) | File |
|---|---|---|---|
| 1 | Coaching | Reads full scouting `notes` text. The brief describes coaching as reading "scouting observations" for line planning; event types and counts would serve that. Left open in the earlier matrix; flagged, not fixed here | `20250321000000_hockey_staff_rls.sql` (`scouting_events_select_coaching_scouting`) |
| 2 | Anyone (service role path) | The public directory uses the master key for every request. It only needs roster and schedule, and the key could read any table if a future change pointed it elsewhere | `src/server/directory.ts`, `src/lib/supabase.server.ts` |
| 3 | Every signed-in staff role | `/scouting` shows a "Medical and sports-science notes" section to all roles. It is empty for non-medical staff, but a shared screen that hosts medical flags at all invites a leak the day a query changes | `src/routes/scouting/index.tsx` |
| 4 | — (new roles) | The assistant scout and video analyst have no role value yet. That is too narrow, not too wide: they would see nothing. Matrix v2 and the migration must add them without widening anything else | `003_staff_members.sql` (role check) |

Checked and not over-granted: `player_health_notes` (medical only), `staff_members` (own row only), `player_event_totals` (runs as the caller), all signed-out paths (no anon grants on any table).

# RLS + session verification checklist (Hockey staff)

Checks the rules in `docs/security/rls-policy-spec.md` end to end: signed-in identity (`requireSession()`), the server path (`src/server/scouting-notes.ts`, `src/server/scouting.ts`), and Postgres RLS (`supabase/migrations/20250321000000_hockey_staff_rls.sql`). A **leak** is any row a role should not see, or any write a role should not be able to make; one leak fails the checklist.

## Before you start

- Demo accounts exist with one role each: `coach.demo@hockeyops.test` (coaching), `scout.demo@hockeyops.test` (scouting), `medic.demo@hockeyops.test` (medical). Passwords are in your local `.env.local` (`DEMO_*_PASSWORD`), never in git.
- Expected data: 24 players, 22 games, 121 scouting events (all with notes), 5 medical notes.
- Unit tests: `npm test` runs `src/lib/auth/require-session.test.ts` (mocked Supabase, no database needed).
- Use a private window per role, or sign out between roles at `/login`.

## A. Signed-out visitor

| # | Action | Pass | Fail (leak) |
|---|--------|------|-------------|
| A1 | Open `/scouting` | Redirect to `/login?redirect=/scouting` | Any scouting or medical content |
| A2 | Open `/scouting/events` | Redirect to `/login` | Event list renders |
| A3 | Open `/players/player-000` | Profile only, plus "staff-only" notice | Any scouting event or note text |
| A4 | Call the data API with only the publishable key (`select` on `scouting_events`, `player_health_notes`) | `permission denied` | Any rows |
| A5 | Call a scouting server function directly without cookies | Unauthorized error, no rows | Data returned |

## B. Scouting staff

| # | Action | Pass | Fail (leak) |
|---|--------|------|-------------|
| B1 | Sign in, open `/scouting` | "Scouting notes (121)", "Medical and sports-science notes (0)" | Any medical note |
| B2 | Log an event on `/scouting/events` | Saved; list and totals refresh | Error for a valid event |
| B3 | Query `player_health_notes` with this user's token | 0 rows | Any row |

## C. Coaching staff

| # | Action | Pass | Fail (leak) |
|---|--------|------|-------------|
| C1 | Sign in, open `/scouting` | Scouting notes 121, medical notes 0 | Any medical note |
| C2 | Try to log an event | Rejected by the database ("not allowed") | Event saved |
| C3 | Query `player_health_notes` with this user's token | 0 rows | Any row |

## D. Medical staff

| # | Action | Pass | Fail (leak) |
|---|--------|------|-------------|
| D1 | Sign in, open `/scouting` | Scouting notes 0, medical notes 5 | Any scouting note |
| D2 | `/scouting/aggregates` | Empty state | Any totals row |
| D3 | Insert a medical note with this user's token | Saved with `recorded_by` = this user | Error, or saved for another `recorded_by` |
| D4 | Insert a scouting event with this user's token | Rejected | Saved |

## E. Server path still uses require-session

| # | Check | Pass |
|---|-------|------|
| E1 | `getScoutingNotes` and `getHealthNotes` in `src/server/scouting-notes.ts` call `requireSession()` before any query | Yes: they read `{ db }` from it and query only with that client |
| E2 | Every handler in `src/server/scouting.ts` and `runScoutingMutation` uses `staffDb()` / `requireSession()`, not the secret key | `grep -n getSupabaseServerClient src/server/scouting*.ts` prints nothing |
| E3 | No page filters rows by role | The `/scouting` page renders the server lists as returned; hiding UI is not the control |
| E4 | `npm test` | 18 passed, including the fail-closed cases |

## Last run (2026-10-26, local dev server + hockey database)

| Scenario | Result | Evidence |
|---|---|---|
| A1, A2 | Pass | `/scouting` and `/scouting/events` returned 307 to `/login?redirect=…` |
| A3 | Pass | `/players/player-000` HTML contains the staff-only notice and no event text |
| A4 | Pass | publishable key: `permission denied` on players, scouting_events, player_health_notes, and `player_event_totals` |
| B1, C1, D1 | Pass | `/scouting` rendered with each role's session cookies: scout 121/0, coach 121/0, medic 0/5 |
| B2–B3, C2–C3, D2–D4 | Pass | Direct token queries: scout insert event allowed; coach and medic insert denied; health notes 0 for coach and scout, 5 for medic; medic totals empty; medic health insert allowed. Probe rows deleted afterward |
| E1–E4 | Pass | Code review plus `npm test`: 18 passed. Deliberately removing the role check failed 3 tests |

## Failures → fix loop

| What failed | Where to fix |
|---|---|
| A signed-out page or function returns data | `src/routes/scouting/route.tsx` guard for pages; the server function is missing `requireSession()` |
| A role sees rows the matrix denies | Policy in the RLS migration; add a new migration, never edit the applied one |
| A role is refused rows the matrix allows | Missing grant or policy for `authenticated`, or the user's `staff_members.role` is wrong |
| Server path uses the secret key | Replace with `requireSession().db` in `src/server/*` |
| Unit test fails | `src/lib/auth/require-session.ts` |

After a fix, re-run the whole section for the affected role, not only the failing row.

## Sign-off

| Role | Name | Date | Result |
|---|---|---|---|
| Developer | Fervent Kestrel | 2026-10-26 | All rows pass locally; production re-check after deploy (step 14) |
| Hockey ops reviewer | | | |

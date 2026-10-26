# Migration review checklist — least-privilege new staff roles

Reviewed: `supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql`
Against: `docs/access/access-matrix-v2.md` (contract) and `docs/access/service-role-key-rule.md` (master key).
Result values: **pass** or **residual risk**. Nothing below is blank or fail.

## 1. Default deny

**Result: pass.** Row-level security stays on for `players`, `games`, `scouting_events`, and `player_health_notes`. An action with no matching allow policy is refused: the migration adds allows only for the cells listed in section 2, and there is no `using (true)` / `with check (true)` anywhere. Examples: no policy lets anyone delete scouting events, so deletes are refused; no policy names `assistant_scout` or `video_analyst` on `player_health_notes`, so their reads return no rows and their writes are rejected.

## 2. Each policy or grant mapped to a matrix cell

| Policy / grant in the migration | Role(s) and action | Matrix v2 cell | Result |
|---|---|---|---|
| `staff_members_role_valid` (new check) | Allows the labels assistant_scout, video_analyst; no other new values | New roles exist (audit mark 4) | pass |
| `players_select_staff` | coaching, scouting, medical, assistant scout, video analyst · **see** players | Game data: See only, all five roles | pass |
| `games_select_staff` | same five roles · **see** games | Game data: See only, all five roles | pass |
| `scouting_events_select_scouting_staff` | coaching, scouting, assistant scout, video analyst · **see** scouting events; medical not listed | Scouting notes: See for those four; Deny for medical | pass |
| `scouting_events_insert_scouting_staff` | scouting, assistant scout · **add** scouting events; video analyst, coaching, medical not listed | Assistant scout: add own new observations; video analyst: See only | pass |
| `scouting_events_update_scouting` (unchanged) | scouting only · **edit** | Assistant scout may add but not edit | pass |
| `scouting_player_board` view + `grant select … to authenticated` | Any signed-in role may query the view, but rows come from the tables' policies above | Shared-view rule: no medical flags | pass (see section 5) |
| `revoke all on scouting_player_board from public, anon` | Signed-out visitors · **none** | No anon access | pass |

## 3. Assistant scout — sealed data

| Check | Result | Why |
|---|---|---|
| Medical data (`player_health_notes` rows of category injury / return_to_play) | **pass** | The migration adds no policy, grant, view, or function naming assistant_scout on `player_health_notes`; the medical-only policies from `20250321000000_hockey_staff_rls.sql` stay the only ones |
| Sports-science data (`player_health_notes` rows of category load / wellness) | **pass** | Same table, same medical-only policies; nothing in this file opens it |
| Medical flags in a shared view | **pass** | `scouting_player_board` selects only id, full_name, jersey_number, position, event_count, games_scouted, last_scouted_at, and never joins `player_health_notes` |

## 4. Video analyst — sealed data

| Check | Result | Why |
|---|---|---|
| Medical data | **pass** | No policy, grant, view, or function in this file names video_analyst on `player_health_notes` |
| Sports-science data | **pass** | Same: medical-only policies remain the only allows on that table |
| Medical flags in a shared view | **pass** | Same view; no medical column exists in it to return |
| No write on scouting events | **pass** | video_analyst appears only in select policies, not in the insert or update policy |

## 5. Shared views: whose rights they run with

| View | Runs with | Can it return a medical flag? | Result |
|---|---|---|---|
| `public.scouting_player_board` | The caller's rights (`security_invoker = true`) | No: no medical column, no join to `player_health_notes` | pass |

No other view exists (`docs/access/overgrant-audit.md`, "Database views").

## 6. Nothing open to everyone

**Result: pass.** This migration grants nothing to `PUBLIC` or `anon`; it explicitly revokes the new view from both. To `authenticated` it grants only `select` on `scouting_player_board`, which carries no medical, injury, health, sports-science, or medical-flag data. It does not grant `player_health_notes` to anyone. (The earlier RLS migration's table-level `select` on `player_health_notes` for `authenticated` is still filtered by the medical-only policy, which this file leaves unchanged.)

## 7. Service-role key

**Result: pass.** Per `docs/access/service-role-key-rule.md`, no staff request may use the master key. This migration contains no key, token, password, or connection string, grants nothing new to `service_role`, and adds no `security definer` function that would let assistant scout, video analyst, or other staff requests run with elevated rights.

## 8. Residual risks

| Risk | Why it is still open |
|---|---|
| Coaching reads full scouting note text | Matrix v2 keeps "See only, unchanged" pending a hockey ops decision; fixing it needs a notes-free view for coaching, which is a product change outside this migration |
| The assistant scout can add events for any player and game | The matrix allows adding observations; `scouting_events` has no author column to limit "own" further. Edits stay scouting-only, so they cannot change anyone else's record |
| A future table or view could be added without RLS or with `security_invoker` off | Not something this migration can prevent; the break-tests (step 8) and this checklist must be re-run for any new shared view |

## Fixes made during review

None needed: the first draft of `supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql` passed every item above.

# Adversarial test cases — least-privilege staff roles

Break-tests for `supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql`, written from `docs/access/access-matrix-v2.md`. Test file: `tests/access/least-privilege-roles.test.ts`.

## Actors

| Actor | Role label |
|---|---|
| Assistant scout test account | `assistant_scout` |
| Video analyst test account | `video_analyst` |
| Medical test account (control) | `medical` |

Every attempt is made **as that test account** with the publishable key and its own signed-in session. No attempt uses the service-role key.

## Environment variables (names only; values live in your local `.env.local`)

`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `DEMO_ASSISTANT_SCOUT_EMAIL`, `DEMO_ASSISTANT_SCOUT_PASSWORD`, `DEMO_VIDEO_ANALYST_EMAIL`, `DEMO_VIDEO_ANALYST_PASSWORD`, `DEMO_MEDIC_EMAIL`, `DEMO_MEDIC_PASSWORD`.

Run: `set -a; . ./.env.local; set +a; npm run test:access`. Without those variables the suite is skipped, so `npm test` still passes offline.

## Cases

"Medical data" = `player_health_notes` rows with category `injury` or `return_to_play`. "Sports-science data" = rows with category `load` or `wellness`. "Change" = an attempt to add a row (the only write the policies could ever allow on that table).

| Case id | Actor | Target | Attempt | Expected | Why | Matrix cell | Test name |
|---|---|---|---|---|---|---|---|
| AS-READ-SCOUT | Assistant scout | `scouting_events` | read events | **allow** (rows returned) | The job reads what scouts flagged before attending games | Assistant scout · scouting notes · See | `AS-READ-SCOUT assistant scout can read scouting events` |
| AS-READ-GAME | Assistant scout | `games`, `players` | read schedule and roster | **allow** | Observations must be tagged to the right game and player | Assistant scout · game data · See only | `AS-READ-GAME assistant scout can read games and roster` |
| AS-READ-MED | Assistant scout | `player_health_notes` (injury, return_to_play) | read | **deny** (zero rows) | Medical data is sealed for this job | Assistant scout · medical records · Deny | `AS-READ-MED assistant scout gets no medical rows` |
| AS-CHANGE-MED | Assistant scout | `player_health_notes` | add an injury note | **deny** (rejected) | The job may not create medical records | Assistant scout · medical records · Deny | `AS-CHANGE-MED assistant scout cannot add a medical note` |
| AS-READ-SS | Assistant scout | `player_health_notes` (load, wellness) | read | **deny** (zero rows) | Sports-science data is sealed for this job | Assistant scout · sports-science · Deny | `AS-READ-SS assistant scout gets no sports-science rows` |
| AS-CHANGE-SS | Assistant scout | `player_health_notes` | add a load note | **deny** (rejected) | The job may not create sports-science records | Assistant scout · sports-science · Deny | `AS-CHANGE-SS assistant scout cannot add a sports-science note` |
| AS-FLAG-SHARED | Assistant scout | shared view `scouting_player_board` | read the board; ask for `availability` | **deny** for the flag: board rows return with no medical column, and requesting `availability` is rejected | A shared scouting screen must not reveal injury status | Shared-view rule · Deny | `AS-FLAG-SHARED assistant scout sees the shared board without medical flags` |
| VA-READ-SCOUT | Video analyst | `scouting_events` | read events | **allow** | Clips are cut from moments scouts flagged | Video analyst · scouting notes · See only | `VA-READ-SCOUT video analyst can read scouting events` |
| VA-READ-GAME | Video analyst | `games`, `players` | read schedule and roster | **allow** | Clips are matched to games and labeled with players | Video analyst · game data · See only | `VA-READ-GAME video analyst can read games and roster` |
| VA-READ-MED | Video analyst | `player_health_notes` (injury, return_to_play) | read | **deny** (zero rows) | Medical data is sealed for this job | Video analyst · medical records · Deny | `VA-READ-MED video analyst gets no medical rows` |
| VA-CHANGE-MED | Video analyst | `player_health_notes` | add an injury note | **deny** (rejected) | The job may not create medical records | Video analyst · medical records · Deny | `VA-CHANGE-MED video analyst cannot add a medical note` |
| VA-READ-SS | Video analyst | `player_health_notes` (load, wellness) | read | **deny** (zero rows) | Sports-science data is sealed for this job | Video analyst · sports-science · Deny | `VA-READ-SS video analyst gets no sports-science rows` |
| VA-CHANGE-SS | Video analyst | `player_health_notes` | add a wellness note | **deny** (rejected) | The job may not create sports-science records | Video analyst · sports-science · Deny | `VA-CHANGE-SS video analyst cannot add a sports-science note` |
| VA-FLAG-SHARED | Video analyst | shared view `scouting_player_board` | read the board; ask for `availability` | **deny** for the flag, as AS-FLAG-SHARED | A shared scouting screen must not reveal injury status | Shared-view rule · Deny | `VA-FLAG-SHARED video analyst sees the shared board without medical flags` |
| MED-READ-MED | Medical (control) | `player_health_notes` | read | **allow** (rows returned) | Control case: proves the medical table is not simply empty or hidden from everyone, so the deny cases above are real denials | Medical · medical records · See (unchanged) | `MED-READ-MED control: medical staff can read medical notes` |

### Cases added beyond the required list

| Case id | Actor | Target | Attempt | Expected | Why | Matrix cell | Test name |
|---|---|---|---|---|---|---|---|
| VA-ADD-EVENT | Video analyst | `scouting_events` | add a scouting event | **deny** (rejected) | The video analyst reviews; the brief gives no writing duty | Video analyst · scouting notes · See only | `VA-ADD-EVENT video analyst cannot add scouting events` |
| AS-EDIT-EVENT | Assistant scout | `scouting_events` | change an existing event's note | **deny** (zero rows changed) | The assistant scout may add but not edit another scout's record | Assistant scout · scouting notes · add own new observations only | `AS-EDIT-EVENT assistant scout cannot edit existing scouting events` |
| AS-READ-STAFF | Assistant scout | `staff_members` | read all staff roles | **deny** beyond own row (exactly one row, their own) | Nobody needs to see other staff members' roles | Staff role assignment · own row only (earlier matrix) | `AS-READ-STAFF assistant scout sees only their own staff row` |

# Role-by-action results — least-privilege staff roles

Ran `tests/access/least-privilege-roles.test.ts` against the rules in `supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql` on 2026-10-26, against our own course Supabase project (the hockey app's database, not a shared or production PAUL database).

Test accounts, by role only: one **assistant scout**, one **video analyst**, one **medical** (control). Each attempt signed in as that account with the publishable key; the service-role key was not used for any judged read or write.

## How to read this

- A **blocked** forbidden action is a **pass** for the gate.
- A forbidden action that **succeeds** is a **fail**, even if the test command exited cleanly.
- An allowed action that succeeds is a pass; an allowed action that is blocked is also a fail, because the job would not work.

## Final run

| Role | Action tried | Expected | What happened | In plain words |
|---|---|---|---|---|
| Assistant scout | Read scouting events | Allow | **Succeeded** (rows returned) | The assistant scout can still see what the lead scout flagged, so the job works |
| Assistant scout | Read the schedule and roster | Allow | **Succeeded** | The assistant scout can pick the right game and player when logging an observation |
| Assistant scout | Read medical notes (injury, return to play) | Deny | **Blocked**: zero rows came back | The assistant scout must never see injury records, and the database returned none |
| Assistant scout | Add an injury note | Deny | **Blocked**: the database refused the write | The assistant scout cannot create medical records |
| Assistant scout | Read sports-science notes (training load, wellness) | Deny | **Blocked**: zero rows | Training-load and wellness numbers stay with medical staff |
| Assistant scout | Add a training-load note | Deny | **Blocked**: refused | The assistant scout cannot create sports-science records |
| Assistant scout | Open the shared scouting player board, then ask it for the availability flag | Board allowed, flag denied | **Board opened with players and scouting counts; no medical column on any row; asking for "availability" was refused** | The shared screen works for this job but cannot reveal whether a player is injured |
| Assistant scout | Edit an existing scouting note | Deny | **Blocked**: zero rows changed, note unchanged | The assistant scout can add observations but cannot rewrite another scout's record |
| Assistant scout | Read every staff member's role | Deny beyond own row | **Blocked**: only their own row came back | Staff cannot browse each other's roles |
| Video analyst | Read scouting events | Allow | **Succeeded** | The video analyst can find the moments scouts flagged to cut clips |
| Video analyst | Read the schedule and roster | Allow | **Succeeded** | Clips can be matched to games and labeled with players |
| Video analyst | Read medical notes | Deny | **Blocked**: zero rows | The video analyst must never see injury records |
| Video analyst | Add an injury note | Deny | **Blocked**: refused | The video analyst cannot create medical records |
| Video analyst | Read sports-science notes | Deny | **Blocked**: zero rows | Training-load and wellness numbers stay sealed |
| Video analyst | Add a wellness note | Deny | **Blocked**: refused | The video analyst cannot create sports-science records |
| Video analyst | Open the shared scouting player board, then ask for the availability flag | Board allowed, flag denied | **Board opened; no medical column; asking for "availability" was refused** | The shared screen works for clip work without showing injury status |
| Video analyst | Add a scouting event | Deny | **Blocked**: refused | The video analyst reviews; recording observations is not part of the job |
| Medical (control) | Read medical and sports-science notes | Allow | **Succeeded**: injury and training-load rows returned | Proves the medical table really has data, so the zero-row results above are real denials, not an empty table |

Totals: 18 cases, 18 behaved as expected. Every expected-deny row is blocked; every expected-allow row succeeded.

The run left no data behind: the database still holds 121 scouting events and 5 medical notes, and no "break-test" rows exist (the forbidden writes were refused, and the edit changed nothing).

## Tightening log

No forbidden access succeeded on the first run, so neither `supabase/migrations/20260418120000_least_privilege_new_staff_roles.sql` nor `tests/access/least-privilege-roles.test.ts` needed changes after it.

## Re-running

```bash
set -a; . ./.env.local; set +a; npm run test:access
```

Re-run after any change to roles, policies, or shared views. A new shared view gets its own `*-FLAG-SHARED` case before it ships.

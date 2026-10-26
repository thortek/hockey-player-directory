# Access decision: assistant scout and video analyst

**To:** Hockey operations lead
**Decision:** add the two mid-season hires with only the access their jobs need. Medical information stays with medical staff.

## What each new role may see

**Assistant scout.** Sees every scouting observation our scouts have recorded, the game schedule and results, and the roster (names, numbers, positions). May add their own new observations from games they attend. Cannot edit or delete anyone else's notes.

**Video analyst.** Sees the same scouting observations, schedule, and roster so they can find the flagged moments and label clips. Cannot add, edit, or delete anything.

## What stays sealed for both

Medical records (injuries, return-to-play status) and sports-science data (training load, wellness scores) stay visible only to medical staff. That includes small health labels such as "injured", "limited", or "out": the shared scouting player board both roles use was built without those labels at all, so it cannot show them even by mistake.

## Why these limits

Both people were hired to work with scouting and game information: one to back up the lead scout at games, one to cut video. Neither job involves treating or managing players' health, so neither needs medical data. Giving it "just in case" would mean two more people who could leak a player's injury to an agent or another team without any benefit to their work.

## Proof

From `docs/access/role-action-results.md`, run against our hockey database with real test accounts for each role:

| Tried | Result |
|---|---|
| Assistant scout reads scouting observations | **Pass**: allowed, observations returned |
| Video analyst reads schedule and roster | **Pass**: allowed, games and players returned |
| Assistant scout reads injury records | **Pass**: blocked, nothing returned |
| Video analyst adds a wellness score | **Pass**: blocked, the database refused it |
| Both roles ask the shared player board for an injury label | **Pass**: blocked, the board has no such label |
| Medical staff read injury records (control) | **Pass**: allowed, so the blocks above are real |

All 18 checks behaved as expected on the first run.

## The master key rule, in plain words

The database has one "master key" that skips every access check. Requests from signed-in staff, including these two new roles, never use it: every staff screen runs as the person who is signed in, so the database applies their role. Only the two server-only jobs written in `docs/access/service-role-key-rule.md` may use the master key (the public roster and schedule pages, and setup work a developer runs by hand). No key or password appears in this note.

## Risks that remain

- **Coaches can read full scouting note text.** This was left open in the original privacy brief; tightening it needs a separate decision from you.
- **Roles are assigned by hand in the database.** Giving someone the wrong role gives them the wrong access, and there is no review step yet.
- **New screens need the same care.** Any future shared screen must be checked the same way before it ships.

Later work must not reopen medical or sports-science access for either role unless someone writes a new decision like this one.

## Sources

- `docs/access/new-roles-brief.md`
- `docs/access/access-matrix-v2.md`
- `docs/access/service-role-key-rule.md`
- `docs/access/role-action-results.md`

**Approve:** ____________________  **Date:** __________

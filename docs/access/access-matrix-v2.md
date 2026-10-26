# Access matrix v2 — hockey staff roles

This is the contract for the next database change (the least-privilege migration). It contains no SQL and no migration; it only states who may do what.

Sources: `docs/access/new-roles-brief.md` (what the new jobs need), `docs/access/overgrant-audit.md` (what is too wide today), `docs/access/service-role-key-rule.md` (who may hold the master key). It extends `docs/security/role-access-matrix.md`; anything not listed here is unchanged from that file.

No cell grants anything to "all staff", "everyone", "public", or "anyone signed in". Every allow names a role.

## Matrix

| Role | Scouting notes (`scouting_events`) | Game data (games, roster) | Medical records | Sports-science data | Medical flags in shared scouting views | Service-role key |
|---|---|---|---|---|---|---|
| Assistant scout | **See + add own new observations** | **See only** | **Deny** | **Deny** | **Deny** | **Never** |
| Video analyst | **See only** | **See only** | **Deny** | **Deny** | **Deny** | **Never** |
| Coaching | See only (unchanged from the earlier matrix) | See only (unchanged) | Deny (unchanged) | Deny (unchanged) | **Deny** | **Never** |
| Scouting | See + add + edit (unchanged) | See only (unchanged) | Deny (unchanged) | Deny (unchanged) | **Deny** | **Never** |
| Medical | Deny (unchanged) | See only (unchanged) | See + add + edit (unchanged from the earlier matrix) | See + add + edit (unchanged from the earlier matrix) | Medical flags appear only on medical's own screen, not in shared scouting views | **Never** |

"See" means read rows; "add" means create new rows; "edit" means change existing rows. Nobody may delete scouting events or medical records through the app.

## Because (one sentence per allowed cell)

- **Assistant scout · scouting notes (See):** because they need to know what the lead scout has already flagged before attending the same games.
- **Assistant scout · scouting notes (add own new observations):** because the brief gives them the writing duty of logging observations at games the lead scout can't cover; they may not edit existing notes, since correcting another scout's record is the lead scout's job.
- **Assistant scout · game data (See only):** because they must pick the right game and the right player when logging an observation.
- **Video analyst · scouting notes (See only):** because they find the moments scouts flagged in order to cut matching clips; the brief gives them no writing duty.
- **Video analyst · game data (See only):** because clips are matched to games by date and opponent and labeled with player name and number.
- **Coaching · scouting notes (See only):** because coaches use scouting observations for line decisions (unchanged; see the narrowing section about note text).
- **Coaching · game data (See only):** because planning practices and games needs the roster and schedule.
- **Scouting · scouting notes (See + add + edit):** because scouts own scouting records and correct them by editing.
- **Scouting · game data (See only):** because observations are tagged to games and players.
- **Medical · game data (See only):** because readiness decisions depend on who is scheduled to play when.
- **Medical · medical records and sports-science data (See + add + edit):** because tracking health, injuries, and training load is the medical job.

## Shared-view rule

Any scouting screen that the assistant scout, the video analyst, or the scouting role can open must omit medical flags ("injured", "limited", "out", "cleared", or a training-load score) from the data it loads, so those roles cannot learn a player's medical status from the shared screen. Sealing the medical table alone does not satisfy this: a shared player board must be built from columns that never include a medical flag, and its rows must be filtered by the viewer's own access rather than the master key.

## Service-role key

Every staff role above, including assistant scout, video analyst, and medical, is **Never**. The only allowed uses are the two server-only jobs in `docs/access/service-role-key-rule.md`; this matrix adds none.

## Narrowed from the audit

| Audit mark | Too-broad grant | Narrower cell |
|---|---|---|
| 3 | The `/scouting` overview shows a "Medical and sports-science notes" section to every signed-in role | Medical flags in shared scouting views: **Deny** for assistant scout, video analyst, coaching, and scouting. The section renders only for medical; the shared player board for scouting work carries no medical columns |
| 2 | The public directory reads with the master key | Limited by `service-role-key-rule.md` to roster and schedule columns; never scouting, staff, or medical data |
| 4 | New roles had no role value (too narrow) | Added as assistant scout and video analyst with the cells above, and nothing wider |

Not narrowed in this change: **mark 1, coaching reading full scouting note text.** The original brief left this as a stakeholder question. It stays "See only" until hockey ops decides, because changing it means building a notes-free screen for coaching and that is a product decision, not a security fix. It is recorded as a residual risk.

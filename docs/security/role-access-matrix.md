# Role Access Matrix — Hockey Staff (Sprint 4)

Source brief: `docs/security/hockey-staff-access-brief.md`. This file states rules only; the session plan and RLS migration implement them.

## How to read this matrix

- **R** read, **W** create or edit, **—** deny (no rows at all, not an empty-looking page).
- "Row scope" says which rows an allowed role gets.
- Anything not listed is denied. Signed-out users are denied everything below.

## Matrix

| Data kind (logical table) | Coaching | Scouting | Medical | Notes / row scope |
| --- | --- | --- | --- | --- |
| Roster shared fields (`players`: name, number, position, active) | R | R | R | Team-wide. Identity fields only; no notes or health data live in this table |
| Schedule (`games`) | R | R | R | Team-wide |
| Scouting events and notes (`scouting_events`) | R (read-only) | R+W | — | Scouting: team-wide read; create events and edit notes. Coaching: team-wide read as game context, never write. Medical: deny |
| Scouting totals (`player_event_totals`) | R | R | — | Computed from `scouting_events`, so it inherits that row's rules; a medical user gets an empty result |
| Medical / sports-science records (`player_health_notes`) | — | — | R+W | Medical only, team-wide for this sprint (caseloads are out of scope). Coaching and scouting: deny |
| Staff role assignment (`staff_members`) | R own row | R own row | R own row | Each user reads only their own role. Nobody writes through the app; roles change in the database by an admin |

## Role summaries

### Coaching
Reads the roster, schedule, and scouting observations to plan lines. Cannot write scouting data and never sees medical records.

### Scouting
Owns scouting events and notes: reads all, creates new ones, edits notes. Never sees medical records.

### Medical
Owns health and sports-science records for the whole roster. Sees the roster and schedule for context, never scouting notes.

## Deny-by-default

Every table starts with row-level security on and no policies, so nothing is readable until a rule above allows it. A new table or a new role gets no access until this matrix gains a row or column for it.

## Open questions (resolve before RLS migration)

1. **Role binding:** how does a signed-in user get a role? Proposed: one row per user in `staff_members(user_id, role)`, inserted by an admin; no self-service.
2. Coaching read of scouting note *text* (vs. event types and counts only) is allowed here pending the brief's open question; tightening it later means a notes-free view for coaching.
3. One role per person for now; a coach who also scouts needs a decision before multi-role support.

## Acceptance for implementers

- Policies exist for every R and W cell above and for no other cell.
- With a coaching or scouting token, `select * from player_health_notes` returns zero rows.
- With a medical token, `select * from scouting_events` returns zero rows and `player_event_totals()` returns nothing.
- A coaching token's insert into `scouting_events` is rejected by the database.

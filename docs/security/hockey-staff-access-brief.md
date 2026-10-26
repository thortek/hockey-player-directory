# Hockey Staff Access Brief

Sprint 4 (Identity: Who You Are and What You May Do). Requirements only: no login code, no SQL policies.

## 1. Problem summary

Today every scouting page and every server function answers anyone who has the URL. The production site even accepts new scouting events from anonymous visitors. Once scouting notes and sports-science data live in the same app, a coach, a scout, and a medical staff member must each see only what their job needs, and that has to hold even when someone calls the server directly instead of clicking through the pages.

## 2. Sensitive data (what we protect)

| Data | Why it is sensitive | Example misuse if leaked |
| --- | --- | --- |
| Scouting notes (`scouting_events` with free-text notes) | Competitive judgment about our players and opponents; drafts of who to trade, start, or sit | A medical trainer forwards "slow on zone exits, consider scratching" to the player's agent |
| Sports-science / medical-related measures (wellness, load, injury status) | Personal, health-adjacent information about individual athletes | A scout learns a player is managing a groin injury and it shapes a trade conversation |
| Staff role assignments | Decide who sees what; changing one silently widens access | A coach is quietly given the medical role and reads every athlete's health notes |

## 3. Staff groups and primary goals

| Staff group | Primary goal in the app | May see (plain language) | Must not see (plain language) |
| --- | --- | --- | --- |
| Coaching | Plan lines, practices, and games | The roster, the schedule, scouting observations and totals as read-only game context | Any medical or sports-science record; changing or writing scouting notes |
| Scouting | Record and review what players did in games | The roster, the schedule, scouting events and notes; adding events and editing notes | Any medical or sports-science record |
| Medical | Track athlete health and readiness | The roster and schedule; medical / sports-science records, which they create and edit | Scouting notes and evaluations |

## 4. What must never leak across roles

1. Medical or sports-science records are never returned to a coaching or scouting user, from any page, server function, database function, or totals.
2. Scouting notes are never returned to a medical user.
3. Coaching users can never create or change scouting events or notes.
4. Nobody who is signed out sees scouting or medical data, and nobody signed out can write anything.
5. A user cannot change their own role.

## 5. Why "hide it in the UI" is not enough

Hiding a menu item or a button only changes what the page draws. The data still travels through server functions that are ordinary HTTP endpoints and through the database API. A curious staff member can open DevTools, replay the request, or call the endpoint with curl and get every row back. Protection has to sit where the data is read: on the server for every request, and in the database itself so even a mistake in one server function cannot return the wrong rows.

## 6. In scope for this sprint (identity slice)

- Staff sign in with their own account; the server knows who is asking on every request.
- Server functions re-check the session before touching sensitive data and refuse anonymous calls.
- Each signed-in user has exactly one staff role: coaching, scouting, or medical.
- The database enforces per-role access with row-level rules, so rule 4.1–4.4 hold even if a server function forgets a check.

## 7. Out of scope (later work)

- Self-service sign-up, password reset emails, single sign-on with a team identity provider.
- More roles (for example general manager or athletic trainer); handled as a follow-up in Sprint 4 topic 2.
- Per-player caseloads ("this trainer sees only these athletes").
- Audit logs of who viewed which record.

## 8. Success criteria (how we will know this brief worked)

1. A signed-out request to any scouting server function returns no data and an unauthorized result.
2. Signed in as each role, the scouting pages show exactly the rows section 3 allows, checked once per role.
3. A direct database query with a coaching or scouting user's token returns zero medical rows; with a medical token, zero scouting events.
4. A coaching user's attempt to log a scouting event is rejected by the database, not just hidden in the page.
5. Automated tests cover the session helper's allow and deny paths.

## 9. Open questions for stakeholders

- Who assigns roles, and who may change them? (Proposed: hockey ops admin through the database only.)
- Should coaches see scouting note text, or only event types and totals?
- Do medical staff need to see game participation (who played) to judge load?
- Can one person hold two roles (a coach who also scouts)? This sprint assumes one role each.

## 10. Related documents

This brief is the source for the rest of Sprint 4:

- `docs/security/role-access-matrix.md` turns sections 3–4 into a role-by-data allow/deny table.
- `docs/security/auth-session-plan.md` describes how sign-in and server-side session checks meet section 6.

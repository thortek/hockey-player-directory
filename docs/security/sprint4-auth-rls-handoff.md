# Sprint 4 Handoff: Auth Sessions and Row-Level Security

Sprint 4, topic 1 · 2026-10-26 · Live at `https://hockey-player-directory-rose.vercel.app/scouting`

## 1. Sprint outcome (client story)

Hockey ops asked that scouting notes and sports-science data stop being visible to every staff member, and that the rule hold even if someone calls the API directly. That is now true. Staff sign in with their own account; coaches and scouts see scouting notes, medical staff see health notes, nobody sees the other group's private data, and signed-out visitors see only the public roster and schedule.

| Privacy goal (`docs/security/hockey-staff-access-brief.md`) | Delivered control | Status |
|---|---|---|
| Medical records never reach coaching or scouting | RLS: `player_health_notes` readable only when `current_staff_role() = 'medical'` | Delivered |
| Scouting notes never reach medical | RLS: `scouting_events` readable only by coaching and scouting | Delivered |
| Coaches can't change scouting data | RLS: only scouting may insert or update `scouting_events` | Delivered |
| Signed-out users see and write nothing sensitive | No grants for `anon`; every scouting server function calls `requireSession()`; `/scouting` redirects to `/login` | Delivered |
| Users can't change their own role | `staff_members` has a read-own-row policy and no write policies | Delivered |
| Per-player caseloads, audit logs, SSO | — | Deferred (section 6) |

## 2. What was delivered

### Authentication sessions
Staff sign in at `/login` with email and password (Supabase Auth). The session is kept in cookies on our site, so every page and server request carries it. "Sign out" is on `/login` and on the staff overview.

### Server-side session verification
Every scouting server function first runs `requireSession()` (`src/lib/auth/require-session.ts`). It asks Supabase Auth to confirm the session is real, loads the person's staff role, and refuses the request (401) if either is missing. It then queries the database as that person, never with the master key.

### Authorization with RLS (by role)
The database itself filters rows by role (`supabase/migrations/20250321000000_hockey_staff_rls.sql`). Coaching and scouting read scouting events; scouting alone writes them; medical alone reads and writes health notes; all three read the roster and schedule. Anything not listed is refused. The staff overview at `/scouting` shows the result: the same page shows different rows to different roles.

### Verification artifacts
- Unit tests: `src/lib/auth/require-session.test.ts` (9 cases, mocked Supabase).
- Manual and API checklist with today's results: `docs/security/rls-verification-checklist.md`.

## 3. How stakeholders assign coaching, scouting, and medical roles

There is no admin screen this sprint. A role is one row in `staff_members` (`user_id`, `role`, `display_name`):

1. Create the person's account in the Supabase dashboard under Authentication → Users (or invite them).
2. In the Table Editor, add a `staff_members` row with their user id and `coaching`, `scouting`, or `medical`.
3. To change a role, edit that row; to revoke access, delete it. The change takes effect on their next request.

Only someone with dashboard access to the hockey Supabase project can do this. The app never writes roles.

## 4. How to run the verification checklist

1. `npm test` → expect 18 passing tests.
2. Open the live site in a private window and run section A of `docs/security/rls-verification-checklist.md` (signed-out redirects and the public player page).
3. Sign in as each demo account (passwords in your local `.env.local`) and run sections B, C, and D. Compare the two counts on `/scouting`: scout 121 / 0, coach 121 / 0, medic 0 / 5.
4. Any row that shows a leak fails the whole checklist; the "Failures → fix loop" table says which file to change.

## 5. Residual risks

- **Wrong role assigned** gives that person exactly the wrong data; roles are hand-edited with no review or audit trail.
- **Secret key misuse:** the public directory (`src/server/directory.ts`) still uses the secret key for `players` and `games`. Pointing that client at a sensitive table would bypass RLS silently.
- **New tables without RLS:** a future table is readable by any granted role until it gets RLS and policies.
- **Coaches read full scouting note text.** The brief left this open; tightening it needs a notes-free view.
- **Shared demo passwords** are fine for a demo, not for real staff.

## 6. What should roll into the next topic

- **Admin role assignment:** a reviewed way to grant and change roles, and least-privilege rules for new roles (Sprint 4 topic 2).
- **Playwright role journeys:** automate sections A–D of the checklist for each role.
- **CI and Vercel safeguards:** run `npm test` and `npm run typecheck` on every pull request, plus a check that fails if a table lacks RLS or a scouting server function skips `requireSession()`.

## 7. Decision log (plain language)

- Roles live in our database, not in the login token, so changing a role takes effect on the next request without re-login.
- The database is the final gatekeeper; the page and the server functions are earlier checks, not the only ones.
- Scouting history is never deleted through the app; corrections are edits.
- The public directory keeps working without sign-in, but shows only roster and schedule.

Planning artifacts: `docs/security/hockey-staff-access-brief.md`, `docs/security/role-access-matrix.md`, `docs/security/auth-session-plan.md`, `docs/security/rls-policy-spec.md`. Migrations: `supabase/migrations/003_staff_members.sql`, `supabase/migrations/20250321000000_hockey_staff_rls.sql`.

## 8. Sign-off

| Role | Name | Date | Notes |
|---|---|---|---|
| Developer | Fervent Kestrel | 2026-10-26 | Checklist passes locally; production re-checked at ship |
| Hockey ops | | | |

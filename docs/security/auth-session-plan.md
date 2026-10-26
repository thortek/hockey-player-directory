# Auth Session Plan — Hockey Staff (Sprint 4)

Planning only. Nothing here exists in code yet; steps 5–7 build it and steps 9–10 add the database rules.

## Purpose

Make every scouting and medical request carry a verified staff identity, checked on the server, before any sensitive query runs.

## Roles in scope (from the matrix)

Coaching, scouting, and medical, exactly as defined in `docs/security/role-access-matrix.md`. A user's role comes from one `staff_members` row keyed by their Supabase Auth user id.

## End-to-end sequence

1. **Login.** A staff member enters email and password on `/login`. The browser Supabase client calls Supabase Auth, which checks the password against its user store.
2. **Session.** On success Supabase Auth issues an access token and a refresh token. `@supabase/ssr` stores them in cookies on our domain, so every later request to our server carries them.
3. **Server-side verify.** Each sensitive TanStack Start server function first calls `requireSession()`. It builds a server Supabase client from the request's cookies and calls `auth.getUser()`, which asks Supabase Auth to validate the token (not just decode it). It then loads the caller's `staff_members` role.
4. **Data access.** Only after step 3 succeeds does the function run its query, using that same user-scoped client. Postgres row-level security then filters rows by the caller's role.

If step 3 fails (no cookie, expired or forged token, no staff role), the function stops and returns an unauthorized error. It never falls back to the secret key and never returns partial data.

## Browser Supabase client vs server Supabase client

| Client | Where it runs | Used for |
|--------|---------------|----------|
| Browser client (`src/lib/supabase/client.ts`) | The staff member's browser, with the publishable key | Starting sign-in and sign-out from the login page and the header. Never trusted for authorization |
| Server client (`src/lib/supabase/server.ts`) | Inside TanStack Start server functions, with the publishable key plus the request's cookies | Reading and refreshing the session, verifying the user, and running queries as that user so RLS applies |

The secret-key client (`src/lib/supabase.server.ts`) is not used on any staff request path: it bypasses RLS, so using it would make the database rules meaningless.

## Session rules (non-negotiable)

- Verify with `auth.getUser()` on the server for every sensitive call; never trust a user id sent by the browser.
- Fail closed: no session, an invalid token, or a missing staff role means unauthorized.
- One shared `requireSession()` helper; no handler writes its own check.
- Hiding links or buttons is never the protection, only a convenience.

## Server functions that must call require-session (planned)

| Server entry (planned name) | Why |
|-----------------------------|-----|
| `getCurrentStaff` | Tells the UI who is signed in and their role; returns null rather than throwing for signed-out visitors |
| Scouting reads (`fetchScoutingEvents`, `fetchPlayerEventTotals`, scouting notes loader) | Scouting rows only for a verified coaching or scouting user |
| Scouting writes (`runScoutingMutation`) | Writes only for a verified scouting user |
| Medical records loader | Health rows only for a verified medical user |

## What this plan deliberately defers

- **Per-role row filtering** is Postgres RLS (step 10), not code in each handler.
- Sign-up, password reset, and single sign-on.
- Session audit logging.

## Acceptance checks for later agent work

- A signed-out call to each function in the table returns unauthorized and no rows.
- Signed in as each role, the same call returns only the rows the matrix allows.
- `requireSession()` has unit tests for no session, invalid user, missing role, and valid role.

## Source links

- `docs/security/hockey-staff-access-brief.md`
- `docs/security/role-access-matrix.md`

# RLS Policy Specification — Hockey Staff Data

Implements `docs/security/role-access-matrix.md` as Postgres row-level security. Step 10's migration (`supabase/migrations/20250321000000_hockey_staff_rls.sql`) is written from this file alone.

## Purpose

**Same tables, different rows.** Coaching, scouting, and medical staff query the same tables through the same server functions. Postgres decides which rows each one can read or change, so the rules hold even when someone calls the data API directly with their own token. **Default deny:** RLS is enabled on every table below, and any action not listed as allowed has no policy, so it is refused.

## Identity linkage (must match auth-session-plan)

- Identity: `auth.uid()`, the Supabase Auth user id from the verified access token (the same user `requireSession()` checks with `auth.getUser()`).
- Role binding: `public.staff_members(user_id uuid → auth.users.id, role text)`, where `role ∈ {'coaching', 'scouting', 'medical'}`. One row per staff user; written only by an admin with the service role.
- Helper: `public.current_staff_role()` returns the caller's `staff_members.role`, or `null` if they have no row. It is `security definer` (so it can read `staff_members` without recursion), `stable`, and uses `set search_path = ''`. Every policy calls it; no policy trusts a role sent by the browser.
- Database roles: policies apply `to authenticated`. `anon` gets no grants and no policies on any table here.

## Tables in scope

| Logical name (matrix) | Table | RLS |
|---|---|---|
| Roster shared fields | `public.players` | enabled (since migration 001) |
| Schedule | `public.games` | enabled |
| Scouting notes | `public.scouting_events` (events with free-text `notes`; the tutorial calls this `scouting_notes`) | enabled |
| Medical / sports-science | `public.player_health_notes` (new; the tutorial calls this `sports_science_records`) | enabled |
| Role assignment | `public.staff_members` | enabled (migration 003) |

`player_health_notes` columns: `id uuid pk`, `player_id text → players.id`, `recorded_on date`, `category text ∈ {wellness, injury, load, return_to_play}`, `availability text ∈ {available, limited, out}`, `notes text`, `recorded_by uuid → auth.users.id` (defaults to `auth.uid()`), `created_at`, `updated_at`.

## Policy intents by table

### Table: `scouting_events`

| Action | Coaching | Scouting | Medical |
|---|---|---|---|
| SELECT | **Allow** all rows (read-only game context) | **Allow** all rows | **Deny** |
| INSERT | **Deny** | **Allow**; WITH CHECK the caller's role is scouting | **Deny** |
| UPDATE | **Deny** | **Allow** any row; USING and WITH CHECK role is scouting | **Deny** |
| DELETE | **Deny** | **Deny** (history is kept; corrections are updates) | **Deny** |

### Table: `player_health_notes`

| Action | Coaching | Scouting | Medical |
|---|---|---|---|
| SELECT | **Deny** | **Deny** | **Allow** all rows |
| INSERT | **Deny** | **Deny** | **Allow**; WITH CHECK role is medical **and** `recorded_by = auth.uid()` (no writing on someone else's behalf) |
| UPDATE | **Deny** | **Deny** | **Allow**; USING role is medical, WITH CHECK role is medical and `recorded_by` unchanged |
| DELETE | **Deny** | **Deny** | **Deny** |

No exception: coaching and scouting get no SELECT on any column of this table.

### Table: `players`

| Action | Coaching | Scouting | Medical |
|---|---|---|---|
| SELECT | **Allow** all rows | **Allow** all rows | **Allow** all rows |
| INSERT / UPDATE / DELETE | **Deny** | **Deny** | **Deny** (roster changes go through hockey ops with the service role) |

### Table: `games`

Same as `players`: SELECT allowed for all three staff roles; no writes for any of them.

### Table: `staff_members`

SELECT only the caller's own row (`user_id = auth.uid()`), already in migration 003. No INSERT/UPDATE/DELETE for any staff role, so nobody can change their own role.

## Cross-cutting rules

1. **Signed-out (`anon`):** no grants on any table above.
2. **Secret key:** the service role bypasses RLS. It is not used on any staff request path. The public directory pages (`/`, `/players`, `/games`) may read only `players` and `games` columns through it, never `scouting_events` or `player_health_notes`.
3. **Functions:** `player_event_totals` is `security invoker`, so it runs under the caller's RLS: coaching and scouting get totals, medical gets an empty result.
4. **Grants follow policies:** `authenticated` gets table privileges only where a policy can allow something (SELECT on all four data tables; INSERT and UPDATE on `scouting_events` and `player_health_notes`). RLS still filters every row.
5. A user with no `staff_members` row has `current_staff_role() = null` and matches no policy.

## Traceability

| Matrix row (`role-access-matrix.md`) | Policy section |
|---|---|
| Roster shared fields | Table: `players` |
| Schedule | Table: `games` |
| Scouting events and notes | Table: `scouting_events` |
| Scouting totals | Cross-cutting rule 3 |
| Medical / sports-science records | Table: `player_health_notes` |
| Staff role assignment | Table: `staff_members` |
| Deny-by-default | Purpose; cross-cutting rules 1, 4, 5 |

## Ready for migration when

- [x] Every matrix cell maps to an allow or deny above for SELECT, INSERT, UPDATE, DELETE.
- [x] The role source is a database lookup, not a client value.
- [x] No rule uses `USING (true)` for `authenticated` or `anon`.
- [x] Medical access is strictly narrower than scouting access for non-medical roles (deny, no exceptions).

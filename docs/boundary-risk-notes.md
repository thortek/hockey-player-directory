# Boundary risk notes — Hockey Operations Directory (Sprint 2, Topic 1)

**Product:** Hockey Operations Directory  
**Stack:** TanStack Start, Vite, Supabase, Vitest  
**Purpose:** lock the trust boundary before wiring live reads. Planning only. No implementation in this file.

**Locked decision:** privileged directory reads use a Supabase **secret / service_role** credential that must never appear in Vite client env (`VITE_…`), the client JS bundle, View Source, or browser Network payloads (`apikey` / `Authorization` to `*.supabase.co`). The UI loads data through TanStack Start **server functions**. Mappers/filters that do not need I/O live in modules Vitest can import without `SUPABASE_SECRET_KEY`.

Related: `docs/requirements-brief.md`, `docs/scaffold-notes.md`, `docs/route-map.md`.

---

## Client story

Hockey ops staff must see real player and game rows from Supabase on the existing bookmarkable routes (`/`, `/players`, `/players/$playerId`, `/games`) without the browser holding a database credential. Privileged reads (secret key `sb_secret_…` or legacy `service_role` JWT) stay on the server: a TanStack Start server function constructs a server-only Supabase client, fetches rows, and returns a DTO. Vite env is split so secret names are never `VITE_`-prefixed; this topic does not put a publishable/`anon` key in the frontend either. Pure mappers and search-param filters are extracted from I/O so Vitest can fail a wrong mapping and pass a correct one without starting Start or calling Supabase. Staff never paste a key, never see `*.supabase.co` in DevTools, and never receive `sb_secret_`, `SUPABASE_SERVICE_ROLE_KEY`, or a `service_role` JWT in HTML or RPC JSON.

---

## Naive client risks

Each item is a fail if it appears in a later PR.

- **Service role in a route or component.** `createClient` in `src/routes/*.tsx` or `src/components/*.tsx` with `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, or `sb_secret_…`. Those files ship to the device; the key shows in the client bundle and as `apikey` / `Authorization` on requests to `*.supabase.co`.
- **Vite client prefix.** `VITE_SUPABASE_SECRET_KEY`, `VITE_SUPABASE_SERVICE_ROLE_KEY`, or `VITE_DATABASE_URL`. Vite inlines `VITE_*` into the browser bundle. The service role key must never appear in Vite client env.
- **Isomorphic loader talks to Supabase.** A TanStack Start route `loader` that calls `createClient` or `fetch('https://<project>.supabase.co/rest/v1/…')` runs on the server for SSR **and** in the browser on in-app navigation, so the secret executes on the staff laptop after the first click.
- **`useEffect` / click handlers calling Supabase.** Fetching players or games from a component effect or event handler with a key that was imported into the front-end graph. Same leak as a route file; first paint may look empty until the client round-trip.
- **Shared client module imported by both sides.** One `src/lib/supabase.ts` (or similar) that reads the secret and is imported by server functions **and** by routes/components. The client import graph then contains the secret even if the “intended” call site was the server.
- **Module-scope `process.env` in a file the client imports.** A top-of-file `const key = process.env.SUPABASE_SECRET_KEY` in a module pulled in by a route inlines the value into the client bundle and can be `undefined` on edge hosts. Read secrets only inside a server-function handler (or a `*.server.ts` factory that handler calls per request).
- **RPC return value includes secrets.** Server function / loader data shaped like `{ players, supabaseKey }` or forwarding `process.env`, the client object, or PostgREST errors that contain the connection string. Whatever the handler returns is visible to the browser.
- **Hardcoded `sb_secret_…` or `eyJ` `service_role` JWT in `src/`.** Git history then holds a key that bypasses RLS (`BYPASSRLS`).
- **Tracked env files.** Committing `.env`, `.env.local`, `.env.development` with real values. This repo already gitignores `.env` and `*.local`; a new tracked secrets file still fails.
- **`console.log(process.env)` or dumping Supabase errors in the page.** Full env objects and raw error payloads in the browser console are a leak even if the Network panel looks clean.
- **Relying on “secret keys 401 in the browser.”** `sb_secret_` may reject some browser `User-Agent`s; a legacy `service_role` JWT does not. Curl with a stolen key still works. If the key reached the device, rotate it in the dashboard and replace it in every local `.env`—do not treat the 401 as the boundary.
- **Open Data API while the app “only uses the secret on the server.”** `GET https://<project>.supabase.co/rest/v1/players` with the publishable/`anon` key can still return the roster if RLS is off and `anon` has `SELECT`. That is a project-door leak, not a Vite leak. Topic 1 does not require finishing RLS policy design; it does require not pretending the secret staying on the server closes `/rest/v1`.

---

## Must-move-server-side

Route loaders and UI may **call** a server function. They must not **perform** these operations.

- **The privileged credential.** `SUPABASE_SECRET_KEY` / `sb_secret_…`, legacy `SUPABASE_SERVICE_ROLE_KEY` / `service_role` JWT, `DATABASE_URL`, and any DB password. Never `VITE_*`. Never returned in JSON.
- **Server-only Supabase client.** A module that calls `createClient` with that credential, lives behind `*.server.ts` and/or Start’s server-only import marker, and is imported only by server-function handlers—not by `src/routes/*` or `src/components/*`.
- **Directory read orchestration.** Fetch player list, player detail, games list, and games-for-player; map rows; turn unknown ids into the HTTP 200 unknown-player DTO; replace raw PostgREST/connection errors with a staff-facing “directory unavailable” (or equivalent) that does not include key names or URLs with embedded passwords.
- **Env loading for secrets.** Read secret names inside the handler (or the server-only factory it calls per request). Document the public-vs-secret split in `.env.example` plus a typed server config module. This topic’s secret list is server-only; there is no required public Supabase key in the client.

Thin handler shape (planning, not code): validate input → fetch on the server → call a pure mapper/filter → return a DTO with only UI fields (id, name, number, position, date, opponent, status, playerId).

**Extract for Vitest (no I/O in these modules):** they must not import `@supabase/supabase-js`, `createServerFn`, or `process.env`.

- Coerce `position` / `status` / games `playerId` search params (`all` on missing or invalid).
- Check `playerId` path shape vs unknown id.
- Filter already-fetched arrays by position, status, or playerId.
- Map a typed row object to the UI DTO.

---

## May-stay-in-client

These do not need the service role key and must not send `apikey` to `*.supabase.co`.

- Presentational UI: tables/lists, filter chrome that writes search params, loading/empty/unknown-player copy, `AppNav` / `Header` / `Footer`, theme `localStorage`.
- File-based `Link`s to `/`, `/players`, `/players/$playerId`, `/games`, `/about`.
- Calling the **server function** from a route loader or `useServerFn` and rendering the returned DTO. Client-side navigations may re-call that function over HTTP to the **Start origin only**.
- Pure mapper/filter modules imported by UI **and** Vitest. Importing a mapper is allowed; importing the server-only Supabase client is not.
- Public, non-secret copy (product title, headings). This topic has **no** intentional public Supabase key. Do not add `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` “for later.”

---

## Success criteria checklist

Pass/fail only. A “maybe” fails Topic 1.

### Env and typed config

- [ ] `.env.example` lists secret names **without** values and **without** a `VITE_` prefix (e.g. `SUPABASE_URL`, `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`). Comments mark each as server-only.
- [ ] A typed config module on the server reads those names; it is not imported by route/component files to pass the secret into `createClient`.
- [ ] No `VITE_SUPABASE_SECRET_KEY`, `VITE_SUPABASE_SERVICE_ROLE_KEY`, or `VITE_DATABASE_URL` exists in the repo.
- [ ] `.gitignore` still includes `.env` and `*.local`; those files are untracked.

### Server boundary

- [ ] A server-only Supabase client module exists (`*.server.ts` or equivalent import protection) and **zero** `src/routes/*` or `src/components/*` files import it or `@supabase/supabase-js`.
- [ ] At least one TanStack Start `createServerFn` loads directory rows; `/players` and `/games` obtain data by calling that function (or a sibling function), not `createClient` and not `fetch` to `*.supabase.co`.
- [ ] After `npm run build`, searching **client** JS (not server chunks) finds none of: `sb_secret_`, `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `service_role` JWT (`eyJ`), `DATABASE_URL`.
- [ ] Browser Network: Home → Players → a player → Games produces **zero** requests to `supabase.co`. Payloads to the Start origin do not include the service role key.
- [ ] View Source / first HTML and server-function JSON contain DTO fields only—not `apikey`, `Authorization`, or env objects.

### Vitest (mapper proof)

- [ ] Vitest is configured (`package.json` test script).
- [ ] Pure directory mappers/filters live in a module with no Supabase/Start/env imports.
- [ ] At least one mapper (or filter/default) unit test **fails** if the function returns the wrong shape or ignores an invalid `position`/`status`, and **passes** when the function matches the brief’s defaults.
- [ ] That spec runs with no `SUPABASE_SECRET_KEY` in the environment and does not hit the network.

### Handoff

- [ ] A short handoff note (this file’s locked decision plus any answers added under Open questions) records: secrets are server-only, UI calls `createServerFn`, mappers are pure and tested. Next topic can implement remaining reads without re-litigating the boundary.

---

## Out of scope

Do not solve these in Topic 1.

- Full auth UX, login/logout, roles, Canvas/SSO, protected routes.
- Playwright E2E, CI gates, production host/domain setup.
- Production hardening beyond this boundary: complete RLS policy sets, Data API disable/redesign, key rotation runbooks, rate limits.
- Writes (create/edit/delete), extra routes (`/login`, `/admin`), Edge Functions as the data plane.
- Writing exploits, PoCs, or demonstrations of key theft. Defensive separation only.
- Implementing the client, env files, or tests **in this markdown file**. Later coding steps execute the checklist.
- Replacing the existing UI shell, Tailwind, or nav.

---

## Open questions

Resolve in later implementation steps; do not block this notes file.

1. **Server-function input/output contract.** Exact `createServerFn` validators and DTO fields for list vs detail vs games (one function with a `kind` argument vs three functions). Unknown `playerId` payload shape must stay HTTP 200 per the brief.
2. **Env var names.** Team standard for secret vs any future public key: `SUPABASE_URL` + `SUPABASE_SECRET_KEY` (`sb_secret_…`) vs legacy `SUPABASE_SERVICE_ROLE_KEY`. Do not introduce `VITE_*` for either while this directory stays server-only.
3. **Hosted vs local Supabase?** Shared class project, per-student cloud, or `supabase start` keys from `supabase status`. Local secrets must stay untracked and do not unlock hosted data.
4. **Bookmark ids.** Keep `player-000` as the path param (column on the row) vs switch `/players/$playerId` to UUIDs.
5. **Table/schema names.** Confirm `players` / `games` (or actual names) and that every game row has a `playerId` that matches a player.
6. **Home snapshot.** Real counts/names on `/` from the same list function or a smaller payload.
7. **Later auth.** User JWT + RLS vs Start session + secret key. Do not add a publishable key to the client until that decision exists.
8. **Supabase down on arena wifi.** First-paint HTML should still carry a staff-facing error DTO from the server function, not a spinner-only blank shell and not a leaked connection string.

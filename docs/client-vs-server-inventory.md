# Client vs Server Inventory — Hockey Operations Directory

## Plain-language model

The browser is a staff laptop on arena wifi: anything it downloads, a curious person can read in View Source or DevTools. The server is the only place a secret can live. The browser asks the server for player and game data; the server checks the request, reads the database with its secret key, and sends back only display-ready rows.

## 1. Safe on the browser client

| Item | Why it is safe |
|------|----------------|
| Route components (`src/routes/*.tsx`), `AppNav`, `Header` | Markup and links only; no credentials |
| URL path and search params (`/players/player-000`, `?position=forward`, `?status=final`) | Staff type and share these; they are validated, never trusted |
| `PlayerCard` / `GameCard` DTOs returned by server functions | Already filtered and shaped; no internal columns |
| `VITE_APP_NAME` | Designed to be public |
| Pure mappers and search parsers (`src/lib/directory/mappers.ts`) | No I/O, no env |

## 2. Must stay on the server

| Item | Where it lives |
|------|----------------|
| `SUPABASE_SECRET_KEY` (bypasses RLS) | Server env only, read through `getServerEnv()` |
| `SUPABASE_URL` used with the secret key | Server env only |
| Supabase client built with the secret key | `src/lib/supabase.server.ts`, imported only by `src/server/*` |
| Raw `players` / `games` rows, including `is_active` | Read inside server-function handlers, mapped before returning |
| Database error details | Logged on the server; the browser gets a generic message |

## 3. Boundary questions still open

- Sprint 3 adds a real Supabase schema: which tables need RLS before anything reads them with a publishable key?
- Sprint 4 adds sign-in: which server functions must verify the session before returning rows?
- Does any future feature need the browser to talk to Supabase directly? Default answer: no.

## Diagram (keep secrets on the right)

```text
 Browser (untrusted)                       Server (trusted)
 ───────────────────                       ────────────────
 /players?position=forward  ── RPC ──▶  getPlayers handler
                                          │ getServerEnv() → SUPABASE_SECRET_KEY
                                          │ supabase.from('players')
                                          ▼
 PlayerCard[] (display only)  ◀───────  toPlayerCards(rows)
```

## How I will use this inventory later

Every new file gets placed in one column before it is written. A pull request that imports `supabase.server` from a route, adds a `VITE_` secret, or returns raw rows fails review against this page.

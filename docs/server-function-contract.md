# Server Function Contract — Hockey Operations Directory

## Purpose

Load roster and schedule data on the server so the secret Supabase key never reaches the browser, and hand routes display-ready DTOs.

## Function identity

All four live in `src/server/directory.ts` and are created with `createServerFn({ method: 'GET' })`.

| Function | Called by |
|----------|-----------|
| `getPlayers` | `/players` loader |
| `getPlayer` | `/players/$playerId` loader |
| `getGames` | `/games` loader |
| `getDirectorySummary` | `/` loader |

## Inputs (from the UI / caller)

| Function | Input | Validation |
|----------|-------|------------|
| `getPlayers` | `{ position }` | `parsePositionFilter`: unknown → `'all'` |
| `getPlayer` | `{ playerId }` | must match `player-NNN`, else treated as unknown |
| `getGames` | `{ status, playerId }` | `parseStatusFilter`, `parsePlayerFilter`: unknown → `'all'` |
| `getDirectorySummary` | none | — |

Inputs are re-validated on the server even though routes already validate search params: the RPC endpoint can be called directly.

## Success output

- `getPlayers` → `PlayerCard[]` (`id`, `displayName`, `number`, `position`), active only, sorted by number.
- `getPlayer` → `{ player: PlayerCard | null, games: GameCard[] }`. Unknown ids return `player: null` and the page still renders with HTTP 200.
- `getGames` → `{ games: GameCard[], players: PlayerCard[] }` (players feed the filter dropdown).
- `getDirectorySummary` → `{ playerCount, upcomingCount, finalCount }`.

### Mapping notes (UI-facing, not raw DB dump)

`is_active` is consumed on the server and never returned. `player_id` becomes `playerId` with the player's display name attached. Names are whitespace-normalized; blanks become `Unknown player`.

## Error shapes

A database error throws `Error('Unable to load the directory. Please try again later.')`. No connection strings, keys, or PostgREST details cross the boundary.

## Pure logic vs I/O (critical for later Vitest)

### Pure (no network, no env reads) — extract later into mappers

`normalizeDisplayName`, `parsePositionFilter`, `parseStatusFilter`, `parsePlayerFilter`, `isValidPlayerId`, `filterActivePlayers`, `mapPlayerRow`, `toPlayerCards`, `toGameCards` in `src/lib/directory/mappers.ts`.

### I/O / server-only

`loadPlayers` and `loadGames` in `src/server/directory.ts`, `getSupabaseServerClient` in `src/lib/supabase.server.ts`, `getServerEnv` in `src/config/env.ts`.

## Boundary rules (from prior docs)

- No `VITE_` prefix on any secret (`docs/boundary-risk-notes.md`).
- Routes never import `supabase.server.ts`; they call server functions.
- Secrets are read at call time inside handlers, not at module scope.

## Non-goals (out of scope for this function)

Writes, sign-in, per-role visibility, and caching are later sprints.

## Acceptance checks for implementers (Step 7+)

- [x] `/players/player-000` renders name, number, position after a hard refresh.
- [x] `/players?position=goalieeeee` renders the full roster.
- [x] Built client bundle contains no `SUPABASE_SECRET_KEY`, `supabase-js`, or `createClient(`.
- [x] With no Supabase env, handlers serve the built-in seed roster.

## Traceability

`docs/requirements-brief.md` (seed data, search params), `docs/boundary-risk-notes.md`, `docs/client-vs-server-inventory.md`.

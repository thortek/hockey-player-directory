# Scouting data-access public API

## Purpose

Every read, write, and aggregate the hockey app makes goes through three typed modules. Joins, filters, writes, and the aggregate stay schema-safe because their types come from `src/types/database.ts`, generated from the live database.

## Allowed functions

Each helper takes the client as its first argument (`DbClient` from `src/lib/supabase/client.ts`). Scouting server functions in `src/server/*` call `requireSession()` and pass that staff member's own client (`src/lib/supabase/server.ts`), so Postgres RLS filters every row. Only the public directory (`src/server/directory.ts`) uses the secret key, and only for `players` and `games`.

| Module | Function | Returns | Scout use |
|--------|----------|---------|-----------|
| `src/lib/scouting/queries.ts` | `listPlayers(db, { position?, activeOnly? })` | `PlayerRow[]` | Roster list and position filter |
| | `getPlayerById(db, id)` | `PlayerRow \| null` | Player detail page |
| | `listGames(db, { status?, playerId? })` | `GameRow[]` | Games board; `playerId` = games where the player has events |
| | `getGameById(db, id)` | `GameRow \| null` | Single game view |
| | `listScoutingEvents(db, { playerId?, gameId?, eventType? })` | `ScoutingEventWithRefs[]` | Event lists with player and game joined |
| `src/lib/scouting/mutations.ts` | `createScoutingEvent(db, input)` | `MutationResult<scouting_events row>` | Log an observation |
| | `updateScoutingEvent(db, eventId, patch)` | `MutationResult<scouting_events row>` | Fix an event's type, period, clock, or note |
| | `updateScoutingEventNotes(db, eventId, notes)` | `MutationResult<scouting_events row>` | Edit only an event's note |
| | `createPlayer(db, input)` | `MutationResult<players row>` | Add a player to the roster |
| | `updatePlayerRoster(db, playerId, patch)` | `MutationResult<players row>` | Change number, position, team, or active flag |
| | `createGame(db, input)` | `MutationResult<games row>` | Add a game to the schedule |
| | `updateGame(db, gameId, patch)` | `MutationResult<games row>` | Change a game's date, opponent, venue, or status |
| `src/lib/scouting/rpc.ts` | `getPlayerEventTotals(db, { p_game_id?, p_from?, p_to? })` | `PlayerEventTotalsRow[]` | Per-player totals from `public.player_event_totals` |

Reads throw on a database error; server functions turn that into the safe message from `docs/server-function-contract.md`. Writes return `{ data, error }` with a message a scout can act on.

## Browser access: TanStack Query hooks

Components use these hooks; each `queryFn` calls a server function in `src/server/scouting.ts`, which validates input, verifies the session with `requireSession()`, and runs the matching helper above as the signed-in staff member. A signed-out call fails with 401 before any query runs.

| Hook (`src/lib/scouting/hooks.ts`) | Server function | Helper | Cache key (`query-keys.ts`) |
|------------------------------------|-----------------|--------|-----------------------------|
| `usePlayers({ position? })` | `fetchPlayers` | `listPlayers` | `scoutingKeys.playerList(filters)` |
| `usePlayer(playerId)` (disabled without an id) | `fetchPlayer` | `getPlayerById` | `scoutingKeys.playerDetail(id)` |
| `useGames({ status?, playerId? })` | `fetchGames` | `listGames` | `scoutingKeys.gameList(filters)` |
| `useScoutingEvents({ playerId?, gameId?, eventType? })` | `fetchScoutingEvents` | `listScoutingEvents` | `scoutingKeys.eventList(filters)` |
| `usePlayerEventTotals({ gameId?, from?, to? })` | `fetchPlayerEventTotals` | `getPlayerEventTotals` | `scoutingKeys.playerEventTotals(filters)` |

| `useGame(gameId)` (disabled without an id) | `fetchGame` | `getGameById` | `scoutingKeys.gameDetail(id)` |

Write hooks (`src/lib/scouting/mutation-hooks.ts`) are one per helper in `mutations.ts`: `useCreatePlayer`, `useUpdatePlayerRoster`, `useCreateGame`, `useUpdateGame`, `useCreateScoutingEvent`, `useUpdateScoutingEvent`, `useUpdateScoutingEventNotes`. Each runs its helper by name through the `runScoutingMutation` server function (`src/server/scouting-mutations.ts`), which validates that helper's arguments and calls it with the server client. What each one invalidates is in `docs/scouting-cache-invalidation-map.md`.

## Private: never import or call these from routes, components, or hooks

- `src/lib/supabase.server.ts` (the secret key). Only `src/server/*` may import it.
- `createClient` anywhere outside `src/lib/supabase/client.ts` and `src/lib/supabase.server.ts`.
- Raw `.from('table')` outside `src/lib/scouting/queries.ts` and `mutations.ts`.
- `.rpc('function_name', …)` outside `src/lib/scouting/rpc.ts`.
- SQL strings in application code. Schema and functions change only through `supabase/migrations/`.

Quick audit (should print nothing):

```bash
grep -rnE "\.rpc\(|\.from\('" src | grep -v "^src/lib/scouting/"
```

## Type contract

- Row, Insert, Update, Args, and Returns types come from `src/types/database.ts`; nothing is cast to `any`.
- After a migration, regenerate types (`docs/typegen-notes.md`) before writing callers. `npm run typecheck` then lists every call site the change affects.

## Stability rule

When a new screen needs data this table does not offer, add a typed helper to the right module, add a row here, then use it. Do not reach around the layer.

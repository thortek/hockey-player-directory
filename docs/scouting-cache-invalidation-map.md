# Scouting cache invalidation map

Every write hook in `src/lib/scouting/mutation-hooks.ts`, the `mutations.ts` helper it runs (through the `runScoutingMutation` server function, so the browser never holds a database client), and the cache keys from `src/lib/scouting/query-keys.ts` it invalidates on success. Invalidating a prefix such as `eventLists()` refetches every filtered list under it that is on screen and marks the rest stale. No hook invalidates the whole `['scouting']` tree or calls `invalidateQueries()` without a key.

## Players

| Hook | Helper | Invalidates | Why a scout cares |
|------|--------|-------------|-------------------|
| `useCreatePlayer` | `createPlayer` | `playerLists()` | The new player appears in the roster and position filters. They have no events yet, so totals and event lists are unchanged |
| `useUpdatePlayerRoster` | `updatePlayerRoster` | `playerLists()`, `playerDetail(player.id)` | Position or active flag changes which lists the player is in; the detail header shows number and position |
| | | `eventLists()`, `aggregates()` | Event rows and totals rows show the player's jersey number and position |

## Games

| Hook | Helper | Invalidates | Why a scout cares |
|------|--------|-------------|-------------------|
| `useCreateGame` | `createGame` | `gameLists()` | The game appears on the board and in game pickers. No events reference it yet |
| `useUpdateGame` | `updateGame` | `gameLists()`, `gameDetail(game.id)` | Date, opponent, or final/upcoming status changed |
| | | `eventLists()` | Event rows show the game's opponent and date |
| | | `aggregates()` | A changed date can move the game into or out of a date-range total |

## Scouting events

| Hook | Helper | Invalidates | Why a scout cares |
|------|--------|-------------|-------------------|
| `useCreateScoutingEvent` | `createScoutingEvent` | `eventLists()` | The event belongs in the unfiltered feed and the lists filtered by its player, game, or type |
| | | `aggregates()` | That player's totals change for every game or range that includes this game |
| | | `gameLists()` | "Games this player was scouted in" can gain a game |
| | | `playerDetail(event.player_id)`, `gameDetail(event.game_id)` | The player's and the game's views list their events |
| `useUpdateScoutingEvent` | `updateScoutingEvent` | Same five as create | Changing `event_type` moves a count between totals columns (a shot becomes a goal); the event's row changes everywhere it is listed |
| `useUpdateScoutingEventNotes` | `updateScoutingEventNotes` | `eventLists()`, `playerDetail(event.player_id)`, `gameDetail(event.game_id)` | Notes show in event rows and in the player and game views |

## What is deliberately not invalidated

- `useUpdateScoutingEventNotes` leaves `aggregates()` alone: a note never changes a count.
- Creating an event leaves `playerLists()` alone: roster rows show no event-derived fields.
- Creating a player or a game touches only its own lists: nothing references it yet.

## Checking it

1. Open `/scouting/events` and `/scouting/aggregates` in two tabs.
2. Log a goal on `/scouting/events`. The events list shows it without a reload.
3. Switch to the aggregates tab: the player's goal count updates when the tab regains focus (TanStack Query refetches stale queries on focus). Verified on production in `docs/scouting-acceptance-verification.md` (A3, C2).

## Rule for new writes

A new helper in `mutations.ts` gets an entry in `scoutingMutations`, a hook here, and a row in this table naming every key prefix it invalidates and why. Anything it changes that isn't listed is a stale-data bug.

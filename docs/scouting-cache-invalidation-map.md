# Scouting cache invalidation map

Every write hook in `src/lib/scouting/mutation-hooks.ts`, the write it performs, and the cache keys (from `src/lib/scouting/query-keys.ts`) it invalidates on success. Invalidating a prefix such as `eventLists()` refetches every filtered list under it that is on screen and marks the rest stale. No hook invalidates the whole `['scouting']` tree or the whole cache.

| Hook | Server function → helper | Invalidates | Why a scout cares |
|------|--------------------------|-------------|-------------------|
| `useCreateScoutingEvent` | `saveScoutingEvent` → `createScoutingEvent` | `eventLists()` | The new event must appear in the unfiltered feed and in the lists filtered by its player, game, or type |
| | | `aggregates()` | Goals/assists/shots totals for this player change for every game or date range that includes this game |
| | | `gameLists()` | "Games this player was scouted in" can gain a game the first time a player gets an event in it |
| | | `playerDetail(event.player_id)` | The player's detail view shows their events and games |
| `useUpdateScoutingEventNotes` | `saveScoutingEventNotes` → `updateScoutingEventNotes` | `eventLists()` | Notes show only in event rows; counts, games, and rosters are unchanged, so nothing else refetches |
| `useUpdatePlayerRoster` | `savePlayerRoster` → `updatePlayerRoster` | `playerLists()` | Position or active flag changes which lists the player appears in |
| | | `playerDetail(player.id)` | Detail header shows number and position |
| | | `eventLists()` | Event rows show the joined player's name and number |
| | | `aggregates()` | Totals rows include jersey number and position |

## What is deliberately not invalidated

- `useUpdateScoutingEventNotes` leaves `aggregates()` alone: a note never changes a count.
- No write touches `gameLists()` except creating an event; games themselves are not edited in the app.

## Checking it

1. Open `/scouting/events` and `/scouting/aggregates` in two tabs.
2. Log a goal on `/scouting/events`. The events list shows it without a reload.
3. Switch to the aggregates tab: the player's goal count updates when the tab regains focus (TanStack Query refetches stale queries on focus).

## Rule for new writes

A new write hook adds a row here before it merges, naming every key prefix it invalidates and why. Anything it changes that isn't listed is a stale-data bug.

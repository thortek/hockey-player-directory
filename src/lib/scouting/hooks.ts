// TanStack Query read hooks for scouting data.
// Each queryFn calls a server function in src/server/scouting.ts, which runs
// the typed helper from queries.ts or rpc.ts on the server. Hooks hold no
// Supabase client and no query strings; data types come from those helpers.

import { useQuery } from '@tanstack/react-query'
import {
  fetchGame,
  fetchGames,
  fetchPlayer,
  fetchPlayerEventTotals,
  fetchPlayers,
  fetchScoutingEvents,
} from '#/server/scouting'
import {
  scoutingKeys,
  type EventListFilters,
  type GameListFilters,
  type PlayerListFilters,
  type TotalsFilters,
} from './query-keys'

/** Scouting lists change only when someone logs an event; refetch after 30s. */
const STALE_MS = 30_000

export function usePlayers(filters: PlayerListFilters = {}) {
  return useQuery({
    queryKey: scoutingKeys.playerList(filters),
    queryFn: () => fetchPlayers({ data: filters }),
    staleTime: STALE_MS,
  })
}

export function usePlayer(playerId: string | undefined) {
  return useQuery({
    queryKey: scoutingKeys.playerDetail(playerId ?? ''),
    queryFn: () => fetchPlayer({ data: { playerId } }),
    enabled: Boolean(playerId),
    staleTime: STALE_MS,
  })
}

export function useGames(filters: GameListFilters = {}) {
  return useQuery({
    queryKey: scoutingKeys.gameList(filters),
    queryFn: () => fetchGames({ data: filters }),
    staleTime: STALE_MS,
  })
}

export function useGame(gameId: string | undefined) {
  return useQuery({
    queryKey: scoutingKeys.gameDetail(gameId ?? ''),
    queryFn: () => fetchGame({ data: { gameId } }),
    enabled: Boolean(gameId),
    staleTime: STALE_MS,
  })
}

export function useScoutingEvents(filters: EventListFilters = {}) {
  return useQuery({
    queryKey: scoutingKeys.eventList(filters),
    queryFn: () => fetchScoutingEvents({ data: filters }),
    staleTime: STALE_MS,
  })
}

export function usePlayerEventTotals(filters: TotalsFilters = {}) {
  return useQuery({
    queryKey: scoutingKeys.playerEventTotals(filters),
    queryFn: () => fetchPlayerEventTotals({ data: filters }),
    staleTime: STALE_MS,
  })
}

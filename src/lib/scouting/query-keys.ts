// Hierarchical TanStack Query keys for scouting data. Every key starts with
// 'scouting' and then the entity, so invalidating a prefix (all player lists,
// all aggregates) refreshes exactly the related cache entries.
// List keys carry their filters, so two filters never share a cache entry.

import type { EventType, GameStatus, Position } from './queries'

export type PlayerListFilters = { position?: Position }
export type GameListFilters = { status?: GameStatus; playerId?: string }
export type EventListFilters = { playerId?: string; gameId?: string; eventType?: EventType }
export type TotalsFilters = { gameId?: string; from?: string; to?: string }

export const scoutingKeys = {
  all: ['scouting'] as const,

  players: () => [...scoutingKeys.all, 'players'] as const,
  playerLists: () => [...scoutingKeys.players(), 'list'] as const,
  playerList: (filters: PlayerListFilters = {}) => [...scoutingKeys.playerLists(), filters] as const,
  playerDetail: (playerId: string) => [...scoutingKeys.players(), 'detail', playerId] as const,

  games: () => [...scoutingKeys.all, 'games'] as const,
  gameLists: () => [...scoutingKeys.games(), 'list'] as const,
  gameList: (filters: GameListFilters = {}) => [...scoutingKeys.gameLists(), filters] as const,
  gameDetail: (gameId: string) => [...scoutingKeys.games(), 'detail', gameId] as const,

  events: () => [...scoutingKeys.all, 'events'] as const,
  eventLists: () => [...scoutingKeys.events(), 'list'] as const,
  eventList: (filters: EventListFilters = {}) => [...scoutingKeys.eventLists(), filters] as const,

  aggregates: () => [...scoutingKeys.all, 'aggregates'] as const,
  playerEventTotals: (filters: TotalsFilters = {}) =>
    [...scoutingKeys.aggregates(), 'player-event-totals', filters] as const,
}

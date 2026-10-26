// Typed, composable read helpers for players, games, and scouting events.
// Read-only: writes live in mutations.ts, caching in the TanStack Query hooks.
// Every helper takes the client so the same query runs with the server's
// secret-key client today and a signed-in staff client in Sprint 4.

import type { DbClient } from '#/lib/supabase/client'
import type { Tables } from '#/types/database'

export type PlayerRow = Tables<'players'>
export type GameRow = Tables<'games'>
export type ScoutingEventRow = Tables<'scouting_events'>
export type Position = 'forward' | 'defense' | 'goalie'
export type GameStatus = 'upcoming' | 'final'
export type EventType = ScoutingEventRow['event_type']

export type PlayerListFilters = { position?: Position; activeOnly?: boolean }
export type GameListFilters = { status?: GameStatus; playerId?: string }
export type EventListFilters = { playerId?: string; gameId?: string; eventType?: string }

/** A scouting event joined to the player and game it belongs to. */
export type ScoutingEventWithRefs = ScoutingEventRow & {
  player: Pick<PlayerRow, 'id' | 'full_name' | 'jersey_number' | 'position'>
  game: Pick<GameRow, 'id' | 'opponent' | 'played_at' | 'status'>
}

export async function listPlayers(db: DbClient, filters: PlayerListFilters = {}): Promise<PlayerRow[]> {
  let query = db.from('players').select('*').order('jersey_number')
  if (filters.position) query = query.eq('position', filters.position)
  if (filters.activeOnly ?? true) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getPlayerById(db: DbClient, id: string): Promise<PlayerRow | null> {
  const { data, error } = await db.from('players').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

/** Games newest first; with playerId, only games where that player has events. */
export async function listGames(db: DbClient, filters: GameListFilters = {}): Promise<GameRow[]> {
  if (filters.playerId) {
    let query = db
      .from('games')
      .select('*, scouting_events!inner(player_id)')
      .eq('scouting_events.player_id', filters.playerId)
      .order('played_at', { ascending: false })
    if (filters.status) query = query.eq('status', filters.status)
    const { data, error } = await query
    if (error) throw error
    // The inner join repeats a game once per matching event; keep one row each.
    const unique = new Map(data.map(({ scouting_events: _events, ...game }) => [game.id, game]))
    return [...unique.values()]
  }
  let query = db.from('games').select('*').order('played_at', { ascending: false })
  if (filters.status) query = query.eq('status', filters.status)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getGameById(db: DbClient, id: string): Promise<GameRow | null> {
  const { data, error } = await db.from('games').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

/** Events with their player and game, latest game first, then game clock. */
export async function listScoutingEvents(
  db: DbClient,
  filters: EventListFilters = {},
): Promise<ScoutingEventWithRefs[]> {
  let query = db
    .from('scouting_events')
    .select(
      '*, player:players!inner(id, full_name, jersey_number, position), game:games!inner(id, opponent, played_at, status)',
    )
  if (filters.playerId) query = query.eq('player_id', filters.playerId)
  if (filters.gameId) query = query.eq('game_id', filters.gameId)
  if (filters.eventType) query = query.eq('event_type', filters.eventType)
  const { data, error } = await query
  if (error) throw error
  return data.sort(
    (a, b) =>
      b.game.played_at.localeCompare(a.game.played_at) ||
      (a.period ?? 0) - (b.period ?? 0) ||
      (a.clock_seconds ?? 0) - (b.clock_seconds ?? 0),
  )
}

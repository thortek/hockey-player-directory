// Pure helpers only: no Supabase client, no env, no I/O.
// Server functions fetch rows, then call these to shape what the UI receives.

import type { GameRow, GameStatus, PlayerRow, Position } from '#/data/seed'

export type PlayerCard = {
  id: string
  displayName: string
  number: number
  position: Position
}

export type GameCard = {
  id: string
  date: string
  opponent: string
  status: GameStatus
  playerId: string
  playerName: string
}

export type PositionFilter = Position | 'all'
export type StatusFilter = GameStatus | 'all'

const POSITIONS: readonly PositionFilter[] = ['all', 'forward', 'defense', 'goalie']
const STATUSES: readonly StatusFilter[] = ['all', 'upcoming', 'final']
const PLAYER_ID = /^player-\d{3}$/

/** Collapse null or blank names so the UI never shows an empty label. */
export function normalizeDisplayName(name: string | null | undefined): string {
  const trimmed = name?.replace(/\s+/g, ' ').trim()
  return trimmed ? trimmed : 'Unknown player'
}

export function isValidPlayerId(value: unknown): value is string {
  return typeof value === 'string' && PLAYER_ID.test(value)
}

/** Bad or missing ?position= falls back to 'all' instead of throwing. */
export function parsePositionFilter(value: unknown): PositionFilter {
  return POSITIONS.includes(value as PositionFilter) ? (value as PositionFilter) : 'all'
}

export function parseStatusFilter(value: unknown): StatusFilter {
  return STATUSES.includes(value as StatusFilter) ? (value as StatusFilter) : 'all'
}

export function parsePlayerFilter(value: unknown): string {
  return isValidPlayerId(value) ? value : 'all'
}

export function filterActivePlayers(rows: PlayerRow[]): PlayerRow[] {
  return rows.filter((row) => row.is_active)
}

export function mapPlayerRow(row: PlayerRow): PlayerCard {
  return {
    id: row.id,
    displayName: normalizeDisplayName(row.name),
    number: row.number,
    position: row.position,
  }
}

/** Active players matching the position filter, sorted by jersey number. */
export function toPlayerCards(rows: PlayerRow[], position: PositionFilter): PlayerCard[] {
  return filterActivePlayers(rows)
    .filter((row) => position === 'all' || row.position === position)
    .map(mapPlayerRow)
    .sort((a, b) => a.number - b.number)
}

/** Games matching both filters, newest first, labelled with the player's name. */
export function toGameCards(
  games: GameRow[],
  players: PlayerRow[],
  filters: { status: StatusFilter; playerId: string },
): GameCard[] {
  const names = new Map(players.map((p) => [p.id, normalizeDisplayName(p.name)]))
  return games
    .filter((g) => filters.status === 'all' || g.status === filters.status)
    .filter((g) => filters.playerId === 'all' || g.player_id === filters.playerId)
    .map((g) => ({
      id: g.id,
      date: g.date,
      opponent: g.opponent,
      status: g.status,
      playerId: g.player_id,
      playerName: names.get(g.player_id) ?? g.player_id,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

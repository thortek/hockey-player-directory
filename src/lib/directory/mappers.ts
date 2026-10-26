// Pure helpers only: no Supabase client, no env, no I/O.
// Server functions fetch rows, then call these to shape what the UI receives.

import type {
  GameRow,
  GameStatus,
  PlayerRow,
  Position,
  ScoutingEventWithRefs,
} from '#/lib/scouting/queries'

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
  isHome: boolean
  status: GameStatus
}

export type EventCard = {
  id: string
  type: string
  period: number | null
  clock: string | null
  notes: string | null
  playerId: string
  playerName: string
  gameId: string
  opponent: string
  date: string
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
    displayName: normalizeDisplayName(row.full_name),
    number: row.jersey_number,
    position: row.position as Position,
  }
}

/** Active players matching the position filter, sorted by jersey number. */
export function toPlayerCards(rows: PlayerRow[], position: PositionFilter): PlayerCard[] {
  return filterActivePlayers(rows)
    .filter((row) => position === 'all' || row.position === position)
    .map(mapPlayerRow)
    .sort((a, b) => a.number - b.number)
}

export function toGameCards(rows: GameRow[]): GameCard[] {
  return rows
    .map((g) => ({
      id: g.id,
      date: g.played_at,
      opponent: g.opponent,
      isHome: g.is_home,
      status: g.status as GameStatus,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** 754 seconds → "12:34" (elapsed time in the period). */
export function formatClock(seconds: number | null): string | null {
  if (seconds === null) return null
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function toEventCards(rows: ScoutingEventWithRefs[]): EventCard[] {
  return rows.map((e) => ({
    id: e.id,
    type: e.event_type,
    period: e.period,
    clock: formatClock(e.clock_seconds),
    notes: e.notes,
    playerId: e.player.id,
    playerName: normalizeDisplayName(e.player.full_name),
    gameId: e.game.id,
    opponent: e.game.opponent,
    date: e.game.played_at,
  }))
}

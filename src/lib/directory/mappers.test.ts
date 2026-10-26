import { describe, expect, it } from 'vitest'
import type { GameRow, PlayerRow, ScoutingEventWithRefs } from '#/lib/scouting/queries'
import {
  formatClock,
  normalizeDisplayName,
  parsePlayerFilter,
  parsePositionFilter,
  parseStatusFilter,
  toEventCards,
  toGameCards,
  toPlayerCards,
} from './mappers'

const stamp = '2026-10-01T00:00:00Z'
const player = (id: string, full_name: string, jersey_number: number, position: string, is_active = true): PlayerRow => ({
  id,
  full_name,
  jersey_number,
  position,
  is_active,
  team_name: 'Utah Hockey Ops',
  created_at: stamp,
  updated_at: stamp,
})

const players: PlayerRow[] = [
  player('player-000', 'Avery  Nguyen ', 17, 'forward'),
  player('player-001', 'Owen Tremblay', 44, 'defense'),
  player('player-002', 'Sam Ortiz', 26, 'forward', false),
]

const game = (id: string, played_at: string, status: string): GameRow => ({
  id,
  played_at,
  opponent: 'Seattle Kraken',
  is_home: true,
  venue: 'Delta Center',
  status,
  created_at: stamp,
})

describe('normalizeDisplayName', () => {
  // Cards and filters need stable labels: no "null", no double spaces.
  it('collapses whitespace', () => {
    expect(normalizeDisplayName('Avery  Nguyen ')).toBe('Avery Nguyen')
  })

  it('falls back when the name is blank', () => {
    expect(normalizeDisplayName('   ')).toBe('Unknown player')
    expect(normalizeDisplayName(null)).toBe('Unknown player')
  })
})

describe('search param parsers', () => {
  // A mistyped bookmark must still render the list, never throw.
  it('treats unknown values as all', () => {
    expect(parsePositionFilter('goalieeeee')).toBe('all')
    expect(parsePositionFilter('')).toBe('all')
    expect(parseStatusFilter(42)).toBe('all')
    expect(parsePlayerFilter('p-17')).toBe('all')
  })

  it('keeps valid values', () => {
    expect(parsePositionFilter('defense')).toBe('defense')
    expect(parseStatusFilter('final')).toBe('final')
    expect(parsePlayerFilter('player-000')).toBe('player-000')
  })
})

describe('toPlayerCards', () => {
  it('drops inactive players and sorts by jersey number', () => {
    const cards = toPlayerCards(players, 'all')
    expect(cards.map((c) => c.id)).toEqual(['player-000', 'player-001'])
    expect(cards[0]).toMatchObject({ displayName: 'Avery Nguyen', number: 17 })
  })

  it('applies the position filter', () => {
    expect(toPlayerCards(players, 'defense').map((c) => c.id)).toEqual(['player-001'])
  })
})

describe('toGameCards', () => {
  it('orders games newest first', () => {
    const cards = toGameCards([game('game-000', '2026-10-01T02:00:00Z', 'final'), game('game-001', '2026-11-01T02:00:00Z', 'upcoming')])
    expect(cards.map((c) => c.id)).toEqual(['game-001', 'game-000'])
  })
})

describe('toEventCards', () => {
  it('flattens the joined player and game', () => {
    const event: ScoutingEventWithRefs = {
      id: 'e1',
      player_id: 'player-000',
      game_id: 'game-000',
      event_type: 'goal',
      period: 2,
      clock_seconds: 754,
      notes: null,
      created_at: stamp,
      updated_at: stamp,
      player: { id: 'player-000', full_name: 'Avery Nguyen', jersey_number: 17, position: 'forward' },
      game: { id: 'game-000', opponent: 'Seattle Kraken', played_at: stamp, status: 'final' },
    }
    expect(toEventCards([event])[0]).toMatchObject({ playerName: 'Avery Nguyen', opponent: 'Seattle Kraken', clock: '12:34' })
  })

  it('formats a missing clock as null', () => {
    expect(formatClock(null)).toBeNull()
    expect(formatClock(5)).toBe('0:05')
  })
})

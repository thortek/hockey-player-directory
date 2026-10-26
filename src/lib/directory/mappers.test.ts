import { describe, expect, it } from 'vitest'
import type { GameRow, PlayerRow } from '#/data/seed'
import {
  normalizeDisplayName,
  parsePlayerFilter,
  parsePositionFilter,
  parseStatusFilter,
  toGameCards,
  toPlayerCards,
} from './mappers'

const players: PlayerRow[] = [
  { id: 'player-000', name: 'Avery  Nguyen ', number: 17, position: 'forward', is_active: true },
  { id: 'player-001', name: 'Owen Tremblay', number: 44, position: 'defense', is_active: true },
  { id: 'player-002', name: 'Sam Ortiz', number: 26, position: 'forward', is_active: false },
]

const games: GameRow[] = [
  { id: 'g1', date: '2026-10-01T02:00:00Z', opponent: 'Seattle Kraken', status: 'final', player_id: 'player-000' },
  { id: 'g2', date: '2026-11-01T02:00:00Z', opponent: 'Dallas Stars', status: 'upcoming', player_id: 'player-001' },
]

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
  it('labels games with player names, newest first', () => {
    const cards = toGameCards(games, players, { status: 'all', playerId: 'all' })
    expect(cards.map((c) => c.id)).toEqual(['g2', 'g1'])
    expect(cards[1]?.playerName).toBe('Avery Nguyen')
  })

  it('combines status and player filters', () => {
    expect(toGameCards(games, players, { status: 'final', playerId: 'player-001' })).toEqual([])
    expect(toGameCards(games, players, { status: 'upcoming', playerId: 'player-001' })).toHaveLength(1)
  })
})

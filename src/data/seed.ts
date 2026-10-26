// Built-in seed roster and schedule (docs/requirements-brief.md "Seed data").
// Holds no secrets, so both server and client modules may import the types.
// The server functions serve these rows until a Supabase project is configured.

export type Position = 'forward' | 'defense' | 'goalie'
export type GameStatus = 'upcoming' | 'final'

export type PlayerRow = {
  id: string
  name: string
  number: number
  position: Position
  is_active: boolean
}

export type GameRow = {
  id: string
  date: string
  opponent: string
  status: GameStatus
  player_id: string
}

const roster: Array<[string, number, Position]> = [
  ['Avery Nguyen', 17, 'forward'],
  ['Mason Lindqvist', 9, 'forward'],
  ['Theo Boucher', 21, 'forward'],
  ['Kai Morrison', 12, 'forward'],
  ['Elias Novak', 88, 'forward'],
  ['Jonah Whitfield', 14, 'forward'],
  ['Rowan Petrov', 27, 'forward'],
  ['Declan Ashby', 19, 'forward'],
  ['Silas Okafor', 11, 'forward'],
  ['Luca Hartmann', 23, 'forward'],
  ['Finn Calloway', 7, 'forward'],
  ['Nico Valtonen', 39, 'forward'],
  ['Owen Tremblay', 44, 'defense'],
  ['Gavin Strand', 5, 'defense'],
  ['Henrik Sato', 2, 'defense'],
  ['Isaac Delorme', 77, 'defense'],
  ['Brody Kowalski', 55, 'defense'],
  ['Wes Abernathy', 4, 'defense'],
  ['Caleb Rousseau', 6, 'defense'],
  ['Mateo Lindgren', 3, 'defense'],
  ['Jasper Holm', 31, 'goalie'],
  ['Dmitri Volkov', 35, 'goalie'],
  ['Reid Castellanos', 30, 'goalie'],
  ['Sam Ortiz', 26, 'forward'],
]

export const seedPlayers: PlayerRow[] = roster.map(([name, number, position], i) => ({
  id: `player-${String(i).padStart(3, '0')}`,
  name,
  number,
  position,
  // One inactive player proves the directory filters inactive rows.
  is_active: name !== 'Sam Ortiz',
}))

const opponents = [
  'Utah Mammoth',
  'Colorado Avalanche',
  'Vegas Golden Knights',
  'Seattle Kraken',
  'Calgary Flames',
  'Edmonton Oilers',
  'Vancouver Canucks',
  'Minnesota Wild',
  'Dallas Stars',
  'Winnipeg Jets',
  'San Jose Sharks',
]

export const seedGames: GameRow[] = Array.from({ length: 22 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 9, 3 + i * 3, 2))
  return {
    id: `game-${String(i).padStart(3, '0')}`,
    date: date.toISOString(),
    opponent: opponents[i % opponents.length]!,
    status: i < 11 ? 'final' : 'upcoming',
    player_id: seedPlayers[(i * 5) % 23]!.id,
  }
})

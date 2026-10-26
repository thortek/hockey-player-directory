// One server function for every scouting write. The browser sends the name of
// a helper in src/lib/scouting/mutations.ts plus its arguments; this validates
// the arguments for that helper and runs it with the server client.

import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '#/lib/supabase.server'
import { isValidPlayerId } from '#/lib/directory/mappers'
import type { EventType } from '#/lib/scouting/queries'
import type { Tables } from '#/types/database'
import {
  scoutingMutations,
  type GamePatch,
  type MutationResult,
  type PlayerRosterPatch,
  type ScoutingEventPatch,
  type ScoutingMutationArgs,
  type ScoutingMutationName,
} from '#/lib/scouting/mutations'

export const EVENT_TYPES: EventType[] = ['goal', 'assist', 'shot', 'hit', 'takeaway', 'giveaway', 'save', 'penalty', 'note']
const POSITIONS = ['forward', 'defense', 'goalie']
const GAME_ID = /^game-\d{3}$/
const UUID = /^[0-9a-f-]{36}$/i

type Raw = Record<string, unknown>
const obj = (v: unknown): Raw => (v && typeof v === 'object' ? (v as Raw) : {})
const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined)
const int = (v: unknown) => (typeof v === 'number' && Number.isInteger(v) ? v : undefined)
const playerId = (v: unknown) => (isValidPlayerId(v) ? v : '')
const gameId = (v: unknown) => (typeof v === 'string' && GAME_ID.test(v) ? v : '')
const eventId = (v: unknown) => (typeof v === 'string' && UUID.test(v) ? v : '')
const eventType = (v: unknown) => (EVENT_TYPES.includes(v as EventType) ? (v as EventType) : undefined)
const position = (v: unknown) => (POSITIONS.includes(v as string) ? (v as string) : undefined)
const iso = (v: unknown) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : undefined)
const status = (v: unknown) => (v === 'upcoming' || v === 'final' ? v : undefined)

/** Drops undefined keys so a partial patch never writes nulls by accident. */
function defined<T extends object>(patch: T): T {
  return Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as T
}

const gamePatch = (p: Raw): GamePatch =>
  defined({ played_at: iso(p.played_at), opponent: str(p.opponent, 80), is_home: typeof p.is_home === 'boolean' ? p.is_home : undefined, venue: str(p.venue, 80), status: status(p.status) })

const eventPatch = (p: Raw): ScoutingEventPatch =>
  defined({ event_type: eventType(p.event_type), period: int(p.period), clock_seconds: int(p.clock_seconds), notes: str(p.notes, 500) })

const rosterPatch = (p: Raw): PlayerRosterPatch =>
  defined({ jersey_number: int(p.jersey_number), position: position(p.position), is_active: typeof p.is_active === 'boolean' ? p.is_active : undefined, team_name: str(p.team_name, 80) })

/** Per-helper argument validation: anything unexpected is dropped or blanked. */
const validators: { [K in ScoutingMutationName]: (args: unknown[]) => ScoutingMutationArgs<K> } = {
  createPlayer: ([i]) => {
    const p = obj(i)
    return [{ id: playerId(p.id), full_name: str(p.full_name, 80) ?? '', jersey_number: int(p.jersey_number) ?? 0, position: position(p.position) ?? 'forward', team_name: str(p.team_name, 80), is_active: true }]
  },
  updatePlayerRoster: ([id, p]) => [playerId(id), rosterPatch(obj(p))],
  createGame: ([i]) => {
    const p = obj(i)
    return [{ id: gameId(p.id), played_at: iso(p.played_at) ?? '', opponent: str(p.opponent, 80) ?? '', is_home: p.is_home !== false, venue: str(p.venue, 80) ?? null, status: status(p.status) ?? 'upcoming' }]
  },
  updateGame: ([id, p]) => [gameId(id), gamePatch(obj(p))],
  createScoutingEvent: ([i]) => {
    const p = obj(i)
    return [{ player_id: playerId(p.player_id), game_id: gameId(p.game_id), event_type: eventType(p.event_type) ?? 'note', period: int(p.period) ?? null, clock_seconds: int(p.clock_seconds) ?? null, notes: str(p.notes, 500) || null }]
  },
  updateScoutingEvent: ([id, p]) => [eventId(id), eventPatch(obj(p))],
  updateScoutingEventNotes: ([id, notes]) => [eventId(id), str(notes, 500) || null],
}

/** Every helper returns one of these rows. */
type ScoutingRow = Tables<'players'> | Tables<'games'> | Tables<'scouting_events'>

export const runScoutingMutation = createServerFn({ method: 'POST' })
  .validator((input: { name: ScoutingMutationName; args: unknown[] }) => {
    if (!(input?.name in validators)) throw new Error('Unknown scouting mutation.')
    return { name: input.name, args: validators[input.name](Array.isArray(input.args) ? input.args : []) }
  })
  .handler(({ data }): Promise<MutationResult<ScoutingRow>> => {
    const helper = scoutingMutations[data.name] as (...args: unknown[]) => Promise<MutationResult<ScoutingRow>>
    return helper(getSupabaseServerClient(), ...data.args)
  })

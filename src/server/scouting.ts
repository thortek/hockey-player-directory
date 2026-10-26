// Scouting server functions: the browser-callable edge of the data layer.
// TanStack Query hooks call these; each one validates its input and runs the
// typed helper from queries.ts, rpc.ts, or mutations.ts with the server client.
// The browser can't read the scouting tables directly (RLS denies the
// publishable key until Sprint 4 adds signed-in staff policies).

import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '#/lib/supabase.server'
import { isValidPlayerId, parsePositionFilter, parseStatusFilter } from '#/lib/directory/mappers'
import {
  getPlayerById,
  listGames,
  listPlayers,
  listScoutingEvents,
  type EventType,
} from '#/lib/scouting/queries'
import { getPlayerEventTotals } from '#/lib/scouting/rpc'
import {
  createScoutingEvent,
  updatePlayerRoster,
  updateScoutingEventNotes,
  type NewScoutingEvent,
  type PlayerRosterPatch,
} from '#/lib/scouting/mutations'

export const EVENT_TYPES: EventType[] = ['goal', 'assist', 'shot', 'hit', 'takeaway', 'giveaway', 'save', 'penalty', 'note']
const GAME_ID = /^game-\d{3}$/
const UUID = /^[0-9a-f-]{36}$/i

const optionalPlayerId = (v: unknown) => (isValidPlayerId(v) ? v : undefined)
const optionalGameId = (v: unknown) => (typeof v === 'string' && GAME_ID.test(v) ? v : undefined)
const optionalEventType = (v: unknown) => (EVENT_TYPES.includes(v as EventType) ? (v as EventType) : undefined)
const optionalIso = (v: unknown) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : undefined)

export const fetchPlayers = createServerFn({ method: 'GET' })
  .validator((input: { position?: unknown }) => {
    const position = parsePositionFilter(input?.position)
    return { position: position === 'all' ? undefined : position }
  })
  .handler(({ data }) => listPlayers(getSupabaseServerClient(), data))

export const fetchPlayer = createServerFn({ method: 'GET' })
  .validator((input: { playerId: unknown }) => ({ playerId: optionalPlayerId(input?.playerId) }))
  .handler(({ data }) => (data.playerId ? getPlayerById(getSupabaseServerClient(), data.playerId) : null))

export const fetchGames = createServerFn({ method: 'GET' })
  .validator((input: { status?: unknown; playerId?: unknown }) => {
    const status = parseStatusFilter(input?.status)
    return { status: status === 'all' ? undefined : status, playerId: optionalPlayerId(input?.playerId) }
  })
  .handler(({ data }) => listGames(getSupabaseServerClient(), data))

export const fetchScoutingEvents = createServerFn({ method: 'GET' })
  .validator((input: { playerId?: unknown; gameId?: unknown; eventType?: unknown }) => ({
    playerId: optionalPlayerId(input?.playerId),
    gameId: optionalGameId(input?.gameId),
    eventType: optionalEventType(input?.eventType),
  }))
  .handler(({ data }) => listScoutingEvents(getSupabaseServerClient(), data))

export const fetchPlayerEventTotals = createServerFn({ method: 'GET' })
  .validator((input: { gameId?: unknown; from?: unknown; to?: unknown }) => ({
    p_game_id: optionalGameId(input?.gameId),
    p_from: optionalIso(input?.from),
    p_to: optionalIso(input?.to),
  }))
  .handler(({ data }) => getPlayerEventTotals(getSupabaseServerClient(), data))

export const saveScoutingEvent = createServerFn({ method: 'POST' })
  .validator((input: NewScoutingEvent): NewScoutingEvent => ({
    player_id: optionalPlayerId(input?.player_id) ?? '',
    game_id: optionalGameId(input?.game_id) ?? '',
    event_type: optionalEventType(input?.event_type) ?? 'note',
    period: typeof input?.period === 'number' ? input.period : null,
    clock_seconds: typeof input?.clock_seconds === 'number' ? input.clock_seconds : null,
    notes: typeof input?.notes === 'string' ? input.notes.slice(0, 500) : null,
  }))
  .handler(({ data }) => createScoutingEvent(getSupabaseServerClient(), data))

export const saveScoutingEventNotes = createServerFn({ method: 'POST' })
  .validator((input: { eventId: string; notes: string | null }) => ({
    eventId: typeof input?.eventId === 'string' && UUID.test(input.eventId) ? input.eventId : '',
    notes: typeof input?.notes === 'string' ? input.notes.slice(0, 500) : null,
  }))
  .handler(({ data }) => updateScoutingEventNotes(getSupabaseServerClient(), data.eventId, data.notes))

export const savePlayerRoster = createServerFn({ method: 'POST' })
  .validator((input: { playerId: string; patch: PlayerRosterPatch }) => {
    const patch: PlayerRosterPatch = {}
    const p = input?.patch ?? {}
    if (typeof p.jersey_number === 'number') patch.jersey_number = p.jersey_number
    if (typeof p.position === 'string') patch.position = p.position
    if (typeof p.is_active === 'boolean') patch.is_active = p.is_active
    if (typeof p.team_name === 'string') patch.team_name = p.team_name
    return { playerId: optionalPlayerId(input?.playerId) ?? '', patch }
  })
  .handler(({ data }) => updatePlayerRoster(getSupabaseServerClient(), data.playerId, data.patch))

// Scouting read server functions: the browser-callable edge of the data layer.
// TanStack Query hooks call these; each one validates its input and runs the
// typed helper from queries.ts or rpc.ts with the server client. Writes go
// through runScoutingMutation in ./scouting-mutations.ts.
// The browser can't read the scouting tables directly (RLS denies the
// publishable key until Sprint 4 adds signed-in staff policies).

import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '#/lib/supabase.server'
import { isValidPlayerId, parsePositionFilter, parseStatusFilter } from '#/lib/directory/mappers'
import {
  getGameById,
  getPlayerById,
  listGames,
  listPlayers,
  listScoutingEvents,
  type EventType,
} from '#/lib/scouting/queries'
import { getPlayerEventTotals } from '#/lib/scouting/rpc'

import { EVENT_TYPES } from './scouting-mutations'

export { EVENT_TYPES }
const GAME_ID = /^game-\d{3}$/

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

export const fetchGame = createServerFn({ method: 'GET' })
  .validator((input: { gameId: unknown }) => ({ gameId: optionalGameId(input?.gameId) }))
  .handler(({ data }) => (data.gameId ? getGameById(getSupabaseServerClient(), data.gameId) : null))

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

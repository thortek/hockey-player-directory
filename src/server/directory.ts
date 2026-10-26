// Directory server functions (contract: docs/server-function-contract.md).
// Handlers run only on the server, so the secret key never reaches the
// browser. They return UI-ready DTOs, never raw rows, clients, or env.

import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '#/lib/supabase.server'
import { getPlayerById, listGames, listPlayers, listScoutingEvents } from '#/lib/scouting/queries'
import {
  isValidPlayerId,
  mapPlayerRow,
  parsePlayerFilter,
  parsePositionFilter,
  parseStatusFilter,
  toEventCards,
  toGameCards,
  toPlayerCards,
} from '#/lib/directory/mappers'

const LOAD_ERROR = 'Unable to load the directory. Please try again later.'

/** Runs a read and replaces database errors with the contract's safe message. */
async function safely<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read()
  } catch (e) {
    console.error('[directory] read failed', e)
    throw new Error(LOAD_ERROR)
  }
}

export const getPlayers = createServerFn({ method: 'GET' })
  .validator((input: { position?: unknown }) => ({
    position: parsePositionFilter(input?.position),
  }))
  .handler(({ data }) =>
    safely(async () => toPlayerCards(await listPlayers(getSupabaseServerClient()), data.position)),
  )

export const getPlayer = createServerFn({ method: 'GET' })
  .validator((input: { playerId: unknown }) => ({
    playerId: isValidPlayerId(input?.playerId) ? input.playerId : null,
  }))
  .handler(({ data }) =>
    safely(async () => {
      if (!data.playerId) return { player: null, games: [], events: [] }
      const db = getSupabaseServerClient()
      const row = await getPlayerById(db, data.playerId)
      if (!row?.is_active) return { player: null, games: [], events: [] }
      const [games, events] = await Promise.all([
        listGames(db, { playerId: row.id }),
        listScoutingEvents(db, { playerId: row.id }),
      ])
      return { player: mapPlayerRow(row), games: toGameCards(games), events: toEventCards(events) }
    }),
  )

export const getGames = createServerFn({ method: 'GET' })
  .validator((input: { status?: unknown; playerId?: unknown }) => ({
    status: parseStatusFilter(input?.status),
    playerId: parsePlayerFilter(input?.playerId),
  }))
  .handler(({ data }) =>
    safely(async () => {
      const db = getSupabaseServerClient()
      const [games, players] = await Promise.all([
        listGames(db, {
          status: data.status === 'all' ? undefined : data.status,
          playerId: data.playerId === 'all' ? undefined : data.playerId,
        }),
        listPlayers(db),
      ])
      return { games: toGameCards(games), players: toPlayerCards(players, 'all') }
    }),
  )

export const getDirectorySummary = createServerFn({ method: 'GET' }).handler(() =>
  safely(async () => {
    const db = getSupabaseServerClient()
    const [players, games] = await Promise.all([listPlayers(db), listGames(db)])
    return {
      playerCount: players.length,
      upcomingCount: games.filter((g) => g.status === 'upcoming').length,
      finalCount: games.filter((g) => g.status === 'final').length,
    }
  }),
)

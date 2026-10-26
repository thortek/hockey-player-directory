// Public directory server functions (contract: docs/server-function-contract.md).
// These serve the signed-out pages (/, /players, /games), so they read ONLY the
// roster and schedule (players, games) with the server's secret key, never
// scouting_events or player_health_notes (docs/security/rls-policy-spec.md,
// cross-cutting rule 2). Staff data lives behind /scouting and requireSession().

import { createServerFn } from '@tanstack/react-start'
import { getSupabaseServerClient } from '#/lib/supabase.server'
import { getPlayerById, listGames, listPlayers } from '#/lib/scouting/queries'
import {
  isValidPlayerId,
  mapPlayerRow,
  parsePositionFilter,
  parseStatusFilter,
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
      if (!data.playerId) return { player: null }
      const row = await getPlayerById(getSupabaseServerClient(), data.playerId)
      return { player: row?.is_active ? mapPlayerRow(row) : null }
    }),
  )

export const getGames = createServerFn({ method: 'GET' })
  .validator((input: { status?: unknown }) => ({ status: parseStatusFilter(input?.status) }))
  .handler(({ data }) =>
    safely(async () => {
      const games = await listGames(getSupabaseServerClient(), {
        status: data.status === 'all' ? undefined : data.status,
      })
      return { games: toGameCards(games) }
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

// Directory server functions (contract: docs/server-function-contract.md).
// Handlers run only on the server, so the secret key never reaches the
// browser. They return UI-ready DTOs, never raw rows, clients, or env.

import { createServerFn } from '@tanstack/react-start'
import { hasSupabaseServerConfig } from '#/config/env'
import { seedGames, seedPlayers, type GameRow, type PlayerRow } from '#/data/seed'
import {
  isValidPlayerId,
  mapPlayerRow,
  parsePlayerFilter,
  parsePositionFilter,
  parseStatusFilter,
  toGameCards,
  toPlayerCards,
} from '#/lib/directory/mappers'

const LOAD_ERROR = 'Unable to load the directory. Please try again later.'

async function loadPlayers(): Promise<PlayerRow[]> {
  if (!hasSupabaseServerConfig()) return seedPlayers
  const { getSupabaseServerClient } = await import('#/lib/supabase.server')
  const { data, error } = await getSupabaseServerClient()
    .from('players')
    .select('id, name, number, position, is_active')
  if (error) throw new Error(LOAD_ERROR)
  return (data ?? []) as PlayerRow[]
}

async function loadGames(): Promise<GameRow[]> {
  if (!hasSupabaseServerConfig()) return seedGames
  const { getSupabaseServerClient } = await import('#/lib/supabase.server')
  const { data, error } = await getSupabaseServerClient()
    .from('games')
    .select('id, date, opponent, status, player_id')
  if (error) throw new Error(LOAD_ERROR)
  return (data ?? []) as GameRow[]
}

export const getPlayers = createServerFn({ method: 'GET' })
  .validator((input: { position?: unknown }) => ({
    position: parsePositionFilter(input?.position),
  }))
  .handler(async ({ data }) => toPlayerCards(await loadPlayers(), data.position))

export const getPlayer = createServerFn({ method: 'GET' })
  .validator((input: { playerId: unknown }) => ({
    playerId: isValidPlayerId(input?.playerId) ? input.playerId : null,
  }))
  .handler(async ({ data }) => {
    if (!data.playerId) return { player: null, games: [] }
    const [players, games] = await Promise.all([loadPlayers(), loadGames()])
    const row = players.find((p) => p.id === data.playerId && p.is_active)
    return {
      player: row ? mapPlayerRow(row) : null,
      games: row ? toGameCards(games, players, { status: 'all', playerId: row.id }) : [],
    }
  })

export const getGames = createServerFn({ method: 'GET' })
  .validator((input: { status?: unknown; playerId?: unknown }) => ({
    status: parseStatusFilter(input?.status),
    playerId: parsePlayerFilter(input?.playerId),
  }))
  .handler(async ({ data }) => {
    const [players, games] = await Promise.all([loadPlayers(), loadGames()])
    return {
      games: toGameCards(games, players, data),
      players: toPlayerCards(players, 'all'),
    }
  })

export const getDirectorySummary = createServerFn({ method: 'GET' }).handler(async () => {
  const [players, games] = await Promise.all([loadPlayers(), loadGames()])
  return {
    playerCount: toPlayerCards(players, 'all').length,
    upcomingCount: games.filter((g) => g.status === 'upcoming').length,
    finalCount: games.filter((g) => g.status === 'final').length,
  }
})

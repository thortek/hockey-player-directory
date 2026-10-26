// Typed callers for Postgres functions. This is the only module that calls
// .rpc(); routes and hooks import these helpers instead of naming functions.

import type { DbClient } from '#/lib/supabase/client'
import type { Database } from '#/types/database'

type Functions = Database['public']['Functions']

export type PlayerEventTotalsArgs = Functions['player_event_totals']['Args']
export type PlayerEventTotalsRow = Functions['player_event_totals']['Returns'][number]

/**
 * Per-player event totals in one round trip (set-based GROUP BY in Postgres).
 * Omit every argument for the whole season; pass p_game_id for one game, or
 * p_from / p_to (ISO timestamps, end exclusive) for a date range.
 */
export async function getPlayerEventTotals(
  db: DbClient,
  args: PlayerEventTotalsArgs = {},
): Promise<PlayerEventTotalsRow[]> {
  const { data, error } = await db.rpc('player_event_totals', args)
  if (error) throw new Error(`player_event_totals failed: ${error.message}`)
  return data
}

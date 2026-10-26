// Typed writes for scouting data. Payloads come from the generated Insert and
// Update types, so a renamed column fails `npm run typecheck`, not production.
//
// Notes live on scouting events (scouting_events.notes); players have no notes
// column, so the player update is a partial roster update instead. Like the
// read helpers, each function takes the client so server functions pass the
// secret-key client today and a signed-in staff client in Sprint 4.
// Writes return { data, error } with a readable message instead of throwing.

import type { DbClient } from '#/lib/supabase/client'
import type { Tables, TablesInsert, TablesUpdate } from '#/types/database'

export type MutationResult<T> = { data: T; error: null } | { data: null; error: { message: string } }

export type NewScoutingEvent = Pick<
  TablesInsert<'scouting_events'>,
  'player_id' | 'game_id' | 'event_type' | 'period' | 'clock_seconds' | 'notes'
>

/** Roster fields hockey ops may change; id and created_at are never patched. */
export type PlayerRosterPatch = Pick<TablesUpdate<'players'>, 'jersey_number' | 'position' | 'is_active' | 'team_name'>

/** Postgres error codes turned into messages a scout can act on. */
function readableError(error: { code?: string; message: string }, subject: string): { message: string } {
  switch (error.code) {
    case '23503':
      return { message: `That ${subject} points at a player or game that does not exist.` }
    case '23514':
      return { message: `One of the ${subject} fields is outside the allowed values.` }
    case '42501':
      return { message: `You are not allowed to change this ${subject}.` }
    default:
      return { message: `Could not save the ${subject}: ${error.message}` }
  }
}

export async function createScoutingEvent(
  db: DbClient,
  input: NewScoutingEvent,
): Promise<MutationResult<Tables<'scouting_events'>>> {
  if (!input.player_id?.trim() || !input.game_id?.trim()) {
    return { data: null, error: { message: 'Choose a player and a game before logging an event.' } }
  }
  const { data, error } = await db.from('scouting_events').insert(input).select().single()
  if (error) return { data: null, error: readableError(error, 'scouting event') }
  return { data, error: null }
}

export async function updateScoutingEventNotes(
  db: DbClient,
  eventId: string,
  notes: string | null,
): Promise<MutationResult<Tables<'scouting_events'>>> {
  if (!eventId) return { data: null, error: { message: 'An event id is required to edit notes.' } }
  const patch: TablesUpdate<'scouting_events'> = {
    notes: notes?.trim() ? notes.trim() : null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await db.from('scouting_events').update(patch).eq('id', eventId).select().single()
  if (error) return { data: null, error: readableError(error, 'scouting event') }
  return { data, error: null }
}

export async function updatePlayerRoster(
  db: DbClient,
  playerId: string,
  patch: PlayerRosterPatch,
): Promise<MutationResult<Tables<'players'>>> {
  if (!playerId) return { data: null, error: { message: 'A player id is required to update the roster.' } }
  if (Object.keys(patch).length === 0) return { data: null, error: { message: 'Nothing to update.' } }
  const { data, error } = await db
    .from('players')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', playerId)
    .select()
    .single()
  if (error) return { data: null, error: readableError(error, 'player') }
  return { data, error: null }
}

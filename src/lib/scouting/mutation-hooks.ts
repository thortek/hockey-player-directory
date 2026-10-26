// TanStack Query write hooks for scouting data: one per helper in mutations.ts.
// Each mutationFn runs its named helper (createScoutingEvent, updateGame, ...)
// through runScoutingMutation, which executes it on the server with the server
// client. A { data, error } result with an error becomes a thrown Error, so the
// component's isError / error.message shows the readable message.
// onSuccess invalidates only the key prefixes the write can change
// (docs/scouting-cache-invalidation-map.md), never the whole cache.

import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { runScoutingMutation } from '#/server/scouting-mutations'
import type {
  GamePatch,
  MutationResult,
  NewGame,
  NewPlayer,
  NewScoutingEvent,
  PlayerRosterPatch,
  ScoutingEventPatch,
  ScoutingMutationArgs,
  ScoutingMutationData,
  ScoutingMutationName,
} from './mutations'
import { scoutingKeys } from './query-keys'
import type { Tables } from '#/types/database'

/** Runs the named mutations.ts helper on the server and unwraps its result. */
async function runHelper<K extends ScoutingMutationName>(
  name: K,
  ...args: ScoutingMutationArgs<K>
): Promise<ScoutingMutationData<K>> {
  const result = (await runScoutingMutation({ data: { name, args } })) as MutationResult<ScoutingMutationData<K>>
  if (result.error) throw new Error(result.error.message)
  return result.data
}

/** Everything an event appears in: lists, totals, its player's and game's views. */
function invalidateEventViews(queryClient: QueryClient, event: Tables<'scouting_events'>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: scoutingKeys.eventLists() }),
    queryClient.invalidateQueries({ queryKey: scoutingKeys.aggregates() }),
    queryClient.invalidateQueries({ queryKey: scoutingKeys.gameLists() }),
    queryClient.invalidateQueries({ queryKey: scoutingKeys.playerDetail(event.player_id) }),
    queryClient.invalidateQueries({ queryKey: scoutingKeys.gameDetail(event.game_id) }),
  ])
}

// ---- Players ---------------------------------------------------------------

export function useCreatePlayer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewPlayer) => runHelper('createPlayer', input),
    // A new player has no events yet, so only roster lists change.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scoutingKeys.playerLists() }),
  })
}

export function useUpdatePlayerRoster() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { playerId: string; patch: PlayerRosterPatch }) =>
      runHelper('updatePlayerRoster', input.playerId, input.patch),
    onSuccess: (player) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: scoutingKeys.playerLists() }),
        queryClient.invalidateQueries({ queryKey: scoutingKeys.playerDetail(player.id) }),
        // Event rows and totals show the player's number and position.
        queryClient.invalidateQueries({ queryKey: scoutingKeys.eventLists() }),
        queryClient.invalidateQueries({ queryKey: scoutingKeys.aggregates() }),
      ]),
  })
}

// ---- Games -----------------------------------------------------------------

export function useCreateGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewGame) => runHelper('createGame', input),
    // No events reference a new game yet.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scoutingKeys.gameLists() }),
  })
}

export function useUpdateGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { gameId: string; patch: GamePatch }) => runHelper('updateGame', input.gameId, input.patch),
    onSuccess: (game) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: scoutingKeys.gameLists() }),
        queryClient.invalidateQueries({ queryKey: scoutingKeys.gameDetail(game.id) }),
        // Event rows show the game's opponent and date.
        queryClient.invalidateQueries({ queryKey: scoutingKeys.eventLists() }),
        // A changed played_at can move the game in or out of a date-range total.
        queryClient.invalidateQueries({ queryKey: scoutingKeys.aggregates() }),
      ]),
  })
}

// ---- Scouting events ---------------------------------------------------------

export function useCreateScoutingEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewScoutingEvent) => runHelper('createScoutingEvent', input),
    onSuccess: (event) => invalidateEventViews(queryClient, event),
  })
}

export function useUpdateScoutingEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { eventId: string; patch: ScoutingEventPatch }) =>
      runHelper('updateScoutingEvent', input.eventId, input.patch),
    // A changed event_type moves counts between totals columns.
    onSuccess: (event) => invalidateEventViews(queryClient, event),
  })
}

export function useUpdateScoutingEventNotes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { eventId: string; notes: string | null }) =>
      runHelper('updateScoutingEventNotes', input.eventId, input.notes),
    // Notes show in event lists and the player's and game's views; counts don't change.
    onSuccess: (event) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: scoutingKeys.eventLists() }),
        queryClient.invalidateQueries({ queryKey: scoutingKeys.playerDetail(event.player_id) }),
        queryClient.invalidateQueries({ queryKey: scoutingKeys.gameDetail(event.game_id) }),
      ]),
  })
}

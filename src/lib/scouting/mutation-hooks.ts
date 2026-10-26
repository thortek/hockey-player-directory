// TanStack Query write hooks for scouting data.
// Each mutationFn calls a server function that runs the matching helper in
// mutations.ts; a { data, error } result with an error becomes a thrown Error
// so the component's isError / error.message shows the readable message.
// onSuccess invalidates only the key prefixes the write can change
// (docs/scouting-cache-invalidation-map.md), never the whole cache.

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { savePlayerRoster, saveScoutingEvent, saveScoutingEventNotes } from '#/server/scouting'
import type { MutationResult, NewScoutingEvent, PlayerRosterPatch } from './mutations'
import { scoutingKeys } from './query-keys'

function unwrap<T>(result: MutationResult<T>): T {
  if (result.error) throw new Error(result.error.message)
  return result.data
}

export function useCreateScoutingEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: NewScoutingEvent) => unwrap(await saveScoutingEvent({ data: input })),
    onSuccess: (event) =>
      Promise.all([
        // Every event list (filtered by this player, this game, or none) may include it.
        queryClient.invalidateQueries({ queryKey: scoutingKeys.eventLists() }),
        // Totals per player change for every range that covers this game.
        queryClient.invalidateQueries({ queryKey: scoutingKeys.aggregates() }),
        // "Games this player has events in" can gain a game.
        queryClient.invalidateQueries({ queryKey: scoutingKeys.gameLists() }),
        queryClient.invalidateQueries({ queryKey: scoutingKeys.playerDetail(event.player_id) }),
      ]),
  })
}

export function useUpdateScoutingEventNotes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { eventId: string; notes: string | null }) =>
      unwrap(await saveScoutingEventNotes({ data: input })),
    // Notes appear only in event lists; counts and rosters are unchanged.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scoutingKeys.eventLists() }),
  })
}

export function useUpdatePlayerRoster() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { playerId: string; patch: PlayerRosterPatch }) =>
      unwrap(await savePlayerRoster({ data: input })),
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

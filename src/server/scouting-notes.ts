// Protected staff loaders for the /scouting overview.
//
// Each one calls requireSession() before any SELECT, then queries with that
// staff member's own server client (src/lib/supabase/server.ts). No role or
// user id is accepted from the browser: Postgres RLS
// (supabase/migrations/20250321000000_hockey_staff_rls.sql) decides the rows.
// Coaching and scouting get scouting notes; medical gets none. Only medical
// gets health notes. The page renders whatever comes back.

import { createServerFn } from '@tanstack/react-start'
import { requireSession, type StaffRole } from '#/lib/auth/require-session'
import { listPlayerHealthNotes, listScoutingEvents } from '#/lib/scouting/queries'

export type ScoutingNote = {
  id: string
  type: string
  notes: string
  playerId: string
  playerName: string
  opponent: string
  playedAt: string
}

export type HealthNote = {
  id: string
  playerId: string
  playerName: string
  jerseyNumber: number
  recordedOn: string
  category: string
  availability: string
  notes: string | null
}

/** Scouting events that carry written notes, newest game first. */
export const getScoutingNotes = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ role: StaffRole; notes: ScoutingNote[] }> => {
    const { db, role } = await requireSession()
    const events = await listScoutingEvents(db)
    return {
      role,
      notes: events
        .filter((e) => e.notes?.trim())
        .map((e) => ({
          id: e.id,
          type: e.event_type,
          notes: e.notes ?? '',
          playerId: e.player.id,
          playerName: e.player.full_name,
          opponent: e.game.opponent,
          playedAt: e.game.played_at,
        })),
    }
  },
)

/** Medical / sports-science notes; RLS returns an empty list to non-medical staff. */
export const getHealthNotes = createServerFn({ method: 'GET' }).handler(async (): Promise<HealthNote[]> => {
  const { db } = await requireSession()
  const rows = await listPlayerHealthNotes(db)
  return rows.map((r) => ({
    id: r.id,
    playerId: r.player.id,
    playerName: r.player.full_name,
    jerseyNumber: r.player.jersey_number,
    recordedOn: r.recorded_on,
    category: r.category,
    availability: r.availability,
    notes: r.notes,
  }))
})

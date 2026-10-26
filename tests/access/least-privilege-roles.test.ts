// Break-tests for the least-privilege staff roles (docs/access/adversarial-test-cases.md).
//
// Every attempt signs in as the real test account with the publishable key, so
// Postgres RLS judges it exactly as it would a staff request. The service-role
// key is never used here. Credentials come from environment variables; run
//   set -a; . ./.env.local; set +a; npm run test:access
// Without them the suite is skipped so `npm test` still passes offline.

import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Database } from '#/types/database'

type Db = ReturnType<typeof createClient<Database>>

const env = process.env
const ROLES = {
  assistantScout: { email: env.DEMO_ASSISTANT_SCOUT_EMAIL, password: env.DEMO_ASSISTANT_SCOUT_PASSWORD },
  videoAnalyst: { email: env.DEMO_VIDEO_ANALYST_EMAIL, password: env.DEMO_VIDEO_ANALYST_PASSWORD },
  medical: { email: env.DEMO_MEDIC_EMAIL, password: env.DEMO_MEDIC_PASSWORD },
}
const configured =
  Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_PUBLISHABLE_KEY) &&
  Object.values(ROLES).every((r) => r.email && r.password)

const MEDICAL = ['injury', 'return_to_play']
const SPORTS_SCIENCE = ['load', 'wellness']
const MEDICAL_FLAG_COLUMNS = ['availability', 'category', 'notes', 'recorded_by']

async function signIn(role: keyof typeof ROLES): Promise<Db> {
  const db = createClient<Database>(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await db.auth.signInWithPassword({ email: ROLES[role].email!, password: ROLES[role].password! })
  if (error) throw new Error(`Could not sign in the ${role} test account: ${error.message}`)
  return db
}

describe.skipIf(!configured)('least-privilege staff roles (live RLS)', () => {
  let as: Db
  let va: Db
  let med: Db

  beforeAll(async () => {
    ;[as, va, med] = await Promise.all([signIn('assistantScout'), signIn('videoAnalyst'), signIn('medical')])
  })

  afterAll(async () => {
    await Promise.all([as, va, med].map((db) => db?.auth.signOut()))
  })

  // ---- Allowed work still works ------------------------------------------------

  it('AS-READ-SCOUT assistant scout can read scouting events', async () => {
    const { data, error } = await as.from('scouting_events').select('id, event_type, notes').limit(5)
    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThan(0)
  })

  it('AS-READ-GAME assistant scout can read games and roster', async () => {
    const games = await as.from('games').select('id, opponent, played_at').limit(5)
    const players = await as.from('players').select('id, full_name').limit(5)
    expect(games.error).toBeNull()
    expect(players.error).toBeNull()
    expect(games.data!.length).toBeGreaterThan(0)
    expect(players.data!.length).toBeGreaterThan(0)
  })

  it('VA-READ-SCOUT video analyst can read scouting events', async () => {
    const { data, error } = await va.from('scouting_events').select('id, event_type, notes').limit(5)
    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThan(0)
  })

  it('VA-READ-GAME video analyst can read games and roster', async () => {
    const games = await va.from('games').select('id, opponent, played_at').limit(5)
    const players = await va.from('players').select('id, full_name').limit(5)
    expect(games.error).toBeNull()
    expect(players.error).toBeNull()
    expect(games.data!.length).toBeGreaterThan(0)
    expect(players.data!.length).toBeGreaterThan(0)
  })

  // ---- Control: the sealed table really has rows ------------------------------

  it('MED-READ-MED control: medical staff can read medical notes', async () => {
    const { data, error } = await med.from('player_health_notes').select('id, category')
    expect(error).toBeNull()
    expect(data!.some((r) => MEDICAL.includes(r.category))).toBe(true)
    expect(data!.some((r) => SPORTS_SCIENCE.includes(r.category))).toBe(true)
  })

  // ---- Medical and sports-science data stay sealed -----------------------------

  for (const [id, who] of [
    ['AS', 'assistant scout'],
    ['VA', 'video analyst'],
  ] as const) {
    const db = () => (id === 'AS' ? as : va)

    it(`${id}-READ-MED ${who} gets no medical rows`, async () => {
      const { data, error } = await db().from('player_health_notes').select('id').in('category', MEDICAL)
      expect(error).toBeNull()
      expect(data).toEqual([])
    })

    it(`${id}-READ-SS ${who} gets no sports-science rows`, async () => {
      const { data, error } = await db().from('player_health_notes').select('id').in('category', SPORTS_SCIENCE)
      expect(error).toBeNull()
      expect(data).toEqual([])
    })

    it(`${id}-CHANGE-MED ${who} cannot add a medical note`, async () => {
      const { data: me } = await db().auth.getUser()
      const { data, error } = await db()
        .from('player_health_notes')
        .insert({ player_id: 'player-000', category: 'injury', notes: 'break-test', recorded_by: me.user!.id })
        .select('id')
      expect(data).toBeNull()
      expect(error?.code).toBe('42501')
    })

    it(`${id}-CHANGE-SS ${who} cannot add a sports-science note`, async () => {
      const { data: me } = await db().auth.getUser()
      const { data, error } = await db()
        .from('player_health_notes')
        .insert({ player_id: 'player-000', category: id === 'AS' ? 'load' : 'wellness', notes: 'break-test', recorded_by: me.user!.id })
        .select('id')
      expect(data).toBeNull()
      expect(error?.code).toBe('42501')
    })

    it(`${id}-FLAG-SHARED ${who} sees the shared board without medical flags`, async () => {
      // The shared board works for this role...
      const board = await db().from('scouting_player_board').select('*')
      expect(board.error).toBeNull()
      expect(board.data!.length).toBeGreaterThan(0)
      // ...but no row carries a medical flag column...
      for (const row of board.data!) {
        for (const column of MEDICAL_FLAG_COLUMNS) expect(row).not.toHaveProperty(column)
      }
      // ...and explicitly asking the shared view for the flag is rejected.
      const flag = await db()
        .from('scouting_player_board')
        .select('id, availability' as '*')
      expect(flag.data).toBeNull()
      expect(flag.error).not.toBeNull()
    })
  }

  // ---- Extra cases --------------------------------------------------------------

  it('VA-ADD-EVENT video analyst cannot add scouting events', async () => {
    const { data, error } = await va
      .from('scouting_events')
      .insert({ player_id: 'player-000', game_id: 'game-000', event_type: 'note', notes: 'break-test' })
      .select('id')
    expect(data).toBeNull()
    expect(error?.code).toBe('42501')
  })

  it('AS-EDIT-EVENT assistant scout cannot edit existing scouting events', async () => {
    const { data: target } = await as.from('scouting_events').select('id, notes').limit(1).single()
    const { data, error } = await as.from('scouting_events').update({ notes: 'break-test edit' }).eq('id', target!.id).select('id')
    expect(error).toBeNull()
    expect(data).toEqual([]) // RLS: no update policy matches, so zero rows change
    const { data: after } = await as.from('scouting_events').select('notes').eq('id', target!.id).single()
    expect(after!.notes).toBe(target!.notes)
  })

  it('AS-READ-STAFF assistant scout sees only their own staff row', async () => {
    const { data: me } = await as.auth.getUser()
    const { data, error } = await as.from('staff_members').select('user_id, role')
    expect(error).toBeNull()
    expect(data).toEqual([{ user_id: me.user!.id, role: 'assistant_scout' }])
  })
})

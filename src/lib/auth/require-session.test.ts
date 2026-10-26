import { describe, expect, it, vi } from 'vitest'
import type { DbClient } from '#/lib/supabase/client'
import { ForbiddenError, UnauthorizedError, requireRole, requireSession } from './require-session'

// A stand-in for the cookie-based server client: no network, no database.
// It records which user id the staff lookup used, so the tests can prove the
// role comes from the verified user, not from anything the caller passes in.
function mockClient(opts: {
  user?: { id: string; email?: string } | null
  authError?: { message: string } | null
  staff?: { role: string; display_name: string } | null
  staffError?: { message: string } | null
}) {
  const lookups: Array<{ table: string; column: string; value: unknown }> = []
  const client = {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: opts.user ?? null },
        error: opts.authError ?? null,
      })),
    },
    from: (table: string) => ({
      select: () => ({
        eq: (column: string, value: unknown) => {
          lookups.push({ table, column, value })
          return { maybeSingle: async () => ({ data: opts.staff ?? null, error: opts.staffError ?? null }) }
        },
      }),
    }),
  }
  return { factory: () => client as unknown as DbClient, client, lookups }
}

const scout = { id: '11111111-1111-1111-1111-111111111111', email: 'scout.demo@hockeyops.test' }

describe('requireSession: fails closed', () => {
  it('rejects a request with no session', async () => {
    const { factory } = mockClient({ user: null })
    await expect(requireSession(factory)).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('rejects an invalid or expired token reported by Supabase Auth', async () => {
    const { factory } = mockClient({ user: null, authError: { message: 'invalid JWT' } })
    const error = await requireSession(factory).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(UnauthorizedError)
    expect((error as UnauthorizedError).status).toBe(401)
  })

  it('rejects a real user who has no staff role row', async () => {
    const { factory } = mockClient({ user: scout, staff: null })
    await expect(requireSession(factory)).rejects.toThrow('not set up as hockey staff')
  })

  it('rejects a staff row with a role outside coaching/scouting/medical', async () => {
    const { factory } = mockClient({ user: scout, staff: { role: 'admin', display_name: 'X' } })
    await expect(requireSession(factory)).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('rejects when the role lookup itself errors instead of returning a partial user', async () => {
    const { factory } = mockClient({ user: scout, staffError: { message: 'permission denied' } })
    await expect(requireSession(factory)).rejects.toBeInstanceOf(UnauthorizedError)
  })
})

describe('requireSession: verified staff', () => {
  it('returns identity and role for a verified session', async () => {
    const { factory, client, lookups } = mockClient({ user: scout, staff: { role: 'scouting', display_name: 'Sam Scout' } })
    const session = await requireSession(factory)

    expect(session.user).toEqual({ id: scout.id, email: scout.email })
    expect(session.role).toBe('scouting')
    expect(session.displayName).toBe('Sam Scout')
    // The same client is handed back so queries run as this user under RLS.
    expect(session.db).toBe(client)
    // Identity is verified with Supabase Auth, and the role is looked up by that verified id.
    expect(client.auth.getUser).toHaveBeenCalledOnce()
    expect(lookups).toEqual([{ table: 'staff_members', column: 'user_id', value: scout.id }])
  })
})

describe('requireRole', () => {
  it('allows a role on the list', async () => {
    const { factory } = mockClient({ user: scout, staff: { role: 'scouting', display_name: 'Sam Scout' } })
    await expect(requireRole(['scouting'], factory)).resolves.toMatchObject({ role: 'scouting' })
  })

  it('returns 403 for a signed-in staff member with the wrong role', async () => {
    const { factory } = mockClient({ user: scout, staff: { role: 'medical', display_name: 'Morgan Medic' } })
    const error = await requireRole(['scouting'], factory).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ForbiddenError)
    expect((error as ForbiddenError).status).toBe(403)
  })

  it('still returns 401, not 403, when nobody is signed in', async () => {
    const { factory } = mockClient({ user: null })
    await expect(requireRole(['scouting'], factory)).rejects.toBeInstanceOf(UnauthorizedError)
  })
})

// The one session gate for server functions (docs/security/auth-session-plan.md).
//
// requireSession() builds the per-request server client from the request's
// cookies, asks Supabase Auth to verify the token with auth.getUser() (a server
// round trip, not just decoding the cookie), then loads the caller's staff role.
// Anything missing throws UnauthorizedError, which stops the server function
// before it queries protected data. Callers query with the returned `db`, so
// RLS sees the same verified user. Never accept a user id from the browser.

import type { DbClient } from '#/lib/supabase/client'

export type StaffRole = 'coaching' | 'scouting' | 'medical' | 'assistant_scout' | 'video_analyst'

export type StaffSession = {
  db: DbClient
  user: { id: string; email: string | null }
  role: StaffRole
  displayName: string
}

export class UnauthorizedError extends Error {
  readonly status = 401
  constructor(message = 'Sign in with a staff account to continue.') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  readonly status = 403
  constructor(message = 'Your staff role does not allow this.') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

const ROLES: readonly StaffRole[] = ['coaching', 'scouting', 'medical', 'assistant_scout', 'video_analyst']

/**
 * Verifies the caller and returns their user-scoped client and role.
 * `createClient` is injectable for tests; production uses the cookie-based
 * server client from src/lib/supabase/server.ts.
 */
export async function requireSession(createClient?: () => DbClient): Promise<StaffSession> {
  const factory = createClient ?? (await import('#/lib/supabase/server')).createSupabaseServerClient
  const db = factory()

  const { data, error } = await db.auth.getUser()
  if (error || !data.user) throw new UnauthorizedError()

  const { data: staff, error: staffError } = await db
    .from('staff_members')
    .select('role, display_name')
    .eq('user_id', data.user.id)
    .maybeSingle()
  if (staffError || !staff || !ROLES.includes(staff.role as StaffRole)) {
    // A valid Supabase user without a staff role is still not staff.
    throw new UnauthorizedError('This account is not set up as hockey staff.')
  }

  return {
    db,
    user: { id: data.user.id, email: data.user.email ?? null },
    role: staff.role as StaffRole,
    displayName: staff.display_name,
  }
}

/** requireSession plus a role check; ForbiddenError (403) for the wrong role. */
export async function requireRole(allowed: readonly StaffRole[], createClient?: () => DbClient): Promise<StaffSession> {
  const session = await requireSession(createClient)
  if (!allowed.includes(session.role)) throw new ForbiddenError()
  return session
}

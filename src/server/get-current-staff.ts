// Who is signed in? Calls requireSession() first, so a signed-out caller gets
// UnauthorizedError and no data. Returns only safe identity fields: no tokens,
// no raw session, no password.

import { createServerFn } from '@tanstack/react-start'
import { requireSession, type StaffRole } from '#/lib/auth/require-session'

export type CurrentStaff = {
  userId: string
  email: string | null
  role: StaffRole
  displayName: string
}

export const getCurrentStaff = createServerFn({ method: 'GET' }).handler(async (): Promise<CurrentStaff> => {
  const session = await requireSession()
  return {
    userId: session.user.id,
    email: session.user.email,
    role: session.role,
    displayName: session.displayName,
  }
})

// Staff sign-out (browser side). Clears the Supabase session cookies; the next
// server function call then has no session and requireSession() refuses it.

import { createSupabaseBrowserClient } from '#/lib/supabase/client'

export type SignOutResult = { ok: true } | { ok: false; message: string }

export async function signOut(): Promise<SignOutResult> {
  const { error } = await createSupabaseBrowserClient().auth.signOut()
  if (error) return { ok: false, message: `Could not sign out: ${error.message}` }
  return { ok: true }
}

// Staff sign-in through Supabase Auth (browser side).
// Supabase checks the password; @supabase/ssr stores the resulting session in
// cookies that server functions verify with requireSession(). Signing in here
// grants nothing by itself: every server function re-checks the session.

import { createSupabaseBrowserClient } from '#/lib/supabase/client'

export type SignInResult = { ok: true } | { ok: false; message: string }

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const trimmedEmail = email.trim()
  if (!trimmedEmail || !password) {
    return { ok: false, message: 'Enter your staff email and password.' }
  }
  const { error } = await createSupabaseBrowserClient().auth.signInWithPassword({ email: trimmedEmail, password })
  if (error) {
    // Same message for unknown email and wrong password, so the form doesn't reveal which accounts exist.
    return {
      ok: false,
      message: error.status === 400 ? 'That email and password do not match a staff account.' : 'Sign-in is unavailable right now. Try again shortly.',
    }
  }
  return { ok: true }
}

// SERVER Supabase client — import only from server functions (src/server/*)
// and server-only helpers (src/lib/auth/require-session.ts).
//
// Built per request from the request's cookies, so queries run as the signed-in
// staff member and Postgres RLS filters rows by their role. It uses the
// publishable key, never the secret key: a secret-key client bypasses RLS.
// When Supabase refreshes an expiring token, the new cookies go back on the
// response through TanStack Start's setCookie.

import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import type { Database } from '#/types/database'
import type { DbClient } from './client'

export function createSupabaseServerClient(): DbClient {
  const url = import.meta.env.VITE_SUPABASE_URL
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY')
  }
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => Object.entries(getCookies()).map(([name, value]) => ({ name, value: value ?? '' })),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) setCookie(name, value, options)
      },
    },
  })
}

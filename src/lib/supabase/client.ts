// BROWSER Supabase client — safe to import from React components.
//
// Uses only browser-safe values (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY).
// It starts sign-in and sign-out; @supabase/ssr keeps the session in cookies so
// server functions can verify it with the server client in ./server.ts.
// Never trust this client for authorization: the server re-checks every request.
// Server code must not import this file; use ./server.ts instead.

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#/types/database'

/** Typed client accepted by every query, rpc, and mutation helper. */
export type DbClient = SupabaseClient<Database>

let browserClient: DbClient | undefined

export function createSupabaseBrowserClient(): DbClient {
  const url = import.meta.env.VITE_SUPABASE_URL
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY')
  }
  // One client per tab so every component shares the same session state.
  browserClient ??= createBrowserClient<Database>(url, publishableKey)
  return browserClient
}

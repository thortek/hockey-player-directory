// Typed Supabase clients and the client type every query helper accepts.
//
// createBrowserClient() uses the publishable key, so it only ever sees rows
// RLS allows (none until Sprint 4 adds staff policies). Server functions pass
// the secret-key client from src/lib/supabase.server.ts to the same helpers.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '#/types/database'

export type DbClient = SupabaseClient<Database>

export function createBrowserClient(): DbClient {
  const url = import.meta.env.VITE_SUPABASE_URL
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY')
  }
  return createClient<Database>(url, publishableKey)
}

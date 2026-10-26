// Server-only Supabase client. Import this only from src/server/* handlers.
// Routes and components must never import it: the secret key bypasses RLS.

import { createClient } from '@supabase/supabase-js'
import { getServerEnv } from '#/config/env'
import type { DbClient } from '#/lib/supabase/client'
import type { Database } from '#/types/database'

export function getSupabaseServerClient(): DbClient {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = getServerEnv()
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in the server environment')
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

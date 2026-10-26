// Environment split for the directory app.
//
// publicEnv: VITE_-prefixed values Vite inlines into the browser bundle. Only
//   values designed to be public belong here.
// getServerEnv(): secrets read from process.env at call time. Call it only
//   inside server-function handlers or *.server.ts modules, never at module
//   scope in a file a route imports.

export const publicEnv = {
  appName: import.meta.env.VITE_APP_NAME ?? 'Hockey Operations Directory',
}

export type ServerEnv = {
  SUPABASE_URL: string | undefined
  SUPABASE_SECRET_KEY: string | undefined
}

export function getServerEnv(): ServerEnv {
  return {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  }
}

export function hasSupabaseServerConfig(env: ServerEnv = getServerEnv()): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SECRET_KEY)
}

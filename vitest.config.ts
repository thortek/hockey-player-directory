import { defineConfig } from 'vitest/config'

// Unit tests cover pure helpers only: node environment, no secrets, no Supabase.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
})

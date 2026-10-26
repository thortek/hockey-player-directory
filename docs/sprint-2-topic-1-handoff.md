# Sprint 2 · Topic 1 Handoff — Server Functions, Secret Hygiene, First Vitest Suite

## 1. Summary (what shipped)

The directory now loads every page through TanStack Start server functions. `/players` lists 23 active players with a URL-driven position filter, `/players/$playerId` is a bookmarkable detail page with that player's games, `/games` filters by status and player in the URL, and `/` shows live counts. Data comes from Supabase when server env is set and from the built-in seed roster otherwise.

## 2. Boundary decisions (keep these stable)

- Secrets: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, read only through `getServerEnv()` inside handlers.
- Only `src/server/*` may import `src/lib/supabase.server.ts`.
- Server functions return DTOs, never rows, clients, or env.

## 3. Secret hygiene proof (checklist — mark what you verified)

- [x] `.env.example` lists no secret with a `VITE_` prefix.
- [x] `.env` and `*.local` are git-ignored.
- [x] `grep -r "SUPABASE_SECRET_KEY\|supabase-js\|createClient(" dist/client` finds nothing after `npm run build`.
- [x] No route or component imports `supabase.server`.

## 4. Test status

`npm test` runs `src/lib/directory/mappers.test.ts`: 8 tests covering name normalization, bad search params, active filtering, sorting, and combined game filters. Removing the active filter turns the `toPlayerCards` test red.

## 5. Leftover risks / known gaps

- No database yet; seed data stands in.
- No sign-in: anyone with the URL sees the roster.
- Inputs are validated by hand; a schema library may replace this when forms arrive.

## 6. What rolls into the next Sprint 2 topic

Sprint 3 replaces the seed with a Supabase schema, generated types, and typed queries behind the same server functions.

## 7. File map for the next reader

| File | Role |
|------|------|
| `src/config/env.ts` | Public vs server env split |
| `src/lib/supabase.server.ts` | Server-only client |
| `src/server/directory.ts` | Server functions |
| `src/lib/directory/mappers.ts` | Pure shaping and search parsing |
| `src/lib/directory/mappers.test.ts` | Vitest suite |
| `src/data/seed.ts` | Seed roster and schedule |

## 8. Stakeholder one-liner

Staff get real, shareable roster and schedule pages that render on first load, and the database key never leaves the server.

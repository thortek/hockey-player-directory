# Scouting acceptance verification — Hockey Operations Directory

Checked against `docs/scouting-data-requirements.md` on 2026-10-26, on the production deployment of commit `f25e618` (`https://hockey-player-directory-rose.vercel.app`) unless a row says local. Database: hockey Supabase project `rexfsjoamjiqcfukyyle`, seeded with 24 players, 22 games, 121 scouting events.

## 1. Joined and filtered reads

| ID | Criterion | How checked | Result | Evidence |
|----|-----------|-------------|--------|----------|
| R1 | Players list loads through the typed helpers, not ad-hoc strings in the route | Opened `/scouting/players?position=all`; read `src/routes/scouting/players.tsx` | Pass | 23 active players listed (Sam Ortiz is inactive and correctly absent). The route imports only `usePlayers` from `hooks.ts` → `fetchPlayers` → `listPlayers` |
| R2 | Events show joined player and game context | Opened `/scouting/events?playerId=player-005` | Pass | Each row shows game date, opponent, period/clock, and player name from the `players!inner` / `games!inner` join |
| R3 | A requirements filter narrows the list | Player filter = Jonah Whitfield (`player-005`) | Pass | Page showed **10 events**; a direct database count of `scouting_events where player_id = 'player-005'` returned 10 |
| R4 | No-match filters show an empty state, not a crash | `playerId=player-005&eventType=save` (Jonah has no saves) | Pass | "No scouting events match these filters yet." rendered; a bad `?position=goalieeeee` falls back to all players |

## 2. RPC aggregate correctness

| ID | Criterion | How checked | Result | Evidence |
|----|-----------|-------------|--------|----------|
| A1 | Totals come from the RPC, not a client loop over events | Read `src/routes/scouting/aggregates.tsx` and `hooks.ts` | Pass | Route calls `usePlayerEventTotals` → `fetchPlayerEventTotals` → `getPlayerEventTotals` → `player_event_totals`; no event list is fetched on that page |
| A2 | A player's totals match a manual count | Compared Jonah Whitfield's row with a direct query of his events | Pass | UI: GP 3, assists 2, shots 2, hits 2, penalties 1, total 10. Database: shot 2, assist 2, hit 2, penalty 1, giveaway 2, note 1 across 3 games = 10 (giveaways and notes count toward Total but have no column) |
| A3 | Totals follow a new event | Logged a goal for Jonah in the Oct 25 game, then opened Totals inside the app | Pass | Row changed to GP 4, goals 1, total 11 without a page reload. The temporary event was deleted afterward (back to 121 events) |

## 3. Mutation + cache freshness

| ID | Criterion | How checked | Result | Evidence |
|----|-----------|-------------|--------|----------|
| C1 | Writes use the typed mutations | Logged the goal from the "Log an event" form | Pass | Form → `useCreateScoutingEvent` → `saveScoutingEvent` → `createScoutingEvent` (`TablesInsert<'scouting_events'>`); "Logged a goal" confirmation shown |
| C2 | Lists named in the invalidation map refresh without a reload | Watched the filtered event list and the totals after the write | Pass | Jonah's event list went 10 → 11 in place; totals updated on the next in-app navigation, matching the `eventLists()` and `aggregates()` rows of `docs/scouting-cache-invalidation-map.md` |
| C3 | Unrelated keys are not cleared | Compared to the invalidation map | Pass | Creating an event does not invalidate `playerLists()`; the roster has no event-derived fields, so it stays cached. No hook calls `invalidateQueries()` without a key |
| C4 | Bad writes fail readably | Local smoke test: event for `player-999`, jersey number 120 | Pass | "That scouting event points at a player or game that does not exist." / "One of the player fields is outside the allowed values." |

## 4. Typed-safety regression note

| Check | Notes |
|-------|-------|
| Which modules depend on `players.full_name` from `src/types/database.ts`? | Simulated a rename by changing `full_name` to `display_name` in the generated types and ran `npm run typecheck`: **14 errors in 7 files** (`queries.ts`, `mappers.ts`, `mappers.test.ts`, `server/scouting.ts`, and the three scouting routes). Restored the file; typecheck is clean again |
| Compile time or runtime? | Compile time, as long as nobody casts to `any`. Rows are typed from the generated `Database`, so a renamed column breaks `npm run typecheck` before deploy. Vercel's build does not typecheck, so `npm run typecheck` must stay in the pre-push routine |
| How are types regenerated after a migration? | `npx supabase gen types typescript --project-id rexfsjoamjiqcfukyyle --schema public > src/types/database.ts` (`docs/typegen-notes.md`) |

## 5. Fixes log

| Found | Fix | File |
|-------|-----|------|
| New Supabase projects don't grant table privileges, so even the secret key got `permission denied` | Added grants for `service_role` only | `supabase/migrations/0015_service_role_grants.sql` |
| Seeded "final" games were dated in the future | Shifted every game back 7 days in the database and seed | `supabase/seed.sql` |
| Vercel blocked the build for CVE-2026-102989 | Upgraded `@tanstack/react-start` to 1.169.4 | `package.json` |

## 6. Known gaps (not failures)

- Scouting pages fetch after hydration, so they show "Loading…" briefly; the directory pages (`/players`, `/games`) already render on the server.
- Writes are open to anyone with the URL until Sprint 4 adds staff sign-in.

## Overall gate

**Ready for stakeholder handoff.** Every Section 1–3 row passed on production, and the type-safety check shows a column rename fails the build rather than the board.

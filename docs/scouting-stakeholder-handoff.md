# Hockey Operations — Scouting Data Layer Stakeholder Handoff

Sprint 3 (Typed Data Access) · 2026-10-26 · Live at `https://hockey-player-directory-rose.vercel.app/scouting/players`

## 1. For scouts and ops (plain summary)

Scouts can now log what a player did in a specific game (a goal, a hit, a note) and see it right away in three places: the player's event feed, the game's event list, and a season or single-game totals table. Every observation is tied to a real player and a real game, so a typo can't create a stray record, and the totals are counted by the database rather than added up by hand. When the database changes shape, the app refuses to build until every page that depends on the change is updated, so the board doesn't quietly show wrong numbers.

## 2. What we built (in scope)

### 2.1 Schema entities and relationships

| Entity | Role for scouts | Keys / relationships |
|--------|-----------------|----------------------|
| `players` | Who is being evaluated: name, number, position, active flag | `player-NNN` id (same as existing bookmarks); referenced by events |
| `games` | When and against whom: date, opponent, home/away, upcoming or final | `game-NNN` id; referenced by events |
| `scouting_events` | One observation about one player in one game | Foreign keys to both, `ON DELETE RESTRICT` so history can't be erased by deleting a player or game |

### 2.2 Typed data-access boundary

All reads and writes go through `src/lib/scouting/queries.ts`, `mutations.ts`, and `rpc.ts`, typed from `src/types/database.ts`, which is generated from the live database. Pages use TanStack Query hooks (`hooks.ts`, `mutation-hooks.ts`) that call server functions, so the database key never reaches the browser. The full list of allowed functions is in `docs/scouting-data-access-api.md`.

### 2.3 RPC aggregate purpose

`player_event_totals` is a Postgres function that groups events by player and counts goals, assists, shots, hits, takeaways, giveaways, saves, and penalties in one query, for the whole season or one game. The browser never downloads every event to sum them.

### 2.4 Cache invalidation rules

| After this write | Refetch these keys |
|------------------|--------------------|
| Log an event | Event lists, totals, game lists, that player's detail |
| Edit an event's note | Event lists only |
| Update a player's roster fields | Player lists, that player's detail, event lists, totals |

Details and reasons: `docs/scouting-cache-invalidation-map.md`.

### 2.5 Acceptance snapshot

From `docs/scouting-acceptance-verification.md`, run on production: filtered reads (R1–R4), the totals spot-check against a direct database count (A1–A3), and a live create that refreshed both the event list and totals without a reload (C1–C4) all **passed**. A simulated column rename produced 14 type errors in 7 files, so schema drift fails the build. Gate: ready for handoff. Known gaps: scouting pages show a brief loading state, and writes are open until sign-in exists.

## 3. Explicitly out of scope (next topic / sprint)

- **Auth roles:** no sign-in yet; coaching, scouting, and medical staff all see the same data (Sprint 4).
- **Production RLS policy polish:** RLS is on with no policies, so only the server key can read; per-role policies come with sign-in.
- **Playwright coverage depth:** the checks above were manual; end-to-end tests and CI gating are Sprint 7.
- Deleting players or games, video, live game feeds, and league-wide stats.

## 4. How schema evolution should work next time

1. Write the change as a new file in `supabase/migrations/`; never edit an applied one.
2. Apply it with `npx supabase db push --db-url "$SUPABASE_DB_URL"`.
3. Regenerate `src/types/database.ts` (`docs/typegen-notes.md`).
4. Run `npm run typecheck` and fix every reported call site; no `any` casts.
5. Update `docs/scouting-data-access-api.md` and, if a write changes, `docs/scouting-cache-invalidation-map.md`.
6. Re-run the affected rows of `docs/scouting-acceptance-verification.md` on production.

## 5. Artifact index (evidence)

| Doc / area | Path |
|------------|------|
| Requirements & success criteria | `docs/scouting-data-requirements.md` |
| Schema notes | `docs/scouting-schema-notes.md` |
| Data-access public API | `docs/scouting-data-access-api.md` |
| Cache invalidation map | `docs/scouting-cache-invalidation-map.md` |
| Acceptance verification | `docs/scouting-acceptance-verification.md` |
| This handoff | `docs/scouting-stakeholder-handoff.md` |

## 6. Recommended next-sprint boundaries

| Track | Goal | Depends on this sprint |
|-------|------|------------------------|
| Auth & RLS (Sprint 4) | Staff sign-in; coaching, scouting, and medical see different rows | Stable tables, typed helpers that already take the client as a parameter |
| APIs & validation (Sprint 5) | External event feed and schema-validated forms | `createScoutingEvent` as the single write path |
| E2E quality (Sprint 7) | Playwright and CI over the scouting routes | Stable routes and query keys |

## 7. Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Developer | Fervent Kestrel | 2026-10-26 | All acceptance rows passed on production |
| Hockey ops reviewer | | | |

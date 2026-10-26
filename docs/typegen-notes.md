# Type generation notes — scouting schema

## Migrations applied

| File | Purpose |
|------|---------|
| `supabase/migrations/001_scouting_schema.sql` | `players`, `games`, `scouting_events`, indexes, RLS on |
| `supabase/migrations/0015_service_role_grants.sql` | Table privileges for `service_role`; new Supabase projects no longer grant them automatically |

- Applied with the Supabase CLI against the hockey project (ref `rexfsjoamjiqcfukyyle`):
  `npx supabase db push --db-url "$SUPABASE_DB_URL"`
- Seed data loaded once with `--include-seed` from `supabase/seed.sql` (24 players, 22 games, 121 scouting events).
- `SUPABASE_DB_URL` lives only in `.env.local`, which git ignores. No connection strings or keys belong in this file.

## Typegen command

```bash
npx supabase login            # once per machine
npx supabase gen types typescript --project-id rexfsjoamjiqcfukyyle --schema public > src/types/database.ts
```

Output path: `src/types/database.ts` (exports `Database`, `Tables`, `TablesInsert`, `TablesUpdate`).

## What was verified after generation

- `Database['public']['Tables']` contains `players`, `games`, and `scouting_events`, each with `Row`, `Insert`, and `Update` shapes.
- Column names match the SQL exactly (`full_name`, `jersey_number`, `played_at`, `event_type`, `clock_seconds`).
- `scouting_events.Relationships` lists `scouting_events_player_id_fkey → players` and `scouting_events_game_id_fkey → games`.
- With the secret key: 24 / 22 / 121 rows. With the publishable key: `permission denied` on all three tables, as intended until Sprint 4.
- Inserting an event for `player-999` fails on `scouting_events_player_id_fkey`.

## When to regenerate

- After every new migration, including the aggregate RPC later this sprint (it adds an entry under `Functions`).
- Never hand-edit `src/types/database.ts`. Change the SQL, apply it, regenerate, then let `npm run typecheck` show every call site the change touched.

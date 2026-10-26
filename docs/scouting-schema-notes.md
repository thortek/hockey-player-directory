# Scouting schema notes

Migration: `supabase/migrations/001_scouting_schema.sql`. Requirements: `docs/scouting-data-requirements.md`.

## Tables

| Table | Purpose | Key |
|-------|---------|-----|
| `players` | Working roster: name, jersey number, position, team label, active flag | `id` text, `player-NNN` (matches existing bookmarks) |
| `games` | Schedule: date/time, opponent, home/away, venue, upcoming or final | `id` text, `game-NNN` |
| `scouting_events` | One observation (goal, assist, shot, hit, takeaway, giveaway, save, penalty, note) about one player in one game | `id` uuid |

## Relationships

- `scouting_events.player_id → players.id` — `on delete restrict`
- `scouting_events.game_id → games.id` — `on delete restrict`
- A player's games are derived through `scouting_events`; `games` no longer stores a single `player_id` as the Sprint 1 seed did.

Restrict, not cascade: deleting a player or game must never quietly erase scouting history. Deactivating a player (`is_active = false`) is the supported path.

## Filters supported

| Need (requirements §3) | Columns / index |
|------------------------|-----------------|
| Players by position | `players.position` (check constraint + index) |
| Games by status or date | `games.status`, `games.played_at` (index) |
| Events by player, game, or both | `scouting_events.player_id`, `scouting_events.game_id` (indexes) |
| Per-player aggregate | `scouting_events.event_type` grouped by `player_id`; RPC in a later migration |

## Constraints that protect the UI

- Ids must match `player-NNN` / `game-NNN`, so a malformed id can't create an un-bookmarkable row.
- `position`, `status`, and `event_type` are checked lists rather than free text, so filters can't drift from data.
- `period` 1–5 (overtime and shootout) and `clock_seconds` 0–1200 reject impossible timestamps.

## Security

RLS is enabled on all three tables with no policies yet. The server's secret key bypasses RLS; the publishable key sees nothing. Sprint 4 adds per-role policies.

## Decisions / open questions

- **Text ids instead of UUIDs for players and games** — keeps every Sprint 1–2 URL valid. Events use UUIDs because nobody bookmarks them.
- **`updated_at` is set by the app for now** — a trigger can replace that if more writers appear.
- **Open:** should a "note" event require `notes` text? Left optional until scouts try it.
- **Open:** multiple teams/orgs — `team_name` is a label, not a table, until a second org exists.

# Scouting data requirements — Hockey Operations Directory

Sprint 3 (Typed Data Access). Requirements only: no SQL or TypeScript lives in this file.

## 1. Actors and goals

| Actor | Goal | What they need from data |
|-------|------|--------------------------|
| Scout | Record and review what a player did in a specific game | Player and game lists; events tied to one player and one game; add or edit an event note without touching other rows |
| Hockey ops / data steward | Keep roster and schedule data consistent as the schema changes | Stable keys and relationships so a renamed or added column breaks the build, not a scout's page |
| Coaching staff (read-only this sprint) | Compare players across games before line decisions | A per-player summary of goals, assists, shots and hits across games |

## 2. Core entities and relationships (plain language)

- **Player** — someone on the working roster. Has a stable id that already appears in bookmarks (`player-000`), a display name, jersey number, position, team label, and whether they are active.
- **Game** — a contest on a date and time against an opponent, at home or away, either upcoming or final.
- **Scouting event** — one thing a scout observed: a goal, assist, shot, hit, takeaway, giveaway, save, penalty, or a free-text note. It belongs to **exactly one player and exactly one game**, with an optional period and game clock.

Relationships scouts rely on:

- One player has many scouting events; one game has many scouting events.
- "Events for player X in game Y" is answered through those links, never by matching names in text.
- A player's games are the games they have events in.

## 3. Filters and scout views

1. List players, optionally filtered by position (existing `/players?position=` bookmarks keep working).
2. List games, optionally filtered by status (upcoming / final).
3. List scouting events filtered by player, by game, or both.
4. See a **per-player aggregate** (event counts by type across games) computed by the database, not by summing rows in the browser.

Writes:

- Create a scouting event and edit its note.
- Update a player's roster fields (number, position, active flag).
- All writes go through typed helpers, never SQL strings assembled in the UI.

## 4. Success criteria (measurable)

1. **Join integrity** — every event returned to a view includes its player name and game opponent/date; seed data has no orphan events, and the database refuses an event whose player or game does not exist.
2. **Filter fidelity** — player, game, and combined event filters return only matching rows; a missing or invalid filter means "all", never an error.
3. **Schema-change safety** — reads and writes use types generated from the database, so renaming or mistyping a column fails `npm run typecheck` before deploy.
4. **Aggregate usefulness** — one database function returns per-player totals for a chosen game range in a single round trip.
5. **Cache freshness** — after a create or update, the lists and aggregate that include that row refetch, so scouts never see a stale count.

## 5. Out of scope this sprint

- Sign-in and per-role visibility (Sprint 4). Until then the browser never talks to the database directly.
- Live game feeds, video, box-score imports, or league-wide stats.
- Deleting players or games.

## 6. Glossary for later steps

| Term | Meaning here |
|------|--------------|
| Entity | A real-world thing stored as a table (player, game, scouting event) |
| Join | Combining rows from related tables through their keys |
| Filter | Narrowing a list by values a scout picks, kept in the URL |
| Aggregate | A count or sum across many rows, such as goals per player |
| Typed data access | Query and write helpers whose types come from the database schema |

## 7. Source of truth

Schema notes, query modules, the RPC, and acceptance checks in Sprint 3 trace back to sections 1–4. A change in scope updates this file first.

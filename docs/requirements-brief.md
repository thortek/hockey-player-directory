# Hockey Operations Player Directory — Sprint 1 Requirements Brief

**Product:** Hockey Operations Directory  
**Sprint goal:** A bookmarkable, type-safe, server-rendered skeleton staff can open on arena wifi and use immediately.  
**Data rule for this sprint:** Use a built-in **seed list** (≥20 players, ≥20 games) in the app. Player ids are `player-000`, `player-001`, …. Each game has a `playerId`. Do not invent login, live APIs, or a production database.

This brief is the director’s contract for later coding-agent prompts. If a feature is not listed here, it is not required this sprint.

### Locked decisions (do not reinterpret)

| Decision | Rule |
| --- | --- |
| Seed size | At least **20 players** and **20 games**. |
| Player ids | Pattern **`player-000`** (three-digit padding). Example bookmark: `/players/player-000`. |
| `/about` | **Keep** the existing About route. Do not delete it. |
| Unknown player | Render the unknown-player page with HTTP **200**, not 404. |
| Games → player | Every game **must** include `playerId` pointing at a seed player. |

## Plain-language glossary

| Term | Meaning |
| --- | --- |
| **First paint** | The first HTML the browser shows after you open or hard-refresh a URL. Staff should already see directory content, not an empty shell waiting on a spinner. |
| **Bookmarkable URL** | A full address you can copy, paste, or save. Opening it later (even in a new tab) lands on the same page with the same content and filters. |
| **Path param** | A required piece of the URL path that names one record. Example: in `/players/player-000`, the path param is `playerId` = `player-000`. |
| **Search param** | An optional `?key=value` pair after the path. Example: `/players?position=forward`. Missing or invalid values must fall back to a safe default, not crash. |
| **Seed data** | A typed, in-repo list of realistic players and games. **At least 20 players and 20 games.** Player ids use the `player-000` pattern. Each game points at one player id. |

---

## Actors and goals

| Actor | Goal this sprint | Why it matters |
| --- | --- | --- |
| **Hockey ops staff** (primary) | Open the directory on arena wifi and see usable content on first paint—no spinner-first wait. | Game-day networks are slow. An empty shell is not a directory. |
| **Hockey ops staff** | Open a **specific player** from a bookmark, text, or printed URL and land on that player’s page. | Player pages must be linkable and shareable, not hidden behind in-app clicks only. |
| **Hockey ops staff** | Browse the **players list** and the **games list**, including a simple filter they can share in the address bar. | Staff need two working sections, not a single demo page. |
| **Teammate receiving a link** | Paste `/players/player-000` or a filtered list URL and see the same page without extra setup. | Bookmarkability is the acceptance test, not “it worked when I clicked around.” |

Out of this table on purpose: fans, ticket buyers, players editing their own bios, and admin roles. Those people are not users of this skeleton.

---

## Route map (four hockey-ops routes + keep `/about`)

Build these four hockey-ops pages. **Keep the existing `/about` route** from the scaffold (do not delete it). Do not add `/login`, `/admin`, or extra nested product sections this sprint.

| Path | Kind | One-line purpose |
| --- | --- | --- |
| `/` | Static | Home: name the product, say who it is for, and send staff to Players and Games. |
| `/players` | Static list | Player directory: at least 20 seed players, each linking to a bookmarkable detail URL. |
| `/players/$playerId` | Dynamic detail | One player’s page. `$playerId` is a **path param** in the URL, so the page is bookmarkable and shareable. |
| `/games` | Static list | Games board: at least 20 seed games, each tied to a player id, that staff can scan and filter. |
| `/about` | Static (keep) | Existing starter About page. Leave it in the route tree; it is not a hockey-ops product page and does not need directory seed content. |

**Bookmarkability rule:** Player detail is not “click a row and keep the URL at `/players`.” The browser address must look like `/players/player-000` (ids are `player-000`, `player-001`, …). Refreshing that URL must show the same player.

Shared chrome (header/nav) may wrap these routes. Nav is not a new route. `/about` may stay linked in the header.

---

## What must show on first paint

“First paint” means: after a **hard refresh** (or opening the URL in a new tab), the **first HTML document** already contains the content below. Seed data is allowed and expected. A spinner-only or blank directory shell **fails**.

Client-side fetching *after* an empty page is not acceptable for this first content.

### `/` Home

Must already contain:

- A heading that this is the **Hockey Operations Directory** (or equivalent staff-facing name).
- One or two sentences: staff can look up players and games immediately on arena wifi.
- Working links to `/players` and `/games`.
- At least a short snapshot of real seed content (for example two featured player names, or a count plus names)—not a generic “Welcome to the app” starter page with no directory data.

### `/players` Players list

Must already contain:

- A staff-facing heading such as **Players** or **Player directory**.
- A visible **list of at least 20 seed players** when no position filter is applied. Each row shows at least **name**, **number**, and **position**.
- Each player name (or row) is a link to `/players/$playerId` using that player’s id (`player-000` pattern).
- If a position filter is in the URL, the list matches that filter; the current filter is visible on the page.

### `/players/$playerId` Player detail

Must already contain:

- That player’s **name**, **number**, and **position** (from seed data) when `playerId` matches a seed player.
- The current `playerId` visible on the page so a human can confirm the URL and the page agree.
- A way back to `/players`.
- That player’s **games** from seed data (every game whose `playerId` matches), each linking toward `/games` (a filtered games URL is fine).
- If `playerId` is missing from seed data: HTTP **200** (not 404) with a clear **unknown player** message that includes the id from the URL and a link back to `/players`—not a blank page or a crash.

### `/games` Games list

Must already contain:

- A staff-facing heading such as **Games**.
- A visible **list of at least 20 seed games** when no filter is applied. Each row shows at least **date** (or datetime), **opponent** (or home vs away label), **status** (`upcoming` or `final`), and the related **player** (name and/or `player-000` id, linking to that player’s detail page).
- If a status or player filter is in the URL, the list matches that filter.
- If the filter yields zero rows: a clear empty state (for example “No games match this view”) plus a way to see all games or return toward players—not a broken page.

---

## Type-safe path and search params (plain language)

The app must **name**, **read**, and **check** URL pieces in code. Staff should never see a crash because a query string is messy. Invalid values become safe defaults.

### Path params

| Route | Param | Rules |
| --- | --- | --- |
| `/players/$playerId` | `playerId` | Required. A non-empty string in the **`player-000` pattern** (`player-` plus three digits: `player-000`, `player-001`, …). Use it in the path (`/players/player-000`), **not** as `?id=000` for the detail page. Empty or non-string values are invalid. Unknown ids still render the unknown-player page with HTTP **200** (not 404). |

No other route has a path param.

### Search params

Search params are optional. They live after `?`. They must be bookmarkable: refresh keeps the same filter.

#### Players list — `/players`

| Key | Allowed values | Default when missing or invalid |
| --- | --- | --- |
| `position` | `all`, `forward`, `defense`, `goalie` | `all` (show every seed player) |

- Example bookmark: `/players?position=forward`
- Bad input such as `/players?position=goalieeeee` or `/players?position=` must **not throw**. Treat it as `all` and still render the list.
- Filter controls must update the address bar (shareable URL). Do not keep the filter only in React state.

#### Games list — `/games`

| Key | Allowed values | Default when missing or invalid |
| --- | --- | --- |
| `status` | `all`, `upcoming`, `final` | `all` |
| `playerId` | `all`, or a seed player id such as `player-000` | `all` (show every seed game) |

- Example bookmarks: `/games?status=upcoming`, `/games?playerId=player-000`
- Both keys may appear together (example: `/games?status=final&playerId=player-000`).
- Missing or nonsense values resolve to `all` for that key and still render (HTTP 200).
- Filter controls must write `status` and/or `playerId` into the URL. A player detail page may link to `/games?playerId=player-000` (that player’s id).

#### Home and player detail

No required search params this sprint. Ignore leftover `?` noise rather than erroring.

### What “type-safe” means here (for reviewers)

- Links to a player detail page pass a typed `playerId` in the path (for example `to="/players/$playerId"` with `params: { playerId }`), not a hand-typed guess like `/players?id=42` as the detail experience.
- List pages read filters through the router’s validated search values, not by parsing `window.location` by hand.
- Validation is defensive: bad search input degrades to defaults; a missing seed player still shows the unknown-player page at HTTP 200—not a 404 and not a fake player.

---

## Seed data expectations (implementable, not a live API)

Keep data in the repo (for example a `hockeySeed` module). No network login required.

**Minimum counts:** at least **20 players** and at least **20 games**.

**Players** — each player has:

- `id` — required string in the form **`player-000`** (`player-` + three-digit zero-padded index). First twenty ids are `player-000` through `player-019`. Do not use `p-17`, UUIDs, or jersey numbers as the path id.
- `name` — display name
- `number` — jersey number
- `position` — `forward`, `defense`, or `goalie`

**Games** — each game has:

- `id` — stable string
- `date` — ISO date or datetime string
- `opponent` — team name staff would recognize
- `status` — `upcoming` or `final`
- `playerId` — **required.** Must equal an existing player `id` (`player-000` pattern). This is how a game belongs to a player for detail pages and `/games?playerId=` filters.

Every game must point at a real seed player. It is OK if some players have more than one game and some have none, as long as there are ≥20 games and every `game.playerId` is valid.

That is enough to fill first paint, honor filters, and deep-link a player. Do not require live scores, box scores, or roster sync.

---

## Out of scope this sprint

Park these so agent prompts stay bounded. Do **not** block the skeleton on them.

- **Auth:** login, logout, roles, permissions, protected routes, Canvas/SSO
- **Live or external data:** NHL feeds, scraping, third-party hockey APIs, production databases, Supabase wiring
- **Writes:** create, edit, or delete players or games; CSV import; roster management workflows
- **Extra routes:** `/login`, `/admin`, `/stats`, per-game detail pages, ticket or fan pages. **Do not remove `/about`.**
- **Product extras:** video, notifications, advanced analytics, charts, comments
- **Hardening that belongs later:** full automated test suite, CI gates, and production secrets (later sprints can add Vitest, Playwright, and real backend reads)

Allowed later in *this* tutorial after the skeleton works: putting the app on GitHub and a public host. That is shipping the skeleton, not adding product scope.

---

## Acceptance criteria (yes/no browser checks)

Run these in a real browser against the local (or deployed) app. Hard-refresh means reload the URL directly, not only client navigation from another page.

Answer **Yes** or **No**. A **No** fails the criterion.

### Navigation and four routes

| # | Check | Yes / No |
| --- | --- | --- |
| 1 | Opening `/` shows a Hockey Operations Directory heading (or equivalent) and links to Players and Games. | |
| 2 | Opening `/players` in the address bar shows the players list page (not a 404 and not the home page). | |
| 3 | Opening `/games` in the address bar shows the games list page. | |
| 4 | Header/nav stays visible on Home, Players, and Games, and those three labels go to `/`, `/players`, and `/games`. | |
| 4b | Opening `/about` still loads the existing About page (HTTP 200), not a 404. Hockey-ops seed content is not required on About. | |

### First paint (server-rendered content)

| # | Check | Yes / No |
| --- | --- | --- |
| 5 | Hard-refresh `/players`: at least **20** player **names** are visible in the first view when unfiltered—not a spinner-only or empty directory shell. | |
| 6 | View Page Source (or equivalent first-document HTML) for `/players` contains at least one seed player name. | |
| 7 | Hard-refresh `/games`: at least **20** games are visible when unfiltered, including opponent/date **and** a related player id or name—not a spinner-only shell. | |
| 8 | Hard-refresh `/`: the page already describes the directory and shows at least one piece of real seed content (names or counts), not only a generic starter template. | |

### Bookmarkable player detail

| # | Check | Yes / No |
| --- | --- | --- |
| 9 | From `/players`, a player link goes to `/players/player-000` (or another `player-NNN` id), not only `/players?id=...`. | |
| 10 | Opening `/players/player-000` in a **new tab** or private window shows that player’s **name, number, and position**. | |
| 11 | Hard-refresh of `/players/player-000` still shows the same player content (bookmark works). | |
| 12 | The detail page displays the `playerId` from the URL so it matches the address bar. | |
| 13 | Opening `/players/not-a-real-id` returns HTTP **200** (not 404), shows an unknown-player message that includes `not-a-real-id`, and links back to `/players`—not a crash. | |
| 13b | A known player detail page lists or links that player’s seed games (via `game.playerId`). | |

### Type-safe search params

| # | Check | Yes / No |
| --- | --- | --- |
| 14 | Choosing a position filter on `/players` updates the address bar (example: `/players?position=forward`) and the list matches that position. | |
| 15 | Hard-refresh of `/players?position=forward` keeps the forward filter visible and the list still filtered. | |
| 16 | Opening `/players?position=nope` still shows the players page (defaults to all players)—it does not error. | |
| 17 | Choosing a games status filter updates the address bar (example: `/games?status=upcoming`) and the list matches. | |
| 18 | Hard-refresh of `/games?status=upcoming` keeps that view. `/games?status=nope` still renders (defaults to all). | |
| 18b | Opening `/games?playerId=player-000` shows only games for `player-000`. A nonsense `playerId` still renders the games page (defaults to all). | |

### Scope guardrails

| # | Check | Yes / No |
| --- | --- | --- |
| 19 | There is no login wall, no “connect to API key” step, and no live-feed dependency required to see the four pages. | |
| 20 | The hockey-ops skeleton is `/`, `/players`, `/players/$playerId`, and `/games`, and **`/about` is still present**. No login, admin, or live-API sections were required to pass the checks above. | |

**Sprint skeleton is accepted when every row is Yes.** Any No belongs in the next handoff as a gap, not as a silent skip.

---

## Prompt constraints for the coding-agent (later steps)

When asking an agent to implement this brief:

1. Implement the four hockey-ops routes above and **keep `/about`**.
2. Use **seed data** for first paint (≥20 players, ≥20 games, ids `player-000`…); load it on the server so HTML arrives filled in.
3. Validate path `playerId`; validate `position`, `status`, and games `playerId` search params with the defaults in this document. Unknown player pages must be HTTP 200.
4. Every game has a `playerId` that matches a seed player.
5. Do **not** add auth, Supabase, or live APIs.
6. Keep copy staff-facing (hockey ops), not generic “Page 1” labels.

Next sprint (not this brief): live reads from a real backend, secret hygiene, and automated tests. This sprint only has to prove the directory is **bookmarkable**, **type-safe in the URL**, and **server-rendered on first paint**.

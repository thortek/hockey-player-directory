# Service-role master key rule

The service-role key (the "secret key") is a master key: anything holding it skips every row-level rule in the database. This page says who may hold it. Sources: `docs/access/new-roles-brief.md` (what each job needs) and `docs/access/overgrant-audit.md` (where the key is used today, mark 2).

## Default deny

Any server job that is not on the allowed list below must not use the master key. If a job is not named here, it does not get the key, and a missing entry is never a reason to "just use the key for now."

## Allowed (server-only jobs)

1. **Public directory reads.** The signed-out pages `/`, `/players`, `/players/$playerId`, and `/games` (served by `src/server/directory.ts`) may use the key only to read the roster (player name, number, position, active flag) and the schedule (date, opponent, home or away, status). They must never read scouting events, notes, staff roles, or any medical or sports-science record with it.
2. **Local admin tooling run by a person, not by the app.** Applying migrations, loading seed data, and creating staff accounts with their roles, run from a developer's own machine with the key kept in their local environment file.

Nothing else. In particular, no staff request path is on this list.

## Never allowed

- **Assistant scout and video analyst requests**, in any form, including "read-only" convenience paths for either job.
- **Coaching, scouting, and medical requests.** Every everyday staff screen (the scouting overview, roster, events, totals, and any future staff page) runs as the signed-in person, so the database applies their role.
- **Hiding a medical flag with the master key.** Using the key to read a medical flag and then removing it before showing a screen is not allowed: one bug in that filter would leak it. Shared screens must read through the person's own access, where the flag is never returned at all.
- Sending the key to a browser, putting it in a `VITE_` setting, logging it, or writing it into the repository.

## Medical and sports-science data

Medical and sports-science data stay sealed to everyone except the medical job. Because staff screens never hold the master key, a screen with a bug fails closed: at worst it shows nothing, because the database refuses the rows, rather than showing another job's medical records.

## Changing this rule

Adding a job to the allowed list needs a written decision naming the job, the exact data it reads, and why it cannot run as a signed-in person. Removing an entry needs no decision.

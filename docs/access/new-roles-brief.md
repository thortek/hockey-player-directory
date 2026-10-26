# New hockey staff roles brief

## Why this note exists

Hockey operations added two jobs in the middle of the season: an assistant scout and a video analyst. This note is the contract the rest of Sprint 4 topic 2 must follow. It records what each new job needs and what stays locked; it does not rebuild sign-in or the existing access rules.

## Jobs already in the app (do not rebuild)

- **Coaching:** plans lines, practices, and games. Reads the roster, the schedule, and scouting observations; does not write scouting data and never sees medical records. Already built.
- **Scouting:** records and reviews what players did in games; reads and writes scouting events and notes; never sees medical records. Already built.
- **Medical:** tracks athlete health, injuries, and readiness; the only job that reads or writes medical notes. Already built.
- **Out of scope:** staff sign-in, the server checks that prove who is signed in, and the existing coaching / scouting / medical access matrix (`docs/security/role-access-matrix.md`).

## New jobs

### Assistant scout
- **Who they are:** a junior scout who attends games with the scouting staff and backs them up on nights the lead scout covers another rink.
- **Scouting information they need:** to read every scouting event and note on our players (what was observed, in which game, by period and clock) so they know what the lead scout has already flagged, and to log their own new observations during a game.
- **Game information they need:** the schedule and results (date, opponent, home or away, upcoming or final) to know which games to attend and to tag observations to the right game; the roster (name, number, position) to pick the right player.
- **What they must never see:** any medical or sports-science record, and any medical flag such as "injured", "limited", or "out", wherever it appears.

### Video analyst
- **Who they are:** a staff member who cuts game video into clips for coaches and scouts.
- **Scouting information they need:** to read scouting events and notes (type, player, game, period, clock) so they can find the moments scouts flagged and pull the matching clips. They review; they do not record new observations or edit notes.
- **Game information they need:** the schedule and results to match video files to the right game, and the roster to label clips with the right player name and number.
- **What they must never see:** any medical or sports-science record, and any medical flag on any screen, even if a player's absence from a clip makes someone curious why.

## What stays sealed

- **Medical data:** injury notes, return-to-play status, and any health record stay readable and writable only by the medical job. Neither new job may see or change them.
- **Sports-science data:** wellness, training load, and body-performance numbers stay with the medical job. Neither new job may see or change them.
- **Medical flags on shared screens:** a shared screen is a page more than one job can open, such as the scouting overview or a player board. On any shared scouting or game screen, the assistant scout and the video analyst must not see a medical flag ("injured", "limited", "out", "cleared"), even when the rest of that screen is allowed. A scouting page that still shows "injured" has leaked medical information.

## Out of scope

- Rebuilding staff sign-in, the session checks in server functions, or the existing access matrix.
- Video storage or a video player in the app.
- Giving either new job any roster, schedule, or role-management powers.

## What done means

- [ ] A teammate can tell that the assistant scout reads scouting events and notes, logs new observations, and reads the roster and schedule.
- [ ] A teammate can tell that the video analyst reads scouting events and notes and reads the roster and schedule, and writes nothing.
- [ ] A teammate can tell that medical data, sports-science data, and medical flags on shared screens stay sealed for both new jobs.
- [ ] Nothing in this note asks to rebuild sign-in, the session checks, or the old access matrix.

# Workspace checklist — Hockey Ops Player Directory

Date completed: 2026-08-31

## Tools

| Item | Value |
|------|--------|
| Operating system | macOS |
| Code editor | Cursor |
| Editor can open a whole folder? | Yes |
| Terminal app used | Cursor integrated terminal |

## Project home

- **Project folder name:** hockey-player-directory
- **Full path on this machine:** `/Users/thoranderson/UVUFall2026/INFO_3360-X01/hockey-player-directory`
- **`docs/requirements-brief.md` present in this folder?** Yes

## Node.js and npm

Run these in a terminal whose working directory is the project folder:

```text
node -v
npm -v
```

| Command | Output I saw | OK? |
|---------|----------------|-----|
| `node -v` | v24.15.0 | Yes |
| `npm -v` | 11.8.0 | Yes |

- **Node install source (if I installed today):** already installed
- **I closed and reopened the terminal after installing Node:** N/A

## Smoke checks (safe commands)

| Check | Command idea | What I observed |
|-------|----------------|-----------------|
| Where am I? | `pwd` (mac/linux) or `cd` (Windows) | `/Users/thoranderson/UVUFall2026/INFO_3360-X01/hockey-player-directory` |
| List project files | `ls` or `dir` | I see `docs/` |
| Brief readable | Open `docs/requirements-brief.md` in the editor | Actors/routes still make sense: hockey ops staff; routes `/`, `/players`, `/players/$playerId`, `/games`, plus keep `/about` |

## Blockers and notes

- No blockers. This folder is a clean project home: only `docs/` (requirements brief + this checklist).
- Used the real folder name `hockey-player-directory` (not the scaffold example `hockey-ops-directory`).

## Ready for scaffolding?

- [x] Editor opens this project folder
- [x] Terminal working directory is the project folder
- [x] `node -v` and `npm -v` both print versions
- [x] `docs/requirements-brief.md` is in the project
- [x] I know I will run future install commands only from this folder unless a step says otherwise

**Sign-off:** I can explain what a project folder, a path, the terminal, Node.js, and npm are in one sentence each before Step 3.

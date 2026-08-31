# Scaffold notes — Hockey Ops Player Directory

Date: 2026-08-31

Official starter created with:

```bash
npx @tanstack/cli@latest create hockey-player-directory \
  --target-dir . \
  --framework React \
  --package-manager npm \
  --no-git \
  -y \
  --force
```

That is the current TanStack CLI default: TanStack Start + React + TypeScript + Vite + Tailwind CSS + file-based TanStack Router. No extra add-ons (no auth, no database, no Supabase).

Existing `docs/` files were left in place.

## How to start the app

From this project folder (`hockey-player-directory`):

```bash
npm run dev
```

Then open **http://localhost:3000**

`package.json` maps `dev` to `vite dev --port 3000`. First-time install already ran during scaffolding (`npm install` via the CLI). Re-run `npm install` only if you clone onto another machine or delete `node_modules`.

## Key folders and files

| Path | Role |
|------|------|
| `package.json` | Scripts and dependencies. `dev` starts Vite on port 3000. |
| `vite.config.ts` | Vite plugins: TanStack Start, React, Tailwind v4 (`@tailwindcss/vite`), Devtools. |
| `tsconfig.json` | TypeScript. Path aliases: `#/*` and `@/*` → `src/*`. |
| `src/styles.css` | Global CSS and Tailwind v4 entry (`@import "tailwindcss"`). |
| `src/routes/` | File-based routes. `__root.tsx` is the HTML shell; `index.tsx` is `/`; `about.tsx` is `/about`. |
| `src/router.tsx` | Creates the TanStack Router instance used by Start. |
| `src/routeTree.gen.ts` | Generated route tree. Do not edit by hand; regenerate with `npm run generate-routes`. |
| `src/components/` | Starter Header, Footer, and ThemeToggle only. |
| `.cta.json` | TanStack CLI project config (Start, React, Tailwind, npm). |
| `docs/` | Course notes: requirements brief, workspace checklist, this file. |

Starter routes shipped with the template: `/` and `/about`. No hockey-ops routes or player data were added.

## Tailwind: no `tailwind.config.ts`

The current official starter uses **Tailwind CSS v4**. Theme and plugins live in `src/styles.css` (`@import "tailwindcss"`, `@plugin`, `@theme`) and the Vite plugin in `vite.config.ts`. There is no `tailwind.config.ts` / `tailwind.config.js`. That is expected, not a missing file.

## Out of scope for this scaffold

Player seed data, Supabase, auth, and custom hockey routes were not added. Those belong in later steps after this starter runs.

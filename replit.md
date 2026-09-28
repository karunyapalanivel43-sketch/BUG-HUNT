# BUG HUNT

A playable pixel-art cyber debugging arcade game where hunters inspect buggy Python snippets, choose fixes, and capture bugs across three difficulty levels.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/bug-hunt/src/App.tsx` — game screens, question bank, scoring, timer, keyboard controls, and Code Hunter states
- `artifacts/bug-hunt/src/index.css` — visual system, pixel/cyberpunk atmosphere, responsive layout, particles, and character styling
- `artifacts/bug-hunt` — root-preview React/Vite web artifact

## Architecture decisions

- The game is intentionally frontend-only; question content and scoring stay local so the core loop works without a service dependency.
- The question bank is grouped by difficulty with exactly ten cases per level.
- The Code Hunter is built from CSS pixel-art layers so the same character can show state labels and animate across every game screen.

## Product

- Home and briefing screens introduce the hunt and protagonist.
- Easy / Bug Spotter, Mid / Bug Tracker, and Hard / Bug Boss each contain ten Python debugging cases.
- Mid and Hard use live timers; answers support mouse/touch and A-D keyboard shortcuts.
- Scoring includes base points, streaks, and fast-answer bonuses, followed by level-complete and final hunt-log screens.

## User preferences

- Preserve the existing game structure and working logic while making only the requested mascot, level-count, and cyberpunk visual improvements.

## Gotchas

- The app uses the artifact-managed workflow so `PORT` and `BASE_PATH` are provided at runtime.
- This artifact has no API or database requirement.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

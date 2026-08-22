# Sibling Shipyard — Agent Guide

Sibling Shipyard is a browser-native, data-driven 2.5D isometric world built with
React + TypeScript + Vite and rendered with PixiJS. All application code lives in `app/`.
See `README.md`, `ARCHITECTURE.md`, `DESIGN.md`, and `IMPLEMENTATION_PLAN.md` for product
and technical context.

## Cursor Cloud specific instructions

- The only runnable service is the Vite frontend in `app/`. All commands must be run from
  the `app/` directory (scripts are defined in `app/package.json`): `npm run dev` (dev
  server on `http://localhost:5173/`), `npm test` (Vitest, ~130 unit tests), and
  `npm run build` (`tsc -b` typecheck + `vite build`).
- There is no linter configured (no ESLint config and no `lint` script). Type checking is
  performed as part of `npm run build` via `tsc -b`; use that as the closest equivalent to
  a lint/typecheck gate.
- There is no backend, database, or environment variables/secrets. Content is checked-in
  JSON under `app/src/data/` (`projects.json`, `milestones.json`), validated at load time.
- The dev server does not need `--host` for local computer-use testing; it binds to
  `localhost:5173`.
- Core interactive flow to verify the app works end to end: open the World view, select a
  project (e.g. Orion), and click "Reach Public Beta" to play the deterministic milestone
  construction animation. This exercises the store, milestone director, and PixiJS renderer.

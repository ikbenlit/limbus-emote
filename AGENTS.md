# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains app code:
  - `capture/` (webcam + MediaPipe hand tracking)
  - `analysis/` (motion/emotion logic)
  - `render/` (Three.js renderer, particles, shaders)
  - `utils/`, `ui.js`, and `config.js`
- `index.html` is the Vite entry that loads `src/main.js`; styles live in `src/style.css`.
- `docs/` holds product/design docs (`limbus-prd.md`, `limbus-fo.md`, `limbus-td.md`).
- `dist/` is generated output from `npm run build`/`pnpm run build`; do not edit manually.

## Build, Test, and Development Commands
- `pnpm install` (or `npm install`) installs dependencies.
- `pnpm run dev` starts the Vite dev server for local iteration.
- `pnpm run build` creates a production bundle in `dist/`.
- `pnpm run preview` serves the production build locally.

## Coding Style & Naming Conventions
- ES modules are required (`type: module`); include `.js` in import paths.
- Match existing formatting: 2-space indentation, single quotes, semicolons.
- File naming mirrors intent: `PascalCase` for classes/components (e.g., `TwoHandController.js`), `camelCase` for helpers (e.g., `motionAnalyzer.js`).
- Keep GLSL in `src/render/shaders/*.vert` and `*.frag`. No formatter or linter is configured, so keep diffs tidy.

## Testing Guidelines
- No automated test framework or coverage target is configured yet.
- Manual validation happens via `pnpm run dev`; verify camera permissions, hand tracking, and particle behavior.
- If adding tests, introduce a `test` script and use `*.test.js` names in a `tests/` directory.

## Commit & Pull Request Guidelines
- The repo has no commit history, so no established message convention exists. Use concise, imperative summaries (e.g., "Add emotion hysteresis handling").
- PRs should include a short description, how you tested, and screenshots/screen recordings for visual or interaction changes. Link relevant docs in `docs/` when applicable.

## Agent Notes
- AI tooling guidance lives in `CLAUDE.md`; keep it in sync with this file if workflows change.

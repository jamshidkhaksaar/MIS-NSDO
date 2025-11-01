# Repository Guidelines

## Project Structure & Module Organization
- Keep feature code under `src/app`; use App Router segments (`src/app/(segment)/page.tsx`) to scope domain features.
- `src/app/layout.tsx` defines the shared shell; keep cross-cutting UI in `src/app/components/` and shared styles in `src/app/globals.css`.
- Store reusable types in `types/`, scripts and scaffolding utilities in `scripts/`, and Supabase assets under `supabase/`.
- Check static assets into `public/`; treat `build/`, `dist/`, `jk-next-dist/`, and `next-dist/` as generated output that should not be re-committed.

## Build, Test, and Development Commands
- `npm run dev` — start the Turbopack dev server for local work.
- `npm run build` — compile the production bundle; run before release validation.
- `npm run start` — serve the optimized build locally.
- `npm run lint` — enforce the Next.js ESLint configuration.

## Coding Style & Naming Conventions
- Write typed React function components; default to server components until client APIs are required.
- Use two-space indentation, single quotes in TSX/JSX, and keep Tailwind classes grouped logically.
- Match filenames to exports (`hero-banner.tsx` → `HeroBanner`) using kebab- or camel-case; colocate segment-specific styles with their components when necessary.
- Prefer TypeScript interfaces for props and shared contracts in `types/`.

## Testing Guidelines
- Testing is not scaffolded yet; plan new tests beside features (`feature.test.tsx`) or under `src/tests/`.
- Use React Testing Library for component behaviour and add routing edge cases around App Router boundaries.
- Once tests exist, run the suite with `npm test` and document required coverage thresholds.

## Commit & Pull Request Guidelines
- Follow Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) with concise, imperative subject lines under 72 characters.
- Reference issue IDs or tickets in the subject when available.
- PRs should call out intent, implementation notes, affected routes, and manual verification steps; include screenshots from `screenshots/` for UI updates.
- Keep diffs narrowly scoped and update any relevant docs when behaviour changes.

## Security & Configuration Tips
- Store local secrets in `.env.local` and never commit `.env*` files.
- Document new environment variables in the PR description and mirror defaults in `next.config.ts` when applicable.
- After dependency updates, refresh `package-lock.json` with the repository’s Node version to avoid Turbopack cache thrash.

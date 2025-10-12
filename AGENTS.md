# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/app`, following the Next.js App Router layout: `layout.tsx` defines the shell, `page.tsx` hosts the default route, and feature-specific segments should sit in their own subfolders. Shared styles belong in `globals.css`. Store static assets in `public/`; keep generated artefacts out of version control.

## Build, Test, and Development Commands
Use `npm run dev` for a hot-reloading local server with Turbopack. `npm run build` creates the production bundle; run it before deploying or testing CI pipelines. Serve the optimized build with `npm run start`. Lint TypeScript and React code with `npm run lint`; fix issues before committing.

## Coding Style & Naming Conventions
Write components as typed React function components and prefer server components unless client APIs are required. Use TypeScript interfaces for props and keep filenames kebab- or camel-cased to match the exported symbol (`hero-banner.tsx` for `HeroBanner`). Follow the default Next.js ESLint rules; maintain two-space indentation, single quotes in JSX/TSX, and keep CSS utility classes readable by grouping related Tailwind utilities.

## Testing Guidelines
Automated tests are not yet scaffolded; when adding them, colocate unit tests beside the feature or under an eventual `src/tests` directory. Favor React Testing Library for component behaviour and add integration coverage for routing boundaries. Name test files with `.test.ts` or `.test.tsx`. Run the full suite in CI with `npm test` once introduced and keep coverage thresholds explicit in future tooling.

## Commit & Pull Request Guidelines
Adopt Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) with concise, imperative summaries under 72 characters. Reference issue IDs when available. Pull requests should outline intent, implementation notes, and testing performed; include screenshots or recordings for UI changes. Keep diffs focused, update related documentation, and request reviews from owners of the affected modules.

## Environment & Configuration Tips
Local secrets belong in `.env.local`; never commit `.env*` files. Update `next.config.ts` when adding rewrites or environment-dependent logic and document defaults in the PR. After dependency changes, refresh lockfiles with the matching Node version to avoid unexpected Turbopack rebuild errors.

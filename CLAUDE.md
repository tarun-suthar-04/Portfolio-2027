# CLAUDE.md — Engineering Guidelines & Repository Conventions

This document defines the conventions, guardrails, and verification commands for working in this codebase.

## 1. Tech Stack & Commands

- **Runtime**: React 19, TypeScript, Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`).
- **Dev server**: `npm run dev` (serves on `http://localhost:3000`; HMR is intentionally disabled in AI Studio).
- **Type check**: `npm run lint` (`tsc --noEmit`).
- **Production build**: `npm run build` (`vite build`).
- **Unit tests**: `npx --yes tsx --test src/lib/splitPhysics.test.ts`.

## 2. Core Conventions

1. **Preserve Dual-World Aesthetic Boundaries**:
   - `#tech` strictly uses ruled paper (`#f4f4f1`), `1px solid #111111` borders, hard offset drop shadows, and `#ffc400` / `#0f5c3f` / `#c81e1e` accents.
   - `#cre` strictly uses dark nocturnal surfaces (`#050608`), ambient radial gradients, `.ribbed-glass` optical overlays, and light-weight (`300`) `Inter Tight` + italic `Instrument Serif`.
   - Never bleed brutalist borders into `#cre` or glassmorphism into `#tech`.
2. **Keep Logic Decoupled**:
   - Put pure math, gesture thresholds, filtering, and URL parsing inside `src/lib/` with matching `*.test.ts` coverage.
   - Keep all portfolio copy and project metadata centralized in `src/data/portfolio.ts`.
3. **Never Re-render on Pointer Move**:
   - Split divider dragging (`--p`) and cursor-tracked process previews (`--mx`, `--my`) must update CSS custom properties directly via DOM refs rather than React `useState`.
4. **Accessibility & Keyboard Parity**:
   - Every view transition must preserve `inert` on hidden layers.
   - Modals must trap/handle `Escape` without triggering the view-level `Escape`-to-landing shortcut.
   - All interactive controls must be native `<button>` or `<a href>` elements with explicit labels.
5. **Zero Dead Links or Placeholder `TODO`s**:
   - Every action button must perform a real function (open modal, copy email, open external profile, or print resume).

## 3. Verification Checklist Before Committing

- [ ] `npx --yes tsx --test src/lib/splitPhysics.test.ts` passes cleanly.
- [ ] `npm run lint` reports zero TypeScript errors.
- [ ] `npm run build` succeeds cleanly.
- [ ] Desktop (`1440×900`) and Mobile (`390×844`) layouts verified with zero horizontal overflow or clipped typography.

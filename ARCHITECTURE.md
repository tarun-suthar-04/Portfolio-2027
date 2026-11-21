# ARCHITECTURE.md — System Architecture & Data Flow

## 1. High-Level Architecture

The application is a single-page React 19 + TypeScript application structured around **decoupled pure physics/routing logic**, **centralized typed portfolio data**, and **three isolated viewport layers** (`LandingSplit`, `TechnicalView`, `CreativeView`).

```text
[URL Hash / Search]
        │
        ▼
  src/App.tsx  (activeView: 'land' | 'tech' | 'cre')
   ├──► LandingSplit   (60fps ref-driven --p CSS custom property)
   ├──► TechnicalView  (Skill filter, ProjectModal, ResumeModal, Overscroll return)
   └──► CreativeView   (IntersectionObserver reveals, CreativeLightbox, Process hover/tap)
```

---

## 2. Performance-First Split Dragging

During pointer dragging on `#land`, updating React component state on every `pointermove` frame would trigger unnecessary virtual DOM reconciliation. Instead:

1. `LandingSplit` holds `progressRef` (`number`) and `dragRef` (`DragState | null`).
2. `pointermove` writes directly to `containerRef.current.style.setProperty('--p', ...)` in under 0.1ms.
3. CSS `calc((1 - var(--p)) * 100%)` and `calc(var(--p) * 100%)` drive GPU-composited layout sizing for both halves and the divider handle.
4. Only when a gesture crosses the commit threshold or flick velocity (`resolveSwipeOutcome`) does `LandingSplit` invoke `onOpenView(target)` to update `App` state.

---

## 3. Pure Logic & Testability (`src/lib/splitPhysics.ts`)

All mathematical and routing primitives live outside React components so they can be verified deterministically with `node:test`:

- `clampProgress(value)` — bounds `--p` to `[0, 1]` and guards `NaN`/`Infinity`.
- `easeInOutCubic(t)` / `easeOutBack(t)` — deterministic animation curves.
- `computeVelocity(samples)` — calculates directional velocity (`px/ms`) across a 90ms sliding pointer window.
- `resolveSwipeOutcome({ progress, velocity, isVertical })` — decides `'open'` vs `'snapBack'` based on flick velocity and directional displacement.
- `calculatePullProgress(accumulated, threshold)` — normalizes overscroll pull-to-return feedback (`0..1`).
- `parseViewFromLocation(hash, search)` / `viewToHash(view)` — bidirectional URL deep-linking.

---

## 4. Modal & Dialog Isolation

Interactive deep dives keep main views uncluttered while providing rich engineering and creative detail:

- **`ProjectModal`**: Displays multi-layer architecture breakdowns, system data-flow pipelines, implementation notes, and GitHub links for *Order Analyzer*, *Pixault*, and *Employee Management System*.
- **`ResumeModal`**: Renders a clean, print-ready ATS resume sheet (`window.print()`) synthesized from `src/data/portfolio.ts`.
- **`CreativeLightbox`**: Displays the full ribbed-glass composition, creative brief, prompt & lighting craft notes, and hex color swatches with `ArrowLeft` / `ArrowRight` / `Escape` navigation.

Notice: When any modal is open, `Escape` key handling stops propagation (`stopPropagation()`) so closing a modal never accidentally exits back to the Landing view.

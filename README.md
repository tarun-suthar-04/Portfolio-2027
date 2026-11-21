# Tarun Suthar — Dual-Persona Portfolio

An interactive, dual-world portfolio built for **Tarun Suthar** (**Software Developer · SDE I** & **AI Creative Artist**), structured around a tactile split-screen doorway (`TWO SIDES · ONE PERSON`) that opens into two completely distinct aesthetic systems.

## Overview

- **Landing Split (`#land`)**: A 50/50 interactive doorway pairing cobalt aurora gradients (Creative) against ruled engineering paper (Technical), unified by centered `mix-blend-mode: difference` display typography and a physics-driven draggable divider.
- **Technical Side (`#tech`)**: Ruled-paper neo-brutalist engineering portfolio featuring an interactive skill tier filter, software architecture inspector modals for every featured project, a printable ATS-friendly resume sheet, education, certifications, and learning roadmap.
- **Creative Side (`#cre`)**: Five-panel kinetic ribbed-glass editorial monograph with fluted glass optical distortion, bespoke procedural visual studies in a Bento exhibition grid with a fullscreen lightbox, a cursor-tracked process showcase (with mobile tap accordion), and an interactive toolkit.

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4 + CSS custom properties (`--p`, `--rib`, `--sa`, `--sb`)
- **Icons**: Lucide React
- **Testing**: Node.js built-in test runner (`node:test`) executed via `tsx`

## Getting Started

```bash
# Install dependencies
npm install

# Start development server on http://localhost:3000
npm run dev

# Run unit tests for split physics & routing
npx --yes tsx --test src/lib/splitPhysics.test.ts

# Type-check & production build
npm run lint
npm run build
```

## Project Structure

```text
├── index.html                   # Entry HTML & Google Fonts (Inter Tight, Instrument Serif, JetBrains Mono)
├── metadata.json                # Application metadata
├── src/
│   ├── App.tsx                  # Root view orchestrator & URL hash synchronization
│   ├── index.css                # Global theme tokens, ruled paper, ribbed glass & layout primitives
│   ├── data/
│   │   └── portfolio.ts         # Structured portfolio content (projects, architecture, works, process)
│   ├── lib/
│   │   ├── splitPhysics.ts      # Pure gesture physics, easing curves, overscroll & hash routing
│   │   └── splitPhysics.test.ts # Deterministic unit tests
│   └── components/
│       ├── LandingSplit.tsx     # 60fps draggable split doorway
│       ├── TechnicalView.tsx    # Ruled-paper engineering portfolio
│       ├── ProjectModal.tsx     # Interactive project architecture & data-flow inspector
│       ├── ResumeModal.tsx      # Printable ATS resume modal
│       ├── CreativeView.tsx     # 5-panel ribbed-glass editorial monograph
│       ├── CreativeArtwork.tsx  # Procedural vector compositions & process thumbnails
│       └── CreativeLightbox.tsx # Fullscreen Bento exhibition lightbox
├── DESIGN.md                    # Complete visual & motion design system specification
├── ARCHITECTURE.md              # State flow, physics math, and component boundaries
├── CLAUDE.md                    # Contributor & AI-assistant engineering conventions
└── CHANGELOG.md                 # Evolution from single-file HTML prototype to modular TypeScript app
```

## Deep Linking & Controls

- `#tech` or `?view=tech` opens the Technical portfolio directly.
- `#creative` or `?view=cre` opens the Creative portfolio directly.
- **Desktop**: Drag the yellow center divider, click either half, or press `ArrowLeft` / `ArrowRight`. Press `Escape` or overscroll past the boundary to return to Landing.
- **Mobile**: Swipe vertically anywhere on Landing, tap either half, or overscroll past the boundary to return.

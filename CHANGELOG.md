# CHANGELOG.md

## v2.2.0 — Masonry AI Visual Gallery & Landing Split Redesign

### Landing Split Redesign (`#land` & `LandingSplit.tsx`)
- **Obsidian Studio Grid + Cobalt Cubic Matrix**: Upgraded the Creative split half (`.half-panel.c`) to matte obsidian (`#13151a`) with `64px` hairline studio gridlines, radial cobalt/emerald ambient glows, italic blue serif (`#93c5fd`) accent, and a top-left `CubicMatrixCluster` (`4×4` cobalt matrix) paired with `01 · 2025–2026 · Visual Storytelling`.
- **Technical Snapshot Pairing**: Preserved the ruled-paper Technical half (`.half-panel.t`) with `SDE I · Indore, India` kicker and a top-right neo-brutalist `02 · Engineering Snapshot` (`M.Sc. CS (8.58) · 120+ DSA`) card, keeping mobile viewports (`max-width: 800px`) uncluttered.

### Creative Masonry Gallery (`#creative-work`)
- **3-Column Responsive Masonry**: Upgraded `Selected Work` into a multi-column CSS masonry layout (`columns-1 md:columns-2 lg:columns-3`) showcasing 9 AI-generated visual projects inside `.sleek-glass-card` white glass-orb cards with titles, category badges, and short descriptions.

## v2.1.0 — Studio Grid & Cubic Glass Creative Redesign

### Creative Section Complete Redesign (`#cre`)
- **Studio Grid Canvas**: Transitioned `#cre` to a crisp off-white architectural studio paper (`#f7f8fa`) with hairline square and vertical gridlines, pairing tight geometric `Inter Tight` headlines with italic `Instrument Serif` highlights and two-tone contrast subleads.
- **Cubic Pillow-Glass Engine (`CubicGlassGrid.tsx`)**: Added stepped 3D-beveled frosted square tile clusters (`emerald`, `cobalt`, `violet`) over luminous radial blooms.
- **Sleek Glass Gradient Cards (`Selected Work`)**: Replaced the Bento tiles with a matte charcoal (`#1b1c20`) gallery stage showcasing 3-column `rounded-[26px]` white cards featuring bottom-rising radial orbs refracted through crisp `28px` frosted square grids, complete with working category filters (`All`, `Direction`, `Motion & Frame`, `Concept`).
- **Interactive Process Workbench**: Replaced floating fixed previews with an accessible 5-stage (`01 Concept` – `05 Finish`) split workbench paired with a live preview card over an orchid-violet cubic cluster.
- **Redesigned Exhibition Lightbox**: Updated `CreativeLightbox.tsx` to match the sleek white glass-orb card aesthetic with visual direction notes and color swatches.

## v2.0.0 — Modular React + TypeScript Upgrade

- Migrated single-file HTML prototype into React 19 + TypeScript + Vite 8 + Tailwind CSS v4.
- Added decoupled split physics (`src/lib/splitPhysics.ts`) and `node:test` unit tests.
- Added Technical Skill Tier filtering, Project Architecture Inspector modal, and printable ATS Resume Sheet modal.

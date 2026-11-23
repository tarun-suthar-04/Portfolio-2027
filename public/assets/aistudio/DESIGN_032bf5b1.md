# Portfolio visual reference

This note describes the visual system currently implemented in the portfolio. Component behavior and CSS are the source of truth when implementation and this note differ.

## Shared foundation

- Inter Tight is the main UI/display family, Instrument Serif supplies editorial italic accents, and JetBrains Mono is used for technical labels.
- The landing split connects two deliberately separate identities: Creative and Technical.
- The top-level app has Landing, Technical, Creative, Gallery, and Admin views.

## Landing

The Creative half uses a liquid-glass mosaic, the Technical half uses ruled drafting paper and a macrodata canvas, and the name is clipped across the split. The central seam is draggable. Clicking a half, keyboard arrows, and touch gestures also open a side.

## Technical portfolio

The Technical side uses a warm paper ground, fine horizontal rules, near-black text and borders, hard offset shadows, and signal-yellow controls/highlights. Green and red appear as secondary accents. Selected Projects appears as a counted, ruled list with large project titles, metadata, and summaries. Fine-pointer desktop hover reveals staggered project previews and a folder-and-pointer cursor badge; project titles open the existing case-study views. There is no row-level case-study button or always-visible detail preview.

## Creative portfolio

The opening, process, and toolkit sections use an off-white studio grid. A dark plum manifesto and a charcoal selected-work panel provide contrast. Cubic glass details, blue/violet accents, and serif italic highlights carry the creative identity.

## Gallery and admin

The full-screen Gallery uses a charcoal ground, horizontal media rows, category filters, and an image/video lightbox. It supports drag, swipe, wheel, and keyboard interaction. AI Portraits and AI Video pieces expose prompt-copy controls when prompt text is available.

The Admin view uses a restrained light dashboard style and groups editing into overview, technical projects, creative works, inquiries, profile/links, and security/access.

Technical and Creative views scroll independently; edge overscroll does not navigate between views. Use explicit navigation controls or Escape to return to Landing.

## Relevant implementation modules

- `src/index.css` — shared tokens, top-level view transitions, and the Gallery layout.
- `src/components/LandingSplit.tsx`, `src/components/CreativeMosaicCanvas.tsx`, and `src/components/TechnicalAsciiCanvas.tsx` — landing surfaces and split behavior.
- `src/components/TechnicalView.tsx` and `src/components/ProjectDetailPage.tsx` — engineering portfolio and project details.
- `src/components/CreativeView.tsx` and `src/components/GalleryView.tsx` — creative sections and media gallery.

# Design system

The portfolio presents one person through distinct technical and creative views. Their visual styles stay separate, while the landing split and navigation connect them.

## Typography and shared tokens

The shared font stack is Inter Tight for interface and display text, Instrument Serif for editorial italic accents, and JetBrains Mono for compact technical labels and numeric data. Global tokens live in `src/index.css`; view-specific styles are kept with their components and utility classes.

## Landing split

The landing screen pairs a liquid-glass mosaic on the Creative side with ruled drafting paper and an animated macrodata field on the Technical side. A split seam, glass grip, and clipped name treatment connect the two halves. Clicking a half, dragging the seam, keyboard arrows, and touch gestures open a portfolio view.

## Technical view

The Technical portfolio uses a warm light-paper canvas, subtle horizontal ruling, black borders, offset hard shadows, and signal-yellow highlights. Green and red distinguish other status accents. The Selected Projects section uses full-width ruled rows with a dynamic count, sequence number, large title and platform metadata, and a right-aligned summary. On fine-pointer desktop, hovering dims neighboring rows and reveals three staggered, project-specific preview panels; the active title gets a yellow fill sweep. A yellow, black-bordered folder-and-pointer badge follows the pointer. Project titles open the existing case-study view. There is no separate case-study button or always-visible detail image in each row.

## Creative view and gallery

The Creative view uses a light studio grid for its introduction, process, and toolkit sections. A dark plum manifesto panel and a charcoal visual-work section add contrast. Cubic glass clusters and restrained blue/violet accents provide visual continuity without importing the Technical view's hard-bordered card treatment.

The standalone Gallery uses a charcoal full-screen canvas, compact category filters, drifting horizontal media rows, and a lightbox for image and video work. Its controls support pointer/touch movement and wheel input; AI Portraits and AI Video items can expose a copy-prompt action when prompt text has been saved.

## Admin panel

The admin uses a restrained light dashboard palette with a fixed desktop navigation rail, responsive navigation, status surfaces, tables/cards, and focused forms. The admin visual language is intentionally utilitarian so editing and review controls remain easy to scan.

## Motion, input, and accessibility

- Split progress is normalized from `0` (Creative) to `1` (Technical); `src/lib/splitPhysics.ts` owns the thresholds and gesture outcome helpers.
- The landing supports click, pointer drag, keyboard arrows, and touch. Technical and Creative scroll independently; overscrolling their top or bottom no longer returns to Landing. Use explicit navigation controls or Escape instead.
- Gallery rows support dragging, swiping, wheel input, focusable work buttons, and keyboard movement.
- Inactive top-level views use `inert`; interactive controls should remain semantic buttons or links with accessible names.
- Honor `prefers-reduced-motion` when adding animations. Avoid relying on motion alone to communicate state.

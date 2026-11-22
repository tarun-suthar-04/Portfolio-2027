# DESIGN.md

## Concept
**Two sides, one person.** The landing is a literal split. The Technical side is calm, structured and
honest (Bauhaus / neo-brutalist). The Creative side is atmospheric and typographic (fluted glass,
gradients, grain). They share only the person, the name, and the interaction.

## Tokens

### Technical (light)
| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#f4f4f1` | page |
| `--ink` | `#111` | text, borders, shadows |
| `--g` | `#0f5c3f` | green accent, "hands-on" |
| `--r` | `#c81e1e` | red accent, "learning" |
| `--y` | `#ffc400` | yellow highlight (surname, TODO chips) |
| card | `#f9faf9`, `1px solid #111`, shadow `4px 5px 0 #111` | all surfaces |

### Creative (dark)
| Token | Value |
| --- | --- |
| base | `#050608` |
| ice (display type) | `#a9c4de` |
| white | `#ffffff` |
| Panel 1 (hero) | navy `#061337` → teal `#0a3a4a` → green `#0b6a55`, glow `#e6fbc6` |
| Panel 2 (poster) | `#04050b` → `#071a33` → `#1f5282` → `#bcd4ee` + hairline grid |
| Panel 4 (process) | `#fff1cf` → `#ffb560` → `#ff5a14` → `#2a0a02` → `#000` |
| Panel 5 (closing) | `#050b2e` with `#1b86e0` / `#93f2da` glow |

## Typography
| Role | Font | Settings |
| --- | --- | --- |
| Technical display | Inter Tight 800 | tracking `-0.05em`, line-height ~0.93 |
| Technical body | Inter Tight 400–600 | 14–15px / 1.55 |
| Labels | JetBrains Mono 500–700 | 10–12px, uppercase, tracking `.12–.14em` |
| Creative display | Inter Tight **300** | `clamp(54px, 15vw, 170px)`, tracking `-0.065em`, line-height .86 |
| Accent | Instrument Serif *italic* | surname, one word per headline |
| Creative small | Inter Tight 400 | 12px, `(01)` index markers, `↗` arrows |

## The fluted-glass recipe (Creative)
Three layers on top of a mesh gradient (`<i class="fl">`, rib width in `--rib`):
1. `::before` — `backdrop-filter: blur(9px) saturate(1.25)` masked by a repeating gradient so only the
   rib bands blur.
2. `::after` — 1px dark rib lines + faint light bands (`repeating-linear-gradient`).
3. panel `::after` — SVG `feTurbulence` grain, `mix-blend-mode: overlay`, ~16% opacity.
A slow-drifting blurred blob (`.bl`) moves behind the glass so the ribs visibly refract it.

## Layout
- Landing: Creative = top/left, Technical = bottom/right. `--p` is the Technical share.
- Technical: full width, `clamp(14px, 3.2vw, 48px)` side padding, `auto-fit` grids (`minmax(290px,1fr)`).
- Creative: full-bleed panels. Desktop `min-height: 100dvh`; **mobile (≤ 800px) panels size to content**
  (no empty space), hero capped at ~620px.

## Interaction spec
| | Mobile | Desktop |
| --- | --- | --- |
| Start | touch anywhere (vertical-dominant) | drag the centre handle |
| Mapping | split follows finger, `--p = 0.5 − Δy/H` | `--p = 0.5 − Δx/W` |
| Commit | ≥ 20% of travel to edge, or flick > 0.5 px/ms | ≥ 28% or flick |
| Cancel | spring back, 520ms ease-out-back | same |
| Open | winner fills screen 380ms ease-in-out, then cross-fade 450ms | same |
Tunables: `SPLIT` in `src/hooks/useSplitDrag.ts`.

Process step previews: desktop shows a tilted card following the cursor (others dim); touch expands the
image inline on tap. Sections reveal on scroll (`.rv` → `.on`, 0.9s).

## Accessibility
Hidden views are `inert`. Landing halves are real `<button>`s. Arrow keys open sides, `Esc` returns.
`prefers-reduced-motion` removes tweens, drift and reveals. Body text contrast ≥ 4.5:1 on Technical;
Creative large type ≥ 3:1 (check any new gradient/text pairing).

## Do / Don't
- Do keep Creative copy to a few words per screen; let gradient and type carry it.
- Don't add stock imagery, emoji, or icon packs. Don't blend the two systems.

## Landing (v2)
**Creative half — liquid-glass mosaic.** A tiny canvas holds one pixel per tile (a quantised blue
gradient: white at the outer edge deepening toward the seam, with slow waves, per-tile jitter and a
bump around the pointer). CSS scales it with `image-rendering: pixelated`; then three layers turn
pixels into glass: (1) `backdrop-filter` masked to rounded squares, (2) an SVG rim/specular tile
(`--rim`), (3) a pointer spotlight masked to the same tiles. A soft-light sheen drifts across, plus
grain. Tile size `--tile`: 44px mobile / 64px desktop (canvas cell and mask must match).
Type: Inter Tight 500, tracking `-0.055em`; *Artist* in Instrument Serif italic with a navy→cobalt
gradient fill; hint in a frosted glass pill.

**Technical half — macrodata field (Severance).** Full-bleed canvas of digits over a teal radial
vignette (`.tbg`, behind the canvas).
| Parameter | Value |
| --- | --- |
| Cell | 44px (34px ≤ 800px) |
| Drift | ±4px, per-cell phase |
| Swell | size 11 → 37px, opacity .16 → 1 within 190px of the pointer (smoothstep, smoothed pointer) |
| Mutation | a few random characters every 180ms (digit-heavy set + `+*/=<>#%&?`) |
| Touch | no cursor → a slow ambient point drifts so it stays alive |
| Reduced motion | no drift, no mutation, no ambient |
Tunables: `ASCII_DEFAULTS` in `src/lib/asciiField.ts`.

**Split + name.** The split line is 1px (difference-blended) with a 34px glass grip; on desktop the
hit area is widened invisibly. The name is rendered twice and clipped with `clip-path` driven by
`--p`: ink on Creative, white on Technical, so it recolours exactly at the line.
Both layers are viewport-sized "curtains" anchored to their outer corner, so dragging reveals more
of them instead of rescaling.

# DESIGN.md — Dual-Persona Design System

## 1. Core Philosophy: Two Sides, One Person

Rather than blending an engineering resume and a visual arts portfolio into a diluted compromise, this system treats them as two sovereign worlds separated by a physical, tactile membrane:

1. **The Threshold (`#land`)**: Dual-polarity split screen pairing a matte obsidian studio grid + cobalt `CubicMatrixCluster` (`#13151a`) on the Creative half with ruled architectural paper (`#f4f4f1`) and a neo-brutalist Engineering Snapshot card on the Technical half, bridged by `Tarun Suthar` rendered in `mix-blend-mode: difference` (`#ffffff`).
2. **The Technical World (`#tech`)**: **Ruled-Paper Neo-Brutalism** — honest, structured, high-contrast engineering notebook aesthetics.
3. **The Creative World (`#cre`)**: **Studio Grid & Cubic Pillow-Glass** — crisp off-white architectural grid (`#f7f8fa`), 3D-beveled frosted cubic matrices, and a matte charcoal masonry gallery of sleek white glass-orb cards.

---

## 2. Typography Pairing

The system uses a deliberate **2 + 1** typographic stack loaded via Google Fonts:

| Role | Font Family | Weights | Usage |
| :--- | :--- | :--- | :--- |
| Primary Sans | `Inter Tight` | 300, 400, 500, 600, 700, 800 | Tight-tracked display headlines (`-0.06em`), Technical body copy, Creative manifesto (`300` weight) |
| Editorial Serif | `Instrument Serif` | 400 Italic | Subtle humanist counterpoint on Creative persona titles (`AI Creative *Artist*`, `Tarun *Suthar*`) |
| Monospace | `JetBrains Mono` | 400, 500, 700 | Technical labels, skill chips, dates, CGPAs (`tabular-nums`), and micro-indices |

---

## 3. Color Tokens

### Technical Side (`#tech`)
- **Paper Canvas (`--paper`)**: `#f4f4f1` with `1px` horizontal ruling every `32px` (`rgba(17, 17, 17, 0.05)`)
- **Card Surface**: `#f9faf9` / `#ffffff` with `1px solid #111111` borders and hard offset shadows (`4px 5px 0 #111111`)
- **Primary Ink (`--ink`)**: `#111111`
- **Highlight Accent (`--y`)**: `#ffc400` (divider bar, badge, name block, active buttons)
- **Hands-on Proof (`--g`)**: `#0f5c3f`
- **Active Learning / Marker (`--r`)**: `#c81e1e`

### Creative Side (`#cre`) — Studio Grid & Cubic Glass
- **Studio Canvas**: Crisp architectural off-white (`#f7f8fa`) with hairline `64px` square and `72px` vertical studio grid rules (`rgba(17, 17, 17, 0.048)`).
- **Primary Ink**: Charcoal `#141518` paired with muted grey secondary phrases (`#7c828d`), electric cobalt (`#2563eb`), emerald (`#16a34a`), and violet (`#7c3aed`) accents.
- **Gallery Stage (`#creative-work`)**: Matte charcoal `#1b1c20` masonry stage framing 9 crisp `#ffffff` `rounded-[26px]` glass-orb cards with titles, tags, and short descriptions.

---

## 4. Signature Optical & Tactile Effects

### Cubic Pillow-Glass Matrices (`.cubic-pillow` & `.orb-cubic-overlay`)
Inspired by frosted geometric glass blocks refracting luminous gradients:
- **Stepped Pillow Matrices (`CubicMatrixCluster`)**: Clusters of `8px`-radius square tiles with multi-stop specular inner bevels (`inset 1.5px 1.5px 4px rgba(255,255,255,0.85), inset -2px -2px 5px rgba(15,23,42,0.08)`) suspended above blurred radial gradient blooms (`emerald`, `cobalt`, `violet`).
- **Glass Card Orbs (`GlassCardOrb`)**: Bright radial spheres rising from the lower frame of crisp white cards, refracted through a sharp `28px × 28px` frosted square grid with a soft top white fade.

### Drag & Snap Physics
- **Split Variable (`--p`)**: Normalized `0..1` value (`0.5` at rest).
- **Commit Easing (`easeInOutCubic`)**: `380ms` smooth sweep to `0` (Creative) or `1` (Technical).
- **Abort Spring (`easeOutBack`)**: `520ms` overshoot settle back to `0.5` when released shy of the threshold (`28%` desktop / `20%` mobile) without a flick (`> 0.5 px/ms`).

---

## 5. Accessibility & Motion Safety

- `inert` is dynamically applied to inactive `.view-layer` containers so screen readers and `Tab` focus remain strictly within the visible persona.
- All interactive tiles, process rows, filter buttons, and modals use semantic `<button>` / `role="dialog"` markup with `Escape` close handlers.
- `@media (prefers-reduced-motion: reduce)` disables ambient blob drift, asterisk rotation, and view transition delays, snapping `--p` instantaneously.

export const MOSAIC_DEFAULTS = {
  desktopTileSize: 64,
  mobileTileSize: 44,
  mobileBreakpoint: 800,
  pointerRadiusTiles: 2.8,
  pointerBump: 0.24,
  quantizationSteps: 14,
} as const;

export interface MosaicGridDims {
  cols: number;
  rows: number;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function getMosaicTileSize(viewportWidth: number): number {
  return viewportWidth <= MOSAIC_DEFAULTS.mobileBreakpoint
    ? MOSAIC_DEFAULTS.mobileTileSize
    : MOSAIC_DEFAULTS.desktopTileSize;
}

export function computeMosaicGridDimensions(
  width: number,
  height: number,
  tileSize: number
): MosaicGridDims {
  if (width <= 0 || height <= 0 || tileSize <= 0) {
    return { cols: 1, rows: 1 };
  }
  return {
    cols: Math.max(1, Math.ceil(width / tileSize)),
    rows: Math.max(1, Math.ceil(height / tileSize)),
  };
}

/** Deterministic per-tile jitter in [-1, 1] from integer grid coordinates. */
export function tileJitter(col: number, row: number): number {
  const n = Math.sin(col * 127.1 + row * 311.7) * 43758.5453;
  const frac = n - Math.floor(n);
  return frac * 2 - 1;
}

/**
 * Compute normalized gradient depth t in [0, 1] for a mosaic cell.
 * 0 = luminous white at the outer edge (left on desktop, top on mobile)
 * 1 = rich deep cobalt toward the split seam (center / inner edge)
 */
export function computeMosaicTileValue(params: {
  col: number;
  row: number;
  cols: number;
  rows: number;
  isVertical: boolean;
  timeSec: number;
  pointerCol: number | null;
  pointerRow: number | null;
  reducedMotion?: boolean;
}): number {
  const {
    col,
    row,
    cols,
    rows,
    isVertical,
    timeSec,
    pointerCol,
    pointerRow,
    reducedMotion = false,
  } = params;

  // Curtain is viewport-sized (100vw x 100dvh); the center seam rests around 50%
  // of the viewport, while dragging can reveal up to 100%.
  // Ramp smoothly from pure crisp white at the outer edge (0) to rich cobalt
  // as tiles approach and cross the 50% seam.
  const u = isVertical ? (row + 0.5) / Math.max(1, rows) : (col + 0.5) / Math.max(1, cols);
  const v = isVertical ? (col + 0.5) / Math.max(1, cols) : (row + 0.5) / Math.max(1, rows);

  // Diagonal bias echoes the stepped frosted glass references (crisp white outer edge -> rich cobalt toward seam)
  const baseGrad = Math.min(1, Math.max(0, u * 1.62 + v * 0.28 - 0.16));
  const shaped = Math.pow(baseGrad, 1.18);

  const wave = reducedMotion
    ? 0
    : Math.sin(u * 6.2 - timeSec * 0.65 + v * 2.4) * 0.055 +
      Math.cos(v * 5.0 + timeSec * 0.48 - u * 1.8) * 0.038;

  const jitter = tileJitter(col, row) * 0.048;

  let bump = 0;
  if (pointerCol !== null && pointerRow !== null) {
    const dist = Math.hypot(col + 0.5 - pointerCol, row + 0.5 - pointerRow);
    if (dist < MOSAIC_DEFAULTS.pointerRadiusTiles) {
      const n = 1 - dist / MOSAIC_DEFAULTS.pointerRadiusTiles;
      const smooth = n * n * (3 - 2 * n);
      bump = smooth * MOSAIC_DEFAULTS.pointerBump;
    }
  }

  const raw = Math.max(0, Math.min(1, shaped + wave + jitter + bump));
  // Quantise slightly so neighbouring tiles retain distinct glassy stepped tonal values
  const steps = MOSAIC_DEFAULTS.quantizationSteps;
  return Math.round(raw * steps) / steps;
}

const BLUE_STOPS: ReadonlyArray<{ at: number; rgb: RgbColor }> = [
  { at: 0.0, rgb: { r: 249, g: 251, b: 255 } },  // Crisp luminous outer-edge white
  { at: 0.24, rgb: { r: 234, g: 242, b: 255 } }, // Soft cool ice
  { at: 0.48, rgb: { r: 175, g: 205, b: 255 } }, // Frosted periwinkle
  { at: 0.72, rgb: { r: 78, g: 132, b: 250 } },  // Electric liquid cobalt
  { at: 0.90, rgb: { r: 28, g: 76, b: 214 } },   // Deep sapphire
  { at: 1.0, rgb: { r: 12, g: 38, b: 128 } },    // Seam-edge midnight cobalt
];

export function sampleMosaicBlueColor(t: number): RgbColor {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(t) ? t : 0));

  for (let i = 0; i < BLUE_STOPS.length - 1; i++) {
    const a = BLUE_STOPS[i];
    const b = BLUE_STOPS[i + 1];
    if (clamped >= a.at && clamped <= b.at) {
      const span = Math.max(0.0001, b.at - a.at);
      const k = (clamped - a.at) / span;
      return {
        r: Math.round(a.rgb.r + (b.rgb.r - a.rgb.r) * k),
        g: Math.round(a.rgb.g + (b.rgb.g - a.rgb.g) * k),
        b: Math.round(a.rgb.b + (b.rgb.b - a.rgb.b) * k),
      };
    }
  }

  return BLUE_STOPS[BLUE_STOPS.length - 1].rgb;
}

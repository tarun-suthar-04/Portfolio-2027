export const ASCII_DEFAULTS = {
  desktopCellSize: 44,
  mobileCellSize: 34,
  mobileBreakpoint: 800,
  maxDriftPx: 4,
  minFontSize: 11,
  maxFontSize: 37,
  pointerRadiusPx: 190,
  minAlpha: 0.16,
  maxAlpha: 1,
  mutationIntervalMs: 180,
} as const;

export const ASCII_FIELD_CONFIG = ASCII_DEFAULTS;

// Digit-heavy macrodata set mixed with +*/=<>#%&? per DESIGN.md
const ASCII_CHARSET = '012345678901234567890123456789+*/=<>#%&?0123456789';

export interface AsciiCell {
  col: number;
  row: number;
  baseX: number;
  baseY: number;
  char: string;
  phaseX: number;
  phaseY: number;
  speedX: number;
  speedY: number;
}

export interface AsciiCellRenderState {
  x: number;
  y: number;
  fontSize: number;
  alpha: number;
  influence: number;
}

export function getAsciiCellSize(viewportWidth: number): number {
  return viewportWidth <= ASCII_FIELD_CONFIG.mobileBreakpoint
    ? ASCII_FIELD_CONFIG.mobileCellSize
    : ASCII_FIELD_CONFIG.desktopCellSize;
}

export function pickRandomAsciiChar(rng: () => number = Math.random): string {
  const index = Math.floor(rng() * ASCII_CHARSET.length);
  return ASCII_CHARSET.charAt(Math.max(0, Math.min(ASCII_CHARSET.length - 1, index)));
}

export function createAsciiGrid(
  width: number,
  height: number,
  cellSize: number,
  rng: () => number = Math.random
): AsciiCell[] {
  if (width <= 0 || height <= 0 || cellSize <= 0) return [];

  const cols = Math.ceil(width / cellSize) + 1;
  const rows = Math.ceil(height / cellSize) + 1;
  const offsetX = (width - (cols - 1) * cellSize) / 2;
  const offsetY = (height - (rows - 1) * cellSize) / 2;
  const cells: AsciiCell[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        col,
        row,
        baseX: offsetX + col * cellSize,
        baseY: offsetY + row * cellSize,
        char: pickRandomAsciiChar(rng),
        phaseX: rng() * Math.PI * 2,
        phaseY: rng() * Math.PI * 2,
        speedX: 0.00075 + rng() * 0.00055,
        speedY: 0.00075 + rng() * 0.00055,
      });
    }
  }

  return cells;
}

export function computeAsciiDrift(
  timeMs: number,
  phaseX: number,
  phaseY: number,
  speedX: number,
  speedY: number,
  maxDriftPx: number = ASCII_FIELD_CONFIG.maxDriftPx
): { dx: number; dy: number } {
  const dx = Math.sin(timeMs * speedX + phaseX) * maxDriftPx;
  const dy = Math.cos(timeMs * speedY + phaseY) * maxDriftPx;
  return { dx, dy };
}

export function computeAsciiCellState(params: {
  cell: AsciiCell;
  timeMs: number;
  pointerX: number | null;
  pointerY: number | null;
  reducedMotion?: boolean;
}): AsciiCellRenderState {
  const { cell, timeMs, pointerX, pointerY, reducedMotion = false } = params;
  const { dx, dy } = reducedMotion
    ? { dx: 0, dy: 0 }
    : computeAsciiDrift(
        timeMs,
        cell.phaseX,
        cell.phaseY,
        cell.speedX,
        cell.speedY
      );
  const x = cell.baseX + dx;
  const y = cell.baseY + dy;

  let influence = 0;
  if (pointerX !== null && pointerY !== null) {
    const dist = Math.hypot(x - pointerX, y - pointerY);
    if (dist < ASCII_FIELD_CONFIG.pointerRadiusPx) {
      const normalized = 1 - dist / ASCII_FIELD_CONFIG.pointerRadiusPx;
      // Smoothstep curve so swelling peaks cleanly around the pointer
      influence = normalized * normalized * (3 - 2 * normalized);
    }
  }

  const fontSize =
    ASCII_FIELD_CONFIG.minFontSize +
    influence * (ASCII_FIELD_CONFIG.maxFontSize - ASCII_FIELD_CONFIG.minFontSize);
  const alpha =
    ASCII_FIELD_CONFIG.minAlpha +
    influence * (ASCII_FIELD_CONFIG.maxAlpha - ASCII_FIELD_CONFIG.minAlpha);

  return { x, y, fontSize, alpha, influence };
}

/** Smoothly interpolate current pointer toward target pointer. */
export function smoothPointer(
  current: number | null,
  target: number | null,
  factor: number = 0.14
): number | null {
  if (target === null) return null;
  if (current === null) return target;
  return current + (target - current) * factor;
}

/**
 * Slow ambient drifting focal point for touch devices or idle screens
 * so the macrodata field stays subtly alive.
 */
export function computeAmbientPoint(
  width: number,
  height: number,
  timeMs: number,
  isVertical: boolean
): { x: number; y: number } {
  const t = timeMs * 0.00032;
  if (isVertical) {
    // Float in the open teal space between the center split name and bottom Technical copy
    return {
      x: width * (0.56 + 0.24 * Math.sin(t * 1.15)),
      y: height * (0.64 + 0.055 * Math.cos(t * 0.88)),
    };
  }
  // Float in the open upper-middle area of the right (Technical) half on desktop
  return {
    x: width * (0.76 + 0.13 * Math.sin(t * 0.95)),
    y: height * (0.42 + 0.2 * Math.cos(t * 1.12)),
  };
}

/**
 * Mutate a small random subset of cells in place (used every 180ms).
 * Returns the number of mutated cells.
 */
export function mutateRandomAsciiCells(
  cells: AsciiCell[],
  count?: number,
  rng: () => number = Math.random
): number {
  if (cells.length === 0) return 0;
  const targetCount =
    count ?? Math.max(2, Math.min(10, Math.round(cells.length * 0.025)));

  for (let i = 0; i < targetCount; i++) {
    const idx = Math.floor(rng() * cells.length);
    const cell = cells[idx];
    if (cell) {
      cell.char = pickRandomAsciiChar(rng);
    }
  }

  return targetCount;
}

export interface AsciiCellColors {
  textStyle: string;
  highlightBg: string | null;
  highlightBorder: string | null;
}

/**
 * Resolve Technical-section-matched colors for an ASCII macrodata cell:
 * - Resting: subtle drafting ink (#111111) on warm ruled paper (#f4f4f1)
 * - Low/mid swell: deepens through forest-ink (#0f5c3f) toward crisp ink (#111111)
 * - High swell: adds signal-yellow (#ffc400) highlighter tile echoing #tech accents
 */
export function computeAsciiCellColors(influence: number, alpha: number): AsciiCellColors {
  const inf = Math.max(0, Math.min(1, Number.isFinite(influence) ? influence : 0));
  const a = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : ASCII_FIELD_CONFIG.minAlpha));

  if (inf <= 0.005) {
    return {
      textStyle: `rgba(17, 17, 17, ${a.toFixed(3)})`,
      highlightBg: null,
      highlightBorder: null,
    };
  }

  // Blend from forest-ink (#0f5c3f) at mid swell to stark ink (#111111) at peak swell
  const inkBlend = Math.min(1, inf * 1.35);
  const r = Math.round(15 + inkBlend * (17 - 15));
  const g = Math.round(92 + inkBlend * (17 - 92));
  const b = Math.round(63 + inkBlend * (17 - 63));

  let highlightBg: string | null = null;
  let highlightBorder: string | null = null;

  if (inf >= 0.45) {
    const strength = (inf - 0.45) / 0.55;
    const bgAlpha = Math.min(0.88, 0.24 + strength * 0.64);
    highlightBg = `rgba(255, 196, 0, ${bgAlpha.toFixed(2)})`;
    if (inf >= 0.68) {
      const borderAlpha = Math.min(0.85, ((inf - 0.68) / 0.32) * 0.85);
      highlightBorder = `rgba(17, 17, 17, ${borderAlpha.toFixed(2)})`;
    }
  }

  return {
    textStyle: `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`,
    highlightBg,
    highlightBorder,
  };
}


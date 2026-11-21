export const ASCII_FIELD_CONFIG = {
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

// Digits weighted heavily like macrodata-refinement grids, mixed with crisp ASCII glyphs
const ASCII_CHARSET = '012345678901234567890123456789+-=*:./#%0123456789';

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
}): AsciiCellRenderState {
  const { cell, timeMs, pointerX, pointerY } = params;
  const { dx, dy } = computeAsciiDrift(
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
      // Smooth ease curve so swelling peaks warmly right around the cursor
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

export interface CardRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface MagneticOffset {
  x: number;
  y: number;
}

/**
 * Computes a subtle magnetic translation offset in pixels for a pointer position
 * within a card's bounding rectangle. Clamps normalized coordinates to [-1, 1].
 */
export function calculateMagneticOffset(
  clientX: number,
  clientY: number,
  rect: CardRect,
  maxShiftPx = 7
): MagneticOffset {
  if (
    !Number.isFinite(clientX) ||
    !Number.isFinite(clientY) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height) ||
    rect.width <= 0 ||
    rect.height <= 0 ||
    !Number.isFinite(maxShiftPx) ||
    maxShiftPx <= 0
  ) {
    return { x: 0, y: 0 };
  }

  const rawNormX = ((clientX - rect.left) / rect.width - 0.5) * 2;
  const rawNormY = ((clientY - rect.top) / rect.height - 0.5) * 2;

  const normX = Math.max(-1, Math.min(1, rawNormX));
  const normY = Math.max(-1, Math.min(1, rawNormY));

  const x = Math.round(normX * maxShiftPx * 100) / 100;
  const y = Math.round(normY * maxShiftPx * 100) / 100;

  return {
    x: Object.is(x, -0) ? 0 : x,
    y: Object.is(y, -0) ? 0 : y,
  };
}

export interface PreviewClampInput {
  relX: number;
  relY: number;
  containerWidth: number;
  containerHeight: number;
  cardWidth?: number;
  cardHeight?: number;
  padding?: number;
}

/**
 * Computes clamped (x, y) coordinates inside a section container for a floating
 * cursor-following preview card, flipping below the cursor when near the top edge.
 */
export function clampFloatingPreview({
  relX,
  relY,
  containerWidth,
  containerHeight,
  cardWidth = 276,
  cardHeight = 224,
  padding = 16,
}: PreviewClampInput): MagneticOffset {
  if (
    !Number.isFinite(relX) ||
    !Number.isFinite(relY) ||
    !Number.isFinite(containerWidth) ||
    !Number.isFinite(containerHeight) ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    return { x: padding, y: padding };
  }

  const maxX = Math.max(padding, containerWidth - cardWidth - padding);
  const maxY = Math.max(padding, containerHeight - cardHeight - padding);

  const rawX = relX + 20;
  const aboveY = relY - cardHeight - 20;
  const rawY = aboveY >= padding ? aboveY : relY + 26;

  return {
    x: Math.round(Math.max(padding, Math.min(maxX, rawX))),
    y: Math.round(Math.max(padding, Math.min(maxY, rawY))),
  };
}


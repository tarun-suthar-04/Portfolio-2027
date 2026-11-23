export type ViewMode = 'land' | 'tech' | 'cre' | 'gallery' | 'admin';

export const SPLIT_CONFIG = {
  thresholdVertical: 0.2,
  thresholdHorizontal: 0.28,
  flickVelocity: 0.5, // px/ms
  techReturnThreshold: 240,
  creReturnThreshold: 180,
} as const;

/** Clamp normalized split position between 0 (full Creative) and 1 (full Technical). */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

/** Cubic ease-in-out curve for committing to a persona view. */
export function easeInOutCubic(t: number): number {
  const k = Math.max(0, Math.min(1, t));
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
}

/** Springy ease-out-back curve when snapping the split divider back to center. */
export function easeOutBack(t: number): number {
  const k = Math.max(0, Math.min(1, t));
  return 1 + 2.4 * Math.pow(k - 1, 3) + 1.4 * Math.pow(k - 1, 2);
}

export interface PointerSample {
  time: number;
  coord: number;
}

/** Compute pointer velocity in px/ms from buffered recent samples. */
export function computeVelocity(samples: PointerSample[]): number {
  if (samples.length < 2) return 0;
  const first = samples[0];
  const last = samples[samples.length - 1];
  const dt = Math.max(1, last.time - first.time);
  return (last.coord - first.coord) / dt;
}

export interface SwipeResolution {
  action: 'open' | 'snapBack';
  targetView?: 'tech' | 'cre';
}

/**
 * Determine whether a drag/swipe gesture should open Technical, open Creative,
 * or snap back to the balanced 50/50 split.
 */
export function resolveSwipeOutcome(params: {
  progress: number;
  velocity: number;
  isVertical: boolean;
}): SwipeResolution {
  const { progress, velocity, isVertical } = params;
  const offset = Math.abs(progress - 0.5);
  const isFlick = Math.abs(velocity) > SPLIT_CONFIG.flickVelocity && offset > 0.02;
  const threshold = isVertical
    ? SPLIT_CONFIG.thresholdVertical
    : SPLIT_CONFIG.thresholdHorizontal;

  if (isFlick) {
    return {
      action: 'open',
      targetView: velocity < 0 ? 'tech' : 'cre',
    };
  }

  if (offset / 0.5 > threshold) {
    return {
      action: 'open',
      targetView: progress > 0.5 ? 'tech' : 'cre',
    };
  }

  return { action: 'snapBack' };
}

/**
 * Compute normalized overscroll return progress (0 to 1) when scrolling past
 * the boundary of Technical (bottom) or Creative (top).
 */
export function calculatePullProgress(accumulated: number, threshold: number): number {
  if (threshold <= 0) return 0;
  return Math.max(0, Math.min(1, accumulated / threshold));
}

/**
 * Parse initial ViewMode from URL hash or search query parameters.
 * Supports `#tech`, `#creative`, `#cre`, `?view=tech`, `?view=cre`.
 */
export function parseViewFromLocation(hash: string, search: string): ViewMode {
  const normalizedHash = hash.replace(/^#/, '').trim().toLowerCase();
  if (normalizedHash === 'admin' || normalizedHash.startsWith('admin-')) {
    return 'admin';
  }
  if (normalizedHash === 'gallery') return 'gallery';
  if (
    normalizedHash === 'tech' ||
    normalizedHash === 'technical' ||
    normalizedHash.startsWith('tech-') ||
    normalizedHash.startsWith('tech/')
  ) {
    return 'tech';
  }
  if (
    normalizedHash === 'cre' ||
    normalizedHash === 'creative' ||
    normalizedHash.startsWith('creative-')
  ) {
    return 'cre';
  }

  const params = new URLSearchParams(search);
  const viewParam = params.get('view')?.trim().toLowerCase();
  if (viewParam === 'admin') return 'admin';
  if (viewParam === 'gallery') return 'gallery';
  if (viewParam === 'tech' || viewParam === 'technical') return 'tech';
  if (viewParam === 'cre' || viewParam === 'creative') return 'cre';

  return 'land';
}

/** Map a ViewMode to its canonical URL hash fragment. */
export function viewToHash(view: ViewMode): string {
  if (view === 'admin') return '#admin';
  if (view === 'gallery') return '#gallery';
  if (view === 'tech') return '#tech';
  if (view === 'cre') return '#creative';
  return '';
}

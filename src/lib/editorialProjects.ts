import type { ProjectItem } from '../data/portfolio';

export type EditorialLayoutSide = 'media-left' | 'media-right';

export interface ProjectViewportMetric {
  id: string;
  top: number;
  bottom: number;
  isIntersecting: boolean;
}
export interface ClampedPoint {
  x: number;
  y: number;
}

export type ProjectStripFrameKind =
  | 'screen-primary'
  | 'screen-detail'
  | 'architecture-flow'
  | 'layers-blueprint'
  | 'build-spec';

export interface ProjectStripFrame {
  id: string;
  index: string;
  tag: string;
  title: string;
  caption: string;
  kind: ProjectStripFrameKind;
  imageSrc?: string;
  imageAlt?: string;
  fallbackGradient: string;
  flowSteps?: string[];
  layers?: { name: string; role: string }[];
  stack?: string[];
  note?: string;
  fileName: string;
}

/** Format 0-based project index as editorial two-digit marker ("01", "02", ...). */
export function formatProjectIndex(index: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(index) ? index : 0));
  return String(safe + 1).padStart(2, '0');
}

/** Alternate editorial spread orientation cleanly without chaotic randomness. */
export function getEditorialLayoutSide(index: number): EditorialLayoutSide {
  const safe = Math.max(0, Math.floor(Number.isFinite(index) ? index : 0));
  return safe % 2 === 0 ? 'media-left' : 'media-right';
}

/** Return true if a project supports active project hover states. */
export function isProjectInteractive(
  project: Pick<ProjectItem, 'comingSoon' | 'disabled'>
): boolean {
  return !project.comingSoon && !project.disabled;
}

/** Linear interpolation helper used for smooth 60fps cursor and strip scrub damping. */
export function lerpValue(current: number, target: number, factor: number): number {
  const clampedFactor = Math.max(0, Math.min(1, Number.isFinite(factor) ? factor : 0));
  return current + (target - current) * clampedFactor;
}

/**
 * Map a normalized horizontal pointer ratio [0..1] across a hovered project block
 * into a clamped negative horizontal translateX offset for its media strip.
 */
export function computeStripPanOffset(params: {
  pointerRatio: number;
  containerWidth: number;
  trackWidth: number;
  edgeDeadZone?: number;
}): number {
  const { pointerRatio, containerWidth, trackWidth, edgeDeadZone = 0.1 } = params;
  if (
    !Number.isFinite(pointerRatio) ||
    !Number.isFinite(containerWidth) ||
    !Number.isFinite(trackWidth) ||
    containerWidth <= 0 ||
    trackWidth <= containerWidth
  ) {
    return 0;
  }

  const maxOverflow = trackWidth - containerWidth;
  const dead = Math.max(0, Math.min(0.4, edgeDeadZone));
  const clampedRatio = Math.max(0, Math.min(1, pointerRatio));

  let effectiveProgress: number;
  if (clampedRatio <= dead) {
    effectiveProgress = 0;
  } else if (clampedRatio >= 1 - dead) {
    effectiveProgress = 1;
  } else {
    effectiveProgress = (clampedRatio - dead) / (1 - dead * 2);
  }

  const magnitude = Math.round(effectiveProgress * maxOverflow * 100) / 100;
  return magnitude === 0 ? 0 : -magnitude;
}

/**
 * Deterministically build horizontal preview strip frames grounded strictly
 * in each project's real preview asset, architecture layers, data flow, and highlights.
 */
export function buildProjectStripFrames(project: ProjectItem): ProjectStripFrame[] {
  const flowSteps = project.architecture.dataFlow
    .split(/→|->/)
    .map((step) => step.trim())
    .filter(Boolean);

  const primaryNote =
    project.architecture.engineeringNotes[0] ??
    project.highlights[0] ??
    project.summary;

  return [
    {
      id: `${project.id}-screen-primary`,
      index: '01',
      tag: 'UI VIEW',
      title: `${project.title} Interface`,
      caption: project.platform,
      kind: 'screen-primary',
      imageSrc: project.previewImage,
      imageAlt: project.previewAlt,
      fallbackGradient: project.fallbackGradient,
      fileName: project.title,
    },
    {
      id: `${project.id}-architecture-flow`,
      index: '02',
      tag: 'DATA FLOW',
      title: 'System Pipeline',
      caption: project.platform,
      kind: 'architecture-flow',
      fallbackGradient: project.fallbackGradient,
      flowSteps: flowSteps.length > 0 ? flowSteps : [project.title, project.platform],
      fileName: project.title,
    },
    {
      id: `${project.id}-screen-detail`,
      index: '03',
      tag: 'DETAIL CROP',
      title: 'Workspace Focus',
      caption: project.demonstrates,
      kind: 'screen-detail',
      imageSrc: project.previewImage,
      imageAlt: `${project.title} workspace detail`,
      fallbackGradient: project.fallbackGradient,
      fileName: project.title,
    },
    {
      id: `${project.id}-layers-blueprint`,
      index: '04',
      tag: 'ARCHITECTURE',
      title: 'Component Layers',
      caption: `${project.architecture.layers.length} core modules`,
      kind: 'layers-blueprint',
      fallbackGradient: project.fallbackGradient,
      layers: project.architecture.layers,
      fileName: project.title,
    },
    {
      id: `${project.id}-build-spec`,
      index: '05',
      tag: 'BUILD SPEC',
      title: `${project.title} details`,
      caption: project.subtitle,
      kind: 'build-spec',
      fallbackGradient: project.fallbackGradient,
      stack: project.stack,
      note: primaryNote,
      fileName: project.title,
    },
  ];
}

/**
 * Determine which project is currently focal inside a scroll container so the
 * "Jump To Project" navigation indicator stays accurately synced on scroll.
 */
export function resolveActiveProjectId(
  metrics: readonly ProjectViewportMetric[],
  focalY: number
): string | null {
  if (metrics.length === 0) return null;

  // Prefer the project whose vertical bounds straddle the focal line
  for (const m of metrics) {
    if (m.top <= focalY && m.bottom >= focalY) {
      return m.id;
    }
  }

  // Otherwise pick the visible or nearest project to the focal line
  let bestId = metrics[0].id;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const m of metrics) {
    const center = (m.top + m.bottom) / 2;
    const dist = Math.abs(center - focalY);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = m.id;
    }
  }

  return bestId;
}

/** Clamp local pointer coordinates inside a media container with safe edge padding. */
export function clampCursorPoint(
  localX: number,
  localY: number,
  width: number,
  height: number,
  padX: number = 56,
  padY: number = 22
): ClampedPoint {
  if (width <= 0 || height <= 0) {
    return { x: 0, y: 0 };
  }
  const safePadX = Math.min(padX, width / 2);
  const safePadY = Math.min(padY, height / 2);
  return {
    x: Math.max(safePadX, Math.min(width - safePadX, localX)),
    y: Math.max(safePadY, Math.min(height - safePadY, localY)),
  };
}

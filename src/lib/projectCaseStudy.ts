import type { ProjectCaseStudy, ProjectItem } from '../data/portfolio';

const PROJECT_HASH_PREFIX = 'tech/project/';

/**
 * Extract a project ID from a hash fragment such as `#tech/project/order-analyzer`.
 * Returns null if the hash does not target an individual project detail route.
 */
export function parseProjectIdFromHash(hash: string): string | null {
  const normalized = hash.replace(/^#/, '').trim();
  const lower = normalized.toLowerCase();
  if (!lower.startsWith(PROJECT_HASH_PREFIX)) return null;
  const rawId = normalized.slice(PROJECT_HASH_PREFIX.length).split(/[/?#]/)[0]?.trim();
  if (!rawId) return null;
  try {
    return decodeURIComponent(rawId);
  } catch {
    return rawId;
  }
}

/** Build the canonical hash fragment for an individual project detail page. */
export function buildProjectHash(projectId: string): string {
  const cleanId = projectId.trim();
  return cleanId ? `#${PROJECT_HASH_PREFIX}${encodeURIComponent(cleanId)}` : '#tech';
}

export interface AdjacentProjectsResult {
  index: number;
  total: number;
  prev: ProjectItem | null;
  next: ProjectItem | null;
}

/** Resolve previous and next projects for seamless case-study footer navigation. */
export function getAdjacentProjects(
  projects: readonly ProjectItem[],
  currentId: string
): AdjacentProjectsResult {
  const total = projects.length;
  const index = projects.findIndex((item) => item.id === currentId);
  if (index === -1 || total === 0) {
    return { index: -1, total, prev: null, next: null };
  }
  const prev = total > 1 ? projects[(index - 1 + total) % total] : null;
  const next = total > 1 ? projects[(index + 1) % total] : null;
  return { index, total, prev, next };
}

/**
 * Resolve verified case-study storytelling sections for any project.
 * Uses authored project-specific content when available, and deterministically
 * derives factual, non-fabricated sections for newly added Admin projects.
 */
export function resolveProjectCaseStudy(project: ProjectItem): ProjectCaseStudy {
  if (project.caseStudy) {
    return project.caseStudy;
  }

  const primaryStack = project.stack.slice(0, 3).join(', ') || project.platform;
  const firstLayer = project.architecture.layers[0];
  const deliveredPoints =
    project.highlights.length > 0
      ? project.highlights
      : project.architecture.engineeringNotes.length > 0
        ? project.architecture.engineeringNotes
        : [`Structured ${project.platform} implementation covering ${project.demonstrates}.`];

  return {
    challengeHeading: `Structuring ${project.title} for dependable ${project.fileTypeLabel.toLowerCase()} execution.`,
    challengeBody: `${project.summary} Translating this workflow into a reliable ${project.platform} build required clear data boundaries, predictable state handling, and maintainable implementation across ${primaryStack}.`,
    solutionHeading: `Layered ${primaryStack} architecture built around clear data flow.`,
    solutionBody: firstLayer
      ? `The application separates ${firstLayer.name.toLowerCase()} responsibilities from underlying storage and processing: ${project.architecture.dataFlow}. Each module stays focused on a single operational task.`
      : `The application follows an explicit data pipeline (${project.architecture.dataFlow}) so core operations remain straightforward to verify, extend, and debug.`,
    overviewHeading: 'The project.',
    overviewBody: [
      project.summary,
      `Focused on ${project.demonstrates}, ${project.title} brings together ${project.stack.join(', ')} in a practical ${project.fileTypeLabel.toLowerCase()} package (${project.fileName}).`,
    ],
    scopeLabel: project.platform,
    deliverableLabel: `${project.fileTypeLabel} · ${project.fileName}`,
    outcomeHeading: 'The outcome.',
    outcomeSummary: `A working ${project.fileTypeLabel.toLowerCase()} implementation demonstrating ${project.demonstrates.toLowerCase()} with inspectable architecture and clean source structure.`,
    deliveredPoints,
  };
}

export interface FloatingThumbnailPlacement {
  x: number;
  y: number;
  rotate: number;
}

/**
 * Compute subtle, restrained cursor-tracking placement for the floating project
 * thumbnail above a hovered title, clamped cleanly within the title container.
 */
export function computeFloatingThumbnailPlacement(params: {
  pointerX: number;
  pointerY: number;
  containerWidth: number;
  containerHeight: number;
  thumbWidth: number;
}): FloatingThumbnailPlacement {
  const { pointerX, pointerY, containerWidth, containerHeight, thumbWidth } = params;
  if (containerWidth <= 0 || containerHeight <= 0) {
    return { x: 0, y: -12, rotate: 0 };
  }

  const safeHalf = thumbWidth / 2;
  const rawCenterX = pointerX;
  const minCenterX = Math.min(safeHalf, containerWidth / 2);
  const maxCenterX = Math.max(containerWidth - safeHalf, containerWidth / 2);
  const clampedCenterX = Math.max(minCenterX, Math.min(maxCenterX, rawCenterX));

  // Subtle horizontal + vertical micro-shift relative to pointer without obscuring title
  const normalizedX = Math.max(-1, Math.min(1, (pointerX / containerWidth - 0.5) * 2));
  const normalizedY = Math.max(-1, Math.min(1, (pointerY / containerHeight - 0.5) * 2));

  return {
    x: Math.round(clampedCenterX - safeHalf),
    y: Math.round(-14 + normalizedY * 6),
    rotate: Number((normalizedX * 1.8).toFixed(2)),
  };
}

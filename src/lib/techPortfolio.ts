import { ProjectFileExt, ProjectItem, TechLogoItem } from '../data/portfolio';

export type ProjectFileFilter = 'all' | ProjectFileExt;

export interface ProjectFileCounts {
  all: number;
  '.apk': number;
  '.jar': number;
  '.py': number;
}

export type ProjectPreviewMode = 'external' | 'interactive';

export function filterProjectsByFileType(
  projects: readonly ProjectItem[],
  filter: ProjectFileFilter
): ProjectItem[] {
  if (filter === 'all') {
    return [...projects];
  }
  return projects.filter((project) => project.fileExt === filter);
}

export function getProjectFileCounts(projects: readonly ProjectItem[]): ProjectFileCounts {
  const counts: ProjectFileCounts = {
    all: projects.length,
    '.apk': 0,
    '.jar': 0,
    '.py': 0,
  };

  for (const project of projects) {
    counts[project.fileExt] += 1;
  }

  return counts;
}

export function resolveProjectPreviewMode(project: Pick<ProjectItem, 'liveUrl'>): ProjectPreviewMode {
  if (typeof project.liveUrl === 'string' && /^https?:\/\//i.test(project.liveUrl.trim())) {
    return 'external';
  }
  return 'interactive';
}

export function validateMarqueeLogos(items: readonly TechLogoItem[]): boolean {
  if (items.length < 6) return false;
  return items.every((item) => {
    const trimmed = item.name.trim();
    // Enforce concise single-word labels (no long prose phrases)
    return trimmed.length > 0 && trimmed.length <= 12 && !trimmed.includes(' ');
  });
}

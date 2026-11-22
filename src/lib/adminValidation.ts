import type {
  CreativeCategory,
  GlassTheme,
  MasonrySize,
  ProjectFileExt,
} from '../data/portfolio';

export const BOOTSTRAP_ADMIN_EMAIL = 'ahirwalshiwani9@gmail.com';

export const BOOTSTRAP_ADMIN_EMAILS = [
  'ahirwalshiwani9@gmail.com',
  'cdstarun2004@gmail.com',
  'cdstarun1837@gmail.com',
] as const;

export function isBootstrapAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return BOOTSTRAP_ADMIN_EMAILS.some((allowed) => allowed === normalized);
}

export const ALLOWED_FILE_EXTS: readonly ProjectFileExt[] = ['.apk', '.jar', '.py'];
export const ALLOWED_CREATIVE_CATEGORIES: readonly CreativeCategory[] = [
  'Direction',
  'Motion & Frame',
  'Concept',
];
export const ALLOWED_MASONRY_SIZES: readonly MasonrySize[] = ['tall', 'medium', 'compact'];
export const ALLOWED_GLASS_THEMES: readonly GlassTheme[] = [
  'sunset',
  'emerald',
  'violet',
  'cobalt',
  'amber',
  'orchid',
];
export const ALLOWED_ADMIN_ROLES = ['super_admin', 'admin'] as const;
export type AdminRole = (typeof ALLOWED_ADMIN_ROLES)[number];

export const ALLOWED_AUDIT_ACTIONS = [
  'create',
  'update',
  'delete',
  'seed',
  'role_change',
  'publish_toggle',
] as const;
export type AuditAction = (typeof ALLOWED_AUDIT_ACTIONS)[number];

export const ALLOWED_AUDIT_RESOURCES = [
  'site_config',
  'projects',
  'creative_works',
  'admins',
  'project_inquiries',
] as const;
export type AuditResourceType = (typeof ALLOWED_AUDIT_RESOURCES)[number];

export interface ValidationResult<T> {
  ok: boolean;
  errors: string[];
  data?: T;
}

export interface SiteConfigInput {
  firstName: string;
  lastName: string;
  fullName: string;
  location: string;
  contactEmail: string;
  techRole: string;
  techBio: string;
  creativeRole: string;
  creativeHeadline: string;
  creativeSubline: string;
  creativeYears: string;
  linkedinUrl: string;
  githubUrl: string;
  instagramUrl: string;
  fiverrUrl: string;
}

export interface ProjectPayloadInput {
  id: string;
  title: string;
  fileName: string;
  fileExt: ProjectFileExt;
  fileTypeLabel: string;
  fileAccent: string;
  platform: string;
  subtitle: string;
  summary: string;
  highlights: string[];
  stack: string[];
  demonstrates: string;
  previewImage: string;
  previewAlt: string;
  fallbackGradient: string;
  githubUrl: string;
  liveUrl?: string;
  published: boolean;
  sortOrder: number;
}

export interface CreativeWorkPayloadInput {
  id: string;
  index: string;
  title: string;
  handle: string;
  category: CreativeCategory;
  subtitle: string;
  shortDescription: string;
  masonrySize: MasonrySize;
  theme: GlassTheme;
  medium: string;
  year: string;
  brief: string;
  promptApproach: string;
  palette: string[];
  featureImage?: string;
  published: boolean;
  sortOrder: number;
}

export interface AdminUserPayloadInput {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  active: boolean;
}

const DOC_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;
const FILE_NAME_RE = /^[a-zA-Z0-9._-]{3,64}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
const SAFE_GRADIENT_RE = /^linear-gradient\([a-zA-Z0-9,#%.\s-]+\)$/;
const LOCAL_SRC_IMG_RE = /^\/src\/assets\/images\/[a-zA-Z0-9._-]+$/;
const LOCAL_PUBLIC_ASSET_RE = /^\/assets\/[a-zA-Z0-9._/-]+$/;

export function isValidDocId(id: string): boolean {
  return typeof id === 'string' && DOC_ID_RE.test(id);
}

export function isValidEmail(email: string): boolean {
  return (
    typeof email === 'string' &&
    email.length >= 5 &&
    email.length <= 120 &&
    EMAIL_RE.test(email)
  );
}

export function isSafeHttpsUrl(url: string): boolean {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 12 || trimmed.length > 300) return false;
  if (!trimmed.startsWith('https://')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function isSafeImagePath(path: string): boolean {
  if (typeof path !== 'string') return false;
  const trimmed = path.trim();
  if (trimmed.length < 1 || trimmed.length > 400) return false;
  if (trimmed.includes('..')) return false;
  if (trimmed.startsWith('https://')) {
    return isSafeHttpsUrl(trimmed);
  }
  return LOCAL_SRC_IMG_RE.test(trimmed) || LOCAL_PUBLIC_ASSET_RE.test(trimmed);
}

const SAFE_RASTER_DATA_HEADERS = new Set([
  'data:image/webp',
  'data:image/jpeg',
  'data:image/png',
]);

export function isSafeCreativeFeatureImage(value: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed === '') return true;
  if (trimmed.startsWith('data:')) {
    if (trimmed.length < 30 || trimmed.length > 350_000) return false;
    const parts = trimmed.split(';base64,');
    if (parts.length !== 2) return false;
    if (!SAFE_RASTER_DATA_HEADERS.has(parts[0])) return false;
    return /^[A-Za-z0-9+/=]+$/.test(parts[1]);
  }
  return isSafeImagePath(trimmed);
}

export function isSafeHexColor(value: string): boolean {
  return typeof value === 'string' && value.length >= 4 && value.length <= 16 && HEX_COLOR_RE.test(value);
}

export function isSafeGradient(value: string): boolean {
  return (
    typeof value === 'string' &&
    value.length >= 10 &&
    value.length <= 160 &&
    SAFE_GRADIENT_RE.test(value)
  );
}

export function slugifyDocId(input: string, fallbackPrefix = 'item'): string {
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  if (cleaned.length >= 2) return cleaned;
  return `${fallbackPrefix}-${Date.now().toString(36)}`;
}

function checkString(
  errors: string[],
  label: string,
  value: string,
  min: number,
  max: number
): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (trimmed.length < min || trimmed.length > max) {
    errors.push(`${label} must be between ${min} and ${max} characters.`);
  }
  return trimmed;
}

export function validateSiteConfig(input: SiteConfigInput): ValidationResult<SiteConfigInput> {
  const errors: string[] = [];
  const firstName = checkString(errors, 'First name', input.firstName, 1, 40);
  const lastName = checkString(errors, 'Last name', input.lastName, 1, 40);
  const fullName = checkString(errors, 'Full name', input.fullName, 2, 80);
  const location = checkString(errors, 'Location', input.location, 2, 80);
  const contactEmail = (input.contactEmail ?? '').trim();
  if (!isValidEmail(contactEmail)) {
    errors.push('Contact email must be a valid email address (5–120 chars).');
  }
  const techRole = checkString(errors, 'Technical role', input.techRole, 2, 120);
  const techBio = checkString(errors, 'Technical bio', input.techBio, 10, 600);
  const creativeRole = checkString(errors, 'Creative role', input.creativeRole, 2, 120);
  const creativeHeadline = checkString(errors, 'Creative headline', input.creativeHeadline, 2, 100);
  const creativeSubline = checkString(errors, 'Creative subline', input.creativeSubline, 2, 120);
  const creativeYears = checkString(errors, 'Creative years', input.creativeYears, 4, 24);

  const linkedinUrl = (input.linkedinUrl ?? '').trim();
  const githubUrl = (input.githubUrl ?? '').trim();
  const instagramUrl = (input.instagramUrl ?? '').trim();
  const fiverrUrl = (input.fiverrUrl ?? '').trim();

  if (!isSafeHttpsUrl(linkedinUrl)) errors.push('LinkedIn URL must start with https://.');
  if (!isSafeHttpsUrl(githubUrl)) errors.push('GitHub URL must start with https://.');
  if (!isSafeHttpsUrl(instagramUrl)) errors.push('Instagram URL must start with https://.');
  if (!isSafeHttpsUrl(fiverrUrl)) errors.push('Fiverr URL must start with https://.');

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    errors: [],
    data: {
      firstName,
      lastName,
      fullName,
      location,
      contactEmail,
      techRole,
      techBio,
      creativeRole,
      creativeHeadline,
      creativeSubline,
      creativeYears,
      linkedinUrl,
      githubUrl,
      instagramUrl,
      fiverrUrl,
    },
  };
}

export function validateProjectPayload(
  input: ProjectPayloadInput
): ValidationResult<ProjectPayloadInput> {
  const errors: string[] = [];
  const id = (input.id ?? '').trim();
  if (!isValidDocId(id)) {
    errors.push('Project ID must be 1–128 alphanumeric, dash, or underscore characters.');
  }

  const title = checkString(errors, 'Project title', input.title, 2, 80);
  const fileName = (input.fileName ?? '').trim();
  if (!FILE_NAME_RE.test(fileName)) {
    errors.push('File name must be 3–64 safe characters (letters, numbers, dot, dash, underscore).');
  }

  if (!ALLOWED_FILE_EXTS.includes(input.fileExt)) {
    errors.push('File extension must be one of .apk, .jar, or .py.');
  }

  const fileTypeLabel = checkString(errors, 'File type label', input.fileTypeLabel, 2, 40);
  const fileAccent = (input.fileAccent ?? '').trim();
  if (!isSafeHexColor(fileAccent)) {
    errors.push('Accent color must be a valid hex code (e.g. #0f5c3f).');
  }

  const platform = checkString(errors, 'Platform', input.platform, 2, 80);
  const subtitle = checkString(errors, 'Subtitle', input.subtitle, 2, 80);
  const summary = checkString(errors, 'Summary', input.summary, 10, 500);

  const highlights = (Array.isArray(input.highlights) ? input.highlights : [])
    .map((h) => (typeof h === 'string' ? h.trim() : ''))
    .filter(Boolean);
  if (highlights.length < 1 || highlights.length > 8) {
    errors.push('Highlights must include between 1 and 8 items.');
  } else if (highlights.some((h) => h.length < 2 || h.length > 160)) {
    errors.push('Each highlight must be between 2 and 160 characters.');
  }

  const stack = (Array.isArray(input.stack) ? input.stack : [])
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);
  if (stack.length < 1 || stack.length > 12) {
    errors.push('Tech stack must include between 1 and 12 tags.');
  } else if (stack.some((s) => s.length < 1 || s.length > 40)) {
    errors.push('Each stack tag must be between 1 and 40 characters.');
  }

  const demonstrates = checkString(errors, 'Demonstrates', input.demonstrates, 2, 160);
  const previewImage = (input.previewImage ?? '').trim();
  if (!isSafeImagePath(previewImage)) {
    errors.push('Preview image must be a valid https:// URL or local /src/assets/images/ path.');
  }

  const previewAlt = checkString(errors, 'Preview alt text', input.previewAlt, 2, 220);
  const fallbackGradient = (input.fallbackGradient ?? '').trim();
  if (!isSafeGradient(fallbackGradient)) {
    errors.push('Fallback gradient must be a clean CSS linear-gradient(...) value.');
  }

  const githubUrl = (input.githubUrl ?? '').trim();
  if (!isSafeHttpsUrl(githubUrl)) {
    errors.push('GitHub URL must be a valid https:// link.');
  }

  const liveUrl = (input.liveUrl ?? '').trim();
  if (liveUrl !== '' && !isSafeHttpsUrl(liveUrl)) {
    errors.push('Live preview URL must be empty or a valid https:// link.');
  }

  const sortOrder = Number(input.sortOrder);
  if (!Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    errors.push('Sort order must be a number between 0 and 9999.');
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    errors: [],
    data: {
      id,
      title,
      fileName,
      fileExt: input.fileExt,
      fileTypeLabel,
      fileAccent,
      platform,
      subtitle,
      summary,
      highlights,
      stack,
      demonstrates,
      previewImage,
      previewAlt,
      fallbackGradient,
      githubUrl,
      liveUrl,
      published: Boolean(input.published),
      sortOrder: Math.round(sortOrder),
    },
  };
}

export function validateCreativeWorkPayload(
  input: CreativeWorkPayloadInput
): ValidationResult<CreativeWorkPayloadInput> {
  const errors: string[] = [];
  const id = (input.id ?? '').trim();
  if (!isValidDocId(id)) {
    errors.push('Work ID must be 1–128 alphanumeric, dash, or underscore characters.');
  }

  const index = checkString(errors, 'Index', input.index, 1, 6);
  const title = checkString(errors, 'Title', input.title, 2, 60);
  const handle = checkString(errors, 'Handle', input.handle, 2, 60);

  if (!ALLOWED_CREATIVE_CATEGORIES.includes(input.category)) {
    errors.push('Category must be Direction, Motion & Frame, or Concept.');
  }

  const subtitle = checkString(errors, 'Subtitle', input.subtitle, 2, 100);
  const shortDescription = checkString(errors, 'Short description', input.shortDescription, 10, 320);

  if (!ALLOWED_MASONRY_SIZES.includes(input.masonrySize)) {
    errors.push('Card size must be tall, medium, or compact.');
  }
  if (!ALLOWED_GLASS_THEMES.includes(input.theme)) {
    errors.push('Theme must be sunset, emerald, violet, cobalt, amber, or orchid.');
  }

  const medium = checkString(errors, 'Medium', input.medium, 2, 100);
  const year = checkString(errors, 'Year', input.year, 4, 20);
  const brief = checkString(errors, 'Direction brief', input.brief, 10, 420);
  const promptApproach = checkString(errors, 'Prompt approach', input.promptApproach, 10, 420);

  const palette = (Array.isArray(input.palette) ? input.palette : [])
    .map((c) => (typeof c === 'string' ? c.trim() : ''))
    .filter(Boolean);
  if (palette.length < 3 || palette.length > 6) {
    errors.push('Color palette must contain 3 to 6 hex colors.');
  } else if (palette.some((c) => !isSafeHexColor(c))) {
    errors.push('Every palette color must be a valid hex value (e.g. #7c3aed).');
  }

  const featureImage = typeof input.featureImage === 'string' ? input.featureImage.trim() : '';
  if (featureImage !== '' && !isSafeCreativeFeatureImage(featureImage)) {
    errors.push(
      'Feature image must be an uploaded PNG/JPG/WebP image (under 250 KB compressed) or a valid https:// image URL.'
    );
  }

  const sortOrder = Number(input.sortOrder);
  if (!Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    errors.push('Sort order must be a number between 0 and 9999.');
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    errors: [],
    data: {
      id,
      index,
      title,
      handle,
      category: input.category,
      subtitle,
      shortDescription,
      masonrySize: input.masonrySize,
      theme: input.theme,
      medium,
      year,
      brief,
      promptApproach,
      palette,
      featureImage,
      published: Boolean(input.published),
      sortOrder: Math.round(sortOrder),
    },
  };
}

export function validateAdminUserPayload(
  input: AdminUserPayloadInput
): ValidationResult<AdminUserPayloadInput> {
  const errors: string[] = [];
  const uid = (input.uid ?? '').trim();
  if (!isValidDocId(uid) || uid.length < 6) {
    errors.push('Firebase UID must be 6–128 alphanumeric, dash, or underscore characters.');
  }

  const email = (input.email ?? '').trim().toLowerCase();
  if (!isValidEmail(email)) {
    errors.push('Admin email must be a valid email address.');
  }

  const displayName = checkString(errors, 'Display name', input.displayName, 1, 80);

  if (!ALLOWED_ADMIN_ROLES.includes(input.role)) {
    errors.push('Role must be super_admin or admin.');
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    errors: [],
    data: {
      uid,
      email,
      displayName,
      role: input.role,
      active: Boolean(input.active),
    },
  };
}

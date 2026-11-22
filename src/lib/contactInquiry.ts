export const PROJECT_NEED_OPTIONS = [
  'Landing page',
  'Website',
  '3D / WebGL',
  'Game / playable',
  'Animation',
  'Other',
] as const;

export type ProjectNeedOption = (typeof PROJECT_NEED_OPTIONS)[number];

export const PROJECT_BUDGET_OPTIONS = [
  'under $1k',
  '$1–3k',
  '$3–7k',
  '$7k+',
  'Not sure yet',
] as const;

export type ProjectBudgetOption = (typeof PROJECT_BUDGET_OPTIONS)[number];

export const INQUIRY_STATUS_OPTIONS = ['new', 'reviewed', 'archived'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUS_OPTIONS)[number];

export interface ProjectInquiryFormInput {
  name: string;
  contact: string;
  needs: string[];
  budget: string;
  details: string;
}

export interface SanitizedProjectInquiry {
  name: string;
  contact: string;
  needs: ProjectNeedOption[];
  budget: ProjectBudgetOption | '';
  details: string;
  status: 'new';
}

export interface ProjectInquiryFieldErrors {
  name?: string;
  contact?: string;
  needs?: string;
  budget?: string;
  details?: string;
}

export interface ProjectInquiryValidationResult {
  ok: boolean;
  errors: string[];
  fieldErrors: ProjectInquiryFieldErrors;
  data?: SanitizedProjectInquiry;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEGRAM_HANDLE_RE = /^@[a-zA-Z0-9_]{3,32}$/;

export function isValidContactHandle(value: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 4 || trimmed.length > 120) return false;
  return (
    (trimmed.length >= 5 && EMAIL_RE.test(trimmed)) ||
    TELEGRAM_HANDLE_RE.test(trimmed)
  );
}

export function toggleNeedSelection(
  current: readonly ProjectNeedOption[],
  option: ProjectNeedOption
): ProjectNeedOption[] {
  if (current.includes(option)) {
    return current.filter((item) => item !== option);
  }
  return [...current, option];
}

export function toggleBudgetSelection(
  current: ProjectBudgetOption | '',
  option: ProjectBudgetOption
): ProjectBudgetOption | '' {
  return current === option ? '' : option;
}

export function validateProjectInquiry(
  input: ProjectInquiryFormInput
): ProjectInquiryValidationResult {
  const errors: string[] = [];
  const fieldErrors: ProjectInquiryFieldErrors = {};

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (name.length < 2 || name.length > 80) {
    const msg = 'Please enter your name (2–80 characters).';
    errors.push(msg);
    fieldErrors.name = msg;
  }

  const contact = typeof input.contact === 'string' ? input.contact.trim() : '';
  if (!isValidContactHandle(contact)) {
    const msg = 'Enter a valid email (name@mail.com) or Telegram handle (@nickname).';
    errors.push(msg);
    fieldErrors.contact = msg;
  }

  const rawNeeds = Array.isArray(input.needs) ? input.needs : [];
  const validNeedsSet = new Set<string>(PROJECT_NEED_OPTIONS);
  const invalidNeed = rawNeeds.some((n) => typeof n !== 'string' || !validNeedsSet.has(n));
  const uniqueNeeds = Array.from(
    new Set(rawNeeds.filter((n): n is ProjectNeedOption => validNeedsSet.has(n)))
  );
  if (invalidNeed || uniqueNeeds.length > PROJECT_NEED_OPTIONS.length) {
    const msg = 'Select valid project scope options.';
    errors.push(msg);
    fieldErrors.needs = msg;
  }

  const rawBudget = typeof input.budget === 'string' ? input.budget.trim() : '';
  const validBudgetSet = new Set<string>(PROJECT_BUDGET_OPTIONS);
  let budget: ProjectBudgetOption | '' = '';
  if (rawBudget !== '') {
    if (!validBudgetSet.has(rawBudget)) {
      const msg = 'Select a valid budget range.';
      errors.push(msg);
      fieldErrors.budget = msg;
    } else {
      budget = rawBudget as ProjectBudgetOption;
    }
  }

  const details = typeof input.details === 'string' ? input.details.trim() : '';
  if (details.length < 10 || details.length > 2000) {
    const msg = 'Please share a few lines about the project (10–2000 characters).';
    errors.push(msg);
    fieldErrors.details = msg;
  }

  if (errors.length > 0) {
    return { ok: false, errors, fieldErrors };
  }

  return {
    ok: true,
    errors: [],
    fieldErrors: {},
    data: {
      name,
      contact,
      needs: uniqueNeeds,
      budget,
      details,
      status: 'new',
    },
  };
}

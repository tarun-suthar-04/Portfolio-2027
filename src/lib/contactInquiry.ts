export const CONTACT_REASON_OPTIONS = [
  'Freelance project',
  'Enquiry',
  'just saying Hii',
] as const;

export type ContactReasonOption = (typeof CONTACT_REASON_OPTIONS)[number];

export const DEFAULT_CONTACT_REASON: ContactReasonOption = 'Freelance project';

export const CONTACT_SOURCE_OPTIONS = ['technical', 'creative'] as const;
export type ContactSource = (typeof CONTACT_SOURCE_OPTIONS)[number];

export const INQUIRY_STATUS_OPTIONS = ['new', 'reviewed', 'archived'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUS_OPTIONS)[number];

export interface ContactInquiryFormInput {
  name: string;
  email: string;
  phone: string;
  reason: string;
  message: string;
  source: ContactSource;
}

export interface SanitizedContactInquiry {
  name: string;
  email: string;
  phone: string;
  reason: ContactReasonOption;
  message: string;
  source: ContactSource;
  status: 'new';
}

export interface ContactInquiryFieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  reason?: string;
  message?: string;
}

export interface ContactInquiryValidationResult {
  ok: boolean;
  errors: string[];
  fieldErrors: ContactInquiryFieldErrors;
  data?: SanitizedContactInquiry;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9\s()-]+$/;

export function isValidInquiryEmail(value: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= 5 && trimmed.length <= 120 && EMAIL_RE.test(trimmed);
}

export function isValidInquiryPhone(value: string): boolean {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed === '') return true;
  if (trimmed.length < 4 || trimmed.length > 24) return false;
  if (!PHONE_RE.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 4 && digits.length <= 15;
}

export function validateContactInquiry(
  input: ContactInquiryFormInput
): ContactInquiryValidationResult {
  const errors: string[] = [];
  const fieldErrors: ContactInquiryFieldErrors = {};

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (name.length < 2 || name.length > 80) {
    const msg = 'Please enter your full name (2–80 characters).';
    errors.push(msg);
    fieldErrors.name = msg;
  }

  const email = typeof input.email === 'string' ? input.email.trim() : '';
  if (!isValidInquiryEmail(email)) {
    const msg = 'Please enter a valid email address (name@company.com).';
    errors.push(msg);
    fieldErrors.email = msg;
  }

  const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
  if (!isValidInquiryPhone(phone)) {
    const msg = 'Enter a valid phone number (e.g. +91 98765 43210) or leave blank.';
    errors.push(msg);
    fieldErrors.phone = msg;
  }

  const rawReason = typeof input.reason === 'string' ? input.reason.trim() : '';
  const validReasonSet = new Set<string>(CONTACT_REASON_OPTIONS);
  let reason: ContactReasonOption = DEFAULT_CONTACT_REASON;
  if (!validReasonSet.has(rawReason)) {
    const msg = 'Please choose a valid reason.';
    errors.push(msg);
    fieldErrors.reason = msg;
  } else {
    reason = rawReason as ContactReasonOption;
  }

  const message = typeof input.message === 'string' ? input.message.trim() : '';
  if (message.length < 5 || message.length > 2000) {
    const msg = 'Please write a few words (5–2000 characters).';
    errors.push(msg);
    fieldErrors.message = msg;
  }

  const validSourceSet = new Set<string>(CONTACT_SOURCE_OPTIONS);
  const source: ContactSource = validSourceSet.has(input.source) ? input.source : 'technical';
  if (!validSourceSet.has(input.source)) {
    errors.push('Invalid form source.');
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
      email,
      phone,
      reason,
      message,
      source,
      status: 'new',
    },
  };
}

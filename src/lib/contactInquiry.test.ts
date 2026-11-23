import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTACT_REASON_OPTIONS,
  DEFAULT_CONTACT_REASON,
  isValidInquiryEmail,
  isValidInquiryPhone,
  validateContactInquiry,
} from './contactInquiry';

test('CONTACT_REASON_OPTIONS and default reason match specification', () => {
  assert.deepEqual(CONTACT_REASON_OPTIONS, [
    'Freelance project',
    'Enquiry',
    'just saying Hii',
  ]);
  assert.equal(DEFAULT_CONTACT_REASON, 'Freelance project');
});

test('isValidInquiryEmail accepts valid emails and rejects malformed values', () => {
  assert.equal(isValidInquiryEmail('name@company.com'), true);
  assert.equal(isValidInquiryEmail('cdstarun1837@gmail.com'), true);
  assert.equal(isValidInquiryEmail('not-an-email'), false);
  assert.equal(isValidInquiryEmail('a@b'), false);
  assert.equal(isValidInquiryEmail(''), false);
});

test('isValidInquiryPhone allows empty phone or valid international phone numbers', () => {
  assert.equal(isValidInquiryPhone(''), true);
  assert.equal(isValidInquiryPhone('+91 98765 43210'), true);
  assert.equal(isValidInquiryPhone('+1 (415) 555-0199'), true);
  assert.equal(isValidInquiryPhone('+91'), false);
  assert.equal(isValidInquiryPhone('abc-12345'), false);
  assert.equal(isValidInquiryPhone('1234567890123456789012345'), false);
});

test('validateContactInquiry succeeds on complete technical and minimal creative payloads', () => {
  const techResult = validateContactInquiry({
    name: 'Aarav Sharma',
    email: 'aarav@studio.co',
    phone: '+91 98765 43210',
    reason: 'Freelance project',
    message: 'Looking for an Android + backend engineer for a Q4 release.',
    source: 'technical',
  });
  assert.equal(techResult.ok, true);
  assert.deepEqual(techResult.data, {
    name: 'Aarav Sharma',
    email: 'aarav@studio.co',
    phone: '+91 98765 43210',
    reason: 'Freelance project',
    message: 'Looking for an Android + backend engineer for a Q4 release.',
    source: 'technical',
    status: 'new',
  });

  const creativeResult = validateContactInquiry({
    name: 'Maya Lin',
    email: 'maya@brand.design',
    phone: '',
    reason: 'just saying Hii',
    message: 'Loved the editorial visual studies!',
    source: 'creative',
  });
  assert.equal(creativeResult.ok, true);
  assert.equal(creativeResult.data?.phone, '');
  assert.equal(creativeResult.data?.reason, 'just saying Hii');
  assert.equal(creativeResult.data?.source, 'creative');
});

test('validateContactInquiry rejects missing required fields, bad phone, and unknown reason/source', () => {
  const res = validateContactInquiry({
    name: 'A',
    email: 'bad-email',
    phone: 'phone-xyz',
    reason: 'Unknown option',
    message: 'Hi',
    source: 'other' as 'technical',
  });
  assert.equal(res.ok, false);
  assert.ok(res.fieldErrors.name);
  assert.ok(res.fieldErrors.email);
  assert.ok(res.fieldErrors.phone);
  assert.ok(res.fieldErrors.reason);
  assert.ok(res.fieldErrors.message);
  assert.ok(res.errors.includes('Invalid form source.'));
});

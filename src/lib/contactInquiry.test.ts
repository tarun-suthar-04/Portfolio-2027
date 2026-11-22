import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidContactHandle,
  PROJECT_BUDGET_OPTIONS,
  PROJECT_NEED_OPTIONS,
  toggleBudgetSelection,
  toggleNeedSelection,
  validateProjectInquiry,
} from './contactInquiry';

test('isValidContactHandle accepts valid emails and Telegram handles while rejecting malformed strings', () => {
  assert.equal(isValidContactHandle('alex@studio.io'), true);
  assert.equal(isValidContactHandle('@tarun_dev'), true);
  assert.equal(isValidContactHandle('@ab'), false);
  assert.equal(isValidContactHandle('not-an-email'), false);
  assert.equal(isValidContactHandle('@bad handle'), false);
  assert.equal(isValidContactHandle(''), false);
});

test('toggleNeedSelection adds and removes options cleanly without duplicates', () => {
  let needs = toggleNeedSelection([], 'Website');
  assert.deepEqual(needs, ['Website']);
  needs = toggleNeedSelection(needs, '3D / WebGL');
  assert.deepEqual(needs, ['Website', '3D / WebGL']);
  needs = toggleNeedSelection(needs, 'Website');
  assert.deepEqual(needs, ['3D / WebGL']);
});

test('toggleBudgetSelection selects, switches, and clears budget choices', () => {
  assert.equal(toggleBudgetSelection('', '$1–3k'), '$1–3k');
  assert.equal(toggleBudgetSelection('$1–3k', '$3–7k'), '$3–7k');
  assert.equal(toggleBudgetSelection('$3–7k', '$3–7k'), '');
});

test('validateProjectInquiry succeeds on valid complete and minimal payloads', () => {
  const full = validateProjectInquiry({
    name: 'Alex Rivera',
    contact: '@alex_builds',
    needs: ['Landing page', 'Animation'],
    budget: '$1–3k',
    details: 'Building an interactive product launch page for Q3 with Figma links ready.',
  });
  assert.equal(full.ok, true);
  assert.deepEqual(full.data, {
    name: 'Alex Rivera',
    contact: '@alex_builds',
    needs: ['Landing page', 'Animation'],
    budget: '$1–3k',
    details: 'Building an interactive product launch page for Q3 with Figma links ready.',
    status: 'new',
  });

  const minimal = validateProjectInquiry({
    name: 'Sam',
    contact: 'sam@example.com',
    needs: [],
    budget: '',
    details: 'Need a clean website redesign in three weeks.',
  });
  assert.equal(minimal.ok, true);
  assert.equal(minimal.data?.budget, '');
  assert.deepEqual(minimal.data?.needs, []);
});

test('validateProjectInquiry rejects missing required fields, bad contact, and unknown options', () => {
  const res = validateProjectInquiry({
    name: 'A',
    contact: 'invalid-contact',
    needs: ['Unknown service'],
    budget: '$999k',
    details: 'Too short',
  });
  assert.equal(res.ok, false);
  assert.ok(res.fieldErrors.name);
  assert.ok(res.fieldErrors.contact);
  assert.ok(res.fieldErrors.needs);
  assert.ok(res.fieldErrors.budget);
  assert.ok(res.fieldErrors.details);
});

test('PROJECT_NEED_OPTIONS and PROJECT_BUDGET_OPTIONS match exact prompt specification', () => {
  assert.deepEqual(PROJECT_NEED_OPTIONS, [
    'Landing page',
    'Website',
    '3D / WebGL',
    'Game / playable',
    'Animation',
    'Other',
  ]);
  assert.deepEqual(PROJECT_BUDGET_OPTIONS, [
    'under $1k',
    '$1–3k',
    '$3–7k',
    '$7k+',
    'Not sure yet',
  ]);
});

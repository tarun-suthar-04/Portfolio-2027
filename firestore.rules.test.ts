import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  isSafeHttpsUrl,
  isValidDocId,
  validateProjectPayload,
  validateSiteConfig,
} from './src/lib/adminValidation';

const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rulesText = fs.readFileSync(rulesPath, 'utf8');
const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf8'));

test('Dirty Dozen #1 & #2: Default-deny safety net and verified-email admin enforcement', () => {
  assert.match(rulesText, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesText, /'ahirwalshiwani9@gmail\.com'/);
  assert.match(rulesText, /'cdstarun2004@gmail\.com'/);
  assert.match(rulesText, /'cdstarun1837@gmail\.com'/);
});

test('Dirty Dozen #3: Zero self-privilege escalation and self-lockout guard on /admins/{adminUid}', () => {
  assert.match(rulesText, /match \/admins\/\{adminUid\}/);
  assert.match(rulesText, /allow create:[\s\S]*?isSuperAdmin\(\)/);
  assert.match(rulesText, /allow update:[\s\S]*?isSuperAdmin\(\)/);
  assert.match(rulesText, /allow delete:[\s\S]*?adminUid != request\.auth\.uid[\s\S]*?isSuperAdmin\(\)/);
  assert.match(
    rulesText,
    /!\(adminUid == request\.auth\.uid && \(incoming\(\)\.active == false \|\| incoming\(\)\.role != 'super_admin'\)\)/
  );
});

test('Dirty Dozen #4 & #5: Strict hasAll/hasOnly and affectedKeys().hasOnly() prevent shadow field injection', () => {
  const hasAllCount = (rulesText.match(/\.keys\(\)\.hasAll\(/g) ?? []).length;
  const hasOnlyCount = (rulesText.match(/\.keys\(\)\.hasOnly\(/g) ?? []).length;
  const affectedKeysCount = (rulesText.match(/\.affectedKeys\(\)\.hasOnly\(/g) ?? []).length;
  assert.equal(hasAllCount, 5, 'All 5 entity validators must enforce keys().hasAll()');
  assert.equal(hasOnlyCount, 5, 'All 5 entity validators must enforce keys().hasOnly()');
  assert.ok(affectedKeysCount >= 4, 'Mutable collections must whitelist affectedKeys() on update');
});

test('Dirty Dozen #6: Path ID hygiene blocks traversal and oversized IDs', () => {
  assert.match(rulesText, /function isValidId\(id\)/);
  assert.match(rulesText, /id\.size\(\) <= 128/);
  assert.equal(isValidDocId('../../etc/passwd'), false);
  assert.equal(isValidDocId('x'.repeat(200)), false);
});

test('Dirty Dozen #7: XSS URL scheme injection & SVG data URI blocked in rules and client validator', () => {
  assert.match(rulesText, /function isHttpsUrl\(val\)/);
  assert.match(rulesText, /function isSafeCreativeFeatureImage\(val\)/);
  assert.match(rulesText, /val\.size\(\) <= 350000/);
  assert.match(rulesText, /\['data:image\/webp', 'data:image\/jpeg', 'data:image\/png'\]/);
  assert.match(rulesText, /val\.matches\('\^https:\/\/\.\*\$'\)/);
  assert.match(rulesText, /!val\.matches\('\.\*\\\\\.\\\\\.\.\*'\)/);
  assert.equal(isSafeHttpsUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpsUrl('data:text/html,<h1>x</h1>'), false);

  const badSite = validateSiteConfig({
    firstName: 'Tarun',
    lastName: 'Suthar',
    fullName: 'Tarun Suthar',
    location: 'Indore, India',
    contactEmail: 'cdstarun1837@gmail.com',
    techRole: 'Developer',
    techBio: 'Database-backed software engineer.',
    creativeRole: 'Artist',
    creativeHeadline: 'Ideas into visuals.',
    creativeSubline: 'Imagination into motion.',
    creativeYears: '2025–2026',
    linkedinUrl: 'data:text/html,pwn',
    githubUrl: 'https://github.com/tarun-suthar-04',
    instagramUrl: 'https://instagram.com/tarunsuthar',
    fiverrUrl: 'https://www.fiverr.com/tarunsuthar',
  });
  assert.equal(badSite.ok, false);
});

test('Dirty Dozen #8 & #9: Immutable append-only audit logs with strict actor identity binding', () => {
  const auditSection = rulesText.slice(rulesText.indexOf('match /audit_logs/{logId}'));
  assert.match(auditSection, /allow update: if false;/);
  assert.match(auditSection, /allow delete: if false;/);
  assert.match(rulesText, /data\.actorUid == request\.auth\.uid/);
  assert.match(rulesText, /data\.actorEmail == request\.auth\.token\.email/);
});

test('Dirty Dozen #10: Server timestamp enforcement blocks client clock forgery', () => {
  assert.match(rulesText, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rulesText, /incoming\(\)\.updatedAt == request\.time/);
  assert.match(rulesText, /incoming\(\)\.createdAt == existing\(\)\.createdAt/);
});

test('Dirty Dozen #11: Denial-of-Wallet string and array size caps', () => {
  assert.match(rulesText, /data\.summary\.size\(\) <= 500/);
  assert.match(rulesText, /data\.stack\.size\(\) <= 12/);
  assert.match(rulesText, /data\.highlights\.size\(\) <= 8/);
  const hugePayload = validateProjectPayload({
    id: 'huge',
    title: 'Huge',
    fileName: 'huge.py',
    fileExt: '.py',
    fileTypeLabel: 'Python',
    fileAccent: '#2563eb',
    platform: 'Python',
    subtitle: 'Test',
    summary: 'x'.repeat(50000),
    highlights: ['Valid highlight'],
    stack: Array.from({ length: 100 }, (_, i) => `tag-${i}`),
    demonstrates: 'Demo',
    previewImage: '/src/assets/images/project_employee_manager_1795258264291.jpg',
    previewAlt: 'Alt',
    fallbackGradient: 'linear-gradient(135deg, #000 0%, #111 100%)',
    githubUrl: 'https://github.com/tarun-suthar-04/test',
    published: true,
    sortOrder: 1,
  });
  assert.equal(hugePayload.ok, false);
});

test('Dirty Dozen #12: PII isolation and zero get()/exists() in allow list rules', () => {
  const listMatches = [...rulesText.matchAll(/allow list:[^;]+;/g)].map((m) => m[0]);
  assert.ok(listMatches.length >= 4);
  for (const rule of listMatches) {
    assert.equal(rule.includes('get('), false, `allow list must not call get(): ${rule}`);
    assert.equal(rule.includes('exists('), false, `allow list must not call exists(): ${rule}`);
    assert.equal(rule.includes('isAdmin()'), false, `allow list must not call isAdmin(): ${rule}`);
    assert.equal(
      rule.includes('isSuperAdmin()'),
      false,
      `allow list must not call isSuperAdmin(): ${rule}`
    );
  }
  // Blueprint covers all 5 collections
  assert.deepEqual(Object.keys(blueprint.firestore).sort(), [
    '/admins/{adminUid}',
    '/audit_logs/{logId}',
    '/creative_works/{workId}',
    '/projects/{projectId}',
    '/site_config/{configId}',
  ]);
});

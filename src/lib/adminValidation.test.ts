import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isBootstrapAdminEmail,
  isSafeCreativeFeatureImage,
  isSafeGradient,
  isSafeHttpsUrl,
  isSafeImagePath,
  isValidDocId,
  slugifyDocId,
  validateAdminUserPayload,
  validateCreativeWorkPayload,
  validateProjectPayload,
  validateSiteConfig,
} from './adminValidation';

test('isBootstrapAdminEmail allows configured admin emails case-insensitively and rejects others', () => {
  assert.equal(isBootstrapAdminEmail('ahirwalshiwani9@gmail.com'), true);
  assert.equal(isBootstrapAdminEmail('cdstarun2004@gmail.com'), true);
  assert.equal(isBootstrapAdminEmail('CDSTARUN1837@GMAIL.COM'), true);
  assert.equal(isBootstrapAdminEmail('random@example.com'), false);
  assert.equal(isBootstrapAdminEmail(null), false);
});

test('isValidDocId rejects path traversal and oversized IDs', () => {
  assert.equal(isValidDocId('order-analyzer'), true);
  assert.equal(isValidDocId('work_01'), true);
  assert.equal(isValidDocId('../../etc/passwd'), false);
  assert.equal(isValidDocId('bad/slash'), false);
  assert.equal(isValidDocId(''), false);
  assert.equal(isValidDocId('a'.repeat(129)), false);
});

test('isSafeHttpsUrl blocks javascript:, data:, and http: URLs', () => {
  assert.equal(isSafeHttpsUrl('https://github.com/tarun-suthar-04'), true);
  assert.equal(isSafeHttpsUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpsUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isSafeHttpsUrl('http://example.com'), false);
  assert.equal(isSafeHttpsUrl('https://'), false);
});

test('isSafeImagePath permits local project assets and https URLs while blocking traversal', () => {
  assert.equal(
    isSafeImagePath('/src/assets/images/project_order_analyzer_1795258265910.jpg'),
    true
  );
  assert.equal(isSafeImagePath('/assets/aistudio/sample.png'), true);
  assert.equal(isSafeImagePath('https://cdn.example.com/preview.jpg'), true);
  assert.equal(isSafeImagePath('/assets/../../secrets.txt'), false);
  assert.equal(isSafeImagePath('javascript:alert(1)'), false);
});

test('isSafeCreativeFeatureImage allows raster base64 & HTTPS URLs while blocking SVG/HTML XSS', () => {
  assert.equal(isSafeCreativeFeatureImage(''), true);
  assert.equal(
    isSafeCreativeFeatureImage('data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA='),
    true
  );
  assert.equal(
    isSafeCreativeFeatureImage('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA=='),
    true
  );
  assert.equal(isSafeCreativeFeatureImage('https://cdn.example.com/work.jpg'), true);
  assert.equal(
    isSafeCreativeFeatureImage('data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+PC9zdmc+'),
    false
  );
  assert.equal(
    isSafeCreativeFeatureImage('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='),
    false
  );
  assert.equal(isSafeCreativeFeatureImage('javascript:alert(1)'), false);
  assert.equal(
    isSafeCreativeFeatureImage('data:image/webp;base64,' + 'A'.repeat(350_000)),
    false
  );
});

test('isSafeGradient permits clean linear-gradient and blocks CSS injection', () => {
  assert.equal(isSafeGradient('linear-gradient(135deg, #0f5c3f 0%, #111111 100%)'), true);
  assert.equal(isSafeGradient('linear-gradient(135deg, #000); background: url(javascript:x)'), false);
});

test('validateProjectPayload accepts valid technical project and rejects invalid payloads', () => {
  const valid = validateProjectPayload({
    id: 'order-analyzer',
    title: 'Order Analyzer',
    fileName: 'order-analyzer.apk',
    fileExt: '.apk',
    fileTypeLabel: 'Android App',
    fileAccent: '#0f5c3f',
    platform: 'Android · SQLite + Firestore',
    subtitle: 'Android app · Java',
    summary: 'Retail order tracker built for offline shop workflows with cloud sync.',
    highlights: ['Offline SQLite ledger', 'Firestore sync'],
    stack: ['Java', 'Android', 'SQLite'],
    demonstrates: 'Local DB design · Cloud sync',
    previewImage: '/src/assets/images/project_order_analyzer_1795258265910.jpg',
    previewAlt: 'Order Analyzer app preview',
    fallbackGradient: 'linear-gradient(135deg, #0f5c3f 0%, #111111 100%)',
    githubUrl: 'https://github.com/tarun-suthar-04/order-analyzer',
    liveUrl: '',
    published: true,
    sortOrder: 1,
  });
  assert.equal(valid.ok, true);

  const xssAttempt = validateProjectPayload({
    ...(valid.data!),
    githubUrl: 'javascript:alert(document.cookie)',
    highlights: [],
  });
  assert.equal(xssAttempt.ok, false);
  assert.ok(xssAttempt.errors.length >= 2);
});

test('validateCreativeWorkPayload enforces category, theme, palette bounds, and sizes', () => {
  const valid = validateCreativeWorkPayload({
    id: 'portraits',
    index: '01',
    title: 'PORTRAITS',
    handle: '@tarunsuthar · Direction',
    category: 'AI Portraits',
    subtitle: 'Atmospheric lighting & character mood',
    shortDescription: 'AI-directed twilight portrait series balancing sculpted rim light.',
    masonrySize: 'tall',
    theme: 'violet',
    medium: 'AI Visual Study · Lighting',
    year: '2025–2026',
    brief: 'Exploring sculpted twilight rim-lighting and restrained editorial framing.',
    promptApproach: 'Controlled focal length cues and clean darkroom shadow roll-off.',
    palette: ['#7c3aed', '#c084fc', '#e9d5ff'],
    published: true,
    sortOrder: 1,
  });
  assert.equal(valid.ok, true);

  const badPalette = validateCreativeWorkPayload({
    ...(valid.data!),
    palette: ['#7c3aed', 'not-a-hex'],
  });
  assert.equal(badPalette.ok, false);
});

test('validateSiteConfig blocks non-HTTPS social links and invalid emails', () => {
  const invalid = validateSiteConfig({
    firstName: 'Tarun',
    lastName: 'Suthar',
    fullName: 'Tarun Suthar',
    location: 'Indore, India',
    contactEmail: 'invalid-email',
    techRole: 'Software Developer',
    techBio: 'Building reliable database-backed applications in Java and Python.',
    creativeRole: 'AI Creative Artist',
    creativeHeadline: 'Ideas into visuals.',
    creativeSubline: 'Imagination into motion.',
    creativeYears: '2025–2026',
    linkedinUrl: 'javascript:alert(1)',
    githubUrl: 'https://github.com/tarun-suthar-04',
    instagramUrl: 'https://instagram.com/tarunsuthar',
    fiverrUrl: 'https://www.fiverr.com/tarunsuthar',
  });
  assert.equal(invalid.ok, false);
  assert.ok(invalid.errors.some((e) => e.includes('Contact email')));
  assert.ok(invalid.errors.some((e) => e.includes('LinkedIn URL')));
});

test('validateAdminUserPayload rejects short UIDs and invalid roles', () => {
  const valid = validateAdminUserPayload({
    uid: 'abc123XYZ789',
    email: 'admin@example.com',
    displayName: 'Co-Admin',
    role: 'admin',
    active: true,
  });
  assert.equal(valid.ok, true);

  const bad = validateAdminUserPayload({
    uid: '../bad',
    email: 'nope',
    displayName: '',
    role: 'root' as 'admin',
    active: true,
  });
  assert.equal(bad.ok, false);
});

test('slugifyDocId generates safe Firestore document IDs', () => {
  assert.equal(slugifyDocId('Order Analyzer v2!'), 'order-analyzer-v2');
  assert.ok(isValidDocId(slugifyDocId('   !!!   ', 'project')));
});

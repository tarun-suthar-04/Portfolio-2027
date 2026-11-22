import test from 'node:test';
import assert from 'node:assert/strict';
import { PROJECTS, type ProjectItem } from '../data/portfolio';
import {
  buildProjectHash,
  computeFloatingThumbnailPlacement,
  getAdjacentProjects,
  parseProjectIdFromHash,
  resolveProjectCaseStudy,
} from './projectCaseStudy';

test('parseProjectIdFromHash extracts project IDs and ignores non-project hashes', () => {
  assert.equal(parseProjectIdFromHash('#tech/project/order-analyzer'), 'order-analyzer');
  assert.equal(parseProjectIdFromHash('#tech/project/pixault'), 'pixault');
  assert.equal(parseProjectIdFromHash('#tech/project/employee-management'), 'employee-management');
  assert.equal(parseProjectIdFromHash('#tech/project/custom%20id'), 'custom id');
  assert.equal(parseProjectIdFromHash('#tech'), null);
  assert.equal(parseProjectIdFromHash('#creative'), null);
  assert.equal(parseProjectIdFromHash('#tech/project/'), null);
  assert.equal(parseProjectIdFromHash(''), null);
});

test('buildProjectHash formats canonical project route hashes', () => {
  assert.equal(buildProjectHash('order-analyzer'), '#tech/project/order-analyzer');
  assert.equal(buildProjectHash('pixault'), '#tech/project/pixault');
  assert.equal(buildProjectHash('  '), '#tech');
});

test('getAdjacentProjects returns wrap-around prev/next projects cleanly', () => {
  const first = getAdjacentProjects(PROJECTS, 'order-analyzer');
  assert.equal(first.index, 0);
  assert.equal(first.total, 3);
  assert.equal(first.prev?.id, 'employee-management');
  assert.equal(first.next?.id, 'pixault');

  const middle = getAdjacentProjects(PROJECTS, 'pixault');
  assert.equal(middle.index, 1);
  assert.equal(middle.prev?.id, 'order-analyzer');
  assert.equal(middle.next?.id, 'employee-management');

  const missing = getAdjacentProjects(PROJECTS, 'unknown-project');
  assert.equal(missing.index, -1);
  assert.equal(missing.prev, null);
  assert.equal(missing.next, null);
});

test('resolveProjectCaseStudy returns authored case studies for core projects and factual fallback for custom projects', () => {
  for (const project of PROJECTS) {
    const resolved = resolveProjectCaseStudy(project);
    assert.ok(resolved.challengeHeading.length > 10);
    assert.ok(resolved.solutionHeading.length > 10);
    assert.equal(resolved.overviewHeading, 'The project.');
    assert.ok(resolved.overviewBody.length >= 2);
    assert.equal(resolved.outcomeHeading, 'The outcome.');
    assert.ok(resolved.deliveredPoints.length >= 2);
  }

  const customProject: ProjectItem = {
    id: 'inventory-cli',
    title: 'Inventory CLI',
    fileName: 'inventory.py',
    fileExt: '.py',
    fileTypeLabel: 'Python CLI',
    fileAccent: '#0f5c3f',
    platform: 'Python · SQLite',
    subtitle: 'Command-line tool',
    summary: 'Tracks stock levels from the terminal with SQLite persistence.',
    highlights: ['Fast barcode lookup', 'CSV inventory snapshot'],
    stack: ['Python', 'SQLite'],
    demonstrates: 'CLI ergonomics · SQLite indexing',
    previewImage: '/assets/inventory.jpg',
    previewAlt: 'Inventory CLI preview',
    fallbackGradient: 'linear-gradient(135deg, #0f5c3f 0%, #111111 100%)',
    githubUrl: 'https://github.com/example/inventory',
    architecture: {
      layers: [{ name: 'CLI Parser', role: 'Handles subcommands and output formatting' }],
      dataFlow: 'CLI Input → Validation → SQLite → Report',
      engineeringNotes: ['Zero external runtime dependencies.'],
    },
  };

  const fallback = resolveProjectCaseStudy(customProject);
  assert.match(fallback.challengeHeading, /Inventory CLI/);
  assert.match(fallback.solutionBody, /CLI Input → Validation/);
  assert.deepEqual(fallback.deliveredPoints, ['Fast barcode lookup', 'CSV inventory snapshot']);
});

test('computeFloatingThumbnailPlacement clamps horizontal bounds and limits rotation', () => {
  const leftEdge = computeFloatingThumbnailPlacement({
    pointerX: 10,
    pointerY: 20,
    containerWidth: 420,
    containerHeight: 60,
    thumbWidth: 200,
  });
  assert.equal(leftEdge.x, 0);
  assert.ok(leftEdge.rotate >= -2 && leftEdge.rotate <= 2);

  const rightEdge = computeFloatingThumbnailPlacement({
    pointerX: 415,
    pointerY: 45,
    containerWidth: 420,
    containerHeight: 60,
    thumbWidth: 200,
  });
  assert.equal(rightEdge.x, 220);
  assert.ok(rightEdge.y >= -20 && rightEdge.y <= -8);

  const invalid = computeFloatingThumbnailPlacement({
    pointerX: 50,
    pointerY: 20,
    containerWidth: 0,
    containerHeight: 0,
    thumbWidth: 200,
  });
  assert.deepEqual(invalid, { x: 0, y: -12, rotate: 0 });
});

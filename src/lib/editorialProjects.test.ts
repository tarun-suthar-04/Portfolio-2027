import test from 'node:test';
import assert from 'node:assert/strict';
import { PROJECTS } from '../data/portfolio';
import {
  buildProjectStripFrames,
  clampCursorPoint,
  computeStripPanOffset,
  formatProjectIndex,
  getEditorialLayoutSide,
  isProjectInteractive,
  lerpValue,
  resolveActiveProjectId,
} from './editorialProjects';

test('formatProjectIndex produces zero-padded editorial indices', () => {
  assert.equal(formatProjectIndex(0), '01');
  assert.equal(formatProjectIndex(1), '02');
  assert.equal(formatProjectIndex(9), '10');
  assert.equal(formatProjectIndex(-3), '01');
});

test('getEditorialLayoutSide alternates media-left and media-right predictably', () => {
  assert.equal(getEditorialLayoutSide(0), 'media-left');
  assert.equal(getEditorialLayoutSide(1), 'media-right');
  assert.equal(getEditorialLayoutSide(2), 'media-left');
  assert.equal(getEditorialLayoutSide(3), 'media-right');
});

test('isProjectInteractive suppresses comingSoon and disabled projects', () => {
  assert.equal(isProjectInteractive({}), true);
  assert.equal(isProjectInteractive({ comingSoon: false, disabled: false }), true);
  assert.equal(isProjectInteractive({ comingSoon: true }), false);
  assert.equal(isProjectInteractive({ disabled: true }), false);
});

test('lerpValue smoothly interpolates and clamps factor bounds', () => {
  assert.equal(lerpValue(0, 100, 0.25), 25);
  assert.equal(lerpValue(40, 100, 0), 40);
  assert.equal(lerpValue(40, 100, 1), 100);
  assert.equal(lerpValue(40, 100, 2), 100);
});

test('computeStripPanOffset maps pointer ratio cleanly to clamped horizontal offset', () => {
  // No overflow -> always 0
  assert.equal(
    computeStripPanOffset({ pointerRatio: 0.5, containerWidth: 1000, trackWidth: 900 }),
    0
  );

  // Inside left dead zone -> 0
  assert.equal(
    computeStripPanOffset({
      pointerRatio: 0.05,
      containerWidth: 1000,
      trackWidth: 1600,
      edgeDeadZone: 0.1,
    }),
    0
  );

  // Exact center -> -300px (half of 600px overflow)
  assert.equal(
    computeStripPanOffset({
      pointerRatio: 0.5,
      containerWidth: 1000,
      trackWidth: 1600,
      edgeDeadZone: 0.1,
    }),
    -300
  );

  // Inside right dead zone -> -600px (full overflow)
  assert.equal(
    computeStripPanOffset({
      pointerRatio: 0.95,
      containerWidth: 1000,
      trackWidth: 1600,
      edgeDeadZone: 0.1,
    }),
    -600
  );
});

test('buildProjectStripFrames produces 5 grounded preview frames per project', () => {
  for (const project of PROJECTS) {
    const frames = buildProjectStripFrames(project);
    assert.equal(frames.length, 5);
    assert.equal(frames[0].kind, 'screen-primary');
    assert.equal(frames[0].imageSrc, project.previewImage);
    assert.equal(frames[1].kind, 'architecture-flow');
    assert.ok((frames[1].flowSteps?.length ?? 0) >= 3);
    assert.equal(frames[3].kind, 'layers-blueprint');
    assert.equal(frames[3].layers?.length, project.architecture.layers.length);
    assert.equal(frames[4].kind, 'build-spec');
    assert.deepEqual(frames[4].stack, project.stack);
  }
});

test('resolveActiveProjectId tracks the project straddling the focal line or nearest to it', () => {
  const metrics = [
    { id: 'order-analyzer', top: -200, bottom: 180, isIntersecting: true },
    { id: 'pixault', top: 210, bottom: 720, isIntersecting: true },
    { id: 'employee-management', top: 760, bottom: 1280, isIntersecting: false },
  ];

  assert.equal(resolveActiveProjectId(metrics, 320), 'pixault');
  assert.equal(resolveActiveProjectId(metrics, 80), 'order-analyzer');
  assert.equal(resolveActiveProjectId(metrics, 900), 'employee-management');
  assert.equal(resolveActiveProjectId([], 300), null);
});

test('clampCursorPoint constrains pointer coordinates safely inside media frame bounds', () => {
  const inside = clampCursorPoint(240, 180, 640, 400);
  assert.deepEqual(inside, { x: 240, y: 180 });

  const clippedLow = clampCursorPoint(-20, 4, 640, 400, 56, 22);
  assert.deepEqual(clippedLow, { x: 56, y: 22 });

  const clippedHigh = clampCursorPoint(900, 500, 640, 400, 56, 22);
  assert.deepEqual(clippedHigh, { x: 584, y: 378 });
});

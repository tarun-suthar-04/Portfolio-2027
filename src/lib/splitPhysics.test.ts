import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePullProgress,
  clampProgress,
  computeVelocity,
  easeInOutCubic,
  easeOutBack,
  parseViewFromLocation,
  resolveSwipeOutcome,
  viewToHash,
} from './splitPhysics';

test('clampProgress keeps values within [0, 1] and guards non-finite numbers', () => {
  assert.equal(clampProgress(-0.4), 0);
  assert.equal(clampProgress(1.8), 1);
  assert.equal(clampProgress(0.35), 0.35);
  assert.equal(clampProgress(Number.NaN), 0.5);
});

test('easing curves return exact boundary values', () => {
  assert.equal(easeInOutCubic(0), 0);
  assert.equal(easeInOutCubic(0.5), 0.5);
  assert.equal(easeInOutCubic(1), 1);
  assert.equal(easeOutBack(0), 0);
  assert.equal(easeOutBack(1), 1);
  assert.ok(easeOutBack(0.7) > 1, 'easeOutBack overshoots before settling');
});

test('computeVelocity calculates directional px/ms velocity', () => {
  assert.equal(computeVelocity([]), 0);
  assert.equal(computeVelocity([{ time: 100, coord: 50 }]), 0);
  const vel = computeVelocity([
    { time: 100, coord: 300 },
    { time: 140, coord: 220 },
  ]);
  assert.equal(vel, -2);
});

test('resolveSwipeOutcome opens Technical on fast negative flick', () => {
  const result = resolveSwipeOutcome({
    progress: 0.54,
    velocity: -0.8,
    isVertical: false,
  });
  assert.deepEqual(result, { action: 'open', targetView: 'tech' });
});

test('resolveSwipeOutcome opens Creative when dragged past desktop threshold', () => {
  const result = resolveSwipeOutcome({
    progress: 0.3,
    velocity: 0.05,
    isVertical: false,
  });
  assert.deepEqual(result, { action: 'open', targetView: 'cre' });
});

test('resolveSwipeOutcome snaps back when released below threshold without flick', () => {
  const result = resolveSwipeOutcome({
    progress: 0.56,
    velocity: 0.1,
    isVertical: false,
  });
  assert.deepEqual(result, { action: 'snapBack' });
});

test('calculatePullProgress normalizes overscroll return indicator', () => {
  assert.equal(calculatePullProgress(0, 240), 0);
  assert.equal(calculatePullProgress(120, 240), 0.5);
  assert.equal(calculatePullProgress(400, 240), 1);
});

test('parseViewFromLocation and viewToHash handle deep links cleanly', () => {
  assert.equal(parseViewFromLocation('#tech', ''), 'tech');
  assert.equal(parseViewFromLocation('#creative', ''), 'cre');
  assert.equal(parseViewFromLocation('', '?view=cre'), 'cre');
  assert.equal(parseViewFromLocation('', '?view=technical'), 'tech');
  assert.equal(parseViewFromLocation('', ''), 'land');
  assert.equal(viewToHash('tech'), '#tech');
  assert.equal(viewToHash('cre'), '#creative');
  assert.equal(viewToHash('land'), '');
});

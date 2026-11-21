import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMagneticOffset, clampFloatingPreview } from './magneticCard';

const SAMPLE_RECT = { left: 100, top: 200, width: 300, height: 400 };

test('calculateMagneticOffset returns zero at exact card center', () => {
  const offset = calculateMagneticOffset(250, 400, SAMPLE_RECT, 7);
  assert.deepEqual(offset, { x: 0, y: 0 });
});

test('calculateMagneticOffset tracks top-left and bottom-right boundaries', () => {
  assert.deepEqual(calculateMagneticOffset(100, 200, SAMPLE_RECT, 7), { x: -7, y: -7 });
  assert.deepEqual(calculateMagneticOffset(400, 600, SAMPLE_RECT, 7), { x: 7, y: 7 });
});

test('calculateMagneticOffset clamps coordinates outside card bounds', () => {
  assert.deepEqual(calculateMagneticOffset(0, 999, SAMPLE_RECT, 8), { x: -8, y: 8 });
});

test('calculateMagneticOffset handles invalid or zero-sized rects safely', () => {
  assert.deepEqual(calculateMagneticOffset(150, 250, { left: 0, top: 0, width: 0, height: 100 }), {
    x: 0,
    y: 0,
  });
  assert.deepEqual(calculateMagneticOffset(Number.NaN, 250, SAMPLE_RECT), { x: 0, y: 0 });
});

test('clampFloatingPreview flips below cursor near top edge and clamps inside bounds', () => {
  const nearTop = clampFloatingPreview({
    relX: 400,
    relY: 40,
    containerWidth: 1200,
    containerHeight: 540,
  });
  assert.deepEqual(nearTop, { x: 420, y: 66 });

  const nearRightBottom = clampFloatingPreview({
    relX: 1180,
    relY: 510,
    containerWidth: 1200,
    containerHeight: 540,
  });
  assert.deepEqual(nearRightBottom, { x: 908, y: 266 });
});


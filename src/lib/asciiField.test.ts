import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ASCII_FIELD_CONFIG,
  computeAsciiCellState,
  computeAsciiDrift,
  createAsciiGrid,
  getAsciiCellSize,
  mutateRandomAsciiCells,
} from './asciiField';

test('getAsciiCellSize switches between 44px desktop and 34px mobile cells', () => {
  assert.equal(getAsciiCellSize(1440), 44);
  assert.equal(getAsciiCellSize(801), 44);
  assert.equal(getAsciiCellSize(800), 34);
  assert.equal(getAsciiCellSize(390), 34);
});

test('computeAsciiDrift stays within +/- 4px bounds', () => {
  for (let t = 0; t <= 10000; t += 375) {
    const { dx, dy } = computeAsciiDrift(t, 1.2, 2.5, 0.0011, 0.0009);
    assert.ok(dx >= -ASCII_FIELD_CONFIG.maxDriftPx && dx <= ASCII_FIELD_CONFIG.maxDriftPx);
    assert.ok(dy >= -ASCII_FIELD_CONFIG.maxDriftPx && dy <= ASCII_FIELD_CONFIG.maxDriftPx);
  }
});

test('computeAsciiCellState scales font size 11 -> 37px and alpha 0.16 -> 1 within 190px', () => {
  const cell = {
    col: 2,
    row: 2,
    baseX: 200,
    baseY: 200,
    char: '7',
    phaseX: 0,
    phaseY: 0,
    speedX: 0,
    speedY: 0,
  };

  // At pointer center (x = 200, y = 204 due to cos(0)*4 drift)
  const center = computeAsciiCellState({
    cell,
    timeMs: 0,
    pointerX: 200,
    pointerY: 204,
  });
  assert.equal(center.fontSize, 37);
  assert.equal(center.alpha, 1);

  // Far outside 190px radius
  const far = computeAsciiCellState({
    cell,
    timeMs: 0,
    pointerX: 500,
    pointerY: 500,
  });
  assert.equal(far.fontSize, 11);
  assert.equal(far.alpha, 0.16);

  // Mid-radius (95px away)
  const mid = computeAsciiCellState({
    cell,
    timeMs: 0,
    pointerX: 295,
    pointerY: 204,
  });
  assert.ok(mid.fontSize > 11 && mid.fontSize < 37);
  assert.ok(mid.alpha > 0.16 && mid.alpha < 1);
});

test('createAsciiGrid populates cells and mutateRandomAsciiCells updates subset', () => {
  const cells = createAsciiGrid(440, 440, 44);
  assert.ok(cells.length >= 100);

  const before = cells.map((c) => c.char);
  let seq = 0;
  const deterministicRng = () => {
    seq = (seq + 0.17) % 1;
    return seq;
  };
  const mutated = mutateRandomAsciiCells(cells, 5, deterministicRng);
  assert.equal(mutated, 5);
  const changedCount = cells.filter((c, i) => c.char !== before[i]).length;
  assert.ok(changedCount >= 1);
});

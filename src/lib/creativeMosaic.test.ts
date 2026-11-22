import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeMosaicGridDimensions,
  computeMosaicTileValue,
  getMosaicTileSize,
  sampleMosaicBlueColor,
  tileJitter,
} from './creativeMosaic';

test('getMosaicTileSize returns 64px on desktop and 44px on mobile (<= 800px)', () => {
  assert.equal(getMosaicTileSize(1440), 64);
  assert.equal(getMosaicTileSize(801), 64);
  assert.equal(getMosaicTileSize(800), 44);
  assert.equal(getMosaicTileSize(390), 44);
});

test('computeMosaicGridDimensions produces 1-pixel-per-tile integer grid covering viewport', () => {
  const desktop = computeMosaicGridDimensions(1440, 900, 64);
  assert.equal(desktop.cols, 23);
  assert.equal(desktop.rows, 15);

  const mobile = computeMosaicGridDimensions(390, 844, 44);
  assert.equal(mobile.cols, 9);
  assert.equal(mobile.rows, 20);
});

test('sampleMosaicBlueColor transitions from luminous outer-edge white to deep cobalt', () => {
  const outer = sampleMosaicBlueColor(0);
  const seam = sampleMosaicBlueColor(1);

  assert.ok(outer.r > 240 && outer.g > 245 && outer.b > 250);
  assert.ok(seam.b > seam.r * 4 && seam.r < 30);
});

test('computeMosaicTileValue deepens toward the seam and bumps around pointer', () => {
  const nearOuter = computeMosaicTileValue({
    col: 0,
    row: 1,
    cols: 23,
    rows: 15,
    isVertical: false,
    timeSec: 0,
    pointerCol: null,
    pointerRow: null,
    reducedMotion: true,
  });

  const nearSeam = computeMosaicTileValue({
    col: 11,
    row: 7,
    cols: 23,
    rows: 15,
    isVertical: false,
    timeSec: 0,
    pointerCol: null,
    pointerRow: null,
    reducedMotion: true,
  });

  const bumped = computeMosaicTileValue({
    col: 3,
    row: 4,
    cols: 23,
    rows: 15,
    isVertical: false,
    timeSec: 0,
    pointerCol: 3.5,
    pointerRow: 4.5,
    reducedMotion: true,
  });

  const unbumped = computeMosaicTileValue({
    col: 3,
    row: 4,
    cols: 23,
    rows: 15,
    isVertical: false,
    timeSec: 0,
    pointerCol: null,
    pointerRow: null,
    reducedMotion: true,
  });

  assert.ok(nearSeam > nearOuter);
  assert.ok(bumped > unbumped);
  assert.ok(tileJitter(2, 5) >= -1 && tileJitter(2, 5) <= 1);
});

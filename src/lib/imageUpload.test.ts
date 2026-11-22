import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeScaledDimensions,
  estimateDataUrlBytes,
  formatFileSize,
  MAX_RAW_UPLOAD_BYTES,
  validateImageFileMeta,
} from './imageUpload';

test('validateImageFileMeta accepts raster images and rejects SVG or oversized files', () => {
  assert.deepEqual(validateImageFileMeta('image/jpeg', 500_000), { ok: true });
  assert.deepEqual(validateImageFileMeta('image/png', 1_200_000), { ok: true });
  assert.deepEqual(validateImageFileMeta('image/webp', 80_000), { ok: true });

  const svgResult = validateImageFileMeta('image/svg+xml', 1024);
  assert.equal(svgResult.ok, false);

  const htmlResult = validateImageFileMeta('text/html', 1024);
  assert.equal(htmlResult.ok, false);

  const hugeResult = validateImageFileMeta('image/png', MAX_RAW_UPLOAD_BYTES + 1);
  assert.equal(hugeResult.ok, false);

  const emptyResult = validateImageFileMeta('image/jpeg', 0);
  assert.equal(emptyResult.ok, false);
});

test('computeScaledDimensions preserves aspect ratio and never upscales small images', () => {
  assert.deepEqual(computeScaledDimensions(1920, 1080, 960), { width: 960, height: 540 });
  assert.deepEqual(computeScaledDimensions(1080, 1920, 960), { width: 540, height: 960 });
  assert.deepEqual(computeScaledDimensions(400, 300, 960), { width: 400, height: 300 });
});

test('estimateDataUrlBytes and formatFileSize compute accurate human-readable sizes', () => {
  const sample = 'data:image/webp;base64,' + 'A'.repeat(4000);
  assert.equal(estimateDataUrlBytes(sample), 3000);
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(74 * 1024), '74 KB');
  assert.equal(formatFileSize(2.5 * 1024 * 1024), '2.5 MB');
});

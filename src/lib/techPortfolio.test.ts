import test from 'node:test';
import assert from 'node:assert/strict';
import { PROJECTS, TECH_STACK_LOGOS } from '../data/portfolio';
import {
  filterProjectsByFileType,
  getProjectFileCounts,
  resolveProjectPreviewMode,
  validateMarqueeLogos,
} from './techPortfolio';

test('filterProjectsByFileType returns all projects or matches specific file extension', () => {
  assert.equal(filterProjectsByFileType(PROJECTS, 'all').length, 3);
  const apkOnly = filterProjectsByFileType(PROJECTS, '.apk');
  assert.equal(apkOnly.length, 1);
  assert.equal(apkOnly[0].fileName, 'order-analyzer.apk');

  const jarOnly = filterProjectsByFileType(PROJECTS, '.jar');
  assert.equal(jarOnly.length, 1);
  assert.equal(jarOnly[0].fileName, 'pixault.jar');

  const pyOnly = filterProjectsByFileType(PROJECTS, '.py');
  assert.equal(pyOnly.length, 1);
  assert.equal(pyOnly[0].fileName, 'employee-mgr.py');
});

test('getProjectFileCounts computes deterministic counts per file extension', () => {
  const counts = getProjectFileCounts(PROJECTS);
  assert.deepEqual(counts, {
    all: 3,
    '.apk': 1,
    '.jar': 1,
    '.py': 1,
  });
});

test('resolveProjectPreviewMode detects external URLs vs interactive browser preview', () => {
  assert.equal(resolveProjectPreviewMode({ liveUrl: 'https://example.com/demo' }), 'external');
  assert.equal(resolveProjectPreviewMode({ liveUrl: undefined }), 'interactive');
  assert.equal(resolveProjectPreviewMode({ liveUrl: '' }), 'interactive');
});

test('TECH_STACK_LOGOS uses concise single-word labels without long prose', () => {
  assert.equal(validateMarqueeLogos(TECH_STACK_LOGOS), true);
  assert.equal(
    validateMarqueeLogos([
      { id: 'bad', name: 'Long Phrase Here', accent: '#111111' },
    ]),
    false
  );
});

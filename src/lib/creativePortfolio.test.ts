import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CREATIVE_CATEGORIES,
  CREATIVE_PLATFORM_LINKS,
  CREATIVE_TOOLKIT,
  CREATIVE_WORKS,
} from '../data/portfolio';

test('CREATIVE_TOOLKIT entries all define unique logo IDs and concise labels', () => {
  assert.ok(CREATIVE_TOOLKIT.length >= 5);
  const ids = new Set(CREATIVE_TOOLKIT.map((tool) => tool.id));
  assert.equal(ids.size, CREATIVE_TOOLKIT.length);
  for (const tool of CREATIVE_TOOLKIT) {
    assert.ok(tool.name.trim().length > 0);
    assert.ok(tool.role.trim().length > 0);
  }
});

test('CREATIVE_PLATFORM_LINKS includes Fiverr, Portfolio, and social platforms with unique logo IDs', () => {
  const ids = CREATIVE_PLATFORM_LINKS.map((link) => link.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.includes('fiverr'), 'Fiverr link should be present');
  assert.ok(ids.includes('portfolio'), 'Portfolio link should be present');
  assert.ok(ids.includes('instagram'), 'Instagram link should be present');
  assert.ok(ids.includes('linkedin'), 'LinkedIn link should be present');
  assert.ok(ids.includes('github'), 'GitHub link should be present');

  for (const link of CREATIVE_PLATFORM_LINKS) {
    assert.ok(link.href.length > 0);
    assert.ok(link.label.length > 0);
  }
});

test('CREATIVE_WORKS entries remain intact with valid categories and palettes', () => {
  assert.equal(CREATIVE_WORKS.length, 33);
  for (const work of CREATIVE_WORKS) {
    assert.ok(work.title.length > 0);
    assert.ok((CREATIVE_CATEGORIES as readonly string[]).includes(work.category));
    assert.ok(work.palette.length === 0 || work.palette.length >= 3);
  }
});

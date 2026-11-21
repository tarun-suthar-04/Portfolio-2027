import test from 'node:test';
import assert from 'node:assert/strict';
import { CREATIVE_AURA_PRESETS, getAuraPreset } from './landingDeck';

test('CREATIVE_AURA_PRESETS includes indigo, emerald, and orchid presets', () => {
  assert.deepEqual(
    CREATIVE_AURA_PRESETS.map((p) => p.id),
    ['indigo', 'emerald', 'orchid']
  );
});

test('getAuraPreset resolves matching preset and falls back to indigo', () => {
  assert.equal(getAuraPreset('emerald').label, 'Emerald');
  assert.equal(getAuraPreset('orchid').label, 'Orchid');
  assert.equal(getAuraPreset('indigo').label, 'Indigo');
});

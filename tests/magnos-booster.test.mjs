import assert from 'node:assert/strict';
import {
  MAGNOS_INPUT_V,
  MAGNOS_INPUT_LIMIT_A,
  MAGNOS_REFERENCE_RMS_V,
  MAGNOS_REFERENCE_PEAK_V,
  MAGNOS_TBD_TARGET_V,
  magnosBank,
} from '../magnos-booster.mjs';

assert.equal(MAGNOS_INPUT_V, 5);
assert.equal(MAGNOS_INPUT_LIMIT_A, 1);
assert.ok(Math.abs(MAGNOS_REFERENCE_PEAK_V - MAGNOS_REFERENCE_RMS_V * Math.SQRT2) < 1e-9);
assert.ok(MAGNOS_REFERENCE_PEAK_V > 40_000 && MAGNOS_REFERENCE_PEAK_V < 45_000);

const reference = magnosBank({ count: 1, targetV: MAGNOS_REFERENCE_PEAK_V, loadOhm: 1e24 });
assert.ok(Math.abs(reference.outputV - MAGNOS_REFERENCE_PEAK_V) < 1e-6);
assert.ok(reference.outputW <= reference.availableW + 1e-12);
assert.ok(reference.inputW <= MAGNOS_INPUT_V * MAGNOS_INPUT_LIMIT_A + 1e-12);

const tbd = magnosBank({ count: 4, targetV: MAGNOS_TBD_TARGET_V, loadOhm: 1e24 });
assert.ok(Math.abs(tbd.outputV - MAGNOS_TBD_TARGET_V) < 1e-6);
assert.ok(tbd.outputW <= tbd.availableW + 1e-12);
assert.ok(tbd.chainEfficiency < reference.chainEfficiency);

console.log('magnos-booster tests passed');

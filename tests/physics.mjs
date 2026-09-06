import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.mjs';
const source = fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const context = vm.createContext({ THREE, assert, console });
vm.runInContext(source.slice(0, source.indexOf('const viewport =')).replace(/^import .*;$/gm, ''), context);
vm.runInContext(`
for (const e of [0, 0.01, 0.206, 0.9]) {
  for (const M of [-Math.PI, -1, 0, 1, Math.PI - 1e-8]) {
    const E = solveKepler(M, e);
    assert.ok(Math.abs(E - e * Math.sin(E) - M) < 1e-11);
  }
}
assert.equal(julianDay(new Date('2000-01-01T12:00:00Z')), J2000_JD);
for (const def of BODY_DEFINITIONS.filter(d => d.elements)) {
  const state = heliocentricStateFromElements(def, new Date('2000-01-01T12:00:00Z'));
  const r = state.position.length(), v2 = state.velocity.lengthSq();
  const a = state.elements.a * AU, e = state.elements.e;
  assert.ok(r >= a * (1-e) - 1 && r <= a * (1+e) + 1, def.name);
  assert.ok(Math.abs((v2 / 2 - SUN_MU / r) / (-SUN_MU / (2*a)) - 1) < 1e-12);
}
// JPL worked-example Earth position at J2000, AU; Y-up swaps ecliptic y/z.
const earth = heliocentricStateFromElements(bodyDefinition('Earth'), new Date('2000-01-01T12:00:00Z')).position.multiplyScalar(1/AU);
assert.ok(Math.abs(earth.x + 0.177171) < 2e-5);
assert.ok(Math.abs(earth.z - 0.967214) < 2e-5);
console.log('PASS: Kepler residuals, epoch, all planet bounds/energy, Earth reference');
`, context);

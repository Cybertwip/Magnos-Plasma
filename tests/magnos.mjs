import assert from 'node:assert/strict';
import {magnosBooster} from '../magnos-booster.mjs';
for (const gain of [1, 10, 6000, 1e6]) {
  for (const loadOhm of [1, 1000, 1e6, 1e9]) {
    const b = magnosBooster({gain, loadOhm});
    assert.ok(b.outputW <= 4 + 1e-12);
    assert.ok(b.inputA <= 1 + 1e-12);
    assert.ok(Math.abs(b.inputW-b.outputW-b.lossW) < 1e-12);
    assert.ok(Math.abs(b.outputV/b.outputA-loadOhm) < 1e-6);
  }
}
assert.equal(magnosBooster({gain:6000}).outputV,30000);
assert.equal(magnosBooster({gain:6000,loadOhm:1000}).limited,true);
assert.equal(magnosBooster({inputV:0}).outputW,0);
assert.throws(()=>magnosBooster({inputV:6}),RangeError);
assert.throws(()=>magnosBooster({loadOhm:0}),RangeError);
console.log('PASS: Magnos power conservation, current ceiling, load regulation, zero supply, invalid inputs');

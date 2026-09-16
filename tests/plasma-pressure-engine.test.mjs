import assert from 'node:assert/strict';
import { evToKelvin, plasmaPressurePa, pressureNozzleState, ARGON_ION_MASS_KG } from '../plasma-pressure-engine.mjs';

const n = 1e17;
const TeK = evToKelvin(30_000);
const TiK = evToKelvin(10_000);
const p = plasmaPressurePa({ numberDensityM3: n, electronTemperatureK: TeK, ionTemperatureK: TiK });
assert.ok(p > 600 && p < 700, `expected ~641 Pa, got ${p}`);

const open = pressureNozzleState({
  availableBeamPowerW: 1e12,
  numberDensityM3: n,
  electronTemperatureK: TeK,
  ionTemperatureK: TiK,
  exhaustVelocityMps: 1.5e6,
  exitAreaM2: 0.25,
  ionMassKg: ARGON_ION_MASS_KG,
  propellantRemainingKg: 20_000,
  dtSeconds: 1,
  exhaustEnabled: true,
});
assert.ok(open.massFlowKgS > 0);
assert.ok(open.pressureThrustN > 0);
assert.equal(open.thrustN, open.momentumThrustN + open.pressureThrustN);
assert.ok(open.jetPowerW <= 1e12 + 1e-6);

const sealed = pressureNozzleState({
  availableBeamPowerW: 1e12,
  numberDensityM3: n,
  electronTemperatureK: TeK,
  ionTemperatureK: TiK,
  exhaustVelocityMps: 1.5e6,
  exitAreaM2: 0.25,
  ionMassKg: ARGON_ION_MASS_KG,
  propellantRemainingKg: 20_000,
  dtSeconds: 1,
  exhaustEnabled: false,
});
assert.equal(sealed.massFlowKgS, 0);
assert.equal(sealed.thrustN, 0);
assert.equal(sealed.propellantUsedKg, 0);

const empty = pressureNozzleState({
  availableBeamPowerW: 1e12,
  numberDensityM3: n,
  electronTemperatureK: TeK,
  ionTemperatureK: TiK,
  exhaustVelocityMps: 1.5e6,
  exitAreaM2: 0.25,
  ionMassKg: ARGON_ION_MASS_KG,
  propellantRemainingKg: 0,
  dtSeconds: 1,
});
assert.equal(empty.thrustN, 0);
assert.equal(empty.massFlowKgS, 0);

const capped = pressureNozzleState({
  availableBeamPowerW: 1e12,
  numberDensityM3: n,
  electronTemperatureK: TeK,
  ionTemperatureK: TiK,
  exhaustVelocityMps: 1.5e6,
  exitAreaM2: 0.25,
  ionMassKg: ARGON_ION_MASS_KG,
  propellantRemainingKg: 20_000,
  dtSeconds: 1,
  maximumThrustN: 1000,
});
assert.ok(capped.thrustN <= 1000 + 1e-9);

console.log('plasma-pressure-engine tests passed');

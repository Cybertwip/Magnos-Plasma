// Reduced-order behavioral envelope for the attached Magnos plasma schematic.
// Source annotations used by the simulator:
//   - External input ceiling: 5 V / 1 A
//   - Annotated HV node: ~30 kVAC at 250 Hz -> ~42.43 kV peak for a sine wave
//   - Separate booster block: target 1e+07 V / TBD
//
// The 87 mA text attached to the 30 kVAC node is retained as a schematic
// annotation only. 30 kVAC * 87 mA is far above the 5 W input ceiling, so this
// model never treats that current as available from the 5 V / 1 A source unless
// another energy source is explicitly modeled.

export const MAGNOS_INPUT_V = 5;
export const MAGNOS_INPUT_LIMIT_A = 1;
export const MAGNOS_REFERENCE_RMS_V = 30_000;
export const MAGNOS_REFERENCE_PEAK_V = MAGNOS_REFERENCE_RMS_V * Math.SQRT2;
export const MAGNOS_REFERENCE_FREQUENCY_HZ = 250;
export const MAGNOS_SCHEMATIC_CURRENT_ANNOTATION_A = 0.087;
export const MAGNOS_TBD_TARGET_V = 10_000_000;

export function magnosBooster({
  inputV = MAGNOS_INPUT_V,
  inputLimitA = MAGNOS_INPUT_LIMIT_A,
  gain = 1,
  loadOhm = 1e9,
  efficiency = 0.8,
} = {}) {
  if (![inputV, inputLimitA, gain, loadOhm, efficiency].every(Number.isFinite)
      || inputV < 0 || inputV > MAGNOS_INPUT_V
      || inputLimitA < 0 || inputLimitA > MAGNOS_INPUT_LIMIT_A
      || gain < 1 || loadOhm <= 0 || efficiency <= 0 || efficiency > 1) {
    throw new RangeError('Expected 0–5 V, 0–1 A, gain >= 1, positive load and efficiency in (0,1].');
  }

  const availableW = inputV * inputLimitA * efficiency;
  const demandedV = inputV * gain;
  const outputV = Math.min(demandedV, Math.sqrt(availableW * loadOhm));
  const outputA = outputV / loadOhm;
  const outputW = outputV * outputA;
  const inputW = outputW / efficiency;

  return {
    outputV,
    outputA,
    outputW,
    inputW,
    lossW: inputW - outputW,
    inputA: inputV > 0 ? inputW / inputV : 0,
    limited: outputV < demandedV,
    availableW,
    demandedV,
  };
}

// Cascaded isolated converter envelope. `targetV` is a voltage target, not an
// assertion that the attached circuit can safely withstand or deliver it.
// Stage count reduces the ideal source budget through the assumed efficiency.
export function magnosBank({ count = 1, targetV = MAGNOS_REFERENCE_PEAK_V, loadOhm = 1e24, efficiency = 0.8 } = {}) {
  if (!Number.isInteger(count) || count < 1 || count > 8
      || !Number.isFinite(targetV) || targetV < MAGNOS_INPUT_V
      || !Number.isFinite(loadOhm) || loadOhm <= 0
      || !(efficiency > 0 && efficiency <= 1)) {
    throw new RangeError('Expected 1–8 boosters, voltage >=5 V, positive load and efficiency in (0,1].');
  }
  const chainEfficiency = efficiency ** (count + 1);
  const unit = magnosBooster({
    gain: targetV / MAGNOS_INPUT_V,
    loadOhm,
    efficiency: chainEfficiency,
  });
  return {
    ...unit,
    count,
    targetV,
    chainEfficiency,
    referencePeakV: MAGNOS_REFERENCE_PEAK_V,
    referenceRmsV: MAGNOS_REFERENCE_RMS_V,
  };
}

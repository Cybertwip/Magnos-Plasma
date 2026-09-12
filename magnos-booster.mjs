// Behavioral envelope for reference/magnos-beta-5.0-alpha.kicad_sch.
// Input 5 V / 1 A is a source annotation, not a measured rating.
// Gain, load and efficiency are explicit assumptions; this does not solve
// the reference's switching waveforms, transformer saturation or insulation.
export function magnosBooster({ inputV = 5, inputLimitA = 1, gain = 1, loadOhm = 1e9, efficiency = 0.8 } = {}) {
  if (![inputV, inputLimitA, gain, loadOhm, efficiency].every(Number.isFinite)
      || inputV < 0 || inputV > 5 || inputLimitA < 0 || inputLimitA > 1
      || gain < 1 || loadOhm <= 0 || efficiency <= 0 || efficiency > 1) {
    throw new RangeError('Expected 0–5 V, 0–1 A, gain >= 1, positive load and efficiency in (0,1].');
  }
  const availableW = inputV * inputLimitA * efficiency;
  const demandedV = inputV * gain;
  const outputV = Math.min(demandedV, Math.sqrt(availableW * loadOhm));
  const outputA = outputV / loadOhm;
  const outputW = outputV * outputA;
  const inputW = outputW / efficiency;
  return { outputV, outputA, outputW, inputW, lossW: inputW - outputW,
    inputA: inputV > 0 ? inputW / inputV : 0,
    limited: outputV < demandedV, availableW };
}

// Cascaded isolated converters, supplied by the original 5 W source.
// One 80%-efficient beta front end plus N assumed 80%-efficient stages.
// Voltage targets are hypotheses; no insulation rating is implied.
export function magnosBank({count=1,targetV=1e7,loadOhm=1e24,efficiency=0.8}={}) {
  if (!Number.isInteger(count) || count<1 || count>8 || !Number.isFinite(targetV) || targetV<5 || !Number.isFinite(loadOhm) || loadOhm<=0 || !(efficiency>0 && efficiency<=1)) throw new RangeError('Expected 1–8 boosters, voltage >=5 V, positive load and efficiency in (0,1]');
  const unit=magnosBooster({gain:targetV/5,loadOhm,efficiency:efficiency**(count+1)});
  return {...unit,count,targetV};
}

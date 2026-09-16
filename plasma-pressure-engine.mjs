export const BOLTZMANN_J_K = 1.380649e-23;
export const ATOMIC_MASS_UNIT_KG = 1.66053906660e-27;
export const EV_TO_K = 11604.518121550082;

export const ARGON_ION_MASS_KG = 39.948 * ATOMIC_MASS_UNIT_KG;

export function evToKelvin(ev) {
  if (!Number.isFinite(ev) || ev < 0) throw new RangeError('Temperature in eV must be finite and nonnegative.');
  return ev * EV_TO_K;
}

export function plasmaPressurePa({ numberDensityM3, electronTemperatureK, ionTemperatureK }) {
  if (![numberDensityM3, electronTemperatureK, ionTemperatureK].every(Number.isFinite)
      || numberDensityM3 < 0 || electronTemperatureK < 0 || ionTemperatureK < 0) {
    throw new RangeError('Plasma density and temperatures must be finite and nonnegative.');
  }
  return numberDensityM3 * BOLTZMANN_J_K * (electronTemperatureK + ionTemperatureK);
}

/**
 * Reduced-order, open magnetic-nozzle plasma engine.
 *
 * Requested chamber state:
 *   p_e = n k_B (T_e + T_i)
 *   mdot = n m_i v_e A_e
 *   F = mdot v_e + p_e A_e   (ambient pressure p_a = 0)
 *
 * The requested state is uniformly scaled when electrical beam power, finite
 * propellant inventory, a guidance thrust cap, or a closed exhaust prevents it
 * from being sustained. This deliberately gives zero sustained external thrust
 * when the nozzle is closed: chamber pressure may exist internally, but without
 * mass leaving the vehicle there is no continuous reaction force.
 */
export function pressureNozzleState({
  availableBeamPowerW = 0,
  numberDensityM3 = 0,
  electronTemperatureK = 0,
  ionTemperatureK = 0,
  exhaustVelocityMps = 0,
  exitAreaM2 = 0,
  ionMassKg = ARGON_ION_MASS_KG,
  propellantRemainingKg = Infinity,
  dtSeconds = 0,
  maximumThrustN = Infinity,
  exhaustEnabled = true,
} = {}) {
  const finiteNonnegative = [
    availableBeamPowerW,
    numberDensityM3,
    electronTemperatureK,
    ionTemperatureK,
    exhaustVelocityMps,
    exitAreaM2,
    ionMassKg,
    dtSeconds,
  ].every(Number.isFinite);

  if (!finiteNonnegative
      || availableBeamPowerW < 0
      || numberDensityM3 < 0
      || electronTemperatureK < 0
      || ionTemperatureK < 0
      || exhaustVelocityMps < 0
      || exitAreaM2 < 0
      || ionMassKg <= 0
      || dtSeconds < 0
      || !(maximumThrustN >= 0)
      || !(propellantRemainingKg >= 0)) {
    throw new RangeError('Pressure-nozzle inputs must be finite/nonnegative; ion mass must be positive.');
  }

  const chamberPressureRequestedPa = plasmaPressurePa({
    numberDensityM3,
    electronTemperatureK,
    ionTemperatureK,
  });

  const open = Boolean(exhaustEnabled && exhaustVelocityMps > 0 && exitAreaM2 > 0);
  const requestedMassFlowKgS = open
    ? numberDensityM3 * ionMassKg * exhaustVelocityMps * exitAreaM2
    : 0;
  const requestedMomentumThrustN = open
    ? requestedMassFlowKgS * exhaustVelocityMps
    : 0;
  const requestedPressureThrustN = open
    ? chamberPressureRequestedPa * exitAreaM2
    : 0;
  const requestedThrustN = requestedMomentumThrustN + requestedPressureThrustN;

  // Directed kinetic-energy flux plus pressure work at the open nozzle exit.
  // This caps the chamber state to the power actually available rather than
  // treating p_e A_e as a free extra force.
  const requestedJetPowerW = open
    ? 0.5 * requestedMassFlowKgS * exhaustVelocityMps ** 2
      + requestedPressureThrustN * exhaustVelocityMps
    : 0;

  let stateScale = open ? 1 : 0;
  if (requestedJetPowerW > 0) {
    stateScale = Math.min(stateScale, availableBeamPowerW / requestedJetPowerW);
  } else if (requestedThrustN > 0) {
    stateScale = 0;
  }

  if (requestedThrustN > 0 && Number.isFinite(maximumThrustN)) {
    stateScale = Math.min(stateScale, maximumThrustN / requestedThrustN);
  }

  if (requestedMassFlowKgS > 0 && Number.isFinite(propellantRemainingKg)) {
    if (propellantRemainingKg <= 0) {
      stateScale = 0;
    } else if (dtSeconds > 0) {
      stateScale = Math.min(
        stateScale,
        propellantRemainingKg / (requestedMassFlowKgS * dtSeconds),
      );
    }
  }

  stateScale = Math.max(0, Math.min(1, stateScale));

  const effectiveNumberDensityM3 = numberDensityM3 * stateScale;
  const chamberPressurePa = chamberPressureRequestedPa * stateScale;
  const massFlowKgS = requestedMassFlowKgS * stateScale;
  const momentumThrustN = requestedMomentumThrustN * stateScale;
  const pressureThrustN = requestedPressureThrustN * stateScale;
  const thrustN = momentumThrustN + pressureThrustN;
  const jetPowerW = requestedJetPowerW * stateScale;
  const propellantUsedKg = dtSeconds > 0 ? Math.min(propellantRemainingKg, massFlowKgS * dtSeconds) : 0;

  return {
    exhaustEnabled: open,
    stateScale,
    requestedNumberDensityM3: numberDensityM3,
    effectiveNumberDensityM3,
    chamberPressureRequestedPa,
    chamberPressurePa,
    requestedMassFlowKgS,
    massFlowKgS,
    requestedMomentumThrustN,
    momentumThrustN,
    requestedPressureThrustN,
    pressureThrustN,
    requestedThrustN,
    thrustN,
    requestedJetPowerW,
    jetPowerW,
    propellantUsedKg,
    powerLimited: requestedJetPowerW > availableBeamPowerW + 1e-9,
    propellantLimited: Number.isFinite(propellantRemainingKg)
      && dtSeconds > 0
      && requestedMassFlowKgS * Math.min(1, availableBeamPowerW / Math.max(requestedJetPowerW, 1e-30)) * dtSeconds > propellantRemainingKg + 1e-12,
    thrustLimited: Number.isFinite(maximumThrustN) && requestedThrustN * stateScale >= maximumThrustN - 1e-9,
  };
}

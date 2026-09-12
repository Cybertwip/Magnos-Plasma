import * as THREE from "./vendor/three.mjs";
import { magnosBooster, magnosBank } from "./magnos-booster.mjs";
import { solveLambert, gravityAssist, hohmannTime, planPoweredTransfer, interstellarEnvelope, magneticBrake } from "./transfer-planner.mjs";

// three.mjs is intentionally a minimal export wrapper. These are the numeric
// constants used by Three.js for material side selection.
const THREE_BACK_SIDE = 1;
const THREE_DOUBLE_SIDE = 2;

// -----------------------------------------------------------------------------
// Physical constants (SI)
// -----------------------------------------------------------------------------
const G = 6.67430e-11;
const C = 299_792_458;
const EARTH_G0 = 9.80665;
const AU = 149_597_870_700;
const DAY = 86_400;
const YEAR = 365.25 * DAY;
const J2000_JD = 2_451_545.0;
const SUN_MU = 1.3271244e20;
const SUN_MASS = SUN_MU / G;
const SUN_RADIUS_M = 695_700_000;
const LY_M = 9.4607304725808e15;
const ALPHA_CENTAURI_DISTANCE_LY = 4.37; // Alpha Centauri A/B; Proxima is nearer
const DISPLAY_UNITS_PER_AU = 10;
const MAX_TRAIL_POINTS = 900;
const MAX_ROCKET_TRAIL_POINTS = 1400;
const PLASMA_CRUISE_START_AU = 35;
const SOLAR_SYSTEM_EXIT_AU = 120;
const INTERSTELLAR_VIEW_AU = 120;

// During planetary transfers the plasma drive is used in short, high-power
// momentum-building burns instead of waiting until heliocentric escape.  The
// trajectory remains a reduced-order patched-conic planner, but each leg now
// includes the engine's thermally-limited thrust in both transfer time and
// encounter v-infinity.  The short burn window prevents the optimizer from
// unrealistically applying multi-terawatt thrust continuously for months while
// still making propulsion materially affect the best gravity-assist route.
const ASSIST_PLASMA_BURN_WINDOW_S = 3 * 3600;
const ASSIST_PLASMA_PATH_EFFICIENCY = 0.88;
const ASSIST_PLASMA_AVG_SPEED_FACTOR = 0.35;
const MAX_ASSIST_ENCOUNTERS = 5;
const INTERSTELLAR_RENDER_LENGTH = 420;
const ALPHA_TARGET_DISTANCE_M = ALPHA_CENTAURI_DISTANCE_LY * LY_M;

// Plasma-drive, Casimir and thermal model constants. The plasma engine is a
// power-limited educational model: the magnetic coil follows L dI/dt = V - IR,
// while the accelerator power is V_accel * I_plasma. Casimir pressure is
// displayed as an internal plate stress only; a closed Casimir structure does
// not create net external thrust.
const MU0 = 4 * Math.PI * 1e-7;
const HBAR = 1.054571817e-34;
const STEFAN_BOLTZMANN = 5.670374419e-8;
const CMB_TEMPERATURE_K = 2.725;
const SOLAR_CONSTANT_W_M2 = 1361;

const SPACECRAFT_MASS_KG = 60_000;
const PLASMA_ACCELERATOR_VOLTAGE_V = 10_000_000; // hardware ceiling; thermal governor normally limits below this
const PLASMA_EFFICIENCY = 0.75;
const PLASMA_EXHAUST_VELOCITY_M_S = 1.5e6;
const COIL_RESISTANCE_OHM = 0.004;
const COIL_INDUCTANCE_H = 50;
const COIL_TURNS = 180;
const COIL_LENGTH_M = 2.5;
const COIL_DRIVE_VOLTAGE_V = 20_000;
const COIL_FIELD_LIMIT_T = 20;
const COIL_CURRENT_LIMIT_A = COIL_FIELD_LIMIT_T * COIL_LENGTH_M / (MU0 * COIL_TURNS);

const RADIATOR_AREA_MIN_M2 = 120_000;
const RADIATOR_AREA_MAX_M2 = 3_200_000;
const RADIATOR_TARGET_K = 1_216;
const THERMAL_TARGET_FRACTION = 0.795;
const THERMAL_HARD_FRACTION = 0.80;
const COIL_LIMIT_K = 1_650;
const REACTOR_LIMIT_K = 2_450;
const RADIATOR_LIMIT_K = 1_600;
const HULL_LIMIT_K = 1_600;
const RADIATOR_WASTE_FRACTION = 0.99985;
const HULL_WASTE_FRACTION = 0.00015;
const RADIATOR_EMISSIVITY = 0.92;
const HULL_RADIATING_AREA_M2 = 450;
const HULL_SOLAR_AREA_M2 = 80;
const HULL_ABSORPTIVITY = 0.12;
const HULL_EMISSIVITY = 0.85;
const RADIATOR_HEAT_CAPACITY_J_K = 8.0e9;
const HULL_HEAT_CAPACITY_J_K = 7.0e8;
const COIL_THERMAL_CONDUCTANCE_W_K = 5.0e6;
const REACTOR_THERMAL_CONDUCTANCE_W_K = 5.0e8;
const AVIONICS_HEAT_W = 500_000;
const CASIMIR_AREA_M2 = 25;

// Active electromagnetic heat-shield model. The reduced-order MHD closure is
// adapted from the uploaded LEO plasma-shield simulator:
//   E_motional = v * B
//   J_motional = sigma * E_motional
//   N = sigma * B^2 * delta / (rho * v)
// followed by MHD attenuation and the same small Joule/electrode heat-return
// fractions. In interstellar cruise the conductive sheath is intentionally
// seeded by the onboard plasma drive; otherwise deep-space gas is far too
// tenuous to behave like the re-entry plasma used by the source model.
const PROTON_MASS_KG = 1.67262192369e-27;
const SOLAR_WIND_NUMBER_DENSITY_1AU_M3 = 5.0e6;
const INTERSTELLAR_NUMBER_DENSITY_M3 = 1.0e5;
const SOLAR_WIND_SPEED_M_S = 400_000;

const SHIELD_AREA_M2 = 180;
const SHIELD_RADIATING_AREA_M2 = 300;
const SHIELD_EMISSIVITY = 0.94;
const SHIELD_SOLAR_ABSORPTIVITY = 0.08;
const SHIELD_HEAT_CAPACITY_J_K = 1.2e9;
const SHIELD_LIMIT_K = 2_400;

const SHIELD_SHEATH_THICKNESS_M = 0.05;
const SHIELD_ELECTRODE_GAP_M = 0.012;
const SHIELD_DUTY_CYCLE = 0.10;
const SHIELD_CONDUCTIVITY_FLOOR_S_M = 1.0e-4;
const SHIELD_CONDUCTIVITY_PEAK_S_M = 3.5;
const SHIELD_MAX_CONDUCTIVITY_S_M = 8.0;
const SHIELD_MAX_ATTENUATION = 0.65;
const SHIELD_MHD_GAIN = 80;
const SHIELD_VOLTAGE_CHARACTERISTIC_V = 16_000;
const SHIELD_ELECTRODE_VOLTAGE_V = 40_000;
const SHIELD_MAX_ELECTRODE_CURRENT_A_M2 = 5_000;
const SHIELD_MAX_MOTIONAL_CURRENT_A_M2 = 50_000;
const SHIELD_JOULE_RETURN_FRACTION = 0.005;
const SHIELD_ELECTRODE_LOSS_RETURN_FRACTION = 0.0002;

// JPL approximate Keplerian elements and rates, Table 1 (1800 AD–2050 AD).
// Masses and mean radii are from JPL Planetary Physical Parameters.
const BODY_DEFINITIONS = [
  {
    name: "Sol",
    mass: SUN_MASS,
    radiusM: SUN_RADIUS_M,
    color: 0xffd26a,
    elements: null,
  },
  {
    name: "Mercury",
    mass: 0.330103e24,
    radiusM: 2_439.4e3,
    color: 0xa7a29a,
    elements: {
      a0: 0.38709927, a1: 0.00000037,
      e0: 0.20563593, e1: 0.00001906,
      i0: 7.00497902, i1: -0.00594749,
      L0: 252.25032350, L1: 149472.67411175,
      peri0: 77.45779628, peri1: 0.16047689,
      node0: 48.33076593, node1: -0.12534081,
    },
  },
  {
    name: "Venus",
    mass: 4.86731e24,
    radiusM: 6_051.8e3,
    color: 0xe7c46f,
    elements: {
      a0: 0.72333566, a1: 0.00000390,
      e0: 0.00677672, e1: -0.00004107,
      i0: 3.39467605, i1: -0.00078890,
      L0: 181.97909950, L1: 58517.81538729,
      peri0: 131.60246718, peri1: 0.00268329,
      node0: 76.67984255, node1: -0.27769418,
    },
  },
  {
    name: "Earth",
    mass: 5.97217e24,
    radiusM: 6_371.0084e3,
    color: 0x4b96ff,
    elements: {
      a0: 1.00000261, a1: 0.00000562,
      e0: 0.01671123, e1: -0.00004392,
      i0: -0.00001531, i1: -0.01294668,
      L0: 100.46457166, L1: 35999.37244981,
      peri0: 102.93768193, peri1: 0.32327364,
      node0: 0.0, node1: 0.0,
    },
  },
  {
    name: "Mars",
    mass: 0.641691e24,
    radiusM: 3_389.50e3,
    color: 0xd75b38,
    elements: {
      a0: 1.52371034, a1: 0.00001847,
      e0: 0.09339410, e1: 0.00007882,
      i0: 1.84969142, i1: -0.00813131,
      L0: -4.55343205, L1: 19140.30268499,
      peri0: -23.94362959, peri1: 0.44441088,
      node0: 49.55953891, node1: -0.29257343,
    },
  },
  {
    name: "Jupiter",
    mass: 1898.125e24,
    radiusM: 69_911e3,
    color: 0xd8ad76,
    elements: {
      a0: 5.20288700, a1: -0.00011607,
      e0: 0.04838624, e1: -0.00013253,
      i0: 1.30439695, i1: -0.00183714,
      L0: 34.39644051, L1: 3034.74612775,
      peri0: 14.72847983, peri1: 0.21252668,
      node0: 100.47390909, node1: 0.20469106,
    },
  },
  {
    name: "Saturn",
    mass: 568.317e24,
    radiusM: 58_232e3,
    color: 0xe2cb8b,
    elements: {
      a0: 9.53667594, a1: -0.00125060,
      e0: 0.05386179, e1: -0.00050991,
      i0: 2.48599187, i1: 0.00193609,
      L0: 49.95424423, L1: 1222.49362201,
      peri0: 92.59887831, peri1: -0.41897216,
      node0: 113.66242448, node1: -0.28867794,
    },
  },
  {
    name: "Uranus",
    mass: 86.8099e24,
    radiusM: 25_362e3,
    color: 0x8ad4e8,
    elements: {
      a0: 19.18916464, a1: -0.00196176,
      e0: 0.04725744, e1: -0.00004397,
      i0: 0.77263783, i1: -0.00242939,
      L0: 313.23810451, L1: 428.48202785,
      peri0: 170.95427630, peri1: 0.40805281,
      node0: 74.01692503, node1: 0.04240589,
    },
  },
  {
    name: "Neptune",
    mass: 102.4092e24,
    radiusM: 24_622e3,
    color: 0x5575ec,
    elements: {
      a0: 30.06992276, a1: 0.00026291,
      e0: 0.00859048, e1: 0.00005105,
      i0: 1.77004347, i1: 0.00035372,
      L0: -55.12002969, L1: 218.45945325,
      peri0: 44.96476227, peri1: -0.32241464,
      node0: 131.78422574, node1: -0.00508664,
    },
  },
];

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = value => {
  const x = clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
};
const smootherstep = value => {
  const x = clamp(value, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const radians = degrees => degrees * Math.PI / 180;
const wrapDegrees = degrees => ((degrees % 360) + 360) % 360;
const metersToRender = meters => meters / AU * DISPLAY_UNITS_PER_AU;
const renderVector = vector => vector.clone().multiplyScalar(DISPLAY_UNITS_PER_AU / AU);

function formatNumber(value, digits = 2) {
  return Number.isFinite(value)
    ? value.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits })
    : "—";
}

function formatDistanceMeters(value) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 0.01 * AU) return `${formatNumber(value / AU, 4)} AU`;
  if (value >= 1e9) return `${formatNumber(value / 1e9, 3)} million km`;
  return `${formatNumber(value / 1e3, 0)} km`;
}


function formatPower(valueW) {
  if (!Number.isFinite(valueW)) return "—";
  if (Math.abs(valueW) >= 1e12) return `${formatNumber(valueW / 1e12, 3)} TW`;
  if (Math.abs(valueW) >= 1e9) return `${formatNumber(valueW / 1e9, 2)} GW`;
  if (Math.abs(valueW) >= 1e6) return `${formatNumber(valueW / 1e6, 2)} MW`;
  return `${formatNumber(valueW / 1e3, 2)} kW`;
}
function formatSpeed(value) {
  return Number.isFinite(value) ? `${formatNumber(value / 1000, 3)} km/s` : "—";
}

function formatElapsed(seconds) {
  const days = seconds / DAY;
  if (days < 365.25) return `${formatNumber(days, 2)} days`;
  return `${formatNumber(days / 365.25, 3)} years`;
}

function formatEarthYears(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const years = seconds / YEAR;
  const digits = years >= 1000 ? 6 : years >= 1 ? 8 : 10;
  return `${formatNumber(years, digits)} Earth yr`;
}

function lorentzGamma(speed) {
  if (!Number.isFinite(speed) || speed < 0) return 1;
  const beta2 = clamp((speed * speed) / (C * C), 0, 1 - 1e-15);
  return 1 / Math.sqrt(1 - beta2);
}

function properTimeStep(coordinateDt, speed) {
  return coordinateDt / lorentzGamma(speed);
}

function casimirPressurePa(gapM) {
  const d = Math.max(gapM, 1e-12);
  return Math.PI ** 2 * HBAR * C / (240 * d ** 4);
}

function casimirForceN(gapM) {
  return casimirPressurePa(gapM) * CASIMIR_AREA_M2;
}

function ambientPlasmaDensityKgM3(solarDistanceM) {
  const rAu = Math.max(solarDistanceM / AU, 0.02);
  const solarWindDensity = (
    SOLAR_WIND_NUMBER_DENSITY_1AU_M3
    * PROTON_MASS_KG
    / (rAu * rAu)
  );
  const interstellarFloor = INTERSTELLAR_NUMBER_DENSITY_M3 * PROTON_MASS_KG;
  return Math.max(interstellarFloor, solarWindDensity);
}

function relativisticParticleHeatFluxWm2(densityKgM3, speedMps) {
  const speed = clamp(Math.abs(speedMps), 0, 0.999999999 * C);
  const gamma = lorentzGamma(speed);
  // Kinetic-energy flux of the impinging ionized medium. This becomes
  // 0.5*rho*v^3 in the low-speed limit.
  return Math.max(0, densityKgM3 * speed * (gamma - 1) * C * C);
}

function emfHeatShieldResponse({
  particleHeatFluxWm2,
  densityKgM3,
  speedMps,
  magneticFieldT,
  driveCommand,
}) {
  const speed = Math.max(Math.abs(speedMps), 1);
  const density = Math.max(densityKgM3, 1e-30);
  const fieldT = Math.max(magneticFieldT, 0);
  const commandBase = clamp(driveCommand, 0, 1);

  // Preserve the source model's heat activation window. When it activates in
  // deep space, the spacecraft injects conductive plasma into the sheath so
  // the MHD equations have a conducting medium to act on.
  const heatActivation = clamp(
    (particleHeatFluxWm2 - 100_000) / 1_200_000,
    0,
    1,
  );
  const command = commandBase * heatActivation;

  const optimumDensity = 2.5e-3;
  const densityWidth = 0.90;
  const densityDistance = Math.log10(density) - Math.log10(optimumDensity);
  const densityWindow = Math.exp(-((densityDistance / densityWidth) ** 2));

  const sourceConductivity = (
    SHIELD_CONDUCTIVITY_FLOOR_S_M
    + SHIELD_CONDUCTIVITY_PEAK_S_M
      * (heatActivation ** 1.25)
      * densityWindow
  );
  // Seeded sheath term: this is an explicit spacecraft-system assumption,
  // not a claim that interstellar vacuum has atmospheric conductivity.
  const seededConductivity = SHIELD_CONDUCTIVITY_PEAK_S_M * heatActivation * commandBase;
  const conductivity = clamp(
    Math.max(sourceConductivity, seededConductivity),
    SHIELD_CONDUCTIVITY_FLOOR_S_M,
    SHIELD_MAX_CONDUCTIVITY_S_M,
  );

  const voltageV = SHIELD_ELECTRODE_VOLTAGE_V * command;
  const electricFieldVm = voltageV / Math.max(SHIELD_ELECTRODE_GAP_M, 1e-6);
  const rawElectrodeCurrentAm2 = conductivity * electricFieldVm;
  const electrodeCurrentAm2 = Math.min(
    rawElectrodeCurrentAm2,
    SHIELD_MAX_ELECTRODE_CURRENT_A_M2,
  );

  // Uploaded model's motional EMF law.
  const motionalFieldVm = speed * fieldT;
  const rawMotionalCurrentAm2 = conductivity * motionalFieldVm;
  const motionalCurrentAm2 = Math.min(
    rawMotionalCurrentAm2,
    SHIELD_MAX_MOTIONAL_CURRENT_A_M2,
  );

  const voltageClosure = voltageV > 0
    ? 0.08 + 0.92 * voltageV / (voltageV + SHIELD_VOLTAGE_CHARACTERISTIC_V)
    : 0.08;
  const currentClosure = rawMotionalCurrentAm2 > 1e-12
    ? motionalCurrentAm2 / rawMotionalCurrentAm2
    : 0;

  const interactionParameter = (
    conductivity
    * fieldT ** 2
    * SHIELD_SHEATH_THICKNESS_M
    / (density * speed)
  );
  const pulseCoupling = 0.25 + 0.75 * Math.sqrt(
    Math.max(SHIELD_DUTY_CYCLE * command, 0),
  );
  const effectiveInteraction = (
    interactionParameter
    * voltageClosure
    * currentClosure
    * pulseCoupling
    * heatActivation
    * command
  );
  const mhdAttenuation = SHIELD_MAX_ATTENUATION * (
    1 - Math.exp(-SHIELD_MHD_GAIN * effectiveInteraction)
  );

  const dynamicPressure = Math.max(0.5 * density * speed * speed, 1);
  const electrostaticPressure = (
    0.5 * 8.8541878128e-12 * electricFieldVm * electricFieldVm
  );
  const ehdRatio = electrostaticPressure / dynamicPressure;
  const ehdAttenuation = (
    0.06
    * (1 - Math.exp(-20 * ehdRatio))
    * heatActivation
    * command
  );

  const attenuation = clamp(
    mhdAttenuation + ehdAttenuation,
    0,
    SHIELD_MAX_ATTENUATION,
  );

  const totalCurrentSq = (
    electrodeCurrentAm2 ** 2
    + motionalCurrentAm2 ** 2
  );
  const jouleHeatWm2 = (
    totalCurrentSq
    / Math.max(conductivity, SHIELD_CONDUCTIVITY_FLOOR_S_M)
    * SHIELD_SHEATH_THICKNESS_M
    * SHIELD_DUTY_CYCLE
    * command
  );
  const electricalPowerDensityWm2 = (
    electrodeCurrentAm2
    * electricFieldVm
    * SHIELD_SHEATH_THICKNESS_M
    * SHIELD_DUTY_CYCLE
    * command
  );
  const jouleReturnWm2 = (
    SHIELD_JOULE_RETURN_FRACTION * jouleHeatWm2
    + SHIELD_ELECTRODE_LOSS_RETURN_FRACTION * electricalPowerDensityWm2
  );

  const shieldedParticleHeatFluxWm2 = (
    particleHeatFluxWm2 * (1 - attenuation)
    + jouleReturnWm2
  );

  return {
    active: command > 1e-9,
    heatActivation,
    conductivitySm: conductivity,
    electricFieldVm,
    electrodeCurrentAm2,
    motionalFieldVm,
    motionalEmfV: motionalFieldVm * SHIELD_SHEATH_THICKNESS_M,
    motionalCurrentAm2,
    interactionParameter,
    attenuation,
    jouleReturnWm2,
    particleHeatFluxWm2,
    shieldedParticleHeatFluxWm2,
  };
}

function maximumSustainableShieldSpeed(solarDistanceM, magneticFieldT, driveCommand) {
  const targetTemperatureK = SHIELD_LIMIT_K * THERMAL_TARGET_FRACTION;
  const density = ambientPlasmaDensityKgM3(solarDistanceM);
  const solarFluxWm2 = SOLAR_CONSTANT_W_M2 * (AU / Math.max(solarDistanceM, SUN_RADIUS_M)) ** 2;

  const equilibriumAt = speedMps => {
    const particleHeatFluxWm2 = relativisticParticleHeatFluxWm2(density, speedMps);
    const response = emfHeatShieldResponse({
      particleHeatFluxWm2,
      densityKgM3: density,
      speedMps,
      magneticFieldT,
      driveCommand,
    });
    const inputW = (
      SHIELD_SOLAR_ABSORPTIVITY * solarFluxWm2
      + response.shieldedParticleHeatFluxWm2
    ) * SHIELD_AREA_M2;
    return radiativeEquilibriumTemperature(
      inputW,
      SHIELD_RADIATING_AREA_M2,
      SHIELD_EMISSIVITY,
    );
  };

  let low = 0;
  let high = 0.999999999 * C;
  if (equilibriumAt(high) <= targetTemperatureK) return high;

  for (let iteration = 0; iteration < 30; iteration += 1) {
    const mid = 0.5 * (low + high);
    if (equilibriumAt(mid) <= targetTemperatureK) low = mid;
    else high = mid;
  }
  return low;
}

function thermalDerateForTemperature(temperatureK, limitK) {
  const softLimitK = limitK * THERMAL_TARGET_FRACTION;
  const hardLimitK = limitK * THERMAL_HARD_FRACTION;
  if (temperatureK <= softLimitK) return 1;
  if (temperatureK >= hardLimitK) return 0;
  return 1 - (temperatureK - softLimitK) / Math.max(hardLimitK - softLimitK, 1);
}

function coilThermalDerate(state) {
  if (!state) return 1;
  return thermalDerateForTemperature(state.coilTempK ?? 300, COIL_LIMIT_K);
}

function powerThermalDerate(state) {
  if (!state) return 1;
  return Math.min(
    thermalDerateForTemperature(state.radiatorTempK ?? 300, RADIATOR_LIMIT_K),
    thermalDerateForTemperature(state.reactorTempK ?? 500, REACTOR_LIMIT_K),
    thermalDerateForTemperature(state.hullTempK ?? 300, HULL_LIMIT_K),
    thermalDerateForTemperature(state.shieldTempK ?? 300, SHIELD_LIMIT_K),
  );
}

function thermalDerateFactor(state) {
  return Math.min(coilThermalDerate(state), powerThermalDerate(state));
}

function plasmaThrottleCommand() {
  return clamp(Number(cruiseThrustSlider?.value ?? 100) / 100, 0, 1);
}

function setting(id, fallback) {
  if (typeof document === "undefined") return fallback;
  const value = Number(document.getElementById(id)?.value);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}
function engineCount() { return clamp(Math.round(setting("engineCountSlider", 1)), 1, 8); }
function voltageCeiling() { return setting("plasmaVoltageSlider", 10) * setting("voltageScale", 1e6); }
function magnosBoosterForPlasma() {
  return magnosBank({count:clamp(Math.round(setting("boosterCount",1)),1,8),targetV:voltageCeiling(),loadOhm:1e24});
}

function radiatorRejectCapacityW(areaM2 = RADIATOR_AREA_MAX_M2, targetK = RADIATOR_TARGET_K) {
  return RADIATOR_EMISSIVITY * STEFAN_BOLTZMANN * areaM2 * Math.max(
    targetK ** 4 - CMB_TEMPERATURE_K ** 4,
    0,
  );
}

function thermalElectricalPowerLimitW(coilCurrentA, areaM2 = RADIATOR_AREA_MAX_M2) {
  const ohmicLossW = coilCurrentA ** 2 * COIL_RESISTANCE_OHM;
  const radiatorBudgetW = Math.max(0, radiatorRejectCapacityW(areaM2, setting("radiatorTarget", RADIATOR_TARGET_K)) - AVIONICS_HEAT_W);
  const driveWasteBudgetW = radiatorBudgetW / RADIATOR_WASTE_FRACTION;
  return Math.max(0, (driveWasteBudgetW - ohmicLossW) / Math.max(1 - PLASMA_EFFICIENCY, 1e-6));
}

function steadyPlasmaDrive(throttle = plasmaThrottleCommand(), thermalDerate = 1) {
  const magneticThrottle = clamp(throttle, 0, 1);
  const coilCurrentA = COIL_CURRENT_LIMIT_A * magneticThrottle;
  const magneticFieldT = MU0 * COIL_TURNS * coilCurrentA / COIL_LENGTH_M;
  const thermalPowerLimitW = thermalElectricalPowerLimitW(coilCurrentA);
  const voltageFromThermalsV = coilCurrentA > 1e-9 ? thermalPowerLimitW / (coilCurrentA * engineCount()) : 0;
  const acceleratorVoltageV = Math.min(
    voltageCeiling() * magneticThrottle,
    voltageFromThermalsV,
  ) * clamp(thermalDerate, 0, 1);
  const plasmaCurrentA = coilCurrentA * engineCount();
  const acceleratorPowerW = acceleratorVoltageV * plasmaCurrentA;
  const ohmicLossW = coilCurrentA ** 2 * COIL_RESISTANCE_OHM;
  const beamPowerW = acceleratorPowerW * PLASMA_EFFICIENCY;
  const wasteHeatW = acceleratorPowerW * (1 - PLASMA_EFFICIENCY) + ohmicLossW;
  const thrustN = 2 * beamPowerW / PLASMA_EXHAUST_VELOCITY_M_S;
  const propellantFlowKgS = thrustN / PLASMA_EXHAUST_VELOCITY_M_S;
  return {
    effectiveThrottle: magneticThrottle,
    coilCurrentA,
    magneticFieldT,
    acceleratorVoltageV,
    acceleratorPowerW,
    ohmicLossW,
    beamPowerW,
    wasteHeatW,
    thrustN,
    propellantFlowKgS,
    properAcceleration: thrustN / SPACECRAFT_MASS_KG,
  };
}

function radiativeEquilibriumTemperature(powerW, areaM2, emissivity) {
  const denominator = Math.max(emissivity * STEFAN_BOLTZMANN * areaM2, 1e-12);
  return Math.max(CMB_TEMPERATURE_K, (Math.max(powerW, 0) / denominator + CMB_TEMPERATURE_K ** 4) ** 0.25);
}

function radiatorAreaForTarget(powerW, targetK = RADIATOR_TARGET_K) {
  const radiativeFlux = RADIATOR_EMISSIVITY * STEFAN_BOLTZMANN * Math.max(
    targetK ** 4 - CMB_TEMPERATURE_K ** 4,
    1e-9,
  );
  return Math.max(0, powerW) / radiativeFlux;
}

function relaxTemperature(currentK, targetK, heatCapacityJ_K, areaM2, emissivity, dt) {
  const referenceK = Math.max(50, currentK, targetK);
  const conductance = 4 * emissivity * STEFAN_BOLTZMANN * areaM2 * referenceK ** 3;
  const tau = clamp(heatCapacityJ_K / Math.max(conductance, 1), 60, 120 * DAY);
  return targetK + (currentK - targetK) * Math.exp(-Math.max(dt, 0) / tau);
}

function formatField(valueVm) {
  if (!Number.isFinite(valueVm)) return "—";
  const magnitude = Math.abs(valueVm);
  if (magnitude >= 1e9) return `${formatNumber(valueVm / 1e9, 3)} GV/m`;
  if (magnitude >= 1e6) return `${formatNumber(valueVm / 1e6, 3)} MV/m`;
  if (magnitude >= 1e3) return `${formatNumber(valueVm / 1e3, 3)} kV/m`;
  return `${formatNumber(valueVm, 2)} V/m`;
}

function formatVoltage(valueV) {
  if (!Number.isFinite(valueV)) return "—";
  const magnitude = Math.abs(valueV);
  if (magnitude >= 1e12) return `${formatNumber(valueV / 1e12, 3)} TV`;
  if (magnitude >= 1e9) return `${formatNumber(valueV / 1e9, 3)} GV`;
  if (magnitude >= 1e6) return `${formatNumber(valueV / 1e6, 3)} MV`;
  if (magnitude >= 1e3) return `${formatNumber(valueV / 1e3, 3)} kV`;
  return `${formatNumber(valueV, 2)} V`;
}

function formatHeatFlux(valueWm2) {
  if (!Number.isFinite(valueWm2)) return "—";
  const magnitude = Math.abs(valueWm2);
  if (magnitude >= 1e9) return `${formatNumber(valueWm2 / 1e9, 3)} GW/m²`;
  if (magnitude >= 1e6) return `${formatNumber(valueWm2 / 1e6, 3)} MW/m²`;
  if (magnitude >= 1e3) return `${formatNumber(valueWm2 / 1e3, 3)} kW/m²`;
  return `${formatNumber(valueWm2, 2)} W/m²`;
}

function formatSimulationSpeed(daysPerSecond) {
  if (daysPerSecond < 1 / 24) return `${formatNumber(daysPerSecond * 24, 2)} h/s`;
  if (daysPerSecond < 365) return `${formatNumber(daysPerSecond, 2)} days/s`;
  return `${formatNumber(daysPerSecond / 365.25, 2)} years/s`;
}

function julianDay(date) {
  let year = date.getUTCFullYear();
  let month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const fraction = (
    date.getUTCHours()
    + date.getUTCMinutes() / 60
    + date.getUTCSeconds() / 3600
    + date.getUTCMilliseconds() / 3_600_000
  ) / 24;

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const century = Math.floor(year / 100);
  const correction = 2 - century + Math.floor(century / 4);

  return (
    Math.floor(365.25 * (year + 4716))
    + Math.floor(30.6001 * (month + 1))
    + day
    + correction
    - 1524.5
    + fraction
  );
}

function centuriesFromJ2000(date) {
  return (julianDay(date) - J2000_JD) / 36_525;
}

function solveKepler(meanAnomaly, eccentricity) {
  let M = ((meanAnomaly + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  let E = M + eccentricity * Math.sin(M);

  for (let iteration = 0; iteration < 30; iteration += 1) {
    const f = E - eccentricity * Math.sin(E) - M;
    const fp = 1 - eccentricity * Math.cos(E);
    const delta = -f / fp;
    E += delta;
    if (Math.abs(delta) < 1e-13) break;
  }

  return E;
}

function trueAnomalyFromMean(meanAnomaly, eccentricity) {
  const E = solveKepler(meanAnomaly, eccentricity);
  return 2 * Math.atan2(
    Math.sqrt(1 + eccentricity) * Math.sin(E / 2),
    Math.sqrt(1 - eccentricity) * Math.cos(E / 2),
  );
}

function evaluateElements(definition, date) {
  const T = centuriesFromJ2000(date);
  const elements = definition.elements;

  const a = elements.a0 + elements.a1 * T;
  const e = elements.e0 + elements.e1 * T;
  const inclination = radians(elements.i0 + elements.i1 * T);
  const longitude = wrapDegrees(elements.L0 + elements.L1 * T);
  const longitudePerihelion = wrapDegrees(elements.peri0 + elements.peri1 * T);
  const longitudeNode = wrapDegrees(elements.node0 + elements.node1 * T);
  const argumentPerihelion = radians(wrapDegrees(longitudePerihelion - longitudeNode));
  const meanAnomaly = radians(wrapDegrees(longitude - longitudePerihelion));

  return {
    a,
    e,
    inclination,
    longitudeNode: radians(longitudeNode),
    argumentPerihelion,
    meanAnomaly,
    trueAnomaly: trueAnomalyFromMean(meanAnomaly, e),
  };
}

// JPL ecliptic rotation, plus the template's P/Q basis velocity formula.
function heliocentricStateFromElements(definition, date) {
  const el = evaluateElements(definition, date);
  const aM = el.a * AU;
  const p = aM * (1 - el.e * el.e);
  const radius = p / (1 + el.e * Math.cos(el.trueAnomaly));
  const h = Math.sqrt(SUN_MU * p);

  const xOrbital = radius * Math.cos(el.trueAnomaly);
  const yOrbital = radius * Math.sin(el.trueAnomaly);
  const vxOrbital = -(SUN_MU / h) * Math.sin(el.trueAnomaly);
  const vyOrbital = (SUN_MU / h) * (el.e + Math.cos(el.trueAnomaly));

  const cW = Math.cos(el.argumentPerihelion);
  const sW = Math.sin(el.argumentPerihelion);
  const cO = Math.cos(el.longitudeNode);
  const sO = Math.sin(el.longitudeNode);
  const cI = Math.cos(el.inclination);
  const sI = Math.sin(el.inclination);

  const P = new THREE.Vector3(
    cW * cO - sW * sO * cI,
    sW * sI,
    cW * sO + sW * cO * cI,
  );

  const Q = new THREE.Vector3(
    -sW * cO - cW * sO * cI,
    cW * sI,
    -sW * sO + cW * cO * cI,
  );

  // Three.js uses Y-up. The basis above is already written as x, z, y.
  const position = P.clone().multiplyScalar(xOrbital).addScaledVector(Q, yOrbital);
  const velocity = P.clone().multiplyScalar(vxOrbital).addScaledVector(Q, vyOrbital);

  return { position, velocity, elements: el };
}

function bodyDefinition(name) {
  return BODY_DEFINITIONS.find(body => body.name === name);
}

function analyticRelativeState(name, date) {
  const definition = bodyDefinition(name);
  if (!definition || !definition.elements) {
    return { position: new THREE.Vector3(), velocity: new THREE.Vector3() };
  }
  return heliocentricStateFromElements(definition, date);
}

// -----------------------------------------------------------------------------
// N-body simulation state
// -----------------------------------------------------------------------------
let epochDate = new Date();
let simulatedSeconds = 0;
let bodies = [];
let rocket = null;
let initialSystemEnergy = 0;
let physicsAccumulator = 0;
let isPlaying = true;
let simulationDaysPerSecond = 10;
let trailEnabled = true;
let labelsEnabled = true;
let rocketTrailEnabled = true;

function initializeBodies(date) {
  const initial = BODY_DEFINITIONS.map(definition => {
    if (!definition.elements) {
      return {
        ...definition,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        acceleration: new THREE.Vector3(),
      };
    }

    const state = heliocentricStateFromElements(definition, date);
    return {
      ...definition,
      position: state.position,
      velocity: state.velocity,
      acceleration: new THREE.Vector3(),
    };
  });

  // Convert heliocentric starting states to barycentric coordinates. This is
  // what makes the Sun move: the origin is the total system barycenter.
  let totalMass = 0;
  const centerOfMass = new THREE.Vector3();
  const totalMomentum = new THREE.Vector3();

  for (const body of initial) {
    totalMass += body.mass;
    centerOfMass.addScaledVector(body.position, body.mass);
    totalMomentum.addScaledVector(body.velocity, body.mass);
  }

  centerOfMass.multiplyScalar(1 / totalMass);
  const barycentricVelocity = totalMomentum.multiplyScalar(1 / totalMass);

  for (const body of initial) {
    body.position.sub(centerOfMass);
    body.velocity.sub(barycentricVelocity);
  }

  bodies = initial;
  computeBodyAccelerations();
  initialSystemEnergy = totalSystemEnergy();
}

function computeBodyAccelerations() {
  for (const body of bodies) body.acceleration.set(0, 0, 0);

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const a = bodies[i];
      const b = bodies[j];
      const delta = b.position.clone().sub(a.position);
      const r2 = delta.lengthSq();
      const invR3 = 1 / (r2 * Math.sqrt(r2));

      a.acceleration.addScaledVector(delta, G * b.mass * invR3);
      b.acceleration.addScaledVector(delta, -G * a.mass * invR3);
    }
  }
}

function totalSystemEnergy() {
  let energy = 0;

  for (const body of bodies) {
    energy += 0.5 * body.mass * body.velocity.lengthSq();
  }

  for (let i = 0; i < bodies.length; i += 1) {
    for (let j = i + 1; j < bodies.length; j += 1) {
      const distance = bodies[i].position.distanceTo(bodies[j].position);
      energy -= G * bodies[i].mass * bodies[j].mass / distance;
    }
  }

  return energy;
}

function accelerationAt(position) {
  const acceleration = new THREE.Vector3();

  for (const body of bodies) {
    const delta = body.position.clone().sub(position);
    const r2 = delta.lengthSq();
    const minDistance = Math.max(body.radiusM, 1_000);
    const safeR2 = Math.max(r2, minDistance * minDistance);
    const invR3 = 1 / (safeR2 * Math.sqrt(safeR2));
    acceleration.addScaledVector(delta, G * body.mass * invR3);
  }

  return acceleration;
}

function velocityVerletStep(dt) {
  const wasArcMode = Boolean(rocket?.arcMode);
  for (const body of bodies) {
    body.velocity.addScaledVector(body.acceleration, 0.5 * dt);
    body.position.addScaledVector(body.velocity, dt);
  }

  if (rocket?.active) {
    if (!rocket.arcMode) {
      rocket.velocity.addScaledVector(rocket.acceleration, 0.5 * dt);
      applyCruisePropulsion(0.5 * dt);

      rocket.earthElapsedSeconds += dt;
      rocket.travelerProperSeconds += properTimeStep(dt, rocket.velocity.length());
      rocket.position.addScaledVector(rocket.velocity, dt);
    }
  }

  computeBodyAccelerations();

  for (const body of bodies) {
    body.velocity.addScaledVector(body.acceleration, 0.5 * dt);
  }

  simulatedSeconds += dt;
  if(rocket?.lockedTo) {
    const planet=getBody(rocket.lockedTo);
    rocket.position.copy(planet.position).add(rocket.lockOffset);
    rocket.velocity.copy(planet.velocity);
    rocket.pathVelocity=rocket.velocity.clone();
    rocket.earthElapsedSeconds+=dt;
    rocket.travelerProperSeconds+=properTimeStep(dt,planet.velocity.length());
    rocket.modeledHeliocentricSpeed=planet.velocity.clone().sub(getBody("Sol").velocity).length();
    updatePlasmaCircuit(dt,false,0);
  }
  if (rocket?.active && wasArcMode) advanceSlingshotArc(dt);

  if (rocket?.active && !rocket.arcMode && !wasArcMode) {
    const newAcceleration = accelerationAt(rocket.position);
    rocket.velocity.addScaledVector(newAcceleration, 0.5 * dt);
    rocket.acceleration.copy(newAcceleration);
    applyCruisePropulsion(0.5 * dt);
    updateRocketAfterStep();
  }

}

function currentPhysicsStep() {
  if (!rocket?.active) return 6 * 3600;
  if (rocket.arcMode && rocket.leg.phase==="Capture") return 30;
  if (rocket.arcMode && rocket.leg.encounter.arc) return Math.min(300, Math.max(1e-6,rocket.leg.duration-rocket.leg.elapsed));
  if (rocket.arcMode) return Math.min(rocket.leg.guidanceDeltaV.length() > 0.1 ? 60 : 3600, Math.max(1e-6, rocket.leg.duration - rocket.leg.elapsed));

  const sun = getBody("Sol");
  const solarDistance = rocket.position.distanceTo(sun.position);

  if (rocket.cruiseActive) {
    const relativeSpeed = rocket.velocity.clone().sub(sun.velocity).length();
    const remaining = Math.max(0, ALPHA_CENTAURI_DISTANCE_LY * LY_M - solarDistance);
    if (remaining < relativeSpeed * 3 * DAY) return 10 * 60;
    if (remaining < relativeSpeed * 30 * DAY) return 60 * 60;
    return 6 * 3600;
  }
  if (solarDistance < 0.12 * AU) return 20 * 60;
  if (solarDistance < 0.30 * AU) return 60 * 60;
  return 6 * 3600;
}

function stepSimulation(realDeltaSeconds) {
  if (!isPlaying) return;

  physicsAccumulator += realDeltaSeconds * simulationDaysPerSecond * DAY;
  const maxStepsPerFrame = 180;
  let steps = 0;

  while (physicsAccumulator > 0 && steps < maxStepsPerFrame) {
    const dt = Math.min(currentPhysicsStep(), physicsAccumulator);
    velocityVerletStep(dt);
    physicsAccumulator -= dt;
    steps += 1;
    sampleTrails();
  }

  const step = currentPhysicsStep();
  physicsAccumulator = Math.min(physicsAccumulator, step * maxStepsPerFrame * 2);
}

function getBody(name) {
  return bodies.find(body => body.name === name);
}

function currentDate() {
  return new Date(epochDate.getTime() + simulatedSeconds * 1000);
}

// -----------------------------------------------------------------------------
// Optimized gravity-assist route, solar dive, Oberth and interstellar thrust
// -----------------------------------------------------------------------------
function circularSpeedAtRadius(radius) {
  return Math.sqrt(SUN_MU / Math.max(radius, 1));
}

function approximatePlanetOrbitalSpeed(name) {
  const definition = bodyDefinition(name);
  return definition?.elements ? circularSpeedAtRadius(definition.elements.a0 * AU) : 0;
}

function predictPlanetRelative(name, date) {
  const state = analyticRelativeState(name, date);
  // Anchor the approximate ephemeris to the live N-body position. Guidance
  // refreshes this correction throughout flight instead of chasing today's planet.
  const present = analyticRelativeState(name, currentDate());
  state.position.add(getBody(name).position.clone().sub(getBody("Sol").position).sub(present.position));
  return state;
}

function encounterOffsetFor(name, position) {
  const body = bodyDefinition(name);
  const hill = position.length() * Math.cbrt(body.mass / (3 * SUN_MASS));
  return position.clone().normalize().multiplyScalar(Math.max(body.radiusM * 3, hill * 0.5));
}

function optimizeSlingshotRoute(options = {}) {
  if(options.solver==="lambert") return optimizeLambertSlingshotRoute(options);
  const startName=options.startName ?? "Earth", sun=getBody("Sol"), origin=getBody(startName);
  const startPosition=options.startPosition?.clone() ?? origin.position.clone().sub(sun.position)
    .add(encounterOffsetFor(startName,origin.position.clone().sub(sun.position)).multiplyScalar(2.3));
  const launchExcessMps=options.launchExcessMps ?? Number(injectionSlider.value)*1000;
  const startVelocity=options.startVelocity?.clone() ?? origin.velocity.clone().sub(sun.velocity)
    .addScaledVector(origin.velocity.clone().sub(sun.velocity).normalize(),launchExcessMps);
  const visited=new Set(options.visited ?? [startName]);
  const drive=steadyPlasmaDrive(plasmaThrottleCommand(),options.thermalDerate ?? 1);
  const altitudeM=options.altitudeM ?? Number(flybySlider.value)*1000;
  const candidates=[];
  if((options.encountersUsed ?? 0)<MAX_ASSIST_ENCOUNTERS) {
    for(const target of BODY_DEFINITIONS.filter(b=>b.elements && !visited.has(b.name) && getBody(b.name).position.distanceTo(sun.position)>startPosition.length()*0.95)) {
      // Both incoming speed and time of flight are searched. The flyby remains
      // a gravity-only turn in the planet frame; plasma work is separate.
      for(const excess of [20000,80000,250000,600000]) {
        const solved=planPoweredTransfer({position:startPosition,velocity:startVelocity,acceleration:drive.properAcceleration,mu:SUN_MU,
          minimumRadius:Math.max(50*SUN_RADIUS_M,startPosition.length()*0.85),
          predictArrival:seconds=>{
            const state=predictPlanetRelative(target.name,new Date(currentDate().getTime()+seconds*1000));
            const planetVelocity=state.velocity.clone();
            const offset=encounterOffsetFor(target.name,state.position);
            // Radial v-infinity admits a positive prograde turn at the flyby.
            state.velocity.addScaledVector(state.position.clone().normalize(),excess);
            state.position.add(offset);
            return {...state,planetVelocity,offset};
          }});
        if(!solved) continue;
        const assist=gravityAssist(solved.arrival.velocity,solved.arrival.planetVelocity,G*target.mass,target.radiusM+altitudeM);
        if(!assist || assist.energyGainJkg<=0) continue;
        const poweredEnergyGainJkg=solved.arrival.velocity.lengthSq()/2-SUN_MU/solved.arrival.position.length()
          -(startVelocity.lengthSq()/2-SUN_MU/startPosition.length());
        candidates.push({name:target.name,previousName:startName,method:"Plasma tangent flyby",flyby:true,arc:solved.arc,
          transferDuration:solved.seconds,naturalTime:hohmannTime(startPosition.length(),solved.arrival.position.length(),SUN_MU),
          encounterOffset:solved.arrival.offset,solution:{v1:startVelocity,v2:solved.arrival.velocity},
          departureDeltaV:0,poweredDeltaV:solved.arc.deltaV,burnBudgetDeltaV:solved.arc.deltaV*2,
          flybyEnergyGainJkg:assist.energyGainJkg,poweredEnergyGainJkg,totalEnergyGainJkg:assist.energyGainJkg+poweredEnergyGainJkg,
          outgoingVelocity:assist.velocity,outgoingSpeed:assist.velocity.length(),vInfinity:assist.vInfinity,turnAngle:assist.turnAngle,
          averageSpeed:startPosition.distanceTo(solved.arrival.position)/solved.seconds});
      }
    }
  }
  // Fastest feasible average transfer speed, then outgoing speed. Sampled
  // search only: not a claim of a globally optimal interstellar trajectory.
  candidates.sort((a,b)=>b.averageSpeed-a.averageSpeed || b.outgoingSpeed-a.outgoingSpeed);
  const best=candidates[0];
  return {solver:"powered",route:best?[best.name]:[],encounters:best?[best]:[],candidates,
    launchExcessMps,altitudeM,startPosition,totalTransferDuration:best?.transferDuration??0,
    totalEnergyGainJkg:best?.totalEnergyGainJkg??0,totalFlybyEnergyGainJkg:best?.flybyEnergyGainJkg??0,
    totalPoweredEnergyGainJkg:best?.poweredEnergyGainJkg??0,totalPoweredDeltaV:best?.poweredDeltaV??0,
    exitSpeed:best?.outgoingSpeed??startVelocity.length()};
}

function optimizeLambertSlingshotRoute(options = {}) {
  const startName = options.startName ?? "Earth";
  const launchExcessMps = options.launchExcessMps ?? Number(injectionSlider.value) * 1000;
  const altitudeM = options.altitudeM ?? Number(flybySlider.value) * 1000;
  const sun = getBody("Sol"), origin = getBody(startName);
  const startPosition = options.startPosition?.clone() ?? origin.position.clone().sub(sun.position)
    .addScaledVector(origin.position.clone().sub(sun.position).normalize(), 0.929e9 * 1.15);
  const startVelocity = options.startVelocity?.clone() ?? origin.velocity.clone().sub(sun.velocity)
    .addScaledVector(origin.velocity.clone().sub(sun.velocity).normalize(), launchExcessMps);
  const visited = new Set(options.visited ?? [startName]);
  const drive = steadyPlasmaDrive(plasmaThrottleCommand(), options.thermalDerate ?? 1);
  const budget = drive.properAcceleration * ASSIST_PLASMA_BURN_WINDOW_S * ASSIST_PLASMA_PATH_EFFICIENCY;
  const candidates = [];
  if ((options.encountersUsed ?? 0) < MAX_ASSIST_ENCOUNTERS) {
    for (const target of BODY_DEFINITIONS.filter(body => body.elements && !visited.has(body.name) && body.name !== startName)) {
      const naturalTime = hohmannTime(startPosition.length(), getBody(target.name).position.distanceTo(sun.position), SUN_MU);
      for (const factor of [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]) {
        const transferDuration = clamp(naturalTime * factor, 2 * DAY, 20 * YEAR);
        const date = new Date(currentDate().getTime() + transferDuration * 1000);
        const arrival = predictPlanetRelative(target.name, date);
        const offset = encounterOffsetFor(target.name, arrival.position);
        const endpoint = arrival.position.clone().add(offset);
        // Outward chain only: a Venus/Mercury first cut heads toward the Sun.
        if (endpoint.length() < startPosition.length() * 0.95) continue;
        const solution = solveLambert(startPosition, endpoint, transferDuration, startVelocity, SUN_MU);
        if (!solution) continue;
        const departureDeltaV = solution.v1.distanceTo(startVelocity);
        // Reserve 20% for finite-burn and ephemeris corrections. No imaginary
        // full-throttle bonus is added to arrival v-infinity or flyby energy.
        if (departureDeltaV > 0.8 * budget) continue;
        const assist = gravityAssist(solution.v2, arrival.velocity, G * target.mass, target.radiusM + altitudeM);
        if (!assist || assist.energyGainJkg <= 0) continue;
        // Reject sun-grazing and interior-crossing conics. Planetary legs must
        // stay outside ~85% of the inner endpoint radius.
        const h2 = new THREE.Vector3().crossVectors(startPosition, solution.v1).lengthSq();
        const energy = solution.v1.lengthSq() / 2 - SUN_MU / startPosition.length();
        const eccentricity = Math.sqrt(Math.max(0, 1 + 2 * energy * h2 / SUN_MU ** 2));
        const periapsis = h2 / SUN_MU / (1 + eccentricity);
        const innerRadius = Math.min(startPosition.length(), endpoint.length());
        // Outer-planet legs must not drop far inside the departure radius.
        if (endpoint.length() > startPosition.length() * 1.15 && periapsis < 0.88 * startPosition.length()) continue;
        if (periapsis < Math.max(SUN_RADIUS_M * 50, 0.45 * innerRadius)) continue;
        candidates.push({name:target.name, previousName:startName, transferDuration, naturalTime,
          solution, endpoint, encounterOffset:offset, arrivalPlanetVelocity:arrival.velocity,
          departureDeltaV, poweredDeltaV:departureDeltaV, burnBudgetDeltaV:budget,
          burnTime:departureDeltaV / Math.max(drive.properAcceleration, 1e-12),
          flybyEnergyGainJkg:assist.energyGainJkg, poweredEnergyGainJkg:0,
          totalEnergyGainJkg:assist.energyGainJkg, vInfinity:assist.vInfinity,
          turnAngle:assist.turnAngle, preFlybySpeed:solution.v2.length(),
          outgoingVelocity:assist.velocity, outgoingSpeed:assist.velocity.length(), method:solution.method});
      }
    }
  }
  // "Strongest" means positive heliocentric energy gained from the planet,
  // not surface gravity or a reward for extra plasma burns. Time breaks ties.
  candidates.sort((a,b) => b.flybyEnergyGainJkg-a.flybyEnergyGainJkg || a.transferDuration-b.transferDuration);
  const best = candidates[0];
  return {solver:"lambert", route:best ? [best.name] : [], encounters:best ? [best] : [], candidates,
    launchExcessMps, altitudeM, totalEnergyGainJkg:best?.flybyEnergyGainJkg ?? 0,
    totalFlybyEnergyGainJkg:best?.flybyEnergyGainJkg ?? 0, totalPoweredEnergyGainJkg:0,
    totalTransferDuration:best?.transferDuration ?? 0, totalPoweredDeltaV:best?.departureDeltaV ?? 0,
    exitSpeed:best?.outgoingSpeed ?? startVelocity.length()};
}

function hohmannTransferTime(r1, r2) {
  const semiMajor = 0.5 * (Math.max(r1, 1) + Math.max(r2, 1));
  return Math.PI * Math.sqrt(semiMajor ** 3 / SUN_MU);
}

function orbitalPeriodAtRadius(radius) {
  return 2 * Math.PI * Math.sqrt(radius ** 3 / SUN_MU);
}

function slerpDirection(a, b, t) {
  const u = a.clone().normalize();
  const v = b.clone().normalize();
  const dot = clamp(u.dot(v), -1, 1);
  const angle = Math.acos(dot);

  if (angle < 1e-5) return u.lerp(v, t).normalize();
  const sinAngle = Math.sin(angle);
  const w1 = Math.sin((1 - t) * angle) / sinAngle;
  const w2 = Math.sin(t * angle) / sinAngle;
  return u.multiplyScalar(w1).addScaledVector(v, w2).normalize();
}

function rotateAroundAxis(vector, axis, angle) {
  const unitAxis = axis.clone().normalize();
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return vector.clone().multiplyScalar(cosine)
    .addScaledVector(new THREE.Vector3().crossVectors(unitAxis, vector), sine)
    .addScaledVector(unitAxis, unitAxis.dot(vector) * (1 - cosine));
}

function beginArcLeg(targetName) {
  const encounter = rocket.plan.encounters[0];
  if (!encounter || encounter.name !== targetName) throw new Error("Missing solved transfer");
  rocket.leg = {targetName, encounter, elapsed:0, duration:encounter.transferDuration,
    arrivalDate:new Date(currentDate().getTime() + encounter.transferDuration * 1000),
    encounterOffset:encounter.encounterOffset.clone(), plasmaDeltaVApplied:0,
    poweredBurnSeconds:0, nextGuidance:0, guidanceDeltaV:encounter.solution.v1.clone().add(getBody("Sol").velocity).sub(rocket.velocity), phase:"Departure burn"};
  rocketStateStat.textContent = `${encounter.method} → ${targetName} · departure burn`;
}

function replanFromCurrentState(name) {
  const sun = getBody("Sol");
  rocket.plan = optimizeSlingshotRoute({solver:rocket.plan.solver,startName:name, launchExcessMps:0,
    startPosition:rocket.position.clone().sub(sun.position),
    startVelocity:rocket.velocity.clone().sub(sun.velocity),
    visited:rocket.visitedPlanets, encountersUsed:rocket.encountersCompleted,
    thermalDerate:rocket.thermalDerate ?? 1});
  rocket.routeIndex = 0;
  rocket.replans += 1;
  if (rocket.plan.route.length) {
    const target = rocket.plan.route[0];
    rocket.plannedRouteHistory.push(target);
    routeStat.textContent = `${rocket.visitedPlanets.join(" → ")} → ${target} · powered transfer · ${(rocket.plan.totalTransferDuration/DAY).toFixed(1)} d`;
    beginArcLeg(target);
  } else {
    routeStat.textContent = `${rocket.visitedPlanets.join(" → ")} · outbound escape`;
    beginOutboundEscape(name);
  }
}

function applyFlybyEncounter(name) {
  const sun = getBody("Sol"), target = getBody(name);
  const incoming = rocket.velocity.clone().sub(sun.velocity);
  const assist = gravityAssist(incoming, target.velocity.clone().sub(sun.velocity), G * target.mass,
    target.radiusM + Number(flybySlider.value) * 1000);
  if (assist) {
    rocket.velocity.copy(sun.velocity).add(assist.velocity);
    rocket.pathVelocity = rocket.velocity.clone();
    rocket.routeEnergyGainJkg += assist.energyGainJkg;
    rocket.routeFlybyEnergyGainJkg += assist.energyGainJkg;
  }
  rocket.modeledHeliocentricSpeed = rocket.velocity.clone().sub(sun.velocity).length();
  rocket.lastEncounterName = name;
  rocket.visitedPlanets.push(name);
  rocket.encountersCompleted += 1;
  replanFromCurrentState(name);
}

function advanceSlingshotArc(dt) {
  if (!rocket?.active || !rocket.arcMode || !rocket.leg) return;
  if (rocket.leg.encounter.arc) { advancePoweredArc(dt); return; }
  const leg = rocket.leg, sun = getBody("Sol"), target = getBody(leg.targetName);
  const remaining = leg.duration - leg.elapsed;
  // Massive bodies have advanced to the end of this step; reconstruct the
  // start Sun for the test-particle drift. Solar gravity handles the coast;
  // the planetary encounter is a patched-conic event at the sphere of influence.
  const startSun = sun.position.clone().addScaledVector(sun.velocity, -dt);
  const relative = rocket.position.clone().sub(startSun);
  if (leg.elapsed >= leg.nextGuidance && remaining > 60) {
    const predicted = predictPlanetRelative(leg.targetName, leg.arrivalDate);
    const endpoint = predicted.position.clone().add(leg.encounterOffset);
    const solution = solveLambert(relative, endpoint, remaining,
      rocket.velocity.clone().sub(sun.velocity), SUN_MU);
    leg.guidanceDeltaV.copy(solution ? solution.v1.clone().add(sun.velocity).sub(rocket.velocity) : new THREE.Vector3());
    leg.nextGuidance = leg.elapsed + Math.min(6 * 3600, remaining / 4);
  }
  const correction = leg.guidanceDeltaV.length();
  const budgetRemaining = Math.max(0, leg.encounter.burnBudgetDeltaV - leg.plasmaDeltaVApplied);
  const requestedDv = Math.min(correction, budgetRemaining);
  const burning = requestedDv > 0.1;
  const thrustLimit = burning ? requestedDv / dt * SPACECRAFT_MASS_KG : 0;
  const drive = updatePlasmaCircuit(dt, burning, thrustLimit);
  const deliveredDv = Math.min(requestedDv, drive.properAcceleration * dt);
  const thrustDelta = leg.guidanceDeltaV.clone().normalize().multiplyScalar(deliveredDv);
  const startAcceleration = relative.clone().multiplyScalar(-SUN_MU / Math.max(relative.length(), SUN_RADIUS_M) ** 3);
  rocket.velocity.addScaledVector(startAcceleration, dt / 2).addScaledVector(thrustDelta, 0.5);
  rocket.position.addScaledVector(rocket.velocity, dt);
  const endRelative = rocket.position.clone().sub(sun.position);
  rocket.velocity.addScaledVector(endRelative, -SUN_MU * dt / (2 * Math.max(endRelative.length(), SUN_RADIUS_M) ** 3))
    .addScaledVector(thrustDelta, 0.5);
  leg.guidanceDeltaV.sub(thrustDelta);
  leg.plasmaDeltaVApplied += deliveredDv;
  leg.poweredBurnSeconds += burning ? dt : 0;
  rocket.assistPlasmaDeltaV += deliveredDv;
  leg.elapsed += dt;
  rocket.earthElapsedSeconds += dt;
  rocket.modeledHeliocentricSpeed = rocket.velocity.clone().sub(sun.velocity).length();
  rocket.travelerProperSeconds += properTimeStep(dt, rocket.modeledHeliocentricSpeed);
  rocket.pathVelocity = rocket.velocity.clone();
  rocket.peakSpeed = Math.max(rocket.peakSpeed, rocket.velocity.length());
  rocket.minimumSolarDistance = Math.min(rocket.minimumSolarDistance, endRelative.length());
  leg.phase = burning ? (leg.elapsed < DAY ? "Departure burn" : "Plasma correction") : "Coast · shield armed";
  rocketStateStat.textContent = `${leg.encounter.method} → ${target.name} · ${leg.phase}`;
  if (endRelative.length() <= SUN_RADIUS_M || rocket.position.distanceTo(target.position) <= target.radiusM) {
    rocket.active = false;
    rocket.crashed = true;
    rocketStateStat.textContent = "Impact during transfer";
    return;
  }
  if (leg.elapsed >= leg.duration - 1e-6) {
    const hill = target.position.distanceTo(sun.position) * Math.cbrt(target.mass / (3 * SUN_MASS));
    if (rocket.position.distanceTo(target.position) <= hill) {
      applyFlybyEncounter(target.name);
    } else {
      // Never teleport to a missed encounter or award its predicted energy.
      rocket.visitedPlanets.push(target.name);
      replanFromCurrentState(rocket.lastEncounterName);
    }
  }
}

function beginOutboundEscape(lastPlanetName) {
  const sun = getBody("Sol");
  const relativeVelocity = rocket.velocity.clone().sub(sun.velocity);
  const solarDistance = Math.max(rocket.position.distanceTo(sun.position), SUN_RADIUS_M);
  const specificEnergy = 0.5 * relativeVelocity.lengthSq() - SUN_MU / solarDistance;

  rocket.acceleration = accelerationAt(rocket.position);
  rocket.pathVelocity = rocket.velocity.clone();
  rocket.arcMode = false;
  rocket.leg = null;
  rocket.escaped = specificEnergy > 0;
  // Do not retarget perihelion at the Sun. Keep the post-assist heliocentric
  // state and raise energy with plasma if the flyby left the ship bound.
  rocket.oberthBurned = true;
  rocket.lastRadialVelocity = rocketRadialVelocity();
  rocket.minimumSolarDistance = Math.min(rocket.minimumSolarDistance, solarDistance);

  rocketStateStat.textContent = rocket.escaped
    ? `Assist chain complete · outbound from ${lastPlanetName}`
    : `Assist chain complete · raising orbit from ${lastPlanetName}`;
  oberthStat.textContent = rocket.escaped
    ? `Hyperbolic · v∞ ${formatNumber(Math.sqrt(2 * specificEnergy) / 1000, 2)} km/s`
    : "Prograde plasma until escape";
}

function selectedRoute() {
  if (typeof document === "undefined") return {origin:"Earth",target:"auto"};
  return {origin:document.getElementById("routeOrigin")?.value || "Earth",target:document.getElementById("routeTarget")?.value || "auto"};
}
function poweredRoutePlan(originName, targetName, departure=null) {
  const sun=getBody("Sol"), origin=getBody(originName);
  const start=origin.position.clone().sub(sun.position);
  const offset=encounterOffsetFor(originName,start).multiplyScalar(2.3);
  start.add(offset);
  if(departure) start.copy(departure.position).sub(sun.position);
  const velocity=(departure?.velocity ?? origin.velocity).clone().sub(sun.velocity);
  const solved=planPoweredTransfer({position:start,velocity,acceleration:steadyPlasmaDrive().properAcceleration,
    mu:SUN_MU,minimumRadius:Math.max(50*SUN_RADIUS_M,Math.min(start.length(),getBody(targetName).position.distanceTo(sun.position))*0.45),
    predictArrival:seconds=>{
      const state=predictPlanetRelative(targetName,new Date(currentDate().getTime()+seconds*1000));
      state.position.add(encounterOffsetFor(targetName,state.position));
      return state;
    }});
  if(!solved) return null;
  const naturalTime=hohmannTime(start.length(),solved.arrival.position.length(),SUN_MU);
  const encounter={name:targetName,method:solved.arc.method,arc:solved.arc,
    transferDuration:solved.seconds,naturalTime,departureDeltaV:0,poweredDeltaV:solved.arc.deltaV,
    encounterOffset:encounterOffsetFor(targetName,solved.arrival.position),
    solution:{v1:velocity,v2:solved.arrival.velocity},burnBudgetDeltaV:solved.arc.deltaV*2};
  return {route:[targetName],encounters:[encounter],candidates:[encounter],launchExcessMps:0,
    totalTransferDuration:solved.seconds,totalEnergyGainJkg:0,totalPoweredDeltaV:solved.arc.deltaV,
    totalFlybyEnergyGainJkg:0,exitSpeed:solved.arrival.velocity.length(),startPosition:start};
}
function advancePlanetCapture(dt) {
  const target=getBody(rocket.leg.targetName);
  const correction=target.velocity.clone().sub(rocket.velocity);
  const drive=updatePlasmaCircuit(dt,true,correction.length()/dt*SPACECRAFT_MASS_KG);
  const dv=Math.min(correction.length(),drive.properAcceleration*dt);
  rocket.velocity.addScaledVector(correction.normalize(),dv);
  rocket.position.addScaledVector(rocket.velocity,dt);
  rocket.assistPlasmaDeltaV+=dv;
  rocket.earthElapsedSeconds+=dt;
  rocket.travelerProperSeconds+=properTimeStep(dt,rocket.velocity.length());
  rocket.pathVelocity=rocket.velocity.clone();
  rocketStateStat.textContent=`${target.name} · capture burn · ${rocket.velocity.distanceTo(target.velocity).toFixed(1)} m/s relative`;
  rocket.leg.captureSeconds=(rocket.leg.captureSeconds||0)+dt;
  const hill=target.position.distanceTo(getBody("Sol").position)*Math.cbrt(target.mass/(3*SUN_MASS));
  if(rocket.position.distanceTo(target.position)>hill || rocket.leg.captureSeconds>DAY) {
    rocket.active=false;rocket.arcMode=false;rocketStateStat.textContent="Capture failed · no planet lock";return;
  }
  if(rocket.velocity.distanceTo(target.velocity)<0.1) {
    rocket.lockedTo=target.name;
    rocket.lockOffset=rocket.position.clone().sub(target.position);
    rocket.velocity.copy(target.velocity);
    rocket.active=false;rocket.arcMode=false;rocket.encountersCompleted++;
    rocket.visitedPlanets ??= [];
    rocket.visitedPlanets.push(target.name);
    rocket.plasmaThrustN=0;
    rocketStateStat.textContent=`Locked to ${target.name} · select next destination`;
    if(typeof document!=="undefined") {
      document.getElementById("routeOrigin").value=target.name;
      document.getElementById("launchButton").textContent="Depart";
      document.getElementById("routeTarget").value=target.name;
    }
  }
}
function advancePoweredArc(dt) {
  if(rocket.leg.phase==="Capture") { advancePlanetCapture(dt);return; }
  const leg=rocket.leg, sun=getBody("Sol"), target=getBody(leg.targetName);
  const startSun=sun.position.clone().addScaledVector(sun.velocity,-dt);
  const r=rocket.position.clone().sub(startSun), v=rocket.velocity.clone().sub(sun.velocity);
  const ref=leg.encounter.arc.sample(leg.elapsed+dt/2);
  const predicted=r.clone().addScaledVector(v,dt/2);
  const trackingTime=3600;
  const command=ref.plasmaAcceleration.clone()
    .addScaledVector(ref.position.clone().sub(predicted),1/trackingTime**2)
    .addScaledVector(ref.velocity.clone().sub(v),2/trackingTime);
  const drive=updatePlasmaCircuit(dt,true,command.length()*SPACECRAFT_MASS_KG);
  const thrust=command.clone().normalize().multiplyScalar(Math.min(command.length(),drive.properAcceleration));
  const g=r.clone().multiplyScalar(-SUN_MU/r.length()**3);
  v.addScaledVector(g,dt/2).addScaledVector(thrust,dt/2);
  r.addScaledVector(v,dt);
  v.addScaledVector(r,-SUN_MU*dt/(2*r.length()**3)).addScaledVector(thrust,dt/2);
  rocket.position.copy(sun.position).add(r); rocket.velocity.copy(sun.velocity).add(v);
  rocket.pathVelocity=rocket.velocity.clone(); rocket.modeledHeliocentricSpeed=v.length();
  leg.elapsed+=dt; rocket.earthElapsedSeconds+=dt;
  rocket.travelerProperSeconds+=properTimeStep(dt,v.length());
  rocket.assistPlasmaDeltaV+=thrust.length()*dt;
  leg.plasmaDeltaVApplied+=thrust.length()*dt;
  rocket.peakSpeed=Math.max(rocket.peakSpeed,v.length());
  rocket.minimumSolarDistance=Math.min(rocket.minimumSolarDistance,r.length());
  const braking=thrust.dot(v)<0;
  rocketStateStat.textContent=`${leg.targetName} · plasma ${braking ? "braking" : "acceleration"} · ${Math.min(100,100*leg.elapsed/leg.duration).toFixed(0)}%`;
  if(r.length()<SUN_RADIUS_M || rocket.position.distanceTo(target.position)<target.radiusM) {
    rocket.active=false;rocket.crashed=true;rocketStateStat.textContent="Impact during powered transfer";
  } else if(leg.elapsed>=leg.duration-1e-6) {
    const hill=target.position.distanceTo(sun.position)*Math.cbrt(target.mass/(3*SUN_MASS));
    const miss=rocket.position.distanceTo(target.position);
    if(miss<=hill && leg.encounter.flyby) {
      rocket.routePoweredEnergyGainJkg+=leg.encounter.poweredEnergyGainJkg;
      applyFlybyEncounter(target.name);
    } else if(miss<=hill) {
      leg.phase="Capture";
      rocketStateStat.textContent=`${target.name} · matching planet velocity`;
    } else {
      rocket.active=false; rocket.arcMode=false;rocket.plasmaThrustN=0;
      rocketStateStat.textContent=`Transfer missed · ${(miss/AU).toFixed(4)} AU from ${target.name}`;
    }
  }
}

function launchRocket() {
  if(rocket?.active) return;
  const docked=rocket?.lockedTo ? rocket : null;
  const route=selectedRoute();
  if(docked) route.origin=docked.lockedTo;
  const launchDate = docked?.launchDate ?? new Date();
  if(route.origin===route.target) { rocketStateStat.textContent="Choose different planets"; return; }
  if(!docked) resetSimulation(launchDate);
  const plan = route.target==="auto" ? optimizeSlingshotRoute({startName:route.origin,
    ...(docked ? {startPosition:docked.position.clone().sub(getBody("Sol").position),startVelocity:docked.velocity.clone().sub(getBody("Sol").velocity),launchExcessMps:0} : {})}) : poweredRoutePlan(route.origin,route.target,docked);
  if(!plan) { rocketStateStat.textContent="No powered arc within the thrust and solar-clearance limits";return; }
  const earth = getBody(route.origin);
  const sun = getBody("Sol");
  const radial = earth.position.clone().sub(sun.position).normalize();
  const earthSoi = 0.929e9;
  const position = plan.startPosition ? sun.position.clone().add(plan.startPosition) : earth.position.clone().addScaledVector(radial, earthSoi * 1.15);

  rocket = {
    active: true,
    crashed: false,
    reachedAlpha: false,
    position,
    velocity: earth.velocity.clone().addScaledVector(earth.velocity.clone().sub(sun.velocity).normalize(), plan.launchExcessMps),
    acceleration: new THREE.Vector3(),
    arcMode: true,
    leg: null,
    plan,
    routeIndex: 0,
    routeEnergyGainJkg: 0,
    routeFlybyEnergyGainJkg: 0,
    routePoweredEnergyGainJkg: 0,
    assistPlasmaDeltaV: 0,
    encountersCompleted: 0,
    replans: 0,
    plannedRouteHistory: [...plan.route],
    modeledHeliocentricSpeed: approximatePlanetOrbitalSpeed("Earth") + plan.launchExcessMps,
    lastEncounterName: route.origin,
    visitedPlanets: [route.origin],
    oberthBurned: false,
    escaped: false,
    minimumSolarDistance: position.distanceTo(sun.position),
    targetPerihelion: Number(periSlider.value) * SUN_RADIUS_M,
    lastRadialVelocity: 0,
    launchDate,
    earthElapsedSeconds: 0,
    travelerProperSeconds: 0,
    cruiseActive: false,
    cruiseBrake: false,
    cruiseStartDistance: null,
    brakeStartDistance: null,
    peakSpeed: 0,
    coilCurrentA: 0,
    coilFieldT: 0,
    coilVoltageV: 0,
    acceleratorPowerW: 0,
    ohmicLossW: 0,
    beamPowerW: 0,
    wasteHeatW: 0,
    plasmaThrustN: 0,
    propellantFlowKgS: 0,
    plasmaProperAcceleration: 0,
    thermalDerate: 1,
    radiatorTempK: 300,
    radiatorAreaM2: RADIATOR_AREA_MIN_M2,
    radiatorDeployment: 0,
    coilTempK: 300,
    reactorTempK: 500,
    hullTempK: 300,
    shieldTempK: 300,
    shieldAttenuation: 0,
    shieldMagneticFieldT: 0,
    shieldSpeedLimitMps: 0,
    shieldMotionalFieldVm: 0,
    shieldMotionalEmfV: 0,
    shieldMotionalCurrentAm2: 0,
    shieldParticleHeatFluxWm2: 0,
    shieldedParticleHeatFluxWm2: 0,
    shieldJouleReturnWm2: 0,
    ambientPlasmaDensityKgM3: 0,
    solarFluxWm2: SOLAR_CONSTANT_W_M2,
  };

  if(docked) {
    for(const key of ["earthElapsedSeconds","travelerProperSeconds","peakSpeed","minimumSolarDistance","assistPlasmaDeltaV","encountersCompleted","coilCurrentA","coilFieldT","radiatorTempK","radiatorAreaM2","coilTempK","reactorTempK","hullTempK","shieldTempK"]) rocket[key]=docked[key];
    rocket.visitedPlanets=[...docked.visitedPlanets];
    rocket.position.copy(docked.position);rocket.velocity.copy(docked.velocity);
  }
  if (plan.route.length) beginArcLeg(plan.route[0]);
  else beginOutboundEscape(route.origin);
  routeStat.textContent = plan.route.length
    ? `${route.origin} → ${plan.route[0]} · ${plan.encounters[0].method} · ${(plan.totalTransferDuration/DAY).toFixed(1)} d`
    : "No reachable positive-gain assist · outbound escape";
  assistGainStat.textContent = `${formatNumber(plan.totalEnergyGainJkg / 1e6, 1)} MJ/kg · plasma Δv ${formatNumber(plan.totalPoweredDeltaV / 1000, 1)} km/s`;
  updateRoutePreview(plan);
  setFocus("Rocket", 8);
  rebuildRocketTrail();
}

function rocketRadialVelocity() {
  if (!rocket?.active || rocket.arcMode) return 0;
  const sun = getBody("Sol");
  const relativePosition = rocket.position.clone().sub(sun.position);
  const relativeVelocity = rocket.velocity.clone().sub(sun.velocity);
  return relativeVelocity.dot(relativePosition.normalize());
}

function recomputeCruiseBrakePoint() {
  if (!rocket?.cruiseActive) return;
  const sun = getBody("Sol");
  const solarDistance = rocket.position.distanceTo(sun.position);
  const relativeSpeed = rocket.velocity.clone().sub(sun.velocity).length();
  const assumed = steadyPlasmaDrive(plasmaThrottleCommand(), Math.max(0.05, rocket.thermalDerate ?? 1));
  const properAcceleration = assumed.properAcceleration;

  rocket.brakeStartDistance = Infinity;
  if (properAcceleration > 0 && brakeToggle.checked) {
    const remaining = Math.max(0, ALPHA_CENTAURI_DISTANCE_LY * LY_M - solarDistance);
    const beta0 = clamp(relativeSpeed / C, 0, 1 - 1e-14);
    const eta0 = Math.atanh(beta0);
    const cosh0 = Math.cosh(eta0);
    const coshMid = Math.max(1, 0.5 * (properAcceleration * remaining / (C * C) + cosh0 + 1));
    const etaMid = Math.acosh(coshMid);
    const accelerateDistance = C * C / properAcceleration * (Math.cosh(etaMid) - cosh0);
    rocket.brakeStartDistance = solarDistance + accelerateDistance;
  }
}

function initializeCruiseProfile() {
  if (!rocket || rocket.cruiseActive) return;
  const sun = getBody("Sol");
  const solarDistance = rocket.position.distanceTo(sun.position);

  rocket.cruiseActive = true;
  rocket.cruiseStartDistance = solarDistance;
  rocket.cruiseBrake = false;
  const relativeVelocity = rocket.velocity.clone().sub(sun.velocity);
  rocket.cruiseRenderDirection = relativeVelocity.lengthSq() > 0
    ? relativeVelocity.normalize()
    : new THREE.Vector3(1, 0, 0);
  recomputeCruiseBrakePoint();
  rebuildRocketTrail();

  if (!rocket.autoCruiseViewSet && solarDistance >= INTERSTELLAR_VIEW_AU * AU) {
    rocket.autoCruiseViewSet = true;
    setFocus("Rocket", 10);
  }

  const drive = steadyPlasmaDrive(plasmaThrottleCommand(), rocket.thermalDerate ?? 1);
  rocketStateStat.textContent = `Plasma cruise · ${(drive.properAcceleration / EARTH_G0).toFixed(3)} g max`;
}

function updateRocketThermalState(dt, drive) {
  if (!rocket) return;
  const sun = getBody("Sol");
  const solarDistance = Math.max(rocket.position.distanceTo(sun.position), SUN_RADIUS_M);
  const solarFluxWm2 = SOLAR_CONSTANT_W_M2 * (AU / solarDistance) ** 2;
  rocket.solarFluxWm2 = solarFluxWm2;

  const driveWasteW = Math.max(0, drive?.wasteHeatW ?? 0);

  // Dedicated forward heat shield. Solar photons are handled as ordinary
  // absorbed radiation; only the charged-particle/plasma component is reduced
  // by the active MHD/EMF sheath.
  const relativeSpeed = rocket.velocity.clone().sub(sun.velocity).length();
  const ambientDensity = ambientPlasmaDensityKgM3(solarDistance);
  const particleHeatFluxWm2 = relativisticParticleHeatFluxWm2(
    ambientDensity,
    Math.max(relativeSpeed, SOLAR_WIND_SPEED_M_S),
  );
  const shieldMagneticFieldT = rocket.cruiseActive
    ? COIL_FIELD_LIMIT_T
    : (drive?.magneticFieldT ?? rocket.coilFieldT ?? 0);
  const shieldDriveCommand = rocket.cruiseActive
    ? 1
    : (drive?.effectiveThrottle ?? 0);
  const shieldResponse = emfHeatShieldResponse({
    particleHeatFluxWm2,
    densityKgM3: ambientDensity,
    speedMps: relativeSpeed,
    magneticFieldT: shieldMagneticFieldT,
    driveCommand: shieldDriveCommand,
  });

  rocket.ambientPlasmaDensityKgM3 = ambientDensity;
  rocket.shieldMagneticFieldT = shieldMagneticFieldT;
  rocket.shieldSpeedLimitMps = rocket.cruiseActive
    ? maximumSustainableShieldSpeed(
        solarDistance,
        shieldMagneticFieldT,
        shieldDriveCommand,
      )
    : 0;
  rocket.shieldAttenuation = shieldResponse.attenuation;
  rocket.shieldMotionalFieldVm = shieldResponse.motionalFieldVm;
  rocket.shieldMotionalEmfV = shieldResponse.motionalEmfV;
  rocket.shieldMotionalCurrentAm2 = shieldResponse.motionalCurrentAm2;
  rocket.shieldParticleHeatFluxWm2 = shieldResponse.particleHeatFluxWm2;
  rocket.shieldedParticleHeatFluxWm2 = shieldResponse.shieldedParticleHeatFluxWm2;
  rocket.shieldJouleReturnWm2 = shieldResponse.jouleReturnWm2;

  const shieldSolarFluxWm2 = SHIELD_SOLAR_ABSORPTIVITY * solarFluxWm2;
  const shieldInputW = (
    shieldSolarFluxWm2
    + shieldResponse.shieldedParticleHeatFluxWm2
  ) * SHIELD_AREA_M2;
  const shieldTargetK = radiativeEquilibriumTemperature(
    shieldInputW,
    SHIELD_RADIATING_AREA_M2,
    SHIELD_EMISSIVITY,
  );
  rocket.shieldTempK = relaxTemperature(
    rocket.shieldTempK ?? 300,
    shieldTargetK,
    SHIELD_HEAT_CAPACITY_J_K,
    SHIELD_RADIATING_AREA_M2,
    SHIELD_EMISSIVITY,
    dt,
  );

  // Vacuum does not cool by conduction. The 2.725 K background is a cold
  // radiative sink. Deploy enough radiator area to hold the drive near a
  // 1,200 K mid-band equilibrium while preserving full RL/20 T plasma power.
  // Almost all drive waste heat is routed through the dedicated radiator loop.
  const radiatorInputW = AVIONICS_HEAT_W + driveWasteW * RADIATOR_WASTE_FRACTION;
  const requiredAreaM2 = radiatorAreaForTarget(radiatorInputW, setting("radiatorTarget", RADIATOR_TARGET_K));
  const commandedAreaM2 = rocket.leg?.encounter?.arc ? RADIATOR_AREA_MAX_M2 : rocket.cruiseActive
    ? clamp(requiredAreaM2, RADIATOR_AREA_MIN_M2, RADIATOR_AREA_MAX_M2)
    : RADIATOR_AREA_MIN_M2;
  const areaBlend = 1 - Math.exp(-Math.max(dt, 0) / (2 * 3600));
  rocket.radiatorAreaM2 = lerp(
    rocket.radiatorAreaM2 ?? RADIATOR_AREA_MIN_M2,
    commandedAreaM2,
    areaBlend,
  );
  rocket.radiatorDeployment = clamp(
    (rocket.radiatorAreaM2 - RADIATOR_AREA_MIN_M2)
      / (RADIATOR_AREA_MAX_M2 - RADIATOR_AREA_MIN_M2),
    0,
    1,
  );

  const radiatorTargetK = radiativeEquilibriumTemperature(
    radiatorInputW,
    rocket.radiatorAreaM2,
    RADIATOR_EMISSIVITY,
  );
  rocket.radiatorTempK = relaxTemperature(
    rocket.radiatorTempK ?? 300,
    radiatorTargetK,
    RADIATOR_HEAT_CAPACITY_J_K,
    rocket.radiatorAreaM2,
    RADIATOR_EMISSIVITY,
    dt,
  );

  // Only a small insulated fraction of drive waste reaches the crew/hull loop.
  const solarAbsorbedW = HULL_ABSORPTIVITY * solarFluxWm2 * HULL_SOLAR_AREA_M2;
  const hullInputW = solarAbsorbedW + AVIONICS_HEAT_W * 0.5 + driveWasteW * HULL_WASTE_FRACTION;
  const hullTargetK = radiativeEquilibriumTemperature(
    hullInputW,
    HULL_RADIATING_AREA_M2,
    HULL_EMISSIVITY,
  );
  rocket.hullTempK = relaxTemperature(
    rocket.hullTempK ?? 300,
    hullTargetK,
    HULL_HEAT_CAPACITY_J_K,
    HULL_RADIATING_AREA_M2,
    HULL_EMISSIVITY,
    dt,
  );

  const ohmicLossW = Math.max(0, drive?.ohmicLossW ?? 0);
  const nonBeamW = Math.max(0, driveWasteW - ohmicLossW);
  const coilTargetK = rocket.radiatorTempK + ohmicLossW / COIL_THERMAL_CONDUCTANCE_W_K;
  const reactorTargetK = rocket.radiatorTempK + nonBeamW / REACTOR_THERMAL_CONDUCTANCE_W_K;
  const componentBlend = 1 - Math.exp(-Math.max(dt, 0) / (5 * 3600));
  rocket.coilTempK = lerp(rocket.coilTempK ?? 300, coilTargetK, componentBlend);
  rocket.reactorTempK = lerp(rocket.reactorTempK ?? 500, reactorTargetK, componentBlend);
  rocket.thermalDerate = thermalDerateFactor(rocket);
}
function updatePlasmaCircuit(dt, enabled, maximumThrustN = Infinity) {
  if (!rocket) return steadyPlasmaDrive(0, 1);

  const commandedThrottle = enabled ? plasmaThrottleCommand() : 0;
  const coilDerate = coilThermalDerate(rocket);
  const powerDerate = powerThermalDerate(rocket);
  const effectiveThrottle = clamp(Math.max(commandedThrottle, rocket.arcMode ? 0.15 * plasmaThrottleCommand() : 0) * coilDerate, 0, 1);
  const targetCurrent = COIL_CURRENT_LIMIT_A * effectiveThrottle;
  const current0 = Math.max(0, rocket.coilCurrentA ?? 0);

  // Current controller around the physical RL plant. The demanded coil voltage
  // is clamped to the available bus, then the exact constant-voltage RL
  // solution is used so astronomical simulation steps remain numerically safe.
  const desiredDiDt = (targetCurrent - current0) / 30;
  let coilVoltage = current0 * COIL_RESISTANCE_OHM + COIL_INDUCTANCE_H * desiredDiDt;
  coilVoltage = clamp(coilVoltage, -COIL_DRIVE_VOLTAGE_V, COIL_DRIVE_VOLTAGE_V);

  const resistance = COIL_RESISTANCE_OHM;
  const tau = COIL_INDUCTANCE_H / resistance;
  const iInfinity = coilVoltage / resistance;
  let current1 = iInfinity + (current0 - iInfinity) * Math.exp(-Math.max(dt, 0) / tau);

  if ((targetCurrent - current0) * (targetCurrent - current1) <= 0) current1 = targetCurrent;
  current1 = clamp(current1, 0, COIL_CURRENT_LIMIT_A);

  const magneticFieldT = MU0 * COIL_TURNS * current1 / COIL_LENGTH_M;
  const thermalPowerLimitW = thermalElectricalPowerLimitW(current1, rocket.leg?.encounter?.arc ? (rocket.radiatorAreaM2 ?? RADIATOR_AREA_MIN_M2) : RADIATOR_AREA_MAX_M2);
  const thermalVoltageLimitV = current1 > 1e-9 ? thermalPowerLimitW / (current1 * engineCount()) : 0;
  const acceleratorVoltageV = Math.min(
    voltageCeiling() * commandedThrottle,
    thermalVoltageLimitV,
    current1 > 1e-9 ? maximumThrustN * PLASMA_EXHAUST_VELOCITY_M_S / (2 * PLASMA_EFFICIENCY * current1 * engineCount()) : 0,
  ) * powerDerate;
  const acceleratorPowerW = acceleratorVoltageV * current1 * engineCount();
  const ohmicLossW = current1 ** 2 * COIL_RESISTANCE_OHM;
  const beamPowerW = acceleratorPowerW * PLASMA_EFFICIENCY;
  const wasteHeatW = acceleratorPowerW * (1 - PLASMA_EFFICIENCY) + ohmicLossW;
  const thrustN = 2 * beamPowerW / PLASMA_EXHAUST_VELOCITY_M_S;
  const propellantFlowKgS = thrustN / PLASMA_EXHAUST_VELOCITY_M_S;
  const properAcceleration = thrustN / SPACECRAFT_MASS_KG;

  rocket.coilCurrentA = current1;
  rocket.coilFieldT = magneticFieldT;
  rocket.coilVoltageV = coilVoltage;
  rocket.acceleratorPowerW = acceleratorPowerW;
  rocket.ohmicLossW = ohmicLossW;
  rocket.beamPowerW = beamPowerW;
  rocket.wasteHeatW = wasteHeatW;
  rocket.plasmaThrustN = thrustN;
  rocket.propellantFlowKgS = propellantFlowKgS;
  rocket.plasmaProperAcceleration = properAcceleration;
  rocket.thermalDerate = Math.min(coilDerate, powerDerate);

  const drive = {
    effectiveThrottle,
    coilCurrentA: current1,
    magneticFieldT,
    acceleratorVoltageV,
    acceleratorPowerW,
    ohmicLossW,
    beamPowerW,
    wasteHeatW,
    thrustN,
    propellantFlowKgS,
    properAcceleration,
  };
  updateRocketThermalState(dt, drive);
  rocket.magnosBus = magnosBoosterForPlasma(ohmicLossW + acceleratorPowerW);
  return drive;
}

function applyCruisePropulsion(dt) {
  if (!rocket?.active || rocket.arcMode) return;

  const sun = getBody("Sol");
  const solarDistance = rocket.position.distanceTo(sun.position);
  const relativeNow = rocket.velocity.clone().sub(sun.velocity);
  const specificEnergy = 0.5 * relativeNow.lengthSq() - SUN_MU / Math.max(solarDistance, SUN_RADIUS_M);
  rocket.escaped = specificEnergy > 0;
  const startCruise = rocket.oberthBurned && (
    !rocket.escaped || solarDistance >= PLASMA_CRUISE_START_AU * AU
  );
  if (!rocket.cruiseActive && startCruise) initializeCruiseProfile();

  const drive = updatePlasmaCircuit(dt, Boolean(rocket.cruiseActive && rocket.escaped));
  if (!rocket.cruiseActive || !(drive.properAcceleration > 0)) return;

  const relativeVelocity = rocket.velocity.clone().sub(sun.velocity);
  const speed = relativeVelocity.length();
  if (speed < 1) return;

  if (brakeToggle.checked && solarDistance >= rocket.brakeStartDistance) {
    rocket.cruiseBrake = true;
  }

  const direction = relativeVelocity.normalize();
  const gamma = lorentzGamma(speed);
  const coordinateAcceleration = drive.properAcceleration / (gamma ** 3);
  const deltaSpeed = coordinateAcceleration * dt;
  const relativisticCeiling = 0.999999999 * C;
  const shieldCeiling = rocket.shieldSpeedLimitMps > 0
    ? rocket.shieldSpeedLimitMps
    : relativisticCeiling;
  const maximumSpeed = Math.min(relativisticCeiling, shieldCeiling);
  const updatedSpeed = rocket.cruiseBrake
    ? Math.max(0, speed - deltaSpeed)
    : Math.min(maximumSpeed, speed + deltaSpeed);

  rocket.velocity.copy(sun.velocity).addScaledVector(direction, updatedSpeed);
  rocket.peakSpeed = Math.max(rocket.peakSpeed, updatedSpeed);
}

function updateRocketAfterStep() {
  if (!rocket?.active || rocket.arcMode) return;

  const sun = getBody("Sol");
  const solarDistance = rocket.position.distanceTo(sun.position);
  const radialVelocity = rocketRadialVelocity();
  rocket.minimumSolarDistance = Math.min(rocket.minimumSolarDistance, solarDistance);

  if (!rocket.oberthBurned) {
    for (const body of bodies) {
      const distance = rocket.position.distanceTo(body.position);
      if (distance <= body.radiusM) {
        rocket.active = false;
        rocket.crashed = true;
        rocketStateStat.textContent = `Impact: ${body.name}`;
        return;
      }
    }
  }

  const crossedPeriapsis = rocket.lastRadialVelocity < 0 && radialVelocity >= 0;

  if (!rocket.oberthBurned && crossedPeriapsis) {
    const burn = Number(oberthSlider.value) * 1000;
    if (burn > 0) {
      const prograde = rocket.velocity.clone().sub(sun.velocity).normalize();
      rocket.velocity.addScaledVector(prograde, burn);
      rocket.acceleration.copy(accelerationAt(rocket.position));
    }

    rocket.oberthBurned = true;
    const relativeVelocity = rocket.velocity.clone().sub(sun.velocity);
    const specificEnergy = 0.5 * relativeVelocity.lengthSq() - SUN_MU / solarDistance;
    rocket.escaped = specificEnergy > 0;

    if (rocket.escaped) {
      const vInfinity = Math.sqrt(2 * specificEnergy);
      rocketStateStat.textContent = `Hyperbolic solar escape · v∞ ${formatNumber(vInfinity / 1000, 2)} km/s`;
    } else {
      rocketStateStat.textContent = "Oberth complete · still bound (increase burn)";
    }

    oberthStat.textContent = burn > 0
      ? `Burned +${formatNumber(burn / 1000, 1)} km/s @ ${formatNumber(solarDistance / SUN_RADIUS_M, 2)} R☉`
      : "Perihelion passed (0 km/s burn)";
  }

  if (rocket.oberthBurned && rocket.escaped && radialVelocity > 0) {
    if (solarDistance >= ALPHA_CENTAURI_DISTANCE_LY * LY_M) {
      rocket.reachedAlpha = true;
      rocket.active = false;
      rocketStateStat.textContent = "ARRIVED · Alpha Centauri transfer complete";
    } else if (rocket.cruiseActive) {
      const phase = rocket.cruiseBrake ? "braking" : "accelerating";
      rocketStateStat.textContent = `Plasma interstellar cruise · ${phase} · ${(rocket.plasmaProperAcceleration / EARTH_G0).toFixed(3)} g`;
    } else if (solarDistance > PLASMA_CRUISE_START_AU * AU) {
      initializeCruiseProfile();
    } else if (solarDistance > 30 * AU) {
      rocketStateStat.textContent = "Hyperbolic escape · beyond Neptune";
    } else if (solarDistance > 1.2 * AU) {
      rocketStateStat.textContent = "Hyperbolic solar escape · outbound";
    }
  }

  rocket.lastRadialVelocity = radialVelocity;
}

function resetSimulation(date = new Date()) {
  epochDate = new Date(date);
  simulatedSeconds = 0;
  physicsAccumulator = 0;
  rocket = null;
  if(typeof document!=="undefined") document.getElementById("launchButton").textContent="Launch";
  initializeBodies(epochDate);
  resetTrails();
  rebuildRocketTrail();
  rocketStateStat.textContent = "Not launched";
  oberthStat.textContent = "Armed";
  routeStat.textContent = "Optimizer runs at launch";
  assistGainStat.textContent = "—";
  if (typeof alphaGroup !== "undefined") alphaGroup.visible = false;
}

// -----------------------------------------------------------------------------
// Interstellar visual scale
// -----------------------------------------------------------------------------
function interstellarViewActive() {
  if (!rocket) return false;
  const sun = getBody("Sol");
  const solarDistance = rocket.position.distanceTo(sun.position);
  return Boolean(
    rocket.reachedAlpha
    || solarDistance >= INTERSTELLAR_VIEW_AU * AU
  );
}

function cruiseRenderDirection() {
  if (rocket?.cruiseRenderDirection?.lengthSq() > 0) return rocket.cruiseRenderDirection.clone().normalize();
  if (rocket) {
    const sun = getBody("Sol");
    const direction = rocket.velocity.clone().sub(sun.velocity);
    if (direction.lengthSq() > 0) return direction.normalize();
  }
  return new THREE.Vector3(1, 0, 0);
}

function alphaRenderPosition() {
  return cruiseRenderDirection().multiplyScalar(INTERSTELLAR_RENDER_LENGTH);
}

function rocketRenderPosition() {
  if (!rocket) return new THREE.Vector3();
  if (!interstellarViewActive()) return renderVector(rocket.position);
  const sun = getBody("Sol");
  const solarDistance = rocket.position.distanceTo(sun.position);
  const fraction = clamp(solarDistance / ALPHA_TARGET_DISTANCE_M, 0, 1);
  return cruiseRenderDirection().multiplyScalar(INTERSTELLAR_RENDER_LENGTH * fraction);
}

// -----------------------------------------------------------------------------
// Three.js scene
// -----------------------------------------------------------------------------
const viewport = document.getElementById("viewport");
const canvas = document.getElementById("sceneCanvas");
const labelsLayer = document.getElementById("labels");
const scene = new THREE.Scene();
const plannedRouteLine=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x9ac8dc,transparent:true,opacity:0.6}));
scene.add(plannedRouteLine);
function updateRoutePreview(plan=null) {
  if(!plan && rocket?.active) return;
  const route=selectedRoute();
  if(!plan && route.target!=="auto" && route.origin!==route.target) plan=poweredRoutePlan(route.origin,route.target);
  const arc=plan?.encounters[0]?.arc;
  plannedRouteLine.visible=Boolean(arc);
  if(arc) {
    const sun=getBody("Sol");
    plannedRouteLine.geometry.setFromPoints(Array.from({length:129},(_,i)=>renderVector(arc.sample(arc.seconds*i/128).position.add(sun.position))));

  }
}

scene.fog = new THREE.FogExp2(0x020407, 0.00014);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = 4; // ACESFilmic
renderer.toneMappingExposure = 1.12;

const camera = new THREE.PerspectiveCamera(48, 1, 0.01, 10_000);
const ambient = new THREE.AmbientLight(0x6b82a0, 0.08);
scene.add(ambient);
const skyFill = new THREE.HemisphereLight(0xb7d4ff, 0x1a140c, 0.28);
scene.add(skyFill);
const solarLight = new THREE.PointLight(0xfff3d0, 9.5, 0, 1.05);
scene.add(solarLight);

const barycenterGroup = new THREE.Group();
const barycenterMaterial = new THREE.LineBasicMaterial({
  color: 0x6b7890,
  transparent: true,
  opacity: 0.55,
});

function addBarycenterAxis(start, end) {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  barycenterGroup.add(new THREE.Line(geometry, barycenterMaterial));
}

addBarycenterAxis(new THREE.Vector3(-0.35, 0, 0), new THREE.Vector3(0.35, 0, 0));
addBarycenterAxis(new THREE.Vector3(0, -0.35, 0), new THREE.Vector3(0, 0.35, 0));
addBarycenterAxis(new THREE.Vector3(0, 0, -0.35), new THREE.Vector3(0, 0, 0.35));
scene.add(barycenterGroup);

function stars() {
  const g = new THREE.BufferGeometry();
  const n = 5200;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 800 + Math.random() * 8200;
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    a[i * 3] = r * s * Math.cos(th);
    a[i * 3 + 1] = r * u;
    a[i * 3 + 2] = r * s * Math.sin(th);
  }
  g.setAttribute("position", new THREE.BufferAttribute(a, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({
    color: 0xc5d4ea,
    size: 1.35,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.82,
  })));
}
stars();

const alphaGroup = new THREE.Group();
alphaGroup.visible = false;
scene.add(alphaGroup);

const interstellarRouteLine = new THREE.Line(
  new THREE.BufferGeometry(),
  new THREE.LineBasicMaterial({ color: 0x7899bf, transparent: true, opacity: 0.32 }),
);
interstellarRouteLine.visible = false;
scene.add(interstellarRouteLine);

const alphaA = new THREE.Mesh(
  new THREE.SphereGeometry(0.95, 64, 48),
  new THREE.MeshStandardMaterial({ color: 0xffe1a0, emissive: 0xffc56a, emissiveIntensity: 1.4, roughness: 0.3 }),
);
alphaA.position.set(-0.75, 0.16, 0);
alphaGroup.add(alphaA);

const alphaB = new THREE.Mesh(
  new THREE.SphereGeometry(0.72, 64, 48),
  new THREE.MeshStandardMaterial({ color: 0xffc878, emissive: 0xffa24a, emissiveIntensity: 1.2, roughness: 0.32 }),
);
alphaB.position.set(0.70, -0.16, 0.15);
alphaGroup.add(alphaB);

const proximaStar = new THREE.Mesh(
  new THREE.SphereGeometry(0.40, 48, 32),
  new THREE.MeshStandardMaterial({ color: 0xff6f5f, emissive: 0xff3b2a, emissiveIntensity: 1.3, roughness: 0.35 }),
);
proximaStar.position.set(2.05, 0.58, -0.32);
alphaGroup.add(proximaStar);

const proximaB = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 18, 12),
  new THREE.MeshStandardMaterial({ color: 0x6a91b8, roughness: 0.85, metalness: 0.02 }),
);
proximaB.position.set(2.43, 0.58, -0.32);
alphaGroup.add(proximaB);

const alphaBeacon = new THREE.Mesh(
  new THREE.SphereGeometry(2.40, 24, 16),
  new THREE.MeshBasicMaterial({ color: 0xffd88a, transparent: true, opacity: 0.055, side: THREE_BACK_SIDE }),
);
alphaGroup.add(alphaBeacon);

const alphaLabel = document.createElement("div");
alphaLabel.className = "body-label alpha-target";
alphaLabel.textContent = "ALPHA CENTAURI A / B";
labelsLayer.appendChild(alphaLabel);

const proximaLabel = document.createElement("div");
proximaLabel.className = "body-label alpha-target proxima";
proximaLabel.textContent = "PROXIMA CENTAURI · b";
labelsLayer.appendChild(proximaLabel);

const bodyVisuals = new Map();
const labelElements = new Map();
const bodyTrails = new Map();
const trailSamples = new Map();
let bodyTrailDirty = false;
let rocketTrailDirty = false;
let lastBodyTrailSampleTime = -Infinity;
let rocketTrailLine = null;
let rocketTrailPoints = [];
let lastRocketTrailSampleTime = -Infinity;

function bodyVisualRadius(body) {
  if (body.name === "Sol") return 0.92;
  if (body.name === "Jupiter") return 0.58;
  if (body.name === "Saturn") return 0.50;
  if (body.name === "Uranus" || body.name === "Neptune") return 0.38;
  if (body.name === "Earth" || body.name === "Venus") return 0.26;
  if (body.name === "Mars") return 0.20;
  return 0.16;
}

function makeBodyVisual(body) {
  const radius = bodyVisualRadius(body);
  const geometry = new THREE.SphereGeometry(radius, 96, 64);
  const gasGiant = body.name === "Jupiter" || body.name === "Saturn" || body.name === "Uranus" || body.name === "Neptune";
  const material = body.name === "Sol"
    ? new THREE.MeshStandardMaterial({
      color: body.color,
      emissive: body.color,
      emissiveIntensity: 2.1,
      roughness: 0.28,
      metalness: 0,
    })
    : new THREE.MeshStandardMaterial({
      color: body.color,
      roughness: gasGiant ? 0.38 : 0.52,
      metalness: gasGiant ? 0.16 : 0.05,
    });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  if (body.name === "Sol") {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 1.38, 64, 40),
      new THREE.MeshBasicMaterial({ color: 0xffb45c, transparent: true, opacity: 0.11, side: THREE_BACK_SIDE }),
    );
    mesh.add(glow);
  }

  if (body.name === "Saturn") {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.22, radius * 1.95, 128),
      new THREE.MeshStandardMaterial({
        color: 0xc4b48a,
        roughness: 0.62,
        metalness: 0.08,
        transparent: true,
        opacity: 0.78,
        side: THREE_DOUBLE_SIDE,
      }),
    );
    ring.rotation.x = Math.PI / 2.25;
    mesh.add(ring);
  }

  bodyVisuals.set(body.name, mesh);

  const label = document.createElement("div");
  label.className = "body-label";
  label.textContent = body.name;
  labelsLayer.appendChild(label);
  labelElements.set(body.name, label);

  const trailGeometry = new THREE.BufferGeometry();
  const trailMaterial = new THREE.LineBasicMaterial({ color: body.color, transparent: true, opacity: body.name === "Sol" ? 0.72 : 0.30 });
  const trail = new THREE.Line(trailGeometry, trailMaterial);
  scene.add(trail);
  bodyTrails.set(body.name, trail);
  trailSamples.set(body.name, []);
}

for (const definition of BODY_DEFINITIONS) makeBodyVisual(definition);

function makeRocket() {
  const group = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: 0xe9eef5, roughness: 0.55, metalness: 0.22 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x303b49, roughness: 0.62 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xffd35a, emissive: 0x4d3200, emissiveIntensity: 0.5 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.095, 0.54, 32), white);
  body.position.y = 0.03;
  group.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.076, 0.22, 32), white);
  nose.position.y = 0.41;
  group.add(nose);

  // Layered forward heat shield. Its display scale is intentionally larger
  // than the physical vehicle thickness so the shield remains visible at
  // astronomical camera distances.
  const shieldMaterial = new THREE.MeshStandardMaterial({
    color: 0x4c5664,
    roughness: 0.34,
    metalness: 0.58,
  });
  const heatShield = new THREE.Mesh(new THREE.SphereGeometry(0.13, 48, 32), shieldMaterial);
  heatShield.scale.set(1.45, 0.18, 1.45);
  heatShield.position.y = 0.545;
  heatShield.name = "heatShield";
  group.add(heatShield);

  const shieldHaloMaterial = new THREE.MeshBasicMaterial({
    color: 0x67d9ff,
    transparent: true,
    opacity: 0.0,
  });
  const shieldHalo = new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 12), shieldHaloMaterial);
  shieldHalo.scale.set(1.25, 0.38, 1.25);
  shieldHalo.position.y = 0.58;
  shieldHalo.name = "shieldHalo";
  shieldHalo.visible = false;
  group.add(shieldHalo);

  const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.12, 12), dark);
  engine.position.y = -0.30;
  group.add(engine);

  for (let index = 0; index < 4; index += 1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.13), dark);
    fin.position.y = -0.22;
    fin.position.x = Math.cos(index * Math.PI / 2) * 0.11;
    fin.position.z = Math.sin(index * Math.PI / 2) * 0.11;
    fin.rotation.y = -index * Math.PI / 2;
    group.add(fin);
  }

  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.24, 12), accent);
  flame.rotation.x = Math.PI;
  flame.position.y = -0.46;
  flame.name = "flame";
  group.add(flame);

  group.visible = false;
  scene.add(group);
  return group;
}

const rocketVisual = makeRocket();
const rocketLabel = document.createElement("div");
rocketLabel.className = "body-label rocket";
rocketLabel.textContent = "ROCKET";
rocketLabel.style.display = "none";
labelsLayer.appendChild(rocketLabel);

function rebuildRocketTrail() {
  if (rocketTrailLine) {
    scene.remove(rocketTrailLine);
    rocketTrailLine.geometry.dispose();
    rocketTrailLine.material.dispose();
  }

  rocketTrailPoints = [];
  lastRocketTrailSampleTime = -Infinity;
  rocketTrailLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xffd45f, transparent: true, opacity: 0.9 }),
  );
  scene.add(rocketTrailLine);
}

function resetTrails() {
  lastBodyTrailSampleTime = -Infinity;
  for (const body of BODY_DEFINITIONS) {
    trailSamples.set(body.name, []);
    const line = bodyTrails.get(body.name);
    if (line) line.geometry.setFromPoints([]);
  }
}

function sampleTrails() {
  if (simulatedSeconds - lastBodyTrailSampleTime >= 2 * DAY) {
    lastBodyTrailSampleTime = simulatedSeconds;

    for (const body of bodies) {
      const samples = trailSamples.get(body.name);
      samples.push(renderVector(body.position));
      if (samples.length > MAX_TRAIL_POINTS) samples.shift();
      bodyTrailDirty = true;
    }
  }

  if (rocket?.active && simulatedSeconds - lastRocketTrailSampleTime >= 0.125 * DAY) {
    lastRocketTrailSampleTime = simulatedSeconds;
    rocketTrailPoints.push(rocketRenderPosition());
    if (rocketTrailPoints.length > MAX_ROCKET_TRAIL_POINTS) rocketTrailPoints.shift();
    rocketTrailDirty = true;
  }
}

// -----------------------------------------------------------------------------
// Camera controls
// -----------------------------------------------------------------------------
let cameraFocusName = "Earth";
let cameraYaw = 0.78;
let cameraPitch = 0.40;
let cameraDistance = 30;
let dragging = false;
let lastPointerX = 0;
let lastPointerY = 0;

function focusRenderPosition() {
  if (cameraFocusName === "Barycenter") return new THREE.Vector3();
  if (cameraFocusName === "Rocket" && rocket) return rocketRenderPosition();
  if (cameraFocusName === "Alpha Centauri") return alphaRenderPosition();
  if (cameraFocusName === "Cruise overview" && rocket) {
    return rocketRenderPosition().add(alphaRenderPosition()).multiplyScalar(0.5);
  }
  const body = getBody(cameraFocusName) ?? getBody("Sol");
  return renderVector(body.position);
}

function setFocus(name, distance = null) {
  cameraFocusName = name;
  if (focusSelect && [...focusSelect.options].some(option => option.value === name)) {
    focusSelect.value = name;
  }
  if (distance !== null) cameraDistance = distance;
}

function updateCamera() {
  const focus = focusRenderPosition();
  let activeDistance = cameraDistance;
  if (cameraFocusName === "Cruise overview" && rocket) {
    const separation = rocketRenderPosition().distanceTo(alphaRenderPosition());
    activeDistance = clamp(separation * 0.72 + 12, 18, 360);
  }
  const cp = Math.cos(cameraPitch);
  const offset = new THREE.Vector3(
    Math.cos(cameraYaw) * cp,
    Math.sin(cameraPitch),
    Math.sin(cameraYaw) * cp,
  ).multiplyScalar(activeDistance);

  camera.position.copy(focus).add(offset);
  camera.lookAt(focus);
}

viewport.addEventListener("pointerdown", event => {
  if (event.button !== 0 || event.target.closest("button,input,select,label,.route-card,.stage-controls")) return;
  dragging = true;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  viewport.setPointerCapture(event.pointerId);
});

viewport.addEventListener("pointermove", event => {
  if (!dragging) return;
  const dx = event.clientX - lastPointerX;
  const dy = event.clientY - lastPointerY;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  cameraYaw -= dx * 0.006;
  cameraPitch = clamp(cameraPitch + dy * 0.006, -1.45, 1.45);
});

viewport.addEventListener("pointerup", event => {
  dragging = false;
  if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
});

viewport.addEventListener("wheel", event => {
  if(event.target.closest(".route-card,.stage-controls")) return;
  event.preventDefault();
  cameraDistance = clamp(cameraDistance * Math.exp(event.deltaY * 0.0012), 0.8, 800);
}, { passive: false });

// -----------------------------------------------------------------------------
// Labels, visuals, telemetry
// -----------------------------------------------------------------------------
function updateLabel(element, worldPosition, visible) {
  if (!visible || !labelsEnabled) {
    element.style.display = "none";
    return;
  }

  const projected = worldPosition.clone().project(camera);
  if (projected.z < -1 || projected.z > 1) {
    element.style.display = "none";
    return;
  }

  const rect = viewport.getBoundingClientRect();
  element.style.display = "block";
  element.style.left = `${(projected.x * 0.5 + 0.5) * rect.width}px`;
  element.style.top = `${(-projected.y * 0.5 + 0.5) * rect.height}px`;
}

function updateVisuals() {
  for (const body of bodies) {
    const visual = bodyVisuals.get(body.name);
    const renderPosition = renderVector(body.position);
    visual.position.copy(renderPosition);
    visual.rotation.y += 0.0015;
    updateLabel(labelElements.get(body.name), renderPosition, !interstellarViewActive());

    const trail = bodyTrails.get(body.name);
    trail.visible = trailEnabled;
  }

  const sun = getBody("Sol");
  solarLight.position.copy(renderVector(sun.position));

  const showAlpha = interstellarViewActive();
  alphaGroup.visible = showAlpha;
  if (showAlpha) {
    const target = alphaRenderPosition();
    alphaGroup.position.copy(target);
    alphaGroup.rotation.y += 0.0005;
    interstellarRouteLine.visible = true;
    interstellarRouteLine.geometry.setFromPoints([new THREE.Vector3(), target]);
    updateLabel(alphaLabel, target.clone().add(new THREE.Vector3(-0.4, 1.8, 0)), true);
    updateLabel(proximaLabel, target.clone().add(new THREE.Vector3(2.35, 1.35, -0.3)), true);
  } else {
    interstellarRouteLine.visible = false;
    alphaLabel.style.display = "none";
    proximaLabel.style.display = "none";
  }

  if (rocket) {
    const rocketPosition = rocketRenderPosition();
    rocketVisual.visible = true;
    rocketVisual.position.copy(rocketPosition);

    const velocityDirection = (rocket.pathVelocity ?? rocket.velocity).clone().normalize();
    const referenceUp = new THREE.Vector3(0, 1, 0);
    rocketVisual.quaternion.setFromUnitVectors(referenceUp, velocityDirection);

    const cameraRange = camera.position.distanceTo(rocketPosition);
    const visualScale = clamp(cameraRange * 0.045, 0.32, 4.5);
    rocketVisual.scale.setScalar(visualScale);

    const flame = rocketVisual.getObjectByName("flame");
    if (flame) {
      const maxDrive = steadyPlasmaDrive(1, 1);
      const fraction = clamp((rocket.plasmaThrustN ?? 0) / Math.max(maxDrive.thrustN, 1), 0, 1);
      flame.visible = rocket.active && (rocket.cruiseActive || rocket.arcMode) && fraction > 0.00001;
      flame.scale.set(1 + 0.4 * fraction, 0.7 + 3.0 * fraction, 1 + 0.4 * fraction);
    }

    const shieldHalo = rocketVisual.getObjectByName("shieldHalo");
    if (shieldHalo) {
      const strength = clamp(rocket.shieldAttenuation ?? 0, 0, SHIELD_MAX_ATTENUATION)
        / SHIELD_MAX_ATTENUATION;
      shieldHalo.visible = rocket.active && strength > 0.002;
      shieldHalo.material.opacity = 0.06 + 0.24 * strength;
      shieldHalo.scale.set(
        1.25 + 0.35 * strength,
        0.38 + 0.30 * strength,
        1.25 + 0.35 * strength,
      );
    }

    const heatShield = rocketVisual.getObjectByName("heatShield");
    if (heatShield) {
      const thermalFraction = clamp((rocket.shieldTempK ?? 300) / SHIELD_LIMIT_K, 0, 1);
      heatShield.material.emissive = new THREE.Color(
        thermalFraction > 0.65 ? 0x351000 : 0x000000,
      );
      heatShield.material.emissiveIntensity = Math.max(0, (thermalFraction - 0.65) * 2.2);
    }
    updateLabel(rocketLabel, rocketPosition, true);
  } else {
    rocketVisual.visible = false;
    rocketLabel.style.display = "none";
  }

  rocketTrailLine.visible = rocketTrailEnabled;
}

function projectRelativisticCruise(initialSpeed, distance, properAcceleration, brakeAtArrival, alreadyBraking = false) {
  const safeDistance = Math.max(0, distance);
  const speed = clamp(initialSpeed, 0, 0.999999999 * C);

  if (safeDistance <= 0) {
    return { earthSeconds: 0, travelerSeconds: 0, peakSpeed: speed, arrivalSpeed: speed };
  }

  if (!(properAcceleration > 0)) {
    const coastSpeed = Math.max(speed, 1);
    return {
      earthSeconds: safeDistance / coastSpeed,
      travelerSeconds: safeDistance / coastSpeed / lorentzGamma(coastSpeed),
      peakSpeed: coastSpeed,
      arrivalSpeed: coastSpeed,
    };
  }

  const beta0 = clamp(speed / C, 0, 1 - 1e-14);
  const eta0 = Math.atanh(beta0);
  const cosh0 = Math.cosh(eta0);
  const sinh0 = Math.sinh(eta0);
  const scale = properAcceleration * safeDistance / (C * C);

  if (alreadyBraking) {
    const cosh1 = Math.max(1, cosh0 - scale);
    const eta1 = Math.acosh(cosh1);
    const sinh1 = Math.sinh(eta1);
    const earthSeconds = C / properAcceleration * Math.max(0, sinh0 - sinh1);
    const travelerSeconds = C / properAcceleration * Math.max(0, eta0 - eta1);
    const arrivalSpeed = C * Math.tanh(eta1);
    return { earthSeconds, travelerSeconds, peakSpeed: speed, arrivalSpeed };
  }

  if (!brakeAtArrival) {
    const cosh1 = cosh0 + scale;
    const eta1 = Math.acosh(cosh1);
    const sinh1 = Math.sinh(eta1);
    const earthSeconds = C / properAcceleration * (sinh1 - sinh0);
    const travelerSeconds = C / properAcceleration * (eta1 - eta0);
    const peakSpeed = C * Math.tanh(eta1);
    return { earthSeconds, travelerSeconds, peakSpeed, arrivalSpeed: peakSpeed };
  }

  // Accelerate, flip, then decelerate to rest at the destination. With an
  // initial rapidity eta0, the midpoint rapidity follows from integrating
  // x = c²/a (cosh eta_1 - cosh eta_0) on each proper-acceleration segment.
  const coshMid = Math.max(1, 0.5 * (scale + cosh0 + 1));
  const etaMid = Math.acosh(coshMid);
  const sinhMid = Math.sinh(etaMid);
  const earthSeconds = C / properAcceleration * (2 * sinhMid - sinh0);
  const travelerSeconds = C / properAcceleration * (2 * etaMid - eta0);
  const peakSpeed = C * Math.tanh(etaMid);
  return { earthSeconds, travelerSeconds, peakSpeed, arrivalSpeed: 0 };
}

function updateRelativisticClocks(vInfinity, solarDistance) {
  if(rocket?.leg?.encounter?.arc) {
    earthClockValue.textContent=formatElapsed(rocket.earthElapsedSeconds);
    travelerClockValue.textContent=formatElapsed(rocket.travelerProperSeconds);
    earthClockProjection.textContent=`${rocket.leg.targetName} · planned ${(rocket.leg.duration/DAY).toFixed(2)} days`;
    travelerClockProjection.textContent="Planetary cruise · negligible time dilation";
    return;
  }
  if (!rocket) {
    earthClockValue.textContent = "0.000000 Earth yr";
    travelerClockValue.textContent = "0.000000 Earth yr";
    earthClockProjection.textContent = "Alpha arrival: waiting for launch";
    travelerClockProjection.textContent = "Alpha arrival: waiting for launch";
    relativityDelta.textContent = "Traveler/Earth difference: —";
    return;
  }

  earthClockValue.textContent = formatEarthYears(rocket.earthElapsedSeconds);
  travelerClockValue.textContent = formatEarthYears(rocket.travelerProperSeconds);

  if (rocket.reachedAlpha) {
    earthClockProjection.textContent = `Alpha arrival: ${formatEarthYears(rocket.earthElapsedSeconds)}`;
    travelerClockProjection.textContent = `Alpha arrival: ${formatEarthYears(rocket.travelerProperSeconds)}`;
    const saved = Math.max(0, rocket.earthElapsedSeconds - rocket.travelerProperSeconds);
    relativityDelta.textContent = `Traveler arrives younger by ${formatClockDifference(saved)}`;
    return;
  }

  if (!(vInfinity > 0) || rocket.arcMode) {
    earthClockProjection.textContent = "Alpha arrival: waiting for solar escape";
    travelerClockProjection.textContent = "Alpha arrival: waiting for solar escape";
    const liveDifference = Math.max(0, rocket.earthElapsedSeconds - rocket.travelerProperSeconds);
    relativityDelta.textContent = `Traveler/Earth difference now: ${formatClockDifference(liveDifference)}`;
    return;
  }

  const sun = getBody("Sol");
  const liveSpeed = rocket.velocity.clone().sub(sun.velocity).length();
  const alphaDistance = ALPHA_CENTAURI_DISTANCE_LY * LY_M;
  const remainingDistance = Math.max(0, alphaDistance - Math.min(solarDistance, alphaDistance));
  const properAcceleration = steadyPlasmaDrive(plasmaThrottleCommand(), Math.max(0.05, rocket.thermalDerate ?? 1)).properAcceleration;
  const projection = projectRelativisticCruise(
    rocket.cruiseActive ? liveSpeed : vInfinity,
    remainingDistance,
    properAcceleration,
    brakeToggle.checked,
    Boolean(rocket.cruiseActive && rocket.cruiseBrake),
  );

  const earthArrivalSeconds = rocket.earthElapsedSeconds + projection.earthSeconds;
  const travelerArrivalSeconds = rocket.travelerProperSeconds + projection.travelerSeconds;
  const savedSeconds = Math.max(0, earthArrivalSeconds - travelerArrivalSeconds);

  earthClockProjection.textContent = `Alpha arrival: ${formatEarthYears(earthArrivalSeconds)}`;
  travelerClockProjection.textContent = `Alpha arrival: ${formatEarthYears(travelerArrivalSeconds)} · peak ${(projection.peakSpeed / C).toFixed(3)} c`;
  relativityDelta.textContent = `Traveler arrives younger by ${formatClockDifference(savedSeconds)}`;
}

function formatClockDifference(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 1) return `${formatNumber(seconds * 1000, 2)} ms`;
  if (seconds < 60) return `${formatNumber(seconds, 3)} s`;
  if (seconds < 3600) return `${formatNumber(seconds / 60, 3)} min`;
  if (seconds < DAY) return `${formatNumber(seconds / 3600, 3)} h`;
  if (seconds < YEAR) return `${formatNumber(seconds / DAY, 4)} days`;
  return `${formatNumber(seconds / YEAR, 8)} Earth yr`;
}

function updateThermalGauge(fillElement, valueElement, temperatureK, maximumK) {
  if (!fillElement || !valueElement) return;
  const fraction = clamp(temperatureK / maximumK, 0, 1);
  fillElement.style.width = `${(fraction * 100).toFixed(1)}%`;
  valueElement.textContent = `${formatNumber(temperatureK, 0)} K · ${formatNumber(fraction * 100, 0)}%`;
  fillElement.dataset.level = fraction >= THERMAL_HARD_FRACTION ? "hot" : fraction >= 0.70 ? "warm" : "normal";
}

function estimateRemainingAssistSeconds() {
  if (!rocket?.arcMode) return 0;
  let remaining = rocket.leg ? Math.max(0, rocket.leg.duration - rocket.leg.elapsed) : 0;
  if (rocket.plan?.encounters) {
    for (let i = rocket.routeIndex + 1; i < rocket.plan.encounters.length; i += 1) {
      remaining += rocket.plan.encounters[i].transferDuration ?? 0;
    }
  }
  return remaining;
}

function updateTelemetry() {
  updateMissionSummary();
  const plasmaDemandW = rocket ? (rocket.acceleratorPowerW + rocket.ohmicLossW) : 0;
  const booster = rocket?.magnosBus ?? magnosBoosterForPlasma(plasmaDemandW);
  document.getElementById("magnosOutput").textContent = `${formatVoltage(booster.outputV)} · ${formatNumber(booster.outputA * 1000, 4)} mA · ${formatNumber(booster.outputW, 3)} W`;
  document.getElementById("magnosInput").textContent = `5 V / 1 A input · ${booster.count} stages · ${formatNumber(booster.lossW, 3)} W loss`;
  document.getElementById("magnosStatus").textContent = rocket
    ? (booster.limited
      ? "Auxiliary bank · power limited"
      : "Auxiliary bank · separate from hypothetical drive source")
    : (booster.limited ? "Power limited · gain target unavailable" : "Standby · plasma load disconnected");

  const sun = getBody("Sol");
  const now = currentDate();
  const energy = totalSystemEnergy();
  const energyDrift = (energy - initialSystemEnergy) / Math.abs(initialSystemEnergy) * 100;

  dateStat.textContent = now.toISOString().replace("T", " ").slice(0, 19) + " UTC";
  elapsedStat.textContent = formatElapsed(simulatedSeconds);
  sunBaryStat.textContent = `${formatNumber(sun.position.length() / AU, 6)} AU`;
  energyDriftStat.textContent = `${energyDrift >= 0 ? "+" : ""}${energyDrift.toExponential(2)} %`;
  const requestedThrottle = plasmaThrottleCommand();
  propulsorStat.textContent = `${formatNumber(requestedThrottle * 100, 0)}% · ${rocket?.cruiseActive ? (rocket.cruiseBrake ? "BRAKING" : "THRUSTING") : "armed"}`;

  if (!rocket) {
    rocketSpeedStat.textContent = "—";
    helioSpeedStat.textContent = "—";
    solarDistanceStat.textContent = "—";
    closestStat.textContent = "—";
    vinfStat.textContent = "—";
    alphaStat.textContent = "—";
    if (solarExitStat) solarExitStat.textContent = "—";
    peakSpeedStat.textContent = "—";
    plasmaElectricalStat.textContent = "—";
    plasmaMagneticStat.textContent = "—";
    plasmaThrustStat.textContent = "—";
    plasmaAccelerationStat.textContent = "—";
    shieldEmfStat.textContent = "—";
    shieldAttenuationStat.textContent = "—";
    casimirStat.textContent = `${formatNumber(casimirPressurePa(Number(casimirGapSlider.value) * 1e-9), 3)} Pa · net thrust 0 N`;
    spaceTempStat.textContent = `${CMB_TEMPERATURE_K.toFixed(3)} K background`;
    radiatorDeployStat.textContent = `stowed · ${formatNumber(RADIATOR_AREA_MIN_M2 / 1000, 0)}k m²`;
    thermalGovernorStat.textContent = `76–79% equilibrium / 80% ceiling · max-power armed`;
    updateThermalGauge(coilTempFill, coilTempValue, 300, COIL_LIMIT_K);
    updateThermalGauge(reactorTempFill, reactorTempValue, 500, REACTOR_LIMIT_K);
    updateThermalGauge(radiatorTempFill, radiatorTempValue, 300, RADIATOR_LIMIT_K);
    updateThermalGauge(hullTempFill, hullTempValue, 300, HULL_LIMIT_K);
    updateThermalGauge(shieldTempFill, shieldTempValue, 300, SHIELD_LIMIT_K);
    updateRelativisticClocks(0, 0);
    return;
  }

  const relativePosition = rocket.position.clone().sub(sun.position);
  const relativeVelocity = rocket.velocity.clone().sub(sun.velocity);
  const solarDistance = relativePosition.length();
  const specificEnergy = solarDistance > 0
    ? 0.5 * relativeVelocity.lengthSq() - SUN_MU / solarDistance
    : -Infinity;
  const vInfinity = !rocket.arcMode && specificEnergy > 0 ? Math.sqrt(2 * specificEnergy) : 0;

  let closestBody = null;
  let closestDistance = Infinity;
  for (const body of bodies) {
    if (body.name === "Sol") continue;
    const distance = rocket.position.distanceTo(body.position) - body.radiusM;
    if (distance < closestDistance) {
      closestDistance = distance;
      closestBody = body;
    }
  }

  const displayedRocketSpeed = rocket.arcMode
    ? Math.max(rocket.modeledHeliocentricSpeed ?? 0, relativeVelocity.length())
    : rocket.velocity.length();
  const displayedHelioSpeed = rocket.arcMode
    ? Math.max(rocket.modeledHeliocentricSpeed ?? 0, relativeVelocity.length())
    : relativeVelocity.length();
  rocketSpeedStat.textContent = formatSpeed(displayedRocketSpeed);
  helioSpeedStat.textContent = formatSpeed(displayedHelioSpeed);
  solarDistanceStat.textContent = `${formatNumber(solarDistance / AU, 5)} AU · min ${formatNumber(rocket.minimumSolarDistance / SUN_RADIUS_M, 2)} R☉`;
  closestStat.textContent = closestBody ? `${closestBody.name} · ${formatDistanceMeters(Math.max(0, closestDistance))}` : "—";
  peakSpeedStat.textContent = rocket.peakSpeed > 0
    ? `${formatSpeed(rocket.peakSpeed)} · ${(rocket.peakSpeed / C).toFixed(3)} c`
    : "—";

  plasmaElectricalStat.textContent = `${formatPower(rocket.acceleratorPowerW)} · ${formatNumber(rocket.acceleratorPowerW > 0 ? rocket.acceleratorPowerW / Math.max(rocket.coilCurrentA, 1) / 1e6 : 0, 2)} MV · ${formatNumber(rocket.coilCurrentA / 1000, 1)} kA`;
  plasmaMagneticStat.textContent = `${formatNumber(rocket.coilFieldT, 2)} T · L ${formatNumber(COIL_INDUCTANCE_H, 1)} H · R ${formatNumber(COIL_RESISTANCE_OHM, 4)} Ω`;
  plasmaThrustStat.textContent = `${formatNumber(rocket.plasmaThrustN / 1000, 2)} kN · ṁ ${formatNumber(rocket.propellantFlowKgS, 5)} kg/s`;
  plasmaAccelerationStat.textContent = `${formatNumber(rocket.plasmaProperAcceleration / EARTH_G0, 4)} g · derate ${formatNumber(rocket.thermalDerate * 100, 0)}%`;
  shieldEmfStat.textContent = `${formatNumber(rocket.shieldMagneticFieldT ?? 0, 2)} T · ${formatField(rocket.shieldMotionalFieldVm)} · ${formatVoltage(rocket.shieldMotionalEmfV)} across sheath`;
  shieldAttenuationStat.textContent = `${formatNumber((rocket.shieldAttenuation ?? 0) * 100, 1)}% MHD · ${formatHeatFlux(rocket.shieldParticleHeatFluxWm2)} → ${formatHeatFlux(rocket.shieldedParticleHeatFluxWm2)} · thermal ceiling ${rocket.shieldSpeedLimitMps > 0 ? (rocket.shieldSpeedLimitMps / C).toFixed(6) + " c" : "—"}`;
  const gapM = Number(casimirGapSlider.value) * 1e-9;
  casimirStat.textContent = `${formatNumber(casimirPressurePa(gapM), 3)} Pa · ${formatNumber(casimirForceN(gapM) / 1000, 3)} kN internal`;
  spaceTempStat.textContent = `${CMB_TEMPERATURE_K.toFixed(3)} K bg · solar ${formatNumber(rocket.solarFluxWm2, 3)} W/m²`;
  radiatorDeployStat.textContent = `${formatNumber((rocket.radiatorDeployment ?? 0) * 100, 0)}% · ${formatNumber((rocket.radiatorAreaM2 ?? RADIATOR_AREA_MIN_M2) / 1000, 0)}k m²`;
  const propulsionMode = rocket.arcMode ? "POWERED ASSIST" : (rocket.cruiseActive ? "MAX-POWER" : "STANDBY");
  thermalGovernorStat.textContent = `${propulsionMode} · 76–79% equilibrium / 80% ceiling · ${formatNumber((rocket.thermalDerate ?? 1) * 100, 0)}% available`;
  updateThermalGauge(coilTempFill, coilTempValue, rocket.coilTempK, COIL_LIMIT_K);
  updateThermalGauge(reactorTempFill, reactorTempValue, rocket.reactorTempK, REACTOR_LIMIT_K);
  updateThermalGauge(radiatorTempFill, radiatorTempValue, rocket.radiatorTempK, RADIATOR_LIMIT_K);
  updateThermalGauge(hullTempFill, hullTempValue, rocket.hullTempK, HULL_LIMIT_K);
  updateThermalGauge(shieldTempFill, shieldTempValue, rocket.shieldTempK, SHIELD_LIMIT_K);

  if (rocket.arcMode) {
    vinfStat.textContent = `Powered assist · Δv ${formatNumber(rocket.assistPlasmaDeltaV / 1000, 1)} km/s`;
    const plannedRemaining = estimateRemainingAssistSeconds();
    if (solarExitStat) solarExitStat.textContent = `planning · assist phase ${formatNumber(plannedRemaining / YEAR, 3)} yr remaining`;
    alphaStat.textContent = "Total ETA recalculates after Solar Oberth";
  } else if (vInfinity > 0) {
    vinfStat.textContent = formatSpeed(vInfinity);
    const driveAcceleration = steadyPlasmaDrive(plasmaThrottleCommand(), Math.max(0.05, rocket.thermalDerate ?? 1)).properAcceleration;
    const currentSpeed = rocket.cruiseActive ? relativeVelocity.length() : vInfinity;
    const exitDistanceM = SOLAR_SYSTEM_EXIT_AU * AU;
    const remainingToExit = Math.max(0, exitDistanceM - Math.min(solarDistance, exitDistanceM));
    const exitProjection = projectRelativisticCruise(
      currentSpeed,
      remainingToExit,
      driveAcceleration,
      false,
      false,
    );
    const exitTotalSeconds = rocket.earthElapsedSeconds + exitProjection.earthSeconds;
    if (solarExitStat) {
      solarExitStat.textContent = solarDistance >= exitDistanceM
        ? `crossed @ ${formatNumber(rocket.earthElapsedSeconds / YEAR, 4)} Earth yr`
        : `${formatNumber(exitTotalSeconds / YEAR, 4)} Earth yr total · ${SOLAR_SYSTEM_EXIT_AU} AU`;
    }

    const remainingDistance = Math.max(0, ALPHA_CENTAURI_DISTANCE_LY * LY_M - Math.min(solarDistance, ALPHA_CENTAURI_DISTANCE_LY * LY_M));
    const projection = projectRelativisticCruise(
      currentSpeed,
      remainingDistance,
      driveAcceleration,
      brakeToggle.checked,
      Boolean(rocket.cruiseActive && rocket.cruiseBrake),
    );
    const alphaTotalSeconds = rocket.earthElapsedSeconds + projection.earthSeconds;
    alphaStat.textContent = `${formatNumber(alphaTotalSeconds / YEAR, 3)} Earth yr total · peak ${(projection.peakSpeed / C).toFixed(3)} c`;
  } else {
    vinfStat.textContent = "Bound to Sun";
    if (solarExitStat) solarExitStat.textContent = "Waiting for hyperbolic escape";
    alphaStat.textContent = "No hyperbolic escape yet";
  }

  updateRelativisticClocks(vInfinity, solarDistance);
}

function resizeRenderer() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
}

// -----------------------------------------------------------------------------
// UI
// -----------------------------------------------------------------------------
const playButton = document.getElementById("playButton");
const resetButton = document.getElementById("resetButton");
const launchButton = document.getElementById("launchButton");
const statusBadge = document.getElementById("statusBadge");
const speedSlider = document.getElementById("speedSlider");
const speedValue = document.getElementById("speedValue");
const focusSelect = document.getElementById("focusSelect");
const injectionSlider = document.getElementById("injectionSlider");
const injectionValue = document.getElementById("injectionValue");
const flybySlider = document.getElementById("flybySlider");
const flybyValue = document.getElementById("flybyValue");
const cruiseThrustSlider = document.getElementById("cruiseThrustSlider");
const cruiseThrustValue = document.getElementById("cruiseThrustValue");
const casimirGapSlider = document.getElementById("casimirGapSlider");
const casimirGapValue = document.getElementById("casimirGapValue");
const brakeToggle = document.getElementById("brakeToggle");
const oberthSlider = document.getElementById("oberthSlider");
const oberthValue = document.getElementById("oberthValue");
const periSlider = document.getElementById("periSlider");
const periValue = document.getElementById("periValue");
const trailToggle = document.getElementById("trailToggle");
const labelToggle = document.getElementById("labelToggle");
const rocketTrailToggle = document.getElementById("rocketTrailToggle");

const dateStat = document.getElementById("dateStat");
const elapsedStat = document.getElementById("elapsedStat");
const sunBaryStat = document.getElementById("sunBaryStat");
const energyDriftStat = document.getElementById("energyDriftStat");
const rocketStateStat = document.getElementById("rocketStateStat");
const routeStat = document.getElementById("routeStat");
const assistGainStat = document.getElementById("assistGainStat");
const propulsorStat = document.getElementById("propulsorStat");
const plasmaElectricalStat = document.getElementById("plasmaElectricalStat");
const plasmaMagneticStat = document.getElementById("plasmaMagneticStat");
const plasmaThrustStat = document.getElementById("plasmaThrustStat");
const plasmaAccelerationStat = document.getElementById("plasmaAccelerationStat");
const shieldEmfStat = document.getElementById("shieldEmfStat");
const shieldAttenuationStat = document.getElementById("shieldAttenuationStat");
const casimirStat = document.getElementById("casimirStat");
const spaceTempStat = document.getElementById("spaceTempStat");
const radiatorDeployStat = document.getElementById("radiatorDeployStat");
const thermalGovernorStat = document.getElementById("thermalGovernorStat");
const coilTempFill = document.getElementById("coilTempFill");
const coilTempValue = document.getElementById("coilTempValue");
const reactorTempFill = document.getElementById("reactorTempFill");
const reactorTempValue = document.getElementById("reactorTempValue");
const radiatorTempFill = document.getElementById("radiatorTempFill");
const radiatorTempValue = document.getElementById("radiatorTempValue");
const hullTempFill = document.getElementById("hullTempFill");
const hullTempValue = document.getElementById("hullTempValue");
const shieldTempFill = document.getElementById("shieldTempFill");
const shieldTempValue = document.getElementById("shieldTempValue");
const peakSpeedStat = document.getElementById("peakSpeedStat");
const rocketSpeedStat = document.getElementById("rocketSpeedStat");
const helioSpeedStat = document.getElementById("helioSpeedStat");
const solarDistanceStat = document.getElementById("solarDistanceStat");
const closestStat = document.getElementById("closestStat");
const vinfStat = document.getElementById("vinfStat");
const alphaStat = document.getElementById("alphaStat");
const solarExitStat = document.getElementById("solarExitStat");
const oberthStat = document.getElementById("oberthStat");
const earthClockValue = document.getElementById("earthClockValue");
const travelerClockValue = document.getElementById("travelerClockValue");
const earthClockProjection = document.getElementById("earthClockProjection");
const travelerClockProjection = document.getElementById("travelerClockProjection");
const relativityDelta = document.getElementById("relativityDelta");

function updateMissionSummary() {
  const drive=steadyPlasmaDrive();
  const trip=interstellarEnvelope(ALPHA_TARGET_DISTANCE_M,drive.properAcceleration);
  const summary=document.getElementById("missionFeasibility");
  summary.textContent=trip ? `Alpha Cen A/B · 4.37 ly. Ideal flip-and-brake: ${(trip.earthSeconds/YEAR).toFixed(2)} Earth yr / ${(trip.travelerSeconds/YEAR).toFixed(2)} traveler yr. ${trip.travelerSeconds<2*YEAR ? "Under 2 traveler years in the ideal model only." : "Two-year traveler target not met."} Earth-time floor: 4.37 yr. Fuel inventory unmodeled.` : "No powered interstellar solution";
  document.getElementById("launchButton").disabled=Boolean(rocket?.active);
  document.getElementById("engineBankStat").textContent=`${engineCount()} × ${formatVoltage(voltageCeiling())} ceiling`;
  const bank=magnosBoosterForPlasma();
  document.getElementById("bankSummary").textContent=`${bank.count} Magnos · ${bank.availableW.toFixed(0)} W shared output budget · target ${formatVoltage(bank.targetV)}. Drive source: hypothetical ${formatPower(drive.acceleratorPowerW)}; shared thermal limit.`;
  const leg=rocket?.leg?.encounter;
  document.getElementById("routeComparison").textContent=leg ? `${leg.method} · ${(leg.transferDuration/DAY).toFixed(1)} d · plasma Δv ${(leg.poweredDeltaV/1000).toFixed(1)} km/s · Hohmann baseline ${(leg.naturalTime/DAY).toFixed(1)} d (different arrival phase)` : "Tangent-matched plasma arcs · acceleration and braking included";
  const brake=magneticBrake({densityKgM3:INTERSTELLAR_NUMBER_DENSITY_M3*PROTON_MASS_KG,speed:rocket?.modeledHeliocentricSpeed||0,areaM2:SHIELD_AREA_M2,fieldT:rocket?.coilFieldT||0});
  document.getElementById("brakeSummary").textContent=brake.valid ? `Reverse plasma thrust for arrival. External-plasma magnetic drag upper bound: ${brake.forceN.toExponential(2)} N; diagnostic only.` : "Reverse plasma thrust for arrival. Classical magnetic-drag estimate invalid above 0.1c; excluded from flight.";
  for(const id of ["routeOrigin","routeTarget","engineCountSlider","plasmaVoltageSlider","voltageScale","boosterCount","radiatorTarget"]) document.getElementById(id).disabled=Boolean(rocket?.active || (id==="routeOrigin" && rocket?.lockedTo));
}

function syncControls() {
  document.getElementById("engineCountValue").textContent=engineCount();
  document.getElementById("plasmaVoltageValue").textContent=formatVoltage(voltageCeiling());
  updateMissionSummary();
  updateRoutePreview();
  simulationDaysPerSecond = 10 ** Number(speedSlider.value);
  speedValue.textContent = formatSimulationSpeed(simulationDaysPerSecond);
  injectionValue.textContent = `${formatNumber(Number(injectionSlider.value), 2)} km/s`;
  flybyValue.textContent = `${formatNumber(Number(flybySlider.value), 0)} km`;
  const throttle = Number(cruiseThrustSlider.value) / 100;
  const idealDrive = steadyPlasmaDrive(throttle, 1);
  cruiseThrustValue.textContent = `${formatNumber(Number(cruiseThrustSlider.value), 0)}% · ${formatNumber(idealDrive.properAcceleration / EARTH_G0, 3)} g`;
  casimirGapValue.textContent = `${formatNumber(Number(casimirGapSlider.value), 0)} nm`;
  if (rocket?.cruiseActive) recomputeCruiseBrakePoint();
  oberthValue.textContent = `${formatNumber(Number(oberthSlider.value), 2)} km/s`;
  periValue.textContent = `${formatNumber(Number(periSlider.value), 1)} R☉`;
}

playButton.addEventListener("click", () => {
  isPlaying = !isPlaying;
  playButton.textContent = isPlaying ? "Pause" : "Play";
  statusBadge.textContent = isPlaying ? "RUNNING" : "PAUSED";
});

resetButton.addEventListener("click", () => {
  resetSimulation(new Date());
  updateRoutePreview();
  setFocus("Earth", 28);
});

for(const id of ["routeOrigin","routeTarget"]) {
  const select=document.getElementById(id);
  for(const body of BODY_DEFINITIONS.filter(b=>b.elements)) {
    const option=document.createElement("option"); option.value=body.name; option.textContent=body.name;select.append(option);
  }
  select.value=id==="routeOrigin" ? "Earth" : "Mars";
}
const autoOption=document.createElement("option");autoOption.value="auto";autoOption.textContent="Alpha Cen via automatic assists";document.getElementById("routeTarget").append(autoOption);
launchButton.addEventListener("click", launchRocket);
for(const id of ["engineCountSlider","plasmaVoltageSlider","voltageScale","boosterCount","radiatorTarget"]) document.getElementById(id).addEventListener("input",syncControls);
for(const id of ["routeOrigin","routeTarget"]) document.getElementById(id).addEventListener("change",()=>{ updateMissionSummary(); updateRoutePreview(); });
speedSlider.addEventListener("input", syncControls);
injectionSlider.addEventListener("input", syncControls);
flybySlider.addEventListener("input", syncControls);
cruiseThrustSlider.addEventListener("input", syncControls);
casimirGapSlider.addEventListener("input", syncControls);
brakeToggle.addEventListener("change", () => { syncControls(); if (rocket?.cruiseActive) recomputeCruiseBrakePoint(); });
oberthSlider.addEventListener("input", syncControls);
periSlider.addEventListener("input", syncControls);

focusSelect.addEventListener("change", () => {
  const target = focusSelect.value;
  if (target === "Rocket" && !rocket) {
    setFocus("Earth", 22);
    return;
  }
  const suggestedDistance = target === "Barycenter" ? 180
    : target === "Jupiter" ? 52
      : target === "Rocket" ? 8
        : target === "Sol" ? 18
          : 30;
  setFocus(target, suggestedDistance);
});

trailToggle.addEventListener("change", () => { trailEnabled = trailToggle.checked; });
labelToggle.addEventListener("change", () => { labelsEnabled = labelToggle.checked; });
rocketTrailToggle.addEventListener("change", () => { rocketTrailEnabled = rocketTrailToggle.checked; });

// -----------------------------------------------------------------------------
// Main loop
// -----------------------------------------------------------------------------
resetSimulation(new Date());
syncControls();
resizeRenderer();
updateCamera();

let previousFrame = performance.now();
let lastTelemetryFrame = -Infinity;

function animate(now) {
  const realDelta = clamp((now - previousFrame) / 1000, 0, 0.05);
  previousFrame = now;

  stepSimulation(realDelta);
  if (bodyTrailDirty) {
    for (const body of bodies) bodyTrails.get(body.name).geometry.setFromPoints(trailSamples.get(body.name));
    bodyTrailDirty = false;
  }
  if (rocketTrailDirty) {
    rocketTrailLine.geometry.setFromPoints(rocketTrailPoints);
    rocketTrailDirty = false;
  }
  updateCamera();
  updateVisuals();
  if (now - lastTelemetryFrame >= 100) {
    updateTelemetry();
    lastTelemetryFrame = now;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeRenderer);
requestAnimationFrame(animate);

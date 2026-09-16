# MAGNOS // Interstellar Flight Deck — Plasma Pressure Engine v2

This build is the requested second revision of the Solar Slingshot / Alpha Centauri simulator.

## What changed

### Arrival is now a hard mission-clock hold

When a direct planetary transfer completes or the spacecraft reaches the Alpha Centauri A/B range:

- the mission physics accumulator is cleared;
- Solar-System simulation time stops advancing;
- Earth-frame and traveler clocks stop advancing;
- the UI enters `ARRIVED / HOLD` state;
- pressing **Play** does not resume time;
- only a **successfully planned new departure** releases the hold.

An invalid departure request does not release the arrival hold.

### Earth → Alpha Centauri no longer terminates at Neptune

Alpha Centauri A/B is now the default target.

Planetary encounters are optional energy/trajectory assists. After the final usable assist, the spacecraft immediately transitions to continuous interstellar plasma cruise. If a powered assist misses its target Hill sphere, the Alpha mission continues as a direct plasma injection instead of terminating.

The interstellar rendering scale activates just beyond Neptune so the UI visibly transitions from the Solar System to the Alpha Centauri leg rather than appearing to stop at Neptune.

### Futuristic bar-based cockpit

The large configuration grid has been removed from the primary UI. The cockpit now emphasizes:

- navigation-range bar;
- speed / light-speed-fraction bar;
- propellant reserve bar;
- Magnos-voltage bar;
- compact flight telemetry;
- five thermal bars;
- frozen-arrival indicator.

Only mission routing, view/simulation rate, and the Magnos plasma-engine bus are exposed as normal controls.

### Magnos schematic calibration

The included `reference/magnos-plasma.kicad_sch` is used as the design reference.

The simulator represents:

- 5 V / 1 A as the annotated source ceiling;
- the schematic's `~30KVAC ... 250Hz` node as the baseline high-voltage reference;
- 30 kVAC RMS as about 42.43 kV peak for a sine wave;
- the schematic's `target 1e+07 V / TBD` booster annotation as a selectable **hypothetical** 10 MV target ceiling.

The 87 mA text on the 30 kVAC node is not treated as power available from a 5 V / 1 A source. The Magnos voltage-ratio envelope remains power-conserving unless another energy source is modeled.

## Plasma pressure engine

The continuous open-nozzle engine still uses:

`p_e = n k_B (T_e + T_i)`

`F = mdot * v_e + p_e * A_e` with ambient pressure `p_a = 0`.

The v2 interstellar feed is a fixed hydrogen plasma mission reserve rather than a cockpit slider. Exhaust speed combines the magnetic-nozzle baseline with the relativistic speed corresponding to the selected singly-charged hydrogen accelerator voltage. The engine remains limited by available beam power, thermal rejection, finite propellant, and the open-exhaust requirement.

No open exhaust or no remaining propellant means zero sustained plasma thrust.

## Run

Serve the folder over HTTP because the simulator uses ES modules:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

`vendor/three.mjs` is a thin wrapper around the pinned Three.js CDN module, so the browser needs network access unless you replace it with a local Three.js ES module.

## Tests

No npm dependencies are required for the model/regression tests:

```bash
node tests/plasma-pressure-engine.test.mjs
node tests/magnos-booster.test.mjs
node tests/mission-regression.test.mjs
```

## Scope

This is a reduced-order educational simulator. The included KiCad schematic is a reference artifact; the simulator does not provide high-voltage construction instructions, insulation design, component certification, or a claim that the TBD voltage targets are verified hardware ratings.

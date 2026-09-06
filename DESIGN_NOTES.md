The requested pair is `magnos-plasma.kicad_sch` and `magnos-plasma.scad`.

The schematic is a single, self-contained KiCad sheet containing the original beta circuit and the complete added functional interconnect. Its 72 components comprise 24 original components and 48 added components/blocks. The original files under `reference/` are unchanged. The SVG is a readable export; the XML and wiring JSON document every electrical net and added pin.

The new connections include input fuse/disconnect, emergency stop and thermal/enclosure enable chain, controller and temperature sensors, AC bridge rectifier, DC-link capacitor and discharge resistor, differential voltage monitor, two coil channels, two electrode channels, injection valve, and neutralizer. Added diode pins explicitly identify anode/cathode. The two-pole feedthroughs use separate positive and return conductors. Chassis, input return, booster DC return, and rectified HV return are distinct nets. The source J1 simulation metadata reverses the apparent input polarity; the adaptation uses pin 1 as input positive because it feeds the oscillator VCC pins. This discrepancy needs resolving before a component-level simulation.

This is complete **functional wiring**, not a complete fabrication-ready power-electronics design. Current drivers, isolation converters, sequencing, valve suppression, protection ratings, capacitance, and bleed resistance marked TBD require actual design. Original transistor/transformer models, winding ratios and measured waveforms are absent. No claim is made that the beta circuit will operate as annotated. The low-voltage Y5/U1 control island in the original source is retained as drawn; its return is not automatically bonded to input return. Source part annotations and footprints also require reconciliation.

The source annotation is 5 V / 1 A input and approximately 30 kVAC / 87 mA output. Multiplying the output annotations gives 2610 VA; the input annotation gives 5 W. They do not establish simultaneous sustainable output ratings, power factor, peak/RMS conventions, or transformer gain. The app therefore exposes an **auxiliary, ideal power-limited envelope**, with assumed gain (default 1), adjustable load, and assumed 80% efficiency. Its maximum available output is 4 W, shared by any loads. This cannot run the application's hypothetical plasma drive. No booster output is added to that drive's existing power supply.

`magnos_booster_equivalent.cir` implements that power-conserving envelope, not the transistor-level beta circuit. `magnos_beta_booster.xml` preserves the actual source connectivity. `plasma_equivalent.cir` and `plasma_equivalent.kicad_sch` are separate ideal operating-point equivalents for the simulator: 50 H / 0.004 ohm engine coil, 6.6 MV accelerator load, and a 40 kV duty-averaged electrode load. They are not achievable ratings of Magnos. The simulated 20 T coil limit corresponds to approximately 221 kA, 195 MW winding loss and 1.22 TJ magnetic energy.

The Python-generated OpenSCAD assembly uses the app's 180 m² shield area, 50 mm sheath thickness, 2.5 m coil length and 180 illustrated turns. `magnos_beta_board.scad` uses the beta PCB's 90 × 110 mm outline and 1.6 mm thickness. Housing, chamber, coil radii, structural dimensions, feedthrough placement and cable paths are assumptions. The folded radiator envelopes do not represent the deployed radiator area. Cable colors distinguish coil power, HV positive/return, sensor bundles and valve power. Cable diameter is exaggerated for visibility; these are route centerlines, not ampacity, creepage, clearance, shielding, or thermal qualification. Both requested files are standalone: the generated `magnos-plasma.scad` embeds the assembly and board modules, and the schematic embeds its symbol definitions.

Rebuild:

```sh
python3 generate_plasma_design.py
python3 generate_magnos_plasma.py
kicad-cli sch export netlist --format kicadxml magnos-plasma.kicad_sch -o magnos-plasma.xml
kicad-cli sch export svg magnos-plasma.kicad_sch -o .
node tests/physics.mjs
node tests/magnos.mjs
python3 tests/wiring.py
openscad -o /tmp/magnos-plasma.csg magnos-plasma.scad
ngspice -b magnos_booster_equivalent.cir
ngspice -b plasma_equivalent.cir
```

The first generator requires KiCad CLI (PATH or the standard macOS application location) for source netlist extraction. OpenSCAD was found in the mounted OpenSCAD volume on this machine. CSG compilation checks syntax and geometry construction, not manifold STL fabrication. No browser frame-rate measurement has been performed.

Orbit and motion changes: the existing JPL element decoder passes Kepler residual, epoch, orbital-bound and vis-viva checks, plus a J2000 Earth reference position. Transfer interpolation now uses a Hermite curve with a moving endpoint and analytic path velocity. Encounters retain a planet offset, the solar-dive transition avoids an extra integration half-step, and trail geometry is uploaded once per frame. Telemetry refreshes at 10 Hz. Transfers remain an illustrative planner, not gravity-integrated Lambert trajectories; impulsive powered transitions may change velocity. JPL Table 1 initialization is valid for 1800–2050; long N-body extrapolation is not a precision ephemeris.

Sources: [JPL approximate planetary positions](https://ssd.jpl.nasa.gov/planets/approx_pos.html); [NASA electric propulsion overview](https://www.nasa.gov/space-technology-mission-directorate/tdm/solar-electric-propulsion/). Electric propulsion expels reaction mass; magnetic shielding in a thruster does not establish a spacecraft-wide photon or relativistic particle shield.

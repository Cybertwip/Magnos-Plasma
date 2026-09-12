# Model and validation

This is an educational simulator and a functional electrical/CAD architecture.
It is not a verified MV/GV/TV power supply or a feasible interstellar spacecraft.
The original beta schematic and PCB under `reference/` are retained unchanged.

## Transfers and planet locks

`transfer-planner.mjs` constructs a cubic Hermite arc using actual departure
and arrival velocities as endpoint tangents. The tangent heading uses `atan2`.
An inverse tangent alone cannot determine a powered trajectory: for the path
r(t), required plasma acceleration is **r″(t) + μ r / |r|³**. The duration search
predicts moving endpoints, samples acceleration and solar clearance at 257
points, and reserves 40% of ideal available thrust for tracking/startup.
This is a sampled feasible-path search, not a global optimal-control solver.

Live flight integrates solar gravity and thermally/current-limited plasma
thrust with position/velocity feedback; it does not set the position directly
to the curve. Radiators deploy during powered planetary transfers and the
available deployed area limits their power during startup. Other planets move
with the existing N-body model. Planetary perturbations along a leg are omitted;
flybys are ideal patched-conic events inside the target sphere of influence.

Ordinary routes match the planet velocity with a finite capture burn after
entering its sphere of influence. A successful capture stores the actual
planet-relative offset and applies a kinematic stationkeeping constraint.
The ship then follows the planet, with clocks and cooling continuing. This
lock is a simulator convenience, not a solved parking orbit, landing, or a
fuel-accounted stationkeeping system. The next leg begins from the locked
position and velocity without resetting the date, clocks or temperatures.
Missed encounters and failed captures do not lock or teleport.

Powered slingshots use the same tangent arcs with a nonzero incoming
planet-relative velocity, then conserve that velocity's magnitude through the
ideal gravity-assist turn. Candidate arrival excess speeds are 20, 80, 250 and
600 km/s. The optimizer ranks average chord distance/time, then outgoing speed,
among feasible outward candidates. It does not add fictitious plasma delta-v
to gravitational energy gain. Lambert/Hohmann are retained for comparison and
regression tests. A Hohmann baseline uses a different arrival phase; it is not
an equal-endpoint solution to the powered boundary conditions.

## Electrical power, wiring and CAD

The beta source annotation is 5 V / 1 A. Its 30 kVAC / 87 mA output annotation
is not a verified simultaneous operating point. The source J1 simulation
metadata conflicts with its apparent polarity; the adaptation uses pin 1 as
positive because it feeds oscillator VCC. This remains unresolved hardware work.

The rectifier feeds 1–8 cascaded isolated functional Magnos stages. The final
positive and return feed the HV branches, discharge resistor, capacitor and
differential monitor. Input return, original beta DC return, rectifier return,
final HV return, and chassis remain distinct. Original J4 supplies the coil
converter inputs; LV control uses explicit isolated control interfaces.

Assuming 80% efficiency for the beta front end and each additional stage,
**P_available = 5 × 0.8^(N+1) W**. This is a generous shared upper envelope:
coil, control and auxiliary consumption would further reduce HV output.
The app load envelope clamps voltage using sqrt(P_available × R_load).
More stages never create power. MV/GV/TV are requested voltage scales, not
insulation, conductor, switching-device or transformer ratings. Converter
circuits, protection ratings, spacing, creepage and vacuum breakdown remain
unresolved. The simulated plasma drive has a separate hypothetical TW source;
none of that source's output is attributed to the beta booster.

The single-sheet drawing uses three functional columns and explicit segmented
wire rails. Crossings connect only at junction dots. Labels identify conductors;
removing **all** net labels preserves every exported net's pin partition.
The tests also check that isolated domains do not merge. Functional converter
blocks are wired at their interfaces; their internal electronics are still TBD.

One source generates the netlist, box wires and external harness. The box
includes all non-load KiCad components, including the original beta circuit.
The separate engine model contains exactly 19 conductors: two each for shield
coil, propulsion coil, shield electrode, propulsion electrode, gas valve and
neutralizer; three each for shield/engine sensors; one chassis bond. Both sensor
supplies and returns are explicit. Every CAD endpoint references an actual
KiCad pin. The box and engine models share connector terminal coordinates.
Geometry is conceptual; cable centerlines and exaggerated dimensions are not
fabrication or electrical-clearance validation. Shield area and engine coil
length/turn count come from app constants; other dimensions are assumptions.

## Thermal and interstellar limits

Radiation rejects heat as εσA(T⁴−T_background⁴). Radiator target choices are
600, 900 and 1216 K, with at most 3.2 million m² deployed area. Engine count
shares that thermal budget; increasing voltage or count cannot multiply the
available cooling power. The accelerator model uses P_beam = 0.75 VI and
F = 2P_beam/v_exhaust, with v_exhaust = 1.5 million m/s and 60,000 kg fixed mass.
Coil magnetics and cooling are represented as one aggregate system, not a
separate duplicated coil for every selected engine. Reaction-mass inventory,
power-source mass, detailed plasma physics and structural feasibility are absent.
The rapid transit numbers therefore describe the hypothetical model only.

Alpha Centauri A/B is 4.37 light-years away; the previous 4.2465 value referred
to the nearer Proxima component. Under two **Earth years** is impossible. An
ideal rest-to-rest constant-proper-acceleration calculation can give shorter
traveler time through relativity; the UI reports both and identifies whether
the two-traveler-year target is met. The baseline is about 5.09 Earth years /
2.01 traveler years before planetary travel, fuel constraints and shield losses.
Cooling the radiators reduces acceleration and makes this target harder.

Reverse plasma thrust is the arrival brake. The live cruise velocity update
integrates proper velocity γv, and braking considers stopping distance as well
as the planned flip point. A reduced thermal speed limit commands deceleration
instead of instantly clipping away momentum. Crossing the destination distance
at significant speed is labeled a fly-through, not a completed rendezvous.
The interstellar path is a radial distance surrogate, not a 3D stellar intercept.

Increasing an isolated onboard magnetic field cannot remove net spacecraft
momentum. An external plasma interaction can exchange momentum, so a separate
classical diagnostic estimates F ≤ min(2ρv², B²/(2μ₀)) A. It yields zero in
vacuum/zero field and is excluded above 0.1c. It is an optimistic pressure bound,
not a validated magnetic-sail model, and supplies no flight braking credit.
The existing classical MHD shield closure also remains unvalidated near c.

Sources: [JPL planetary elements](https://ssd.jpl.nasa.gov/planets/approx_pos.html),
[NASA electric propulsion](https://www.nasa.gov/space-technology-mission-directorate/tdm/solar-electric-propulsion/),
[NASA Alpha Centauri distances](https://science.nasa.gov/sun/facts/),
[NASA relativity](https://science.nasa.gov/learn/basics-of-space-flight/chapter3-2/),
[NASA external-plasma momentum exchange](https://www.nasa.gov/technology/space-travel-tech/nasa-begins-testing-of-revolutionary-e-sail-technology/).

The UI borrows muted elevated surfaces, compact monospaced telemetry, and
origin/destination controls from `reference/port`; no framework/assets/install
from that reference is required. Obsolete generated equivalents, duplicate
schematics, and the former secondary generator were removed from the root.

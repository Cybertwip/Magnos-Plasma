SOLAR SLINGSHOT — SIMPLIFIED MAX-POWER PLASMA BUILD
===================================================

Files
-----
index.html
style.css
app.js
vendor/three.mjs
vendor/three-core.mjs

Run locally
-----------
The app uses ES modules. In this folder run:

    python3 -m http.server 8080

Then open:

    http://localhost:8080

What is kept in the simplified UI
---------------------------------
- Launch / play / reset.
- Simulation-speed slider.
- Camera focus selector.
- Rocket state and speed, peak speed, heliocentric speed, solar distance,
  Alpha Centauri arrival estimate, and optimized route.
- Plasma electrical power/current/voltage, magnetic circuit, thrust and proper acceleration.
- Earth-observer and traveler proper-time clocks.
- Magnetic-coil, plasma-reactor, radiator, and hull/shield thermal indicators.

The detailed route and plasma tuning controls remain fixed internally so the screen stays uncluttered.

Physics model
-------------
- 3D J2000 ecliptic orbital-state initialization.
- JPL approximate Kepler elements/rates for Mercury through Neptune.
- Barycentric Newtonian N-body gravity: Sun + planets mutually accelerate.
- Velocity-Verlet integration for massive bodies.
- Ideal patched-conic gravity-assist optimizer followed by a Sun-grazing Oberth pass.
- Relativistic interstellar propagation with Earth-vs-traveler time.

Maximum-power plasma cruise
---------------------------
Cruise starts beyond ~35 AU. The magnetic circuit follows:

    L dI/dt = V - I R
    B ~= mu0 N I / length

The plasma accelerator uses:

    P_accel = V_accel I_plasma
    P_beam = eta P_accel
    T = 2 P_beam / v_exhaust

The coil remains limited to 20 T (~221 kA). The accelerator hardware ceiling is
10 MV, but the thermal governor computes the maximum usable voltage/power from
the deployed radiator capacity instead of blindly using that ceiling.

With the default model, the 3.2 million m^2 deployed radiator and ~1216 K
radiator target allow roughly:

- ~1.46 TW electrical accelerator power.
- ~6.6 MV accelerator voltage at ~221 kA.
- 20 T magnetic field.
- ~1.46 MN ideal thrust.
- ~2.48 g ideal proper acceleration for the modeled 60,000 kg vehicle.

These are sandbox assumptions, not a claim that such a complete power source,
radiator, magnet or long-duration plasma engine currently exists. Reaction-mass
inventory is not modeled.

Thermal governor
----------------
Vacuum does not cool the vehicle by conduction; heat is rejected by radiation
toward the 2.725 K cosmic microwave background:

    P_rad = emissivity * sigma * A * (T^4 - T_background^4)

The max-power envelope is tuned so steady deep-space cruise is approximately:

- Magnetic coil: ~76% of modeled limit.
- Plasma reactor: ~79%.
- Radiator: ~76%.
- Hull / shield: ~79%.

The governor begins reducing power near 79.5% and uses 80% as a hard thermal
ceiling for the monitored cruise components.

Relativity
----------
Traveler time is integrated as:

    d_tau = dt sqrt(1 - v^2/c^2)

The interstellar thrust model uses proper acceleration, so coordinate
acceleration falls relativistically as speed approaches c.

Limitations
-----------
This is an educational astrodynamics/propulsion visualization, not a mission
navigation, plasma-MHD, thermal-FEA, materials, power-system, or
flight-qualification solver. The flyby optimizer is an ideal patched-conic
upper-bound model, and Alpha Centauri rendering uses compressed visual scale.


ACTIVE EMF / MHD HEAT SHIELD
----------------------------
This revision adds a visible forward heat-shield disk plus a reduced-order
electromagnetic plasma sheath based on the uploaded LEO plasma-shield formulas.

The code uses:
    E_motional = v * B
    J_motional = sigma * E_motional
    interaction = sigma * B^2 * sheath_thickness / (rho * v)
    attenuation = attenuation_max * (1 - exp(-gain * effective_interaction))

It also carries through the source model's capped electrode/motional current,
Joule heating, and small heat-return fractions. Solar photon heating is NOT
magnetically attenuated; only the charged-particle/plasma heat flux is.

Because interstellar space is too tenuous to have atmospheric re-entry
conductivity, the simulation explicitly assumes the spacecraft injects plasma
into the sheath once the source model's heat-activation threshold is reached.
This is an educational system assumption, not a claim that vacuum itself is a
conductive atmosphere.

The active shield participates in the same 70–80% thermal governor as the coil,
reactor, radiator and hull. The engine therefore seeks the highest plasma power
allowed by all monitored thermal limits, rather than exceeding a shield limit.

The v*B MHD closure is classical and should not be treated as a
flight-qualification relativistic plasma model near light speed.


POWERED GRAVITY-ASSIST UPDATE
-----------------------------
Planetary legs are no longer pure Hohmann waiting periods. Each candidate leg is
scored with a short thermally-limited maximum-power plasma burn, and that powered
delta-v is included in encounter v-infinity, gravity-assist turn angle, specific
orbital energy, and estimated transfer duration. The remaining route is
re-optimized after every encounter from the new heliocentric momentum and
thermal margin. Solar-system exit is defined as 120 AU for the ETA comparison.
Both Solar-system exit and Alpha Centauri ETA are displayed as total Earth time
from launch, not incomparable remaining-time values.

The assist arcs remain a reduced-order patched-conic/visual transfer model, not
a full ephemeris Lambert optimizer or flight-qualified trajectory solution.


MAGNOS PLASMA ADAPTATION
-----------------------
Open magnos-plasma.kicad_sch for the complete functional wiring and
magnos-plasma.scad for the standalone assembly with cable routes.
See DESIGN_NOTES.md for source provenance, rebuild commands, checks and
unresolved component-level engineering. The beta booster is an auxiliary
power-limited envelope in the app, not the hypothetical plasma energy source.

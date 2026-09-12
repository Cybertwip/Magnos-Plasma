SOLAR SLINGSHOT
==============
Run: python3 -m http.server 8080
Open http://localhost:8080
No install step or frontend framework is required.

Choose departure/destination planets, engine count, MV/GV/TV voltage target,
Magnos stages and radiator temperature, then Launch. Planet arrivals perform a
capture burn and lock to the planet. Select the next destination and Depart:
the ship follows its host planet between legs and retains time and temperatures.
Reset starts a new mission. Configuration is locked during an active transfer.

Select “Alpha Cen via powered slingshots” for an outward flyby search using
powered tangent arcs. Flybys turn planet-relative velocity without docking;
planetary energy gain is kept separate from plasma work. The search maximizes
average transfer speed among its sampled feasible candidates, not a proven
whole-mission optimum. Lambert remains available as a tested reference solver.

The reference UI shading and transfer organization come from reference/port.
That folder remains a reference; its application and dependencies are not needed.

Hardware artifacts
------------------
magnos-plasma.kicad_sch   Fully wired functional system, original beta at left.
magnos-plasma.scad        Separate box, components and internal pin-to-pin wires.
magnos-engine.scad        Separate engine/shield, ONLY 19 external conductors.
magnos-plasma-wiring.json Shared pin/net/terminal specification.
magnos-plasma.xml         Exported KiCad netlist used for verification.
generate_magnos_plasma.py Single generator, Python standard library + KiCad CLI.

Rebuild defaults (one booster, 10 MV target):
    python3 generate_magnos_plasma.py
Other configurations, for example three cascaded stages at a 10 TV target:
    python3 generate_magnos_plasma.py --boosters 3 --voltage-scale TV
The app's controls do not rewrite CAD files. Rebuild for the intended hardware
configuration. Generated files are standalone. KiCad CLI is found on PATH or
in the standard macOS KiCad application directory.

Checks:
    node tests/physics.mjs
    node tests/magnos.mjs
    node tests/transfers.mjs
    node tests/powered.mjs
    python3 tests/wiring.py
    openscad -o /tmp/magnos-plasma.csg magnos-plasma.scad
    openscad -o /tmp/magnos-engine.csg magnos-engine.scad

Read DESIGN_NOTES.md for equations, assumptions and physical limits.

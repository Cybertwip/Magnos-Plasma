# Solar Slingshot — Plasma Pressure Engine Upgrade

This version upgrades the propulsion model to an **open, propellant-fed magnetic-nozzle plasma engine**.

## Engine closure

For each engine bank the simulator uses:

- Plasma exit pressure: `p_e = n k_B (T_e + T_i)`
- Mass flow through the open nozzle: `mdot = n m_i v_e A_e`
- Vacuum thrust: `F = mdot v_e + p_e A_e` with `p_a = 0`
- Jet power requirement: `P_jet = 0.5 mdot v_e^2 + (p_e A_e) v_e`

The requested chamber state is scaled down when the available electrical beam power cannot sustain it. Pressure thrust is therefore **not free extra thrust**.

The default propellant is singly-ionized argon, with a nominal 40 t dry vehicle and 20 t argon load (60 t wet mass at launch). Vehicle mass is reduced as propellant leaves the nozzle.

## Important behavior

- Closing **Magnetic nozzle open** gives zero continuous external thrust.
- An empty propellant tank gives zero continuous external thrust.
- Chamber pressure, momentum thrust and pressure thrust are shown separately.
- The route/flight model consumes propellant during powered assists, capture burns, and interstellar cruise.
- The Alpha Centauri ideal flip-and-brake display is explicitly an unlimited-feed envelope; the UI separately shows how long the selected finite propellant load can sustain the current maximum feed.

## Controls added

- Plasma number density (log10 slider)
- Electron temperature `T_e` in keV
- Ion temperature `T_i` in keV
- Nozzle exit area per engine
- Argon propellant load
- Open/closed magnetic-nozzle exhaust toggle

## Run

Because the app uses ES modules, serve the folder over HTTP instead of opening `index.html` directly:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

`vendor/three.mjs` is a thin wrapper around a pinned Three.js CDN module. Replace it with your local Three.js module if you want fully offline operation.

## Test the pressure engine module

```bash
node tests/plasma-pressure-engine.test.mjs
```

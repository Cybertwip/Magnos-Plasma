import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

assert.match(app, /if \(!isPlaying \|\| missionClockHold\) return;/, 'arrival hold must stop simulation stepping');
assert.match(app, /holdMissionAtArrival\("Alpha Centauri A\/B"\)/, 'Alpha arrival must engage hold');
assert.match(app, /holdMissionAtArrival\(target\.name\)/, 'planet capture must engage hold');
assert.match(app, /A valid new departure is the only action that releases an arrival hold/, 'hold release must be tied to valid departure');
assert.match(app, /assist corridor missed · continuing to Alpha Centauri/, 'missed assist must continue Alpha mission');
assert.match(app, /if \(rocket\.interstellarMission\) \{\s*initializeCruiseProfile\(\)/, 'Alpha mission must hand off directly to cruise');
assert.match(app, /INTERSTELLAR_VIEW_AU = 31/, 'interstellar view should engage just beyond Neptune');
assert.match(html, /option value="1000" selected>kV/, 'Magnos target slider must use kV scale');
assert.match(html, /value="10000"/, '10 MV simulator target should be the default');
assert.match(html, /value="1000"><span id="propellantMassValue"/, 'fixed mission feed reserve should be 1000 t');
assert.match(html, /id="missionProgressFill"/, 'bar-based mission progress UI must exist');
assert.match(html, /id="voltageBarFill"/, 'bar-based Magnos voltage UI must exist');

console.log('mission regression tests passed');

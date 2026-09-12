"""Verify generated connections against the wiring specification and beta ports."""
import json
import re
import shutil
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

root = Path(__file__).resolve().parents[1]
tree = ET.parse(root / 'magnos-plasma.xml').getroot()
pins = {}
for net in tree.findall('./nets/net'):
    name = net.get('name').removeprefix('/')
    for pin in net.findall('node'):
        pins[(pin.get('ref'), pin.get('pin'))] = name

spec = json.loads((root / 'magnos-plasma-wiring.json').read_text())
for block in spec['blocks']:
    for pin, detail in block['pins'].items():
        assert pins[(block['reference'], pin)] == detail['net'], (block['reference'], pin, pins.get((block['reference'], pin)), detail['net'])

for ref, nets in {
    'J1': ['INPUT_5V', 'INPUT_RETURN'],
    'J3': ['BOOST_AC_A', 'BOOST_AC_B'],
    'J4': ['BOOST_DC_P', 'BOOST_DC_N'],
}.items():
    for i, net in enumerate(nets, 1):
        assert pins[(ref, str(i))] == net

assert pins[('D101', '2')] == pins[('D102', '2')] == pins[('F102', '1')]
assert pins[('D103', '1')] == pins[('D104', '1')] == pins[('C101', '2')]
assert pins[('U401', '2')] != pins[('U401', '4')], 'HV/control returns must stay separate'
assert pins[('J104', '1')] == pins[('J104', '2')] == 'CHASSIS'
assert 'FRAME' not in {n.get('name', '').removeprefix('/') for n in tree.findall('./nets/net')}
assert len(tree.findall('./components/comp')) == 64
print('PASS: all added pins, beta ports, rectifier polarity, isolated domains, chassis bond, component count')

# Strip load-net labels and confirm driver-to-feedthrough copper. Loads keep
# named stubs; KiCad still lists them on the labeled net in the check above.
text = (root / 'magnos-plasma.kicad_sch').read_text()
pattern = r'\(label "(?:SH|PR)_(?:COIL|ELECTRODE)_[PN]" \(at [^)]*\) \(effects \(font \(size [^)]*\)\)(?: \(justify [^)]*\))?\) \(uuid [^)]*\)\)'
stripped, count = re.subn(pattern, '', text)
assert count == 24, count
cli = shutil.which('kicad-cli') or '/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli'
with tempfile.TemporaryDirectory() as temp:
    schematic = Path(temp) / 'magnos-plasma.kicad_sch'
    schematic.write_text(stripped)
    output = Path(temp) / 'physical.xml'
    subprocess.run(
        [cli, 'sch', 'export', 'netlist', '--format', 'kicadxml', str(schematic), '-o', str(output)],
        check=True, capture_output=True,
    )
    actual = {}
    for net in ET.parse(output).findall('./nets/net'):
        for pin in net.findall('node'):
            actual[(pin.get('ref'), pin.get('pin'))] = net.get('code')
    for channel, load in [('201', 'L201'), ('301', 'L301'), ('401', 'Z401'), ('501', 'Z501')]:
        for driver_pin, load_pin in [('5', '1'), ('6', '2')]:
            assert actual[('U' + channel, driver_pin)] == actual[('J' + channel, load_pin)], (
                channel, driver_pin, actual.get(('U' + channel, driver_pin)), actual.get(('J' + channel, load_pin))
            )
            assert actual[(load, '1')] != actual[(load, '2')], 'load must not be shorted'
print('PASS: physical driver-to-feedthrough continuity with labels removed; no load shorts')

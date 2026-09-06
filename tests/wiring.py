"""Verify generated connections against the wiring specification and beta ports."""
import json
from pathlib import Path
import xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
r=ET.parse(root/'magnos-plasma.xml').getroot()
pins={}
for net in r.findall('./nets/net'):
    for pin in net.findall('node'):
        pins[(pin.get('ref'),pin.get('pin'))]=net.get('name').removeprefix('/')
spec=json.loads((root/'magnos-plasma-wiring.json').read_text())
for block in spec['blocks']:
    for pin,detail in block['pins'].items():
        assert pins[(block['reference'],pin)]==detail['net'],(block['reference'],pin)
for ref,nets in {'J1':['INPUT_5V','INPUT_RETURN'],'J3':['BOOST_AC_A','BOOST_AC_B'],'J4':['BOOST_DC_P','BOOST_DC_N']}.items():
    for i,net in enumerate(nets,1): assert pins[(ref,str(i))]==net
assert pins[('D101','2')]==pins[('D102','2')]==pins[('F102','1')]
assert pins[('D103','1')]==pins[('D104','1')]==pins[('C101','2')]
assert pins[('U401','2')]!=pins[('U401','4')], 'HV/control returns must stay separate'
assert len(r.findall('./components/comp'))==64
print('PASS: all added pins, all six beta port connections, rectifier polarity, isolated domains, component count')

# Strip the eight load-net labels and let KiCad independently rebuild the
# physical connectivity. This catches gaps that matching labels could hide.
import re, subprocess, tempfile, shutil
text=(root/'magnos-plasma.kicad_sch').read_text()
pattern=r'\(label "(?:SH|PR)_(?:COIL|ELECTRODE)_[PN]" \(at [^)]*\) \(effects \(font \(size [^)]*\)\)\) \(uuid [^)]*\)\)'
stripped,count=re.subn(pattern,'',text)
assert count==24,count
with tempfile.TemporaryDirectory() as temp:
    schematic=Path(temp)/'magnos-plasma.kicad_sch';schematic.write_text(stripped)
    output=Path(temp)/'physical.xml'
    cli=shutil.which('kicad-cli') or '/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli'
    subprocess.run([cli,'sch','export','netlist','--format','kicadxml',str(schematic),'-o',str(output)],check=True,capture_output=True)
    actual={}
    for net in ET.parse(output).findall('./nets/net'):
        for pin in net.findall('node'): actual[(pin.get('ref'),pin.get('pin'))]=net.get('code')
    for channel,load in [('201','L201'),('301','L301'),('401','Z401'),('501','Z501')]:
        for driver_pin,load_pin in [('5','1'),('6','2')]:
            print(channel,driver_pin,actual[('U'+channel,driver_pin)],actual[(load,load_pin)],actual[('J'+channel,load_pin)])
            assert actual[('U'+channel,driver_pin)]==actual[(load,load_pin)]==actual[('J'+channel,load_pin)]
        assert actual[(load,'1')]!=actual[(load,'2')], 'load must not be shorted'
print('PASS: physical driver-to-load and connector continuity with labels removed; no load shorts')

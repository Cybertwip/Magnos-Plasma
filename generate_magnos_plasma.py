#!/usr/bin/env python3
"""Build magnos-plasma.kicad_sch / .scad from the Magnos beta sheet.

Added power, protection, rectifier, coil, electrode, valve and
neutralizer blocks are placed on the 1.27 mm KiCad grid and connected
with explicit segmented rails. Labels identify nets; all-labels-removed
netlist verification proves actual wire continuity.
Power converters / interlocks are functional blocks, not designed PCBs.
"""
from pathlib import Path
import argparse
import shutil
import subprocess
import xml.etree.ElementTree as ET
import json
import math
import re
import uuid

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--boosters', type=int, choices=range(1,9), default=1)
parser.add_argument('--voltage-scale', choices=['MV','GV','TV'], default='MV')
args = parser.parse_args()
target_voltage = 10 * {'MV':1e6,'GV':1e9,'TV':1e12}[args.voltage_scale]
G = 1.27  # KiCad connection grid, millimetres


def grid(n):
    return round(n * G + 1e-12, 2)


def parse(text):
    tokens = re.findall(r'"(?:\\.|[^"\\])*"|[()]|[^\s()]+', text)
    stack = []
    root = None
    for token in tokens:
        if token == '(':
            node = []
            if stack:
                stack[-1].append(node)
            stack.append(node)
        elif token == ')':
            root = stack.pop()
        else:
            stack[-1].append(token)
    return root


def child(n, key):
    return next(x for x in n if isinstance(x, list) and x[0] == key)


def children(n, key):
    return [x for x in n if isinstance(x, list) and x[0] == key]


def dump(n):
    return '(' + '\n'.join(dump(x) if isinstance(x, list) else x for x in n) + ')'


def q(s):
    return json.dumps(s)


def uid(s):
    return '"' + str(uuid.uuid5(uuid.NAMESPACE_URL, 'magnos-plasma/' + s)) + '"'


def expr(s):
    return parse(s)


fx = '(effects (font (size 1.27 1.27)))'
source = ROOT / 'reference/magnos-beta-5.0-alpha.kicad_sch'
root = parse(source.read_text())
lib = child(root, 'lib_symbols')
child(root, 'paper')[1:] = ['"A0"']
root_id = child(root, 'uuid')[1].strip('"')

# Pin-coordinate convention verified against KiCad 9 netlist: a pin at
# (px, py) on a rotation-0 instance at (x, y) connects at (x + px, y - py).
# Do not place net names on the Magnos pin bodies; stub off the legs first.
port_map = {
    'J1': ['INPUT_5V', 'INPUT_RETURN'],
    'J3': ['BOOST_AC_A', 'BOOST_AC_B'],
    'J4': ['BOOST_DC_P', 'BOOST_DC_N'],
}
beta_pins = {}
for sym in children(root, 'symbol'):
    ref = next(x[2].strip('"') for x in children(sym, 'property') if x[1] == '"Reference"')
    if ref not in port_map:
        continue
    at = child(sym, 'at')
    x, y, angle = map(float, at[1:4])
    mirror = next((n[1] for n in children(sym, 'mirror')), None)
    for pin, net in enumerate(port_map[ref]):
        dx, dy = -5.08, -2.54 * pin
        if mirror == 'x':
            dy = -dy
        if mirror == 'y':
            dx = -dx
        a = math.radians(angle)
        px = x + dx * math.cos(a) - dy * math.sin(a)
        py = y - dx * math.sin(a) - dy * math.cos(a)
        beta_pins[net] = (round(px, 2), round(py, 2), round(x, 2), round(y, 2))

blocks = []
pins = {}          # (ref, number) -> (x, y)
net_pins = {}      # net -> [(ref, number, x, y)]


def world(x, y, px, py):
    return (round(x + px, 2), round(y - py, 2))


def xy(p):
    return f'{p[0]:.2f} {p[1]:.2f}'


def wire(a, b, key):
    if a == b:
        return
    root.append(expr(
        f'(wire (pts (xy {xy(a)}) (xy {xy(b)})) '
        f'(stroke (width 0) (type default)) (uuid {uid(key)}))'
    ))


def junction(p, key):
    root.append(expr(
        f'(junction (at {xy(p)}) (diameter 0) (color 0 0 0 0) (uuid {uid(key)}))'
    ))


def label_at(net, p, key, angle=0):
    justify = '(justify right)' if int(angle) == 180 else ''
    effects = f'(effects (font (size 1.27 1.27)) {justify})' if justify else fx
    root.append(expr(f'(label {q(net)} (at {xy(p)} {int(angle)}) {effects} (uuid {uid(key)}))'))


def note(text, x, y):
    root.append(expr(f'(text {q(text)} (at {x} {y} 0) {fx} (uuid {uid(text)}))'))


_render_blocks = False


def block(ref, value, spec, x, y, hide_leg_text=False):
    """Collect the shared pin specification, then render it at final positions."""
    if not _render_blocks:
        blocks.append({'reference':ref,'value':value,
                       'pins':{str(i+1):{'function':name,'net':net,'side':side} for i,(name,net,side) in enumerate(spec)}})
        return
    key = f'MagnosSystem:{ref}'
    left = [(i, n, net) for i, (n, net, side) in enumerate(spec) if side == 'L']
    right = [(i, n, net) for i, (n, net, side) in enumerate(spec) if side == 'R']
    rows = max(len(left), len(right), 1)
    body_hy = grid(max(3, rows * 2))
    body_hx = grid(8)
    pin_x = grid(10)
    pin_len = grid(2)
    names = '(pin_names (offset 0.7) hide)' if hide_leg_text else '(pin_names (offset 0.7))'

    def column(entries):
        if not entries:
            return []
        span = (len(entries) - 1) * grid(2)
        top = span / 2
        out = []
        for row, (idx, name, net) in enumerate(entries):
            py = top - row * grid(2)
            out.append((idx, name, net, py))
        return out

    placed = []
    for idx, name, net, py in column(left):
        placed.append((idx + 1, name, net, -pin_x, py, 180))
    for idx, name, net, py in column(right):
        placed.append((idx + 1, name, net, pin_x, py, 0))

    symbol = (
        f'(symbol {q(key)} {names} (in_bom yes) (on_board yes) '
        f'(property "Reference" {q(ref)} (at 0 {body_hy + grid(2)} 0) {fx}) '
        f'(property "Value" {q(value)} (at 0 {-body_hy - grid(2)} 0) {fx}) '
        f'(symbol {q(ref + "_0_1")} (rectangle (start {-body_hx} {body_hy}) '
        f'(end {body_hx} {-body_hy}) (stroke (width 0.254) (type default)) '
        f'(fill (type none)))) (symbol {q(ref + "_1_1")} '
    )
    for num, name, net, px, py, angle in placed:
        symbol += (
            f'(pin passive line (at {px:.2f} {py:.2f} {angle}) (length {pin_len:.2f}) '
            f'(name {q(name)} {fx}) (number "{num}" {fx}))'
        )
    symbol += '))'
    lib.append(expr(symbol))
    root.append(expr(
        f'(symbol (lib_id {q(key)}) (at {x:.2f} {y:.2f} 0) (unit 1) (in_bom yes) (on_board yes) '
        f'(dnp no) (uuid {uid(ref)}) (property "Reference" {q(ref)} '
        f'(at {x:.2f} {y - body_hy - grid(2):.2f} 0) {fx}) (property "Value" {q(value)} '
        f'(at {x:.2f} {y + body_hy + grid(2):.2f} 0) {fx}) (instances (project "magnos-plasma" '
        f'(path "/{root_id}" (reference {q(ref)}) (unit 1)))))'
    ))
    for num, name, net, px, py, angle in placed:
        wx, wy = world(x, y, px, py)
        pins[(ref, str(num))] = (wx, wy)
        net_pins.setdefault(net, []).append((ref, str(num), wx, wy))
        outward = -1 if px < 0 else 1
        end = (round(wx + outward * grid(8), 2), wy)
        wire((wx, wy), end, ref + str(num) + 'stub')
        label_at(net, end, ref + str(num) + 'net', 180 if px < 0 else 0)
    blocks.append({
        'reference': ref,
        'value': value,
        'pins': {str(i + 1): {'function': name, 'net': net, 'side': side} for i, (name, net, side) in enumerate(spec)},
    })


def two(ref, value, a, b, x, y):
    block(ref, value, [('1', a, 'L'), ('2', b, 'R')], x, y, hide_leg_text=True)


def diode(ref, value, anode, cathode, x, y):
    block(ref, value, [('A', anode, 'L'), ('K', cathode, 'R')], x, y, hide_leg_text=True)


# --- Title ----------------------------------------------------------------
note('MAGNOS PLASMA SYSTEM - COMPLETE FUNCTIONAL WIRING / UNVALIDATED HARDWARE', grid(400), grid(8))
note('Original beta circuit retained at left. Added blocks require circuit design and rated parts before construction.', grid(400), grid(12))
note('5 V / 1 A source annotation. No verified transformer gain. No TW supply is created by this adapter.', grid(400), grid(16))
note('Added interconnect is drawn copper on the 1.27 mm grid. TBD means not specified by the source.', grid(400), grid(20))

# --- Input / enable chain -------------------------------------------------
# J101 + exits on the right so the fuse/switch chain is a straight series run.
block('J101', 'External 5 V / 1 A ceiling',
      [('+', 'PWR_RAW', 'R'), ('-', 'INPUT_RETURN', 'L'), ('CHASSIS', 'CHASSIS', 'L')],
      grid(310), grid(40))
two('F101', 'Input fuse - rating TBD', 'PWR_RAW', 'PWR_FUSED', grid(350), grid(40))
two('S101', 'Master disconnect', 'PWR_FUSED', 'INPUT_5V', grid(390), grid(40))
two('S102', 'Emergency stop NC', 'INPUT_5V', 'ESTOP_OK', grid(430), grid(40))
two('S103', 'Enclosure interlock NC', 'ESTOP_OK', 'COVER_OK', grid(470), grid(40))
two('S104', 'Thermal cutoff NC', 'COVER_OK', 'ENABLE', grid(510), grid(40))
two('R101', 'Enable pulldown - TBD', 'ENABLE', 'INPUT_RETURN', grid(550), grid(40))

# --- Controller and sensors ----------------------------------------------
block('U101', 'Sequencer / shutdown controller - TBD',
      [('VCC', 'INPUT_5V', 'L'), ('GND', 'INPUT_RETURN', 'L'),
       ('ENABLE', 'ENABLE', 'L'), ('SH_TEMP', 'SH_TEMP', 'L'),
       ('PR_TEMP', 'PR_TEMP', 'R'), ('CMD_SH', 'CMD_SH', 'R'),
       ('CMD_PR', 'CMD_PR', 'R'), ('CMD_GAS', 'CMD_GAS', 'R')],
      grid(330), grid(78))
block('J102', 'Shield temperature sensor',
      [('VCC', 'INPUT_5V', 'L'), ('RETURN', 'INPUT_RETURN', 'L'), ('SIGNAL', 'SH_TEMP', 'R')],
      grid(400), grid(78))
block('J103', 'Propulsor temperature sensor',
      [('VCC', 'INPUT_5V', 'L'), ('RETURN', 'INPUT_RETURN', 'L'), ('SIGNAL', 'PR_TEMP', 'R')],
      grid(460), grid(78))
# Frame bond: both contacts on CHASSIS so the net is not a dangling pin.
block('J104', 'Frame bond',
      [('1', 'CHASSIS', 'L'), ('2', 'CHASSIS', 'R')],
      grid(520), grid(78))


# --- HV rectifier ---------------------------------------------------------
note('All converter control ports below are isolated functional interfaces. HV return is NOT chassis.', grid(400), grid(100))
diode('D101', 'HV diode - rating TBD', 'BOOST_AC_A', 'HV_RAW_P', grid(340), grid(122))
diode('D102', 'HV diode - rating TBD', 'BOOST_AC_B', 'HV_RAW_P', grid(400), grid(122))
diode('D103', 'HV diode - rating TBD', 'HV_RETURN', 'BOOST_AC_A', grid(340), grid(146))
diode('D104', 'HV diode - rating TBD', 'HV_RETURN', 'BOOST_AC_B', grid(400), grid(146))
two('F102', 'HV fuse - rating TBD', 'HV_RAW_P', 'HV_PREBOOST_P', grid(460), grid(122))
two('C101', 'DC-link capacitor - C/V TBD', 'HV_BUS_P', 'HV_RETURN', grid(340), grid(170))
two('R102', 'Permanent discharge resistor - TBD', 'HV_BUS_P', 'HV_RETURN', grid(400), grid(170))
block('TP101', 'HV differential monitor / isolation TBD',
      [('IN+', 'HV_BUS_P', 'L'), ('IN-', 'HV_STACK_RETURN', 'L'),
       ('LV_GND', 'INPUT_RETURN', 'R'), ('OUT', 'HV_SENSE', 'R')],
      grid(460), grid(170))
block('J105', 'Service monitor',
      [('HV_SENSE', 'HV_SENSE', 'L'), ('RETURN', 'INPUT_RETURN', 'R')],
      grid(520), grid(170))

# --- Coil and electrode channels -----------------------------------------
# Each channel: branch fuse, isolated driver, two-pin feedthrough, load.
# Driver outputs are a pair of rails with a connector tap, not fake wire parts.


def power_channel(prefix, y, dc_net, return_net, cmd, out_p, out_n, load_ref, load_value, fuse_net, conn_value):
    two('F' + prefix, 'Branch fuse - TBD', fuse_net, dc_net, grid(310), y)
    block('U' + prefix, 'Isolated driver / limiter - TBD',
          [('IN+', dc_net, 'L'), ('IN-', return_net, 'L'),
           ('CTRL', cmd, 'L'), ('CTRL_RTN', 'INPUT_RETURN', 'L'),
           ('OUT+', out_p, 'R'), ('OUT-', out_n, 'R')],
          grid(380), y)
    block('J' + prefix, conn_value,
          [('POS', out_p, 'L'), ('RETURN', out_n, 'L')],
          grid(460), y + grid(28))
    # Both load pins on the left so the output bus can T onto them the same
    # way it taps the feedthrough, without crossing the symbol body.
    block(load_ref, load_value, [('1', out_p, 'L'), ('2', out_n, 'L')], grid(540), y + grid(28))


power_channel('201', grid(210), 'SH_DC_IN', 'BOOST_DC_N', 'CMD_SH',
              'SH_COIL_P', 'SH_COIL_N', 'L201', 'Shield coil L/R/turns TBD',
              'BOOST_DC_P', 'SH two-pin coil connector')
power_channel('301', grid(260), 'PR_DC_IN', 'BOOST_DC_N', 'CMD_PR',
              'PR_COIL_P', 'PR_COIL_N', 'L301', 'Propulsor coil 50 H / 0.004 ohm model',
              'BOOST_DC_P', 'PR two-pin coil connector')
power_channel('401', grid(310), 'SH_HV_IN', 'HV_STACK_RETURN', 'CMD_SH',
              'SH_ELECTRODE_P', 'SH_ELECTRODE_N', 'Z401', 'Shield electrodes / plasma load',
              'HV_BUS_P', 'Two-pin HV feedthrough')
power_channel('501', grid(360), 'PR_HV_IN', 'HV_STACK_RETURN', 'CMD_PR',
              'PR_ELECTRODE_P', 'PR_ELECTRODE_N', 'Z501', 'Propulsor anode / cathode plasma load',
              'HV_BUS_P', 'Two-pin HV feedthrough')

# --- Valve and neutralizer -----------------------------------------------
block('U601', 'Gas valve driver + flyback / TBD',
      [('VCC', 'INPUT_5V', 'L'), ('GND', 'INPUT_RETURN', 'L'),
       ('CTRL', 'CMD_GAS', 'L'), ('OUT+', 'GAS_P', 'R'), ('OUT-', 'GAS_N', 'R')],
      grid(330), grid(410))
two('Y601', 'Injection valve - rating TBD', 'GAS_P', 'GAS_N', grid(410), grid(410))
block('U602', 'Isolated neutralizer supply / TBD',
      [('IN+', 'HV_BUS_P', 'L'), ('IN-', 'HV_STACK_RETURN', 'L'),
       ('CTRL', 'CMD_PR', 'L'), ('CTRL_RTN', 'INPUT_RETURN', 'L'),
       ('OUT+', 'NEUT_P', 'R'), ('OUT-', 'NEUT_N', 'R')],
      grid(480), grid(410))
two('Z601', 'Neutralizer cathode equivalent', 'NEUT_P', 'NEUT_N', grid(560), grid(410))

# Cascaded functional converters: same input power, independent floating HV
# output domains. These blocks do not claim the beta parts are MV/GV/TV rated.
previous_p, previous_n = 'HV_PREBOOST_P', 'HV_RETURN'
for i in range(args.boosters):
    last = i == args.boosters - 1
    out_p = 'HV_BUS_P' if last else f'STAGE_{i+1}_P'
    out_n = 'HV_STACK_RETURN' if last else f'STAGE_{i+1}_N'
    block(f'U{701+i}', f'Magnos isolated booster {i+1}/{args.boosters}; target {30000*(target_voltage/30000)**((i+1)/args.boosters):.3g} V / TBD',
          [('IN+',previous_p,'L'),('IN-',previous_n,'L'),
           ('ENABLE','ENABLE','L'),('CTRL_RTN','INPUT_RETURN','L'),
           ('OUT+',out_p,'R'),('OUT-',out_n,'R')], grid(620),grid(120+i*38))
    previous_p, previous_n = out_p, out_n
# The rectifier return stays upstream; all final HV loads use the final return.
# Reassign already-created capacitor, bleed and differential monitor pins.
for ref in ('C101','R102','TP101'):
    old = next(b for b in blocks if b['reference']==ref)
    # Net labels are the electrical connection for these distant branches.
    old['pins']['2']['net'] = 'HV_STACK_RETURN'

block('J601','Valve feedthrough',[('POS','GAS_P','L'),('RETURN','GAS_N','L')],grid(620),grid(430))
block('J602','Neutralizer feedthrough',[('POS','NEUT_P','L'),('RETURN','NEUT_N','L')],grid(660),grid(430))
block('T102','Shield sensor',[('VCC','INPUT_5V','L'),('RETURN','INPUT_RETURN','L'),('SIGNAL','SH_TEMP','R')],grid(620),grid(470))
block('T103','Engine sensor',[('VCC','INPUT_5V','L'),('RETURN','INPUT_RETURN','L'),('SIGNAL','PR_TEMP','R')],grid(660),grid(470))
two('H101','Engine chassis bond','CHASSIS','CHASSIS',grid(700),grid(470))
note(f'CASCADED MAGNOS: {args.boosters} stage(s), {target_voltage:.3g} V target. 5 W source; 80% assumed per stage; no power multiplication.',grid(450),grid(485))

# Rebuild the functional area as an explicit ladder harness. Each symbol has
# its own row; rails occupy the alleys. Every connection is copper; labels
# identify nets but are not required for electrical continuity.
saved_blocks = blocks
root = parse(source.read_text())
lib = child(root, 'lib_symbols')
child(root, 'paper')[1:] = ['"User"', '1524', '1219.2']
blocks, pins, net_pins = [], {}, {}
columns = {}
_render_blocks = True
for i, saved in enumerate(saved_blocks):
    col, row = divmod(i, 18)
    center = grid(400 + col * 275)
    columns[saved['reference']] = center
    spec = [(p['function'],p['net'],p['side']) for p in saved['pins'].values()]
    block(saved['reference'],saved['value'],spec,center,grid(32+row*36))

all_nets = sorted(net_pins)
rail_taps = {}
for net_index, net in enumerate(all_nets):
    bottom_y = grid(710 + net_index*2)
    for ref, pin, px, py in net_pins[net]:
        center = columns[ref]
        side = -1 if px < center else 1
        rail_x = round(center + side * grid(28 + net_index*2),2)
        stub = (round(px + side*grid(8),2),py)
        tap = (rail_x,py)
        wire(stub,tap,'full-'+ref+'-'+pin)
        junction(stub,'full-stub-'+ref+'-'+pin)
        rail_taps.setdefault((net,rail_x,bottom_y),[]).append(tap)

bottom_points = {}
for (net,x,y),taps in rail_taps.items():
    levels=sorted({p[1] for p in taps}|{y})
    for j,(a,b) in enumerate(zip(levels,levels[1:])):wire((x,a),(x,b),'rail-'+net+str(x)+str(j))
    for i,tap in enumerate(taps): junction(tap,'tap-'+net+str(x)+str(i))
    bottom_points.setdefault(net,[]).append((x,y))

# Source ports connect at real copper. Unique breakout columns avoid existing
# beta pin/junction columns. Crossings without junctions stay isolated.
for i,(net,(px,py,ix,iy)) in enumerate(beta_pins.items()):
    start=(round(px,2),py)
    escape_x=round(px+0.37+i*0.13,2)
    escape_y=round(py+0.37+i*0.13,2)
    bottom_y=grid(710+all_nets.index(net)*2)
    wire(start,(escape_x,escape_y),'source-escape-'+net)
    wire((escape_x,escape_y),(escape_x,bottom_y),'source-vertical-'+net)
    junction(start,'source-junction-'+net)
    label_at(net,start,'source-net-'+net)
    bottom_points.setdefault(net,[]).append((escape_x,bottom_y))

for net,points in bottom_points.items():
    if len(points)>1:
        ordered=sorted(points)
        for j,(a,b) in enumerate(zip(ordered,ordered[1:])):wire(a,b,'backplane-'+net+str(j))
    for i,point in enumerate(points):junction(point,'backplane-tap-'+net+str(i))
    label_at(net,(max(p[0] for p in points),points[0][1]),'backplane-label-'+net)
note('MAGNOS PLASMA / ALL CONNECTIONS DRAWN / CROSSINGS CONNECT ONLY AT JUNCTION DOTS',grid(630),grid(10))
note(f'{args.boosters} cascaded booster(s); 10 {args.voltage_scale} target; 5 W input shared, assumed losses. Functional architecture, ratings TBD.',grid(630),grid(15))
note('Original beta circuit at left. Three functional columns; named backplane conductors below.',grid(630),grid(20))

(ROOT / 'magnos-plasma.kicad_sch').write_text(dump(root) + '\n')
# Export actual KiCad connectivity, including every original beta component.
cli = shutil.which('kicad-cli') or '/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli'
subprocess.run([cli,'sch','export','netlist','--format','kicadxml',str(ROOT/'magnos-plasma.kicad_sch'),'-o',str(ROOT/'magnos-plasma.xml')],check=True,capture_output=True)
netlist=ET.parse(ROOT/'magnos-plasma.xml')
components=[{'reference':c.get('ref'),'value':c.findtext('value')} for c in netlist.findall('./components/comp')]
nets=[{'name':n.get('name').removeprefix('/'),'pins':[[p.get('ref'),p.get('pin')] for p in n.findall('node')]} for n in netlist.findall('./nets/net')]
# Explicit cable per connector pin, including sensor VCC and return. Engine
# model contains ONLY these boundary cables, never box-internal wiring.
harness=[]
for connector,load in [('J201','L201'),('J301','L301'),('J401','Z401'),('J501','Z501'),('J601','Y601'),('J602','Z601'),('J102','T102'),('J103','T103')]:
    b=next(b for b in blocks if b['reference']==connector)
    for pin,detail in b['pins'].items():
        harness.append({'net':detail['net'],'from':[connector,pin],'to':[load,pin]})
harness.append({'net':'CHASSIS','from':['J104','2'],'to':['H101','1']})
external={'L201','L301','Z401','Z501','Y601','Z601','T102','T103','H101'}
box=[c for c in components if c['reference'] not in external]
# All pin coordinates are shared between the manifest and both models.
layout={}
for i,c in enumerate(box):
    layout[c['reference']]=[70+(i%8)*145,65+(i//8)*110,25]
layout.update({'L201':[7000,0,5820],'L301':[950,0,-1200],
               'Z401':[7000,0,6210],'Z501':[790,0,-2400],
               'Y601':[950,0,20],'Z601':[1900,0,-3500],
               'T102':[7000,200,6000],'T103':[980,200,-1200],
               'H101':[1200,0,2000]})
pin_numbers={c['reference']:set() for c in components}
for n in nets:
    for ref,pin in n['pins']: pin_numbers[ref].add(pin)
terminals={}
for ref,nums in pin_numbers.items():
    for i,pin in enumerate(sorted(nums,key=lambda p:(len(p),p))):
        x,y,z=layout[ref]; terminals[f'{ref}.{pin}']=[x-40+i*8,y-28,z+12]
internal=[]
for n in nets:
    members=[p for p in n['pins'] if p[0] not in external]
    for a,b in zip(members,members[1:]): internal.append({'net':n['name'],'from':a,'to':b})
config={'boosters':args.boosters,'targetVoltageV':target_voltage,'scale':args.voltage_scale,
        'availableW':5*0.8**(args.boosters+1),'status':'functional concept; voltage/insulation/ampacity unvalidated'}
spec={'source':str(source.relative_to(ROOT)),'configuration':config,'blocks':blocks,'components':components,'nets':nets,
      'terminals':terminals,'boxWires':internal,'harness':harness}
(ROOT/'magnos-plasma-wiring.json').write_text(json.dumps(spec,indent=2)+'\n')
header='''// Generated from exported KiCad netlist. Millimetres, conceptual placement.
// MV/GV/TV targets are NOT cable/component ratings. No clearance qualification.
$fn=16;
module cable(p,r=1.3) { for(i=[0:len(p)-2]) hull() {
 translate(p[i]) sphere(r=r); translate(p[i+1]) sphere(r=r);
} }
module label_at(p,t) { translate(p) linear_extrude(0.3) text(t,size=7); }
'''
def color(net):
    if net=='CHASSIS': return [0.3,0.8,0.3]
    if net.endswith(('_N','RETURN')): return [0.4,0.45,0.65]
    if 'TEMP' in net or 'CMD' in net or 'ENABLE' in net: return [0.2,0.8,0.9]
    return [1,0.55,0.16]
def draw_wire(w,i,engine=False):
    a=terminals['.'.join(w['from'])]; b=terminals['.'.join(w['to'])]
    lane=65+i*1.4
    pts=([a,[1450+i*35,a[1],a[2]],[1450+i*35,b[1],b[2]],b] if engine else [a,[a[0],a[1],lane],[b[0],b[1],lane],b])
    return f'// NET {w["net"]} {".".join(w["from"])} -> {".".join(w["to"])}\ncolor({json.dumps(color(w["net"]))}) cable({json.dumps(pts)});\n'
box_scad=header+'''// Open top enclosure, all schematic box components and pin-level nets.
color([0.13,0.15,0.19,0.35]) difference() {
 cube([1240,1100,60]); translate([5,5,5]) cube([1230,1090,60]);
}
'''
for c in box:
    x,y,z=layout[c['reference']]
    box_scad+=f'// COMPONENT {c["reference"]} {c["value"]}\ncolor([0.2,0.3,0.3]) translate([{x-50},{y-35},10]) cube([100,70,15]);\ncolor("white") label_at([{x-45},{y},26],{q(c["reference"])});\n'
for i,w in enumerate(internal):box_scad+=draw_wire(w,i)
box_scad+=f'color("white") label_at([20,1070,62],{q(str(args.boosters)+" Magnos / 10 "+args.voltage_scale+" target / conceptual routing")});\n'
app=(ROOT/'app.js').read_text()
def constant(name):
    return float(re.search(rf'const {name} = ([\d_.]+);',app)[1].replace('_',''))
engine_scad=header+f'''// Separate engine/shield assembly. Only verified external conductors.
// Dimensions other than shield area, coil length/turns are conceptual.
module ring(ro,ri,h) {{ difference() {{ cylinder(r=ro,h=h,$fn=64); translate([0,0,-1]) cylinder(r=ri,h=h+2,$fn=64); }} }}
color([0.3,0.35,0.4,0.25]) ring(1250,1100,5700);
color("silver") translate([0,0,-2500]) ring(830,750,{constant('COIL_LENGTH_M')*1000});
for(i=[0:{int(constant('COIL_TURNS'))-1}]) color([0.72,0.45,0.2]) translate([0,0,-2500+i*2500/{int(constant('COIL_TURNS'))}]) ring(950,850,9);
color("dimgray") translate([0,0,-4000]) difference() {{
 cylinder(r1=1800,r2=830,h=1500,$fn=64);
 translate([0,0,-1]) cylinder(r1=1680,r2=750,h=1502,$fn=64);
}}
color("slategray") translate([0,0,6000]) cylinder(r={math.sqrt(constant('SHIELD_AREA_M2')/math.pi)*1000},h=120,$fn=96);
color([0.72,0.45,0.2]) translate([0,0,5820]) ring(7570,7410,150);
color("steelblue") translate([0,0,0]) ring(950,750,150);
color("gold") translate([1900,0,-3500]) cylinder(r=90,h=450);
''' 
for ref in sorted(external):
    x,y,z=layout[ref]
    engine_scad+=f'// COMPONENT {ref}\ncolor([0.3,0.35,0.4]) translate([{x},{y},0]) cylinder(r=65,h=30);\ncolor("white") label_at([{x-40},{y},31],{q(ref)});\n'
# Show each connector housing once; no invented wires or internal circuits.
for ref in sorted({w['from'][0] for w in harness}):
    x,y,z=layout[ref]
    engine_scad+=f'color([0.25,0.3,0.35]) translate([{x-50},{y-35},10]) cube([100,70,15]);\ncolor("white") label_at([{x-45},{y},26],{q(ref)});\n'
for i,w in enumerate(harness):engine_scad+=draw_wire(w,i,True)
# Actual pin terminal geometry makes endpoints inspectable in both views.
for name,pos in terminals.items():
    terminal=f'color("gold") translate({json.dumps(pos)}) sphere(r=2);\n'
    if name.split('.')[0] not in external: box_scad+=terminal
    if any(name in ['.'.join(w['from']),'.'.join(w['to'])] for w in harness):engine_scad+=terminal
(ROOT/'magnos-plasma.scad').write_text(box_scad)
(ROOT/'magnos-engine.scad').write_text(engine_scad)
print(f'Generated {len(components)} components, {len(internal)} box wires, {len(harness)} external conductors; {args.boosters} booster(s), 10 {args.voltage_scale}.')

#!/usr/bin/env python3
"""Build magnos-plasma.kicad_sch / .scad from the Magnos beta sheet.

Added power, protection, rectifier, coil, electrode, valve and
neutralizer blocks are placed on the 1.27 mm KiCad grid and connected
with copper (rails, junctions, Manhattan wires). Net labels remain only
where this sheet must join the original beta connectors.
Power converters / interlocks are functional blocks, not designed PCBs.
"""
from pathlib import Path
import json
import math
import re
import uuid

ROOT = Path(__file__).resolve().parent
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
    return '(' + ' '.join(dump(x) if isinstance(x, list) else x for x in n) + ')'


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


def manhattan(a, b, key, via='h'):
    if a[0] == b[0] or a[1] == b[1]:
        wire(a, b, key)
        return
    mid = (b[0], a[1]) if via == 'h' else (a[0], b[1])
    wire(a, mid, key + 'a')
    wire(mid, b, key + 'b')


def block(ref, value, spec, x, y, hide_leg_text=False):
    """spec: list of (name, net, side) with side in {'L','R'}."""
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
        'pins': {str(i + 1): {'function': name, 'net': net} for i, (name, net, _side) in enumerate(spec)},
    })


def two(ref, value, a, b, x, y):
    block(ref, value, [('1', a, 'L'), ('2', b, 'R')], x, y, hide_leg_text=True)


def diode(ref, value, anode, cathode, x, y):
    block(ref, value, [('A', anode, 'L'), ('K', cathode, 'R')], x, y, hide_leg_text=True)


def stub_end(ref, pin):
    p = pins[(ref, pin)]
    xs = [coord[0] for (r, n), coord in pins.items() if r == ref]
    dx = -grid(8) if p[0] <= sum(xs) / len(xs) else grid(8)
    return (round(p[0] + dx, 2), p[1])


def join(ref_a, pin_a, ref_b, pin_b, key, via='h'):
    a = stub_end(ref_a, pin_a)
    b = stub_end(ref_b, pin_b)
    manhattan(a, b, key, via=via)
    junction(a, key + 'ja')
    junction(b, key + 'jb')


def pair_bus(driver, load, connector, net_p, net_n):
    """Driver OUT+/OUT- to load, with a connector tap. Lanes sit in the alley
    so verticals do not run through a pin column."""
    for net, dpin, lpin, cpin, lane, inset in (
        (net_p, '5', '1', '1', grid(8), grid(6)),
        (net_n, '6', '2', '2', grid(14), grid(10)),
    ):
        d = pins[(driver, dpin)]
        l = pins[(load, lpin)]
        c = pins[(connector, cpin)]
        # Meet existing pin stubs on the outward side of each symbol.
        d_stub = stub_end(driver, dpin)
        l_stub = stub_end(load, lpin)
        c_stub = stub_end(connector, cpin)
        rail_y = max(d[1], l[1], c[1]) + lane
        def lane_x(stub, pin):
            return stub[0] + (inset if stub[0] >= pin[0] else -inset)
        dx = lane_x(d_stub, d)
        lx = lane_x(l_stub, l)
        cx = lane_x(c_stub, c)
        wire(d_stub, (dx, d[1]), net + 'd')
        wire((dx, d[1]), (dx, rail_y), net + 'dv')
        wire((dx, rail_y), (lx, rail_y), net + 'rail')
        wire((lx, rail_y), (lx, l[1]), net + 'lv')
        wire((lx, l[1]), l_stub, net + 'l')
        wire(c_stub, (cx, c[1]), net + 'c')
        wire((cx, c[1]), (cx, rail_y), net + 'cv')
        junction(d_stub, net + 'sd')
        junction(l_stub, net + 'sl')
        junction(c_stub, net + 'sc')
        junction((dx, d[1]), net + 'ed')
        junction((lx, l[1]), net + 'el')
        junction((cx, c[1]), net + 'ec')
        junction((dx, rail_y), net + 'jd')
        junction((lx, rail_y), net + 'jl')
        junction((cx, rail_y), net + 'jc')


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
join('J101', '1', 'F101', '1', 'in1')
join('F101', '2', 'S101', '1', 'in2')
join('S101', '2', 'S102', '1', 'in3')
join('S102', '2', 'S103', '1', 'in4')
join('S103', '2', 'S104', '1', 'in5')
join('S104', '2', 'R101', '1', 'in6')

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
two('F102', 'HV fuse - rating TBD', 'HV_RAW_P', 'HV_BUS_P', grid(460), grid(122))
two('C101', 'DC-link capacitor - C/V TBD', 'HV_BUS_P', 'HV_RETURN', grid(340), grid(170))
two('R102', 'Permanent discharge resistor - TBD', 'HV_BUS_P', 'HV_RETURN', grid(400), grid(170))
block('TP101', 'HV differential monitor / isolation TBD',
      [('IN+', 'HV_BUS_P', 'L'), ('IN-', 'HV_RETURN', 'L'),
       ('LV_GND', 'INPUT_RETURN', 'R'), ('OUT', 'HV_SENSE', 'R')],
      grid(460), grid(170))
block('J105', 'Service monitor',
      [('HV_SENSE', 'HV_SENSE', 'L'), ('RETURN', 'INPUT_RETURN', 'R')],
      grid(520), grid(170))
join('D102', '2', 'F102', '1', 'hvfuse')
join('TP101', '4', 'J105', '1', 'sense')

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
    pair_bus('U' + prefix, load_ref, 'J' + prefix, out_p, out_n)


power_channel('201', grid(210), 'SH_DC_IN', 'BOOST_DC_N', 'CMD_SH',
              'SH_COIL_P', 'SH_COIL_N', 'L201', 'Shield coil L/R/turns TBD',
              'BOOST_DC_P', 'SH two-pin coil connector')
power_channel('301', grid(260), 'PR_DC_IN', 'BOOST_DC_N', 'CMD_PR',
              'PR_COIL_P', 'PR_COIL_N', 'L301', 'Propulsor coil 50 H / 0.004 ohm model',
              'BOOST_DC_P', 'PR two-pin coil connector')
power_channel('401', grid(310), 'SH_HV_IN', 'HV_RETURN', 'CMD_SH',
              'SH_ELECTRODE_P', 'SH_ELECTRODE_N', 'Z401', 'Shield electrodes / plasma load',
              'HV_BUS_P', 'Two-pin HV feedthrough')
power_channel('501', grid(360), 'PR_HV_IN', 'HV_RETURN', 'CMD_PR',
              'PR_ELECTRODE_P', 'PR_ELECTRODE_N', 'Z501', 'Propulsor anode / cathode plasma load',
              'HV_BUS_P', 'Two-pin HV feedthrough')

# --- Valve and neutralizer -----------------------------------------------
block('U601', 'Gas valve driver + flyback / TBD',
      [('VCC', 'INPUT_5V', 'L'), ('GND', 'INPUT_RETURN', 'L'),
       ('CTRL', 'CMD_GAS', 'L'), ('OUT+', 'GAS_P', 'R'), ('OUT-', 'GAS_N', 'R')],
      grid(330), grid(410))
two('Y601', 'Injection valve - rating TBD', 'GAS_P', 'GAS_N', grid(410), grid(410))
block('U602', 'Isolated neutralizer supply / TBD',
      [('IN+', 'HV_BUS_P', 'L'), ('IN-', 'HV_RETURN', 'L'),
       ('CTRL', 'CMD_PR', 'L'), ('CTRL_RTN', 'INPUT_RETURN', 'L'),
       ('OUT+', 'NEUT_P', 'R'), ('OUT-', 'NEUT_N', 'R')],
      grid(480), grid(410))
two('Z601', 'Neutralizer cathode equivalent', 'NEUT_P', 'NEUT_N', grid(560), grid(410))
join('U601', '4', 'Y601', '1', 'gasp')
join('U601', '5', 'Y601', '2', 'gasn')
join('U602', '5', 'Z601', '1', 'neutp')
join('U602', '6', 'Z601', '2', 'neutn')

# Tap Magnos J3/J4/J1 on copper offset from the pin numbers. Long runs
# through the original drawing short the paired connector pins. Plasma-side
# stubs already carry the same net names, which is the KiCad join.
j3a = beta_pins['BOOST_AC_A']
j3b = beta_pins['BOOST_AC_B']
# Sit on the existing J3 output segments, not on the pin numbers.
label_at('BOOST_AC_A', (round(j3a[0] + grid(4), 2), j3a[1]), 'j3a', 0)
label_at('BOOST_AC_B', (round(j3b[0] - grid(4), 2), j3b[1]), 'j3b', 180)
for net in ('BOOST_DC_P', 'BOOST_DC_N', 'INPUT_5V', 'INPUT_RETURN'):
    sx, sy, _ix, _iy = beta_pins[net]
    end = (round(sx - grid(8), 2), sy)
    wire((sx, sy), end, 'beta' + net)
    label_at(net, end, 'beta' + net + 'lbl', 180)

note('HV electrode branches + coil channels + valve + neutralizer SHARE the available input power.', grid(400), grid(444))
note('Magnos J3 AC output is wired to the HV rectifier; J4 DC output is wired to the coil drivers.', grid(400), grid(448))
note('TBD means not specified by source. This is a wired functional architecture, not a fabrication-ready design.', grid(400), grid(452))

(ROOT / 'magnos-plasma.kicad_sch').write_text(dump(root) + '\n')
(ROOT / 'magnos-plasma-wiring.json').write_text(
    json.dumps({'source': str(source.relative_to(ROOT)), 'blocks': blocks}, indent=2) + '\n'
)

# Match cable endpoints to the conceptual assembly. Millimetres.
paths = [
    ('SH_COIL_P', [0.9, 0.3, 0.1], [[1310, 0, 2020], [1400, 0, 2500], [1400, 0, 5700], [7300, 0, 5900]]),
    ('SH_COIL_N', [0.1, 0.1, 0.2], [[1320, 20, 2020], [1450, 50, 2500], [1450, 50, 5700], [7300, 100, 5900]]),
    ('SH_ELECTRODE_P', [1, 0.6, 0], [[1340, 40, 2020], [1600, 150, 2500], [1600, 150, 6250], [7200, 150, 6250]]),
    ('SH_ELECTRODE_N', [0.5, 0.2, 0.8], [[1350, 60, 2020], [1650, 220, 2500], [1650, 220, 6250], [7150, 220, 6250]]),
    ('PR_COIL_P', [0.9, 0.3, 0.1], [[1310, 0, 2010], [1400, -100, 500], [980, -100, -1200]]),
    ('PR_COIL_N', [0.1, 0.1, 0.2], [[1320, 20, 2010], [1450, -50, 500], [980, -50, -1250]]),
    ('PR_ELECTRODE_P', [1, 0.6, 0], [[1340, 40, 2010], [1600, 150, 0], [700, 150, -2400]]),
    ('PR_ELECTRODE_N', [0.5, 0.2, 0.8], [[1350, 60, 2010], [1650, 220, 0], [700, 220, -2500]]),
    ('NEUT_P', [1, 0.6, 0], [[1350, 80, 2010], [1900, 300, 0], [1900, 0, -3500]]),
    ('NEUT_N', [0.5, 0.2, 0.8], [[1360, 90, 2010], [1950, 350, 0], [1950, 0, -3500]]),
    ('SH_TEMP', [0.2, 0.8, 0.4], [[1360, 100, 2020], [1700, 350, 2500], [1700, 350, 6000], [7000, 350, 6000]]),
    ('PR_TEMP', [0.2, 0.8, 0.4], [[1370, 110, 2010], [1700, 350, 0], [1000, 350, -1200]]),
    ('GAS_P', [0.2, 0.5, 1], [[1380, 120, 2010], [1800, 500, 1000], [950, 500, 0]]),
    ('GAS_N', [0.1, 0.2, 0.5], [[1390, 130, 2010], [1850, 550, 1000], [950, 550, 0]]),
]
scad = '''// Generated functional cable routing, millimetres. NOT insulation/ampacity routing.
// Cable diameter exaggerated to 36 mm for full-vehicle visibility.
// Control/return bundles carry additional pins per magnos-plasma-wiring.json.
module cable(points,r=18) { for(i=[0:len(points)-2]) hull() {
 translate(points[i]) sphere(r=r,$fn=12);
 translate(points[i+1]) sphere(r=r,$fn=12);
} }
'''
board = (ROOT / 'magnos_beta_board.scad').read_text().split('if(is_undef(assembly_include))')[0]
assembly = (ROOT / 'plasma_shield_propulsion.scad').read_text().replace('use <magnos_beta_board.scad>', '')
scad = '// Standalone generated assembly and harness. No external SCAD dependencies.\n' + board + '\n' + assembly + '\n' + scad
for net, color, pts in paths:
    scad += f'// {net}\nscale(model_scale) color({json.dumps(color)}) cable({json.dumps(pts)});\n'
(ROOT / 'magnos-plasma.scad').write_text(scad)
print(f'Generated single-sheet schematic: original beta + {len(blocks)} wired system blocks; CAD with {len(paths)} cable routes.')

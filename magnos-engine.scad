// Generated from exported KiCad netlist. Millimetres, conceptual placement.
// MV/GV/TV targets are NOT cable/component ratings. No clearance qualification.
$fn=16;
module cable(p,r=1.3) { for(i=[0:len(p)-2]) hull() {
 translate(p[i]) sphere(r=r); translate(p[i+1]) sphere(r=r);
} }
module label_at(p,t) { translate(p) linear_extrude(0.3) text(t,size=7); }
// Separate engine/shield assembly. Only verified external conductors.
// Dimensions other than shield area, coil length/turns are conceptual.
module ring(ro,ri,h) { difference() { cylinder(r=ro,h=h,$fn=64); translate([0,0,-1]) cylinder(r=ri,h=h+2,$fn=64); } }
color([0.3,0.35,0.4,0.25]) ring(1250,1100,5700);
color("silver") translate([0,0,-2500]) ring(830,750,2500.0);
for(i=[0:179]) color([0.72,0.45,0.2]) translate([0,0,-2500+i*2500/180]) ring(950,850,9);
color("dimgray") translate([0,0,-4000]) difference() {
 cylinder(r1=1800,r2=830,h=1500,$fn=64);
 translate([0,0,-1]) cylinder(r1=1680,r2=750,h=1502,$fn=64);
}
color("slategray") translate([0,0,6000]) cylinder(r=7569.397566060481,h=120,$fn=96);
color([0.72,0.45,0.2]) translate([0,0,5820]) ring(7570,7410,150);
color("steelblue") translate([0,0,0]) ring(950,750,150);
color("gold") translate([1900,0,-3500]) cylinder(r=90,h=450);
// COMPONENT H101
color([0.3,0.35,0.4]) translate([1200,0,0]) cylinder(r=65,h=30);
color("white") label_at([1160,0,31],"H101");
// COMPONENT L201
color([0.3,0.35,0.4]) translate([7000,0,0]) cylinder(r=65,h=30);
color("white") label_at([6960,0,31],"L201");
// COMPONENT L301
color([0.3,0.35,0.4]) translate([950,0,0]) cylinder(r=65,h=30);
color("white") label_at([910,0,31],"L301");
// COMPONENT T102
color([0.3,0.35,0.4]) translate([7000,200,0]) cylinder(r=65,h=30);
color("white") label_at([6960,200,31],"T102");
// COMPONENT T103
color([0.3,0.35,0.4]) translate([980,200,0]) cylinder(r=65,h=30);
color("white") label_at([940,200,31],"T103");
// COMPONENT Y601
color([0.3,0.35,0.4]) translate([950,0,0]) cylinder(r=65,h=30);
color("white") label_at([910,0,31],"Y601");
// COMPONENT Z401
color([0.3,0.35,0.4]) translate([7000,0,0]) cylinder(r=65,h=30);
color("white") label_at([6960,0,31],"Z401");
// COMPONENT Z501
color([0.3,0.35,0.4]) translate([790,0,0]) cylinder(r=65,h=30);
color("white") label_at([750,0,31],"Z501");
// COMPONENT Z601
color([0.3,0.35,0.4]) translate([1900,0,0]) cylinder(r=65,h=30);
color("white") label_at([1860,0,31],"Z601");
color([0.25,0.3,0.35]) translate([1035,250,10]) cube([100,70,15]);
color("white") label_at([1040,285,26],"J102");
color([0.25,0.3,0.35]) translate([20,360,10]) cube([100,70,15]);
color("white") label_at([25,395,26],"J103");
color([0.25,0.3,0.35]) translate([165,360,10]) cube([100,70,15]);
color("white") label_at([170,395,26],"J104");
color([0.25,0.3,0.35]) translate([455,360,10]) cube([100,70,15]);
color("white") label_at([460,395,26],"J201");
color([0.25,0.3,0.35]) translate([600,360,10]) cube([100,70,15]);
color("white") label_at([605,395,26],"J301");
color([0.25,0.3,0.35]) translate([745,360,10]) cube([100,70,15]);
color("white") label_at([750,395,26],"J401");
color([0.25,0.3,0.35]) translate([890,360,10]) cube([100,70,15]);
color("white") label_at([895,395,26],"J501");
color([0.25,0.3,0.35]) translate([1035,360,10]) cube([100,70,15]);
color("white") label_at([1040,395,26],"J601");
color([0.25,0.3,0.35]) translate([20,470,10]) cube([100,70,15]);
color("white") label_at([25,505,26],"J602");
// NET SH_COIL_P J201.1 -> L201.1
color([1, 0.55, 0.16]) cable([[465, 367, 37], [1450, 367, 37], [1450, -28, 5832], [6960, -28, 5832]]);
// NET SH_COIL_N J201.2 -> L201.2
color([0.4, 0.45, 0.65]) cable([[473, 367, 37], [1485, 367, 37], [1485, -28, 5832], [6968, -28, 5832]]);
// NET PR_COIL_P J301.1 -> L301.1
color([1, 0.55, 0.16]) cable([[610, 367, 37], [1520, 367, 37], [1520, -28, -1188], [910, -28, -1188]]);
// NET PR_COIL_N J301.2 -> L301.2
color([0.4, 0.45, 0.65]) cable([[618, 367, 37], [1555, 367, 37], [1555, -28, -1188], [918, -28, -1188]]);
// NET SH_ELECTRODE_P J401.1 -> Z401.1
color([1, 0.55, 0.16]) cable([[755, 367, 37], [1590, 367, 37], [1590, -28, 6222], [6960, -28, 6222]]);
// NET SH_ELECTRODE_N J401.2 -> Z401.2
color([0.4, 0.45, 0.65]) cable([[763, 367, 37], [1625, 367, 37], [1625, -28, 6222], [6968, -28, 6222]]);
// NET PR_ELECTRODE_P J501.1 -> Z501.1
color([1, 0.55, 0.16]) cable([[900, 367, 37], [1660, 367, 37], [1660, -28, -2388], [750, -28, -2388]]);
// NET PR_ELECTRODE_N J501.2 -> Z501.2
color([0.4, 0.45, 0.65]) cable([[908, 367, 37], [1695, 367, 37], [1695, -28, -2388], [758, -28, -2388]]);
// NET GAS_P J601.1 -> Y601.1
color([1, 0.55, 0.16]) cable([[1045, 367, 37], [1730, 367, 37], [1730, -28, 32], [910, -28, 32]]);
// NET GAS_N J601.2 -> Y601.2
color([0.4, 0.45, 0.65]) cable([[1053, 367, 37], [1765, 367, 37], [1765, -28, 32], [918, -28, 32]]);
// NET NEUT_P J602.1 -> Z601.1
color([1, 0.55, 0.16]) cable([[30, 477, 37], [1800, 477, 37], [1800, -28, -3488], [1860, -28, -3488]]);
// NET NEUT_N J602.2 -> Z601.2
color([0.4, 0.45, 0.65]) cable([[38, 477, 37], [1835, 477, 37], [1835, -28, -3488], [1868, -28, -3488]]);
// NET INPUT_5V J102.1 -> T102.1
color([1, 0.55, 0.16]) cable([[1045, 257, 37], [1870, 257, 37], [1870, 172, 6012], [6960, 172, 6012]]);
// NET INPUT_RETURN J102.2 -> T102.2
color([0.4, 0.45, 0.65]) cable([[1053, 257, 37], [1905, 257, 37], [1905, 172, 6012], [6968, 172, 6012]]);
// NET SH_TEMP J102.3 -> T102.3
color([0.2, 0.8, 0.9]) cable([[1061, 257, 37], [1940, 257, 37], [1940, 172, 6012], [6976, 172, 6012]]);
// NET INPUT_5V J103.1 -> T103.1
color([1, 0.55, 0.16]) cable([[30, 367, 37], [1975, 367, 37], [1975, 172, -1188], [940, 172, -1188]]);
// NET INPUT_RETURN J103.2 -> T103.2
color([0.4, 0.45, 0.65]) cable([[38, 367, 37], [2010, 367, 37], [2010, 172, -1188], [948, 172, -1188]]);
// NET PR_TEMP J103.3 -> T103.3
color([0.2, 0.8, 0.9]) cable([[46, 367, 37], [2045, 367, 37], [2045, 172, -1188], [956, 172, -1188]]);
// NET CHASSIS J104.2 -> H101.1
color([0.3, 0.8, 0.3]) cable([[183, 367, 37], [2080, 367, 37], [2080, -28, 2012], [1160, -28, 2012]]);
color("gold") translate([1160, -28, 2012]) sphere(r=2);
color("gold") translate([1045, 257, 37]) sphere(r=2);
color("gold") translate([1053, 257, 37]) sphere(r=2);
color("gold") translate([1061, 257, 37]) sphere(r=2);
color("gold") translate([30, 367, 37]) sphere(r=2);
color("gold") translate([38, 367, 37]) sphere(r=2);
color("gold") translate([46, 367, 37]) sphere(r=2);
color("gold") translate([183, 367, 37]) sphere(r=2);
color("gold") translate([465, 367, 37]) sphere(r=2);
color("gold") translate([473, 367, 37]) sphere(r=2);
color("gold") translate([610, 367, 37]) sphere(r=2);
color("gold") translate([618, 367, 37]) sphere(r=2);
color("gold") translate([755, 367, 37]) sphere(r=2);
color("gold") translate([763, 367, 37]) sphere(r=2);
color("gold") translate([900, 367, 37]) sphere(r=2);
color("gold") translate([908, 367, 37]) sphere(r=2);
color("gold") translate([1045, 367, 37]) sphere(r=2);
color("gold") translate([1053, 367, 37]) sphere(r=2);
color("gold") translate([30, 477, 37]) sphere(r=2);
color("gold") translate([38, 477, 37]) sphere(r=2);
color("gold") translate([6960, -28, 5832]) sphere(r=2);
color("gold") translate([6968, -28, 5832]) sphere(r=2);
color("gold") translate([910, -28, -1188]) sphere(r=2);
color("gold") translate([918, -28, -1188]) sphere(r=2);
color("gold") translate([6960, 172, 6012]) sphere(r=2);
color("gold") translate([6968, 172, 6012]) sphere(r=2);
color("gold") translate([6976, 172, 6012]) sphere(r=2);
color("gold") translate([940, 172, -1188]) sphere(r=2);
color("gold") translate([948, 172, -1188]) sphere(r=2);
color("gold") translate([956, 172, -1188]) sphere(r=2);
color("gold") translate([910, -28, 32]) sphere(r=2);
color("gold") translate([918, -28, 32]) sphere(r=2);
color("gold") translate([6960, -28, 6222]) sphere(r=2);
color("gold") translate([6968, -28, 6222]) sphere(r=2);
color("gold") translate([750, -28, -2388]) sphere(r=2);
color("gold") translate([758, -28, -2388]) sphere(r=2);
color("gold") translate([1860, -28, -3488]) sphere(r=2);
color("gold") translate([1868, -28, -3488]) sphere(r=2);

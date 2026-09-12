// Generated from exported KiCad netlist. Millimetres, conceptual placement.
// MV/GV/TV targets are NOT cable/component ratings. No clearance qualification.
$fn=16;
module cable(p,r=1.3) { for(i=[0:len(p)-2]) hull() {
 translate(p[i]) sphere(r=r); translate(p[i+1]) sphere(r=r);
} }
module label_at(p,t) { translate(p) linear_extrude(0.3) text(t,size=7); }
// Separate engine and shield load layout with box feedthrough endpoints.
// COMPONENT H101
color([0.3,0.35,0.4]) translate([100,1450,0]) cylinder(r=65,h=30);
color("white") label_at([60,1450,31],"H101");
// COMPONENT L201
color([0.3,0.35,0.4]) translate([420,1450,0]) cylinder(r=65,h=30);
color("white") label_at([380,1450,31],"L201");
// COMPONENT L301
color([0.3,0.35,0.4]) translate([740,1450,0]) cylinder(r=65,h=30);
color("white") label_at([700,1450,31],"L301");
// COMPONENT T102
color([0.3,0.35,0.4]) translate([100,1750,0]) cylinder(r=65,h=30);
color("white") label_at([60,1750,31],"T102");
// COMPONENT T103
color([0.3,0.35,0.4]) translate([420,1750,0]) cylinder(r=65,h=30);
color("white") label_at([380,1750,31],"T103");
// COMPONENT Y601
color([0.3,0.35,0.4]) translate([740,1750,0]) cylinder(r=65,h=30);
color("white") label_at([700,1750,31],"Y601");
// COMPONENT Z401
color([0.3,0.35,0.4]) translate([100,2050,0]) cylinder(r=65,h=30);
color("white") label_at([60,2050,31],"Z401");
// COMPONENT Z501
color([0.3,0.35,0.4]) translate([420,2050,0]) cylinder(r=65,h=30);
color("white") label_at([380,2050,31],"Z501");
// COMPONENT Z601
color([0.3,0.35,0.4]) translate([740,2050,0]) cylinder(r=65,h=30);
color("white") label_at([700,2050,31],"Z601");
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
color([1, 0.55, 0.16]) cable([[465, 367, 37], [465, 367, 65.0], [380, 1422, 65.0], [380, 1422, 52]]);
// NET SH_COIL_N J201.2 -> L201.2
color([0.4, 0.45, 0.65]) cable([[473, 367, 37], [473, 367, 66.4], [388, 1422, 66.4], [388, 1422, 52]]);
// NET PR_COIL_P J301.1 -> L301.1
color([1, 0.55, 0.16]) cable([[610, 367, 37], [610, 367, 67.8], [700, 1422, 67.8], [700, 1422, 52]]);
// NET PR_COIL_N J301.2 -> L301.2
color([0.4, 0.45, 0.65]) cable([[618, 367, 37], [618, 367, 69.2], [708, 1422, 69.2], [708, 1422, 52]]);
// NET SH_ELECTRODE_P J401.1 -> Z401.1
color([1, 0.55, 0.16]) cable([[755, 367, 37], [755, 367, 70.6], [60, 2022, 70.6], [60, 2022, 52]]);
// NET SH_ELECTRODE_N J401.2 -> Z401.2
color([0.4, 0.45, 0.65]) cable([[763, 367, 37], [763, 367, 72.0], [68, 2022, 72.0], [68, 2022, 52]]);
// NET PR_ELECTRODE_P J501.1 -> Z501.1
color([1, 0.55, 0.16]) cable([[900, 367, 37], [900, 367, 73.4], [380, 2022, 73.4], [380, 2022, 52]]);
// NET PR_ELECTRODE_N J501.2 -> Z501.2
color([0.4, 0.45, 0.65]) cable([[908, 367, 37], [908, 367, 74.8], [388, 2022, 74.8], [388, 2022, 52]]);
// NET GAS_P J601.1 -> Y601.1
color([1, 0.55, 0.16]) cable([[1045, 367, 37], [1045, 367, 76.2], [700, 1722, 76.2], [700, 1722, 52]]);
// NET GAS_N J601.2 -> Y601.2
color([0.4, 0.45, 0.65]) cable([[1053, 367, 37], [1053, 367, 77.6], [708, 1722, 77.6], [708, 1722, 52]]);
// NET NEUT_P J602.1 -> Z601.1
color([1, 0.55, 0.16]) cable([[30, 477, 37], [30, 477, 79.0], [700, 2022, 79.0], [700, 2022, 52]]);
// NET NEUT_N J602.2 -> Z601.2
color([0.4, 0.45, 0.65]) cable([[38, 477, 37], [38, 477, 80.4], [708, 2022, 80.4], [708, 2022, 52]]);
// NET INPUT_5V J102.1 -> T102.1
color([1, 0.55, 0.16]) cable([[1045, 257, 37], [1045, 257, 81.8], [60, 1722, 81.8], [60, 1722, 52]]);
// NET INPUT_RETURN J102.2 -> T102.2
color([0.4, 0.45, 0.65]) cable([[1053, 257, 37], [1053, 257, 83.2], [68, 1722, 83.2], [68, 1722, 52]]);
// NET SH_TEMP J102.3 -> T102.3
color([0.2, 0.8, 0.9]) cable([[1061, 257, 37], [1061, 257, 84.6], [76, 1722, 84.6], [76, 1722, 52]]);
// NET INPUT_5V J103.1 -> T103.1
color([1, 0.55, 0.16]) cable([[30, 367, 37], [30, 367, 86.0], [380, 1722, 86.0], [380, 1722, 52]]);
// NET INPUT_RETURN J103.2 -> T103.2
color([0.4, 0.45, 0.65]) cable([[38, 367, 37], [38, 367, 87.4], [388, 1722, 87.4], [388, 1722, 52]]);
// NET PR_TEMP J103.3 -> T103.3
color([0.2, 0.8, 0.9]) cable([[46, 367, 37], [46, 367, 88.8], [396, 1722, 88.8], [396, 1722, 52]]);
// NET CHASSIS J104.2 -> H101.1
color([0.3, 0.8, 0.3]) cable([[183, 367, 37], [183, 367, 90.2], [60, 1422, 90.2], [60, 1422, 52]]);
color("gold") translate([60, 1422, 52]) sphere(r=2);
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
color("gold") translate([380, 1422, 52]) sphere(r=2);
color("gold") translate([388, 1422, 52]) sphere(r=2);
color("gold") translate([700, 1422, 52]) sphere(r=2);
color("gold") translate([708, 1422, 52]) sphere(r=2);
color("gold") translate([60, 1722, 52]) sphere(r=2);
color("gold") translate([68, 1722, 52]) sphere(r=2);
color("gold") translate([76, 1722, 52]) sphere(r=2);
color("gold") translate([380, 1722, 52]) sphere(r=2);
color("gold") translate([388, 1722, 52]) sphere(r=2);
color("gold") translate([396, 1722, 52]) sphere(r=2);
color("gold") translate([700, 1722, 52]) sphere(r=2);
color("gold") translate([708, 1722, 52]) sphere(r=2);
color("gold") translate([60, 2022, 52]) sphere(r=2);
color("gold") translate([68, 2022, 52]) sphere(r=2);
color("gold") translate([380, 2022, 52]) sphere(r=2);
color("gold") translate([388, 2022, 52]) sphere(r=2);
color("gold") translate([700, 2022, 52]) sphere(r=2);
color("gold") translate([708, 2022, 52]) sphere(r=2);

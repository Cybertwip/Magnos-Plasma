// Generated from exported KiCad netlist. Millimetres, conceptual placement.
// MV/GV/TV targets are NOT cable/component ratings. No clearance qualification.
$fn=16;
module cable(p,r=1.3) { for(i=[0:len(p)-2]) hull() {
 translate(p[i]) sphere(r=r); translate(p[i+1]) sphere(r=r);
} }
module label_at(p,t) { translate(p) linear_extrude(0.3) text(t,size=7); }
// Open top enclosure, all schematic box components and pin-level nets.
color([0.13,0.15,0.19,0.35]) difference() {
 cube([1240,1100,60]); translate([5,5,5]) cube([1230,1090,60]);
}
// COMPONENT C6 0.47uF
color([0.2,0.3,0.3]) translate([20,30,10]) cube([100,70,15]);
color("white") label_at([25,65,26],"C6");
// COMPONENT C8 0.47uF
color([0.2,0.3,0.3]) translate([165,30,10]) cube([100,70,15]);
color("white") label_at([170,65,26],"C8");
// COMPONENT C9 0.57uF
color([0.2,0.3,0.3]) translate([310,30,10]) cube([100,70,15]);
color("white") label_at([315,65,26],"C9");
// COMPONENT C10 0.47uF
color([0.2,0.3,0.3]) translate([455,30,10]) cube([100,70,15]);
color("white") label_at([460,65,26],"C10");
// COMPONENT C101 DC-link capacitor - C/V TBD
color([0.2,0.3,0.3]) translate([600,30,10]) cube([100,70,15]);
color("white") label_at([605,65,26],"C101");
// COMPONENT D1 600V 25A
color([0.2,0.3,0.3]) translate([745,30,10]) cube([100,70,15]);
color("white") label_at([750,65,26],"D1");
// COMPONENT D7 600V 25A
color([0.2,0.3,0.3]) translate([890,30,10]) cube([100,70,15]);
color("white") label_at([895,65,26],"D7");
// COMPONENT D9 600V 25A
color([0.2,0.3,0.3]) translate([1035,30,10]) cube([100,70,15]);
color("white") label_at([1040,65,26],"D9");
// COMPONENT D10 600V 25A
color([0.2,0.3,0.3]) translate([20,140,10]) cube([100,70,15]);
color("white") label_at([25,175,26],"D10");
// COMPONENT D101 HV diode - rating TBD
color([0.2,0.3,0.3]) translate([165,140,10]) cube([100,70,15]);
color("white") label_at([170,175,26],"D101");
// COMPONENT D102 HV diode - rating TBD
color([0.2,0.3,0.3]) translate([310,140,10]) cube([100,70,15]);
color("white") label_at([315,175,26],"D102");
// COMPONENT D103 HV diode - rating TBD
color([0.2,0.3,0.3]) translate([455,140,10]) cube([100,70,15]);
color("white") label_at([460,175,26],"D103");
// COMPONENT D104 HV diode - rating TBD
color([0.2,0.3,0.3]) translate([600,140,10]) cube([100,70,15]);
color("white") label_at([605,175,26],"D104");
// COMPONENT F101 Input fuse - rating TBD
color([0.2,0.3,0.3]) translate([745,140,10]) cube([100,70,15]);
color("white") label_at([750,175,26],"F101");
// COMPONENT F102 HV fuse - rating TBD
color([0.2,0.3,0.3]) translate([890,140,10]) cube([100,70,15]);
color("white") label_at([895,175,26],"F102");
// COMPONENT F201 Branch fuse - TBD
color([0.2,0.3,0.3]) translate([1035,140,10]) cube([100,70,15]);
color("white") label_at([1040,175,26],"F201");
// COMPONENT F301 Branch fuse - TBD
color([0.2,0.3,0.3]) translate([20,250,10]) cube([100,70,15]);
color("white") label_at([25,285,26],"F301");
// COMPONENT F401 Branch fuse - TBD
color([0.2,0.3,0.3]) translate([165,250,10]) cube([100,70,15]);
color("white") label_at([170,285,26],"F401");
// COMPONENT F501 Branch fuse - TBD
color([0.2,0.3,0.3]) translate([310,250,10]) cube([100,70,15]);
color("white") label_at([315,285,26],"F501");
// COMPONENT J1 Input
color([0.2,0.3,0.3]) translate([455,250,10]) cube([100,70,15]);
color("white") label_at([460,285,26],"J1");
// COMPONENT J3 AC Output
color([0.2,0.3,0.3]) translate([600,250,10]) cube([100,70,15]);
color("white") label_at([605,285,26],"J3");
// COMPONENT J4 DC Payload
color([0.2,0.3,0.3]) translate([745,250,10]) cube([100,70,15]);
color("white") label_at([750,285,26],"J4");
// COMPONENT J101 External 5 V / 1 A ceiling
color([0.2,0.3,0.3]) translate([890,250,10]) cube([100,70,15]);
color("white") label_at([895,285,26],"J101");
// COMPONENT J102 Shield temperature sensor
color([0.2,0.3,0.3]) translate([1035,250,10]) cube([100,70,15]);
color("white") label_at([1040,285,26],"J102");
// COMPONENT J103 Propulsor temperature sensor
color([0.2,0.3,0.3]) translate([20,360,10]) cube([100,70,15]);
color("white") label_at([25,395,26],"J103");
// COMPONENT J104 Frame bond
color([0.2,0.3,0.3]) translate([165,360,10]) cube([100,70,15]);
color("white") label_at([170,395,26],"J104");
// COMPONENT J105 Service monitor
color([0.2,0.3,0.3]) translate([310,360,10]) cube([100,70,15]);
color("white") label_at([315,395,26],"J105");
// COMPONENT J201 SH two-pin coil connector
color([0.2,0.3,0.3]) translate([455,360,10]) cube([100,70,15]);
color("white") label_at([460,395,26],"J201");
// COMPONENT J301 PR two-pin coil connector
color([0.2,0.3,0.3]) translate([600,360,10]) cube([100,70,15]);
color("white") label_at([605,395,26],"J301");
// COMPONENT J401 Two-pin HV feedthrough
color([0.2,0.3,0.3]) translate([745,360,10]) cube([100,70,15]);
color("white") label_at([750,395,26],"J401");
// COMPONENT J501 Two-pin HV feedthrough
color([0.2,0.3,0.3]) translate([890,360,10]) cube([100,70,15]);
color("white") label_at([895,395,26],"J501");
// COMPONENT J601 Valve feedthrough
color([0.2,0.3,0.3]) translate([1035,360,10]) cube([100,70,15]);
color("white") label_at([1040,395,26],"J601");
// COMPONENT J602 Neutralizer feedthrough
color([0.2,0.3,0.3]) translate([20,470,10]) cube([100,70,15]);
color("white") label_at([25,505,26],"J602");
// COMPONENT L1 1mH
color([0.2,0.3,0.3]) translate([165,470,10]) cube([100,70,15]);
color("white") label_at([170,505,26],"L1");
// COMPONENT Q2 Darlington NPN
color([0.2,0.3,0.3]) translate([310,470,10]) cube([100,70,15]);
color("white") label_at([315,505,26],"Q2");
// COMPONENT Q5 Darlington NPN
color([0.2,0.3,0.3]) translate([455,470,10]) cube([100,70,15]);
color("white") label_at([460,505,26],"Q5");
// COMPONENT Q8 Darlington NPN
color([0.2,0.3,0.3]) translate([600,470,10]) cube([100,70,15]);
color("white") label_at([605,505,26],"Q8");
// COMPONENT R1 22R
color([0.2,0.3,0.3]) translate([745,470,10]) cube([100,70,15]);
color("white") label_at([750,505,26],"R1");
// COMPONENT R101 Enable pulldown - TBD
color([0.2,0.3,0.3]) translate([890,470,10]) cube([100,70,15]);
color("white") label_at([895,505,26],"R101");
// COMPONENT R102 Permanent discharge resistor - TBD
color([0.2,0.3,0.3]) translate([1035,470,10]) cube([100,70,15]);
color("white") label_at([1040,505,26],"R102");
// COMPONENT S101 Master disconnect
color([0.2,0.3,0.3]) translate([20,580,10]) cube([100,70,15]);
color("white") label_at([25,615,26],"S101");
// COMPONENT S102 Emergency stop NC
color([0.2,0.3,0.3]) translate([165,580,10]) cube([100,70,15]);
color("white") label_at([170,615,26],"S102");
// COMPONENT S103 Enclosure interlock NC
color([0.2,0.3,0.3]) translate([310,580,10]) cube([100,70,15]);
color("white") label_at([315,615,26],"S103");
// COMPONENT S104 Thermal cutoff NC
color([0.2,0.3,0.3]) translate([455,580,10]) cube([100,70,15]);
color("white") label_at([460,615,26],"S104");
// COMPONENT T1 Transformer_1P_2S
color([0.2,0.3,0.3]) translate([600,580,10]) cube([100,70,15]);
color("white") label_at([605,615,26],"T1");
// COMPONENT T2 Transformer_1P_2S
color([0.2,0.3,0.3]) translate([745,580,10]) cube([100,70,15]);
color("white") label_at([750,615,26],"T2");
// COMPONENT TP101 HV differential monitor / isolation TBD
color([0.2,0.3,0.3]) translate([890,580,10]) cube([100,70,15]);
color("white") label_at([895,615,26],"TP101");
// COMPONENT TR3 TEZ0.5-D-1
color([0.2,0.3,0.3]) translate([1035,580,10]) cube([100,70,15]);
color("white") label_at([1040,615,26],"TR3");
// COMPONENT U1 HHG1D-1
color([0.2,0.3,0.3]) translate([20,690,10]) cube([100,70,15]);
color("white") label_at([25,725,26],"U1");
// COMPONENT U101 Sequencer / shutdown controller - TBD
color([0.2,0.3,0.3]) translate([165,690,10]) cube([100,70,15]);
color("white") label_at([170,725,26],"U101");
// COMPONENT U201 Isolated driver / limiter - TBD
color([0.2,0.3,0.3]) translate([310,690,10]) cube([100,70,15]);
color("white") label_at([315,725,26],"U201");
// COMPONENT U301 Isolated driver / limiter - TBD
color([0.2,0.3,0.3]) translate([455,690,10]) cube([100,70,15]);
color("white") label_at([460,725,26],"U301");
// COMPONENT U401 Isolated driver / limiter - TBD
color([0.2,0.3,0.3]) translate([600,690,10]) cube([100,70,15]);
color("white") label_at([605,725,26],"U401");
// COMPONENT U501 Isolated driver / limiter - TBD
color([0.2,0.3,0.3]) translate([745,690,10]) cube([100,70,15]);
color("white") label_at([750,725,26],"U501");
// COMPONENT U601 Gas valve driver + flyback / TBD
color([0.2,0.3,0.3]) translate([890,690,10]) cube([100,70,15]);
color("white") label_at([895,725,26],"U601");
// COMPONENT U602 Isolated neutralizer supply / TBD
color([0.2,0.3,0.3]) translate([1035,690,10]) cube([100,70,15]);
color("white") label_at([1040,725,26],"U602");
// COMPONENT U701 Magnos isolated booster 1/1; target 1e+07 V / TBD
color([0.2,0.3,0.3]) translate([20,800,10]) cube([100,70,15]);
color("white") label_at([25,835,26],"U701");
// COMPONENT Y2 2500Hz
color([0.2,0.3,0.3]) translate([165,800,10]) cube([100,70,15]);
color("white") label_at([170,835,26],"Y2");
// COMPONENT Y3 Squared 60Hz
color([0.2,0.3,0.3]) translate([310,800,10]) cube([100,70,15]);
color("white") label_at([315,835,26],"Y3");
// COMPONENT Y4 Squared 200KHz
color([0.2,0.3,0.3]) translate([455,800,10]) cube([100,70,15]);
color("white") label_at([460,835,26],"Y4");
// COMPONENT Y5 Squared 250Hz
color([0.2,0.3,0.3]) translate([600,800,10]) cube([100,70,15]);
color("white") label_at([605,835,26],"Y5");
// NET BOOST_AC_A D101.1 -> D103.2
color([1, 0.55, 0.16]) cable([[175, 147, 37], [175, 147, 65.0], [473, 147, 65.0], [473, 147, 37]]);
// NET BOOST_AC_A D103.2 -> J3.1
color([1, 0.55, 0.16]) cable([[473, 147, 37], [473, 147, 66.4], [610, 257, 66.4], [610, 257, 37]]);
// NET BOOST_AC_A J3.1 -> U1.2
color([1, 0.55, 0.16]) cable([[610, 257, 37], [610, 257, 67.8], [38, 697, 67.8], [38, 697, 37]]);
// NET BOOST_AC_B D102.1 -> D104.2
color([1, 0.55, 0.16]) cable([[320, 147, 37], [320, 147, 69.2], [618, 147, 69.2], [618, 147, 37]]);
// NET BOOST_AC_B D104.2 -> J3.2
color([1, 0.55, 0.16]) cable([[618, 147, 37], [618, 147, 70.6], [618, 257, 70.6], [618, 257, 37]]);
// NET BOOST_AC_B J3.2 -> TR3.1
color([1, 0.55, 0.16]) cable([[618, 257, 37], [618, 257, 72.0], [1045, 587, 72.0], [1045, 587, 37]]);
// NET BOOST_DC_N J4.2 -> Q8.1
color([0.4, 0.45, 0.65]) cable([[763, 257, 37], [763, 257, 73.4], [610, 477, 73.4], [610, 477, 37]]);
// NET BOOST_DC_N Q8.1 -> U201.2
color([0.4, 0.45, 0.65]) cable([[610, 477, 37], [610, 477, 74.8], [328, 697, 74.8], [328, 697, 37]]);
// NET BOOST_DC_N U201.2 -> U301.2
color([0.4, 0.45, 0.65]) cable([[328, 697, 37], [328, 697, 76.2], [473, 697, 76.2], [473, 697, 37]]);
// NET BOOST_DC_P D10.2 -> F201.1
color([1, 0.55, 0.16]) cable([[38, 147, 37], [38, 147, 77.6], [1045, 147, 77.6], [1045, 147, 37]]);
// NET BOOST_DC_P F201.1 -> F301.1
color([1, 0.55, 0.16]) cable([[1045, 147, 37], [1045, 147, 79.0], [30, 257, 79.0], [30, 257, 37]]);
// NET BOOST_DC_P F301.1 -> J4.1
color([1, 0.55, 0.16]) cable([[30, 257, 37], [30, 257, 80.4], [755, 257, 80.4], [755, 257, 37]]);
// NET CHASSIS J101.3 -> J104.1
color([0.3, 0.8, 0.3]) cable([[916, 257, 37], [916, 257, 81.8], [175, 367, 81.8], [175, 367, 37]]);
// NET CHASSIS J104.1 -> J104.2
color([0.3, 0.8, 0.3]) cable([[175, 367, 37], [175, 367, 83.2], [183, 367, 83.2], [183, 367, 37]]);
// NET CMD_GAS U101.8 -> U601.3
color([0.2, 0.8, 0.9]) cable([[231, 697, 37], [231, 697, 84.6], [916, 697, 84.6], [916, 697, 37]]);
// NET CMD_PR U101.7 -> U301.3
color([0.2, 0.8, 0.9]) cable([[223, 697, 37], [223, 697, 86.0], [481, 697, 86.0], [481, 697, 37]]);
// NET CMD_PR U301.3 -> U501.3
color([0.2, 0.8, 0.9]) cable([[481, 697, 37], [481, 697, 87.4], [771, 697, 87.4], [771, 697, 37]]);
// NET CMD_PR U501.3 -> U602.3
color([0.2, 0.8, 0.9]) cable([[771, 697, 37], [771, 697, 88.8], [1061, 697, 88.8], [1061, 697, 37]]);
// NET CMD_SH U101.6 -> U201.3
color([0.2, 0.8, 0.9]) cable([[215, 697, 37], [215, 697, 90.2], [336, 697, 90.2], [336, 697, 37]]);
// NET CMD_SH U201.3 -> U401.3
color([0.2, 0.8, 0.9]) cable([[336, 697, 37], [336, 697, 91.6], [626, 697, 91.6], [626, 697, 37]]);
// NET COVER_OK S103.2 -> S104.1
color([1, 0.55, 0.16]) cable([[328, 587, 37], [328, 587, 93.0], [465, 587, 93.0], [465, 587, 37]]);
// NET ENABLE R101.1 -> S104.2
color([0.2, 0.8, 0.9]) cable([[900, 477, 37], [900, 477, 94.4], [473, 587, 94.4], [473, 587, 37]]);
// NET ENABLE S104.2 -> U101.3
color([0.2, 0.8, 0.9]) cable([[473, 587, 37], [473, 587, 95.8], [191, 697, 95.8], [191, 697, 37]]);
// NET ENABLE U101.3 -> U701.3
color([0.2, 0.8, 0.9]) cable([[191, 697, 37], [191, 697, 97.19999999999999], [46, 807, 97.19999999999999], [46, 807, 37]]);
// NET ESTOP_OK S102.2 -> S103.1
color([1, 0.55, 0.16]) cable([[183, 587, 37], [183, 587, 98.6], [320, 587, 98.6], [320, 587, 37]]);
// NET GAS_N J601.2 -> U601.5
color([0.4, 0.45, 0.65]) cable([[1053, 367, 37], [1053, 367, 100.0], [932, 697, 100.0], [932, 697, 37]]);
// NET GAS_P J601.1 -> U601.4
color([1, 0.55, 0.16]) cable([[1045, 367, 37], [1045, 367, 101.4], [924, 697, 101.4], [924, 697, 37]]);
// NET HV_BUS_P C101.1 -> F401.1
color([1, 0.55, 0.16]) cable([[610, 37, 37], [610, 37, 102.8], [175, 257, 102.8], [175, 257, 37]]);
// NET HV_BUS_P F401.1 -> F501.1
color([1, 0.55, 0.16]) cable([[175, 257, 37], [175, 257, 104.19999999999999], [320, 257, 104.19999999999999], [320, 257, 37]]);
// NET HV_BUS_P F501.1 -> R102.1
color([1, 0.55, 0.16]) cable([[320, 257, 37], [320, 257, 105.6], [1045, 477, 105.6], [1045, 477, 37]]);
// NET HV_BUS_P R102.1 -> TP101.1
color([1, 0.55, 0.16]) cable([[1045, 477, 37], [1045, 477, 107.0], [900, 587, 107.0], [900, 587, 37]]);
// NET HV_BUS_P TP101.1 -> U602.1
color([1, 0.55, 0.16]) cable([[900, 587, 37], [900, 587, 108.4], [1045, 697, 108.4], [1045, 697, 37]]);
// NET HV_BUS_P U602.1 -> U701.5
color([1, 0.55, 0.16]) cable([[1045, 697, 37], [1045, 697, 109.8], [62, 807, 109.8], [62, 807, 37]]);
// NET HV_PREBOOST_P F102.2 -> U701.1
color([1, 0.55, 0.16]) cable([[908, 147, 37], [908, 147, 111.19999999999999], [30, 807, 111.19999999999999], [30, 807, 37]]);
// NET HV_RAW_P D101.2 -> D102.2
color([1, 0.55, 0.16]) cable([[183, 147, 37], [183, 147, 112.6], [328, 147, 112.6], [328, 147, 37]]);
// NET HV_RAW_P D102.2 -> F102.1
color([1, 0.55, 0.16]) cable([[328, 147, 37], [328, 147, 114.0], [900, 147, 114.0], [900, 147, 37]]);
// NET HV_RETURN D103.1 -> D104.1
color([0.4, 0.45, 0.65]) cable([[465, 147, 37], [465, 147, 115.4], [610, 147, 115.4], [610, 147, 37]]);
// NET HV_RETURN D104.1 -> U701.2
color([0.4, 0.45, 0.65]) cable([[610, 147, 37], [610, 147, 116.8], [38, 807, 116.8], [38, 807, 37]]);
// NET HV_SENSE J105.1 -> TP101.4
color([1, 0.55, 0.16]) cable([[320, 367, 37], [320, 367, 118.19999999999999], [924, 587, 118.19999999999999], [924, 587, 37]]);
// NET HV_STACK_RETURN C101.2 -> R102.2
color([0.4, 0.45, 0.65]) cable([[618, 37, 37], [618, 37, 119.6], [1053, 477, 119.6], [1053, 477, 37]]);
// NET HV_STACK_RETURN R102.2 -> TP101.2
color([0.4, 0.45, 0.65]) cable([[1053, 477, 37], [1053, 477, 121.0], [908, 587, 121.0], [908, 587, 37]]);
// NET HV_STACK_RETURN TP101.2 -> U401.2
color([0.4, 0.45, 0.65]) cable([[908, 587, 37], [908, 587, 122.4], [618, 697, 122.4], [618, 697, 37]]);
// NET HV_STACK_RETURN U401.2 -> U501.2
color([0.4, 0.45, 0.65]) cable([[618, 697, 37], [618, 697, 123.8], [763, 697, 123.8], [763, 697, 37]]);
// NET HV_STACK_RETURN U501.2 -> U602.2
color([0.4, 0.45, 0.65]) cable([[763, 697, 37], [763, 697, 125.19999999999999], [1053, 697, 125.19999999999999], [1053, 697, 37]]);
// NET HV_STACK_RETURN U602.2 -> U701.6
color([0.4, 0.45, 0.65]) cable([[1053, 697, 37], [1053, 697, 126.6], [70, 807, 126.6], [70, 807, 37]]);
// NET INPUT_5V C6.1 -> D7.2
color([1, 0.55, 0.16]) cable([[30, 37, 37], [30, 37, 128.0], [908, 37, 128.0], [908, 37, 37]]);
// NET INPUT_5V D7.2 -> J1.1
color([1, 0.55, 0.16]) cable([[908, 37, 37], [908, 37, 129.39999999999998], [465, 257, 129.39999999999998], [465, 257, 37]]);
// NET INPUT_5V J1.1 -> J102.1
color([1, 0.55, 0.16]) cable([[465, 257, 37], [465, 257, 130.8], [1045, 257, 130.8], [1045, 257, 37]]);
// NET INPUT_5V J102.1 -> J103.1
color([1, 0.55, 0.16]) cable([[1045, 257, 37], [1045, 257, 132.2], [30, 367, 132.2], [30, 367, 37]]);
// NET INPUT_5V J103.1 -> S101.2
color([1, 0.55, 0.16]) cable([[30, 367, 37], [30, 367, 133.6], [38, 587, 133.6], [38, 587, 37]]);
// NET INPUT_5V S101.2 -> S102.1
color([1, 0.55, 0.16]) cable([[38, 587, 37], [38, 587, 135.0], [175, 587, 135.0], [175, 587, 37]]);
// NET INPUT_5V S102.1 -> U101.1
color([1, 0.55, 0.16]) cable([[175, 587, 37], [175, 587, 136.39999999999998], [175, 697, 136.39999999999998], [175, 697, 37]]);
// NET INPUT_5V U101.1 -> U601.1
color([1, 0.55, 0.16]) cable([[175, 697, 37], [175, 697, 137.8], [900, 697, 137.8], [900, 697, 37]]);
// NET INPUT_5V U601.1 -> Y2.14
color([1, 0.55, 0.16]) cable([[900, 697, 37], [900, 697, 139.2], [199, 807, 139.2], [199, 807, 37]]);
// NET INPUT_5V Y2.14 -> Y3.14
color([1, 0.55, 0.16]) cable([[199, 807, 37], [199, 807, 140.6], [344, 807, 140.6], [344, 807, 37]]);
// NET INPUT_5V Y3.14 -> Y4.14
color([1, 0.55, 0.16]) cable([[344, 807, 37], [344, 807, 142.0], [489, 807, 142.0], [489, 807, 37]]);
// NET INPUT_5V Y4.14 -> Y5.14
color([1, 0.55, 0.16]) cable([[489, 807, 37], [489, 807, 143.39999999999998], [634, 807, 143.39999999999998], [634, 807, 37]]);
// NET INPUT_RETURN C6.2 -> C8.2
color([0.4, 0.45, 0.65]) cable([[38, 37, 37], [38, 37, 144.8], [183, 37, 144.8], [183, 37, 37]]);
// NET INPUT_RETURN C8.2 -> J1.2
color([0.4, 0.45, 0.65]) cable([[183, 37, 37], [183, 37, 146.2], [473, 257, 146.2], [473, 257, 37]]);
// NET INPUT_RETURN J1.2 -> J101.2
color([0.4, 0.45, 0.65]) cable([[473, 257, 37], [473, 257, 147.6], [908, 257, 147.6], [908, 257, 37]]);
// NET INPUT_RETURN J101.2 -> J102.2
color([0.4, 0.45, 0.65]) cable([[908, 257, 37], [908, 257, 149.0], [1053, 257, 149.0], [1053, 257, 37]]);
// NET INPUT_RETURN J102.2 -> J103.2
color([0.4, 0.45, 0.65]) cable([[1053, 257, 37], [1053, 257, 150.39999999999998], [38, 367, 150.39999999999998], [38, 367, 37]]);
// NET INPUT_RETURN J103.2 -> J105.2
color([0.4, 0.45, 0.65]) cable([[38, 367, 37], [38, 367, 151.8], [328, 367, 151.8], [328, 367, 37]]);
// NET INPUT_RETURN J105.2 -> Q2.3
color([0.4, 0.45, 0.65]) cable([[328, 367, 37], [328, 367, 153.2], [336, 477, 153.2], [336, 477, 37]]);
// NET INPUT_RETURN Q2.3 -> Q5.3
color([0.4, 0.45, 0.65]) cable([[336, 477, 37], [336, 477, 154.6], [481, 477, 154.6], [481, 477, 37]]);
// NET INPUT_RETURN Q5.3 -> Q8.3
color([0.4, 0.45, 0.65]) cable([[481, 477, 37], [481, 477, 156.0], [626, 477, 156.0], [626, 477, 37]]);
// NET INPUT_RETURN Q8.3 -> R101.2
color([0.4, 0.45, 0.65]) cable([[626, 477, 37], [626, 477, 157.39999999999998], [908, 477, 157.39999999999998], [908, 477, 37]]);
// NET INPUT_RETURN R101.2 -> T1.1
color([0.4, 0.45, 0.65]) cable([[908, 477, 37], [908, 477, 158.8], [610, 587, 158.8], [610, 587, 37]]);
// NET INPUT_RETURN T1.1 -> TP101.3
color([0.4, 0.45, 0.65]) cable([[610, 587, 37], [610, 587, 160.2], [916, 587, 160.2], [916, 587, 37]]);
// NET INPUT_RETURN TP101.3 -> U101.2
color([0.4, 0.45, 0.65]) cable([[916, 587, 37], [916, 587, 161.6], [183, 697, 161.6], [183, 697, 37]]);
// NET INPUT_RETURN U101.2 -> U201.4
color([0.4, 0.45, 0.65]) cable([[183, 697, 37], [183, 697, 163.0], [344, 697, 163.0], [344, 697, 37]]);
// NET INPUT_RETURN U201.4 -> U301.4
color([0.4, 0.45, 0.65]) cable([[344, 697, 37], [344, 697, 164.39999999999998], [489, 697, 164.39999999999998], [489, 697, 37]]);
// NET INPUT_RETURN U301.4 -> U401.4
color([0.4, 0.45, 0.65]) cable([[489, 697, 37], [489, 697, 165.8], [634, 697, 165.8], [634, 697, 37]]);
// NET INPUT_RETURN U401.4 -> U501.4
color([0.4, 0.45, 0.65]) cable([[634, 697, 37], [634, 697, 167.2], [779, 697, 167.2], [779, 697, 37]]);
// NET INPUT_RETURN U501.4 -> U601.2
color([0.4, 0.45, 0.65]) cable([[779, 697, 37], [779, 697, 168.6], [908, 697, 168.6], [908, 697, 37]]);
// NET INPUT_RETURN U601.2 -> U602.4
color([0.4, 0.45, 0.65]) cable([[908, 697, 37], [908, 697, 170.0], [1069, 697, 170.0], [1069, 697, 37]]);
// NET INPUT_RETURN U602.4 -> U701.4
color([0.4, 0.45, 0.65]) cable([[1069, 697, 37], [1069, 697, 171.39999999999998], [54, 807, 171.39999999999998], [54, 807, 37]]);
// NET INPUT_RETURN U701.4 -> Y2.7
color([0.4, 0.45, 0.65]) cable([[54, 807, 37], [54, 807, 172.8], [183, 807, 172.8], [183, 807, 37]]);
// NET INPUT_RETURN Y2.7 -> Y3.7
color([0.4, 0.45, 0.65]) cable([[183, 807, 37], [183, 807, 174.2], [328, 807, 174.2], [328, 807, 37]]);
// NET INPUT_RETURN Y3.7 -> Y4.7
color([0.4, 0.45, 0.65]) cable([[328, 807, 37], [328, 807, 175.6], [473, 807, 175.6], [473, 807, 37]]);
// NET NEUT_N J602.2 -> U602.6
color([0.4, 0.45, 0.65]) cable([[38, 477, 37], [38, 477, 177.0], [1085, 697, 177.0], [1085, 697, 37]]);
// NET NEUT_P J602.1 -> U602.5
color([1, 0.55, 0.16]) cable([[30, 477, 37], [30, 477, 178.39999999999998], [1077, 697, 178.39999999999998], [1077, 697, 37]]);
// NET PR_COIL_N J301.2 -> U301.6
color([0.4, 0.45, 0.65]) cable([[618, 367, 37], [618, 367, 179.8], [505, 697, 179.8], [505, 697, 37]]);
// NET PR_COIL_P J301.1 -> U301.5
color([1, 0.55, 0.16]) cable([[610, 367, 37], [610, 367, 181.2], [497, 697, 181.2], [497, 697, 37]]);
// NET PR_DC_IN F301.2 -> U301.1
color([1, 0.55, 0.16]) cable([[38, 257, 37], [38, 257, 182.6], [465, 697, 182.6], [465, 697, 37]]);
// NET PR_ELECTRODE_N J501.2 -> U501.6
color([0.4, 0.45, 0.65]) cable([[908, 367, 37], [908, 367, 184.0], [795, 697, 184.0], [795, 697, 37]]);
// NET PR_ELECTRODE_P J501.1 -> U501.5
color([1, 0.55, 0.16]) cable([[900, 367, 37], [900, 367, 185.39999999999998], [787, 697, 185.39999999999998], [787, 697, 37]]);
// NET PR_HV_IN F501.2 -> U501.1
color([1, 0.55, 0.16]) cable([[328, 257, 37], [328, 257, 186.8], [755, 697, 186.8], [755, 697, 37]]);
// NET PR_TEMP J103.3 -> U101.5
color([0.2, 0.8, 0.9]) cable([[46, 367, 37], [46, 367, 188.2], [207, 697, 188.2], [207, 697, 37]]);
// NET PWR_FUSED F101.2 -> S101.1
color([1, 0.55, 0.16]) cable([[763, 147, 37], [763, 147, 189.6], [30, 587, 189.6], [30, 587, 37]]);
// NET PWR_RAW F101.1 -> J101.1
color([1, 0.55, 0.16]) cable([[755, 147, 37], [755, 147, 191.0], [900, 257, 191.0], [900, 257, 37]]);
// NET SH_COIL_N J201.2 -> U201.6
color([0.4, 0.45, 0.65]) cable([[473, 367, 37], [473, 367, 192.39999999999998], [360, 697, 192.39999999999998], [360, 697, 37]]);
// NET SH_COIL_P J201.1 -> U201.5
color([1, 0.55, 0.16]) cable([[465, 367, 37], [465, 367, 193.79999999999998], [352, 697, 193.79999999999998], [352, 697, 37]]);
// NET SH_DC_IN F201.2 -> U201.1
color([1, 0.55, 0.16]) cable([[1053, 147, 37], [1053, 147, 195.2], [320, 697, 195.2], [320, 697, 37]]);
// NET SH_ELECTRODE_N J401.2 -> U401.6
color([0.4, 0.45, 0.65]) cable([[763, 367, 37], [763, 367, 196.6], [650, 697, 196.6], [650, 697, 37]]);
// NET SH_ELECTRODE_P J401.1 -> U401.5
color([1, 0.55, 0.16]) cable([[755, 367, 37], [755, 367, 198.0], [642, 697, 198.0], [642, 697, 37]]);
// NET SH_HV_IN F401.2 -> U401.1
color([1, 0.55, 0.16]) cable([[183, 257, 37], [183, 257, 199.39999999999998], [610, 697, 199.39999999999998], [610, 697, 37]]);
// NET SH_TEMP J102.3 -> U101.4
color([0.2, 0.8, 0.9]) cable([[1061, 257, 37], [1061, 257, 200.79999999999998], [199, 697, 200.79999999999998], [199, 697, 37]]);
// NET Net-(C9-Pad1) C9.1 -> TR3.4
color([1, 0.55, 0.16]) cable([[320, 37, 37], [320, 37, 202.2], [1069, 587, 202.2], [1069, 587, 37]]);
// NET Net-(C10-Pad1) C10.1 -> R1.2
color([1, 0.55, 0.16]) cable([[465, 37, 37], [465, 37, 203.6], [763, 477, 203.6], [763, 477, 37]]);
// NET Net-(C10-Pad2) C10.2 -> C8.1
color([1, 0.55, 0.16]) cable([[473, 37, 37], [473, 37, 205.0], [175, 37, 205.0], [175, 37, 37]]);
// NET Net-(D1-A) D1.2 -> L1.1
color([1, 0.55, 0.16]) cable([[763, 37, 37], [763, 37, 206.39999999999998], [175, 477, 206.39999999999998], [175, 477, 37]]);
// NET Net-(D1-A) L1.1 -> Q2.1
color([1, 0.55, 0.16]) cable([[175, 477, 37], [175, 477, 207.79999999999998], [320, 477, 207.79999999999998], [320, 477, 37]]);
// NET Net-(D1-K) D1.1 -> R1.1
color([1, 0.55, 0.16]) cable([[755, 37, 37], [755, 37, 209.2], [755, 477, 209.2], [755, 477, 37]]);
// NET Net-(D9-A) D9.2 -> Y3.8
color([1, 0.55, 0.16]) cable([[1053, 37, 37], [1053, 37, 210.6], [336, 807, 210.6], [336, 807, 37]]);
// NET Net-(D9-K) D9.1 -> Q8.2
color([1, 0.55, 0.16]) cable([[1045, 37, 37], [1045, 37, 212.0], [618, 477, 212.0], [618, 477, 37]]);
// NET Net-(D10-K) D10.1 -> D7.1
color([1, 0.55, 0.16]) cable([[30, 147, 37], [30, 147, 213.39999999999998], [900, 37, 213.39999999999998], [900, 37, 37]]);
// NET Net-(D10-K) D7.1 -> L1.2
color([1, 0.55, 0.16]) cable([[900, 37, 37], [900, 37, 214.79999999999998], [183, 477, 214.79999999999998], [183, 477, 37]]);
// NET Net-(Q2-B) Q2.2 -> Y4.8
color([1, 0.55, 0.16]) cable([[328, 477, 37], [328, 477, 216.2], [481, 807, 216.2], [481, 807, 37]]);
// NET Net-(Q5-B) Q5.2 -> Y2.8
color([1, 0.55, 0.16]) cable([[473, 477, 37], [473, 477, 217.6], [191, 807, 217.6], [191, 807, 37]]);
// NET Net-(Q5-C) Q5.1 -> T2.1
color([1, 0.55, 0.16]) cable([[465, 477, 37], [465, 477, 219.0], [755, 587, 219.0], [755, 587, 37]]);
// NET Net-(T1-AB) T1.2 -> T2.2
color([1, 0.55, 0.16]) cable([[618, 587, 37], [618, 587, 220.39999999999998], [763, 587, 220.39999999999998], [763, 587, 37]]);
// NET Net-(T1-SA) T1.3 -> U1.1
color([1, 0.55, 0.16]) cable([[626, 587, 37], [626, 587, 221.79999999999998], [30, 697, 221.79999999999998], [30, 697, 37]]);
// NET Net-(T1-SB) C9.2 -> T1.4
color([1, 0.55, 0.16]) cable([[328, 37, 37], [328, 37, 223.2], [634, 587, 223.2], [634, 587, 37]]);
// NET Net-(T1-SC) T1.5 -> TR3.3
color([1, 0.55, 0.16]) cable([[642, 587, 37], [642, 587, 224.6], [1061, 587, 224.6], [1061, 587, 37]]);
// NET Net-(T1-SD) T1.6 -> T2.3
color([1, 0.55, 0.16]) cable([[650, 587, 37], [650, 587, 226.0], [771, 587, 226.0], [771, 587, 37]]);
// NET Net-(T2-SB) T2.4 -> T2.5
color([1, 0.55, 0.16]) cable([[779, 587, 37], [779, 587, 227.39999999999998], [787, 587, 227.39999999999998], [787, 587, 37]]);
// NET Net-(T2-SD) T2.6 -> TR3.2
color([1, 0.55, 0.16]) cable([[795, 587, 37], [795, 587, 228.79999999999998], [1053, 587, 228.79999999999998], [1053, 587, 37]]);
// NET Net-(Y5-GND) U1.4 -> Y5.7
color([1, 0.55, 0.16]) cable([[54, 697, 37], [54, 697, 230.2], [618, 807, 230.2], [618, 807, 37]]);
// NET Net-(Y5-OUT) U1.3 -> Y5.8
color([1, 0.55, 0.16]) cable([[46, 697, 37], [46, 697, 231.6], [626, 807, 231.6], [626, 807, 37]]);
color("white") label_at([20,1070,62],"1 Magnos / 10 MV target / conceptual routing");
color("gold") translate([30, 37, 37]) sphere(r=2);
color("gold") translate([38, 37, 37]) sphere(r=2);
color("gold") translate([175, 37, 37]) sphere(r=2);
color("gold") translate([183, 37, 37]) sphere(r=2);
color("gold") translate([320, 37, 37]) sphere(r=2);
color("gold") translate([328, 37, 37]) sphere(r=2);
color("gold") translate([465, 37, 37]) sphere(r=2);
color("gold") translate([473, 37, 37]) sphere(r=2);
color("gold") translate([610, 37, 37]) sphere(r=2);
color("gold") translate([618, 37, 37]) sphere(r=2);
color("gold") translate([755, 37, 37]) sphere(r=2);
color("gold") translate([763, 37, 37]) sphere(r=2);
color("gold") translate([900, 37, 37]) sphere(r=2);
color("gold") translate([908, 37, 37]) sphere(r=2);
color("gold") translate([1045, 37, 37]) sphere(r=2);
color("gold") translate([1053, 37, 37]) sphere(r=2);
color("gold") translate([30, 147, 37]) sphere(r=2);
color("gold") translate([38, 147, 37]) sphere(r=2);
color("gold") translate([175, 147, 37]) sphere(r=2);
color("gold") translate([183, 147, 37]) sphere(r=2);
color("gold") translate([320, 147, 37]) sphere(r=2);
color("gold") translate([328, 147, 37]) sphere(r=2);
color("gold") translate([465, 147, 37]) sphere(r=2);
color("gold") translate([473, 147, 37]) sphere(r=2);
color("gold") translate([610, 147, 37]) sphere(r=2);
color("gold") translate([618, 147, 37]) sphere(r=2);
color("gold") translate([755, 147, 37]) sphere(r=2);
color("gold") translate([763, 147, 37]) sphere(r=2);
color("gold") translate([900, 147, 37]) sphere(r=2);
color("gold") translate([908, 147, 37]) sphere(r=2);
color("gold") translate([1045, 147, 37]) sphere(r=2);
color("gold") translate([1053, 147, 37]) sphere(r=2);
color("gold") translate([30, 257, 37]) sphere(r=2);
color("gold") translate([38, 257, 37]) sphere(r=2);
color("gold") translate([175, 257, 37]) sphere(r=2);
color("gold") translate([183, 257, 37]) sphere(r=2);
color("gold") translate([320, 257, 37]) sphere(r=2);
color("gold") translate([328, 257, 37]) sphere(r=2);
color("gold") translate([465, 257, 37]) sphere(r=2);
color("gold") translate([473, 257, 37]) sphere(r=2);
color("gold") translate([610, 257, 37]) sphere(r=2);
color("gold") translate([618, 257, 37]) sphere(r=2);
color("gold") translate([755, 257, 37]) sphere(r=2);
color("gold") translate([763, 257, 37]) sphere(r=2);
color("gold") translate([900, 257, 37]) sphere(r=2);
color("gold") translate([908, 257, 37]) sphere(r=2);
color("gold") translate([916, 257, 37]) sphere(r=2);
color("gold") translate([1045, 257, 37]) sphere(r=2);
color("gold") translate([1053, 257, 37]) sphere(r=2);
color("gold") translate([1061, 257, 37]) sphere(r=2);
color("gold") translate([30, 367, 37]) sphere(r=2);
color("gold") translate([38, 367, 37]) sphere(r=2);
color("gold") translate([46, 367, 37]) sphere(r=2);
color("gold") translate([175, 367, 37]) sphere(r=2);
color("gold") translate([183, 367, 37]) sphere(r=2);
color("gold") translate([320, 367, 37]) sphere(r=2);
color("gold") translate([328, 367, 37]) sphere(r=2);
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
color("gold") translate([175, 477, 37]) sphere(r=2);
color("gold") translate([183, 477, 37]) sphere(r=2);
color("gold") translate([320, 477, 37]) sphere(r=2);
color("gold") translate([328, 477, 37]) sphere(r=2);
color("gold") translate([336, 477, 37]) sphere(r=2);
color("gold") translate([465, 477, 37]) sphere(r=2);
color("gold") translate([473, 477, 37]) sphere(r=2);
color("gold") translate([481, 477, 37]) sphere(r=2);
color("gold") translate([610, 477, 37]) sphere(r=2);
color("gold") translate([618, 477, 37]) sphere(r=2);
color("gold") translate([626, 477, 37]) sphere(r=2);
color("gold") translate([755, 477, 37]) sphere(r=2);
color("gold") translate([763, 477, 37]) sphere(r=2);
color("gold") translate([900, 477, 37]) sphere(r=2);
color("gold") translate([908, 477, 37]) sphere(r=2);
color("gold") translate([1045, 477, 37]) sphere(r=2);
color("gold") translate([1053, 477, 37]) sphere(r=2);
color("gold") translate([30, 587, 37]) sphere(r=2);
color("gold") translate([38, 587, 37]) sphere(r=2);
color("gold") translate([175, 587, 37]) sphere(r=2);
color("gold") translate([183, 587, 37]) sphere(r=2);
color("gold") translate([320, 587, 37]) sphere(r=2);
color("gold") translate([328, 587, 37]) sphere(r=2);
color("gold") translate([465, 587, 37]) sphere(r=2);
color("gold") translate([473, 587, 37]) sphere(r=2);
color("gold") translate([610, 587, 37]) sphere(r=2);
color("gold") translate([618, 587, 37]) sphere(r=2);
color("gold") translate([626, 587, 37]) sphere(r=2);
color("gold") translate([634, 587, 37]) sphere(r=2);
color("gold") translate([642, 587, 37]) sphere(r=2);
color("gold") translate([650, 587, 37]) sphere(r=2);
color("gold") translate([755, 587, 37]) sphere(r=2);
color("gold") translate([763, 587, 37]) sphere(r=2);
color("gold") translate([771, 587, 37]) sphere(r=2);
color("gold") translate([779, 587, 37]) sphere(r=2);
color("gold") translate([787, 587, 37]) sphere(r=2);
color("gold") translate([795, 587, 37]) sphere(r=2);
color("gold") translate([900, 587, 37]) sphere(r=2);
color("gold") translate([908, 587, 37]) sphere(r=2);
color("gold") translate([916, 587, 37]) sphere(r=2);
color("gold") translate([924, 587, 37]) sphere(r=2);
color("gold") translate([1045, 587, 37]) sphere(r=2);
color("gold") translate([1053, 587, 37]) sphere(r=2);
color("gold") translate([1061, 587, 37]) sphere(r=2);
color("gold") translate([1069, 587, 37]) sphere(r=2);
color("gold") translate([30, 697, 37]) sphere(r=2);
color("gold") translate([38, 697, 37]) sphere(r=2);
color("gold") translate([46, 697, 37]) sphere(r=2);
color("gold") translate([54, 697, 37]) sphere(r=2);
color("gold") translate([175, 697, 37]) sphere(r=2);
color("gold") translate([183, 697, 37]) sphere(r=2);
color("gold") translate([191, 697, 37]) sphere(r=2);
color("gold") translate([199, 697, 37]) sphere(r=2);
color("gold") translate([207, 697, 37]) sphere(r=2);
color("gold") translate([215, 697, 37]) sphere(r=2);
color("gold") translate([223, 697, 37]) sphere(r=2);
color("gold") translate([231, 697, 37]) sphere(r=2);
color("gold") translate([320, 697, 37]) sphere(r=2);
color("gold") translate([328, 697, 37]) sphere(r=2);
color("gold") translate([336, 697, 37]) sphere(r=2);
color("gold") translate([344, 697, 37]) sphere(r=2);
color("gold") translate([352, 697, 37]) sphere(r=2);
color("gold") translate([360, 697, 37]) sphere(r=2);
color("gold") translate([465, 697, 37]) sphere(r=2);
color("gold") translate([473, 697, 37]) sphere(r=2);
color("gold") translate([481, 697, 37]) sphere(r=2);
color("gold") translate([489, 697, 37]) sphere(r=2);
color("gold") translate([497, 697, 37]) sphere(r=2);
color("gold") translate([505, 697, 37]) sphere(r=2);
color("gold") translate([610, 697, 37]) sphere(r=2);
color("gold") translate([618, 697, 37]) sphere(r=2);
color("gold") translate([626, 697, 37]) sphere(r=2);
color("gold") translate([634, 697, 37]) sphere(r=2);
color("gold") translate([642, 697, 37]) sphere(r=2);
color("gold") translate([650, 697, 37]) sphere(r=2);
color("gold") translate([755, 697, 37]) sphere(r=2);
color("gold") translate([763, 697, 37]) sphere(r=2);
color("gold") translate([771, 697, 37]) sphere(r=2);
color("gold") translate([779, 697, 37]) sphere(r=2);
color("gold") translate([787, 697, 37]) sphere(r=2);
color("gold") translate([795, 697, 37]) sphere(r=2);
color("gold") translate([900, 697, 37]) sphere(r=2);
color("gold") translate([908, 697, 37]) sphere(r=2);
color("gold") translate([916, 697, 37]) sphere(r=2);
color("gold") translate([924, 697, 37]) sphere(r=2);
color("gold") translate([932, 697, 37]) sphere(r=2);
color("gold") translate([1045, 697, 37]) sphere(r=2);
color("gold") translate([1053, 697, 37]) sphere(r=2);
color("gold") translate([1061, 697, 37]) sphere(r=2);
color("gold") translate([1069, 697, 37]) sphere(r=2);
color("gold") translate([1077, 697, 37]) sphere(r=2);
color("gold") translate([1085, 697, 37]) sphere(r=2);
color("gold") translate([30, 807, 37]) sphere(r=2);
color("gold") translate([38, 807, 37]) sphere(r=2);
color("gold") translate([46, 807, 37]) sphere(r=2);
color("gold") translate([54, 807, 37]) sphere(r=2);
color("gold") translate([62, 807, 37]) sphere(r=2);
color("gold") translate([70, 807, 37]) sphere(r=2);
color("gold") translate([175, 807, 37]) sphere(r=2);
color("gold") translate([183, 807, 37]) sphere(r=2);
color("gold") translate([191, 807, 37]) sphere(r=2);
color("gold") translate([199, 807, 37]) sphere(r=2);
color("gold") translate([320, 807, 37]) sphere(r=2);
color("gold") translate([328, 807, 37]) sphere(r=2);
color("gold") translate([336, 807, 37]) sphere(r=2);
color("gold") translate([344, 807, 37]) sphere(r=2);
color("gold") translate([465, 807, 37]) sphere(r=2);
color("gold") translate([473, 807, 37]) sphere(r=2);
color("gold") translate([481, 807, 37]) sphere(r=2);
color("gold") translate([489, 807, 37]) sphere(r=2);
color("gold") translate([610, 807, 37]) sphere(r=2);
color("gold") translate([618, 807, 37]) sphere(r=2);
color("gold") translate([626, 807, 37]) sphere(r=2);
color("gold") translate([634, 807, 37]) sphere(r=2);

// Board outline from beta PCB Edge.Cuts (70,15) to (160,125).
// Board thickness 1.6 mm from PCB general. Housing dimensions assumed.
module magnos_beta_board() { color("green") cube([90,110,1.6]); }
module magnos_beta_enclosure() {
  color("darkslategray") difference() {
    cube([110,130,60]);
    translate([3,3,3]) cube([104,124,60]);
  }
  translate([10,10,10]) magnos_beta_board();
}
if(is_undef(assembly_include)) magnos_beta_enclosure();

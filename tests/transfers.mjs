import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.mjs';
import {solveLambert, gravityAssist, hohmannTime} from '../transfer-planner.mjs';
import {magnosBooster} from '../magnos-booster.mjs';
// Independently integrate Lambert endpoint velocities with RK4, normalized units.
function propagate(r,v,t) {
  r=r.clone();v=v.clone();const dt=t/4000;
  const a=p=>p.clone().multiplyScalar(-1/p.length()**3);
  for(let i=0;i<4000;i++) {
    const k1r=v.clone(),k1v=a(r);
    const k2r=v.clone().addScaledVector(k1v,dt/2),k2v=a(r.clone().addScaledVector(k1r,dt/2));
    const k3r=v.clone().addScaledVector(k2v,dt/2),k3v=a(r.clone().addScaledVector(k2r,dt/2));
    const k4r=v.clone().addScaledVector(k3v,dt),k4v=a(r.clone().addScaledVector(k3r,dt));
    r.addScaledVector(k1r,dt/6).addScaledVector(k2r,dt/3).addScaledVector(k3r,dt/3).addScaledVector(k4r,dt/6);
    v.addScaledVector(k1v,dt/6).addScaledVector(k2v,dt/3).addScaledVector(k3v,dt/3).addScaledVector(k4v,dt/6);
  } return {r,v};
}
const r=new THREE.Vector3(1,0,0),hint=new THREE.Vector3(0,0,1);
for(const [target,time] of [[new THREE.Vector3(0,0,1),Math.PI/2],[new THREE.Vector3(0,0,-1),3*Math.PI/2],[new THREE.Vector3(0,0,1),0.2],[new THREE.Vector3(-2,0,0),hohmannTime(1,2,1)]]) {
 const s=solveLambert(r,target,time,hint,1);assert.ok(s);
 const end=propagate(r,s.v1,time);
 assert.ok(end.r.distanceTo(target)<1e-7,`endpoint ${end.r.distanceTo(target)}`);
 assert.ok(end.v.distanceTo(s.v2)<1e-7);
}
assert.equal(solveLambert(r,new THREE.Vector3(-2,0,0),1,hint,1),null);
const pv=new THREE.Vector3(0,0,13000), incoming=new THREE.Vector3(20000,0,0);
const assist=gravityAssist(incoming,pv,1.2669e17,7.2e7);
assert.ok(Math.abs(assist.velocity.clone().sub(pv).length()-incoming.clone().sub(pv).length())<1e-8);
assert.ok(assist.energyGainJkg>0);
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const context=vm.createContext({THREE,assert,console,solveLambert,gravityAssist,hohmannTime,magnosBooster});
vm.runInContext(source.slice(0,source.indexOf('const viewport =')).replace(/^import .*;$/gm,''),context);
vm.runInContext(`
const cruiseThrustSlider={value:100}, injectionSlider={value:3.2}, flybySlider={value:500}, periSlider={value:4};
const rocketStateStat={textContent:''},routeStat={textContent:''},oberthStat={textContent:''};
epochDate=new Date('2026-09-06T00:00:00Z');initializeBodies(epochDate);
const plan=optimizeSlingshotRoute();
assert.ok(plan.route.length);
assert.equal(plan.encounters[0].flybyEnergyGainJkg,Math.max(...plan.candidates.map(c=>c.flybyEnergyGainJkg)));
assert.ok(plan.route[0]!=='Venus','current epoch must not repeat old Venus bias');
console.log('Selected:',plan.route[0], 'candidates:',plan.candidates.length, 'gain MJ/kg:',plan.totalFlybyEnergyGainJkg/1e6);
const sun=getBody('Sol'), earth=getBody('Earth');
rocket={active:true,arcMode:true,position:earth.position.clone().addScaledVector(earth.position.clone().sub(sun.position).normalize(),0.929e9*1.15),velocity:earth.velocity.clone().addScaledVector(earth.velocity.clone().sub(sun.velocity).normalize(),3200),plan,routeIndex:0,lastEncounterName:'Earth',visitedPlanets:['Earth'],encountersCompleted:0,replans:0,plannedRouteHistory:[...plan.route],earthElapsedSeconds:0,travelerProperSeconds:0,peakSpeed:0,minimumSolarDistance:AU,assistPlasmaDeltaV:0,routeEnergyGainJkg:0,routeFlybyEnergyGainJkg:0,routePoweredEnergyGainJkg:0};
beginArcLeg(plan.route[0]);
const targetName=plan.route[0];let burns=0,coasts=0;
let previous=rocket.position.clone();
for(let i=0;i<100000 && rocket.active && rocket.arcMode && rocket.leg.targetName===targetName;i++) {
 const dt=currentPhysicsStep();velocityVerletStep(dt);
 assert.ok(rocket.position.distanceTo(previous)<rocket.velocity.length()*dt*2+1e7,'no position snap');
 previous.copy(rocket.position);
 if(rocket.plasmaThrustN>0) burns++;else coasts++;
}
assert.ok(rocket.active,'survives transfer');
assert.equal(rocket.encountersCompleted,1,'actual sphere-of-influence encounter required');
assert.ok(rocket.routeFlybyEnergyGainJkg>0);
assert.ok(rocket.assistPlasmaDeltaV>0 && burns>0 && coasts>0);
assert.ok(rocket.shieldMagneticFieldT>0,'shield field available in transfers');
assert.ok(rocket.minimumSolarDistance > 0.8 * AU, 'planetary legs must not dive at the Sun');
assert.ok(rocket.plan.route.every(n=>!rocket.visitedPlanets.includes(n)),'no repeat targets');
assert.equal(interstellarViewActive(), false, 'solar-system legs stay in solar-system view');
console.log('Flight:',targetName,'->',rocket.plan.route,'burn steps:',burns,'coast steps:',coasts,'actual gain MJ/kg:',rocket.routeFlybyEnergyGainJkg/1e6);
`,context);
console.log('PASS: Lambert RK4 endpoints, Hohmann limit, flyby conservation, best-route selection, powered live encounter and no repeats');

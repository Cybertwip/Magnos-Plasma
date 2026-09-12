import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.mjs';
import {tangentArc,planPoweredTransfer,interstellarEnvelope,magneticBrake,solveLambert,gravityAssist,hohmannTime} from '../transfer-planner.mjs';
import {magnosBank} from '../magnos-booster.mjs';
const p=new THREE.Vector3(1e11,0,0),v=new THREE.Vector3(0,0,30000),q=new THREE.Vector3(0,0,2e11),w=new THREE.Vector3(-20000,0,0);
const arc=tangentArc(p,v,q,w,2e6,1.3271244e20);
assert.ok(arc.sample(0).position.distanceTo(p)<1e-5);
assert.ok(arc.sample(0).velocity.distanceTo(v)<1e-5);
assert.ok(arc.sample(2e6).position.distanceTo(q)<1e-5);
assert.ok(arc.sample(2e6).velocity.distanceTo(w)<1e-5);
const t=0.7e6,h=1;
assert.ok(arc.sample(t+h).velocity.sub(arc.sample(t-h).velocity).multiplyScalar(.5/h).distanceTo(arc.sample(t).acceleration)<1e-8);
assert.equal(planPoweredTransfer({acceleration:0}),null);
for(const count of [1,3,8])for(const targetV of [1e7,1e10,1e13])for(const loadOhm of [1,1e12,1e24]) {
 const b=magnosBank({count,targetV,loadOhm});
 assert.ok(b.outputW<=5*.8**(count+1)+1e-12);
 assert.ok(Math.abs(b.inputW-b.outputW-b.lossW)<1e-10);
}
assert.equal(magneticBrake({densityKgM3:0,speed:1000,areaM2:180,fieldT:20}).forceN,0);
assert.equal(magneticBrake({densityKgM3:1e-22,speed:1000,areaM2:180,fieldT:0}).forceN,0);
assert.equal(magneticBrake({densityKgM3:1e-22,speed:1e8,areaM2:180,fieldT:20}).valid,false);
const trip=interstellarEnvelope(4.37*9.4607304725808e15,9.80665);
assert.ok(trip.earthSeconds>trip.lightSeconds && trip.travelerSeconds<trip.earthSeconds);
const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const context=vm.createContext({THREE,assert,console,planPoweredTransfer,interstellarEnvelope,magneticBrake,solveLambert,gravityAssist,hohmannTime,magnosBank});
vm.runInContext(source.slice(0,source.indexOf('const viewport =')).replace(/^import .*;$/gm,''),context);
vm.runInContext(`
const cruiseThrustSlider={value:100},injectionSlider={value:3.2},flybySlider={value:500};
const rocketStateStat={textContent:''}, routeStat={textContent:''};
for(const [originName,targetName] of [['Earth','Mars'],['Mars','Jupiter'],['Venus','Mercury']]) {
 epochDate=new Date('2026-09-12T00:00:00Z');simulatedSeconds=0;initializeBodies(epochDate);
 const plan=poweredRoutePlan(originName,targetName);assert.ok(plan,originName+' -> '+targetName);
 const sun=getBody('Sol');
 rocket={active:true,arcMode:true,position:sun.position.clone().add(plan.startPosition),velocity:getBody(originName).velocity.clone(),plan,
 earthElapsedSeconds:0,travelerProperSeconds:0,peakSpeed:0,minimumSolarDistance:Infinity,assistPlasmaDeltaV:0,encountersCompleted:0};
 beginArcLeg(targetName);
 let previous=rocket.position.clone(),steps=0;
 while(rocket.active && steps++<200000) {
   const dt=currentPhysicsStep();velocityVerletStep(dt);
   assert.ok(rocket.position.distanceTo(previous)<rocket.velocity.length()*dt*2+1e7,'no position snaps');
   previous.copy(rocket.position);
 }
 assert.equal(rocket.encountersCompleted,1,rocketStateStat.textContent);
 assert.ok(rocket.assistPlasmaDeltaV>0);
 assert.equal(rocket.lockedTo,targetName);
 const offset=rocket.lockOffset.clone(),beforeTime=rocket.earthElapsedSeconds;
 for(let day=0;day<12;day++) velocityVerletStep(6*3600);
 assert.ok(rocket.position.clone().sub(getBody(targetName).position).distanceTo(offset)<1e-3,'planet lock follows orbital motion');
 assert.equal(rocket.earthElapsedSeconds,beforeTime+3*DAY);
 const next=poweredRoutePlan(targetName,originName,rocket);
 assert.ok(next);
 assert.ok(next.startPosition.distanceTo(rocket.position.clone().sub(getBody('Sol').position))<1e-3,'next route starts at docked position');
 assert.ok(rocket.velocity.distanceTo(getBody(targetName).velocity)<500,'rendezvous velocity');
 console.log(originName+' -> '+targetName, (plan.totalTransferDuration/DAY).toFixed(2)+' days',steps+' steps',rocketStateStat.textContent);
}
`,context);
vm.runInContext(`
epochDate=new Date('2026-09-12T00:00:00Z');simulatedSeconds=0;initializeBodies(epochDate);
const flybyPlan=optimizeSlingshotRoute();
assert.ok(flybyPlan.route.length);
assert.ok(flybyPlan.encounters[0].arc && flybyPlan.encounters[0].flyby);
assert.equal(flybyPlan.encounters[0].averageSpeed,Math.max(...flybyPlan.candidates.map(c=>c.averageSpeed)));
const sol=getBody('Sol');
rocket={active:true,arcMode:true,position:sol.position.clone().add(flybyPlan.startPosition),velocity:sol.velocity.clone().add(flybyPlan.encounters[0].solution.v1),plan:flybyPlan,
earthElapsedSeconds:0,travelerProperSeconds:0,peakSpeed:0,minimumSolarDistance:Infinity,assistPlasmaDeltaV:0,encountersCompleted:0,
routeEnergyGainJkg:0,routeFlybyEnergyGainJkg:0,routePoweredEnergyGainJkg:0,replans:0,visitedPlanets:['Earth'],plannedRouteHistory:[...flybyPlan.route],lastEncounterName:'Earth'};
const oberthStat={textContent:''};
beginArcLeg(flybyPlan.route[0]);
let steps=0;
while(rocket.active && rocket.encountersCompleted===0 && steps++<200000) velocityVerletStep(currentPhysicsStep());
assert.equal(rocket.encountersCompleted,1,'powered flyby must encounter the actual planet');
assert.ok(rocket.routeFlybyEnergyGainJkg>0);
assert.ok(!rocket.lockedTo,'slingshots continue without docking');
assert.ok(rocket.assistPlasmaDeltaV>0);
console.log('Powered flyby',flybyPlan.route[0],(flybyPlan.totalTransferDuration/DAY).toFixed(2)+' days',rocket.plan.route);
`,context);
console.log('PASS: arc derivatives, capped cascade power, magnetic momentum exchange, relativistic clocks and integrated powered rendezvous');

context.document={getElementById:id=>({value:({radiatorTarget:600,engineCountSlider:1,plasmaVoltageSlider:10,voltageScale:1e6})[id]})};
vm.runInContext('globalThis.coolPower=steadyPlasmaDrive().acceleratorPowerW;',context);
context.document={getElementById:id=>({value:({radiatorTarget:1216,engineCountSlider:8,plasmaVoltageSlider:10,voltageScale:1e12})[id]})};
vm.runInContext(`assert.ok(steadyPlasmaDrive().acceleratorPowerW>coolPower*10);assert.ok(steadyPlasmaDrive().acceleratorPowerW<=thermalElectricalPowerLimitW(COIL_CURRENT_LIMIT_A)*(1+1e-12));`,context);
console.log('PASS: colder radiator reduces power; eight TV engines share thermal budget');

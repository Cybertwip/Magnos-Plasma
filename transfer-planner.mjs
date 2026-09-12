import { Vector3 } from './vendor/three.mjs';
// Universal-variable formulation informed by the user's grok-workspace
// src/lib/sim/lambert.ts. Unlike its display fallback, nonconverged transfers
// are rejected. Both endpoint velocities and time residual are returned.
const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
export function stumpff(z) {
  if (Math.abs(z)<1e-5) return {c:0.5-z/24+z*z/720-z**3/40320, s:1/6-z/120+z*z/5040-z**3/362880};
  const x=Math.sqrt(Math.abs(z));
  return z>0 ? {c:(1-Math.cos(x))/z,s:(x-Math.sin(x))/(x**3)}
    : {c:(Math.cosh(x)-1)/(-z),s:(Math.sinh(x)-x)/(x**3)};
}
export function hohmannTime(r1,r2,mu) { return Math.PI*Math.sqrt(((r1+r2)/2)**3/mu); }
export function solveLambert(r1,r2,seconds,hint,mu) {
  const a=r1.length(), b=r2.length();
  if (![a,b,seconds,mu].every(Number.isFinite) || Math.min(a,b,seconds,mu)<=0) return null;
  const cosine=clamp(r1.dot(r2)/(a*b),-1,1);
  const cross=new Vector3().crossVectors(r1,r2);
  const normal=new Vector3().crossVectors(r1,hint);
  // Singular Hohmann limit: only the antipodal, correctly timed case.
  if (cosine < -1+1e-12) {
    const expected=hohmannTime(a,b,mu);
    if (Math.abs(seconds-expected)>expected*1e-6 || normal.lengthSq()<1e-20) return null;
    const tangent=new Vector3().crossVectors(normal,r1).normalize();
    const major=(a+b)/2;
    return {v1:tangent.clone().multiplyScalar(Math.sqrt(mu*(2/a-1/major))),
      v2:tangent.clone().multiplyScalar(-Math.sqrt(mu*(2/b-1/major))),
      method:'Hohmann',residualSeconds:seconds-expected};
  }
  if (cosine>1-1e-12 || normal.lengthSq()<1e-20) return null;
  const sign=cross.dot(normal)>=0 ? 1 : -1;
  // Normalize distances and time to improve conditioning at AU scales.
  const length=a, time=Math.sqrt(length**3/mu), B=b/length;
  const A=sign*Math.sqrt(B*(1+cosine));
  const target=seconds/time;
  function evaluate(z) {
    const {c,s}=stumpff(z);
    if (!(c>0)) return null;
    const y=1+B+A*(z*s-1)/Math.sqrt(c);
    if (y<0) return null;
    const tof=(y/c)**1.5*s+A*Math.sqrt(y);
    return Number.isFinite(tof) && tof>=0 ? {tof,y} : null;
  }
  let low=-4, high=4*Math.PI**2-1e-5;
  while (low>-1024 && (evaluate(low)?.tof ?? 0)>target) low*=2;
  if ((evaluate(low)?.tof ?? 0)>target) return null;
  let result=null;
  for(let i=0;i<120;i++) {
    const z=(low+high)/2, e=evaluate(z);
    if (!e || e.tof<target) low=z; else high=z;
    if (e && Math.abs(e.tof-target)<1e-10*Math.max(1,target)) { result=e; break; }
  }
  if (!result) return null;
  const f=1-result.y, g=A*Math.sqrt(result.y)*time, gd=1-result.y/B;
  if (Math.abs(g)<1e-9) return null;
  const v1=r2.clone().addScaledVector(r1,-f).multiplyScalar(1/g);
  const v2=r2.clone().multiplyScalar(gd).sub(r1).multiplyScalar(1/g);
  if (![...v1.toArray(),...v2.toArray()].every(Number.isFinite)) return null;
  return {v1,v2,method:'Lambert',residualSeconds:(result.tof-target)*time};
}
// Rotate planet-relative arrival velocity toward the planet's velocity by
// at most the hyperbolic turn. This conserves v-infinity in the planet frame.
export function gravityAssist(incoming,planetVelocity,muPlanet,periapsis) {
  const relative=incoming.clone().sub(planetVelocity), speed=relative.length();
  if (!(speed>0) || !(periapsis>0)) return null;
  const maximumTurn=2*Math.asin(clamp(1/(1+periapsis*speed*speed/muPlanet),0,1));
  const direction=relative.clone().normalize(), toward=planetVelocity.clone().normalize();
  const angle=Math.acos(clamp(direction.dot(toward),-1,1));
  const turn=Math.min(maximumTurn,angle);
  let axis=new Vector3().crossVectors(direction,toward);
  if(axis.lengthSq()<1e-20) {
    axis.crossVectors(direction,new Vector3(0,1,0));
    if(axis.lengthSq()<1e-20) axis.crossVectors(direction,new Vector3(1,0,0));
  }
  axis.normalize();
  const outgoingRelative=direction.clone().multiplyScalar(Math.cos(turn))
    .addScaledVector(new Vector3().crossVectors(axis,direction),Math.sin(turn))
    .addScaledVector(axis,axis.dot(direction)*(1-Math.cos(turn))).multiplyScalar(speed);
  const velocity=outgoingRelative.add(planetVelocity);
  return {velocity,vInfinity:speed,turnAngle:turn,
    energyGainJkg:(velocity.lengthSq()-incoming.lengthSq())/2};
}

// Cubic Hermite arc: endpoint derivatives are the actual orbital velocities.
// atan2 gives signed tangent headings; it is geometry, not a replacement for
// dynamics. The required plasma acceleration is r''(t) - solar gravity.
export function tangentArc(r0, v0, r1, v1, seconds, mu) {
  if (!(seconds > 0) || !(mu >= 0) || ![seconds,mu,...r0.toArray(),...v0.toArray(),...r1.toArray(),...v1.toArray()].every(Number.isFinite)) return null;
  const sample = time => {
    const u=clamp(time/seconds,0,1), u2=u*u, u3=u2*u;
    const position=r0.clone().multiplyScalar(2*u3-3*u2+1)
      .addScaledVector(v0,seconds*(u3-2*u2+u)).addScaledVector(r1,-2*u3+3*u2)
      .addScaledVector(v1,seconds*(u3-u2));
    const velocity=r0.clone().multiplyScalar((6*u2-6*u)/seconds)
      .addScaledVector(v0,3*u2-4*u+1).addScaledVector(r1,(-6*u2+6*u)/seconds)
      .addScaledVector(v1,3*u2-2*u);
    const acceleration=r0.clone().multiplyScalar((12*u-6)/seconds**2)
      .addScaledVector(v0,(6*u-4)/seconds).addScaledVector(r1,(-12*u+6)/seconds**2)
      .addScaledVector(v1,(6*u-2)/seconds);
    const plasmaAcceleration=acceleration.clone().addScaledVector(position,mu/Math.max(position.length(),1)**3);
    return {position,velocity,acceleration,plasmaAcceleration,heading:Math.atan2(velocity.z,velocity.x)};
  };
  let peakAcceleration=0, deltaV=0, minimumRadius=Infinity;
  const count=256;
  for(let i=0;i<=count;i++) {
    const s=sample(seconds*i/count), a=s.plasmaAcceleration.length();
    peakAcceleration=Math.max(peakAcceleration,a);
    minimumRadius=Math.min(minimumRadius,s.position.length());
    deltaV+=a*seconds/count*(i===0 || i===count ? 0.5 : 1);
  }
  return {sample,seconds,peakAcceleration,deltaV,minimumRadius,method:'Plasma tangent arc'};
}

export function planPoweredTransfer({position,velocity,predictArrival,acceleration,mu,minimumRadius=0,minimumSeconds=86400,maximumSeconds=20*365.25*86400}) {
  if (!(acceleration>0) || !Number.isFinite(acceleration)) return null;
  // Search moving endpoints, reserving 40% of available thrust for tracking,
  // startup and thermal changes. Sampled feasibility is not optimal control.
  for(let seconds=minimumSeconds;seconds<=maximumSeconds;seconds*=1.12) {
    const arrival=predictArrival(seconds);
    const arc=tangentArc(position,velocity,arrival.position,arrival.velocity,seconds,mu);
    if(arc && arc.peakAcceleration<=acceleration*0.6 && arc.minimumRadius>=minimumRadius)
      return {arc,arrival,seconds};
  }
  return null;
}

// Ideal rest-to-rest relativistic trip; no fuel, shield or power feasibility implied.
export function interstellarEnvelope(distance,acceleration) {
  const c=299792458;
  if (!(distance>0) || !(acceleration>0)) return null;
  const gamma=1+acceleration*distance/(2*c*c), eta=Math.acosh(gamma);
  return {earthSeconds:2*c/acceleration*Math.sinh(eta),travelerSeconds:2*c/acceleration*eta,
    peakSpeed:c*Math.tanh(eta),kineticJkg:(gamma-1)*c*c,lightSeconds:distance/c};
}

// Classical external-plasma drag upper bound. Never used as a free vacuum brake.
export function magneticBrake({densityKgM3,speed,areaM2,fieldT}) {
  if (![densityKgM3,speed,areaM2,fieldT].every(Number.isFinite) || Math.min(densityKgM3,speed,areaM2,fieldT)<0) throw new RangeError('Nonnegative finite brake inputs required');
  if(speed>=0.1*299792458) return {forceN:0,powerW:0,valid:false};
  const pressure=fieldT**2/(2*4*Math.PI*1e-7);
  const forceN=Math.min(2*densityKgM3*speed**2,pressure)*areaM2;
  return {forceN,powerW:forceN*speed,valid:true};
}

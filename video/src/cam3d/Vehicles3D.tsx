// Shared vehicles and contact solvers (moved from wit06/Vehicles6.tsx on 2026-10-25 so every episode uses them):
// Bike6 + riderPose/mountPose, Car6 + drivePose/passengerPose/enterCar/carToWorld, bikeOn (both tyres on uneven ground),
// reachArm/handAt (put a hand exactly on a target), reachLeg/ankleAt. See docs/memory/fix-playbook.md.
// Episode 06 vehicles: a whole bicycle and a whole sedan, with rider and driver poses solved against this rig
// (video/src/cam3d/Person3D.tsx) so hands sit ON the grips and the wheel, hips ON the saddle and seat, feet ON the
// pedals (user notes 2, 5, 14, 22, 25, 31: every bike has handlebars, every car is a real car, getting on and in is shown).
// Conventions: vehicle-local +z is forward, +x is the vehicle's left (the rider's left), ground y = 0.
// A person rides/drives by being placed at the vehicle's position and yaw with the local root offset given here
// (RIDER6 for the bike, CAR6.driverRoot / passRoot / rearRootL / rearRootR for the car), with the pose returned.
import React, { useMemo } from "react";
import * as THREE from "three";
import { Pose3, STAND, toon } from "./Person3D";
import { V3 } from "../fx/Vfx";

const D = THREE.MathUtils.degToRad;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const sm = (u: number) => { const x = clamp(u, 0, 1); return x * x * (3 - 2 * x); };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerp3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

// ─── the rig's limbs, solved ──────────────────────────────────────────────────────────────────────────────────
// Same chain as Person3D's arm(): root → hip (0, 0.8 + bob, 0) → torso (rotX lean, rotY twist) → shoulder
// (±0.215, 0.44, −0.01) → rotZ(side·out) → rotX(−fwd) → rotY(side·roll) → upper arm 0.27 → rotX(−elbow) → forearm 0.235,
// then the palm centre about 0.065 further on. All in the person's own frame (root at the origin, yaw 0, size 1).
const _m = new THREE.Matrix4(), _t = new THREE.Matrix4(), _v = new THREE.Vector3();
const mul = (k: "x" | "y" | "z" | "t", a: number, b = 0, c = 0) => {
  if (k === "t") _t.makeTranslation(a, b, c); else if (k === "x") _t.makeRotationX(a); else if (k === "y") _t.makeRotationY(a); else _t.makeRotationZ(a);
  _m.multiply(_t);
};
const PALM = 0.065;
export const handAt = (pose: Pose3, side: 1 | -1, a: number[]): V3 => {
  const rk = pose.reach ?? 1;
  _m.identity(); mul("t", 0, 0.8 + (pose.bob ?? 0), 0); mul("x", D(pose.lean ?? 0)); mul("y", D(pose.twist ?? 0));
  mul("t", side * 0.215, 0.44, -0.01); mul("z", side * D(clamp(a[1], -10, 170))); mul("x", -D(clamp(a[0], -80, 180))); mul("y", side * D(clamp(a[3] ?? 0, -110, 110)));
  mul("t", 0, -0.27 * rk, 0); mul("x", -D(clamp(a[2], 0, 150)));
  _v.set(0, -0.235 * rk - 0.015 - PALM, 0).applyMatrix4(_m);
  return [_v.x, _v.y, _v.z];
};
const d2 = (a: V3, b: V3) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const ikCache = new Map<string, [number, number, number, number]>();
/** Arm angles that put the palm on `target` (person frame). Coordinate descent from a natural reaching start. */
export const reachArm = (pose: Pose3, side: 1 | -1, target: V3, roll = 0): [number, number, number, number] => {
  const key = `${side}|${target.map((x) => x.toFixed(3))}|${(pose.lean ?? 0).toFixed(1)}|${(pose.twist ?? 0).toFixed(1)}|${(pose.bob ?? 0).toFixed(3)}|${roll}`;
  const hit = ikCache.get(key); if (hit) return hit;
  const a = [60, 8, 30, roll];
  const lo = [-80, -10, 0, -70], hi = [180, 120, 150, 70];
  const cost = (x: number[]) => d2(handAt(pose, side, x), target) + 1e-7 * ((x[1] - 8) ** 2 + 0.3 * x[2] ** 2 + 0.5 * (x[3] - roll) ** 2);
  let c = cost(a);
  for (const step of [16, 8, 4, 2, 1, 0.5, 0.25, 0.1]) {
    let improved = true, guard = 0;
    while (improved && guard++ < 60) {
      improved = false;
      for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
        const b = [...a]; b[k] = clamp(b[k] + s * step, lo[k], hi[k]);
        const cb = cost(b); if (cb < c - 1e-12) { a[k] = b[k]; c = cb; improved = true; }
      }
    }
  }
  const out: [number, number, number, number] = [a[0], a[1], a[2], a[3]];
  if (ikCache.size > 4000) ikCache.clear();
  ikCache.set(key, out); return out;
};
/** Leg angles [forward swing, knee bend] that put the ankle on `ankle` (person frame); clamps to the leg's reach. */
export const reachLeg = (bob: number, ankle: V3): [number, number] => {
  const A = 0.39, B = 0.36, hy = 0.8 + bob;
  const dz = ankle[2], dy = ankle[1] - hy;
  const d = clamp(Math.hypot(dz, dy), 0.05, A + B - 0.002);
  const knee = Math.acos(clamp((d * d - A * A - B * B) / (2 * A * B), -1, 1));
  const phi = Math.atan2(dz, -dy), beta = Math.acos(clamp((A * A + d * d - B * B) / (2 * A * d), -1, 1));
  return [(phi + beta) * 180 / Math.PI, knee * 180 / Math.PI];
};
/** Where the ankle actually is for a leg angle pair (for checks). */
export const ankleAt = (bob: number, l: [number, number], side: 1 | -1): V3 => {
  const a0 = D(l[0]), a1 = D(l[0] - l[1]), hy = 0.8 + bob;
  return [side * 0.095, hy - 0.39 * Math.cos(a0) - 0.36 * Math.cos(a1), 0.39 * Math.sin(a0) + 0.36 * Math.sin(a1)];
};

// ─── small geometry helpers ───────────────────────────────────────────────────────────────────────────────────
const _up = new THREE.Vector3(0, 1, 0);
/** A cylinder from a to b. */
const Tube: React.FC<{ a: V3; b: V3; r: number; c: string; seg?: number }> = ({ a, b, r, c, seg = 10 }) => {
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), dir = vb.clone().sub(va);
    return { pos: va.clone().add(vb).multiplyScalar(0.5).toArray() as V3, quat: new THREE.Quaternion().setFromUnitVectors(_up, dir.clone().normalize()), len: dir.length() };
  }, [a[0], a[1], a[2], b[0], b[1], b[2]]);
  return <mesh position={pos} quaternion={quat} material={toon(c)} castShadow><cylinderGeometry args={[r, r, len, seg]} /></mesh>;
};
const B: React.FC<{ p: V3; s: V3; c: string; r?: V3 }> = ({ p, s, c, r }) => (
  <mesh position={p} rotation={r} material={toon(c)} castShadow receiveShadow><boxGeometry args={s} /></mesh>
);
const glass = new THREE.MeshStandardMaterial({ color: "#A9C8DA", transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.3, depthWrite: false, side: THREE.DoubleSide });
const glow = (c: string, on: boolean) => <meshBasicMaterial color={on ? c : new THREE.Color(c).multiplyScalar(0.45)} toneMapped={false} />;

/** A bike standing or rolling on uneven ground (a sidewalk, a kerb): both tyres on the surface `g(x, z)`.
 *  Returns the origin height and the pitch for Bike6 (positive = nose down). */
export const bikeOn = (g: (x: number, z: number) => number, x: number, z: number, yaw: number) => {
  const fx = Math.sin(yaw), fz = Math.cos(yaw), RZ = -0.24, FZ = 0.78;
  const yr = g(x + fx * RZ, z + fz * RZ), yf = g(x + fx * FZ, z + fz * FZ);
  return { y: yr + (yf - yr) * (-RZ / (FZ - RZ)), pitch: Math.atan2(yr - yf, FZ - RZ) };
};

// ─── the bicycle ──────────────────────────────────────────────────────────────────────────────────────────────
// An upright city bike sized to this rig: origin on the ground under the rider's hip; saddle at z ≈ 0.
const BB: V3 = [0, 0.27, 0.18], RA: V3 = [0, 0.31, -0.24], FA: V3 = [0, 0.31, 0.78];
const WR = 0.31, CR = 0.16;
const HT: V3 = [0, 0.74, 0.6], HB: V3 = [0, 0.58, 0.66], STT: V3 = [0, 0.6, -0.04];
const GRIP_Y = 0.91, GRIP_Z = 0.56, GRIP_X = 0.27;
const pedal = (side: 1 | -1, c: number): V3 => { const a = side === -1 ? c : c + Math.PI; return [side * 0.115, BB[1] - CR * Math.cos(a), BB[2] - CR * Math.sin(a)]; };  // c increasing = pedalling forward (c 0: right pedal at the bottom)
export const BIKE6 = {
  saddle: [0, 0.705, -0.02] as V3, gripL: [GRIP_X, GRIP_Y, GRIP_Z] as V3, gripR: [-GRIP_X, GRIP_Y, GRIP_Z] as V3,
  crankC: BB, crankR: CR, frontAxle: FA, rearAxle: RA, wheelR: WR,
  pedalL: (c: number) => pedal(1, c), pedalR: (c: number) => pedal(-1, c),
};
/** Hip height on the saddle; the Person3D root goes at RIDER6 (bike-local) with riderPose's bob (−0.2). */
const HIP_Y = 0.82, RB = -0.2;   // seated bob ≤ −0.15 so long coats drape as seated
export const RIDER6: V3 = [0, HIP_Y - 0.8 - RB, 0];

const Wheel6: React.FC<{ p: V3; spin: number }> = ({ p, spin }) => (
  <group position={p} rotation={[spin, 0, 0]}>
    <mesh rotation={[0, Math.PI / 2, 0]} material={toon("#18181C")} castShadow><torusGeometry args={[WR - 0.02, 0.022, 10, 40]} /></mesh>
    <mesh rotation={[0, Math.PI / 2, 0]} material={toon("#B9BCC4")}><torusGeometry args={[WR - 0.045, 0.008, 6, 40]} /></mesh>
    {Array.from({ length: 16 }, (_, k) => <mesh key={k} rotation={[(k * Math.PI) / 16, 0, 0]} material={toon("#C9CCD2")}><cylinderGeometry args={[0.0025, 0.0025, 2 * (WR - 0.05), 4]} /></mesh>)}
    <mesh rotation={[0, 0, Math.PI / 2]} material={toon("#8E9198")}><cylinderGeometry args={[0.022, 0.022, 0.1, 10]} /></mesh>
  </group>
);
export const Bike6: React.FC<{ p: V3; yaw?: number; spin?: number; roll?: number; steer?: number; crank?: number; col?: string; pitch?: number }> = ({ p, yaw = 0, spin = 0, roll = 0, steer = 0, crank = 0, col = "#1E1E24", pitch = 0 }) => {
  const chainTop = BB[1] + 0.1, cogTop = RA[1] + 0.04;
  return (
    <group position={p} rotation={[0, yaw, roll]}><group rotation={[pitch, 0, 0]}>
      <Wheel6 p={RA} spin={spin} />
      {/* frame: seat tube, top tube, down tube, head tube, chain and seat stays (pairs) */}
      <Tube a={BB} b={STT} r={0.019} c={col} />
      <Tube a={[0, 0.585, -0.03]} b={[0, 0.69, 0.6]} r={0.018} c={col} />
      <Tube a={BB} b={HB} r={0.022} c={col} />
      <Tube a={HB} b={HT} r={0.024} c={col} />
      {[-1, 1].map((k) => <group key={k}>
        <Tube a={[k * 0.012, BB[1], BB[2]]} b={[k * 0.055, RA[1], RA[2]]} r={0.011} c={col} />
        <Tube a={[k * 0.012, 0.575, -0.035]} b={[k * 0.055, RA[1], RA[2]]} r={0.01} c={col} />
      </group>)}
      {/* rear rack and fender */}
      <mesh position={RA} rotation={[0, Math.PI / 2, 0]} material={toon(col)}><torusGeometry args={[WR + 0.03, 0.012, 6, 24, Math.PI * 0.75]} /></mesh>
      {/* seat post and saddle */}
      <Tube a={STT} b={[0, 0.68, -0.025]} r={0.012} c="#A8ABB2" />
      <mesh position={[0, 0.693, -0.03]} scale={[0.085, 0.022, 0.15]} material={toon("#1A1A1E")} castShadow><sphereGeometry args={[1, 16, 10]} /></mesh>
      <mesh position={[0, 0.695, 0.08]} scale={[0.03, 0.016, 0.07]} material={toon("#1A1A1E")}><sphereGeometry args={[1, 10, 8]} /></mesh>
      {/* drivetrain: chainring on the right (−x), crank arms, pedals, chain, rear cog */}
      <group position={[-0.055, BB[1], BB[2]]}>
        <mesh rotation={[0, Math.PI / 2, 0]} material={toon("#9A9CA4")}><torusGeometry args={[0.095, 0.01, 6, 28]} /></mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={toon("#6E7078")}><cylinderGeometry args={[0.03, 0.03, 0.012, 14]} /></mesh>
      </group>
      <mesh position={[-0.055, RA[1], RA[2]]} rotation={[0, Math.PI / 2, 0]} material={toon("#6E7078")}><torusGeometry args={[0.04, 0.008, 6, 18]} /></mesh>
      <Tube a={[-0.055, chainTop, BB[2]]} b={[-0.055, cogTop, RA[2]]} r={0.005} c="#3A3C42" seg={5} />
      <Tube a={[-0.055, BB[1] - 0.1, BB[2]]} b={[-0.055, RA[1] - 0.04, RA[2]]} r={0.005} c="#3A3C42" seg={5} />
      <mesh position={BB} rotation={[0, 0, Math.PI / 2]} material={toon("#6E7078")}><cylinderGeometry args={[0.025, 0.025, 0.12, 10]} /></mesh>
      {([-1, 1] as const).map((sd) => { const pd = pedal(sd, crank); return <group key={sd}>
        <Tube a={[sd * 0.07, BB[1], BB[2]]} b={[sd * 0.075, pd[1], pd[2]]} r={0.011} c="#8A8D94" />
        <B p={[sd * 0.115, pd[1], pd[2]]} s={[0.08, 0.018, 0.1]} c="#2A2A30" />
      </group>; })}
      {/* front end: fork, steerer, stem, riser bar with grips and brake levers, light, fender, front wheel; turns with steer */}
      <group position={[0, HB[1], HB[2]]} rotation={[0, steer, 0]}>
        <group position={[0, -HB[1], -HB[2]]}>
          {[-1, 1].map((k) => <Tube key={k} a={[k * 0.04, HB[1] - 0.02, HB[2]]} b={[k * 0.055, FA[1], FA[2]]} r={0.012} c={col} />)}
          <B p={[0, HB[1] - 0.02, HB[2]]} s={[0.11, 0.03, 0.05]} c={col} />
          <Wheel6 p={FA} spin={spin} />
          <mesh position={FA} rotation={[0, Math.PI / 2, Math.PI * 0.05]} material={toon(col)}><torusGeometry args={[WR + 0.03, 0.012, 6, 24, Math.PI * 0.6]} /></mesh>
          <Tube a={HT} b={[0, 0.84, 0.59]} r={0.016} c="#A8ABB2" />
          <Tube a={[0, 0.84, 0.59]} b={[0, 0.87, 0.63]} r={0.017} c="#A8ABB2" />
          <Tube a={[-0.2, 0.87, 0.62]} b={[0.2, 0.87, 0.62]} r={0.012} c="#2A2C32" />
          {[-1, 1].map((k) => <group key={k}>
            <Tube a={[k * 0.2, 0.87, 0.62]} b={[k * (GRIP_X - 0.04), GRIP_Y, GRIP_Z + 0.01]} r={0.012} c="#2A2C32" />
            <Tube a={[k * (GRIP_X - 0.045), GRIP_Y, GRIP_Z + 0.01]} b={[k * (GRIP_X + 0.05), GRIP_Y, GRIP_Z - 0.005]} r={0.019} c="#141416" />
            <Tube a={[k * (GRIP_X - 0.06), GRIP_Y + 0.005, GRIP_Z + 0.02]} b={[k * (GRIP_X + 0.03), GRIP_Y - 0.02, GRIP_Z + 0.09]} r={0.006} c="#B9BCC4" />
          </group>)}
          <B p={[0, 0.75, 0.665]} s={[0.025, 0.02, 0.06]} c="#2A2C32" />
          <mesh position={[0, 0.75, 0.71]} rotation={[Math.PI / 2, 0, 0]} material={toon("#2A2C32")}><cylinderGeometry args={[0.035, 0.03, 0.06, 12]} /></mesh>
          <mesh position={[0, 0.75, 0.741]}><circleGeometry args={[0.028, 14]} />{glow("#FFF4D0", true)}</mesh>
        </group>
      </group>
    </group></group>
  );
};
const RIDE_LEAN = 20;
// target q (vehicle-local) seen from a person whose root is at `root` (vehicle-local) turned by `yaw`
const inFrame = (q: V3, root: V3, yaw = 0): V3 => {
  const dx = q[0] - root[0], dz = q[2] - root[2], c = Math.cos(yaw), s = Math.sin(yaw);
  return [dx * c - dz * s, q[1] - root[1], dx * s + dz * c];
};
const ankleOn = (q: V3): V3 => [q[0], q[1] + 0.065, q[2] - 0.03];   // the ankle sits just above and behind a pedal
/** Seated, hands on the grips, feet on the pedals at crank angle `crank` (footDown 1: the left foot to the ground). Root at RIDER6. */
export const riderPose = (crank: number, footDown = 0): Pose3 => {
  const base: Pose3 = { ...STAND, lean: RIDE_LEAN, headNod: -12, bob: RB };
  const me = (q: V3) => inFrame(q, RIDER6);
  const armL = reachArm(base, 1, me(BIKE6.gripL)), armR = reachArm(base, -1, me(BIKE6.gripR));
  const lR = reachLeg(RB, me(ankleOn(pedal(-1, crank))));
  const fd = sm(footDown), onPedalL = reachLeg(RB, me(ankleOn(pedal(1, crank)))), downL = reachLeg(RB, me([0.1, 0.075, 0.12]));
  const legL: [number, number] = [lerp(onPedalL[0], downL[0], fd), lerp(onPedalL[1], downL[1], fd)];
  return { ...base, armL, armR, handL: "grip", handR: "grip", wristL: [-10, 0], wristR: [-10, 0], legL, legR: lR };
};
/** Getting on from the bike's left: u 0→0.3 walking up beside it, left hand to the left grip, right hand to the saddle;
 * 0.3→0.55 the right knee lifts over the low top tube as the body turns toward the bike, both hands on the bars;
 * 0.55→0.8 straddling, then up and back onto the saddle; 0.8→1 feet to the pedals. offset and yaw are bike-local. */
export const mountPose = (u: number): { pose: Pose3; offset: V3; yaw: number } => {
  const crank = 0.6;
  if (u < 0.3) {
    const k = sm(u / 0.3), root: V3 = [0.4 - 0.08 * k, 0, 0.12 + 0.12 * k], base: Pose3 = { ...STAND, lean: 10 * k, bob: 0 };
    const armL = reachArm(base, 1, inFrame(BIKE6.gripL, root)), armR = reachArm(base, -1, inFrame([0.0, 0.73, -0.02], root));
    const relax = STAND.armL as number[];
    const mixA = (a: number[]) => [lerp(relax[0], a[0], k), lerp(relax[1], a[1], k), lerp(relax[2], a[2], k), 0] as [number, number, number, number];
    return { pose: { ...base, armL: mixA(armL), armR: mixA(armR), handL: k > 0.7 ? "grip" : "relaxed", handR: k > 0.7 ? "flat" : "relaxed", headNod: 8 }, offset: root, yaw: 0 };
  }
  if (u < 0.55) {
    const k = (u - 0.3) / 0.25, arc = Math.sin(k * Math.PI), root: V3 = [lerp(0.32, 0.0, sm(k)), 0, lerp(0.24, 0.18, k)], yaw = -0.55 * arc;
    const base: Pose3 = { ...STAND, lean: 10 + 8 * arc, bob: -0.04 * arc };
    const armL = reachArm(base, 1, inFrame(BIKE6.gripL, root, yaw));
    const armR = reachArm(base, -1, inFrame(k < 0.5 ? [0.0, 0.73, -0.02] : BIKE6.gripR, root, yaw));
    return { pose: { ...base, armL, armR, handL: "grip", handR: k < 0.5 ? "flat" : "grip", legR: [8 * k + 98 * arc, 110 * arc], legL: [2, 6 * arc], headNod: 10 }, offset: root, yaw };
  }
  if (u < 0.8) {
    const k = sm((u - 0.55) / 0.25), root: V3 = [0, lerp(0, RIDER6[1], k), lerp(0.18, 0, k)], bob = lerp(0, RB, k);
    const base: Pose3 = { ...STAND, lean: lerp(10, RIDE_LEAN, k), bob };
    const armL = reachArm(base, 1, inFrame(BIKE6.gripL, root)), armR = reachArm(base, -1, inFrame(BIKE6.gripR, root));
    const lL = reachLeg(bob, inFrame([0.095, 0.075, 0.24], root)), gR = reachLeg(bob, inFrame([-0.095, 0.075, 0.24], root)), pR = reachLeg(bob, inFrame(ankleOn(pedal(-1, crank)), root));
    return { pose: { ...base, armL, armR, handL: "grip", handR: "grip", legL: lL, legR: [lerp(gR[0], pR[0], k), lerp(gR[1], pR[1], k)], headNod: lerp(6, -12, k) }, offset: root, yaw: 0 };
  }
  const k = sm((u - 0.8) / 0.2);
  return { pose: riderPose(crank, 1 - k), offset: RIDER6, yaw: 0 };
};

// ─── the sedan ────────────────────────────────────────────────────────────────────────────────────────────────
// A compact four-door, left-hand drive (US): the driver sits on the car's left (+x). Body built from panels so the
// cabin is hollow: through the glass you see seats, dash, wheel and the people in them.
const W2 = 0.9, SILL = 0.3, BELT = 0.97, ROOF = 1.64, FWS = 0.98, RWS = -1.3, ROOF_F = 0.42, ROOF_R = -0.8;
const FRONT_DOOR: [number, number] = [-0.38, 0.95], REAR_DOOR: [number, number] = [-0.9, -0.4];
const AXF = 1.48, AXR = -1.3, ARCH = 0.4, NOSE = 2.32, TAIL = -2.3;
const HIP_DRV: V3 = [0.38, 0.52, 0.08];
const SEATED_BOB = -0.38;
const root = (h: V3): V3 => [h[0], h[1] - 0.8 - SEATED_BOB, h[2]];
const WHEEL_C: V3 = [0.38, 0.92, 0.56];
const WHEEL_R = 0.19, WHEEL_TILT = D(62); // the rim's plane: tilted back 28° from vertical
export const CAR6 = {
  length: 4.6, width: 1.8, height: ROOF + 0.02,
  driverHip: HIP_DRV, passHip: [-0.38, 0.52, 0.08] as V3, rearHipL: [0.4, 0.52, -0.82] as V3, rearHipR: [-0.4, 0.52, -0.82] as V3,
  driverRoot: root(HIP_DRV), passRoot: root([-0.38, 0.52, 0.08]), rearRootL: root([0.4, 0.52, -0.82]), rearRootR: root([-0.4, 0.52, -0.82]),
  wheel: WHEEL_C, wheelR: WHEEL_R,
  doorFL: [W2, 0, FRONT_DOOR[1]] as V3, doorFR: [-W2, 0, FRONT_DOOR[1]] as V3,   // hinge points (front edge of each front door)
  axleF: AXF, axleR: AXR, tyreR: 0.33,
};
/** Car-local → world, for placing people or cameras relative to a car at p with yaw. */
export const carToWorld = (p: V3, yaw: number, q: V3): V3 => [p[0] + q[0] * Math.cos(yaw) + q[2] * Math.sin(yaw), p[1] + q[1], p[2] - q[0] * Math.sin(yaw) + q[2] * Math.cos(yaw)];

const CarWheel: React.FC<{ p: V3; spin: number; steer?: number }> = ({ p, spin, steer = 0 }) => (
  <group position={p} rotation={[0, steer, 0]}><group rotation={[spin, 0, 0]}>
    <mesh rotation={[0, 0, Math.PI / 2]} material={toon("#141416")} castShadow><cylinderGeometry args={[0.33, 0.33, 0.22, 26]} /></mesh>
    {[-1, 1].map((k) => <group key={k}>
      <mesh position={[k * 0.112, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={toon("#B9BDC6")}><cylinderGeometry args={[0.2, 0.2, 0.01, 22]} /></mesh>
      {[0, 1, 2, 3, 4].map((s) => <mesh key={s} position={[k * 0.118, 0, 0]} rotation={[(s * 2 * Math.PI) / 5, 0, 0]} material={toon("#8E929B")}><boxGeometry args={[0.012, 0.36, 0.04]} /></mesh>)}
      <mesh position={[k * 0.122, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={toon("#5E626B")}><cylinderGeometry args={[0.05, 0.05, 0.012, 12]} /></mesh>
    </group>)}
  </group></group>
);
const Seat: React.FC<{ p: V3; w?: number }> = ({ p, w = 0.5 }) => (
  <group position={p}>
    <B p={[0, 0.34, 0.04]} s={[w, 0.12, 0.5]} c="#3A3D46" />
    <B p={[0, 0.72, -0.26]} s={[w, 0.66, 0.12]} c="#3A3D46" r={[D(-14), 0, 0]} />
    {w < 0.8 && <B p={[0, 1.13, -0.36]} s={[w * 0.55, 0.18, 0.1]} c="#33363E" r={[D(-10), 0, 0]} />}
    {w < 0.8 && <B p={[0, 0.14, 0.04]} s={[w * 0.6, 0.28, 0.4]} c="#26282E" />}
  </group>
);
/** A door's glass: a quad in the door plane from zr (rear) to zf (front) at the belt, the front edge leaning back by `slant` at the top. */
const Pane: React.FC<{ side: 1 | -1; zr: number; zf: number; slant: number }> = ({ side, zr, zf, slant }) => {
  const geo = useMemo(() => {
    const x = -side * 0.04, y0 = BELT + 0.02, y1 = ROOF - 0.08, g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([x, y0, zr, x, y0, zf, x, y1, zf - slant, x, y0, zr, x, y1, zf - slant, x, y1, zr], 3));
    g.computeVertexNormals(); return g;
  }, [side, zr, zf, slant]);
  return <mesh geometry={geo} material={glass} />;
};
/** A shattered door window (Car6 `broken`): only a jagged rim of glass left in the frame, crazed into little cubes. */
const Shatter: React.FC<{ side: 1 | -1; zr: number; zf: number; slant: number; seed: number }> = ({ side, zr, zf, slant, seed }) => {
  const geo = useMemo(() => {
    const y0 = BELT + 0.02, y1 = ROOF - 0.08, r = (k: number) => { const x = Math.sin((k + seed * 17.3) * 127.1) * 43758.5453; return x - Math.floor(x); };
    const corners: [number, number][] = [[zr, y0], [zf, y0], [zf - slant, y1], [zr, y1]];
    const outer = new THREE.Shape(corners.map(([u, v]) => new THREE.Vector2(u, v)));
    // the hole: walk the frame inset by a jagged, random depth (deep spikes where a big piece stayed in)
    const cu = (zr + zf - slant / 2) / 2, cv = (y0 + y1) / 2, pts: THREE.Vector2[] = [];
    for (let e = 0; e < 4; e++) {
      const [a, b] = [corners[e], corners[(e + 1) % 4]], n = 9;
      for (let i = 0; i < n; i++) {
        const u = i / n, px = a[0] + (b[0] - a[0]) * u, py = a[1] + (b[1] - a[1]) * u, k = e * 31 + i;
        const depth = 0.025 + 0.05 * r(k) + (r(k + 7) > 0.82 ? 0.12 * r(k + 3) : 0);
        const dx = cu - px, dy = cv - py, dl = Math.hypot(dx, dy) || 1;
        pts.push(new THREE.Vector2(px + (dx / dl) * depth, py + (dy / dl) * depth));
      }
    }
    outer.holes.push(new THREE.Path(pts.reverse()));
    return new THREE.ShapeGeometry(outer);
  }, [zr, zf, slant, seed]);
  return <mesh geometry={geo} position={[-side * 0.04, 0, 0]} rotation={[0, -Math.PI / 2, 0]} material={crazed} />;
};
const crazed = new THREE.MeshStandardMaterial({ color: "#D6E8F2", emissive: "#6E8CA0", emissiveIntensity: 0.25, transparent: true, opacity: 0.55, roughness: 0.15, metalness: 0.5, depthWrite: false, side: THREE.DoubleSide });
/** Cracked laminated glass (windshield, rear window in a crash): a web of cracks from an impact point, on a canvas. */
const crackTex = (seed: number) => {
  const c = document.createElement("canvas"); c.width = 512; c.height = 256; const g = c.getContext("2d")!;
  const r = (k: number) => { const x = Math.sin((k + seed * 13.7) * 127.1) * 43758.5453; return x - Math.floor(x); };
  const ox = 160 + 200 * r(1), oy = 70 + 110 * r(2);
  g.strokeStyle = "rgba(235,245,255,0.85)"; g.lineWidth = 1.6;
  for (let k = 0; k < 22; k++) {   // radial cracks, kinked
    let x = ox, y = oy; const a0 = (k / 22) * Math.PI * 2 + r(k + 5) * 0.3; g.beginPath(); g.moveTo(x, y);
    for (let j = 0; j < 7; j++) { const a = a0 + (r(k * 7 + j) - 0.5) * 0.5, l = 18 + 40 * r(k * 3 + j + 9); x += Math.cos(a) * l; y += Math.sin(a) * l; g.lineTo(x, y); }
    g.stroke();
  }
  for (let ring = 1; ring < 6; ring++) {   // concentric rings
    g.beginPath(); for (let k = 0; k <= 22; k++) { const a = (k / 22) * Math.PI * 2, rr = ring * (14 + 8 * r(ring * 5 + k)); const x = ox + Math.cos(a) * rr, y = oy + Math.sin(a) * rr; if (k) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
  }
  g.fillStyle = "rgba(230,240,255,0.55)"; g.beginPath(); g.arc(ox, oy, 12, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const Cracks: React.FC<{ seed: number; w: number; h: number }> = ({ seed, w, h }) => {
  const map = useMemo(() => crackTex(seed), [seed]);
  return <mesh position={[0, 0, 0.004]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={map} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>;
};
/** One door: hinged at its front edge, swinging outward by `open` (0 shut … 1 ≈ 68°). side 1 = car's left. */
const Door: React.FC<{ side: 1 | -1; z0: number; z1: number; open: number; col: string; front: boolean; broken?: boolean }> = ({ side, z0, z1, open, col, front, broken }) => {
  const len = z1 - z0, ang = -side * D(68) * clamp(open, 0, 1);
  return (
    <group position={[side * W2, 0, z1]} rotation={[0, ang, 0]}>
      <group position={[0, 0, -len / 2]}>
        <B p={[-side * 0.03, (SILL + BELT) / 2, 0]} s={[0.06, BELT - SILL, len - 0.01]} c={col} />
        <B p={[-side * 0.07, (SILL + BELT) / 2 + 0.03, 0]} s={[0.02, BELT - SILL - 0.12, len - 0.08]} c="#4A4D56" />
        <B p={[-side * 0.1, BELT - 0.16, 0]} s={[0.06, 0.04, len * 0.6]} c="#3A3D46" />
        {/* the window in its frame (the front door's leading edge follows the A-pillar) */}
        {broken ? <Shatter side={side} zr={-len / 2 + 0.02} zf={len / 2 - 0.02} slant={front ? 0.53 : 0} seed={side + (front ? 3 : 7)} /> : <Pane side={side} zr={-len / 2 + 0.02} zf={len / 2 - 0.02} slant={front ? 0.53 : 0} />}
        <B p={[-side * 0.04, ROOF - 0.07, -(front ? 0.53 : 0) / 2]} s={[0.035, 0.035, len - 0.04 - (front ? 0.53 : 0)]} c="#1E2026" />
        <B p={[-side * 0.04, BELT + 0.01, 0]} s={[0.05, 0.025, len - 0.02]} c="#1E2026" />
        <B p={[-side * 0.04, (BELT + ROOF - 0.07) / 2, -len / 2 + 0.02]} s={[0.035, ROOF - 0.07 - BELT, 0.035]} c="#1E2026" />
        <Tube a={[-side * 0.04, BELT, len / 2 - 0.02]} b={[-side * 0.04, ROOF - 0.07, len / 2 - 0.02 - (front ? 0.53 : 0)]} r={0.018} c="#1E2026" />
        <B p={[side * 0.005, BELT - 0.12, 0]} s={[0.012, 0.018, len - 0.02]} c="#C9CCD2" />
        {/* handle and seam line */}
        <B p={[side * 0.005, BELT - 0.09, -len / 2 + 0.16]} s={[0.025, 0.035, 0.14]} c="#C9CCD2" />
        <B p={[side * 0.002, (SILL + BELT) / 2, -len / 2 + 0.003]} s={[0.012, BELT - SILL, 0.008]} c="#1E2026" />
        {front && <group position={[side * 0.08, BELT + 0.04, len / 2 - 0.12]}>
          <B p={[side * 0.04, 0, 0]} s={[0.1, 0.03, 0.04]} c={col} />
          <B p={[side * 0.11, 0.03, 0]} s={[0.05, 0.1, 0.16]} c={col} />
          <B p={[side * 0.11, 0.03, -0.085]} s={[0.04, 0.085, 0.01]} c="#9EB2C4" />
        </group>}
      </group>
    </group>
  );
};
/** A side panel from z0 to z1 (side k), from the sill to `top`, with a wheel-arch opening around `az` if it falls inside. */
const Side: React.FC<{ k: 1 | -1; z0: number; z1: number; top: number; az?: number; col: string }> = ({ k, z0, z1, top, az, col }) => {
  const x = k * (W2 - 0.03), y0 = SILL - 0.06, h = top - y0, ay = 0.33 + ARCH - 0.02;
  if (az === undefined || az + ARCH < z0 || az - ARCH > z1) return <B p={[x, y0 + h / 2, (z0 + z1) / 2]} s={[0.06, h, z1 - z0]} c={col} />;
  const a0 = Math.max(z0, az - ARCH), a1 = Math.min(z1, az + ARCH);
  return (<>
    {a0 > z0 && <B p={[x, y0 + h / 2, (z0 + a0) / 2]} s={[0.06, h, a0 - z0]} c={col} />}
    {a1 < z1 && <B p={[x, y0 + h / 2, (a1 + z1) / 2]} s={[0.06, h, z1 - a1]} c={col} />}
    <B p={[x, (ay + top) / 2, (a0 + a1) / 2]} s={[0.06, top - ay, a1 - a0]} c={col} />
    {/* the arch's lip and dark liner */}
    <mesh position={[x, 0.33, az]} rotation={[0, Math.PI / 2, 0]} material={toon(col)}><torusGeometry args={[ARCH, 0.03, 8, 24, Math.PI]} /></mesh>
    <mesh position={[k * (W2 - 0.12), 0.33, az]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[ARCH - 0.01, ARCH - 0.01, 0.2, 20, 1, true, 0, Math.PI]} /><meshToonMaterial color="#121316" side={THREE.DoubleSide} /></mesh>
  </>);
};
/** broken: after a crash, the door windows shattered (a jagged rim left in each frame), the quarter glass gone, the
 *  windshield and rear window crazed with a web of cracks. */
export const Car6: React.FC<{ p: V3; yaw?: number; col?: string; doors?: { fl?: number; fr?: number; rl?: number; rr?: number }; spin?: number; steer?: number; lights?: boolean; brake?: boolean; wheelTurn?: number; broken?: boolean }> =
  ({ p, yaw = 0, col = "#3D5A80", doors = {}, spin = 0, steer = 0, lights = false, brake = false, wheelTurn, broken = false }) => {
  const dark = "#1E2026", trim = "#2A2C32", IN = W2 - 0.24;   // IN: half-width of the engine bay / trunk core (clears the wheels)
  const sw = wheelTurn ?? steer * 6;      // steering wheel turn (rad), follows the road wheels unless given
  const hoodY = 0.86, trunkY = 0.95;
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      {/* underbody, floor */}
      <B p={[0, 0.25, 0]} s={[1.5, 0.06, 4.4]} c="#24262C" />
      <B p={[0, SILL - 0.02, (FRONT_DOOR[1] + REAR_DOOR[0]) / 2]} s={[1.74, 0.04, FRONT_DOOR[1] - REAR_DOOR[0]]} c="#2E3038" />
      {/* front clip: core, fenders with arches, hood, bumper, grille, lights, plate */}
      <B p={[0, (0.3 + hoodY) / 2, (FWS + NOSE) / 2]} s={[2 * IN, hoodY - 0.3, NOSE - FWS]} c={col} />
      {[-1, 1].map((k) => <Side key={`f${k}`} k={k as 1 | -1} z0={FRONT_DOOR[1]} z1={NOSE - 0.04} top={hoodY} az={AXF} col={col} />)}
      <B p={[0, hoodY + 0.02, (FWS + NOSE) / 2 - 0.02]} s={[1.76, 0.05, NOSE - FWS]} c={col} r={[D(3), 0, 0]} />
      <B p={[0, 0.4, NOSE - 0.02]} s={[1.86, 0.22, 0.12]} c={trim} />
      <B p={[0, 0.64, NOSE + 0.005]} s={[0.9, 0.18, 0.02]} c="#15171C" />
      {[0, 1, 2].map((k) => <B key={k} p={[0, 0.58 + k * 0.05, NOSE + 0.018]} s={[0.86, 0.012, 0.01]} c="#4A4D56" />)}
      {[-1, 1].map((k) => <mesh key={k} position={[k * 0.68, 0.72, NOSE + 0.005]}><boxGeometry args={[0.3, 0.12, 0.03]} />{glow("#FFF6DA", lights)}</mesh>)}
      {lights && [-1, 1].map((k) => <pointLight key={k} position={[k * 0.68, 0.72, NOSE + 0.3]} color="#FFF0C8" intensity={3} distance={8} />)}
      <B p={[0, 0.4, NOSE + 0.045]} s={[0.36, 0.12, 0.012]} c="#F2F2EE" />
      {/* cabin sides: the pillar strip between the doors, the rear quarter (with the rear arch) up to the belt line */}
      {[-1, 1].map((k) => <group key={`c${k}`}>
        <B p={[k * (W2 - 0.03), (SILL + BELT) / 2, (FRONT_DOOR[0] + REAR_DOOR[1]) / 2]} s={[0.06, BELT - SILL + 0.06, FRONT_DOOR[0] - REAR_DOOR[1]]} c={col} />
        <Side k={k as 1 | -1} z0={TAIL + 0.04} z1={REAR_DOOR[0]} top={BELT} az={AXR} col={col} />
        <B p={[k * (W2 - 0.005), BELT - 0.12, (FRONT_DOOR[1] + NOSE) / 2 - 0.1]} s={[0.012, 0.018, NOSE - FRONT_DOOR[1] - 0.25]} c="#C9CCD2" />
        <B p={[k * (W2 - 0.005), BELT - 0.12, (TAIL + REAR_DOOR[0]) / 2 + 0.05]} s={[0.012, 0.018, REAR_DOOR[0] - TAIL - 0.2]} c="#C9CCD2" />
        <B p={[k * (W2 - 0.02), SILL - 0.02, (FRONT_DOOR[1] + REAR_DOOR[0]) / 2]} s={[0.06, 0.1, FRONT_DOOR[1] - REAR_DOOR[0]]} c={trim} />
      </group>)}
      {/* rear clip: trunk core and lid, bumper, tail lights, plate */}
      <B p={[0, (0.3 + trunkY) / 2, (RWS + TAIL) / 2]} s={[2 * IN, trunkY - 0.3, RWS - TAIL]} c={col} />
      <B p={[0, trunkY + 0.02, (RWS + TAIL) / 2 - 0.02]} s={[1.76, 0.05, RWS - TAIL]} c={col} />
      <B p={[0, 0.4, TAIL + 0.02]} s={[1.86, 0.22, 0.12]} c={trim} />
      <B p={[0, 0.68, TAIL]} s={[1.74, 0.5, 0.04]} c={col} />
      {[-1, 1].map((k) => <mesh key={k} position={[k * 0.66, 0.78, TAIL - 0.025]}><boxGeometry args={[0.36, 0.12, 0.02]} />{glow("#E0242A", brake || lights)}</mesh>)}
      <B p={[0, 0.64, TAIL - 0.03]} s={[0.36, 0.12, 0.012]} c="#F2F2EE" />
      {/* the doors */}
      <Door side={1} z0={FRONT_DOOR[0]} z1={FRONT_DOOR[1]} open={doors.fl ?? 0} col={col} front broken={broken} />
      <Door side={-1} z0={FRONT_DOOR[0]} z1={FRONT_DOOR[1]} open={doors.fr ?? 0} col={col} front broken={broken} />
      <Door side={1} z0={REAR_DOOR[0]} z1={REAR_DOOR[1]} open={doors.rl ?? 0} col={col} front={false} broken={broken} />
      <Door side={-1} z0={REAR_DOOR[0]} z1={REAR_DOOR[1]} open={doors.rr ?? 0} col={col} front={false} broken={broken} />
      {/* greenhouse: A, B, C pillars, roof with headliner, windshield, rear window, quarter glass */}
      {[-1, 1].map((k) => <group key={`g${k}`}>
        <Tube a={[k * (W2 - 0.06), BELT, FWS]} b={[k * (W2 - 0.1), ROOF - 0.02, ROOF_F]} r={0.035} c={col} />
        <B p={[k * (W2 - 0.06), (BELT + ROOF) / 2, (FRONT_DOOR[0] + REAR_DOOR[1]) / 2]} s={[0.05, ROOF - BELT, FRONT_DOOR[0] - REAR_DOOR[1] + 0.02]} c={col} />
        <Tube a={[k * (W2 - 0.05), BELT, RWS + 0.02]} b={[k * (W2 - 0.1), ROOF - 0.02, ROOF_R]} r={0.05} c={col} />
        {!broken && <mesh position={[k * (W2 - 0.06), (BELT + ROOF) / 2 - 0.06, (REAR_DOOR[0] + RWS) / 2 + 0.06]} rotation={[0, Math.PI / 2, 0]} material={glass}><planeGeometry args={[Math.max(0.05, REAR_DOOR[0] - RWS - 0.25), 0.42]} /></mesh>}
      </group>)}
      <B p={[0, ROOF, (ROOF_F + ROOF_R) / 2]} s={[1.68, 0.05, ROOF_F - ROOF_R + 0.08]} c={col} />
      <B p={[0, ROOF - 0.04, (ROOF_F + ROOF_R) / 2]} s={[1.62, 0.02, ROOF_F - ROOF_R]} c="#D8D4CA" />
      <mesh position={[0, (BELT + ROOF) / 2, (FWS + ROOF_F) / 2]} rotation={[-Math.atan2(FWS - ROOF_F, ROOF - BELT), 0, 0]} material={glass}><planeGeometry args={[1.64, Math.hypot(FWS - ROOF_F, ROOF - BELT)]} />{broken && <Cracks seed={1} w={1.64} h={Math.hypot(FWS - ROOF_F, ROOF - BELT)} />}</mesh>
      <mesh position={[0, (BELT + ROOF) / 2 + 0.01, (RWS + ROOF_R) / 2]} rotation={[Math.atan2(ROOF_R - RWS, ROOF - BELT), 0, 0]} material={glass}><planeGeometry args={[1.62, Math.hypot(ROOF_R - RWS, ROOF - BELT)]} />{broken && <Cracks seed={2} w={1.62} h={Math.hypot(ROOF_R - RWS, ROOF - BELT)} />}</mesh>
      <B p={[0, BELT - 0.01, FWS + 0.02]} s={[1.72, 0.03, 0.06]} c={dark} />
      {[-1, 1].map((k) => <Tube key={`w${k}`} a={[k * 0.15, BELT + 0.01, FWS + 0.03]} b={[k * 0.6, BELT + 0.03, FWS - 0.02]} r={0.008} c={dark} />)}
      {/* interior: dashboard, instrument hood and dials, console, gear lever, seats, rear bench, mirror */}
      <B p={[0, 0.8, FWS - 0.12]} s={[1.66, 0.3, 0.32]} c="#2C2F36" />
      <B p={[0, 0.66, FWS - 0.18]} s={[1.6, 0.14, 0.2]} c="#24262C" />
      <B p={[0.38, 0.97, FWS - 0.18]} s={[0.4, 0.06, 0.14]} c="#1E2026" />
      <mesh position={[0.38, 0.92, FWS - 0.246]}><planeGeometry args={[0.3, 0.1]} />{glow("#7FD6FF", lights)}</mesh>
      <B p={[-0.1, 0.86, FWS - 0.272]} s={[0.24, 0.12, 0.01]} c="#15171C" />
      <B p={[0, 0.5, 0.35]} s={[0.22, 0.22, 0.8]} c="#2A2C32" />
      <Tube a={[0, 0.6, 0.38]} b={[0, 0.74, 0.35]} r={0.012} c="#8E929B" />
      <mesh position={[0, 0.75, 0.345]} material={toon("#1A1A1E")}><sphereGeometry args={[0.03, 10, 8]} /></mesh>
      <Seat p={[0.38, 0, 0.02]} /><Seat p={[-0.38, 0, 0.02]} />
      <Seat p={[0, 0, -0.9]} w={1.5} />
      <B p={[0, ROOF - 0.12, ROOF_F - 0.08]} s={[0.22, 0.06, 0.02]} c="#1E2026" />
      {/* the steering wheel on its column */}
      <Tube a={[WHEEL_C[0], WHEEL_C[1] - 0.06, WHEEL_C[2] + 0.12]} b={[WHEEL_C[0], WHEEL_C[1] - 0.16, WHEEL_C[2] + 0.34]} r={0.03} c="#24262C" />
      <group position={WHEEL_C} rotation={[WHEEL_TILT - Math.PI / 2, 0, 0]}>
        <group rotation={[0, 0, sw]}>
          <mesh material={toon("#141416")} castShadow><torusGeometry args={[WHEEL_R, 0.018, 10, 32]} /></mesh>
          {[Math.PI / 2, -Math.PI / 2, Math.PI].map((a) => <mesh key={a} position={[Math.sin(a) * WHEEL_R / 2, Math.cos(a) * WHEEL_R / 2, 0]} rotation={[0, 0, -a]} material={toon("#2A2C32")}><boxGeometry args={[0.035, WHEEL_R, 0.014]} /></mesh>)}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={toon("#2A2C32")}><cylinderGeometry args={[0.055, 0.055, 0.04, 16]} /></mesh>
        </group>
      </group>
      {/* wheels: front ones steer */}
      {[-1, 1].map((k) => <group key={k}>
        <CarWheel p={[k * 0.78, 0.33, AXF]} spin={spin} steer={steer} />
        <CarWheel p={[k * 0.78, 0.33, AXR]} spin={spin} />
      </group>)}
    </group>
  );
};
// a point on the steering wheel rim at clock angle `a` (rad; 0 = 12 o'clock, + toward the driver's left = 10 o'clock side)
const rimPoint = (a: number): V3 => {
  const lx = Math.sin(a) * WHEEL_R, ly = Math.cos(a) * WHEEL_R;
  const t = WHEEL_TILT - Math.PI / 2; // rotation about x of the rim's plane
  return [WHEEL_C[0] + lx, WHEEL_C[1] + ly * Math.cos(t), WHEEL_C[2] + ly * Math.sin(t)];
};
const DRIVE_BASE: Pose3 = { lean: -6, bob: SEATED_BOB, headNod: 2 };
/** Seated at the wheel: hands at 10 and 2 (turned with the wheel by `steer` rad of wheel turn), feet at the pedals. Root at CAR6.driverRoot. */
export const drivePose = (steer = 0): Pose3 => {
  const r = CAR6.driverRoot, me = (q: V3): V3 => [q[0] - r[0], q[1] - r[1], q[2] - r[2]];
  const armL = reachArm(DRIVE_BASE, 1, me(rimPoint(D(58) + steer))), armR = reachArm(DRIVE_BASE, -1, me(rimPoint(-D(58) + steer)));
  const legL = reachLeg(SEATED_BOB, me([HIP_DRV[0] + 0.095, 0.3, HIP_DRV[2] + 0.62])), legR = reachLeg(SEATED_BOB, me([HIP_DRV[0] - 0.095, 0.3, HIP_DRV[2] + 0.64]));
  return { ...DRIVE_BASE, armL, armR, handL: "grip", handR: "grip", wristL: [-20, 0], wristR: [-20, 0], legL, legR };
};
/** Seated passenger, hands in the lap, feet on the floor. Root at CAR6.passRoot (or a rear root). */
export const passengerPose: Pose3 = (() => {
  const legL = reachLeg(SEATED_BOB, [0.095, 0.3 - 0.13, 0.62]), legR = reachLeg(SEATED_BOB, [-0.095, 0.3 - 0.13, 0.6]);
  return { lean: -4, bob: SEATED_BOB, armL: [38, 10, 62], armR: [38, 10, 62], handL: "relaxed", handR: "relaxed", legL, legR, headNod: 2 };
})();
/** Getting in through the open front door (open the door first: doors.fl / doors.fr = 1). u 0→0.3 standing at the
 * door, turning the back to the seat; 0.3→0.65 ducking and sitting down onto the seat edge, feet still outside;
 * 0.65→1 swinging round to face forward, legs in, hands to the wheel (driver) or the lap. offset/yaw car-local. */
export const enterCar = (u: number, side: "driver" | "passenger"): { offset: V3; yaw: number; pose: Pose3 } => {
  const s = side === "driver" ? 1 : -1, seat = side === "driver" ? CAR6.driverRoot : CAR6.passRoot;
  const outside: V3 = [s * 1.28, 0, seat[2] + 0.08];
  const edge: V3 = [s * 0.72, seat[1], seat[2]];
  if (u < 0.3) {
    const k = sm(u / 0.3);
    return { offset: outside, yaw: lerp(-s * Math.PI / 2 + 0.25 * s, s * Math.PI / 2, k), pose: { ...STAND, headNod: 8 * k, armL: [12, 10, 20], armR: [12, 10, 20] } };
  }
  if (u < 0.65) { // backside first into the seat, head ducked under the roof line
    const k = sm((u - 0.3) / 0.35), duck = Math.sin(k * Math.PI);
    const off = lerp3(outside, edge, k);
    const bob = lerp(0, SEATED_BOB, k);
    // feet stay on the ground just outside the sill (person faces out: local +z = car-local s·x)
    const ankle = (dx: number): V3 => [dx, 0.075 - off[1], 1.18 - s * off[0]];
    const lL = reachLeg(bob, ankle(0.095)), lR = reachLeg(bob, ankle(-0.095));
    return { offset: off, yaw: s * Math.PI / 2, pose: { lean: 8 + 28 * duck, headNod: 14 * duck, bob, armL: [30, 18, 30], armR: [30, 18, 30], legL: lL, legR: lR } };
  }
  const k = sm((u - 0.65) / 0.35);
  const target = side === "driver" ? drivePose(0) : passengerPose;
  const sitOut: Pose3 = { lean: 6, bob: SEATED_BOB, armL: [30, 14, 40], armR: [30, 14, 40], legL: [80, 85], legR: [78, 85], headNod: 4 };
  const mixArm = (a: any, b: any) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k), 0] as [number, number, number, number];
  const mixLeg = (a: [number, number], b: [number, number]) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)] as [number, number];
  return {
    offset: lerp3(edge, seat, k), yaw: lerp(s * Math.PI / 2, 0, k),
    pose: { ...target, lean: lerp(6, target.lean ?? 0, k), armL: mixArm(sitOut.armL, target.armL), armR: mixArm(sitOut.armR, target.armR), legL: mixLeg(sitOut.legL!, target.legL!), legR: mixLeg(sitOut.legR!, target.legR!), handL: k > 0.7 ? target.handL : "relaxed", handR: k > 0.7 ? target.handR : "relaxed" },
  };
};

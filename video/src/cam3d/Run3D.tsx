// A realistic running cycle for the Person3D rig (the user, 2026-10-28: the Ep09 run "is not human-like, not realistic").
// Built from running biomechanics rather than sine waves on the joints:
// - The stance foot is PLANTED. It lands under the body (about 0.18 m ahead of the hip). It rolls from the heel/midfoot to
//   flat, then onto the toes, without slipping (the shoe's sole ellipse rolls on the ground). The hip, knee and foot come from
//   inverse kinematics on that planted foot, so nothing slides: stride length always matches the ground speed.
// - The stance knee flexes to about 40° at mid-stance. Toe-off is followed by a flight phase with both feet off the ground.
// - Swing: the heel comes up toward the butt (knee ~115°), the knee drives forward and up (hip ~50°), the shin swings out,
//   then the leg pulls back so the foot meets the ground nearly at rest under the body.
// - Pelvis: a slight drop on the swing side and some rotation. Torso: ~10° lean, the shoulders counter-rotating.
// - Arms: both pump from the shoulder, opposite to the legs, with the elbows near 90° and loose fists. The hands stay off
//   the midline. The head stays steady, looking ahead. The body bobs ~6 cm, twice per stride.
// Units as Person3D: metres, feet on y = 0, hips at 0.8; the runner faces +z (their left is +x) at yaw 0.
import type { Arm, HandShape, Pose3 } from "./Person3D";

const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const THIGH = 0.39, SHIN = 0.36, HIP_W = 0.095, HIP_Y = 0.8;
// the shoe's sole (Person3D Shoe): an ellipse in the foot's (y, z) plane, centre below and ahead of the ankle
const SOLE_CY = -0.06, SOLE_CZ = 0.04, SOLE_B = 0.012, SOLE_C = 0.122;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const fract = (x: number) => x - Math.floor(x);

export type RunOpts = {
  cadence?: number;        // strides per second (one stride = two steps); default rises gently with speed (1.45 at 5 m/s)
  carry?: "L" | "R";       // that hand grips something (pass the prop to Person3D's propL/propR); it still pumps, a bit less
  phase?: number;          // stride phase offset (0..1) so two runners don't move in step
  lean?: number;           // torso lean (deg), default 11
};
export const runCadence = (speed: number) => clamp(1.2 + 0.05 * speed, 1.25, 1.65);

// ─── the sole rolling on the ground ─────────────────────────────────────────────────────────────────────────────
// For foot pitch φ (+ toes down): the ankle's height over the ground with the lowest sole point touching it, the contact
// point in foot coordinates, and g(φ): how far the ankle sits ahead of a fixed contact once the sole has rolled (no slip).
const soleAt = (phi: number) => {
  const c = Math.cos(phi), s = Math.sin(phi);
  const n = Math.hypot(SOLE_B * c, SOLE_C * s);
  const qy = SOLE_CY - (SOLE_B * SOLE_B * c) / n, qz = SOLE_CZ + (SOLE_C * SOLE_C * s) / n;
  return { h: n - SOLE_CY * c + SOLE_CZ * s, qy, qz, qzw: qy * s + qz * c };
};
const ROLL_MIN = -40, ROLL_STEP = 0.1, ROLL_N = 1101; // pitch table from −40° to 70°
const ROLL_ARC: number[] = (() => {
  const a = [0];
  let prev = soleAt(ROLL_MIN * D2R);
  for (let i = 1; i < ROLL_N; i++) {
    const cur = soleAt((ROLL_MIN + i * ROLL_STEP) * D2R);
    a.push(a[i - 1] + Math.hypot(cur.qy - prev.qy, cur.qz - prev.qz));
    prev = cur;
  }
  return a;
})();
const arcAt = (phiDeg: number) => {
  const x = clamp((phiDeg - ROLL_MIN) / ROLL_STEP, 0, ROLL_N - 1.0001), i = Math.floor(x);
  return ROLL_ARC[i] + (ROLL_ARC[i + 1] - ROLL_ARC[i]) * (x - i);
};
/** Ankle (y, z) for a sole that touched down at pitch phi0 with its ankle at z = 0, after rolling to pitch phi (deg). */
const rolledAnkle = (phi0: number, phi: number) => {
  const s0 = soleAt(phi0 * D2R), s1 = soleAt(phi * D2R);
  return { y: s1.h, z: arcAt(phi) - arcAt(phi0) - s1.qzw + s0.qzw };
};
/** Height of the lowest sole point for an ankle at height y with foot pitch phi (deg). */
export const soleLow = (ankleY: number, phiDeg: number) => ankleY - soleAt(phiDeg * D2R).h;

// ─── a small key-frame spline (cubic Hermite, Catmull-Rom slopes unless given) ─────────────────────────────────────
type Key = [number, number, number?];
const spline = (keys: Key[], u: number) => {
  let i = 0;
  while (i < keys.length - 2 && u > keys[i + 1][0]) i++;
  const slope = (j: number) => {
    const k = keys[j];
    if (k[2] !== undefined) return k[2];
    const a = keys[Math.max(0, j - 1)], b = keys[Math.min(keys.length - 1, j + 1)];
    return (b[1] - a[1]) / (b[0] - a[0]);
  };
  const [u0, v0] = keys[i], [u1, v1] = keys[i + 1], du = u1 - u0;
  const x = clamp((u - u0) / du, 0, 1), x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * v0 + (x3 - 2 * x2 + x) * du * slope(i) + (-2 * x3 + 3 * x2) * v1 + (x3 - x2) * du * slope(i + 1);
};

// ─── the cycle's design numbers ──────────────────────────────────────────────────────────────────────────────────
const C = {
  tdAhead: 0.18,   // ankle ahead of the hip at touchdown (lands under the body)
  footX: 0.05,     // each foot lands 5 cm from the line of travel (a narrow running track, not two rails)
  bob: 0.031,      // root bob amplitude: ±3.1 cm, twice a stride (low at mid-stance, high in flight)
  sway: 0.012,     // the hips sway a little over the stance foot
  hipYaw: 4.5,     // pelvis rotation (deg): the swinging leg's hip comes forward
  hipDrop: 3.5,    // pelvis drop on the swing side during stance (deg)
  twist: 8,        // shoulder counter-rotation (deg)
  phiTD: -6,       // foot pitch at touchdown: toes a little up (midfoot landing)
  phiTO: 56,       // foot pitch at toe-off: rolled onto the toes
  kneeTD: 19, kneeTO: 18, // knee at touchdown and toe-off (solved for: hip height and contact time)
};
/** Foot pitch over the stance (s 0..1): heel/midfoot down → flat → heel rises and the foot rolls onto the toes. */
const stancePhi = (s: number) => spline([[0, C.phiTD, 40], [0.22, 0, 0], [0.42, 0, 0], [1, C.phiTO, 130]], s);

type Geo = { cad: number; duty: number; y0: number; speed: number };
type LegState = { h: number; k: number; ad: number; phi: number };

/** Root (pelvis frame) at stride phase P: lateral sway x, height y (of Person3D's pos), pelvis yaw and roll (deg). */
const rootAt = (g: Geo, P: number) => {
  const step = 2 * P - g.duty; // 0 at the left foot's mid-stance
  return {
    x: C.sway * Math.cos(2 * Math.PI * (P - g.duty / 2)),
    y: g.y0 - C.bob * Math.cos(2 * Math.PI * step),
    yaw: -C.hipYaw * Math.cos(2 * Math.PI * P),
    roll: C.hipDrop * Math.cos(2 * Math.PI * (P - g.duty / 2)),
  };
};

/** Two-bone leg IK: ankle target (runner frame, relative to the root's ground point) → hip flex, knee, adduction. */
const legIK = (side: 1 | -1, root: ReturnType<typeof rootAt>, ax: number, ay: number, az: number) => {
  const py = root.yaw * D2R, pr = root.roll * D2R;
  // hip joint = hip centre + Ry(yaw)·Rz(roll)·(side·w, 0, 0)
  const hx0 = side * HIP_W * Math.cos(pr), hy0 = side * HIP_W * Math.sin(pr);
  const hjx = root.x + hx0 * Math.cos(py), hjy = root.y + HIP_Y + hy0, hjz = -hx0 * Math.sin(py);
  // into the pelvis frame: Rz(−roll)·Ry(−yaw)·(ankle − hip joint)
  const vx = ax - hjx, vy = ay - hjy, vz = az - hjz;
  const x1 = vx * Math.cos(py) - vz * Math.sin(py), z1 = vx * Math.sin(py) + vz * Math.cos(py);
  const dx = x1 * Math.cos(pr) + vy * Math.sin(pr), dy = -x1 * Math.sin(pr) + vy * Math.cos(pr), dz = z1;
  const th = Math.atan2(dx, -dy), down = Math.hypot(dx, dy);
  const L = clamp(Math.hypot(down, dz), Math.abs(THIGH - SHIN) + 1e-4, THIGH + SHIN - 1e-6);
  const knee = Math.PI - Math.acos(clamp((THIGH * THIGH + SHIN * SHIN - L * L) / (2 * THIGH * SHIN), -1, 1));
  const hip = Math.atan2(dz, down) + Math.acos(clamp((THIGH * THIGH + L * L - SHIN * SHIN) / (2 * THIGH * L), -1, 1));
  return { h: hip * R2D, k: knee * R2D, ad: -side * th * R2D, reach: Math.hypot(down, dz) };
};

/** The stance leg at stance fraction s (0 touchdown .. 1 toe-off) of the cycle whose touchdown is at the leg's own phase P0
 *  (the leg's phase runs `off` ahead of the body's: 0 for the left leg, 0.5 for the right). */
const stanceLeg = (g: Geo, side: 1 | -1, P0: number, s: number, off = side === 1 ? 0 : 0.5): LegState & { reach: number } => {
  const phi = stancePhi(s);
  const P = P0 + s * g.duty;
  const travel = ((P - P0) / g.cad) * g.speed; // the root has moved on this far since touchdown
  const roll = rolledAnkle(C.phiTD, phi);
  const root = rootAt(g, P - off);
  const ik = legIK(side, root, side * C.footX, roll.y, C.tdAhead + roll.z - travel);
  return { h: ik.h, k: ik.k, ad: ik.ad, phi, reach: ik.reach };
};

// solve the root height (knee at touchdown) and the contact time (knee at toe-off) for a speed and cadence
const GEO = new Map<string, Geo>();
const geometry = (speed: number, cad: number): Geo => {
  const key = `${speed.toFixed(3)}|${cad.toFixed(3)}`;
  const hit = GEO.get(key);
  if (hit) return hit;
  const g: Geo = { cad, duty: 0.25, y0: 0, speed };
  for (let it = 0; it < 6; it++) {
    let lo = -0.3, hi = 0.2; // y0: higher root → straighter knee at touchdown
    for (let j = 0; j < 40; j++) { g.y0 = (lo + hi) / 2; if (stanceLeg(g, 1, 0, 0).k > C.kneeTD) lo = g.y0; else hi = g.y0; }
    let dlo = 0.05, dhi = 0.6; // duty: longer stance → the foot ends further behind → straighter knee at toe-off
    for (let j = 0; j < 40; j++) { g.duty = (dlo + dhi) / 2; if (stanceLeg(g, 1, 0, 1).k > C.kneeTO) dlo = g.duty; else dhi = g.duty; }
  }
  GEO.set(key, g);
  return g;
};

/** One leg at stride phase P (its own touchdown at P = 0 mod 1). */
const legAt = (g: Geo, side: 1 | -1, P: number): LegState => {
  const p = fract(P), D = g.duty;
  if (p < D) return stanceLeg(g, side, P - p, p / D);
  // swing: from this toe-off to the next touchdown, through the heel recovery and the knee drive
  const P0 = P - p, e = 0.02;
  const to = stanceLeg(g, side, P0, 1), toB = stanceLeg(g, side, P0, 1 - e);
  const td = stanceLeg(g, side, P0 + 1, 0), tdA = stanceLeg(g, side, P0 + 1, e);
  const span = 1 - D, sl = (a: number, b: number) => ((a - b) / (e * D)) * span; // d/du from the stance ends
  const u = (p - D) / span;
  const h = spline([[0, to.h, sl(to.h, toB.h)], [0.3, 4], [0.55, 36], [0.74, 49], [0.9, 41], [1, td.h, sl(tdA.h, td.h)]], u);
  const k = spline([[0, to.k, 0.3 * sl(to.k, toB.k)], [0.2, 80], [0.36, 114], [0.54, 104], [0.74, 58], [0.88, 24], [0.95, td.k - 3], [1, td.k, sl(tdA.k, td.k)]], u);
  const ad = spline([[0, to.ad, sl(to.ad, toB.ad)], [0.5, (to.ad + td.ad) / 2 + 1], [1, td.ad, sl(tdA.ad, td.ad)]], u);
  // the ankle angle (foot against the shin): plantarflexed at toe-off, back to neutral, then a touch of dorsiflexion to land
  const rel = (x: LegState) => x.phi - (x.k - x.h);
  const relDot = (a: LegState, b: LegState) => sl(rel(a), rel(b));
  const ankle = spline([[0, rel(to), 0.3 * relDot(to, toB)], [0.12, rel(to) + 4], [0.4, 2], [0.7, -6], [1, rel(td), relDot(tdA, td)]], u);
  return { h, k, ad, phi: ankle + (k - h) };
};

/** The running pose at time t (s) and ground speed (m/s). Place the body with runRoot (or use runAt). */
export const run = (t: number, speed = 5, o: RunOpts = {}): Pose3 => {
  const cad = o.cadence ?? runCadence(speed), g = geometry(speed, cad);
  const P = t * cad + (o.phase ?? 0);
  const L = legAt(g, 1, P), R = legAt(g, -1, P + 0.5);
  const root = rootAt(g, P);
  const tw = C.twist * Math.cos(2 * Math.PI * (P - 0.03)); // right shoulder forward as the left leg reaches forward
  // arms: opposite to the legs, from the shoulder; hand up to chest height in front, just past the hip behind; elbow
  // closes a little in front and opens a little behind, staying near 90°
  const arm = (side: 1 | -1, carry: boolean): Arm => {
    const c = Math.cos(2 * Math.PI * (P - (side === 1 ? 0.5 : 0) - 0.04)); // +1 = this arm fully forward
    const amp = carry ? 0.8 : 1;
    return [-8 + 46 * amp * c, 8 + 2 * c, 90 + 14 * c + (carry ? 4 : 0), -14 - 6 * c];
  };
  const lean = o.lean ?? 11;
  const hand = (side: "L" | "R"): HandShape | undefined => (o.carry === side ? "grip" : undefined);
  return {
    lean, twist: tw, headTurn: -0.9 * tw, headNod: -0.75 * lean,
    legL: [L.h, L.k], legR: [R.h, R.k], adL: L.ad, adR: R.ad, footL: L.phi, footR: R.phi,
    hips: [root.yaw, root.roll],
    armL: arm(1, o.carry === "L"), armR: arm(-1, o.carry === "R"),
    curl: 0.7, handL: hand("L"), handR: hand("R"),
    wristL: [10, -70], wristR: [10, 70],
    bob: 0,
  };
};

/** Where the body goes (in the runner's own frame): z = distance run, x = sideways sway (+ = their left), y = Person3D's
 *  pos height over flat ground (the bob and the flight). */
export const runRoot = (t: number, speed = 5, o: RunOpts = {}) => {
  const cad = o.cadence ?? runCadence(speed), g = geometry(speed, cad);
  const r = rootAt(g, t * cad + (o.phase ?? 0));
  return { x: r.x, y: r.y, z: speed * t };
};

/** Everything a shot needs: Person3D pos, yaw and pose for a runner who starts at `start` (ground point) facing `yaw` and
 *  runs straight at `speed`. `ground(x, z)` lifts the whole cycle onto uneven ground. */
export const runAt = (t: number, start: [number, number, number], yaw: number, speed = 5, o: RunOpts = {}, ground?: (x: number, z: number) => number) => {
  const r = runRoot(t, speed, o);
  const fx = Math.sin(yaw), fz = Math.cos(yaw), lx = Math.cos(yaw), lz = -Math.sin(yaw);
  const x = start[0] + fx * r.z + lx * r.x, z = start[2] + fz * r.z + lz * r.x;
  return { pos: [x, (ground ? ground(x, z) : start[1]) + r.y, z] as [number, number, number], yaw, pose: run(t, speed, o) };
};

/** The cycle's numbers for a speed (for reports and tests). */
export const runInfo = (speed = 5, cadence?: number) => {
  const cad = cadence ?? runCadence(speed), g = geometry(speed, cad);
  const mid = stanceLeg(g, 1, 0, 0.45);
  return { speed, stridesPerS: cad, stepsPerS: 2 * cad, strideLen: speed / cad, stepLen: speed / cad / 2, contactS: g.duty / cad, flightS: (0.5 - g.duty) / cad, duty: g.duty, rootY: g.y0, bobCm: 2 * C.bob * 100, midStanceKnee: mid.k };
};

/** The footfalls between t0 and t1 (runner frame, like runRoot): when each foot lands, which foot, and where the flat
 *  sole's centre sits (x sideways, z along the run). For footprints in snow, sand or mud. */
export const runFootfalls = (t0: number, t1: number, speed = 5, o: RunOpts = {}) => {
  const cad = o.cadence ?? runCadence(speed), off = o.phase ?? 0;
  const flat = C.tdAhead + rolledAnkle(C.phiTD, 0).z + SOLE_CZ;
  const out: { t: number; side: 1 | -1; x: number; z: number }[] = [];
  for (let n = Math.floor(t0 * cad + off) - 1; n <= Math.ceil(t1 * cad + off) + 1; n++) {
    for (const [side, P] of [[1, n], [-1, n - 0.5]] as [1 | -1, number][]) {
      const t = (P - off) / cad;
      if (t >= t0 && t <= t1) out.push({ t, side, x: side * C.footX, z: speed * t + flat });
    }
  }
  return out.sort((a, b) => a.t - b.t);
};

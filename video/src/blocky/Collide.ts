// Spatial awareness for blocky characters: nothing passes through walls, props or other people; feet stand on the floor
// that is actually under them; hands land ON what they touch, never inside it.
//
// - Every set exports its solid things as colliders (axis-aligned boxes, `box(center, size)` or `boxMinMax`).
// - `groundAt(colliders, x, z)` = the top of whatever is under a point (steps, porches, stages); pass it to walkPath
//   (`ground`) so feet climb steps one by one instead of sinking into a ramp.
// - `rigBoxes(char)` gives the character's parts as world-space boxes, using the SAME skeleton the renderer draws
//   (solveRig + SHOULDER from BlockRig.tsx), so the checks see exactly what is on screen.
// - `clipParts(char, colliders, others)` says which parts are inside something (BlockChar `hits` paints them red in review).
// - `reachArm(char, side, target)` solves the arm so the hand ENDS on a point (a cutting board, a door, a sign).
// - `separate(people)` pushes crowd members apart so they never walk through each other.
import * as THREE from "three";
import type { Pose, Walk } from "./types";
import { SHOULDER, solveRig, splayFor, type RigParts } from "./BlockRig";

export type V3 = [number, number, number];
export type Box = { min: V3; max: V3; name?: string };
/** A box from its centre and full size. */
export const box = (c: V3, s: V3, name?: string): Box => ({ min: [c[0] - s[0] / 2, c[1] - s[1] / 2, c[2] - s[2] / 2], max: [c[0] + s[0] / 2, c[1] + s[1] / 2, c[2] + s[2] / 2], name });
export const boxMinMax = (min: V3, max: V3, name?: string): Box => ({ min, max, name });
/** Move / scale a collider list (a set placed at an offset, or modelled in other units). */
export const shiftBoxes = (bs: Box[], d: V3, k = 1): Box[] =>
  bs.map((b) => ({ name: b.name, min: [b.min[0] * k + d[0], b.min[1] * k + d[1], b.min[2] * k + d[2]], max: [b.max[0] * k + d[0], b.max[1] * k + d[1], b.max[2] * k + d[2]] }));

/** The floor height under (x, z): the highest collider top below `maxY` (default: anything up to a step's height above `fromY`). */
export const groundAt = (cs: Box[], x: number, z: number, fromY = 0, step = 1.2, base = 0) => {
  let g = base;
  for (const b of cs) if (x >= b.min[0] && x <= b.max[0] && z >= b.min[2] && z <= b.max[2] && b.max[1] <= fromY + step && b.max[1] > g) g = b.max[1];
  return g;
};
/** A ground function for walkPath: steps up onto anything at most `step` above the current floor. */
export const groundFn = (cs: Box[], step = 1.2) => (x: number, z: number, fromY = 0) => groundAt(cs, x, z, fromY, step);

// ---------------------------------------------------------------- the character as boxes (forward kinematics)
export type CharState = { position: V3; yaw?: number; scale?: number; pose?: Pose; walk?: Walk };
type PartBox = { part: RigParts; m: THREE.Matrix4; size: V3; center: V3 };
const _o = new THREE.Object3D();
const node = (parent: THREE.Matrix4, pos: V3, rot: V3 = [0, 0, 0], scl: V3 = [1, 1, 1]) => {
  _o.position.set(...pos); _o.rotation.set(rot[0], rot[1], rot[2]); _o.scale.set(...scl); _o.updateMatrix();
  return new THREE.Matrix4().multiplyMatrices(parent, _o.matrix);
};
/** The parts of a character as oriented boxes in world space, mirroring BlockChar's render tree exactly. */
export const rigBoxes = (c: CharState): PartBox[] => {
  const s = c.scale ?? 1, r = solveRig(c.pose, c.walk, 0);
  const root = node(new THREE.Matrix4(), c.position, [0, c.yaw ?? 0, 0], [s, s, s]);
  const body = node(root, [0, r.bob, 0], [0, 0, r.sway]);
  const out: PartBox[] = [];
  const leg = (side: 1 | -1, a: number, part: RigParts) => out.push({ part, m: node(body, [side * 0.5, 2, 0], [-a, 0, 0]), size: [0.99, 2.0, 1.0], center: [0, -1.0, 0.02] });
  leg(1, r.legL, "legL"); leg(-1, r.legR, "legR");
  const upper = node(node(body, [0, 2, 0], [r.lean, r.twist, 0]), [0, -2, 0]);
  out.push({ part: "torso", m: upper, size: [2, 2, 1], center: [0, 3, 0] });
  const arm = (side: 1 | -1, a: number, o: number, part: RigParts) =>
    out.push({ part, m: node(upper, [side * SHOULDER.x, SHOULDER.y, 0], [-a, 0, side * (splayFor(a) + o)]), size: [1, 2, 1], center: [0, -0.5, 0] });
  arm(1, r.armL, r.armLOut, "armL"); arm(-1, r.armR, r.armROut, "armR");
  const head = node(node(upper, [0, 4.56, 0], [0, r.hy, 0]), [0, 0, 0], [r.hp, 0, r.tilt]);
  out.push({ part: "head", m: head, size: [1.16, 1, 1.16], center: [0, 0, 0] });
  return out;
};
/** Sample points on a part box's surface (corners, edge midpoints, face centres) in world space, pulled in by `inset`. */
const samples = (p: PartBox, inset = 0.06) => {
  const pts: THREE.Vector3[] = [];
  const [sx, sy, sz] = p.size.map((v) => v / 2 - inset);
  for (const i of [-1, 0, 1]) for (const j of [-1, 0, 1]) for (const k of [-1, 0, 1]) {
    if (i === 0 && j === 0 && k === 0) continue;
    pts.push(new THREE.Vector3(p.center[0] + i * sx, p.center[1] + j * sy, p.center[2] + k * sz).applyMatrix4(p.m));
  }
  // extra points down long parts (arms and legs are 2 long)
  for (const j of [-0.5, 0.5]) for (const i of [-1, 1]) for (const k of [-1, 1]) pts.push(new THREE.Vector3(p.center[0] + i * sx, p.center[1] + j * sy, p.center[2] + k * sz).applyMatrix4(p.m));
  return pts;
};
const inside = (v: THREE.Vector3, b: Box, eps: number) =>
  v.x > b.min[0] + eps && v.x < b.max[0] - eps && v.y > b.min[1] + eps && v.y < b.max[1] - eps && v.z > b.min[2] + eps && v.z < b.max[2] - eps;

/** World position of a point in an arm's own frame (origin at the shoulder pivot; -y runs down the arm, the hand ends at
 *  y = -1.5; a held prop's +z runs down the arm from HAND.pos). Use it for knife tips, sign tops, pointing fingers. */
export const armPoint = (c: CharState, side: 1 | -1, local: V3): V3 => {
  const p = rigBoxes(c).find((b) => b.part === (side === 1 ? "armL" : "armR"))!;
  const v = new THREE.Vector3(...local).applyMatrix4(p.m);
  return [v.x, v.y, v.z];
};
/**
 * Keep a point on an arm (a knife tip, a fist) at or above a surface height: raises the arm angle just enough (binary
 * search) when the motion would push the point below `surfaceY`. Returns the corrected arm angle.
 */
export const armAboveSurface = (c: CharState, side: 1 | -1, local: V3, surfaceY: number) => {
  const k = side === 1 ? "armL" : "armR", a0 = (c.pose?.[k] as number) ?? 0;
  const y = (a: number) => armPoint({ ...c, pose: { ...c.pose, [k]: a } }, side, local)[1];
  if (y(a0) >= surfaceY) return a0;
  let lo = a0, hi = a0 + 1.5;
  for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (y(m) >= surfaceY) hi = m; else lo = m; }
  return hi;
};

/** World position of a hand's end (the bottom face centre of the fist) for side 1 = left arm, -1 = right arm. */
export const handEnd = (c: CharState, side: 1 | -1): V3 => {
  const p = rigBoxes(c).find((b) => b.part === (side === 1 ? "armL" : "armR"))!;
  const v = new THREE.Vector3(0, -1.5, 0).applyMatrix4(p.m);
  return [v.x, v.y, v.z];
};

/**
 * Which parts of a character are inside a collider or inside another character's body. `tol` (world units) ignores
 * grazing contact. Use it in review (BlockChar `hits={clipParts(...)}`) and in tests over every frame of a shot.
 * `allow` lists collider names a character is meant to touch (its own seat, the board under its hand).
 */
export const clipParts = (c: CharState, cs: Box[], others: CharState[] = [], tol = 0.04, allow: string[] = []) => {
  const s = c.scale ?? 1, hits: Partial<Record<RigParts, boolean>> = {};
  const solids = cs.filter((b) => !b.name || !allow.includes(b.name));
  const withInv = (ps: PartBox[]) => ps.map((p) => ({ p, inv: new THREE.Matrix4().copy(p.m).invert() }));
  const inPart = (v: THREE.Vector3, q: PartBox, inv: THREE.Matrix4, m: number) => {
    const l = v.clone().applyMatrix4(inv);
    return Math.abs(l.x - q.center[0]) < q.size[0] / 2 - m && Math.abs(l.y - q.center[1]) < q.size[1] / 2 - m && Math.abs(l.z - q.center[2]) < q.size[2] / 2 - m;
  };
  const mine = rigBoxes(c), otherBoxes = withInv(others.flatMap((o) => rigBoxes(o)));
  const ownBody = withInv(mine.filter((p) => p.part === "torso" || p.part === "head"));
  for (const p of mine) {
    const pts = samples(p, 0.06);
    let hit = pts.some((v) => solids.some((b) => inside(v, b, tol * s)));
    if (!hit && otherBoxes.length) hit = pts.some((v) => otherBoxes.some(({ p: q, inv }) => inPart(v, q, inv, 0.05)));
    // self: an arm through its own chest or head (crossed arms, hands to the face) — 0.12 deep before it counts
    if (!hit && (p.part === "armL" || p.part === "armR")) hit = pts.some((v) => ownBody.some(({ p: q, inv }) => inPart(v, q, inv, 0.12)));
    if (hit) hits[p.part] = true;
  }
  return hits;
};
/** Feet check: how far the lowest foot is above (+, floating) or below (-, sunk) the floor under it. */
export const footGap = (c: CharState, cs: Box[]) => {
  const legs = rigBoxes(c).filter((p) => p.part === "legL" || p.part === "legR");
  let low = Infinity, gx = 0, gz = 0;
  for (const p of legs) for (const v of samples(p, 0)) if (v.y < low) { low = v.y; gx = v.x; gz = v.z; }
  return low - groundAt(cs, gx, gz, low + 0.3);
};

// ---------------------------------------------------------------- hands on targets
/**
 * Solve one arm (side 1 = left, -1 = right) so the end of the hand lands exactly on `target` (world). Returns the pose
 * fields to add (armX, armXOut) and `short`: how far the hand still is from the target (> 0: out of reach, move the
 * character closer or lean; the arm never stretches). The rest of the pose (lean, twist, walk) is respected.
 */
export const reachArm = (c: CharState, side: 1 | -1, target: V3, iters = 40) => {
  const kA = side === 1 ? "armL" : "armR", kO = side === 1 ? "armLOut" : "armROut";
  let a = (c.pose?.[kA] as number) ?? 1, o = (c.pose?.[kO] as number) ?? 0;
  const err = (aa: number, oo: number) => { const h = handEnd({ ...c, pose: { ...c.pose, [kA]: aa, [kO]: oo } }, side); return Math.hypot(h[0] - target[0], h[1] - target[1], h[2] - target[2]); };
  let e = err(a, o), step = 0.3;
  for (let i = 0; i < iters && step > 1e-4; i++) {
    let moved = false;
    for (const [da, dout] of [[step, 0], [-step, 0], [0, step], [0, -step]] as [number, number][]) {
      const e2 = err(a + da, o + dout);
      if (e2 < e) { a += da; o += dout; e = e2; moved = true; break; }
    }
    if (!moved) step *= 0.5;
  }
  return { pose: { [kA]: a, [kO]: o } as Pose, short: e };
};
/** Where a character must stand (feet position) so its hand at arm angle `armAngle` (straight, no out) ends at `target`. */
export const standToReach = (target: V3, yaw: number, side: 1 | -1, armAngle: number, s = 1, lean = 0, floorY = 0): V3 => {
  const probe = handEnd({ position: [0, floorY, 0], yaw, scale: s, pose: { [side === 1 ? "armL" : "armR"]: armAngle, lean } }, side);
  return [target[0] - probe[0], floorY, target[2] - probe[2]];
};

// ---------------------------------------------------------------- people never overlap
/**
 * Push crowd members apart (radius r each, world units; an adult is ~1.2 wide) so nobody walks through anybody.
 * Deterministic and frame-independent (same input positions → same output), so it never jitters. Also keeps people
 * out of `cs` colliders. Returns new positions in the same order.
 */
export const separate = (ps: V3[], r = 1.3, cs: Box[] = [], iters = 6): V3[] => {
  const q = ps.map((p) => [...p] as V3);
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < q.length; i++) for (let j = i + 1; j < q.length; j++) {
      const dx = q[j][0] - q[i][0], dz = q[j][2] - q[i][2], d = Math.hypot(dx, dz), min = 2 * r;
      if (d < min) {
        const push = (min - d) / 2, nx = d > 1e-6 ? dx / d : 1, nz = d > 1e-6 ? dz / d : 0;
        q[i][0] -= nx * push; q[i][2] -= nz * push; q[j][0] += nx * push; q[j][2] += nz * push;
      }
    }
    for (const p of q) for (const b of cs) { // out of solid boxes that reach above the knees
      if (b.max[1] < p[1] + 1.2 || b.min[1] > p[1] + 4) continue;
      const x0 = b.min[0] - r, x1 = b.max[0] + r, z0 = b.min[2] - r, z1 = b.max[2] + r;
      if (p[0] > x0 && p[0] < x1 && p[2] > z0 && p[2] < z1) {
        const opts = [p[0] - x0, x1 - p[0], p[2] - z0, z1 - p[2]], k = opts.indexOf(Math.min(...opts));
        if (k === 0) p[0] = x0; else if (k === 1) p[0] = x1; else if (k === 2) p[2] = z0; else p[2] = z1;
      }
    }
  }
  return q;
};

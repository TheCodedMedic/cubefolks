// Blocky motion library (notes/cubefolks/FIRST_TASKS.md task 2; docs/CUBEFOLKS_STYLE.md: two shots in three must move).
// Pure functions of time: no React, no frame hooks. Every function takes master time `t` (s) and word-anchored times
// (t0 = at(beat, "word")), never typed seconds in a Short.
//
// How to use in a shot:
//   const a = walkPath(PATH, t, at(3, "walked"), { scale: s });          // position, yaw, walk (feet planted)
//   const pose = mix(idle(t, 2), wave(t, at(3, "waved"), at(3, "me")));  // layered gestures
//   <BlockChar look={X} scale={s} {...act(a, pose)} expr={talk(t, [at(4,"See"), at(4,"you")], "smile")} />
//
// The game's motion is stiff and big: limbs are solid blocks swinging from the shoulder and hip, no elbows or knees,
// gestures are wide readable arcs, turns are quick. Keep it that way: never "subtle".
import type { Expr, Pose, Walk } from "./types";

export type V3 = [number, number, number];
/** What a motion gives a BlockChar: spread it in (`{...act(a, pose)}`). */
export type Act = { position: V3; yaw: number; walk?: Walk; pose?: Pose; seed?: number };

// ---------------------------------------------------------------- basics
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / Math.max(1e-6, b - a));
export const ease = (x: number) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
/** Overshoot ease (snaps past 1 and settles): head snaps, pops. */
export const snap = (x: number, k = 2.4) => { x = clamp01(x); return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const wobble = (t: number, s: number) => Math.sin(t * 1.3 + s) * 0.6 + Math.sin(t * 2.9 + s * 2) * 0.3 + Math.sin(t * 6.1 + s * 3) * 0.1;
/** Shortest signed angle from a to b. */
export const dAng = (a: number, b: number) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
/** Yaw (BlockChar faces +z at yaw 0) that looks from `from` toward `to`. */
export const yawTo = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);

/** 0 before t0, eases up to 1 over `rin`, holds, eases down over `rout` ending at t1 (t1 = Infinity: hold forever). */
export const env = (t: number, t0: number, t1 = Infinity, rin = 0.18, rout = rin) =>
  ease(seg(t, t0, t0 + rin)) * (t1 === Infinity ? 1 : 1 - ease(seg(t, t1 - rout, t1)));

/** Sum pose layers (each field adds; heads add). Use for base pose + idle + gestures. */
export const mix = (...ps: (Pose | undefined | null | false)[]): Pose => {
  const o: Required<Omit<Pose, "head">> & { head: [number, number] } = { armL: 0, armR: 0, armLOut: 0, armROut: 0, legL: 0, legR: 0, lean: 0, tilt: 0, twist: 0, roll: 0, head: [0, 0] };
  for (const p of ps) {
    if (!p) continue;
    for (const k of ["armL", "armR", "armLOut", "armROut", "legL", "legR", "lean", "tilt", "twist", "roll"] as const) o[k] += p[k] ?? 0;
    if (p.head) { o.head[0] += p.head[0]; o.head[1] += p.head[1]; }
  }
  return o;
};
/** Scale a pose layer by k (0..1 envelopes). */
export const scale = (p: Pose, k: number): Pose => ({
  armL: (p.armL ?? 0) * k, armR: (p.armR ?? 0) * k, armLOut: (p.armLOut ?? 0) * k, armROut: (p.armROut ?? 0) * k, legL: (p.legL ?? 0) * k,
  legR: (p.legR ?? 0) * k, lean: (p.lean ?? 0) * k, tilt: (p.tilt ?? 0) * k, twist: (p.twist ?? 0) * k, roll: (p.roll ?? 0) * k,
  head: [(p.head?.[0] ?? 0) * k, (p.head?.[1] ?? 0) * k],
});
/** Mirror a pose left/right (a left-handed wave, a reflection). */
export const flip = (p: Pose): Pose => ({ ...p, armL: p.armR, armR: p.armL, armLOut: p.armROut, armROut: p.armLOut, legL: p.legR, legR: p.legL,
  head: p.head ? [-p.head[0], p.head[1]] : undefined, tilt: p.tilt !== undefined ? -p.tilt : undefined, twist: p.twist !== undefined ? -p.twist : undefined, roll: p.roll !== undefined ? -p.roll : undefined });
/** Merge an Act with extra pose layers (the act's own pose first). */
export const act = (a: Act, ...poses: (Pose | undefined | null | false)[]) => ({ position: a.position, yaw: a.yaw, walk: a.walk, seed: a.seed, pose: mix(a.pose, ...poses) });

// ---------------------------------------------------------------- idle
/**
 * Standing idle: a slow weight shift side to side, the head drifting and now and then glancing aside, arms barely moving.
 * Everyone who isn't doing something else gets this (a still body reads as a frozen game). `seed` de-syncs people.
 * `amount` 0..1 (0.5 for background extras, 1 for the subject).
 */
export const idle = (t: number, seed = 0, amount = 1): Pose => {
  const k = amount, s = seed * 3.7;
  // a glance every ~3-5 s: the head turns ~0.35 rad aside, holds, comes back
  const P = 3.6 + rnd(seed) * 1.6, ph = (t + rnd(seed + 1) * P) % P, dir = rnd(Math.floor((t + rnd(seed + 1) * P) / P) + seed) > 0.5 ? 1 : -1;
  const glance = ease(seg(ph, 0, 0.25)) * (1 - ease(seg(ph, 1.2, 1.5))) * 0.32 * dir;
  return {
    roll: 0.018 * Math.sin(t * 0.9 + s) * k,
    lean: 0.012 * wobble(t * 0.6, s) * k,
    head: [(0.06 * wobble(t * 0.5, s + 1) + glance) * k, 0.025 * wobble(t * 0.7, s + 2) * k],
    tilt: 0.03 * wobble(t * 0.4, s + 3) * k,
    armL: 0.04 * Math.sin(t * 0.9 + s + 1) * k, armR: -0.04 * Math.sin(t * 0.9 + s + 1) * k,
    armLOut: 0.02 * k, armROut: 0.02 * k,
  };
};

// ---------------------------------------------------------------- locomotion
/** Half a stride (one step) in world units for a swing amount: the planted foot sweeps 4 sin(0.75 amount) rig units. */
export const stepLen = (amount: number, s = 1) => 4 * Math.sin(0.75 * amount) * s;
/** Gait presets. speed in rig units/s (× scale). The game's people walk briskly. */
export const GAIT = {
  stroll: { speed: 4.2, amount: 0.75, lean: 0.0, flight: 0 },
  walk: { speed: 5.6, amount: 0.9, lean: 0.02, flight: 0 },
  hurry: { speed: 7.5, amount: 1.05, lean: 0.06, flight: 0.2 },
  run: { speed: 12, amount: 1.2, lean: 0.2, flight: 0.7 },
} as const;
export type Gait = keyof typeof GAIT;
export type PathOpts = {
  /** character scale (BlockChar `scale`): speeds and steps scale with it */
  scale?: number; gait?: Gait; speed?: number;
  /** seconds to reach full speed / to stop */
  accel?: number;
  /** yaw to face before starting and after stopping (default: along the first / last segment) */
  yaw0?: number; yaw1?: number;
  /** seconds to turn from yaw0 into the path before stepping off, and into yaw1 after arriving */
  turnIn?: number; turnOut?: number;
  /** turn smoothing distance at corners (world units) */
  round?: number;
  /** floor height under a point (Collide.ts groundFn(set colliders)): the body steps up onto steps, porches and stages
   *  as the leading foot reaches them, instead of following the path's own y. */
  ground?: (x: number, z: number, fromY?: number) => number;
};
const len2 = (a: V3, b: V3) => Math.hypot(b[0] - a[0], b[2] - a[2], b[1] - a[1]);
export const pathLength = (path: V3[]) => path.slice(1).reduce((s, p, i) => s + len2(path[i], p), 0);
const pointAt = (path: V3[], d: number): V3 => {
  if (d <= 0) return path[0];
  for (let i = 1; i < path.length; i++) {
    const l = len2(path[i - 1], path[i]);
    if (d <= l) { const u = d / l, a = path[i - 1], b = path[i]; return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; }
    d -= l;
  }
  return path[path.length - 1];
};
/** Distance along a trapezoid velocity profile (accel ta, cruise V) for total D, at time u since start; and the speed fraction. */
const profile = (D: number, V: number, ta: number, u: number) => {
  const a = V / ta;
  if (D >= V * ta) {
    const T = ta + D / V; // accel + cruise + decel
    if (u <= 0) return { d: 0, f: 0, T };
    if (u < ta) return { d: 0.5 * a * u * u, f: u / ta, T };
    if (u < T - ta) return { d: 0.5 * V * ta + V * (u - ta), f: 1, T };
    if (u < T) { const r = T - u; return { d: D - 0.5 * a * r * r, f: r / ta, T }; }
    return { d: D, f: 0, T };
  }
  const th = Math.sqrt(D / a), T = 2 * th, vp = a * th;
  if (u <= 0) return { d: 0, f: 0, T };
  if (u < th) return { d: 0.5 * a * u * u, f: (a * u) / V, T };
  if (u < T) { const r = T - u; return { d: D - 0.5 * a * r * r, f: (a * r) / V, T }; }
  void vp; return { d: D, f: 0, T };
};
/** How long a walk along `path` takes (s), including the turn-in, so a shot can plan around it. */
export const walkDuration = (path: V3[], o: PathOpts = {}) => {
  const g = GAIT[o.gait ?? "walk"], s = o.scale ?? 1, V = (o.speed ?? g.speed) * s, ta = o.accel ?? (o.gait === "run" ? 0.35 : 0.22);
  return (o.turnIn ?? 0) + profile(pathLength(path), V, ta, 0).T;
};
/**
 * Walk (or run) along a polyline path starting at t0 (path points are where the FEET go: y = floor height; give steps a
 * rising y). Before t0 the character stands at path[0]; after arriving it stands at the end. Feet stay planted: the leg
 * phase comes from distance travelled. Turns at corners are rounded; the body leans into a run.
 * Returns an Act (+ `moving`, `done` and `u` 0..1 progress).
 */
export const walkPath = (path: V3[], t: number, t0: number, o: PathOpts = {}): Act & { moving: boolean; done: boolean; u: number } => {
  const g = GAIT[o.gait ?? "walk"], s = o.scale ?? 1, V = (o.speed ?? g.speed) * s, ta = o.accel ?? (o.gait === "run" ? 0.35 : 0.22);
  const D = pathLength(path), turnIn = o.turnIn ?? 0, turnOut = o.turnOut ?? 0.3;
  const { d, f, T } = profile(D, V, ta, t - t0 - turnIn);
  const R = o.round ?? 1.4 * s;
  const a = pointAt(path, d - R), b = pointAt(path, d + R);
  const first = yawTo(path[0], path[1] ?? path[0]), last = yawTo(path[path.length - 2] ?? path[0], path[path.length - 1]);
  let yaw = Math.hypot(b[0] - a[0], b[2] - a[2]) > 1e-4 ? Math.atan2(b[0] - a[0], b[2] - a[2]) : first;
  if (d <= 0) yaw = first;
  if (d >= D) yaw = last;
  // turn in place into the path before stepping off, and to yaw1 after arriving
  const tStart = t0, tGo = t0 + turnIn, tEnd = tGo + T;
  if (o.yaw0 !== undefined && t < tGo) yaw = o.yaw0 + dAng(o.yaw0, first) * ease(seg(t, tStart, tGo));
  if (o.yaw1 !== undefined && t > tEnd) yaw = last + dAng(last, o.yaw1) * ease(seg(t, tEnd, tEnd + turnOut));
  const moving = d > 0 && d < D;
  const turning = (o.yaw0 !== undefined && t >= tStart && t < tGo) || (o.yaw1 !== undefined && t > tEnd && t < tEnd + turnOut);
  // swing amount follows speed (sqrt keeps the first/last step visible); phase from distance -> planted feet
  const amt = g.amount * Math.sqrt(clamp01(f));
  const phase = (d / stepLen(g.amount, s)) * Math.PI;
  let walk: Walk | undefined = moving ? { phase, amount: amt, flight: g.flight * clamp01(f) } : undefined;
  if (turning) walk = turnSteps(t, turnIn > 0 && t < tGo ? tStart : tEnd, turnIn > 0 && t < tGo ? turnIn : turnOut);
  const lean = g.lean * clamp01(f) + (o.gait === "run" ? 0.05 * Math.sin(phase * 2) * f : 0);
  let p = pointAt(path, d);
  if (o.ground) { // stand on what is under the body, stepping up when the front foot gets there
    const ahead = pointAt(path, Math.min(D, d + (moving ? 1.35 * s : 0)));
    const y0 = o.ground(p[0], p[2], p[1] + 1.2 * s), y1 = o.ground(ahead[0], ahead[2], p[1] + 1.2 * s);
    p = [p[0], Math.max(y0, y1), p[2]];
  }
  return { position: p, yaw, walk, pose: { lean, head: [0, o.gait === "run" ? -0.12 * f : 0] }, seed: rnd(path[0][0] + path[0][2]) * 10, moving, done: d >= D, u: D > 0 ? d / D : 1 };
};

/** Little stomping steps while turning on the spot (the game shuffles its feet when it turns). */
export const turnSteps = (t: number, t0: number, dur: number): Walk | undefined => {
  const u = seg(t, t0, t0 + dur);
  if (u <= 0 || u >= 1) return undefined;
  return { phase: (t - t0) * 16, amount: 0.32 * Math.sin(Math.PI * u) };
};
/** Turn on the spot from yaw0 to yaw1 over [t0, t0+dur], with stepping feet. Gives the yaw and the walk. */
export const turn = (yaw0: number, yaw1: number, t: number, t0: number, dur = 0.35) =>
  ({ yaw: yaw0 + dAng(yaw0, yaw1) * ease(seg(t, t0, t0 + dur)), walk: turnSteps(t, t0, dur) });

/**
 * A wanderer for crowds that mill about (a lawn, a yard, a church lobby): walks between seeded random points inside a
 * circle (centre c, radius r), pausing between legs. Deterministic per seed.
 */
export const wander = (seed: number, c: V3, r: number, t: number, o: { scale?: number; pause?: [number, number]; speedK?: number } = {}): Act => {
  const s = o.scale ?? 1, [p0, p1] = o.pause ?? [0.6, 2.2], V = GAIT.stroll.speed * s * (o.speedK ?? 1) * (0.8 + rnd(seed) * 0.4);
  const pt = (k: number): V3 => { const a = rnd(seed * 13 + k * 7.1) * Math.PI * 2, d = Math.sqrt(rnd(seed * 5 + k * 3.3)) * r; return [c[0] + Math.cos(a) * d, c[1], c[2] + Math.sin(a) * d]; };
  let k = 0, tt = -rnd(seed + 9) * 3; // stagger the starts
  for (; k < 400; k++) {
    const pause = p0 + rnd(seed + k * 1.7) * (p1 - p0), a = pt(k), b = pt(k + 1), D = len2(a, b), T = profile(D, V, 0.2, 0).T;
    if (t < tt + pause) { // standing at a, facing toward b (turning just before leaving)
      const y0 = k > 0 ? yawTo(pt(k - 1), a) : yawTo(a, b), y1 = yawTo(a, b);
      const tr = turn(y0, y1, t, tt + pause - 0.35, 0.35);
      return { position: a, yaw: tr.yaw, walk: tr.walk, pose: idle(t, seed, 0.6), seed };
    }
    if (t < tt + pause + T) { const w = walkPath([a, b], t, tt + pause, { scale: s, speed: V / s, accel: 0.2 }); return { ...w, seed }; }
    tt += pause + T;
  }
  return { position: pt(0), yaw: 0, seed };
};

// ---------------------------------------------------------------- sit, stand, jump
/** Seat height for BlockChar placement: when seated, the character's origin y is seatTop - 1.5 * scale. */
export const seatedY = (seatTop: number, s = 1) => seatTop - 1.5 * s;
/**
 * Sit down (dir 1) or stand up (dir -1) over [t0, t0+dur]. `stand` is where the character stands in front of the seat,
 * `seat` the seat's top centre (y = seat top). Like the game, the character hops onto the seat: the legs swing up to
 * straight-out FIRST (in front of the seat, in free space), then the body moves back over the seat and settles, so a leg
 * never passes through the seat's front edge. Classic sit: legs straight out, hands on the knees. Returns an Act.
 */
export const sit = (stand: V3, seat: V3, yaw: number, t: number, t0: number, dur = 0.6, s = 1, dir: 1 | -1 = 1): Act => {
  let u = seg(t, t0, t0 + dur);
  if (dir === -1) u = 1 - u;
  const legsU = ease(u / 0.4), moveU = ease((u - 0.4) / 0.6);
  const hop = 0.38 * s * Math.sin(Math.PI * u);
  const y = lerp(stand[1], seatedY(seat[1], s), moveU) + hop;
  const bend = Math.sin(Math.PI * u);
  return {
    position: [lerp(stand[0], seat[0], moveU), y, lerp(stand[2], seat[2], moveU)], yaw,
    pose: { legL: (Math.PI / 2) * legsU, legR: (Math.PI / 2) * legsU, armL: 0.35 * legsU + 0.3 * bend, armR: 0.35 * legsU + 0.3 * bend, lean: 0.12 * bend, head: [0, 0.08 * bend] },
  };
};
/** A seated idle on top of sit(): small fidgets, a foot kick now and then, head drift. */
export const seatedIdle = (t: number, seed = 0, amount = 1): Pose => {
  const k = amount, s = seed * 2.3, kick = Math.max(0, Math.sin(t * 1.7 + s)) ** 8 * 0.25;
  return { legL: kick * k, legR: -kick * 0.5 * k, head: [0.08 * wobble(t * 0.5, s) * k, 0.03 * wobble(t * 0.6, s + 1) * k], lean: 0.02 * wobble(t * 0.5, s + 2) * k };
};
/** A jump at t0: a quick crouch, up `h` (world units) and down in `dur`, both arms thrown up like the game's jump. Gives lift + pose. */
export const jump = (t: number, t0: number, h = 1.5, dur = 0.62): { lift: number; pose: Pose } => {
  const pre = 0.08, u = seg(t, t0 + pre, t0 + pre + dur), air = u > 0 && u < 1;
  const crouch = Math.sin(Math.PI * seg(t, t0, t0 + pre)) * 0.6 + (u >= 1 ? Math.sin(Math.PI * seg(t, t0 + pre + dur, t0 + pre + dur + 0.12)) * 0.6 : 0);
  const k = air ? 1 : 0;
  return {
    lift: air ? 4 * h * u * (1 - u) : 0,
    pose: { armL: 2.75 * k + 0.3 * crouch, armR: 2.75 * k + 0.3 * crouch, armLOut: 0.18 * k, armROut: 0.18 * k, legL: 0.25 * k, legR: -0.1 * k, lean: 0.12 * crouch, head: [0, -0.1 * k] },
  };
};

// ---------------------------------------------------------------- gestures (each a Pose layer; add with mix)
// Times are [t0, t1): the gesture eases in at t0 and out by t1 (t1 = Infinity holds it).
/** Overhead wave on the right arm (side -1 = left): arm up, waving side to side from the shoulder. */
export const wave = (t: number, t0: number, t1 = Infinity, side: 1 | -1 = 1, rate = 1): Pose => {
  const k = env(t, t0, t1, 0.15, 0.2), w = Math.sin((t - t0) * 11 * rate);
  const p: Pose = { armR: 2.75 * k, armROut: (0.42 + 0.22 * w) * k, head: [0, -0.04 * k], tilt: 0.05 * w * k, roll: -0.02 * k };
  return side === 1 ? p : flip(p);
};
/** Point with the right arm (straight forward; add twist/yaw for direction). `up` raises it (pointing at a window). */
export const point = (t: number, t0: number, t1 = Infinity, up = 0, side: 1 | -1 = 1): Pose => {
  const k = snap(seg(t, t0, t0 + 0.16)) * (t1 === Infinity ? 1 : 1 - ease(seg(t, t1 - 0.18, t1)));
  const p: Pose = { armR: (1.55 + up) * k, armROut: -0.1 * k, lean: 0.04 * k, head: [-0.05 * k, -up * 0.3 * k] };
  return side === 1 ? p : flip(p);
};
/** Shrug: both arms out and forward, palms-up feel, head tilted, a small lift of the shoulders (body bob). */
export const shrug = (t: number, t0: number, t1 = t0 + 0.9): Pose => {
  const k = env(t, t0, t1, 0.18, 0.25);
  return { armL: 0.55 * k, armR: 0.55 * k, armLOut: 0.62 * k, armROut: 0.62 * k, tilt: 0.16 * k, head: [0, -0.06 * k], lean: -0.03 * k };
};
/** Spread both arms wide ("nobody could", a preacher, "I don't know!"). */
export const spread = (t: number, t0: number, t1 = t0 + 1): Pose => {
  const k = env(t, t0, t1, 0.2, 0.25);
  return { armL: 1.0 * k, armR: 1.0 * k, armLOut: 0.95 * k, armROut: 0.95 * k, head: [0, -0.08 * k] };
};
/** Arms folded in front (held). Blocky arms have no elbows, so a true cross would pass through the chest and each other
 *  (checked with Collide.clipParts): both forearms come forward and in, the left a little higher, hands nearly meeting. */
export const crossArms = (t: number, t0: number, t1 = Infinity): Pose => {
  const k = env(t, t0, t1, 0.3, 0.3), kin = ease(seg(k, 0.6, 1)); // arms come up first, then fold in (never through the chest)
  return { armL: 1.38 * k, armLOut: -0.35 * kin, armR: 1.24 * k, armROut: -0.35 * kin, head: [0, 0.03 * k], lean: -0.03 * k };
};
/** Hands on hips (held). */
export const hips = (t: number, t0: number, t1 = Infinity): Pose => {
  const k = env(t, t0, t1, 0.22, 0.22);
  return { armL: -0.22 * k, armLOut: 0.3 * k, armR: -0.22 * k, armROut: 0.3 * k, head: [0, -0.03 * k], roll: 0.03 * k };
};
/** Chopping with the right hand (a knife in hold.R): quick strikes at `rate` per second, leaning over the board, head down. */
export const chop = (t: number, t0: number, t1 = Infinity, rate = 3.2): Pose => {
  const k = env(t, t0, t1, 0.15, 0.15), u = ((t - t0) * rate) % 1;
  const strike = u < 0.35 ? easeOut(u / 0.35) : 1 - ease((u - 0.35) / 0.65); // fast down, slower up
  return { armR: (1.6 - 0.62 * strike) * k, armROut: -0.18 * k, armL: 0.75 * k, armLOut: -0.2 * k, lean: 0.12 * k, head: [0, 0.32 * k] };
};
/** Stirring a pot / wiping: the right arm circles over a counter. */
export const stir = (t: number, t0: number, t1 = Infinity, rate = 1.4): Pose => {
  const k = env(t, t0, t1), a = (t - t0) * rate * Math.PI * 2;
  return { armR: (1.1 + 0.12 * Math.sin(a)) * k, armROut: (-0.2 + 0.15 * Math.cos(a)) * k, lean: 0.1 * k, head: [0, 0.28 * k] };
};
/** Push a door shut (or open) with the right arm: reach, push through, return. Times: contact at t0 + 0.25. */
export const pushDoor = (t: number, t0: number, dur = 0.8, side: 1 | -1 = 1): Pose => {
  const u = seg(t, t0, t0 + dur), reach = Math.sin(Math.PI * Math.min(1, u * 1.25));
  const p: Pose = { armR: 1.5 * reach, armROut: 0.1 * reach, lean: 0.1 * reach, twist: -0.15 * reach, head: [-0.1 * reach, 0] };
  return side === 1 ? p : flip(p);
};
/** Knock on a door with the right fist: `n` knocks starting at t0, spaced `gap` s. */
export const knock = (t: number, t0: number, n = 3, gap = 0.28): Pose => {
  const k = env(t, t0 - 0.2, t0 + n * gap + 0.2, 0.2, 0.2);
  let hit = 0;
  for (let i = 0; i < n; i++) { const u = seg(t, t0 + i * gap - 0.1, t0 + i * gap + 0.1); hit = Math.max(hit, Math.sin(Math.PI * u)); }
  return { armR: (1.3 + 0.35 * hit) * k, lean: (0.04 + 0.04 * hit) * k, head: [0, 0.05 * k] };
};
/** Hold something up high in the right hand (a STOP sign, a lantern, a trophy): raised arm with a small lift-pump at t0. */
export const raise = (t: number, t0: number, t1 = Infinity, side: 1 | -1 = 1): Pose => {
  const k = snap(seg(t, t0, t0 + 0.22)) * (t1 === Infinity ? 1 : 1 - ease(seg(t, t1 - 0.2, t1)));
  const p: Pose = { armR: 2.95 * k, armROut: 0.08 * k, head: [0, -0.05 * k], roll: -0.02 * k };
  return side === 1 ? p : flip(p);
};
/** Both arms up and pumping (cheer, "yay!"). */
export const cheer = (t: number, t0: number, t1 = t0 + 1.2): Pose => {
  const k = env(t, t0, t1, 0.12, 0.2), b = Math.abs(Math.sin((t - t0) * 9));
  return { armL: (2.6 + 0.25 * b) * k, armR: (2.6 + 0.25 * (1 - b)) * k, armLOut: 0.35 * k, armROut: 0.35 * k, head: [0, -0.12 * k], lean: -0.04 * k };
};
/** Clapping: hands meet in front at `rate` claps a second. */
export const clap = (t: number, t0: number, t1 = t0 + 1.2, rate = 4): Pose => {
  const k = env(t, t0, t1, 0.12, 0.15), b = 0.5 + 0.5 * Math.cos((t - t0) * rate * Math.PI * 2);
  return { armL: 1.25 * k, armR: 1.25 * k, armLOut: (-0.32 + 0.3 * b) * k, armROut: (-0.32 + 0.3 * b) * k, head: [0, 0.02 * k] };
};
/** Lean in close to whisper (toward its own front; add head yaw to aim). */
export const leanIn = (t: number, t0: number, t1 = Infinity, headYaw = 0): Pose => {
  const k = env(t, t0, t1, 0.3, 0.3);
  return { lean: 0.26 * k, tilt: -0.14 * k, head: [headYaw * k, 0.1 * k], armL: 0.25 * k, armR: 0.15 * k };
};
/** A body laugh: rocking back and forth, head back, arms in at the belly. */
export const laugh = (t: number, t0: number, t1 = t0 + 1.2): Pose => {
  const k = env(t, t0, t1, 0.12, 0.25), r = Math.sin((t - t0) * 15);
  return { lean: (-0.1 + 0.07 * r) * k, head: [0, (-0.22 + 0.06 * r) * k], armL: 0.8 * k, armR: 0.8 * k, armLOut: -0.1 * k, armROut: -0.1 * k, roll: 0.025 * r * k };
};
/** Nod (yes) n times. */
export const nod = (t: number, t0: number, n = 2, rate = 4): Pose => {
  const dur = n / rate, u = seg(t, t0, t0 + dur);
  return { head: [0, u > 0 && u < 1 ? 0.11 * (1 - Math.cos(u * n * Math.PI * 2)) : 0] };
};
/** Shake the head (no). */
export const headShake = (t: number, t0: number, t1 = t0 + 0.8, rate = 3.5): Pose => {
  const k = env(t, t0, t1, 0.08, 0.15);
  return { head: [0.38 * Math.sin((t - t0) * rate * Math.PI * 2) * k, 0.04 * k] };
};
/** A nervous look-around: head (and a bit of the upper body) to one side, hold, to the other, hold, back. */
export const lookAround = (t: number, t0: number, t1 = t0 + 2.2, first: 1 | -1 = 1, wide = 1): Pose => {
  const D = t1 - t0, u = (t - t0) / D;
  if (u <= 0 || u >= 1) return {};
  const keys: [number, number][] = [[0, 0], [0.12, 1], [0.38, 1], [0.52, -1], [0.82, -1], [1, 0]];
  let v = 0;
  for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) { const [ua, va] = keys[i - 1], [ub, vb] = keys[i]; v = lerp(va, vb, ease((u - ua) / (ub - ua))); break; }
  const a = v * first * wide;
  return { head: [0.85 * a, 0.03], twist: 0.25 * a, tilt: -0.05 * a, armL: 0.08 * Math.abs(a), armR: 0.08 * Math.abs(a) };
};
/**
 * The sudden head snap: the head whips to (yaw, pitch) in ~0.1 s with an overshoot and holds (the creepy "it turned to
 * look at the camera"). Give the head yaw relative to the body (use yawTo/dAng to aim at the camera).
 */
export const headSnap = (t: number, t0: number, yaw: number, pitch = 0, t1 = Infinity, dur = 0.12): Pose => {
  const k = snap(seg(t, t0, t0 + dur), 3) * (t1 === Infinity ? 1 : 1 - ease(seg(t, t1 - 0.25, t1)));
  const twist = Math.max(-0.5, Math.min(0.5, yaw * 0.35)); // a slower body follow
  const tf = ease(seg(t, t0 + 0.05, t0 + 0.45)) * (t1 === Infinity ? 1 : 1 - ease(seg(t, t1 - 0.25, t1)));
  return { head: [(yaw - twist * tf) * k, pitch * k], twist: twist * tf };
};
/** A startled jolt back: lean back, arms up in front, one foot back (snap in, then settle into a held flinch). */
export const recoil = (t: number, t0: number, t1 = Infinity): Pose => {
  const k = snap(seg(t, t0, t0 + 0.14), 2) * (t1 === Infinity ? 1 : 1 - ease(seg(t, t1 - 0.25, t1)));
  return { armL: 1.05 * k, armLOut: 0.28 * k, armR: 1.15 * k, armROut: 0.28 * k, lean: -0.16 * k, legL: -0.18 * k, legR: 0.08 * k, head: [0, -0.1 * k] };
};
/** Scared: hands up at the face, shrinking back, trembling. */
export const cower = (t: number, t0: number, t1 = Infinity): Pose => {
  const k = env(t, t0, t1, 0.15, 0.25), tr = Math.sin(t * 40) * 0.015;
  return { armL: (2.05 + tr) * k, armR: (2.05 - tr) * k, armLOut: -0.3 * k, armROut: -0.3 * k, lean: (-0.06 + tr) * k, head: [0, 0.12 * k] };
};
/** Talking hands: a small beat of the right (or both) arm on each word time (the game's chatty gesture). */
export const talkHands = (t: number, words: number[], both = false): Pose => {
  let b = 0;
  for (const w of words) { const u = seg(t, w - 0.05, w + 0.3); if (u > 0 && u < 1) b = Math.max(b, Math.sin(Math.PI * u)); }
  const on = words.length ? env(t, words[0] - 0.25, words[words.length - 1] + 0.6, 0.25, 0.3) : 0;
  return { armR: (0.45 + 0.35 * b) * on, armROut: -0.08 * on, armL: (both ? 0.45 + 0.3 * b : 0.12) * on, head: [0, -0.04 * b * on], tilt: 0.05 * b * on };
};
/** Reach down and pick something up / put it down (dip at t0 + dur/2). */
export const pickUp = (t: number, t0: number, dur = 0.9): Pose => {
  const b = Math.sin(Math.PI * seg(t, t0, t0 + dur));
  return { lean: 0.55 * b, armR: 0.9 * b, armL: 0.6 * b, head: [0, 0.35 * b] };
};
/** Holding a watering can / bucket out to the side and tipping it (pour). */
export const pour = (t: number, t0: number, t1 = Infinity): Pose => {
  const k = env(t, t0, t1, 0.3, 0.3), s = Math.sin((t - t0) * 2.2) * 0.08;
  return { armR: (0.75 + s) * k, armROut: 0.15 * k, lean: 0.05 * k, head: [-0.15 * k, 0.25 * k] };
};

// ---------------------------------------------------------------- faces
/**
 * Talking face: opens the mouth ("talk") on each word, back to `base` between words. Words are [start, end] or start
 * times (then 0.18 s each). Returns the Expr for t. (Blinks still come from blinkCurve.)
 */
export const talk = (t: number, words: (number | [number, number])[], base: Expr = "smile", open: Expr = "talk"): Expr => {
  for (const w of words) {
    const [a, b] = typeof w === "number" ? [w, w + 0.18] : w;
    const mid = (a + b) / 2;
    if (t >= a && t < b && !(t > mid - 0.03 && t < mid + 0.03 && b - a > 0.3)) return open; // long words close once mid-word
  }
  return base;
};
/** Swap the face at a word: `before` until t0, then `after` (until t1). */
export const faceAt = (t: number, before: Expr, after: Expr, t0: number, t1 = Infinity, back?: Expr): Expr =>
  t < t0 ? before : t < t1 ? after : back ?? before;

// ---------------------------------------------------------------- crowds
/** A per-person start time: t0 plus a seeded delay in [0, spread] (people never move in perfect sync, unless creepy). */
export const stagger = (i: number, t0: number, spread = 0.5, seed = 0) => t0 + rnd(i * 3.17 + seed) * spread;
/**
 * A crowd turning to stare (the community scene's turn): each person's head snaps toward `target` at a staggered time,
 * then the body follows. Give the person's position and current body yaw; returns the new body yaw and a head pose.
 * `sync` 0..1: 1 = everyone at once (eerie), 0 = a ripple over `spread` seconds.
 */
export const crowdTurn = (i: number, pos: V3, yaw0: number, target: V3, t: number, t0: number, spread = 0.6, sync = 0, seed = 0) => {
  const ti = lerp(stagger(i, t0, spread, seed), t0, sync);
  const want = yawTo(pos, target), d = dAng(yaw0, want);
  const bodyU = ease(seg(t, ti + 0.15, ti + 0.6)), k = snap(seg(t, ti, ti + 0.12), 3);
  const yaw = yaw0 + d * bodyU * 0.85; // the body comes most of the way round, a beat after the head
  const head = Math.max(-1.25, Math.min(1.25, d * k - d * bodyU * 0.85));
  return { yaw, pose: { head: [head, -0.03 * k] as [number, number] }, t: ti };
};
/** People filing along one path one after another (into a church, onto a bus): person i starts `gap` s after the one before. */
export const fileIn = (i: number, path: V3[], t: number, t0: number, gap = 0.55, o: PathOpts = {}) =>
  walkPath(path, t, t0 + i * gap + rnd(i + 0.3) * 0.15, o);

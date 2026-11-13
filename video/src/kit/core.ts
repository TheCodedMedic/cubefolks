// The Shorts kit core: word timing, easing, camera helpers and the Shot type (patterns from docs/examples/wit16/core.tsx).
// Never type a second in a Short: every time comes from at(beat, "word") on the Short's measured timing.json.
import type React from "react";

export type V3 = [number, number, number];
export type TimingJSON = { words: { b: number; w: string; s: number; e: number }[]; beats: { b: number; s: number; e: number; gap: number }[]; end: number };
export type Word = TimingJSON["words"][number];

const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9']/g, "");

/** Word-anchored time helpers for one Short. */
export const makeTiming = (T: TimingJSON) => {
  const find = (b: number, word: string, nth: number) => {
    const hits = T.words.filter((w) => w.b === b && norm(w.w) === norm(word));
    const h = hits[nth - 1];
    if (!h) throw new Error(`timing: "${word}" #${nth} is not in beat ${b} (${T.words.filter((w) => w.b === b).map((w) => w.w).join(" ")})`);
    return h;
  };
  /** Start (s) of the nth `word` in beat b (1-based), plus off. */
  const at = (b: number, word: string, nth = 1, off = 0) => find(b, word, nth).s + off;
  /** End of the nth `word` in beat b. */
  const atE = (b: number, word: string, nth = 1, off = 0) => find(b, word, nth).e + off;
  const PS = (b: number) => T.beats[b - 1].s;
  const PE = (b: number) => T.beats[b - 1].e;
  /** A cut lands just before a line starts. */
  const P = (b: number) => Math.max(0, PS(b) - 0.08);
  return { at, atE, PS, PE, P, END: T.end, words: T.words, beats: T.beats, N: T.beats.length };
};
export type Timing = ReturnType<typeof makeTiming>;

/** Suggested set-up boundaries: about one every `every` seconds, each snapped to the nearest word start (a timing template). */
export const autoCuts = (T: Timing, every = 1.25) => {
  const starts = T.words.map((w) => w.s);
  const cuts: number[] = [0];
  for (let x = every; x < T.END - every * 0.6; x += every) {
    const s = starts.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a));
    if (s - cuts[cuts.length - 1] > every * 0.6) cuts.push(Math.max(0, s - 0.06));
  }
  return cuts;
};

export const c01 = (x: number) => Math.max(0, Math.min(1, x));
export const seg = (t: number, a: number, b: number) => c01((t - a) / (b - a));
export const io = (x: number) => { x = c01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const out3 = (x: number) => 1 - Math.pow(1 - c01(x), 3);
/** Overshoot ease for pop-ins (goes past 1, settles). */
export const back = (x: number, k = 2.2) => { x = c01(x); return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const L3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
export const nz = (t: number, s: number) => Math.sin(t * 1.3 + s) * 0.6 + Math.sin(t * 2.9 + s * 2) * 0.3 + Math.sin(t * 6.1 + s * 3) * 0.1;
export const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** Scale for a 3D prop popping in at t0 (overshoot), and out at t1. */
export const popIn = (t: number, t0: number, t1 = Infinity, dur = 0.2) => (t < t0 ? 0 : back(seg(t, t0, t0 + dur))) * (1 - seg(t, t1, t1 + 0.12));

export type CamS = { pos: V3; target: V3; fov: number; roll?: number };
/** Orbit: camera on a circle around c at angle a (deg), radius r, height y. */
export const orbit = (c: V3, a: number, r: number, y: number): V3 => [c[0] + Math.sin((a * Math.PI) / 180) * r, y, c[2] + Math.cos((a * Math.PI) / 180) * r];
/** Camera moves for a shot from t0 to t1 (u eased 0..1). */
export const push = (from: CamS, to: CamS, t: number, t0: number, t1: number): CamS => {
  const u = io(seg(t, t0, t1));
  return { pos: L3(from.pos, to.pos, u), target: L3(from.target, to.target, u), fov: lerp(from.fov, to.fov, u), roll: lerp(from.roll ?? 0, to.roll ?? 0, u) };
};
export const orbitCam = (c: V3, a0: number, a1: number, r: number, y: number, fov: number, t: number, t0: number, t1: number, ty = c[1]): CamS => {
  const u = io(seg(t, t0, t1));
  return { pos: orbit(c, lerp(a0, a1, u), r, y), target: [c[0], ty, c[2]], fov };
};
export const hand = (c: CamS, t: number, a = 0.006): CamS => ({ ...c, pos: [c.pos[0] + nz(t, 1) * a, c.pos[1] + nz(t, 2) * a, c.pos[2]], target: [c.target[0] + nz(t, 3) * a * 0.6, c.target[1] + nz(t, 4) * a * 0.6, c.target[2]] });

/** How the picture enters a shot: a whip-pan (default, from the left or right), a hard cut, or a white flash. */
export type Enter = "whipL" | "whipR" | "cut" | "flash";
/** A shot: [t0, t1) in master seconds, a scene and a camera as functions of t, an optional 2D layer over the 3D. */
export type Shot = {
  id: string; t0: number; t1: number; scene: (t: number) => React.ReactNode; cam: (t: number) => CamS;
  dom?: (t: number, cam: CamS) => React.ReactNode; enter?: Enter; bg?: string; still?: boolean;
};
export const pickShot = (shots: Shot[], t: number) => shots.find((s) => t >= s.t0 && t < s.t1) ?? shots[shots.length - 1];

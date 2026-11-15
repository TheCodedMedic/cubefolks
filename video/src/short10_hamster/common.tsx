// Short 10 shared helpers: the cast, Ch (a character with blinks and the clipping debug), cameras, moments from words.
// RIG UNITS everywhere (Classroom.tsx, Props.tsx): adult scale 1, kids KID (0.82).
//
// CLIP AUDIT RULE: every character in a shot is a <Ch> placed DIRECTLY in the fragment the scene returns (not inside another
// custom component), with `cs` = the set's colliders (+ props) and `others` = the other people in the shot, so
// video/tools/clip10.tsx finds it. Debug render: --props '{"u":12.3,"debug":true}' paints clipping parts red.
import React from "react";
import { getInputProps } from "remotion";
import TIMING from "./timing.json";
import { makeTiming, nz, io, seg, lerp, type CamS, type TimingJSON } from "../kit/core";
import { BlockChar, blinkCurve } from "../blocky/BlockRig";
import { BlockLights, type TimeOfDay } from "../blocky/Look";
import * as K from "../blocky/Collide";
import type { Expr, Look, Pose, Walk } from "../blocky/types";

export type V3 = [number, number, number];
export const T = makeTiming(TIMING as TimingJSON);
export const { at, atE, P, PS, PE } = T;
/** cuts land a hair before the word */
export const KC = 0.06;

// ---- cast (our own designs) ----
const PALE = "#ece6dc", LIGHT = "#f0d0ae", WARM = "#c98e62", DEEP = "#7e5236";
export const KID = 0.82;
/** ME: the detective (red-and-white striped shirt, navy cap, notebook). */
export const ME: Look = { skin: LIGHT, shirt: "#d8483a", shirtPattern: "stripes", pants: "#2c3a5a", hair: "short", hairColor: "#5a3a22", hat: "cap", hatColor: "#24365e" };
/** MAYA (~9): purple hoodie, braids (ponytail), the key on a lanyard. */
export const MAYA: Look = { skin: WARM, shirt: "#8a4ad8", pants: "#2a2a34", hair: "ponytail", hairColor: "#24140c", acc: ["bow"], accColor: "#f2c81e" };
/** MR. ORTIZ (teacher, background only): sweater vest look, glasses. */
export const ORTIZ: Look = { skin: LIGHT, shirt: "#7a5a3a", pants: "#3a3f4a", hair: "short", hairColor: "#1a120c", glasses: true, tie: "#2a4a7a" };
export const KIDS: Look[] = [
  { skin: DEEP, shirt: "#2f7fc8", pants: "#2a2f3a", hair: "short", hairColor: "#0e0a08" },
  { skin: PALE, shirt: "#e07a2e", pants: "#3a4a6a", hair: "bob", hairColor: "#a0602c" },
  { skin: WARM, shirt: "#3aa07a", pants: "#202020", hair: "short", hairColor: "#1a120c", hat: "capBack", hatColor: "#c8302a" },
  { skin: LIGHT, shirt: "#e9a3b8", pants: "#4a3a2a", hair: "long", hairColor: "#c89a4a" },
  { skin: PALE, shirt: "#f2c81e", pants: "#1c1c22", hair: "spiky", hairColor: "#3a2414" },
  { skin: DEEP, shirt: "#efe3c8", pants: "#2c3a5a", hair: "bun", hairColor: "#0e0a08", glasses: true },
];

// ---- a character ----
const DEBUG = (() => { try { return typeof window !== "undefined" && !!(getInputProps() as any)?.debug; } catch { return false; } })();
export type ChProps = {
  look: Look; a: { position: V3; yaw: number; walk?: Walk; pose?: Pose; seed?: number }; t: number; expr?: Expr; scale?: number;
  hold?: { R?: React.ReactNode; L?: React.ReactNode }; lift?: number; blinkSeed?: number; still?: boolean;
  /** colliders (set + props) and the other people (as K.CharState), checked by the audit and the debug render */
  cs?: K.Box[]; others?: K.CharState[]; allow?: string[];
  /** set true for a character the audit should skip (e.g. lying in bed, a rotated pose the rig boxes cannot express) */
  noAudit?: boolean;
};
export const Ch: React.FC<ChProps> = ({ look, a, t, expr = "smile", scale = KID, hold, lift = 0, blinkSeed = 0, still, cs = [], others = [], allow = ["seat"] }) => {
  const position: V3 = [a.position[0], a.position[1] + lift, a.position[2]];
  let hits: ReturnType<typeof K.clipParts> | undefined;
  if (DEBUG) {
    const st: K.CharState = { position, yaw: a.yaw, scale, pose: a.pose, walk: a.walk };
    hits = K.clipParts(st, cs, others, 0.04 * scale, allow);
    if (lift === 0 && K.footGap(st, cs) < -0.12 * scale) { hits.legL = true; hits.legR = true; }
  }
  return <BlockChar look={look} scale={scale} position={position} yaw={a.yaw} walk={a.walk} hits={hits} pose={a.pose} seed={a.seed ?? blinkSeed}
    expr={expr} blink={expr === "stare" || expr === "happy" ? 0 : blinkCurve(t, blinkSeed)} hold={hold} still={still} />;
};
/** A CharState for `others` lists. */
export const st = (a: { position: V3; yaw: number; walk?: Walk; pose?: Pose }, scale = KID): K.CharState => ({ position: a.position, yaw: a.yaw, walk: a.walk, pose: a.pose, scale });
/** Eye height of a character of scale s standing on y0. */
export const eye = (s = KID, y0 = 0) => y0 + 4.55 * s;

// ---- lights ----
export const Lights: React.FC<{ time?: TimeOfDay; focus?: V3; practicalAt?: V3; fill?: number }> = ({ time = "interior", focus = [0, 0, 0], practicalAt, fill }) =>
  <BlockLights time={time} focus={focus} practicalAt={practicalAt} fill={fill} />;

// ---- cameras ----
export const cam = (pos: V3, target: V3, fov = 40): CamS => ({ pos, target, fov });
/** A calm move between two framings over [a, b] with a gentle handheld sway. */
export const move = (from: CamS, to: CamS, t: number, a: number, b: number, sway = 0.02): CamS => {
  const u = io(seg(t, a, b)) * 0.8 + seg(t, a, b) * 0.2;
  const L = (p: V3, q: V3): V3 => [lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)];
  const p = L(from.pos, to.pos), g = L(from.target, to.target);
  return { pos: [p[0] + nz(t, 1) * sway, p[1] + nz(t, 2) * sway, p[2] + nz(t, 7) * sway], target: g, fov: lerp(from.fov, to.fov, u) };
};
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const L3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

// Episode 16 core (copied from Episode 15), same engine as Episode 04: word timing, easing and camera helpers, the Shot type, and the frame renderer shared by every part.
import React from "react";
import LIP_JSON from "./lip.json";
import { RIG } from "../cam3d/Person3D";
const LIP = LIP_JSON as { fps: number; spans: [number, number, string][]; env: number[] };
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam } from "../ep04/AssetSheet";
import { V3 } from "../ep04/Vfx";
import TIMING from "./timing.json";

export const FPS4 = 30;
type W = { b: number; w: string; s: number; e: number };
const WORDS = TIMING.words as W[];
const BEATS = TIMING.beats as { b: number; s: number; e: number; gap: number }[];
const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9']/g, "");
/** Start time (s, master) of the nth `word` in beat b (1-based beats). */
export const at = (b: number, word: string, nth = 1, off = 0) => {
  const hits = WORDS.filter((w) => w.b === b && norm(w.w) === norm(word));
  if (!hits[nth - 1]) { console.warn(`word ${word}#${nth} not in beat ${b}`); return BEATS[b - 1].s + off; }
  return hits[nth - 1].s + off;
};
/** End time of the nth `word` in beat b. */
export const atE = (b: number, word: string, nth = 1, off = 0) => {
  const hits = WORDS.filter((w) => w.b === b && norm(w.w) === norm(word));
  if (!hits[nth - 1]) { console.warn(`word ${word}#${nth} not in beat ${b}`); return BEATS[b - 1].e + off; }
  return hits[nth - 1].e + off;
};
export const PS = (b: number) => BEATS[b - 1].s;
export const PE = (b: number) => BEATS[b - 1].e;
/** A cut lands just before a line starts. */
export const P = (b: number) => PS(b) - 0.12;
export const FILM_END = PE(BEATS.length) + 10.0; // the question, then the channel end card

export const c01 = (x: number) => Math.max(0, Math.min(1, x));
export const seg = (t: number, a: number, b: number) => c01((t - a) / (b - a));
export const io = (x: number) => { x = c01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const ex = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * c01(x)));
export const L3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
export const nz = (t: number, s: number) => Math.sin(t * 1.3 + s) * 0.6 + Math.sin(t * 2.9 + s * 2) * 0.3 + Math.sin(t * 6.1 + s * 3) * 0.1;
export const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export type CamS = { pos: V3; target: V3; fov: number; roll?: number };
export const hand = (c: CamS, t: number, a = 0.012): CamS => ({ ...c, pos: [c.pos[0] + nz(t, 1) * a, c.pos[1] + nz(t, 2) * a, c.pos[2]], target: [c.target[0] + nz(t, 3) * a * 0.6, c.target[1] + nz(t, 4) * a * 0.6, c.target[2]] });
export const shakeC = (c: CamS, t: number, amt: number): CamS => (amt > 0 ? { ...c, target: [c.target[0] + nz(t * 9, 5) * amt, c.target[1] + nz(t * 9, 6) * amt, c.target[2]] } : c);
export const RUN_Y = Math.PI / 2;
/** Orbit helper: camera on a circle around `c` at angle a (deg), radius r, height y. */
export const orbit = (c: V3, a: number, r: number, y: number): V3 => [c[0] + Math.sin((a * Math.PI) / 180) * r, y, c[2] + Math.cos((a * Math.PI) / 180) * r];

/** grade: optional CSS filter on the 3D layer (e.g. the cold Part 2 teaser). dom: 2D layer drawn over the 3D (phones, graphs). */
export type Shot = { id: string; t0: number; t1: number; scene: (t: number) => React.ReactNode; cam: (t: number) => CamS; noBlur?: boolean; grade?: string; dom?: (t: number, cam: CamS) => React.ReactNode; no3d?: boolean };

export const pickShot = (shots: Shot[], t: number) => shots.find((s) => t >= s.t0 && t < s.t1) ?? shots[shots.length - 1];
const blurOf = (s: Shot, t: number) => {
  const d = (c: CamS) => new THREE.Vector3(c.target[0] - c.pos[0], c.target[1] - c.pos[1], c.target[2] - c.pos[2]).normalize();
  const a = s.cam(t - 1 / 60), b = s.cam(t + 1 / 60);
  const ang = (d(a).angleTo(d(b)) * 180) / Math.PI;
  return Math.min(40, Math.max(0, (ang - 0.9) * (900 / a.fov) * 0.18));
};

// lip track built from the master voice (episodes/16_bank_balance, build_lip.py): mouth opening per frame inside each character line
const lipAt = (t: number, voice: string): number | null => {
  const on = LIP.spans.some(([a, b, v]) => v === voice && t >= a && t <= b);
  return on ? LIP.env[Math.max(0, Math.min(LIP.env.length - 1, Math.round(t * LIP.fps)))] : null;
};

// Every shot moves (user note, Part 2: "not enough camera movement"): a shot whose camera holds still gets a slow push-in
// (7% toward the target), a slight orbit (±1.6°, its direction picked per shot) and a breath of handheld drift.
const dist3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const liven = (s: Shot, t: number): CamS => {
  const c = s.cam(t), a = s.cam(s.t0 + 0.05), b = s.cam(Math.max(s.t0 + 0.05, s.t1 - 0.05));
  if (dist3(a.pos, b.pos) > 0.02 || dist3(a.target, b.target) > 0.02 || Math.abs(a.fov - b.fov) > 0.1) return c;
  const u = seg(t, s.t0, s.t1), dir = (s.id.length % 2 ? 1 : -1), ang = ((u - 0.5) * 2 * 1.6 * dir * Math.PI) / 180;
  const dx = c.pos[0] - c.target[0], dz = c.pos[2] - c.target[2], k = 1 - 0.07 * (u * u * (3 - 2 * u));
  const rx = dx * Math.cos(ang) - dz * Math.sin(ang), rz = dx * Math.sin(ang) + dz * Math.cos(ang);
  return hand({ ...c, pos: [c.target[0] + rx * k, c.target[1] + (c.pos[1] - c.target[1]) * k, c.target[2] + rz * k] }, t, 0.006);
};

export const ShotFrame: React.FC<{ shots: Shot[]; t: number; type?: React.FC<{ t: number }>; label?: string }> = ({ shots, t, type: Type, label }) => {
  RIG.t = t; RIG.lip = lipAt; RIG.tables = [];
  const s = pickShot(shots, t), cam = s.no3d ? s.cam(t) : liven(s, t), bl = s.noBlur ? 0 : blurOf(s, t);
  return (
    <AbsoluteFill style={{ background: "#05070F" }}>
      {!s.no3d && (
        <>
          <svg width={0} height={0} style={{ position: "absolute" }}><filter id="mb4" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation={`${bl} 0`} /></filter></svg>
          <AbsoluteFill style={{ filter: [bl > 0.3 ? "url(#mb4)" : "", s.grade ?? ""].join(" ").trim() || undefined }}>
            <ThreeCanvas width={1920} height={1080} shadows gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ fov: 35, position: [0, 2, 6] }}>
              <Cam pos={cam.pos} target={cam.target} fov={cam.fov} roll={cam.roll} />
              {s.scene(t)}
            </ThreeCanvas>
          </AbsoluteFill>
        </>
      )}
      {s.dom?.(t, cam)}
      {Type && <Type t={t} />}
      {label && <div style={{ position: "absolute", right: 20, bottom: 14, color: "#fff", font: "700 30px sans-serif", textShadow: "0 0 6px #000" }}>{label}</div>}
    </AbsoluteFill>
  );
};


/** The first minute (the approval gate): beats 1-18 of "What If You Could See Everyone's Bank Balance?" (the kitchen at night, the title, the mirror, the bus). */
export const M1_END = PS(19) - 0.2;
/** Who builds which stretch of the first minute. Every builder's shots start inside its own window [t0, t1). */
export const WIN: Record<string, [number, number][]> = {
  open: [[0, PS(6) - 0.3]],              // night, the kitchen: Dad with the envelopes, "We're fine", his red number ticking down; the narrator's hook (1-5)
  ttl:  [[PS(6) - 0.3, PS(7) - 0.4]],    // white flash; the SPOKEN TITLE over a crane up from a suburb into a city of glowing numbers over every head (6)
  home: [[PS(7) - 0.4, PS(17) - 0.4]],   // three days earlier: the mirror, $4.12; the kitchen: Ava $36.50, Mom $812.40, the acceptance letter on the fridge, "Eleven cups" (7-16)
  bus:  [[PS(17) - 0.4, M1_END + 0.5]],  // the school bus: numbers over everyone; the $400 infographic with little people (17-18)
};
export const WIN_KEYS = ["open", "ttl", "home", "bus"] as const;

/** The full film (93 beats, about 8:30): the approved first minute (WIN) + ten windows, one builder each (Q<Name>.tsx). Every file's shots start inside its window [t0, t1). */
export const WIN2: Record<string, [number, number][]> = {
  school:   [[M1_END + 0.5, PS(26) - 0.4]], // the school parking lot: Tyler's new car ($2.31) and "My dad says don't worry about it"; Jordan at his locker ($3,840), "Lawns, man"; the montage of tags (the coach with the boat −$48,200, the lunch lady $61,350, the principal −$9,870, the art teacher on a rusty bike $212,400) (19-25)
  delgado:  [[PS(26) - 0.4, PS(31) - 0.4]], // the cafeteria: Mr. Delgado mopping, $1,214,880, you drop your tray; THE MILLIONAIRE INFOGRAPHIC with people (suits and new cars in red, one worker by an old pickup in green); the loading dock, his sandwich, the faded blue pickup; "How do you get rich?" "You spend less than you make..." (26-30)
  rule:     [[PS(31) - 0.4, PS(37) - 0.4]], // the loading dock continues: "That's it?"; the boring fund since twenty-three; THE RULE OF 72 INFOGRAPHIC with people (savings doubling every ten years at seven percent, a little figure growing older as the stack doubles); "You writing a paper?"; you walk away past his truck and your dad's car (31-36)
  night:    [[PS(37) - 0.4, PS(43) - 0.4]], // 3:52 a.m.: the car door, Dad in a hi-vis vest ($−11,488); you follow on your bike with no lights through empty streets; the warehouse in sodium orange, NIGHT SHIFT door, Dad loading boxes; the coworker in a hard hat with a coffee; "My kid got into his dream school..."; "Dad..." at the window (37-42)
  letter:   [[PS(43) - 0.4, PS(49) - 0.4]], // morning, the empty kitchen: the CONGRATULATIONS letter off the fridge, the $4,800 deposit receipt on a credit card clipped to the back; the drawer of red card statements; you on the kitchen floor, $4.12 over you; THE DEBT INFOGRAPHIC with a little family ($11,640 at 24%, the rule of 72 doubling in three years, minimum payments for fifteen years: a hole that digs itself) (43-48)
  jordan:   [[PS(49) - 0.4, PS(58) - 0.4]], // the bleachers by the football field after school: you tell Jordan everything ("Tyler has two dollars?"), the turn ("My dad's is negative eleven thousand..."), "Then don't fix it alone", his savings refused, his lawns offered, "talk to your dad" (49-57)
  pizza:    [[PS(58) - 0.4, PS(70) - 0.4]], // Friday night, treat night: Dad through the door with two pizza boxes, the tag ticking down on the receipt; the table, Mom watching; "Dad, I followed you"; the whole confrontation (the one card, the transmission, the inhalers, "Two jobs and no sleep isn't handled", "Are we poor?", "We're in a hole... together"); the narrator's money-stress line (58-69)
  plan:     [[PS(70) - 0.4, PS(81) - 0.4]], // later that night, all four at the table with every number; then THE PLAN MONTAGE (the fridge chart of cards by interest rate, cancelled subscriptions, Mom on the phone with the card company, scholarship forms at midnight, Jordan teaching you to edge a lawn, Mr. Delgado's pickup with the used mower, Tyler's car towed and "Are you guys hiring?", mowing in the Saturday sun with your number climbing $4.12 -> $86 -> $340, the monthly chart shrinking, Ava's pizza chart); Dad hangs up the vest at the warehouse door: "Last shift", his number stops falling (70-80)
  april:    [[PS(81) - 0.4, PS(87) - 0.4]], // white flash: spring, the mailbox at the end of the driveway, the scholarship letter; you run inside; "Full tuition. Four years."; Dad hugs you off your feet, Mom laughing and crying, Dad's tag −$2,140 ticking UP (81-86)
  ending:   [[PS(87) - 0.4, FILM_END]], // that evening, the front hall: Dad finds Ava's pig piggy bank and the crayon note FOR THE PIZZA. LOVE AVA in his coat pocket; Ava in the doorway, $0.00, grinning; "Am I still the richest person in the house?" "Kiddo, you always were."; the narrator's last lines; the question; a crane up over the suburb at dusk, the numbers fading one by one until only porch lights are left; the end card (87-93)
};
export const WIN2_KEYS = ["school", "delgado", "rule", "night", "letter", "jordan", "pizza", "plan", "april", "ending"] as const;

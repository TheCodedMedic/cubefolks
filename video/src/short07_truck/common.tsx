// Short 07 "The Truck With No Speaker": the shared pieces every shot file uses (cast, word anchors, the cut list, the
// collider-aware character, camera helpers). Plan: notes/cubefolks/STORY_TESTS_v2.md section A; contract:
// notes/short07/CONTRACT.md. EVERY time comes from at(beat, "word"). Never type a second.
//
// UNITS: everything in this Short is in RIG UNITS (an adult BlockChar at scale 1 is 5 tall, 1 m ~ 3.1 units), indoors too:
// our own rooms are built in rig units (no metre sets), and the street is Short 6's MyStreet (rig units).
import React from "react";
import TIMING from "./timing.json";
import { CamS, io, lerp, makeTiming, nz, seg, Shot, TimingJSON, V3 } from "../kit/core";
import { BlockChar, blinkCurve } from "../blocky/BlockRig";
import * as K from "../blocky/Collide";
import type { Expr, Look, Pose, Walk } from "../blocky/types";

export const T = makeTiming(TIMING as TimingJSON);
export const { at, atE, P, PS, PE } = T;
export const END = T.END;

// ---------------------------------------------------------------- cast (our own designs)
const PALE = "#ece6dc", LIGHT = "#f0d0ae", WARM = "#c98e62", DEEP = "#7e5236";
/** ME (~10): striped shirt by day. */
export const ME: Look = { skin: PALE, shirt: "#3f7fd0", pants: "#2a2f3a", shirtPattern: "stripes", hair: "spiky", hairColor: "#6a4426" };
/** ME at night: pyjamas. */
export const ME_PJ: Look = { ...ME, shirt: "#7fa6dc", pants: "#7fa6dc", shirtPattern: "pajamas" };
/** MOM: pink cardigan, brown bun. */
export const MOM: Look = { skin: PALE, shirt: "#e48aa8", pants: "#3a3a52", hair: "bun", hairColor: "#6a4024" };
/** TOBY: green hoodie, red cap. */
export const TOBY: Look = { skin: WARM, shirt: "#3f9a4e", pants: "#2a2f3a", hair: "short", hairColor: "#1a120c", hat: "cap", hatColor: "#c8302a" };
/** The TEACHER: grey sweater, glasses, bun. */
export const TEACHER: Look = { skin: LIGHT, shirt: "#8a8c92", pants: "#2a2a30", hair: "bun", hairColor: "#5a3a22", glasses: true };
/** Classmates (popular avatar styles, our own). */
export const KIDS: Look[] = [
  { skin: PALE, shirt: "#f2c81e", pants: "#1c1c20", shirtPattern: "stripes", hair: "spiky", hairColor: "#f3d35a" },
  { skin: DEEP, shirt: "#e07a2e", pants: "#3a4a6a", hair: "ponytail", hairColor: "#3a2414" },
  { skin: LIGHT, shirt: "#7a4fb0", pants: "#2a2a34", hair: "long", hairColor: "#141014", acc: ["bow"], accColor: "#ef5b7a" },
  { skin: WARM, shirt: "#2f6fc8", pants: "#2a2f3a", hair: "short", hairColor: "#1a120c", hat: "capBack", hatColor: "#f2f2f2" },
  { skin: PALE, shirt: "#1d2230", pants: "#1d2230", hair: "emo", hairColor: "#141014", acc: ["headphones"], accColor: "#e2403a" },
  { skin: LIGHT, shirt: "#e9a3b8", pants: "#2c3a5a", hair: "bob", hairColor: "#c89a4a", glasses: true },
  { skin: DEEP, shirt: "#d6e86a", pants: "#1c1c22", hair: "short", hairColor: "#0e0a08", hat: "beanie", hatColor: "#2a2a34" },
  { skin: PALE, shirt: "#8fb8e8", pants: "#3a3f4a", hair: "ponytail", hairColor: "#b5612a" },
];
/** BlockChar scales (rig units). */
export const S = { adult: 1, kid: 0.82 } as const;
/** Height of the middle of the face above the feet for scale s. */
export const eyeY = (s: number) => 4.55 * s;

// ---------------------------------------------------------------- word anchors (all from the voice)
const K6 = 0.06; // cuts land a hair before the word
export const E = {
  // b1
  truck1: at(1, "truck"), speaker1: at(1, "speaker"), sings: at(1, "sings"), outside1: at(1, "outside"), my1: at(1, "my"), window1: at(1, "window"),
  three: at(1, "3"), am: at(1, "a.m."), night1: at(1, "night."),
  // b2
  mom2: at(2, "Mom"), never: at(2, "never"), take: at(2, "take"), free: at(2, "free"), cream: at(2, "cream."),
  // b3
  toby: at(3, "Toby"), took: at(3, "took"), last3: at(3, "last"), week3: at(3, "week."),
  // b4
  next4: at(4, "next"), held4: at(4, "held"), cone4: at(4, "cone"), all4: at(4, "all"), lunch: at(4, "lunch"), without: at(4, "without"), bite: at(4, "bite."),
  // b5
  melt: at(5, "melt,"), even5: at(5, "even"), hot: at(5, "hot"), slide: at(5, "slide."),
  // b6
  walked: at(6, "walked"), past: at(6, "past"), me6: at(6, "me,"), i6: at(6, "I"), heard: at(6, "heard"), song6: at(6, "song."),
  // b7
  wasnt: at(7, "wasn't"), truck7: at(7, "truck"), anywhere: at(7, "anywhere."),
  // b8
  week8: at(8, "week"), teacher: at(8, "teacher"), cone8: at(8, "cone"), too: at(8, "too."),
  // b9
  spelling: at(9, "spelling"), she9: at(9, "she"), hummed: at(9, "hummed"), tune: at(9, "tune"), while9: at(9, "while"), wrote: at(9, "wrote."),
  // b10
  even10: at(10, "even"), hit: at(10, "hit"), same: at(10, "same"), wrong: at(10, "wrong"), note: at(10, "note"), the10b: at(10, "the", 2), truck10: at(10, "truck"), always: at(10, "always"), hits: at(10, "hits."),
  // b11
  last11: at(11, "Last"), truck11: at(11, "truck"), stopped: at(11, "stopped"), outside11: at(11, "outside"), house: at(11, "house."),
  // b12
  engine: at(12, "engine"), quiet: at(12, "quiet,"), but: at(12, "but"), song12: at(12, "song"), kept: at(12, "kept"), getting: at(12, "getting"), closer: at(12, "closer."),
  // b13
  mom13: at(13, "Mom"), opened13: at(13, "opened"), bedroom: at(13, "bedroom"), door13: at(13, "door"), holding: at(13, "holding"), two: at(13, "two"), cones: at(13, "cones."),
  // b14
  backed: at(14, "backed"), away: at(14, "away."),
  // b15
  music: at(15, "music"), followed: at(15, "followed"), her15: at(15, "her."),
  // b16
  then16: at(16, "Then"), opened16: at(16, "opened"), mouth: at(16, "mouth."),
  // b17
  whole: at(17, "whole"), song17: at(17, "song"), came: at(17, "came"), out17: at(17, "out,"), bells: at(17, "bells"), all17: at(17, "all."),
  // b18
  held18: at(18, "held"), spare: at(18, "spare"), cone18: at(18, "cone"), out18: at(18, "out"), me18: at(18, "me."),
  // b19
  supposed: at(19, "supposed"), its: at(19, "its"), next19: at(19, "next"), speaker19: at(19, "speaker."),
};

// ---------------------------------------------------------------- the cut list (36 set-ups, about one a second)
// [id, start]. The shot ends where the next one starts. Owner of each range: see notes/short07/CONTRACT.md.
export const CUTS: [string, number][] = [
  ["s01_truck", 0],                     // b1 night street, the truck rolls in, CLUE: empty speaker mount; 3:00 AM pop
  ["s02_window", E.my1 - K6],           // ME in pyjamas peeks between the curtains, head snaps to the sound
  ["s03_kitchen", P(2)],                // b2 Mom drops a free-cone flyer in the bin, wags a finger
  ["s04_tobywalk", P(3)],               // b3 Toby walks out to the truck's window at night
  ["s05_handoff", E.last3 - K6],        // a hand passes Toby a cone (truck window, close)
  ["s06_lunch", P(4)],                  // b4 lunch tables, Toby holds the cone up, still
  ["s07_tobystare", E.all4 - K6],       // Toby: unblinking smile, the cone untouched
  ["s08_slide", P(5)],                  // b5 Toby slides down holding the cone up (heat shimmer)
  ["s09_cone", E.even5 - K6],           // CLUE: the cone at the bottom of the slide, not one drip
  ["s10_corridor", P(6)],               // b6 corridor, lead dolly: Toby walks past ME, ME turns
  ["s11_me", E.i6 - K6],                // ME, Toby passing behind; ME's head snaps after him
  ["s13_lookaround", P(7)],             // b7 ME at the classroom window looks around (worried)
  ["s12_nostreet", E.truck7 - K6],      // out of the window: the empty street. No truck.
  ["s14_class", P(8)],                  // b8 classroom: the teacher at the board, a cone in her other hand
  ["s16a_test", P(9)],                  // b9 kids bent over their tests
  ["s15_hum", E.she9 - K6],             // the teacher writes, humming
  ["s16b_lookup", E.while9 - K6],       // kids look up one by one
  ["s17_wrongnote", P(10)],             // b10 CLUE: on the wrong note her head tilts
  ["s18_mefreeze", E.the10b - K6],      // ME freezes, pencil up
  ["s19_aerial", P(11)],                // b11 aerial: the pink glow creeps down the night street to our house
  ["s20_stops", E.stopped - K6],        // the truck stops at our curb
  ["s21_engine", P(12)],                // b12 headlights die, the engine stops (the jingle goes on)
  ["s22_hall", E.but - K6],             // our dark hallway, nobody; the camera drifts toward ME's door
  ["s23_bed", E.getting - K6],          // ME in bed pulls the blanket up, eyes on the door
  ["s24_door", P(13)],                  // b13 the door swings open: Mom, a cone in each hand, backlit
  ["s25_cones", E.holding - K6],        // the two cones, glowing faintly
  ["s26_backs", P(14)],                 // b14 ME backs away across the bed
  ["s27_stepsin", P(15)],               // b15 Mom steps in; the music comes from her
  ["s28_tilt", P(16)],                  // b16 Mom's smile, her head tilts
  ["s29_mouth", E.opened16 - K6],       // her mouth opens (grin, held)
  ["s30_jingle", P(17)],                // b17 the full jingle blasts out of her, a jolt on each bell
  ["s31_cower", E.bells - K6],          // ME against the wall, hands up
  ["s32_offer", P(18)],                 // b18 Mom holds the spare cone out
  ["s33_spare", E.out18 - K6],          // the cone in front of ME: it glows, it hums
  ["s34_meface", P(19)],                // b19 ME's eyes on the cone, slow push
  ["s35_loop", E.its - K6],             // the night street, the empty speaker mount (cuts into s01)
];
export const span = (id: string): [number, number] => {
  const i = CUTS.findIndex((x) => x[0] === id);
  if (i < 0) throw new Error(`no cut ${id}`);
  return [CUTS[i][1], i + 1 < CUTS.length ? CUTS[i + 1][1] : END];
};
/** Make a shot for a cut id (hard cut in). */
export const mk = (id: string, s: Omit<Shot, "id" | "t0" | "t1">): Shot => { const [t0, t1] = span(id); return { enter: "cut", ...s, id, t0, t1 }; };

// ---------------------------------------------------------------- camera helpers
export const c = (pos: V3, target: V3, fov: number): CamS => ({ pos, target, fov });
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const L3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
/** A calm camera move between two framings over [a, b], with a gentle handheld sway. */
export const move = (from: CamS, to: CamS, t: number, a: number, b: number, sway = 0.006): CamS => {
  const u = io(seg(t, a, b)) * 0.85 + seg(t, a, b) * 0.15;
  const p: V3 = [lerp(from.pos[0], to.pos[0], u) + nz(t, 1) * sway, lerp(from.pos[1], to.pos[1], u) + nz(t, 2) * sway, lerp(from.pos[2], to.pos[2], u)];
  return { pos: p, target: L3(from.target, to.target, u), fov: lerp(from.fov, to.fov, u), roll: lerp(from.roll ?? 0, to.roll ?? 0, u) };
};
/** The shot's camera move from `from` to `to` over the shot's own span. */
export const mv = (id: string, from: CamS, to: CamS, sway?: number) => (t: number) => { const [a, b] = span(id); return move(from, to, t, a, b, sway); };

// ---------------------------------------------------------------- the character (collider-aware)
/** Debug mode (review stills): parts inside colliders or other people render magenta. Set by Short07At({debug}). */
export const DEBUG = { on: false };
export type ActLike = { position: V3; yaw: number; walk?: Walk; pose?: Pose; seed?: number };
export type ChProps = {
  look: Look; a: ActLike; t: number; expr?: Expr; scale?: number; hold?: { R?: React.ReactNode; L?: React.ReactNode };
  /** lift above the floor (a jump) */
  lift?: number; blinkSeed?: number; still?: boolean;
  /** override the blink (0 open .. 1 shut); default natural blinks (none on "stare") */
  blink?: number;
  /** the set's solid things (Collide boxes) and the other people in the shot: checked by the audit and in debug mode */
  cs?: K.Box[]; others?: K.CharState[]; allow?: string[];
  /** skip the feet check (sitting/lying on something the colliders don't model as floor) */
  noFeet?: boolean;
};
/**
 * The ONE way a person goes into a Short 07 shot. Put <Ch/> elements DIRECTLY in the tree a scene returns (as children of
 * fragments/groups/set wrappers), never inside another component's render: tools/clipAudit07.tsx walks the returned tree
 * and checks every <Ch/> on every frame with its `cs` and `others`.
 */
export const Ch: React.FC<ChProps> = ({ look, a, t, expr = "smile", scale = 1, hold, lift = 0, blinkSeed = 0, still, blink, cs = [], others = [], allow = ["seat"], noFeet }) => {
  const position: V3 = [a.position[0], a.position[1] + lift, a.position[2]];
  let hits: ReturnType<typeof K.clipParts> | undefined;
  if (DEBUG.on) {
    const st: K.CharState = { position, yaw: a.yaw, scale, pose: a.pose, walk: a.walk };
    hits = K.clipParts(st, cs, others, 0.04 * scale, allow);
    if (!noFeet && lift === 0 && K.footGap(st, cs) < -0.12 * scale) { hits.legL = true; hits.legR = true; }
  }
  return <BlockChar look={look} scale={scale} position={position} yaw={a.yaw} walk={a.walk} hits={hits}
    pose={a.pose} seed={a.seed ?? blinkSeed} expr={expr} blink={blink ?? (expr === "stare" ? 0 : blinkCurve(t, blinkSeed))} hold={hold} still={still} />;
};
/** A CharState for `others` lists. */
export const st = (a: ActLike, scale = 1, lift = 0): K.CharState => ({ position: [a.position[0], a.position[1] + lift, a.position[2]], yaw: a.yaw, walk: a.walk, pose: a.pose, scale });
/** A blink that closes at time k, ~0.16 s. */
export const blinkOn = (t: number, k: number, len = 0.16) => { const u = (t - k) / len; return u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0; };

// ---------------------------------------------------------------- the jingle's note times (picture and sound share them)
/** The jingle: 8 notes a bar at JINGLE_BPM, note 6 of every bar is the WRONG NOTE (sound: episodes/07_icecream_truck/sfx07.py).
 *  Pictures sync to it with jingleAt(t0, t): the note index playing at t for a phrase that started at t0. */
export const JINGLE_NOTE = 0.19; // seconds per note (eighths at ~158 bpm)
export const WRONG_IN_BAR = 5;   // 0-based: the 6th note of each 8-note bar
export const jingleNote = (t: number, t0: number) => Math.floor((t - t0) / JINGLE_NOTE);
/** 0..1 pulse on each note onset (decays over a note). */
export const notePulse = (t: number, t0: number) => { if (t < t0) return 0; const u = ((t - t0) / JINGLE_NOTE) % 1; return Math.exp(-u * 5); };
/** True during the wrong note of a bar. */
export const isWrong = (t: number, t0: number) => t >= t0 && ((jingleNote(t, t0) % 8) + 8) % 8 === WRONG_IN_BAR;

export type { V3, CamS, Shot };

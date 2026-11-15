// Short 08 "The Invisible Elephant" (comedy): the shared pieces every shot file uses (cast, word anchors, the cut list, the
// collider-aware character, set wrappers, camera helpers). Plan: notes/cubefolks/STORY_TESTS_v2.md section B.
// EVERY time comes from at(beat, "word"). Never type a second.
//
// UNITS: RIG UNITS everywhere (an adult BlockChar at scale 1 is 5 tall). Sets: SchoolYard (Short 6 Town.tsx), Field
// (Props08), Corridor / OfficeDoor / Gym (blocky/SchoolHall.tsx).
// COMEDY RULE: every invisible pet's space stays EMPTY; the kids and adults supply all the movement (a leash never pulls on
// its own). The ELEPHANT RIDES sign stays hidden (covered) until beat 15.
import React from "react";
import TIMING from "./timing.json";
import { CamS, io, lerp, makeTiming, nz, seg, Shot, TimingJSON, V3 } from "../kit/core";
import { BlockChar, blinkCurve } from "../blocky/BlockRig";
import { BlockLights, Sky } from "../blocky/Look";
import * as K from "../blocky/Collide";
import type { Expr, Look, Pose, Walk } from "../blocky/types";

export const T = makeTiming(TIMING as TimingJSON);
export const { at, atE, P, PS, PE } = T;
export const END = T.END;

// ---------------------------------------------------------------- cast (our own designs)
const PALE = "#ece6dc", LIGHT = "#f0d0ae", WARM = "#c98e62", DEEP = "#7e5236";
/** ME (~10, the narrator): red-and-white striped shirt, jeans, brown spiky hair. */
export const ME: Look = { skin: LIGHT, shirt: "#d8403a", pants: "#3a5a8a", shirtPattern: "stripes", hair: "spiky", hairColor: "#6a4426" };
/** BRO (~7, small): oversized blue hoodie, backwards cap. The scammer. */
export const BRO: Look = { skin: LIGHT, shirt: "#3f7fd0", pants: "#2a2f3a", hair: "short", hairColor: "#6a4426", hat: "capBack", hatColor: "#f2c81e" };
/** COACH MILLER: red tracksuit, a whistle cord, a cap. */
export const COACH: Look = { skin: WARM, shirt: "#c8302a", pants: "#c8302a", hair: "short", hairColor: "#1a120c", hat: "cap", hatColor: "#1e3a6a", tie: "#d8d8d8" };
/** PRINCIPAL HAYES: navy blazer, grey bob, glasses. Out-scams everyone. */
export const HAYES: Look = { skin: PALE, shirt: "#1e2a4a", pants: "#1e2a4a", hair: "bob", hairColor: "#9a9a9e", glasses: true, tie: "#c8a03a" };
/** A teacher in the hallway jam (beat 6). */
export const TEACHER: Look = { skin: DEEP, shirt: "#8a6ab0", pants: "#2a2a30", hair: "bun", hairColor: "#1a120c", glasses: true };
/** Kids: popular avatar styles (our own). */
export const KIDS: Look[] = [
  { skin: PALE, shirt: "#f2c81e", pants: "#1c1c20", shirtPattern: "stripes", hair: "spiky", hairColor: "#f3d35a" },
  { skin: DEEP, shirt: "#e07a2e", pants: "#3a4a6a", hair: "ponytail", hairColor: "#3a2414" },
  { skin: LIGHT, shirt: "#7a4fb0", pants: "#2a2a34", hair: "long", hairColor: "#141014", acc: ["bow"], accColor: "#ef5b7a" },
  { skin: WARM, shirt: "#2f9a6a", pants: "#2a2f3a", hair: "short", hairColor: "#1a120c", hat: "capBack", hatColor: "#f2f2f2" },
  { skin: PALE, shirt: "#1d2230", pants: "#1d2230", hair: "emo", hairColor: "#141014", acc: ["headphones"], accColor: "#e2403a" },
  { skin: LIGHT, shirt: "#e9a3b8", pants: "#2c3a5a", hair: "bob", hairColor: "#c89a4a", glasses: true },
  { skin: DEEP, shirt: "#d6e86a", pants: "#1c1c22", hair: "short", hairColor: "#0e0a08", hat: "beanie", hatColor: "#2a2a34" },
  { skin: PALE, shirt: "#8fb8e8", pants: "#3a3f4a", hair: "ponytail", hairColor: "#b5612a" },
  { skin: WARM, shirt: "#f2efe6", pants: "#4a3a2a", hair: "spiky", hairColor: "#2a1a10", shirtPattern: "plaid" },
  { skin: LIGHT, shirt: "#5fc8c0", pants: "#2a2a34", hair: "long", hairColor: "#c8783a" },
  { skin: DEEP, shirt: "#c8302a", pants: "#1c1c22", hair: "short", hairColor: "#0e0a08", hat: "cap", hatColor: "#1c1c22" },
  { skin: PALE, shirt: "#9a6ad0", pants: "#3a3f4a", hair: "bun", hairColor: "#e8d27a" },
];
/** BlockChar scales (rig units). */
export const S = { adult: 1, kid: 0.82, bro: 0.68 } as const;
/** Height of the middle of the face above the feet for scale s. */
export const eyeY = (s: number) => 4.55 * s;

// ---------------------------------------------------------------- word anchors (all from the voice)
export const E = {
  // b1 An invisible elephant made my principal four hundred dollars in one lunch break.
  invisible1: at(1, "invisible"), elephant1: at(1, "elephant"), made1: at(1, "made"), principal1: at(1, "principal"), four: at(1, "four"), lunch1: at(1, "lunch"), break1: at(1, "break."),
  // b2 My little brother started it by selling invisible pets at school.
  brother2: at(2, "brother"), started: at(2, "started"), selling: at(2, "selling"), pets2: at(2, "pets"), school2: at(2, "school."),
  // b3 Five dollars got you a leash, an empty box, and a certificate.
  five: at(3, "Five"), leash3: at(3, "leash,"), empty3: at(3, "empty"), box3: at(3, "box,"), and3: at(3, "and"), certificate: at(3, "certificate."),
  // b4 Kids lined up anyway.
  kids4: at(4, "Kids"), lined: at(4, "lined"), anyway: at(4, "anyway."),
  // b5 Then Coach Miller climbed onto an invisible horse and rode straight into a real tree.
  coach: at(5, "Coach"), climbed: at(5, "climbed"), onto: at(5, "onto"), horse: at(5, "horse"), rode: at(5, "rode"), straight: at(5, "straight"), real: at(5, "real"), tree: at(5, "tree."),
  // b6 Soon kids were blocking the hallway to walk their invisible dogs.
  soon: at(6, "Soon"), blocking: at(6, "blocking"), hallway: at(6, "hallway"), walk6: at(6, "walk"), invisible6: at(6, "invisible"), dogs: at(6, "dogs."),
  // b7 That brought Principal Hayes over.
  brought: at(7, "brought"), principal7: at(7, "Principal"), hayes: at(7, "Hayes"), over: at(7, "over."),
  // b8 She only asked how much my brother had made.
  asked8: at(8, "asked"), how: at(8, "how"), much: at(8, "much"), brother8: at(8, "brother"), made8: at(8, "made."),
  // b9 Then she asked which pets were left.
  asked9: at(9, "asked"), which: at(9, "which"), pets9: at(9, "pets"), left: at(9, "left."),
  // b10 Next morning, I saw a giant bag of peanuts outside her office.
  morning: at(10, "morning,"), saw: at(10, "saw"), giant: at(10, "giant"), bag: at(10, "bag"), peanuts: at(10, "peanuts"), outside: at(10, "outside"), her10: at(10, "her"), office: at(10, "office."),
  // b11 My brother went in holding an empty leash.
  went: at(11, "went"), in11: at(11, "in"), holding11: at(11, "holding"), empty11: at(11, "empty"), leash11: at(11, "leash."),
  // b12 He came out holding fifty dollars.
  came: at(12, "came"), out12: at(12, "out"), holding12: at(12, "holding"), fifty: at(12, "fifty"), dollars12: at(12, "dollars."),
  // b13 At lunch, she opened the gym doors.
  lunch13: at(13, "lunch,"), opened: at(13, "opened"), gym: at(13, "gym"), doors: at(13, "doors."),
  // b14 Forty kids were waiting beside a tiny step stool.
  forty: at(14, "Forty"), waiting: at(14, "waiting"), beside: at(14, "beside"), tiny: at(14, "tiny"), stool: at(14, "stool."),
  // b15 She was selling elephant rides for ten dollars each.
  selling15: at(15, "selling"), elephant15: at(15, "elephant"), rides: at(15, "rides"), ten15: at(15, "ten"), each: at(15, "each."),
  // b16 My brother bought the first ticket.
  brother16: at(16, "brother"), bought: at(16, "bought"), first16: at(16, "first"), ticket: at(16, "ticket."),
  // b17 He paid with the money she'd just given him.
  paid: at(17, "paid"), money: at(17, "money"), just: at(17, "just"), given: at(17, "given"), him: at(17, "him."),
  // b18 That was the first ten dollars she made.
  first18: at(18, "first"), ten18: at(18, "ten"), made18: at(18, "made."),
};

// ---------------------------------------------------------------- the cut list (36 set-ups, about one a second)
const K6 = 0.06; // cuts land a hair before the word
export const CUTS: [string, number][] = [
  // b1 THE HOOK (frame 0): the gym, BRO "riding" the invisible elephant above the step stool, HAYES counting cash. $400 pop.
  ["s01_hook", 0],
  ["s02_cash", E.four - K6],              // her cash box, bills fanned, she licks a thumb and counts (close)
  // b2
  ["s03_yard", P(2)],                     // school yard: BRO behind his folding table, waving kids over
  ["s04_pets", E.selling - K6],           // BRO holds an empty leash up proudly: the collar is empty; kids lean in, squint
  // b3
  ["s05_sale", P(3)],                     // BRO hands a kid a leash and a box; the kid hands him $5
  ["s06_cert", E.and3 - K6],              // CLOSE: the certificate, gold star, "1 INVISIBLE DOG"
  // b4
  ["s07_line", P(4)],                     // drone over the yard: a long line of kids to the table
  // b5
  ["s08_mount", P(5)],                    // field: COACH MILLER hops up onto nothing, grips invisible reins
  ["s09_gallop", E.horse - K6],           // lead dolly: Coach gallops, slapping his own thigh
  ["s10_bonk", E.real - K6],              // BONK: straight into the tree, falls back, sits
  // b6
  ["s11_jam", P(6)],                      // corridor, high: kids with leashes clog the hallway, stopping to pet the air
  ["s12_teacher", E.hallway - K6],        // a teacher tries to squeeze past; kids hold their leashes up (shrug)
  ["s13_pet", E.invisible6 - K6],         // a kid kneels-ish (leans) and pets the empty air at the collar
  // b7
  ["s14_hayes", P(7)],                    // HAYES walks into the jam down the corridor, arms folded
  ["s15_freeze", E.hayes - K6],           // everyone freezes, leashes up
  // b8
  ["s16_lean", P(8)],                     // the yard table: HAYES leans over BRO's table
  ["s17_cashup", E.much - K6],            // BRO holds up his cash box, nervous grin
  // b9
  ["s18_list", P(9)],                     // CLUE: she runs a finger down the whole price list (ELEPHANT not crossed out), stroking her chin
  // b10
  ["s19_walkpast", P(10)],                // next morning, office corridor: ME walks past her door, stops
  ["s20_bag", E.giant - K6],              // CLUE: a giant bag of peanuts against the wall; ME's head snaps to it
  ["s21_bagwide", E.her10 - K6],          // wider: the bag beside the PRINCIPAL door, ME staring
  // b11
  ["s22_goesin", P(11)],                  // BRO walks in holding an empty leash HIGH (something tall is on it)
  ["s23_wince", E.empty11 - K6],          // ME winces
  // b12
  ["s24_comesout", P(12)],                // BRO walks out grinning, waving a fifty (ka-ching)
  // b13
  ["s25_doors", P(13)],                   // lunch: HAYES pushes the big gym doors open (creak)
  // b14
  ["s26_forty", P(14)],                   // inside, high: forty kids in a line beside a tiny step stool
  ["s27_stool", E.beside - K6],           // a kid steps up onto the stool, hesitates, looks around
  // b15 THE TWIST
  ["s28_sign", P(15)],                    // HAYES pulls the cloth off: ELEPHANT RIDES $10
  ["s29_ride", E.rides - K6],             // a kid "riding": sitting on air above the stool, bouncing, cheering
  ["s30_take10", E.ten15 - K6],           // close: her hand takes a $10 bill from the next kid
  // b16
  ["s31_front", P(16)],                   // BRO pushes to the front of the line, cash in hand
  ["s32_ticket", E.first16 - K6],         // she hands him ticket #1
  // b17
  ["s33_fifty", P(17)],                   // close: he pays with THE fifty; she gives him $40 change
  ["s34_climbs", E.just - K6],            // BRO climbs the stool, delighted
  // b18
  ["s35_smirk", P(18)],                   // HAYES smirks at the camera, pockets the $10 (question pop)
  ["s36_wide", E.ten18 - K6],             // wide high: BRO riding mid-gym, the line of 40 behind. Cuts into s01.
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
/** Debug mode (review stills): parts inside colliders or other people render magenta. Set by Short08At({debug}). */
export const DEBUG = { on: false };
export type ActLike = { position: V3; yaw: number; walk?: Walk; pose?: Pose; seed?: number };
export type ChProps = {
  look: Look; a: ActLike; t: number; expr?: Expr; scale?: number; hold?: { R?: React.ReactNode; L?: React.ReactNode };
  /** lift above the floor (a jump; or "riding" on air) */
  lift?: number; blinkSeed?: number; still?: boolean;
  /** override the blink (0 open .. 1 shut); default natural blinks (none on "stare") */
  blink?: number;
  /** the set's solid things (Collide boxes) and the other people in the shot: checked by the audit and in debug mode */
  cs?: K.Box[]; others?: K.CharState[]; allow?: string[];
  /** skip the feet check (sitting on a seat, riding on air) */
  noFeet?: boolean;
};
/**
 * The ONE way a person goes into a Short 08 shot. Put <Ch/> elements DIRECTLY in the tree a scene returns (children of
 * fragments/groups/set wrappers), never inside another component's render: audit08.tsx walks the returned tree and
 * checks every <Ch/> on every frame with its `cs` and `others`.
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

// ---------------------------------------------------------------- set wrappers (lights included)
/** Indoors (corridor, gym): warm school daylight; `focus` follows the subject so the key spot lands on faces. */
export const Indoor: React.FC<{ focus: V3; children?: React.ReactNode }> = ({ focus, children }) => <>
  <BlockLights time="interior" focus={focus} fill={1.1} />
  {children}
</>;
/** Outdoors (yard, field): soft bright day with the sky. */
export const Outdoor: React.FC<{ focus: V3; children?: React.ReactNode }> = ({ focus, children }) => <>
  <Sky time="day" />
  <BlockLights time="day" focus={focus} />
  {children}
</>;

// ---------------------------------------------------------------- the "riding" on air (comedy rule: the rider does it all)
/** A kid riding the invisible elephant: seated on AIR at `seatY` above the floor (high above the stool), legs straight out,
 *  both fists forward on invisible reins, bouncing in rhythm. Use with <Ch lift={...} noFeet/>: returns position y offset
 *  (lift) and the pose. The air is EMPTY: no saddle, no shape. */
export const ride = (t: number, t0: number, seatY = 3.4, s = S.kid, k = 1): { lift: number; pose: Pose } => {
  const b = Math.abs(Math.sin((t - t0) * 7.5));
  return {
    lift: (seatY - 1.5 * s + b * 0.35 * s) * k,
    pose: { legL: (Math.PI / 2) * k, legR: (Math.PI / 2) * k, armL: (1.25 + 0.15 * b) * k, armR: (1.25 + 0.15 * b) * k, armLOut: -0.12 * k, armROut: -0.12 * k, lean: (0.06 - 0.08 * b) * k, head: [0, -0.08 * b * k] },
  };
};

// ---------------------------------------------------------------- shared blocking (both shot files use these marks)
// THE YARD (SchoolYard, Short 6 Town.tsx: school wall at z = -20 facing +z, yard x -45..45, z -20..40).
/** BRO's folding table (customers' side faces +z); BRO stands behind it at z - 2.6. */
export const YARD_TABLE: V3 = [4, 0, 6];
export const BRO_AT_TABLE: V3 = [YARD_TABLE[0] - 0.8, 0, YARD_TABLE[2] - 2.7];
/** The customer's mark in front of the table, and the line of kids snaking back from it (front first). */
export const CUSTOMER: V3 = [YARD_TABLE[0] - 0.6, 0, YARD_TABLE[2] + 3.6];
export const YARD_LINE = (i: number): V3 => {
  const d = 4.4 * (i + 1), x0 = CUSTOMER[0], z0 = CUSTOMER[2];
  return d < 18 ? [x0, 0, z0 + d] : [x0 + (d - 18) * 0.9, 0, z0 + 18 + Math.sin((d - 18) / 6) * 3]; // straight, then it bends off
};
// THE FIELD (Props08 Field): Coach rides along -x from the right into the tree.
export const TREE_AT: V3 = [-6, 0, 0];
// THE CORRIDOR (SchoolHall: along z, office door in the right wall x = +8 at OFFICE_Z = -18).
// THE GYM (SchoolHall: doors at z = +28; bleachers along z = -28). The stool mid-court, the sign beside it, the ticket
// table, and the line of forty kids running from the stool toward the doors (two columns).
export const STOOL_AT: V3 = [0, 0, -4];
export const SIGN_AT: V3 = [-7.5, 0, -6];
export const TTABLE_AT: V3 = [5.5, 0, -2.5];
/** Where HAYES stands at the ticket table (behind it, facing +z) and where the next customer stands. */
export const HAYES_GYM: V3 = [5.5, 0, -5.4];
export const GYM_CUSTOMER: V3 = [4.0, 0, 0.6];
/** The gym line: kid i (0 = front), 2 columns of 20, from just behind the customer mark toward the doors. */
export const GYM_LINE = (i: number): V3 => { const col = i % 2, row = Math.floor(i / 2); return [2.4 + col * 3.6, 0, 4.2 + row * 2.9]; };
/** Riding height (seat on air) over the stool: well above it, an elephant's back. */
export const RIDE_Y = 3.2;

export type { V3, CamS, Shot };

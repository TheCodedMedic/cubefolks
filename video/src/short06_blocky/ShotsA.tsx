// Short 6, SHOTS-A: beats 1-7 (0 to P(8)). notes/short06/CONTRACT.md, section 6.
// The sample's grammar: a new picture about every 1-1.3 s, hard cuts, calm cameras (slow push, slight drift,
// over-the-shoulder, gentle sway), medium shots that show whole blocky bodies. Every time from at(beat, "word").
// Parts come from ./parts06 and are only touched inside functions (parts06 re-exports this file: no top-level use).
import React from "react";
import TIMING from "./timing.json";
import { CamS, io, lerp, makeTiming, nz, seg, Shot, TimingJSON, V3 } from "../kit/core";
import type { PopSpec } from "../kit/Pop";
import { DAD, ME, MOM, BRO, JENNY, CLASSMATES, SCALE, SCALE_U, eyeY, ADULT } from "./cast";
/** HOUSE is in metres: indoor offsets below are written in rig units and converted with u3()/ADULT. */
const u3 = (v: V3): V3 => [v[0] * ADULT, v[1] * ADULT, v[2] * ADULT];
import * as P6 from "./parts06";
import { POSTER_AT, STREET } from "./Town";
import type { Expr, Look, Pose } from "../blocky/types";
/** BlockLights for a shot (LOOK's times: day, morning, dusk, night, interior, interiorNight, bathroom). */
const Lights: React.FC<{ time: string; focus?: V3; practicalAt?: V3 }> = ({ time, focus, practicalAt }) =>
  <P6.BlockLights time={time as any} focus={focus} practicalAt={practicalAt} />;

const T = makeTiming(TIMING as TimingJSON);
const { at, atE, P } = T;

// ---------------- helpers ----------------
const c = (pos: V3, target: V3, fov: number): CamS => ({ pos, target, fov });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sc = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm2 = (a: V3): V3 => { const l = Math.hypot(a[0], a[2]) || 1; return [a[0] / l, 0, a[2] / l]; };
const yawTo = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]); // BlockChar faces +z at yaw 0
const L = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const side = (n: V3): V3 => [n[2], 0, -n[0]]; // n turned 90 degrees (right of someone facing -n)
/** A calm camera move between two framings over [a, b], with a gentle sway (the sample's handheld feel). */
const move = (from: CamS, to: CamS, t: number, a: number, b: number, sway = 0.006): CamS => {
  const u = io(seg(t, a, b)) * 0.85 + seg(t, a, b) * 0.15;
  const p: V3 = [lerp(from.pos[0], to.pos[0], u) + nz(t, 1) * sway, lerp(from.pos[1], to.pos[1], u) + nz(t, 2) * sway, lerp(from.pos[2], to.pos[2], u)];
  const g: V3 = [lerp(from.target[0], to.target[0], u), lerp(from.target[1], to.target[1], u), lerp(from.target[2], to.target[2], u)];
  return { pos: p, target: g, fov: lerp(from.fov, to.fov, u) };
};
/** A blink that closes at time k (0..1 squash), about 0.16 s long. */
const blinkOn = (t: number, k: number, len = 0.16) => { const u = (t - k) / len; return u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0; };
const anyBlink = (t: number, ks: number[], len?: number) => ks.reduce((m, k) => Math.max(m, blinkOn(t, k, len)), 0);
const idleBlink = (t: number, seed: number) => P6.blinkCurve(t, seed);

type CharP = { look: Look; s: number; at: V3; yaw: number; expr?: Expr; blink?: number; pose?: Pose; hold?: { R?: React.ReactNode; L?: React.ReactNode } };
const Ch: React.FC<CharP & { still?: boolean }> = ({ look, s, at: p, yaw, expr = "smile", blink = 0, pose = {}, hold, still }) => (
  <P6.BlockChar look={look} scale={s} position={p} yaw={yaw} expr={expr} blink={blink} pose={pose} hold={hold} still={still} />
);

// ---------------- bathroom geometry (from the HOUSE anchors; rig units, an adult is 5 tall) ----------------
/** The mirror plane: centre, normal into the room (towards the sink), and the sideways axis along the glass. */
const mirror = () => {
  const m = P6.MIRROR.center, n = norm2(sub(P6.SINK_FRONT, m));
  return { m, n, s: side(n) };
};
/** Spot on the floor in front of the mirror, `d` out from the glass, `x` along it. */
const bath = (x0: number, d0: number): V3 => { const { m, n, s } = mirror(), x = x0 * ADULT, d = d0 * ADULT; return [m[0] + n[0] * d + s[0] * x, 0, m[2] + n[2] * d + s[2] * x]; };
/** Mirror-local point: x along the glass, d out from it, y up. */
const ml = (x: number, d: number, y = 0): V3 => add(bath(x, d), [0, y * ADULT, 0]);
/** How far out from the glass people stand (SINK_FRONT's distance). */
const standD = () => { const { m, n } = mirror(), f = P6.SINK_FRONT; return ((f[0] - m[0]) * n[0] + (f[2] - m[2]) * n[2]) / ADULT; };
/** Reflect a world point in the mirror plane. */
const refl = (p: V3): V3 => { const { m, n } = mirror(); const d = (p[0] - m[0]) * n[0] + (p[2] - m[2]) * n[2]; return [p[0] - 2 * d * n[0], p[1], p[2] - 2 * d * n[2]]; };
const reflYaw = (yaw: number) => { const { n } = mirror(); const d: V3 = [Math.sin(yaw), 0, Math.cos(yaw)]; const k = d[0] * n[0] + d[2] * n[2]; return Math.atan2(d[0] - 2 * k * n[0], d[2] - 2 * k * n[2]); };
const mirrorPose = (q: Pose = {}): Pose => ({ ...q, armL: q.armR, armR: q.armL, armLOut: q.armROut, armROut: q.armLOut, legL: q.legR, legR: q.legL, head: q.head ? [-q.head[0], q.head[1]] : undefined });
/** The reflected copy of a character, for Bathroom's mirrorWorld (placed in world coordinates behind the glass). */
const Refl: React.FC<CharP> = (p) => <Ch {...p} at={refl(p.at)} yaw={reflYaw(p.yaw)} pose={mirrorPose(p.pose)} still />;
const faceMirror = (p: V3) => yawTo(p, add(p, sc(mirror().n, -1)));

const ME_AT = () => bath(0, standD());
const meHead = () => add(ME_AT(), [0, eyeY(SCALE.kid), 0]);
/** The hook camera: beside ME, between ME and the glass, so ME's real face AND its reflection both read in three-quarter. */
const HOOK_CAM = () => ml(9.3, 10, eyeY(SCALE_U.kid) + 0.6);
/** ME turns its face halfway between the camera and the camera's image, so both faces turn to us equally. */
const meYaw = () => { const h = meHead(), cp = HOOK_CAM(), d1 = norm2(sub(cp, h)), d2 = norm2(sub(refl(cp), h)); return Math.atan2(d1[0] + d2[0], d1[2] + d2[2]); };

/** ME at the bathroom mirror with a reflection. reflBlink drives the reflection's eyes on its own (the hook). */
const MirrorScene: React.FC<{ t: number; meBlink: number; reflBlink: number; meExpr: Expr; reflExpr?: Expr }> = ({ t, meBlink, reflBlink, meExpr, reflExpr }) => {
  const me: CharP = { look: ME, s: SCALE.kid, at: ME_AT(), yaw: meYaw(), expr: meExpr, blink: meBlink, pose: { head: [0, 0.03 + nz(t, 5) * 0.006] } };
  return <>
    <Lights time="bathroom" focus={ME_AT()} />
    <P6.Bathroom towel={1} mirrorWorld={<Refl {...me} expr={reflExpr ?? meExpr} blink={reflBlink} />} />
    <Ch {...me} />
  </>;
};

/** The family of four in a row at the mirror (DAD, ME, BRO, MOM). */
const FAMILY_ROW: [Look, number, number][] = [[DAD, -3.1, SCALE.adult], [ME, -1.0, SCALE.kid], [BRO, 0.75, SCALE.bro], [MOM, 2.7, SCALE.adult]];
const FamilyMirror: React.FC<{ t: number; blink: number; expr?: Expr; pov?: boolean }> = ({ t, blink, expr = "smile", pov }) => {
  const people: CharP[] = FAMILY_ROW.map(([look, x, s], i) => {
    const p = bath(x, standD() + (s < SCALE.adult ? -0.1 : 0.5)); return { look, s, at: p, yaw: faceMirror(p), expr, blink, pose: { head: [0, 0.03 + nz(t + i, i) * 0.01] } };
  });
  return <>
    <Lights time="bathroom" focus={bath(0, standD())} />
    <P6.Bathroom towel={1} mirrorWorld={pov ? null : <>{people.map((q, i) => <Refl key={i} {...q} />)}</>} />
    {people.map((q, i) => <Ch key={i} {...q} />)}
  </>;
};

// ---------------- moments (all from words) ----------------
export const EVA = {
  reflection: at(1, "reflection"), blinks1: at(1, "blinks"), before: at(1, "before"), you1: at(1, "you"), do1: at(1, "do,"),
  three1: at(1, "three"), left: atE(1, "left."),
  where: at(2, "where"), their: at(2, "Their"), beds: at(2, "beds"), shoes: at(2, "shoes"), door2: at(2, "door."),
  my3: at(3, "my"), stands: at(3, "stands"), and3: at(3, "and"), blinks3: at(3, "blinks"), together: at(3, "together."),
  jenny: at(4, "Jenny"), she4: at(4, "She"), recess: at(4, "recess,"), and4: at(4, "and"), laughed: at(4, "laughed,"), like: at(4, "like"),
  day5: at(5, "day"), her5: at(5, "her"), bike: at(5, "bike"), and5: at(5, "and"), dark: at(5, "dark."),
  i6: at(6, "I"), noticing: at(6, "noticing"), little: at(6, "little"),
  dad7: at(7, "dad"), shaving: at(7, "shaving"), with7: at(7, "with"), no7: at(7, "no"), mirror7: at(7, "mirror"),
};
const E = EVA;

// ---------------- cut list ----------------
const K = 0.06; // cuts land a hair before the word
const CUTS: [string, number][] = [
  ["a01_hook", 0],                       // b1: ME at the mirror, the reflection mid-blink, ME's eyes open
  ["a02_glass", E.reflection - K],       // the reflection alone, blinking on "blinks"
  ["a03_me", E.before - K],              // ME's real face: it blinks late, on "do"
  ["a04_wide", E.three1 - K],            // pull back: small kid, big mirror ("3 DAYS" pop)
  ["a05_street", P(2)],                  // b2: "Nobody knows": the quiet street, a house with an open door
  ["a06_room", E.where - K],             // "where those people go": an empty bedroom
  ["a07_bed", E.their - K],              // the bed, perfectly made
  ["a08_shoes", E.shoes - K],            // shoes still by the door
  ["a09_morning", P(3)],                 // b3: "So every morning": our house, morning
  ["a10_row", E.my3 - K],                // the family of four at the mirror
  ["a11_faces", E.stands - K],           // from the mirror: four faces
  ["a12_blink", E.and3 - K],             // all four blink together
  ["a13_next", P(4)],                    // b4: "Last week": Jenny's house next door
  ["a14_jenny", E.jenny - K],            // Jenny on her lawn with her bike
  ["a15_recess", E.she4 - K],            // the school yard at recess, Jenny tells ME
  ["a16_laugh", E.and4 - K],             // Jenny laughs
  ["a17_me", E.like - K],                // ME doesn't
  ["a18_day3", P(5)],                    // b5: "On day three": dusk, Jenny's house
  ["a19_bike", E.her5 - K],              // the bike still on the lawn
  ["a20_dark", E.and5 - K],              // her house dark, every other window lit
  ["a21_poster", P(6)],                  // b6: a MISSING poster on a pole
  ["a22_look", E.i6 - K],                // ME on the street, looking around
  ["a23_things", E.little - K],          // ME's eyes shift: little things
  ["a24_kitchen", P(7)],                 // b7: dad at the kitchen sink by the window
  ["a25_shave", E.shaving - K],          // dad shaving, close
  ["a26_nomirror", E.with7 - K],         // the wall above the sink: a window, no mirror; ME watching
];
export const END_A = P(8);
const span = (id: string): [number, number] => { const i = CUTS.findIndex((x) => x[0] === id); return [CUTS[i][1], i + 1 < CUTS.length ? CUTS[i + 1][1] : END_A]; };
const mk = (id: string, s: Omit<Shot, "id" | "t0" | "t1">): Shot => { const [t0, t1] = span(id); return { enter: "cut", ...s, id, t0, t1 }; };
const mv = (id: string, from: CamS, to: CamS, sway?: number) => (t: number) => { const [a, b] = span(id); return move(from, to, t, a, b, sway); };
// ---------------- street helpers (TOWN: the street runs along x, houses face +z; lawn z 8..30, sidewalk z ~32.5, road z ~49) ----------------
const Street: React.FC<{ time: "day" | "morning" | "dusk" | "night"; focus?: V3; jennyDark?: boolean; bike?: boolean; poster?: boolean; children?: React.ReactNode }> =
  ({ time, focus, children, ...o }) => <>
  <P6.Sky time={time} />
  <Lights time={time} focus={focus} />
  <P6.MyStreet time={time} {...o} />
  {children}
</>;
const W = (x: number, y: number, z: number): V3 => [x, y, z];
const LOT_HOME = () => P6.HOME[0] + 3, LOT_J = () => P6.JENNY_HOUSE[0] - 3; // lot centres (x)
const SW = () => STREET.sidewalkZ, SWY = () => STREET.sidewalkY;

// ---------------- the shots ----------------
const my = () => mirror().m[1] / ADULT; // mirror centre height
const SHOTS: Shot[] = [
  // (1) THE HOOK, frame 0: beside the mirror, ME's real face on one side and its reflection on the other, both in
  // three-quarter; the reflection's eyes are already shut while ME's are wide open. It opens slowly, staring.
  mk("a01_hook", {
    scene: (t) => <MirrorScene t={t} meExpr="worried" meBlink={0} reflExpr="blank" reflBlink={t < 0.2 ? 1 : 1 - io(seg(t, 0.2, 0.55))} />,
    cam: (t) => { const h = meHead(), r = refl(h), C = HOOK_CAM();
      const g: V3 = [lerp(h[0], r[0], 0.5), h[1] - 0.1, lerp(h[2], r[2], 0.5)];
      return mv("a01_hook", c(C, g, 34), c(L(C, g, 0.06), g, 33), 0.004)(t); },
  }),
  // (2) the reflection, closer: it blinks on "blinks"
  mk("a02_glass", {
    scene: (t) => <MirrorScene t={t} meExpr="worried" meBlink={0} reflExpr="blank" reflBlink={blinkOn(t, E.blinks1 + 0.04, 0.2)} />,
    cam: (t) => { const r = add(refl(meHead()), u3([0, -0.1, 0])), C = HOOK_CAM();
      return mv("a02_glass", c(L(C, r, 0.42), r, 32), c(L(C, r, 0.47), r, 31), 0.004)(t); },
  }),
  // (3) ME's real face, close: eyes wide; ME blinks late, on "do"
  mk("a03_me", {
    scene: (t) => <MirrorScene t={t} meExpr="worried" meBlink={blinkOn(t, E.do1 + 0.02)} reflExpr="blank" reflBlink={0} />,
    cam: (t) => { const h = add(meHead(), u3([0, -0.1, 0])), C = HOOK_CAM();
      return mv("a03_me", c(L(C, h, 0.4), h, 34), c(L(C, h, 0.45), h, 33), 0.004)(t); },
  }),
  // (4) wide: the bathroom, ME small at the sink, the big mirror ("3 DAYS" pops)
  mk("a04_wide", {
    scene: (t) => <MirrorScene t={t} meExpr="scared" meBlink={0} reflExpr="blank" reflBlink={0} />,
    cam: (t) => { const g = ml(0, 0, my() - 1.2);
      return mv("a04_wide", c(ml(3.2, standD() + 7, 5.6), g, 50), c(ml(2.7, standD() + 6.2, 5.4), g, 48))(t); },
  }),

  // ---- b2 ----
  // (5) "Nobody knows": the quiet morning street, nobody out
  mk("a05_street", {
    scene: () => <Street time="morning" focus={W(LOT_HOME(), 0, 20)} />,
    cam: (t) => { const x = LOT_HOME();
      return mv("a05_street", c(W(x - 26, 5.5, 47), W(x + 10, 6, 12), 46), c(W(x - 23.5, 5.4, 45), W(x + 10, 6, 12), 45))(t); },
  }),
  // (6) "where those people go": an empty bedroom, the bed made
  mk("a06_room", {
    scene: () => <Room />,
    cam: (t) => { const b = P6.BED;
      return mv("a06_room", c(add(b, u3([8, 5, 10.5])), add(b, u3([-0.5, 1.6, 0])), 50), c(add(b, u3([7, 4.8, 9.4])), add(b, u3([-0.5, 1.6, 0])), 48))(t); },
  }),
  // (7) the bed, perfectly made: slow push along it
  mk("a07_bed", {
    scene: () => <Room />,
    cam: (t) => { const b = P6.BED;
      return mv("a07_bed", c(add(b, u3([9, 5.2, 6.5])), add(b, u3([-0.6, 1.3, -0.4])), 42), c(add(b, u3([8.2, 5, 5.9])), add(b, u3([-0.6, 1.3, -0.4])), 41))(t); },
  }),
  // (8) shoes still by the door: low, close
  mk("a08_shoes", {
    scene: () => <Room />,
    cam: (t) => { const d = shoesAt();
      return mv("a08_shoes", c(add(d, u3([-5.5, 3.2, 5.5])), add(d, u3([0, 1.4, 0])), 40), c(add(d, u3([-4.9, 3.0, 4.9])), add(d, u3([0, 1.4, 0])), 39))(t); },
  }),

  // ---- b3 ----
  // (9) "So every morning": our house in the morning light, from across the sidewalk
  mk("a09_morning", {
    scene: () => <Street time="morning" focus={P6.HOME} />,
    cam: (t) => { const x = LOT_HOME();
      return mv("a09_morning", c(W(x + 7, 4.2, 42), W(x - 1, 9, 4), 50), c(W(x + 6, 4.4, 38.5), W(x - 1, 9.4, 4), 50))(t); },
  }),
  // (10) "my whole family": all four at the mirror from behind and to the side, every face in the glass
  mk("a10_row", {
    scene: (t) => <FamilyMirror t={t} blink={0} />,
    cam: (t) => { const g = ml(0, 1.2, my() - 1.6);
      return mv("a10_row", c(ml(3.5, standD() + 13.5, my() + 0.6), g, 44), c(ml(3.0, standD() + 12.6, my() + 0.5), g, 43))(t); },
  }),
  // (11) "stands at the bathroom mirror": the mirror's point of view, four faces in a row, smiling
  mk("a11_faces", {
    scene: (t) => <FamilyMirror t={t} blink={0} />,
    cam: (t) => { const g = ml(0.2, -standD() - 0.4, eyeY(SCALE_U.adult) - 0.6);
      return mv("a11_faces", c(ml(1.0, standD() + 11, 7.8), g, 34), c(ml(0.8, standD() + 10.3, 7.7), g, 33))(t); },
  }),
  // (12) "and blinks together": high behind them into the glass, closer on ME and BRO's reflections; all four blink at once
  mk("a12_blink", {
    scene: (t) => <FamilyMirror t={t} blink={blinkOn(t, E.blinks3 + 0.03, 0.2)} />,
    cam: (t) => { const g = ml(0.6, -standD() - 0.4, eyeY(SCALE_U.adult) - 0.7);
      return mv("a12_blink", c(ml(-2.2, standD() + 11.5, 7.9), g, 33), c(ml(-2.0, standD() + 10.8, 7.8), g, 32))(t); },
  }),

  // ---- b4 ----
  // (13) "Last week, it was": Jenny's house next door, a sunny day
  mk("a13_next", {
    scene: () => <Street time="day" focus={W(LOT_J(), 0, 18)} />,
    cam: (t) => { const x = LOT_J();
      return mv("a13_next", c(W(x - 12, 6.8, 43), W(x + 2, 8.5, 4), 48), c(W(x - 10.5, 6.8, 40.5), W(x + 2, 8.5, 4), 47))(t); },
  }),
  // (14) "Jenny from next door": Jenny on her lawn beside her red bike, waving
  mk("a14_jenny", {
    scene: (t) => { const j = JENNY_AT();
      return <Street time="day" focus={j}>
        <P6.Bike position={add(j, [3.2, 0, -4.5])} yaw={0.25} lying={false} />
        <Ch look={JENNY} s={SCALE_U.kid} at={j} yaw={yawTo(j, add(j, [-11, 0, 7]))} expr="happy" blink={0} pose={{ ...P6.wavePose(t, io(seg(t, E.jenny, E.jenny + 0.25))), armROut: 0.45 }} />
      </Street>; },
    cam: (t) => { const j = JENNY_AT(), g = add(j, [-1.8, 2.7, 0]);
      return mv("a14_jenny", c(add(j, [-11, 3.8, 7]), g, 42), c(add(j, [-10, 3.75, 6.4]), g, 41))(t); },
  }),
  // (15) "She told me at recess": the school yard, Jenny talking to ME, kids playing behind
  mk("a15_recess", {
    scene: (t) => <Yard t={t} jennyExpr="grin" meExpr="smile" />,
    cam: (t) => { const y = P6.YARD_SPOT, g = add(y, [0, 2.8, 0]);
      return mv("a15_recess", c(add(y, [8, 4.3, 14]), g, 42), c(add(y, [7, 4.2, 12.4]), g, 41))(t); },
  }),
  // (16) "and she laughed": Jenny laughing, close (over ME's shoulder, from the side)
  mk("a16_laugh", {
    scene: (t) => <Yard t={t} jennyExpr="happy" meExpr="worried" laugh />,
    cam: (t) => { const h = add(YJ(), [0, eyeY(SCALE_U.kid) - 0.25, 0]);
      return mv("a16_laugh", c(add(h, [4.8, 0.2, 7.6]), add(h, [0.15, -1.0, 0]), 36), c(add(h, [4.4, 0.2, 7.0]), add(h, [0.15, -1.0, 0]), 35))(t); },
  }),
  // (17) "like it was a joke": ME doesn't laugh
  mk("a17_me", {
    scene: (t) => <Yard t={t} jennyExpr="happy" meExpr="worried" laugh />,
    cam: (t) => { const h = add(YM(), [0, eyeY(SCALE_U.kid) - 0.25, 0]);
      return mv("a17_me", c(add(h, [-5.2, 0.3, 7.2]), add(h, [-0.15, -1.0, 0]), 36), c(add(h, [-4.8, 0.3, 6.6]), add(h, [-0.15, -1.0, 0]), 35))(t); },
  }),

  // ---- b5 ----
  // (18) "On day three": dusk, Jenny's house, the bike already lying on the lawn
  mk("a18_day3", {
    scene: () => <Street time="dusk" focus={W(LOT_J(), 0, 18)} bike />,
    cam: (t) => { const x = LOT_J();
      return mv("a18_day3", c(W(x + 14, 4.8, 45), W(x - 1, 8, 6), 48), c(W(x + 12.5, 4.8, 42.5), W(x - 1, 8, 6), 47))(t); },
  }),
  // (19) "her bike was still on the lawn": the red bike lying in the grass, low and close
  mk("a19_bike", {
    scene: () => <NightStreet />,
    cam: (t) => { const b = P6.JENNY_LAWN;
      return mv("a19_bike", c(add(b, [7.5, 4.2, 6.8]), add(b, [-1.5, 2.2, -3]), 42), c(add(b, [6.9, 4.0, 6.3]), add(b, [-1.5, 2.2, -3]), 41))(t); },
    dom: () => <P6.GradeDom time="night" />,
  }),
  // (20) "and her house was dark": wide from across the road, every other window lit, hers black
  mk("a20_dark", {
    scene: () => <NightStreet />,
    cam: (t) => { const x = LOT_J();
      return mv("a20_dark", c(W(x - 14, 6.5, 70), W(x - 12, 8, 8), 56), c(W(x - 13, 6.4, 67), W(x - 12, 8, 8), 55))(t); },
    dom: () => <P6.GradeDom time="night" />,
  }),

  // ---- b6 ----
  // (21) "After that": a MISSING poster on a pole, Jenny's face on it
  mk("a21_poster", {
    scene: () => <Street time="day" focus={POSTER_AT} poster />,
    cam: (t) => { const p = POSTER_AT, g = add(p, [0, 5.5, 0.5]);
      return mv("a21_poster", c(add(p, [1.5, 5.8, 6.5]), g, 38), c(add(p, [1.2, 5.75, 5.4]), g, 37))(t); },
  }),
  // (22) "I started noticing": ME on the sidewalk by the poster, looking around warily (head left, then right)
  mk("a22_look", {
    scene: (t) => { const p = ME_WALK(); const [a] = span("a22_look");
      const hy = lerp(0, 0.55, io(seg(t, a + 0.05, a + 0.3))) - lerp(0, 1.05, io(seg(t, a + 0.36, a + 0.62)));
      return <Street time="day" focus={p} poster>
        <Ch look={ME} s={SCALE_U.kid} at={p} yaw={0.35} expr="worried" blink={0} pose={{ head: [hy, 0.02] }} /></Street>; },
    cam: (t) => { const p = ME_WALK(), g = add(p, [0.6, 2.7, 0]);
      return mv("a22_look", c(add(p, [3.5, 3.8, 12]), g, 40), c(add(p, [3.0, 3.7, 10.5]), g, 39))(t); },
  }),
  // (23) "little things": closer on ME, eyes shifting
  mk("a23_things", {
    scene: (t) => { const p = ME_WALK(); const [a, b] = span("a23_things");
      const hy = lerp(-0.45, 0.35, io(seg(t, a + 0.1, b - 0.2)));
      return <Street time="day" focus={p} poster>
        <Ch look={ME} s={SCALE_U.kid} at={p} yaw={0.35} expr="worried" blink={blinkOn(t, a + 0.12)} pose={{ head: [hy, -0.02] }} /></Street>; },
    cam: (t) => { const h = add(ME_WALK(), [0, eyeY(SCALE_U.kid) - 0.2, 0]);
      return mv("a23_things", c(add(h, [3.0, 1.2, 7.4]), add(h, [0.1, -0.9, 0]), 34), c(add(h, [2.7, 1.15, 6.8]), add(h, [0.1, -0.9, 0]), 33))(t); },
  }),

  // ---- b7 ----
  // (24) "My dad started": the kitchen, dad at the sink by the window
  mk("a24_kitchen", {
    scene: (t) => <KitchenScene t={t} />,
    cam: (t) => { const k = dadAt();
      return mv("a24_kitchen", c(add(k, u3([-9, 5, 5])), add(k, u3([0, 3.2, 0])), 44), c(add(k, u3([-8.2, 4.9, 4.6])), add(k, u3([0, 3.2, 0])), 43))(t); },
  }),
  // (25) "shaving in the kitchen": dad close, razor at his cheek, smiling at nothing (no mirror)
  mk("a25_shave", {
    scene: (t) => <KitchenScene t={t} />,
    cam: (t) => { const h = add(dadAt(), u3([0, eyeY(SCALE_U.adult) - 0.2, 0]));
      return mv("a25_shave", c(add(h, u3([-6.2, 0.2, 2.4])), add(h, u3([0, -0.9, 0])), 36), c(add(h, u3([-5.7, 0.2, 2.2])), add(h, u3([0, -0.9, 0])), 35))(t); },
  }),
  // (26) "with no mirror at all": ME in the doorway watching dad
  mk("a26_nomirror", {
    scene: (t) => <KitchenScene t={t} meWatching />,
    cam: (t) => { const h = add(meKitchen(), u3([0, eyeY(SCALE_U.kid) - 0.3, 0]));
      return mv("a26_nomirror", c(add(h, u3([7.5, 0.6, -4.2])), add(h, u3([0, -0.9, 0])), 36), c(add(h, u3([7.0, 0.6, -3.9])), add(h, u3([0, -0.9, 0])), 35))(t); },
  }),
];

// ---------------- scene pieces ----------------
const Room: React.FC = () => <><Lights time="interior" focus={P6.BED} /><P6.Bedroom /></>;
/** Shoes by the bedroom door: HOUSE's Bedroom draws them; this is where the camera looks. */
const shoesAt = (): V3 => P6.SHOE_SPOT;
const JENNY_AT = (): V3 => W(LOT_J() - 3, 0, 24);
const ME_WALK = (): V3 => W(POSTER_AT[0] - 5, SWY(), SW());
const YJ = (): V3 => add(P6.YARD_SPOT, [-1.5, 0, 0]), YM = (): V3 => add(P6.YARD_SPOT, [1.5, 0, 0]);

const Yard: React.FC<{ t: number; jennyExpr: Expr; meExpr: Expr; laugh?: boolean }> = ({ t, jennyExpr, meExpr, laugh }) => {
  const y = P6.YARD_SPOT, j = YJ(), m = YM();
  const lg = laugh ? Math.abs(Math.sin(t * 13)) : 0;
  const kids: [number, V3, number][] = [[0, [-8, 0, -10], 0.6], [1, [9, 0, -14], -0.8], [2, [-14, 0, -19], 0.3], [3, [4, 0, -24], 2.6]];
  return <>
    <P6.Sky time="day" /><Lights time="day" focus={y} />
    <P6.SchoolYard />
    <Ch look={JENNY} s={SCALE_U.kid} at={j} yaw={1.05} expr={jennyExpr} blink={laugh ? 0 : idleBlink(t, 3)}
      pose={{ lean: -0.08 * lg, head: [0.2, -0.12 * lg], armL: 0.25 + 0.15 * lg, armR: 0.25 + 0.15 * lg }} />
    <Ch look={ME} s={SCALE_U.kid} at={m} yaw={-1.15} expr={meExpr} blink={idleBlink(t, 7)} pose={{ head: [-0.15, 0.05] }} />
    {kids.map(([i, o, yaw]) => <Ch key={i} look={CLASSMATES[i]} s={SCALE_U.kid} at={add(y, o)} yaw={yaw} expr={i % 2 ? "grin" : "smile"}
      blink={idleBlink(t, i)} pose={{ armL: 0.4 * Math.sin(t * 6 + i), armR: -0.4 * Math.sin(t * 6 + i), legL: 0.3 * Math.sin(t * 6 + i), legR: -0.3 * Math.sin(t * 6 + i) }} />)}
  </>;
};

const NightStreet: React.FC = () => <>
  <P6.Sky time="night" /><Lights time="night" focus={W(LOT_J(), 0, 18)} practicalAt={W(LOT_HOME(), 7, 14)} />
  <P6.JennyHouseDark />
</>;

const dadAt = (): V3 => P6.KITCHEN_SINK;
const meKitchen = (): V3 => add(P6.KITCHEN_SINK, u3([-5, 0, 7]));
const KitchenScene: React.FC<{ t: number; meWatching?: boolean }> = ({ t, meWatching }) => {
  const d = dadAt(), stroke = Math.sin(t * 7) * 0.08;
  const shave: Pose = { ...P6.POSES.shave, armR: (P6.POSES.shave.armR ?? 2.05) + stroke };
  return <>
    <Lights time="morning" focus={d} />
    <P6.Kitchen />
    <Ch look={DAD} s={SCALE.adult} at={d} yaw={Math.PI + 1.2} expr="smile" blink={idleBlink(t, 11)} pose={shave} hold={{ R: <P6.Razor /> }} />
    {meWatching && <Ch look={ME} s={SCALE.kid} at={meKitchen()} yaw={yawTo(meKitchen(), d)} expr="worried" blink={0} pose={{ head: [0, 0.02] }} />}
  </>;
};

export const SHOTS_A: Shot[] = SHOTS;
/** Cut list for SOUND (cuts_a.json is written from this). */
export const CUTS_A = SHOTS.map((s) => ({ id: s.id, t0: s.t0, enter: s.enter ?? "cut" }));
/** Pops SHOTS-A suggests for the integrator's POPS06 (all from words). */
export const POPS_A: PopSpec[] = [
  { kind: "word", text: "BLINK", t0: E.blinks3, t1: E.blinks3 + (E.together - E.blinks3) * 2.2, x: 0.5, y: 0.2, size: 0.8, rot: 3, color: "#ffffff", color2: "#2a2f45" },
  { kind: "calendar", text: "3", sub: "DAY", t0: E.day5, t1: E.her5 - K, x: 0.5, y: 0.22, size: 0.85, rot: -3, color2: "#7a1d1d" },
];

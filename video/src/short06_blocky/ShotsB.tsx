// Short 6 "The Reflection That Blinks First": SHOTS-B, beats 8-14 (P(8) to END), notes/short06/CONTRACT.md section 7.
// Mom covers the mirrors (b8), dinner and the spoon (b9), the towel comes off at night (b10), the family in the doorway (b11),
// THE REVEAL: the mirror shows ME alone while the real doorway is full (b12), their faces go "stare" (b13), and the morning the
// reflection blinks first (b14), whose last frame lands exactly on SHOTS-A's frame 0 (the loop).
// Sets are in metres (cast.ts SCALE). Calm cameras, hard cuts, one set-up every ~1 s.
// Never type a second: every cut, pose, blink and towel move comes from at(beat, "word").
// parts06 re-exports this file, so parts are only touched inside functions (no top-level use of P6.*).
import React from "react";
import { AbsoluteFill } from "remotion";
import TIMING from "./timing.json";
import { CamS, io, lerp, makeTiming, nz, seg, Shot, TimingJSON, V3 } from "../kit/core";
import { DAD, ME, ME_PJ, MOM, BRO, SCALE, eyeY } from "./cast";
import * as P6 from "./parts06";
import type { Expr, Look, Pose } from "../blocky/types";
import { blendPose } from "../blocky/BlockRig";

const T = makeTiming(TIMING as TimingJSON);
const { at, atE, P, END } = T;

// ---------------- moments (all from words) ----------------
export const EVB = {
  every: at(8, "every"), with8: at(8, "with"), she: at(8, "She"), dust: at(8, "dust."),
  my9: at(9, "my"), look9: at(9, "look"), spoon: at(9, "spoon."),
  pulled: at(10, "pulled"), towel: at(10, "towel"), off: at(10, "off"), bathroom: at(10, "bathroom"), mirror10: atE(10, "mirror."),
  came: at(11, "came"), doorway: at(11, "doorway"), behind: at(11, "behind"),
  was12: at(12, "was"), alone: at(12, "alone."),
  never: at(13, "never"), with13: at(13, "with"), they2: at(13, "They", 2), blink13: at(13, "blink."),
  for14: at(14, "for"), my14: at(14, "my"), reflection: at(14, "reflection"), blinked: at(14, "blinked"), first2: at(14, "first", 2),
};
const E = EVB;

// ---------------- small vector helpers (same as SHOTS-A) ----------------
const c = (pos: V3, target: V3, fov: number): CamS => ({ pos, target, fov });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sc = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const norm2 = (a: V3): V3 => { const l = Math.hypot(a[0], a[2]) || 1; return [a[0] / l, 0, a[2] / l]; };
const yawTo = (from: V3, to: V3) => Math.atan2(to[0] - from[0], to[2] - from[2]);
const L = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const side = (n: V3): V3 => [n[2], 0, -n[0]];
const up = (p: V3, y: number): V3 => [p[0], y, p[2]];
/** A calm camera move between two framings, with a gentle handheld sway (the sample's feel). */
const move = (from: CamS, to: CamS, t: number, a: number, b: number, sway = 0.006): CamS => {
  const u = io(seg(t, a, b)) * 0.85 + seg(t, a, b) * 0.15;
  const p: V3 = [lerp(from.pos[0], to.pos[0], u) + nz(t, 1) * sway, lerp(from.pos[1], to.pos[1], u) + nz(t, 2) * sway, lerp(from.pos[2], to.pos[2], u)];
  return { pos: p, target: L(from.target, to.target, u), fov: lerp(from.fov, to.fov, u) };
};
const blinkOn = (t: number, k: number, len = 0.16) => { const u = (t - k) / len; return u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0; };

// ---------------- people ----------------
type CharP = { look: Look; s: number; at: V3; yaw: number; expr?: Expr; blink?: number; pose?: Pose; walk?: { phase: number; amount: number }; hold?: { R?: React.ReactNode; L?: React.ReactNode } };
const Ch: React.FC<CharP> = ({ look, s, at: p, yaw, expr = "smile", blink = 0, pose = {}, walk, hold }) => (
  <P6.BlockChar look={look} scale={s} position={p} yaw={yaw} expr={expr} blink={blink} pose={pose} walk={walk} {...({ hold } as any)} />
);

// ---------------- bathroom geometry (HOUSE anchors; identical to SHOTS-A so the loop matches) ----------------
const mirror = () => { const m = P6.MIRROR.center, n = norm2(sub(P6.SINK_FRONT, m)); return { m, n, s: side(n) }; };
/** Floor spot `d` m out from the glass, `x` m along it. */
const bath = (x: number, d: number): V3 => { const { m, n, s } = mirror(); return [m[0] + n[0] * d + s[0] * x, 0, m[2] + n[2] * d + s[2] * x]; };
const ml = (x: number, d: number, y = 0): V3 => add(bath(x, d), [0, y, 0]);
/** Bathroom point as (x along the glass, y up, z out from the glass). */
const W = (x: number, y: number, z: number): V3 => ml(x, z, y);
/** Mirror-local coordinates of a world point: [x along the glass, d out from it]. */
const local = (p: V3): [number, number] => { const { m, n, s } = mirror(); const v = sub(p, m); return [v[0] * s[0] + v[2] * s[2], v[0] * n[0] + v[2] * n[2]]; };
const refl = (p: V3): V3 => { const { m, n } = mirror(); const d = (p[0] - m[0]) * n[0] + (p[2] - m[2]) * n[2]; return [p[0] - 2 * d * n[0], p[1], p[2] - 2 * d * n[2]]; };
const reflYaw = (yaw: number) => { const { n } = mirror(); const d: V3 = [Math.sin(yaw), 0, Math.cos(yaw)]; const k = d[0] * n[0] + d[2] * n[2]; return Math.atan2(d[0] - 2 * k * n[0], d[2] - 2 * k * n[2]); };
const mirrorPose = (q: Pose = {}): Pose => ({ ...q, armL: q.armR, armR: q.armL, armLOut: q.armROut, armROut: q.armLOut, legL: q.legR, legR: q.legL, head: q.head ? [-q.head[0], q.head[1]] : undefined });
const Refl: React.FC<CharP> = (p) => <Ch {...p} at={refl(p.at)} yaw={reflYaw(p.yaw)} pose={mirrorPose(p.pose)} />;
const faceMirror = (p: V3) => yawTo(p, add(p, sc(mirror().n, -1)));

const ME_AT = () => bath(0, 0.5);
const meHead = () => add(ME_AT(), [0, eyeY(SCALE.kid), 0]);
/** SHOTS-A's hook camera (frame 0). */
const HOOK_CAM = () => ml(1.35, 0.9, eyeY(SCALE.kid) + 0.04);
const meYaw = () => { const h = meHead(), cpos = HOOK_CAM(), d1 = norm2(sub(cpos, h)), d2 = norm2(sub(refl(cpos), h)); return Math.atan2(d1[0] + d2[0], d1[2] + d2[2]); };
/** Frame 0's camera at t = 0 (a01_hook's first framing). */
const hookFrame0 = (): CamS => { const h = meHead(), r = refl(h); return c(HOOK_CAM(), [lerp(h[0], r[0], 0.5), h[1] - 0.04, lerp(h[2], r[2], 0.5)], 50); };

/** The doorway: the floor spot in the real doorway, mirror-local. */
const doorLocal = () => local(P6.DOORWAY);
/** Where each of the family stands in the doorway (0 dad, 1 mom, 2 bro), `k` 0..1 stepping in from the hall. */
const famSpot = (i: number, k = 1): V3 => {
  const [dx, dd] = doorLocal();
  const off = [[-1.0, 0.03], [0.8, 0.03], [0.5, -0.33]][i];
  return bath(dx + off[0], lerp(dd + 1.3, dd + off[1], k));
};
const famHead = (i: number) => add(famSpot(i), [0, eyeY(i === 2 ? SCALE.bro : SCALE.adult), 0]);
const doorHead = (): V3 => { const a = famHead(0), b = famHead(1); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.2, (a[2] + b[2]) / 2]; };

const Family: React.FC<{ t: number; k?: number; stare?: number }> = ({ t, k = 1, stare }) => {
  const st = stare !== undefined && t >= stare;
  const walking = k > 0.02 && k < 0.98;
  const ex: Expr = st ? "stare" : "smile";
  const who: [Look, number][] = [[DAD, SCALE.adult], [MOM, SCALE.adult], [BRO, SCALE.bro]];
  return <>{who.map(([look, s], i) => {
    const p = famSpot(i, k);
    return <Ch key={i} look={look} s={s} at={p} yaw={faceMirror(p)} expr={ex} blink={st ? 0 : P6.blinkCurve(t, i + 1)}
      walk={walking ? { phase: t * 9 + i, amount: 0.7 } : undefined} pose={{ head: [0, 0.04] }} />;
  })}</>;
};

type BathOpts = {
  time: "bathroom" | "interiorNight" | "morning"; towel?: number; look?: Look;
  expr?: Expr; blink?: number; pose?: Pose; rExpr?: Expr; rBlink?: number; rPose?: Pose; meYawOff?: number;
  family?: { k?: number; stare?: number }; me?: boolean;
};
/** The bathroom with ME at the sink. The mirror shows ME alone, never the family (that is the whole story). */
const Bath: React.FC<{ t: number; o: BathOpts; extra?: React.ReactNode }> = ({ t, o, extra }) => {
  const me: CharP = { look: o.look ?? ME_PJ, s: SCALE.kid, at: ME_AT(), yaw: meYaw() + (o.meYawOff ?? 0), expr: o.expr ?? "worried", blink: o.blink ?? 0,
    pose: { head: [0, 0.03 + nz(t, 5) * 0.006], lean: 0.06, ...(o.pose ?? {}) } };
  const r: CharP = { ...me, expr: o.rExpr ?? me.expr, blink: o.rBlink ?? me.blink, pose: o.rPose ? { ...me.pose, ...o.rPose } : me.pose };
  return <>
    <P6.BlockLights time={o.time as any} focus={ME_AT()} />
    <P6.Bathroom night={o.time === "interiorNight"} towel={o.towel ?? 1} mirrorWorld={o.me === false ? null : <Refl {...r} />} />
    {o.me !== false && <Ch {...me} />}
    {o.family && <Family t={t} k={o.family.k} stare={o.family.stare} />}
    {extra}
  </>;
};

// ---------------- the hallway (b8) and the dining room (b9) ----------------
// Hallway anchors (HOUSE): HALL_MIRRORS (the framed mirrors along the wall) if exported, else a guess along x.
const hallMirrors = (): V3[] => ((P6 as any).HALL_MIRRORS as V3[] | undefined) ?? [[-2.4, 1.5, 0], [-0.8, 1.5, 0], [0.8, 1.5, 0], [2.4, 1.5, 0]];
/** Out from the hall wall (unit, horizontal). */
const hallN = (): V3 => ((P6 as any).HALL_NORMAL as V3 | undefined) ?? [0, 0, 1];
const hallSpot = (i: number, d: number): V3 => { const hm = hallMirrors(), m = hm[Math.min(i, hm.length - 1)], n = hallN(); return [m[0] + n[0] * d, 0, m[2] + n[2] * d]; };
const Hall: React.FC<{ children?: React.ReactNode; focus?: V3; towels?: number[] | boolean }> = ({ children, focus, towels = true }) => <>
  <P6.BlockLights time={"interior" as any} focus={focus} />
  <P6.Hallway towels={towels} />
  {children}
</>;

const seat = (i: number) => P6.SEATS[i % P6.SEATS.length];
const faceTable = (p: V3) => yawTo(p, P6.TABLE);
const SEAT_H = 0.46; // chair seat height (m); BlockChar sit: y = seat - (2 - 0.5) * scale
const sitAt = (p: V3, s: number): V3 => [p[0], Math.max(0, SEAT_H - 1.5 * s), p[2]];
const Dinner: React.FC<{ t: number; broAway?: number; meExpr?: Expr; meLook?: number }> = ({ t, broAway = 0, meExpr = "smile", meLook = 0 }) => {
  const sd = seat(0), sm = seat(1), sb = seat(3), sme = seat(2); // bro on the far side, facing the wide camera
  return <>
    <P6.BlockLights time={"interior" as any} focus={P6.TABLE} />
    <P6.DiningRoom night spoons={false} />
    <Ch look={DAD} s={SCALE.adult} at={sitAt(sd, SCALE.adult)} yaw={faceTable(sd)} pose={{ ...P6.POSES.sit, ...P6.POSES.eat, legL: Math.PI / 2, legR: Math.PI / 2 }} blink={P6.blinkCurve(t, 1)} hold={{ R: <P6.Spoon /> }} />
    <Ch look={MOM} s={SCALE.adult} at={sitAt(sm, SCALE.adult)} yaw={faceTable(sm)} pose={{ ...P6.POSES.sit, ...P6.POSES.eat, legL: Math.PI / 2, legR: Math.PI / 2 }} blink={P6.blinkCurve(t, 2)} hold={{ R: <P6.Spoon /> }} />
    <Ch look={BRO} s={SCALE.bro} at={sitAt(sb, SCALE.bro)} yaw={faceTable(sb)} expr={broAway > 0.5 ? "blank" : "smile"} blink={broAway > 0.5 ? 0 : P6.blinkCurve(t, 4)}
      pose={{ ...P6.POSES.sit, armR: 1.35, armROut: -0.2, head: [1.25 * broAway, -0.12 * broAway] }} hold={{ R: <P6.Spoon /> }} />
    <Ch look={ME} s={SCALE.kid} at={sitAt(sme, SCALE.kid)} yaw={faceTable(sme)} expr={meExpr} blink={P6.blinkCurve(t, 3)}
      pose={{ ...P6.POSES.sit, armR: 1.2, head: [meLook, 0.05] }} hold={{ R: <P6.Spoon /> }} />
  </>;
};
const seatHead = (i: number, s: number): V3 => add(sitAt(seat(i), s), [0, eyeY(s), 0]);
/** A camera `r` m from a point, at `ang` radians around it measured from the direction toward the table. */
const around = (p: V3, ang: number, r: number, dy: number): V3 => {
  const base = Math.atan2(P6.TABLE[0] - p[0], P6.TABLE[2] - p[2]) + ang;
  return [p[0] + Math.sin(base) * r, p[1] + dy, p[2] + Math.cos(base) * r];
};

// ---------------- the cut list ----------------
const K = 0.04;
const CUTS: [string, number][] = [
  ["b8_hang", P(8)], ["b8_row", E.every - K], ["b8_cover", E.with8 - K], ["b8_dust", E.she - K],
  ["b9_dinner", P(9)], ["b9_bro", E.my9 - K], ["b9_me", E.look9 - K],
  ["b10_dark", P(10)], ["b10_pull", E.pulled - K], ["b10_face", E.bathroom - K],
  ["b11_empty", P(11)], ["b11_arrive", E.came - K], ["b11_three", E.behind - K],
  ["b12_mirror", P(12)], ["b12_real", E.was12 - K], ["b12_alone", E.alone - 0.03],
  ["b13_stare", P(13)], ["b13_close", E.with13 - K], ["b13_watch", E.they2 - K],
  ["b14_morning", P(14)], ["b14_open", E.for14 - K], ["b14_blink", E.my14 - K],
];
const span = (id: string): [number, number] => { const i = CUTS.findIndex((x) => x[0] === id); return [CUTS[i][1], i + 1 < CUTS.length ? CUTS[i + 1][1] : END]; };
/** Night shots (b10-b13): LOOK's vignette plus a multiply wash, warm and nearly clear in the middle (faces stay bright, the one
 *  warm ceiling light) falling to deep blue at the edges, so the bathroom reads as night. */
const NightDom: React.FC = () => <>
  <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply",
    background: "radial-gradient(ellipse 70% 48% at 50% 42%, #fff0dc 0%, #e9d6c0 38%, #5a6496 78%, #262c50 100%)" }} />
  <P6.GradeDom time="interiorNight" />
</>;
const NIGHT = /^b1[0-3]_/;
const mk = (id: string, s: Omit<Shot, "id" | "t0" | "t1">): Shot => { const [t0, t1] = span(id);
  return { enter: "cut", ...(NIGHT.test(id) && !id.startsWith("b9") ? { dom: () => <NightDom /> } : {}), ...s, id, t0, t1 }; };
const mv = (id: string, from: CamS, to: CamS, sway?: number) => (t: number) => { const [a, b] = span(id); return move(from, to, t, a, b, sway); };

const SHOTS: Shot[] = [
  // ===== b8: "My mom covered every mirror in the house with towels. She said it was for the dust." =====
  mk("b8_hang", { // mom hanging a towel over a hallway mirror, medium, slow push
    scene: (t) => { const p = hallSpot(1, 0.45), k = io(seg(t, span("b8_hang")[0], E.every));
      return <Hall focus={p} towels={[1, io(seg(t, span("b8_hang")[0] - 0.1, E.every - 0.1)), 0]}><Ch look={MOM} s={SCALE.adult} at={p} yaw={yawTo(p, sub(p, hallN()))} blink={P6.blinkCurve(t, 2)}
        pose={{ ...blendPose(P6.POSES.pullTowel, { ...P6.POSES.pullTowel, armL: 2.0, armR: 2.0 }, k), head: [1.25, -0.05] }} /></Hall>; },
    cam: (t) => { const p = hallSpot(1, 0.45), g = add(p, [0, 0.95, 0]);
      return mv("b8_hang", c(add(p, [-3.6, 1.35, 1.15]), g, 40), c(add(p, [-3.35, 1.33, 1.1]), g, 38))(t); },
  }),
  mk("b8_row", { // down the hallway: every mirror covered, mom walking on to the next with a towel
    scene: (t) => { const [a, b] = span("b8_row"); const p = L(hallSpot(1, 0.6), hallSpot(2, 0.6), seg(t, a, b + 0.4));
      return <Hall focus={p} towels={[1, 1, 0]}><Ch look={MOM} s={SCALE.adult} at={p} yaw={yawTo(hallSpot(1, 0.6), hallSpot(2, 0.6))} blink={P6.blinkCurve(t, 2)}
        walk={{ phase: t * 7.5, amount: 0.7 }} pose={{ armR: 0.9 }} hold={{ R: <P6.Towel /> }} /></Hall>; },
    cam: (t) => { const n = hallN(), s = side(n), h0 = hallSpot(0, 0), h3 = hallSpot(2, 0);
      const along = norm2(sub(h3, h0)), base = add(h0, add(sc(along, -1.6), sc(n, 1.7)));
      return mv("b8_row", c(add(base, [0, 1.6, 0]), add(h3, [0, 1.2, 0]), 46), c(add(add(base, sc(along, 0.4)), [0, 1.58, 0]), add(h3, [0, 1.2, 0]), 44))(t);
      void s; },
  }),
  mk("b8_cover", { // the bathroom mirror too: a towel hangs over it
    scene: (t) => <Bath t={t} o={{ time: "bathroom", towel: 0, me: false }} extra={<Ch look={MOM} s={SCALE.adult} at={W(0.5, 0, 0.6)} yaw={yawTo(W(0.5, 0, 0.6), W(2.5, 0, 3.2)) + 0.5}
      blink={P6.blinkCurve(t, 2)} pose={{ ...P6.POSES.pullTowel, armL: 1.9, armR: 0.6, head: [-0.3, 0] }} />} />,
    cam: (t) => mv("b8_cover", c(W(2.5, 1.4, 3.2), W(0.2, 1.25, 0.3), 40), c(W(2.35, 1.38, 3.0), W(0.2, 1.25, 0.3), 38))(t),
  }),
  mk("b8_dust", { // mom turns to us, hands on hips, big smile: "for the dust"
    scene: (t) => { const p = hallSpot(2, 0.7);
      return <Hall focus={p}><Ch look={MOM} s={SCALE.adult} at={p} yaw={yawTo(p, add(p, [-1.75, 0, 1.95]))} expr={t > E.dust - 0.08 ? "grin" : "smile"} blink={P6.blinkCurve(t, 2)} pose={P6.POSES.hips} /></Hall>; },
    cam: (t) => { const p = hallSpot(2, 0.7), g = add(p, [0, 0.92, 0]);
      return mv("b8_dust", c(add(p, [-1.75, 1.3, 1.95]), g, 46), c(add(p, [-1.6, 1.28, 1.85]), g, 44))(t); },
  }),

  // ===== b9: "And at dinner, my little brother wouldn't look at his spoon." =====
  mk("b9_dinner", { // the family at the table, three-quarter from above
    scene: (t) => <Dinner t={t} />,
    cam: (t) => { const g = add(P6.TABLE, [0, 0.75, 0]); return mv("b9_dinner", c(add(P6.TABLE, [2.4, 2.1, 2.8]), g, 46), c(add(P6.TABLE, [2.15, 2.0, 2.5]), g, 44))(t); },
  }),
  mk("b9_bro", { // the brother: head turned hard away from the spoon in his hand
    scene: (t) => <Dinner t={t} broAway={io(seg(t, E.my9, E.my9 + 0.35))} />,
    cam: (t) => { const h = seatHead(3, SCALE.bro), g = add(h, [0, -0.12, 0]);
      return mv("b9_bro", c(around(h, 0.7, 2.4, 0.2), g, 40), c(around(h, 0.7, 2.15, 0.18), g, 38))(t); },
  }),
  mk("b9_me", { // ME across the table notices: a worried look at the brother
    scene: (t) => <Dinner t={t} broAway={1} meExpr="worried" meLook={-0.55 * io(seg(t, E.look9, E.look9 + 0.3))} />,
    cam: (t) => { const h = seatHead(2, SCALE.kid), g = add(h, [0, -0.15, 0]);
      return mv("b9_me", c(around(h, -0.55, 2.6, 0.25), g, 36), c(around(h, -0.55, 2.4, 0.22), g, 34))(t); },
  }),

  // ===== b10: "Tonight, I pulled the towel off the bathroom mirror." =====
  mk("b10_dark", { // night: ME in pyjamas facing the covered mirror, wide from the doorway side
    scene: (t) => <Bath t={t} o={{ time: "interiorNight", towel: 0, expr: "worried", blink: P6.blinkCurve(t, 3), meYawOff: 0.6 }} />,
    cam: (t) => mv("b10_dark", c(W(2.6, 1.45, 3.6), W(-0.1, 1.15, 0.3), 38), c(W(2.45, 1.43, 3.35), W(-0.1, 1.15, 0.3), 36))(t),
  }),
  mk("b10_pull", { // from the side: both hands yank the towel down off the glass
    scene: (t) => { const k = io(seg(t, E.towel - 0.05, E.off + 0.2));
      const arms: Pose = { armL: lerp(2.4, 0.7, k), armR: lerp(2.4, 0.7, k), armLOut: -0.12, armROut: -0.12, lean: lerp(-0.04, 0.02, k), head: [0, lerp(-0.14, 0, k)] };
      return <Bath t={t} o={{ time: "interiorNight", towel: k, expr: k > 0.6 ? "scared" : "worried", blink: 0, meYawOff: 0.6, pose: arms }} />; },
    cam: (t) => mv("b10_pull", c(W(2.4, 1.35, 1.9), W(-0.1, 1.3, 0.3), 40), c(W(2.3, 1.34, 1.8), W(-0.1, 1.3, 0.3), 38))(t),
  }),
  mk("b10_face", { // the glass: ME's reflection looks back, just a kid in pyjamas (for now)
    scene: (t) => <Bath t={t} o={{ time: "interiorNight", towel: 1, expr: "worried", blink: P6.blinkCurve(t, 3) }} />,
    cam: (t) => { const g = L(meHead(), refl(meHead()), 0.5); return mv("b10_face", c(W(1.9, 1.4, 2.4), g, 38), c(W(1.75, 1.38, 2.2), g, 35))(t); },
  }),

  // ===== b11: "All three of them came to the doorway behind me." =====
  // reverse angle from the mirror side: ME's face in front, the dark doorway behind
  mk("b11_empty", {
    scene: (t) => <Bath t={t} o={{ time: "interiorNight", towel: 1, expr: "worried", blink: P6.blinkCurve(t, 3) }} />,
    cam: (t) => mv("b11_empty", c(W(2.9, 1.3, 1.6), W(0, 1.08, 0.5), 34), c(W(2.75, 1.29, 1.55), W(0, 1.09, 0.5), 32))(t),
  }),
  mk("b11_arrive", { // they step into the doorway, smiling
    scene: (t) => <Bath t={t} o={{ time: "interiorNight", towel: 1, expr: "worried", blink: P6.blinkCurve(t, 3), 
      family: { k: io(seg(t, E.came - 0.15, E.behind)) } }} />,
    cam: (t) => mv("b11_arrive", c(W(0.6, 1.3, 0.9), W(1.7, 1.0, 5.6), 40), c(W(0.65, 1.3, 1.1), W(1.7, 1.02, 5.6), 38))(t),
  }),
  mk("b11_three", { // the three of them, smiling, close enough to read the faces
    scene: (t) => <Bath t={t} o={{ time: "interiorNight", towel: 1, expr: "worried", family: { k: 1 } }} />,
    cam: (t) => mv("b11_three", c(W(1.4, 1.35, 1.0), W(1.7, 1.15, 5.6), 40), c(W(1.42, 1.35, 1.3), W(1.7, 1.17, 5.6), 38))(t),
  }),

  // ===== b12: "But in the mirror, I was standing there alone." (THE REVEAL) =====
  mk("b12_mirror", { // the glass from beside ME: ME's reflection, and behind it the reflected doorway: EMPTY
    scene: (t) => <Bath t={t} o={{ time: "interiorNight", towel: 1, expr: "worried", blink: P6.blinkCurve(t, 3), family: { k: 1 } }} />,
    cam: (t) => { const g = L(meHead(), refl(meHead()), 0.6); return mv("b12_mirror", c(W(2.2, 1.42, 2.4), g, 36), c(W(2.05, 1.4, 2.2), g, 32), 0.002)(t); },
  }),
  mk("b12_real", { // cut to the real room: they ARE there, right behind ME, smiling
    scene: (t) => <Bath t={t} o={{ time: "interiorNight", towel: 1, expr: "scared", blink: 0, meYawOff: -1.39, pose: { head: [0, -0.06] }, family: { k: 1 } }} />,
    cam: (t) => { const g: V3 = add(meHead(), [0.15, 0.11, 0]); return mv("b12_real", c(W(2.75, 1.68, 8.75), g, 31), c(W(2.72, 1.66, 8.5), g, 28), 0.002)(t); },
  }),
  mk("b12_alone", { // hard cut on "alone": into the glass, ME's reflection alone, scared, slow push
    scene: (t) => <Bath t={t} o={{ time: "interiorNight", towel: 1, expr: "scared", blink: 0, meYawOff: 1.3, family: { k: 1 } }} />,
    cam: (t) => { const r = refl(meHead()); return mv("b12_alone", c(W(2.3, 1.45, 2.6), r, 28), c(W(2.2, 1.43, 2.35), r, 24), 0.002)(t); },
  }),

  // ===== b13: "They were never blinking with me. They were watching me blink." =====
  mk("b13_stare", { // the three in the doorway: on "never" the smiles drop to the stare
    scene: (t) => <Bath t={t} o={{ time: "interiorNight", towel: 1, expr: "scared", family: { k: 1, stare: E.never } }} />,
    cam: (t) => mv("b13_stare", c(W(0.5, 1.25, 0.8), W(1.7, 1.18, 5.6), 40), c(W(0.58, 1.27, 1.2), W(1.7, 1.2, 5.6), 36), 0.003)(t),
  }),
  mk("b13_close", { // close on mom and dad: black eyes, no mouths, unblinking
    scene: (t) => <Bath t={t} o={{ time: "interiorNight", towel: 1, expr: "scared", family: { k: 1, stare: -1 } }} />,
    cam: (t) => { const m = famHead(1); return mv("b13_close", c(add(m, [-0.25, 0.22, -1.7]), add(m, [0, 0.02, 0]), 34), c(add(m, [-0.22, 0.2, -1.55]), add(m, [0, 0.02, 0]), 32), 0.002)(t); },
  }),
  mk("b13_watch", { // ME scared, from the side (face to us); ME blinks on "blink" (they are watching)
    scene: (t) => <Bath t={t} o={{ time: "interiorNight", towel: 1, expr: "scared", blink: blinkOn(t, E.blink13, 0.22), meYawOff: -0.5, family: { k: 1, stare: -1 } }} />,
    cam: (t) => mv("b13_watch", c(W(2.6, 1.3, 1.5), W(0, 1.05, 0.5), 38), c(W(2.4, 1.29, 1.45), W(0, 1.07, 0.5), 34), 0.003)(t),
  }),

  // ===== b14: "And this morning, for the first time, my reflection blinked first." =====
  mk("b14_morning", { // morning light, ME alone at the mirror in day clothes, wide
    scene: (t) => <Bath t={t} o={{ time: "bathroom", towel: 1, look: ME, expr: "worried", blink: P6.blinkCurve(t, 3) }} />,
    cam: (t) => mv("b14_morning", c(W(2.6, 1.5, 3.8), W(0, 1.2, 0), 40), c(W(2.45, 1.48, 3.55), W(0, 1.2, 0), 38))(t),
  }),
  mk("b14_open", { // ME's real face, close: eyes wide open, staring at itself
    scene: (t) => <Bath t={t} o={{ time: "bathroom", towel: 1, look: ME, expr: "worried", blink: 0 }} />,
    cam: (t) => { const h = meHead(); return mv("b14_open", c(W(2.5, 1.3, 1.45), add(h, [0, -0.12, 0]), 36), c(W(2.35, 1.29, 1.4), add(h, [0, -0.1, 0]), 33), 0.002)(t); },
  }),
  mk("b14_blink", { // the hook framing: on "blinked" the reflection's eyes close while ME's stay open, and they stay shut:
    // the push lands exactly on frame 0's camera, where the reflection's eyes are shut and ME's are wide open (the loop)
    scene: (t) => <Bath t={t} o={{ time: "bathroom", towel: 1, look: ME, expr: "worried", blink: 0, rExpr: "blank",
      rBlink: io(seg(t, E.blinked, E.blinked + 0.22)) }} />,
    cam: (t) => { const [a] = span("b14_blink"); const f0 = hookFrame0();
      const from = c(L(f0.pos, f0.target, -1.6), f0.target, 40);
      const u = io(seg(t, a, END - 0.35));
      return { pos: L(from.pos, f0.pos, u), target: f0.target, fov: lerp(from.fov, f0.fov, u) }; },
    still: true, // the camera already moves and must land exactly on frame 0's framing: no extra drift
  }),
];

export const SHOTS_B: Shot[] = SHOTS;
/** For SOUND: [{id, t0, enter}] (written to cuts_b.json). Reflection blinks (for the "tick"): b10_face idle, b14 "blinked". */
export const CUTS_B = SHOTS.map((s) => ({ id: s.id, t0: +s.t0.toFixed(3), enter: s.enter ?? "cut" }));

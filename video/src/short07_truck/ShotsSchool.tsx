// Short 07 SCHOOL shots (School builder; notes/short07/CONTRACT.md): beats 4-10, cut ids s06..s18.
// Sets: the lunch tables and the slide (./School07) in Short 6's SchoolYard; the corridor (blocky/SchoolHall); the classroom
// (blocky/Classroom, owned by lead 10); the empty street out of the window (Short 6's MyStreet, day). RIG UNITS throughout.
// Every time comes from E.* (word anchors) and the cut list (mk/mv). Jingle sync t0s: Toby's walk E.walked; the teacher's hum
// E.hummed (s15); the hum that carries the WRONG NOTE in s17 is phrased from E.wrote, so its wrong note (note 6 of the bar)
// lands on the word "wrong".
import React from "react";
import type { Pose, Expr, Look } from "../blocky/types";
import * as M from "../blocky/Motion";
import { lerp } from "../kit/core";
import * as K from "../blocky/Collide";
import { BlockLights, Sky } from "../blocky/Look";
import { SchoolYard, StreetSet } from "../short06_blocky/Town";
import { Classroom, CLASSROOM_CS, DESK } from "../blocky/Classroom";
import { Corridor, corridorCS } from "../blocky/SchoolHall";
import { ActLike, c, Ch, E, KIDS, ME, mk, mv, notePulse, isWrong, JINGLE_NOTE, WRONG_IN_BAR, S, span, st, TEACHER, TOBY, V3, CamS, Shot } from "./common";
import { LUNCH_AT, LUNCH_CS, LunchTable, lunchSeat, Slide, SLIDE, slideCS, slideSurface, WindowFrame, Sandwich, Pencil, Chalk, TestPaper, UprightCone, HeatShimmer } from "./School07";

const PI = Math.PI;
const clampA = (x: number, m: number) => Math.max(-m, Math.min(m, x));
/** Head yaw (relative to the body) that looks from `from` (body yaw `yaw`) at `to`, clamped. */
const lookYaw = (from: V3, yaw: number, to: V3, m = 1.15) => clampA(M.dAng(yaw, M.yawTo(from, to)), m);
/** A held prop that stays upright whatever the forward arm angle. */
const Up: React.FC<{ arm: number; children: React.ReactNode }> = ({ arm, children }) => <group rotation={[arm - PI / 2, 0, 0]}>{children}</group>;

// ---------------------------------------------------------------- people in a shot (every <Ch/> gets cs + the others)
type Person = { look: Look; a: ActLike; s: number; expr?: Expr; hold?: { R?: React.ReactNode; L?: React.ReactNode }; blink?: number; still?: boolean; noFeet?: boolean; lift?: number; seed: number };
const people = (t: number, ps: Person[], cs: K.Box[]) => ps.map((p, i) =>
  <Ch key={i} look={p.look} a={p.a} t={t} scale={p.s} expr={p.expr} hold={p.hold} blink={p.blink} still={p.still} noFeet={p.noFeet} lift={p.lift ?? 0}
    blinkSeed={p.seed} cs={cs} others={ps.filter((_, j) => j !== i).map((q) => st(q.a, q.s, q.lift ?? 0))} />);

/** Seated on a seat whose top centre is `seat` (legs straight out, the game's sit), facing `yaw`, plus pose layers. */
const seated = (seat: V3, yaw: number, s: number, ...ps: (Pose | false | undefined)[]): ActLike =>
  ({ position: [seat[0], M.seatedY(seat[1], s), seat[2]], yaw, pose: M.mix({ legL: PI / 2, legR: PI / 2, armL: 0.12, armR: 0.12 }, ...ps) });

// ---------------------------------------------------------------- poses
/** Eating a sandwich in the right hand: rest over the tray, up to the mouth for a bite every ~2.5 s (seeded). */
const eatArm = (t: number, seed: number) => { const P = 2.1 + (seed % 3) * 0.35, ph = (((t + seed * 0.73) % P) + P) % P / P; return Math.sin(PI * M.clamp01((ph - 0.45) / 0.4)); };
const eat = (t: number, seed: number): Pose => { const up = eatArm(t, seed); return { armR: 1.8 + 0.55 * up, armROut: -0.14 * up, head: [0, 0.06 * up], lean: 0.04 }; };
const eatFace = (t: number, seed: number, base: Expr = "smile"): Expr => (eatArm(t, seed) > 0.75 ? "talk" : base);
/** Writing on a desk with the right hand (pencil, raised over the desk top), head down over the paper. `k` 0..1 how bent
 *  over; `scribble` 0..1 how much the hand moves. */
const WRITE_ARM = 1.95;
const write = (t: number, seed: number, k = 1, scribble = k): Pose => {
  const sc = (Math.sin(t * 13 + seed * 2.1) * 0.05 + Math.sin(t * 5.3 + seed) * 0.04) * scribble;
  return { armR: WRITE_ARM + sc, armROut: -0.16 + 0.08 * Math.sin(t * 3.1 + seed) * scribble, lean: 0.1 * k, head: [0.05 * Math.sin(t * 0.8 + seed) * scribble, 0.45 * k] };
};
/** A pencil held writing (tip down onto the paper). */
const writingPencil = (arm: number) => <group rotation={[arm - PI / 2 + PI - 0.55, 0, 0]}><Pencil /></group>;

// ================================================================ the yard: lunch (s06, s07)
const LUNCH_FOCUS: V3 = [-4, 0, 2];
const tobyLunch = lunchSeat(0, -1, 0), meLunch = lunchSeat(0, -1, 4.2);
const TOBY_CONE_ARM = 2.05;
const lunchPeople = (t: number, o: { tobyExpr: Expr; tobyHead?: [number, number]; tobyTilt?: number; meLook: number }): Person[] => {
  const ps: Person[] = [];
  const kid = (look: Look, sp: { seat: V3; yaw: number }, seed: number, extra?: Pose, expr?: Expr) =>
    ps.push({ look, s: S.kid, seed, a: seated(sp.seat, sp.yaw, S.kid, eat(t, seed), M.seatedIdle(t, seed, 0.5), extra), expr: expr ?? eatFace(t, seed), hold: { R: <Up arm={1.8 + 0.55 * eatArm(t, seed)}><Sandwich fill={["#d8584a", "#7ab83a", "#e8b84a"][seed % 3]} /></Up> } });
  // Toby: perfectly still, the cone held up, never biting
  ps.push({ look: TOBY, s: S.kid, seed: 11, still: true, blink: 0, expr: o.tobyExpr,
    a: seated(tobyLunch.seat, tobyLunch.yaw, S.kid, { armR: TOBY_CONE_ARM, armROut: -0.06, armL: 0.12, head: o.tobyHead ?? [0, 0], tilt: o.tobyTilt ?? 0 }),
    hold: { R: <UprightCone arm={TOBY_CONE_ARM} glow={0.12} /> } });
  // ME beside him: eating, then the head turns to Toby's cone
  const meHead = o.meLook;
  ps.push({ look: ME, s: S.kid, seed: 21, expr: meHead > 0.3 ? "worried" : eatFace(t, 21),
    a: seated(meLunch.seat, meLunch.yaw, S.kid, { armR: 1.8 + 0.55 * eatArm(t, 21) * (1 - meHead), lean: 0.04 }, { head: [-0.85 * meHead, -0.05 * meHead], twist: -0.12 * meHead }, M.seatedIdle(t, 21, 0.4)),
    hold: { R: <Up arm={1.8 + 0.55 * eatArm(t, 21) * (1 - meHead)}><Sandwich /></Up> } });
  kid(KIDS[1], lunchSeat(0, -1, -4.2), 3, undefined, M.talk(t, [E.held4, E.cone4, E.lunch], "happy"));
  kid(KIDS[3], lunchSeat(0, 1, -4.4), 5);
  kid(KIDS[0], lunchSeat(1, -1, -3.6), 7);
  kid(KIDS[4], lunchSeat(1, -1, 0.4), 8);
  kid(KIDS[2], lunchSeat(1, -1, 4.4), 9);
  kid(KIDS[7], lunchSeat(1, 1, -1), 10);
  // a kid crossing behind with a lunch tray
  const w = M.walkPath([[14, 0, -2.6], [-24, 0, -2.6]], t, E.held4 - 1.6, { scale: S.kid, gait: "stroll" });
  ps.push({ look: KIDS[6], s: S.kid, seed: 12, a: M.act(w, { armR: 1.45, armL: 1.45, armROut: -0.05, armLOut: -0.05 }), expr: "smile",
    hold: { R: <Up arm={1.45}><group position={[-0.9, 0.05, 0]}><mesh><boxGeometry args={[2.0, 0.1, 1.3]} /><meshStandardMaterial color="#e07a6a" roughness={0.5} /></mesh></group></Up> } });
  return ps;
};
const YardLunch: React.FC<{ t: number; children?: React.ReactNode }> = ({ children }) => <>
  <Sky time="day" /><BlockLights time="day" focus={LUNCH_FOCUS} shadowSpan={30} />
  <SchoolYard />
  {LUNCH_AT.map((p, i) => <LunchTable key={i} at={p} />)}
  {children}
</>;

const s06 = mk("s06_lunch", {
  scene: (t) => <YardLunch t={t}>{people(t, lunchPeople(t, { tobyExpr: "smile", meLook: M.ease(M.seg(t, E.cone4, E.cone4 + 0.3)) }), LUNCH_CS)}</YardLunch>,
  cam: mv("s06_lunch", c([5, 5.6, 15.5], [-3.6, 3.0, 2.0], 40), c([3.8, 5.1, 13.4], [-3.8, 3.0, 2.0], 39)),
});
const s07 = mk("s07_tobystare", {
  scene: (t) => {
    const [a, b] = span("s07_tobystare"), u = M.ease(M.seg(t, a, b));
    return <YardLunch t={t}>{people(t, lunchPeople(t, { tobyExpr: t < E.lunch ? "smile" : "creepy", tobyHead: [0.18 * u, -0.04 * u], tobyTilt: 0.12 * u, meLook: 1 }), LUNCH_CS)}</YardLunch>;
  },
  cam: mv("s07_tobystare", c([-2.3, 4.3, 9.6], [-4, 3.55, 1.4], 36), c([-2.8, 4.1, 8.0], [-4, 3.6, 1.4], 34)),
});

// ================================================================ the hot slide (s08, s09)
const SLIDE_CS = slideCS();
const slideX = (t: number) => {
  const [a, b] = span("s08_slide");
  return SLIDE.x0 + 3.6 + (SLIDE.x0 + 12.4 - (SLIDE.x0 + 3.6)) * M.easeOut(M.seg(t, a - 0.12, b + 0.12));
};
/** Toby sitting on the chute at world x: hips on the surface, legs down the slope, leaning back, the cone held up. */
const tobySliding = (t: number, x: number, coneArm: number, extra?: Pose): ActLike => {
  const s = S.kid, y = slideSurface(x), slope = Math.atan((slideSurface(x - 0.4) - slideSurface(x + 0.4)) / 0.8);
  return { position: [x, M.seatedY(y, s), SLIDE.z], yaw: PI / 2,
    pose: M.mix({ legL: PI / 2 - slope, legR: PI / 2 - slope, lean: -0.22 + 0.1 * (1 - slope), armR: coneArm, armROut: 0.04, armL: 0.9, armLOut: -0.04, head: [0, -0.04] }, extra) };
};
const HotYard: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>
  <Sky time="day" /><BlockLights time="day" focus={[SLIDE.x0 + 8, 0, SLIDE.z]} shadowSpan={26} />
  <SchoolYard /><Slide />{children}
</>;
const s08 = mk("s08_slide", {
  scene: (t) => {
    const x = slideX(t), a = tobySliding(t, x, 2.0);
    return <HotYard>{people(t, [{ look: TOBY, s: S.kid, seed: 11, a, still: true, blink: 0, expr: "creepy", noFeet: true, hold: { R: <UprightCone arm={2.0} glow={0.12} /> } },
      // a kid waiting at the ladder, looking up after him
      { look: KIDS[5], s: S.kid, seed: 4, a: { position: [SLIDE.x0 - 4.6, 0, SLIDE.z + 2.2], yaw: 1.2, pose: M.mix(M.idle(t, 4), { head: [0.3, -0.15] }) }, expr: "surprised" }], SLIDE_CS)}</HotYard>;
  },
  cam: mv("s08_slide", c([36.5, 4.6, 17.5], [25.5, 3.6, 28], 42), c([36.0, 4.0, 18.5], [28.5, 2.8, 28], 42)),
  dom: (t) => <HeatShimmer t={t} />,
});
const S09_ARM = 1.9;
const s09 = mk("s09_cone", {
  scene: (t) => {
    const [a, b] = span("s09_cone"), u = M.seg(t, a, b);
    // he has stopped at the bottom; the cone is lifted a touch higher and turned slowly (showing it from every side)
    const arm = S09_ARM + 0.08 * M.ease(u);
    const toby = tobySliding(t, SLIDE.x0 + 12.4, arm, { head: [0.25 * M.ease(u), -0.05], tilt: 0.1 * M.ease(u) });
    return <HotYard>{people(t, [{ look: TOBY, s: S.kid, seed: 11, a: toby, still: true, blink: 0, expr: "creepy", noFeet: true,
      hold: { R: <Up arm={arm}><group rotation={[0, 1.4 * u, 0]}><UprightCone arm={PI / 2} glow={0.18} /></group></Up> } }], SLIDE_CS)}</HotYard>;
  },
  cam: mv("s09_cone", c([SLIDE.x0 + 16.6, 3.0, SLIDE.z - 3.6], [SLIDE.x0 + 13.0, 4.7, SLIDE.z - 0.4], 34), c([SLIDE.x0 + 16.0, 3.1, SLIDE.z - 3.0], [SLIDE.x0 + 13.0, 4.75, SLIDE.z - 0.4], 31)),
  dom: (t) => <HeatShimmer t={t} strength={0.8} />,
});

// ================================================================ the corridor (s10, s11)
const COR_CS = corridorCS();
const ME_HALL: V3 = [-0.6, 0, 1];
const TOBY_LANE = -4.2;
const tobyWalk = (t: number) => {
  const w = M.walkPath([[TOBY_LANE, 0, 5.8], [TOBY_LANE, 0, -16]], t, E.walked - 1.0, { scale: S.kid, gait: "stroll" });
  // the jingle comes out of him: a tiny bob and a head twitch on each note
  const p = notePulse(t, E.walked);
  return { a: M.act(w, { armR: 0.15, head: [0.03 * p, -0.03 * p], tilt: 0.05 * p }), lift: 0.05 * p };
};
const hallPeople = (t: number, meHead: number, meExpr: Expr): Person[] => {
  const tw = tobyWalk(t);
  const meA: ActLike = { position: ME_HALL, yaw: PI, pose: M.mix(M.idle(t, 6, 0.6), { head: [meHead, 0.02], twist: clampA(meHead * 0.25, 0.3), armL: 0.1, armR: 0.1 }) };
  return [
    { look: TOBY, s: S.kid, seed: 11, a: tw.a, lift: tw.lift, still: true, blink: 0, expr: "creepy", hold: { L: <UprightCone arm={0.15} glow={0.1} /> } },
    { look: ME, s: S.kid, seed: 21, a: meA, expr: meExpr },
    // two kids chatting at the right-hand lockers, further down
    { look: KIDS[2], s: S.kid, seed: 2, a: { position: [4.6, 0, 9], yaw: -2.2, pose: M.mix(M.idle(t, 2), M.talkHands(t, [E.walked, E.past, E.me6, E.heard])) }, expr: M.talk(t, [E.walked, E.past, E.heard], "smile") },
    { look: KIDS[5], s: S.kid, seed: 5, a: { position: [2.4, 0, 12.5], yaw: 2.6, pose: M.mix(M.idle(t, 5), M.laugh(t, E.past, E.song6)) }, expr: t > E.past ? "laugh" : "smile" },
    // a kid at an open locker near the camera side
    { look: KIDS[0], s: S.kid, seed: 0, a: { position: [4.7, 0, -6.5], yaw: -1.75, pose: M.mix(M.idle(t, 0), { armL: 0.9 + 0.2 * Math.sin(t * 3) }) }, expr: "smile" },
  ];
};
/** Toby's position (for ME's eyes). */
const tobyAt = (t: number): V3 => tobyWalk(t).a.position;
const Hall: React.FC<{ children?: React.ReactNode }> = ({ children }) => <>
  <BlockLights time="interior" focus={[-1, 0, 0]} />
  <Corridor />{children}
</>;
const s10 = mk("s10_corridor", {
  scene: (t) => {
    const want = lookYaw(ME_HALL, PI, tobyAt(t), 1.0), k = M.ease(M.seg(t, E.walked - 0.1, E.past));
    return <Hall>{people(t, hallPeople(t, want * k * 0.8, t < E.past ? "smile" : "worried"), COR_CS)}</Hall>;
  },
  cam: mv("s10_corridor", c([1.6, 4.7, -6.0], [-2.4, 3.2, 3.6], 42), c([1.3, 4.5, -8.0], [-2.6, 3.2, 0.8], 42)),
});
const s11 = mk("s11_me", {
  scene: (t) => {
    const want = lookYaw(ME_HALL, PI, tobyAt(t), 1.2);
    const head = 0.8 * want * (1 - M.snap(M.seg(t, E.heard, E.heard + 0.14), 3)) + want * M.snap(M.seg(t, E.heard, E.heard + 0.14), 3);
    return <Hall>{people(t, hallPeople(t, head, t < E.heard ? "worried" : "scared"), COR_CS)}</Hall>;
  },
  cam: mv("s11_me", c([-2.4, 3.9, -6.4], [-0.9, 3.2, 1], 40), c([-2.2, 3.8, -5.4], [-0.9, 3.25, 1], 38)),
});

// ================================================================ the classroom (s13, s14, s16a, s15, s16b, s17, s18)
const ME_DESK = 3;
const TEACH: V3 = [-3, 0, -15.7];
const KID_DESKS: [number, Look][] = [[0, KIDS[0]], [1, KIDS[1]], [2, KIDS[2]], [4, KIDS[4]], [5, KIDS[5]], [6, KIDS[6]], [7, KIDS[7]], [8, KIDS[3]], [9, KIDS[2]], [10, KIDS[0]], [11, KIDS[5]]];
type ClassMode = { desk: boolean; lookUp?: (i: number) => number; meA?: ActLike; meExpr?: Expr; meHold?: React.ReactNode; teacher?: Person; frozen?: number };
/** The class. desk = true: everyone works on the test (pencil hand raised over the desk, scribbling, heads down) and
 *  lookUp(i) 0..1 lifts kid i's head toward the teacher (the hand stays over the desk: never swings down through it);
 *  desk = false: sitting up, hands down. frozen 1 stops all scribbling and fidgets. */
const classPeople = (t: number, m: ClassMode): Person[] => {
  const ps: Person[] = [];
  const teacherFace: V3 = [TEACH[0], 4.6, TEACH[2]];
  const fr = m.frozen ?? 0;
  KID_DESKS.forEach(([d, look], i) => {
    const D = DESK(d), up = m.lookUp ? m.lookUp(i) : 0;
    const hy = lookYaw([D.seat[0], 0, D.seat[2]], PI, teacherFace, 0.8) * up;
    const pose = m.desk
      ? M.mix(write(t, i, 1 - up, 1 - Math.max(up, fr)), { head: [hy, -0.08 * up] }, M.scale(M.seatedIdle(t, i, 0.4), 1 - fr))
      : M.mix(M.seatedIdle(t, i, 0.7), { head: [hy, 0.04] });
    ps.push({ look, s: S.kid, seed: i, a: seated(D.seat, D.yaw, S.kid, pose), still: fr > 0.5,
      expr: up > 0.5 ? (i % 3 === 0 ? "worried" : "surprised") : i % 4 === 1 ? "blank" : "smile",
      hold: m.desk ? { R: writingPencil(WRITE_ARM) } : undefined });
  });
  const MD = DESK(ME_DESK);
  ps.push({ look: ME, s: S.kid, seed: 21, a: m.meA ?? seated(MD.seat, MD.yaw, S.kid, m.desk ? write(t, 21) : M.seatedIdle(t, 21, 0.7)), expr: m.meExpr ?? "smile",
    hold: m.meHold !== undefined ? { R: m.meHold } : m.desk ? { R: writingPencil(WRITE_ARM) } : undefined });
  if (m.teacher) ps.push(m.teacher);
  return ps;
};
const CLASS_CS = CLASSROOM_CS;
const Room: React.FC<{ focus: V3; children?: React.ReactNode }> = ({ focus, children }) => <>
  <BlockLights time="interior" focus={focus} />
  <Classroom boardText="Spelling Test" clock={10.4} />
  {Array.from({ length: 12 }, (_, i) => { const D = DESK(i); return <TestPaper key={i} at={[D.desk[0] + 0.2, D.desk[1], D.desk[2] + 0.25]} rot={0.1 * Math.sin(i * 2.3)} />; })}
  {children}
</>;
/** The teacher: writing on the board (body angled toward +x), the cone in her other hand. */
const CONE_ARM_T = 1.7;
const teacherAt = (o: { yaw: number; pose: Pose; expr: Expr; blink?: number; still?: boolean }): Person => ({
  look: TEACHER, s: S.adult, seed: 31, a: { position: TEACH, yaw: o.yaw, pose: o.pose }, expr: o.expr, blink: o.blink, still: o.still,
  hold: { L: <UprightCone arm={(o.pose.armL as number) ?? CONE_ARM_T} glow={0.15} />, R: <Chalk /> },
});
const WRITE_YAW = PI - 0.45;
const boardWrite = (t: number, k = 1): Pose => ({ armR: (2.0 + 0.07 * Math.sin(t * 9)) * k, armROut: (0.05 + 0.12 * Math.sin(t * 4.3)) * k, lean: 0.1 * k });
/** While she faces the board the cone hand is held low and out to her side (clear of the wall). */
const CONE_LOW = 0.35;

const s13 = mk("s13_lookaround", {
  scene: (t) => {
    const MD = DESK(ME_DESK);
    // he was looking out of the window (to his left); on "wasn't" his head whips round the room
    const head = lerp(1.1, -0.75, M.snap(M.seg(t, E.wasnt - 0.05, E.wasnt + 0.2), 1.5)) + 0.35 * M.ease(M.seg(t, E.wasnt + 0.3, E.truck7));
    const meA = seated(MD.seat, MD.yaw, S.kid, { head: [head, -0.08], twist: 0.18 * Math.sign(head) * Math.min(1, Math.abs(head)), armR: 0.3, armL: 0.3 });
    return <Room focus={[-11, 0, 0]}>{people(t, classPeople(t, { desk: true, meA, meExpr: "worried", meHold: <Pencil /> }), CLASS_CS)}</Room>;
  },
  cam: mv("s13_lookaround", c([-16.2, 4.5, -4.4], [-11, 3.1, 2.3], 40), c([-15.9, 4.4, -3.9], [-11, 3.1, 2.3], 39)),
});
const NOSTREET: [CamS, CamS] = [c([4, 13.5, 76], [-8, 1.5, 44], 44), c([3.4, 13.2, 75.2], [-10.5, 1.5, 44], 44)];
const s12 = mk("s12_nostreet", {
  scene: () => <><StreetSet time="day" focus={[-8, 0, 44]} /><WindowFrame cam={NOSTREET[0]} d={2.6} w={2.9} h={4.6} /></>,
  cam: mv("s12_nostreet", NOSTREET[0], NOSTREET[1], 0.003),
});
const s14 = mk("s14_class", {
  scene: (t) => {
    // writing on the board, turns to the class on "teacher", lifts the cone on "cone"
    const tr = M.turn(WRITE_YAW, 0.35, t, E.teacher - 0.15, 0.45);
    const wk = 1 - M.ease(M.seg(t, E.teacher - 0.35, E.teacher - 0.1));
    const faced = M.ease(M.seg(t, E.teacher + 0.1, E.teacher + 0.35)); // the cone comes up once she has turned from the wall
    const lift = M.snap(M.seg(t, E.cone8, E.cone8 + 0.2));
    const pose = M.mix(boardWrite(t, wk), { armL: CONE_LOW + (CONE_ARM_T - CONE_LOW) * faced + 0.35 * lift, armLOut: 0.2 * wk, armR: 0.25 * (1 - wk), head: [0, -0.05 * lift], tilt: 0.08 * lift }, M.idle(t, 31, 0.5));
    const teacher = teacherAt({ yaw: tr.yaw, pose, expr: t < E.cone8 ? "smile" : "creepy", blink: t > E.cone8 ? 0 : undefined });
    teacher.a = { ...teacher.a, walk: tr.walk };
    return <Room focus={[-3, 0, -12]}>{people(t, classPeople(t, { desk: false, teacher }), CLASS_CS)}</Room>;
  },
  cam: mv("s14_class", c([7.8, 7.6, -0.6], [-3, 4.3, -15], 42), c([6.6, 7.0, -2.6], [-3, 4.6, -15.5], 40)),
});
const s16a = mk("s16a_test", {
  scene: (t) => <Room focus={[-5, 0, 3]}>{people(t, classPeople(t, { desk: true, meExpr: "worried" }), CLASS_CS)}</Room>,
  cam: mv("s16a_test", c([-1.6, 5.4, -5.2], [-5.6, 2.5, 3.0], 42), c([-0.6, 5.1, -4.6], [-5.0, 2.5, 3.2], 41)),
});
const hum = (t: number, t0: number): Expr => (t >= t0 && notePulse(t, t0) > 0.45 ? "talk" : "smile");
const s15 = mk("s15_hum", {
  scene: (t) => {
    const p = notePulse(t, E.hummed);
    const pose = M.mix(boardWrite(t), { armL: CONE_LOW, armLOut: 0.2, head: [-0.95, -0.03 + 0.04 * p], twist: -0.12, tilt: 0.04 * p }, M.idle(t, 31, 0.4));
    return <Room focus={[-3, 0, -14]}>{people(t, classPeople(t, { desk: true, teacher: teacherAt({ yaw: WRITE_YAW, pose, expr: hum(t, E.hummed) }) }), CLASS_CS)}</Room>;
  },
  cam: mv("s15_hum", c([2.6, 5.6, -11.2], [-3, 4.7, -16.2], 40), c([2.0, 5.4, -11.8], [-3, 4.7, -16.4], 38)),
});
const s16b = mk("s16b_lookup", {
  scene: (t) => {
    const lookUp = (i: number) => M.snap(M.seg(t, M.stagger(i, E.while9 - 0.05, 0.5, 3), M.stagger(i, E.while9 - 0.05, 0.5, 3) + 0.14), 2);
    const meUp = M.snap(M.seg(t, E.wrote - 0.1, E.wrote + 0.05), 2);
    const MD = DESK(ME_DESK);
    const meA = seated(MD.seat, MD.yaw, S.kid, write(t, 21, 1 - meUp), { head: [lookYaw([MD.seat[0], 0, MD.seat[2]], PI, [-3, 4.6, -16.4], 0.8) * meUp, 0] });
    return <Room focus={[-6, 0, 2]}>{people(t, classPeople(t, { desk: true, lookUp, meA, meExpr: meUp > 0.5 ? "worried" : "smile" }), CLASS_CS)}</Room>;
  },
  cam: mv("s16b_lookup", c([-1.8, 6.2, -11.2], [-6.5, 2.9, 3.0], 40), c([-2.4, 6.0, -10.4], [-6.8, 2.9, 3.0], 39)),
});
/** The hum that carries the wrong note: phrased from E.wrote (its 6th note = the word "wrong"). */
const WRONG_T0 = E.wrote;
const s17 = mk("s17_wrongnote", {
  scene: (t) => {
    const p = notePulse(t, WRONG_T0), wrong = isWrong(t, WRONG_T0);
    const wrongStart = WRONG_T0 + WRONG_IN_BAR * JINGLE_NOTE; // the 6th note of the bar
    const tiltIn = M.snap(M.seg(t, wrongStart, wrongStart + 0.08), 2.5);
    const wob = wrong ? Math.sin((t - wrongStart) * 42) * 0.07 : 0;
    const tilt = 0.42 * tiltIn - 0.1 * M.ease(M.seg(t, wrongStart + 0.25, wrongStart + 0.6)) + wob;
    const pose = M.mix({ armL: CONE_ARM_T, armR: 0.35, head: [0.22, -0.04 + 0.03 * p], tilt }, M.idle(t, 31, 0.3));
    const expr: Expr = t < wrongStart ? hum(t, WRONG_T0) : "creepy";
    return <Room focus={[-3, 0, -14]}>{people(t, classPeople(t, { desk: true, lookUp: () => 1, teacher: teacherAt({ yaw: 0.25, pose, expr, blink: t > wrongStart ? 0 : undefined, still: t > wrongStart }) }), CLASS_CS)}</Room>;
  },
  cam: mv("s17_wrongnote", c([-0.8, 5.0, -9.6], [-3, 4.55, -16.2], 34), c([-1.2, 4.95, -10.6], [-3, 4.6, -16.2], 31)),
});
const s18 = mk("s18_mefreeze", {
  scene: (t) => {
    const [a] = span("s18_mefreeze"), MD = DESK(ME_DESK);
    const up = M.snap(M.seg(t, a, a + 0.16), 2), tr = Math.sin(t * 38) * 0.012;
    const arm = WRITE_ARM + 0.3 * up;
    const meA = seated(MD.seat, MD.yaw, S.kid, { armR: arm + tr, armROut: -0.16, lean: 0.1 * (1 - up) - 0.02 * up, head: [0.12 * up, 0.45 * (1 - up) - 0.06 * up], tilt: tr * 2 });
    return <Room focus={[-11, 0, 0]}>{people(t, classPeople(t, { desk: true, lookUp: () => 1, frozen: 1, meA, meExpr: "scared", meHold: <Up arm={arm}><Pencil /></Up> }), CLASS_CS)}</Room>;
  },
  cam: mv("s18_mefreeze", c([-7.6, 4.3, -4.8], [-11, 3.15, 2.3], 38), c([-8.1, 4.1, -3.7], [-11, 3.2, 2.3], 35)),
});

export const SHOTS_SCHOOL: Shot[] = [s06, s07, s08, s09, s10, s11, s13, s12, s14, s16a, s15, s16b, s17, s18];

// Short 08 shots B: the hook (s01, s02) and beats 10-18 (s19 ... s36): the office corridor (peanuts, the leash, the fifty)
// and the gym (the doors, the forty, the sign, the first ticket, the ride). Plan: STORY_TESTS_v2.md section B, #1-2, #17-33.
// EVERY time comes from E / at(beat, "word") / span(id). Never type a second.
//
// THE LOOP: the gym is one continuous world in time. The hook (s01, s02) plays the gym at story time END + t, so frame 0
// continues exactly where s36 (the last shot) ends: same ride bounce, same counting, same line.
// COMEDY RULE: the elephant is EMPTY AIR. The riders sit on nothing; the kids and Hayes do all the moving.
import React from "react";
import type { Shot } from "../kit/core";
import { rnd } from "../kit/core";
import * as K from "../blocky/Collide";
import {
  act, mix, scale as scaleP, idle, walkPath, turn, yawTo, dAng, env, ease, seg, wave, raise, cheer, clap, headSnap, lookAround, recoil,
  crossArms, spread, talk, stagger, leanIn, laugh, nod, hips, type Act,
} from "../blocky/Motion";
import { Corridor, Gym, GYM, gymCS, corridorCS, CORRIDOR_SPOTS } from "../blocky/SchoolHall";
import { PeanutBag, peanutCS, Leash, HeldBill, StepStool, stoolCS, RidesSign, ridesCS, TicketTable, ticketTableCS, HeldTicket, STOOL } from "./Props08";
import { BRO, HAYES, KIDS, ME, S, E, END, span, mk, mv, c, Ch, st, Indoor, ride, RIDE_Y, STOOL_AT, TTABLE_AT, GYM_LINE, eyeY } from "./common";
import type { Expr, Look, Pose } from "../blocky/types";

type V3 = [number, number, number];
const T0 = (id: string) => span(id)[0];
const T1 = (id: string) => span(id)[1];
const clampA = (x: number, m = 1.2) => Math.max(-m, Math.min(m, x));

// ------------------------------------------------------------------------------------------------ people in a scene
type Pp = { id: string; look: Look; a: Act; s: number; expr?: Expr; hold?: { R?: React.ReactNode; L?: React.ReactNode }; lift?: number; noFeet?: boolean; blink?: number; allow?: string[] };
/** Every person as a <Ch/> straight in the tree, with the set colliders and the people near them as `others`. */
const cast = (t: number, ps: Pp[], cs: K.Box[], r = 7.5) => ps.map((p, k) => {
  const others = ps.filter((q) => q !== p && Math.hypot(q.a.position[0] - p.a.position[0], q.a.position[2] - p.a.position[2]) < r).map((q) => st(q.a, q.s, q.lift ?? 0));
  return <Ch key={p.id} look={p.look} a={p.a} t={t} scale={p.s} expr={p.expr} hold={p.hold} lift={p.lift ?? 0} noFeet={p.noFeet} blink={p.blink} blinkSeed={k * 1.37 + 0.4} cs={cs} others={others} allow={p.allow} />;
});
/** A pose layer turning the head (and a little of the body) toward a world point. */
const lookAt = (pos: V3, yaw: number, target: V3, w = 1, m = 1.2): Pose => {
  const d = clampA(dAng(yaw, yawTo(pos, target)), m);
  return { head: [d * 0.78 * w, 0], twist: d * 0.22 * w };
};

// ================================================================================================ THE GYM
const SIGN: V3 = [-8, 0, -3];
const SIGN_YAW = 0.25;
/** Gym colliders with the props (doors open unless told). */
const GCS = (doors = 1): K.Box[] => [...gymCS(doors), ...stoolCS(STOOL_AT), ...ridesCS(SIGN), ...ticketTableCS(TTABLE_AT)];
const GROUND = K.groundFn(GCS(1));
/** Where a rider sits: over the stool's top step. */
const RIDE_AT: V3 = [STOOL_AT[0], 0, STOOL_AT[2] - 0.4];
const RIDE_YAW = 0.45;
/** Hayes behind the ticket table (a step closer than HAYES_GYM so her hands reach over it), the customer mark in front. */
const HT: V3 = [TTABLE_AT[0] - 0.5, 0, TTABLE_AT[2] - 2.3];
const CUST: V3 = [TTABLE_AT[0] - 3.0, 0, TTABLE_AT[2] + 2.0];

/** THE LINE OF FORTY: lane A is the lead's GYM_LINE (two columns toward the doors), then it bends right along the doors
 *  wall (lane B) and comes back down the right side (lane C). Everyone faces the kid in front. */
const LINE = (i: number): { p: V3; yaw: number } => {
  // lane A follows GYM_LINE's rows, columns a little wider apart (4.2) so cheering arms never touch
  if (i < 12) { const g = GYM_LINE(i), col = i % 2; return { p: [col ? 6.3 : 2.1, 0, g[2]], yaw: Math.PI }; }
  if (i < 28) { const k = i - 12, col = k % 2, row = Math.floor(k / 2); return { p: [10.4 + row * 2.9, 0, 16.4 + col * 4.2], yaw: -Math.PI / 2 }; }
  const k = i - 28, col = k % 2, row = Math.floor(k / 2); return { p: [25.8 + col * 4.2, 0, 12.0 - row * 2.9], yaw: 0 };
};
const kidLook = (i: number) => KIDS[(i * 5 + 3) % KIDS.length];
const DOORS_AT: V3 = [0, 4.5, 28];
const RIDER_HEAD: V3 = [RIDE_AT[0], RIDE_Y + 2.5, RIDE_AT[2]];

/** One kid in the line at story time t (the gym's whole timeline: chatting, the doors, the sign, the first rider). */
const lineKid = (i: number, t: number, shown = true): Pp => {
  const { p, yaw } = LINE(i), sd = i * 1.91 + 0.3;
  const hasBill = i % 4 === 1;
  const wDoors = env(t, stagger(i, E.opened - 0.05, 0.45), E.tiny, 0.15, 0.35);
  const wSign = env(t, stagger(i, E.elephant15 - 0.12, 0.3, 2), T0("s31_front") + 0.3, 0.12, 0.3);
  const wBro = env(t, stagger(i, E.brother16, 0.4, 3), E.just + 0.2, 0.2, 0.3);
  const wRide = env(t, stagger(i, E.just + 0.1, 0.5, 4), Infinity, 0.25);
  const chat = t < E.opened - 0.2 && i % 5 === 2 ? talk(t, [E.lunch13, E.lunch13 + 0.3, E.opened - 0.6].map((w) => w + rnd(i) * 0.2)) : undefined;
  const pose = mix(
    idle(t, sd, 0.7),
    lookAt(p, yaw, DOORS_AT, wDoors),
    lookAt(p, yaw, [SIGN[0], 6, SIGN[2]], wSign),
    lookAt(p, yaw, CUST, wBro),
    lookAt(p, yaw, RIDER_HEAD, wRide),
    i % 3 === 0 && cheer(t, stagger(i, E.rides, 0.3), E.rides + 1.1),
    hasBill && t > E.ten15 && t < E.brother16 + 0.5 && raise(t, stagger(i, E.ten15, 0.35), E.brother16 + 0.5),
    // late (the ride): claps and cheers in turns, forever (the loop)
    t > E.just + 0.4 && i % 4 === 0 && clap(t, Math.floor((t + rnd(i) * 3) / 3) * 3 - rnd(i) * 3, Math.floor((t + rnd(i) * 3) / 3) * 3 - rnd(i) * 3 + 1.2),
    t > E.just + 0.4 && i % 4 === 2 && cheer(t, Math.floor((t + rnd(i + 5) * 3.5) / 3.5) * 3.5 - rnd(i + 5) * 3.5, Math.floor((t + rnd(i + 5) * 3.5) / 3.5) * 3.5 - rnd(i + 5) * 3.5 + 1.0),
  );
  let expr: Expr = i % 3 === 0 ? "grin" : "smile";
  if (chat) expr = chat === "talk" ? "talk" : "smile";
  if (wDoors > 0.3) expr = i % 2 ? "surprised" : "grin";
  if (t > E.elephant15 && t < E.rides + 0.2) expr = "surprised";
  else if (t >= E.rides + 0.2) expr = i % 3 === 0 ? "happy" : i % 3 === 1 ? "grin" : "laugh";
  if (t > E.just + 0.4) expr = i % 3 === 1 ? "happy" : i % 3 === 2 ? "grin" : "laugh";
  void shown;
  return { id: `k${i}`, look: kidLook(i), s: S.kid, a: { position: p, yaw, pose, seed: sd }, expr, hold: hasBill ? { R: <HeldBill v={10} /> } : undefined };
};
const theLine = (t: number, n = 40, filter?: (i: number) => boolean): Pp[] =>
  Array.from({ length: n }, (_, i) => i).filter((i) => !filter || filter(i)).map((i) => lineKid(i, t));

// ---------------------------------------------------------------- hopping up onto the stool (the game's way up a step)
const STOOL_FRONT: V3 = [STOOL_AT[0], 0, STOOL_AT[2] + 2.5];
const STOOL_TOP: V3 = [RIDE_AT[0], STOOL.top, RIDE_AT[2]];
/** A hop from `from` to `to` (feet points; y = the floor or step under them) over [t0, t0 + dur]: arms up, an arc. */
const hop = (t: number, t0: number, from: V3, to: V3, dur = 0.45, h = 1.0) => {
  const u = seg(t, t0, t0 + dur), air = u > 0 && u < 1, e = ease(u), k = Math.sin(Math.PI * u);
  return {
    position: [from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e + h * k, from[2] + (to[2] - from[2]) * e] as V3,
    pose: { armL: 2.5 * k, armR: 2.5 * k, armLOut: 0.2 * k, armROut: 0.2 * k, legL: 0.3 * k, legR: -0.1 * k, head: [0, -0.1 * k] } as Pose,
    air, done: u >= 1,
  };
};
/** A rider getting on: from standing on the stool top, a hop up onto the empty air, spinning to face the line. */
const mount = (t: number, t0: number, t1: number, s: number, yaw0 = Math.PI) => {
  const r = ride(t, t1, RIDE_Y, s as typeof S.kid), u = ease(seg(t, t0, t1));
  const lift = t < t1 ? STOOL.top + (r.lift - STOOL.top) * u + Math.sin(Math.PI * seg(t, t0, t1)) * 0.9 : r.lift;
  const yaw = t < t1 ? yaw0 + dAng(yaw0, RIDE_YAW) * u : RIDE_YAW;
  const pose: Pose = t < t1 ? { legL: (Math.PI / 2) * u, legR: (Math.PI / 2) * u, armL: 2.5 * (1 - u) + 1.25 * u, armR: 2.5 * (1 - u) + 1.25 * u } : r.pose;
  return { lift, yaw, pose };
};

// ---------------------------------------------------------------- BRO in the gym
const BRO_WAIT: V3 = [-1.4, 0, 10.6];
const B_RUN0 = T0("s31_front") - 1.1;
const B_RUN: V3[] = [BRO_WAIT, [-1.3, 0, 4.4], [-0.8, 0, 1.2], CUST];
const B_CLIMB0 = T0("s34_climbs") - 0.25;
const B_HOP0 = B_CLIMB0 + 0.62;
const B_MOUNT0 = B_HOP0 + 0.62, B_MOUNT1 = B_MOUNT0 + 0.42;
/** The fan of four tens (the change), in the hand frame. */
const FanTens: React.FC<{ k?: number }> = ({ k = 1 }) => <group>{[0, 1, 2, 3].map((i) => <group key={i} rotation={[0, 0, (i - 1.5) * 0.28]}><HeldBill v={10} k={k} /></group>)}</group>;
const CHANGE = E.money - 0.12;

/** BRO in the gym at story time t (waiting with THE fifty, running to the front, paying, climbing, riding forever). */
const broGym = (t: number): Pp => {
  const s = S.bro, base = { id: "bro", look: BRO, s };
  if (t < B_RUN0) { // waiting beside the line, the fifty held up, bouncing on his toes
    const bounce = Math.abs(Math.sin(t * 6)) * 0.12;
    return { ...base, a: { position: BRO_WAIT, yaw: Math.PI - 0.15, pose: mix(idle(t, 7, 1), raise(t, E.opened, Infinity), { head: [0, -0.1] }) }, lift: bounce, noFeet: true, expr: t > E.elephant15 ? "happy" : "grin", hold: { R: <HeldBill v={50} /> } };
  }
  if (t < B_CLIMB0) { // runs to the front, then buys ticket #1 and pays with THE fifty
    const w = walkPath(B_RUN, t, B_RUN0, { scale: s, gait: "run", yaw1: Math.PI, turnOut: 0.2 });
    const here = !w.moving && w.done;
    const c0: K.CharState = { position: w.position, yaw: w.yaw, scale: s, pose: { ...w.pose, lean: 0.15 } };
    const rk = here ? env(t, E.paid - 0.3, CHANGE + 0.55, 0.2, 0.25) : 0, lk = here ? env(t, E.ticket - 0.3, E.ticket + 0.4, 0.15, 0.25) : 0;
    const rr = K.reachArm({ ...c0, pose: { ...c0.pose, armR: 2.2 } }, -1, [CUST[0] + 0.95, 3.6, CUST[2] - 1.25]).pose;
    const ll = K.reachArm({ ...c0, pose: { ...c0.pose, armL: 2.2 } }, 1, [CUST[0] - 0.75, 3.25, CUST[2] - 1.5]).pose;
    const pose = mix(w.pose, here && idle(t, 7, 0.5), here && { lean: 0.15 * Math.max(rk, lk) },
      { armR: (rr.armR ?? 0) * rk + 2.7 * (1 - rk), armROut: (rr.armROut ?? 0) * rk + 0.1 * (1 - rk) },
      { armL: (ll.armL ?? 0) * lk, armLOut: (ll.armLOut ?? 0) * lk },
      t > CHANGE + 0.5 && cheer(t, CHANGE + 0.5, B_CLIMB0 + 0.2));
    const R = t < E.paid ? <HeldBill v={50} /> : t >= CHANGE ? <FanTens k={0.9} /> : undefined;
    const L = t >= E.ticket ? <HeldTicket n={1} /> : undefined;
    const expr: Expr = !here ? "grin" : t < E.paid ? "happy" : t < CHANGE ? "smirk" : "laugh";
    return { ...base, a: { ...w, pose }, expr, hold: { R, L }, noFeet: w.moving };
  }
  if (t < B_MOUNT0) { // to the stool, hop up onto its top step, stand there beaming
    if (t < B_HOP0) { const w = walkPath([[CUST[0] - 2.4, 0, CUST[2] + 1.4], STOOL_FRONT], t, B_CLIMB0, { scale: s, gait: "hurry" }); return { ...base, a: { ...w, pose: mix(w.pose, { armL: 0.3, head: [0, -0.15] }) }, expr: "happy", hold: { L: <HeldTicket n={1} /> } }; }
    const h = hop(t, B_HOP0, STOOL_FRONT, STOOL_TOP, 0.5, 1.0);
    return { ...base, a: { position: h.position, yaw: Math.PI, pose: mix(h.pose, h.done && idle(t, 7, 0.6)) }, noFeet: h.air, expr: "happy", hold: { L: <HeldTicket n={1} /> } };
  }
  const m = mount(t, B_MOUNT0, B_MOUNT1, s);
  const yee = env(t, END - 0.55, END + 1.25, 0.15, 0.2); // a cowboy wave over the loop point (s36 into the hook)
  const pose = t < B_MOUNT1 ? m.pose : mix(m.pose, wave(t, END - 0.55, END + 1.25, 1, 0.8), { armR: -1.25 * yee, armROut: -0.42 * yee });
  const expr: Expr = t < B_MOUNT1 ? "grin" : Math.floor(t * 1.3) % 3 === 2 ? "laugh" : "happy";
  return { ...base, a: { position: RIDE_AT, yaw: m.yaw, pose }, lift: m.lift, noFeet: true, expr };
};

// ---------------------------------------------------------------- the demo kid (tries the stool, rides first: free)
const DK0: V3 = [0.9, 0, 1.6];
const DK_LOOK = KIDS[3];
const DK_WALK0 = T0("s27_stool") - 0.35;
const DK_HOP0 = DK_WALK0 + 1.0, DK_TOP = DK_HOP0 + 0.5;
const DK_MOUNT0 = E.selling15 + 0.05, DK_MOUNT1 = DK_MOUNT0 + 0.35;
const DK_ASIDE: V3 = [-3.9, 0, 1.2];
const dkGym = (t: number): Pp => {
  const s = S.kid, base = { id: "dk", look: DK_LOOK, s };
  if (t < DK_WALK0) return { ...base, a: { position: DK0, yaw: Math.PI + 0.2, pose: mix(idle(t, 3, 1), lookAt(DK0, Math.PI + 0.2, [0, 1, -4], 0.8), { head: [0, 0.25] }) }, expr: "smile" };
  if (t < DK_HOP0) { const w = walkPath([DK0, STOOL_FRONT], t, DK_WALK0, { scale: s }); return { ...base, a: { ...w, pose: mix(w.pose, { head: [0, 0.1] }) }, expr: "smile" }; }
  if (t < DK_TOP) { const h = hop(t, DK_HOP0, STOOL_FRONT, STOOL_TOP, 0.5, 1.0); return { ...base, a: { position: h.position, yaw: Math.PI + dAng(Math.PI, RIDE_YAW) * ease(seg(t, DK_HOP0 + 0.1, DK_TOP)), pose: h.pose }, noFeet: h.air, expr: "grin" }; }
  if (t < DK_MOUNT0) { // on top: turns round, hesitates, looks around (is it there?)
    return { ...base, a: { position: STOOL_TOP, yaw: RIDE_YAW, pose: mix(idle(t, 3, 0.6), lookAround(t, DK_TOP + 0.1, DK_MOUNT0, 1, 0.8), { armL: 0.25, armR: 0.25, armLOut: 0.15, armROut: 0.15 }) }, expr: "worried" };
  }
  if (t < T0("s31_front")) {
    const m = mount(t, DK_MOUNT0, DK_MOUNT1, s, RIDE_YAW);
    const pose = t < DK_MOUNT1 ? m.pose : mix(m.pose, { armL: 1.4, armLOut: 0.35 + 0.2 * Math.sin(t * 11) });
    return { ...base, a: { position: RIDE_AT, yaw: m.yaw, pose }, lift: m.lift, noFeet: true, expr: t < DK_MOUNT1 ? "surprised" : "laugh" };
  }
  // done riding: beside the stool, cheering the next rider (forever)
  const k = Math.floor(t / 2.6);
  return { ...base, a: { position: DK_ASIDE, yaw: 0.9, pose: mix(idle(t, 3, 0.8), lookAt(DK_ASIDE, 0.9, RIDER_HEAD, 1), cheer(t, k * 2.6 + 0.2, k * 2.6 + 1.4)) }, expr: "happy" };
};

// ---------------------------------------------------------------- the next customer (pays the $10 Hayes takes)
const NK_LOOK = KIDS[6];
const NK_GO = E.each + 0.15;
const NK_SIDE: V3 = [11.2, 0, 1.0];
const nkGym = (t: number): Pp => {
  const s = S.kid, base = { id: "nk", look: NK_LOOK, s };
  if (t < NK_GO) {
    const c0: K.CharState = { position: CUST, yaw: Math.PI, scale: s, pose: { lean: 0.18 } };
    const give = env(t, E.ten15 - 0.3, E.each + 0.2, 0.25, 0.2);
    const r = K.reachArm({ ...c0, pose: { lean: 0.18, armR: 2.0 } }, -1, [CUST[0] + 1.15, 3.45, CUST[2] - 1.45]).pose;
    return { ...base, a: { position: CUST, yaw: Math.PI, pose: mix(idle(t, 9, 0.6), { armR: (r.armR ?? 0) * give + 2.6 * (1 - give), armROut: (r.armROut ?? 0) * give, lean: 0.18 * give }, { head: [0, 0.1 * give] }) }, expr: "grin", hold: { R: t < E.each ? <HeldBill v={10} /> : undefined } };
  }
  const w = walkPath([CUST, [CUST[0], 0, CUST[2] + 1.8], [CUST[0] + 2.5, 0, 1.5], NK_SIDE], t, NK_GO, { scale: s, gait: "hurry", yaw0: Math.PI, turnIn: 0.25, yaw1: -0.7 });
  return { ...base, a: { ...w, pose: mix(w.pose, !w.moving && idle(t, 9, 0.6), w.done && lookAt(NK_SIDE, -0.7, RIDER_HEAD, 1)) }, expr: "happy" };
};

// ---------------------------------------------------------------- HAYES in the gym
const HW_PATH: V3[] = [[-5.6, 0, 17], [-5.6, 0, 4.5], [-3.1, 0, -0.4]];
const HW0 = T0("s26_forty") - 0.6;
const HS_YAW = -0.55;
/** The cloth's grab point (its front lower right corner, just off the board's edge). */
const CLOTH_GRAB: V3 = (() => { const lx = 3.0, lz = 0.7, y = 4.4; return [SIGN[0] + lx * Math.cos(SIGN_YAW) + lz * Math.sin(SIGN_YAW), y, SIGN[2] - lx * Math.sin(SIGN_YAW) + lz * Math.cos(SIGN_YAW)]; })();
const PULL0 = E.selling15 - 0.06, PULL1 = E.elephant15 + 0.12;
const signCover = (t: number) => (t < PULL0 ? 1 : 1 - ease(seg(t, PULL0, PULL1)));
/** Hayes's counting at the table (the hook, s36): a bill in each hand, the right thumb flicking, a thumb-lick on "lunch". */
const counting = (t: number): Pose => {
  const h = t >= END - 3 ? t - END : t; // hook time (s01/s02 run at END + t; s36 at t)
  const lick = env(h, E.lunch1 - 0.45, E.lunch1 + 0.25, 0.15, 0.15);
  const flick = Math.max(0, Math.sin(h * 9)) * (1 - lick);
  return { armL: 1.5, armLOut: -0.3, armR: 1.5 + 0.12 * flick + 0.85 * lick, armROut: -0.28 - 0.2 * lick, head: [0.05, 0.3 - 0.3 * lick], lean: 0.05, tilt: 0.04 * flick };
};
const hayesGym = (t: number): Pp => {
  const base = { id: "hayes", look: HAYES, s: S.adult };
  if (t < T0("s30_take10")) { // walks to the covered sign, waits (arms folded), pulls the cloth on "selling elephant"
    const w = walkPath(HW_PATH, t, HW0, { gait: "hurry", yaw1: HS_YAW, turnOut: 0.3 });
    const c0: K.CharState = { position: w.position, yaw: w.yaw, scale: 1, pose: w.pose };
    const grab = env(t, PULL0 - 0.4, PULL0 + 0.02, 0.25, 0.01), yank = env(t, PULL0, PULL1 + 0.5, 0.06, 0.3);
    const g = K.reachArm({ ...c0, pose: { ...w.pose, armR: 1.8, armROut: 0.5 } }, -1, CLOTH_GRAB).pose;
    const pose = mix(w.pose, w.done && idle(t, 4, 0.6),
      { armR: (g.armR ?? 0) * grab, armROut: (g.armROut ?? 0) * grab },
      { armR: 2.4 * yank, armROut: 1.0 * yank, twist: -0.25 * yank, lean: -0.05 * yank },
      w.done && t < PULL0 - 0.4 && crossArms(t, HW0 + 2.7, PULL0 - 0.4));
    const expr: Expr = t < PULL0 ? "smile" : t < PULL1 + 0.15 ? "grin" : talk(t, [E.rides, E.ten15], "smirk");
    return { ...base, a: { ...w, pose }, expr, allow: t > PULL0 - 0.45 && t < PULL1 + 0.6 ? ["sign"] : undefined };
  }
  // at the table: takes the $10 (s30), hands out ticket #1 (s32), takes THE fifty and gives $40 change (s33),
  // pockets the ten with a smirk at us (s35), then counts the money (s36 and the hook)
  const lean = 0.42;
  const HL: V3 = [HT[0] + 2.0, 0, HT[2]];
  const c0: K.CharState = { position: HT, yaw: 0, scale: 1, pose: { lean } };
  const reachR = (p: V3) => K.reachArm({ ...c0, pose: { lean, armR: 1.6 } }, -1, p).pose;
  const takeR = reachR([CUST[0] + 1.0, 3.6, CUST[2] - 2.0]);
  const tickR = reachR([CUST[0] + 0.9, 3.55, CUST[2] - 2.05]);
  const payR = reachR([CUST[0] + 1.0, 3.5, CUST[2] - 2.05]);
  const wTake = env(t, E.ten15 - 0.2, E.each + 0.3, 0.2, 0.3), wTick = env(t, E.first16 - 0.3, E.ticket + 0.3, 0.2, 0.25);
  const wPay = env(t, E.paid - 0.2, CHANGE + 0.55, 0.2, 0.3);
  const w = Math.max(wTake, wTick, wPay);
  const pocket = env(t, E.first18 - 0.2, Infinity, 0.3);
  const late = t >= T0("s36_wide"); // she has stepped to the end of the table (her face clear of the cash box lid)
  const fold = late ? 0 : 1 - Math.max(w, pocket);
  const pose = mix(late ? counting(t) : idle(t, 4, 0.6),
    !late && (() => { const ca = crossArms(t, -10); return { armL: (ca.armL ?? 0) + 0.15 + lean * w * 1.1, armLOut: ca.armLOut, armR: ((ca.armR ?? 0) + 0.15) * fold, armROut: (ca.armROut ?? 0) * fold }; })(),
    !late && { lean: lean * w },
    { armR: (takeR.armR ?? 0) * wTake + (tickR.armR ?? 0) * wTick + (payR.armR ?? 0) * wPay, armROut: (takeR.armROut ?? 0) * wTake + (tickR.armROut ?? 0) * wTick + (payR.armROut ?? 0) * wPay },
    !late && pocket > 0 && { armR: -0.12 * pocket, armROut: 0.3 * pocket },
    !late && t > E.first18 - 0.3 && headSnap(t, E.first18 - 0.25, 0.42, -0.04, E.first18 + 0.6),
  );
  const R = t > E.each - 0.05 && t < E.first16 - 0.3 ? <HeldBill v={10} /> : t >= E.first16 - 0.3 && t < E.ticket ? <HeldTicket n={1} /> :
    t >= E.paid && t < CHANGE ? <HeldBill v={50} /> : t >= CHANGE - 0.02 && t < CHANGE + 0.02 ? undefined : t > CHANGE + 0.3 && t < E.first18 + 0.25 ? <HeldBill v={10} /> :
    late ? <HeldBill v={10} /> : undefined;
  const L = t >= CHANGE ? <HeldBill v={50} /> : undefined;
  const expr: Expr = t > E.first18 - 0.3 ? "smirk" : t > E.paid && t < CHANGE + 0.6 ? "smirk" : wTick > 0.3 ? "smile" : talk(t, [E.ten15, E.each], "smirk");
  return { ...base, a: { position: late ? HL : HT, yaw: 0, pose }, expr, hold: { R, L } };
};

/** Everyone in the gym at story time t (line filtered for cost where a shot sees only part of it). */
const gymCast = (t: number, o: { line?: (i: number) => boolean; bro?: boolean; hayes?: boolean; dk?: boolean; nk?: boolean } = {}): Pp[] => [
  ...theLine(t, 40, o.line),
  ...(o.bro === false ? [] : [broGym(t)]),
  ...(o.hayes === false ? [] : [hayesGym(t)]),
  ...(o.dk === false ? [] : [dkGym(t)]),
  ...(o.nk === false || t < E.ten15 - 1.5 ? [] : [nkGym(t)]),
];
/** The gym set with its props. `cover` for the sign (1 = hidden: every shot before s28). */
const GymSet: React.FC<{ doors?: number; cover?: number; cash?: number; children?: React.ReactNode; focus: V3 }> = ({ doors = 1, cover = 1, cash = 0.5, children, focus }) => <Indoor focus={focus}>
  <Gym doorsOpen={doors} />
  <StepStool p={STOOL_AT} />
  <RidesSign p={SIGN} yaw={SIGN_YAW} cover={cover} />
  <TicketTable p={TTABLE_AT} cash={cash} />
  {children}
</Indoor>;
/** The late gym (the ride) as the hook sees it: story time END + t. */
const hookScene = (t: number, cash: number) => {
  const tt = END + t;
  return <GymSet focus={[2.5, 0, -3]} cover={1} cash={cash}>{cast(tt, gymCast(tt, { line: (i) => i < 28 }), GCS(1))}</GymSet>;
};

// ================================================================================================ THE CORRIDOR
const BAG_AT: V3 = [CORRIDOR_SPOTS.officeWallProp[0] - 0.3, 0, CORRIDOR_SPOTS.officeWallProp[2] - 0.6];
const BAG_YAW = -0.75;
const CCS = (open = 1): K.Box[] => [...corridorCS(open), ...peanutCS(BAG_AT)];
const ME_PATH: V3[] = [[0.5, 0, -23.2], [0.5, 0, -16.9]];
const ME_WALK0 = T0("s19_walkpast") - 0.55;
const ME_STOP = ME_PATH[1];
const BAG_FACE: V3 = [BAG_AT[0], 3.0, BAG_AT[2]];
const DOOR_MID: V3 = [8, 3.5, -18];
/** ME in the corridor: walks past the door, stops, snaps to the bag, stares; watches BRO in and out. */
const meCorr = (t: number): Pp => {
  const w = walkPath(ME_PATH, t, ME_WALK0, { scale: S.kid });
  const tb = turn(0, 0.55, t, E.her10 - 0.15, 0.45);
  const yaw = t > E.her10 - 0.15 ? tb.yaw : w.yaw;
  const pos = w.position;
  const snapBag = t > E.giant - 0.05 ? headSnap(t, E.giant - 0.04, clampA(dAng(yaw, yawTo(pos, BAG_FACE)) * 0.95, 1.25), 0.05) : {};
  const toDoor = env(t, E.went - 0.1, Infinity, 0.3);
  const doorLook = lookAt(pos, yaw, BRO_EYE(t), 1, 1.25);
  const pose = mix(w.pose, !w.moving && idle(t, 11, 0.6),
    t > E.giant - 0.05 && t < E.went && recoil(t, E.giant, E.peanuts + 0.1),
    t < E.went + 0.1 ? snapBag : {},
    toDoor > 0 && { head: [(doorLook.head?.[0] ?? 0) * toDoor, 0], twist: (doorLook.twist ?? 0) * toDoor },
    t > E.her10 && t < E.went && leanIn(t, E.her10, E.went, 0),
    t > E.empty11 - 0.1 && t < E.came && { lean: -0.08, tilt: 0.18, armL: 0.35, armR: 0.35, armLOut: -0.15, armROut: -0.15, head: [0, 0.12] },
    t > E.fifty - 0.1 && recoil(t, E.fifty - 0.05, Infinity));
  const expr: Expr = t < E.giant ? "smile" : t < E.her10 ? "surprised" : t < E.went ? "stare" : t < E.empty11 - 0.1 ? "worried" : t < E.came ? "worried" : t < E.fifty - 0.1 ? "stare" : "surprised";
  return { id: "me", look: ME, s: S.kid, a: { position: pos, yaw, walk: t > E.her10 - 0.15 ? tb.walk ?? w.walk : w.walk, pose }, expr, blink: t > E.empty11 - 0.05 && t < E.empty11 + 0.45 ? 1 : undefined };
};
// BRO into the office (leash held high: something tall is on it) and back out waving the fifty
const BIN_PATH: V3[] = [[3.65, 0, -14.9], [3.65, 0, -17.4], [11.0, 0, -18.1]];
const BIN0 = T0("s22_goesin") - 0.45;
const BOUT_PATH: V3[] = [[11.0, 0, -18.1], [3.65, 0, -17.6], [3.65, 0, -14.9], [3.2, 0, -7]];
const BOUT0 = E.came - 0.35;
const broCorr = (t: number): Pp | null => {
  if (t < T0("s22_goesin")) return null;
  const s = S.bro;
  if (t < T0("s24_comesout")) {
    const w = walkPath(BIN_PATH, t, BIN0, { scale: s, gait: "hurry" });
    return { id: "bro", look: BRO, s, a: { ...w, pose: mix(w.pose, { armR: 2.15, armROut: 0.1, head: [0.15, -0.38], lean: -0.04 }) }, expr: "happy", hold: { R: <Leash up /> } };
  }
  const w = walkPath(BOUT_PATH, t, BOUT0, { scale: s, gait: "walk" });
  return { id: "bro", look: BRO, s, a: { ...w, pose: mix(w.pose, wave(t, E.out12, Infinity, 1, 0.9)) }, expr: t < E.fifty ? "grin" : "laugh", hold: { R: <HeldBill v={50} /> } };
};
const BRO_EYE = (t: number): V3 => { const b = broCorr(t); return b ? [b.a.position[0], 2.4, b.a.position[2]] : DOOR_MID; };
// Hayes in her office behind the door (seen through it): beckons him in, then folds her arms with a smirk
const HO: V3 = [15.3, 0, -20.6];
const hayesOffice = (t: number): Pp => ({
  id: "hayes", look: HAYES, s: 1, a: { position: HO, yaw: -Math.PI / 2 - 0.15, pose: mix(idle(t, 4, 0.7), t < E.came ? wave(t, E.went - 0.2, E.leash11 + 0.3, -1, 0.6) : crossArms(t, E.came - 0.3)) },
  expr: t < E.came ? "smile" : "smirk",
});
const corrCast = (t: number, hayes = false): Pp[] => [meCorr(t), ...(broCorr(t) ? [broCorr(t)!] : []), ...(hayes ? [hayesOffice(t)] : [])];
const CorrSet: React.FC<{ focus: V3; children?: React.ReactNode }> = ({ focus, children }) => <Indoor focus={focus}>
  <Corridor officeOpen={1} />
  <PeanutBag p={BAG_AT} yaw={BAG_YAW} lean={0.08} />
  {children}
</Indoor>;
const corrScene = (t: number, focus: V3, hayes = false) => <CorrSet focus={focus}>{cast(t, corrCast(t, hayes), CCS(1))}</CorrSet>;

// ================================================================================================ the doors (s25)
const HD_PATH: V3[] = [[0, 0, 33.6], [0, 0, 30.0]];
const HD0 = T0("s25_doors") - 0.9;
const PUSH0 = E.opened - 0.3, PUSH1 = E.opened + 0.2;
const doorsOpen = (t: number) => (t < PUSH0 ? 0 : t < PUSH1 ? 0.33 * ease(seg(t, PUSH0, PUSH1)) : 0.33 + 0.67 * ease(seg(t, PUSH1, E.doors + 0.1)));
const HIN_PATH: V3[] = [[0, 0, 28.6], [0.2, 0, 23.0]];
const HIN0 = E.gym - 0.05;
/** A push point on a door leaf (like gymHandle, but `along` from the hinge: nearer the hinges than the handles, so her
 *  hands sit shoulder-wide on the two leaves instead of crossing in front of her). */
const leafPoint = (side: 1 | -1, open: number, along: number, out = 0.45): V3 => {
  const a = open * (Math.PI / 2) * 0.92, hx = side * GYM.doorW;
  return [hx - side * along * Math.cos(a) - side * out * Math.sin(a), 3.7, GYM.z1 + 0.2 - along * Math.sin(a) + out * Math.cos(a)];
};
const hayesDoors = (t: number): Pp => {
  const base = { id: "hayes", look: HAYES, s: 1 };
  if (t < HIN0) {
    const w = walkPath(HD_PATH, t, HD0, { yaw1: Math.PI });
    const step = ease(seg(t, PUSH0 - 0.05, PUSH1)) * 1.2; // a step in with the push
    const pos: V3 = [w.position[0], 0, w.position[2] - step];
    const c0: K.CharState = { position: pos, yaw: Math.PI, scale: 1, pose: { lean: 0.2 } };
    const o = doorsOpen(Math.min(t, PUSH1));
    const hold = env(t, PUSH0 - 0.3, PUSH1 + 0.12, 0.2, 0.15);
    const rL = K.reachArm({ ...c0, pose: { lean: 0.2, armL: 1.5 } }, 1, leafPoint(1, o, 3.4)).pose;
    const rR = K.reachArm({ ...c0, pose: { lean: 0.2, armR: 1.5 } }, -1, leafPoint(-1, o, 3.4)).pose;
    const pose = mix(w.pose, idle(t, 4, 0.5), { lean: 0.2 * hold, armL: (rL.armL ?? 0) * hold, armLOut: Math.max(-0.2, rL.armLOut ?? 0) * hold, armR: (rR.armR ?? 0) * hold, armROut: Math.max(-0.2, rR.armROut ?? 0) * hold });
    return { ...base, a: { position: pos, yaw: Math.PI, walk: w.walk, pose }, expr: t < PUSH0 ? "smile" : "smirk", allow: ["door"] };
  }
  const w = walkPath(HIN_PATH, t, HIN0, { gait: "walk" });
  return { ...base, a: { ...w, pose: mix(w.pose, spread(t, E.doors - 0.05, E.doors + 1.0)) }, expr: "grin" };
};

// ================================================================================================ the shots
const stoolFocus: V3 = [1.5, 0, -3];
export const SHOTS_B: Shot[] = [
  // ---------------------------------------------------------------- b1 THE HOOK: BRO riding the empty air, Hayes counting
  mk("s01_hook", {
    scene: (t) => hookScene(t, 1),
    cam: mv("s01_hook", c([4.4, 6.0, 9.8], [3.0, 3.8, -4.0], 50), c([4.2, 5.6, 8.0], [3.0, 3.9, -4.0], 47), 0.008),
  }),
  mk("s02_cash", {
    scene: (t) => hookScene(t, 1),
    cam: mv("s02_cash", c([3.0, 6.6, 3.2], [5.6, 3.8, -3.6], 44), c([3.2, 6.4, 2.4], [5.7, 3.9, -3.7], 40), 0.005),
  }),

  // ---------------------------------------------------------------- b10 the office corridor, next morning
  mk("s19_walkpast", {
    scene: (t) => corrScene(t, [-0.6, 0, -19]),
    cam: mv("s19_walkpast", c([-6.6, 5.0, -6.2], [1.2, 3.6, -18.6], 50), c([-6.4, 4.9, -6.6], [1.4, 3.5, -17.6], 49)),
  }),
  mk("s20_bag", { // CLUE: the giant bag of peanuts by the PRINCIPAL door; ME's head snaps to it
    scene: (t) => corrScene(t, [3, 0, -15]),
    cam: mv("s20_bag", c([2.8, 4.8, 1.0], [4.3, 3.0, -15.5], 54), c([2.9, 4.6, -0.2], [4.4, 3.0, -15.4], 51)),
  }),
  mk("s21_bagwide", {
    scene: (t) => corrScene(t, [3, 0, -16]),
    cam: mv("s21_bagwide", c([-4.5, 5.6, -3.0], [4.5, 3.7, -16.0], 55), c([-4.3, 5.5, -3.8], [4.6, 3.7, -16.2], 54)),
  }),
  // ---------------------------------------------------------------- b11 in with the empty leash, held high
  mk("s22_goesin", {
    scene: (t) => corrScene(t, [5, 0, -17.5], true),
    cam: mv("s22_goesin", c([-5.6, 4.6, -10.2], [6.5, 3.6, -18.0], 50), c([-5.2, 4.5, -10.8], [7.5, 3.6, -18.3], 49)),
  }),
  mk("s23_wince", {
    scene: (t) => corrScene(t, ME_STOP),
    cam: mv("s23_wince", c([5.6, 3.7, -19.6], [0.5, 3.5, -16.9], 40), c([5.2, 3.7, -19.3], [0.5, 3.5, -16.9], 37)),
  }),
  // ---------------------------------------------------------------- b12 out waving the fifty
  mk("s24_comesout", {
    scene: (t) => corrScene(t, [4, 0, -16], true),
    cam: mv("s24_comesout", c([-5.0, 4.2, -9.0], [5.0, 3.2, -16.8], 52), c([-4.6, 4.0, -7.6], [3.6, 3.0, -13.5], 52)),
  }),

  // ---------------------------------------------------------------- b13 lunch: she opens the gym doors
  mk("s25_doors", {
    scene: (t) => <GymSet doors={doorsOpen(t)} focus={[0, 0, 26]} cover={1}>
      <pointLight position={[0, 9, 36]} intensity={90} distance={26} color="#fff2dc" />
      <mesh position={[0, 6, 44.5]} receiveShadow><boxGeometry args={[30, 12, 1]} /><meshStandardMaterial color="#e6dcc6" roughness={0.9} /></mesh>
      {cast(t, [...theLine(t, 40, (i) => i < 22), broGym(t), hayesDoors(t)], [...gymCS(doorsOpen(t)), ...stoolCS(STOOL_AT), ...ridesCS(SIGN), ...ticketTableCS(TTABLE_AT)])}
    </GymSet>,
    cam: mv("s25_doors", c([-7.5, 5.6, 13.5], [0.4, 4.6, 27.5], 52), c([-6.8, 5.0, 12.0], [0.6, 4.4, 26.5], 50)),
  }),
  // ---------------------------------------------------------------- b14 forty kids beside a tiny step stool (the game camera)
  mk("s26_forty", {
    scene: (t) => <GymSet focus={[6, 0, 6]} cover={1}>{cast(t, gymCast(t, { nk: false }), GCS(1))}</GymSet>,
    cam: mv("s26_forty", c([-15, 20, 26], [6, 0, 2], 58), c([-17, 19, 23], [5, 0, 1], 58), 0.01),
  }),
  mk("s27_stool", {
    scene: (t) => <GymSet focus={stoolFocus} cover={1}>{cast(t, gymCast(t, { line: (i) => i < 12, nk: false }), GCS(1))}</GymSet>,
    cam: mv("s27_stool", c([-2.0, 3.6, 8.0], [0.2, 2.8, -3.8], 46), c([-1.6, 3.8, 6.8], [0.2, 3.0, -4.0], 44)),
  }),
  // ---------------------------------------------------------------- b15 THE TWIST: ELEPHANT RIDES $10
  mk("s28_sign", {
    scene: (t) => <GymSet focus={[-4, 0, -2]} cover={signCover(t)}>{cast(t, gymCast(t, { line: (i) => i < 12, nk: false }), GCS(1))}</GymSet>,
    cam: mv("s28_sign", c([-1.0, 4.6, 8.5], [-5.6, 4.9, -2.6], 52), c([-1.4, 4.8, 7.6], [-5.9, 5.1, -2.8], 50)),
  }),
  mk("s29_ride", {
    scene: (t) => <GymSet focus={stoolFocus} cover={0}>{cast(t, gymCast(t, { line: (i) => i < 12 }), GCS(1))}</GymSet>,
    cam: mv("s29_ride", c([-0.6, 4.6, 6.0], [0.2, 4.5, -4.3], 46), c([-0.5, 4.5, 5.0], [0.2, 4.6, -4.3], 43)),
  }),
  mk("s30_take10", { // close on the money: her hand takes the $10
    scene: (t) => <GymSet focus={[4.5, 0, -2]} cover={0}>{cast(t, gymCast(t, { line: (i) => i < 6 }), GCS(1))}</GymSet>,
    cam: mv("s30_take10", c([2.0, 4.6, -6.6], [3.7, 3.4, -1.8], 44), c([2.2, 4.5, -6.2], [3.8, 3.4, -1.8], 40)),
  }),
  // ---------------------------------------------------------------- b16 BRO buys the first ticket
  mk("s31_front", {
    scene: (t) => <GymSet focus={[1, 0, 3]} cover={0}>{cast(t, gymCast(t, { line: (i) => i < 16 }), GCS(1))}</GymSet>,
    cam: mv("s31_front", c([-8.5, 4.2, 9.5], [1.5, 2.4, 2.0], 50), c([-8.0, 4.0, 7.5], [2.6, 2.4, 0.6], 50)),
  }),
  mk("s32_ticket", {
    scene: (t) => <GymSet focus={[4.5, 0, -2]} cover={0}>{cast(t, gymCast(t, { line: (i) => i < 10 }), GCS(1))}</GymSet>,
    cam: mv("s32_ticket", c([-0.6, 4.2, -6.2], [3.8, 3.2, -1.8], 48), c([-0.3, 4.2, -5.8], [3.8, 3.3, -1.8], 46)),
  }),
  // ---------------------------------------------------------------- b17 he pays with THE fifty; $40 change
  mk("s33_fifty", {
    scene: (t) => <GymSet focus={[4.5, 0, -2]} cover={0}>{cast(t, gymCast(t, { line: (i) => i < 6 }), GCS(1))}</GymSet>,
    cam: mv("s33_fifty", c([0.8, 4.4, -5.2], [3.9, 3.3, -1.9], 42), c([1.0, 4.3, -4.9], [3.9, 3.3, -1.9], 38)),
  }),
  mk("s34_climbs", {
    scene: (t) => <GymSet focus={stoolFocus} cover={0}>{cast(t, gymCast(t, { line: (i) => i < 28 }), GCS(1))}</GymSet>,
    cam: mv("s34_climbs", c([3.6, 3.2, -14.5], [0, 2.4, -2.5], 44), c([3.0, 3.4, -13.5], [0, 2.6, -2.8], 42)),
  }),
  // ---------------------------------------------------------------- b18 the first ten dollars she made
  mk("s35_smirk", {
    scene: (t) => <GymSet focus={[5, 0, -3]} cover={0}>{cast(t, gymCast(t, { line: (i) => i < 12 }), GCS(1))}</GymSet>,
    cam: mv("s35_smirk", c([8.6, 5.6, 2.6], [5.0, 4.4, -4.6], 44), c([8.2, 5.5, 1.8], [5.0, 4.4, -4.6], 40)),
  }),
  mk("s36_wide", { // wide high: BRO riding mid-gym, the forty behind; cranes down toward the hook's framing (cuts into s01)
    scene: (t) => <GymSet focus={[3, 0, 0]} cover={0} cash={1}>{cast(t, gymCast(t), GCS(1))}</GymSet>,
    cam: mv("s36_wide", c([14, 19, 25], [3, 1.5, 0], 56), c([6.0, 8.6, 13.5], [3.0, 3.8, -4.0], 50), 0.008),
  }),
];
void [eyeY, nod, laugh, hips, act];

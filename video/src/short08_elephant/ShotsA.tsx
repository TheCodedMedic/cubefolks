// Short 08 "The Invisible Elephant", SHOTS A: beats 2-9 (s03_yard .. s18_list). Plan: notes/cubefolks/STORY_TESTS_v2.md B #3-16.
// EVERY time comes from E / at(beat, "word") / span(id). Never a typed second.
// COMEDY RULE: every invisible pet's space stays EMPTY. Leashes are stiff novelty leashes: the collar goes wherever the
// kid's own hand puts it. Coach's horse is nothing: he hops, gallops on his own feet, and bonks a real tree.
// Every person is a <Ch/> directly in the returned tree, with the set's colliders (cs) and the other people (others).
import React from "react";
import * as THREE from "three";
import { SchoolYard } from "../short06_blocky/Town";
import { Corridor, corridorCS } from "../blocky/SchoolHall";
import * as K from "../blocky/Collide";
import * as M from "../blocky/Motion";
import type { Expr, Look, Pose, Walk } from "../blocky/types";
import { Bill, HeldBill as HeldBillA, CashBox, Leash, PetBox, Certificate, TABLE, tableCS, Field, treeCS, canvasTex } from "./Props08";
import { type CamS } from "../kit/core";
import {
  BRO, COACH, HAYES, KIDS, TEACHER, S, E, P, mk, mv, c, Ch, st, Outdoor, Indoor, YARD_TABLE, CUSTOMER, YARD_LINE, TREE_AT,
  span, blinkOn, type ActLike, type V3, type Shot,
} from "./common";

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const L3 = (a: V3, b: V3, u: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const nz = (t: number, k: number) => Math.sin(t * 1.7 + k * 2.1) * 0.6 + Math.sin(t * 2.9 + k * 1.3) * 0.4;
/** A pose layer that cancels the walk's arm swing (arms folded while walking). */
const noSwing = (w?: Walk): Pose => { const s = w ? Math.sin(w.phase) * 0.75 * w.amount : 0; return { armL: s, armR: -s }; };
/** Pose a character so its hand(s) land on world targets (K.reachArm); side 1 = left, -1 = right. */
const reach = (a: ActLike, s: number, targets: { L?: V3; R?: V3 }): ActLike => {
  let pose = { ...(a.pose ?? {}) };
  for (const [side, tg] of [[1, targets.L], [-1, targets.R]] as [1 | -1, V3 | undefined][]) {
    if (!tg) continue;
    const r = K.reachArm({ position: a.position, yaw: a.yaw, scale: s, pose, walk: a.walk }, side, tg);
    pose = { ...pose, ...r.pose };
  }
  return { ...a, pose };
};
const hand = (a: ActLike, s: number, side: 1 | -1, lift = 0): V3 => K.handEnd({ position: [a.position[0], a.position[1] + lift, a.position[2]], yaw: a.yaw, scale: s, pose: a.pose, walk: a.walk }, side);
const at0 = (p: V3, yaw: number, pose: Pose = {}, walk?: Walk): ActLike => ({ position: p, yaw, pose, walk });

// ================================================================================================ the yard: BRO's stand
// Our own copy of the pet stand (Props08 PetTable look) so the cash box can leave the table (s17) and pieces can slide.
const standSignTex = () => canvasTex("A_standSign", 768, 192, (g, w, h) => {
  g.fillStyle = "#fbf6e8"; g.fillRect(0, 0, w, h);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "#2f6fc8"; g.font = "900 92px Comic Sans MS, Arial"; g.fillText("INVISIBLE PETS", w / 2, h * 0.38);
  g.fillStyle = "#d0322a"; g.font = "900 62px Comic Sans MS, Arial"; g.fillText("$5 EACH!!", w / 2, h * 0.8);
});
const ROWS = ["DOG", "CAT", "HAMSTER", "SNAKE", "HORSE", "DRAGON", "ELEPHANT"];
/** The price list: everything crossed out except ELEPHANT (the clue in beat 9). Bold for a phone. */
const priceTex = () => canvasTex("A_priceList", 512, 768, (g, w, h) => {
  g.fillStyle = "#fbf6e8"; g.fillRect(0, 0, w, h); g.fillStyle = "#cfe0f4"; for (let y = 150; y < h; y += 86) g.fillRect(0, y, w, 4);
  g.strokeStyle = "#2f6fc8"; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = "#1b1410"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 84px Comic Sans MS, Arial"; g.fillText("PRICES", w / 2, 80);
  ROWS.forEach((r, i) => {
    const y = 200 + i * 80, el = r === "ELEPHANT";
    g.textAlign = "left"; g.fillStyle = el ? "#1e4fb0" : "#3a3a3a"; g.font = `900 ${el ? 60 : 56}px Comic Sans MS, Arial`; g.fillText(r, 26, y);
    g.textAlign = "right"; g.fillText("$5", w - 24, y);
    if (!el) { g.strokeStyle = "#d0322a"; g.lineWidth = 9; g.beginPath(); g.moveTo(14, y - 2); g.lineTo(w - 14, y - 10); g.stroke(); }
  });
});
const Card: React.FC<{ p?: V3; rot?: V3; s: [number, number]; map: THREE.Texture; glow?: number }> = ({ p, rot, s, map, glow = 0 }) => (
  <mesh position={p} rotation={rot} castShadow receiveShadow><planeGeometry args={s} />
    <meshStandardMaterial map={map} side={THREE.DoubleSide} roughness={0.8} emissive="#ffffff" emissiveMap={map} emissiveIntensity={glow} /></mesh>
);
const Bx: React.FC<{ p: V3; s: V3; c: string; metal?: number }> = ({ p, s, c, metal = 0 }) => (
  <mesh position={p} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={c} roughness={0.6} metalness={metal} /></mesh>
);
/** Price list placement on the stand (table-local: back-left corner, turned a little toward the customers' end), and a
 *  point on it: u across (-0.8..0.8), v up (-1.2..1.2), `out` off its face. */
const LIST_L: V3 = [-2.45, TABLE.top, -0.2];
const LIST_ROT = new THREE.Euler(-0.16, 0.32, 0);
const listPoint = (u: number, v: number, out = 0): V3 => {
  const q = new THREE.Vector3(u, v + 1.2, out).applyEuler(LIST_ROT);
  return [YARD_TABLE[0] + LIST_L[0] + q.x, YARD_TABLE[1] + LIST_L[1] + q.y, YARD_TABLE[2] + LIST_L[2] + q.z];
};
/** The list rows' heights on the card (v), top row first (matches priceTex). */
const rowV = (i: number) => 1.2 - ((200 + i * 80) / 768) * 2.4;
/** The cash box's spot on the stand (world, bottom centre: at BRO's right) and its scale. */
const CASH_K = 0.72;
const CASH_AT: V3 = [YARD_TABLE[0] - 1.75, TABLE.top, YARD_TABLE[2] - 0.85];
const Stand: React.FC<{ cash?: boolean; fill?: number; boxes?: number; leashes?: number; certs?: number; glow?: number }> = ({ cash = true, fill = 0.5, boxes = 2, leashes = 2, certs = 3, glow = 0.12 }) => (
  <group position={YARD_TABLE}>
    <Bx p={[0, TABLE.top - 0.1, 0]} s={[TABLE.w, 0.2, TABLE.d]} c="#e8e4da" />
    {[[-2.7, -1.2], [2.7, -1.2], [-2.7, 1.2], [2.7, 1.2]].map(([x, z], i) => <Bx key={i} p={[x, (TABLE.top - 0.2) / 2, z]} s={[0.15, TABLE.top - 0.2, 0.15]} c="#6a6e74" metal={0.5} />)}
    <Card p={[0, 1.15, TABLE.d / 2 + 0.03]} s={[5.6, 1.4]} map={standSignTex()} glow={0.1} />
    <group position={LIST_L} rotation={[LIST_ROT.x, LIST_ROT.y, 0]}>
      <Card p={[0, 1.2, 0]} s={[1.6, 2.4]} map={priceTex()} glow={glow} />
      <Bx p={[0, 1.2, -0.04]} s={[1.7, 2.5, 0.05]} c="#b88a58" />
      <Bx p={[0, 0.6, -0.25]} s={[0.12, 1.3, 0.12]} c="#8a5a32" />
    </group>
    {cash && <group position={[CASH_AT[0] - YARD_TABLE[0], TABLE.top, CASH_AT[2] - YARD_TABLE[2]]} scale={CASH_K}><CashBox fill={fill} /></group>}
    {Array.from({ length: boxes }, (_, i) => <PetBox key={i} p={[1.7 + i * 0.85, TABLE.top, 0.55 - i * 0.6]} k={0.7} rot={[0, 0.25 * i - 0.2, 0]} />)}
    {Array.from({ length: certs }, (_, i) => <Certificate key={i} p={[0.2 + i * 0.1, TABLE.top + 0.02 + i * 0.01, 0.95]} rot={[-Math.PI / 2, 0, 0.1 * i]} k={0.32} />)}
    {Array.from({ length: leashes }, (_, i) => <group key={i} position={[-1.3 + i * 0.5, TABLE.top + 0.06, 0.9]} rotation={[Math.PI / 2, 0, 0.3 - i * 0.5]} scale={0.6}><Leash reach={2.2} drop={0.05} /></group>)}
  </group>
);
/** A leash lying flat on the table (world p = the handle, pointing along `dir` yaw). */
const FlatLeash: React.FC<{ p: V3; yaw?: number; k?: number }> = ({ p, yaw = 0, k = 0.6 }) => (
  <group position={p} rotation={[0, yaw, 0]}><group rotation={[Math.PI / 2, 0, 0]} scale={k}><Leash reach={2.2} drop={0.05} /></group></group>
);
// The yard's solid things (Short 6 Town.tsx schoolYard): the school, benches, tetherball pole, hoop pole, swings, picnic table.
const YARD_CS: K.Box[] = [
  K.box([0, 11.5, -35], [110, 23, 30], "school"),
  K.box([-18, 0.35, -17], [12, 0.7, 6], "steps"),
  ...[6, 20, 38].map((bx) => K.box([bx, 1.5, -17], [6, 3.0, 1.8], "bench")),
  K.box([22, 5.5, 6], [1.6, 11, 1.6], "tether"),
  K.box([30, 5.5, 22], [0.9, 11, 0.9], "hoopPole"),
  K.box([-24, 5.5, 6], [18, 11, 7.5], "swings"),
  K.box([-30, 1.6, 26], [8.6, 3.2, 6.6], "picnic"),
];
const TABLE_CS = tableCS(YARD_TABLE);
const YCS = [...YARD_CS, ...TABLE_CS];
const Yard: React.FC<{ focus: V3; children?: React.ReactNode }> = ({ focus, children }) => <Outdoor focus={focus}><SchoolYard />{children}</Outdoor>;
/** BRO's spot behind the middle of the stand (at its back edge, so his short arms reach the table). */
const BRO_T: V3 = [YARD_TABLE[0], 0, YARD_TABLE[2] - 2.4];
/** Customers come to the stand's right END and face BRO across it (so the front camera sees both faces). */
const CUST_END: V3 = [YARD_TABLE[0] + TABLE.w / 2 + 1.3, 0, YARD_TABLE[2] + 0.1];
const CUST_YAW = -Math.PI / 2 + 0.6;
/** The stand's front camera (the customers' side, a touch right), framing BRO and the right end. */
const standCam = (d: number, h: number, tgt: V3, fov: number) => c(add(tgt, [0.9, h, d]), tgt, fov);
const STAND_MID: V3 = [YARD_TABLE[0] + 1.9, 2.7, YARD_TABLE[2] + 0.2];
/** A point in front of a shoulder (side 1 = left, -1 = right): `fwd` along the facing, at height y. */
const ahead = (a: ActLike, s: number, side: 1 | -1, fwd: number, y: number): V3 => {
  const sh = K.armPoint({ position: a.position, yaw: a.yaw, scale: s, pose: {} }, side, [0, 0, 0]);
  return [sh[0] + Math.sin(a.yaw) * fwd, y, sh[2] + Math.cos(a.yaw) * fwd];
};

// ================================================================================================ beat 2
// s03_yard: MW yard. BRO behind his stand, both arms waving kids over, a hop; kids walk by, one turns to look.
const s03: Shot = mk("s03_yard", {
  scene: (t) => {
    const [t0] = span("s03_yard");
    const j = M.jump(t, E.started - 0.05, 0.45, 0.42);
    const bro = at0(BRO_T, 0.1, M.mix(M.wave(t, t0 - 0.3, Infinity, 1, 1.25), M.wave(t, t0 - 0.2, Infinity, -1, 1.1), M.scale(j.pose, 0.3)));
    const kA = M.walkPath([[-6, 0, 6.5], [0.2, 0, 8.4]], t, t0 - 0.6, { scale: S.kid, gait: "stroll", yaw1: Math.PI - 0.2 });
    const kAp = M.mix(kA.pose, M.headSnap(t, E.brother2 + 0.1, 0.9, 0, Infinity));
    const kB = M.walkPath([[14, 0, -3], [-6, 0, -5]], t, t0 - 1.6, { scale: S.kid, gait: "walk" });
    const kC = M.walkPath([[14, 0, 4.5], [8.4, 0, 7.6]], t, t0 - 0.7, { scale: S.kid, gait: "walk", yaw1: -1.9 });
    const kCp = M.mix(kC.pose, M.point(t, E.started + 0.15, Infinity, 0.2, 1));
    const A = { ...kA, pose: kAp }, B = kB, C = { ...kC, pose: kCp };
    return <Yard focus={[YARD_TABLE[0], 2, YARD_TABLE[2]]}>
      <Stand />
      <Ch look={BRO} a={bro} t={t} scale={S.bro} lift={j.lift} expr={M.talk(t, [E.brother2, E.started, [E.selling - 0.3, E.selling - 0.1]], "happy", "grin")} cs={YCS} others={[st(A, S.kid), st(C, S.kid)]} noFeet={j.lift > 0} />
      <Ch look={KIDS[1]} a={A} t={t} scale={S.kid} expr={M.faceAt(t, "smile", "surprised", E.brother2 + 0.1)} blinkSeed={2} cs={YCS} others={[st(bro, S.bro), st(C, S.kid)]} />
      <Ch look={KIDS[4]} a={B} t={t} scale={S.kid} expr="blank" blinkSeed={3} cs={YCS} />
      <Ch look={KIDS[3]} a={C} t={t} scale={S.kid} expr="happy" blinkSeed={4} cs={YCS} others={[st(A, S.kid), st(bro, S.bro)]} />
    </Yard>;
  },
  cam: mv("s03_yard", c([YARD_TABLE[0] + 0.4, 4.4, YARD_TABLE[2] + 13.5], [YARD_TABLE[0] + 0.1, 2.6, YARD_TABLE[2] - 0.5], 42),
    c([YARD_TABLE[0] + 0.4, 4.2, YARD_TABLE[2] + 12.2], [YARD_TABLE[0] + 0.1, 2.6, YARD_TABLE[2] - 0.5], 41)),
});

// s04_pets: M. BRO holds an empty leash up proudly (the collar is empty); kids at the end of the stand lean in, squint,
// and one hops to see over.
const s04: Shot = mk("s04_pets", {
  scene: (t) => {
    const [t0] = span("s04_pets");
    const up = M.snap(M.seg(t, E.selling - 0.12, E.selling + 0.12));
    const pres = M.env(t, E.pets2 - 0.1, Infinity, 0.2);
    const bro = at0(add(BRO_T, [0, 0, -0.4]), 0.25, M.mix(M.idle(t, 1, 0.5), { armR: 0.25 + 1.4 * up, armROut: -0.05, lean: -0.06 * up, head: [-0.2 * up, -0.12 * up] },
      { armL: 1.6 * M.ease(M.seg(pres, 0.5, 1)), armLOut: 0.6 * Math.min(1, pres * 2.5) }));
    const collar: V3 = [YARD_TABLE[0] + 1.2, 3.4, YARD_TABLE[2] - 0.6];
    const k1p = CUST_END, k2p: V3 = [CUST_END[0] + 1.2, 0, CUST_END[2] - 2.2], k3p: V3 = [CUST_END[0] + 2.9, 0, CUST_END[2] + 1.3];
    const k1 = at0(k1p, M.yawTo(k1p, collar) + 0.7, M.mix(M.idle(t, 5, 0.4), M.leanIn(t, E.selling + 0.25, Infinity, -0.15), M.headShake(t, E.pets2, E.pets2 + 0.75, 1.6)));
    const k2 = at0(k2p, M.yawTo(k2p, collar) + 0.6, M.mix(M.idle(t, 6, 0.4), M.leanIn(t, E.selling + 0.45, Infinity, -0.2), { tilt: 0.25 * M.env(t, E.pets2 + 0.1) }));
    const j3 = M.jump(t, E.pets2 - 0.1, 0.9, 0.5);
    const k3 = at0(k3p, M.yawTo(k3p, collar) + 0.7, M.mix(M.idle(t, 7, 0.4), j3.pose));
    return <Yard focus={[YARD_TABLE[0], 2.5, YARD_TABLE[2]]}>
      <Stand />
      <Ch look={BRO} a={bro} t={t} scale={S.bro} expr={M.faceAt(t, "grin", "happy", E.selling)} hold={{ R: <Leash reach={2.5} drop={1.0} sway={0.15 * Math.sin((t - t0) * 9)} /> }} cs={YCS} />
      <Ch look={KIDS[1]} a={k1} t={t} scale={S.kid} expr={M.faceAt(t, "smile", "blank", E.selling + 0.25)} blinkSeed={2} cs={YCS} others={[st(k2, S.kid), st(k3, S.kid, j3.lift)]} />
      <Ch look={KIDS[5]} a={k2} t={t} scale={S.kid} expr={M.faceAt(t, "smile", "worried", E.pets2 + 0.1)} blinkSeed={5} cs={YCS} others={[st(k1, S.kid), st(k3, S.kid, j3.lift)]} />
      <Ch look={KIDS[6]} a={k3} t={t} scale={S.kid} lift={j3.lift} expr="surprised" blinkSeed={6} cs={YCS} others={[st(k1, S.kid), st(k2, S.kid)]} noFeet={j3.lift > 0} />
    </Yard>;
  },
  cam: mv("s04_pets", standCam(15.2, 2.9, add(STAND_MID, [0.2, 0.3, 0.3]), 40), standCam(14.2, 2.7, add(STAND_MID, [0.2, 0.3, 0.3]), 40)),
});

// ================================================================================================ beat 3
// s05_sale: M. At the end of the stand the kid slaps down $5 and slides it over; BRO's hand slaps on it and he pockets it;
// he shoves a leash and then an empty box across; the kid lifts the leash and stares at the empty collar, then peeks in the box.
const KID_BUY: V3 = CUST_END;
const s05: Shot = mk("s05_sale", {
  scene: (t) => {
    const s = S.kid, sb = S.bro, TOP = TABLE.top;
    const tSlap = E.five + 0.05, catchAt = tSlap + 0.42, tGrab = E.empty3 - 0.12, tBox = E.box3;
    const kid0 = at0(KID_BUY, CUST_YAW, M.mix(M.idle(t, 3, 0.4), { lean: 0.2 * M.env(t, tSlap - 0.25, tSlap + 0.4, 0.15, 0.25) }));
    const kTable = ahead(kid0, s, -1, 0.95, TOP + 0.52);
    const slapU = M.env(t, tSlap - 0.22, tSlap + 0.3, 0.2, 0.25);
    const grabU = M.env(t, tGrab - 0.2, tGrab + 0.02, 0.2, 0.02);
    const liftU = M.snap(M.seg(t, tGrab, tGrab + 0.25));
    const peek = M.env(t, tBox + 0.25, Infinity, 0.25);
    const holding = t >= tGrab;
    let kid: ActLike = { ...kid0, pose: M.mix(kid0.pose, { armR: t < tSlap ? 1.35 : -0.15 }) };
    if (slapU > 0 && t < tSlap + 0.3) kid = reach(kid0, s, { R: L3(ahead(kid0, s, -1, 1.3, 2.9), kTable, slapU) });
    if (grabU > 0 && !holding) kid = reach(kid0, s, { R: L3(ahead(kid0, s, -1, 1.0, 2.6), add(kTable, [0, 0.05, 0]), grabU) });
    if (holding) kid = { ...kid0, pose: M.mix(kid0.pose, { armR: 1.15 + 0.25 * liftU, head: [0.1, -0.25 * liftU * (1 - peek) + 0.45 * peek], lean: 0.22 * peek, tilt: 0.12 * liftU }) };
    // BRO: everything with his left hand at the table's back edge (his arms are short)
    const BY = 0.15;
    const LH = ahead(at0(BRO_T, BY), sb, 1, 1.0, TOP + 0.36);
    const grabB = M.env(t, catchAt - 0.15, catchAt + 0.2, 0.15, 0.25);
    const pushL = M.env(t, E.leash3 - 0.22, E.leash3 + 0.15, 0.15, 0.2), pushB = M.env(t, tBox - 0.22, tBox + 0.15, 0.15, 0.2);
    const bro0 = at0(BRO_T, BY, M.mix(M.idle(t, 1, 0.5), { lean: 0.2 * Math.max(grabB, pushL, pushB), head: [0.4, 0] }));
    const LHup = ahead(bro0, sb, 1, 0.6, 2.4);
    const k = Math.max(grabB, pushL, pushB);
    const bro = k > 0 ? reach(bro0, sb, { L: L3(LHup, LH, k) }) : bro0;
    // the money: in the kid's hand, then flat on the table sliding to BRO, under his slapping hand, then pocketed
    const slide = M.ease(M.seg(t, tSlap + 0.08, catchAt));
    const billFlat = L3(add(kTable, [0, -0.46, 0]), add(LH, [0, -0.3, 0]), slide);
    const showBill = t < catchAt + 0.3;
    const leashU = M.easeOut(M.seg(t, E.leash3, E.leash3 + 0.3)), boxU = M.easeOut(M.seg(t, tBox, tBox + 0.32));
    const leashA: V3 = add(LH, [0.0, -0.3, 0.1]), leashB: V3 = add(kTable, [-0.5, -0.46, 0.2]);
    const boxA: V3 = [LH[0] + 0.4, TOP, LH[2] + 0.6], boxB: V3 = [kTable[0] - 0.4, TOP, kTable[2] + 1.3];
    return <Yard focus={[YARD_TABLE[0], 2.5, YARD_TABLE[2]]}>
      <Stand boxes={0} leashes={1} />
      {showBill && t >= tSlap && <Bill v={5} p={t < catchAt ? billFlat : add(hand(bro, sb, 1), [0, -0.06, 0])} rot={[-Math.PI / 2, 0, 0.3]} k={0.55} />}
      {!holding && t >= E.leash3 - 0.25 && <FlatLeash p={L3(leashA, leashB, leashU)} yaw={1.4} />}
      {t >= tBox - 0.25 && <PetBox p={L3(boxA, boxB, boxU)} rot={[0, 0.2, 0]} k={0.7} />}
      <Ch look={BRO} a={bro} t={t} scale={sb} expr={M.faceAt(t, "grin", "happy", catchAt)} blinkSeed={1} cs={YCS} others={[st(kid, s)]} />
      <Ch look={KIDS[1]} a={kid} t={t} scale={s} expr={t < tGrab ? "happy" : M.faceAt(t, "surprised", "blank", tGrab + 0.3)} blinkSeed={2} cs={YCS} others={[st(bro, sb)]}
        hold={holding ? { R: <Leash reach={2.4} drop={0.9} sway={0.1 * Math.sin(t * 7)} /> } : t < tSlap ? { R: <HeldBillA v={5} k={0.6} /> } : undefined} />
    </Yard>;
  },
  cam: mv("s05_sale", standCam(13.8, 2.7, add(STAND_MID, [0.4, 0.1, 0]), 40), standCam(12.8, 2.5, add(STAND_MID, [0.4, 0.1, 0]), 40)),
});

// s06_cert: CLOSE. The kid spins round to the camera holding the certificate up in both hands: gold star, 1 INVISIBLE DOG.
const KID_CERT: V3 = [CUST_END[0] + 0.3, 0, CUST_END[2] + 1.6];
const CERT_YAW = 0.22;
const s06: Shot = mk("s06_cert", {
  scene: (t) => {
    const [t0] = span("s06_cert");
    const s = S.kid, up = M.snap(M.seg(t, t0 - 0.1, t0 + 0.2)), jig = 0.04 * Math.sin((t - t0) * 14) * up;
    const kidA = at0(KID_CERT, CERT_YAW, M.mix(M.idle(t, 3, 0.3), { lean: -0.04, head: [0, 0.12] }));
    const f: V3 = [Math.sin(CERT_YAW), 0, Math.cos(CERT_YAW)], r: V3 = [Math.cos(CERT_YAW), 0, -Math.sin(CERT_YAW)];
    const cc: V3 = add(KID_CERT, [f[0] * 1.35, lerp(2.45, 2.7, up) + jig, f[2] * 1.35]);
    const W = 1.6 * 0.5; // certificate half-width (k 0.5)
    const kid = reach(kidA, s, { L: add(cc, [r[0] * W * 0.9, -0.42, r[2] * W * 0.9]), R: add(cc, [-r[0] * W * 0.9, -0.42, -r[2] * W * 0.9]) });
    const bro = at0(BRO_T, 0.3, M.mix(M.idle(t, 1, 0.5), M.clap(t, t0 - 0.2, Infinity, 3.5), { armL: 0.5, armR: 0.5 }));
    return <Yard focus={KID_CERT}>
      <Stand boxes={1} leashes={1} />
      <Certificate p={cc} rot={[-0.12, CERT_YAW, 0.03 * Math.sin((t - t0) * 9)]} k={0.5} />
      <Ch look={KIDS[1]} a={kid} t={t} scale={s} expr="happy" blink={blinkOn(t, t0 + 0.35)} cs={YCS} />
      <Ch look={BRO} a={bro} t={t} scale={S.bro} expr="grin" cs={YCS} />
    </Yard>;
  },
  cam: (t) => {
    const cc: V3 = add(KID_CERT, [Math.sin(CERT_YAW) * 1.35, 2.85, Math.cos(CERT_YAW) * 1.35]);
    const fwd = (d: number): V3 => add(cc, [Math.sin(CERT_YAW + 0.1) * d, 0.25, Math.cos(CERT_YAW + 0.1) * d]);
    return mv("s06_cert", c(fwd(8.6), add(cc, [0, -0.5, 0]), 30), c(fwd(7.8), add(cc, [0, -0.45, 0]), 30))(t);
  },
});

// ================================================================================================ beat 4
// s07_line: the drone / aerial game camera over the yard: a long line of kids snaking to the stand, shuffling forward one
// place; two happy customers walk off with their stiff leashes, collars bobbing over empty air.
const LINE_N = 9;
const s07: Shot = mk("s07_line", {
  scene: (t) => {
    const [t0] = span("s07_line");
    const s = S.kid;
    const line: ActLike[] = Array.from({ length: LINE_N }, (_, i) => {
      const from = YARD_LINE(i + 1), to = YARD_LINE(i), ahead = i === 0 ? add(CUSTOMER, [0, 0, -2]) : YARD_LINE(i - 1);
      const w = M.walkPath([from, to], t, M.stagger(i, t0 - 0.1 + i * 0.05, 0.25, 4), { scale: s, gait: "stroll", yaw1: M.yawTo(to, ahead) });
      return { ...w, pose: M.mix(w.pose, M.idle(t, 10 + i, 0.5), i % 4 === 1 ? M.wave(t, t0 + 0.2, Infinity, 1) : null) };
    });
    const cust = at0(CUSTOMER, Math.PI, M.mix(M.idle(t, 30, 0.4), M.talkHands(t, [E.kids4, E.lined])));
    const bro = at0(BRO_T, 0, M.mix(M.idle(t, 1, 0.5), M.wave(t, t0, Infinity, -1, 1.2)));
    const off = [M.walkPath([[CUSTOMER[0] - 2.5, 0, CUSTOMER[2] + 0.5], [CUSTOMER[0] - 16, 0, CUSTOMER[2] + 6]], t, t0 - 1.2, { scale: s, gait: "walk" }),
      M.walkPath([[CUSTOMER[0] - 3.5, 0, CUSTOMER[2] + 5], [CUSTOMER[0] - 13, 0, CUSTOMER[2] + 15]], t, t0 - 2.0, { scale: s, gait: "stroll" })];
    const all = [...line.map((a) => st(a, s)), st(cust, s), st(bro, S.bro), ...off.map((a) => st(a, s))];
    const others = (k: number) => all.filter((_, i) => i !== k);
    return <Yard focus={[10, 0, 18]}>
      <Stand />
      {line.map((a, i) => <Ch key={i} look={KIDS[(i + 2) % KIDS.length]} a={a} t={t} scale={s} blinkSeed={i} expr={i % 3 === 0 ? "happy" : "smile"} cs={YCS} others={others(i)} />)}
      <Ch look={KIDS[0]} a={cust} t={t} scale={s} expr="talk" cs={YCS} others={others(LINE_N)} />
      <Ch look={BRO} a={bro} t={t} scale={S.bro} expr="happy" cs={YCS} others={others(LINE_N + 1)} />
      {off.map((a, i) => <Ch key={`o${i}`} look={KIDS[i ? 9 : 6]} a={{ ...a, pose: M.mix(a.pose, { armR: 0.35, armROut: 0.1 }) }} t={t} scale={s} expr="happy"
        hold={{ R: <Leash reach={2.4} drop={1.45} sway={0.12 * Math.sin(t * 6 + i)} /> }} cs={YCS} others={others(LINE_N + 2 + i)} />)}
    </Yard>;
  },
  cam: mv("s07_line", c([12, 24, 47], [8, 0, 15], 46), c([10, 22.5, 46], [8, 0, 15], 45), 0.02),
});

// ================================================================================================ beat 5: the field
// Coach runs along -x into the tree. Contact (BONK) when his fists reach the trunk, on the pop (E.real + ~0.3).
const T_BONK = E.real + 0.28;
const T_GO = E.horse - 0.02;
const GALLOP_V = 8.2;
const CONTACT_X = TREE_AT[0] + 0.9 + 1.95; // the trunk's face + his reach on the reins
const RAMP = 0.25;
const runD = (t: number) => { const u = t - T_GO; return u <= 0 ? 0 : u < RAMP ? 0.5 * GALLOP_V * u * u / RAMP : GALLOP_V * (u - RAMP / 2); };
const MOUNT_X = CONTACT_X + runD(T_BONK);
const MOUNT: V3 = [MOUNT_X, 0, TREE_AT[2]];
const FCS = treeCS(TREE_AT);
/** Coach at time t: mount (pat the air, hop up, reins), gallop (own feet, thigh slaps), bonk, fall back and sit. */
const coachAt = (t: number): { a: ActLike; lift: number; noFeet: boolean; expr: Expr } => {
  const yaw = -Math.PI / 2;
  if (t < T_GO) { // standing beside "the horse": pats the empty air, hops up at "climbed", lands with fists on the reins, trots in place
    const pat = M.env(t, P(5) - 0.2, E.climbed - 0.05, 0.15, 0.12), patB = Math.sin((t - P(5)) * 16) * 0.12 * pat;
    const j = M.jump(t, E.climbed, 1.3, 0.5);
    const landed = t > E.climbed + 0.62;
    const reins = M.env(t, E.climbed + 0.45, Infinity, 0.15);
    const trot = landed ? Math.abs(Math.sin((t - E.climbed) * 9)) : 0;
    const pose = M.mix(M.idle(t, 8, 0.5 * (1 - reins)), { armL: (1.25 + patB) * pat, armLOut: 0.35 * pat, twist: 0.25 * pat, head: [0.5 * pat, 0.15 * pat] },
      j.pose, { legL: 0.55 * (j.lift > 0 ? 1 : 0), legR: -0.55 * (j.lift > 0 ? 1 : 0) },
      { armL: 1.2 * reins, armR: 1.2 * reins, armLOut: -0.2 * reins, armROut: -0.2 * reins, lean: 0.08 * reins, head: [0, -0.08 * reins] });
    const y = j.lift + trot * 0.25;
    return { a: { position: MOUNT, yaw, pose }, lift: y, noFeet: y > 0.01, expr: t < E.climbed ? M.faceAt(t, "smile", "grin", P(5) + 0.1) : "happy" };
  }
  if (t < T_BONK) { // galloping on his own feet: stiff run, a bounce, left fist on the reins, right hand slapping his thigh
    const d = runD(t), ph = (d / M.stepLen(1.0, 1)) * Math.PI;
    const slap = Math.max(0, Math.sin(ph * 1.0));
    const pose = M.mix({ armL: 1.25, armLOut: -0.15, lean: 0.12, head: [0, -0.15] }, { armR: -0.65 + 1.0 * (1 - slap), armROut: 0.1 }, { armL: Math.sin(ph) * 0.75 * 1.0 }, { armR: -Math.sin(ph) * 0.75 * 1.0 });
    const bounce = Math.abs(Math.sin(ph)) * 0.35;
    return { a: { position: [MOUNT_X - d, 0, MOUNT[2]], yaw, pose, walk: { phase: ph, amount: 1.0, flight: 0 } }, lift: bounce, noFeet: true, expr: M.talk(t, [[E.rode, E.rode + 0.3]], "laugh", "happy") };
  }
  // BONK: recoil (arms fly up, head back), then hop down to sit on the grass behind him, dazed
  const back = M.easeOut(M.seg(t, T_BONK, T_BONK + 0.1)) * 0.8;
  const stand: V3 = [CONTACT_X + back, 0, MOUNT[2]], seat: V3 = [CONTACT_X + 2.4, 0.5, MOUNT[2] + 0.2];
  const a = M.sit(stand, seat, yaw + 0.15, t, T_BONK + 0.1, 0.32, 1);
  const rec = M.recoil(t, T_BONK, Infinity);
  const flail = M.env(t, T_BONK, T_BONK + 0.5, 0.06, 0.2);
  const pose = M.mix(a.pose, M.scale(rec, 0.8), { armL: 1.2 * flail, armR: 1.4 * flail, armLOut: 0.5 * flail, armROut: 0.5 * flail }, M.seatedIdle(t, 3, 0.5), { head: [0.15 * Math.sin(t * 6), 0.05] });
  return { a: { position: a.position, yaw: a.yaw, pose }, lift: 0, noFeet: true, expr: t < T_BONK + 0.12 ? "surprised" : "blank" };
};
const Stars: React.FC<{ c: V3; t: number; t0: number }> = ({ c, t, t0 }) => {
  if (t < t0) return null;
  const k = M.easeOut(M.seg(t, t0, t0 + 0.2));
  return <group position={c}>{[0, 1, 2].map((i) => { const a = (t - t0) * 7 + (i * Math.PI * 2) / 3; return (
    <mesh key={i} position={[Math.cos(a) * 1.0, 0.25 * Math.sin(a * 2), Math.sin(a) * 1.0]} rotation={[0, a, 0.5]} scale={0.28 * k}><octahedronGeometry args={[1, 0]} /><meshStandardMaterial color="#ffd84a" emissive="#ffc21a" emissiveIntensity={0.6} /></mesh>); })}</group>;
};
/** Leaves knocked loose by the bonk, falling and fluttering. */
const Leaves: React.FC<{ t: number; t0: number }> = ({ t, t0 }) => {
  if (t < t0) return null;
  const u = t - t0;
  return <>{Array.from({ length: 14 }, (_, i) => { const r = Math.sin(i * 12.9898) * 43758.5453 % 1, r2 = Math.sin(i * 78.233) * 12543.1 % 1;
    const x = TREE_AT[0] + (r - 0.5) * 7 + Math.sin(u * 4 + i) * 0.5, y = 9.5 + r2 * 3 - u * (4 + 2 * Math.abs(r)), z = TREE_AT[2] + (r2 - 0.2) * 5;
    return y > 0.2 ? <mesh key={i} position={[x, y, z]} rotation={[u * 3 + i, i, u * 2]}><boxGeometry args={[0.45, 0.06, 0.35]} /><meshStandardMaterial color={i % 2 ? "#5f9a42" : "#4f8a3a"} /></mesh> : null; })}</>;
};
const FieldSet: React.FC<{ focus: V3; children?: React.ReactNode }> = ({ focus, children }) => <Outdoor focus={focus}><Field tree={TREE_AT} />{children}</Outdoor>;

// s08_mount: MW field. Coach pats the empty air beside him, hops up onto nothing, lands on his own feet gripping reins.
const s08: Shot = mk("s08_mount", {
  scene: (t) => { const C = coachAt(t); return <FieldSet focus={MOUNT}>
    <Ch look={COACH} a={C.a} t={t} lift={C.lift} expr={C.expr} cs={FCS} noFeet={C.noFeet} />
  </FieldSet>; },
  cam: mv("s08_mount", c(add(MOUNT, [-8.5, 4.2, 13.5]), add(MOUNT, [0.3, 3.2, 0]), 40), c(add(MOUNT, [-7.6, 4.0, 12.2]), add(MOUNT, [0.0, 3.2, 0]), 40)),
});
// s09_gallop: lead dolly. Coach gallops toward camera-left on his own feet, slapping his thigh, laughing.
const s09: Shot = mk("s09_gallop", {
  scene: (t) => { const C = coachAt(t); return <FieldSet focus={C.a.position}>
    <Ch look={COACH} a={C.a} t={t} lift={C.lift} expr={C.expr} cs={FCS} noFeet={C.noFeet} />
  </FieldSet>; },
  cam: (t) => { const x = MOUNT_X - runD(t); const [a, b] = span("s09_gallop"); const u = M.seg(t, a, b);
    return { pos: [x - 9.5 + 1.0 * u, 4.0 + 0.1 * nz(t, 1), MOUNT[2] + 11.0 - 0.8 * u], target: [x - 1.0, 3.2, MOUNT[2]], fov: 40 }; },
});
// s10_bonk: W at the tree. Straight into it: BONK, recoil, hop down onto the grass, dazed, stars and leaves.
const s10: Shot = mk("s10_bonk", {
  scene: (t) => { const C = coachAt(t); const head: V3 = add(C.a.position, [0, C.lift + 4.55 + 0.9, 0]);
    return <FieldSet focus={[CONTACT_X, 0, 0]}>
      <Ch look={COACH} a={C.a} t={t} lift={C.lift} expr={C.expr} cs={FCS} noFeet={C.noFeet} />
      <Stars c={head} t={t} t0={T_BONK + 0.15} />
      <Leaves t={t} t0={T_BONK} />
    </FieldSet>; },
  cam: (t) => { const base = mv("s10_bonk", c([CONTACT_X + 2.5, 5.0, 15.5], [CONTACT_X - 1.2, 3.6, 0], 46), c([CONTACT_X + 2.2, 4.8, 14.0], [CONTACT_X - 1.0, 3.4, 0], 45))(t);
    const sh = M.env(t, T_BONK, T_BONK + 0.3, 0.02, 0.25) * 0.18; return { ...base, pos: [base.pos[0] + sh * Math.sin(t * 90), base.pos[1] + sh * Math.cos(t * 77), base.pos[2]] }; },
});

// ================================================================================================ beat 6-7: the corridor
const CCS = corridorCS(0);
/** A kid stopped to pet the air above its empty collar: leaning, the left hand stroking nothing, leash in the right. */
const petPose = (t: number, t0: number, seed: number, k = 1): Pose => {
  const e = M.env(t, t0, Infinity, 0.25) * k, s = Math.sin((t - t0) * 7 + seed);
  return { lean: 0.38 * e, armL: (0.95 + 0.14 * s) * e, armLOut: -0.12 * e, armR: 0.25 * e, head: [0.1 * e, 0.3 * e], tilt: 0.12 * s * e };
};
type JamKid = { look: Look; a: ActLike; expr: Expr; leash: React.ReactNode };
/** The hallway jam (beat 6): walkers crawling along with leashes out, others stopped dead to pet the air. */
const jam = (t: number): JamKid[] => {
  const s = S.kid, t0 = P(6) - 0.6;
  const L = (sw: number) => <Leash reach={2.4} drop={1.45} sway={0.1 * Math.sin(t * 5 + sw)} />;
  const walker = (path: V3[], tt: number, sp: number) => { const w = M.walkPath(path, t, tt, { scale: s, gait: "stroll", speed: sp }); return { ...w, pose: M.mix(w.pose, { armR: 0.3 }) }; };
  const pet = (p: V3, yaw: number, tt: number, seed: number) => at0(p, yaw, M.mix(M.idle(t, seed, 0.3), petPose(t, tt, seed)));
  return [
    { look: KIDS[0], a: pet([-3.8, 0, 1], 0.7, t0, 1), expr: "happy", leash: L(1) },
    { look: KIDS[2], a: walker([[2.4, 0, -8], [2.4, 0, 6]], t0, 2.6), expr: "smile", leash: L(2) },
    { look: KIDS[3], a: pet([4.0, 0, 6.5], 2.0, t0 + 0.5, 3), expr: "happy", leash: L(3) },
    { look: KIDS[4], a: walker([[-1.2, 0, 16], [-1.2, 0, -4]], t0 + 0.2, 2.2), expr: "blank", leash: L(4) },
    { look: KIDS[5], a: at0([1.6, 0, 11.5], Math.PI + 0.3, M.mix(M.idle(t, 5, 0.5), M.crossArms(t, t0), { head: [0.3, 0] })), expr: "worried", leash: null },
    { look: KIDS[6], a: pet([-4.6, 0, 9.5], 2.3, t0 + 0.9, 6), expr: "happy", leash: L(6) },
    { look: KIDS[8], a: pet([4.6, 0, -3], 1.2, t0 + 0.3, 7), expr: "happy", leash: L(7) },
    { look: KIDS[9], a: walker([[-3.6, 0, -16], [-3.6, 0, -4]], t0 - 0.4, 2.4), expr: "smile", leash: L(8) },
    { look: KIDS[10], a: pet([0.6, 0, -9], -0.6, t0 + 0.2, 9), expr: "happy", leash: L(9) },
  ];
};
/** The corridor's open (+z) end closed off with a wall and double doors (the shared Corridor leaves it open). */
const EndWall: React.FC = () => <group position={[0, 0, 49.6]}>
  <Bx p={[0, 6, 0]} s={[17, 12, 0.4]} c="#e9e3d2" />
  <Bx p={[0, 1.2, -0.25]} s={[17, 2.4, 0.12]} c="#3f6f9a" />
  <Bx p={[0, 4.0, -0.3]} s={[6.4, 8.0, 0.2]} c="#f6f2e8" />
  {[-1.5, 1.5].map((x) => <Bx key={x} p={[x, 3.8, -0.42]} s={[2.8, 7.4, 0.15]} c="#b03a2e" />)}
  {[-1.5, 1.5].map((x) => <Bx key={`w${x}`} p={[x, 5.2, -0.52]} s={[1.2, 2.2, 0.05]} c="#bcd8ee" />)}
  <Bx p={[0, 8.9, -0.3]} s={[1.6, 0.6, 0.08]} c="#d0322a" />
</group>;
const Hall: React.FC<{ focus: V3; children?: React.ReactNode }> = ({ focus, children }) => <Indoor focus={focus}><Corridor /><EndWall />{children}</Indoor>;

// s11_jam: corridor, high (just under the ceiling): kids with leashes clog the hallway, stopping dead to pet the air.
const s11: Shot = mk("s11_jam", {
  scene: (t) => { const J = jam(t); const all = J.map((j) => st(j.a, S.kid));
    return <Hall focus={[0, 0, 3]}>
      {J.map((j, i) => <Ch key={i} look={j.look} a={j.a} t={t} scale={S.kid} expr={j.expr} blinkSeed={i} hold={j.leash ? { R: j.leash } : undefined} cs={CCS} others={all.filter((_, k) => k !== i)} />)}
    </Hall>; },
  cam: mv("s11_jam", c([3.5, 10.6, 24], [-0.5, 1.0, 2], 46), c([2.5, 10.4, 21.5], [-0.5, 1.0, 1.5], 45)),
});

// s12_teacher: MW corridor. A row of kids crawls toward camera with their dogs; the teacher behind tries to squeeze past,
// side-steps, gets nowhere; the kids hold their leashes up (sorry!) and shrug.
const s12: Shot = mk("s12_teacher", {
  scene: (t) => {
    const [t0] = span("s12_teacher"), s = S.kid;
    const tLook = E.hallway + 0.25;
    const xs = [-4.6, 0.2, 4.4];
    const kids = xs.map((x, i) => { const w = M.walkPath([[x, 0, 15.5], [x, 0, 19.5]], t, t0 - 0.7 + i * 0.05, { scale: s, gait: "stroll", speed: 1.8 });
      const look = M.env(t, tLook + i * 0.05, Infinity, 0.15), side = x < 0 ? -1 : 1;
      return { ...w, pose: M.mix(w.pose, M.scale(noSwing(w.walk), look), { armR: 0.3 + 1.25 * look, head: [side * 0.9 * look, -0.05 * look], twist: side * 0.25 * look }, { armL: 0.45 * look, armLOut: 0.2 * look, tilt: 0.14 * look }) };
    });
    // the teacher: comes up behind them, steps left, blocked, steps right, blocked, hands on hips
    const path: V3[] = [[2.3, 0, 9], [2.3, 0, 12.6], [-2.2, 0, 13.0], [-2.2, 0, 13.2]];
    const w = M.walkPath(path, t, t0 - 0.75, { gait: "hurry" });
    const tch = { ...w, pose: M.mix(w.pose, M.hips(t, E.walk6 - 0.1), M.headShake(t, E.walk6, E.walk6 + 0.5, 2.5)) };
    const all = [...kids.map((k) => st(k, s)), st(tch, 1)];
    return <Hall focus={[0, 0, 15]}>
      {kids.map((k, i) => <Ch key={i} look={KIDS[[11, 7, 3][i]]} a={k} t={t} scale={s} blinkSeed={i + 3} expr={M.faceAt(t, "smile", i % 2 ? "grin" : "worried", tLook)}
        hold={{ R: <Leash reach={2.4} drop={1.45} sway={0.08 * Math.sin(t * 6 + i)} /> }} cs={CCS} others={all.filter((_, k) => k !== i)} />)}
      <Ch look={TEACHER} a={tch} t={t} expr={M.faceAt(t, "worried", "talk", E.walk6 - 0.15, E.walk6 + 0.1, "blank")} cs={CCS} others={all.slice(0, 3)} />
    </Hall>;
  },
  cam: mv("s12_teacher", c([0.3, 6.6, 31.5], [0.1, 2.9, 15], 40), c([0.3, 6.4, 29.8], [0.1, 2.9, 15], 39)),
});

// s13_pet: M. One kid stops dead, leans right over and pets the empty air above the empty collar, beaming; a kid walks past.
const PET_AT: V3 = [-2.2, 0, 24];
const s13: Shot = mk("s13_pet", {
  scene: (t) => {
    const [t0] = span("s13_pet"), s = S.kid;
    const kid = at0(PET_AT, 0.55, M.mix(M.idle(t, 4, 0.3), petPose(t, t0 - 0.2, 2, 1.1), { armR: 0.15, head: [0.2, 0] }, M.headSnap(t, E.dogs, 0.55, -0.35, Infinity)));
    const w = M.walkPath([[4.6, 0, 16], [4.6, 0, 30]], t, t0 - 1.0, { scale: s, gait: "stroll", speed: 2.4 });
    const walker = { ...w, pose: M.mix(w.pose, { armR: 0.3 }) };
    return <Hall focus={PET_AT}>
      <Ch look={KIDS[7]} a={kid} t={t} scale={s} expr={M.faceAt(t, "happy", "laugh", E.dogs)} blinkSeed={2} hold={{ R: <Leash reach={2.5} drop={1.5} /> }} cs={CCS} others={[st(walker, s)]} />
      <Ch look={KIDS[10]} a={walker} t={t} scale={s} expr="smile" blinkSeed={6} hold={{ R: <Leash reach={2.4} drop={1.45} sway={0.1 * Math.sin(t * 6)} /> }} cs={CCS} others={[st(kid, s)]} />
    </Hall>;
  },
  cam: mv("s13_pet", c(add(PET_AT, [6.4, 3.4, 9.6]), add(PET_AT, [1.1, 1.8, 1.0]), 40), c(add(PET_AT, [5.7, 3.2, 8.7]), add(PET_AT, [1.1, 1.9, 1.0]), 40)),
});

// s14_hayes: MW down the corridor. Principal Hayes marches out of her office into the jam, arms folded.
const s14: Shot = mk("s14_hayes", {
  scene: (t) => {
    const s = S.kid;
    const w = M.walkPath([[4.0, 0, -19], [1.2, 0, -14], [0.3, 0, -6]], t, P(7) - 0.75, { gait: "walk" });
    const hayes = { ...w, pose: M.mix(w.pose, noSwing(w.walk), M.crossArms(t, P(7) - 1.2), { head: [0, 0.06] }) };
    const k1 = at0([-4.6, 0, -1], 1.25, M.mix(M.idle(t, 2, 0.3), petPose(t, P(7) - 0.5, 2)));
    const k2 = at0([4.3, 0, -2.5], -1.6, M.mix(M.idle(t, 3, 0.3), petPose(t, P(7) - 0.3, 5)));
    const k3w = M.walkPath([[-1.5, 0, 6], [-2.3, 0, 1.5]], t, P(7) - 0.6, { scale: s, gait: "stroll", speed: 2.4 });
    const k3 = { ...k3w, pose: M.mix(k3w.pose, { armR: 0.3 }) };
    const all = [st(hayes, 1), st(k1, s), st(k2, s), st(k3, s)];
    const oth = (i: number) => all.filter((_, k) => k !== i);
    return <Hall focus={[0.5, 0, -8]}>
      <Ch look={HAYES} a={hayes} t={t} expr="blank" cs={CCS} others={oth(0)} />
      <Ch look={KIDS[0]} a={k1} t={t} scale={s} expr="happy" hold={{ R: <Leash reach={2.4} drop={1.45} /> }} cs={CCS} others={oth(1)} />
      <Ch look={KIDS[8]} a={k2} t={t} scale={s} expr="happy" blinkSeed={3} hold={{ R: <Leash reach={2.4} drop={1.45} /> }} cs={CCS} others={oth(2)} />
      <Ch look={KIDS[2]} a={k3} t={t} scale={s} expr="smile" blinkSeed={5} hold={{ R: <Leash reach={2.4} drop={1.45} sway={0.1 * Math.sin(t * 6)} /> }} cs={CCS} others={oth(3)} />
    </Hall>;
  },
  cam: mv("s14_hayes", c([3.0, 4.6, 9.5], [0.2, 3.4, -10], 40), c([2.6, 4.5, 8.2], [0.2, 3.5, -10], 39)),
});

// s15_freeze: M, from where Hayes stands. On "Hayes" every kid freezes stiff, leashes jerked up, eyes on her.
const s15: Shot = mk("s15_freeze", {
  scene: (t) => {
    const s = S.kid;
    const spots: [V3, number, number][] = [[[-2.7, 0, 0.3], Math.PI - 0.35, 0], [[0.2, 0, 2.4], Math.PI + 0.05, 1], [[3.5, 0, 0.1], Math.PI + 0.4, 2]];
    const kids = spots.map(([p, yaw, i]) => {
      const tf = E.hayes + [0, 0.07, 0.03][i];
      const fz = M.snap(M.seg(t, tf, tf + 0.12), 2.5);
      const before = i === 1 ? petPose(t, P(7) - 1, 4) : M.mix(M.idle(t, i + 5, 0.6), { armR: 0.3 });
      const frozen: Pose = { armR: 1.85, armROut: -0.05, armL: 0.25, armLOut: 0.25, lean: -0.05, head: [0, -0.12] };
      const pose: Pose = { ...M.mix(M.scale(before, 1 - fz), M.scale(frozen, fz)) };
      return at0(p, yaw, pose);
    });
    const jumps = [0, 1, 2].map((i) => M.jump(t, E.hayes + [0, 0.07, 0.03][i], 0.35, 0.28));
    const all = kids.map((k, i) => st(k, s, jumps[i].lift));
    return <Hall focus={[0, 0, 1]}>
      {kids.map((k, i) => <Ch key={i} look={KIDS[[5, 6, 9][i]]} a={k} t={t} scale={s} lift={jumps[i].lift} noFeet={jumps[i].lift > 0} still={t > E.hayes + 0.2}
        expr={t < E.hayes + [0, 0.07, 0.03][i] ? "happy" : (["scared", "surprised", "stare"] as Expr[])[i]} blinkSeed={i}
        hold={{ R: <Leash reach={2.4} drop={1.45} /> }} cs={CCS} others={all.filter((_, k2) => k2 !== i)} />)}
    </Hall>;
  },
  cam: mv("s15_freeze", c([0.4, 4.8, -15.5], [0.1, 2.8, 1.4], 40), c([0.4, 4.7, -14.4], [0.1, 2.85, 1.4], 40)),
});

// ================================================================================================ beat 8-9: back at the stand
const HAYES_T: V3 = [YARD_TABLE[0] + TABLE.w / 2 + 1.3, 0, YARD_TABLE[2]];
const HAYES_YAW = -Math.PI / 2 + 0.2;
const HAYES_LEAN = 0.6;
const hayesLean = (t: number) => {
  const w = M.walkPath([[HAYES_T[0] + 4.0, 0, HAYES_T[2] - 4.5], HAYES_T], t, P(8) - 1.3, { gait: "walk", yaw1: HAYES_YAW });
  const ln = M.env(t, E.asked8 - 0.25, Infinity, 0.3);
  const base: ActLike = { ...w, pose: M.mix(w.pose, { lean: HAYES_LEAN * ln, head: [0, -0.15 * ln] }) };
  if (ln <= 0) return base;
  // both palms planted on the end of the table (facing -x her left hand is on the +z side)
  const xE = YARD_TABLE[0] + TABLE.w / 2 - 0.3;
  const r = reach({ ...base, pose: { ...base.pose, lean: HAYES_LEAN } }, 1, { L: [xE, TABLE.top + 0.12, HAYES_T[2] + 1.35], R: [xE, TABLE.top + 0.12, HAYES_T[2] - 1.3] });
  const d = (k: keyof Pose) => ((r.pose![k] as number) ?? 0) - ((base.pose![k] as number) ?? 0);
  return { ...base, pose: M.mix(base.pose, M.scale({ armL: d("armL"), armR: d("armR"), armLOut: d("armLOut"), armROut: d("armROut") }, ln)) };
};
const hayesWords = [E.how, E.much, E.brother8, [E.made8, E.made8 + 0.3]] as (number | [number, number])[];

// s16_lean: M at the stand. Hayes strides up to the end of the table and leans right over it, palms flat; BRO looks way up.
const s16: Shot = mk("s16_lean", {
  scene: (t) => {
    const h = hayesLean(t);
    const look = M.env(t, E.asked8 - 0.1, Infinity, 0.2);
    const bro = at0(BRO_T, 0.3, M.mix(M.idle(t, 1, 0.4 * (1 - look)), { head: [0.45 * look, -0.38 * look], lean: -0.1 * look }));
    return <Yard focus={[YARD_TABLE[0], 2.5, YARD_TABLE[2]]}>
      <Stand />
      <Ch look={HAYES} a={h} t={t} expr={M.talk(t, hayesWords, "blank")} cs={YCS} others={[st(bro, S.bro)]} />
      <Ch look={BRO} a={bro} t={t} scale={S.bro} expr={M.faceAt(t, "happy", "grin", E.asked8 + 0.05)} blinkSeed={1} cs={YCS} others={[st(h, 1)]} />
    </Yard>;
  },
  cam: mv("s16_lean", c([0.2, 5.0, 21.5], [6.0, 3.1, 5.4], 40), c([0.6, 4.8, 20.2], [6.0, 3.1, 5.4], 40)),
});

// s17_cashup: close on BRO. He hauls his cash box up to her with a big nervous grin (sweat drop, fast blinks, a nod).
const BRO17_YAW = 0.35;
const s17: Shot = mk("s17_cashup", {
  scene: (t) => {
    const [t0] = span("s17_cashup"), sb = S.bro;
    const h = hayesLean(t);
    const up = 0.45 + 0.55 * M.snap(M.seg(t, t0 - 0.06, t0 + 0.22));
    const f: V3 = [Math.sin(BRO17_YAW), 0, Math.cos(BRO17_YAW)], rgt: V3 = [Math.cos(BRO17_YAW), 0, -Math.sin(BRO17_YAW)];
    const held: V3 = add(BRO_T, [f[0] * 1.15, TABLE.top + 0.18, f[2] * 1.15]);
    const box: V3 = add(L3(CASH_AT, held, up), [0, 0.04 * Math.sin((t - t0) * 18) * up, 0]);
    const bro0 = at0(BRO_T, BRO17_YAW, M.mix({ head: [0.15, -0.3], lean: 0.1 }, M.nod(t, E.made8 - 0.1, 2, 5)));
    const half = (2.4 * CASH_K) / 2 + 0.04, mid = 0.45 * CASH_K;
    const bro = reach(bro0, sb, { L: add(box, [rgt[0] * half, mid, rgt[2] * half]), R: add(box, [-rgt[0] * half, mid, -rgt[2] * half]) });
    const sweat = M.seg(t, E.brother8 - 0.1, E.brother8 + 0.6);
    const head: V3 = add(BRO_T, [-rgt[0] * 0.42, 4.55 * sb + 0.18 - 0.35 * sweat, -rgt[2] * 0.42 + 0.3]);
    return <Yard focus={BRO_T}>
      <Stand cash={false} boxes={0} />
      <group position={box} rotation={[0, BRO17_YAW * up, 0]} scale={CASH_K}><CashBox fill={0.9} open={0} />
        {[-0.6, -0.2, 0.2, 0.6].map((x, i) => <Bill key={i} v={i % 2 ? 50 : 10} p={[x, 1.05, 0.1]} rot={[-0.15, 0, -x * 0.5]} k={0.6} />)}</group>
      {sweat > 0 && sweat < 1 && <mesh position={head} scale={[0.09, 0.14, 0.09]}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#8fd0ff" roughness={0.1} metalness={0.1} emissive="#4aa8e8" emissiveIntensity={0.3} /></mesh>}
      <Ch look={BRO} a={bro} t={t} scale={sb} expr="grin" blink={Math.max(blinkOn(t, E.much + 0.2), blinkOn(t, E.much + 0.45), blinkOn(t, E.made8 + 0.1))} cs={YCS} others={[st(h, 1)]} />
      <Ch look={HAYES} a={h} t={t} expr={M.talk(t, hayesWords, "blank")} cs={YCS} others={[st(bro, sb)]} />
    </Yard>;
  },
  cam: mv("s17_cashup", c(add(BRO_T, [2.4, 5.7, 7.2]), add(BRO_T, [0.4, 2.55, 0.8]), 36), c(add(BRO_T, [2.1, 5.5, 6.5]), add(BRO_T, [0.4, 2.6, 0.8]), 35)),
});

// s18_list: CLUE. Hayes, at the other end of the stand, runs a finger down the WHOLE price list (only ELEPHANT not crossed
// out), her other fist at her chin, thinking; on "left" her head turns to camera with a small smirk.
const HAYES_L: V3 = [YARD_TABLE[0] - TABLE.w / 2 - 1.75, 0, YARD_TABLE[2] + 1.0];
const HAYES_L_YAW = Math.PI / 2 - 0.5;
const LIST_N = (): V3 => { const n = new THREE.Vector3(0, 0, 1).applyEuler(LIST_ROT); return [n.x, 0, n.z]; };
const LIST_CAM = (d: number): CamS => { const lc = listPoint(0, 0), n = LIST_N(), p: V3 = [n[2], 0, -n[0]];
  const tg: V3 = [lc[0] - p[0] * 1.1 + n[0] * 0.3, 3.4, lc[2] - p[2] * 1.1 + n[2] * 0.3]; return c(add(tg, [n[0] * d, 0.8, n[2] * d]), tg, 34); };
const s18: Shot = mk("s18_list", {
  scene: (t) => {
    const [t0] = span("s18_list");
    const yaw = HAYES_L_YAW;
    const run = M.ease(M.seg(t, t0 + 0.1, E.left - 0.25));
    const v = lerp(rowV(0) + 0.08, rowV(5) - 0.05, run);
    const away = M.ease(M.seg(t, E.left - 0.25, E.left + 0.05));
    const finger = listPoint(-0.86, v, 0.14);
    const lean = lerp(0.1, 0.3, run);
    const stroke = 0.04 * Math.sin((t - t0) * 9);
    const tl = M.snap(M.seg(t, E.left - 0.02, E.left + 0.16), 2);
    const base = at0(HAYES_L, yaw, M.mix({ lean, armR: 2.0 + stroke, armROut: -0.55, head: [0.9 - 1.65 * tl, 0.22 * (1 - tl)] }));
    const r = reach(base, 1, { L: finger });
    const h: ActLike = { ...r, pose: { ...r.pose, armL: lerp(r.pose!.armL ?? 0, -0.22, away), armLOut: lerp(r.pose!.armLOut ?? 0, 0.32, away) } };
    const bro = at0(BRO_T, -0.3, M.mix(M.idle(t, 1, 0.5), { head: [-0.6, -0.1] }));
    return <Yard focus={listPoint(0, 0)}>
      <Stand glow={0.3} boxes={0} certs={0} cash={false} />
      <Ch look={HAYES} a={h} t={t} expr={t < E.left ? M.talk(t, [E.which, E.pets9], "blank") : "smirk"} blink={blinkOn(t, E.left + 0.25)} cs={YCS} others={[st(bro, S.bro)]} />
      <Ch look={BRO} a={bro} t={t} scale={S.bro} expr="worried" cs={YCS} others={[st(h, 1)]} />
    </Yard>;
  },
  cam: (t) => mv("s18_list", LIST_CAM(17.6), LIST_CAM(16.8))(t),
});

export const SHOTS_A: Shot[] = [s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14, s15, s16, s17, s18];

// Short 10, SHOTS-A (builder: claude/short10-shotsa): shots 1-15 of notes/cubefolks/STORY_TESTS_v2.md section D, beats 1-9,
// from t = 0 to exactly P(10). See ./CONTRACT.md. Every time comes from at(beat, "word"); every Ch sits directly in the
// fragment a scene returns (via cast(), which returns an array of <Ch>), with the set's colliders and the other people.
//
// Geography (rig units, Classroom.tsx): the cage sits on the low shelf by the right wall (x 19.4..22), its front facing the
// room (-x); the door seam is at z 3.7, the drawer hole at z 4.9 (HOLE). Cameras on the cage sit on the +z side (toward the
// back of the room) and people working at the cage stand on its -z side facing it diagonally, so faces AND the cage front read.
import React from "react";
import * as THREE from "three";
import type { CamS, Shot } from "../kit/core";
import type { PopSpec } from "../kit/Pop";
import { Classroom, CLASSROOM_CS, doorCS, DESK, SINK } from "../blocky/Classroom";
import * as M from "../blocky/Motion";
import * as K from "../blocky/Collide";
import type { Expr, Look, Pose } from "../blocky/types";
import * as P from "./Props";
import { at, atE, P as PB, KC, KID, ME, MAYA, KIDS, Ch, st, Lights, cam, move, add, L3, type V3 } from "./common";

const PI = Math.PI;
const c01 = (x: number) => Math.max(0, Math.min(1, x));

// ───────────────────────────── moments (all from words) ─────────────────────────────
const E = {
  every1: at(1, "every"), without: at(1, "without"), door1: at(1, "door."),
  maya2: at(2, "Maya"), spare: at(2, "spare"), key: at(2, "key,"), so: at(2, "so"), taped: at(2, "taped"), door2: at(2, "door"), shut: at(2, "shut."),
  watched: at(3, "watched"), her3: at(3, "her"), morning: at(3, "morning,"), but: at(3, "but"), sir: at(3, "Sir"), still3: at(3, "still"), vanished: at(3, "vanished."),
  maya4: at(4, "Maya"), wash: at(4, "wash"), food: at(4, "food"), drawer: at(4, "drawer."),
  clean: at(5, "clean"), cage5: at(5, "cage"), friday5: at(5, "Friday"), monday5: at(5, "Monday,"), backpacks: at(5, "backpacks"), up5: at(5, "up"), lined: at(5, "lined"), beside: at(5, "beside"), it5: at(5, "it."),
  mondays: at(6, "Monday's"), first: at(6, "first"), hes: at(6, "he's"), always: at(6, "always"), back6: at(6, "back"), inside: at(6, "inside."),
  tape7: at(7, "tape"), never: at(7, "never"), broke: at(7, "broke."),
  checked: at(8, "checked"), bite: at(8, "bite"), marks: at(8, "marks"), and8: at(8, "and"), gaps: at(8, "gaps"), between: at(8, "between"), bars: at(8, "bars."),
  nothing: at(9, "Nothing."), nothingE: atE(9, "Nothing."),
};
/** The cut list (shot starts), all from words; the last entry is A's end = P(10). */
const C = {
  s01: 0, s02: E.without - KC, s03: PB(2), s04: E.so - KC, s05: PB(3), s05b: E.but - KC, s06: PB(4), s07: E.drawer - KC,
  s08: E.cage5 - KC, s09: E.backpacks - KC, s10: PB(6), s11: E.hes - KC, s12: PB(7), s13: PB(8), s14: E.and8 - KC, s15: E.bars - KC,
  end: PB(10),
};

// ───────────────────────────── the cast in a shot ─────────────────────────────
type Act = { position: V3; yaw: number; walk?: any; pose?: Pose; seed?: number };
type Actor = { look: Look; a: Act; expr?: Expr; scale?: number; hold?: { R?: React.ReactNode; L?: React.ReactNode }; lift?: number; seed?: number };
/** The people of a shot as <Ch> elements (an array placed directly in the scene's fragment: the audit finds them). */
const cast = (t: number, people: Actor[], cs: K.Box[]) => people.map((x, i) =>
  <Ch key={i} look={x.look} a={x.a} t={t} expr={x.expr ?? "smile"} scale={x.scale ?? KID} hold={x.hold} lift={x.lift ?? 0} blinkSeed={(x.seed ?? i) * 3 + 1}
    cs={cs} others={people.filter((_, j) => j !== i).map((o) => st({ ...o.a, position: [o.a.position[0], o.a.position[1] + (o.lift ?? 0), o.a.position[2]] }, o.scale ?? KID))} />);

/** A kid sitting at desk i (seated idle). */
const seated = (i: number, t: number, extra: Pose[] = []): Act => {
  const d = DESK(i);
  return { position: [d.seat[0], M.seatedY(d.seat[1], KID), d.seat[2]], yaw: d.yaw, pose: M.mix({ legL: PI / 2, legR: PI / 2, armL: 0.35, armR: 0.35 }, M.seatedIdle(t, i), ...extra) };
};
/** Solve both or one arm onto world targets (rig hands end exactly there when reachable). */
const reach = (a: Act, s: number, R?: V3, L?: V3): Act => {
  let pose: Pose = { ...(a.pose ?? {}) };
  if (R) pose = { ...pose, ...K.reachArm({ position: a.position, yaw: a.yaw, scale: s, pose, walk: a.walk }, -1, R).pose };
  if (L) pose = { ...pose, ...K.reachArm({ position: a.position, yaw: a.yaw, scale: s, pose, walk: a.walk }, 1, L).pose };
  return { ...a, pose };
};
/** A character's left (local +x) in world for yaw. */
const leftOf = (yaw: number): V3 => [Math.cos(yaw), 0, -Math.sin(yaw)];
const fwd = (yaw: number): V3 => [Math.sin(yaw), 0, Math.cos(yaw)];
const sc3 = (v: V3, k: number): V3 => [v[0] * k, v[1] * k, v[2] * k];
/** Head yaw (relative to the body, clamped) so a character looks at a world point. */
const lookAt = (from: V3, yaw: number, to: V3, lim = 1.2) => Math.max(-lim, Math.min(lim, M.dAng(yaw, M.yawTo(from, to))));

// ───────────────────────────── the room ─────────────────────────────
type RoomOpts = { drawer?: number | null; tape?: number; wheel?: number; bags?: boolean; meOpen?: number; board?: string; door?: number; focus?: V3; hamster?: React.ReactNode; clock?: number; ceiling?: boolean };
const Room: React.FC<RoomOpts> = ({ drawer = 0, tape = 1, wheel = 0, bags = false, meOpen = 1, board = "Friday!", door = 0, focus = P.CAGE_CENTER, hamster, clock = 10.17, ceiling = true }) => <>
  <Lights focus={focus} />
  <Classroom door={door} boardText={board} clock={clock} ceiling={ceiling} />
  <P.ClassCage drawer={drawer} wheel={wheel} tape={tape} lock>{hamster}</P.ClassCage>
  {bags && <P.BagRow meOpen={meOpen} />}
</>;
const CS = (o: { bags?: boolean; door?: number; stool?: boolean } = {}): K.Box[] => [...CLASSROOM_CS, ...P.CAGE_CS, ...(o.bags ? P.BAG_CS : []), ...(o.door !== undefined ? doorCS(o.door) : []), ...(o.stool ? [STOOL_CS] : [])];
/** The wheel keeps turning after he's gone (slowing), from any t. */
const wheelSpin = (t: number) => 7.5 * t - 0.6 * t * t;

// ───────────────────────────── small props of our own ─────────────────────────────
/** A push broom (held: +z runs down the arm). */
const Broom: React.FC = () => <group>
  <mesh position={[0, 0, 1.4]} rotation={[PI / 2, 0, 0]}><cylinderGeometry args={[0.07, 0.07, 3.0, 8]} /><meshStandardMaterial color="#b88a4a" roughness={0.7} /></mesh>
  <mesh position={[0, 0, 2.95]}><boxGeometry args={[1.3, 0.22, 0.28]} /><meshStandardMaterial color="#2a2a30" roughness={0.8} /></mesh>
  <mesh position={[0, 0, 3.12]}><boxGeometry args={[1.25, 0.2, 0.12]} /><meshStandardMaterial color="#d8b04a" roughness={1} /></mesh>
</group>;
/** The food drawer carried in the world: `handle` is where the hands hold it; it sticks out ahead along `yaw`. */
const CarriedTray: React.FC<{ handle: V3; yaw: number }> = ({ handle, yaw }) => {
  const c = add(handle, sc3(fwd(yaw), P.DRAWER.len / 2 + 0.06));
  return <group position={[c[0], handle[1] - P.DRAWER.h / 2, c[2]]} rotation={[0, yaw + PI, 0]}><P.DrawerTray /></group>;
};
/** Water from the classroom tap into the basin (a thin stream and a few bubbles). */
const Water: React.FC<{ t: number; top: V3; y1: number }> = ({ t, top, y1 }) => <group>
  <mesh position={[top[0], (top[1] + y1) / 2, top[2]]}><cylinderGeometry args={[0.07, 0.09, top[1] - y1, 8]} /><meshStandardMaterial color="#bfe4ff" transparent opacity={0.75} roughness={0.05} emissive={new THREE.Color("#2a4a6a")} emissiveIntensity={0.3} /></mesh>
  {Array.from({ length: 6 }, (_, k) => { const a = k * 1.7 + t * 2, r = 0.25 + ((t * 0.7 + k * 0.37) % 1) * 0.35;
    return <mesh key={k} position={[top[0] + Math.cos(a) * r, y1 + 0.05, top[2] + Math.sin(a) * r]}><sphereGeometry args={[0.07, 8, 6]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.85} /></mesh>; })}
</group>;

// ───────────────────────────── cage points ─────────────────────────────
/** Door tape strip k (0 low, 1 high), world point at fraction f (0 = start, 1 = end) of its full length. */
const tapePt = (k: 0 | 1, f: number): V3 => P.cagePoint([P.CAGE_DOOR.x1 - 0.45 + 0.9 * f, P.CAGE_DOOR.y0 + [0.35, 0.95][k], P.CAGE.d / 2 + 0.12]);
/** The drawer handle (world) when the drawer is out by u (0..1). */
const handleAt = (u: number): V3 => P.cagePoint([P.DRAWER.x, P.DRAWER.y0 + P.DRAWER.h / 2, P.CAGE.d / 2 - P.DRAWER.len / 2 + u * P.DRAWER.len + P.DRAWER.len / 2 + 0.06]);
/** Sir Nibbles inside the cage (local cage frame), eating with full cheeks; lookYaw turns his head. */
const Nibbles: React.FC<{ t: number; lookYaw?: number; at?: V3 }> = ({ t, lookYaw = 0, at = [0.35, P.CAGE.base, 0.35] }) =>
  <P.Hamster look={P.NIBBLES} p={at} yaw={0.15} cheeks={0.85 + 0.15 * Math.abs(Math.sin(t * 9))} lookYaw={lookYaw} blink={M.env(t, 0, Infinity) * (Math.sin(t * 2.3) > 0.97 ? 1 : 0)} />;

// ───────────────────────────── shot 1 camera (exported for shot 34's loop) ─────────────────────────────
const S1_FROM = cam([13.0, 3.25, 9.7], [19.9, 4.35, 3.75], 40), S1_TO = cam([13.95, 3.3, 8.85], [19.9, 4.35, 3.75], 38.5);
/** Shot 1's slow push at master time t (t = 0 is frame 0). It keeps going for t < 0 (wider), so shot 34 can call
 *  SHOT1_CAM(t - T.END) and its last frame lands exactly on frame 0: the loop cuts cleanly. */
export const SHOT1_CAM = (t: number): CamS => {
  const u = Math.min(1, t / (C.s02 - C.s01)); // a steady push (linear, so it extends smoothly before 0)
  return { pos: L3(S1_FROM.pos, S1_TO.pos, u), target: L3(S1_FROM.target, S1_TO.target, u), fov: S1_FROM.fov + (S1_TO.fov - S1_FROM.fov) * u };
};

// ───────────────────────────── shots ─────────────────────────────
const mk = (id: string, t0: number, t1: number, scene: (t: number) => React.ReactNode, camF: (t: number) => CamS, extra: Partial<Shot> = {}): Shot =>
  ({ id, t0, t1, scene, cam: camF, enter: "cut", ...extra });

// shot 2 / 4 / 12: ME on a little step stool at the door tape (the door sits above a kid's reach from the floor)
const STOOL_H = 0.85;
const meTapeYaw = 1.3;
const ME_TAPE: V3 = K.standToReach(tapePt(0, 0.5), meTapeYaw, -1, 1.5, KID, 0.1, STOOL_H);
const STOOL_CS: K.Box = K.box([ME_TAPE[0] - 0.04, STOOL_H / 2, ME_TAPE[2]], [1.84, STOOL_H, 2.1], "stool");
/** ME's wooden step stool (drawn where its collider is). */
const Stool: React.FC = () => <group position={[ME_TAPE[0] - 0.04, 0, ME_TAPE[2]]}>
  <mesh position={[0, STOOL_H - 0.09, 0]} castShadow receiveShadow><boxGeometry args={[1.84, 0.18, 2.1]} /><meshStandardMaterial color="#d8a860" roughness={0.7} /></mesh>
  {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([i, j], k) => <mesh key={k} position={[i * 0.78, (STOOL_H - 0.18) / 2, j * 0.9]} castShadow><boxGeometry args={[0.22, STOOL_H - 0.18, 0.22]} /><meshStandardMaterial color="#b8823a" roughness={0.7} /></mesh>)}
</group>;

// shot 3/5: Maya's and ME's desks
const MAYA_DESK = 2, ME_DESK = 5;

// shot 6: Maya pulls the drawer, lifts it, turns and carries it toward the sink
const S6 = (t: number) => {
  const t0 = C.s06, tPull = t0 + 0.25, tLift = t0 + 0.42, tTurn = t0 + 0.72;
  const reachK = 1.18; // hands this far ahead of her feet
  const u = 0.62 + 0.38 * M.ease(M.seg(t, t0, tPull));
  const pullH = handleAt(u);
  const startPos: V3 = [pullH[0] - reachK, 0, pullH[2]];
  if (t < tLift) {
    const yaw = PI / 2, ws = M.turnSteps(t, t0, tPull - t0);
    const a: Act = { position: startPos, yaw, walk: ws, pose: { lean: 0.08, head: [0, 0.18], armL: 1.45, armR: 1.45 } };
    return { a, handle: pullH, drawer: t < tPull ? u : (t < tLift ? 1 : null) as number | null, trayYaw: yaw };
  }
  // lifted: the handle rides in front of her chest; she turns toward the sink and walks
  const end0: V3 = [pullH[0] - reachK, 0, pullH[2]];
  const path: V3[] = [end0, [16.55, 0, 7.6], [16.1, 0, 12.6]];
  const tr = M.turn(PI / 2, M.yawTo(path[0], path[1]), t, tLift + 0.05, tTurn - tLift - 0.05);
  const w = M.walkPath(path, t, tTurn, { scale: KID, gait: "walk" });
  const yaw = t < tTurn ? tr.yaw : w.yaw;
  const pos = t < tTurn ? end0 : w.position;
  const liftK = M.ease(M.seg(t, tLift - 0.05, tLift + 0.2));
  const handle = add(pos, add(sc3(fwd(yaw), reachK - 0.1), [0, 2.73 + 0.35 * liftK, 0]));
  const a: Act = { position: pos, yaw, walk: t < tTurn ? tr.walk : w.walk, pose: { armL: 1.35, armR: 1.35, head: [0, 0.12] } };
  return { a, handle, drawer: null as number | null, trayYaw: yaw };
};
// shot 7: at the sink
const SINK_TRAY = (t: number): V3 => [SINK[0] + 0.2 * Math.sin((t - C.s07) * 9), 3.5, SINK[2] + 1.0];

export const SHOTS_A: Shot[] = [
  // (1) frame 0: the empty cage, the wheel still turning, the door taped and padlocked; slow push. (The lead stamps ESCAPED (AGAIN).)
  mk("a01_cage", C.s01, C.s02, (t) => <Room drawer={0} tape={1} wheel={wheelSpin(t + 0.6)} />, SHOT1_CAM),

  // (2) "without opening the door": ME's finger presses the tape: unbroken
  mk("a02_tape", C.s02, C.s03, (t) => {
    const press = Math.sin(PI * M.seg(t, C.s02 + 0.2, C.s02 + 0.55)) * 0.12;
    const tgt = add(tapePt(0, 0.55), [-0.12 + press * 0.3, 0, 0]);
    let a: Act = { position: ME_TAPE, yaw: meTapeYaw, pose: M.mix({ lean: 0.1 + press * 0.15, armR: 1.5, head: [0, -0.05] }, M.idle(t, 2, 0.5)) };
    a = reach(a, KID, tgt);
    const head = (t >= E.door1 ? 1 : 0) * lookAt(ME_TAPE, meTapeYaw, [14.6, 4.5, 6.8]);
    a.pose = M.mix(a.pose, { head: [head * 0.6, -0.05] });
    return <><Room drawer={0} tape={1} wheel={wheelSpin(t + 0.6)} focus={tapePt(0, 0.5)} /><Stool />
      {cast(t, [{ look: ME, a, expr: M.faceAt(t, "worried", "smirk", E.door1 - 0.05) }], CS({ stool: true }))}</>;
  }, (t) => move(cam([15.4, 4.7, 7.4], [19.0, 3.95, 3.25], 36), cam([15.8, 4.6, 7.0], [19.0, 3.95, 3.3], 35), t, C.s02, C.s03)),

  // (3) "Maya has the spare key": Maya at her desk swings the key on its lanyard, turns back with a smirk
  mk("a03_key", C.s03, C.s04, (t) => {
    const swing = Math.sin((t - C.s03) * 9) * 0.6;
    const turnK = M.ease(M.seg(t, E.key - 0.1, E.key + 0.25));
    const maya = seated(MAYA_DESK, t, [M.raise(t, E.maya2 - 0.05), { armROut: 0.25 * Math.sin((t - C.s03) * 9), twist: 0.35 * turnK, head: [0.9 * turnK, -0.05] }]);
    const me = seated(ME_DESK, t, [{ armL: 0.9, head: [0, 0.05] }, M.crossArms(t, E.key)]);
    const kids: Actor[] = [0, 1, 4, 7].map((d, k) => ({ look: KIDS[k], a: seated(d, t + k, [M.idle(t, k + 4, 0.5)]), seed: 10 + k }));
    return <><Room focus={DESK(MAYA_DESK).seat} />
      {cast(t, [
        { look: MAYA, a: maya, expr: M.faceAt(t, "grin", "smirk", E.key - 0.05), hold: { R: <group rotation={[swing, 0, 0]}><P.KeyLanyard swing={swing * 0.6} /></group> } },
        { look: ME, a: me, expr: M.faceAt(t, "blank", "worried", E.key) },
        ...kids,
      ], CS())}</>;
  }, (t) => move(cam([9.2, 5.6, -11.6], [3.4, 3.7, -1.6], 40), cam([8.7, 5.5, -10.9], [3.4, 3.7, -1.6], 39), t, C.s03, C.s04)),

  // (4) "so I taped the door shut": ME rips the tape off the roll and seals it across the seam
  mk("a04_seal", C.s04, C.s05, (t) => {
    const tp = M.ease(M.seg(t, E.taped - 0.05, E.shut + 0.05));
    const f = c01(tp * 1.3); // the low strip's end (the hand drags it)
    const tgt = tapePt(0, Math.max(0.05, f));
    let a: Act = { position: ME_TAPE, yaw: meTapeYaw, pose: M.mix({ lean: 0.1, armR: 1.5, armL: 0.9, armLOut: 0.25 }, M.idle(t, 2, 0.4)) };
    a = reach(a, KID, tgt);
    const doneK = M.ease(M.seg(t, E.shut + 0.1, E.shut + 0.35));
    a.pose = M.mix(a.pose, M.nod(t, E.shut + 0.1, 1, 3), { head: [lookAt(ME_TAPE, meTapeYaw, [14.6, 4.8, 8.2]) * 0.7 * doneK, 0] });
    return <><Room drawer={0} tape={tp} wheel={wheelSpin(t + 0.6)} focus={P.SEAM} /><Stool />
      {cast(t, [{ look: ME, a, expr: M.faceAt(t, "talk", "smirk", E.shut), hold: { L: <P.TapeRoll /> } }], CS({ stool: true }))}</>;
  }, (t) => move(cam([14.2, 5.3, 8.6], [18.8, 3.6, 3.1], 40), cam([14.6, 5.2, 8.1], [18.8, 3.7, 3.2], 39), t, C.s04, C.s05)),

  // (5) "I watched her all morning": ME at his desk, notebook up, eyes following Maya as she walks past
  mk("a05_watch", C.s05, C.s05b, (t) => {
    const mw = M.walkPath([[7.6, 0, 10.5], [7.6, 0, -4]], t, C.s05 - 0.9, { scale: KID, gait: "stroll" });
    const meP = DESK(ME_DESK);
    const meHead: V3 = [meP.seat[0], 3.5, meP.seat[2]];
    const hy = lookAt(meHead, PI, mw.position, 1.25);
    const me = seated(ME_DESK, t, [{ armL: 1.25, armLOut: -0.15, head: [hy, -0.04], twist: hy * 0.25 }, M.stir(t, E.her3, Infinity, 3)]);
    const kids: Actor[] = [1, 4, 3, 7].map((d, k) => ({ look: KIDS[k], a: seated(d, t + k, [M.idle(t, k + 4, 0.5)]), seed: 10 + k }));
    const maya = M.act(mw, { head: [-0.3, 0] });
    return <><Room focus={meP.seat} />
      {cast(t, [
        { look: ME, a: me, expr: M.faceAt(t, "worried", "smirk", E.morning), hold: { L: <P.Notebook /> } },
        { look: MAYA, a: maya, expr: "happy" },
        ...kids,
      ], CS())}</>;
  }, (t) => move(cam([12.0, 6.0, -5.2], [5.2, 3.2, 2.6], 42), cam([11.6, 5.9, -4.6], [5.2, 3.2, 2.6], 41), t, C.s05, C.s05b)),

  // (5b) "but Sir Nibbles still vanished": ME hurries to the cage: empty, tape intact; he snaps round to us
  mk("a05b_gone", C.s05b, C.s06, (t) => {
    const end: V3 = [16.9, 0, 0.4];
    const w = M.walkPath([[12.6, 0, -3.4], end], t, C.s05b - 0.35, { scale: KID, gait: "hurry", yaw1: M.yawTo(end, P.CAGE_CENTER) });
    const camP: V3 = [13.4, 4.8, 8.8];
    const snapYaw = lookAt(end, M.yawTo(end, P.CAGE_CENTER), camP, 1.3);
    const a = M.act(w, M.recoil(t, E.vanished - 0.1), M.headSnap(t, E.vanished - 0.05, snapYaw, -0.05));
    return <><Room drawer={0} tape={1} wheel={wheelSpin(t + 0.6)} />
      {cast(t, [{ look: ME, a, expr: M.faceAt(t, "worried", "surprised", E.still3) }], CS())}</>;
  }, (t) => move(cam([13.4, 4.8, 8.8], [18.6, 3.5, 2.6], 42), cam([14.1, 4.7, 8.2], [18.8, 3.6, 2.6], 40), t, C.s05b, C.s06)),

  // (6) CLUE "All Maya did was wash his food drawer": Maya slides the drawer OUT (the hole shows) and carries it off
  mk("a06_drawer", C.s06, C.s07, (t) => {
    const m = S6(t), yaw = m.a.yaw;
    const side = add(m.handle, sc3(fwd(yaw), m.drawer === null ? 0.3 : 0)), L = add(side, sc3(leftOf(yaw), 0.88)), R = add(side, sc3(leftOf(yaw), -0.88));
    const a = reach(m.a, KID, R, L);
    const glance = M.env(t, E.maya4, E.wash + 0.1, 0.15, 0.2) * 0.55;
    a.pose = M.mix(a.pose, { head: [-glance, -0.05] });
    return <><Room drawer={m.drawer} tape={1} wheel={wheelSpin(t + 0.6)} bags meOpen={1} focus={P.HOLE} />
      {m.drawer === null && <CarriedTray handle={m.handle} yaw={m.trayYaw} />}
      {cast(t, [{ look: MAYA, a, expr: M.faceAt(t, "smile", "happy", E.maya4 + 0.2) }], CS({ bags: true }))}</>;
  }, (t) => move(cam([12.3, 4.5, 10.6], [18.2, 2.75, 4.9], 37), cam([12.8, 4.4, 10.1], [18.0, 2.8, 5.4], 36), t, C.s06, C.s07)),

  // (7) "...drawer." / "We clean": Maya at the sink washing it, humming (eyes closed, head bobbing)
  mk("a07_sink", C.s07, C.s08, (t) => {
    const yaw = 0, pos: V3 = [SINK[0], 0, SINK[2]];
    const h = SINK_TRAY(t);
    let a: Act = { position: pos, yaw, pose: M.mix({ armL: 1.5, armR: 1.5, lean: 0.06 }, M.idle(t, 3, 0.4)) };
    a = reach(a, KID, add(h, [-0.88, 0, 0.3]), add(h, [0.88, 0, 0.3]));
    a.pose = M.mix(a.pose, { head: [-0.85, -0.06 + 0.06 * Math.sin((t - C.s07) * 7)], tilt: 0.12 * Math.sin((t - C.s07) * 3.5), roll: 0.03 * Math.sin((t - C.s07) * 3.5) });
    const ws: V3 = [SINK[0] + 0.1, 5.0, SINK[2] + 2.3];
    return <><Room drawer={null} tape={1} wheel={wheelSpin(t + 0.6)} bags focus={pos} />
      <CarriedTray handle={h} yaw={yaw} />
      <Water t={t} top={ws} y1={3.85} />
      {cast(t, [{ look: MAYA, a, expr: "happy" }], CS({ bags: true }))}</>;
  }, (t) => move(cam([10.6, 5.6, 10.4], [16.0, 3.7, 15.0], 40), cam([11.0, 5.5, 10.8], [16.0, 3.8, 15.0], 39), t, C.s07, C.s08)),

  // (8) "We clean his cage every Friday and Monday": high over the cage corner: one kid wipes, one sweeps, ME sets his bag down
  mk("a08_clean", C.s08, C.s09, (t) => {
    const wiper: Act = { position: [17.85, 0, -1.6], yaw: PI / 2, pose: M.mix(M.stir(t, C.s08 - 0.5, Infinity, 1.8), { armL: 0.3 }) };
    const sw = Math.sin((t - C.s08) * 6);
    const sweeper: Act = { position: [13.4 + 0.15 * sw, 0, 3.6], yaw: PI / 2 + 0.5, walk: { phase: (t - C.s08) * 6, amount: 0.25 }, pose: { armR: 0.75 + 0.18 * sw, armL: 0.75 + 0.18 * sw, armROut: 0, armLOut: 0, lean: 0.12, head: [0, 0.2] } };
    const meP: V3 = [16.35, 0, 4.9];
    const me: Act = { position: meP, yaw: PI / 2, pose: M.mix(M.pickUp(t, C.s08 - 0.1, 1.0), M.idle(t, 5, 0.5)) };
    const mh = SINK_TRAY(t);
    let maya: Act = { position: [SINK[0], 0, SINK[2]], yaw: 0, pose: { armL: 1.5, armR: 1.5 } };
    maya = reach(maya, KID, add(mh, [-0.88, 0, 0.3]), add(mh, [0.88, 0, 0.3]));
    return <><Room drawer={null} tape={1} wheel={wheelSpin(t + 0.6)} bags meOpen={1} focus={[17, 0, 4]} ceiling={false} />
      <CarriedTray handle={mh} yaw={0} />
      {cast(t, [
        { look: KIDS[0], a: wiper, expr: "smile", hold: { R: <P.Sponge /> }, seed: 11 },
        { look: KIDS[2], a: sweeper, expr: "grin", hold: { R: <Broom /> }, seed: 12 },
        { look: ME, a: me, expr: "smile" },
        { look: MAYA, a: maya, expr: "happy", seed: 13 },
      ], CS({ bags: true }))}</>;
  }, (t) => move(cam([8.8, 11.6, -3.4], [17.6, 1.6, 4.6], 46), cam([9.4, 11.4, -2.6], [17.8, 1.6, 4.8], 45), t, C.s08, C.s09)),

  // (9) CLUE "with our backpacks lined up beside it": the row; ME's striped bag right under the drawer hole, pocket open
  mk("a09_bags", C.s09, C.s10, (t) => {
    const open = 0.35 + 0.65 * M.ease(M.seg(t, E.lined - 0.1, E.lined + 0.25));
    const w = M.walkPath([[16.3, 0, 3.0], [15.2, 0, -1.5]], t, E.up5, { scale: KID, gait: "stroll", yaw0: PI / 2 });
    const a = M.act(w, t < E.up5 ? M.pickUp(t, C.s09 - 0.45, 1.0) : {});
    return <><Room drawer={null} tape={1} wheel={wheelSpin(t + 0.6)} bags meOpen={open} focus={P.POCKET} />
      {cast(t, [{ look: ME, a, expr: "smile" }], CS({ bags: true }))}</>;
  }, (t) => move(cam([12.6, 3.3, 8.6], [18.4, 1.9, 4.5], 36), cam([13.3, 3.25, 8.0], [18.4, 1.9, 4.6], 34), t, C.s09, C.s10)),

  // (10) "And by Monday's first lesson": Monday, the kids file in and stop: Sir Nibbles is back inside, eating
  mk("a10_monday", C.s10, C.s11, (t) => {
    const stops: V3[] = [[16.4, 0, -1.8], [13.9, 0, -3.4], [17.8, 0, -4.6], [15.0, 0, -6.6]];
    const looks: Look[] = [ME, MAYA, KIDS[1], KIDS[3]];
    const t0 = C.s10 - 1.55;
    const people: Actor[] = stops.map((s, i) => {
      const path: V3[] = [[16.0, 0, -13.5], [s[0], 0, s[2] - 2.4], s];
      const w = M.fileIn(i, path, t, t0, 0.42, { scale: KID, gait: "walk", yaw1: M.yawTo(s, add(P.CAGE_CENTER, [0, 0, 0.4])) });
      const stopT = t0 + i * 0.42 + M.walkDuration(path, { scale: KID, gait: "walk" });
      const shock = M.env(t, stopT - 0.05, Infinity, 0.12);
      return { look: looks[i], a: M.act(w, i === 0 ? M.recoil(t, stopT) : M.scale({ lean: -0.06, head: [0, -0.06] }, shock), M.idle(t, i + 30, 0.4)), expr: M.faceAt(t, "smile", "surprised", stopT), seed: 40 + i };
    });
    return <><Room drawer={0} tape={1} wheel={wheelSpin(t)} board="Monday!" clock={8.5} door={1} hamster={<Nibbles t={t} lookYaw={-0.5} />} />
      {cast(t, people, CS({ door: 1 }))}</>;
  }, (t) => move(cam([21.2, 6.6, 10.6], [16.6, 3.3, -3.6], 44), cam([21.0, 6.4, 10.0], [16.6, 3.3, -3.6], 43), t, C.s10, C.s11)),

  // (11) "he's always back inside": Sir Nibbles, cheeks full, turns and looks right at us
  mk("a11_cheeks", C.s11, C.s12, (t) => {
    const ly = -0.55 + 0.55 * M.ease(M.seg(t, E.back6 - 0.1, E.back6 + 0.15));
    return <Room drawer={0} tape={1} wheel={0} board="Monday!" clock={8.5} focus={P.cagePoint([0.35, 1, 0.5])} hamster={<Nibbles t={t} lookYaw={ly} />} />;
  }, (t) => move(cam([16.4, 3.95, 4.55], [20.25, 3.35, 4.35], 30), cam([16.9, 3.9, 4.5], [20.25, 3.35, 4.35], 29), t, C.s11, C.s12)),

  // (12) "My tape never broke": the tape still on; ME's jaw drops
  mk("a12_never", C.s12, C.s13, (t) => {
    const tgt = add(tapePt(0, 0.4), [-0.03, 0, 0]);
    let a: Act = { position: ME_TAPE, yaw: meTapeYaw, pose: { lean: 0.1, armR: 1.5 } };
    const touch = 1 - M.ease(M.seg(t, E.never + 0.05, E.never + 0.3));
    a = reach(a, KID, tgt);
    a.pose = M.mix(M.scale(a.pose ?? {}, touch), M.recoil(t, E.never + 0.05), { head: [lookAt(ME_TAPE, meTapeYaw, [15.0, 4.3, 7.4]) * 0.55 * (1 - touch), 0] });
    return <><Room drawer={0} tape={1} wheel={wheelSpin(t)} board="Monday!" clock={8.5} focus={P.SEAM} hamster={<Nibbles t={t} lookYaw={-0.3} />} /><Stool />
      {cast(t, [{ look: ME, a, expr: M.faceAt(t, "blank", "surprised", E.never) }], CS({ stool: true }))}</>;
  }, (t) => move(cam([14.9, 4.4, 7.5], [18.7, 3.85, 3.0], 38), cam([15.3, 4.35, 7.1], [18.7, 3.85, 3.0], 37), t, C.s12, C.s13)),

  // (13) "I checked for bite marks": ME with the magnifying glass leans in and looks around the bars
  mk("a13_magnify", C.s13, C.s14, (t) => {
    const pos: V3 = [17.6, 0, 7.6], yaw = M.yawTo(pos, [19.8, 0, 6.0]);
    const a: Act = { position: pos, yaw, pose: M.mix({ armR: 1.95, armROut: -0.1 + 0.25 * Math.sin((t - C.s13) * 4) }, M.leanIn(t, C.s13 - 0.2), M.lookAround(t, E.checked, C.s14 + 0.2, 1, 0.5)) };
    return <><Room drawer={0} tape={1} wheel={wheelSpin(t)} board="Monday!" clock={8.5} focus={pos} hamster={<Nibbles t={t} lookYaw={0.6} />} />
      {cast(t, [{ look: ME, a, expr: "worried", hold: { R: <P.Magnifier /> } }], CS())}</>;
  }, (t) => move(cam([13.6, 5.2, 0.6], [18.4, 3.6, 6.4], 42), cam([14.1, 5.1, 1.2], [18.4, 3.6, 6.4], 41), t, C.s13, C.s14)),

  // (14) "and gaps between the bars": close on the bars, the glass sweeps along them: no bite marks, no gaps
  mk("a14_bars", C.s14, C.s15, (t) => {
    const pos: V3 = [17.6, 0, 7.6], yaw = M.yawTo(pos, [19.8, 0, 6.0]);
    const sw = M.ease(M.seg(t, C.s14, C.s15));
    const a: Act = { position: pos, yaw, pose: M.mix({ armR: 1.95 + 0.15 * Math.sin(sw * PI), armROut: -0.35 + 0.65 * sw, lean: 0.12, head: [0, 0.1] }) };
    return <><Room drawer={0} tape={1} wheel={wheelSpin(t)} board="Monday!" clock={8.5} focus={P.CAGE_CENTER} hamster={<Nibbles t={t} lookYaw={0.9} />} />
      {cast(t, [{ look: ME, a, expr: "worried", hold: { R: <P.Magnifier /> } }], CS())}</>;
  }, (t) => move(cam([16.3, 4.6, 9.8], [19.6, 3.9, 5.6], 36), cam([16.6, 4.6, 9.5], [19.8, 3.9, 5.4], 35), t, C.s14, C.s15)),

  // (15) "Nothing.": ME turns to us and shrugs
  mk("a15_nothing", C.s15, C.end, (t) => {
    const pos: V3 = [17.2, 0, 6.8], camP: V3 = [12.0, 4.4, 9.8];
    const tr = M.turn(M.yawTo(pos, [19.8, 0, 6.0]), M.yawTo(pos, camP), t, C.s15 + 0.05, 0.35);
    const a: Act = { position: pos, yaw: tr.yaw, walk: tr.walk, pose: M.mix(M.shrug(t, E.nothing - 0.05, C.end + 0.5), M.idle(t, 6, 0.5), { armR: 0.3 * (1 - M.seg(t, C.s15, C.s15 + 0.3)) }) };
    return <><Room drawer={0} tape={1} wheel={wheelSpin(t)} board="Monday!" clock={8.5} focus={pos} hamster={<Nibbles t={t} lookYaw={-0.4} />} />
      {cast(t, [{ look: ME, a, expr: M.faceAt(t, "worried", "blank", E.nothing), hold: { R: <P.Magnifier /> } }], CS())}</>;
  }, (t) => move(cam([12.0, 4.4, 9.8], [17.6, 3.3, 5.6], 40), cam([12.5, 4.35, 9.4], [17.6, 3.3, 5.6], 39), t, C.s15, C.end)),
];

/** Small clue pops (top third, clear of the caption band and the clue props). The lead adds the hook stamp and the question. */
export const POPS_A: PopSpec[] = [];

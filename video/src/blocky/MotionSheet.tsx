// The motion sheet: every move in Motion.ts on one screen, a 3x4 grid of small live 3D cells (8 s loop).
// Review it as a video before using a move in a Short (notes/cubefolks/FIRST_TASKS.md task 2).
// Times inside a cell are plain seconds on purpose: this is a test sheet, not a Short (Shorts anchor to words).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam } from "../kit/Short";
import type { CamS } from "../kit/core";
import { BlockChar, blinkCurve } from "./BlockRig";
import { BlockLights, Sky } from "./Look";
import { mat, rep } from "./Textures";
import type { Expr, Look, Pose } from "./types";
import * as M from "./Motion";
import * as K from "./Collide";

export const MOTION_SHEET_FRAMES = 240;
const CW = 360, CH = 480; // cell size (3 x 4 = 1080 x 1920)
type V3 = M.V3;

// ---- a varied default-avatar townsfolk cast (our own designs) ----
const PALE = "#ece6dc", LIGHT = "#f0d0ae", WARM = "#c98e62", DEEP = "#7e5236";
export const TOWNSFOLK: Look[] = [
  { skin: PALE, shirt: "#f2c81e", pants: "#1c1c20", shirtPattern: "stripes", hair: "spiky", hairColor: "#f3d35a" },
  { skin: LIGHT, shirt: "#c8302a", pants: "#1e1e24", hair: "long", hairColor: "#1a1210" },
  { skin: PALE, shirt: "#d9c49a", pants: "#6a6c70", hair: "short", hairColor: "#6a4426", tie: "#7a5a2a" },
  { skin: WARM, shirt: "#2f6fc8", pants: "#2a2f3a", hair: "short", hairColor: "#1a120c", hat: "cap" },
  { skin: PALE, shirt: "#3f7a46", pants: "#c8c4b8", shirtPattern: "plaid", hair: "short", hairColor: "#e8e4dc" },
  { skin: DEEP, shirt: "#e07a2e", pants: "#3a4a6a", hair: "ponytail", hairColor: "#3a2414" },
  { skin: LIGHT, shirt: "#efe3c8", pants: "#2c3a5a", hair: "bun", hairColor: "#8a5a34" },
  { skin: PALE, shirt: "#1d2230", pants: "#1d2230", hair: "short", hairColor: "#2a1c14", tie: "#b02a2a" },
  { skin: WARM, shirt: "#7a4fb0", pants: "#2a2a34", hair: "bob", hairColor: "#c89a4a", glasses: true },
  { skin: LIGHT, shirt: "#d6e86a", pants: "#1c1c22", hair: "short", hairColor: "#d8d4cc", hat: "cap" },
  { skin: DEEP, shirt: "#9a2a4a", pants: "#2a2420", hair: "short", hairColor: "#0e0a08", hat: "beanie" },
  { skin: PALE, shirt: "#8fb8e8", pants: "#3a3f4a", hair: "ponytail", hairColor: "#b5612a" },
  { skin: LIGHT, shirt: "#5a6a8a", pants: "#2a2a30", hair: "bun", hairColor: "#888078", glasses: true },
  { skin: WARM, shirt: "#e9a3b8", pants: "#2c3a5a", hair: "long", hairColor: "#6a4024" },
  { skin: PALE, shirt: "#4a8a8a", pants: "#4a3a2a", hair: "spiky", hairColor: "#9a6a3c" },
  { skin: DEEP, shirt: "#f2efe6", pants: "#1c1c22", hair: "bob", hairColor: "#2a1a10" },
];
const ME = TOWNSFOLK[0];
const GUARD: Look = { skin: PALE, shirt: "#d6e86a", pants: "#1c1c22", hair: "short", hairColor: "#e8e4dc", hat: "cap" };
const COOK: Look = { skin: LIGHT, shirt: "#efd6dc", pants: "#2c3a5a", hair: "bun", hairColor: "#8a5a34" };

// ---- small set pieces ----
const Ground: React.FC<{ size?: number; kind?: "grass" | "wood" | "concrete" }> = ({ size = 80, kind = "grass" }) => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[size, size]} /><meshStandardMaterial {...mat(kind, undefined, rep(kind, size, size))} /></mesh>
);
const Box: React.FC<{ p: V3; s: V3; c: string; kind?: Parameters<typeof mat>[0]; rot?: number }> = ({ p, s, c, kind, rot = 0 }) => (
  <mesh position={p} rotation={[0, rot, 0]} castShadow receiveShadow>
    <boxGeometry args={s} />
    {kind ? <meshStandardMaterial {...mat(kind, c, rep(kind, Math.max(s[0], s[2]), s[1]))} /> : <meshStandardMaterial color={c} roughness={0.8} />}
  </mesh>
);
const Sidewalk: React.FC<{ from: V3; to: V3; w?: number }> = ({ from, to, w = 4 }) => {
  const L = Math.hypot(to[0] - from[0], to[2] - from[2]), a = Math.atan2(to[0] - from[0], to[2] - from[2]);
  return <mesh position={[(from[0] + to[0]) / 2, 0.02, (from[2] + to[2]) / 2]} rotation={[-Math.PI / 2, 0, a]} receiveShadow>
    <planeGeometry args={[w, L]} /><meshStandardMaterial {...mat("concrete", undefined, rep("concrete", w, L))} />
  </mesh>;
};
/** A chair: seat top at y=sh, facing +z (rotated by yaw). */
const Chair: React.FC<{ p: V3; yaw?: number; sh?: number }> = ({ p, yaw = 0, sh = 1.6 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <Box p={[0, sh - 0.15, 0]} s={[2.2, 0.3, 2.0]} c="#9a6a3c" kind="wood" />
    <Box p={[0, sh + 1.4, -0.95]} s={[2.2, 2.8, 0.25]} c="#9a6a3c" kind="wood" />
    {[[-0.95, -0.85], [0.95, -0.85], [-0.95, 0.85], [0.95, 0.85]].map(([x, z], i) => <Box key={i} p={[x, (sh - 0.3) / 2, z]} s={[0.25, sh - 0.3, 0.25]} c="#7a4e2c" />)}
  </group>
);
const chairCS = (p: V3, sh = 1.6): K.Box[] => [K.box([p[0], sh - 0.15, p[2]], [2.2, 0.3, 2.0], "seat"), K.box([p[0], sh + 1.4, p[2] - 0.95], [2.2, 2.8, 0.25], "chairBack")];
/** A pew: seat top at sh, length L along x, people face +z. */
const Pew: React.FC<{ p: V3; L: number; sh?: number }> = ({ p, L, sh = 1.6 }) => (
  <group position={p}>
    <Box p={[0, sh - 0.15, 0]} s={[L, 0.3, 2.0]} c="#6a3a1e" kind="woodDark" />
    <Box p={[0, sh + 1.0, -1.0]} s={[L, 2.0, 0.3]} c="#6a3a1e" kind="woodDark" />
    <Box p={[0, (sh - 0.3) / 2, 0]} s={[L, sh - 0.3, 1.6]} c="#5a301a" kind="woodDark" />
  </group>
);
const pewCS = (z: number, L: number, sh = 1.6): K.Box[] => [K.box([0, sh - 0.15, z], [L, 0.3, 2.0], "seat"), K.box([0, sh + 1.0, z - 1.0], [L, 2.0, 0.3], "pewBack"), K.box([0, (sh - 0.3) / 2, z], [L, sh - 0.3, 1.6], "pewBase")];
/** Door opening width: a blocky adult is 4 units across the arms, so doors are 5 wide (the old 3.2 made shoulders clip the frame). */
const DW = 5, DH = 7;
const DOOR_OPEN = 0.98;
/** World position of a point on the door leaf (hinge at x=-DW/2): `along` from the hinge, `out` off its front face. */
const doorPoint = (open: number, along: number, y: number, out = 0.13, floorY = 0.8): V3 => {
  const a = (-Math.PI / 2) * DOOR_OPEN * open;
  return [-DW / 2 + Math.cos(a) * along + Math.sin(a) * out, floorY + y, -0.4 - Math.sin(a) * along + Math.cos(a) * out];
};
const doorWallCS = (open: number, floorY = 0.8, w = 30): K.Box[] => {
  const side = (w - DW) / 2;
  const cs = [
    K.box([-(DW / 2 + side / 2), 6, -0.5], [side, 12, 1], "wall"), K.box([DW / 2 + side / 2, 6, -0.5], [side, 12, 1], "wall"),
    K.box([0, floorY + DH + (12 - DH - floorY) / 2, -0.5], [DW, 12 - DH - floorY, 1], "wall"),
    K.box([-DW / 2 - 0.15, floorY + DH / 2, 0.05], [0.3, DH, 0.25], "frame"), K.box([DW / 2 + 0.15, floorY + DH / 2, 0.05], [0.3, DH, 0.25], "frame"),
    K.box([0, floorY + DH / 2, -6], [DW + 2, DH, 0.2], "backWall"), K.box([0, floorY - 0.05, -3], [DW + 2, 0.1, 6], "floor"),
    K.box([0, floorY / 2, 1.5], [8, floorY, 3], "porch"), K.box([0, floorY * 0.25, 3.5], [6, floorY * 0.5, 1], "step"),
  ];
  // the door leaf as a box when it is open (or shut)
  if (open > 0.95) cs.push(K.boxMinMax([-DW / 2 - 0.2, floorY, -0.4 - DW], [-DW / 2 + 0.25, floorY + DH, -0.3], "door"));
  else if (open < 0.05) cs.push(K.box([0, floorY + DH / 2, -0.4], [DW, DH, 0.25], "door"));
  return cs;
};
/** A wall with a door opening (door hinged on its left, swinging inward by `open` 0..1), on steps. Wall faces +z at z=0. */
const DoorWall: React.FC<{ open: number; floorY?: number; w?: number; color?: string }> = ({ open, floorY = 0.8, w = 30, color = "#e8e6e0" }) => {
  const dw = DW, dh = DH, side = (w - dw) / 2;
  return <group>
    <Box p={[-(dw / 2 + side / 2), 6, -0.5]} s={[side, 12, 1]} c={color} kind="siding" />
    <Box p={[dw / 2 + side / 2, 6, -0.5]} s={[side, 12, 1]} c={color} kind="siding" />
    <Box p={[0, floorY + dh + (12 - dh - floorY) / 2, -0.5]} s={[dw, 12 - dh - floorY, 1]} c={color} kind="siding" />
    {/* frame */}
    <Box p={[-dw / 2 - 0.15, floorY + dh / 2, 0.05]} s={[0.3, dh, 0.25]} c="#f6f4ee" />
    <Box p={[dw / 2 + 0.15, floorY + dh / 2, 0.05]} s={[0.3, dh, 0.25]} c="#f6f4ee" />
    <Box p={[0, floorY + dh + 0.15, 0.05]} s={[dw + 0.6, 0.3, 0.25]} c="#f6f4ee" />
    {/* the dark room behind */}
    <Box p={[0, floorY + dh / 2, -6]} s={[dw + 2, dh, 0.2]} c="#2a2420" />
    <Box p={[0, floorY - 0.05, -3]} s={[dw + 2, 0.1, 6]} c="#5a3a22" kind="wood" />
    {/* the door, hinged at x=-dw/2 */}
    <group position={[-dw / 2, floorY, -0.4]} rotation={[0, (-Math.PI / 2) * DOOR_OPEN * open, 0]}>
      <Box p={[dw / 2, dh / 2, 0]} s={[dw, dh, 0.25]} c="#7a2a24" kind="woodDark" />
      <mesh position={[dw - 0.4, dh * 0.47, 0.22]}><sphereGeometry args={[0.15, 12, 8]} /><meshStandardMaterial color="#d8b04a" metalness={0.6} roughness={0.3} /></mesh>
    </group>
    {/* porch + two steps */}
    <Box p={[0, floorY / 2, 1.5]} s={[8, floorY, 3]} c="#cfcac0" kind="concrete" />
    <Box p={[0, floorY * 0.25, 3.5]} s={[6, floorY * 0.5, 1]} c="#cfcac0" kind="concrete" />
  </group>;
};
/** A chef's knife held as a straight continuation of the arm (hand frame +z runs down the arm): handle from the fist,
 *  blade beyond it. KNIFE_TIP is the tip in the ARM's frame, for the surface check. */
const KNIFE_LEN = 1.25;
const KNIFE_TIP: V3 = [0, -1.36 - KNIFE_LEN, 0.08];
const Knife: React.FC = () => (
  <group>
    <mesh position={[0, 0, 0.1]}><boxGeometry args={[0.24, 0.3, 0.5]} /><meshStandardMaterial color="#2a1a10" /></mesh>
    <mesh position={[0, -0.05, 0.35 + (KNIFE_LEN - 0.35) / 2]}><boxGeometry args={[0.06, 0.42, KNIFE_LEN - 0.35]} /><meshStandardMaterial color="#e4e8ec" metalness={0.6} roughness={0.25} /></mesh>
  </group>
);
const StopSign: React.FC = () => (
  <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.3]}>
    <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[0.07, 0.07, 2.6, 8]} /><meshStandardMaterial color="#cfcfcf" metalness={0.5} /></mesh>
    <mesh position={[0, 3.0, 0]} rotation={[Math.PI / 2, Math.PI / 8, 0]}><cylinderGeometry args={[0.9, 0.9, 0.08, 8]} /><meshStandardMaterial color="#d22a20" roughness={0.6} /></mesh>
  </group>
);

// ---- one character, with natural blinks; in debug mode every part inside a wall, prop or person renders red ----
const Debug = React.createContext(false);
type CP = { look: Look; a: { position: V3; yaw: number; walk?: any; pose?: Pose; seed?: number }; t: number; expr?: Expr; scale?: number; hold?: { R?: React.ReactNode; L?: React.ReactNode }; lift?: number; blinkSeed?: number; still?: boolean;
  /** the set's solid things and the other people in the shot (checked in debug mode) */
  cs?: K.Box[]; others?: K.CharState[]; allow?: string[] };
const C: React.FC<CP> = ({ look, a, t, expr = "smile", scale = 1, hold, lift = 0, blinkSeed = 0, still, cs = [], others = [], allow = ["seat"] }) => {
  const debug = React.useContext(Debug);
  const position: V3 = [a.position[0], a.position[1] + lift, a.position[2]];
  let hits: ReturnType<typeof K.clipParts> | undefined;
  if (debug) {
    const st: K.CharState = { position, yaw: a.yaw, scale, pose: a.pose, walk: a.walk };
    hits = K.clipParts(st, cs, others, 0.04 * scale, allow);
    if (lift === 0 && K.footGap(st, cs) < -0.12 * scale) { hits.legL = true; hits.legR = true; } // feet sunk into a floor or step
  }
  return <BlockChar look={look} scale={scale} position={position} yaw={a.yaw} walk={a.walk} hits={hits}
    pose={a.pose} seed={a.seed ?? blinkSeed} expr={expr} blink={expr === "stare" ? 0 : blinkCurve(t, blinkSeed)} hold={hold} still={still} />;
};
const st = (a: { position: V3; yaw: number; walk?: any; pose?: Pose }, scale = 1): K.CharState => ({ position: a.position, yaw: a.yaw, walk: a.walk, pose: a.pose, scale });

// ---- the cells: each returns its scene, camera and a caption for t in [0, 8) ----
type Cell = { name: string; time?: "day" | "interior"; sky?: boolean; run: (t: number) => { scene: React.ReactNode; cam: CamS; label: string } };
const cam = (pos: V3, target: V3, fov = 40): CamS => ({ pos, target, fov });

const SQUARE: V3[] = [[-5, 0, 5], [5, 0, 5], [5, 0, -5], [-5, 0, -5], [-5, 0, 5]];
const CELLS: Cell[] = [
  { name: "WALK + CORNERS", run: (t) => {
    const a = M.walkPath(SQUARE, t, 0.4, { gait: "walk" });
    return { label: a.moving ? "stiff toy walk, feet planted" : "stops, idles", cam: cam([0, 22, 30], [0, 0.5, -1], 40),
      scene: <><Sidewalk from={[-5, 0, 7.5]} to={[-5, 0, -7.5]} /><Sidewalk from={[5, 0, 7.5]} to={[5, 0, -7.5]} /><Sidewalk from={[-7, 0, 5]} to={[7, 0, 5]} /><Sidewalk from={[-7, 0, -5]} to={[7, 0, -5]} />
        <C look={ME} t={t} a={M.act(a, !a.moving && M.idle(t, 1))} expr={a.done ? "happy" : "smile"} /></> };
  } },
  { name: "RUN", run: (t) => {
    const back = t > 3.6;
    const a = back ? M.walkPath([[16, 0, 0], [-16, 0, 0]], t, 3.6, { gait: "run", yaw0: Math.PI / 2, turnIn: 0.3 })
      : M.walkPath([[-16, 0, 0], [16, 0, 0]], t, 0.4, { gait: "run" });
    const x = Math.max(-11, Math.min(11, a.position[0]));
    return { label: "run: lean, flight, pumping arms", cam: cam([x + 5, 5, 19], [x, 2.6, 0], 40),
      scene: <><Sidewalk from={[-20, 0, 0]} to={[20, 0, 0]} w={5} /><C look={TOWNSFOLK[3]} t={t} a={M.act(a)} expr={a.moving ? "grin" : "smile"} blinkSeed={2} /></> };
  } },
  { name: "IDLE / LOOK-AROUND / SNAP", run: (t) => {
    const camP: V3 = [3.5, 5.4, 13];
    const snapYaw = M.dAng(-0.7, M.yawTo([0, 0, 0], camP));
    const pose = M.mix(M.idle(t, 3, t < 1.4 ? 1 : 0.3), M.lookAround(t, 1.4, 4.2, 1), M.headSnap(t, 5.0, snapYaw, 0.05));
    const expr: Expr = t < 1.4 ? "smile" : t < 5.0 ? "worried" : "stare";
    return { label: t < 1.4 ? "idle sway" : t < 4.3 ? "nervous look-around" : t < 5 ? "..." : "head SNAPS to camera", cam: cam(camP, [0, 3.8, 0], 34),
      scene: <><Sidewalk from={[0, 0, 6]} to={[0, 0, -12]} w={5} /><C look={TOWNSFOLK[7]} t={t} a={{ position: [0, 0, 0], yaw: -0.7, pose }} expr={expr} blinkSeed={3} /></> };
  } },
  { name: "SIT / STAND", time: "interior", sky: false, run: (t) => {
    const stand: V3 = [0, 0, 1.75], seat: V3 = [0, 1.6, 0];
    const cs = [...chairCS([0, 0, 0]), K.box([0, 6, -4], [30, 12, 0.5], "wall")];
    let a: M.Act, label = "walks to the chair";
    const w = M.walkPath([[-9, 0, 6], [-3, 0, 4], stand], t, 0.2, { yaw1: 0, turnOut: 0.4 });
    if (!w.done || t < 2.9) a = M.act(w, w.done && M.idle(t, 4, 0.5));
    else if (t < 6.4) { a = M.sit(stand, seat, 0, t, 2.9, 0.6); a = M.act(a, M.seatedIdle(t, 4, seg01(t, 3.5, 3.7))); label = "hops onto the seat, seated idle"; }
    else { a = M.sit(stand, seat, 0, t, 6.4, 0.6, 1, -1); label = "stands up"; }
    return { label, cam: cam([11, 6.5, 10], [-1, 2.4, 1], 42),
      scene: <><Ground kind="wood" /><Chair p={[0, 0, 0]} /><Box p={[0, 6, -4]} s={[30, 12, 0.5]} c="#efe2c4" kind="wallpaper" />
        <C look={TOWNSFOLK[6]} t={t} a={a} blinkSeed={4} cs={cs} /></> };
  } },
  { name: "JUMP / CHEER", run: (t) => {
    const j = [0.6, 1.9, 6.1].map((k) => M.jump(t, k, 2.2));
    const lift = Math.max(...j.map((x) => x.lift));
    const pose = M.mix(M.idle(t, 5, 0.5), ...j.map((x) => x.pose), M.cheer(t, 3.3, 5.3));
    const expr: Expr = t > 3.3 && t < 5.3 ? "laugh" : lift > 0 ? "grin" : "smile";
    return { label: t > 3.2 && t < 5.4 ? "cheer" : "jump", cam: cam([2, 4.5, 15], [0, 3.6, 0], 40),
      scene: <><C look={TOWNSFOLK[5]} t={t} a={{ position: [0, 0, 0], yaw: 0.15, pose }} lift={lift} expr={expr} blinkSeed={5} /></> };
  } },
  { name: "WAVE / POINT / SHRUG / ARMS", run: (t) => {
    const pose = M.mix(M.idle(t, 6, 0.6), M.wave(t, 0.2, 1.9), M.point(t, 2.1, 3.1, 0.25), M.shrug(t, 3.3, 4.3), M.crossArms(t, 4.5, 6.0), M.hips(t, 6.2, 7.8));
    const label = t < 2 ? "wave" : t < 3.2 ? "point" : t < 4.4 ? "shrug" : t < 6.1 ? "arms crossed" : "hands on hips";
    const expr: Expr = t < 2 ? "happy" : t < 3.2 ? "surprised" : t < 4.4 ? "worried" : t < 6.1 ? "blank" : "smirk";
    return { label, cam: cam([2.5, 5, 14], [0, 3.4, 0], 38), scene: <C look={TOWNSFOLK[4]} t={t} a={{ position: [0, 0, 0], yaw: 0.2, pose }} expr={expr} blinkSeed={6} /> };
  } },
  { name: "CHOP / STOP / TALK", time: "interior", sky: false, run: (t) => {
    const words = [3.9, 4.25, 4.55, 4.9, 5.3, 5.6];
    const look = M.headSnap(t, 3.4, 0.55, -0.15, 6.2);
    const raw = M.mix(M.chop(t, 0.3, 3.1), M.chop(t, 6.3, 9), M.talkHands(t, words), look, M.idle(t, 7, 0.4));
    const cook: K.CharState = { position: [-0.1, 0, 1.15], yaw: 0, pose: raw };
    // the knife tip stops ON the board (never through it); the hand never goes into the counter
    const BOARD_TOP = 3.12;
    const armR = K.armAboveSurface(cook, -1, KNIFE_TIP, BOARD_TOP + 0.02);
    const armR2 = K.armAboveSurface({ ...cook, pose: { ...raw, armR } }, -1, [0, -1.5, 0.5], 3.0 + 0.05);
    const pose: Pose = { ...raw, armR: armR2 };
    const cs = [K.box([0, 1.4, 3.0], [7, 2.8, 2.2], "counter"), K.box([0, 2.9, 3.0], [7.4, 0.2, 2.4], "counterTop"), K.box([-1.3, 3.06, 2.6], [2.4, 0.12, 1.4], "board"), K.box([0, 6, -3.5], [30, 12, 0.5], "wall")];
    const expr: Expr = t < 3.1 ? "smile" : t < 3.7 ? "blank" : t < 6.2 ? M.talk(t, words, "smile") : "smile";
    return { label: t < 3.1 ? "chopping" : t < 3.8 ? "stops mid-chop" : t < 6.2 ? "turns, talks" : "back to chopping", cam: cam([12, 6, 7], [0, 3.0, 1.8], 38),
      scene: <><Ground kind="wood" /><Box p={[0, 6, -3.5]} s={[30, 12, 0.5]} c="#f2ecd8" kind="tile" />
        <Box p={[0, 1.4, 3.0]} s={[7, 2.8, 2.2]} c="#f4f1ea" /><Box p={[0, 2.9, 3.0]} s={[7.4, 0.2, 2.4]} c="#b8b4ac" kind="concrete" />
        <Box p={[-1.3, 3.06, 2.6]} s={[2.4, 0.12, 1.4]} c="#c08a50" kind="wood" />
        {[0, 1, 2].map((i) => <mesh key={i} position={[-1.9 + i * 0.4, 3.22, 2.6]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.13, 0.08, 0.9, 8]} /><meshStandardMaterial color="#f08a24" /></mesh>)}
        <C look={COOK} t={t} a={{ position: cook.position, yaw: 0, pose }} expr={expr} hold={{ R: <Knife /> }} blinkSeed={7} cs={cs} /></> };
  } },
  { name: "THROUGH A DOOR / UP STEPS", run: (t) => {
    const csShut = doorWallCS(0), g = K.groundFn(csShut);
    const S: V3 = [1.25, 0.8, 1.05]; // in front of the door, by the handle (x = +2.1)
    const p1: V3[] = [[-9, 0, 9], [0, 0, 8], [0.8, 0, 4.6], [1.25, 0, 2.2], S];
    const w1 = M.walkPath(p1, t, 0.2, { gait: "walk", ground: g, yaw1: Math.PI, turnOut: 0.25 });
    const tArr = 0.2 + M.walkDuration(p1) + 0.25, tPush = tArr + 0.05;
    const open = M.ease(M.seg(t, tPush + 0.25, tPush + 1.0));
    const tIn = tPush + 0.85;
    const w2 = M.walkPath([S, [0.2, 0.8, -1.2], [0, 0.8, -4.2]], t, tIn, { ground: K.groundFn(doorWallCS(1)) });
    const inside = t > tIn;
    let a: M.Act = inside ? w2 : M.act(w1);
    let label = t < tArr ? "walks up the path and steps" : !inside ? "hand on the handle, pushes" : "walks in";
    if (!inside && t > tPush - 0.2) { // the right hand follows the handle as the door swings, then lets go
      const handle = doorPoint(open, DW - 0.45, 3.3);
      const r = K.reachArm(st(a), -1, handle);
      const k = M.env(t, tPush - 0.2, tIn, 0.2, 0.15) * (r.short < 0.15 ? 1 : M.clamp01(1 - (r.short - 0.15) * 4));
      a = { ...a, pose: { ...a.pose, armR: (a.pose?.armR ?? 0) * (1 - k) + (r.pose.armR ?? 0) * k, armROut: (a.pose?.armROut ?? 0) * (1 - k) + (r.pose.armROut ?? 0) * k, lean: (a.pose?.lean ?? 0) + 0.06 * k } };
    }
    const cs = open > 0.95 ? doorWallCS(1) : open < 0.05 ? csShut : doorWallCS(open).filter((b) => b.name !== "door");
    return { label, cam: cam([9, 7.5, 18], [0, 3.6, 2], 40),
      scene: <><Sidewalk from={[-10, 0, 9]} to={[0, 0, 8]} w={3} /><Sidewalk from={[0, 0, 7.5]} to={[0.8, 0, 4]} w={3} /><DoorWall open={open} />
        <C look={TOWNSFOLK[2]} t={t} a={a} blinkSeed={8} cs={cs} /></> };
  } },
  { name: "WHISPER / LAUGH", run: (t) => {
    const g: V3 = [-1.6, 0, 0], k: V3 = [1.6, 0, 0.4];
    const words = [1.2, 1.5, 1.8, 2.15, 2.5];
    const gp = M.mix(M.idle(t, 9, 0.5), M.leanIn(t, 0.6, 3.0, 0.15), M.laugh(t, 3.3, 5.0), M.raise(t, 5.6, 7.8, -1));
    const kp = M.mix(M.idle(t, 10, 0.5), M.recoil(t, 2.3, 3.3), M.headSnap(t, 2.25, -0.45, 0, 3.2), M.cower(t, 5.2, 6.4), M.shrug(t, 6.6, 7.7));
    const ge: Expr = t < 0.6 ? "smile" : t < 3.0 ? M.talk(t, words, "smirk") : t < 5.0 ? "laugh" : "smile";
    const ke: Expr = t < 2.25 ? "smile" : t < 3.3 ? "scared" : t < 5.2 ? "worried" : t < 6.5 ? "scared" : "blank";
    return { label: t < 3.0 ? "leans in, whispers" : t < 5.0 ? "laughs (body rocks)" : "sign up / kid cowers, shrugs", cam: cam([1, 5.2, 13.5], [0, 3.6, 0], 40),
      scene: <><Sidewalk from={[-8, 0, 0]} to={[8, 0, 0]} w={6} />
        <C look={GUARD} t={t} a={{ position: g, yaw: 1.05, pose: gp }} expr={ge} hold={t > 5.45 ? { L: <StopSign /> } : undefined} blinkSeed={9} others={[st({ position: k, yaw: -1.0, pose: kp }, 0.82)]} />
        <C look={ME} scale={0.82} t={t} a={{ position: k, yaw: -1.0, pose: kp }} expr={ke} blinkSeed={10} others={[st({ position: g, yaw: 1.05, pose: gp })]} /></> };
  } },
  { name: "CROWD TURNS (PEWS)", time: "interior", sky: false, run: (t) => {
    const camP: V3 = [0, 13, -27];
    const rows = [0, 1, 2, 3], seats = [-4.5, -1.5, 1.5, 4.5];
    const people = rows.flatMap((r) => seats.map((x, i) => ({ r, i, p: [x + (r % 2) * 0.4, 0, -r * 4.2] as V3 })));
    const cs = rows.flatMap((r) => pewCS(-r * 4.2, 11));
    return { label: t < 2.6 ? "seated, facing the front" : "the whole room turns to stare", cam: cam(camP, [0, 2.6, -4], 40),
      scene: <><Ground kind="wood" /><Box p={[0, 0.02, -6]} s={[2.2, 0.04, 30]} c="#a8241e" kind="carpet" />
        {rows.map((r) => <Pew key={r} p={[0, 0, -r * 4.2]} L={11} />)}
        {people.map(({ r, i, p }, n) => {
          const seat: V3 = [p[0], 1.6, p[2]];
          const base = M.sit(seat, seat, 0, t, -5, 0.1); // already seated, facing +z (the front is +z, the camera is behind... at -z)
          const ct = M.crowdTurn(n, [p[0], 0, p[2]], 0, camP, t, 2.6, 0.9, 0, 2);
          const turn = ct.yaw - 0; // a seated body can't spin: the turn goes into the twist and the head
          const tw = Math.max(-0.9, Math.min(0.9, turn * 0.45));
          const pose = M.mix(base.pose, M.seatedIdle(t, n, 0.5), { twist: tw, head: [Math.max(-1.4, Math.min(1.4, turn - tw + (ct.pose.head?.[0] ?? 0))), -0.08] });
          const turned = t > ct.t + 0.05;
          return <C key={n} look={TOWNSFOLK[(n * 5 + r) % TOWNSFOLK.length]} t={t} a={{ ...base, pose }} expr={turned ? "stare" : "smile"} blinkSeed={n} still={turned} cs={cs} />;
        })}</> };
  } },
  { name: "CROWD MILLING (DRONE)", run: (t) => {
    const sc = (i: number) => (i % 5 === 0 ? 0.8 : 1);
    const acts = Array.from({ length: 16 }, (_, i) => M.wander(i + 1, [0, 0, -1], 10, t, { scale: sc(i) }));
    const pos = K.separate(acts.map((a) => a.position), 1.35);
    const placed = acts.map((a, i) => ({ ...a, position: pos[i] }));
    return { label: "townsfolk mill about; nobody walks through anybody", cam: cam([0, 30, 15], [0, 0, -1], 40),
      scene: <><Sidewalk from={[0, 0, 12]} to={[0, 0, -14]} w={3.5} />
        {placed.map((a, i) => <C key={i} look={TOWNSFOLK[i % TOWNSFOLK.length]} t={t} a={a} blinkSeed={i} scale={sc(i)}
          others={placed.filter((_, j) => j !== i).map((b, j) => st(b, sc(j >= i ? j + 1 : j)))} />)}</> };
  } },
  { name: "FILING IN", run: (t) => {
    const path: V3[] = [[-12, 0, 14], [-3, 0, 9], [0, 0, 5], [0, 0, 2.6], [0, 0, 0], [0, 0, -4.6]];
    const cs = doorWallCS(1), g = K.groundFn(cs);
    return { label: "people file up the steps and in", cam: cam([10, 7, 19], [-1, 3, 3], 42),
      scene: <><Sidewalk from={[-14, 0, 15]} to={[-3, 0, 9]} w={3} /><Sidewalk from={[-3, 0, 9]} to={[0, 0, 4]} w={3} /><DoorWall open={1} color="#f2f0ea" />
        {Array.from({ length: 9 }, (_, i) => {
          const a = M.fileIn(i, path, t, -0.6, 0.75, { gait: "walk", scale: i % 3 === 2 ? 0.82 : 1, ground: g });
          if (a.done) return null;
          return <C key={i} look={TOWNSFOLK[(i * 3 + 1) % TOWNSFOLK.length]} t={t} a={M.act(a, !a.moving && M.idle(t, i, 0.5))} scale={i % 3 === 2 ? 0.82 : 1} blinkSeed={i + 20} cs={cs} />;
        })}</> };
  } },
];
function seg01(t: number, a: number, b: number) { return M.seg(t, a, b); }

const CellView: React.FC<{ cell: Cell; t: number; idx: number; solo?: boolean; debug?: boolean }> = ({ cell, t, idx, solo, debug }) => {
  const r = cell.run(t);
  const time = cell.time ?? "day";
  const focus = r.cam.target;
  return (
    <div style={{ position: "absolute", left: solo ? 0 : (idx % 3) * CW, top: solo ? 0 : Math.floor(idx / 3) * CH, width: CW, height: CH, overflow: "hidden", background: "#cfe0ee" }}>
      <ThreeCanvas width={CW} height={CH} shadows gl={{ antialias: true, preserveDrawingBuffer: true } as any}
        onCreated={({ gl }) => { gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
        <Cam c={r.cam} />
        <BlockLights time={time} focus={[focus[0], 0, focus[2]]} shadowSpan={22} />
        {cell.sky !== false && <Sky time="day" />}
        {cell.sky !== false && <Ground />}
        <Debug.Provider value={!!debug}>{r.scene}</Debug.Provider>
      </ThreeCanvas>
      <div style={{ position: "absolute", left: 8, top: 6, color: "#fff", font: "800 19px Montserrat, sans-serif", textShadow: "0 0 4px #000, 0 0 2px #000" }}>{idx + 1}. {cell.name}</div>
      <div style={{ position: "absolute", left: 8, bottom: 8, right: 8, color: "#ffe066", font: "700 16px Montserrat, sans-serif", textShadow: "0 0 4px #000, 0 0 2px #000" }}>{r.label}</div>
      <div style={{ position: "absolute", inset: 0, border: "2px solid #111" }} />
    </div>
  );
};

export const MotionSheet: React.FC<{ only?: number }> = ({ only }) => {
  const t = useCurrentFrame() / 30;
  return (
    <AbsoluteFill style={{ background: "#111" }}>
      {CELLS.map((c, i) => (only === undefined || only === i ? <CellView key={i} cell={c} t={t} idx={i} /> : null))}
    </AbsoluteFill>
  );
};

/** One cell alone (360x480), for rendering the sheet cell by cell and tiling with ffmpeg (12 live canvases in one page time out). */
export const MotionCell: React.FC<{ idx: number; debug?: boolean }> = ({ idx, debug }) => {
  const t = useCurrentFrame() / 30;
  return <AbsoluteFill style={{ background: "#111" }}><CellView cell={CELLS[idx]} t={t} idx={idx} solo debug={debug} /></AbsoluteFill>;
};
export const MOTION_CELLS = CELLS.length;

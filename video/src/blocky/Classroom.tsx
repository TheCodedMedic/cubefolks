// CLASSROOM: the shared school classroom (Shorts 07 and 10; owner: lead 10). RIG UNITS (adult BlockChar scale 1 is ~5.6 tall,
// kids use scale 0.82), floor y = 0, like the TOWN sets.
//
// Layout (looking from the back of the room toward the board):
//   front wall z = -18 (faces +z): the green board with chalk doodles, a clock above it, the door on the right (x 13..19);
//   left wall x = -22: three tall windows (painted daytime view, self-lit); right wall x = +22: a LOW SHELF (top y 2.4, for
//   the hamster cage) with floor space in front of it (backpack row); back wall z = +18: cubbies, posters, a sink counter
//   (right corner). Desks: 3 columns x 4 rows, the kids face the board (yaw = Math.PI). The teacher's desk is front-left.
//
// Kids' desks have NO back legs (a front panel and a top only), so a kid sitting down slides in from the aisle cleanly
// (Motion.sit from DESK(i).stand to DESK(i).seat); the legs go out straight under the desk top (top underside 2.7).
// Colliders: CLASSROOM_CS (everything solid; chair seats are named "seat" so the default `allow` lets people sit on them)
// plus doorCS(open) for the door leaf. Spots: TEACHER_SPOT, DESK(i), SHELF, SHELF_FRONT, DOOR, SINK, BOARD, CLOCK, WINDOW(i).
import React from "react";
import * as THREE from "three";
import { mat, rep, TexKind } from "./Textures";
import { box, boxMinMax, type Box } from "./Collide";

export type V3 = [number, number, number];
type M = THREE.MeshStandardMaterialParameters;

// ───────────────────────────────────────────── dimensions ─────────────────────────────────────────────
export const ROOM = { x0: -22, x1: 22, z0: -18, z1: 18, h: 13 } as const;
const T = 0.6; // wall thickness (walls sit OUTSIDE the room box)
const DESK_TOP = 2.85, DESK_W = 3.2, DESK_D = 2.2; // kids' desk
const SEAT_TOP = 1.32, SEAT_W = 2.0, SEAT_D = 1.8, SEAT_BACK = 2.3; // kids' chair (seat 2.3 behind the desk centre)
const COLS = [-11, -4, 3], ROWS = [-6, 0, 6, 12];
const SHELF_X0 = 19.4, SHELF_Z0 = -3, SHELF_Z1 = 11, SHELF_H = 2.4;
const DOOR_X0 = 13.2, DOOR_X1 = 18.8, DOOR_H = 8.2; // in the front wall (5.6 wide)
const BOARD = { x0: -9, x1: 9, y0: 3.6, y1: 9.6 };
const TDESK = { c: [-13, 0, -12.6] as V3, s: [7, 3.1, 3] as V3 };
const SINK_C = { x0: 12, x1: 20, z0: 15.6, top: 3.1 };

// ───────────────────────────────────────────── exported spots ─────────────────────────────────────────────
export type DeskSpot = { desk: V3; seat: V3; stand: V3; yaw: number; bag: V3 };
/** Desk i (0..11): row = floor(i / 3) from the front, column = i % 3 from the left (as seen from the back).
 *  desk: the desk top centre (y = top); seat: the chair seat's top centre (pass to Motion.sit); stand: in the aisle to the
 *  right of the chair (+x), where a kid stands before sitting (Motion.sit(stand, seat, yaw...) slides in sideways);
 *  yaw: facing the board; bag: a floor spot beside the chair for a backpack. */
export const DESK = (i: number): DeskSpot => {
  const x = COLS[i % 3], z = ROWS[Math.floor(i / 3) % 4];
  return { desk: [x, DESK_TOP, z], seat: [x, SEAT_TOP, z + SEAT_BACK], stand: [x + 2.9, 0, z + SEAT_BACK], yaw: Math.PI, bag: [x - 2.0, 0, z + SEAT_BACK + 0.3] };
};
export const DESK_COUNT = 12;
/** Where the teacher stands at the board (feet), facing the class (yaw 0). */
export const TEACHER_SPOT: V3 = [-3, 0, -14.2];
/** The teacher's desk: top centre. */
export const TEACHER_DESK: V3 = [TDESK.c[0], TDESK.s[1], TDESK.c[2]];
/** The low shelf by the right wall: the centre of its top (y = 2.4). A cage goes here. Its front edge is x = 19.4. */
export const SHELF: V3 = [(SHELF_X0 + ROOM.x1) / 2, SHELF_H, (SHELF_Z0 + SHELF_Z1) / 2];
/** The shelf's footprint (x0, x1, z0, z1) for placing several things on it. */
export const SHELF_BOX = { x0: SHELF_X0, x1: ROOM.x1, z0: SHELF_Z0, z1: SHELF_Z1, top: SHELF_H } as const;
/** Standing in front of the shelf (feet), facing it (yaw = Math.PI / 2). Leaves ~1.2 of floor for a backpack row at x 17.6..19.2. */
export const SHELF_FRONT: V3 = [15.6, 0, SHELF[2]];
/** The doorway (feet, in the opening, on the wall plane); inside is +z. DOOR_OUT is 5 units out in the corridor. */
export const DOOR: V3 = [(DOOR_X0 + DOOR_X1) / 2, 0, ROOM.z0];
export const DOOR_IN: V3 = [(DOOR_X0 + DOOR_X1) / 2, 0, ROOM.z0 + 4];
export const DOOR_OUT: V3 = [(DOOR_X0 + DOOR_X1) / 2, 0, ROOM.z0 - 5];
/** Standing at the sink (feet), facing the back wall (yaw 0). The basin top is y 3.1. */
export const SINK: V3 = [16, 0, 14.2];
export const SINK_BASIN: V3 = [16, SINK_C.top, 16.8];
/** The board centre (on the wall face) and the clock centre. */
export const BOARD_CENTER: V3 = [(BOARD.x0 + BOARD.x1) / 2, (BOARD.y0 + BOARD.y1) / 2, ROOM.z0 + 0.15];
export const CLOCK: V3 = [0, 11.3, ROOM.z0 + 0.2];
/** Window i (0..2) centre on the left wall's inner face. */
export const WINDOW = (i: number): V3 => [ROOM.x0 + 0.05, 7, [-10, 0, 10][i]];

// ───────────────────────────────────────────── colliders ─────────────────────────────────────────────
const deskCS = (i: number): Box[] => {
  const { desk: [x, , z] } = DESK(i);
  return [
    box([x, DESK_TOP - 0.1, z], [DESK_W, 0.2, DESK_D], "desk"),
    box([x, DESK_TOP - 0.45, z - 0.2], [DESK_W - 0.3, 0.5, DESK_D - 0.6], "deskBox"), // the book box under the top (high: legs pass under it)
    box([x, (DESK_TOP - 0.2) / 2, z - DESK_D / 2 + 0.15], [DESK_W, DESK_TOP - 0.2, 0.3], "deskFront"),
    box([x, SEAT_TOP - 0.12, z + SEAT_BACK], [SEAT_W, 0.24, SEAT_D], "seat"),
    box([x, SEAT_TOP + 0.95, z + SEAT_BACK + SEAT_D / 2 - 0.1], [SEAT_W, 1.5, 0.2], "chairBack"),
    box([x, (SEAT_TOP - 0.24) / 2, z + SEAT_BACK + SEAT_D / 2 - 0.2], [SEAT_W, SEAT_TOP - 0.24, 0.2], "chairLegs"),
  ];
};
const wallsCS = (): Box[] => [
  boxMinMax([ROOM.x0 - T, 0, ROOM.z0 - T], [DOOR_X0, ROOM.h, ROOM.z0], "wallFront"),
  boxMinMax([DOOR_X1, 0, ROOM.z0 - T], [ROOM.x1 + T, ROOM.h, ROOM.z0], "wallFront"),
  boxMinMax([DOOR_X0, DOOR_H, ROOM.z0 - T], [DOOR_X1, ROOM.h, ROOM.z0], "wallFront"),
  boxMinMax([ROOM.x0 - T, 0, ROOM.z1], [ROOM.x1 + T, ROOM.h, ROOM.z1 + T], "wallBack"),
  boxMinMax([ROOM.x0 - T, 0, ROOM.z0], [ROOM.x0, ROOM.h, ROOM.z1], "wallLeft"),
  boxMinMax([ROOM.x1, 0, ROOM.z0], [ROOM.x1 + T, ROOM.h, ROOM.z1], "wallRight"),
  // corridor walls beyond the door
  boxMinMax([DOOR_X0 - 4, 0, ROOM.z0 - 12], [DOOR_X0 - 3.4, ROOM.h, ROOM.z0 - T], "corridor"),
  boxMinMax([DOOR_X1 + 3.4, 0, ROOM.z0 - 12], [DOOR_X1 + 4, ROOM.h, ROOM.z0 - T], "corridor"),
  boxMinMax([DOOR_X0 - 4, 0, ROOM.z0 - 12.6], [DOOR_X1 + 4, ROOM.h, ROOM.z0 - 12], "corridor"),
];
/** Everything solid in the classroom (door leaf excluded: add doorCS(open)). Chair seats are named "seat". */
export const CLASSROOM_CS: Box[] = [
  ...wallsCS(),
  ...Array.from({ length: DESK_COUNT }, (_, i) => deskCS(i)).flat(),
  box(TDESK.c.map((v, k) => (k === 1 ? TDESK.s[1] / 2 : v)) as V3, TDESK.s, "teacherDesk"),
  box([TDESK.c[0] + 0.5, 1.6, TDESK.c[2] - 3.0], [2.2, 3.2, 2.0], "teacherChair"),
  boxMinMax([SHELF_X0, 0, SHELF_Z0], [ROOM.x1, SHELF_H, SHELF_Z1], "shelf"),
  boxMinMax([SINK_C.x0, 0, SINK_C.z0], [SINK_C.x1, SINK_C.top, ROOM.z1], "sinkCounter"),
  boxMinMax([-20, 0, 15.8], [6, 4.2, ROOM.z1], "cubbies"),
  boxMinMax([ROOM.x0, 0, -16.5], [ROOM.x0 + 1.4, 3.2, -13], "bookcase"),
];
/** The door leaf (hinged at the opening's right edge x = 18.8, swinging into the room, toward -x) at open 0..1. */
export const doorCS = (open: number): Box[] => {
  const a = (Math.PI / 2) * Math.max(0, Math.min(1, open)), w = DOOR_X1 - DOOR_X0;
  const ex = DOOR_X1 - Math.cos(a) * w, ez = ROOM.z0 + Math.sin(a) * w;
  return [boxMinMax([Math.min(ex, DOOR_X1) - 0.15, 0, Math.min(ROOM.z0, ez) - 0.15], [Math.max(ex, DOOR_X1) + 0.15, DOOR_H, Math.max(ROOM.z0, ez) + 0.15], "door")];
};
// (A swung door is approximated by its bounding box: keep walk paths out of the swing area while it moves.)

// ───────────────────────────────────────────── textures ─────────────────────────────────────────────
const canv = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const cache = new Map<string, THREE.Texture>();
const cached = (k: string, make: () => THREE.Texture) => { if (!cache.has(k)) cache.set(k, make()); return cache.get(k)!; };
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Green chalkboard with chalk doodles (a sun, a house, sums, a little hamster, a star, `text` written big). */
const boardTex = (text: string) => cached(`board:${text}`, () => canv(1024, 340, (g) => {
  g.fillStyle = "#2f5a43"; g.fillRect(0, 0, 1024, 340);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(255,255,255,${rnd(i) * 0.035})`; g.fillRect(rnd(i * 3) * 1024, rnd(i * 7) * 340, 3 + rnd(i * 11) * 30, 2); } // smudges
  const chalk = (c = "rgba(245,245,235,0.9)", w = 4) => { g.strokeStyle = c; g.fillStyle = c; g.lineWidth = w; g.lineCap = "round"; g.lineJoin = "round"; };
  // sun
  chalk("rgba(250,230,120,0.9)"); g.beginPath(); g.arc(90, 80, 34, 0, Math.PI * 2); g.stroke();
  for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; g.beginPath(); g.moveTo(90 + Math.cos(a) * 44, 80 + Math.sin(a) * 44); g.lineTo(90 + Math.cos(a) * 60, 80 + Math.sin(a) * 60); g.stroke(); }
  // house
  chalk(); g.strokeRect(60, 190, 90, 80); g.beginPath(); g.moveTo(50, 192); g.lineTo(105, 140); g.lineTo(160, 192); g.stroke(); g.strokeRect(92, 228, 26, 42);
  // sums
  g.font = "bold 44px 'Comic Sans MS', 'Chalkboard', sans-serif"; chalk("rgba(245,245,235,0.92)");
  g.fillText("3 + 4 = 7", 230, 100); g.fillText("12 - 5 = 7", 230, 170);
  // the big text
  if (text) { g.font = "bold 70px 'Comic Sans MS', 'Chalkboard', sans-serif"; chalk("rgba(255,255,250,0.95)"); g.textAlign = "center"; g.fillText(text, 640, 120); g.textAlign = "left"; }
  // a little hamster
  chalk("rgba(250,200,140,0.9)"); g.beginPath(); g.ellipse(860, 250, 50, 34, 0, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(828, 222, 10, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(880, 220, 10, 0, Math.PI * 2); g.stroke();
  g.fillRect(842, 244, 6, 6); g.fillRect(868, 244, 6, 6);
  // a star and a smiley
  chalk("rgba(150,210,250,0.9)"); g.beginPath();
  for (let k = 0; k < 11; k++) { const a = -Math.PI / 2 + (k / 10) * Math.PI * 2, r = k % 2 ? 14 : 34; g.lineTo(560 + Math.cos(a) * r, 250 + Math.sin(a) * r); } g.stroke();
  chalk("rgba(250,170,200,0.9)"); g.beginPath(); g.arc(690, 250, 32, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(690, 254, 18, 0.2, Math.PI - 0.2); g.stroke();
  g.fillRect(678, 238, 6, 6); g.fillRect(696, 238, 6, 6);
  chalk("rgba(245,245,235,0.6)", 3); g.beginPath(); g.moveTo(230, 300); g.bezierCurveTo(300, 270, 360, 320, 430, 290); g.stroke();
}));
/** The clock face (numbers as ticks). */
const clockTex = () => cached("clock", () => canv(256, 256, (g) => {
  g.fillStyle = "#fbfaf4"; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#1c1c20";
  for (let k = 0; k < 60; k++) { const a = (k / 60) * Math.PI * 2, big = k % 5 === 0; g.save(); g.translate(128, 128); g.rotate(a); g.fillRect(-(big ? 4 : 1.5), -116, big ? 8 : 3, big ? 20 : 9); g.restore(); }
  g.font = "bold 30px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  [12, 3, 6, 9].forEach((n, k) => { const a = (k / 4) * Math.PI * 2; g.fillText(String(n), 128 + Math.sin(a) * 78, 128 - Math.cos(a) * 78); });
}));
/** The daytime view out of the classroom windows: sky, clouds, a tree, the playground fence, grass. */
const viewTex = () => cached("schoolview", () => canv(256, 512, (g) => {
  const sky = g.createLinearGradient(0, 0, 0, 360); sky.addColorStop(0, "#5aa2ea"); sky.addColorStop(1, "#d3e9fb"); g.fillStyle = sky; g.fillRect(0, 0, 256, 512);
  g.fillStyle = "rgba(255,255,255,0.9)"; [[60, 80, 50], [190, 140, 40]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = "#6a4a2c"; g.fillRect(150, 250, 18, 130);
  g.fillStyle = "#4f8f3e"; g.beginPath(); g.arc(160, 230, 62, 0, Math.PI * 2); g.fill(); g.fillStyle = "#5fa24a"; g.beginPath(); g.arc(140, 210, 40, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#7fb35a"; g.fillRect(0, 370, 256, 142);
  g.strokeStyle = "#9aa0a6"; g.lineWidth = 2; for (let x = 0; x < 256; x += 14) { g.beginPath(); g.moveTo(x, 330); g.lineTo(x + 14, 380); g.moveTo(x + 14, 330); g.lineTo(x, 380); g.stroke(); }
  g.fillStyle = "#8a9096"; g.fillRect(0, 328, 256, 4);
}));
/** A kids' poster (alphabet strip, a planet, a hand-drawn rainbow). */
const posterTex = (k: number) => cached(`poster${k}`, () => canv(192, 256, (g) => {
  const bg = ["#fff4c8", "#d8ecff", "#ffe0e6", "#e2f6dc"][k % 4]; g.fillStyle = bg; g.fillRect(0, 0, 192, 256);
  if (k % 4 === 0) { g.font = "bold 46px sans-serif"; g.textAlign = "center"; ["#d33", "#e90", "#3a3", "#36c"].forEach((c, i) => { g.fillStyle = c; g.fillText("ABCD"[i], 40 + (i % 2) * 110, 80 + Math.floor(i / 2) * 110); }); }
  else if (k % 4 === 1) { g.fillStyle = "#e9a040"; g.beginPath(); g.arc(96, 120, 52, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#a05a20"; g.lineWidth = 8; g.beginPath(); g.ellipse(96, 120, 86, 20, -0.3, 0, Math.PI * 2); g.stroke(); }
  else if (k % 4 === 2) { ["#e33", "#f92", "#fd3", "#4b4", "#39e", "#84d"].forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 12; g.beginPath(); g.arc(96, 200, 90 - i * 12, Math.PI, 0); g.stroke(); }); }
  else { g.fillStyle = "#3a7"; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(40 + i * 28, 200 - i * 26, 16, 0, Math.PI * 2); g.fill(); } g.fillStyle = "#963"; g.fillRect(90, 60, 12, 80); }
  g.strokeStyle = "rgba(0,0,0,0.25)"; g.lineWidth = 6; g.strokeRect(3, 3, 186, 250);
}));

// ───────────────────────────────────────────── building blocks ─────────────────────────────────────────────
const col = (color: string, roughness = 0.65, extra: M = {}): M => ({ color, roughness, metalness: 0, ...extra });
const tx = (kind: TexKind, color: string | undefined, w: number, h: number, extra: M = {}): M => ({ ...(mat(kind, color, rep(kind, w, h)) as M), ...extra });
const Bx: React.FC<{ p: V3; s: V3; m: M; r?: V3; c?: boolean }> = ({ p, s, m, r, c = true }) => (
  <mesh position={p} rotation={r} castShadow={c} receiveShadow><boxGeometry args={s} /><meshStandardMaterial {...m} /></mesh>
);
const BxMM: React.FC<{ a: V3; b: V3; m: M; c?: boolean }> = ({ a, b, m, c }) => (
  <Bx p={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} s={[b[0] - a[0], b[1] - a[1], b[2] - a[2]]} m={m} c={c} />
);
const Plane: React.FC<{ p: V3; w: number; h: number; r?: V3; map: THREE.Texture; lit?: boolean }> = ({ p, w, h, r, map, lit }) => (
  <mesh position={p} rotation={r}><planeGeometry args={[w, h]} />{lit ? <meshBasicMaterial map={map} toneMapped={false} /> : <meshStandardMaterial map={map} roughness={0.85} />}</mesh>
);

const WALL = "#f2e6c4", WAINSCOT = "#8fb1c9", TRIM = "#f8f5ec", WOOD = "#b98a55", METAL = "#6d7680";

/** A kids' desk + chair at desk spot i (blue plastic chair on a dark metal frame, a light wood top). */
const KidDesk: React.FC<{ i: number; chair?: string }> = ({ i, chair = "#3f78c2" }) => {
  const { desk: [x, , z] } = DESK(i);
  return <group>
    <Bx p={[x, DESK_TOP - 0.1, z]} s={[DESK_W, 0.2, DESK_D]} m={tx("wood", "#d9b98a", DESK_W, DESK_D)} />
    <Bx p={[x, DESK_TOP - 0.45, z - 0.2]} s={[DESK_W - 0.3, 0.5, DESK_D - 0.6]} m={col("#4a5058", 0.5)} />
    <Bx p={[x, (DESK_TOP - 0.2) / 2, z - DESK_D / 2 + 0.15]} s={[DESK_W, DESK_TOP - 0.2, 0.3]} m={col("#5a626c", 0.5)} />
    {/* chair: seat, back, rear legs */}
    <Bx p={[x, SEAT_TOP - 0.12, z + SEAT_BACK]} s={[SEAT_W, 0.24, SEAT_D]} m={col(chair, 0.45)} />
    <Bx p={[x, SEAT_TOP + 0.95, z + SEAT_BACK + SEAT_D / 2 - 0.1]} s={[SEAT_W, 1.5, 0.2]} m={col(chair, 0.45)} />
    {[-1, 1].map((sx) => <Bx key={sx} p={[x + sx * (SEAT_W / 2 - 0.12), (SEAT_TOP - 0.24) / 2, z + SEAT_BACK + SEAT_D / 2 - 0.2]} s={[0.16, SEAT_TOP - 0.24, 0.16]} m={col("#33383e", 0.4, { metalness: 0.4 })} />)}
    {[-1, 1].map((sx) => <Bx key={`f${sx}`} p={[x + sx * (SEAT_W / 2 - 0.12), (SEAT_TOP - 0.24) / 2, z + SEAT_BACK - SEAT_D / 2 + 0.2]} s={[0.16, SEAT_TOP - 0.24, 0.16]} m={col("#33383e", 0.4, { metalness: 0.4 })} c={false} />)}
    {/* a book and a pencil on some desks */}
    {i % 2 === 0 && <Bx p={[x - 0.5, DESK_TOP + 0.06, z + 0.1]} s={[1.0, 0.12, 1.3]} r={[0, 0.2, 0]} m={col(["#c84a3a", "#3a8a5a", "#d8a830"][i % 3], 0.6)} />}
    {i % 3 === 1 && <Bx p={[x + 0.7, DESK_TOP + 0.04, z + 0.3]} s={[0.9, 0.08, 0.08]} r={[0, -0.5, 0]} m={col("#f2c81e", 0.5)} />}
  </group>;
};

/** A wall clock; `time` in hours (e.g. 10.17 = 10:10). */
const Clock: React.FC<{ time: number }> = ({ time }) => {
  const h = ((time % 12) / 12) * Math.PI * 2, m = ((time % 1) * Math.PI * 2);
  return <group position={CLOCK}>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]}><cylinderGeometry args={[1.3, 1.3, 0.2, 40]} /><meshStandardMaterial color="#26282c" roughness={0.4} /></mesh>
    <mesh position={[0, 0, 0.2]}><circleGeometry args={[1.12, 40]} /><meshStandardMaterial map={clockTex()} roughness={0.5} /></mesh>
    <group position={[0, 0, 0.24]} rotation={[0, 0, -h]}><mesh position={[0, 0.45, 0]}><planeGeometry args={[0.14, 0.9]} /><meshStandardMaterial color="#111" /></mesh></group>
    <group position={[0, 0, 0.25]} rotation={[0, 0, -m]}><mesh position={[0, 0.5, 0]}><planeGeometry args={[0.09, 1.0]} /><meshStandardMaterial color="#111" /></mesh></group>
    <mesh position={[0, 0, 0.26]}><circleGeometry args={[0.1, 12]} /><meshStandardMaterial color="#111" /></mesh>
  </group>;
};

export type ClassroomProps = {
  /** the door, 0 = shut, 1 = open wide into the room */
  door?: number;
  /** clock time in hours (default 10.17) */
  clock?: number;
  /** big chalk text on the board (default "Friday!") */
  boardText?: string;
  /** draw the ceiling and its light panels (turn off for a top-down drone shot) */
  ceiling?: boolean;
  /** draw the window wall's sun patches on the floor (default on) */
  sunPatches?: boolean;
  /** hide desks by index (e.g. one replaced by a shot's own) */
  hideDesks?: number[];
  /** chair colour per desk (cycled) */
  chairColors?: string[];
};

/** The classroom. Light it with <BlockLights time="interior" focus={...} /> from the shot. */
export const Classroom: React.FC<ClassroomProps> = ({ door = 0, clock = 10.17, boardText = "Friday!", ceiling = true, sunPatches = true, hideDesks = [], chairColors = ["#3f78c2", "#d8483a", "#3aa06a", "#e8b02a"] }) => {
  const W = ROOM.x1 - ROOM.x0, D = ROOM.z1 - ROOM.z0, H = ROOM.h;
  const wallM = (w: number, h: number) => tx("plaster", WALL, w, h);
  const wainM = (w: number) => tx("wood", WAINSCOT, w, 3);
  const dOpen = (Math.PI / 2) * Math.max(0, Math.min(1, door)), DW = DOOR_X1 - DOOR_X0;
  return <group>
    {/* floor: light tiles; corridor floor */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[W, D]} /><meshStandardMaterial {...tx("tile", "#d9d4c6", W, D)} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(DOOR_X0 + DOOR_X1) / 2, 0, ROOM.z0 - 6.3]} receiveShadow><planeGeometry args={[DW + 8, 12]} /><meshStandardMaterial {...tx("tile", "#c9c4b4", DW + 8, 12)} /></mesh>
    {sunPatches && [-10, 0, 10].map((z) => <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[ROOM.x0 + 5.5, 0.02, z + 1.5]}><planeGeometry args={[6, 6]} /><meshBasicMaterial color="#fff3cf" transparent opacity={0.16} /></mesh>)}

    {/* FRONT wall (z = z0), with the door opening */}
    <BxMM a={[ROOM.x0 - T, 0, ROOM.z0 - T]} b={[DOOR_X0, H, ROOM.z0]} m={wallM(DOOR_X0 - ROOM.x0, H)} c={false} />
    <BxMM a={[DOOR_X1, 0, ROOM.z0 - T]} b={[ROOM.x1 + T, H, ROOM.z0]} m={wallM(ROOM.x1 - DOOR_X1, H)} c={false} />
    <BxMM a={[DOOR_X0, DOOR_H, ROOM.z0 - T]} b={[DOOR_X1, H, ROOM.z0]} m={wallM(DW, H - DOOR_H)} c={false} />
    <BxMM a={[ROOM.x0, 0, ROOM.z0]} b={[DOOR_X0 - 0.3, 3, ROOM.z0 + 0.12]} m={wainM(DOOR_X0 - ROOM.x0)} c={false} />
    {/* door frame + leaf (hinged at x = DOOR_X1) with a small window */}
    <BxMM a={[DOOR_X0 - 0.35, 0, ROOM.z0 - 0.1]} b={[DOOR_X0, DOOR_H + 0.35, ROOM.z0 + 0.2]} m={col(TRIM, 0.4)} />
    <BxMM a={[DOOR_X1, 0, ROOM.z0 - 0.1]} b={[DOOR_X1 + 0.35, DOOR_H + 0.35, ROOM.z0 + 0.2]} m={col(TRIM, 0.4)} />
    <BxMM a={[DOOR_X0 - 0.35, DOOR_H, ROOM.z0 - 0.1]} b={[DOOR_X1 + 0.35, DOOR_H + 0.35, ROOM.z0 + 0.2]} m={col(TRIM, 0.4)} />
    <group position={[DOOR_X1, 0, ROOM.z0 - 0.15]} rotation={[0, -dOpen, 0]}>
      <Bx p={[-DW / 2, DOOR_H / 2, 0]} s={[DW - 0.05, DOOR_H - 0.05, 0.25]} m={tx("wood", "#a8743e", DW, DOOR_H)} />
      <Bx p={[-DW / 2, DOOR_H * 0.68, 0]} s={[1.6, 2.2, 0.28]} m={col("#bcd8ea", 0.1, { metalness: 0.1, emissive: new THREE.Color("#6a8aa0"), emissiveIntensity: 0.25 })} />
      <mesh position={[-DW + 0.6, 3.6, 0.2]}><sphereGeometry args={[0.18, 12, 8]} /><meshStandardMaterial color="#c9c9c9" metalness={0.7} roughness={0.3} /></mesh>
    </group>
    {/* the corridor beyond the door (lockers suggested by stripes) */}
    <BxMM a={[DOOR_X0 - 4, 0, ROOM.z0 - 12]} b={[DOOR_X0 - 3.4, H, ROOM.z0 - T]} m={tx("plaster", "#d8d0bc", 12, H)} c={false} />
    <BxMM a={[DOOR_X1 + 3.4, 0, ROOM.z0 - 12]} b={[DOOR_X1 + 4, H, ROOM.z0 - T]} m={tx("plaster", "#d8d0bc", 12, H)} c={false} />
    <BxMM a={[DOOR_X0 - 4, 0, ROOM.z0 - 12.6]} b={[DOOR_X1 + 4, H, ROOM.z0 - 12]} m={tx("plaster", "#d8d0bc", 14, H)} c={false} />
    {[0, 1, 2, 3, 4, 5].map((k) => <Bx key={k} p={[DOOR_X0 - 3.3 + k * 2.15, 3.6, ROOM.z0 - 11.85]} s={[2, 7.2, 0.3]} m={col(k % 2 ? "#3f6fb0" : "#3a66a6", 0.45, { metalness: 0.3 })} />)}
    <pointLight position={[(DOOR_X0 + DOOR_X1) / 2, 11, ROOM.z0 - 6]} intensity={60} distance={26} decay={2} color="#fff4e0" />

    {/* BOARD + chalk tray + clock + flag-free banner of shapes */}
    <BxMM a={[BOARD.x0 - 0.35, BOARD.y0 - 0.35, ROOM.z0]} b={[BOARD.x1 + 0.35, BOARD.y1 + 0.35, ROOM.z0 + 0.12]} m={col("#c9a46a", 0.6)} />
    <Plane p={[(BOARD.x0 + BOARD.x1) / 2, (BOARD.y0 + BOARD.y1) / 2, ROOM.z0 + 0.14]} w={BOARD.x1 - BOARD.x0} h={BOARD.y1 - BOARD.y0} map={boardTex(boardText)} />
    <BxMM a={[BOARD.x0, BOARD.y0 - 0.35, ROOM.z0]} b={[BOARD.x1, BOARD.y0 - 0.15, ROOM.z0 + 0.5]} m={col("#b08a54", 0.6)} />
    {[-6, -2.5, 4].map((x, k) => <Bx key={k} p={[x, BOARD.y0 - 0.08, ROOM.z0 + 0.32]} s={[0.5, 0.14, 0.14]} m={col(["#fff", "#f7d8e0", "#fff6b8"][k], 0.9)} />)}
    <Clock time={clock} />
    {/* alphabet strip above the board */}
    {Array.from({ length: 9 }, (_, k) => k === 4 ? null : <Bx key={k} p={[-12 + k * 3, 10.9, ROOM.z0 + 0.08]} s={[2.4, 1.1, 0.05]} m={col(["#e65a4a", "#f2a43a", "#f2d03a", "#5ab45a", "#4a8ae0", "#9a6ad8", "#e65a9a", "#4ac0c0", "#e6844a"][k], 0.8)} />)}

    {/* LEFT wall (x = x0) with three windows */}
    {(() => {
      const zs = [-10, 0, 10], ww = 6, y0 = 3.6, y1 = 10.4;
      const pieces: React.ReactNode[] = [];
      pieces.push(<BxMM key="lo" a={[ROOM.x0 - T, 0, ROOM.z0]} b={[ROOM.x0, y0, ROOM.z1]} m={wallM(D, y0)} c={false} />);
      pieces.push(<BxMM key="hi" a={[ROOM.x0 - T, y1, ROOM.z0]} b={[ROOM.x0, H, ROOM.z1]} m={wallM(D, H - y1)} c={false} />);
      const edges = [ROOM.z0, ...zs.flatMap((z) => [z - ww / 2, z + ww / 2]), ROOM.z1];
      for (let k = 0; k < edges.length; k += 2) pieces.push(<BxMM key={`p${k}`} a={[ROOM.x0 - T, y0, edges[k]]} b={[ROOM.x0, y1, edges[k + 1]]} m={wallM(edges[k + 1] - edges[k], y1 - y0)} c={false} />);
      zs.forEach((z) => {
        pieces.push(<Plane key={`v${z}`} p={[ROOM.x0 - T + 0.05, (y0 + y1) / 2, z]} r={[0, Math.PI / 2, 0]} w={ww} h={y1 - y0} map={viewTex()} lit />);
        pieces.push(<BxMM key={`s${z}`} a={[ROOM.x0, y0 - 0.25, z - ww / 2 - 0.3]} b={[ROOM.x0 + 0.7, y0, z + ww / 2 + 0.3]} m={col(TRIM, 0.4)} />);
        [[z - ww / 2 - 0.15, 0.3], [z + ww / 2 + 0.15, 0.3], [z, 0.2]].forEach(([zz, w], j) => pieces.push(<Bx key={`m${z}${j}`} p={[ROOM.x0 + 0.08, (y0 + y1) / 2, zz]} s={[0.25, y1 - y0, w]} m={col(TRIM, 0.4)} />));
        pieces.push(<Bx key={`h${z}`} p={[ROOM.x0 + 0.08, y1 + 0.12, z]} s={[0.25, 0.3, ww + 0.6]} m={col(TRIM, 0.4)} />);
        pieces.push(<Bx key={`c${z}`} p={[ROOM.x0 + 0.08, (y0 + y1) / 2 + 0.6, z]} s={[0.22, 0.18, ww]} m={col(TRIM, 0.4)} />);
      });
      pieces.push(<BxMM key="wa" a={[ROOM.x0, 0, ROOM.z0]} b={[ROOM.x0 + 0.12, 3, ROOM.z1]} m={wainM(D)} c={false} />);
      return pieces;
    })()}
    <pointLight position={[ROOM.x0 + 3, 8, 0]} intensity={90} distance={30} decay={2} color="#eaf4ff" />

    {/* RIGHT wall (x = x1): plain, with a cork board and the low shelf */}
    <BxMM a={[ROOM.x1, 0, ROOM.z0]} b={[ROOM.x1 + T, H, ROOM.z1]} m={wallM(D, H)} c={false} />
    <BxMM a={[ROOM.x1 - 0.12, 0, ROOM.z0]} b={[ROOM.x1, 3, ROOM.z1]} m={wainM(D)} c={false} />
    <BxMM a={[ROOM.x1 - 0.15, 5.2, -2]} b={[ROOM.x1, 9.6, 10]} m={col("#b98a5a", 0.95)} />
    {[0, 1, 2, 3].map((k) => <Plane key={k} p={[ROOM.x1 - 0.17, 7.4 + (k % 2 ? -0.3 : 0.4), -0.5 + k * 3]} r={[0, -Math.PI / 2, 0.04 * (k - 1.5)]} w={2.1} h={2.8} map={posterTex(k)} />)}
    {/* the low shelf: a wood cabinet with cubby openings */}
    <BxMM a={[SHELF_X0, 0, SHELF_Z0]} b={[ROOM.x1, SHELF_H, SHELF_Z1]} m={tx("wood", WOOD, SHELF_Z1 - SHELF_Z0, SHELF_H)} />
    {Array.from({ length: 5 }, (_, k) => <BxMM key={k} a={[SHELF_X0 - 0.01, 0.3, SHELF_Z0 + 0.35 + k * 2.75]} b={[SHELF_X0 + 0.01, SHELF_H - 0.3, SHELF_Z0 + 2.75 + k * 2.75]} m={col("#5a3e24", 0.9)} c={false} />)}
    <BxMM a={[SHELF_X0 - 0.1, SHELF_H - 0.05, SHELF_Z0 - 0.1]} b={[ROOM.x1, SHELF_H + 0.08, SHELF_Z1 + 0.1]} m={tx("wood", "#c89a62", 14, 2.6)} />

    {/* BACK wall (z = z1): cubbies, posters, the sink counter */}
    <BxMM a={[ROOM.x0 - T, 0, ROOM.z1]} b={[ROOM.x1 + T, H, ROOM.z1 + T]} m={wallM(W, H)} c={false} />
    <BxMM a={[ROOM.x0, 0, ROOM.z1 - 0.12]} b={[ROOM.x1, 3, ROOM.z1]} m={wainM(W)} c={false} />
    <BxMM a={[-20, 0, 15.8]} b={[6, 4.2, ROOM.z1]} m={tx("wood", "#c9a06a", 26, 4.2)} />
    {Array.from({ length: 10 }, (_, k) => <BxMM key={k} a={[-19.7 + k * 2.55, 0.4, 15.78]} b={[-17.6 + k * 2.55, 3.9, 15.82]} m={col(["#d8483a", "#3f78c2", "#3aa06a", "#e8b02a", "#8a5ac8"][k % 5], 0.7)} c={false} />)}
    {[0, 1, 2, 3].map((k) => <Plane key={k} p={[-14 + k * 6.5, 8, ROOM.z1 - 0.05]} r={[0, Math.PI, 0]} w={3} h={4} map={posterTex(k + 1)} />)}
    <BxMM a={[SINK_C.x0, 0, SINK_C.z0]} b={[SINK_C.x1, SINK_C.top, ROOM.z1]} m={tx("wood", "#e8e2d4", 8, 3)} />
    <BxMM a={[SINK_C.x0 - 0.1, SINK_C.top, SINK_C.z0 - 0.1]} b={[SINK_C.x1 + 0.1, SINK_C.top + 0.15, ROOM.z1]} m={col("#7a8088", 0.5)} />
    <Bx p={[SINK_BASIN[0], SINK_C.top + 0.1, SINK_BASIN[2]]} s={[2.8, 0.12, 1.6]} m={col("#c8ccd2", 0.25, { metalness: 0.5 })} />
    <Bx p={[SINK_BASIN[0], SINK_C.top + 0.9, ROOM.z1 - 0.4]} s={[0.25, 1.6, 0.25]} m={col("#c8ccd2", 0.25, { metalness: 0.6 })} />
    <Bx p={[SINK_BASIN[0], SINK_C.top + 1.6, ROOM.z1 - 0.9]} s={[0.22, 0.22, 1.1]} m={col("#c8ccd2", 0.25, { metalness: 0.6 })} />
    <Bx p={[SINK_C.x0 + 1.2, SINK_C.top + 0.75, ROOM.z1 - 0.7]} s={[1.0, 1.3, 0.6]} m={col("#f4f4f4", 0.6)} />

    {/* furniture: the kids' desks, the teacher's desk + chair, a bookcase, a waste bin */}
    {Array.from({ length: DESK_COUNT }, (_, i) => hideDesks.includes(i) ? null : <KidDeskC key={i} i={i} chair={chairColors[i % chairColors.length]} />)}
    <Bx p={[TDESK.c[0], TDESK.s[1] - 0.12, TDESK.c[2]]} s={[TDESK.s[0], 0.24, TDESK.s[2]]} m={tx("wood", "#9a6a3c", 7, 3)} />
    <Bx p={[TDESK.c[0] - TDESK.s[0] / 2 + 1, (TDESK.s[1] - 0.24) / 2, TDESK.c[2]]} s={[2, TDESK.s[1] - 0.24, TDESK.s[2] - 0.2]} m={tx("wood", "#8a5a30", 2, 3)} />
    <Bx p={[TDESK.c[0] + TDESK.s[0] / 2 - 1, (TDESK.s[1] - 0.24) / 2, TDESK.c[2]]} s={[2, TDESK.s[1] - 0.24, TDESK.s[2] - 0.2]} m={tx("wood", "#8a5a30", 2, 3)} />
    <Bx p={[TDESK.c[0], (TDESK.s[1] - 0.24) / 2 + 0.4, TDESK.c[2] + TDESK.s[2] / 2 - 0.15]} s={[TDESK.s[0] - 4, TDESK.s[1] - 1, 0.2]} m={tx("wood", "#8a5a30", 3, 2)} />
    {/* on the teacher's desk: an apple, a stack of papers, a mug */}
    <mesh position={[TDESK.c[0] + 2.2, TDESK.s[1] + 0.35, TDESK.c[2] + 0.4]} castShadow><sphereGeometry args={[0.35, 16, 12]} /><meshStandardMaterial color="#c8302a" roughness={0.4} /></mesh>
    <Bx p={[TDESK.c[0] - 1, TDESK.s[1] + 0.15, TDESK.c[2]]} s={[1.6, 0.3, 2]} r={[0, 0.15, 0]} m={col("#f6f4ee", 0.9)} />
    <mesh position={[TDESK.c[0] + 0.6, TDESK.s[1] + 0.35, TDESK.c[2] - 0.6]} castShadow><cylinderGeometry args={[0.28, 0.28, 0.7, 16]} /><meshStandardMaterial color="#3a8ac8" roughness={0.5} /></mesh>
    <group position={[TDESK.c[0] + 0.5, 0, TDESK.c[2] - 3.0]}>
      <Bx p={[0, 2.0, 0]} s={[2.2, 0.3, 2.0]} m={col("#2e3238", 0.5)} />
      <Bx p={[0, 3.4, -0.9]} s={[2.2, 2.4, 0.3]} m={col("#2e3238", 0.5)} />
      <Bx p={[0, 1.0, 0]} s={[0.3, 2.0, 0.3]} m={col("#1e2024", 0.4, { metalness: 0.5 })} />
    </group>
    <BxMM a={[ROOM.x0, 0, -16.5]} b={[ROOM.x0 + 1.4, 3.2, -13]} m={tx("wood", WOOD, 3.5, 3.2)} />
    {Array.from({ length: 8 }, (_, k) => <Bx key={k} p={[ROOM.x0 + 0.8, 3.2 + 0.5, -16.2 + k * 0.42]} s={[1.0, 1.0 - (k % 3) * 0.15, 0.36]} m={col(["#c84a3a", "#3a6ab0", "#e8b02a", "#3a8a5a"][k % 4], 0.7)} />)}

    {/* CEILING with light panels */}
    {ceiling && <>
      <BxMM a={[ROOM.x0 - T, H, ROOM.z0 - T]} b={[ROOM.x1 + T, H + 0.3, ROOM.z1 + T]} m={col("#f4f1ea", 0.95)} c={false} />
      {[-12, 0, 12].flatMap((x) => [-10, 2, 13].map((z) => <Bx key={`${x}${z}`} p={[x, H - 0.05, z]} s={[4, 0.1, 2]} m={col("#ffffff", 0.3, { emissive: new THREE.Color("#fffaf0"), emissiveIntensity: 1.2 })} c={false} />))}
    </>}
    <pointLight position={[-8, H - 1.5, -4]} intensity={180} distance={40} decay={2} color="#fff6e6" />
    <pointLight position={[8, H - 1.5, 8]} intensity={180} distance={40} decay={2} color="#fff6e6" />
  </group>;
};
const KidDeskC = KidDesk;

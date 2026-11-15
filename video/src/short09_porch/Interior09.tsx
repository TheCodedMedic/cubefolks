// Short 09 interiors, built INSIDE the street's cut houses (Town09 homeCut / bellCut), so a camera indoors sees the real
// street through the door and the window. Rig units, lot-local coordinates (see Porch09.tsx). Also the grocery aisle
// (beat 2), a separate little set far from the street.
//
// OUR HOUSE (lot-local = world): room x -9.6..9.6, z -8.6..8.6, floor y 1.2, ceiling y 11.
//   front wall z 8.6 (inner face): the door at x -3 (5 wide), our switch under the porch lamp at x -6.8, the big window
//   at x 3.75 with curtains; the stairs along the left wall (x -9.6..-6.6) climbing toward the back from z 2.2;
//   the couch against the right wall (seat x 6.6..9.4, z -3.2..3.6), an ottoman in front, a floor lamp, a TV on a low
//   cabinet at the back left facing the couch, the clock above the couch, a rug, pictures.
// MR. BELL'S HALL (bell lot-local): the same shell; a coat stand left of the door (inside), an armchair, a lamp table,
//   green wallpaper.
// GROCERY: an aisle along z at x = GX: shelves both sides, a cart, ceiling panels.
import React, { useMemo } from "react";
import * as THREE from "three";
import { box, type Box } from "../blocky/Collide";
import { EXTRA, Kit, Render, useBuilt, wallWithHoles, DOOR_HW, canvasTex } from "./Town09";
import { DOOR_X, F, FRONT_Z, InLot, LAMP_L, W, WIN_L, type LotId, type V3 } from "./Porch09";

EXTRA.p09floor = { kind: "wood", color: "#ffffff", rough: 0.55 };
EXTRA.p09paper = { kind: "wallpaper", color: "#e9dcc2" };
EXTRA.p09paperG = { kind: "wallpaper", color: "#b9c9a8" };
EXTRA.p09ceil = { kind: "plaster", color: "#f4efe6" };
EXTRA.p09couch = { kind: "fabric", color: "#5f7fa8", rough: 0.95 };
EXTRA.p09cush = { kind: "fabric", color: "#d9c38a", rough: 0.95 };
EXTRA.p09chair = { kind: "fabric", color: "#9a4a3a", rough: 0.95 };
EXTRA.p09rug = { kind: "carpet", color: "#b46a4a" };
EXTRA.p09rugB = { kind: "carpet", color: "#6a7a5a" };
EXTRA.p09wood = { kind: "woodDark", color: "#ffffff", rough: 0.55 };
EXTRA.p09woodL = { kind: "wood", color: "#d8b88a", rough: 0.55 };
EXTRA.p09stairs = { kind: "wood", color: "#c99a66", rough: 0.55 };
EXTRA.p09tv = { color: "#141418", rough: 0.3, metal: 0.2 };
EXTRA.p09shade = { color: "#f2e2bc", rough: 0.8, emissive: "#ffd9a0", ei: 0.35 };
EXTRA.p09frame = { color: "#3b2a1e", rough: 0.6 };
EXTRA.p09art1 = { color: "#7da0c4", rough: 0.8 };
EXTRA.p09art2 = { color: "#d39a5a", rough: 0.8 };
EXTRA.p09coat = { kind: "fabric", color: "#2e3a52", rough: 0.9 };
EXTRA.p09tile = { kind: "tile", color: "#ffffff", rough: 0.4 };
EXTRA.p09shelf = { color: "#e8e6e0", rough: 0.6, metal: 0.1 };
EXTRA.p09panel = { color: "#ffffff", emissive: "#ffffff", ei: 1.4, shadow: false };
EXTRA.p09cart = { color: "#9aa3ab", rough: 0.35, metal: 0.7 };
EXTRA.p09wallS = { kind: "plaster", color: "#dfe6e2" };
for (const [k, c] of [["pA", "#d9442f"], ["pB", "#f1c232"], ["pC", "#3d7fc4"], ["pD", "#4aa35a"], ["pE", "#f08a2e"], ["pF", "#e8e2d2"], ["pG", "#8a4fb0"]])
  EXTRA[`p09${k}`] = { color: c, rough: 0.55 };

export const ROOM = { x0: -9.6, x1: 9.6, z0: -8.6, z1: 8.6, y0: F, y1: 11 };
const LIN = 0.12; // lining thickness
/** Stairs: step i (0 = bottom) top height and z range. */
export const STAIRS = { x0: -9.6, x1: -5.9, z0: 2.2, run: 0.9, rise: 0.75, n: 12 };
export const stepTop = (i: number) => F + (i + 1) * STAIRS.rise;
export const stepZ = (i: number) => STAIRS.z0 - (i + 0.5) * STAIRS.run;
export const COUCH = { x0: 6.6, x1: 9.4, z0: -6.0, z1: 3.6, seat: F + 1.5 };
export const OTTOMAN = { x0: 4.3, x1: 6.5, z0: -0.5, z1: 2.3, top: F + 1.5 - 0.06 };
export const CLOCK: V3 = [ROOM.x1 - 0.1, F + 7.6, 0.2];
export const TV: V3 = [-4.6, F + 3.3, -4.4];
export const LAMP_IN: V3 = [8.5, F + 6.2, 5.6];

function shellLining(k: Kit, paper: string) {
  const { x0, x1, z0, z1, y0, y1 } = ROOM;
  k.box("p09floor", [0, y0 - 0.05, 0], [x1 - x0, 0.1, z1 - z0]);
  k.box("p09ceil", [0, y1 + 0.1, 0], [x1 - x0, 0.2, z1 - z0]);
  k.box("trim", [0, y1 - 0.15, z0 + 0.1], [x1 - x0, 0.3, 0.2]);
  k.box(paper, [0, (y0 + y1) / 2, z0 + LIN / 2], [x1 - x0, y1 - y0, LIN]);
  for (const sx of [x0 + LIN / 2, x1 - LIN / 2]) k.box(paper, [sx, (y0 + y1) / 2, 0], [LIN, y1 - y0, z1 - z0]);
  wallWithHoles(k, paper, x0, x1, y0, y1, z1 - LIN / 2, LIN, [
    [DOOR_X - DOOR_HW + 0.27, DOOR_X + DOOR_HW - 0.27, y0, y0 + 7.95],
    [WIN_L[0] - 2.5, WIN_L[0] + 2.5, WIN_L[1] - 2.4, WIN_L[1] + 2.4]]);
  // skirting boards and an inner door / window casing
  for (const [a, b, z] of [[x0, x1, z0 + LIN + 0.06], [x0, DOOR_X - DOOR_HW + 0.27, z1 - LIN - 0.06], [DOOR_X + DOOR_HW - 0.27, x1, z1 - LIN - 0.06]] as const)
    k.box("trim", [(a + b) / 2, y0 + 0.3, z], [b - a, 0.6, 0.12]);
  for (const sx of [x0 + LIN + 0.06, x1 - LIN - 0.06]) k.box("trim", [sx, y0 + 0.3, 0], [0.12, 0.6, z1 - z0]);
  const dz = z1 - LIN - 0.08;
  for (const sx of [-1, 1]) k.box("trim", [DOOR_X + sx * (DOOR_HW - 0.1), y0 + 4.0, dz], [0.45, 8.0, 0.16]);
  k.box("trim", [DOOR_X, y0 + 8.15, dz], [2 * DOOR_HW + 0.5, 0.45, 0.16]);
  for (const sx of [-1, 1]) k.box("trim", [WIN_L[0] + sx * 2.65, WIN_L[1], dz], [0.35, 5.1, 0.16]);
  k.box("trim", [WIN_L[0], WIN_L[1] + 2.6, dz], [5.7, 0.35, 0.16]);
  k.box("trim", [WIN_L[0], WIN_L[1] - 2.55, dz - 0.15], [6.0, 0.25, 0.5]); // sill
  // curtain rod
  k.tube("brass", [WIN_L[0] - 3.4, WIN_L[1] + 3.0, dz - 0.35], [WIN_L[0] + 3.4, WIN_L[1] + 3.0, dz - 0.35], 0.07);
}

function ourRoom(k: Kit) {
  shellLining(k, "p09paper");
  const { x0, x1, z0, y0 } = ROOM;
  // stairs (left wall, climbing toward the back), a stringer and a banister on the open side
  for (let i = 0; i < STAIRS.n; i++) {
    const zc = stepZ(i), top = stepTop(i);
    k.box("p09stairs", [(STAIRS.x0 + STAIRS.x1) / 2, top - 0.08, zc], [STAIRS.x1 - STAIRS.x0, 0.16, STAIRS.run]);
    k.box("trim", [(STAIRS.x0 + STAIRS.x1) / 2, (y0 + top - 0.16) / 2, zc + STAIRS.run / 2 - 0.05], [STAIRS.x1 - STAIRS.x0 - 0.05, top - 0.16 - y0, 0.1]);
    k.box("trim", [(STAIRS.x0 + STAIRS.x1) / 2, (y0 + top) / 2, zc - 0.05], [STAIRS.x1 - STAIRS.x0 - 0.1, top - y0 - 0.1, STAIRS.run - 0.1]);
    if (i % 1 === 0) k.box("trim", [STAIRS.x1 - 0.15, top + 1.6, zc], [0.14, 3.2, 0.14]);
  }
  const hb = (i: number): V3 => [STAIRS.x1 - 0.15, stepTop(i) + 3.3, stepZ(i)];
  k.tube("p09wood", [STAIRS.x1 - 0.15, F + 3.9, STAIRS.z0 + 0.4], hb(STAIRS.n - 1), 0.17);
  k.box("p09wood", [STAIRS.x1 - 0.15, F + 2.2, STAIRS.z0 - 0.1], [0.5, 4.4, 0.5]);
  k.box("p09wood", [STAIRS.x1 - 0.15, F + 4.55, STAIRS.z0 - 0.1], [0.62, 0.3, 0.62]);
  // rug
  k.box("p09rug", [2.4, y0 + 0.02, 0.4], [8.5, 0.04, 7.5]);
  // couch: base, seat cushions, back, arms
  const C = COUCH;
  k.box("p09couch", [(C.x0 + C.x1) / 2, y0 + 0.65, (C.z0 + C.z1) / 2], [C.x1 - C.x0, 1.1, C.z1 - C.z0]);
  for (const zz of [C.z0 + 0.6 + 2.1, C.z1 - 0.6 - 2.1]) k.box("p09couch", [(C.x0 + C.x1) / 2 - 0.2, C.seat - 0.22, zz], [C.x1 - C.x0 - 0.8, 0.44, 4.15]);
  k.box("p09couch", [C.x1 - 0.45, C.seat + 1.3, (C.z0 + C.z1) / 2], [0.9, 2.6, C.z1 - C.z0]);
  for (const zz of [C.z0 + 0.3, C.z1 - 0.3]) k.box("p09couch", [(C.x0 + C.x1) / 2, C.seat + 0.35, zz], [C.x1 - C.x0, 1.6, 0.6]);
  k.box("p09cush", [C.x1 - 1.2, C.seat + 1.0, C.z1 - 1.3], [0.5, 1.4, 1.4], new THREE.Euler(0, 0, 0.25));
  // ottoman with a cushion on top
  const O = OTTOMAN;
  k.box("p09chair", [(O.x0 + O.x1) / 2, (y0 + O.top - 0.3) / 2, (O.z0 + O.z1) / 2], [O.x1 - O.x0, O.top - 0.3 - y0, O.z1 - O.z0]);
  k.box("p09cush", [(O.x0 + O.x1) / 2, O.top - 0.15, (O.z0 + O.z1) / 2], [O.x1 - O.x0 - 0.1, 0.3, O.z1 - O.z0 - 0.1]);
  // floor lamp by the couch
  k.geo("metal", new THREE.CylinderGeometry(0.6, 0.7, 0.2, 16), [LAMP_IN[0], y0 + 0.1, LAMP_IN[2]]);
  k.tube("metal", [LAMP_IN[0], y0, LAMP_IN[2]], [LAMP_IN[0], LAMP_IN[1] - 0.5, LAMP_IN[2]], 0.08);
  // TV cabinet + TV (back left, facing the couch)
  k.box("p09wood", [TV[0], y0 + 0.9, TV[2]], [1.6, 1.8, 4.2]);
  k.box("p09tv", [TV[0] + 0.1, TV[1] + 0.6, TV[2]], [0.35, 2.4, 3.8]);
  k.box("p09tv", [TV[0] - 0.1, y0 + 1.95, TV[2]], [0.6, 0.15, 1.2]);
  // pictures and a back doorway (dark kitchen)
  k.box("p09frame", [1.5, y0 + 5.6, z0 + LIN + 0.06], [3.2, 2.4, 0.1]); k.box("p09art1", [1.5, y0 + 5.6, z0 + LIN + 0.12], [2.7, 1.9, 0.04]);
  k.box("p09frame", [x1 - LIN - 0.06, y0 + 5.2, -5.6], [0.1, 2.2, 1.8]); k.box("p09art2", [x1 - LIN - 0.12, y0 + 5.2, -5.6], [0.04, 1.8, 1.4]);
  k.box("black", [5.5, y0 + 3.9, z0 + LIN + 0.03], [4.2, 7.8, 0.04]);
  for (const sx of [-1, 1]) k.box("trim", [5.5 + sx * 2.2, y0 + 3.95, z0 + LIN + 0.08], [0.4, 7.9, 0.14]);
  k.box("trim", [5.5, y0 + 8.0, z0 + LIN + 0.08], [4.8, 0.4, 0.14]);
  // hall ceiling light fixture (glass dome) and a coat hook board by the door
  k.geo("p09shade", new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), [DOOR_X, ROOM.y1 - 0.02, 5.2], new THREE.Euler(Math.PI, 0, 0));
}

function bellRoom(k: Kit) {
  shellLining(k, "p09paperG");
  const { y0, z0, x1 } = ROOM;
  k.box("p09rugB", [-1.5, y0 + 0.02, 3.5], [7, 0.04, 6]);
  // coat stand left of the door (seen from inside: x -8.2, near the front wall)
  const cs: V3 = [-8.4, y0, 6.6];
  k.geo("p09wood", new THREE.CylinderGeometry(0.7, 0.8, 0.2, 12), [cs[0], y0 + 0.1, cs[2]]);
  k.tube("p09wood", [cs[0], y0, cs[2]], [cs[0], y0 + 6.6, cs[2]], 0.13);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; k.tube("brass", [cs[0], y0 + 6.2, cs[2]], [cs[0] + Math.cos(a) * 0.7, y0 + 6.5, cs[2] + Math.sin(a) * 0.7], 0.06); }
  // armchair + lamp table + lamp
  k.at([5.5, y0, 2.5], -2.3, () => {
    k.box("p09chair", [0, 0.75, 0], [3.0, 1.5, 3.0]); k.box("p09chair", [0, 2.6, -1.25], [3.0, 2.6, 0.6]);
    for (const sx of [-1, 1]) k.box("p09chair", [sx * 1.3, 1.9, 0], [0.5, 1.0, 3.0]);
  });
  k.box("p09wood", [8.2, y0 + 1.4, 5.8], [1.6, 2.8, 1.6]);
  k.geo("p09shade", new THREE.CylinderGeometry(0.55, 0.85, 1.0, 16), [8.2, y0 + 4.3, 5.8]);
  k.tube("metal", [8.2, y0 + 2.8, 5.8], [8.2, y0 + 3.8, 5.8], 0.08);
  k.box("p09frame", [-2.0, y0 + 5.4, z0 + LIN + 0.06], [3.6, 2.6, 0.1]); k.box("p09art2", [-2.0, y0 + 5.4, z0 + LIN + 0.12], [3.0, 2.0, 0.04]);
  k.box("p09frame", [x1 - LIN - 0.06, y0 + 5.0, -2.0], [0.1, 2.0, 2.6]); k.box("p09art1", [x1 - LIN - 0.12, y0 + 5.0, -2.0], [0.04, 1.6, 2.2]);
}

/** The coat on Mr. Bell's coat stand (hidden once he takes it). Lot-local. */
export const COAT_HOOK: V3 = [-8.4 + 0.5, F + 6.3, 6.6 + 0.3];
export const CoatOnStand: React.FC = () => (
  <group>
    <group position={[COAT_HOOK[0], COAT_HOOK[1], COAT_HOOK[2]]} rotation={[0, 0.5, 0]}>
      <mesh position={[0, -2.0, 0]}><boxGeometry args={[1.4, 4.0, 0.6]} /><meshStandardMaterial color="#2e3a52" roughness={0.9} /></mesh>
      <mesh position={[0, -0.1, 0]}><boxGeometry args={[1.6, 0.3, 0.7]} /><meshStandardMaterial color="#2e3a52" roughness={0.9} /></mesh>
    </group>
  </group>
);

/** Our room (static) + its live bits: curtains (open 0..1 on the left panel), the TV glow, the floor lamp, the hall light. */
export const OurRoom: React.FC<{ t: number; curtain?: number; tv?: boolean; lamp?: number; hall?: number; clock?: [number, number] }> = ({ t, curtain = 0, tv = true, lamp = 0, hall = 0, clock = [8, 59] }) => {
  const b = useBuilt("p09ourRoom", ourRoom);
  const flick = 0.75 + 0.25 * Math.sin(t * 13) * Math.sin(t * 5.3 + 1);
  return (
    <InLot lot="home">
      <Render b={b} />
      <Curtains open={curtain} />
      <Clock at={CLOCK} hm={clock} />
      {/* TV screen + flicker light */}
      <mesh position={[TV[0] + 0.3, TV[1] + 0.6, TV[2]]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[3.5, 2.1]} />
        <meshStandardMaterial color="#000" emissive={tv ? "#9ec4ff" : "#000"} emissiveIntensity={tv ? 0.9 * flick : 0} toneMapped={false} />
      </mesh>
      {tv && <pointLight color="#8fb4ff" intensity={30 * flick} distance={22} decay={1.6} position={[TV[0] + 2.2, TV[1] + 0.8, TV[2]]} />}
      {/* floor lamp shade + light */}
      <mesh position={[LAMP_IN[0], LAMP_IN[1], LAMP_IN[2]]}><cylinderGeometry args={[0.7, 1.05, 1.2, 16, 1, true]} /><meshStandardMaterial color="#f2e2bc" emissive="#ffd59a" emissiveIntensity={0.15 + 1.2 * lamp} side={THREE.DoubleSide} /></mesh>
      {lamp > 0 && <pointLight color="#ffcf8f" intensity={55 * lamp} distance={26} decay={1.6} position={[LAMP_IN[0] - 0.8, LAMP_IN[1] - 0.2, LAMP_IN[2] - 0.6]} />}
      {hall > 0 && <pointLight color="#ffe2b5" intensity={60 * hall} distance={24} decay={1.6} position={[DOOR_X, ROOM.y1 - 1.2, 5.2]} />}
    </InLot>
  );
};
export const BellRoom: React.FC<{ coat?: boolean }> = ({ coat = true }) => {
  const b = useBuilt("p09bellRoom", bellRoom);
  return (
    <InLot lot="bell">
      <Render b={b} />
      {coat && <CoatOnStand />}
      <pointLight color="#ffcf8f" intensity={55} distance={24} decay={1.6} position={[7.6, F + 4.6, 5.0]} />
    </InLot>
  );
};

/** Curtains on the front window: two fabric panels; `open` slides the right-hand panel (seen from inside) aside. */
const Curtains: React.FC<{ open: number }> = ({ open }) => {
  const z = FRONT_Z - 0.4 - LIN - 0.45, x = WIN_L[0], top = WIN_L[1] + 2.95, h = 6.0;
  const panels: [number, number][] = [[x - 2.25 - 0.4, 1.9], [x + 1.25 + open * 1.2, 2.3 - open * 1.1]];
  return <>{panels.map(([cx, w], i) => (
    <group key={i} position={[cx, top - h / 2, z]}>
      {Array.from({ length: 4 }, (_, j) => (
        <mesh key={j} position={[(j - 1.5) * (w / 4), 0, (j % 2) * 0.12]} castShadow>
          <boxGeometry args={[w / 4 + 0.02, h, 0.12]} /><meshStandardMaterial color="#b04a3c" roughness={0.95} />
        </mesh>
      ))}
    </group>
  ))}</>;
};

/** A round wall clock (facing -x, on the right wall) showing h:m. */
const clockTex = (h: number, m: number) => canvasTex(`p09clock${h}:${m}`, 256, 256, (g, w) => {
  const c = w / 2;
  g.fillStyle = "#fbf8ef"; g.beginPath(); g.arc(c, c, c - 4, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#1c1c20"; g.lineWidth = 12; g.stroke();
  g.fillStyle = "#1c1c20"; g.font = "700 34px Montserrat, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillText(String(i), c + Math.sin(a) * (c - 34), c - Math.cos(a) * (c - 34)); }
  const hand = (a: number, len: number, wd: number, col: string) => { g.strokeStyle = col; g.lineWidth = wd; g.lineCap = "round"; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(a) * len, c - Math.cos(a) * len); g.stroke(); };
  hand(((h % 12) + m / 60) / 12 * Math.PI * 2, c * 0.48, 14, "#1c1c20");
  hand((m / 60) * Math.PI * 2, c * 0.72, 9, "#1c1c20");
  g.fillStyle = "#c0392b"; g.beginPath(); g.arc(c, c, 10, 0, Math.PI * 2); g.fill();
});
export const Clock: React.FC<{ at: V3; hm: [number, number] }> = ({ at, hm }) => {
  const tex = clockTex(hm[0], hm[1]);
  return (
    <group position={at} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[1.25, 1.25, 0.25, 32]} /><meshStandardMaterial color="#6a3a22" roughness={0.5} /></mesh>
      <mesh position={[0, 0, 0.24]}><circleGeometry args={[1.1, 32]} /><meshStandardMaterial map={tex} roughness={0.4} /></mesh>
    </group>
  );
};

// ---------------------------------------------------------------- colliders (world)
const lb = (lot: LotId, min: V3, max: V3, name?: string): Box => {
  const a = W(lot, min), b = W(lot, max);
  return { min: [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])], max: [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])], name };
};
/** Walls of a cut house (with the door gap) for either lot, world coordinates. */
export const shellCS = (lot: LotId): Box[] => {
  const { x0, x1, z0, z1, y0, y1 } = ROOM, th = 0.4 + LIN;
  return [
    lb(lot, [x0 - 0.5, 0, z0 - 0.5], [x1 + 0.5, y0, z1 + 0.5], "floor"),
    lb(lot, [x0 - th, y0, z0 - th], [x1 + th, y1, z0 + LIN], "wallBack"),
    lb(lot, [x0 - th, y0, z0], [x0 + LIN, y1, z1 + th], "wallL"),
    lb(lot, [x1 - LIN, y0, z0], [x1 + th, y1, z1 + th], "wallR"),
    lb(lot, [x0, y0, z1 - LIN], [DOOR_X - DOOR_HW + 0.27, y1, z1 + th + 0.3], "wallFrontL"),
    lb(lot, [DOOR_X + DOOR_HW - 0.27, y0, z1 - LIN], [x1, y1, z1 + th + 0.3], "wallFrontR"),
  ];
};
export const OUR_CS: Box[] = [
  ...shellCS("home"),
  ...Array.from({ length: STAIRS.n }, (_, i) => lb("home", [STAIRS.x0, F, stepZ(i) - STAIRS.run / 2], [STAIRS.x1, stepTop(i), stepZ(i) + STAIRS.run / 2], `step${i}`)),
  lb("home", [COUCH.x0, F, COUCH.z0], [COUCH.x1, COUCH.seat, COUCH.z1], "seat"),
  lb("home", [COUCH.x1 - 0.9, F, COUCH.z0], [COUCH.x1, COUCH.seat + 2.6, COUCH.z1], "couchBack"),
  lb("home", [OTTOMAN.x0, F, OTTOMAN.z0], [OTTOMAN.x1, OTTOMAN.top, OTTOMAN.z1], "ottoman"),
  lb("home", [TV[0] - 0.8, F, TV[2] - 2.1], [TV[0] + 0.8, F + 1.8 + 3.0, TV[2] + 2.1], "tv"),
  lb("home", [LAMP_IN[0] - 0.7, F, LAMP_IN[2] - 0.7], [LAMP_IN[0] + 0.7, LAMP_IN[1] + 0.6, LAMP_IN[2] + 0.7], "lamp"),
];
export const BELL_CS: Box[] = [
  ...shellCS("bell"),
  lb("bell", [-9.2, F, 5.8], [-7.6, F + 6.8, 7.4], "coatStand"),
  lb("bell", [3.4, F, 0.4], [7.6, F + 3.9, 4.6], "armchair"),
  lb("bell", [7.4, F, 5.0], [9.0, F + 4.8, 6.6], "lampTable"),
];

// ---------------------------------------------------------------- the grocery aisle (beat 2)
/** The aisle runs along z at x = GX (centre), floor y 0, from z GZ0 to GZ1; shelves at x = GX +- 5.5. */
export const GX = 400, GZ0 = -30, GZ1 = 30, AISLE_HW = 5;
function grocery(k: Kit) {
  k.box("p09tile", [GX, -0.05, 0], [30, 0.1, 80]);
  k.box("p09ceil", [GX, 13.2, 0], [30, 0.2, 80]);
  k.box("p09wallS", [GX, 6.5, GZ0 - 1], [30, 13, 0.4]);
  k.box("p09wallS", [GX, 6.5, GZ1 + 6], [30, 13, 0.4]);
  for (const sx of [-1, 1]) k.box("p09wallS", [GX + sx * 15, 6.5, 0], [0.4, 13, 80]);
  for (let z = GZ0 + 4; z < GZ1; z += 8) k.box("p09panel", [GX, 13.05, z], [3, 0.08, 5]);
  const cols = ["p09pA", "p09pB", "p09pC", "p09pD", "p09pE", "p09pF", "p09pG"];
  let r = 7;
  const rr = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  for (const sx of [-1, 1]) {
    const x = GX + sx * (AISLE_HW + 1.6);
    k.box("p09shelf", [x + sx * 1.3, 4.5, 0], [0.3, 9, GZ1 - GZ0]); // back panel
    k.box("p09shelf", [x, 0.4, 0], [3.0, 0.8, GZ1 - GZ0]);
    for (const y of [2.6, 4.8, 7.0]) {
      k.box("p09shelf", [x, y, 0], [3.0, 0.15, GZ1 - GZ0]);
      k.box("p09pF", [x - sx * 1.5, y - 0.15, 0], [0.06, 0.3, GZ1 - GZ0]); // price strip
    }
    for (const y0 of [0.8, 2.675, 4.875, 7.075]) {
      for (let z = GZ0 + 0.6; z < GZ1 - 0.6;) {
        const w = 0.7 + rr() * 0.9, h = 1.0 + rr() * 0.9, c = cols[Math.floor(rr() * cols.length)];
        k.box(c, [x - sx * 0.2, y0 + h / 2, z + w / 2], [1.8, h, w - 0.08]);
        z += w;
      }
    }
  }
}
export const Grocery: React.FC = () => <Render b={useBuilt("p09grocery", grocery)} />;
export const GROCERY_CS: Box[] = [
  box([GX - AISLE_HW - 1.6 - 0.3, 4.5, 0], [3.6, 9, GZ1 - GZ0], "shelfL"),
  box([GX + AISLE_HW + 1.6 + 0.3, 4.5, 0], [3.6, 9, GZ1 - GZ0], "shelfR"),
];
/** A shopping cart (local: handle toward -z), as a group. */
export const Cart: React.FC<{ at: V3; yaw?: number; scale?: number }> = ({ at, yaw = 0, scale = 0.72 }) => {
  const b = useBuilt("p09cart", (k) => {
    k.box("p09cart", [0, 3.2, 0], [3.0, 0.1, 4.4]);
    for (const sx of [-1, 1]) k.box("p09cart", [sx * 1.5, 4.2, 0], [0.08, 2.0, 4.4]);
    k.box("p09cart", [0, 4.2, 2.2], [3.0, 2.0, 0.08]); k.box("p09cart", [0, 4.2, -2.2], [3.0, 2.0, 0.08]);
    for (let i = -3; i <= 3; i++) k.box("p09cart", [i * 0.45, 4.2, 0], [0.04, 2.0, 4.4]);
    k.tube("p09pA", [-1.6, 5.4, -2.9], [1.6, 5.4, -2.9], 0.12);
    for (const sx of [-1, 1]) { k.tube("p09cart", [sx * 1.4, 0.6, -2.0], [sx * 1.5, 5.4, -2.9], 0.07); k.tube("p09cart", [sx * 1.3, 0.6, 2.0], [sx * 1.4, 3.2, 2.0], 0.07); }
    for (const [sx, sz] of [[-1, -2], [1, -2], [-1, 2], [1, 2]]) k.geo("tyre", new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12), [sx * 1.3, 0.35, sz], new THREE.Euler(0, 0, Math.PI / 2));
    k.box("p09pB", [-0.5, 4.0, 0.6], [1.2, 1.4, 0.9]); k.box("p09pC", [0.6, 3.8, -0.8], [1.0, 1.0, 1.0]); k.box("p09pD", [0.4, 3.7, 1.2], [1.3, 0.8, 0.7]);
  });
  return <group position={at} rotation={[0, yaw, 0]} scale={scale}><Render b={b} /></group>;
};
/** A cereal box held in a hand (+y out of the fist). */
export const CerealBox: React.FC = () => (
  <group position={[0, 0.9, 0.1]}>
    <mesh><boxGeometry args={[1.0, 1.4, 0.35]} /><meshStandardMaterial color="#e8a21e" roughness={0.6} /></mesh>
    <mesh position={[0, 0.15, 0.18]}><boxGeometry args={[0.7, 0.5, 0.01]} /><meshStandardMaterial color="#c0392b" roughness={0.6} /></mesh>
  </group>
);
void useMemo;

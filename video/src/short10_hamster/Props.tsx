// Short 10 props (RIG UNITS, like the Classroom): the class cage with a removable FOOD DRAWER (a hamster-sized hole when it
// is out), tape across the door, a padlock; the two hamsters (Sir Nibbles, Peanut); backpacks; the phone; sunflower
// shells; the second nest; a magnifying glass and a notebook (held props); ME's bedroom at night with Peanut's cage.
//
// THE CAGE in its own frame: origin at the bottom centre, FRONT faces +z (door high on the front, drawer low on the front).
// In the classroom it sits on the shelf facing the room: <ClassCage /> places it (front facing -x). Use cagePoint(local)
// to get world points of the cage on the shelf (the drawer hole, the door seam) for cameras and hands.
import React from "react";
import * as THREE from "three";
import { mat, rep } from "../blocky/Textures";
import { SHELF, SHELF_BOX, ROOM } from "../blocky/Classroom";
import { box, boxMinMax, type Box } from "../blocky/Collide";

export type V3 = [number, number, number];
type M = THREE.MeshStandardMaterialParameters;
const c01 = (x: number) => Math.max(0, Math.min(1, x));
const col = (color: string, roughness = 0.6, extra: M = {}): M => ({ color, roughness, metalness: 0, ...extra });
const Bx: React.FC<{ p: V3; s: V3; m: M; r?: V3; c?: boolean }> = ({ p, s, m, r, c = true }) => (
  <mesh position={p} rotation={r} castShadow={c} receiveShadow><boxGeometry args={s} /><meshStandardMaterial {...m} /></mesh>
);
const canv = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const cache = new Map<string, THREE.Texture>();
const cached = (k: string, make: () => THREE.Texture) => { if (!cache.has(k)) cache.set(k, make()); return cache.get(k)!; };
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ───────────────────────────────────────────── cage ─────────────────────────────────────────────
export const CAGE = { w: 4.2, d: 2.2, base: 0.7, h: 2.9 } as const; // w along local x, d along local z (front at +d/2)
/** Drawer slot on the front of the base (local): centre x, width, height; the drawer is DRAWER_LEN deep. */
export const DRAWER = { x: 0.9, w: 1.1, y0: 0.12, h: 0.42, len: 1.5 } as const;
/** The door on the front (local): x0..x1, y0..y1. The seam (the door's free edge) is at x1. */
export const CAGE_DOOR = { x0: -1.5, x1: -0.3, y0: 1.2, y1: 2.5 } as const;

const barsTex = (n: number, color: string, bw = 5) => cached(`bars${n}${color}${bw}`, () => {
  const t = canv(256, 256, (g) => {
    g.clearRect(0, 0, 256, 256); g.fillStyle = color;
    for (let k = 0; k < n; k++) g.fillRect(Math.round((k / n) * 256), 0, bw, 256);
    g.fillRect(0, 0, 256, 6); g.fillRect(0, 250, 256, 6);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
});
/** A plane of wire bars (transparent between them). */
/** Thin-bar mode for close-ups (Short 10 lead): set by a Cage's `barW`. */
const BarW = React.createContext(5);
const Bars: React.FC<{ p: V3; w: number; h: number; r?: V3; color?: string; density?: number }> = ({ p, w, h, r, color = "#d8dde2", density = 6 }) => {
  const bw = React.useContext(BarW);
  const t = React.useMemo(() => { const x = barsTex(16, color, bw).clone(); x.needsUpdate = true; x.repeat.set((w * density) / 16, 1); return x; }, [w, color, density, bw]);
  return <mesh position={p} rotation={r}><planeGeometry args={[w, h]} /><meshStandardMaterial map={t} transparent alphaTest={0.4} side={THREE.DoubleSide} metalness={0.5} roughness={0.35} /></mesh>;
};

export type CageProps = {
  /** the food drawer: 0 = in, 1 = pulled fully out (still held at the slot), null = gone (carried away: the hole shows) */
  drawer?: number | null;
  /** wheel angle (radians); spin it with t */
  wheel?: number;
  /** tape across the door seam: 0 = none, 0..1 = being stuck on (length), 1 = on */
  tape?: number;
  /** a padlock on the door */
  lock?: boolean;
  /** base colour (class cage blue, Peanut's cage pink) */
  color?: string;
  /** side door open (Peanut's cage at home; on the local -x side) */
  sideDoorOpen?: boolean;
  /** draw the second nest of shredded paper (Peanut's cage) */
  nest2?: boolean;
  /** bar width in texture px (default 5); 2 for close-ups through the bars */
  barW?: number;
  /** Peanut's first nest (by the hut, back-right corner) */
  nest1?: boolean;
  /** hide the swung-open side door panel (a clue close-up where it would sit in front of the nest) */
  hideSideDoor?: boolean;
  /** scale of the second nest (default 1) */
  nestScale?: number;
  /** children drawn in the cage's local frame (a hamster inside: y = CAGE.base is the bedding floor) */
  children?: React.ReactNode;
};
/** The cage in its own frame (origin bottom centre, front +z). */
export const Cage: React.FC<CageProps> = ({ barW = 5, ...p }) => <BarW.Provider value={barW}><CageInner {...p} /></BarW.Provider>;
const CageInner: React.FC<CageProps> = ({ drawer = 0, wheel = 0, tape = 1, lock = true, color = "#3f8fd0", sideDoorOpen = false, nest2 = false, nest1 = false, nestScale = 1, hideSideDoor = false, children }) => {
  const { w, d, base, h } = CAGE, plastic = col(color, 0.35);
  const hx0 = DRAWER.x - DRAWER.w / 2, hx1 = DRAWER.x + DRAWER.w / 2;
  const dz = drawer === null ? null : c01(drawer) * DRAWER.len;
  return <group>
    {/* base tray: back, sides, floor; the front with the drawer slot */}
    <Bx p={[0, 0.06, 0]} s={[w, 0.12, d]} m={plastic} />
    <Bx p={[0, base / 2, -d / 2 + 0.06]} s={[w, base, 0.12]} m={plastic} />
    <Bx p={[-w / 2 + 0.06, base / 2, 0]} s={[0.12, base, d]} m={plastic} />
    <Bx p={[w / 2 - 0.06, base / 2, 0]} s={[0.12, base, d]} m={plastic} />
    <Bx p={[(-w / 2 + hx0) / 2, base / 2, d / 2 - 0.06]} s={[hx0 + w / 2, base, 0.12]} m={plastic} />
    <Bx p={[(hx1 + w / 2) / 2, base / 2, d / 2 - 0.06]} s={[w / 2 - hx1, base, 0.12]} m={plastic} />
    <Bx p={[DRAWER.x, (DRAWER.y0 + DRAWER.h + base) / 2, d / 2 - 0.06]} s={[DRAWER.w, base - DRAWER.y0 - DRAWER.h, 0.12]} m={plastic} />
    {/* the slot's dark tunnel (seen when the drawer is out) with a bedding floor: the hamster path */}
    <Bx p={[DRAWER.x, DRAWER.y0 + 0.02, d / 2 - DRAWER.len / 2]} s={[DRAWER.w - 0.04, 0.04, DRAWER.len]} m={col("#2a2018", 0.95)} c={false} />
    <Bx p={[DRAWER.x, DRAWER.y0 + DRAWER.h + 0.03, d / 2 - DRAWER.len / 2]} s={[DRAWER.w, 0.06, DRAWER.len]} m={col("#1a1410", 0.95)} c={false} />
    {/* bedding floor above the drawer level (the drawer runs under it; the hole goes up into the cage at its back end) */}
    <Bx p={[0, base - 0.08, 0]} s={[w - 0.24, 0.1, d - 0.24]} m={col("#e9d9a8", 1)} />
    <Bx p={[DRAWER.x, base - 0.02, d / 2 - DRAWER.len + 0.3]} s={[DRAWER.w - 0.2, 0.06, 0.5]} m={col("#140e0a", 1)} c={false} />
    {Array.from({ length: 40 }, (_, k) => <Bx key={k} p={[(rnd(k) - 0.5) * (w - 0.5), base - 0.01, (rnd(k + 50) - 0.5) * (d - 0.5)]} s={[0.22, 0.05, 0.08]} r={[0, rnd(k + 9) * 3, 0]} m={col(rnd(k + 3) > 0.5 ? "#f2e6c0" : "#d8c08a", 1)} c={false} />)}
    {/* the drawer itself (a tray with a handle and food) */}
    {dz !== null && <group position={[DRAWER.x, DRAWER.y0, d / 2 - DRAWER.len / 2 + dz]}>
      <DrawerTray />
    </group>}
    {/* bars: back, sides, roof, front (around the door) */}
    <Bars p={[0, base + (h - base) / 2, -d / 2 + 0.05]} w={w} h={h - base} />
    {!sideDoorOpen && <Bars p={[-w / 2 + 0.05, base + (h - base) / 2, 0]} w={d} h={h - base} r={[0, Math.PI / 2, 0]} />}
    {sideDoorOpen && <>
      <Bars p={[-w / 2 + 0.05, base + (h - base) / 2 + 0.45, 0]} w={d} h={h - base - 0.9} r={[0, Math.PI / 2, 0]} />
      {!hideSideDoor && <group position={[-w / 2 + 0.05, base, d / 2 - 0.2]} rotation={[0, -1.9, 0]}><Bars p={[0, 0.45, -0.7]} w={1.4} h={0.9} r={[0, Math.PI / 2, 0]} color="#f0c0d0" /></group>}
    </>}
    <Bars p={[w / 2 - 0.05, base + (h - base) / 2, 0]} w={d} h={h - base} r={[0, Math.PI / 2, 0]} />
    <Bars p={[0, h, 0]} w={w} h={d} r={[Math.PI / 2, 0, 0]} />
    <Bars p={[(-w / 2 + CAGE_DOOR.x0) / 2, base + (h - base) / 2, d / 2 - 0.05]} w={CAGE_DOOR.x0 + w / 2} h={h - base} />
    <Bars p={[(CAGE_DOOR.x1 + w / 2) / 2, base + (h - base) / 2, d / 2 - 0.05]} w={w / 2 - CAGE_DOOR.x1} h={h - base} />
    <Bars p={[(CAGE_DOOR.x0 + CAGE_DOOR.x1) / 2, (base + CAGE_DOOR.y0) / 2, d / 2 - 0.05]} w={CAGE_DOOR.x1 - CAGE_DOOR.x0} h={CAGE_DOOR.y0 - base} />
    <Bars p={[(CAGE_DOOR.x0 + CAGE_DOOR.x1) / 2, (CAGE_DOOR.y1 + h) / 2, d / 2 - 0.05]} w={CAGE_DOOR.x1 - CAGE_DOOR.x0} h={h - CAGE_DOOR.y1} />
    {/* the door: a framed bar panel, slightly proud */}
    <group position={[(CAGE_DOOR.x0 + CAGE_DOOR.x1) / 2, (CAGE_DOOR.y0 + CAGE_DOOR.y1) / 2, d / 2 + 0.02]}>
      <Bars p={[0, 0, 0]} w={CAGE_DOOR.x1 - CAGE_DOOR.x0} h={CAGE_DOOR.y1 - CAGE_DOOR.y0} color="#eef2f4" density={8} />
      {[[0, (CAGE_DOOR.y1 - CAGE_DOOR.y0) / 2], [0, -(CAGE_DOOR.y1 - CAGE_DOOR.y0) / 2]].map(([x, y], k) => <Bx key={k} p={[x, y, 0]} s={[CAGE_DOOR.x1 - CAGE_DOOR.x0, 0.07, 0.07]} m={col("#eef2f4", 0.3, { metalness: 0.6 })} />)}
      {[-1, 1].map((k) => <Bx key={`v${k}`} p={[k * (CAGE_DOOR.x1 - CAGE_DOOR.x0) / 2, 0, 0]} s={[0.07, CAGE_DOOR.y1 - CAGE_DOOR.y0, 0.07]} m={col("#eef2f4", 0.3, { metalness: 0.6 })} />)}
    </group>
    {/* tape: two strips across the door seam (the free edge at x1) */}
    {tape > 0 && [0.35, 0.95].map((yy, k) => {
      const L = 0.9 * c01(tape * 1.3 - k * 0.3);
      return L > 0.01 ? <Bx key={k} p={[CAGE_DOOR.x1 - 0.45 + L / 2, CAGE_DOOR.y0 + yy, d / 2 + 0.09]} s={[L, 0.24, 0.03]} m={col("#e8dcb0", 0.5, { emissive: new THREE.Color("#4a4230"), emissiveIntensity: 0.25 })} c={false} /> : null;
    })}
    {lock && <group position={[CAGE_DOOR.x1 + 0.12, CAGE_DOOR.y0 + 0.65, d / 2 + 0.16]}>
      <Bx p={[0, 0, 0]} s={[0.3, 0.3, 0.12]} m={col("#d8a830", 0.3, { metalness: 0.7 })} />
      <mesh position={[0, 0.2, 0]}><torusGeometry args={[0.1, 0.03, 8, 16, Math.PI]} /><meshStandardMaterial color="#c8c8c8" metalness={0.8} roughness={0.3} /></mesh>
    </group>}
    {/* inside: the wheel, a hut, a water bottle, a food bowl */}
    <group position={[-1.1, base, -0.35]}>
      <Bx p={[0, 0.5, -0.45]} s={[0.12, 1.0, 0.12]} m={col("#c8c8c8", 0.3, { metalness: 0.6 })} />
      <group position={[0, 0.78, 0]} rotation={[0, 0, wheel]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.72, 0.72, 0.55, 24, 1, true]} /><meshStandardMaterial color="#f0a030" side={THREE.DoubleSide} roughness={0.4} /></mesh>
        <mesh position={[0, 0, -0.28]}><circleGeometry args={[0.72, 24]} /><meshStandardMaterial color="#f6c060" side={THREE.DoubleSide} /></mesh>
        <Bx p={[0, 0.55, 0]} s={[0.14, 0.3, 0.5]} m={col("#d07a20", 0.5)} />
      </group>
    </group>
    <group position={[1.2, base, -0.4]}><Bx p={[0, 0.35, 0]} s={[1.0, 0.7, 0.9]} m={col("#e86a4a", 0.6)} /><Bx p={[0, 0.25, 0.45]} s={[0.45, 0.45, 0.04]} m={col("#2a1a12", 0.9)} c={false} /></group>
    <group position={[w / 2 - 0.2, base + 1.3, -0.3]}><mesh rotation={[0, 0, 0.15]}><cylinderGeometry args={[0.16, 0.16, 0.9, 16]} /><meshStandardMaterial color="#bfe4ff" transparent opacity={0.7} roughness={0.1} /></mesh></group>
    {nest2 && <Nest p={[-w / 2 + 0.6, base, d / 2 - 0.6]} s={nestScale} glow={nestScale !== 1} />}
    {nest1 && <Nest p={[0.6, base, -d / 2 + 0.45]} s={0.8} tint="#d8c08a" shell={false} />}
    {children}
  </group>;
};
/** The food drawer tray (origin at its bottom front centre-ish: centred on its own box), with a handle and pellets. */
export const DrawerTray: React.FC = () => <group>
  <Bx p={[0, DRAWER.h / 2, 0]} s={[DRAWER.w - 0.06, DRAWER.h - 0.02, DRAWER.len]} m={col("#f2d24a", 0.4)} />
  <Bx p={[0, DRAWER.h / 2, DRAWER.len / 2 + 0.06]} s={[0.5, 0.12, 0.12]} m={col("#c89a20", 0.4)} />
  {Array.from({ length: 10 }, (_, k) => <Bx key={k} p={[(rnd(k + 70) - 0.5) * 0.8, DRAWER.h + 0.02, (rnd(k + 80) - 0.5) * 1.2]} s={[0.12, 0.08, 0.12]} m={col(k % 3 ? "#a07040" : "#3a3a3a", 0.8)} c={false} />)}
</group>;

/** The class cage sits on the shelf, front facing the room (-x). Local cage frame -> world. */
const CAGE_YAW = -Math.PI / 2;
export const CAGE_POS: V3 = [SHELF_BOX.x0 + CAGE.d / 2 + 0.15, SHELF_BOX.top, SHELF[2]];
export const cagePoint = (l: V3): V3 => [CAGE_POS[0] - l[2], CAGE_POS[1] + l[1], CAGE_POS[2] + l[0]];
// (rotation y by -PI/2 maps local +z -> world -x and local +x -> world +z; checked with the drawer hole below)
/** World: the drawer hole's mouth (centre of the slot on the cage front), the door seam, the cage top centre. */
export const HOLE: V3 = cagePoint([DRAWER.x, DRAWER.y0 + DRAWER.h / 2, CAGE.d / 2]);
export const SEAM: V3 = cagePoint([CAGE_DOOR.x1, (CAGE_DOOR.y0 + CAGE_DOOR.y1) / 2, CAGE.d / 2 + 0.1]);
export const CAGE_CENTER: V3 = cagePoint([0, CAGE.h / 2, 0]);
export const ClassCage: React.FC<CageProps> = (p) => <group position={CAGE_POS} rotation={[0, CAGE_YAW, 0]}><Cage {...p} /></group>;
export const CAGE_CS: Box[] = [boxMinMax([CAGE_POS[0] - CAGE.d / 2, SHELF_BOX.top, CAGE_POS[2] - CAGE.w / 2], [CAGE_POS[0] + CAGE.d / 2, SHELF_BOX.top + CAGE.h, CAGE_POS[2] + CAGE.w / 2], "cage")];

// ───────────────────────────────────────────── hamsters ─────────────────────────────────────────────
export type HamsterLook = { fur: string; belly: string; bow?: string };
export const NIBBLES: HamsterLook = { fur: "#d9963e", belly: "#f6e2bc" };
export const PEANUT: HamsterLook = { fur: "#f4f1ea", belly: "#ffffff", bow: "#f07aa8" };
/** A blocky toy hamster (about 0.9 long, 0.6 tall), facing +z. walk = a phase (radians) for the tiny steps; cheeks 0..1
 *  puffs them up; look = head yaw; curl = curled up asleep (0..1). */
export const Hamster: React.FC<{ look: HamsterLook; p?: V3; yaw?: number; walk?: number; cheeks?: number; lookYaw?: number; curl?: number; s?: number; blink?: number }> = ({ look, p = [0, 0, 0], yaw = 0, walk, cheeks = 0, lookYaw = 0, curl = 0, s = 1, blink = 0 }) => {
  const step = walk !== undefined ? Math.sin(walk) : 0, bob = walk !== undefined ? Math.abs(Math.sin(walk)) * 0.04 : 0;
  const fur = col(look.fur, 0.85), belly = col(look.belly, 0.9), pink = col("#f2a0a8", 0.6), dark = col("#141014", 0.3);
  return <group position={p} rotation={[0, yaw, 0]} scale={[s, s * (1 - curl * 0.25), s]}>
    <group position={[0, bob, 0]}>
      <Bx p={[0, 0.32, -0.05]} s={[0.62, 0.5, 0.78]} m={fur} />
      <Bx p={[0, 0.22, 0.02]} s={[0.5, 0.3, 0.7]} m={belly} />
      <group position={[0, 0.38, 0.32]} rotation={[0, lookYaw, 0]}>
        <Bx p={[0, 0, 0.12]} s={[0.52, 0.42, 0.36]} m={fur} />
        {[-1, 1].map((k) => <Bx key={k} p={[k * (0.24 + cheeks * 0.06), -0.06, 0.16]} s={[0.12 + cheeks * 0.14, 0.2 + cheeks * 0.1, 0.24 + cheeks * 0.08]} m={col(cheeks > 0.3 ? look.belly : look.fur, 0.85)} />)}
        <Bx p={[0, -0.04, 0.31]} s={[0.24, 0.16, 0.06]} m={belly} />
        <Bx p={[0, 0.0, 0.345]} s={[0.07, 0.05, 0.03]} m={pink} c={false} />
        {[-1, 1].map((k) => <Bx key={`e${k}`} p={[k * 0.13, 0.08, 0.305]} s={[0.07, 0.09 * (1 - blink * 0.85), 0.02]} m={dark} c={false} />)}
        {[-1, 1].map((k) => <Bx key={`r${k}`} p={[k * 0.17, 0.24, 0.0]} s={[0.12, 0.14, 0.06]} m={pink} />)}
        {look.bow && <group position={[0.14, 0.26, 0.04]} rotation={[0, 0, 0.3]}>
          <Bx p={[-0.07, 0, 0]} s={[0.12, 0.1, 0.05]} m={col(look.bow, 0.5)} /><Bx p={[0.07, 0, 0]} s={[0.12, 0.1, 0.05]} m={col(look.bow, 0.5)} /><Bx p={[0, 0, 0.01]} s={[0.05, 0.06, 0.06]} m={col(look.bow, 0.4)} />
        </group>}
      </group>
      {[[-0.2, 0.22], [0.2, 0.22], [-0.2, -0.3], [0.2, -0.3]].map(([x, z], k) => <Bx key={`f${k}`} p={[x, 0.05, z + (k % 3 === 0 ? step : -step) * 0.06]} s={[0.12, 0.1, 0.14]} m={pink} />)}
      <Bx p={[0, 0.3, -0.47]} s={[0.08, 0.08, 0.08]} m={pink} />
    </group>
  </group>;
};

// ───────────────────────────────────────────── backpacks ─────────────────────────────────────────────
const stripeTex = (a: string, b: string) => cached(`stripe${a}${b}`, () => canv(64, 64, (g) => { g.fillStyle = a; g.fillRect(0, 0, 64, 64); g.fillStyle = b; for (let y = 0; y < 64; y += 16) g.fillRect(0, y, 64, 8); }));
/** A kid's backpack standing on the floor, front (pocket) facing +z. ~1.3 wide, 1.7 tall, 0.75 deep.
 *  open 0..1 opens the front pocket's top flap (the hole the hamster drops into); wiggle 0..1 shakes the pocket (midnight). */
export const Backpack: React.FC<{ p?: V3; yaw?: number; color?: string; stripe?: string; open?: number; wiggle?: number; t?: number; tip?: number }> = ({ p = [0, 0, 0], yaw = 0, color = "#d8483a", stripe, open = 0, wiggle = 0, t = 0, tip = 0 }) => {
  const body: M = stripe ? { map: stripeTex(color, stripe), roughness: 0.85 } : col(color, 0.85);
  const wg = wiggle * Math.sin(t * 38) * 0.05;
  return <group position={p} rotation={[0, yaw, 0]}>
    <group rotation={[tip, 0, 0]}>
      <Bx p={[0, 0.85, 0]} s={[1.3, 1.7, 0.75]} m={body} />
      <Bx p={[0, 1.72, 0]} s={[1.18, 0.12, 0.62]} m={col("#2a2a30", 0.7)} />
      <Bx p={[0, 2.02, -0.1]} s={[0.5, 0.08, 0.12]} m={col("#2a2a30", 0.7)} />
      {/* front pocket: a box with an open top flap */}
      <group position={[wg, 0, 0]}>
        <Bx p={[0, 0.55, 0.52]} s={[1.0, 0.9, 0.32]} m={col(stripe ? "#f6f2e8" : "#ffffff", 0.85, { color: stripe ? "#f6f2e8" : new THREE.Color(color).multiplyScalar(0.8).getStyle() })} />
        {open > 0.05 && <Bx p={[0, 0.99, 0.52]} s={[0.84, 0.03, 0.22]} m={col("#120c08", 1)} c={false} />}
        <group position={[0, 1.0, 0.68]} rotation={[-open * 1.9, 0, 0]}><Bx p={[0, 0, -0.16]} s={[1.0, 0.06, 0.34]} m={col(color, 0.85)} /></group>
      </group>
      {[-1, 1].map((k) => <Bx key={k} p={[k * 0.42, 0.9, -0.44]} s={[0.18, 1.3, 0.1]} m={col("#2a2a30", 0.7)} />)}
    </group>
  </group>;
};
/** ME's backpack: the striped one. */
export const ME_BAG = { color: "#2f6fc8", stripe: "#f2c81e" } as const;
/** The row of backpacks on the floor in front of the shelf (world), ME's right under the drawer hole. */
export const BAG_ROW: { p: V3; color: string; stripe?: string; me?: boolean }[] = [
  { p: [18.4, 0, HOLE[2] - 4.6], color: "#d8483a" },
  { p: [18.4, 0, HOLE[2] - 3.0], color: "#3aa06a" },
  { p: [18.4, 0, HOLE[2] - 1.45], color: "#8a5ac8" },
  { p: [18.4, 0, HOLE[2]], color: ME_BAG.color, stripe: ME_BAG.stripe, me: true },
  { p: [18.4, 0, HOLE[2] + 1.55], color: "#e8b02a" },
  { p: [18.4, 0, HOLE[2] + 3.1], color: "#e86aa0" },
];
export const BagRow: React.FC<{ meOpen?: number; only?: boolean }> = ({ meOpen = 1 }) => <>{BAG_ROW.map((b, k) => <Backpack key={k} p={b.p} yaw={-Math.PI / 2} color={b.color} stripe={b.stripe} open={b.me ? meOpen : 0} />)}</>;
export const BAG_CS: Box[] = BAG_ROW.map((b) => box([b.p[0], 0.9, b.p[2]], [0.8, 1.8, 1.35], "bag"));
/** Where a hamster lands in ME's bag pocket (world). */
export const POCKET: V3 = [18.4 - 0.52, 0.99, HOLE[2]];

// ───────────────────────────────────────────── small props ─────────────────────────────────────────────
/** Sunflower shells (striped seeds) scattered around p within radius r. */
export const Shells: React.FC<{ p: V3; r?: number; n?: number; seed?: number; spill?: number }> = ({ p, r = 0.8, n = 14, seed = 0, spill = 1 }) => <group position={p}>
  {Array.from({ length: n }, (_, k) => {
    const a = rnd(k + seed) * Math.PI * 2, d = Math.sqrt(rnd(k * 3 + seed)) * r * spill;
    return <group key={k} position={[Math.cos(a) * d, 0.04, Math.sin(a) * d]} rotation={[0, rnd(k * 7 + seed) * 6, 0]}>
      <Bx p={[0, 0, 0]} s={[0.15, 0.05, 0.075]} m={col("#2c2a2a", 0.6)} c={false} />
      <Bx p={[0, 0.026, 0]} s={[0.13, 0.01, 0.02]} m={col("#e8e4d8", 0.6)} c={false} />
    </group>;
  })}
</group>;
/** A nest of shredded paper (a mound of white/cream strips), with a shell on top. */
export const Nest: React.FC<{ p: V3; s?: number; tint?: string; shell?: boolean; glow?: boolean }> = ({ p, s = 1, tint, shell = true, glow = false }) => <group position={p} scale={s}>
  {Array.from({ length: 26 }, (_, k) => <Bx key={k} p={[(rnd(k + 5) - 0.5) * 0.8, 0.05 + rnd(k + 1) * 0.28, (rnd(k + 15) - 0.5) * 0.8]} s={[0.4, 0.04, 0.09]} r={[rnd(k) * 0.8, rnd(k + 2) * 3, rnd(k + 4) * 0.8]} m={col(tint ?? (k % 3 ? "#f6f2e6" : "#e8dcc0"), 1, !glow ? {} : { emissive: new THREE.Color("#fff6e0"), emissiveIntensity: 0.18 })} c={false} />)}
  {shell && <group position={[0.15, 0.36, 0.05]} rotation={[0, 0.6, 0]}><Bx p={[0, 0, 0]} s={[0.15, 0.05, 0.075]} m={col("#2c2a2a", 0.6)} c={false} /><Bx p={[0, 0.026, 0]} s={[0.13, 0.01, 0.02]} m={col("#e8e4d8", 0.6)} c={false} /></group>}
</group>;
/** Held: a magnifying glass (in the hand frame: +z down the arm, +y out of the palm). */
export const Magnifier: React.FC = () => <group>
  <Bx p={[0, 0, 0.2]} s={[0.16, 0.16, 0.6]} m={col("#4a2a14", 0.6)} />
  <group position={[0, 0, 0.95]}><mesh rotation={[0, 0, 0]}><torusGeometry args={[0.4, 0.06, 8, 24]} /><meshStandardMaterial color="#2a2a30" metalness={0.5} roughness={0.3} /></mesh>
    <mesh><circleGeometry args={[0.38, 24]} /><meshStandardMaterial color="#cfe8ff" transparent opacity={0.35} side={THREE.DoubleSide} roughness={0.05} /></mesh></group>
</group>;
/** Held: ME's detective notebook. */
export const Notebook: React.FC = () => <group position={[0, 0.1, 0.3]}>
  <Bx p={[0, 0, 0]} s={[0.7, 0.12, 0.9]} m={col("#c8302a", 0.7)} />
  <Bx p={[0, 0.07, 0]} s={[0.64, 0.03, 0.84]} m={col("#f6f4ee", 0.9)} />
</group>;
/** Held: Maya's key on its lanyard (swinging: swing in radians). */
export const KeyLanyard: React.FC<{ swing?: number }> = ({ swing = 0 }) => <group rotation={[swing, 0, 0]}>
  <Bx p={[0, 0, 0.45]} s={[0.05, 0.05, 0.9]} m={col("#9a4ad8", 0.6)} />
  <group position={[0, 0, 0.95]}><Bx p={[0, 0, 0]} s={[0.22, 0.06, 0.22]} m={col("#d8b04a", 0.3, { metalness: 0.8 })} /><Bx p={[0, 0, 0.22]} s={[0.07, 0.05, 0.3]} m={col("#d8b04a", 0.3, { metalness: 0.8 })} /></group>
</group>;
/** Held: a roll of tape. */
export const TapeRoll: React.FC = () => <group position={[0, 0.15, 0.1]}><mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.2, 0.08, 8, 16]} /><meshStandardMaterial color="#e8dcb0" roughness={0.5} /></mesh></group>;
/** Held: a sponge / the drawer carried in one hand is drawn by the shot (DrawerTray). */
export const Sponge: React.FC = () => <Bx p={[0, 0.15, 0.1]} s={[0.5, 0.3, 0.35]} m={col("#f2d03a", 0.9)} />;

/** The phone (a small slab, screen +z). screen: "rec" = a red REC dot + time, "play" = a play triangle, or a texture node. */
const phoneTex = (kind: string) => cached(`phone${kind}`, () => canv(128, 256, (g) => {
  g.fillStyle = "#101418"; g.fillRect(0, 0, 128, 256);
  if (kind === "rec") { g.fillStyle = "#3a4a5a"; g.fillRect(6, 30, 116, 190); g.fillStyle = "#e02a2a"; g.beginPath(); g.arc(24, 18, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = "#fff"; g.font = "bold 16px sans-serif"; g.fillText("REC", 38, 24); g.beginPath(); g.arc(64, 236, 12, 0, Math.PI * 2); g.fillStyle = "#e02a2a"; g.fill(); }
  if (kind === "play") { g.fillStyle = "#3a4a5a"; g.fillRect(6, 30, 116, 190); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(48, 100); g.lineTo(88, 125); g.lineTo(48, 150); g.fill(); }
}));
export const Phone: React.FC<{ p?: V3; r?: V3; screen?: "rec" | "play" | "off" }> = ({ p = [0, 0, 0], r, screen = "rec" }) => <group position={p} rotation={r}>
  <Bx p={[0, 0, 0]} s={[0.55, 1.1, 0.07]} m={col("#1a1c20", 0.3, { metalness: 0.4 })} />
  <mesh position={[0, 0, 0.037]}><planeGeometry args={[0.5, 1.0]} /><meshBasicMaterial map={phoneTex(screen)} toneMapped={false} /></mesh>
</group>;
/** A stack of books with the phone propped on top facing `yaw` (the recording set-up). */
export const BookStack: React.FC<{ p: V3; yaw?: number; phone?: boolean }> = ({ p, yaw = 0, phone = true }) => <group position={p} rotation={[0, yaw, 0]}>
  {["#c84a3a", "#3a6ab0", "#e8b02a", "#3a8a5a"].map((c, k) => <Bx key={k} p={[(rnd(k) - 0.5) * 0.15, 0.13 + k * 0.26, 0]} s={[1.3 - k * 0.08, 0.24, 0.95 - k * 0.04]} r={[0, (rnd(k + 3) - 0.5) * 0.2, 0]} m={col(c, 0.7)} />)}
  {phone && <Phone p={[0, 1.04 + 0.5, 0.05]} r={[-0.12, 0, 0]} screen="rec" />}
</group>;

// ───────────────────────────────────────────── ME's bedroom (night) ─────────────────────────────────────────────
// Room x -12..12, z -10..10, height 11. The bed against the back wall (z = -10) on the left; ME's desk on the right wall
// with Peanut's cage on it (front facing -x, into the room); a window (night) on the back wall; a bedside table with a
// digital clock; a rug. The backpack goes on the floor next to the desk.
export const BED_ROOM = { x0: -12, x1: 12, z0: -10, z1: 10, h: 11 } as const;
export const BED = { x0: -11.6, x1: -4.6, z0: -9.6, z1: 1, top: 2.0 } as const;
/** Lying in bed: origin for a lying character (the shot rotates the character); sitting up: the seat spot on the bed. */
export const BED_SIT: V3 = [-8.1, 2.0, -4];
export const DESK_H = 3.0;
export const HOME_DESK = { x0: 8.6, x1: 12, z0: -6, z1: 2 } as const;
export const PCAGE_POS: V3 = [(HOME_DESK.x0 + HOME_DESK.x1) / 2, DESK_H, (HOME_DESK.z0 + HOME_DESK.z1) / 2];
/** Peanut's cage: local -> world (front facing -x like the class cage). */
export const pcagePoint = (l: V3): V3 => [PCAGE_POS[0] - l[2] * 0.8, PCAGE_POS[1] + l[1] * 0.8, PCAGE_POS[2] + l[0] * 0.8];
/** The backpack spot on the floor next to the desk (world), facing the room (yaw -PI/2 like the class row). */
export const HOME_BAG: V3 = [7.2, 0, PCAGE_POS[2] + 1.0];
export const BEDSIDE_CLOCK: V3 = [-3.3, 2.6 + 0.3, -8.6];
export const BEDROOM_CS: Box[] = [
  boxMinMax([BED.x0, 0, BED.z0], [BED.x1, BED.top, BED.z1], "bed"),
  boxMinMax([BED.x0, 0, BED.z0 - 0.4], [BED.x1, 4.2, BED.z0], "headboard"),
  boxMinMax([HOME_DESK.x0, DESK_H - 0.25, HOME_DESK.z0], [HOME_DESK.x1, DESK_H, HOME_DESK.z1], "desk"),
  boxMinMax([HOME_DESK.x0 + 0.2, 0, HOME_DESK.z0], [HOME_DESK.x1, DESK_H, HOME_DESK.z0 + 0.4], "deskLeg"),
  boxMinMax([HOME_DESK.x0 + 0.2, 0, HOME_DESK.z1 - 0.4], [HOME_DESK.x1, DESK_H, HOME_DESK.z1], "deskLeg"),
  boxMinMax([-4.2, 0, -9.8], [-2.4, 2.6, -7.6], "bedside"),
  boxMinMax([BED_ROOM.x0 - 0.5, 0, BED_ROOM.z0 - 0.5], [BED_ROOM.x1 + 0.5, BED_ROOM.h, BED_ROOM.z0], "wall"),
  boxMinMax([BED_ROOM.x1, 0, BED_ROOM.z0], [BED_ROOM.x1 + 0.5, BED_ROOM.h, BED_ROOM.z1], "wall"),
  boxMinMax([BED_ROOM.x0 - 0.5, 0, BED_ROOM.z0], [BED_ROOM.x0, BED_ROOM.h, BED_ROOM.z1], "wall"),
];
const nightTex = () => cached("night10", () => canv(256, 256, (g) => {
  const sky = g.createLinearGradient(0, 0, 0, 256); sky.addColorStop(0, "#0a1230"); sky.addColorStop(1, "#22386e"); g.fillStyle = sky; g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(255,250,220,0.9)"; for (let i = 0; i < 30; i++) g.fillRect(rnd(i) * 256, rnd(i + 9) * 150, 1.6, 1.6);
  g.fillStyle = "#f4f0d8"; g.beginPath(); g.arc(190, 60, 20, 0, Math.PI * 2); g.fill(); g.fillStyle = "#0e1838"; g.beginPath(); g.arc(200, 54, 18, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#141c34"; g.fillRect(0, 180, 256, 76); g.fillStyle = "#1c2440"; g.fillRect(30, 140, 90, 50); g.fillStyle = "#ffcf7a"; g.fillRect(50, 155, 16, 18);
}));
const digitTex = (txt: string) => cached(`dig${txt}`, () => canv(256, 96, (g) => {
  g.fillStyle = "#0a0a0c"; g.fillRect(0, 0, 256, 96); g.fillStyle = "#ff3a2a"; g.font = "bold 70px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 128, 50);
}));
/** The bedside digital clock showing `time` ("11:59", "12:00"). */
export const DigitalClock: React.FC<{ p?: V3; time: string; yaw?: number }> = ({ p = BEDSIDE_CLOCK, time, yaw = 0.4 }) => <group position={p} rotation={[0, yaw, 0]}>
  <Bx p={[0, 0, 0]} s={[1.0, 0.55, 0.4]} m={col("#26282c", 0.4)} />
  <mesh position={[0, 0, 0.205]}><planeGeometry args={[0.9, 0.36]} /><meshBasicMaterial map={digitTex(time)} toneMapped={false} /></mesh>
</group>;
export type BedroomProps = { lamp?: boolean; peanutCage?: React.ReactNode; clock?: string; children?: React.ReactNode };
/** ME's bedroom at night. Light it with <BlockLights time="interiorNight" practicalAt={...} focus={...} />. */
export const Bedroom: React.FC<BedroomProps> = ({ lamp = true, peanutCage, clock = "11:59" }) => {
  const R = BED_ROOM, W = R.x1 - R.x0, D = R.z1 - R.z0;
  const wall = (w: number, h: number): M => ({ ...(mat("wallpaper", "#8aa6c8", rep("wallpaper", w, h)) as M) });
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[W, D]} /><meshStandardMaterial {...(mat("wood", "#a87a4a", rep("wood", W, D)) as M)} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -1]} receiveShadow><planeGeometry args={[9, 6]} /><meshStandardMaterial {...(mat("carpet", "#c86a4a", rep("carpet", 9, 6)) as M)} /></mesh>
    {/* back wall with the window */}
    <Bx p={[(R.x0 - 4) / 2 - 0.0, R.h / 2, R.z0 - 0.25]} s={[(-4) - R.x0 + 0.5, R.h, 0.5]} m={wall(10, R.h)} c={false} />
    <Bx p={[(4 + R.x1) / 2, R.h / 2, R.z0 - 0.25]} s={[R.x1 - 4 + 0.5, R.h, 0.5]} m={wall(10, R.h)} c={false} />
    <Bx p={[0, 1.9, R.z0 - 0.25]} s={[8, 3.8, 0.5]} m={wall(8, 4)} c={false} />
    <Bx p={[0, (9.4 + R.h) / 2, R.z0 - 0.25]} s={[8, R.h - 9.4, 0.5]} m={wall(8, 2)} c={false} />
    <mesh position={[0, 6.6, R.z0 - 0.45]}><planeGeometry args={[8, 5.6]} /><meshBasicMaterial map={nightTex()} toneMapped={false} /></mesh>
    {[[0, 3.8, 8.4, 0.3], [0, 9.4, 8.4, 0.3]].map(([x, y, w, h], k) => <Bx key={k} p={[x, y, R.z0 + 0.05]} s={[w, h, 0.3]} m={col("#f4f0e6", 0.4)} />)}
    {[-4.05, 0, 4.05].map((x, k) => <Bx key={`m${k}`} p={[x, 6.6, R.z0 + 0.05]} s={[k === 1 ? 0.2 : 0.3, 5.6, 0.3]} m={col("#f4f0e6", 0.4)} />)}
    {/* side walls */}
    <Bx p={[R.x0 - 0.25, R.h / 2, 0]} s={[0.5, R.h, D]} m={wall(D, R.h)} c={false} />
    <Bx p={[R.x1 + 0.25, R.h / 2, 0]} s={[0.5, R.h, D]} m={wall(D, R.h)} c={false} />
    {/* a poster and a star chart */}
    <mesh position={[R.x0 + 0.02, 7, -3]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[3, 4]} /><meshStandardMaterial color="#2a3a6a" /></mesh>
    {/* bed */}
    <Bx p={[(BED.x0 + BED.x1) / 2, 0.6, (BED.z0 + BED.z1) / 2]} s={[BED.x1 - BED.x0, 1.2, BED.z1 - BED.z0]} m={(mat("wood", "#7a4e2c", rep("wood", 7, 1.2)) as M)} />
    <Bx p={[(BED.x0 + BED.x1) / 2, 1.6, (BED.z0 + BED.z1) / 2]} s={[BED.x1 - BED.x0 - 0.2, 0.8, BED.z1 - BED.z0 - 0.2]} m={col("#f2efe6", 0.9)} />
    <Bx p={[(BED.x0 + BED.x1) / 2, 1.85, (BED.z0 + BED.z1) / 2 + 2]} s={[BED.x1 - BED.x0, 0.35, BED.z1 - BED.z0 - 3.6]} m={(mat("fabric", "#3a6ab0", rep("fabric", 7, 7)) as M)} />
    <Bx p={[(BED.x0 + BED.x1) / 2, 2.3, BED.z0 + 1.1]} s={[4.2, 0.6, 1.6]} m={col("#ffffff", 0.9)} />
    <Bx p={[(BED.x0 + BED.x1) / 2, 2.1, BED.z0 - 0.2]} s={[BED.x1 - BED.x0, 4.2, 0.4]} m={(mat("wood", "#7a4e2c", rep("wood", 7, 4)) as M)} />
    {/* bedside table, clock, lamp */}
    <Bx p={[-3.3, 1.3, -8.7]} s={[1.8, 2.6, 2.2]} m={(mat("wood", "#9a6a3c", rep("wood", 2, 2.6)) as M)} />
    <DigitalClock time={clock} />
    <group position={[-3.0, 2.6, -9.3]}>
      <Bx p={[0, 0.5, 0]} s={[0.2, 1.0, 0.2]} m={col("#2a2a30", 0.4)} />
      <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[0.35, 0.6, 0.7, 16, 1, true]} /><meshStandardMaterial color="#f6e2b0" side={THREE.DoubleSide} emissive={lamp ? "#ffb860" : "#000"} emissiveIntensity={lamp ? 0.8 : 0} /></mesh>
    </group>
    {lamp && <pointLight position={[-3.0, 4.2, -8.6]} intensity={40} distance={22} decay={2} color="#ffbf70" />}
    {/* ME's desk on the right wall, Peanut's cage on it, a chair */}
    <Bx p={[(HOME_DESK.x0 + HOME_DESK.x1) / 2, DESK_H - 0.12, (HOME_DESK.z0 + HOME_DESK.z1) / 2]} s={[HOME_DESK.x1 - HOME_DESK.x0, 0.25, HOME_DESK.z1 - HOME_DESK.z0]} m={(mat("wood", "#c89a62", rep("wood", 4, 8)) as M)} />
    {[HOME_DESK.z0 + 0.2, HOME_DESK.z1 - 0.2].map((z, k) => <Bx key={k} p={[(HOME_DESK.x0 + HOME_DESK.x1) / 2 + 0.1, (DESK_H - 0.25) / 2, z]} s={[HOME_DESK.x1 - HOME_DESK.x0 - 0.2, DESK_H - 0.25, 0.4]} m={(mat("wood", "#b08850", rep("wood", 3, 3)) as M)} />)}
    <group position={PCAGE_POS} rotation={[0, -Math.PI / 2, 0]} scale={0.8}>{peanutCage}</group>
    {/* a few things on the walls / shelves */}
    <Bx p={[R.x1 - 0.3, 6.5, -2]} s={[0.6, 0.15, 5]} m={(mat("wood", "#c89a62", rep("wood", 5, 1)) as M)} />
    {["#c84a3a", "#3a6ab0", "#e8b02a", "#3a8a5a", "#8a5ac8"].map((c, k) => <Bx key={k} p={[R.x1 - 0.35, 7.1, -4 + k * 0.5]} s={[0.5, 1.0 - (k % 2) * 0.2, 0.4]} m={col(c, 0.7)} />)}
  </group>;
};
void ROOM;

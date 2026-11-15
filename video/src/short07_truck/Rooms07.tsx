// Short 07 house sets, in RIG UNITS (an adult is 5 tall; doors 5.5 wide, rooms ~20 across). HOUSE builder's file.
// - Bedroom (ME's room at night): floor y=0, x -10..10, z -9..9, ceiling 11. The bed's headboard is against the LEFT wall
//   (x=-10), the bed runs along +x to its foot at x=-2.8. The WINDOW (with curtains you part) is in the BACK wall (z=-9),
//   centred x=2, looking onto the night street with a dim pink glow. The DOOR is in the RIGHT wall (x=10), centred z=0,
//   5.5 wide, hinged at z=-2.75 and swinging INTO the room (`open` 0..1; open, the leaf lies along z=-2.75, x 4.5..10).
// - Hallway (upstairs, dark): beyond the door, x 10..40, z -3.5..3.5; the stairwell at its far end glows faint pink.
// - Kitchen (morning): its own set at the origin: counters along the back wall z=-8, a window over the sink, the fridge,
//   the pedal bin. Rendered by itself.
// Every set exports its colliders (Collide boxes, named) and named spots. Sets render no people (the shots put <Ch/> in).
import React, { useMemo } from "react";
import * as THREE from "three";
import { mat, rep, type TexKind } from "../blocky/Textures";
import * as K from "../blocky/Collide";
import type { V3 } from "./common";

type M = ReturnType<typeof mat>;
const col = (c: string, r = 0.8, extra: Record<string, unknown> = {}) => ({ color: c, roughness: r, ...extra });
const Bx: React.FC<{ p: V3; s: V3; m: Record<string, unknown>; c?: boolean; rot?: V3 }> = ({ p, s, m, c = true, rot }) => (
  <mesh position={p} rotation={rot} castShadow={c} receiveShadow><boxGeometry args={s} /><meshStandardMaterial {...m} /></mesh>
);
const Tx: React.FC<{ p: V3; s: V3; kind: TexKind; c: string; r?: number; cast?: boolean }> = ({ p, s, kind, c, r, cast = true }) => (
  <mesh position={p} castShadow={cast} receiveShadow><boxGeometry args={s} />
    <meshStandardMaterial {...(mat(kind, c, rep(kind, Math.max(s[0], s[2]), s[1])) as M)} {...(r !== undefined ? { roughness: r } : {})} /></mesh>
);
const Cy: React.FC<{ p: V3; rt: number; rb: number; h: number; m: Record<string, unknown>; seg?: number }> = ({ p, rt, rb, h, m, seg = 20 }) => (
  <mesh position={p} castShadow receiveShadow><cylinderGeometry args={[rt, rb, h, seg]} /><meshStandardMaterial {...m} /></mesh>
);
const Floor: React.FC<{ c: V3; w: number; d: number; kind: TexKind; color: string }> = ({ c, w, d, kind, color }) => (
  <mesh position={c} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[w, d]} /><meshStandardMaterial {...(mat(kind, color, rep(kind, w, d)) as M)} /></mesh>
);
const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
};

// ---------------------------------------------------------------- walls with holes
type Hole = { a: number; b: number; y0: number; y1: number };
/** A wall slab along x (normal z) at z, from x0..x1, height H, thickness th, with rectangular holes (x a..b, y y0..y1). */
const wallX = (z: number, x0: number, x1: number, H: number, holes: Hole[], th = 0.5) => {
  const out: { p: V3; s: V3 }[] = [];
  let x = x0;
  for (const h of [...holes].sort((p, q) => p.a - q.a)) {
    if (h.a > x) out.push({ p: [(x + h.a) / 2, H / 2, z], s: [h.a - x, H, th] });
    if (h.y0 > 0) out.push({ p: [(h.a + h.b) / 2, h.y0 / 2, z], s: [h.b - h.a, h.y0, th] });
    out.push({ p: [(h.a + h.b) / 2, (h.y1 + H) / 2, z], s: [h.b - h.a, H - h.y1, th] });
    x = h.b;
  }
  if (x < x1) out.push({ p: [(x + x1) / 2, H / 2, z], s: [x1 - x, H, th] });
  return out;
};
/** The same along z (normal x) at x. */
const wallZ = (x: number, z0: number, z1: number, H: number, holes: Hole[], th = 0.5) =>
  wallX(0, z0, z1, H, holes, th).map(({ p, s }) => ({ p: [x, p[1], p[0]] as V3, s: [s[2], s[1], s[0]] as V3 }));
type Slab = { p: V3; s: V3 };
const slabsCS = (ss: Slab[], name: string) => ss.map(({ p, s }) => K.box(p, s, name));

// ================================================================= BEDROOM + HALLWAY
export const ROOM = { x0: -10, x1: 10, z0: -9, z1: 9, H: 11 } as const;
export const DOOR = { x: 10, zc: 0, w: 5.5, h: 8, hingeZ: -2.75 } as const;
export const WIN = { x: 2, z: -9, w: 6, y0: 3.2, y1: 8.2 } as const;
export const HALL = { x0: 10, x1: 40, z0: -3.5, z1: 3.5, H: 11 } as const;
/** The bed: frame footprint, mattress top. Headboard against the left wall. */
export const BED = { x0: -10, x1: -2.8, z0: -2.6, z1: 2.6, top: 1.9, head: -9.6 } as const;
/** ME sitting up in bed (kid, scale 0.82): hips at x, facing the door (+x). START = after "getting closer", BACK = pressed to the headboard. */
export const BED_SIT = { start: -6.4, back: -8.55, z: 0.5, yaw: Math.PI / 2 } as const;
/** Where ME stands at the window (feet), facing the glass. */
export const WINDOW_SPOT: V3 = [2.75, 0, -7.0];
/** Mom in the hall, just outside the door (feet), facing into the room. */
export const DOORWAY_OUT: V3 = [13.2, 0, 0];
const WALL_C = "#7d8fb4", TRIM = "#e9e4da";

const bedroomWalls = (): Slab[] => [
  ...wallX(ROOM.z0, ROOM.x0 - 0.25, ROOM.x1 + 0.25, ROOM.H, [{ a: WIN.x - WIN.w / 2, b: WIN.x + WIN.w / 2, y0: WIN.y0, y1: WIN.y1 }]).map((w) => ({ ...w, p: [w.p[0], w.p[1], ROOM.z0 - 0.25] as V3 })),
  ...wallX(ROOM.z1 + 0.25, ROOM.x0 - 0.25, ROOM.x1 + 0.25, ROOM.H, []),
  ...wallZ(ROOM.x0 - 0.25, ROOM.z0, ROOM.z1, ROOM.H, []),
  ...wallZ(DOOR.x + 0.25, ROOM.z0, ROOM.z1, ROOM.H, [{ a: DOOR.zc - DOOR.w / 2, b: DOOR.zc + DOOR.w / 2, y0: 0, y1: DOOR.h }]),
];
const hallWalls = (): Slab[] => [
  ...wallX(HALL.z0 - 0.25, HALL.x0, HALL.x1, HALL.H, []),
  ...wallX(HALL.z1 + 0.25, HALL.x0, HALL.x1, HALL.H, [{ a: 31, b: 37, y0: 0, y1: 8.5 }]), // the stairwell opening
  ...wallZ(HALL.x1 + 0.25, HALL.z0, HALL.z1, HALL.H, []),
];
/** Door leaf hinge rotation for `open` 0..1 (into the room). */
const doorAngle = (open: number) => (Math.PI / 2) * 0.96 * open;
/** The bedroom + hallway colliders for a door opening `open`. The leaf counts only when (nearly) shut or open. */
export const bedroomCS = (open = 0): K.Box[] => {
  const cs: K.Box[] = [
    ...slabsCS(bedroomWalls(), "wall"), ...slabsCS(hallWalls(), "wall"),
    K.boxMinMax([BED.x0, 0, BED.z0], [BED.x1, 1.2, BED.z1], "bedFrame"),
    K.boxMinMax([BED.x0 + 0.4, 1.2, BED.z0 + 0.2], [BED.x1 - 0.2, BED.top, BED.z1 - 0.2], "mattress"),
    K.boxMinMax([BED.x0, 0, BED.z0 - 0.2], [BED.head, 4.6, BED.z1 + 0.2], "headboard"),
    K.boxMinMax([BED.x1 - 0.3, 0, BED.z0], [BED.x1, 2.3, BED.z1], "footboard"),
    K.boxMinMax([-9.9, 0, -6.4], [-7.7, 2.4, -4.4], "nightstand"),
    K.boxMinMax([3.4, 0, 6.8], [7.6, 4.0, 8.95], "dresser"),
    K.boxMinMax([26, 0, -3.5], [29, 3, -2.3], "hallTable"),
  ];
  if (open > 0.95 || open < 0.05) {
    const a = doorAngle(open), dx = -Math.sin(a), dz = Math.cos(a), hz = DOOR.hingeZ;
    const ex = DOOR.x + dx * DOOR.w, ez = hz + dz * DOOR.w;
    cs.push(K.boxMinMax([Math.min(DOOR.x, ex) - 0.18, 0, Math.min(hz, ez) - 0.18], [Math.max(DOOR.x, ex) + 0.18, DOOR.h, Math.max(hz, ez) + 0.18], "door"));
  }
  return cs;
};

/** The painted night street seen through the bedroom window (ignores lighting). `glow` 0..1 the truck's pink glow. */
const NightView: React.FC<{ glow: number }> = ({ glow }) => {
  const tx = useMemo(() => canvasTex(512, 384, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, 384); sky.addColorStop(0, "#0b1230"); sky.addColorStop(1, "#1d2a55");
    g.fillStyle = sky; g.fillRect(0, 0, 512, 384);
    g.fillStyle = "#e8ecff"; for (let i = 0; i < 40; i++) g.fillRect((i * 97) % 512, (i * 53) % 160, 2, 2);
    g.fillStyle = "#f4f0d8"; g.beginPath(); g.arc(420, 60, 22, 0, Math.PI * 2); g.fill();
    // the houses across the street: dark blocky roofs, one lit window
    const houses: [number, number, number][] = [[0, 150, 140], [150, 170, 120], [300, 140, 150], [440, 160, 100]];
    for (const [x, w, top] of houses) {
      g.fillStyle = "#141a30"; g.fillRect(x + 10, top + 60, w - 20, 384 - top - 60);
      g.beginPath(); g.moveTo(x, top + 62); g.lineTo(x + w / 2, top); g.lineTo(x + w, top + 62); g.fill();
      g.fillStyle = "#26304e"; g.fillRect(x + 30, top + 90, 26, 30); g.fillRect(x + w - 56, top + 90, 26, 30);
    }
    g.fillStyle = "#e8b860"; g.fillRect(180, 280, 26, 30);
    // the street and the curb
    g.fillStyle = "#0e1220"; g.fillRect(0, 320, 512, 64); g.fillStyle = "#3a4058"; g.fillRect(0, 316, 512, 6);
    // a street lamp
    g.fillStyle = "#2a2f40"; g.fillRect(96, 180, 6, 140); g.fillStyle = "#ffe6a8"; g.fillRect(88, 174, 22, 10);
  }), []);
  return (
    <group position={[WIN.x, 0, ROOM.z0 - 9]}>
      <mesh position={[0, 6, 0]}><planeGeometry args={[34, 26]} /><meshBasicMaterial map={tx} toneMapped={false} /></mesh>
      {/* the pink glow down on the street (left of the window, where the truck idles) */}
      <mesh position={[-4.5, 2.6, 0.2]}><circleGeometry args={[6, 36]} />
        <meshBasicMaterial color="#ff7ab0" transparent opacity={0.42 * glow} toneMapped={false} depthWrite={false} /></mesh>
      <mesh position={[-4.5, 2.4, 0.3]}><circleGeometry args={[2.6, 30]} />
        <meshBasicMaterial color="#ffc0dc" transparent opacity={0.5 * glow} toneMapped={false} depthWrite={false} /></mesh>
    </group>
  );
};

/** One curtain panel: pleats from the outer edge `xo` to the inner edge `xi` (x along the wall), hanging at z. */
const Curtain: React.FC<{ xo: number; xi: number; z: number; y0: number; y1: number; color: string }> = ({ xo, xi, z, y0, y1, color }) => {
  const n = 7, w = Math.abs(xi - xo), pw = w / n + 0.12, m = { ...(mat("fabric", color, [1, 3]) as M), roughness: 1 };
  return <group>
    {Array.from({ length: n }, (_, i) => {
      const x = xo + (xi - xo) * ((i + 0.5) / n);
      return <Bx key={i} p={[x, (y0 + y1) / 2, z + (i % 2 ? 0.14 : -0.02)]} s={[pw, y1 - y0, 0.14]} m={m} />;
    })}
  </group>;
};
/** Where the inner edge of the left curtain sits for a parting `part` 0..1 (the right one mirrors it). */
export const curtainEdge = (part: number) => WIN.x - 0.05 - 1.1 * part;
export const CURTAIN_Z = ROOM.z0 + 0.75;

/**
 * ME's bedroom at night + the dark upstairs hallway behind its door.
 * `open` the door 0..1; `part` the curtains 0..1; `outside` the pink glow outside the window 0..1;
 * `hall` the hall's backlight 0..1 (warm pink, behind someone in the doorway); `stair` the stairwell's pink glow 0..1.
 */
export const Bedroom07: React.FC<{ open?: number; part?: number; outside?: number; hall?: number; stair?: number; lamp?: number; children?: React.ReactNode }> =
  ({ open = 0, part = 0, outside = 0.8, hall = 0, stair = 0.4, lamp = 0.35, children }) => {
    const wallM = mat("wallpaper", WALL_C, [6, 3]) as M;
    const hallM = mat("wallpaper", "#8a8070", [6, 3]) as M;
    const wood = mat("wood", "#b5895c", [1.5, 0.5]) as M;
    const a = doorAngle(open);
    return (
      <group>
        {/* floors + ceilings */}
        <Floor c={[0, 0, 0]} w={20} d={18} kind="wood" color="#a77a4c" />
        <Floor c={[25, 0, 0]} w={30} d={7} kind="wood" color="#8e6640" />
        <mesh position={[0, ROOM.H, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[21, 19]} /><meshStandardMaterial color="#dfe2ea" roughness={0.9} /></mesh>
        <mesh position={[25, HALL.H, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[31, 8]} /><meshStandardMaterial color="#d8d4cc" roughness={0.9} /></mesh>
        {/* walls */}
        {bedroomWalls().map((w, i) => <Bx key={"b" + i} p={w.p} s={w.s} m={{ ...wallM }} />)}
        {hallWalls().map((w, i) => <Bx key={"h" + i} p={w.p} s={w.s} m={{ ...hallM }} />)}
        {/* skirting */}
        <Bx p={[0, 0.3, ROOM.z0 + 0.05]} s={[20, 0.6, 0.12]} m={col(TRIM, 0.6)} c={false} />
        <Bx p={[ROOM.x0 + 0.05, 0.3, 0]} s={[0.12, 0.6, 18]} m={col(TRIM, 0.6)} c={false} />
        {/* window: frame, sill, glass, cross bars, curtains, rod; the street outside */}
        <group>
          <Bx p={[WIN.x, WIN.y0 - 0.15, ROOM.z0 + 0.25]} s={[WIN.w + 1, 0.3, 0.8]} m={col(TRIM, 0.6)} />
          <Bx p={[WIN.x, WIN.y1 + 0.12, ROOM.z0 + 0.05]} s={[WIN.w + 0.6, 0.25, 0.3]} m={col(TRIM, 0.6)} c={false} />
          {[-1, 1].map((s) => <Bx key={s} p={[WIN.x + s * (WIN.w / 2 + 0.15), (WIN.y0 + WIN.y1) / 2, ROOM.z0 + 0.05]} s={[0.3, WIN.y1 - WIN.y0, 0.3]} m={col(TRIM, 0.6)} c={false} />)}
          <Bx p={[WIN.x, (WIN.y0 + WIN.y1) / 2, ROOM.z0 - 0.1]} s={[0.16, WIN.y1 - WIN.y0, 0.12]} m={col(TRIM, 0.6)} c={false} />
          <Bx p={[WIN.x, (WIN.y0 + WIN.y1) / 2, ROOM.z0 - 0.1]} s={[WIN.w, 0.16, 0.12]} m={col(TRIM, 0.6)} c={false} />
          <mesh position={[WIN.x, (WIN.y0 + WIN.y1) / 2, ROOM.z0 - 0.2]}><planeGeometry args={[WIN.w, WIN.y1 - WIN.y0]} />
            <meshStandardMaterial color="#9fb4ff" transparent opacity={0.16} roughness={0.05} metalness={0.2} emissive="#ff7ab0" emissiveIntensity={0.18 * outside} /></mesh>
          <Cy p={[WIN.x, WIN.y1 + 0.55, CURTAIN_Z]} rt={0.08} rb={0.08} h={WIN.w + 2.2} m={col("#c8b48a", 0.4, { metalness: 0.5 })} seg={8} />
          <group rotation={[0, 0, 0]}>
            <Curtain xo={WIN.x - WIN.w / 2 - 1} xi={curtainEdge(part)} z={CURTAIN_Z} y0={2.6} y1={WIN.y1 + 0.5} color="#3f5a8e" />
            <Curtain xo={WIN.x + WIN.w / 2 + 1} xi={2 * WIN.x - curtainEdge(part)} z={CURTAIN_Z} y0={2.6} y1={WIN.y1 + 0.5} color="#3f5a8e" />
          </group>
          <NightView glow={outside} />
          {outside > 0.01 && <pointLight position={[WIN.x - 2, 5.5, ROOM.z0 - 3]} intensity={30 * outside} distance={22} decay={1.6} color="#ff8ab8" />}
        </group>
        {/* the bed: frame, headboard, footboard, mattress, pillow (the blanket is drawn by the shot: it moves with ME) */}
        <group>
          <Bx p={[(BED.x0 + BED.x1) / 2, 0.6, 0]} s={[BED.x1 - BED.x0, 1.2, BED.z1 - BED.z0]} m={wood} />
          <Bx p={[(BED.x0 + BED.head) / 2, 2.3, 0]} s={[BED.head - BED.x0, 4.6, BED.z1 - BED.z0 + 0.4]} m={wood} />
          <Bx p={[BED.x1 - 0.15, 1.15, 0]} s={[0.3, 2.3, BED.z1 - BED.z0]} m={wood} />
          <Bx p={[(BED.x0 + 0.4 + BED.x1 - 0.2) / 2, (1.2 + BED.top) / 2, 0]} s={[BED.x1 - BED.x0 - 0.6, BED.top - 1.2, BED.z1 - BED.z0 - 0.4]} m={{ ...(mat("fabric", "#eef0f4", [3, 3]) as M), roughness: 0.95 }} />
          <mesh position={[BED.head + 0.7, BED.top + 0.35, -1.3]} scale={[0.55, 0.38, 1.25]} castShadow><sphereGeometry args={[1, 20, 12]} /><meshStandardMaterial color="#f4f2ec" roughness={0.95} /></mesh>
          <mesh position={[BED.head + 0.7, BED.top + 0.35, 1.5]} scale={[0.55, 0.38, 1.1]} castShadow><sphereGeometry args={[1, 20, 12]} /><meshStandardMaterial color="#f4f2ec" roughness={0.95} /></mesh>
        </group>
        {/* nightstand + a small lamp (dim), a clock */}
        <group position={[-8.8, 0, -5.4]}>
          <Bx p={[0, 1.2, 0]} s={[2.2, 2.4, 2.0]} m={wood} />
          <Bx p={[0.0, 1.5, 1.02]} s={[1.8, 0.7, 0.05]} m={{ ...wood, color: "#9a7048" }} c={false} />
          <Cy p={[-0.3, 2.75, -0.2]} rt={0.15} rb={0.25} h={0.7} m={col("#6d8fa8", 0.4)} />
          <Cy p={[-0.3, 3.4, -0.2]} rt={0.35} rb={0.55} h={0.6} m={col("#fff0cf", 0.6, { emissive: "#ffcf86", emissiveIntensity: 1.6 * lamp })} />
          <Bx p={[0.55, 2.7, 0.2]} s={[0.8, 0.55, 0.4]} m={col("#1c1c22", 0.4)} />
          <Bx p={[0.55, 2.7, 0.41]} s={[0.62, 0.32, 0.02]} m={col("#ff3a4a", 0.4, { emissive: "#ff3a4a", emissiveIntensity: 1.4 })} c={false} />
          {lamp > 0.01 && <pointLight position={[-0.3, 3.6, 0.6]} intensity={9 * lamp} distance={9} decay={2} color="#ffcf8a" />}
        </group>
        {/* dresser with a teddy, rug, posters */}
        <group position={[5.5, 0, 7.9]}>
          <Bx p={[0, 2.0, 0]} s={[4.2, 4.0, 2.1]} m={wood} />
          {[0.9, 2.1, 3.3].map((y) => <Bx key={y} p={[0, y, -1.07]} s={[3.8, 1.0, 0.05]} m={{ ...wood, color: "#9a7048" }} c={false} />)}
          <mesh position={[-1, 4.5, 0]} castShadow><sphereGeometry args={[0.5, 14, 10]} /><meshStandardMaterial color="#b07a48" roughness={1} /></mesh>
          <mesh position={[-1, 5.2, 0]} castShadow><sphereGeometry args={[0.36, 14, 10]} /><meshStandardMaterial color="#b07a48" roughness={1} /></mesh>
        </group>
        <mesh position={[0.5, 0.03, 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[4.2, 40]} />
          <meshStandardMaterial {...(mat("carpet", "#4a7a6a", [2, 2]) as M)} roughness={1} /></mesh>
        <Bx p={[ROOM.x0 + 0.05, 7.2, -5.8]} s={[0.08, 2.6, 2.0]} m={col("#e2c23a", 0.7)} c={false} />
        <Bx p={[-5.5, 6.8, ROOM.z0 + 0.03]} s={[2.0, 2.6, 0.08]} m={col("#3fa06a", 0.7)} c={false} />
        <Bx p={[-5.5, 6.8, ROOM.z0 + 0.08]} s={[1.0, 1.0, 0.04]} m={col("#f4f0e8", 0.7)} c={false} />
        {/* the door: frame and leaf (hinged at z=hingeZ, swings into the room) */}
        <Bx p={[DOOR.x - 0.05, DOOR.h + 0.15, 0]} s={[0.7, 0.3, DOOR.w + 0.6]} m={col(TRIM, 0.6)} c={false} />
        {[-1, 1].map((s) => <Bx key={s} p={[DOOR.x - 0.05, DOOR.h / 2, s * (DOOR.w / 2 + 0.15)]} s={[0.7, DOOR.h, 0.3]} m={col(TRIM, 0.6)} c={false} />)}
        <group position={[DOOR.x, 0, DOOR.hingeZ]} rotation={[0, -a, 0]}>
          <Bx p={[0, DOOR.h / 2, DOOR.w / 2]} s={[0.25, DOOR.h - 0.05, DOOR.w - 0.05]} m={{ ...(mat("wood", "#efe6d6", [1, 2]) as M) }} />
          {[1.6, 5.4].map((y) => <Bx key={y} p={[-0.14, y, DOOR.w / 2]} s={[0.04, 2.2, DOOR.w - 1.4]} m={col("#e3d8c4", 0.7)} c={false} />)}
          {[-1, 1].map((s) => <mesh key={s} position={[s * 0.22, 3.6, DOOR.w - 0.7]}><sphereGeometry args={[0.16, 12, 8]} /><meshStandardMaterial color="#d8b04a" metalness={0.6} roughness={0.3} /></mesh>)}
        </group>
        {/* ceiling lamp (off) */}
        <Cy p={[0, ROOM.H - 0.15, 0]} rt={1.1} rb={0.9} h={0.3} m={col("#fff6e2", 0.4)} />
        {/* ---- the hallway: runner rug, pictures, a little table, the stair rail and its pink glow ---- */}
        <mesh position={[25, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[28, 3.2]} />
          <meshStandardMaterial {...(mat("carpet", "#7a2a34", [6, 1]) as M)} roughness={1} /></mesh>
        {[16, 22, 33].map((x, i) => <group key={x}>
          <Bx p={[x, 6.6, HALL.z0 + 0.06]} s={[2.2, 2.8, 0.1]} m={col("#2a2420", 0.6)} c={false} />
          <Bx p={[x, 6.6, HALL.z0 + 0.12]} s={[1.7, 2.3, 0.04]} m={col(["#b8c8d8", "#d8c0a0", "#a8b898"][i], 0.8)} c={false} />
        </group>)}
        <group position={[27.5, 0, -2.9]}>
          <Bx p={[0, 2.85, 0]} s={[3, 0.3, 1.2]} m={wood} />
          {[-1.3, 1.3].map((x) => <Bx key={x} p={[x, 1.35, 0]} s={[0.25, 2.7, 0.9]} m={wood} />)}
          <Cy p={[0.6, 3.6, 0]} rt={0.35} rb={0.25} h={1.2} m={col("#5a7aa0", 0.4)} />
        </group>
        <group>
          {Array.from({ length: 7 }, (_, i) => <Bx key={i} p={[31.3 + i * 0.95, 1.7, HALL.z1 + 0.1]} s={[0.18, 3.4, 0.18]} m={col(TRIM, 0.6)} c={false} />)}
          <Bx p={[34, 3.45, HALL.z1 + 0.1]} s={[6.2, 0.3, 0.35]} m={wood} c={false} />
          <mesh position={[34, 4.2, HALL.z1 + 3.5]}><planeGeometry args={[6, 8.5]} /><meshBasicMaterial color="#3a1830" toneMapped={false} /></mesh>
          {stair > 0.01 && <pointLight position={[34, 2.2, HALL.z1 + 2.5]} intensity={40 * stair} distance={20} decay={1.5} color="#ff7ab0" />}
        </group>
        {/* the backlight behind someone in the doorway */}
        {hall > 0.01 && <pointLight position={[17.5, 8.5, 0]} intensity={38 * hall} distance={20} decay={1.5} color="#ffb8c8" />}
        {children}
      </group>
    );
  };

/** The blanket over ME's legs (and pulled up to the chin by `up` 0..1): hips x, lap height y, top height of the pulled part. */
export const Blanket: React.FC<{ hipX: number; z: number; up: number; chinY: number; frontX?: number; scale?: number }> = ({ hipX, z, up, chinY, frontX, scale: s = 0.82 }) => {
  const m = { ...(mat("fabric", "#d8506a", [3, 3]) as M), roughness: 0.95 };
  const lapTop = BED.top + 1.1 * s, fx = frontX ?? hipX + 0.75 * s;
  const footX = BED.x1 - 0.35, h = Math.max(0.05, (chinY - lapTop) * up);
  return <group>
    <Bx p={[(hipX - 0.3 + footX) / 2, (BED.top + lapTop) / 2, z]} s={[footX - hipX + 0.3, lapTop - BED.top + 0.05, 5.0]} m={m} />
    <Bx p={[(fx + footX) / 2, BED.top + 0.12, BED.z0 + 0.15]} s={[footX - fx, 0.6, 0.3]} m={m} c={false} />
    {up > 0.02 && <Bx p={[fx, lapTop + h / 2, z]} s={[0.35, h, 3.2]} m={m} />}
  </group>;
};

// ================================================================= KITCHEN (morning)
export const KITCHEN = { x0: -11, x1: 11, z0: -8, z1: 10, H: 11, counterTop: 3.0, counterZ: -5.4 } as const;
/** The pedal bin (centre of its footprint), its top. */
export const BIN = { p: [5.2, 0, -2.2] as V3, r: 0.75, top: 2.5 } as const;
/** Mom beside the bin (feet); the bin is on her left. */
export const KITCHEN_MOM: V3 = [2.2, 0, -3.0];
export const kitchenCS = (): K.Box[] => [
  ...slabsCS(wallX(KITCHEN.z0 - 0.25, KITCHEN.x0, KITCHEN.x1, KITCHEN.H, [{ a: -5.5, b: -0.5, y0: 4.6, y1: 8.6 }]), "wall"),
  ...slabsCS(wallZ(KITCHEN.x0 - 0.25, KITCHEN.z0, KITCHEN.z1, KITCHEN.H, []), "wall"),
  ...slabsCS(wallZ(KITCHEN.x1 + 0.25, KITCHEN.z0, KITCHEN.z1, KITCHEN.H, []), "wall"),
  K.boxMinMax([KITCHEN.x0, 0, KITCHEN.z0], [6.2, KITCHEN.counterTop, KITCHEN.counterZ], "counter"),
  K.boxMinMax([6.5, 0, KITCHEN.z0], [9.8, 8.2, -5.0], "fridge"),
  K.boxMinMax([BIN.p[0] - BIN.r, 0, BIN.p[2] - BIN.r], [BIN.p[0] + BIN.r, BIN.top, BIN.p[2] + BIN.r], "bin"),
  K.boxMinMax([-9.5, 0, 2], [-4.5, 3.0, 6], "table"),
];
const YardView: React.FC = () => {
  const tx = useMemo(() => canvasTex(256, 200, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, 200); sky.addColorStop(0, "#9cc8f0"); sky.addColorStop(1, "#e8f0f4");
    g.fillStyle = sky; g.fillRect(0, 0, 256, 200);
    g.fillStyle = "#6fa04a"; g.fillRect(0, 130, 256, 70);
    g.fillStyle = "#f4f0e6"; for (let x = 0; x < 256; x += 18) g.fillRect(x, 112, 8, 40);
    g.fillRect(0, 120, 256, 5);
    g.fillStyle = "#3e7a3a"; g.beginPath(); g.arc(200, 90, 40, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#5a3a22"; g.fillRect(195, 110, 10, 40);
  }), []);
  return <mesh position={[-3, 6.6, KITCHEN.z0 - 4]}><planeGeometry args={[14, 10]} /><meshBasicMaterial map={tx} toneMapped={false} /></mesh>;
};
/** The kitchen in the morning. `lid` 0..1 the bin's lid (opens when something goes in). */
export const Kitchen07: React.FC<{ lid?: number; children?: React.ReactNode }> = ({ lid = 0, children }) => {
  const cab = { ...(mat("plaster", "#f2efe6", [2, 1]) as M), roughness: 0.45 };
  const top = { ...(mat("concrete", "#c9c4ba", [2, 1]) as M), roughness: 0.3 };
  const wall = mat("tile", "#f4ecd8", [10, 5]) as M;
  return (
    <group>
      <Floor c={[0, 0, 1]} w={22} d={18} kind="tile" color="#e6dcc8" />
      <mesh position={[0, KITCHEN.H, 1]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[22, 18]} /><meshStandardMaterial color="#f4f2ec" roughness={0.9} /></mesh>
      {wallX(KITCHEN.z0 - 0.25, KITCHEN.x0, KITCHEN.x1, KITCHEN.H, [{ a: -5.5, b: -0.5, y0: 4.6, y1: 8.6 }]).map((w, i) => <Bx key={"k" + i} p={w.p} s={w.s} m={{ ...wall }} />)}
      {[...wallZ(KITCHEN.x0 - 0.25, KITCHEN.z0, KITCHEN.z1, KITCHEN.H, []), ...wallZ(KITCHEN.x1 + 0.25, KITCHEN.z0, KITCHEN.z1, KITCHEN.H, [])].map((w, i) =>
        <Bx key={"s" + i} p={w.p} s={w.s} m={{ ...(mat("wallpaper", "#e8d8a8", [6, 3]) as M) }} />)}
      {/* window over the sink */}
      <YardView />
      <mesh position={[-3, 6.6, KITCHEN.z0 - 0.3]}><planeGeometry args={[5, 4]} /><meshStandardMaterial color="#cfe4ff" transparent opacity={0.12} /></mesh>
      <Bx p={[-3, 6.6, KITCHEN.z0 - 0.2]} s={[0.15, 4, 0.1]} m={col("#ffffff", 0.5)} c={false} />
      <Bx p={[-3, 4.5, KITCHEN.z0 + 0.1]} s={[5.6, 0.25, 0.6]} m={col("#ffffff", 0.5)} />
      {/* counters + doors + top, the sink, a kettle, a fruit bowl */}
      <Bx p={[(KITCHEN.x0 + 6.2) / 2, 1.35, (KITCHEN.z0 + KITCHEN.counterZ) / 2]} s={[6.2 - KITCHEN.x0, 2.7, KITCHEN.counterZ - KITCHEN.z0]} m={cab} />
      <Bx p={[(KITCHEN.x0 + 6.2) / 2, 2.85, (KITCHEN.z0 + KITCHEN.counterZ) / 2 + 0.1]} s={[6.4 - KITCHEN.x0, 0.3, KITCHEN.counterZ - KITCHEN.z0 + 0.2]} m={top} />
      {Array.from({ length: 7 }, (_, i) => <Bx key={i} p={[KITCHEN.x0 + 1.4 + i * 2.4, 1.35, KITCHEN.counterZ + 0.03]} s={[2.1, 2.2, 0.06]} m={col("#e8e2d4", 0.5)} c={false} />)}
      <Bx p={[-3, 2.95, -6.7]} s={[3, 0.12, 1.8]} m={col("#d8dce2", 0.2, { metalness: 0.6 })} c={false} />
      <Cy p={[-3, 3.7, -7.5]} rt={0.1} rb={0.1} h={1.4} m={col("#d8dce2", 0.2, { metalness: 0.7 })} seg={8} />
      <Cy p={[2.5, 3.5, -6.6]} rt={0.45} rb={0.6} h={1.1} m={col("#d8402a", 0.3)} />
      <Cy p={[-7.5, 3.25, -6.6]} rt={1.0} rb={0.6} h={0.5} m={col("#f2f0ea", 0.3)} />
      {[[-7.8, -6.5, "#e8402a"], [-7.2, -6.8, "#f2c81e"], [-7.4, -6.3, "#5aa83a"]].map(([x, z, c], i) => <mesh key={i} position={[x as number, 3.65, z as number]}><sphereGeometry args={[0.32, 12, 10]} /><meshStandardMaterial color={c as string} roughness={0.5} /></mesh>)}
      {/* upper cabinets */}
      {[-9, -7.5, 1.5, 4.5].map((x) => <Bx key={x} p={[x, 9.2, -7.2]} s={[2.8, 3, 1.6]} m={cab} />)}
      {/* the fridge, with a magnet note */}
      <Bx p={[8.15, 4.1, -6.5]} s={[3.3, 8.2, 3.0]} m={col("#eef0f2", 0.25, { metalness: 0.2 })} />
      <Bx p={[6.55, 4.4, -4.95]} s={[0.15, 1.6, 0.1]} m={col("#b8bcc4", 0.3, { metalness: 0.6 })} c={false} />
      <Bx p={[8.2, 5.8, -4.98]} s={[1.0, 1.3, 0.04]} m={col("#fff6a8", 0.8)} c={false} />
      {/* the pedal bin: steel body, black lid hinged at the back */}
      <Cy p={[BIN.p[0], BIN.top / 2 - 0.05, BIN.p[2]]} rt={BIN.r} rb={BIN.r * 0.92} h={BIN.top - 0.1} m={col("#c8ccd2", 0.25, { metalness: 0.7 })} seg={24} />
      <Cy p={[BIN.p[0], BIN.top - 0.1, BIN.p[2]]} rt={BIN.r * 0.8} rb={BIN.r * 0.8} h={0.02} m={col("#141418", 0.9)} seg={24} />
      <group position={[BIN.p[0], BIN.top - 0.05, BIN.p[2] - BIN.r]} rotation={[-1.6 * lid, 0, 0]}>
        <Cy p={[0, 0.06, BIN.r]} rt={BIN.r + 0.04} rb={BIN.r + 0.04} h={0.14} m={col("#26262c", 0.4)} seg={24} />
      </group>
      <Bx p={[BIN.p[0], 0.12, BIN.p[2] + BIN.r + 0.15]} s={[0.6, 0.12, 0.4]} m={col("#26262c", 0.4)} c={false} />
      {/* table + two chairs */}
      <group position={[-7, 0, 4]}>
        <Bx p={[0, 2.85, 0]} s={[5, 0.3, 4]} m={mat("wood", "#c08a50", [2, 1]) as M} />
        {[[-2.2, -1.7], [2.2, -1.7], [-2.2, 1.7], [2.2, 1.7]].map(([x, z], i) => <Bx key={i} p={[x, 1.35, z]} s={[0.3, 2.7, 0.3]} m={col("#8a5a34", 0.7)} />)}
        <Cy p={[0.5, 3.3, 0]} rt={0.5} rb={0.4} h={0.6} m={col("#4a8ad8", 0.4)} />
      </group>
      {children}
    </group>
  );
};

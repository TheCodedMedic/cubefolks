// Short 07 SCHOOL sets (School builder; notes/short07/CONTRACT.md). RIG UNITS everywhere (adult 5 tall, kids x0.82).
// - LunchTable: a picnic lunch table with two attached benches (kids sit on the benches, legs under the top), placed in
//   Short 6's SchoolYard (rig units). Colliders: lunchCS(at) (bench tops are named "seat", so seated kids are allowed on them).
// - Slide: a playground slide on the yard (platform, ladder, sloped chute, flat run-out at the bottom). slideSurface(x) gives
//   the chute's top height; slideCS() the solid parts (posts, ladder, rails).
// - WindowFrame: a school window (frame, cross bars, sill, wall around it) set in front of a POV camera.
// - Small props: Sandwich, Pencil, Chalk, TestPaper, UprightCone (a Cone that stays upright at any arm angle).
// - HeatShimmer: a 2D heat layer (rising wavy bands + sun glare) for the hot-slide shots.
import React from "react";
import * as THREE from "three";
import { box, type Box } from "../blocky/Collide";
import { SBox } from "../blocky/SchoolHall";
import { Cone } from "./Props07";
import type { CamS, V3 } from "../kit/core";

// ================================================================ the lunch tables
/** Table top height (top face), bench top height, table depth, bench centre distance from the table's centre line. */
export const LUNCH = { top: 2.85, seat: 1.32, depth: 3.2, benchZ: 2.6, benchD: 1.4, len: 13 } as const;
/** Where the lunch tables stand in the SchoolYard (table centres, long side along x; the school wall is at z = -20). */
export const LUNCH_AT: V3[] = [[-4, 0, 4], [-6, 0, -9]];
/** A seat on table `k`'s bench `side` (1 = the +z bench, its sitter faces -z; -1 = the -z bench, faces +z), `x` along it. */
export const lunchSeat = (k: number, side: 1 | -1, x: number): { seat: V3; yaw: number } => {
  const c = LUNCH_AT[k];
  return { seat: [c[0] + x, LUNCH.seat, c[2] + side * LUNCH.benchZ], yaw: side === 1 ? Math.PI : 0 };
};
/** Colliders for the lunch table at `c`. */
export const lunchCS = (c: V3): Box[] => {
  const { top, seat, depth, benchZ, benchD, len } = LUNCH, end = len / 2 - 0.6;
  const cs: Box[] = [
    box([c[0], top - 0.125, c[2]], [len, 0.25, depth], "table"),
    ...[-1, 1].map((s) => box([c[0] + s * end, (top - 0.25) / 2, c[2]], [0.4, top - 0.25, depth - 0.6], "tableLeg")),
  ];
  for (const s of [-1, 1]) {
    cs.push(box([c[0], seat - 0.11, c[2] + s * benchZ], [len, 0.22, benchD], "seat"));
    for (const e of [-1, 1]) cs.push(box([c[0] + e * end, (seat - 0.22) / 2, c[2] + s * benchZ], [0.4, seat - 0.22, benchD - 0.4], "benchLeg"));
  }
  return cs;
};
export const LUNCH_CS: Box[] = LUNCH_AT.flatMap(lunchCS);
const TABLE_TOP = "#2f7fc0", TABLE_BENCH = "#2f7fc0", METAL = "#5a5e66";
/** One lunch table with benches (and a few lunch things on it). */
export const LunchTable: React.FC<{ at: V3; trays?: boolean }> = ({ at: c, trays = true }) => {
  const { top, seat, depth, benchZ, benchD, len } = LUNCH, end = len / 2 - 0.6;
  return <group position={c}>
    <SBox p={[0, top - 0.125, 0]} s={[len, 0.25, depth]} c={TABLE_TOP} rough={0.45} />
    <SBox p={[0, top - 0.27, 0]} s={[len - 0.4, 0.06, depth - 0.3]} c="#24609a" shadow={false} />
    {[-1, 1].map((s) => <group key={s}>
      <SBox p={[s * end, (top - 0.25) / 2, 0]} s={[0.35, top - 0.25, 0.35]} c={METAL} metal={0.5} rough={0.4} />
      <SBox p={[s * end, 0.12, 0]} s={[0.35, 0.24, 2 * benchZ + 0.6]} c={METAL} metal={0.5} rough={0.4} />
      <SBox p={[0, seat - 0.11, s * benchZ]} s={[len, 0.22, benchD]} c={TABLE_BENCH} rough={0.45} />
      {[-1, 1].map((e) => <SBox key={e} p={[e * end, (seat - 0.22) / 2, s * benchZ]} s={[0.3, seat - 0.22, 0.3]} c={METAL} metal={0.5} rough={0.4} />)}
    </group>)}
    {trays && [[-4.2, -0.9], [0.1, -0.85], [4.1, 0.85], [-2.1, 0.9], [2.4, -0.9]].map(([x, z], i) => <group key={i} position={[x, top, z]}>
      <SBox p={[0, 0.05, 0]} s={[1.9, 0.1, 1.3]} c={["#e8e4d8", "#f2c84a", "#e07a6a", "#9ac8e8", "#e8e4d8"][i]} rough={0.5} />
      <SBox p={[-0.45, 0.22, 0]} s={[0.5, 0.25, 0.5]} c="#f4f0e6" rough={0.6} />
      <mesh position={[0.4, 0.18, 0.1]} castShadow><sphereGeometry args={[0.22, 12, 10]} /><meshStandardMaterial color={i % 2 ? "#d8342a" : "#7ab83a"} roughness={0.4} /></mesh>
    </group>)}
  </group>;
};

// ================================================================ the playground slide (runs along +x)
/** The slide's platform centre (feet level) and its shape. The chute runs from x = SLIDE.x0 + 1 (top) down to the run-out. */
export const SLIDE = { x0: 18, z: 28, topY: 7, chuteX0: 1, chuteX1: 11, lowY: 1.4, runX1: 14, halfW: 1.8 } as const;
/** The top of the chute's surface at world x (the run-out is flat at lowY). */
export const slideSurface = (x: number) => {
  const { x0, topY, chuteX0, chuteX1, lowY } = SLIDE, u = (x - x0 - chuteX0) / (chuteX1 - chuteX0);
  if (u <= 0) return topY; if (u >= 1) return lowY;
  // straight, flattening over the last fifth into the run-out
  const f = u < 0.8 ? u * 1.1 : 0.88 + 0.12 * (1 - Math.pow(1 - (u - 0.8) / 0.2, 2));
  return topY - (topY - lowY) * f;
};
const RAIL_H = 0.7;
/** The solid parts people must not pass through: posts, the ladder, the side rails (stepped boxes along the chute). */
export const slideCS = (): Box[] => {
  const { x0, z, topY, chuteX0, runX1, halfW, lowY } = SLIDE, cs: Box[] = [];
  for (const sz of [-1, 1]) {
    for (let x = x0 + chuteX0; x < x0 + runX1; x += 0.5) {
      const y0 = slideSurface(x + 0.5), y1 = slideSurface(x);
      cs.push({ min: [x, y0 - 0.2, z + sz * halfW + (sz > 0 ? 0 : -0.25)], max: [x + 0.5, y1 + RAIL_H, z + sz * halfW + (sz > 0 ? 0.25 : 0)], name: "rail" });
    }
    cs.push(box([x0, topY / 2, z + sz * (halfW + 0.1)], [0.4, topY, 0.4], "post"));
    cs.push(box([x0 - 2.2, topY / 2, z + sz * 1.2], [0.3, topY, 0.3], "ladder"));
  }
  cs.push(box([x0 + 6, (slideSurface(x0 + 6) - 0.3) / 2, z], [0.4, slideSurface(x0 + 6) - 0.3, 0.4], "chuteLeg"));
  cs.push(box([x0 + runX1 - 0.6, (lowY - 0.25) / 2, z], [0.4, lowY - 0.25, 2.6], "runLeg"));
  return cs;
};
const CHUTE = "#f2c21e", POSTC = "#2f6fc8";
/** The slide (yellow chute, blue posts, red platform roof). */
export const Slide: React.FC = () => {
  const { x0, z, topY, chuteX0, chuteX1, lowY, runX1, halfW } = SLIDE;
  const segs: React.ReactNode[] = [];
  const N = 20;
  for (let i = 0; i < N; i++) {
    const xa = x0 + chuteX0 + ((chuteX1 - chuteX0) * i) / N, xb = x0 + chuteX0 + ((chuteX1 - chuteX0) * (i + 1)) / N;
    const ya = slideSurface(xa), yb = slideSurface(xb), L = Math.hypot(xb - xa, yb - ya), ang = Math.atan2(yb - ya, xb - xa);
    segs.push(<group key={i} position={[(xa + xb) / 2, (ya + yb) / 2, z]} rotation={[0, 0, ang]}>
      <mesh position={[0, -0.12, 0]} receiveShadow castShadow><boxGeometry args={[L + 0.04, 0.24, 2 * halfW]} /><meshStandardMaterial color={CHUTE} roughness={0.25} metalness={0.05} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[0, RAIL_H / 2 - 0.1, s * (halfW + 0.12)]} castShadow><boxGeometry args={[L + 0.04, RAIL_H + 0.2, 0.24]} /><meshStandardMaterial color={CHUTE} roughness={0.25} /></mesh>)}
    </group>);
  }
  return <group>
    {segs}
    {/* run-out */}
    <SBox p={[x0 + (chuteX1 + runX1) / 2, lowY - 0.12, z]} s={[runX1 - chuteX1, 0.24, 2 * halfW]} c={CHUTE} rough={0.25} />
    {[-1, 1].map((s) => <SBox key={s} p={[x0 + (chuteX1 + runX1) / 2, lowY + RAIL_H / 2 - 0.1, z + s * (halfW + 0.12)]} s={[runX1 - chuteX1, RAIL_H + 0.2, 0.24]} c={CHUTE} rough={0.25} />)}
    {/* platform, posts, roof */}
    <SBox p={[x0, topY - 0.15, z]} s={[2.6, 0.3, 2 * halfW + 0.6]} c="#d8483a" rough={0.5} />
    {[-1, 1].map((s) => <group key={s}>
      <SBox p={[x0, (topY + 3.6) / 2, z + s * (halfW + 0.1)]} s={[0.4, topY + 3.6, 0.4]} c={POSTC} metal={0.3} rough={0.4} />
      <SBox p={[x0 - 0.2, topY + 1.2, z + s * (halfW + 0.1)]} s={[2.2, 0.25, 0.25]} c={POSTC} metal={0.3} rough={0.4} />
      <SBox p={[x0 - 2.2, topY / 2, z + s * 1.2]} s={[0.3, topY, 0.3]} c={POSTC} metal={0.3} rough={0.4} />
    </group>)}
    <mesh position={[x0, topY + 4.1, z]} castShadow rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[3.0, 1.6, 4]} /><meshStandardMaterial color="#d8483a" roughness={0.5} /></mesh>
    {Array.from({ length: 7 }, (_, i) => <SBox key={i} p={[x0 - 2.2, 0.9 + i * 0.95, z]} s={[0.25, 0.2, 2.4]} c="#f2f2f2" metal={0.3} rough={0.4} />)}
    {/* legs */}
    <SBox p={[x0 + 6, (slideSurface(x0 + 6) - 0.3) / 2, z]} s={[0.35, slideSurface(x0 + 6) - 0.3, 0.35]} c={POSTC} metal={0.3} />
    <SBox p={[x0 + runX1 - 0.6, (lowY - 0.25) / 2, z]} s={[0.35, lowY - 0.25, 2.6]} c={POSTC} metal={0.3} />
    {/* wood chips under it */}
    <SBox p={[x0 + 5, 0.06, z]} s={[20, 0.1, 9]} c="#a8774a" kind="wood" shadow={false} />
  </group>;
};

// ================================================================ a school window in front of a POV camera
/** A window seen from inside (white frame, cross bars, a sill, cream wall around), placed `d` in front of the camera,
 *  facing it. The opening is `w` x `h` in the camera's view at distance d. */
export const WindowFrame: React.FC<{ cam: CamS; d?: number; w?: number; h?: number }> = ({ cam, d = 2.4, w = 2.2, h = 3.4 }) => {
  const p = new THREE.Vector3(...cam.pos), tg = new THREE.Vector3(...cam.target), dir = tg.clone().sub(p).normalize();
  const c = p.clone().add(dir.clone().multiplyScalar(d));
  const m = new THREE.Matrix4().lookAt(c, p, new THREE.Vector3(0, 1, 0)); // +z of the group points back at the camera
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  const e = new THREE.Euler().setFromQuaternion(q);
  const F = 0.16, WALL = "#e8e0cc", TRIM = "#f8f6f0";
  return <group position={[c.x, c.y, c.z]} rotation={[e.x, e.y, e.z]}>
    {/* wall around the opening (four big slabs) */}
    <SBox p={[0, h / 2 + 3, -0.05]} s={[w + 12, 6, 0.1]} c={WALL} shadow={false} />
    <SBox p={[0, -h / 2 - 3, -0.05]} s={[w + 12, 6, 0.1]} c={WALL} shadow={false} />
    <SBox p={[-w / 2 - 3, 0, -0.05]} s={[6, h, 0.1]} c={WALL} shadow={false} />
    <SBox p={[w / 2 + 3, 0, -0.05]} s={[6, h, 0.1]} c={WALL} shadow={false} />
    {/* frame, cross bars, sill */}
    {[-1, 1].map((s) => <SBox key={`v${s}`} p={[s * (w / 2), 0, 0]} s={[F * 1.4, h + F, 0.12]} c={TRIM} shadow={false} />)}
    {[-1, 1].map((s) => <SBox key={`h${s}`} p={[0, s * (h / 2), 0]} s={[w + F, F * 1.4, 0.12]} c={TRIM} shadow={false} />)}
    <SBox p={[0, 0.25, 0.01]} s={[w, F * 0.8, 0.08]} c={TRIM} shadow={false} />
    <SBox p={[0, 0.25, 0.01]} s={[F * 0.8, h, 0.08]} c={TRIM} shadow={false} />
    <SBox p={[0, -h / 2 - 0.08, 0.25]} s={[w + 0.6, 0.12, 0.6]} c={TRIM} shadow={false} />
  </group>;
};

// ================================================================ small props (rig units, held: origin in the fist, +y out of its top)
/** A sandwich (two bread slices, a filling). */
export const Sandwich: React.FC<{ fill?: string }> = ({ fill = "#d8584a" }) => <group position={[0, 0.25, 0]}>
  <SBox p={[0, -0.13, 0]} s={[0.9, 0.16, 0.9]} c="#f0d8a0" rough={0.8} />
  <SBox p={[0, 0, 0]} s={[0.95, 0.1, 0.95]} c={fill} rough={0.6} />
  <SBox p={[0, 0.13, 0]} s={[0.9, 0.16, 0.9]} c="#f0d8a0" rough={0.8} />
</group>;
/** A yellow pencil (+y = the tip). */
export const Pencil: React.FC = () => <group>
  <SBox p={[0, 0.3, 0]} s={[0.14, 1.1, 0.14]} c="#f2c21e" rough={0.5} />
  <mesh position={[0, 0.95, 0]}><coneGeometry args={[0.08, 0.22, 6]} /><meshStandardMaterial color="#e8c89a" roughness={0.6} /></mesh>
  <SBox p={[0, -0.3, 0]} s={[0.15, 0.14, 0.15]} c="#ef7a8a" rough={0.6} />
</group>;
/** A stick of chalk. */
export const Chalk: React.FC = () => <SBox p={[0, 0.2, 0]} s={[0.14, 0.5, 0.14]} c="#fbfbf6" rough={0.9} />;
/** A spelling-test sheet lying on a desk (flat, top at y + 0.01). */
export const TestPaper: React.FC<{ at: V3; rot?: number }> = ({ at, rot = 0 }) => {
  const tx = React.useMemo(() => {
    const c = document.createElement("canvas"); c.width = 96; c.height = 128; const g = c.getContext("2d")!;
    g.fillStyle = "#fbfaf4"; g.fillRect(0, 0, 96, 128); g.fillStyle = "#3a3a4a"; g.font = "700 11px Arial"; g.fillText("SPELLING", 8, 16);
    g.strokeStyle = "#9ab8e0"; g.lineWidth = 1; for (let y = 30; y < 124; y += 12) { g.beginPath(); g.moveTo(6, y); g.lineTo(90, y); g.stroke(); }
    g.strokeStyle = "#2a2a3a"; g.lineWidth = 1.5; for (let y = 28; y < 90; y += 12) { g.beginPath(); g.moveTo(10, y); for (let x = 10; x < 60; x += 6) g.lineTo(x, y - 2 - ((x * 7) % 5)); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return <mesh position={[at[0], at[1] + 0.012, at[2]]} rotation={[-Math.PI / 2, 0, rot]} receiveShadow>
    <planeGeometry args={[1.5, 2.0]} /><meshStandardMaterial map={tx} roughness={0.9} />
  </mesh>;
};
/** A Cone held at any forward arm angle `arm` (radians, the same number given to armL/armR) that stays upright. */
export const UprightCone: React.FC<{ arm: number; glow?: number }> = ({ arm, glow = 0.15 }) =>
  <group rotation={[arm - Math.PI / 2, 0, 0]}><Cone glow={glow} /></group>;

// ================================================================ the heat layer (2D, over the hot-slide shots)
/** Hot sun: a warm glare from the top corner and faint wavy heat bands rising off the ground. Subtle on purpose. */
export const HeatShimmer: React.FC<{ t: number; strength?: number }> = ({ t, strength = 1 }) => {
  const bands = Array.from({ length: 7 }, (_, i) => {
    const y = 1920 - ((t * 120 + i * 190) % 1330), amp = 10 + (i % 3) * 5;
    let d = `M -20 ${y}`;
    for (let x = 0; x <= 1100; x += 40) d += ` L ${x} ${y + Math.sin(x / 70 + t * 9 + i) * amp}`;
    return <path key={i} d={d} stroke="#fff8e8" strokeWidth={26 + (i % 2) * 12} fill="none" opacity={0.055 * strength} />;
  });
  return <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    <defs>
      <radialGradient id="sunGlare" cx="0.92" cy="0.04" r="0.75"><stop offset="0" stopColor="#fff2c8" stopOpacity={0.55 * strength} />
        <stop offset="0.45" stopColor="#ffd890" stopOpacity={0.14 * strength} /><stop offset="1" stopColor="#ffd890" stopOpacity={0} /></radialGradient>
      <filter id="heatBlur"><feGaussianBlur stdDeviation="9" /></filter>
    </defs>
    <rect width={1080} height={1920} fill="url(#sunGlare)" />
    <rect width={1080} height={1920} fill="#ffb050" opacity={0.05 * strength} />
    <g filter="url(#heatBlur)">{bands}</g>
  </svg>;
};

// HOUSE (notes/short06/CONTRACT.md, role 5): the family's interiors, warm and lived-in like the owner's sample
// (cream walls, white trim, wood floors, tiles), all surfaces textured with tex()/mat() from ../blocky/Textures.
//
// Units: rig units (a BlockChar is 5 tall at scale 1; 1 unit ~ 0.32 m), floor y = 0, ceilings 10 high, doors 7.2 high.
// Every room adds only its own practical lamps (warm point lights, no shadows); daylight/night comes from LOOK's BlockLights
// (time "interior" / "interiorNight" / "bathroom"). Room shells never cast shadows, so a shadowing key light still reaches
// inside. Windows show a painted outside view (day or night) that ignores lighting.
//
// ── Bathroom ── mirror wall at z = 0 (facing +z), room x -11..11, z 0..18. The mirror is a hole in the wall; behind it the
// whole bathroom is drawn again reflected through the plane z = 0 (scale [1,1,-1]), so it reads as a real mirror from any
// camera angle. `mirrorWorld` is drawn as given, in world metres: the shot places the reflected characters itself behind the
// glass (refl(p) through the plane z = 0, as ShotsA/ShotsB do). Leave someone out of it and they are missing from the mirror;
// give a reflection its own blink or expression and it acts on its own. Units: see U below (everything exported is metres).
// `towel` 0..1: a big striped towel hangs over the mirror (0) and is pulled off toward the viewer (1 = gone).
import React, { useMemo } from "react";
import * as THREE from "three";
import { mat, rep, tex, TexKind, TILE } from "../blocky/Textures";

export type V3 = [number, number, number];
type M = THREE.MeshStandardMaterialParameters;

const c01 = (x: number) => Math.max(0, Math.min(1, x));
const seg = (t: number, a: number, b: number) => c01((t - a) / (b - a));
const io = (x: number) => { x = c01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const col = (color: string, roughness = 0.6, extra: M = {}): M => ({ color, roughness, metalness: 0, ...extra });
/** A warm practical point light placed in rig units inside a room (which is drawn scaled by U): distance and intensity are
 *  converted so it lights the metre-scale world as designed. No shadows. */
const PL: React.FC<{ p: V3; i: number; d: number; color: string }> = ({ p, i, d, color }) => (
  <pointLight position={p} intensity={i * U * U} distance={d * U} decay={2} color={color} />
);

// ───────────────────────────────────────────── exports: spots (METRES) ─────────────────────────────────────────────
/** Sets are built in rig units (a scale-1 BlockChar is 5 tall) and drawn scaled by U, so everything is in METRES in the
 *  world (cast.ts: adult scale 0.32 = 1.6 m). All exported spots are in metres. */
export const U = 0.32;
const m3 = (v: V3): V3 => [v[0] * U, v[1] * U, v[2] * U];
// rig-unit anchors (internal)
const rMIRROR = { center: [0, 5.5, 0] as V3, w: 12, h: 5.2 };
const rSINK: V3 = [0, 0, 1.75];
const rDOOR: V3 = [5.5, 0, 17.6];
const rSTOOL: V3 = [3.4, 1.0, 1.9];
const rKSINK: V3 = [0, 0, 3.4];
const TABLE_H = 2.5; // dining table top (0.8 m)
const SEAT_H = 0.46 / U; // chair seat 0.46 m: BlockChar sit root y = 0.46 - 1.5 * scale (rig note), as ShotsB's sitAt
const rSEATS: V3[] = [[-5.6, 0, 0], [5.6, 0, 0], [0, 0, 3.6], [0, 0, -3.6]];
const rHALL: V3[] = [[-8, 5.4, 0], [0, 5.4, 0], [8, 5.4, 0]];
const rBED: V3 = [5.3, 0, 4.2];
const rBDOOR: V3 = [12, 0, 13];
const rSHOES: V3 = [10.6, 0, 10.1];

/** The bathroom mirror (metres): centre on the wall plane z = 0 (glass faces +z), width, height. */
export const MIRROR: { center: V3; w: number; h: number } = { center: m3(rMIRROR.center), w: rMIRROR.w * U, h: rMIRROR.h * U };
/** Where a person stands at the bathroom sink (feet; 0.56 m out from the glass), facing the mirror (yaw = Math.PI).
 *  The vanity is slim (front edge 0.36 m from the glass), so anyone 0.5 m or more from the glass clears it. */
export const SINK_FRONT: V3 = m3(rSINK);
/** The bathroom doorway behind them (feet, in the 2.2 m-wide opening; the hall continues 3.5 m beyond, +z). */
export const DOORWAY: V3 = m3(rDOOR);
/** A step stool at the sink (Bathroom prop `stool`): stand someone on STOOL_TOP. */
export const STOOL_TOP: V3 = m3(rSTOOL);
/** Kitchen: where dad stands at the sink under the window (feet), facing the window (yaw = Math.PI). */
export const KITCHEN_SINK: V3 = m3(rKSINK);
/** Dining room: the floor point under the table centre (table top 0.8 m high). */
export const TABLE: V3 = [0, 0, 0];
/** Dining chairs: floor point under each seat (seat 0.46 m high). 0 = left end, 1 = right end, 2 = near side (+z), 3 = far side. */
export const SEATS: V3[] = rSEATS.map(m3);
/** Seat height (m) and yaw facing the table for each seat. */
export const SEAT_HEIGHT = 0.46;
export const SEAT_YAW: number[] = [Math.PI / 2, -Math.PI / 2, Math.PI, 0];
/** Root position for a character of BlockChar `scale` sitting (POSES.sit) on seat i. */
export const seatAt = (i: number, scale: number): V3 => [SEATS[i][0], Math.max(0, SEAT_HEIGHT - 1.5 * scale), SEATS[i][2]];
/** Hallway: mirror centres on the back wall z = 0 (glass faces +z = HALL_NORMAL), and a standing spot in front of each. */
export const HALL_MIRRORS: V3[] = rHALL.map(m3);
export const HALL_NORMAL: V3 = [0, 0, 1];
export const HALL_SPOTS: V3[] = HALL_MIRRORS.map(([x]) => [x + 0.5, 0, 0.95]);
/** Jenny's bedroom: floor point under the bed's centre (the made bed's top is 0.55 m up), the door, the shoes by it. */
export const BED: V3 = m3(rBED);
export const BEDROOM_DOOR: V3 = m3(rBDOOR);
export const SHOE_SPOT: V3 = m3(rSHOES);

function spoonSpot(i: number): V3 {
  const q = [[-3.45, -1.35], [3.45, 1.35], [1.4, 1.7], [-1.4, -1.7]][i];
  return [q[0], TABLE_H + 0.06, q[1]];
}

// ───────────────────────────────────────────── canvas textures ─────────────────────────────────────────────
const canv = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
};
const cache = new Map<string, THREE.Texture>();
const cached = (k: string, make: () => THREE.Texture) => { if (!cache.has(k)) cache.set(k, make()); return cache.get(k)!; };
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** The view out of a window: sky, a neighbour's clapboard house, a picket fence, lawn (day) or a deep-blue night with lit windows. */
const viewTex = (night: boolean) => cached(`view${night}`, () => canv(512, 512, (g) => {
  const sky = g.createLinearGradient(0, 0, 0, 330);
  if (night) { sky.addColorStop(0, "#0b1430"); sky.addColorStop(1, "#22386e"); } else { sky.addColorStop(0, "#5aa2ea"); sky.addColorStop(1, "#cfe6fa"); }
  g.fillStyle = sky; g.fillRect(0, 0, 512, 512);
  if (!night) { g.fillStyle = "rgba(255,255,255,0.9)"; [[110, 70, 60], [170, 60, 45], [380, 110, 70], [440, 95, 50]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI * 2); g.fill(); }); }
  else { g.fillStyle = "rgba(255,250,220,0.9)"; for (let i = 0; i < 40; i++) g.fillRect(rnd(i) * 512, rnd(i + 9) * 250, 1.6, 1.6); }
  // neighbour house
  g.fillStyle = night ? "#2b3550" : "#dfe2e4"; g.fillRect(150, 190, 260, 200);
  g.fillStyle = night ? "#1c2238" : "#5d6168"; g.beginPath(); g.moveTo(130, 195); g.lineTo(280, 110); g.lineTo(430, 195); g.fill();
  g.strokeStyle = night ? "rgba(0,0,0,0.25)" : "rgba(120,125,130,0.45)"; g.lineWidth = 1.5;
  for (let y = 200; y < 390; y += 9) { g.beginPath(); g.moveTo(150, y); g.lineTo(410, y); g.stroke(); }
  [[185, 230], [335, 230], [185, 310], [335, 310]].forEach(([x, y], i) => {
    g.fillStyle = night ? (i === 1 ? "#1a2036" : "#ffcf7a") : "#8fa6b8"; g.fillRect(x, y, 40, 52);
    g.fillStyle = night ? "#11162a" : "#3a3f48"; g.fillRect(x - 12, y, 10, 52); g.fillRect(x + 42, y, 10, 52);
  });
  // lawn + fence
  g.fillStyle = night ? "#1b2c22" : "#7fb35a"; g.fillRect(0, 380, 512, 132);
  g.fillStyle = night ? "#4a5470" : "#f6f6f2";
  for (let x = 0; x < 512; x += 22) { g.fillRect(x, 400, 12, 60); g.beginPath(); g.moveTo(x, 400); g.lineTo(x + 6, 392); g.lineTo(x + 12, 400); g.fill(); }
  g.fillRect(0, 415, 512, 6); g.fillRect(0, 445, 512, 6);
}));
/** Frosted bathroom glass. */
const frostTex = (night: boolean) => cached(`frost${night}`, () => canv(128, 128, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, night ? "#2a3a66" : "#eef6ff"); gr.addColorStop(1, night ? "#1a2448" : "#cfe0f0");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${rnd(i) * 0.12})`; g.fillRect(rnd(i * 3) * 128, rnd(i * 5) * 128, 2, 2); }
}));
/** Mirror glass: a faint grey-green tint, greener at the edges, and two soft diagonal highlights. */
const glassTex = () => cached("glass", () => canv(512, 256, (g) => {
  g.fillStyle = "rgba(170,195,190,0.10)"; g.fillRect(0, 0, 512, 256);
  const e = 26; [[0, 0, 512, e, 0, 1], [0, 256 - e, 512, e, 0, -1], [0, 0, e, 256, 1, 0], [512 - e, 0, e, 256, -1, 0]].forEach(([x, y, w, h, dx, dy]) => {
    const gr = dx ? g.createLinearGradient(dx > 0 ? x : x + w, 0, dx > 0 ? x + w : x, 0) : g.createLinearGradient(0, dy > 0 ? y : y + h, 0, dy > 0 ? y + h : y);
    gr.addColorStop(0, "rgba(70,110,100,0.35)"); gr.addColorStop(1, "rgba(70,110,100,0)"); g.fillStyle = gr; g.fillRect(x, y, w, h);
  });
  g.save(); g.translate(256, 128); g.rotate(-0.55);
  const streak = (x: number, w: number, a: number) => { const gr = g.createLinearGradient(x - w, 0, x + w, 0);
    gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(x - w, -400, 2 * w, 800); };
  streak(-150, 60, 0.13); streak(-60, 18, 0.10); streak(170, 40, 0.07);
  g.restore();
}));
/** Terry towel: a cream base with two coloured bands near each end, fine fibre noise. */
const towelTex = (color: string, stripe: string) => cached(`towel${color}${stripe}`, () => {
  const t = canv(256, 256, (g) => {
    g.fillStyle = color; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 7000; i++) { g.fillStyle = `rgba(${rnd(i) > 0.5 ? "255,255,255" : "0,0,0"},${0.04 + rnd(i * 7) * 0.06})`; g.fillRect(rnd(i * 3) * 256, rnd(i * 5) * 256, 1.5, 2.5); }
    g.fillStyle = stripe; [[20, 10], [36, 4], [220, 4], [226, 10]].forEach(([y, h]) => g.fillRect(0, y, 256, h));
    g.fillStyle = "rgba(0,0,0,0.12)"; g.fillRect(0, 0, 256, 4); g.fillRect(0, 252, 256, 4);
  });
  return t;
});
/** A tiny framed-picture print (abstract landscape / family snapshot shapes). */
const pictureTex = (k: number) => cached(`pic${k}`, () => canv(128, 128, (g) => {
  const pal = [["#9cc7e8", "#7fae63", "#e9d27a"], ["#e8c9a8", "#6f8fb5", "#c45c4a"], ["#cfe0d8", "#b0896a", "#f1efe6"], ["#f2d6c2", "#5f9b8a", "#e3b552"]][k % 4];
  g.fillStyle = pal[0]; g.fillRect(0, 0, 128, 128); g.fillStyle = pal[1]; g.beginPath(); g.moveTo(0, 90); g.quadraticCurveTo(50, 50 + k * 6, 128, 80); g.lineTo(128, 128); g.lineTo(0, 128); g.fill();
  g.fillStyle = pal[2]; g.beginPath(); g.arc(30 + k * 20, 34, 13, 0, Math.PI * 2); g.fill();
}));
/** Plain soft fabric weave for bedding/curtains (multiplied by the colour). */
const weave = () => tex("fabric", [3, 3]);

// ───────────────────────────────────────────── building blocks ─────────────────────────────────────────────
type BP = { p: V3; s: V3; m: M; r?: V3; c?: boolean };
/** A box mesh (casts and receives shadows unless c = false). */
const Bx: React.FC<BP> = ({ p, s, m, r, c = true }) => (
  <mesh position={p} rotation={r} castShadow={c} receiveShadow>
    <boxGeometry args={s} /><meshStandardMaterial {...m} />
  </mesh>
);
const Cy: React.FC<{ p: V3; rt: number; rb?: number; h: number; m: M; r?: V3; seg?: number; c?: boolean }> = ({ p, rt, rb, h, m, r, seg: n = 24, c = true }) => (
  <mesh position={p} rotation={r} castShadow={c} receiveShadow>
    <cylinderGeometry args={[rt, rb ?? rt, h, n]} /><meshStandardMaterial {...m} />
  </mesh>
);

type Hole = { c: number; w: number; y0: number; y1: number };
const TRIM = col("#f7f3ea", 0.45);
/** A wall in local space: runs along x (-len/2..len/2), inner face on z = 0 facing +z, height h, with rectangular holes.
 *  Optional lower band (tiles/wainscot) to `band.h`, a baseboard and a crown moulding. Never casts shadows. */
const Wall: React.FC<{ len: number; h: number; holes?: Hole[]; m: (w: number, h: number) => M; band?: { h: number; m: (w: number, h: number) => M; cap?: M }; base?: boolean; crown?: boolean }> = ({ len, h, holes = [], m, band, base = true, crown = true }) => {
  const rects: [number, number, number, number][] = []; // x0, x1, y0, y1
  const hs = [...holes].sort((a, b) => a.c - b.c);
  let x = -len / 2;
  for (const ho of hs) {
    const a = ho.c - ho.w / 2, b = ho.c + ho.w / 2;
    if (a > x) rects.push([x, a, 0, h]);
    if (ho.y0 > 0) rects.push([a, b, 0, ho.y0]);
    if (ho.y1 < h) rects.push([a, b, ho.y1, h]);
    x = b;
  }
  if (x < len / 2) rects.push([x, len / 2, 0, h]);
  const T = 0.4, out: React.ReactNode[] = [];
  rects.forEach(([x0, x1, y0, y1], i) => {
    const parts: [number, number, (w: number, h: number) => M][] = band && y0 < band.h && y1 > band.h ? [[y0, band.h, band.m], [band.h, y1, m]] : [[y0, y1, band && y1 <= band.h ? band.m : m]];
    parts.forEach(([a, b, mf], j) => {
      const w = x1 - x0, hh = b - a; if (w < 0.01 || hh < 0.01) return;
      const mm = mf(w, hh);
      // offset the texture so neighbouring pieces line up
      out.push(<WallPiece key={`${i}.${j}`} x0={x0} x1={x1} y0={a} y1={b} T={T} m={mm} />);
    });
    if (base && y0 === 0) out.push(<Trim key={`b${i}`} x0={x0} x1={x1} y={0.3} h={0.6} d={0.14} m={TRIM} />);
    if (band?.cap && y0 < band.h && y1 > band.h) out.push(<Trim key={`k${i}`} x0={x0} x1={x1} y={band.h} h={0.22} d={0.16} m={band.cap} />);
  });
  if (crown) out.push(<Trim key="crown" x0={-len / 2} x1={len / 2} y={h - 0.25} h={0.5} d={0.22} m={TRIM} under />);
  return <>{out}</>;
};
/** A moulding strip on a wall: its front face and its top (or underside) only, so it vanishes with the wall from outside. */
const Trim: React.FC<{ x0: number; x1: number; y: number; h: number; d: number; m: M; under?: boolean }> = ({ x0, x1, y, h, d, m, under }) => (
  <group position={[(x0 + x1) / 2, y, 0]}>
    <mesh position={[0, 0, d]} receiveShadow><planeGeometry args={[x1 - x0, h]} /><meshStandardMaterial {...m} /></mesh>
    <mesh position={[0, under ? -h / 2 : h / 2, d / 2]} rotation={[under ? Math.PI / 2 : -Math.PI / 2, 0, 0]}><planeGeometry args={[x1 - x0, d]} /><meshStandardMaterial {...m} /></mesh>
  </group>
);
const WallPiece: React.FC<{ x0: number; x1: number; y0: number; y1: number; T: number; m: M }> = ({ x0, x1, y0, y1, T, m }) => {
  const { tile = 8, ...mm } = m as M & { tile?: number };
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0); // one-sided: a camera outside the room sees straight in (film-set walls)
    // world-aligned UVs (one texture tile per `tile` units), so the pattern continues across neighbouring pieces
    const uv = g.attributes.uv as THREE.BufferAttribute, pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + (x0 + x1) / 2) / tile, (pos.getY(i) + (y0 + y1) / 2) / tile);
    return g;
  }, [x0, x1, y0, y1, T, tile]);
  return <mesh geometry={geo} position={[(x0 + x1) / 2, (y0 + y1) / 2, 0]} receiveShadow><meshStandardMaterial {...mm} /></mesh>;
};

type Side = "back" | "front" | "left" | "right";
/** A box room: x -W/2..W/2, z 0..D, height H. Holes given in world terms (back/front: hole centre x; left/right: centre z). */
const Room: React.FC<{
  W: number; D: number; H: number; wall: (w: number, h: number) => M; floor: M; ceil?: M;
  holes?: Partial<Record<Side, Hole[]>>; skip?: Side[]; band?: { h: number; m: (w: number, h: number) => M; cap?: M }; crown?: boolean;
}> = ({ W, D, H, wall, floor, ceil = col("#f6f1e6", 0.9), holes = {}, skip = [], band, crown = true }) => {
  const conv = (s: Side, hs: Hole[] = []): Hole[] => hs.map((h) => ({ ...h, c: s === "back" ? h.c : s === "front" ? -h.c : s === "left" ? D / 2 - h.c : h.c - D / 2 }));
  const walls: [Side, V3, number, number][] = [
    ["back", [0, 0, 0], 0, W], ["front", [0, 0, D], Math.PI, W], ["left", [-W / 2, 0, D / 2], Math.PI / 2, D], ["right", [W / 2, 0, D / 2], -Math.PI / 2, D],
  ];
  return (
    <>
      <mesh position={[0, -0.2, D / 2]} receiveShadow><boxGeometry args={[W + 0.8, 0.4, D + 0.8]} /><meshStandardMaterial {...floor} /></mesh>
      <mesh position={[0, H, D / 2]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[W, D]} /><meshStandardMaterial {...ceil} /></mesh>
      {walls.filter(([s]) => !skip.includes(s)).map(([s, p, ry, len]) => (
        <group key={s} position={p} rotation={[0, ry, 0]}>
          <Wall len={len} h={H} holes={conv(s, holes[s])} m={wall} band={band} crown={crown} />
        </group>
      ))}
    </>
  );
};
/** Wall surface (world-aligned UVs): one texture tile covers `tile` units. */
const wm = (kind: TexKind, color: string, tile = TILE[kind], extra: M = {}) => (_w: number, _h: number): M => ({ ...(mat(kind, color) as M), tile, ...extra } as M);
const plaster = (color: string) => wm("plaster", color);
const wallpaper = (color: string) => wm("wallpaper", color);
const tileWall = (color: string) => wm("tile", color, 1.6, { roughness: 0.3 });
const wainscot = (color: string) => wm("woodDark", color, 3);

/** A window in local wall space (centre at (cx, cy) on the inner face z = 0): outside view, white frame, mullions, sill. */
const Win: React.FC<{ cx: number; cy: number; w: number; h: number; night?: boolean; frost?: boolean; curtains?: string }> = ({ cx, cy, w, h, night = false, frost = false, curtains }) => (
  <group position={[cx, cy, 0]}>
    <mesh position={[0, 0, -0.35]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={frost ? frostTex(night) : viewTex(night)} toneMapped={false} color={night ? "#9aa6c8" : "#f2f2f2"} />
    </mesh>
    {/* frame */}
    <Bx p={[0, h / 2 + 0.12, 0.02]} s={[w + 0.5, 0.25, 0.3]} m={TRIM} c={false} />
    <Bx p={[0, -h / 2 - 0.12, 0.12]} s={[w + 0.9, 0.25, 0.6]} m={TRIM} c={false} />
    <Bx p={[-w / 2 - 0.12, 0, 0.02]} s={[0.25, h + 0.5, 0.3]} m={TRIM} c={false} />
    <Bx p={[w / 2 + 0.12, 0, 0.02]} s={[0.25, h + 0.5, 0.3]} m={TRIM} c={false} />
    {!frost && <><Bx p={[0, 0, -0.2]} s={[0.14, h, 0.12]} m={TRIM} c={false} /><Bx p={[0, 0, -0.2]} s={[w, 0.14, 0.12]} m={TRIM} c={false} /></>}
    {curtains && (
      <>
        <Bx p={[0, h / 2 + 0.55, 0.35]} s={[w + 3, 0.12, 0.12]} m={col("#6b4a2e", 0.5)} c={false} />
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * (w / 2 + 0.6), -0.2, 0.3]} castShadow>
            <boxGeometry args={[1.4, h + 1.4, 0.25, 6, 1, 1]} /><meshStandardMaterial map={weave()} color={curtains} roughness={0.95} />
          </mesh>
        ))}
      </>
    )}
  </group>
);

/** A panelled interior door in local wall space (opening centre x = cx, bottom at y = 0), swung open by `open` (0..1). */
const Door: React.FC<{ cx: number; w?: number; h?: number; open?: number; color?: string; hinge?: 1 | -1; leaf?: boolean }> = ({ cx, w = 4.2, h = 7.2, open = 0, color = "#f4efe4", hinge = -1, leaf = true }) => {
  const dm = color === "wood" ? (mat("wood", "#a8774a", [1, 2]) as M) : col(color, 0.45);
  const ang = open * 1.6 * -hinge;
  return (
    <group position={[cx, 0, 0]}>
      <Bx p={[-w / 2 - 0.15, h / 2, 0.04]} s={[0.3, h + 0.3, 0.3]} m={TRIM} c={false} />
      <Bx p={[w / 2 + 0.15, h / 2, 0.04]} s={[0.3, h + 0.3, 0.3]} m={TRIM} c={false} />
      <Bx p={[0, h + 0.15, 0.04]} s={[w + 0.6, 0.3, 0.3]} m={TRIM} c={false} />
      {leaf && <group position={[hinge * w / 2, 0, -0.1]} rotation={[0, ang, 0]}>
        <group position={[-hinge * w / 2, 0, 0]}>
          <Bx p={[0, h / 2, 0]} s={[w - 0.1, h - 0.05, 0.22]} m={dm} />
          {[[-0.55, 0.68], [0.55, 0.68], [-0.55, 0.27], [0.55, 0.27]].map(([px, py]) => (
            <Bx key={`${px}${py}`} p={[px * (w / 2.2), py * h, 0.12]} s={[w * 0.36, h * (py > 0.5 ? 0.42 : 0.36), 0.04]} m={{ ...dm, color: color === "wood" ? "#946640" : "#ebe5d8" }} c={false} />
          ))}
          <mesh position={[-hinge * (w / 2 - 0.45), 3.4, 0.22]} castShadow><sphereGeometry args={[0.17, 16, 12]} /><meshStandardMaterial color="#c9a650" metalness={0.6} roughness={0.3} /></mesh>
        </group>
      </group>}
    </group>
  );
};

/** A small framed picture on a wall (local wall space). */
const Picture: React.FC<{ p: V3; w: number; h: number; k: number; frame?: string }> = ({ p, w, h, k, frame = "#5a3e28" }) => (
  <group position={p}>
    <Bx p={[0, 0, 0.06]} s={[w + 0.3, h + 0.3, 0.12]} m={col(frame, 0.5)} c={false} />
    <mesh position={[0, 0, 0.13]}><planeGeometry args={[w, h]} /><meshStandardMaterial map={pictureTex(k)} roughness={0.7} /></mesh>
  </group>
);
/** A warm glowing bulb / shade (emissive; no light of its own). */
const Glow: React.FC<{ p: V3; r?: number; on?: boolean; color?: string }> = ({ p, r = 0.3, on = true, color = "#fff1cf" }) => (
  <mesh position={p}><sphereGeometry args={[r, 18, 12]} /><meshStandardMaterial color={color} emissive={on ? "#ffd89a" : "#000"} emissiveIntensity={on ? 2.2 : 0} roughness={0.4} /></mesh>
);
/** A potted plant (pot + a cluster of leafy blobs). */
const Plant: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => (
  <group position={p} scale={s}>
    <Cy p={[0, 0.45, 0]} rt={0.55} rb={0.42} h={0.9} m={col("#c46a45", 0.7)} />
    {[[0, 1.5, 0, 0.6], [0.4, 1.25, 0.2, 0.45], [-0.38, 1.3, -0.1, 0.48], [0.1, 1.95, -0.15, 0.42]].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} castShadow><icosahedronGeometry args={[r, 1]} /><meshStandardMaterial color={i % 2 ? "#4f8a3c" : "#5f9c46"} roughness={0.8} flatShading /></mesh>
    ))}
  </group>
);

// ───────────────────────────────────────────── props (exported) ─────────────────────────────────────────────
type PropP = { position?: V3; rotation?: V3; scale?: number };
/** A shaving razor (about 1.1 long along +y, handle at the origin): hold it by the origin. */
export const Razor: React.FC<PropP & { color?: string }> = ({ position, rotation, scale = 1, color = "#3a74c9" }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <Cy p={[0, 0.4, 0]} rt={0.09} rb={0.11} h={0.85} m={col(color, 0.35)} seg={14} />
    <Cy p={[0, 0.12, 0]} rt={0.12} h={0.12} m={col("#d8d8dc", 0.25, { metalness: 0.7 })} seg={14} />
    <Bx p={[0, 0.92, 0.02]} s={[0.5, 0.2, 0.14]} m={col("#e8e8ec", 0.25, { metalness: 0.6 })} />
    <Bx p={[0, 0.92, 0.1]} s={[0.46, 0.06, 0.03]} m={col("#9aa0a8", 0.15, { metalness: 0.9 })} c={false} />
  </group>
);
/** A soup spoon lying along +x (bowl at +x), about 1.1 long; origin at its middle, resting on y = 0. */
export const Spoon: React.FC<PropP> = ({ position, rotation, scale = 1 }) => {
  const m = col("#d9dde2", 0.18, { metalness: 0.75 });
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0.36, 0.05, 0]} scale={[0.26, 0.06, 0.19]} castShadow><sphereGeometry args={[1, 20, 12]} /><meshStandardMaterial {...m} /></mesh>
      <Bx p={[-0.2, 0.04, 0]} s={[0.8, 0.04, 0.08]} m={m} />
      <Bx p={[-0.56, 0.05, 0]} s={[0.18, 0.05, 0.13]} m={m} />
    </group>
  );
};
/** A pair of kid's sneakers side by side, toes toward +z (about 1.6 wide, 1.3 long). */
export const Shoes: React.FC<PropP & { color?: string; sole?: string }> = ({ position, rotation, scale = 1, color = "#c24a8a", sole = "#f4f1ea" }) => (
  <group position={position} rotation={rotation} scale={scale}>
    {[-0.42, 0.42].map((x, i) => (
      <group key={x} position={[x, 0, i ? 0.12 : 0]} rotation={[0, i ? -0.08 : 0.06, 0]}>
        <Bx p={[0, 0.09, 0]} s={[0.62, 0.18, 1.3]} m={col(sole, 0.6)} />
        <Bx p={[0, 0.36, -0.12]} s={[0.56, 0.4, 1.0]} m={{ ...(mat("fabric", color, [1, 1]) as M), roughness: 0.85 }} />
        <mesh position={[0, 0.3, 0.38]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.75]} castShadow><cylinderGeometry args={[0.28, 0.28, 0.4, 16, 1, false, 0, Math.PI]} /><meshStandardMaterial {...(mat("fabric", color, [1, 1]) as M)} roughness={0.85} /></mesh>
        <Bx p={[0, 0.58, -0.05]} s={[0.36, 0.04, 0.5]} m={col("#ffffff", 0.7)} c={false} />
      </group>
    ))}
  </group>
);
/** A towel prop. `hang` (default) = a flat towel hanging from its top edge at the origin (w x h, gentle folds);
 *  `folded` = a neat folded stack sitting on y = 0. */
export const Towel: React.FC<PropP & { w?: number; h?: number; color?: string; stripe?: string; folded?: boolean }> = ({ position, rotation, scale = 1, w = 2.4, h = 3.4, color = "#f3ede0", stripe = "#4f86b8", folded = false }) => {
  const map = towelTex(color, stripe);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h, 24, 16); g.translate(0, -h / 2, 0);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x * 2.6) * 0.06 * (-y / h) + 0.02); }
    g.computeVertexNormals(); return g;
  }, [w, h]);
  if (folded) return (
    <group position={position} rotation={rotation} scale={scale}>
      {[0, 1, 2].map((i) => <Bx key={i} p={[0, 0.2 + i * 0.4, 0]} s={[w * 0.6, 0.38, 1.2]} m={{ map, color: "#ffffff", roughness: 1 }} />)}
    </group>
  );
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo} castShadow receiveShadow><meshStandardMaterial map={map} roughness={1} side={THREE.DoubleSide} /></mesh>
    </group>
  );
};

/** A cloth sheet hung over the top of a mirror frame (local: frame top centre at origin, mirror below on z = 0).
 *  `k` 0..1 = pulled off toward +z (0 = hanging, 1 = gone). `hang` 0..1 = being draped on from above (1 = fully covering). */
const MirrorTowel: React.FC<{ w: number; h: number; k?: number; hang?: number; color?: string; stripe?: string; seed?: number }> = ({ w, h, k = 0, hang = 1, color = "#f2ebdc", stripe = "#6f9ac2", seed = 0 }) => {
  const NX = 30, NY = 24;
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1, 1, NX, NY);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i) * 1.6); // stripes run across, near both ends
    return g;
  }, []);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const pull = io(seg(k, 0, 0.6)), fall = io(seg(k, 0.4, 1)), drape = io(hang);
  for (let j = 0; j <= NY; j++) {
    const v = j / NY; // 0 = top edge (the fold over the frame), 1 = bottom hem
    for (let i = 0; i <= NX; i++) {
      const u = i / NX - 0.5, idx = j * (NX + 1) + i;
      let x = u * w, y: number, z: number;
      if (v < 0.08) { // the back flap over the frame top
        const a = v / 0.08; y = 0.12 + Math.sin(a * Math.PI) * 0.12; z = lerpN(-0.25, 0.3, a);
      } else {
        const vv = (v - 0.08) / 0.92, len = h * drape;
        y = -vv * len + Math.sin(u * 9 + seed) * 0.04; z = 0.3 + Math.sin(u * 7.5 + seed * 2) * 0.09 * vv + vv * 0.08;
      }
      // pulled off: the hem comes toward the puller first, then everything sweeps down and away to the side
      const vv = Math.max(0, v - 0.04);
      z += pull * (Math.pow(vv, 1.2) * 2.6 + 0.5) + fall * 1.6;
      y -= pull * (1.2 + vv * h * 0.35) + fall * 7 * (0.6 + 0.4 * vv);
      x = x * (1 - 0.3 * pull * vv) + fall * 4;
      z += (pull + fall) * Math.sin(u * 5 + v * 7 + k * 9) * 0.25 * vv;
      pos.setXYZ(idx, x, y, z);
    }
  }
  pos.needsUpdate = true; geo.computeVertexNormals();
  if (k >= 0.999 || hang <= 0.001) return null;
  const op = 1 - seg(k, 0.85, 1);
  return (
    <mesh geometry={geo} castShadow={k < 0.3} receiveShadow>
      <meshStandardMaterial map={towelTex(color, stripe)} roughness={1} side={THREE.DoubleSide} transparent={op < 1} opacity={op} />
    </mesh>
  );
};
const lerpN = (a: number, b: number, u: number) => a + (b - a) * u;

// ───────────────────────────────────────────── BATHROOM ─────────────────────────────────────────────
const BW = 22, BD = 18, BH = 10;
const MX0 = rMIRROR.center[0] - rMIRROR.w / 2, MX1 = rMIRROR.center[0] + rMIRROR.w / 2;
const MY0 = rMIRROR.center[1] - rMIRROR.h / 2, MY1 = rMIRROR.center[1] + rMIRROR.h / 2;

/** Everything in the bathroom except the mirror wall (drawn twice: real, and reflected behind the glass). */
const BathContents: React.FC<{ night: boolean; stool: boolean }> = ({ night, stool }) => {
  const wood = { ...(mat("plaster", "#f3efe6", [2, 1]) as M), roughness: 0.45 }; // painted cabinet
  const counter = { ...(mat("plaster", "#e9e6e1", [2, 1]) as M), roughness: 0.25 };
  const porcelain = col("#fbfbf8", 0.18);
  const chrome = col("#e2e5ea", 0.15, { metalness: 0.8 });
  return (
    <group>
      <Room W={BW} D={BD} H={BH} skip={["back"]} wall={plaster("#cfe0d6")} floor={{ ...(mat("tile", "#d7d3cb", [BW / 1.6, BD / 1.6]) as M), roughness: 0.4 }}
        band={{ h: 4, m: tileWall("#f7f5f0"), cap: col("#ffffff", 0.3) }} crown
        holes={{ front: [{ c: rDOOR[0], w: 7, y0: 0, y1: 7.6 }], right: [{ c: 7.6, w: 3.4, y0: 5.2, y1: 8.2 }] }} />
      {/* vanity: painted cabinet, stone top, two basins, chrome taps */}
      <Bx p={[0, 1.15, 0.5]} s={[14, 2.3, 1.0]} m={wood} />
      {[-5.25, -1.75, 1.75, 5.25].map((x) => <Bx key={x} p={[x, 1.2, 1.02]} s={[3.2, 1.9, 0.06]} m={{ ...wood, color: "#e9e4d8" }} c={false} />)}
      {[-5.25, -1.75, 1.75, 5.25].map((x) => <Bx key={`h${x}`} p={[x + (x < 0 ? 1.1 : -1.1), 1.7, 1.08]} s={[0.1, 0.5, 0.06]} m={chrome} c={false} />)}
      <Bx p={[0, 2.45, 0.56]} s={[14.4, 0.3, 1.12]} m={counter} />
      <Bx p={[0, 2.95, 0.12]} s={[14.4, 0.7, 0.2]} m={counter} c={false} />
      {[-3.4, 3.4].map((x) => (
        <group key={x}>
          <mesh position={[x, 2.62, 0.62]} scale={[1, 0.18, 0.42]}><cylinderGeometry args={[1.1, 0.95, 1, 32]} /><meshStandardMaterial {...porcelain} /></mesh>
          <mesh position={[x, 2.66, 0.62]} scale={[1, 1, 0.42]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.9, 32]} /><meshStandardMaterial color="#e6ebee" roughness={0.15} /></mesh>
          <Cy p={[x, 3.0, 0.22]} rt={0.09} h={0.75} m={chrome} seg={12} />
          <Bx p={[x, 3.35, 0.38]} s={[0.14, 0.12, 0.36]} m={chrome} />
          {[-0.55, 0.55].map((dx) => <Cy key={dx} p={[x + dx, 2.75, 0.24]} rt={0.1} h={0.25} m={chrome} seg={10} />)}
        </group>
      ))}
      {/* counter clutter: toothbrush cup, soap pump, folded hand towel, small plant */}
      <Cy p={[-0.9, 2.95, 0.5]} rt={0.24} rb={0.2} h={0.7} m={col("#7fb2c9", 0.3)} />
      {[[-0.98, 0.45, 0.2, "#e84a4a"], [-0.82, 0.55, -0.15, "#4a8ae8"], [-0.92, 0.4, 0, "#4cc06a"]].map(([x, z, rz, cc]) => (
        <Bx key={String(cc)} p={[x as number, 3.5, z as number]} s={[0.07, 0.9, 0.07]} r={[0, 0, rz as number]} m={col(cc as string, 0.4)} c={false} />
      ))}
      <Cy p={[0.6, 2.95, 0.5]} rt={0.2} h={0.75} m={col("#f2e6c9", 0.3)} /><Cy p={[0.6, 3.45, 0.5]} rt={0.05} h={0.3} m={chrome} />
      <Towel folded position={[5.8, 2.6, 0.55]} w={1.6} color="#f2ebdc" stripe="#6f9ac2" />
      <Plant p={[-6.2, 2.6, 0.5]} s={0.5} />
      {/* vanity light bar over the mirror (3 frosted globes) */}
      <Bx p={[0, MY1 + 0.75, 0.15]} s={[7, 0.18, 0.3]} m={chrome} c={false} />
      {[-2.6, 0, 2.6].map((x) => <group key={x}><Cy p={[x, MY1 + 0.75, 0.45]} rt={0.08} h={0.5} r={[Math.PI / 2, 0, 0]} m={chrome} seg={8} c={false} /><Glow p={[x, MY1 + 0.6, 0.75]} r={0.42} /></group>)}
      {/* toilet on the left wall */}
      <group position={[-9.6, 0, 6]} rotation={[0, Math.PI / 2, 0]}>
        <Cy p={[0, 0.8, 0.6]} rt={0.75} rb={0.55} h={1.6} m={porcelain} />
        <mesh position={[0, 1.65, 0.75]} scale={[1, 0.15, 1.25]}><cylinderGeometry args={[0.95, 0.95, 1, 28]} /><meshStandardMaterial {...porcelain} /></mesh>
        <Bx p={[0, 2.3, -0.35]} s={[2.0, 1.4, 0.8]} m={porcelain} />
        <Bx p={[0, 3.05, -0.35]} s={[2.15, 0.15, 0.9]} m={porcelain} />
      </group>
      {/* bathtub with a shower curtain along the left wall, far end */}
      <group position={[-9, 0, 14.3]}>
        <Bx p={[0, 1.15, 0]} s={[4, 2.3, 7.2]} m={porcelain} />
        <Bx p={[0, 2.2, 0]} s={[3.2, 0.25, 6.4]} m={col("#dde7ea", 0.2)} c={false} />
        <Cy p={[2.0, 8.4, 0]} rt={0.06} h={7.4} r={[Math.PI / 2, 0, 0]} m={chrome} seg={8} c={false} />
        <mesh position={[2.0, 5.2, 1.3]} castShadow>
          <boxGeometry args={[0.12, 6.3, 4.6]} /><meshStandardMaterial map={stripesTex()} color="#ffffff" roughness={0.8} />
        </mesh>
      </group>
      {/* towel bar on the right wall with two towels; frosted window above */}
      <Bx p={[10.6, 6.0, 12.5]} s={[0.25, 0.12, 5]} m={chrome} c={false} />
      <Towel position={[10.5, 6.0, 11.4]} rotation={[0, -Math.PI / 2, 0]} w={2.2} h={3.6} color="#e9b9a8" stripe="#f7efe4" />
      <Towel position={[10.5, 6.0, 13.6]} rotation={[0, -Math.PI / 2, 0]} w={2.2} h={3.2} color="#f2ebdc" stripe="#6f9ac2" />
      <group position={[BW / 2, 0, 7.6]} rotation={[0, -Math.PI / 2, 0]}><Win cx={0} cy={6.7} w={3.4} h={3.0} night={night} frost /></group>
      {/* bath mat at the sink, a laundry basket, the door (open into the hall) and its hall stub */}
      <Bx p={[0, 0.04, 2.6]} s={[6, 0.08, 2.6]} m={{ ...(mat("carpet", "#8fb3c7", [2, 1]) as M), roughness: 1 }} c={false} />
      <Cy p={[8.8, 1.1, 3.0]} rt={0.9} rb={0.75} h={2.2} m={{ ...(mat("fabric", "#c9b08a", [2, 1]) as M), roughness: 0.9 }} />
      <group position={[0, 0, BD]} rotation={[0, Math.PI, 0]}><Door cx={-rDOOR[0]} w={7} h={7.6} open={1} hinge={1} leaf={false} /></group>
      <HallStub x={rDOOR[0]} z={BD} night={night} />
      {stool && (
        <group position={[rSTOOL[0], 0, rSTOOL[2]]}>
          <Bx p={[0, rSTOOL[1] - 0.1, 0]} s={[2.2, 0.2, 1.6]} m={col("#e5dccb", 0.5)} />
          <Bx p={[-0.9, 0.45, 0]} s={[0.2, 0.9, 1.5]} m={col("#d9cfbd", 0.5)} />
          <Bx p={[0.9, 0.45, 0]} s={[0.2, 0.9, 1.5]} m={col("#d9cfbd", 0.5)} />
        </group>
      )}
      {/* ceiling lamp */}
      <Cy p={[0, BH - 0.15, 9]} rt={1.1} rb={0.9} h={0.3} m={col("#fff6e2", 0.4, { emissive: "#ffe2b0", emissiveIntensity: night ? 0.2 : 1.2 })} c={false} />
    </group>
  );
};
const stripesTex = () => cached("curtain", () => { const t = canv(128, 128, (g) => {
  g.fillStyle = "#f4f1ea"; g.fillRect(0, 0, 128, 128); ["#9cc3d6", "#f4f1ea", "#c7dfe8", "#f4f1ea"].forEach((cc, i) => { g.fillStyle = cc; g.fillRect(i * 32, 0, 16, 128); });
}); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 1); return t; });

/** A short stretch of upstairs hall beyond a doorway in the wall z = z0 (so the open door never shows a void). */
const HallStub: React.FC<{ x: number; z: number; night: boolean }> = ({ x, z, night }) => (
  <group position={[x, 0, z]}>
    <Bx p={[0, -0.2, 6]} s={[13, 0.4, 12]} m={mat("wood", "#a8763f", rep("wood", 13, 12)) as M} c={false} />
    <Bx p={[0, BH + 0.2, 6]} s={[13, 0.4, 12]} m={col("#f2ece0", 0.9)} c={false} />
    <Bx p={[-6.4, BH / 2, 6]} s={[0.4, BH, 12]} m={mat("plaster", "#e8dcc4", rep("plaster", 12, BH)) as M} c={false} />
    <Bx p={[6.4, BH / 2, 6]} s={[0.4, BH, 12]} m={mat("plaster", "#e8dcc4", rep("plaster", 12, BH)) as M} c={false} />
    <Bx p={[0, BH / 2, 11.6]} s={[13, BH, 0.4]} m={mat("wallpaper", "#e9dcc0", rep("wallpaper", 13, BH)) as M} c={false} />
    <Bx p={[0, 0.3, 11.35]} s={[13, 0.6, 0.12]} m={TRIM} c={false} />
    <group position={[0, 0, 11.4]} rotation={[0, Math.PI, 0]}><Picture p={[0, 5.6, 0]} w={2.2} h={1.7} k={1} /></group>
    <Bx p={[0, 0.06, 5]} s={[3.4, 0.1, 9]} m={{ ...(mat("carpet", "#9c4a3c", [1, 2]) as M), roughness: 1 }} c={false} />
    <Glow p={[3.9, 6.6, 5]} r={0.35} on={!night} />
    {!night && <PL p={[2.5, 7, 4]} i={30} d={14} color="#ffd29a" />}
  </group>
);

/** The family bathroom. See the header for the mirror. `night`: the window goes dark, the ceiling lamp dims, the hall is dark. */
export const Bathroom: React.FC<{ towel: number; mirrorWorld: React.ReactNode; night?: boolean; stool?: boolean }> = ({ towel, mirrorWorld, night = false, stool = false }) => {
  const k = c01(towel);
  const glassMap = glassTex();
  const vanity: V3 = [0, MY1 + 0.6, 1.4];
  const amp = night ? 55 : 40;
  return (
    <group>
      {/* characters for the reflection, already placed behind the glass by the shot (world metres) */}
      {mirrorWorld}
      <group scale={U}>
      {/* the room */}
      <BathContents night={night} stool={stool} />
      <Wall len={BW} h={BH} holes={[{ c: rMIRROR.center[0], w: rMIRROR.w, y0: MY0, y1: MY1 }]} m={tileWall("#f7f5f0")} band={{ h: 4, m: tileWall("#f7f5f0") }} base crown />
      {/* tiles above the band on the mirror wall are painted like the rest */}
      {/* the reflection: the room mirrored through z = 0, plus whatever the shot puts in it */}
      <group scale={[1, 1, -1]}>
        <BathContents night={night} stool={stool} />
        <group position={[rMIRROR.center[0], MY1 + 0.35, 0]}><MirrorTowel w={rMIRROR.w + 0.8} h={rMIRROR.h + 0.6} k={k} /></group>
      </group>
      {/* mirror frame + glass */}
      <Bx p={[rMIRROR.center[0], MY1 + 0.12, 0.07]} s={[rMIRROR.w + 0.5, 0.25, 0.14]} m={col("#d9dde1", 0.2, { metalness: 0.5 })} c={false} />
      <Bx p={[rMIRROR.center[0], MY0 - 0.05, 0.07]} s={[rMIRROR.w + 0.5, 0.12, 0.14]} m={col("#d9dde1", 0.2, { metalness: 0.5 })} c={false} />
      <Bx p={[MX0 - 0.12, rMIRROR.center[1], 0.07]} s={[0.25, rMIRROR.h + 0.4, 0.14]} m={col("#d9dde1", 0.2, { metalness: 0.5 })} c={false} />
      <Bx p={[MX1 + 0.12, rMIRROR.center[1], 0.07]} s={[0.25, rMIRROR.h + 0.4, 0.14]} m={col("#d9dde1", 0.2, { metalness: 0.5 })} c={false} />
      <mesh position={[rMIRROR.center[0], rMIRROR.center[1], 0.01]} renderOrder={5}>
        <planeGeometry args={[rMIRROR.w, rMIRROR.h]} />
        <meshBasicMaterial map={glassMap} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {/* the towel over the mirror */}
      <group position={[rMIRROR.center[0], MY1 + 0.35, 0]}><MirrorTowel w={rMIRROR.w + 0.8} h={rMIRROR.h + 0.6} k={k} /></group>
      {/* practical light: the vanity bar and its twin behind the glass, so the room and its reflection are lit alike */}
      <PL p={vanity} i={amp} d={26} color="#ffe2b8" />
      <PL p={[vanity[0], vanity[1], -vanity[2]]} i={amp} d={26} color="#ffe2b8" />
      </group>
    </group>
  );
};

// ───────────────────────────────────────────── KITCHEN ─────────────────────────────────────────────
const KW = 26, KD = 18, KH = 10;
/** The kitchen: sink under a big window on the back wall (z = 0), white cabinets, stone counters, tile splash, fridge,
 *  stove, pendant lamps. No mirror anywhere. Dad stands at KITCHEN_SINK. */
export const Kitchen: React.FC<{ night?: boolean }> = ({ night = false }) => {
  const cab = { ...(mat("plaster", "#f4f1ea", [2, 1]) as M), roughness: 0.45 };
  const top = { ...(mat("plaster", "#dcd8d2", [3, 1]) as M), roughness: 0.25 };
  const chrome = col("#d9dde2", 0.2, { metalness: 0.75 });
  const doorsAt = [-11.2, -9, -6.8, -4.6, 4.6, 6.8, 9, 11.2];
  return (
    <group scale={U}>
      <Room W={KW} D={KD} H={KH} wall={plaster("#f2e6c4")} floor={{ ...(mat("tile", "#ece6d8", [KW / 2.2, KD / 2.2]) as M), roughness: 0.35 }}
        holes={{ back: [{ c: 0, w: 6.4, y0: 4.4, y1: 8.6 }], right: [{ c: 12.5, w: 4.2, y0: 0, y1: 7.2 }] }} />
      <Win cx={0} cy={6.5} w={6.4} h={4.2} night={night} curtains={undefined} />
      {/* tile splash band behind the counter */}
      {[[-8.1, 9.8], [8.1, 9.8]].map(([x, w]) => <Bx key={x} p={[x, 3.6, 0.03]} s={[w, 1.9, 0.06]} m={{ ...(mat("tile", "#f5f3ec", [w / 1.6, 1.9 / 1.6]) as M), roughness: 0.3 }} c={false} />)}
      <Bx p={[0, 3.6, 0.03]} s={[6.4, 1.6, 0.06]} m={{ ...(mat("tile", "#f5f3ec", [6.4 / 1.6, 1]) as M), roughness: 0.3 }} c={false} />
      {/* base cabinets along the back wall, counter, sink */}
      <Bx p={[0, 1.2, 1.25]} s={[KW - 0.4, 2.4, 2.5]} m={cab} />
      {[-11.2, -9, -6.8, -4.6, -2.3, 0, 2.3, 4.6, 6.8, 9, 11.2].map((x) => (
        <group key={x}>
          <Bx p={[x, 1.25, 2.52]} s={[2.0, 2.0, 0.06]} m={{ ...cab, color: "#ebe7dc" }} c={false} />
          <Bx p={[x + 0.6, 1.8, 2.58]} s={[0.08, 0.45, 0.08]} m={chrome} c={false} />
        </group>
      ))}
      <Bx p={[0, 2.55, 1.35]} s={[KW - 0.2, 0.3, 2.8]} m={top} />
      <Bx p={[0, 2.62, 1.45]} s={[3.6, 0.2, 2.0]} m={col("#b9bec4", 0.2, { metalness: 0.6 })} c={false} />
      <Bx p={[0, 2.68, 1.45]} s={[3.2, 0.1, 1.6]} m={col("#7c8188", 0.3, { metalness: 0.5 })} c={false} />
      <Cy p={[0, 3.2, 0.45]} rt={0.11} h={1.2} m={chrome} seg={12} />
      <mesh position={[0, 3.85, 0.85]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.45, 0.09, 8, 16, Math.PI]} /><meshStandardMaterial {...chrome} /></mesh>
      {/* stove on the right of the counter */}
      <Bx p={[6.8, 2.75, 1.4]} s={[3.2, 0.1, 2.4]} m={col("#2c2c30", 0.35)} />
      {[[6.0, 0.9], [7.6, 0.9], [6.0, 2.0], [7.6, 2.0]].map(([x, z]) => <Cy key={`${x}${z}`} p={[x, 2.83, z]} rt={0.42} h={0.05} m={col("#141416", 0.5)} seg={20} c={false} />)}
      <Cy p={[6.0, 3.25, 2.0]} rt={0.7} rb={0.6} h={0.8} m={col("#c4473a", 0.35)} />
      {/* upper cabinets either side of the window */}
      {[-1, 1].map((sd) => <Bx key={sd} p={[sd * 8.1, 7.6, 0.9]} s={[9.6, 3.6, 1.8]} m={cab} />)}
      {doorsAt.map((x) => <Bx key={`u${x}`} p={[x, 7.6, 1.82]} s={[2.0, 3.2, 0.06]} m={{ ...cab, color: "#ebe7dc" }} c={false} />)}
      {/* fridge on the left wall, near the back */}
      <group position={[-KW / 2 + 1.6, 0, 5.2]}>
        <Bx p={[0, 4.1, 0]} s={[3.0, 8.2, 3.6]} m={col("#e9ecef", 0.3)} />
        <Bx p={[1.52, 5.6, 0]} s={[0.06, 0.06, 3.5]} m={col("#c7ccd2", 0.3)} c={false} />
        <Bx p={[1.6, 6.6, 1.2]} s={[0.14, 1.6, 0.14]} m={chrome} c={false} />
        <Bx p={[1.6, 4.3, 1.2]} s={[0.14, 1.6, 0.14]} m={chrome} c={false} />
        {[[6.9, 0.2, "#f2c14e"], [7.2, -0.8, "#e05a4a"], [4.6, -0.6, "#5aa0e0"]].map(([y, z, cc]) => (
          <Bx key={String(cc)} p={[1.56, y as number, z as number]} s={[0.04, 0.9, 0.7]} m={col(cc as string, 0.6)} c={false} />
        ))}
      </group>
      {/* counter clutter: kettle, fruit bowl, toaster, dish rack, a hand towel on the oven bar, a wall clock */}
      <Cy p={[-4.2, 3.3, 1.2]} rt={0.5} rb={0.65} h={1.2} m={col("#e2e4e6", 0.2, { metalness: 0.6 })} />
      <mesh position={[-7.0, 2.95, 1.4]} scale={[1, 0.5, 1]}><sphereGeometry args={[0.95, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><meshStandardMaterial color="#d8c8a8" roughness={0.6} side={THREE.DoubleSide} /></mesh>
      {[[-7.3, 0.2, "#e2483a"], [-6.7, -0.1, "#f2b33a"], [-7.0, 0.35, "#7cbf4a"], [-6.9, -0.35, "#e2483a"]].map(([x, z, cc], i) => (
        <mesh key={i} position={[x as number, 3.05 + (i > 1 ? 0.25 : 0), 1.4 + (z as number)]} castShadow><sphereGeometry args={[0.33, 14, 10]} /><meshStandardMaterial color={cc as string} roughness={0.45} /></mesh>
      ))}
      <Bx p={[10.6, 3.15, 1.2]} s={[1.6, 1.0, 1.0]} m={col("#d24a3c", 0.35)} />
      <Bx p={[2.9, 2.95, 1.2]} s={[1.6, 0.5, 1.4]} m={chrome} />
      <Towel position={[6.8, 2.3, 2.75]} w={1.1} h={1.4} color="#e7d3a8" stripe="#c4473a" />
      <group position={[-8, 8.6, 0.05]}>
        <Cy p={[0, 0, 0]} rt={0.7} h={0.12} r={[Math.PI / 2, 0, 0]} m={col("#ffffff", 0.4)} c={false} />
        <Bx p={[0, 0.2, 0.08]} s={[0.07, 0.45, 0.03]} m={col("#222", 0.5)} c={false} />
        <Bx p={[0.15, 0, 0.08]} s={[0.35, 0.06, 0.03]} m={col("#222", 0.5)} c={false} />
      </group>
      {/* small breakfast table in the room's middle-right, with two chairs */}
      <group position={[-7, 0, 12]}>
        <Bx p={[0, 2.8, 0]} s={[4.2, 0.2, 3.2]} m={mat("wood", "#c39462", [1, 1]) as M} />
        {[[-1.8, -1.3], [1.8, -1.3], [-1.8, 1.3], [1.8, 1.3]].map(([x, z]) => <Bx key={`${x}${z}`} p={[x, 1.35, z]} s={[0.25, 2.7, 0.25]} m={mat("woodDark", "#8a5c36") as M} />)}
        <Cy p={[0, 3.2, 0]} rt={0.4} rb={0.35} h={0.6} m={col("#f4f1ea", 0.4)} />
      </group>
      {/* pendant lamps over the counter */}
      {[-4, 4].map((x) => (
        <group key={x}>
          <Cy p={[x, KH - 1.1, 4]} rt={0.03} h={2.2} m={col("#333", 0.5)} c={false} seg={6} />
          <Cy p={[x, KH - 2.4, 4]} rt={0.35} rb={1.0} h={0.8} m={col("#2f5a4a", 0.45)} c={false} />
          <Glow p={[x, KH - 2.8, 4]} r={0.3} />
        </group>
      ))}
      <group position={[KW / 2, 0, 12.5]} rotation={[0, -Math.PI / 2, 0]}><Door cx={0} open={0.0} color="wood" /></group>
      <PL p={[0, KH - 3, 4]} i={night ? 70 : 40} d={30} color="#ffd9a6" />
    </group>
  );
};

// ───────────────────────────────────────────── DINING ROOM ─────────────────────────────────────────────
const DW = 24, DH = 10;
/** The dining room: a table for four set for dinner (plates, bowls of soup, spoons, glasses, a bread basket) under a warm
 *  pendant lamp; wallpaper over wainscot, a curtained window, a sideboard with photos. Room spans x -12..12, z -9..9
 *  (the table at the origin). `night` (default true: dinner) shows dusk-dark windows. `spoons` false hides the spoons
 *  (when a shot holds its own Spoon). */
export const DiningRoom: React.FC<{ night?: boolean; spoons?: boolean[] | boolean }> = ({ night = true, spoons = true }) => {
  const top = mat("wood", "#9b6a40", [1.2, 1]) as M;
  const leg = mat("woodDark", "#6e4728") as M;
  const plate = col("#fbf8f1", 0.25);
  const show = (i: number) => (Array.isArray(spoons) ? spoons[i] !== false : spoons);
  return (
    <group scale={U}>
      <group position={[0, 0, -9]}>
        <Room W={DW} D={18} H={DH} wall={wallpaper("#e8d9b5")} floor={mat("wood", "#b07a48", rep("wood", DW, 18)) as M}
          band={{ h: 3.4, m: wainscot("#f1ebdf"), cap: col("#f7f3ea", 0.4) }}
          holes={{ back: [{ c: -5, w: 5, y0: 3.8, y1: 8.4 }], right: [{ c: 13.5, w: 4.2, y0: 0, y1: 7.2 }] }} />
        <Win cx={-5} cy={6.1} w={5} h={4.6} night={night} curtains="#9c3f36" />
        <Picture p={[5.5, 6.2, 0]} w={3.2} h={2.3} k={0} />
        <group position={[DW / 2, 0, 13.5]} rotation={[0, -Math.PI / 2, 0]}><Door cx={0} open={0.25} color="wood" /></group>
      </group>
      {/* rug */}
      <Bx p={[0, 0.04, 0]} s={[15, 0.08, 10]} m={{ ...(mat("carpet", "#7d3b33", [3, 2]) as M), roughness: 1 }} c={false} />
      <Bx p={[0, 0.06, 0]} s={[13.6, 0.08, 8.6]} m={{ ...(mat("carpet", "#c9a46a", [3, 2]) as M), roughness: 1 }} c={false} />
      <Bx p={[0, 0.08, 0]} s={[12.8, 0.08, 7.8]} m={{ ...(mat("carpet", "#8a4038", [3, 2]) as M), roughness: 1 }} c={false} />
      {/* table */}
      <Bx p={[0, TABLE_H - 0.15, 0]} s={[8.4, 0.3, 5.0]} m={top} />
      <Bx p={[0, TABLE_H - 0.45, 0]} s={[7.6, 0.4, 4.2]} m={leg} />
      {[[-3.7, -2.0], [3.7, -2.0], [-3.7, 2.0], [3.7, 2.0]].map(([x, z]) => <Bx key={`${x}${z}`} p={[x, (TABLE_H - 0.4) / 2, z]} s={[0.4, TABLE_H - 0.4, 0.4]} m={leg} />)}
      {/* runner, bread, soup pot, salt & pepper */}
      <Bx p={[0, TABLE_H + 0.01, 0]} s={[7.0, 0.02, 1.3]} m={{ ...(mat("fabric", "#efe4cc", [3, 1]) as M), roughness: 0.95 }} c={false} />
      <Cy p={[1.6, TABLE_H + 0.4, 0]} rt={0.6} rb={0.5} h={0.8} m={col("#3d5e8c", 0.3)} />
      <Cy p={[1.6, TABLE_H + 0.82, 0]} rt={0.63} h={0.08} m={col("#c4683a", 0.6)} c={false} />
      <mesh position={[-1.4, TABLE_H + 0.3, 0]} scale={[1.2, 0.45, 0.8]} castShadow><sphereGeometry args={[0.7, 18, 10]} /><meshStandardMaterial color="#c99a55" roughness={0.8} /></mesh>
      <Cy p={[0.3, TABLE_H + 0.25, 0.25]} rt={0.12} h={0.5} m={col("#ffffff", 0.3)} seg={10} />
      <Cy p={[0.3, TABLE_H + 0.25, -0.25]} rt={0.12} h={0.5} m={col("#3a3a3a", 0.3)} seg={10} />
      {/* four places: plate, soup bowl, spoon, glass, napkin */}
      {rSEATS.map((s, i) => {
        const pp: V3 = [s[0] * 0.62, TABLE_H, s[2] * 0.47];
        const sp = spoonSpot(i);
        const along = i < 2; // end seats: spoon along z
        return (
          <group key={i}>
            <Cy p={[pp[0], TABLE_H + 0.04, pp[2]]} rt={0.95} rb={0.8} h={0.08} m={plate} seg={28} />
            <Cy p={[pp[0], TABLE_H + 0.25, pp[2]]} rt={0.6} rb={0.38} h={0.38} m={plate} seg={24} />
            <Cy p={[pp[0], TABLE_H + 0.4, pp[2]]} rt={0.54} h={0.04} m={col("#d9893f", 0.5)} seg={24} c={false} />
            {show(i) && <Spoon position={sp} rotation={[0, along ? (i === 0 ? 0 : Math.PI) : (i === 2 ? Math.PI / 2 : -Math.PI / 2), 0]} />}
            <Cy p={[along ? pp[0] : -spoonSpot(i)[0], TABLE_H + 0.42, along ? -spoonSpot(i)[2] : pp[2]]} rt={0.24} rb={0.2} h={0.8} m={col("#cfe4ec", 0.1, { transparent: true, opacity: 0.55 })} seg={16} />
          </group>
        );
      })}
      {/* chairs */}
      {rSEATS.map((s, i) => <Chair key={i} p={[s[0] + Math.sin(SEAT_YAW[i]) * -0.1, 0, s[2] + Math.cos(SEAT_YAW[i]) * -0.1]} yaw={SEAT_YAW[i]} />)}
      {/* sideboard with photos and a lamp on the back wall */}
      <group position={[5.5, 0, -8.4]}>
        <Bx p={[0, 1.5, 0]} s={[6, 3.0, 1.6]} m={leg} />
        {[-2, 0, 2].map((x) => <Bx key={x} p={[x, 1.6, 0.82]} s={[1.8, 2.2, 0.05]} m={{ ...leg, color: "#7a5032" }} c={false} />)}
        {[[-2, 0], [-0.8, 2], [0.6, 3]].map(([x, k]) => <group key={x} position={[x, 3.0, 0]} rotation={[-0.12, 0, 0]}><Picture p={[0, 0.6, 0]} w={0.8} h={1.0} k={k} frame="#d9c08a" /></group>)}
        <Cy p={[2.1, 3.5, 0]} rt={0.25} rb={0.35} h={1} m={col("#6d8fa8", 0.4)} />
        <Cy p={[2.1, 4.4, 0]} rt={0.45} rb={0.75} h={0.8} m={col("#fff0cf", 0.6, { emissive: "#ffcf86", emissiveIntensity: 1.2 })} c={false} />
      </group>
      <Plant p={[-10.2, 0, -7.6]} s={1.6} />
      {/* pendant lamp over the table */}
      <Cy p={[0, DH - 1.0, 0]} rt={0.03} h={2} m={col("#333", 0.5)} c={false} seg={6} />
      <Cy p={[0, DH - 2.3, 0]} rt={0.5} rb={1.6} h={1.0} m={col("#e9dcc0", 0.6, { emissive: "#ffcf86", emissiveIntensity: 0.6, side: THREE.DoubleSide })} c={false} />
      <Glow p={[0, DH - 2.8, 0]} r={0.35} />
      <PL p={[0, DH - 3.1, 0]} i={night ? 80 : 40} d={28} color="#ffcf96" />
    </group>
  );
};
const Chair: React.FC<{ p: V3; yaw: number }> = ({ p, yaw }) => {
  const w = mat("wood", "#8e5d36", [0.6, 0.6]) as M;
  return (
    <group position={p} rotation={[0, yaw, 0]}>
      <Bx p={[0, SEAT_H - 0.12, 0]} s={[2.1, 0.22, 2.0]} m={w} />
      <Bx p={[0, SEAT_H + 0.02, 0]} s={[1.8, 0.1, 1.7]} m={{ ...(mat("fabric", "#b74d3e", [1, 1]) as M), roughness: 0.95 }} c={false} />
      {[[-0.9, -0.85], [0.9, -0.85], [-0.9, 0.85], [0.9, 0.85]].map(([x, z]) => <Bx key={`${x}${z}`} p={[x, (SEAT_H - 0.2) / 2, z]} s={[0.2, SEAT_H - 0.2, 0.2]} m={w} />)}
      {/* backrest behind the sitter (local -z) */}
      <Bx p={[0, SEAT_H + 1.5, -0.95]} s={[2.1, 0.35, 0.18]} m={w} />
      {[-0.85, -0.3, 0.3, 0.85].map((x) => <Bx key={x} p={[x, SEAT_H + 0.75, -0.95]} s={[0.16, 1.5, 0.14]} m={w} />)}
    </group>
  );
};

// ───────────────────────────────────────────── HALLWAY ─────────────────────────────────────────────
const HW = 30, HD = 9, HH = 10;
/** The upstairs hallway: three framed mirrors on the back wall z = 0 (HALL_MIRRORS), runner rug, sconces, a side table,
 *  family photos, a door at each end. `towels`: true = every mirror covered by a towel; or per-mirror numbers 0..1 =
 *  how far each towel has been draped on (mom covering them one by one). The uncovered mirrors show a soft hall reflection. */
export const Hallway: React.FC<{ towels: boolean | number[]; night?: boolean }> = ({ towels, night = false }) => {
  const hang = (i: number) => (Array.isArray(towels) ? c01(towels[i] ?? 0) : towels ? 1 : 0);
  const TOW = [["#f2ebdc", "#6f9ac2"], ["#e9b9a8", "#f7efe4"], ["#cfe0d6", "#5c8a72"]];
  return (
    <group scale={U}>
      <Room W={HW} D={HD} H={HH} wall={wallpaper("#e9dcbf")} floor={mat("wood", "#a8743f", rep("wood", HW, HD)) as M}
        band={{ h: 3.4, m: wainscot("#f3eee3"), cap: col("#f7f3ea", 0.4) }}
        holes={{ left: [{ c: 4.5, w: 4.2, y0: 0, y1: 7.2 }], right: [{ c: 4.5, w: 4.2, y0: 0, y1: 7.2 }] }} />
      <group position={[-HW / 2, 0, 4.5]} rotation={[0, Math.PI / 2, 0]}><Door cx={0} color="#f4efe4" /></group>
      <group position={[HW / 2, 0, 4.5]} rotation={[0, -Math.PI / 2, 0]}><Door cx={0} color="#f4efe4" open={0.15} /></group>
      <Bx p={[0, 0.05, 4.5]} s={[HW - 4, 0.1, 3.2]} m={{ ...(mat("carpet", "#2f4f6e", [6, 1]) as M), roughness: 1 }} c={false} />
      <Bx p={[0, 0.07, 4.5]} s={[HW - 5, 0.1, 2.4]} m={{ ...(mat("carpet", "#8a3d36", [6, 1]) as M), roughness: 1 }} c={false} />
      {rHALL.map(([x, y], i) => (
        <group key={i} position={[x, y, 0]}>
          <Bx p={[0, 0, 0.12]} s={[3.6, 4.6, 0.24]} m={mat("woodDark", "#7a5230", [0.5, 0.5]) as M} c={false} />
          <mesh position={[0, 0, 0.25]}><planeGeometry args={[3.0, 4.0]} /><meshStandardMaterial map={hallMirrorTex()} roughness={0.05} metalness={0.2} /></mesh>
          <mesh position={[0, 0, 0.26]}><planeGeometry args={[3.0, 4.0]} /><meshBasicMaterial map={glassTex()} transparent depthWrite={false} toneMapped={false} /></mesh>
          <group position={[0, 2.4, 0.1]}><MirrorTowel w={3.9} h={4.6} hang={hang(i)} color={TOW[i][0]} stripe={TOW[i][1]} seed={i * 1.7} /></group>
          {/* sconce between mirrors */}
          {i < 2 && <group position={[4, 0.6, 0]}><Bx p={[0, 0, 0.1]} s={[0.4, 0.8, 0.2]} m={col("#c9a650", 0.3, { metalness: 0.6 })} c={false} /><Glow p={[0, 0.6, 0.45]} r={0.38} on={!night || true} /></group>}
        </group>
      ))}
      {/* side table with a vase under the middle */}
      <group position={[0, 0, 0.9]}>
        <Bx p={[0, 2.6, 0]} s={[3.2, 0.2, 1.4]} m={mat("wood", "#8e5d36", [1, 0.5]) as M} />
        {[[-1.4, -0.5], [1.4, -0.5], [-1.4, 0.5], [1.4, 0.5]].map(([x, z]) => <Bx key={`${x}${z}`} p={[x, 1.25, z]} s={[0.16, 2.5, 0.16]} m={mat("woodDark", "#6e4728") as M} />)}
        <Cy p={[0.8, 3.2, 0]} rt={0.22} rb={0.32} h={1.0} m={col("#5c8fae", 0.3)} />
        <Plant p={[-0.7, 2.7, 0]} s={0.45} />
      </group>
      {/* family photos on the near (front) wall's inside, seen in reverse shots */}
      <group position={[0, 0, HD]} rotation={[0, Math.PI, 0]}>
        {[[-6, 6.0, 0], [-3.6, 5.5, 2], [3.6, 6.1, 3], [6.2, 5.6, 1]].map(([x, y, k]) => <Picture key={x} p={[x, y, 0]} w={1.6} h={1.9} k={k} />)}
      </group>
      {[-6, 6].map((x) => <PL key={x} p={[x, 7.5, 3]} i={night ? 36 : 24} d={18} color="#ffd29a" />)}
    </group>
  );
};
const hallMirrorTex = () => cached("hallmirror", () => canv(128, 160, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 160); gr.addColorStop(0, "#d9cfb9"); gr.addColorStop(0.55, "#c9b996"); gr.addColorStop(0.56, "#8f6a45"); gr.addColorStop(1, "#7a5532");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 160);
  g.fillStyle = "rgba(255,240,210,0.35)"; g.fillRect(70, 30, 34, 40); g.fillStyle = "rgba(60,45,30,0.25)"; g.fillRect(20, 40, 28, 34);
}));

// ───────────────────────────────────────────── BEDROOM ─────────────────────────────────────────────
const RW = 24, RD = 18, RH = 10;
const ROOMS = [
  { wall: "#e6d7ef", duvet: "#9a6cc4", trim: "#f2e6f7", rug: "#c7b2de", shoe: "#c24a8a", poster: 2 }, // Jenny: lilac + purple
  { wall: "#d5e3ee", duvet: "#4a78b0", trim: "#eef4f8", rug: "#9fb7cf", shoe: "#3a5f9a", poster: 1 },
  { wall: "#efe0c9", duvet: "#c46a45", trim: "#f7efe2", rug: "#d9b48a", shoe: "#4f8a3c", poster: 0 },
];
/** A kid's empty bedroom: the bed perfectly made against the back wall (BED), a window with curtains, nightstand + lamp,
 *  dresser, rug, posters, and the shoes waiting by the door (SHOE_SPOT, door at BEDROOM_DOOR on the right wall).
 *  `variant` 0 = Jenny's (lilac), 1, 2 = other missing people's rooms (beat 2). `night` darkens the window. */
export const Bedroom: React.FC<{ variant?: number; night?: boolean; shoes?: boolean }> = ({ variant = 0, night = false, shoes = true }) => {
  const R = ROOMS[variant % ROOMS.length];
  const frame = mat("wood", "#b5895c", [1.5, 0.5]) as M;
  const sheetM = { ...(mat("fabric", "#f6f3ec", [3, 3]) as M), roughness: 0.95 };
  const duvM = { ...(mat("fabric", R.duvet, [4, 4]) as M), roughness: 0.95 };
  const [bx, , bz] = rBED; // bed centre; headboard against the back wall z = 0
  return (
    <group scale={U}>
      <Room W={RW} D={RD} H={RH} wall={plaster(R.wall)} floor={mat("wood", "#c08a55", rep("wood", RW, RD)) as M}
        holes={{ left: [{ c: 7, w: 5, y0: 3.6, y1: 8.4 }], right: [{ c: rBDOOR[2], w: 4.2, y0: 0, y1: 7.2 }] }} />
      <group position={[-RW / 2, 0, 7]} rotation={[0, Math.PI / 2, 0]}><Win cx={0} cy={6} w={5} h={4.8} night={night} curtains={variant % 3 === 0 ? "#f0d9ef" : "#f4efe4"} /></group>
      <group position={[RW / 2, 0, rBDOOR[2]]} rotation={[0, -Math.PI / 2, 0]}><Door cx={0} open={-0.6} hinge={1} /></group>
      {/* the bed (7.8 long, top 1.75 = 0.56 m): frame, headboard, mattress, tight duvet, a fold-back, the pillow perfectly centred */}
      <group position={[bx, 0, bz]}>
        <Bx p={[0, 0.55, 0]} s={[5.4, 0.7, 7.8]} m={frame} />
        <Bx p={[0, 2.2, -3.95]} s={[5.8, 4.4, 0.35]} m={frame} />
        <Bx p={[0, 0.9, 3.95]} s={[5.6, 1.8, 0.3]} m={frame} />
        <Bx p={[0, 1.2, 0]} s={[5.0, 0.7, 7.4]} m={sheetM} />
        <Bx p={[0, 1.62, 0.8]} s={[5.2, 0.18, 5.9]} m={duvM} />
        <Bx p={[0, 1.2, 0.8]} s={[5.26, 0.8, 5.7]} m={duvM} c={false} />
        <Bx p={[0, 1.68, -2.35]} s={[5.2, 0.22, 1.0]} m={sheetM} />
        <mesh position={[0, 1.95, -3.1]} scale={[2.0, 0.38, 0.7]} castShadow><sphereGeometry args={[1, 24, 12]} /><meshStandardMaterial {...sheetM} /></mesh>
        <Bx p={[0, 1.76, 2.9]} s={[5.24, 0.1, 1.3]} m={{ ...(mat("fabric", R.trim, [2, 1]) as M), roughness: 0.95 }} c={false} />
      </group>
      {/* nightstand + lamp left of the bed, dresser with a teddy on the left wall's corner, rug, posters */}
      <group position={[bx - 4.3, 0, 1.3]}>
        <Bx p={[0, 1.1, 0]} s={[2.0, 2.2, 1.8]} m={frame} />
        <Bx p={[0, 1.4, 0.92]} s={[1.6, 0.7, 0.05]} m={{ ...frame, color: "#a87d52" }} c={false} />
        <Cy p={[0, 2.6, 0]} rt={0.2} rb={0.3} h={0.8} m={col("#6d8fa8", 0.4)} />
        <Cy p={[0, 3.35, 0]} rt={0.4} rb={0.6} h={0.7} m={col("#fff0cf", 0.6, { emissive: "#ffcf86", emissiveIntensity: night ? 1.4 : 0.15 })} c={false} />
      </group>
      <group position={[-7.5, 0, 1.3]}>
        <Bx p={[0, 1.8, 0]} s={[4.0, 3.6, 2.0]} m={frame} />
        {[0.8, 1.9, 3.0].map((y) => <group key={y}><Bx p={[0, y, 1.02]} s={[3.6, 0.9, 0.05]} m={{ ...frame, color: "#a87d52" }} c={false} /><Bx p={[0, y, 1.1]} s={[0.6, 0.12, 0.1]} m={col("#d8c08a", 0.3, { metalness: 0.5 })} c={false} /></group>)}
        <Teddy p={[-0.9, 3.6, 0.2]} />
        <group position={[0.9, 3.6, 0]} rotation={[-0.1, 0.2, 0]}><Picture p={[0, 0.7, 0]} w={0.9} h={1.1} k={3} frame="#ffffff" /></group>
      </group>
      <mesh position={[bx - 1.5, 0.05, 10]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[3.6, 40]} /><meshStandardMaterial {...(mat("carpet", R.rug, [2, 2]) as M)} roughness={1} /></mesh>
      <Picture p={[bx + 4.6, 6.4, 0]} w={2.0} h={2.8} k={R.poster} frame="#2f2f35" />
      <Picture p={[-2.6, 6.6, 0]} w={1.6} h={1.6} k={R.poster + 1} frame="#f7f3ea" />
      {shoes && <Shoes position={rSHOES} rotation={[0, -Math.PI / 2 + 0.15, 0]} color={R.shoe} />}
      <Cy p={[0, RH - 0.15, 8]} rt={1.1} rb={0.9} h={0.3} m={col("#fff6e2", 0.4, { emissive: "#ffe2b0", emissiveIntensity: night ? 0 : 0.8 })} c={false} />
      <PL p={[0, RH - 2, 8]} i={night ? 12 : 30} d={26} color={night ? "#9fb0e0" : "#ffe0b0"} />
    </group>
  );
};
const Teddy: React.FC<{ p: V3 }> = ({ p }) => {
  const f = { ...(mat("fabric", "#b07a48", [1, 1]) as M), roughness: 1 };
  return (
    <group position={p}>
      <mesh position={[0, 0.5, 0]} castShadow scale={[1, 1.1, 0.85]}><sphereGeometry args={[0.5, 16, 12]} /><meshStandardMaterial {...f} /></mesh>
      <mesh position={[0, 1.25, 0.05]} castShadow><sphereGeometry args={[0.38, 16, 12]} /><meshStandardMaterial {...f} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * 0.3, 1.55, 0]} castShadow><sphereGeometry args={[0.14, 10, 8]} /><meshStandardMaterial {...f} /></mesh>)}
      <mesh position={[0, 1.18, 0.38]}><sphereGeometry args={[0.13, 10, 8]} /><meshStandardMaterial color="#e8d2b0" /></mesh>
    </group>
  );
};

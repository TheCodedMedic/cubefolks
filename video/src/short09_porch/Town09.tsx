// Short 09's street: a copy of Short 6's TOWN (video/src/short06_blocky/Town.tsx), changed for the porch-light story:
// - our house (HOME) and Mr. Bell's house straight across the road (far lot 3) have NO baked porch lamp: the lamps are
//   live components (PorchLamp in Porch09.tsx) that switch on and off and really light the porch;
// - doors are 5 units wide (people walk through them), front paths and gate gaps 5.6 wide;
// - `cut`: a house built as a shell with a real door opening and window opening, so the camera can stand inside
//   (Interior09.tsx furnishes it) and look out at the street.
// Original header:
// TOWN sets for Short 6 (notes/short06/CONTRACT.md, role 4): MyStreet (day/morning/dusk/night), JennyHouseDark, SchoolYard,
// and the props Bike and MissingPoster. Textured like the owner's sample (clapboard siding, shingle roofs, picket fences,
// mowed lawns, concrete sidewalks), built from tex()/mat() (video/src/blocky/Textures.ts).
//
// Units: 1 unit = 1 rig unit (BlockChar 5 units tall = 1.6 m, so 1 m ~ 3.1 units). Feet on y = 0.
// THE STREET runs along x. The near row of houses faces +z, the far row faces -z, across the road.
//   near house body z -8..8 (front wall z = 8), foundation/porch floor top y = 1.2, porch to z ~14, steps to ~15.8
//   lawn z 8..30, picket fence z = 30, sidewalk z 30.5..34.5 (top y 0.12), grass verge 34.5..37.5, curb 37.5..38,
//   road z 38..60 (centre z 49), far side mirrored (far fence z 68, far house fronts z 90).
//   Lots every 32 units along x: LOT_X. Our house (HOME) is LOT_X[4] = 0, Jenny's is next door at LOT_X[5] = 32.
// Lights: these sets add NO real lights (use the LOOK's <Sky/> and <BlockLights/>, or the <StreetSet/> wrapper below);
// windows, porch lamps and street lamps glow with emissive materials and additive glow cards at dusk/night.
// Everything static is merged into one mesh per material (fast to render), cached per variant.
import React, { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { mat as texMat, TILE } from "../blocky/Textures";
import { BlockLights, Sky } from "../blocky/Look";

export type V3 = [number, number, number];
export type TownTime = "day" | "morning" | "dusk" | "night";
type TexKind = keyof typeof TILE;

// ---------------------------------------------------------------------------------------------------------------------
// layout constants
export const LOT_X: number[] = [-128, -96, -64, -32, 0, 32, 64, 96, 128];
export const HOME_I = 4, JENNY_I = 5, BELL_I = 3;
export const STREET = {
  frontZ: 8, porchY: 1.2, fenceZ: 30, sidewalkZ: 32.5, sidewalkY: 0.12, vergeZ: 36, curbZ: 37.75, roadZ: 49, roadW: 22,
  farFenceZ: 68, farSidewalkZ: 65.5, farFrontZ: 90, farZ: 98,
};
/** Our front door: the spot on the porch floor right in front of it (stand a character here, facing -z to go in). */
export const HOME: V3 = [LOT_X[HOME_I] - 3, STREET.porchY, 10.2];
/** Jenny's front door (next door), same convention. */
export const JENNY_HOUSE: V3 = [LOT_X[JENNY_I] + 3, STREET.porchY, 10.2];
/** Where Jenny's bike lies on her front lawn (a free spot, camera-friendly from the sidewalk). */
export const JENNY_LAWN: V3 = [LOT_X[JENNY_I] - 6.5, 0, 22];
/** Handy: a spot on the sidewalk in front of a lot, and the lot's front gate. */
export const sidewalkAt = (x: number): V3 => [x, STREET.sidewalkY, STREET.sidewalkZ];

// ---------------------------------------------------------------------------------------------------------------------
// materials: every key names a texture kind (or "plain"), a colour, and how many units one texture repeat covers
export type MSpec = { kind?: TexKind; color: string; tile?: number; rough?: number; metal?: number; emissive?: string; ei?: number;
  map?: () => THREE.Texture; shadow?: boolean; side?: THREE.Side; alphaTest?: number; transparent?: boolean; opacity?: number };
const SPEC: Record<string, MSpec> = {
  sidingW: { kind: "siding", color: "#f3f2ee" }, sidingC: { kind: "siding", color: "#ece6d8" },
  sidingG: { kind: "sidingGrey", color: "#c4c9cf" }, sidingB: { kind: "sidingGrey", color: "#a9b4c0" },
  sidingS: { kind: "sidingGrey", color: "#d9d5cc" }, sidingY: { kind: "siding", color: "#eadfbf" },
  trim: { kind: "plaster", color: "#fbfbf8", rough: 0.55 },
  shingle: { kind: "shingle", color: "#7d8187" }, shingleD: { kind: "shingle", color: "#55595f" },
  shingleB: { kind: "shingle", color: "#8a7462" },
  brick: { kind: "brick", color: "#ffffff" }, brickRed: { kind: "brick", color: "#d9b8a8" },
  found: { kind: "concrete", color: "#b9b6b0" }, concrete: { kind: "concrete", color: "#e0ddd6" },
  curb: { kind: "concrete", color: "#c8c5be" }, joint: { color: "#8f8c86", rough: 0.9 },
  asphalt: { kind: "asphalt", color: "#ffffff" }, drive: { kind: "asphalt", color: "#d6d6d6" },
  grass: { kind: "grass", color: "#ffffff", tile: 1.5 }, verge: { kind: "grass", color: "#e8f0d8" },
  paint: { color: "#f4f2ea", rough: 0.7 }, paintY: { color: "#e8c547", rough: 0.7 },
  porchFloor: { kind: "wood", color: "#8f969c" }, deck: { kind: "plaster", color: "#e9e7e1" },
  picket: { kind: "plaster", color: "#f7f6f1", rough: 0.6 },
  doorRed: { kind: "wood", color: "#8e2a24", rough: 0.45 }, doorNavy: { kind: "wood", color: "#2c3e5c", rough: 0.45 },
  doorGreen: { kind: "wood", color: "#2f4a3a", rough: 0.45 }, doorBlack: { kind: "wood", color: "#2a2a2c", rough: 0.45 },
  doorWood: { kind: "woodDark", color: "#ffffff", rough: 0.5 },
  shutBlack: { kind: "wood", color: "#2e3033", rough: 0.5 }, shutGreen: { kind: "wood", color: "#33473b", rough: 0.5 },
  shutNavy: { kind: "wood", color: "#2d3a52", rough: 0.5 }, shutGrey: { kind: "wood", color: "#5c636b", rough: 0.5 },
  brass: { color: "#c9a24a", rough: 0.3, metal: 0.6 }, metal: { color: "#2c2f33", rough: 0.45, metal: 0.4 },
  metalG: { color: "#8c9196", rough: 0.4, metal: 0.6 }, black: { color: "#1c1d1f", rough: 0.6 },
  mailRed: { color: "#b3302a", rough: 0.4 }, hydrant: { color: "#c8372d", rough: 0.45 },
  trunk: { kind: "woodDark", color: "#9a8a7a", rough: 0.9 }, trunkD: { kind: "woodDark", color: "#6f655c", rough: 0.9 },
  leaf1: { kind: "grass", color: "#9fb27a", rough: 0.9 }, leaf2: { kind: "grass", color: "#7f9a62", rough: 0.9 },
  leafAut: { kind: "grass", color: "#c9a86a", rough: 0.9 }, hedge: { kind: "grass", color: "#7a9164", rough: 0.95 },
  mulch: { kind: "woodDark", color: "#8a6a55", rough: 1 },
  bin: { color: "#3b5a46", rough: 0.6 }, binG: { color: "#55585c", rough: 0.6 },
  carRed: { color: "#9a2f2a", rough: 0.35, metal: 0.2 }, carBlue: { color: "#3e5872", rough: 0.35, metal: 0.2 },
  carSilver: { color: "#b9bdc2", rough: 0.35, metal: 0.3 }, tyre: { color: "#1d1d1f", rough: 0.8 },
  carGlass: { color: "#26303a", rough: 0.15, metal: 0.3 },
  signY: { color: "#f2c230", rough: 0.5 }, signW: { color: "#f4f4f2", rough: 0.5 }, signG: { color: "#2f6b45", rough: 0.5 },
};

// window glass: canvas textures (uv fitted 0..1 on each pane)
export const canvasTex = (() => {
  const cache = new Map<string, THREE.CanvasTexture>();
  return (key: string, w: number, h: number, paint: (g: CanvasRenderingContext2D, w: number, h: number) => void) => {
    let t = cache.get(key);
    if (!t) {
      const c = document.createElement("canvas"); c.width = w; c.height = h; paint(c.getContext("2d")!, w, h);
      t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; cache.set(key, t);
    }
    return t;
  };
})();
const glassDayTex = () => canvasTex("glassDay", 128, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#dfe9f0"); gr.addColorStop(0.45, "#9fb1bf"); gr.addColorStop(1, "#5d6d7b");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(255,255,255,0.22)"; g.beginPath(); g.moveTo(w * 0.15, h); g.lineTo(w * 0.55, h); g.lineTo(w, h * 0.3); g.lineTo(w, 0); g.closePath(); g.fill();
  g.fillStyle = "rgba(40,50,60,0.25)"; g.fillRect(0, h * 0.78, w, h * 0.22); // inside shade
});
const glassLitTex = (v: number) => canvasTex(`glassLit${v}`, 128, 256, (g, w, h) => {
  const gr = g.createRadialGradient(w * 0.5, h * 0.35, 4, w * 0.5, h * 0.4, h * 0.7);
  gr.addColorStop(0, "#fff1c8"); gr.addColorStop(0.6, "#f7c36e"); gr.addColorStop(1, "#b97a3a");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  if (v === 0) { // curtains at the sides
    g.fillStyle = "rgba(150,70,40,0.75)"; g.beginPath(); g.moveTo(0, 0); g.lineTo(w * 0.3, 0); g.quadraticCurveTo(w * 0.12, h * 0.5, w * 0.2, h); g.lineTo(0, h); g.fill();
    g.beginPath(); g.moveTo(w, 0); g.lineTo(w * 0.7, 0); g.quadraticCurveTo(w * 0.88, h * 0.5, w * 0.8, h); g.lineTo(w, h); g.fill();
  } else if (v === 1) { // half-drawn blind
    g.fillStyle = "rgba(235,215,170,0.9)"; g.fillRect(0, 0, w, h * 0.38);
    g.fillStyle = "rgba(120,80,40,0.35)"; for (let y = 0; y < h * 0.38; y += 8) g.fillRect(0, y, w, 1.5);
  } else { // a lamp and a shelf silhouette
    g.fillStyle = "rgba(90,50,25,0.55)"; g.fillRect(w * 0.1, h * 0.62, w * 0.5, h * 0.06); g.fillRect(w * 0.62, h * 0.55, w * 0.2, h * 0.45);
  }
});
const glassDarkTex = () => canvasTex("glassDark", 64, 128, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#1b2840"); gr.addColorStop(0.5, "#0b1020"); gr.addColorStop(1, "#141c30");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
const GLASS: Record<string, MSpec> = {
  glassDay: { color: "#ffffff", rough: 0.12, metal: 0.15, map: glassDayTex, shadow: false },
  glassDusk: { color: "#e8b48a", rough: 0.15, metal: 0.2, map: glassDayTex, shadow: false },
  glassLit0: { color: "#ffffff", map: () => glassLitTex(0), emissive: "#ffffff", ei: 1.05, shadow: false },
  glassLit1: { color: "#ffffff", map: () => glassLitTex(1), emissive: "#ffffff", ei: 1.05, shadow: false },
  glassLit2: { color: "#ffffff", map: () => glassLitTex(2), emissive: "#ffffff", ei: 1.05, shadow: false },
  glassDark: { color: "#ffffff", rough: 0.1, metal: 0.3, map: glassDarkTex, shadow: false },
  bulbOn: { color: "#fff4d6", emissive: "#ffd48a", ei: 2.6, shadow: false },
  bulbOff: { color: "#e9e6dc", rough: 0.25, shadow: false },
  glassClear: { color: "#a9bfd6", rough: 0.05, metal: 0.3, opacity: 0.12, shadow: false },
};

const matCache = new Map<string, THREE.Material>();
export function material(key: string): THREE.Material {
  let m = matCache.get(key);
  if (m) return m;
  const s = SPEC[key] ?? GLASS[key] ?? EXTRA[key];
  if (!s) throw new Error(`Town: unknown material ${key}`);
  const natural = s.color.toLowerCase() === "#ffffff";
  const p: THREE.MeshStandardMaterialParameters = s.kind ? { ...texMat(s.kind, natural ? undefined : s.color) } : { color: s.color };
  if (s.kind) { // the UVs are in world units / tile, so the map must repeat 1:1
    if (!natural) p.color = s.color;
  }
  if (s.map) p.map = s.map();
  if (s.rough !== undefined) p.roughness = s.rough; else if (p.roughness === undefined) p.roughness = 0.7;
  if (s.metal !== undefined) p.metalness = s.metal;
  if (s.emissive) { p.emissive = new THREE.Color(s.emissive); p.emissiveIntensity = s.ei ?? 1; if (s.map) p.emissiveMap = p.map; }
  if (s.side !== undefined) p.side = s.side;
  if (s.alphaTest !== undefined) { p.alphaTest = s.alphaTest; }
  if (s.transparent) p.transparent = true;
  if (s.opacity !== undefined) { p.transparent = true; p.opacity = s.opacity; p.depthWrite = false; }
  // drop any normal/rough maps LOOK may attach with its own repeat (our UVs are world-scaled)
  m = new THREE.MeshStandardMaterial(p);
  matCache.set(key, m);
  return m;
}
const tileOf = (key: string) => { const s = SPEC[key] ?? EXTRA[key]; return s?.kind ? TILE[s.kind] * (s.tile ?? 1) : 0; };
const castsShadow = (key: string) => ((SPEC[key] ?? GLASS[key] ?? EXTRA[key])?.shadow ?? true);
export const EXTRA: Record<string, MSpec> = {};

// ---------------------------------------------------------------------------------------------------------------------
// Kit: collects transformed geometry per material, then merges each material into one mesh.
const _box = new THREE.BoxGeometry(1, 1, 1);
const _cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
const _cyl8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
const _ico = new THREE.IcosahedronGeometry(1, 2);
const _sph = new THREE.SphereGeometry(1, 20, 14);
type Glow = { p: V3; size: number; kind: "halo" | "pool"; color: string; o: number; n?: V3 };
const E = (x = 0, y = 0, z = 0, order: THREE.EulerOrder = "XYZ") => new THREE.Euler(x, y, z, order);
const TR = (p: V3, r?: THREE.Euler, s?: V3) => new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(r ?? E()), new THREE.Vector3(...(s ?? [1, 1, 1])));

export class Kit {
  parts = new Map<string, THREE.BufferGeometry[]>();
  glows: Glow[] = [];
  stack: THREE.Matrix4[] = [new THREE.Matrix4()];
  get top() { return this.stack[this.stack.length - 1]; }
  with(m: THREE.Matrix4, f: () => void) { this.stack.push(this.top.clone().multiply(m)); f(); this.stack.pop(); }
  at(p: V3, ry: number, f: () => void) { this.with(TR(p, E(0, ry, 0)), f); }
  add(key: string, g: THREE.BufferGeometry, m?: THREE.Matrix4) {
    const c = g.index ? g.toNonIndexed() : g.clone();
    for (const a of Object.keys(c.attributes)) if (a !== "position" && a !== "normal" && a !== "uv") c.deleteAttribute(a);
    c.applyMatrix4(m ? this.top.clone().multiply(m) : this.top);
    (this.parts.get(key) ?? this.parts.set(key, []).get(key)!).push(c);
  }
  /** a box of real size s at p (rotation r), its UVs in world units / tile of the material (or 0..1 when the tile is 0) */
  box(key: string, p: V3, s: V3, r?: THREE.Euler) {
    const t = tileOf(key);
    const g = new THREE.BoxGeometry(s[0], s[1], s[2]);
    if (t > 0) {
      const uv = g.attributes.uv as THREE.BufferAttribute;
      const dims: [number, number][] = [[s[2], s[1]], [s[2], s[1]], [s[0], s[2]], [s[0], s[2]], [s[0], s[1]], [s[0], s[1]]];
      for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
    }
    this.add(key, g, TR(p, r));
  }
  geo(key: string, g: THREE.BufferGeometry, p: V3, r?: THREE.Euler, s?: V3) { this.add(key, g, TR(p, r, s)); }
  /** a cylinder from a to b (radius r) */
  tube(key: string, a: V3, b: V3, r: number, seg8 = false) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    const m = new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), q, new THREE.Vector3(r * 2, L, r * 2));
    this.add(key, seg8 ? _cyl8 : _cyl, m);
  }
  /** a flat shape in the local x-y plane (facing +z), UVs scaled by the tile */
  shape(key: string, pts: [number, number][], p: V3, r?: THREE.Euler, depth = 0) {
    const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const g = depth > 0 ? new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }) : new THREE.ShapeGeometry(s);
    const t = tileOf(key);
    if (t > 0) { const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / t, uv.getY(i) / t); }
    this.add(key, g, TR(p, r));
  }
  glow(g: Omit<Glow, "p"> & { p: V3 }) {
    const v = new THREE.Vector3(...g.p).applyMatrix4(this.top);
    let n: V3 | undefined;
    if (g.n) { const nv = new THREE.Vector3(...g.n).transformDirection(this.top); n = [nv.x, nv.y, nv.z]; }
    this.glows.push({ ...g, p: [v.x, v.y, v.z], n });
  }
  build() {
    const out: { key: string; geo: THREE.BufferGeometry }[] = [];
    this.parts.forEach((gs, key) => { const g = mergeGeometries(gs, false); if (g) { g.computeBoundingSphere(); out.push({ key, geo: g }); } gs.forEach((x) => x.dispose()); });
    return { meshes: out, glows: this.glows };
  }
}

const glowTex = () => canvasTex("glow", 128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(255,255,255,0.45)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});
const glowMats = new Map<string, THREE.Material>();
const glowMat = (color: string, o: number) => {
  const k = `${color}|${o}`; let m = glowMats.get(k);
  if (!m) { m = new THREE.MeshBasicMaterial({ map: glowTex(), color, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); glowMats.set(k, m); }
  return m;
};
const _plane = new THREE.PlaneGeometry(1, 1);

type Built = ReturnType<Kit["build"]>;
const builtCache = new Map<string, Built>();
export const useBuilt = (key: string, make: (k: Kit) => void): Built => useMemo(() => {
  let b = builtCache.get(key);
  if (!b) { const k = new Kit(); make(k); b = k.build(); builtCache.set(key, b); }
  return b;
}, [key]); // eslint-disable-line react-hooks/exhaustive-deps

export const Render: React.FC<{ b: Built }> = ({ b }) => (
  <group>
    {b.meshes.map(({ key, geo }) => (
      <mesh key={key} geometry={geo} material={material(key)} castShadow={castsShadow(key)} receiveShadow />
    ))}
    {b.glows.map((g, i) => {
      if (g.kind === "pool") return <mesh key={i} geometry={_plane} material={glowMat(g.color, g.o)} position={g.p} rotation={[-Math.PI / 2, 0, 0]} scale={[g.size, g.size, 1]} renderOrder={5} />;
      const n = g.n ?? [0, 0, 1];
      return <mesh key={i} geometry={_plane} material={glowMat(g.color, g.o)} position={[g.p[0] + n[0] * 0.3, g.p[1], g.p[2] + n[2] * 0.3]}
        rotation={[0, Math.atan2(n[0], n[2]), 0]} scale={[g.size, g.size, 1]} renderOrder={6} />;
    })}
  </group>
);

// ---------------------------------------------------------------------------------------------------------------------
// house parts (all in a wall-local frame: wall surface at z = 0, facing +z)
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

type WinOpts = { w: number; h: number; glass: string; shutter?: string; grid?: [number, number] };
function windowAt(k: Kit, x: number, y: number, o: WinOpts) {
  const { w, h } = o;
  if (o.glass !== "glassClear") k.box("trim", [x, y, 0.06], [w + 0.2, h + 0.2, 0.12]); // the jamb (behind the glass; none in a cut house)
  k.box(o.glass, [x, y, 0.1], [w, h, 0.06]);
  // casing
  k.box("trim", [x - w / 2 - 0.22, y, 0.18], [0.44, h + 0.3, 0.2]);
  k.box("trim", [x + w / 2 + 0.22, y, 0.18], [0.44, h + 0.3, 0.2]);
  k.box("trim", [x, y + h / 2 + 0.32, 0.2], [w + 1.1, 0.55, 0.24]);
  k.box("trim", [x, y + h / 2 + 0.66, 0.3], [w + 1.4, 0.14, 0.45]); // cap
  k.box("trim", [x, y - h / 2 - 0.16, 0.3], [w + 1.0, 0.2, 0.55]); // sill
  // sashes: meeting rail + muntins
  k.box("trim", [x, y, 0.16], [w, 0.2, 0.1]);
  k.box("trim", [x, y + h / 2 - 0.08, 0.15], [w, 0.16, 0.08]);
  k.box("trim", [x, y - h / 2 + 0.1, 0.15], [w, 0.2, 0.08]);
  const [gx, gy] = o.grid ?? [3, 2];
  for (let i = 1; i < gx; i++) k.box("trim", [x - w / 2 + (w * i) / gx, y, 0.15], [0.09, h, 0.06]);
  for (const half of [-1, 1]) for (let j = 1; j < gy; j++) k.box("trim", [x, y + half * (h / 4) + (j - gy / 2) * 0, 0.15], [w, 0.09, 0.06]);
  if (o.shutter) {
    const sw = w * 0.48;
    for (const sd of [-1, 1]) {
      const sx = x + sd * (w / 2 + 0.5 + sw / 2);
      k.box(o.shutter, [sx, y, 0.12], [sw, h + 0.5, 0.14]);
      const n = Math.round((h + 0.2) / 0.32);
      for (let i = 0; i < n; i++) k.box(o.shutter, [sx, y - (h + 0.2) / 2 + (i + 0.5) * ((h + 0.2) / n), 0.21], [sw - 0.3, 0.1, 0.06], E(-0.5, 0, 0));
      k.box(o.shutter, [sx, y + 0.05, 0.22], [sw - 0.1, 0.16, 0.08]);
    }
  }
}

/** Door half-width (frame centre lines at x +-DOOR_HW): 5 units clear between the jambs. */
export const DOOR_HW = 2.75;
function doorAt(k: Kit, x: number, y: number, color: string, glass: string, lamp: boolean, lit: boolean, slab = true) {
  // frame + transom, door slab with 4 raised panels and a 3-light window, knob, kick plate, a lamp beside
  const hw = DOOR_HW, sw = 2 * hw - 0.55;
  k.box("trim", [x - hw, y + 4.0, 0.15], [0.55, 8.0, 0.3]);
  k.box("trim", [x + hw, y + 4.0, 0.15], [0.55, 8.0, 0.3]);
  k.box("trim", [x, y + 8.25, 0.2], [2 * hw + 1, 0.7, 0.4]);
  k.box("trim", [x, y + 8.7, 0.3], [2 * hw + 1.4, 0.18, 0.6]);
  if (slab) {
    k.box(glass, [x, y + 7.65, 0.06], [sw, 0.6, 0.06]);
    k.box("trim", [x, y + 7.3, 0.1], [sw + 0.1, 0.15, 0.12]);
    doorSlab(k, x, y, color, glass, 0.08);
  }
  if (lamp) {
    const lx = x - hw - 1.05;
    k.box("metal", [lx, y + 6.0, 0.12], [0.5, 0.8, 0.2]);
    k.box("metal", [lx, y + 6.0, 0.45], [0.7, 1.3, 0.6]);
    k.box(lit ? "bulbOn" : "bulbOff", [lx, y + 5.95, 0.45], [0.55, 1.0, 0.45]);
    k.box("metal", [lx, y + 6.75, 0.45], [0.9, 0.15, 0.8]);
    if (lit) { k.glow({ p: [lx, y + 6.0, 0.6], size: 4.5, kind: "halo", color: "#ffd59a", o: 0.9, n: [0, 0, 1] });
      k.glow({ p: [x, y + 4, 0.25], size: 11, kind: "halo", color: "#ffc77a", o: 0.25, n: [0, 0, 1] }); }
  }
}
/** The door slab alone (local frame: hinge side at x - (DOOR_HW - 0.27), centred on x, face toward +z). */
export function doorSlab(k: Kit, x: number, y: number, color: string, glass: string, z = 0.08) {
  const sw = 2 * DOOR_HW - 0.55;
  k.box(color, [x, y + 3.6, z], [sw, 7.2, 0.16]);
  for (const [px, py, ph] of [[-1.1, 1.6, 2.4], [1.1, 1.6, 2.4], [-1.1, 4.35, 2.0], [1.1, 4.35, 2.0]] as const) {
    for (const zz of [1, -1]) {
      k.box(color, [x + px, y + py, z + zz * 0.1], [1.7, ph, 0.08]);
      k.box(color, [x + px, y + py, z + zz * 0.14], [1.4, ph - 0.3, 0.06]);
    }
  }
  for (let i = -1; i <= 1; i++) k.box(glass, [x + i * 1.3, y + 6.25, z], [1.1, 1.0, 0.2]);
  for (const zz of [1, -1]) {
    k.geo("brass", _sph, [x + sw / 2 - 0.55, y + 3.5, z + zz * 0.24], undefined, [0.17, 0.17, 0.17]);
    k.box("brass", [x + sw / 2 - 0.55, y + 3.5, z + zz * 0.12], [0.3, 0.6, 0.06]);
  }
  k.box("brass", [x, y + 0.3, z + 0.1], [sw - 0.3, 0.5, 0.04]);
}

/** Wall thickness of a cut house; front steps width (style A). */
export const WALL_T = 0.4, STEP_W = 6.4;
/** A wall slab along x (from x0 to x1, y0 to y1, centred at z, thickness th) with rectangular holes [xa, xb, ya, yb]. */
export function wallWithHoles(k: Kit, key: string, x0: number, x1: number, y0: number, y1: number, z: number, th: number, holes: [number, number, number, number][]) {
  const xs = Array.from(new Set([x0, x1, ...holes.flatMap((h) => [h[0], h[1]])])).filter((x) => x >= x0 && x <= x1).sort((a, b) => a - b);
  for (let i = 0; i + 1 < xs.length; i++) {
    const a = xs[i], b = xs[i + 1], m = (a + b) / 2;
    const gaps = holes.filter((h) => m > h[0] && m < h[1]).map((h) => [h[2], h[3]] as [number, number]).sort((p, q) => p[0] - q[0]);
    let y = y0;
    for (const [ga, gb] of [...gaps, [y1, y1] as [number, number]]) {
      if (ga - y > 1e-3) k.box(key, [m, (y + ga) / 2, z], [b - a, ga - y, th]);
      y = Math.max(y, gb);
    }
  }
}
type HouseSpec = {
  /** glass for the big front window (default: random lit/dark at night) */
  frontGlass?: string;
  /** no baked porch lamp (a live PorchLamp is placed instead); cut: a shell with real openings (no door slab, no front glass) */
  noLamp?: boolean; cut?: boolean;
  style: "A" | "B" | "C"; siding: string; roof: string; shutter?: string; door: string; doorX: number; flip: boolean; seed: number;
  litFrac: number; dark?: boolean; chimney: boolean;
};

/** Gable roof with ridge along local x, slabs shingled, fascia/rake trim, siding gable triangles at both ends. */
function gableRoof(k: Kit, len: number, depth: number, eave: number, rise: number, roof: string, siding: string, ov = 1.3, gableEnds = true) {
  const hd = depth / 2, a = Math.atan2(rise, hd), Ls = (hd + ov) / Math.cos(a), Wr = len + 2 * ov * 0.8, th = 0.5;
  for (const side of [1, -1]) {
    k.with(TR([0, 0, 0], E(0, side > 0 ? 0 : Math.PI, 0)), () => {
      // slab centre: halfway down the slant from the ridge
      const cz = (Ls / 2) * Math.cos(a), cy = eave + rise - (Ls / 2) * Math.sin(a) + th / 2 / Math.cos(a);
      k.with(TR([0, cy, cz], E(a, 0, 0)), () => {
        k.box(roof, [0, 0, 0], [Wr, th, Ls]);
        k.box("trim", [0, -0.2, Ls / 2 - 0.05], [Wr + 0.1, 0.75, 0.22]); // fascia
        k.box("trim", [0, -0.45, Ls / 2 - 0.3], [Wr, 0.45, 0.5]); // gutter
        for (const sx of [-1, 1]) k.box("trim", [sx * (Wr / 2 + 0.05), -0.15, 0], [0.24, 0.7, Ls + 0.1]); // rake boards
        k.box("trim", [0, -th / 2 - 0.04, Ls / 2 - ov / Math.cos(a) / 2], [Wr - 0.2, 0.06, ov / Math.cos(a)]); // soffit
      });
    });
  }
  k.box(roof, [0, eave + rise + 0.25, 0], [Wr, 0.35, 0.9]); // ridge cap
  if (gableEnds) for (const sx of [-1, 1]) {
    k.shape(siding, [[-hd, 0], [hd, 0], [0, rise]], [sx * len / 2, eave, 0], E(0, sx * Math.PI / 2, 0));
  }
}

function house(k: Kit, s: HouseSpec, night: boolean) {
  const W = s.style === "A" ? 20 : 24, D = s.style === "A" ? 18 : 15, F = STREET.porchY, E1 = 18.2;
  const r = (i: number) => rnd(s.seed * 13.1 + i * 7.7);
  let wi = 0;
  const glass = () => { wi++; if (!night) return "glassDay"; if (s.dark) return "glassDark"; return r(wi + 40) < s.litFrac ? `glassLit${Math.floor(r(wi + 60) * 3)}` : "glassDark"; };
  const fx = s.flip ? -1 : 1;
  // foundation, body, frieze, corner boards
  k.box("found", [0, F / 2, 0], [W + 0.4, F, D + 0.4]);
  const cutDoorX = s.doorX * fx, cutWinX = -s.doorX * fx * 1.05 + fx * 0.6, dn0 = F + 4.4;
  if (s.cut && s.style === "A") { // a shell with real openings (door 5 wide, the big front window)
    const tw = WALL_T, ym = F + (E1 - F) / 2;
    k.box(s.siding, [0, ym, -D / 2 + tw / 2], [W, E1 - F, tw]);
    for (const sx of [-1, 1]) k.box(s.siding, [sx * (W / 2 - tw / 2), ym, 0], [tw, E1 - F, D]);
    wallWithHoles(k, s.siding, -W / 2, W / 2, F, E1, D / 2 - tw / 2, tw, [
      [cutDoorX - DOOR_HW + 0.27, cutDoorX + DOOR_HW - 0.27, F, F + 7.95],
      [cutWinX - 2.5, cutWinX + 2.5, dn0 - 2.4, dn0 + 2.4]]);
  } else k.box(s.siding, [0, F + (E1 - F) / 2, 0], [W, E1 - F, D]);
  k.box("trim", [0, E1 - 0.35, 0], [W + 0.25, 0.7, D + 0.25]);
  k.box("trim", [0, F + 0.25, 0], [W + 0.15, 0.5, D + 0.15]);
  for (const cx of [-1, 1]) for (const cz of [-1, 1]) k.box("trim", [cx * (W / 2 - 0.25), (F + E1) / 2, cz * (D / 2 - 0.25)], [0.75, E1 - F, 0.75]);
  const up = F + 12.6, dn = F + 4.4;
  if (s.style === "A") {
    // front-gable: ridge along z, round attic window, full-width porch with a shed roof
    k.with(TR([0, 0, 0], E(0, Math.PI / 2, 0)), () => gableRoof(k, D, W, E1, 8.2, s.roof, s.siding));
    k.with(TR([0, 0, D / 2], E()), () => {
      // attic oculus
      k.geo("trim", new THREE.TorusGeometry(1.5, 0.28, 10, 32), [0, E1 + 3.0, 0.15]);
      k.geo(glass(), new THREE.CircleGeometry(1.45, 28), [0, E1 + 3.0, 0.08]);
      k.box("trim", [0, E1 + 3.0, 0.14], [2.9, 0.14, 0.06]); k.box("trim", [0, E1 + 3.0, 0.14], [0.14, 2.9, 0.06]);
      // upstairs: two windows; downstairs: the door and a wide window
      windowAt(k, -4.8, up, { w: 3.2, h: 4.6, glass: glass(), shutter: s.shutter });
      windowAt(k, 4.8, up, { w: 3.2, h: 4.6, glass: glass(), shutter: s.shutter });
      doorAt(k, s.doorX * fx, F, s.door, night ? (s.dark ? "glassDark" : "glassLit0") : "glassDay", !s.noLamp, night && !s.dark, !s.cut);
      const fg = glass();
      windowAt(k, -s.doorX * fx * 1.05 + fx * 0.6, dn, { w: 5.0, h: 4.8, glass: s.cut ? "glassClear" : s.frontGlass ?? fg, grid: [4, 2], shutter: s.shutter });
      // porch: floor, steps, columns, rail, shed roof
      const pd = 6, pw = W + 0.6;
      k.box("porchFloor", [0, F - 0.1, pd / 2], [pw, 0.25, pd]);
      k.box("found", [0, (F - 0.25) / 2, pd / 2], [pw, F - 0.25, pd - 0.2]);
      k.box("trim", [0, F - 0.2, pd + 0.02], [pw, 0.35, 0.12]);
      const sx = s.doorX * fx;
      for (let i = 0; i < 3; i++) k.box("deck", [sx, F - 0.2 - i * 0.4 + 0.0, pd + 0.45 + i * 0.75], [STEP_W, 0.4 + (2 - i) * 0 , 0.8]);
      for (let i = 0; i < 3; i++) k.box("found", [sx, (F - 0.4 - i * 0.4) / 2, pd + 0.45 + i * 0.75], [STEP_W, Math.max(0.05, F - 0.4 - i * 0.4), 0.78]);
      const cols = [-pw / 2 + 0.5, sx - STEP_W / 2 - 0.4, sx + STEP_W / 2 + 0.4, pw / 2 - 0.5];
      for (const cx of cols) { k.box("trim", [cx, F + 4.3, pd - 0.45], [0.6, 8.6, 0.6]); k.box("trim", [cx, F + 0.25, pd - 0.45], [0.85, 0.5, 0.85]); k.box("trim", [cx, F + 8.45, pd - 0.45], [0.85, 0.35, 0.85]); }
      // rails between columns except at the steps
      for (const [a, b] of [[cols[0], cols[1]], [cols[2], cols[3]]]) {
        const L = b - a - 0.6, mx = (a + b) / 2;
        k.box("trim", [mx, F + 3.0, pd - 0.45], [L, 0.22, 0.4]); k.box("trim", [mx, F + 0.5, pd - 0.45], [L, 0.18, 0.3]);
        const n = Math.floor(L / 0.55);
        for (let i = 0; i < n; i++) k.box("trim", [a + 0.3 + (i + 0.5) * (L / n), F + 1.75, pd - 0.45], [0.16, 2.4, 0.16]);
      }
      // shed roof over the porch
      const pr = Math.atan2(1.6, pd + 0.6);
      k.with(TR([0, F + 9.45, (pd + 0.6) / 2], E(pr, 0, 0)), () => {
        k.box(s.roof, [0, 0.2, 0], [pw + 0.8, 0.35, (pd + 1.0) / Math.cos(pr)]);
        k.box("trim", [0, -0.15, (pd + 1.0) / Math.cos(pr) / 2], [pw + 0.9, 0.7, 0.22]);
        k.box("trim", [0, -0.1, 0], [pw + 0.6, 0.12, (pd + 0.9) / Math.cos(pr)]);
      });
      k.box("trim", [0, F + 8.75, pd - 0.45], [pw, 0.6, 0.5]); // porch beam
    });
  } else {
    // side-gable colonial: ridge along x, five bays, a portico over the door; style C adds a garage wing
    gableRoof(k, W, D, E1, 6.8, s.roof, s.siding);
    k.with(TR([0, 0, D / 2], E()), () => {
      for (const wx of [-8, 0, 8]) windowAt(k, wx, up, { w: 3.0, h: 4.6, glass: glass(), shutter: s.shutter });
      for (const wx of [-7.5, 7.5]) windowAt(k, wx, dn, { w: 3.4, h: 5.0, glass: glass(), shutter: s.shutter });
      doorAt(k, 0, F, s.door, night ? (s.dark ? "glassDark" : "glassLit0") : "glassDay", true, night && !s.dark);
      // stoop + portico (two columns and a pediment)
      k.box("concrete", [0, F / 2, 2.2], [7, F, 4.4]);
      for (let i = 0; i < 2; i++) k.box("concrete", [0, (F - 0.4 * (i + 1)) / 2, 4.4 + 0.4 + i * 0.8], [5, F - 0.4 * (i + 1), 0.8]);
      for (const cx of [-2.9, 2.9]) { k.geo("trim", _cyl, [cx, F + 4.1, 3.6], undefined, [0.6, 8.2, 0.6]); k.box("trim", [cx, F + 0.2, 3.6], [0.8, 0.4, 0.8]); }
      k.box("trim", [0, F + 8.5, 2.0], [7.2, 0.7, 4.0]);
      k.box(s.roof, [0, F + 9.0, 2.1], [7.6, 0.25, 4.4]);
      k.shape("trim", [[-3.9, 0], [3.9, 0], [0, 1.9]], [0, F + 8.85, 4.12], E(), 0.3);
      k.shape(s.roof, [[-4.1, 0], [-3.9, 0], [0, 1.95], [3.9, 0], [4.1, 0], [0, 2.25]], [0, F + 8.95, 4.2], E(), 0.2);
    });
    if (s.style === "C") {
      // garage wing on the far side from the chimney: one storey, gable roof along z, a panelled garage door
      const gx = fx * (W / 2 + 6), GW = 12, GD = 13, GE = F + 9;
      k.with(TR([gx, 0, -1], E()), () => {
        k.box("found", [0, F / 2, 0], [GW + 0.3, F, GD + 0.3]);
        k.box(s.siding, [0, F + (GE - F) / 2, 0], [GW, GE - F, GD]);
        k.box("trim", [0, GE - 0.3, 0], [GW + 0.2, 0.6, GD + 0.2]);
        k.with(TR([0, 0, 0], E(0, Math.PI / 2, 0)), () => gableRoof(k, GD, GW, GE, 4.2, s.roof, s.siding, 1.0));
        k.with(TR([0, 0, GD / 2], E()), () => {
          k.box("trim", [0, F + 3.4, 0.12], [9.4, 7.0, 0.24]);
          k.box("paint", [0, F + 3.1, 0.2], [8.6, 6.2, 0.12]);
          for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) k.box("trim", [-3.2 + col * 2.15, F + 0.9 + row * 1.5, 0.29], [1.8, 1.1, 0.06]);
          for (let col = 0; col < 4; col++) k.box(glass(), [-3.2 + col * 2.15, F + 5.4, 0.3], [1.6, 0.6, 0.04]);
          k.geo("trim", new THREE.TorusGeometry(0.8, 0.12, 8, 24), [0, GE + 1.6, 0.12]); // gable vent
        });
      });
    }
  }
  // side windows (seen in three-quarter shots)
  for (const sd of [-1, 1]) {
    if (s.style === "C" && sd === fx) continue;
    k.with(TR([sd * W / 2, 0, 0], E(0, sd * Math.PI / 2, 0)), () => {
      windowAt(k, -D * 0.22, up, { w: 2.8, h: 4.2, glass: glass() });
      windowAt(k, D * 0.22, dn, { w: 2.8, h: 4.4, glass: glass() });
      if (s.chimney && sd === -fx) {
        // brick chimney on this gable end
        k.box("brick", [D * 0.0, (E1 + 12) / 2, 1.0], [3.2, E1 + 12, 2.0]);
        k.box("brick", [0, E1 + 12.3, 1.0], [3.7, 0.6, 2.5]);
      }
    });
  }
  // downspouts at the front corners
  for (const cx of [-1, 1]) k.box("trim", [cx * (W / 2 + 0.2), E1 / 2, D / 2 + 0.25], [0.3, E1 - 0.6, 0.3]);
  return { W, D };
}

/** Bushes along the foundation and a mulch bed */
function bushes(k: Kit, W: number, D: number, seed: number, skipX: number[]) {
  const z = D / 2 + (W === 20 ? 6.9 : 1.6);
  k.box("mulch", [0, 0.05, z + 0.4], [W + 1, 0.12, 2.6]);
  for (let i = 0; i < 9; i++) {
    const x = -W / 2 + 1 + (i / 8) * (W - 2);
    if (skipX.some((sx) => Math.abs(x - sx) < 3.2)) continue;
    const s = 1.0 + rnd(seed + i) * 0.5;
    k.geo(rnd(seed + i * 3) > 0.5 ? "hedge" : "leaf2", _ico, [x, s * 0.75, z + 0.3], undefined, [s * 1.15, s * 0.95, s]);
  }
}

function leafyTree(k: Kit, p: V3, seed: number, sc = 1, autumn = false) {
  k.at(p, rnd(seed) * 6, () => {
    k.geo("trunk", _cyl8, [0, 4.5 * sc, 0], undefined, [0.9 * sc, 9 * sc, 0.9 * sc]);
    k.tube("trunk", [0, 7 * sc, 0], [1.6 * sc, 10 * sc, 0.4 * sc], 0.3 * sc, true);
    k.tube("trunk", [0, 6.5 * sc, 0], [-1.4 * sc, 9.5 * sc, -0.6 * sc], 0.3 * sc, true);
    for (let i = 0; i < 7; i++) {
      const a = i * 2.4 + seed, rr = i === 0 ? 0 : 2.4 * sc, y = (i === 0 ? 13 : 10.5 + rnd(seed + i) * 3) * sc;
      const s = (i === 0 ? 4.2 : 3.0 + rnd(seed + i * 2) * 1.2) * sc;
      k.geo(autumn && i % 3 === 0 ? "leafAut" : i % 2 ? "leaf1" : "leaf2", _ico, [Math.cos(a) * rr, y, Math.sin(a) * rr], E(i, i * 2, 0), [s, s * 0.85, s]);
    }
  });
}

function bareTree(k: Kit, p: V3, seed: number, sc = 1) {
  k.at(p, rnd(seed) * 6, () => {
    k.geo("trunkD", _cyl8, [0, 5 * sc, 0], undefined, [0.8 * sc, 10 * sc, 0.8 * sc]);
    const branch = (a: V3, dir: THREE.Vector3, len: number, r: number, depth: number, s: number) => {
      const b: V3 = [a[0] + dir.x * len, a[1] + dir.y * len, a[2] + dir.z * len];
      k.tube("trunkD", a, b, r, true);
      if (depth === 0) return;
      for (let i = 0; i < 2 + (depth > 1 ? 1 : 0); i++) {
        const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), (rnd(s + i) - 0.5) * 2.4 + i * 2.1)
          .add(new THREE.Vector3((rnd(s + i * 3) - 0.5) * 0.9, 0.35, (rnd(s + i * 5) - 0.5) * 0.9)).normalize();
        branch(b, d, len * 0.68, r * 0.62, depth - 1, s * 1.37 + i * 11);
      }
    };
    for (let i = 0; i < 4; i++) {
      const a = i * 1.7 + seed;
      branch([0, (8 + i * 0.9) * sc, 0], new THREE.Vector3(Math.cos(a) * 0.7, 0.75, Math.sin(a) * 0.7).normalize(), 3.6 * sc, 0.3 * sc, 3, seed * 3 + i * 17);
    }
    branch([0, 9.8 * sc, 0], new THREE.Vector3(0.05, 1, 0.05).normalize(), 3.5 * sc, 0.35 * sc, 3, seed * 7);
  });
}

function mailbox(k: Kit, p: V3, ry: number, color = "metal", flagUp = false) {
  k.at(p, ry, () => {
    k.box("deck", [0, 1.7, 0], [0.35, 3.4, 0.35]);
    k.box("deck", [0, 3.35, 0], [0.5, 0.15, 1.6]);
    k.box(color, [0, 3.75, 0], [0.9, 0.7, 1.7]);
    k.geo(color, _cyl, [0, 4.1, 0], E(Math.PI / 2, 0, 0), [0.9, 1.7, 0.9]);
    k.box("mailRed", [0.5, flagUp ? 4.5 : 3.95, -0.3], [0.06, flagUp ? 1.0 : 0.2, flagUp ? 0.2 : 0.9]);
    if (flagUp) k.box("mailRed", [0.5, 4.85, -0.05], [0.06, 0.35, 0.5]);
  });
}

function streetLamp(k: Kit, p: V3, lit: boolean, faceZ = 1) {
  k.at(p, faceZ > 0 ? 0 : Math.PI, () => {
    k.geo("metal", _cyl8, [0, 0.5, 0], undefined, [1.0, 1.0, 1.0]);
    k.geo("metal", _cyl8, [0, 6, 0], undefined, [0.35, 12, 0.35]);
    k.geo("metal", _cyl8, [0, 12.2, 0], undefined, [0.6, 0.4, 0.6]);
    // lantern head
    k.geo(lit ? "bulbOn" : "glassDay", _cyl8, [0, 13.2, 0], undefined, [1.1, 1.6, 1.1]);
    k.geo("metal", new THREE.ConeGeometry(0.95, 0.9, 8), [0, 14.4, 0]);
    k.geo("metal", _cyl8, [0, 12.35, 0], undefined, [1.0, 0.15, 1.0]);
    if (lit) {
      k.glow({ p: [0, 13.2, 0], size: 7, kind: "halo", color: "#ffd59a", o: 0.85, n: [0, 0, 1] });
      k.glow({ p: [0, 13.2, 0], size: 7, kind: "halo", color: "#ffd59a", o: 0.85, n: [1, 0, 0] });
      k.glow({ p: [0, 0.2, 0], size: 16, kind: "pool", color: "#ffcf86", o: 0.5 });
    }
  });
}

function picketRun(k: Kit, x0: number, x1: number, z: number, gaps: [number, number][]) {
  const pts: [number, number][] = [[-0.21, 0], [0.21, 0], [0.21, 2.6], [0, 2.95], [-0.21, 2.6]];
  for (let x = x0; x <= x1; x += 0.82) {
    if (gaps.some(([a, b]) => x > a && x < b)) continue;
    k.shape("picket", pts, [x, 0.05, z - 0.07], undefined, 0.14);
  }
  // rails + posts between gaps
  const edges = [x0, ...gaps.flat(), x1].sort((a, b) => a - b);
  for (let i = 0; i < edges.length; i += 2) {
    const a = edges[i], b = edges[i + 1]; if (b - a < 0.5) continue;
    for (const y of [0.75, 2.0]) k.box("picket", [(a + b) / 2, y, z - 0.18], [b - a, 0.28, 0.12]);
    for (const px of [a, b]) { k.box("picket", [px, 1.6, z], [0.45, 3.2, 0.45]); k.box("picket", [px, 3.3, z], [0.6, 0.2, 0.6]); }
  }
}

function car(k: Kit, p: V3, ry: number, color: string) {
  k.at(p, ry, () => {
    // ~4.6 m long sedan (14 units), body along z
    k.box(color, [0, 1.9, 0], [5.6, 2.2, 14]);
    k.box(color, [0, 3.0, 0.2], [5.4, 0.3, 13.6]);
    k.box(color, [0, 4.0, -0.8], [5.0, 2.0, 7.0]);
    k.box("carGlass", [0, 4.0, -0.8], [5.06, 1.5, 6.2]);
    k.box("carGlass", [0, 4.0, -0.8], [4.6, 1.5, 7.06]);
    k.box(color, [0, 4.0, -0.8], [5.1, 1.6, 0.35]);
    for (const [wx, wz] of [[-2.6, 4.4], [2.6, 4.4], [-2.6, -4.6], [2.6, -4.6]]) {
      k.geo("tyre", _cyl, [wx, 1.2, wz], E(0, 0, Math.PI / 2), [2.4, 0.9, 2.4]);
      k.geo("metalG", _cyl, [wx * 1.02, 1.2, wz], E(0, 0, Math.PI / 2), [1.3, 0.92, 1.3]);
    }
    k.box("bulbOff", [-1.9, 2.3, 7.02], [1.1, 0.5, 0.1]); k.box("bulbOff", [1.9, 2.3, 7.02], [1.1, 0.5, 0.1]);
    k.box("mailRed", [-2.0, 2.4, -7.02], [1.0, 0.5, 0.1]); k.box("mailRed", [2.0, 2.4, -7.02], [1.0, 0.5, 0.1]);
    k.box("metalG", [0, 1.3, 7.1], [5.4, 0.5, 0.3]); k.box("metalG", [0, 1.3, -7.1], [5.4, 0.5, 0.3]);
  });
}

// ---------------------------------------------------------------------------------------------------------------------
// the street
const SIDINGS = ["sidingW", "sidingG", "sidingS", "sidingB", "sidingW", "sidingC", "sidingG", "sidingY", "sidingW"];
const SHUTTERS = ["shutBlack", "shutGreen", "shutNavy", "shutGrey"];
const DOORS = ["doorRed", "doorNavy", "doorGreen", "doorBlack", "doorWood"];
const ROOFS = ["shingle", "shingleD", "shingleB"];

function lotSpec(i: number, far: boolean): HouseSpec {
  const s = i * 7 + (far ? 31 : 3);
  const styles: HouseSpec["style"][] = ["A", "B", "C"];
  const st = !far && i === HOME_I ? "A" : !far && i === JENNY_I ? "B" : styles[Math.floor(rnd(s) * 3)];
  return {
    style: st, siding: !far && i === HOME_I ? "sidingW" : !far && i === JENNY_I ? "sidingG" : SIDINGS[(i * 3 + (far ? 4 : 0)) % SIDINGS.length],
    roof: ROOFS[Math.floor(rnd(s + 1) * 3)], shutter: rnd(s + 2) < 0.85 ? SHUTTERS[Math.floor(rnd(s + 3) * 4)] : undefined,
    door: !far && i === HOME_I ? "doorRed" : !far && i === JENNY_I ? "doorNavy" : DOORS[Math.floor(rnd(s + 4) * 5)],
    doorX: st === "A" ? -3 : 0, flip: !far && i === HOME_I ? false : rnd(s + 5) < 0.5, seed: s, litFrac: 0.62,
    chimney: rnd(s + 6) < 0.7,
  };
}
/** Street options for Short 09. */
export type StreetOpts = { homeCut?: boolean; bellCut?: boolean };
function lotSpec09(i: number, far: boolean, o: StreetOpts): HouseSpec {
  const s = lotSpec(i, far);
  if (!far && i === HOME_I) { s.noLamp = true; s.cut = !!o.homeCut; s.frontGlass = "glassDark"; }
  if (far && i === BELL_I) Object.assign(s, { style: "A", siding: "sidingY", roof: "shingleB", shutter: "shutGreen", door: "doorGreen", doorX: -3, flip: false, noLamp: true, cut: !!o.bellCut, frontGlass: "glassLit0", chimney: true });
  return s;
}

/** Half-width of a front gate gap (centre of the end posts). */
export const GATE_HW = 3.0;
function lot(k: Kit, i: number, far: boolean, night: boolean, o: { jennyDark: boolean } & StreetOpts) {
  const s = lotSpec09(i, far, o);
  if (!far && i === JENNY_I && o.jennyDark) s.dark = true;
  const { W, D } = house(k, s, night);
  const fx = s.flip ? -1 : 1, doorX = s.style === "A" ? s.doorX * fx : 0;
  const stepZ = s.style === "A" ? D / 2 + 8.4 : D / 2 + 6.4;
  // front path from the steps to the gate, and the gate gap in the fence
  k.box("concrete", [doorX, 0.04, (stepZ + STREET.fenceZ) / 2], [5, 0.1, STREET.fenceZ - stepZ + 0.2]);
  k.box("concrete", [doorX, 0.06, (STREET.fenceZ + 30.5) / 2], [5.6, 0.12, 0.6]);
  // driveway on the side away from the door (garage side for style C)
  const dx = s.style === "C" ? fx * (W / 2 + 6) : (doorX <= 0 ? 1 : -1) * (W / 2 + 4.2);
  const dz0 = s.style === "C" ? 5.5 : -6;
  k.box("drive", [dx, 0.03, (dz0 + STREET.fenceZ) / 2], [6.6, 0.08, STREET.fenceZ - dz0]);
  k.box("drive", [dx, 0.05, (34.5 + 37.6) / 2], [6.6, 0.1, 3.1]);
  picketRun(k, -15.6, 15.6, STREET.fenceZ, [[doorX - GATE_HW, doorX + GATE_HW], [dx - 3.5, dx + 3.5]]);
  bushes(k, W, D, s.seed, [doorX]);
  // a tree in the yard (leafy or bare), a mailbox at the curb side of the gate, bins or a car on the drive
  const tx = (doorX <= 0 ? 1 : -1) * -9.5 + (rnd(s.seed + 8) - 0.5) * 3;
  const treeX = Math.abs(tx - dx) < 5 ? -tx : tx;
  const clear09 = (!far && i === HOME_I) || (far && i === BELL_I);
  if (clear09) { /* Short 09: keep the view between the two porches clear */ }
  else if (!(i === JENNY_I && !far)) {
    if (rnd(s.seed + 9) < 0.55) leafyTree(k, [treeX, 0, 22 + rnd(s.seed) * 3], s.seed, 0.95 + rnd(s.seed + 10) * 0.25, rnd(s.seed + 11) < 0.4);
    else bareTree(k, [treeX, 0, 22 + rnd(s.seed) * 3], s.seed, 1 + rnd(s.seed + 10) * 0.2);
  } else leafyTree(k, [9, 0, 18], s.seed, 1.0, true); // Jenny's maple, right of her path (the bike lies left of it)
  mailbox(k, [doorX + 3.0 * (doorX <= 0 ? 1 : -1), 0, 35.6], far ? Math.PI : 0, rnd(s.seed + 12) < 0.5 ? "metal" : "mailRed");
  if (rnd(s.seed + 13) < 0.45 && !(i === JENNY_I && !far)) car(k, [dx, 0, 10 + rnd(s.seed + 14) * 6], rnd(s.seed + 15) < 0.5 ? 0 : Math.PI, ["carRed", "carBlue", "carSilver"][Math.floor(rnd(s.seed + 16) * 3)]);
  else {
    k.at([dx + (dx > 0 ? 2.4 : -2.4), 0, 27.5], 0, () => {
      k.box("bin", [0, 1.9, 0], [2.0, 3.8, 2.2]); k.box("bin", [0, 3.9, -0.05], [2.2, 0.25, 2.4]);
      k.box("binG", [-2.5, 1.9, 0], [2.0, 3.8, 2.2]); k.box("binG", [-2.5, 3.9, -0.05], [2.2, 0.25, 2.4]);
    });
  }
  // the verge: a street lamp on every other lot (alternating sides), a bare street tree on the others, away from the drive
  const vx = -Math.sign(dx) * 9;
  if (clear09) { if (!far) streetLamp(k, [9, 0, 36.2], night, 1); }
  else if ((i + (far ? 1 : 0)) % 2 === 0) streetLamp(k, [vx, 0, 36.2], night, 1);
  else if (!(i === JENNY_I && !far)) bareTree(k, [vx, 0, 36.2], i * 5 + (far ? 50 : 3), 1.15);
  return s;
}

function street(k: Kit, night: boolean, o: { jennyDark: boolean } & StreetOpts) {
  const X0 = -150, X1 = 150, L = X1 - X0;
  // ground
  k.box("grass", [0, -0.5, 40], [L + 140, 1, 260]);
  // near and far sidewalks with joints, verges, curbs; the road
  for (const far of [false, true]) {
    const zf = (z: number) => (far ? STREET.farZ - z : z);
    k.box("concrete", [0, 0.06, zf(32.5)], [L, 0.12, 4]);
    for (let x = X0; x <= X1; x += 4) k.box("joint", [x, 0.125, zf(32.5)], [0.08, 0.01, 4]);
    k.box("curb", [0, 0.1, zf(37.75)], [L, 0.2, 0.5]);
    k.box("curb", [0, 0.09, zf(30.35)], [L, 0.14, 0.3]);
  }
  k.box("asphalt", [0, 0.01, STREET.roadZ], [L + 140, 0.04, 22]);
  // road paint: a faded centre line, a crosswalk and stop lines at the west end of our block
  for (let x = X0; x <= X1; x += 9) k.box("paintY", [x, 0.035, STREET.roadZ - 0.25], [4.5, 0.01, 0.28]);
  for (let i = 0; i < 9; i++) k.box("paint", [-80, 0.035, 39.5 + i * 2.45], [5, 0.01, 1.3]);
  // the lots
  LOT_X.forEach((x, i) => {
    k.at([x, 0, 0], 0, () => lot(k, i, false, night, o));
    k.at([x + 16, 0, STREET.farZ], Math.PI, () => lot(k, i, true, night, o));
  });
  // street lamps on the verge (between lots), a hydrant, a bus/kids-crossing sign, a utility pole line on the far side

  k.at([22, 0, 36.4], 0.3, () => {
    k.geo("hydrant", _cyl, [0, 1.3, 0], undefined, [1.1, 2.6, 1.1]); k.geo("hydrant", _sph, [0, 2.6, 0], undefined, [0.6, 0.5, 0.6]);
    k.geo("hydrant", _cyl, [0, 1.8, 0], E(Math.PI / 2, 0, 0), [0.45, 1.7, 0.45]); k.geo("hydrant", _cyl, [0, 0.15, 0], undefined, [1.5, 0.3, 1.5]);
  });
  k.at([-84, 0, 36.6], 0, () => {
    k.geo("metalG", _cyl8, [0, 4.5, 0], undefined, [0.22, 9, 0.22]);
    k.box("signY", [0, 8.4, 0.12], [2.6, 2.6, 0.08], E(0, 0, Math.PI / 4));
    k.box("black", [0, 8.4, 0.17], [2.2, 2.2, 0.02], E(0, 0, Math.PI / 4));
    k.box("signY", [0, 8.4, 0.18], [2.05, 2.05, 0.02], E(0, 0, Math.PI / 4));
    for (const dx of [-0.35, 0.35]) { k.box("black", [dx, 8.2, 0.21], [0.22, 1.0, 0.02]); k.geo("black", _sph, [dx, 8.95, 0.21], undefined, [0.22, 0.22, 0.02]); }
    k.box("signG", [0, 9.9, 0], [3.6, 0.7, 0.08]);
  });
  // street-name sign at the west corner
  // back-row trees beyond the houses (a soft treeline), both sides
  for (let x = -170; x <= 170; x += 13) {
    const j = Math.round(x);
    leafyTree(k, [x + rnd(j) * 6, 0, -28 - rnd(j + 1) * 10], j + 100, 1.5 + rnd(j + 2) * 0.6, rnd(j + 3) < 0.3);
    leafyTree(k, [x + rnd(j + 4) * 6, 0, STREET.farZ + 28 + rnd(j + 5) * 10], j + 200, 1.5 + rnd(j + 6) * 0.6, rnd(j + 7) < 0.3);
  }
  // verge trees (bare street trees, like the sample) between some lots

}

/** Short 09's street: night/dusk/day. homeCut / bellCut: those houses are open shells (cameras inside). No real lights here
 *  (use Lights09 in Porch09.tsx); the two live porch lamps are PorchLamp components. */
export const Street09: React.FC<{ time: TownTime; homeCut?: boolean; bellCut?: boolean }> = ({ time, homeCut = false, bellCut = false }) => {
  const night = time === "night" || time === "dusk";
  const b = useBuilt(`street09|${night}|${homeCut}|${bellCut}`, (k) => street(k, night, { jennyDark: false, homeCut, bellCut }));
  return <Render b={b} />;
};

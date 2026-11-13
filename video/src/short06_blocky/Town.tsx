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
const HOME_I = 4, JENNY_I = 5;
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
type MSpec = { kind?: TexKind; color: string; tile?: number; rough?: number; metal?: number; emissive?: string; ei?: number;
  map?: () => THREE.Texture; shadow?: boolean; side?: THREE.Side; alphaTest?: number; transparent?: boolean };
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
const canvasTex = (() => {
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
};

const matCache = new Map<string, THREE.Material>();
function material(key: string): THREE.Material {
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
  // drop any normal/rough maps LOOK may attach with its own repeat (our UVs are world-scaled)
  m = new THREE.MeshStandardMaterial(p);
  matCache.set(key, m);
  return m;
}
const tileOf = (key: string) => { const s = SPEC[key] ?? EXTRA[key]; return s?.kind ? TILE[s.kind] * (s.tile ?? 1) : 0; };
const castsShadow = (key: string) => ((SPEC[key] ?? GLASS[key] ?? EXTRA[key])?.shadow ?? true);
const EXTRA: Record<string, MSpec> = {};

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

class Kit {
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
const useBuilt = (key: string, make: (k: Kit) => void): Built => useMemo(() => {
  let b = builtCache.get(key);
  if (!b) { const k = new Kit(); make(k); b = k.build(); builtCache.set(key, b); }
  return b;
}, [key]); // eslint-disable-line react-hooks/exhaustive-deps

const Render: React.FC<{ b: Built }> = ({ b }) => (
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
  k.box("trim", [x, y, 0.06], [w + 0.2, h + 0.2, 0.12]); // the jamb (behind the glass)
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

function doorAt(k: Kit, x: number, y: number, color: string, glass: string, lamp: boolean, lit: boolean) {
  // frame + transom, door slab with 4 raised panels and a 3-light window, knob, kick plate, a lamp beside
  k.box("trim", [x - 2.0, y + 4.0, 0.15], [0.55, 8.0, 0.3]);
  k.box("trim", [x + 2.0, y + 4.0, 0.15], [0.55, 8.0, 0.3]);
  k.box("trim", [x, y + 8.25, 0.2], [5.0, 0.7, 0.4]);
  k.box("trim", [x, y + 8.7, 0.3], [5.4, 0.18, 0.6]);
  k.box(glass, [x, y + 7.65, 0.06], [3.4, 0.6, 0.06]);
  k.box("trim", [x, y + 7.3, 0.1], [3.5, 0.15, 0.12]);
  k.box(color, [x, y + 3.6, 0.08], [3.4, 7.2, 0.16]);
  for (const [px, py, ph] of [[-0.8, 1.6, 2.4], [0.8, 1.6, 2.4], [-0.8, 4.35, 2.0], [0.8, 4.35, 2.0]] as const) {
    k.box(color, [x + px, y + py, 0.18], [1.2, ph, 0.08]);
    k.box(color, [x + px, y + py, 0.22], [0.9, ph - 0.3, 0.06]);
  }
  for (let i = -1; i <= 1; i++) k.box(glass, [x + i * 0.95, y + 6.25, 0.17], [0.8, 1.0, 0.04]);
  k.geo("brass", _sph, [x + 1.25, y + 3.5, 0.32], undefined, [0.17, 0.17, 0.17]);
  k.box("brass", [x + 1.25, y + 3.5, 0.2], [0.3, 0.6, 0.06]);
  k.box("brass", [x, y + 0.3, 0.18], [3.2, 0.5, 0.04]);
  if (lamp) {
    const lx = x - 2.9;
    k.box("metal", [lx, y + 6.0, 0.12], [0.5, 0.8, 0.2]);
    k.box("metal", [lx, y + 6.0, 0.45], [0.7, 1.3, 0.6]);
    k.box(lit ? "bulbOn" : "bulbOff", [lx, y + 5.95, 0.45], [0.55, 1.0, 0.45]);
    k.box("metal", [lx, y + 6.75, 0.45], [0.9, 0.15, 0.8]);
    if (lit) { k.glow({ p: [lx, y + 6.0, 0.6], size: 4.5, kind: "halo", color: "#ffd59a", o: 0.9, n: [0, 0, 1] });
      k.glow({ p: [x, y + 4, 0.25], size: 11, kind: "halo", color: "#ffc77a", o: 0.25, n: [0, 0, 1] }); }
  }
}

type HouseSpec = {
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
  k.box(s.siding, [0, F + (E1 - F) / 2, 0], [W, E1 - F, D]);
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
      doorAt(k, s.doorX * fx, F, s.door, night ? (s.dark ? "glassDark" : "glassLit0") : "glassDay", true, night && !s.dark);
      windowAt(k, -s.doorX * fx * 1.05 + fx * 0.6, dn, { w: 5.0, h: 4.8, glass: glass(), grid: [4, 2], shutter: s.shutter });
      // porch: floor, steps, columns, rail, shed roof
      const pd = 6, pw = W + 0.6;
      k.box("porchFloor", [0, F - 0.1, pd / 2], [pw, 0.25, pd]);
      k.box("found", [0, (F - 0.25) / 2, pd / 2], [pw, F - 0.25, pd - 0.2]);
      k.box("trim", [0, F - 0.2, pd + 0.02], [pw, 0.35, 0.12]);
      const sx = s.doorX * fx;
      for (let i = 0; i < 3; i++) k.box("deck", [sx, F - 0.2 - i * 0.4 + 0.0, pd + 0.45 + i * 0.75], [4.6, 0.4 + (2 - i) * 0 , 0.8]);
      for (let i = 0; i < 3; i++) k.box("found", [sx, (F - 0.4 - i * 0.4) / 2, pd + 0.45 + i * 0.75], [4.6, Math.max(0.05, F - 0.4 - i * 0.4), 0.78]);
      const cols = [-pw / 2 + 0.5, sx - 2.6, sx + 2.6, pw / 2 - 0.5];
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

function lot(k: Kit, i: number, far: boolean, night: boolean, o: { jennyDark: boolean }) {
  const s = lotSpec(i, far);
  if (!far && i === JENNY_I && o.jennyDark) s.dark = true;
  const { W, D } = house(k, s, night);
  const fx = s.flip ? -1 : 1, doorX = s.style === "A" ? s.doorX * fx : 0;
  const stepZ = s.style === "A" ? D / 2 + 8.4 : D / 2 + 6.4;
  // front path from the steps to the gate, and the gate gap in the fence
  k.box("concrete", [doorX, 0.04, (stepZ + STREET.fenceZ) / 2], [3.4, 0.1, STREET.fenceZ - stepZ + 0.2]);
  k.box("concrete", [doorX, 0.06, (STREET.fenceZ + 30.5) / 2], [3.4, 0.12, 0.6]);
  // driveway on the side away from the door (garage side for style C)
  const dx = s.style === "C" ? fx * (W / 2 + 6) : (doorX <= 0 ? 1 : -1) * (W / 2 + 4.2);
  const dz0 = s.style === "C" ? 5.5 : -6;
  k.box("drive", [dx, 0.03, (dz0 + STREET.fenceZ) / 2], [6.6, 0.08, STREET.fenceZ - dz0]);
  k.box("drive", [dx, 0.05, (34.5 + 37.6) / 2], [6.6, 0.1, 3.1]);
  picketRun(k, -15.6, 15.6, STREET.fenceZ, [[doorX - 1.9, doorX + 1.9], [dx - 3.5, dx + 3.5]]);
  bushes(k, W, D, s.seed, [doorX]);
  // a tree in the yard (leafy or bare), a mailbox at the curb side of the gate, bins or a car on the drive
  const tx = (doorX <= 0 ? 1 : -1) * -9.5 + (rnd(s.seed + 8) - 0.5) * 3;
  const treeX = Math.abs(tx - dx) < 5 ? -tx : tx;
  if (!(i === JENNY_I && !far)) {
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
  if ((i + (far ? 1 : 0)) % 2 === 0) streetLamp(k, [vx, 0, 36.2], night, 1);
  else if (!(i === JENNY_I && !far)) bareTree(k, [vx, 0, 36.2], i * 5 + (far ? 50 : 3), 1.15);
  return s;
}

function street(k: Kit, night: boolean, o: { jennyDark: boolean }) {
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

/** Our street. `jennyDark`: Jenny's house unlit (and her porch lamp off); `bike`: her red bike lying on her lawn;
 *  `poster`: a MISSING poster on the lamp post in front of her lot. Time "morning" is the same set as "day". */
export const MyStreet: React.FC<{ time: TownTime; jennyDark?: boolean; bike?: boolean; poster?: boolean }> = ({ time, jennyDark = false, bike = false, poster = false }) => {
  const night = time === "night" || time === "dusk";
  const b = useBuilt(`street|${night}|${jennyDark}`, (k) => street(k, night, { jennyDark }));
  return (
    <group>
      <Render b={b} />
      {bike && <Bike position={JENNY_LAWN} yaw={0.5} lying />}
      {poster && <MissingPoster position={POSTER_AT} yaw={0} />}
    </group>
  );
};
/** Where the street's MISSING poster hangs (on the verge in front of Jenny's lot, facing the sidewalk). */
export const POSTER_AT: V3 = [LOT_X[JENNY_I] - 4, 0, 36.4];

/** Day three, night: the same street, every house lit but Jenny's; her bike lying on her lawn. */
export const JennyHouseDark: React.FC<{ poster?: boolean }> = ({ poster = false }) => <MyStreet time="night" jennyDark bike poster={poster} />;

/** Convenience: sky + lights + street, the shadow camera centred on `focus` (default: between HOME and Jenny's). */
export const StreetSet: React.FC<{ time: TownTime; focus?: V3; jennyDark?: boolean; bike?: boolean; poster?: boolean }> = ({ time, focus, ...o }) => {
  const lt = (time === "morning" ? "day" : time) as "day" | "dusk" | "night";
  return (
    <>
      <Sky time={lt} />
      <BlockLights time={lt} focus={focus ?? [16, 0, 20]} />
      <MyStreet time={time} {...o} />
    </>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// Bike: a kid's red bike (20" wheels), local x = along the bike (front +x), y up. `lying` lays it on its left side.
EXTRA.bikeRed = { color: "#c62a2a", rough: 0.32, metal: 0.25 };
EXTRA.chrome = { color: "#d7dade", rough: 0.2, metal: 0.85 };
EXTRA.grip = { color: "#f2f2f2", rough: 0.6 };
EXTRA.streamer = { color: "#f5d24a", rough: 0.6 };
function bike(k: Kit) {
  const R = 1.05, rearX = -1.75, frontX = 1.75, hubY = R;
  for (const wx of [rearX, frontX]) {
    k.geo("tyre", new THREE.TorusGeometry(R - 0.13, 0.15, 10, 36), [wx, hubY, 0]);
    k.geo("chrome", new THREE.TorusGeometry(R - 0.3, 0.05, 6, 36), [wx, hubY, 0]);
    k.geo("chrome", _cyl, [wx, hubY, 0], E(Math.PI / 2, 0, 0), [0.22, 0.35, 0.22]);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; k.tube("chrome", [wx, hubY, (i % 2 ? 0.08 : -0.08)], [wx + Math.cos(a) * (R - 0.3), hubY + Math.sin(a) * (R - 0.3), 0], 0.015, true); }
  }
  const bb: V3 = [-0.1, 0.95, 0], seat: V3 = [-0.75, 2.35, 0], head: V3 = [1.25, 2.35, 0], headLo: V3 = [1.35, 1.9, 0];
  k.tube("bikeRed", seat, head, 0.1); k.tube("bikeRed", headLo, bb, 0.11); k.tube("bikeRed", bb, [seat[0] + 0.1, seat[1] - 0.25, 0], 0.1);
  for (const sz of [-0.13, 0.13]) { k.tube("bikeRed", bb, [rearX, hubY, sz], 0.06); k.tube("bikeRed", [seat[0] + 0.05, seat[1] - 0.2, 0], [rearX, hubY, sz], 0.06); k.tube("bikeRed", [1.3, 2.1, 0], [frontX, hubY, sz], 0.065); }
  k.tube("bikeRed", headLo, [head[0] - 0.05, head[1] + 0.15, 0], 0.13);
  // fenders
  for (const wx of [rearX, frontX]) k.geo("bikeRed", new THREE.TorusGeometry(R + 0.06, 0.09, 6, 20, Math.PI * 0.55), [wx, hubY, 0], E(0, 0, wx < 0 ? Math.PI * 0.42 : Math.PI * 0.05), [1, 1, 2.2]);
  // stem, handlebar, grips, streamers
  k.tube("chrome", [1.2, 2.45, 0], [1.05, 3.05, 0], 0.07);
  k.tube("chrome", [1.05, 3.05, -0.85], [1.05, 3.05, 0.85], 0.06);
  for (const gz of [-1, 1]) { k.tube("grip", [1.05, 3.05, gz * 0.65], [1.05, 3.05, gz * 1.0], 0.1); k.tube("streamer", [1.05, 3.05, gz * 1.0], [0.8, 2.6, gz * 1.1], 0.03, true); k.tube("streamer", [1.05, 3.05, gz * 1.0], [0.75, 2.7, gz * 0.95], 0.03, true); }
  // seat + post
  k.tube("chrome", [seat[0] + 0.1, seat[1] - 0.3, 0], [seat[0], seat[1] + 0.1, 0], 0.06);
  k.geo("black", _sph, [seat[0] - 0.05, seat[1] + 0.2, 0], undefined, [0.55, 0.16, 0.26]);
  // crank, chainring, pedals, chain guard
  k.geo("chrome", _cyl, [bb[0], bb[1], 0.18], E(Math.PI / 2, 0, 0), [0.6, 0.06, 0.6]);
  k.box("bikeRed", [(bb[0] + rearX) / 2, bb[1] + 0.03, 0.24], [1.75, 0.35, 0.03]);
  for (const sd of [-1, 1]) { const px = bb[0] + sd * 0.15, py = bb[1] - sd * 0.45, pz = sd * 0.3; k.tube("metal", [bb[0], bb[1], sd * 0.2], [px, py, pz], 0.04); k.box("black", [px, py, pz + sd * 0.15], [0.45, 0.1, 0.35]); }
  // kickstand (folded)
  k.tube("metal", bb, [bb[0] - 0.9, bb[1] - 0.25, -0.2], 0.03);
}
export const Bike: React.FC<{ position?: V3; yaw?: number; lying?: boolean; scale?: number }> = ({ position = [0, 0, 0], yaw = 0, lying = true, scale = 1 }) => {
  const b = useBuilt("bike", bike);
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      {/* lying: rolled onto its side, resting on the pedal, the bar end and the wheel rims */}
      <group position={[0, lying ? 0.32 : 0, 0]} rotation={lying ? [-1.38, 0, 0.04] : [0, 0, 0]}>
        <Render b={b} />
      </group>
    </group>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// MissingPoster: a paper stapled to a wooden pole. Origin = the pole's foot; the paper faces +z at eye height (y ~ 5.6).
const posterTex = () => {
  const ready = typeof document !== "undefined" && document.fonts?.check?.("900 40px Montserrat");
  return canvasTex(`poster${ready}`, 600, 800, (g, w, h) => {
    const F = ready ? "Montserrat, Arial, sans-serif" : "Arial, Helvetica, sans-serif";
    g.fillStyle = "#f6f3ea"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(120,100,70,${0.05 * rnd(i)})`; g.fillRect(rnd(i + 1) * w, rnd(i + 2) * h, 2, 2); }
    g.fillStyle = "#111"; g.textAlign = "center"; g.font = `900 104px ${F}`; g.fillText("MISSING", w / 2, 118);
    // the photo: a blocky kid (Jenny) on a light grey square
    const px = 110, py = 160, ps = 380;
    g.fillStyle = "#d9d9d6"; g.fillRect(px, py, ps, ps); g.strokeStyle = "#222"; g.lineWidth = 6; g.strokeRect(px, py, ps, ps);
    g.fillStyle = "#6e3fa3"; g.fillRect(px + 70, py + 300, ps - 140, 80); // purple shirt shoulders
    g.fillStyle = "#1a1a1a"; // long black hair behind the head
    g.beginPath(); g.roundRect(px + 92, py + 70, 196, 290, 40); g.fill();
    g.fillStyle = "#ebe6dd"; g.beginPath(); g.roundRect(px + 110, py + 95, 160, 150, 34); g.fill(); g.strokeStyle = "#333"; g.lineWidth = 3; g.stroke();
    g.fillStyle = "#1a1a1a"; g.beginPath(); g.roundRect(px + 100, py + 72, 180, 52, [40, 40, 10, 10]); g.fill(); // fringe
    g.fillStyle = "#111"; g.beginPath(); g.ellipse(px + 160, py + 165, 9, 16, 0, 0, Math.PI * 2); g.ellipse(px + 220, py + 165, 9, 16, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#111"; g.lineWidth = 5; g.lineCap = "round"; g.beginPath(); g.arc(px + 190, py + 192, 26, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    g.fillStyle = "#ebe6dd"; g.fillRect(px + 172, py + 245, 36, 55); // neck
    g.fillStyle = "#111"; g.font = `900 64px ${F}`; g.fillText("JENNY", w / 2, 625);
    g.font = `700 30px ${F}`; g.fillText("AGE 10 · LAST SEEN AT HOME", w / 2, 672);
    g.fillRect(90, 705, w - 180, 14); g.fillRect(140, 738, w - 280, 14);
  });
};
export const MissingPoster: React.FC<{ position?: V3; yaw?: number; pole?: boolean; curl?: number }> = ({ position = [0, 0, 0], yaw = 0, pole = true, curl = 1 }) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(2.4, 3.2, 12, 1);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, (x / 1.2) ** 2 * -0.12 * curl + (p.getY(i) < -1 ? 0.06 * curl * Math.abs(x) : 0)); }
    g.computeVertexNormals(); return g;
  }, [curl]);
  const paper = useMemo(() => new THREE.MeshStandardMaterial({ map: posterTex(), roughness: 0.85, side: THREE.DoubleSide }), [typeof document !== "undefined" && document.fonts?.check?.("900 40px Montserrat")]); // eslint-disable-line
  const b = useBuilt("posterPole", (k) => {
    if (true) { k.geo("trunk", _cyl, [0, 7, 0], undefined, [0.9, 14, 0.9]); }
    k.box("chrome", [-0.9, 7.05, 0.48], [0.18, 0.05, 0.03]); k.box("chrome", [0.9, 7.05, 0.48], [0.18, 0.05, 0.03]);
    k.box("chrome", [-0.9, 4.15, 0.48], [0.18, 0.05, 0.03]); k.box("chrome", [0.9, 4.15, 0.48], [0.18, 0.05, 0.03]);
  });
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {pole && <Render b={b} />}
      <mesh geometry={geo} material={paper} position={[0, 5.6, pole ? 0.5 : 0]} castShadow receiveShadow />
      {/* tape strips */}
      {[[-1.0, 7.1], [1.0, 7.1]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, (pole ? 0.5 : 0) + 0.02]} rotation={[0, 0, i ? -0.5 : 0.5]}>
          <planeGeometry args={[0.6, 0.22]} /><meshStandardMaterial color="#e8e2c8" roughness={0.6} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// SchoolYard: recess. The school's brick wall runs along x at z = -20 (facing +z); the asphalt yard spans x -45..45,
// z -20..40, chain-link fence on three sides, swing set (west), hopscotch (centre right), basketball hoop, benches.
/** Where the kids gather for recess (hopscotch is just right of it; the school wall is behind it when looking -z). */
export const YARD_SPOT: V3 = [2, 0, 14];
export const SCHOOL = { wallZ: -20, swing: [-24, 0, 6] as V3, hopscotch: [12, 0, 12] as V3, hoop: [30, 0, 22] as V3, door: [-18, 0, -20] as V3 };

EXTRA.chain = { color: "#9aa0a6", rough: 0.4, metal: 0.6, map: () => chainTex(), alphaTest: 0.5, side: THREE.DoubleSide, shadow: true };
EXTRA.swingG = { color: "#2f6b4f", rough: 0.4, metal: 0.3 };
EXTRA.seat = { color: "#2a2a2c", rough: 0.7 };
EXTRA.wood2 = { kind: "wood", color: "#b58a5c" };
EXTRA.ballRed = { color: "#c2392f", rough: 0.6 };
EXTRA.court = { color: "#ffffff", map: () => courtTex(), rough: 0.95, shadow: false, alphaTest: 0.3, transparent: true };
EXTRA.schoolSign = { color: "#ffffff", map: () => signTex(), rough: 0.5 };
const chainTex = () => {
  const t = canvasTex("chain", 64, 64, (g) => {
    g.clearRect(0, 0, 64, 64); g.strokeStyle = "#fff"; g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, 32); g.lineTo(32, 0); g.lineTo(64, 32); g.lineTo(32, 64); g.closePath(); g.stroke();
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
};
const courtTex = () => canvasTex("court", 512, 1024, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.fillStyle = "rgba(0,0,0,0)"; g.fillRect(0, 0, w, h);
  // hopscotch: 1,2,3 singles, 4-5 pair, 6 single, 7-8 pair, 9 single, 10 arc. Chalky white/yellow/pink lines.
  const cell = 120, cx = w / 2;
  const boxes: [number, number, string][] = [[0, 0, "1"], [0, 1, "2"], [0, 2, "3"], [-0.5, 3, "4"], [0.5, 3, "5"], [0, 4, "6"], [-0.5, 5, "7"], [0.5, 5, "8"], [0, 6, "9"]];
  g.lineWidth = 9; g.font = "900 64px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  boxes.forEach(([bx, row, n], i) => {
    const x = cx + bx * cell - cell / 2, y = h - 40 - (row + 1) * cell;
    g.strokeStyle = ["rgba(255,255,255,0.92)", "rgba(250,220,90,0.92)", "rgba(250,150,180,0.92)"][i % 3];
    g.strokeRect(x, y, cell, cell);
    g.fillStyle = g.strokeStyle; g.fillText(n, x + cell / 2, y + cell / 2 + 4);
  });
  g.strokeStyle = "rgba(255,255,255,0.92)"; g.beginPath(); g.arc(cx, h - 40 - 7 * cell, cell * 0.6, Math.PI, 0); g.closePath(); g.stroke();
  g.fillStyle = "rgba(255,255,255,0.92)"; g.fillText("10", cx, h - 40 - 7 * cell - 26);
});
const signTex = () => canvasTex("schoolSign", 1024, 160, (g, w, h) => {
  g.fillStyle = "#1f4d36"; g.fillRect(0, 0, w, h); g.strokeStyle = "#f2efe6"; g.lineWidth = 8; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = "#f2efe6"; g.textAlign = "center"; g.textBaseline = "middle"; let fs = 86; do { g.font = `900 ${fs}px Arial, sans-serif`; fs -= 2; } while (g.measureText("ELM GROVE ELEMENTARY").width > w - 80); g.fillText("ELM GROVE ELEMENTARY", w / 2, h / 2 + 4);
});

function chainFence(k: Kit, a: [number, number], b: [number, number], H = 8) {
  const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), ry = Math.atan2(-dz, dx);
  k.with(TR([a[0], 0, a[1]], E(0, ry, 0)), () => {
    const g = new THREE.PlaneGeometry(L, H);
    const uv = g.attributes.uv as THREE.BufferAttribute; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L / 0.7, uv.getY(i) * H / 0.7);
    k.geo("chain", g, [L / 2, H / 2 + 0.1, 0]);
    k.tube("metalG", [0, H, 0], [L, H, 0], 0.12, true);
    k.tube("metalG", [0, 0.4, 0], [L, 0.4, 0], 0.06, true);
    const n = Math.max(1, Math.round(L / 9));
    for (let i = 0; i <= n; i++) { k.geo("metalG", _cyl8, [(i / n) * L, H / 2 + 0.2, 0], undefined, [0.3, H + 0.4, 0.3]); k.geo("metalG", _sph, [(i / n) * L, H + 0.45, 0], undefined, [0.22, 0.22, 0.22]); }
  });
}

function schoolYard(k: Kit) {
  const WZ = SCHOOL.wallZ;
  // ground: grass everywhere, asphalt yard, a sidewalk outside the far fence
  k.box("grass", [0, -0.5, 10], [300, 1, 260]);
  k.box("asphalt", [0, 0.02, 10], [92, 0.06, 62]);
  k.box("concrete", [0, 0.05, 46], [140, 0.1, 4]);
  // the school: brick, two storeys, flat roof with a concrete parapet cap
  const SW = 110, SH = 23;
  k.box("brick", [0, SH / 2, WZ - 15], [SW, SH, 30]);
  k.box("concrete", [0, SH + 0.3, WZ - 15], [SW + 0.6, 0.6, 30.6]);
  k.box("concrete", [0, 1.0, WZ + 0.05], [SW + 0.1, 2.0, 0.2]); // base course
  k.box("concrete", [0, 11.6, WZ + 0.1], [SW + 0.1, 0.5, 0.3]); // floor band
  k.with(TR([0, 0, WZ], E()), () => {
    // classroom windows: big white-framed grids, two rows
    for (let x = -50; x <= 50; x += 10) {
      if (Math.abs(x + 18) < 6) continue;
      for (const y of [6.2, 17.2]) {
        k.box("concrete", [x, y - 2.9, 0.3], [7.4, 0.4, 0.6]);
        k.box("trim", [x, y, 0.06], [7.0, 5.2, 0.12]);
        k.box("glassDay", [x, y, 0.1], [6.6, 4.8, 0.06]);
        for (const gx of [-1.1, 1.1]) k.box("trim", [x + gx, y, 0.16], [0.18, 4.8, 0.1]);
        k.box("trim", [x, y + 0.8, 0.16], [6.6, 0.18, 0.1]);
      }
    }
    // entrance: double doors under a canopy, steps, the school sign, a clock
    const dx = SCHOOL.door[0];
    k.box("concrete", [dx, 0.35, 3], [12, 0.7, 6]);
    k.box("trim", [dx, 4.4, 0.1], [8.4, 8.6, 0.2]);
    for (const sx of [-1.9, 1.9]) { k.box("doorRed", [dx + sx, 4.0, 0.2], [3.6, 7.6, 0.2]); k.box("glassDay", [dx + sx, 5.5, 0.32], [1.6, 3.2, 0.04]); k.box("metalG", [dx + sx * 0.3, 3.9, 0.4], [0.2, 1.8, 0.2]); }
    k.box("concrete", [dx, 9.4, 3.2], [13, 0.6, 6.6]);
    for (const sx of [-6, 6]) k.geo("metalG", _cyl8, [dx + sx, 4.7, 6.0], undefined, [0.35, 9.4, 0.35]);
    k.box("schoolSign", [dx, 10.6, 0.25], [16, 2.5, 0.2]);
    k.geo("trim", _cyl, [dx, 16.5, 0.25], E(Math.PI / 2, 0, 0), [3.2, 0.3, 3.2]);
    k.geo("black", _cyl, [dx, 16.5, 0.3], E(Math.PI / 2, 0, 0), [2.9, 0.3, 2.9]);
    k.geo("trim", _cyl, [dx, 16.5, 0.35], E(Math.PI / 2, 0, 0), [2.6, 0.3, 2.6]);
    k.box("black", [dx, 16.95, 0.52], [0.16, 1.0, 0.04]); k.box("black", [dx + 0.35, 16.5, 0.52], [0.8, 0.14, 0.04], E(0, 0, 0.4));
    // downspouts
    for (const x of [-54.5, 15, -35, 54.5]) k.box("metalG", [x, SH / 2, 0.3], [0.5, SH, 0.5]);
    // basketball backboard on the wall
  });
  // chain-link fence: west, east and the far (street) side with a gate gap
  chainFence(k, [-46, WZ], [-46, 41]); chainFence(k, [46, 41], [46, WZ]);
  chainFence(k, [-46, 41], [-8, 41]); chainFence(k, [8, 41], [46, 41]);
  // swing set (A-frames + top bar + three swings)
  k.at(SCHOOL.swing, 0, () => {
    for (const sx of [-8, 8]) { k.tube("swingG", [sx, 0, -3.2], [sx, 11, 0], 0.25, true); k.tube("swingG", [sx, 0, 3.2], [sx, 11, 0], 0.25, true); }
    k.tube("swingG", [-8.5, 11, 0], [8.5, 11, 0], 0.28, true);
    for (const sx of [-4.5, 0, 4.5]) {
      for (const cz of [-0.8, 0.8]) k.tube("metalG", [sx + cz, 11, 0], [sx + cz, 2.4, 0], 0.05, true);
      k.box("seat", [sx, 2.25, 0], [2.0, 0.22, 0.9]);
    }
    k.box("mulch", [0, 0.06, 0], [20, 0.1, 11]);
  });
  // hopscotch (painted decal) + a four-square court
  k.geo("court", _plane, [SCHOOL.hopscotch[0], 0.07, SCHOOL.hopscotch[2] - 3], E(-Math.PI / 2, 0, 0), [7.4, 14.8, 1]);
  k.at([-6, 0, 26], 0, () => {
    k.box("paint", [0, 0.06, 0], [12, 0.01, 0.3]); k.box("paint", [0, 0.06, 0], [0.3, 0.01, 12]);
    k.box("paint", [0, 0.06, -6], [12.3, 0.01, 0.3]); k.box("paint", [0, 0.06, 6], [12.3, 0.01, 0.3]);
    k.box("paint", [-6, 0.06, 0], [0.3, 0.01, 12.3]); k.box("paint", [6, 0.06, 0], [0.3, 0.01, 12.3]);
  });
  k.geo("ballRed", _sph, [-3, 0.9, 24], undefined, [0.9, 0.9, 0.9]);
  // tetherball pole, a picnic table, backpacks by the wall, a painted yellow line along the yard
  k.at([22, 0, 6], 0, () => {
    k.geo("metalG", _cyl8, [0, 5.5, 0], undefined, [0.3, 11, 0.3]); k.geo("concrete", _cyl, [0, 0.2, 0], undefined, [1.6, 0.4, 1.6]);
    k.tube("black", [0, 10.6, 0], [0.9, 6.2, 0.4], 0.03, true); k.geo("signY", _sph, [1.0, 5.6, 0.45], undefined, [0.75, 0.75, 0.75]);
  });
  k.at([-30, 0, 26], 0.2, () => {
    k.box("wood2", [0, 3.0, 0], [8, 0.3, 3]); for (const sz of [-2.6, 2.6]) k.box("wood2", [0, 1.7, sz], [8, 0.25, 1.1]);
    for (const lx of [-3, 3]) { k.box("metal", [lx, 1.5, 0], [0.25, 3.0, 0.25]); k.box("metal", [lx, 0.9, 0], [0.25, 0.25, 6.2]); }
  });
  for (const [bx, col] of [[0, "mailRed"], [2.2, "carBlue"], [4.6, "signY"], [7, "swingG"]] as const) {
    k.at([bx, 0, SCHOOL.wallZ + 1.2], 0, () => { k.box(col, [0, 0.9, 0], [1.6, 1.8, 0.9]); k.box(col, [0, 1.1, 0.5], [1.2, 0.8, 0.25]); k.tube("black", [-0.5, 1.8, 0], [0.5, 1.8, 0], 0.08, true); });
  }
  k.box("paintY", [0, 0.06, 36], [84, 0.01, 0.35]);
  // basketball hoop on a pole
  k.at(SCHOOL.hoop, -Math.PI / 2 + 0.3, () => {
    k.geo("metalG", _cyl8, [0, 5.5, 0], undefined, [0.5, 11, 0.5]);
    k.box("metalG", [0, 10.5, 1.0], [0.3, 0.3, 2]);
    k.box("trim", [0, 11.4, 2.0], [5.2, 3.4, 0.2]); k.box("mailRed", [0, 10.8, 2.12], [1.8, 1.3, 0.04]); k.box("trim", [0, 10.8, 2.14], [1.4, 0.9, 0.04]);
    k.geo("mailRed", new THREE.TorusGeometry(0.75, 0.06, 6, 20), [0, 10.1, 2.9], E(Math.PI / 2, 0, 0));
  });
  // benches along the wall, a bike rack, trees and houses beyond the fence
  for (const bx of [6, 20, 38]) k.at([bx, 0, WZ + 3], 0, () => {
    k.box("wood2", [0, 1.6, 0], [6, 0.3, 1.6]); k.box("wood2", [0, 2.8, -0.75], [6, 1.0, 0.2]);
    for (const lx of [-2.6, 2.6]) k.box("metal", [lx, 0.8, 0], [0.25, 1.6, 1.4]);
  });
  k.at([-36, 0, 30], 0, () => { for (let i = 0; i < 6; i++) k.geo("metalG", new THREE.TorusGeometry(1.0, 0.1, 6, 16, Math.PI), [i * 1.2, 0, 0], E(0, Math.PI / 2, 0)); });
  for (const [tx, tz, s] of [[-60, 10, 1.4], [-58, 34, 1.2], [60, 0, 1.5], [62, 30, 1.3], [-30, 55, 1.2], [25, 56, 1.4]] as const) {
    if (tx < 0) leafyTree(k, [tx, 0, tz], tx * tz, s, true); else bareTree(k, [tx, 0, tz], tx + tz, s);
  }
  for (const [i, hx] of [-60, -28, 4, 36, 68].entries()) k.at([hx, 0, 80], Math.PI, () => { house(k, lotSpec(i + 1, true), false); picketRun(k, -15.6, 15.6, STREET.fenceZ, [[-1.9, 1.9]]); });
}
export const SchoolYard: React.FC<{}> = () => {
  const b = useBuilt("school", schoolYard);
  return <Render b={b} />;
};

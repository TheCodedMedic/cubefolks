// Procedural canvas textures for the blocky Short 6 sets (notes/short06/CONTRACT.md, LOOK).
//   tex(kind, repeat?)        -> THREE.Texture (sRGB, RepeatWrapping, cached per kind+repeat; the canvas is painted once per kind)
//   mat(kind, color?, repeat?) -> props for <meshStandardMaterial {...mat("siding")} />  (map + roughness (+ bumpMap))
// Every texture tiles seamlessly. One tile covers TILE[kind] world units (rig units: a person is 5 tall), so for a wall
// w x h units use repeat = [w / TILE[kind], h / TILE[kind]] or the helper rep(kind, w, h).
// If `color` is given, mat() uses a neutral (light grey) version of the texture tinted by that colour, so e.g.
// mat("siding", "#c9ccd0") gives grey siding, mat("fabric", "#3a5fa8") a blue cloth. Without it the natural colours are used.
// Deterministic (seeded), so every render session paints the same pixels.
import * as THREE from "three";

export type TexKind = "siding" | "sidingGrey" | "shingle" | "brick" | "grass" | "concrete" | "asphalt" | "wood" | "woodDark"
  | "tile" | "carpet" | "wallpaper" | "fabric" | "plaster";

/** world units covered by one tile of each texture */
export const TILE: Record<TexKind, number> = {
  siding: 4, sidingGrey: 4, shingle: 4, brick: 4, grass: 8, concrete: 6, asphalt: 10, wood: 4, woodDark: 4,
  tile: 3, carpet: 4, wallpaper: 4, fabric: 1.5, plaster: 6,
};
/** repeat for a surface w x h world units */
export const rep = (kind: TexKind, w: number, h: number): [number, number] => [w / TILE[kind], h / TILE[kind]];

/** natural base colour (used as the tint for the neutral texture when mat() gets a colour) and surface feel */
const FEEL: Record<TexKind, { color: string; rough: number; bump: number }> = {
  siding: { color: "#e2e0da", rough: 0.85, bump: 0.3 },
  sidingGrey: { color: "#a9adb2", rough: 0.85, bump: 0.3 },
  shingle: { color: "#5b5e66", rough: 0.95, bump: 0.4 },
  brick: { color: "#9a5442", rough: 0.92, bump: 0.35 },
  grass: { color: "#6f9a45", rough: 0.98, bump: 0.25 },
  concrete: { color: "#b9b7b1", rough: 0.95, bump: 0.174 },
  asphalt: { color: "#55575b", rough: 0.97, bump: 0.2 },
  wood: { color: "#b98d5e", rough: 0.6, bump: 0.15 },
  woodDark: { color: "#6e4a32", rough: 0.6, bump: 0.15 },
  tile: { color: "#e9e6df", rough: 0.35, bump: 0.25 },
  carpet: { color: "#8c7f72", rough: 1.0, bump: 0.2 },
  wallpaper: { color: "#e6dcc6", rough: 0.9, bump: 0.074 },
  fabric: { color: "#8a8a8a", rough: 0.95, bump: 0.15 },
  plaster: { color: "#ece7de", rough: 0.92, bump: 0.1 },
};

const S = 512; // canvas size

// ---------- seeded helpers ----------
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const hashI = (x: number, y: number, s: number) => {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
/** periodic value noise in [0,1]; period = cells across the tile */
const pnoise = (u: number, v: number, cells: number, seed: number) => {
  const x = u * cells, y = v * cells, xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const m = (a: number) => ((a % cells) + cells) % cells;
  const a = hashI(m(xi), m(yi), seed), b = hashI(m(xi + 1), m(yi), seed);
  const c = hashI(m(xi), m(yi + 1), seed), d = hashI(m(xi + 1), m(yi + 1), seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
};
const fbm = (u: number, v: number, cells: number, seed: number, oct = 4) => {
  let s = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { s += a * pnoise(u, v, cells << i, seed + i * 17); n += a; a *= 0.5; }
  return s / n;
};

type Px = (u: number, v: number) => number; // 0..1 brightness multiplier field
/** multiply the canvas by a noise field (per pixel), amplitude amp around 1 */
const grain = (g: CanvasRenderingContext2D, field: Px, amp: number) => {
  const im = g.getImageData(0, 0, S, S), d = im.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const k = 1 + (field(x / S, y / S) - 0.5) * 2 * amp, i = (y * S + x) * 4;
    d[i] = Math.min(255, d[i] * k); d[i + 1] = Math.min(255, d[i + 1] * k); d[i + 2] = Math.min(255, d[i + 2] * k);
  }
  g.putImageData(im, 0, 0);
};
/** draw with wrap-around so shapes crossing an edge tile cleanly */
const wrap = (draw: (ox: number, oy: number) => void) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) draw(ox, oy); };
const rgb = (hex: string) => { const n = parseInt(hex.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }; // sRGB bytes
const shade = (hex: string, k: number, a = 1) => { const [r, g, b] = rgb(hex); return `rgba(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0},${a})`; };

// ---------- painters: draw the colour canvas (g) and the height canvas (h, grey: white = raised) ----------
type Painter = (g: CanvasRenderingContext2D, h: CanvasRenderingContext2D, base: string, R: () => number) => void;

const boards = (rows: number, lap: boolean): Painter => (g, h, base, R) => {
  const bh = S / rows;
  for (let i = 0; i < rows; i++) {
    const y = i * bh, k = 0.96 + R() * 0.06;
    // clapboard: each board lighter at the bottom lip, shadowed under the board above
    const gr = g.createLinearGradient(0, y, 0, y + bh);
    gr.addColorStop(0, shade(base, k * 0.8)); gr.addColorStop(0.12, shade(base, k * 0.97));
    gr.addColorStop(0.85, shade(base, k * 1.03)); gr.addColorStop(1, shade(base, k * 1.06));
    g.fillStyle = gr; g.fillRect(0, y, S, bh);
    g.fillStyle = shade(base, 0.55, 0.55); g.fillRect(0, y, S, 2);
    const hg = h.createLinearGradient(0, y, 0, y + bh);
    hg.addColorStop(0, lap ? "#202020" : "#808080"); hg.addColorStop(1, lap ? "#f0f0f0" : "#808080");
    h.fillStyle = hg; h.fillRect(0, y, S, bh);
    // occasional butt joints
    const j = R() * S; g.fillStyle = shade(base, 0.7, 0.5); g.fillRect(j, y + 2, 2, bh - 2);
  }
  grain(g, (u, v) => fbm(u * 1, v * 8, 16, 3, 3) * 0.6 + pnoise(u, v, 64, 9) * 0.4, 0.06);
};

const PAINT: Record<TexKind, Painter> = {
  siding: boards(8, true),
  sidingGrey: boards(8, true),
  shingle: (g, h, base, R) => {
    const rows = 10, rh = S / rows;
    g.fillStyle = shade(base, 0.7); g.fillRect(0, 0, S, S); h.fillStyle = "#000"; h.fillRect(0, 0, S, S);
    for (let i = 0; i < rows; i++) {
      let x = (i % 2) * 20 - 30;
      while (x < S) {
        const w = 34 + R() * 34, k = 0.82 + R() * 0.3, y = i * rh;
        wrap((ox, oy) => {
          const gr = g.createLinearGradient(0, y + oy, 0, y + oy + rh);
          gr.addColorStop(0, shade(base, k * 0.85)); gr.addColorStop(1, shade(base, k * 1.08));
          g.fillStyle = gr; g.fillRect(x + ox + 1, y + oy + 1, w - 2, rh - 1);
          const hg = h.createLinearGradient(0, y + oy, 0, y + oy + rh);
          hg.addColorStop(0, "#303030"); hg.addColorStop(1, "#ffffff"); h.fillStyle = hg; h.fillRect(x + ox + 1, y + oy + 1, w - 2, rh - 1);
        });
        x += w;
      }
    }
    grain(g, (u, v) => pnoise(u, v, 128, 5) * 0.6 + pnoise(u, v, 256, 6) * 0.4, 0.14);
  },
  brick: (g, h, base, R) => {
    const rows = 16, rh = S / rows, bw = S / 8;
    g.fillStyle = "#b9b2a6"; g.fillRect(0, 0, S, S); h.fillStyle = "#202020"; h.fillRect(0, 0, S, S);
    for (let i = 0; i < rows; i++) for (let j = 0; j < 8; j++) {
      const x = j * bw + (i % 2) * bw / 2, y = i * rh, k = 0.8 + R() * 0.35;
      wrap((ox, oy) => {
        g.fillStyle = shade(base, k); g.fillRect(x + ox + 3, y + oy + 3, bw - 6, rh - 5);
        h.fillStyle = "#e0e0e0"; h.fillRect(x + ox + 3, y + oy + 3, bw - 6, rh - 5);
      });
    }
    grain(g, (u, v) => pnoise(u, v, 64, 11) * 0.5 + pnoise(u, v, 256, 12) * 0.5, 0.16);
  },
  grass: (g, h, base, R) => {
    g.fillStyle = base; g.fillRect(0, 0, S, S); h.fillStyle = "#808080"; h.fillRect(0, 0, S, S);
    // mow stripes (soft) + patches
    grain(g, (u, v) => 0.5 + 0.18 * Math.sin(u * Math.PI * 4) + (fbm(u, v, 4, 21) - 0.5) * 0.9, 0.22);
    for (let i = 0; i < 9000; i++) {
      const x = R() * S, y = R() * S, l = 3 + R() * 6, k = 0.8 + R() * 0.45, a = -0.4 + R() * 0.8;
      g.strokeStyle = shade(base, k, 0.45); g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(a) * l, y - Math.cos(a) * l); g.stroke();
      h.strokeStyle = `rgba(255,255,255,0.5)`; h.beginPath(); h.moveTo(x, y); h.lineTo(x + Math.sin(a) * l, y - Math.cos(a) * l); h.stroke();
    }
  },
  concrete: (g, h, base) => {
    g.fillStyle = base; g.fillRect(0, 0, S, S); h.fillStyle = "#c0c0c0"; h.fillRect(0, 0, S, S);
    grain(g, (u, v) => fbm(u, v, 6, 31) * 0.55 + pnoise(u, v, 256, 32) * 0.45, 0.12);
    // expansion joints making 3x3-unit slabs (2 per 6-unit tile)
    for (const p of [0, S / 2]) {
      g.fillStyle = shade(base, 0.6); g.fillRect(p, 0, 3, S); g.fillRect(0, p, S, 3);
      h.fillStyle = "#000"; h.fillRect(p, 0, 3, S); h.fillRect(0, p, S, 3);
    }
  },
  asphalt: (g, h, base, R) => {
    g.fillStyle = base; g.fillRect(0, 0, S, S); h.fillStyle = "#808080"; h.fillRect(0, 0, S, S);
    grain(g, (u, v) => fbm(u, v, 5, 41) * 0.5 + pnoise(u, v, 256, 42) * 0.5, 0.18);
    for (let i = 0; i < 2500; i++) { g.fillStyle = shade(base, 0.6 + R() * 0.9, 0.7); g.fillRect(R() * S, R() * S, 1.5, 1.5); }
    // a couple of tar-seal cracks
    g.strokeStyle = shade(base, 0.7, 0.35); g.lineWidth = 1.5;
    for (let c = 0; c < 2; c++) { let x = R() * S, y = R() * S; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 7; k++) { x += (R() - 0.5) * 24; y += R() * 14; g.lineTo(x, y); } g.stroke(); }
  },
  wood: (g, h, base, R) => planks(g, h, base, R),
  woodDark: (g, h, base, R) => planks(g, h, base, R),
  tile: (g, h, base, R) => {
    const n = 6, w = S / n;
    g.fillStyle = "#9d9a93"; g.fillRect(0, 0, S, S); h.fillStyle = "#000"; h.fillRect(0, 0, S, S);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const k = 0.96 + R() * 0.06, x = i * w, y = j * w;
      const gr = g.createLinearGradient(x, y, x + w, y + w);
      gr.addColorStop(0, shade(base, k * 1.04)); gr.addColorStop(1, shade(base, k * 0.95));
      g.fillStyle = gr; g.fillRect(x + 3, y + 3, w - 6, w - 6);
      h.fillStyle = "#fff"; h.fillRect(x + 3, y + 3, w - 6, w - 6);
    }
    grain(g, (u, v) => pnoise(u, v, 128, 51), 0.03);
  },
  carpet: (g, h, base) => {
    g.fillStyle = base; g.fillRect(0, 0, S, S); h.fillStyle = "#808080"; h.fillRect(0, 0, S, S);
    grain(g, (u, v) => pnoise(u, v, 256, 61) * 0.7 + fbm(u, v, 8, 62, 2) * 0.3, 0.2);
    const im = h.getImageData(0, 0, S, S), d = im.data;
    for (let i = 0; i < d.length; i += 4) { const n = hashI(i, 7, 63) * 255; d[i] = d[i + 1] = d[i + 2] = n; }
    h.putImageData(im, 0, 0);
  },
  wallpaper: (g, h, base) => {
    g.fillStyle = base; g.fillRect(0, 0, S, S); h.fillStyle = "#808080"; h.fillRect(0, 0, S, S);
    // soft vertical stripes + small diamond motif
    for (let i = 0; i < 8; i++) { g.fillStyle = shade(base, 0.93, 0.6); g.fillRect(i * 64 + 26, 0, 12, S); }
    g.fillStyle = shade(base, 0.85, 0.7);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      const x = i * 64, y = j * 64 + (i % 2) * 32;
      wrap((ox, oy) => { g.beginPath(); g.moveTo(x + ox, y + oy - 5); g.lineTo(x + ox + 4, y + oy); g.lineTo(x + ox, y + oy + 5); g.lineTo(x + ox - 4, y + oy); g.fill(); });
    }
    grain(g, (u, v) => fbm(u, v, 8, 71, 3), 0.05);
  },
  fabric: (g, h, base) => {
    g.fillStyle = base; g.fillRect(0, 0, S, S);
    // plain weave: alternating warp/weft highlights
    const im = g.getImageData(0, 0, S, S), d = im.data, hi = h.createImageData(S, S), hd = hi.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const cx = x % 4, cy = y % 4, warp = ((x >> 2) + (y >> 2)) % 2 === 0;
      const t = warp ? Math.sin((cy + 0.5) / 4 * Math.PI) : Math.sin((cx + 0.5) / 4 * Math.PI);
      const k = 0.86 + 0.16 * t + (pnoise(x / S, y / S, 32, 81) - 0.5) * 0.1, i = (y * S + x) * 4;
      d[i] *= k; d[i + 1] *= k; d[i + 2] *= k; hd[i] = hd[i + 1] = hd[i + 2] = t * 255; hd[i + 3] = 255;
    }
    g.putImageData(im, 0, 0); h.putImageData(hi, 0, 0);
  },
  plaster: (g, h, base) => {
    g.fillStyle = base; g.fillRect(0, 0, S, S); h.fillStyle = "#808080"; h.fillRect(0, 0, S, S);
    grain(g, (u, v) => fbm(u, v, 4, 91) * 0.6 + pnoise(u, v, 128, 92) * 0.4, 0.05);
    const im = h.getImageData(0, 0, S, S), d = im.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const n = fbm(x / S, y / S, 32, 93, 3) * 255, i = (y * S + x) * 4; d[i] = d[i + 1] = d[i + 2] = n; }
    h.putImageData(im, 0, 0);
  },
};

function planks(g: CanvasRenderingContext2D, h: CanvasRenderingContext2D, base: string, R: () => number) {
  const n = 6, pw = S / n; // floor boards running along u (6 boards per 4 units)
  h.fillStyle = "#c0c0c0"; h.fillRect(0, 0, S, S);
  for (let i = 0; i < n; i++) {
    const y = i * pw, k = 0.92 + R() * 0.14, seed = 100 + i;
    g.fillStyle = shade(base, k); g.fillRect(0, y, S, pw);
    // grain: stretched noise along the board
    const im = g.getImageData(0, y, S, pw), d = im.data;
    for (let yy = 0; yy < pw; yy++) for (let x = 0; x < S; x++) {
      const v = fbm(x / S, (y + yy) / S * 0.08 + i * 0.13, 2, seed, 3), str = Math.sin((yy / pw * 9 + v * 6) * Math.PI);
      const kk = 0.97 + str * 0.05 + (v - 0.5) * 0.18, j = (yy * S + x) * 4;
      d[j] *= kk; d[j + 1] *= kk; d[j + 2] *= kk;
    }
    g.putImageData(im, 0, y);
    // seams: one long-edge groove + a staggered end joint
    g.fillStyle = shade(base, 0.4, 0.8); g.fillRect(0, y, S, 2); h.fillStyle = "#000"; h.fillRect(0, y, S, 2);
    const j = ((i * 0.37) % 1) * S; g.fillRect(j, y, 2, pw); h.fillRect(j, y, 2, pw);
  }
}

// ---------- canvas + texture caches ----------
type Painted = { color: HTMLCanvasElement; height: HTMLCanvasElement };
const painted = new Map<string, Painted>();
const paint = (kind: TexKind, neutral: boolean): Painted => {
  const key = kind + (neutral ? "|n" : "");
  const hit = painted.get(key); if (hit) return hit;
  const mk = () => { const c = document.createElement("canvas"); c.width = c.height = S; return c; };
  const color = mk(), height = mk();
  const base = neutral ? "#f0f0f0" : FEEL[kind].color;
  let seed = 0; for (const ch of kind) seed = seed * 31 + ch.charCodeAt(0);
  PAINT[kind](color.getContext("2d", { willReadFrequently: true })!, height.getContext("2d", { willReadFrequently: true })!, base, rng(seed));
  const p = { color, height }; painted.set(key, p); return p;
};

const texCache = new Map<string, THREE.Texture>();
const mkTex = (canvas: HTMLCanvasElement, key: string, repeat: [number, number], srgb: boolean) => {
  const k = `${key}|${repeat[0]}x${repeat[1]}`;
  const hit = texCache.get(k); if (hit) return hit;
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8; t.needsUpdate = true;
  texCache.set(k, t); return t;
};

/** the natural-colour texture of a surface kind (cached per kind + repeat) */
export function tex(kind: TexKind, repeat: [number, number] = [1, 1]): THREE.Texture {
  return mkTex(paint(kind, false).color, kind, repeat, true);
}
/** neutral light-grey version, meant to be tinted by a material colour */
export function texNeutral(kind: TexKind, repeat: [number, number] = [1, 1]): THREE.Texture {
  return mkTex(paint(kind, true).color, kind + "|n", repeat, true);
}
/** grey height map (white = raised) for bumpMap */
export function bump(kind: TexKind, repeat: [number, number] = [1, 1]): THREE.Texture {
  return mkTex(paint(kind, false).height, kind + "|h", repeat, false);
}

export type MatProps = { map: THREE.Texture; color: string; roughness: number; metalness: number; bumpMap: THREE.Texture; bumpScale: number };
/** props for <meshStandardMaterial {...mat(kind, color?, repeat?)} /> */
export function mat(kind: TexKind, color?: string, repeat: [number, number] = [1, 1]): MatProps {
  const f = FEEL[kind];
  return {
    map: color ? texNeutral(kind, repeat) : tex(kind, repeat),
    color: color ?? "#ffffff",
    roughness: f.rough, metalness: 0,
    bumpMap: bump(kind, repeat), bumpScale: f.bump,
  };
}

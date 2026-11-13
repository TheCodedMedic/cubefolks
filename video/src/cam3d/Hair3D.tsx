// Hair, beards and hoods built from curves instead of solid shells (user note, Ep06 cast sheets 2026-10-24:
// "We need curves, like a real line… If someone has hair, we should show different hair strands… If the hair is long,
// it should be long… someone with long hair running, it should show").
//
// Hair: hundreds of strands grown from a real hairline over the scalp (head sphere R = 0.23, head-local coordinates,
// face toward +z). Each strand follows the scalp along the style's flow, then (long hair, ponytails) leaves the head and
// hangs under gravity, pushed by `wind` (running, turning, a breeze) and kept outside the head and the shoulders.
// Strands are flattened tapering tubes merged into one mesh, coloured darker at the root, with per-strand variation,
// grey strands mixed in (salt and pepper) and an optional streak. A thin scalp layer under them hides the black head.
// Beards and mustaches are short strands on the jaw and lip. The hood is a curved shell with a face opening, a lining,
// a rolled rim and a seam; down, the same hood folds back onto the shoulders.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { foldShell } from "./Cloth3D";

const R = 0.23;
const D = THREE.MathUtils.degToRad;

export type HairStyle = "short" | "swept" | "long" | "ponytail" | "bun" | "curly" | "balding" | "buzz";
export type HairSpec = {
  style: HairStyle;
  color: string;
  grey?: number;            // 0..1 share of grey strands (salt and pepper, age)
  greyColor?: string;
  streak?: string;          // a lighter streak at the front left
  length?: number;          // long styles: strand length in metres (default 0.55)
  seed?: number;
};

// ─── small helpers ───────────────────────────────────────────────────────────
const rng = (seed: number) => { let a = seed | 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const sph = (az: number, el: number, r: number) => new THREE.Vector3(r * Math.cos(el) * Math.sin(az), r * Math.sin(el), r * Math.cos(el) * Math.cos(az));
const azOf = (p: THREE.Vector3) => Math.atan2(p.x, p.z);
const elOf = (p: THREE.Vector3) => Math.asin(THREE.MathUtils.clamp(p.y / p.length(), -1, 1));
const tangentToward = (p: THREE.Vector3, v: THREE.Vector3) => { const n = p.clone().normalize(); const t = v.clone().addScaledVector(n, -v.dot(n)); return t.lengthSq() < 1e-10 ? new THREE.Vector3(0, -1, 0) : t.normalize(); };
const smooth = (a: number, b: number, x: number) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
/** Hairline elevation at azimuth az (0 = forehead): front f, sides s (above the ears), back b (nape). */
const hairline = (az: number, f: number, s: number, b: number) => { const c = Math.cos(az); return c >= 0 ? s + (f - s) * Math.pow(c, 1.4) : s + (b - s) * Math.pow(-c, 1.1); };
/** Fibonacci points on the sphere (az, el), well spread. */
const fib = (n: number) => { const out: [number, number][] = []; const g = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const y = 1 - (2 * (i + 0.5)) / n; out.push([Math.atan2(Math.sin(g * i), Math.cos(g * i)), Math.asin(y)]); } return out; };

// ─── strands → one mesh ──────────────────────────────────────────────────────
type Strand = { pts: THREE.Vector3[]; w: number; col: THREE.Color };
const buildMesh = (strands: Strand[], radial = 5, flat = 0.45) => {
  let nv = 0, ni = 0;
  for (const s of strands) { nv += s.pts.length * radial; ni += (s.pts.length - 1) * radial * 6; }
  const pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = new Uint32Array(ni);
  let v = 0, k = 0;
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), q = new THREE.Vector3();
  const dark = new THREE.Color(), tip = new THREE.Color(), c = new THREE.Color();
  for (const s of strands) {
    const m = s.pts.length, base = v;
    dark.copy(s.col).multiplyScalar(0.62); tip.copy(s.col).multiplyScalar(1.12);
    for (let i = 0; i < m; i++) {
      const p = s.pts[i];
      T.subVectors(s.pts[Math.min(m - 1, i + 1)], s.pts[Math.max(0, i - 1)]).normalize();
      N.copy(p); N.y *= 0.4; if (N.lengthSq() < 1e-8) N.set(0, 0, -1); N.normalize(); N.addScaledVector(T, -N.dot(T)); if (N.lengthSq() < 1e-8) N.set(1, 0, 0); N.normalize();
      B.crossVectors(T, N).normalize();
      const u = i / (m - 1), w = s.w * (1 - 0.78 * Math.pow(u, 1.4));
      c.copy(dark).lerp(tip, Math.pow(u, 0.6));
      for (let j = 0; j < radial; j++) {
        const a = (j / radial) * Math.PI * 2;
        q.copy(p).addScaledVector(B, Math.cos(a) * w).addScaledVector(N, Math.sin(a) * w * flat);
        pos.set([q.x, q.y, q.z], v * 3); col.set([c.r, c.g, c.b], v * 3); v++;
      }
    }
    for (let i = 0; i < m - 1; i++) for (let j = 0; j < radial; j++) {
      const a0 = base + i * radial + j, a1 = base + i * radial + ((j + 1) % radial), b0 = a0 + radial, b1 = a1 + radial;
      idx.set([a0, b0, a1, a1, b0, b1], k); k += 6;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
};

/** A scalp layer following the hairline (so the glossy head never shows between strands). */
const scalpGeo = (inside: (az: number, el: number) => boolean, r: number) => {
  const NA = 72, NE = 28, pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NA; i++) for (let j = 0; j <= NE; j++) { const p = sph(-Math.PI + (i / NA) * Math.PI * 2, -Math.PI / 2 + (j / NE) * Math.PI, r); pos.push(p.x, p.y, p.z); }
  const at = (i: number, j: number) => i * (NE + 1) + j;
  for (let i = 0; i < NA; i++) for (let j = 0; j < NE; j++) {
    const az = -Math.PI + ((i + 0.5) / NA) * Math.PI * 2, el = -Math.PI / 2 + ((j + 0.5) / NE) * Math.PI;
    if (inside(az, el)) idx.push(at(i, j), at(i, j + 1), at(i + 1, j), at(i + 1, j), at(i, j + 1), at(i + 1, j + 1));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
};

const hairMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.0 });
const matCache = new Map<string, THREE.MeshStandardMaterial>();
const solid = (c: string, rough = 0.85) => { const k = c + rough; if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color: c, roughness: rough })); return matCache.get(k)!; };

// ─── grow one strand ─────────────────────────────────────────────────────────
type Grow = {
  len: number; steps: number; lift: number; rise?: number;
  flow: (p: THREE.Vector3) => THREE.Vector3;           // on-scalp direction (any vector; projected to the surface)
  floor?: (az: number) => number;                      // stop: never go below this elevation while on the head
  exit?: (p: THREE.Vector3) => boolean;                // leave the scalp and hang from here
  wind: THREE.Vector3; gravity?: number;
  curl?: { r: number; turns: number; ph: number };
};
const grow = (az: number, el: number, o: Grow): THREE.Vector3[] => {
  let r = R + o.lift;
  const p = sph(az, el, r), pts = [p.clone()], ds = o.len / o.steps;
  let on = true, d = tangentToward(p, o.flow(p));
  const down = new THREE.Vector3(0, -1, 0);
  for (let i = 1; i <= o.steps; i++) {
    if (on) {
      d = tangentToward(p, o.flow(p));
      const nxt = p.clone().addScaledVector(d, ds); r += (o.rise ?? 0) * ds; nxt.setLength(r);
      if (o.floor && elOf(nxt) < o.floor(azOf(nxt))) break;
      p.copy(nxt);
      if (o.exit && o.exit(p)) on = false;
    } else {
      d.multiplyScalar(0.82).addScaledVector(down, 0.18 * (o.gravity ?? 1)).addScaledVector(o.wind, 0.16).normalize();
      p.addScaledVector(d, ds);
      if (p.length() < r) p.setLength(r);
      // keep clear of the neck, shoulders and back (below the jaw the body is an oval about 0.24 wide, 0.16 deep)
      if (p.y < -0.22) { const ex = 0.25, ez = 0.17 + (p.z < 0 ? 0.0 : 0.01), e = (p.x / ex) ** 2 + ((p.z + 0.01) / ez) ** 2; if (e < 1) { const k = 1 / Math.sqrt(Math.max(e, 1e-4)); p.x *= k; p.z = (p.z + 0.01) * k - 0.01; } }
    }
    pts.push(p.clone());
  }
  if (o.curl && pts.length > 3) {
    for (let i = 1; i < pts.length; i++) {
      const u = i / (pts.length - 1), t = tangentToward(pts[i], pts[i].clone().sub(pts[i - 1])), n = pts[i].clone().normalize(), b = new THREE.Vector3().crossVectors(t, n);
      const a = o.curl.ph + u * o.curl.turns * Math.PI * 2, rr = o.curl.r * Math.min(1, u * 3);
      pts[i].addScaledVector(n, Math.sin(a) * rr).addScaledVector(b, Math.cos(a) * rr);
    }
  }
  return pts;
};

// ─── hair styles ─────────────────────────────────────────────────────────────
const buildHair = (h: HairSpec, wind: THREE.Vector3) => {
  const rnd = rng((h.seed ?? 7) * 7919 + h.style.length * 31);
  const base = new THREE.Color(h.color), grey = new THREE.Color(h.greyColor ?? "#9A9792"), streak = h.streak ? new THREE.Color(h.streak) : null;
  const colFor = (az: number, el: number) => {
    const c = base.clone();
    if (h.grey && rnd() < h.grey) c.lerp(grey, 0.55 + rnd() * 0.45);
    if (streak && az > 0.15 && az < 0.42 && el > 0.35) c.copy(streak);
    const j = 0.88 + rnd() * 0.24; return c.multiplyScalar(j);
  };
  const st = h.style, strands: Strand[] = [];
  // hairline per style (front, sides, back), and which part of the scalp grows hair
  const HL: Record<HairStyle, [number, number, number]> = {
    short: [0.52, 0.12, -0.32], swept: [0.5, 0.1, -0.32], buzz: [0.55, 0.14, -0.28], curly: [0.48, 0.08, -0.3],
    long: [0.5, 0.08, -0.35], ponytail: [0.5, 0.08, -0.3], bun: [0.52, 0.1, -0.28], balding: [0.95, 0.12, -0.32],
  };
  const [hf, hs, hb] = HL[st];
  const scalp = (az: number, el: number) => {
    if (el < hairline(az, hf, hs, hb)) return false;
    if (st === "balding") return el < 0.5 && Math.abs(az) > 0.95; // a fringe around the back and sides
    return true;
  };
  const roots = fib(st === "buzz" ? 2600 : st === "curly" ? 1500 : st === "short" || st === "swept" ? 2600 : st === "balding" ? 4200 : 2200).filter(([az, el]) => scalp(az, el));
  const jitter = (az: number, el: number): [number, number] => [az + (rnd() - 0.5) * 0.05, el + (rnd() - 0.5) * 0.04];
  const crown = sph(Math.PI, 0.9, R);
  const front = (az: number) => hairline(az, hf, hs, hb);

  for (const [a0, e0] of roots) {
    const [az, el] = jitter(a0, e0);
    const col = colFor(az, el);
    if (st === "short" || st === "buzz" || st === "swept" || st === "balding") {
      // combed away from the crown; the front falls a little over the hairline but never onto the brows
      const side = Math.sin(az);
      const len = st === "buzz" ? 0.016 : st === "balding" ? 0.05 : 0.05 + rnd() * 0.03;
      const pts = grow(az, el, {
        len, steps: st === "buzz" ? 3 : 7, lift: 0.004 + rnd() * 0.006, rise: 0.02,
        flow: (p) => st === "swept"
          ? new THREE.Vector3(side * 0.55, -0.35, -1)                               // swept back and over the ears
          : st === "balding" ? new THREE.Vector3(side * 0.3, -1, -0.5)                // the fringe combs down and back
          : p.clone().sub(crown).add(new THREE.Vector3(0, -0.9, 0)),                // short: down from the crown, front falls forward
        floor: (a) => Math.max(front(a) - (Math.cos(a) > 0.3 ? 0.07 : 0.12), -0.4),
        wind,
      });
      if (pts.length > 2) strands.push({ pts, w: st === "buzz" ? 0.0035 : 0.0042 + rnd() * 0.0016, col });
    } else if (st === "curly") {
      const pts = grow(az, el, {
        len: 0.07 + rnd() * 0.04, steps: 10, lift: 0.012 + rnd() * 0.02, rise: 0.35,
        flow: (p) => p.clone().sub(crown).add(new THREE.Vector3(0, 0.02, 0)),
        floor: (a) => front(a) - 0.05, wind,
        curl: { r: 0.012, turns: 2.2 + rnd(), ph: rnd() * 6.28 },
      });
      if (pts.length > 2) strands.push({ pts, w: 0.006 + rnd() * 0.002, col });
    } else if (st === "long") {
      // centre parting; strands run down and round the face, then hang to the shoulders and back
      const side = az >= 0 ? 1 : -1, nearFace = Math.cos(az) > 0.2;
      const L = (h.length ?? 0.55) * (0.75 + rnd() * 0.3) * (nearFace ? 0.92 : 1);
      const pts = grow(az, el, {
        len: L, steps: 26, lift: 0.006 + rnd() * 0.014, rise: 0.01,
        flow: (p) => new THREE.Vector3(side * (nearFace ? 1.6 : 0.25), -1, nearFace ? -0.55 : -0.15),
        exit: (p) => elOf(p) < (Math.cos(azOf(p)) > 0 ? -0.02 : -0.3),
        wind, gravity: 1,
      });
      strands.push({ pts, w: 0.006 + rnd() * 0.0025, col });
    } else if (st === "ponytail" || st === "bun") {
      // gathered to a tie at the back of the head
      const tie = sph(Math.PI, st === "bun" ? 0.5 : 0.18, R + 0.01);
      const pts = grow(az, el, {
        len: 0.45, steps: 16, lift: 0.005 + rnd() * 0.008,
        flow: (p) => tie.clone().sub(p),
        exit: (p) => p.distanceTo(tie) < 0.03,
        wind,
      });
      // cut the gathered strand at the tie (the tail and the bun are built below)
      const k = pts.findIndex((p) => p.distanceTo(tie) < 0.03);
      const cut = k > 1 ? pts.slice(0, k + 1) : pts.slice(0, 8);
      strands.push({ pts: cut, w: 0.0055 + rnd() * 0.002, col });
    }
  }
  // the ponytail tail: a bundle from the tie, out and down, swinging with the wind
  if (st === "ponytail") {
    const tie = sph(Math.PI, 0.18, R + 0.02);
    for (let i = 0; i < 140; i++) {
      const off = new THREE.Vector3((rnd() - 0.5) * 0.03, (rnd() - 0.5) * 0.03, -rnd() * 0.01);
      const p = tie.clone().add(off), d = new THREE.Vector3((rnd() - 0.5) * 0.25, -0.35, -1).normalize(), pts = [p.clone()];
      const L = (h.length ?? 0.32) * (0.7 + rnd() * 0.4), n = 16, ds = L / n;
      for (let s = 1; s <= n; s++) {
        d.multiplyScalar(0.8).addScaledVector(new THREE.Vector3(0, -1, 0), 0.2).addScaledVector(wind, 0.18).normalize();
        p.addScaledVector(d, ds); if (p.length() < R + 0.01) p.setLength(R + 0.01); pts.push(p.clone());
      }
      strands.push({ pts, w: 0.006 + rnd() * 0.002, col: colFor(Math.PI, 0.2) });
    }
    const band = new THREE.Color("#2A2A30");
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, pts = [0, 1, 2, 3].map((s) => tie.clone().add(new THREE.Vector3(Math.cos(a + s * 0.6) * 0.022, Math.sin(a + s * 0.6) * 0.022, -0.008))); strands.push({ pts, w: 0.006, col: band }); }
  }
  // the bun: strands wound round a ball at the back of the head
  let bunCore: THREE.Vector3 | null = null;
  if (st === "bun") {
    const c = sph(Math.PI, 0.5, R + 0.07); bunCore = c;
    for (let i = 0; i < 160; i++) {
      const ax = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize(), u = new THREE.Vector3().crossVectors(ax, new THREE.Vector3(0.3, 1, 0.2)).normalize(), v = new THREE.Vector3().crossVectors(ax, u);
      const rr = 0.045 + rnd() * 0.03, a0 = rnd() * 6.28, pts: THREE.Vector3[] = [];
      for (let s = 0; s <= 14; s++) { const a = a0 + (s / 14) * Math.PI * 1.6; pts.push(c.clone().addScaledVector(u, Math.cos(a) * rr).addScaledVector(v, Math.sin(a) * rr)); }
      strands.push({ pts, w: 0.009, col: colFor(Math.PI, 0.5) });
    }
  }
  const sc = scalpGeo((az, el) => scalp(az, el) && el > hairline(az, hf, hs, hb) + 0.01, R + 0.004);
  return { strands: buildMesh(strands), scalp: sc, scalpColor: "#" + base.clone().multiplyScalar(0.55).getHexString(), bunCore };
};

/** Strand hair on a head (child of the head group). wind: head-local push for the hanging parts (running → streams back). */
export const HairStrands: React.FC<{ hair: HairSpec; wind?: [number, number, number] }> = ({ hair, wind = [0, 0, 0] }) => {
  const moves = hair.style === "long" || hair.style === "ponytail";
  const wq = moves ? wind.map((x) => Math.round(x * 50) / 50).join(",") : "0";
  const g = useMemo(() => buildHair(hair, new THREE.Vector3(...(wq.split(",").length === 3 ? (wq.split(",").map(Number) as [number, number, number]) : [0, 0, 0]))), [JSON.stringify(hair), wq]);
  useEffect(() => () => { g.strands.dispose(); g.scalp.dispose(); }, [g]);
  return (
    <group>
      <mesh geometry={g.scalp} material={solid(g.scalpColor, 0.9)} />
      {g.bunCore && <mesh position={g.bunCore} material={solid(g.scalpColor, 0.9)}><sphereGeometry args={[0.06, 20, 14]} /></mesh>}
      <mesh geometry={g.strands} material={hairMat} castShadow />
    </group>
  );
};

// ─── facial hair ─────────────────────────────────────────────────────────────
export type BeardSpec = { color: string; beard?: boolean; mustache?: boolean; stubble?: boolean; grey?: number; seed?: number };
const buildBeard = (b: BeardSpec) => {
  const rnd = rng((b.seed ?? 3) * 104729), base = new THREE.Color(b.color), grey = new THREE.Color("#BDBAB4"), strands: Strand[] = [];
  const colFor = () => base.clone().lerp(grey, b.grey && rnd() < b.grey ? 0.5 + rnd() * 0.4 : 0).multiplyScalar(0.85 + rnd() * 0.3);
  const mouthClear = (az: number, el: number) => Math.abs(az) < 0.42 && el > -0.47 && el < -0.18;
  const jaw = (az: number, el: number) => Math.abs(az) < 1.45 && el > -1.0 && !mouthClear(az, el) && el < (Math.abs(az) > 1.18 ? 0.0 : Math.abs(az) > 0.42 ? -0.3 : -0.47);
  if (b.beard || b.stubble) {
    for (const [a0, e0] of fib(9000)) {
      const az = a0 + (rnd() - 0.5) * 0.02, el = e0 + (rnd() - 0.5) * 0.02;
      if (!jaw(az, el)) continue;
      const len = b.stubble ? 0.005 : 0.016 + rnd() * 0.012;
      const pts = grow(az, el, { len, steps: b.stubble ? 2 : 4, lift: 0.002, rise: 0.25, flow: (p) => new THREE.Vector3(0, -1, 0.15 * Math.sign(p.z)).add(p.clone().normalize().multiplyScalar(0.25)), wind: new THREE.Vector3() });
      strands.push({ pts, w: b.stubble ? 0.0024 : 0.0045, col: colFor() });
    }
  }
  if (b.mustache) {
    for (let i = 0; i < 260; i++) {
      const az = (rnd() - 0.5) * 0.66, el = -0.235 - rnd() * 0.035;
      const pts = grow(az, el, { len: 0.016 + rnd() * 0.01, steps: 3, lift: 0.002, rise: 0.2, flow: () => new THREE.Vector3(Math.sign(az) * 0.6, -1, 0), floor: () => -0.3, wind: new THREE.Vector3() });
      if (pts.length > 1) strands.push({ pts, w: 0.0045, col: colFor() });
    }
  }
  return buildMesh(strands, 4, 0.6);
};
export const BeardStrands: React.FC<{ beard: BeardSpec }> = ({ beard }) => {
  const g = useMemo(() => buildBeard(beard), [JSON.stringify(beard)]);
  useEffect(() => () => g.dispose(), [g]);
  return <mesh geometry={g} material={hairMat} />;
};

// ─── the hood ────────────────────────────────────────────────────────────────
/** A hood shell around the head (head-local): a face opening, a lining, a rolled rim, a seam over the crown,
 * flaring onto the shoulders at the back. Built once per colour. */
const hoodGeo = (() => {
  const NA = 80, NE = 34, e0 = -1.15, e1 = Math.PI / 2;
  const open = (az: number, el: number) => (az / 0.9) ** 2 + ((el - 0.02) / 0.58) ** 2 < 1; // the face opening: an oval round the face only, closed under the chin
  const rad = (az: number, el: number) => R * 1.17 * (1 + 0.04 * Math.cos(az)) + Math.max(0, -0.3 - el) * 0.16 * (1 - 0.5 * Math.max(0, Math.cos(az))) - 0.025 * Math.max(0, -Math.cos(az)) * Math.max(0, Math.sin(el));
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NA; i++) for (let j = 0; j <= NE; j++) {
    const az = -Math.PI + (i / NA) * Math.PI * 2, el = e0 + (j / NE) * (e1 - e0), p = sph(az, el, rad(az, el));
    p.x *= 1.04; p.z -= 0.012; pos.push(p.x, p.y, p.z);
  }
  const at = (i: number, j: number) => i * (NE + 1) + j;
  for (let i = 0; i < NA; i++) for (let j = 0; j < NE; j++) {
    const az = -Math.PI + ((i + 0.5) / NA) * Math.PI * 2, el = e0 + ((j + 0.5) / NE) * (e1 - e0);
    if (open(az, el)) continue;
    idx.push(at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1));
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); foldShell(g, 0.006, -0.25);
  // the rim follows the face opening (upper part), and the seam runs over the crown
  const rimPts: THREE.Vector3[] = [];
  for (let k = 0; k <= 48; k++) {
    const th = (k / 48) * 2 * Math.PI, az = 0.9 * Math.cos(th), el = 0.02 + 0.58 * Math.sin(th);
    const p = sph(az, el, rad(az, el) + 0.004); p.x *= 1.04; p.z -= 0.012; rimPts.push(p);
  }
  const seamPts: THREE.Vector3[] = [];
  for (let k = 0; k <= 30; k++) { const el = 0.54 + (k / 30) * (Math.PI - 0.54 + 0.55); const e = el > Math.PI / 2 ? Math.PI - el : el, az = el > Math.PI / 2 ? Math.PI : 0; const p = sph(az, e, rad(az, e) + 0.003); p.x *= 1.04; p.z -= 0.012; seamPts.push(p); }
  const rim = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts, true), 96, 0.016, 10, true);
  const seam = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seamPts), 60, 0.0035, 6, false);
  return { shell: g, rim, seam };
})();
const toonCache = new Map<string, THREE.MeshToonMaterial>();
const ramp = (() => { const d = new Uint8Array([78, 78, 78, 255, 128, 128, 128, 255, 176, 176, 176, 255, 220, 220, 220, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 5, 1, THREE.RGBAFormat); t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const cloth = (c: string, side: THREE.Side = THREE.FrontSide) => { const k = c + side; if (!toonCache.has(k)) toonCache.set(k, new THREE.MeshToonMaterial({ color: c, gradientMap: ramp, side })); return toonCache.get(k)!; };

/** Hood up (head-local, child of the head group). */
export const HoodUp: React.FC<{ color: string; lining: string }> = ({ color, lining }) => (
  <group>
    <mesh geometry={hoodGeo.shell} material={cloth(color)} castShadow />
    <mesh geometry={hoodGeo.shell} material={cloth(lining, THREE.BackSide)} />
    <mesh geometry={hoodGeo.rim} material={cloth(color)} />
    <mesh geometry={hoodGeo.seam} material={cloth(lining)} />
  </group>
);

/** Hood down: a soft pouch lying on the upper back (torso frame), opening at the top, a rolled rim, a centre seam. */
const pouch = (() => {
  const g = foldShell(new THREE.SphereGeometry(1, 48, 22, D(195), D(150), Math.PI / 2, Math.PI / 2 * 0.95), 0.05, 0.0);
  const rim: THREE.Vector3[] = [];
  for (let k = 0; k <= 40; k++) { const a = D(195) + (k / 40) * D(150); rim.push(new THREE.Vector3(-Math.cos(a), 0, Math.sin(a))); }
  const seam: THREE.Vector3[] = [];
  for (let k = 0; k <= 16; k++) { const th = Math.PI / 2 + (k / 16) * (Math.PI / 2) * 0.93; seam.push(new THREE.Vector3(0, Math.cos(th), -Math.sin(th))); }
  return { g, rim: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim), 60, 0.07, 8, false), seam: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seam), 30, 0.02, 6, false) };
})();
export const HoodDown: React.FC<{ color: string; lining: string }> = ({ color, lining }) => (
  <group position={[0, 0.49, -0.085]} rotation={[D(14), 0, 0]} scale={[0.18, 0.2, 0.12]}>
    <mesh geometry={pouch.g} material={cloth(color, THREE.FrontSide)} castShadow />
    <mesh geometry={pouch.g} material={cloth(lining, THREE.BackSide)} />
    <mesh geometry={pouch.rim} material={cloth(color)} />
    <mesh geometry={pouch.seam} material={cloth(lining)} />
  </group>
);

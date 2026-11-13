// Episode 04 VFX in three.js: rain that can freeze, lightning bolts (core + glow + branches, flickering),
// lightning crawling over a body, speed streaks, the time tunnel, cracks of light in the sky.
// Every effect is a pure function of the time values it is given (deterministic for Remotion).
import React, { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export type V3 = [number, number, number];
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ─── lightning ───────────────────────────────────────────────────────────────
/** Jagged path from a to b by midpoint displacement (seeded). */
const boltPts = (a: V3, b: V3, seed: number, depth = 6, disp = 0.22): THREE.Vector3[] => {
  let pts = [new THREE.Vector3(...a), new THREE.Vector3(...b)];
  const len = pts[0].distanceTo(pts[1]);
  let d = len * disp, s = seed;
  for (let k = 0; k < depth; k++) {
    const next: THREE.Vector3[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1];
      const m = p.clone().add(q).multiplyScalar(0.5);
      m.add(new THREE.Vector3((rnd(s++) - 0.5) * d, (rnd(s++) - 0.5) * d, (rnd(s++) - 0.5) * d));
      next.push(p, m);
    }
    next.push(pts[pts.length - 1]); pts = next; d *= 0.55;
  }
  return pts;
};
const coreMat = new THREE.MeshBasicMaterial({ color: "#F4FAFF", toneMapped: false });
const glowMat = (c: string, o: number) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
const GLOW1 = glowMat("#8EC5FF", 0.45), GLOW2 = glowMat("#5A8CFF", 0.16);
// tinted lightning (e.g. the older you's amber bolts in Ep05): glow materials cached per colour
const GLOWS = new Map<string, [THREE.MeshBasicMaterial, THREE.MeshBasicMaterial]>();
const glowsFor = (c?: string): [THREE.MeshBasicMaterial, THREE.MeshBasicMaterial] => {
  if (!c) return [GLOW1, GLOW2];
  if (!GLOWS.has(c)) GLOWS.set(c, [glowMat(c, 0.5), glowMat(c, 0.2)]);
  return GLOWS.get(c)!;
};

const tube = (pts: THREE.Vector3[], r: number) => {
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  return new THREE.TubeGeometry(path, Math.max(8, pts.length * 2), r, 5, false);
};

/** One lightning bolt with branches. grow 0..1 draws it from a toward b. Changes shape every `rate` seconds (flicker). */
export const Bolt: React.FC<{ a: V3; b: V3; t: number; seed?: number; width?: number; grow?: number; rate?: number; branches?: number; color?: string; light?: number }> = ({
  a, b, t, seed = 1, width = 1, grow = 1, rate = 0.06, branches = 3, light = 0, color,
}) => {
  const [G1, G2] = glowsFor(color);
  const key = seed * 1000 + Math.floor(t / rate);
  const geo = useMemo(() => {
    let pts = boltPts(a, b, key);
    if (grow < 1) pts = pts.slice(0, Math.max(2, Math.ceil(pts.length * grow)));
    const parts: { g: THREE.BufferGeometry; w: number }[] = [{ g: tube(pts, 0.012 * width), w: 1 }];
    const glow = [tube(pts, 0.026 * width), tube(pts, 0.05 * width)]; // tight glow: thin, crisp strikes (user note 2026-10-23)
    for (let k = 0; k < branches; k++) {
      const i = Math.floor(rnd(key + k * 7) * (pts.length * 0.8));
      const p = pts[i]; if (!p) continue;
      const dir = new THREE.Vector3(rnd(key + k) - 0.5, rnd(key + k + 1) - 0.7, rnd(key + k + 2) - 0.5).normalize().multiplyScalar(pts[0].distanceTo(pts[pts.length - 1]) * (0.18 + 0.2 * rnd(key + k + 3)));
      const bp = boltPts([p.x, p.y, p.z], [p.x + dir.x, p.y + dir.y, p.z + dir.z], key + k * 31, 4, 0.3);
      parts.push({ g: tube(bp, 0.007 * width), w: 0.6 });
      glow.push(tube(bp, 0.018 * width));
    }
    return { parts, glow, mid: pts[Math.floor(pts.length / 2)] };
  }, [key, grow, width, branches, JSON.stringify(a), JSON.stringify(b)]);
  return (
    <group>
      {geo.parts.map((p, i) => <mesh key={`c${i}`} geometry={p.g} material={coreMat} />)}
      {geo.glow.map((g, i) => <mesh key={`g${i}`} geometry={g} material={i === 1 ? G2 : G1} />)}
      {light > 0 && <pointLight position={geo.mid} color={color ?? "#9CC8FF"} intensity={light} distance={14} decay={1.4} />}
    </group>
  );
};

/** Lightning crawling over a body: short arcs between points on an ellipsoid around `c` (the chest), re-seeded every frame or two. */
export const BodyArcs: React.FC<{ c: V3; t: number; n?: number; amt?: number; seed?: number; color?: string }> = ({ c, t, n = 5, amt = 1, seed = 3, color }) => {
  if (amt <= 0.01) return null;
  const f = Math.floor(t / 0.05);
  const pt = (s: number): V3 => {
    const th = rnd(s) * Math.PI * 2, y = (rnd(s + 1) - 0.35) * 1.3;
    return [c[0] + Math.cos(th) * 0.3, c[1] + y, c[2] + Math.sin(th) * 0.24];
  };
  return (
    <group>
      {Array.from({ length: n }, (_, k) => {
        if (rnd(f * 13 + k + seed) > 0.55 + 0.45 * amt) return null;
        const s = f * 97 + k * 13 + seed * 7;
        return <Bolt key={k} a={pt(s)} b={pt(s + 50)} t={t} seed={s} width={0.55 * amt} branches={1} rate={0.05} color={color} />;
      })}
      <pointLight position={[c[0], c[1] + 0.2, c[2] + 0.4]} color={color ?? "#8EC5FF"} intensity={3 * amt * (0.6 + 0.4 * rnd(f))} distance={4} decay={1.5} />
    </group>
  );
};

// ─── rain ────────────────────────────────────────────────────────────────────
/** Rain in a box around `center`. rt = rain clock (stop advancing it to freeze the drops); motion 1 = falling streaks, 0 = frozen beads. */
export const Rain: React.FC<{ center: V3; rt: number; motion: number; n?: number; size?: V3; glint?: number }> = ({ center, rt, motion, n = 2200, size = [16, 9, 12], glint = 0 }) => {
  const mesh = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 12, 8);
    const m = new THREE.MeshBasicMaterial({ color: "#CFE6FF", transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false });
    const im = new THREE.InstancedMesh(g, m, n); im.frustumCulled = false; return im;
  }, [n]);
  const o = new THREE.Object3D();
  const len = 0.011 + 0.26 * motion;
  for (let i = 0; i < n; i++) {
    const x = center[0] + (rnd(i) - 0.5) * size[0];
    const z = center[2] + (rnd(i + 5000) - 0.5) * size[2];
    const y = ((rnd(i + 9000) * size[1] - rt * (7 + 3 * rnd(i + 3000))) % size[1] + size[1]) % size[1];
    o.position.set(x + rt * 0.6, y, z);
    o.scale.set(0.007 + 0.0015 * (1 - motion), len, 0.007 + 0.0015 * (1 - motion));
    o.updateMatrix(); mesh.setMatrixAt(i, o.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  (mesh.material as THREE.MeshBasicMaterial).opacity = 0.42 + 0.35 * (1 - motion) + 0.2 * glint;
  return <primitive object={mesh} />;
};

// ─── speed streaks ───────────────────────────────────────────────────────────
/** Streaks of light flying past along −x (the runner moves +x). amt 0..1 sets density, length and brightness. */
export const Streaks: React.FC<{ center: V3; t: number; amt: number; n?: number; color?: string; dir?: 1 | -1 }> = ({ center, t, amt, n = 260, color = "#BFE6F0", dir = 1 }) => {
  const mesh = useMemo(() => {
    const g = new THREE.BoxGeometry(1, 1, 1);
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const im = new THREE.InstancedMesh(g, m, n); im.frustumCulled = false; return im;
  }, [n, color]);
  const o = new THREE.Object3D();
  const L = 40;
  for (let i = 0; i < n; i++) {
    const on = rnd(i + 77) < amt;
    const sp = 30 + 50 * rnd(i + 11);
    const x = center[0] + dir * ((((rnd(i) * L - t * sp) % L) + L) % L - L / 2);
    const r = 0.6 + rnd(i + 1) * 3.2, a = rnd(i + 2) * Math.PI * 2;
    o.position.set(x, center[1] + Math.sin(a) * r * 0.8, center[2] + Math.cos(a) * r);
    o.scale.set(on ? 0.5 + 4 * amt * rnd(i + 3) : 0.0001, 0.006 + 0.01 * rnd(i + 4), 0.006);
    o.updateMatrix(); mesh.setMatrixAt(i, o.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  (mesh.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.6 * amt;
  return <primitive object={mesh} />;
};

// ─── time tunnel ─────────────────────────────────────────────────────────────
const tunnelTex = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas"); c.width = 512; c.height = 1024;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000"; g.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 260; i++) {
    const x = rnd(i) * 512, y = rnd(i + 400) * 1024, h = 40 + rnd(i + 800) * 300;
    const col = rnd(i + 1200) < 0.7 ? `rgba(140,200,255,${0.3 + 0.6 * rnd(i + 3)})` : `rgba(255,200,120,${0.3 + 0.6 * rnd(i + 5)})`;
    const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.5, col); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(x, y, 1 + rnd(i + 9) * 3, h);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2); return t;
})();
/** A tube of light streaks around the x axis at `center`; the camera sits inside. speed scrolls the streaks. */
export const Tunnel: React.FC<{ center: V3; t: number; speed?: number; opacity?: number }> = ({ center, t, speed = 3, opacity = 1 }) => {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tunnelTex!, side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }), []);
  tunnelTex!.offset.y = -t * speed * 0.25; mat.opacity = opacity;
  return (
    <group position={center} rotation={[0, 0, Math.PI / 2]}>
      <mesh material={mat}><cylinderGeometry args={[3.2, 3.2, 120, 48, 1, true]} /></mesh>
      <mesh position={[0, -60, 0]}><sphereGeometry args={[2.2, 16, 12]} /><meshBasicMaterial color="#DDEEFF" toneMapped={false} fog={false} /></mesh>
    </group>
  );
};

// ─── cracks in the sky ───────────────────────────────────────────────────────
/** n jagged cracks of light high in the sky, each growing in over 0.4 s, staggered by `stagger`. */
/** Scars in the sky, drawn like cracked glass: thin jagged rays from an impact point plus broken rings between them.
 *  Thin bright core with a tight glow (the user rejected fat bolts). grow 0..1 per crack over 0.25 s, staggered. */
const GLASS_GLOW = glowMat("#9CCBFF", 0.7);
const GlassCrack: React.FC<{ c: V3; L: number; seed: number; g: number }> = ({ c, L, seed, g }) => {
  const geo = useMemo(() => {
    const core: THREE.BufferGeometry[] = [], glow: THREE.BufferGeometry[] = [];
    const rc = L * 0.0032, rg = L * 0.009;
    const m = 5 + Math.floor(rnd(seed) * 4);
    const rays: THREE.Vector3[][] = [];
    for (let i = 0; i < m; i++) {
      const an = (i / m) * Math.PI * 2 + (rnd(seed + i * 3) - 0.5) * 0.7, len = L * (0.45 + 0.55 * rnd(seed + i * 5)) * g;
      const end: V3 = [c[0] + Math.cos(an) * len, c[1] + Math.sin(an) * len * 0.75, c[2]];
      const pts = boltPts(c, end, seed * 31 + i, 5, 0.1);
      rays.push(pts); core.push(tube(pts, rc)); glow.push(tube(pts, rg));
      if (rnd(seed + i * 7) > 0.45) { // a side branch
        const p = pts[Math.floor(pts.length * (0.35 + 0.4 * rnd(seed + i * 11)))], a2 = an + (rnd(seed + i * 13) > 0.5 ? 0.6 : -0.6), l2 = len * 0.35;
        const bp = boltPts([p.x, p.y, p.z], [p.x + Math.cos(a2) * l2, p.y + Math.sin(a2) * l2 * 0.75, p.z], seed * 7 + i, 3, 0.15);
        core.push(tube(bp, rc * 0.7)); glow.push(tube(bp, rg * 0.7));
      }
    }
    for (const f of [0.28, 0.55]) { // broken rings, like a stone hit on glass
      for (let i = 0; i < m; i++) {
        if (rnd(seed + i * 17 + f * 100) < 0.35) continue;
        const A = rays[i], B = rays[(i + 1) % m];
        const pa = A[Math.min(A.length - 1, Math.floor(A.length * f))], pb = B[Math.min(B.length - 1, Math.floor(B.length * f))];
        if (!pa || !pb) continue;
        const rp = boltPts([pa.x, pa.y, pa.z], [pb.x, pb.y, pb.z], seed * 13 + i, 3, 0.12);
        core.push(tube(rp, rc * 0.6)); glow.push(tube(rp, rg * 0.6));
      }
    }
    return { core: mergeGeometries(core), glow: mergeGeometries(glow) };
  }, [seed, L, Math.round(g * 20), JSON.stringify(c)]);
  return (
    <group>
      <mesh geometry={geo.core} material={coreMat} />
      <mesh geometry={geo.glow} material={GLASS_GLOW} />
      {g < 1 && <mesh position={c}><sphereGeometry args={[L * 0.03 * (1 - g), 10, 8]} /><meshBasicMaterial color="#FFFFFF" toneMapped={false} /></mesh>}
    </group>
  );
};

export const SkyCracks: React.FC<{ t: number; n: number; stagger?: number; center?: V3; spread?: number }> = ({ t, n, stagger = 0.04, center = [0, 26, -45], spread = 70 }) => (
  <group>
    {Array.from({ length: n }, (_, k) => {
      const g = Math.min(1, Math.max(0, (t - k * stagger) / 0.25));
      if (g <= 0) return null;
      const x = center[0] + (rnd(k + 1) - 0.5) * spread * (k ? 1 : 0), y = center[1] + (rnd(k + 2) - 0.5) * Math.min(18, spread * 0.3) * (k ? 1 : 0), z = center[2] - rnd(k + 3) * Math.min(20, spread * 0.3) * (k ? 1 : 0);
      const L = Math.min(10 + rnd(k + 4) * 18, Math.max(2, spread * 0.4));
      return <GlassCrack key={k} c={[x, y, z]} L={L} seed={500 + k} g={g} />;
    })}
  </group>
);

// ─── clock face (rewinding clocks motif) ─────────────────────────────────────
export const ClockFace: React.FC<{ pos: V3; r?: number; t: number; rate?: number; rotY?: number }> = ({ pos, r = 0.8, t, rate = -6, rotY = 0 }) => (
  <group position={pos} rotation={[0, rotY, 0]}>
    <mesh><circleGeometry args={[r, 48]} /><meshBasicMaterial color="#F6E7C8" transparent opacity={0.9} toneMapped={false} /></mesh>
    <mesh position={[0, 0, -0.01]}><ringGeometry args={[r, r * 1.08, 48]} /><meshBasicMaterial color="#F2B84B" toneMapped={false} /></mesh>
    {Array.from({ length: 12 }, (_, k) => (
      <mesh key={k} position={[Math.sin((k / 12) * Math.PI * 2) * r * 0.85, Math.cos((k / 12) * Math.PI * 2) * r * 0.85, 0.005]}><circleGeometry args={[r * 0.04, 10]} /><meshBasicMaterial color="#1B2A4E" /></mesh>
    ))}
    <group rotation={[0, 0, t * rate]}><mesh position={[0, r * 0.36, 0.01]}><planeGeometry args={[r * 0.05, r * 0.78]} /><meshBasicMaterial color="#0B1226" /></mesh></group>
    <group rotation={[0, 0, (t * rate) / 12]}><mesh position={[0, r * 0.22, 0.012]}><planeGeometry args={[r * 0.08, r * 0.5]} /><meshBasicMaterial color="#D9472B" /></mesh></group>
    <mesh position={[0, 0, 0.014]}><circleGeometry args={[r * 0.06, 16]} /><meshBasicMaterial color="#0B1226" /></mesh>
  </group>
);

// ─── the city rewriting itself: a shockwave rolls out from `o`; each building surges to a new height as the front passes ──
/** Rewrite hook for World3D/Plaza: buildings rise (or sink) with an overshoot as the wave front reaches them, windows flash on the front. */
export const waveRewrite = (t: number, t0: number, o: [number, number], speed = 38, seed = 1) => (i: number, x = 0, z = 0) => {
  const d = Math.hypot(x - o[0], z - o[1]), r = (t - t0) * speed, p = Math.min(1, Math.max(0, (r - d) / 9));
  const target = 0.55 + 1.6 * rnd(i * 13 + seed);
  const over = p < 1 ? Math.sin(p * Math.PI) * 0.18 : 0; // overshoot, then settle
  return { k: 1 + (target - 1) * (1 - Math.pow(1 - p, 3)) + over * Math.sign(target - 1), flash: p > 0 && p < 1 ? 1 - p : 0 };
};

/** Ground shockwave: an expanding bright ring plus a dust ring behind it. */
export const ShockRing: React.FC<{ t: number; t0: number; o: V3; speed?: number; maxR?: number }> = ({ t, t0, o, speed = 38, maxR = 140 }) => {
  const r = (t - t0) * speed;
  if (r <= 0 || r > maxR) return null;
  const fade = 1 - r / maxR;
  return (
    <group position={o}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}><ringGeometry args={[Math.max(0.01, r - 0.6), r, 96]} /><meshBasicMaterial color="#BFE6FF" transparent opacity={0.9 * fade} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}><ringGeometry args={[Math.max(0.01, r - 7), Math.max(0.02, r - 0.6), 96]} /><meshBasicMaterial color="#8EC5FF" transparent opacity={0.25 * fade} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} /></mesh>
      {Array.from({ length: 48 }, (_, k) => { const a = (k / 48) * Math.PI * 2 + rnd(k) * 0.1, rr = r - 2 - rnd(k + 3) * 4, h = 0.6 + rnd(k + 5) * 2.2 * fade;
        return <mesh key={k} position={[Math.cos(a) * rr, h * 0.5, Math.sin(a) * rr]}><sphereGeometry args={[0.8 + rnd(k + 7) * 1.4, 8, 6]} /><meshBasicMaterial color="#9AA6C0" transparent opacity={0.22 * fade} depthWrite={false} /></mesh>; })}
    </group>
  );
};

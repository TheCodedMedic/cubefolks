// Short 3 cast and props: Percy (1940s shirt, rolled sleeves, tie, pencil behind his ear), the lab coworkers (one gets
// the egg), factory workers, a 1950s family and a modern kid; the humming radar tube (magnetron), the chocolate bar in the
// pocket, popcorn, the egg, the giant first oven, the piano and balance, price tag, the modern microwave and the cartoon
// water molecule. Everything faces +z, feet on y = 0.
import React, { useMemo } from "react";
import * as THREE from "three";
import { drawFace, Expr, EXPR, FacePatch, PHI_SPAN, PX, THETA0, THETA_SPAN } from "../bean/Face";
import { Bean3D as SharedBean, Look as SharedLook } from "../bean/Bean3D";
import { GIZMO } from "../gizmo/GizmoArt";
import { Bean3D, HEAD_SCALE, Look, Pose, R as BR } from "./Bean";

const D = Math.PI / 180;
type V3 = [number, number, number];
export const Mat: React.FC<{ c?: string; r?: number; m?: number; map?: THREE.Texture | null; side?: THREE.Side; e?: string; ei?: number; t?: boolean; o?: number }> = ({ c = "#fff", r = 0.72, m = 0, map, side, e, ei, t, o }) => (
  <meshStandardMaterial color={map ? "#ffffff" : c} map={map ?? null} roughness={r} metalness={m} side={side ?? THREE.FrontSide} emissive={e ?? "#000000"} emissiveIntensity={ei ?? 0} transparent={t || o !== undefined} opacity={o ?? 1} />
);
export const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const c01 = (x: number) => Math.max(0, Math.min(1, x));
const dirOn = (theta: number, d: number) => new THREE.Vector3(Math.sin(d) * Math.sin(theta), Math.cos(theta), Math.cos(d) * Math.sin(theta));

const TEXCACHE = new Map<string, THREE.Texture>();
export const memoTex = (k: string, w: number, h: number, f: (x: CanvasRenderingContext2D, w: number, h: number) => void) => {
  let t = TEXCACHE.get(k);
  if (!t) { const c = document.createElement("canvas"); c.width = w; c.height = h; f(c.getContext("2d")!, w, h); t = new THREE.CanvasTexture(c); (t as THREE.CanvasTexture).colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; TEXCACHE.set(k, t); }
  return t;
};
const F = (w: number, sz: number) => `${w} ${sz}px Montserrat, sans-serif`;
export const labelTex = (text: string, bg: string, fg: string, w = 512, h = 160, size = 84, border?: string) => memoTex("lbl" + text + bg + fg + w + h + size + border, w, h, (x) => {
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  if (border) { x.strokeStyle = border; x.lineWidth = 12; x.strokeRect(8, 8, w - 16, h - 16); }
  x.fillStyle = fg; x.font = F(900, size); x.textAlign = "center"; x.textBaseline = "middle";
  text.split("|").forEach((l, i, a) => x.fillText(l, w / 2, h / 2 + (i - (a.length - 1) / 2) * size * 1.05));
});

// ================= PEOPLE =================
export const LOOKS: Record<string, Look> = {
  percy: { name: "Percy", role: "the engineer", skin: 1, outfit: { kind: "shirt", base: "#cfe0ee", accent: "#a8323a", accent2: "#f2c84a" }, hair: { kind: "sidePart", color: "#6a4428" }, shoes: "#4a2e1e" },
  egg: { name: "the egg coworker", role: "lab coworker", skin: 4, outfit: { kind: "labcoat", base: "#f6f6f2", accent: "#4a7ab8" }, hair: { kind: "curly", color: "#1e1410" }, glasses: "#2d2d33", shoes: "#3a3a44" },
  runner: { name: "the runner", role: "lab assistant", skin: 6, outfit: { kind: "shirt", base: "#efe2c4", accent: "#2f5a8a", accent2: "#c8d8ec" }, hair: { kind: "short", color: "#1a120c" }, shoes: "#5a3a22" },
  tech: { name: "the technician", role: "lab coworker", skin: 2, outfit: { kind: "labcoat", base: "#f6f6f2", accent: "#c8763a" }, hair: { kind: "bob", color: "#8a4a22" }, shoes: "#7a3a3a" },
  boss: { name: "the boss", role: "factory boss", skin: 0, outfit: { kind: "suit", base: "#3a4250", accent: "#2f6a4a" }, hair: { kind: "sidePart", color: "#b8b0a4" }, glasses: "#2d2d33", moustache: true, shoes: "#1d1b1a" },
  worker1: { name: "worker", role: "factory worker", skin: 5, outfit: { kind: "uniform", base: "#3f5a7a", accent: "#e3b341" }, hair: { kind: "short", color: "#1e1410" }, shoes: "#2b2b2b" },
  worker2: { name: "worker", role: "factory worker", skin: 3, outfit: { kind: "uniform", base: "#5a6a4a", accent: "#e3b341" }, hair: { kind: "topBun", color: "#3a2416" }, shoes: "#2b2b2b" },
  dad: { name: "dad", role: "1950s dad", skin: 2, outfit: { kind: "suit", base: "#7a8aa0", accent: "#c8763a" }, hair: { kind: "sidePart", color: "#3a2416" }, shoes: "#3a2a1e" },
  mom: { name: "mom", role: "1950s mom", skin: 3, outfit: { kind: "dress", base: "#e88aa0", accent: "#fff3f0" }, hair: { kind: "buns", color: "#2a1a12" }, shoes: "#c8323c" },
  kid50: { name: "kid", role: "1950s kid", skin: 1, outfit: { kind: "stripes", base: "#fbe9d6", accent: "#3a8ad0" }, hair: { kind: "messy", color: "#c88a3a" }, shoes: "#c8323c" },
  kidNow: { name: "kid", role: "modern kid", skin: 7, outfit: { kind: "hoodie", base: "#f07a3a", accent: "#fbe9d6" }, hair: { kind: "curly", color: "#1f140e" }, shoes: "#f4f1ea" },
  teen: { name: "teen", role: "modern teen", skin: 4, outfit: { kind: "hoodie", base: "#5a8ae0", accent: "#fbe9d6" }, hair: { kind: "bob", color: "#2a1a12" }, shoes: "#f4f1ea" },
};

/** The pencil behind Percy's ear (head frame). */
export const Pencil: React.FC = () => (
  <group position={[-0.235, 0.06, -0.02]} rotation={[0.25, 0, 1.25]}>
    <mesh castShadow><cylinderGeometry args={[0.011, 0.011, 0.15, 6]} /><Mat c="#f2c230" r={0.5} /></mesh>
    <mesh position={[0, 0.082, 0]}><cylinderGeometry args={[0.011, 0.011, 0.016, 8]} /><Mat c="#c0c0c8" r={0.3} m={0.6} /></mesh>
    <mesh position={[0, 0.098, 0]}><cylinderGeometry args={[0.011, 0.011, 0.018, 8]} /><Mat c="#ef8aa0" r={0.6} /></mesh>
    <mesh position={[0, -0.09, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.011, 0.03, 6]} /><Mat c="#e8c8a0" r={0.8} /></mesh>
  </group>
);

/** Egg on the face (head frame): yolk splats on the front of the head, drips that grow with `drip` (0..1), shell bits. */
export const YolkFace: React.FC<{ drip: number; amt?: number }> = ({ drip, amt = 1 }) => {
  const R0 = BR * 1.0;
  const pts: [number, number, number][] = [[1.3, -0.35, 0.07], [1.55, 0.2, 0.06], [1.15, 0.45, 0.045], [1.75, -0.15, 0.05], [1.45, -0.7, 0.04], [0.95, -0.1, 0.05]];
  return (
    <group scale={HEAD_SCALE}>
      {pts.map(([th, ph, r], i) => {
        const p = dirOn(th, ph).multiplyScalar(R0 * 0.99);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirOn(th, ph));
        const L = (0.03 + 0.09 * rnd(i * 3)) * drip;
        return (
          <group key={i} position={p.toArray() as V3} quaternion={q} scale={amt}>
            <mesh scale={[1, 1, 0.3]}><sphereGeometry args={[r, 16, 10]} /><Mat c={i % 2 ? "#ffc21a" : "#fff6e0"} r={0.15} /></mesh>
            {i % 2 === 0 && <mesh position={[0, 0, r * 0.25]} scale={[0.55, 0.55, 0.3]}><sphereGeometry args={[r, 14, 10]} /><Mat c="#ffb000" r={0.1} /></mesh>}
            {L > 0.005 && <mesh position={[0, -L / 2 - r * 0.4, 0.004]}><capsuleGeometry args={[0.012, L, 4, 8]} /><Mat c="#ffc21a" r={0.15} /></mesh>}
          </group>
        );
      })}
      {[[1.1, 0.7], [1.9, 0.5], [1.0, -0.6]].map(([th, ph], i) => (
        <mesh key={"s" + i} position={dirOn(th, ph).multiplyScalar(R0 * 1.02).toArray() as V3} rotation={[i, i * 2, i]}><boxGeometry args={[0.05, 0.035, 0.006]} /><Mat c="#fbf4e4" r={0.6} /></mesh>
      ))}
    </group>
  );
};

export type Who = { look: Look; pose?: Pose; expr?: Expr; pos: V3; yaw?: number; hold?: React.ReactNode; holdL?: React.ReactNode; headExtra?: React.ReactNode; scale?: number; tilt?: [number, number]; extra?: React.ReactNode };
export const Person: React.FC<{ w: Who }> = ({ w }) => (
  <group position={w.pos} rotation={[0, w.yaw ?? 0, 0]} scale={w.scale ?? 1}>
    <Bean3D look={w.look} pose={w.pose} expr={w.expr} hold={w.hold} holdL={w.holdL} headExtra={w.look === LOOKS.percy ? <>{w.headExtra}<Pencil /></> : w.headExtra} tilt={w.tilt} />
    {w.extra}
  </group>
);
/** Gizmo, the channel mascot (shared rig, with goggles). */
export const Gizmo: React.FC<{ pos: V3; yaw?: number; pose?: Pose; expr?: Expr; scale?: number }> = ({ pos, yaw = 0, pose, expr, scale = 1 }) => (
  <SharedBean look={GIZMO as SharedLook} pose={pose as any} expr={expr} position={pos} yaw={yaw} scale={scale} />
);

// ================= THE CHOCOLATE BAR IN THE POCKET (Person's local frame) =================
export const POCKET: V3 = [0.08, 0.6, 0.132];
const barTex = () => memoTex("bar", 256, 128, (x, w, h) => {
  x.fillStyle = "#c8323c"; x.fillRect(0, 0, w, h); x.fillStyle = "#f2c84a"; x.fillRect(0, h * 0.38, w, h * 0.24);
  x.fillStyle = "#5a1a14"; x.font = F(900, 40); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("COCOA", w / 2, h / 2 + 2);
});
/** A chocolate bar standing in the shirt pocket; melt 0..1 bends the top over and runs drips down the shirt. */
export const PocketBar: React.FC<{ melt?: number; steam?: number; t?: number }> = ({ melt = 0, steam = 0, t = 0 }) => {
  const bend = melt * 115;
  return (
    <group position={POCKET} rotation={[-0.12, 0.5, 0]}>
      {/* wrapper (in the pocket) */}
      <mesh position={[0, 0.0, -0.012]} castShadow><boxGeometry args={[0.07, 0.07, 0.016]} /><Mat map={barTex()} r={0.5} /></mesh>
      {/* the chocolate sticking out, bending over as it melts */}
      <group position={[0, 0.035, -0.012]} rotation={[bend * D * 0.9, 0, melt * 0.2]}>
        <mesh position={[0, 0.03, 0]} scale={[1 + melt * 0.25, 1 - melt * 0.25, 1 + melt * 0.4]} castShadow><boxGeometry args={[0.064, 0.06, 0.014]} /><Mat c="#5a2e18" r={0.25 - melt * 0.15} /></mesh>
        {[-0.021, 0, 0.021].map((x) => <mesh key={x} position={[x, 0.03, 0.008]} scale={[1, 1 - melt, 1]}><boxGeometry args={[0.016, 0.022, 0.004]} /><Mat c="#6a3820" r={0.3} /></mesh>)}
      </group>
      {/* pocket front (shirt cloth) */}
      <mesh position={[0, -0.005, 0.0]} castShadow><boxGeometry args={[0.085, 0.07, 0.006]} /><Mat c="#c2d4e4" r={0.85} /></mesh>
      <mesh position={[0, 0.028, 0.004]}><boxGeometry args={[0.087, 0.014, 0.006]} /><Mat c="#b2c6d8" r={0.85} /></mesh>
      {/* goo running down the shirt and a brown stain */}
      {melt > 0.15 && <mesh position={[0, -0.04, -0.004]} scale={[1, 0.6 + melt, 0.3]}><sphereGeometry args={[0.045 * melt, 16, 10]} /><Mat c="#5a2e18" r={0.12} /></mesh>}
      {[-0.025, 0.0, 0.022].map((x, i) => {
        const L = Math.max(0, melt - 0.25 - i * 0.12) * (0.14 + i * 0.03);
        return L > 0.004 ? (
          <group key={i} position={[x, -0.035 - L / 2, 0.003]}>
            <mesh><capsuleGeometry args={[0.008, L, 4, 8]} /><Mat c="#5a2e18" r={0.12} /></mesh>
            <mesh position={[0, -L / 2 - 0.004, 0]}><sphereGeometry args={[0.012, 10, 8]} /><Mat c="#5a2e18" r={0.12} /></mesh>
          </group>
        ) : null;
      })}
      {steam > 0.01 && [0, 1, 2].map((i) => {
        const u = ((t * 0.8 + i / 3) % 1);
        return <mesh key={"st" + i} position={[(i - 1) * 0.025 + Math.sin(t * 3 + i) * 0.01, 0.08 + u * 0.18, 0.01]} scale={[1, 2.4, 1]}><sphereGeometry args={[0.012 + u * 0.012, 8, 6]} /><Mat c="#ffffff" o={steam * 0.55 * (1 - u)} r={1} /></mesh>;
      })}
    </group>
  );
};
/** A droopy melted bar held in the hand (hand frame). */
export const HeldGoo: React.FC<{ melt?: number }> = ({ melt = 1 }) => (
  <group position={[0, -0.05, 0.04]} rotation={[-1.2, 0, 0]}>
    <mesh castShadow><boxGeometry args={[0.07, 0.06, 0.018]} /><Mat map={barTex()} r={0.5} /></mesh>
    <group position={[0, 0.03, 0]} rotation={[melt * 1.6, 0, 0]}>
      <mesh position={[0, 0.04, 0]} scale={[1.15, 1, 1.3]}><boxGeometry args={[0.066, 0.08, 0.014]} /><Mat c="#5a2e18" r={0.12} /></mesh>
      <mesh position={[0, 0.085, 0]}><capsuleGeometry args={[0.012, 0.04 * melt, 4, 8]} /><Mat c="#5a2e18" r={0.12} /></mesh>
    </group>
  </group>
);

// ================= THE MAGNETRON (radar tube) =================
/** The humming radar tube on its stand: a copper block with cooling fins, glowing coils, two red magnets, a horn. */
export const Magnetron: React.FC<{ p?: V3; t?: number; s?: number; glow?: number; yaw?: number; army?: boolean }> = ({ p = [0, 0, 0], t = 0, s = 1, glow = 1, yaw = 0, army }) => {
  const pulse = 0.75 + 0.25 * Math.sin(t * 40) * Math.sin(t * 7.3);
  const jit = 0.0025 * glow * Math.sin(t * 90);
  const copper = army ? "#5a6a3a" : "#c8763a";
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      <group position={[jit, 0, 0]}>
        {/* base plate */}
        <mesh position={[0, 0.015, 0]} castShadow receiveShadow><boxGeometry args={[0.42, 0.03, 0.32]} /><Mat c="#3a3d44" r={0.5} m={0.4} /></mesh>
        {/* copper body with fins */}
        <mesh position={[0, 0.17, 0]} castShadow><boxGeometry args={[0.2, 0.26, 0.2]} /><Mat c={copper} r={0.32} m={0.65} /></mesh>
        {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[0, 0.06 + i * 0.035, 0]} castShadow><boxGeometry args={[0.27, 0.008, 0.27]} /><Mat c={army ? "#6a7a4a" : "#d8925a"} r={0.3} m={0.7} /></mesh>)}
        {/* red magnets either side */}
        {[-1, 1].map((k) => (
          <group key={k} position={[k * 0.17, 0.17, 0]}>
            <mesh castShadow><boxGeometry args={[0.06, 0.2, 0.16]} /><Mat c="#c8323c" r={0.4} m={0.2} /></mesh>
            <mesh position={[k * 0.0, 0.0, 0.081]}><planeGeometry args={[0.03, 0.12]} /><Mat c="#f2f2f2" r={0.5} /></mesh>
          </group>
        ))}
        {/* glowing coil ring on the front and the output horn */}
        <group position={[0, 0.17, 0.105]}>
          <mesh><torusGeometry args={[0.06, 0.016, 10, 28]} /><Mat c="#ffb060" e="#ff7a1a" ei={(1.6 + 1.6 * pulse) * glow} r={0.3} /></mesh>
          <mesh><circleGeometry args={[0.046, 24]} /><Mat c="#ffe2a0" e="#ffb040" ei={(1.2 + 1.5 * pulse) * glow} r={0.3} /></mesh>
        </group>
        <mesh position={[0, 0.355, 0]} castShadow><cylinderGeometry args={[0.025, 0.025, 0.07, 12]} /><Mat c="#9aa0a8" r={0.3} m={0.7} /></mesh>
        <mesh position={[0, 0.41, 0]} castShadow><coneGeometry args={[0.07, 0.07, 16, 1, true]} /><Mat c="#9aa0a8" r={0.3} m={0.7} side={THREE.DoubleSide} /></mesh>
        {/* coils of cable round the back */}
        {[0, 1, 2].map((i) => <mesh key={"c" + i} position={[0, 0.1 + i * 0.05, -0.12]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.08, 0.008, 6, 20]} /><Mat c="#2b2b2b" r={0.6} /></mesh>)}
        {glow > 0.05 && <pointLight position={[0, 0.17, 0.22]} intensity={1.3 * glow * pulse} distance={1.6} decay={1.5} color="#ff9a40" />}
      </group>
    </group>
  );
};

// ================= POPCORN =================
const KERN = "#f2b630";
export const Kernel: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => (
  <mesh position={p} scale={[s, s * 0.8, s * 0.9]} castShadow><sphereGeometry args={[0.014, 8, 6]} /><Mat c={KERN} r={0.3} /></mesh>
);
export const Popped: React.FC<{ p: V3; s?: number; r?: number }> = ({ p, s = 1, r = 0 }) => (
  <group position={p} rotation={[r, r * 2, r * 3]} scale={s}>
    {[[0, 0, 0, 0.026], [0.018, 0.01, 0.006, 0.02], [-0.016, 0.012, -0.004, 0.019], [0.004, -0.015, 0.012, 0.018], [-0.006, 0.02, 0.014, 0.016]].map(([x, y, z, r2], i) => (
      <mesh key={i} position={[x, y, z]} castShadow><sphereGeometry args={[r2, 10, 8]} /><Mat c={i === 3 ? "#f6e2a0" : "#fffbee"} r={0.85} /></mesh>
    ))}
    <mesh position={[0, -0.006, -0.018]}><sphereGeometry args={[0.009, 8, 6]} /><Mat c={KERN} r={0.4} /></mesh>
  </group>
);
/** n kernels in a heap at o; from t0 each pops (one every `every` s) and flies off with gravity, bouncing to rest on y = floor. */
export const PopBurst: React.FC<{ t: number; t0: number; o: V3; n?: number; seed?: number; every?: number; floor?: number; spread?: number; up?: number; s?: number }> = ({ t, t0, o, n = 40, seed = 1, every = 0.012, floor = 0, spread = 1.6, up = 2.6, s = 1.4 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = rnd(i * 3 + seed) * Math.PI * 2, r = rnd(i * 7 + seed), h = rnd(i * 11 + seed);
      const base: V3 = [o[0] + Math.cos(a) * 0.05 * r, o[1] + 0.012 + h * 0.015, o[2] + Math.sin(a) * 0.05 * r];
      const tp = t0 + i * every * (0.6 + rnd(i * 13 + seed) * 0.8), dt = t - tp;
      if (dt < 0) {
        const sh = Math.max(0, 1 - (tp - t) / 0.8) * 0.004;
        return <Kernel key={i} p={[base[0] + Math.sin(t * 70 + i) * sh, base[1] + Math.abs(Math.sin(t * 55 + i)) * sh, base[2]]} />;
      }
      const v: V3 = [Math.cos(a) * spread * (0.4 + r), up * (0.6 + h * 0.7), Math.sin(a) * spread * (0.4 + r) + 0.5];
      let x = base[0] + v[0] * dt, z = base[2] + v[2] * dt, y = base[1] + v[1] * dt - 4.9 * dt * dt;
      const tl = Math.min(dt, 1.2);
      if (y < floor + 0.02) { y = floor + 0.02; const tLand = (v[1] + Math.sqrt(v[1] * v[1] + 19.6 * (base[1] - floor))) / 9.8; x = base[0] + v[0] * Math.min(dt, tLand); z = base[2] + v[2] * Math.min(dt, tLand); }
      const grow = Math.min(1, dt / 0.06);
      return <Popped key={i} p={[x, y, z]} s={s * (0.4 + 0.6 * grow)} r={i + tl * 6} />;
    })}
  </>
);
export const PopcornBag: React.FC<{ s?: number; open?: boolean }> = ({ s = 1, open = true }) => (
  <group position={[0, -0.12, 0.05]} scale={s}>
    <mesh castShadow><boxGeometry args={[0.12, 0.16, 0.08]} /><Mat map={labelTex("POP|CORN", "#f6ecd2", "#c8323c", 256, 320, 84, "#c8323c")} r={0.9} /></mesh>
    {open && Array.from({ length: 8 }, (_, i) => <Kernel key={i} p={[(rnd(i) - 0.5) * 0.09, 0.085, (rnd(i * 3) - 0.5) * 0.06]} s={1.1} />)}
  </group>
);

// ================= THE EGG =================
/** An egg in a little stand: wob (0..1) rocks it, shake (0..1) rattles it, boom > 0: it has exploded (time since, s). */
export const Egg: React.FC<{ p: V3; t: number; wob?: number; shake?: number; boom?: number; dir?: V3; s?: number }> = ({ p, t, wob = 0, shake = 0, boom = -1, dir = [1, 0.4, 0.3], s = 1 }) => {
  if (boom >= 0) {
    const g = (k: number): V3 => {
      const a = rnd(k * 5) - 0.5, b = rnd(k * 9), c = rnd(k * 13) - 0.5, sp = 1.4 + rnd(k * 17) * 1.8;
      const v: V3 = [dir[0] * sp + a * 1.2, dir[1] * sp + b * 1.4, dir[2] * sp + c * 1.2];
      return [v[0] * boom, Math.max(-p[1], v[1] * boom - 4.9 * boom * boom), v[2] * boom];
    };
    return (
      <group position={p} scale={s}>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.035, 0.03, 0.04, 16, 1, true]} /><Mat c="#e8e0d0" r={0.5} side={THREE.DoubleSide} /></mesh>
        {Array.from({ length: 16 }, (_, k) => {
          const q = g(k), shell = k % 3 === 0;
          return <mesh key={k} position={[q[0], 0.07 + q[1], q[2]]} rotation={[k, k * 2, boom * 10 + k]} scale={shell ? [1, 0.6, 0.2] : [1, 0.8, 1]}><sphereGeometry args={[shell ? 0.022 : 0.016 + rnd(k) * 0.016, 10, 8]} /><Mat c={shell ? "#fbf4e4" : k % 2 ? "#ffc21a" : "#fff6e0"} r={0.2} /></mesh>;
        })}
        {boom < 0.25 && <mesh position={[0, 0.08, 0]} scale={1 + boom * 14}><sphereGeometry args={[0.06, 16, 12]} /><Mat c="#ffe6a0" o={0.7 * (1 - boom / 0.25)} e="#ffd060" ei={1} /></mesh>}
      </group>
    );
  }
  const rock = Math.sin(t * 9) * 14 * wob + Math.sin(t * 61) * 5 * shake;
  const hop = Math.abs(Math.sin(t * 47)) * 0.008 * shake;
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.02, 0]} castShadow><cylinderGeometry args={[0.035, 0.03, 0.04, 16]} /><Mat c="#e8e0d0" r={0.5} /></mesh>
      <group position={[0, 0.03 + hop, 0]} rotation={[0, 0, rock * D]}>
        <mesh position={[0, 0.045, 0]} scale={[0.82, 1.08, 0.82] as V3} castShadow><sphereGeometry args={[0.05, 24, 18]} /><Mat c="#f8eedc" r={0.45} /></mesh>
        {shake > 0.3 && [[0.02, 0.07], [-0.015, 0.05]].map(([x, y], i) => <mesh key={i} position={[x, y, 0.04]} rotation={[0, 0, i ? 0.8 : -0.6]}><boxGeometry args={[0.025, 0.003, 0.003]} /><Mat c="#6a5a4a" /></mesh>)}
      </group>
    </group>
  );
};

// ================= MISC PROPS =================
/** A wall thermometer; level 0..1 (red column). */
export const Thermo: React.FC<{ p: V3; level?: number; r?: V3; s?: number; cool?: boolean }> = ({ p, level = 0.4, r = [0, 0, 0], s = 1, cool }) => (
  <group position={p} rotation={r} scale={s}>
    <mesh castShadow><boxGeometry args={[0.16, 0.6, 0.02]} /><Mat c="#f4ead0" r={0.6} /></mesh>
    <mesh position={[0, 0.02, 0.012]}><cylinderGeometry args={[0.018, 0.018, 0.48, 12]} /><Mat c="#ffffff" r={0.1} o={0.7} /></mesh>
    <mesh position={[0, -0.22 + level * 0.24, 0.015]}><cylinderGeometry args={[0.009, 0.009, Math.max(0.01, level * 0.48), 10]} /><Mat c={cool ? "#3a8ad0" : "#d8323c"} e={cool ? "#1a4a90" : "#a01010"} ei={0.4} /></mesh>
    <mesh position={[0, -0.24, 0.015]}><sphereGeometry args={[0.03, 14, 10]} /><Mat c={cool ? "#3a8ad0" : "#d8323c"} e={cool ? "#1a4a90" : "#a01010"} ei={0.4} /></mesh>
    {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[0.045, -0.2 + i * 0.05, 0.012]}><boxGeometry args={[0.03, 0.006, 0.002]} /><Mat c="#3a3a40" /></mesh>)}
  </group>
);
export const Screwdriver: React.FC = () => (
  <group position={[0, -0.05, 0.03]} rotation={[-1.3, 0, 0]}>
    <mesh position={[0, 0.03, 0]} castShadow><cylinderGeometry args={[0.014, 0.012, 0.07, 10]} /><Mat c="#d8a020" r={0.4} /></mesh>
    <mesh position={[0, -0.04, 0]} castShadow><cylinderGeometry args={[0.004, 0.004, 0.08, 6]} /><Mat c="#c0c4cc" r={0.25} m={0.8} /></mesh>
  </group>
);
/** A newspaper held open with a headline. */
export const Newspaper: React.FC<{ head?: string }> = ({ head = "WAR|ENDS!" }) => (
  <group position={[0, -0.05, 0.13]} rotation={[-Math.PI / 2 + 0.2, 0, 0]}>
    <mesh castShadow><boxGeometry args={[0.36, 0.44, 0.004]} /><Mat c="#ece6d8" r={0.9} /></mesh>
    <mesh position={[0, 0, 0.003]}><planeGeometry args={[0.36, 0.44]} /><Mat map={memoTex("news" + head, 360, 440, (x, w, h) => {
      x.fillStyle = "#f2ecde"; x.fillRect(0, 0, w, h); x.fillStyle = "#2b2b33"; x.font = F(900, 22); x.textAlign = "center"; x.fillText("THE DAILY STAR", w / 2, 30);
      x.fillRect(16, 40, w - 32, 4); x.font = F(900, 92); head.split("|").forEach((l, i) => x.fillText(l, w / 2, 130 + i * 92));
      x.fillStyle = "#8a8a90"; for (let i = 0; i < 9; i++) x.fillRect(20 + (i % 2) * 170, 250 + Math.floor(i / 2) * 36, 150, 12);
    })} r={0.9} /></mesh>
  </group>
);
/** A small radar tube for the factory rows (low detail). */
export const MiniTube: React.FC<{ p: V3; glow?: number }> = ({ p, glow = 0 }) => (
  <group position={p}>
    <mesh position={[0, 0.09, 0]} castShadow><boxGeometry args={[0.16, 0.18, 0.16]} /><Mat c="#c8763a" r={0.32} m={0.6} /></mesh>
    {[-1, 1].map((k) => <mesh key={k} position={[k * 0.1, 0.09, 0]}><boxGeometry args={[0.04, 0.14, 0.12]} /><Mat c="#c8323c" r={0.4} /></mesh>)}
    <mesh position={[0, 0.09, 0.081]}><circleGeometry args={[0.04, 16]} /><Mat c="#ffd090" e="#ff8a2a" ei={0.3 + glow} /></mesh>
  </group>
);
export const HeldTube: React.FC = () => <group position={[0, -0.12, 0.08]} rotation={[-Math.PI / 2, 0, 0]}><group rotation={[Math.PI / 2, 0, 0]}><MiniTube p={[0, -0.09, 0]} /></group></group>;

/** The radar dish on a tower, turning. */
export const RadarDish: React.FC<{ p: V3; t: number; s?: number }> = ({ p, t, s = 1 }) => (
  <group position={p} scale={s}>
    {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], i) => <mesh key={i} position={[x * 0.6, 1.2, z * 0.6]} rotation={[z * 0.25, 0, -x * 0.25]} castShadow><cylinderGeometry args={[0.04, 0.05, 2.4, 8]} /><Mat c="#7a8090" r={0.5} m={0.5} /></mesh>)}
    <mesh position={[0, 2.45, 0]} castShadow><boxGeometry args={[0.7, 0.15, 0.7]} /><Mat c="#5a6070" r={0.5} m={0.4} /></mesh>
    <group position={[0, 2.6, 0]} rotation={[0, t * 1.4, 0]}>
      <mesh position={[0, 0.25, 0]} castShadow><cylinderGeometry args={[0.07, 0.09, 0.5, 10]} /><Mat c="#8a909c" r={0.4} m={0.6} /></mesh>
      <group position={[0, 0.8, 0.15]} rotation={[-1.2, 0, 0]}>
        <mesh castShadow><sphereGeometry args={[1.0, 32, 12, 0, Math.PI * 2, 0, 0.75]} /><Mat c="#d8dce4" r={0.35} m={0.5} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.02, 0.02, 0.5, 6]} /><Mat c="#5a6070" /></mesh>
        <mesh position={[0, 0.82, 0]}><sphereGeometry args={[0.06, 10, 8]} /><Mat c="#c8323c" e="#ff3030" ei={0.5 + 0.5 * Math.sin(t * 6)} /></mesh>
      </group>
    </group>
  </group>
);

// ================= THE FIRST OVEN, THE PIANO, THE BALANCE =================
/** The giant first microwave oven: a cream steel cabinet about 1.75 tall (taller than a bean), a little oven door up top. */
export const BigOven: React.FC<{ p?: V3; s?: number; yaw?: number; door?: number; glow?: number; tag?: number; t?: number }> = ({ p = [0, 0, 0], s = 1, yaw = 0, door = 0, glow = 0, tag = 0, t = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]} scale={s}>
    <mesh position={[0, 0.9, 0]} castShadow receiveShadow><boxGeometry args={[0.78, 1.72, 0.66]} /><Mat c="#e8e4d8" r={0.35} m={0.25} /></mesh>
    <mesh position={[0, 0.04, 0]}><boxGeometry args={[0.82, 0.08, 0.7]} /><Mat c="#3a3d44" r={0.4} m={0.4} /></mesh>
    <mesh position={[0, 1.78, 0]}><boxGeometry args={[0.82, 0.08, 0.7]} /><Mat c="#3a3d44" r={0.4} m={0.4} /></mesh>
    {/* oven cavity + door (hinged left) */}
    <mesh position={[0, 1.32, 0.331]}><planeGeometry args={[0.6, 0.38]} /><Mat c={glow > 0 ? "#ffd890" : "#2a2a30"} e="#ffb040" ei={glow * 1.4} /></mesh>
    <group position={[-0.31, 1.32, 0.34]} rotation={[0, -door * 1.9, 0]}>
      <mesh position={[0.31, 0, 0.01]} castShadow><boxGeometry args={[0.64, 0.44, 0.03]} /><Mat c="#cfc9b8" r={0.3} m={0.3} /></mesh>
      <mesh position={[0.31, 0, 0.027]}><planeGeometry args={[0.44, 0.26]} /><Mat c="#4a5a6a" r={0.1} o={0.85} e="#ffb040" ei={glow * 0.5} /></mesh>
      <mesh position={[0.58, 0, 0.05]} castShadow><boxGeometry args={[0.03, 0.26, 0.03]} /><Mat c="#9aa0a8" r={0.2} m={0.8} /></mesh>
    </group>
    {/* control panel: dials and a label */}
    <mesh position={[0, 0.88, 0.332]}><planeGeometry args={[0.6, 0.3]} /><Mat map={labelTex("RADAR|OVEN", "#3a3d44", "#f2c84a", 384, 192, 64)} r={0.5} /></mesh>
    {[-0.2, 0, 0.2].map((x, i) => (
      <group key={x} position={[x, 0.6, 0.34]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.05, 0.05, 0.02, 20]} /><Mat c="#2b2b2b" r={0.4} /></mesh>
        <mesh position={[0, 0.02, 0.012]} rotation={[0, 0, t * (i - 1) * 2]}><boxGeometry args={[0.012, 0.05, 0.01]} /><Mat c="#f2c84a" /></mesh>
      </group>
    ))}
    {/* vents */}
    {Array.from({ length: 6 }, (_, i) => <mesh key={i} position={[0, 0.2 + i * 0.045, 0.332]}><planeGeometry args={[0.5, 0.015]} /><Mat c="#9a968a" /></mesh>)}
    {tag > 0.01 && (
      <group position={[0.36, 1.55, 0.36]} rotation={[0, 0, Math.sin(t * 3) * 0.12]} scale={tag}>
        <mesh position={[0, -0.07, 0]}><cylinderGeometry args={[0.003, 0.003, 0.14, 4]} /><Mat c="#2b2b2b" /></mesh>
        <mesh position={[0, -0.24, 0]} rotation={[0, 0, 0.12]} castShadow><boxGeometry args={[0.34, 0.2, 0.01]} /><Mat c="#fbf4dc" /></mesh>
        <mesh position={[0, -0.24, 0.006]} rotation={[0, 0, 0.12]}><planeGeometry args={[0.32, 0.18]} /><Mat map={labelTex("$5,000", "#fbf4dc", "#2a7a3a", 384, 216, 110)} /></mesh>
      </group>
    )}
  </group>
);
/** An upright piano (about 1.3 wide). */
export const Piano: React.FC<{ p?: V3; s?: number; yaw?: number }> = ({ p = [0, 0, 0], s = 1, yaw = 0 }) => {
  const keys = useMemo(() => memoTex("keys", 512, 64, (x, w, h) => { x.fillStyle = "#fbfaf4"; x.fillRect(0, 0, w, h); x.fillStyle = "#2b2b2b"; for (let i = 0; i < 36; i++) { x.fillRect(i * (w / 36), 0, 1.5, h); if ([0, 1, 3, 4, 5].includes(i % 7)) x.fillRect(i * (w / 36) + 9, 0, 8, h * 0.6); } }), []);
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      <mesh position={[0, 0.72, -0.08]} castShadow receiveShadow><boxGeometry args={[1.3, 1.2, 0.4]} /><Mat c="#2a1a14" r={0.25} /></mesh>
      <mesh position={[0, 0.66, 0.18]} castShadow><boxGeometry args={[1.25, 0.06, 0.24]} /><Mat c="#2a1a14" r={0.25} /></mesh>
      <mesh position={[0, 0.695, 0.2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.18, 0.16]} /><Mat map={keys} r={0.4} /></mesh>
      {[-0.56, 0.56].map((x) => <mesh key={x} position={[x, 0.32, 0.22]} castShadow><cylinderGeometry args={[0.03, 0.03, 0.64, 8]} /><Mat c="#2a1a14" r={0.25} /></mesh>)}
      <mesh position={[0, 0.98, 0.125]}><boxGeometry args={[0.5, 0.18, 0.01]} /><Mat c="#f6efd8" /></mesh>
      {[-0.3, 0.3].map((x) => <mesh key={"c" + x} position={[x, 1.2, 0.13]}><cylinderGeometry args={[0.02, 0.025, 0.08, 8]} /><Mat c="#d8b04a" m={0.6} r={0.3} /></mesh>)}
    </group>
  );
};
/** A big balance: a beam on a post, a pan at each end; tip (deg) tilts it. */
export const Balance: React.FC<{ p?: V3; tip?: number; left?: React.ReactNode; right?: React.ReactNode; W?: number; pan?: number }> = ({ p = [0, 0, 0], tip = 0, left, right, W = 1.6, pan = 0.5 }) => {
  const a = tip * D, ly = Math.sin(a) * W, ry = -Math.sin(a) * W;
  return (
    <group position={p}>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow><boxGeometry args={[0.7, 0.12, 0.5]} /><Mat c="#6a4a2a" r={0.6} /></mesh>
      <mesh position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[0.07, 0.1, 0.8, 12]} /><Mat c="#d8b04a" r={0.3} m={0.6} /></mesh>
      <group position={[0, 0.88, 0]} rotation={[0, 0, a]}>
        <mesh castShadow><boxGeometry args={[W * 2 + 0.2, 0.08, 0.12]} /><Mat c="#d8b04a" r={0.3} m={0.6} /></mesh>
        <mesh><sphereGeometry args={[0.1, 16, 12]} /><Mat c="#c8323c" r={0.4} /></mesh>
      </group>
      {[[-W, ly, left], [W, ry, right]].map(([x, y, node], i) => (
        <group key={i} position={[x as number, 0.2 + (y as number), 0]}>
          {[-1, 1].map((k) => <mesh key={k} position={[k * pan * 0.5, 0.34, 0]} rotation={[0, 0, -k * 0.35]}><cylinderGeometry args={[0.008, 0.008, 0.8, 4]} /><Mat c="#8a7a4a" /></mesh>)}
          <mesh castShadow receiveShadow><cylinderGeometry args={[pan, pan * 0.92, 0.06, 32]} /><Mat c="#d8b04a" r={0.3} m={0.6} /></mesh>
          <group position={[0, 0.03, 0]}>{node as React.ReactNode}</group>
        </group>
      ))}
    </group>
  );
};

// ================= THE MODERN MICROWAVE =================
export const Microwave: React.FC<{ p?: V3; s?: number; yaw?: number; t?: number; on?: number; door?: number; display?: string; popAt?: number }> = ({ p = [0, 0, 0], s = 1, yaw = 0, t = 0, on = 0, door = 0, display = "0:30", popAt }) => (
  <group position={p} rotation={[0, yaw, 0]} scale={s}>
    <mesh position={[0, 0.16, 0]} castShadow receiveShadow><boxGeometry args={[0.56, 0.32, 0.38]} /><Mat c="#2b2d33" r={0.3} m={0.4} /></mesh>
    {/* lit cavity */}
    <mesh position={[-0.07, 0.16, 0.191]}><planeGeometry args={[0.36, 0.24]} /><Mat c={on > 0 ? "#ffe8b0" : "#1a1a1e"} e="#ffc060" ei={on * 0.9} /></mesh>
    <group position={[-0.07, 0.06, 0.08]} rotation={[0, t * 1.6 * (on > 0 ? 1 : 0), 0]}>
      <mesh><cylinderGeometry args={[0.13, 0.13, 0.01, 24]} /><Mat c="#d8e8ee" r={0.1} o={0.8} /></mesh>
      <group position={[0, 0.01, 0]} scale={popAt !== undefined ? 1 + Math.min(1, Math.max(0, (t - popAt) * 1.2)) * 0.5 : 1}>
        <mesh position={[0, 0.03, 0]} scale={[1, 0.45, 0.7]} castShadow><boxGeometry args={[0.16, 0.12, 0.12]} /><Mat c="#f6ecd2" r={0.8} /></mesh>
        <mesh position={[0, 0.04, 0.043]}><planeGeometry args={[0.1, 0.035]} /><Mat c="#c8323c" /></mesh>
      </group>
    </group>
    {/* door (hinged left) with a dark glass window */}
    <group position={[-0.28, 0.16, 0.195]} rotation={[0, -door * 1.7, 0]}>
      <mesh position={[0.21, 0, 0.005]} castShadow><boxGeometry args={[0.42, 0.3, 0.012]} /><Mat c="#3a3d44" r={0.25} m={0.3} /></mesh>
      <mesh position={[0.21, 0, 0.012]}><planeGeometry args={[0.34, 0.22]} /><Mat c="#1a2028" r={0.05} o={0.55} /></mesh>
      <mesh position={[0.4, 0, 0.025]}><boxGeometry args={[0.018, 0.2, 0.02]} /><Mat c="#9aa0a8" m={0.8} r={0.2} /></mesh>
    </group>
    {/* keypad and display */}
    <mesh position={[0.21, 0.24, 0.192]}><planeGeometry args={[0.1, 0.045]} /><Mat map={labelTex(display, "#0e1a10", "#5aff8a", 256, 112, 80)} e="#2aff6a" ei={0.25} /></mesh>
    {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[0.185 + (i % 3) * 0.026, 0.18 - Math.floor(i / 3) * 0.028, 0.192]}><planeGeometry args={[0.018, 0.016]} /><Mat c="#9aa0a8" /></mesh>)}
  </group>
);

// ================= THE WATER MOLECULE =================
/** A cartoon water molecule: a big red oxygen with a face and two white hydrogen "ears" (Mickey-shaped). */
export const Molecule: React.FC<{ p?: V3; s?: number; spin?: number; expr?: Expr; hot?: number; yaw?: number }> = ({ p = [0, 0, 0], s = 1, spin = 0, expr = EXPR.happy, hot = 0, yaw = 0 }) => {
  const c = new THREE.Color("#e8504a").lerp(new THREE.Color("#ff8a2a"), hot).getStyle();
  return (
    <group position={p} rotation={[0, yaw, spin]} scale={s}>
      <mesh castShadow><sphereGeometry args={[0.3, 40, 30]} /><Mat c={c} r={0.4} e="#ff4a10" ei={hot * 0.35} /></mesh>
      <FacePatch R={0.3} expr={expr} skin={c} brow="#5a1a14" />
      {[-1, 1].map((k) => (
        <group key={k} position={[k * 0.27, 0.22, 0]}>
          <mesh castShadow><sphereGeometry args={[0.17, 28, 20]} /><Mat c="#f4f6fa" r={0.35} /></mesh>
          <mesh position={[-k * 0.1, -0.08, 0]} rotation={[0, 0, k * 0.9]}><cylinderGeometry args={[0.04, 0.04, 0.12, 10]} /><Mat c="#f4f6fa" r={0.35} /></mesh>
        </group>
      ))}
    </group>
  );
};

// ================= LOW-DETAIL FOLK (back rows) =================
const FW = Math.round(PHI_SPAN * PX), FH = Math.round(THETA_SPAN * PX);
const miniBody = (() => { let g: THREE.BufferGeometry | null = null; return () => g ?? (g = new THREE.CapsuleGeometry(0.155, 0.17, 6, 16)); })();
const SK = ["#f7dcc8", "#efc6a6", "#e2ae86", "#cf9468", "#b67a4f", "#99603b", "#7c4a2d", "#663b24"];
export const MiniFolk: React.FC<{ pos: V3; yaw?: number; body: string; skin: number; hair?: string; expr?: Expr; lean?: number; lift?: number; arms?: number; cap?: string }> = ({ pos, yaw = 0, body, skin, hair = "#1e1410", expr = EXPR.neutral, lean = 0, lift = 0, arms = 0, cap }) => {
  const sk = SK[skin];
  const face = useMemo(() => {
    const c = document.createElement("canvas"); c.width = FW; c.height = FH; drawFace(c.getContext("2d")!, expr, { skin: sk, brow: hair });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [JSON.stringify(expr), sk, hair]);
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      {[-0.06, 0.06].map((x) => <mesh key={x} position={[x, 0.17, 0]}><cylinderGeometry args={[0.013, 0.013, 0.34, 6]} /><Mat c="#141414" r={0.45} /></mesh>)}
      <group position={[0, 0.3, 0]} rotation={[lean * D, 0, 0]}>
        <mesh position={[0, 0.2, 0]} geometry={miniBody()} castShadow><Mat c={body} r={0.8} /></mesh>
        {[-1, 1].map((k) => <mesh key={k} position={[k * 0.17, 0.32 + arms * 0.15, 0]} rotation={[0, 0, k * (0.3 + arms * 2.2)]}><cylinderGeometry args={[0.012, 0.012, 0.26, 6]} /><Mat c="#141414" r={0.45} /></mesh>)}
        <group position={[0, 0.62, 0.0]} rotation={[-lift * D, 0, 0]} scale={HEAD_SCALE}>
          <mesh castShadow><sphereGeometry args={[BR, 28, 20]} /><Mat c={sk} r={0.68} /></mesh>
          <mesh renderOrder={2}><sphereGeometry args={[BR * 1.006, 40, 30, Math.PI / 2 - PHI_SPAN / 2, PHI_SPAN, THETA0, THETA_SPAN]} /><meshStandardMaterial map={face} transparent roughness={0.7} depthWrite={false} polygonOffset polygonOffsetFactor={-2} /></mesh>
          <mesh><sphereGeometry args={[BR * 1.04, 28, 14, 0, Math.PI * 2, 0, 0.85]} /><Mat c={hair} r={0.85} side={THREE.DoubleSide} /></mesh>
          {cap && <mesh position={[0, 0.17, 0]} scale={[1, 0.45, 1]}><sphereGeometry args={[0.27, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat c={cap} r={0.8} /></mesh>}
        </group>
      </group>
    </group>
  );
};
export const MINIS = [
  { body: "#3f5a7a", skin: 4, cap: "#2a3a50" }, { body: "#5a6a4a", skin: 2 }, { body: "#3f5a7a", skin: 6, cap: "#2a3a50" }, { body: "#7a5a3a", skin: 1 },
  { body: "#5a6a4a", skin: 5, cap: "#3a4a30" }, { body: "#3f5a7a", skin: 3 }, { body: "#6a4a5a", skin: 7, cap: "#2a3a50" }, { body: "#5a6a4a", skin: 0 },
];
void c01;

// Short 2 cast: the rats (an original Beanfolk rat: a round fur head with the drawn face kit, big pink round ears, a
// cream snout with a pink button nose, buck teeth and whiskers, a pear body with a cream belly, little pink hands and
// feet and a long pink tapering tail; a tailless rat keeps a tiny stub with a sticking plaster), the officials, the
// inspector, the Hanoi townspeople and rat hunters, the economist, and their props. Everything faces +z.
import React, { useMemo } from "react";
import * as THREE from "three";
import { drawFace, Expr, EXPR, FacePatch, PHI_SPAN, PX, THETA0, THETA_SPAN } from "../bean/Face";
import { Bean3D, HEAD_SCALE, Look, Pose, R as BR } from "./Bean";

const D = Math.PI / 180;
export const Mat: React.FC<{ c?: string; r?: number; map?: THREE.Texture | null; side?: THREE.Side; e?: string; ei?: number; t?: boolean; o?: number }> = ({ c = "#fff", r = 0.72, map, side, e, ei, t, o }) => (
  <meshStandardMaterial color={map ? "#ffffff" : c} map={map ?? null} roughness={r} metalness={0} side={side ?? THREE.FrontSide} emissive={e ?? "#000000"} emissiveIntensity={ei ?? 0} transparent={t || o !== undefined} opacity={o ?? 1} />
);
const dirOn = (theta: number, d: number) => new THREE.Vector3(Math.sin(d) * Math.sin(theta), Math.cos(theta), Math.cos(d) * Math.sin(theta));
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ================= THE RAT =================
export const RAT = { fur: "#9b98a6", furDark: "#7c7988", belly: "#f1e6da", pink: "#f4a3b4", pinkDark: "#e07f95", brow: "#4a4652", plaster: "#f2d6a8" };
export const FURS = ["#9b98a6", "#a08c7c", "#8a8f9c", "#b3a596", "#86808e"];
const RH = 0.2; // head radius
const HEAD_Y = 0.56; // head centre above the feet

/** A tapering tube along a curve (the tail): radius r0 at the root to r1 at the tip. */
const taperTube = (pts: THREE.Vector3[], r0: number, r1: number, seg = 40, rad = 8) => {
  const curve = new THREE.CatmullRomCurve3(pts);
  const g = new THREE.TubeGeometry(curve, seg, r0, rad, false);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i <= seg; i++) {
    const c = curve.getPointAt(i / seg), k = (r0 + (r1 - r0) * (i / seg)) / r0;
    for (let j = 0; j <= rad; j++) {
      const idx = i * (rad + 1) + j, v = new THREE.Vector3().fromBufferAttribute(p, idx);
      v.sub(c).multiplyScalar(k).add(c); p.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return g;
};

const RTCACHE = new Map<string, THREE.BufferGeometry>();
const ratTailGeo = (q: number, grow: number) => {
  const k = q + "|" + grow;
  let g = RTCACHE.get(k);
  if (!g) {
    const L = 0.62 * Math.max(0.05, grow), pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      pts.push(new THREE.Vector3(Math.sin(u * 3 + q) * 0.09 * u, 0.14 + Math.sin(u * Math.PI) * 0.12 + u * u * 0.14 * Math.max(0.3, grow), -0.12 - u * L));
    }
    g = taperTube(pts, 0.026 * Math.max(0.5, Math.min(1, grow + 0.3)), 0.006); RTCACHE.set(k, g);
  }
  return g;
};
export type RatS = {
  expr?: Expr; tail?: boolean; wag?: number; run?: number; arms?: "down" | "up" | "hold" | "wave" | "shrug" | "eat"; hop?: number;
  head?: [number, number, number]; lean?: number; fur?: string; bow?: string; t?: number; tailGrow?: number; plaster?: boolean;
};
/** One rat: feet on y = 0, facing +z, about 0.78 tall at scale 1. `run` is the gait phase (cycles) when scurrying. */
export const Rat: React.FC<{ s?: RatS; position?: [number, number, number]; yaw?: number; scale?: number }> = ({ s = {}, position = [0, 0, 0], yaw = 0, scale = 1 }) => {
  const fur = s.fur ?? RAT.fur, t = s.t ?? 0, wag = s.wag ?? Math.sin(t * 3.1);
  const tailOn = s.tail ?? true, grow = s.tailGrow ?? 1;
  const tailQ = Math.round(wag * 8) / 8; // quantised so the geometry cache stays small
  const tailGeo = ratTailGeo(tailQ, Math.round(grow * 10) / 10);
  const run = s.run, ph = (run ?? 0) * Math.PI * 2, moving = run !== undefined;
  const bob = moving ? Math.abs(Math.sin(ph)) * 0.05 : 0;
  const hop = s.hop ?? 0;
  const legA = moving ? Math.sin(ph) * 40 : 0;
  const armPose: Record<string, [number, number]> = { down: [20, 10], up: [150, 10], hold: [30, 75], wave: [140, -10], shrug: [70, 40], eat: [40, 95] };
  const [ar, as] = armPose[s.arms ?? (moving ? "down" : "down")];
  const armSwing = moving ? Math.sin(ph) * 35 : 0;
  const [hp, hy, hr] = s.head ?? [0, 0, 0];
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <group position={[0, bob + hop, 0]} rotation={[(s.lean ?? (moving ? 14 : 0)) * D, 0, 0]}>
        {/* legs + feet */}
        {[1, -1].map((side) => (
          <group key={side} position={[side * 0.075, 0.13, 0]} rotation={[(side * legA) * D, 0, 0]}>
            <mesh position={[0, -0.06, 0]}><cylinderGeometry args={[0.022, 0.022, 0.12, 8]} /><Mat c={fur} r={0.85} /></mesh>
            <mesh position={[0, -0.115, 0.04]} scale={[0.9, 0.5, 1.5]} castShadow><sphereGeometry args={[0.045, 16, 10]} /><Mat c={RAT.pink} r={0.6} /></mesh>
          </group>
        ))}
        {/* body: a pear with a cream belly */}
        <mesh position={[0, 0.3, 0]} scale={[1, 1.12, 0.92]} castShadow receiveShadow><sphereGeometry args={[0.17, 32, 24]} /><Mat c={fur} r={0.85} /></mesh>
        <mesh position={[0, 0.27, 0.06]} scale={[0.82, 0.95, 0.7]}><sphereGeometry args={[0.165, 28, 20]} /><Mat c={RAT.belly} r={0.9} /></mesh>
        {/* arms with pink hands */}
        {[1, -1].map((side) => (
          <group key={side} position={[side * 0.15, 0.38, 0.02]} rotation={[-(as + side * armSwing) * D, 0, side * ar * D * 0.9]}>
            <mesh position={[0, -0.07, 0]} castShadow><cylinderGeometry args={[0.022, 0.02, 0.14, 8]} /><Mat c={fur} r={0.85} /></mesh>
            <mesh position={[0, -0.15, 0]} castShadow><sphereGeometry args={[0.035, 14, 10]} /><Mat c={RAT.pink} r={0.6} /></mesh>
          </group>
        ))}
        {/* tail, or the plastered stub */}
        {tailOn ? (
          <mesh geometry={tailGeo} castShadow><Mat c={RAT.pink} r={0.55} /></mesh>
        ) : (
          <group position={[0, 0.17, -0.14]}>
            <mesh castShadow><sphereGeometry args={[0.035, 14, 10]} /><Mat c={RAT.pink} r={0.6} /></mesh>
            {s.plaster !== false && [0.6, -0.6].map((r) => (
              <mesh key={r} position={[0, 0.0, -0.032]} rotation={[0, 0, r]}><boxGeometry args={[0.15, 0.045, 0.014]} /><Mat c={RAT.plaster} r={0.8} /></mesh>
            ))}
          </group>
        )}
        {/* head */}
        <group position={[0, HEAD_Y, 0.02]} rotation={[hp * D, hy * D, hr * D]}>
          <group scale={[1.06, 0.96, 1]}>
            <mesh castShadow><sphereGeometry args={[RH, 48, 36]} /><Mat c={fur} r={0.8} /></mesh>
            <FacePatch R={RH} expr={s.expr ?? EXPR.neutral} skin={fur} brow={RAT.brow} />
            {/* snout, nose, teeth, whiskers */}
            <group position={dirOn(Math.PI / 2 + 0.2, 0).multiplyScalar(RH * 0.86).toArray() as any}>
              <mesh scale={[1.25, 0.8, 1]} castShadow><sphereGeometry args={[0.062, 24, 16]} /><Mat c={RAT.belly} r={0.85} /></mesh>
              <mesh position={[0, 0.012, 0.06]} castShadow><sphereGeometry args={[0.024, 16, 12]} /><Mat c={RAT.pinkDark} r={0.4} /></mesh>
              {[-1, 1].map((k) => <mesh key={k} position={[k * 0.011, -0.055, 0.035]}><boxGeometry args={[0.018, 0.026, 0.008]} /><Mat c="#fffdf6" r={0.4} /></mesh>)}
              {[-1, 1].map((k) => [-0.25, 0, 0.25].map((a) => (
                <mesh key={k + "" + a} position={[k * 0.11, -0.002 + a * 0.03, 0.03]} rotation={[0, 0, Math.PI / 2 + k * a]}><cylinderGeometry args={[0.0025, 0.0025, 0.12, 4]} /><Mat c="#3a3640" r={0.6} /></mesh>
              )))}
            </group>
            {/* ears: big round pink discs */}
            {[1, -1].map((k) => (
              <group key={k} position={dirOn(0.55, k * 0.95).multiplyScalar(RH * 0.95).toArray() as any} rotation={[-0.15, k * 0.5, -k * 0.35]}>
                <mesh scale={[1, 1, 0.32]} castShadow><sphereGeometry args={[0.105, 24, 16]} /><Mat c={fur} r={0.85} /></mesh>
                <mesh position={[0, 0, 0.022]} scale={[0.78, 0.78, 0.2]}><sphereGeometry args={[0.105, 24, 16]} /><Mat c={RAT.pink} r={0.6} /></mesh>
              </group>
            ))}
            {s.bow && (
              <group position={dirOn(0.3, 0.6).multiplyScalar(RH).toArray() as any} rotation={[0, 0.6, 0.3]}>
                {[-1, 1].map((k) => <mesh key={k} position={[k * 0.04, 0, 0]} rotation={[0, 0, k * Math.PI / 2]} scale={[1, 1, 0.5]}><coneGeometry args={[0.035, 0.07, 12]} /><Mat c={s.bow} r={0.5} /></mesh>)}
                <mesh><sphereGeometry args={[0.018, 10, 8]} /><Mat c={s.bow} r={0.5} /></mesh>
              </group>
            )}
          </group>
        </group>
      </group>
    </group>
  );
};

/** A cut-off rat tail lying on a surface (or held): a pink tapered curve. */
const TAILCACHE = new Map<number, THREE.BufferGeometry>();
const looseTailGeo = (k: number) => {
  let g = TAILCACHE.get(k);
  if (!g) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push(new THREE.Vector3(Math.sin(u * 4 + k) * 0.05, 0.012 + Math.sin(u * Math.PI) * 0.01, -u * 0.38)); }
    g = taperTube(pts, 0.016, 0.004, 24, 6); TAILCACHE.set(k, g);
  }
  return g;
};
export const LooseTail: React.FC<{ p?: [number, number, number]; r?: [number, number, number]; k?: number; s?: number }> = ({ p = [0, 0, 0], r = [0, 0, 0], k = 0, s = 1 }) => (
  <mesh geometry={looseTailGeo(k % 4)} position={p} rotation={r} scale={s} castShadow><Mat c={RAT.pink} r={0.55} /></mesh>
);
/** A heap of tails (n tails, in a box of w x d, piled up to h). */
export const TailHeap: React.FC<{ n: number; w: number; d: number; h: number; p?: [number, number, number]; seed?: number }> = ({ n, w, d, h, p = [0, 0, 0], seed = 0 }) => (
  <group position={p}>
    {Array.from({ length: n }, (_, i) => {
      const a = rnd(i * 3 + seed), b = rnd(i * 7 + seed), c = rnd(i * 11 + seed);
      const y = h * Math.pow(rnd(i * 13 + seed), 0.7) * (1 - Math.hypot(a - 0.5, b - 0.5));
      return <LooseTail key={i} k={i} p={[(a - 0.5) * w, y, (b - 0.5) * d + 0.15]} r={[(c - 0.5) * 0.6, c * 6.28, (a - 0.5) * 0.5]} />;
    })}
  </group>
);

// ================= HUMANS =================
const off = { kind: "suit" as const, base: "#f4f1e6", accent: "#2b3a5a" };
export const LOOKS: Record<string, Look> = {
  // the officials: white suits, sun helmets, moustaches
  chief: { name: "the chief official", role: "official", skin: 0, outfit: { ...off, accent: "#a8323a" }, hair: { kind: "sidePart", color: "#8a6a4a" }, hat: { kind: "pith", color: "#f2ecd8", accent: "#8a6a3a" }, moustache: true, shoes: "#3a2a1e" },
  clerk: { name: "the clerk", role: "official", skin: 1, outfit: { ...off, accent: "#2b3a5a" }, hair: { kind: "short", color: "#3a2a1e" }, glasses: "#2d2d33", moustache: true, shoes: "#1d1b1a" },
  deputy: { name: "the deputy", role: "official", skin: 2, outfit: { ...off, accent: "#2f6a4a" }, hair: { kind: "sidePart", color: "#c8b8a0" }, hat: { kind: "pith", color: "#efe6cc", accent: "#5a4a3a" }, moustache: true, shoes: "#3a2a1e" },
  inspector: { name: "the inspector", role: "inspector", skin: 3, outfit: { kind: "uniform", base: "#c8b48a", accent: "#c99a3a" }, hair: { kind: "short", color: "#2a1d16" }, hat: { kind: "pith", color: "#d8c8a0", accent: "#6a5030" }, moustache: true, shoes: "#3a2a1e" },
  // Hanoi townspeople and rat hunters, 1902: tunics, sashes, conical hats
  hunter1: { name: "Ba", role: "rat hunter", skin: 4, outfit: { kind: "tunic", base: "#5a4632", accent: "#3a2c20", accent2: "#a83a2a" }, hair: { kind: "short", color: "#1e1410" }, hat: { kind: "conical", color: "#e8d6a4", accent: "#b89a5a" }, shoes: "#3a2a1e" },
  hunter2: { name: "Tư", role: "rat hunter", skin: 3, outfit: { kind: "tunic", base: "#2f3f5a", accent: "#1e2a3e", accent2: "#c8a040" }, hair: { kind: "topBun", color: "#1e1410" }, shoes: "#2a2420" },
  hunter3: { name: "Năm", role: "rat hunter", skin: 5, outfit: { kind: "tunic", base: "#7a6a4a", accent: "#4a3e2a", accent2: "#2f5a4a" }, hair: { kind: "messy", color: "#1e1410" }, hat: { kind: "conical", color: "#efdcae", accent: "#b89a5a" }, shoes: "#3a2a1e" },
  woman1: { name: "Lan", role: "townswoman", skin: 2, outfit: { kind: "tunic", base: "#3f7a6a", accent: "#2a5248", accent2: "#e0b040" }, hair: { kind: "topBun", color: "#1e1410" }, shoes: "#2a2420" },
  woman2: { name: "Mai", role: "townswoman", skin: 4, outfit: { kind: "tunic", base: "#8a3a3a", accent: "#5a2424", accent2: "#3a5a8a" }, hair: { kind: "bob", color: "#1e1410" }, hat: { kind: "conical", color: "#f0e0b4", accent: "#b89a5a" }, shoes: "#2a2420" },
  farmer: { name: "Hùng", role: "rat farmer", skin: 5, outfit: { kind: "tunic", base: "#6a5a3a", accent: "#4a3e28", accent2: "#c8783a" }, hair: { kind: "short", color: "#1e1410" }, hat: { kind: "conical", color: "#e8d6a4", accent: "#a88a4a" }, moustache: true, shoes: "#3a2a1e" },
  kid: { name: "kid", role: "", skin: 3, outfit: { kind: "tunic", base: "#d8c8a0", accent: "#a8946a", accent2: "#c84a3a" }, hair: { kind: "curly", color: "#1e1410" }, shoes: "#3a2a1e" },
  lady: { name: "Madame", role: "lady of the house", skin: 1, outfit: { kind: "dress", base: "#c86a8a", accent: "#fff3f0" }, hair: { kind: "buns", color: "#7a4a2a" }, shoes: "#c8323c" },
  economist: { name: "the economist", role: "economist", skin: 6, outfit: { kind: "suit", base: "#6a4a32", accent: "#c8a040" }, hair: { kind: "short", color: "#bdb6aa" }, glasses: "#2d2d33", shoes: "#2b2b2b" },
};

export type Who = { look: Look; pose?: Pose; expr?: Expr; pos: [number, number, number]; yaw?: number; hold?: React.ReactNode; holdL?: React.ReactNode; headExtra?: React.ReactNode; scale?: number; tilt?: [number, number] };
export const Person: React.FC<{ w: Who }> = ({ w }) => (
  <Bean3D look={w.look} pose={w.pose} expr={w.expr} position={w.pos} yaw={w.yaw ?? 0} hold={w.hold} holdL={w.holdL} headExtra={w.headExtra} scale={w.scale ?? 1} tilt={w.tilt} />
);

// ================= PROPS (held: the hand's frame, forearm along -y) =================
const TEXCACHE = new Map<string, THREE.Texture>();
export const memoTex = (k: string, w: number, h: number, f: (x: CanvasRenderingContext2D, w: number, h: number) => void) => {
  let t = TEXCACHE.get(k);
  if (!t) { const c = document.createElement("canvas"); c.width = w; c.height = h; f(c.getContext("2d")!, w, h); t = new THREE.CanvasTexture(c); (t as THREE.CanvasTexture).colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; TEXCACHE.set(k, t); }
  return t;
};
const paper = (lines: string[], head: string) => memoTex("paper" + head + lines.join("|"), 256, 340, (x, w, h) => {
  x.fillStyle = "#fbf7ea"; x.fillRect(0, 0, w, h);
  x.fillStyle = "#2b2b33"; x.font = "900 30px Montserrat, sans-serif"; x.textAlign = "center"; x.fillText(head, w / 2, 44);
  x.strokeStyle = "#9bb3d6"; x.lineWidth = 3;
  for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(20, 76 + i * 32); x.lineTo(w - 20, 76 + i * 32); x.stroke(); }
  x.fillStyle = "#33343c"; x.font = "800 24px Montserrat, sans-serif"; x.textAlign = "left";
  lines.forEach((l, i) => x.fillText(l, 22, 70 + i * 32));
});
export const Clipboard: React.FC<{ lines?: string[]; head?: string }> = ({ lines = ["barn 1: RATS", "barn 2: RATS", "barn 3: RATS!!", "fed: yes", "pets??"], head = "INSPECTION" }) => (
  <group position={[0, -0.05, 0.05]} rotation={[-1.1, 0, 0]}>
    <mesh castShadow><boxGeometry args={[0.15, 0.2, 0.008]} /><Mat c="#9a6a3c" r={0.6} /></mesh>
    <mesh position={[0, -0.008, 0.0045]}><planeGeometry args={[0.13, 0.17]} /><Mat map={paper(lines, head)} r={0.9} /></mesh>
    <mesh position={[0, 0.095, 0.008]}><boxGeometry args={[0.06, 0.02, 0.01]} /><Mat c="#c0c0c8" r={0.3} /></mesh>
  </group>
);
/** A copper one-cent coin (face up = +y). */
export const Coin: React.FC<{ p?: [number, number, number]; r?: [number, number, number]; s?: number }> = ({ p = [0, 0, 0], r = [0, 0, 0], s = 1 }) => {
  const map = memoTex("coin", 128, 128, (x, w, h) => {
    x.fillStyle = "#d48a3a"; x.beginPath(); x.arc(64, 64, 64, 0, 7); x.fill(); x.strokeStyle = "#a8642a"; x.lineWidth = 8; x.beginPath(); x.arc(64, 64, 52, 0, 7); x.stroke();
    x.fillStyle = "#8a4a1a"; x.font = "900 56px Montserrat, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("1¢", 64, 68);
  });
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh castShadow><cylinderGeometry args={[0.05, 0.05, 0.01, 24]} /><Mat c="#c8803a" r={0.35} /></mesh>
      <mesh position={[0, 0.0055, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.05, 24]} /><Mat map={map} r={0.35} /></mesh>
    </group>
  );
};
export const CoinStack: React.FC<{ p: [number, number, number]; n: number }> = ({ p, n }) => (
  <group position={p}>{Array.from({ length: n }, (_, i) => <mesh key={i} position={[Math.sin(i * 1.7) * 0.004, 0.006 + i * 0.011, Math.cos(i * 2.3) * 0.004]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.01, 20]} /><Mat c={i % 2 ? "#c8803a" : "#d8924a"} r={0.35} /></mesh>)}</group>
);
/** Scissors held in the hand: open (0..1) opens the blades. */
export const Scissors: React.FC<{ open?: number }> = ({ open = 0.5 }) => (
  <group position={[0, -0.07, 0.04]} rotation={[-Math.PI / 2, 0, 0]}>
    {[-1, 1].map((k) => (
      <group key={k} rotation={[0, 0, k * open * 0.35]}>
        <mesh position={[0, 0.09, 0]} castShadow><boxGeometry args={[0.018, 0.16, 0.006]} /><Mat c="#d8dde4" r={0.25} /></mesh>
        <mesh position={[k * 0.025, -0.03, 0]} castShadow><torusGeometry args={[0.025, 0.008, 8, 20]} /><Mat c="#c8323c" r={0.5} /></mesh>
      </group>
    ))}
  </group>
);
/** A held rat tail (dangling from the hand). */
export const HeldTail: React.FC = () => (
  <group position={[0, -0.04, 0.03]} rotation={[0.2, 0, 0]}><LooseTail r={[-Math.PI / 2, 0, 0]} k={2} /></group>
);
/** A held one-cent coin. */
export const HeldCoin: React.FC<{ s?: number }> = ({ s = 1.3 }) => <Coin p={[0, -0.05, 0.03]} r={[Math.PI / 2, 0, 0]} s={s} />;
/** A notice held up: text on paper. */
export const noticeTex = (head: string, sub = "") => memoTex("notice" + head + sub, 384, 512, (x, w, h) => {
    x.fillStyle = "#f6ecd2"; x.fillRect(0, 0, w, h); x.strokeStyle = "#a8323a"; x.lineWidth = 14; x.strokeRect(14, 14, w - 28, h - 28);
    x.fillStyle = "#2b2b33"; x.textAlign = "center"; x.font = "900 44px Montserrat, sans-serif"; x.fillText("AVIS", w / 2, 86);
    x.fillStyle = "#a8323a"; x.font = "900 120px Montserrat, sans-serif"; x.fillText(head, w / 2, 250);
    x.fillStyle = "#2b2b33"; x.font = "800 40px Montserrat, sans-serif"; sub.split("|").forEach((l, i) => x.fillText(l, w / 2, 330 + i * 52));
  });
export const Notice: React.FC<{ head: string; sub?: string; s?: number }> = ({ head, sub = "", s = 1 }) => {
  const map = noticeTex(head, sub);
  return (
    <group position={[0, -0.04, 0.12]} rotation={[-Math.PI / 2 + 0.25, 0, 0]} scale={s}>
      <mesh castShadow><boxGeometry args={[0.3, 0.4, 0.006]} /><Mat c="#e6d8b8" r={0.9} /></mesh>
      <mesh position={[0, 0, 0.0035]}><planeGeometry args={[0.3, 0.4]} /><Mat map={map} r={0.9} /></mesh>
    </group>
  );
};
/** A hunter's long-handled net. */
export const Net: React.FC = () => (
  <group position={[0, -0.05, 0.03]} rotation={[-0.4, 0, 0]}>
    <mesh position={[0, -0.25, 0]} castShadow><cylinderGeometry args={[0.012, 0.012, 0.7, 8]} /><Mat c="#8a5a30" r={0.6} /></mesh>
    <group position={[0, -0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow><torusGeometry args={[0.13, 0.009, 8, 24]} /><Mat c="#6a4a2a" r={0.6} /></mesh>
      <mesh position={[0, 0, -0.08]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.13, 0.18, 16, 1, true]} /><Mat c="#e8dcc0" r={0.9} side={THREE.DoubleSide} o={0.75} /></mesh>
    </group>
  </group>
);
/** A woven basket held by the hand (handle up). */
export const Basket: React.FC<{ tails?: boolean }> = ({ tails = true }) => (
  <group position={[0, -0.2, 0.05]}>
    <mesh castShadow><cylinderGeometry args={[0.13, 0.1, 0.13, 20, 1, true]} /><Mat c="#b8904a" r={0.9} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, -0.064, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.1, 20]} /><Mat c="#9a7a3a" r={0.9} /></mesh>
    <mesh position={[0, 0.07, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.12, 0.008, 6, 24, Math.PI]} /><Mat c="#8a6a2a" r={0.9} /></mesh>
    {tails && <TailHeap n={8} w={0.15} d={0.12} h={0.05} p={[0, -0.04, -0.12]} />}
  </group>
);
/** A bowl of rice (for the rat farm). */
export const Bowl: React.FC<{ p?: [number, number, number]; s?: number }> = ({ p = [0, 0, 0], s = 1 }) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.04, 0]} castShadow><cylinderGeometry args={[0.1, 0.06, 0.08, 20]} /><Mat c="#3f6a9a" r={0.4} /></mesh>
    <mesh position={[0, 0.075, 0]} scale={[1, 0.35, 1]}><sphereGeometry args={[0.09, 16, 10]} /><Mat c="#f8f4e8" r={0.9} /></mesh>
  </group>
);
export const HeldBowl: React.FC = () => <group position={[0, -0.07, 0.08]} rotation={[-Math.PI / 2, 0, 0]}><Bowl s={1.2} /></group>;
/** The economist's chalk. */
export const Chalk: React.FC = () => (
  <mesh position={[0, -0.035, 0.02]} rotation={[0.6, 0, 0]} castShadow><cylinderGeometry args={[0.008, 0.008, 0.06, 8]} /><Mat c="#fbfbf4" r={0.9} /></mesh>
);

// ================= LOW-DETAIL TOWNSFOLK (for the back rows) =================
const FW = Math.round(PHI_SPAN * PX), FH = Math.round(THETA_SPAN * PX);
const miniBody = (() => { let g: THREE.BufferGeometry | null = null; return () => g ?? (g = new THREE.CapsuleGeometry(0.155, 0.17, 6, 16)); })();
const SK = ["#f7dcc8", "#efc6a6", "#e2ae86", "#cf9468", "#b67a4f", "#99603b", "#7c4a2d", "#663b24"];
export const MiniFolk: React.FC<{ pos: [number, number, number]; yaw?: number; body: string; skin: number; hair?: string; expr?: Expr; hat?: "conical" | "pith" | null; lean?: number; lift?: number; arms?: number }> = ({ pos, yaw = 0, body, skin, hair = "#1e1410", expr = EXPR.neutral, hat = null, lean = 0, lift = 0, arms = 0 }) => {
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
          {hat === "conical" && <mesh position={[0, 0.3, 0]} castShadow><coneGeometry args={[0.42, 0.27, 32, 1, true]} /><Mat c="#e8d6a4" r={0.85} side={THREE.DoubleSide} /></mesh>}
          {hat === "pith" && <group position={[0, 0.17, 0]}><mesh scale={[1, 0.16, 1.12]}><sphereGeometry args={[0.34, 28, 12]} /><Mat c="#f2ecd8" r={0.75} /></mesh><mesh position={[0, 0.03, 0]}><sphereGeometry args={[0.24, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat c="#f2ecd8" r={0.75} /></mesh></group>}
        </group>
      </group>
    </group>
  );
};
export const MINIS = [
  { body: "#5a4632", skin: 4, hat: "conical" as const }, { body: "#2f3f5a", skin: 3 }, { body: "#3f7a6a", skin: 2, hat: "conical" as const },
  { body: "#8a3a3a", skin: 5 }, { body: "#7a6a4a", skin: 6, hat: "conical" as const }, { body: "#d8c8a0", skin: 3 }, { body: "#4a3a5a", skin: 4, hat: "conical" as const },
  { body: "#f4f1e6", skin: 0, hat: "pith" as const, hair: "#8a6a4a" },
];

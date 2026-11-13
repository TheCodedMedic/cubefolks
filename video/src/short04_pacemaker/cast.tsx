// Short 4 cast and props: Wilson (1950s engineer: glasses, white shirt and tie under an olive cardigan), the doctors,
// the nurse, the slow-heart patient, the 77-year-old man, the surgeons (green gowns, caps), low-detail crowd folk with a
// tiny glowing heart on the chest; and the props: resistors with colour stripes, the oscilloscope with a live green
// trace, the parts drawers, the soldering iron, the switch, the circuit box, the TV-sized machine, the plug, the
// pacemaker, the cartoon heart and its spark. Everything faces +z; units are metres.
import React, { useMemo } from "react";
import * as THREE from "three";
import { drawFace, Expr, EXPR, PHI_SPAN, PX, THETA0, THETA_SPAN } from "../bean/Face";
import { Bean3D, HEAD_SCALE, Look, Pose, R as BR } from "./Bean";

const D = Math.PI / 180;
type V3 = [number, number, number];
export const Mat: React.FC<{ c?: string; r?: number; m?: number; map?: THREE.Texture | null; side?: THREE.Side; e?: string; ei?: number; t?: boolean; o?: number }> = ({ c = "#fff", r = 0.72, m = 0, map, side, e, ei, t, o }) => (
  <meshStandardMaterial color={map ? "#ffffff" : c} map={map ?? null} roughness={r} metalness={m} side={side ?? THREE.FrontSide} emissive={e ?? "#000000"} emissiveIntensity={ei ?? 0} transparent={t || o !== undefined} opacity={o ?? 1} />
);
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const TEXCACHE = new Map<string, THREE.Texture>();
export const memoTex = (k: string, w: number, h: number, f: (x: CanvasRenderingContext2D, w: number, h: number) => void) => {
  let t = TEXCACHE.get(k);
  if (!t) { const c = document.createElement("canvas"); c.width = w; c.height = h; f(c.getContext("2d")!, w, h); t = new THREE.CanvasTexture(c); (t as THREE.CanvasTexture).colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; TEXCACHE.set(k, t); }
  return t;
};
const F = (w: number, sz: number) => `${w} ${sz}px Montserrat, sans-serif`;

// ================= PEOPLE =================
export const LOOKS: Record<string, Look> = {
  wilson: { name: "Wilson", role: "the engineer", skin: 1, outfit: { kind: "cardigan", base: "#7d8a5a", accent: "#8a2a32", accent2: "#d8c8a0" }, hair: { kind: "sidePart", color: "#6a4a30" }, glasses: "#1e1a18", shoes: "#3a2a1e" },
  doc1: { name: "Dr. Ade", role: "doctor", skin: 5, outfit: { kind: "labcoat", base: "#f6f6f2", accent: "#3a6aa8" }, hair: { kind: "short", color: "#2a1d16" }, glasses: "#5a4a3a", shoes: "#2b2b2b" },
  doc2: { name: "Dr. Rosa", role: "doctor", skin: 2, outfit: { kind: "labcoat", base: "#f6f6f2", accent: "#a83a5a" }, hair: { kind: "bob", color: "#4a2a1a" }, shoes: "#5a3a2a" },
  nurse: { name: "Nurse Joy", role: "nurse", skin: 4, outfit: { kind: "dress", base: "#8ec8e8", accent: "#ffffff" }, hair: { kind: "topBun", color: "#2a1a12" }, shoes: "#f4f1ea" },
  patient: { name: "Ruth", role: "the slow-heart patient", skin: 3, outfit: { kind: "gown", base: "#cfe6ee", accent: "#8ab8cc" }, hair: { kind: "buns", color: "#b8b0a8" }, shoes: "#e8d8c8" },
  oldman: { name: "Mr. Henning", role: "the 77-year-old man", skin: 0, outfit: { kind: "gown", base: "#d8eadf", accent: "#8ab89a" }, hair: { kind: "short", color: "#e8e6e0" }, moustache: true, glasses: "#8a7a6a", shoes: "#6a4a3a" },
  oldmanOut: { name: "Mr. Henning", role: "walking again", skin: 0, outfit: { kind: "cardigan", base: "#c87a4a", accent: "#2a4a7a", accent2: "#f2e6d0" }, hair: { kind: "short", color: "#e8e6e0" }, moustache: true, glasses: "#8a7a6a", shoes: "#6a4a3a" },
  surg1: { name: "surgeon", role: "surgeon", skin: 6, outfit: { kind: "labcoat", base: "#7cb8a0", accent: "#5a9a82" }, hair: { kind: "short", color: "#1e1410" }, shoes: "#e8e8e0" },
  surg2: { name: "surgeon", role: "surgeon", skin: 2, outfit: { kind: "labcoat", base: "#7cb8a0", accent: "#5a9a82" }, hair: { kind: "bob", color: "#6a3a20" }, glasses: "#2d2d33", shoes: "#e8e8e0" },
  // modern street folk (full rig, foreground)
  teen: { name: "teen", role: "", skin: 6, outfit: { kind: "hoodie", base: "#e66a3e", accent: "#fbe9d6" }, hair: { kind: "curly", color: "#1f140e" }, shoes: "#f4f1ea" },
  mum: { name: "mum", role: "", skin: 4, outfit: { kind: "dress", base: "#4fa7a0", accent: "#fff8ee" }, hair: { kind: "buns", color: "#2a1a12" }, shoes: "#c8323c" },
  gran: { name: "gran", role: "", skin: 2, outfit: { kind: "cardigan", base: "#9a6aa8", accent: "#e8c040", accent2: "#f2e6d0" }, hair: { kind: "bob", color: "#d8d4cc" }, glasses: "#c9a24a", shoes: "#5a4bb0" },
};
/** A green surgical cap (in the head's frame). */
export const SurgCap: React.FC = () => (
  <mesh position={[0, 0.07, -0.01]} scale={[1.07, 0.8, 1.07]}><sphereGeometry args={[BR * 1.04, 32, 16, 0, Math.PI * 2, 0, 1.25]} /><Mat c="#6aa890" r={0.85} side={THREE.DoubleSide} /></mesh>
);

export type Who = { look: Look; pose?: Pose; expr?: Expr; pos: V3; yaw?: number; hold?: React.ReactNode; holdL?: React.ReactNode; headExtra?: React.ReactNode; scale?: number; tilt?: [number, number] };
export const Person: React.FC<{ w: Who }> = ({ w }) => (
  <Bean3D look={w.look} pose={w.pose} expr={w.expr} position={w.pos} yaw={w.yaw ?? 0} hold={w.hold} holdL={w.holdL} headExtra={w.headExtra} scale={w.scale ?? 1} tilt={w.tilt} />
);

// ================= THE CARTOON HEART =================
const heartGeo = (() => {
  let g: THREE.ExtrudeGeometry | null = null;
  return () => {
    if (g) return g;
    const s = new THREE.Shape();
    s.moveTo(0, -0.5);
    s.bezierCurveTo(-0.15, -0.32, -0.55, -0.12, -0.55, 0.16);
    s.bezierCurveTo(-0.55, 0.42, -0.3, 0.52, -0.16, 0.5);
    s.bezierCurveTo(-0.06, 0.48, 0, 0.4, 0, 0.32);
    s.bezierCurveTo(0, 0.4, 0.06, 0.48, 0.16, 0.5);
    s.bezierCurveTo(0.3, 0.52, 0.55, 0.42, 0.55, 0.16);
    s.bezierCurveTo(0.55, -0.12, 0.15, -0.32, 0, -0.5);
    g = new THREE.ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 8, curveSegments: 32 });
    g.translate(0, 0, -0.11);
    g.computeVertexNormals();
    return g;
  };
})();
/** A puffy cartoon heart, size 1 ~ 1.2 m wide, centred; beat 0..1 swells it. */
export const Heart: React.FC<{ p?: V3; s?: number; beat?: number; c?: string; glow?: number; face?: Expr; r?: V3 }> = ({ p = [0, 0, 0], s = 1, beat = 0, c = "#e8475f", glow = 0, face, r = [0, 0, 0] }) => {
  const k = s * (1 + 0.12 * beat);
  return (
    <group position={p} rotation={r} scale={[k, k * (1 - 0.03 * beat), k]}>
      <mesh geometry={heartGeo()} castShadow><Mat c={c} r={0.45} e={c} ei={0.08 + glow * 0.5} /></mesh>
      {/* a glossy highlight */}
      <mesh position={[-0.26, 0.26, 0.2]} scale={[1, 0.6, 0.3]}><sphereGeometry args={[0.09, 16, 12]} /><meshBasicMaterial color="#ffd8de" transparent opacity={0.8} /></mesh>
      {face && <HeartFace e={face} />}
    </group>
  );
};
const HeartFace: React.FC<{ e: Expr }> = ({ e }) => {
  const t = useMemo(() => { const c = document.createElement("canvas"); c.width = Math.round(PHI_SPAN * PX); c.height = Math.round(THETA_SPAN * PX); drawFace(c.getContext("2d")!, e, { skin: "#e8475f", brow: "#5a1020" }); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx; }, [JSON.stringify(e)]);
  return <mesh position={[0, 0.02, 0.245]}><planeGeometry args={[1.0, 0.87]} /><meshBasicMaterial map={t} transparent depthWrite={false} /></mesh>;
};
/** A glowing electrical spark: a hot core, a halo and a little light. */
export const Spark: React.FC<{ p: V3; s?: number; t?: number; c?: string }> = ({ p, s = 1, t = 0, c = "#ffe25a" }) => {
  const f = 1 + 0.25 * Math.sin(t * 40) * Math.sin(t * 23);
  return (
    <group position={p} scale={s * f}>
      <mesh><sphereGeometry args={[0.05, 16, 12]} /><meshBasicMaterial color="#fffbe0" /></mesh>
      <mesh><sphereGeometry args={[0.1, 16, 12]} /><meshBasicMaterial color={c} transparent opacity={0.45} depthWrite={false} /></mesh>
      {[0, 1, 2, 3].map((i) => <mesh key={i} rotation={[0, 0, (i * 45 + t * 200) * D]}><boxGeometry args={[0.32, 0.018, 0.018]} /><meshBasicMaterial color={c} /></mesh>)}
      <pointLight color={c} intensity={2.5 * s} distance={1.6} decay={1.5} />
    </group>
  );
};

// ================= TRACES (oscilloscope / heart monitor) =================
/** The trace height at time x (s) for pulses at the given times: a sharp blip. */
const blip = (dt: number) => (dt < 0 || dt > 0.16 ? 0 : dt < 0.04 ? dt / 0.04 * 0.25 : dt < 0.07 ? 0.25 - (dt - 0.04) / 0.03 * 0.25 + (dt - 0.04) / 0.03 * 1 : dt < 0.1 ? 1 - (dt - 0.07) / 0.03 * 1.4 : -0.4 + (dt - 0.1) / 0.06 * 0.4);
/** A glowing trace on a w x h screen, showing the last `win` seconds up to t; pulses = blip times. */
export const Trace: React.FC<{ t: number; pulses: number[]; w: number; h: number; win?: number; c?: string; amp?: number; z?: number }> = ({ t, pulses, w, h, win = 2.4, c = "#7dff8a", amp = 0.36, z = 0.004 }) => {
  const geo = useMemo(() => {
    const N = 140, pts: THREE.Vector3[] = [];
    for (let i = 0; i <= N; i++) {
      const x = i / N, tt = t - win * (1 - x);
      let y = 0; for (const p of pulses) y += blip(tt - p);
      y += Math.sin(tt * 37) * 0.012;
      pts.push(new THREE.Vector3((x - 0.5) * w * 0.94, y * h * amp - h * 0.12, z));
    }
    const path = new THREE.CurvePath<THREE.Vector3>();
    for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
    return new THREE.TubeGeometry(path as any, N * 2, Math.max(0.004, w * 0.012), 5, false);
  }, [Math.round(t * 60), pulses.length, w, h, win]);
  return <mesh geometry={geo}><meshBasicMaterial color={c} /></mesh>;
};
const gridTex = (c: string) => memoTex("grid" + c, 256, 192, (x, w, h) => {
  x.fillStyle = c; x.fillRect(0, 0, w, h);
  x.strokeStyle = "rgba(140,255,160,0.18)"; x.lineWidth = 2;
  for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo((i * w) / 8, 0); x.lineTo((i * w) / 8, h); x.stroke(); }
  for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(0, (i * h) / 6); x.lineTo(w, (i * h) / 6); x.stroke(); }
});
/** A 1950s oscilloscope: a grey cabinet, round-cornered green screen with the live trace, knobs. Origin at the base centre. */
export const Scope: React.FC<{ p: V3; t: number; pulses: number[]; s?: number; yaw?: number; flash?: number }> = ({ p, t, pulses, s = 1, yaw = 0, flash = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]} scale={s}>
    <mesh position={[0, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[0.5, 0.4, 0.42]} /><Mat c="#8a9298" r={0.5} m={0.3} /></mesh>
    <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.46, 0.02, 0.38]} /><Mat c="#6a7278" r={0.5} m={0.3} /></mesh>
    <mesh position={[-0.06, 0.22, 0.212]}><boxGeometry args={[0.32, 0.28, 0.01]} /><Mat c="#2a2e30" r={0.4} /></mesh>
    <group position={[-0.06, 0.22, 0.219]}>
      <mesh><planeGeometry args={[0.29, 0.25]} /><meshBasicMaterial map={gridTex("#0c2a14")} color={flash > 0 ? new THREE.Color("#ffffff").lerp(new THREE.Color("#ffffff"), 1).multiplyScalar(1 + flash * 0.6) : "#ffffff"} /></mesh>
      <Trace t={t} pulses={pulses} w={0.29} h={0.25} />
    </group>
    {[0.08, 0.0, -0.08].map((y, i) => <mesh key={i} position={[0.17, 0.22 + y, 0.215]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.022, 0.022, 0.025, 16]} /><Mat c="#1e1e22" r={0.4} /></mesh>)}
    <mesh position={[0, 0.03, 0.215]}><boxGeometry args={[0.46, 0.035, 0.01]} /><Mat c="#c8a050" r={0.4} m={0.6} /></mesh>
    <pointLight position={[-0.06, 0.22, 0.4]} color="#7dff8a" intensity={0.4 + 1.6 * pulseGlow(t, pulses)} distance={1.4} decay={1.5} />
  </group>
);
/** 0..1 glow right after a pulse. */
export const pulseGlow = (t: number, pulses: number[]) => pulses.reduce((a, p) => Math.max(a, t >= p && t < p + 0.35 ? 1 - (t - p) / 0.35 : 0), 0);

// ================= RESISTORS =================
const BANDS: Record<string, string[]> = { "10K": ["#7a4a20", "#1a1a1a", "#e8762a", "#c8a040"], "1M": ["#7a4a20", "#1a1a1a", "#3aa84a", "#c8a040"] };
/** A resistor along x: a tan body with colour bands and wire leads. s=1 ~ 6 cm long (scale it up for close-ups). */
export const Resistor: React.FC<{ p?: V3; r?: V3; s?: number; kind?: "10K" | "1M"; glow?: number }> = ({ p = [0, 0, 0], r = [0, 0, 0], s = 1, kind = "1M", glow = 0 }) => (
  <group position={p} rotation={r} scale={s}>
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow><capsuleGeometry args={[0.006, 0.016, 6, 16]} /><Mat c="#d8c08a" r={0.5} e="#ffd060" ei={glow} /></mesh>
    {BANDS[kind].map((c, i) => <mesh key={i} position={[-0.009 + i * 0.006 - (i === 3 ? -0.003 : 0), 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.0064, 0.0064, 0.0028, 16]} /><Mat c={c} r={0.5} /></mesh>)}
    {[-1, 1].map((k) => <mesh key={k} position={[k * 0.025, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.0011, 0.0011, 0.03, 6]} /><Mat c="#c8ccd0" r={0.3} m={0.8} /></mesh>)}
  </group>
);

// ================= WORKBENCH PROPS =================
/** The parts cabinet: a grid of little drawers with labels; drawer `open` (index) slides out by `out`. */
export const Drawers: React.FC<{ p: V3; yaw?: number; open?: number; out?: number; s?: number }> = ({ p, yaw = 0, open = 4, out = 0, s = 1 }) => {
  const labels = ["CAPACITORS", "DIODES", "TUBES", "WIRE", "RESISTORS", "SCREWS", "KNOBS", "FUSES", "SPRINGS"];
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      <mesh position={[0, 0.2, -0.02]} castShadow receiveShadow><boxGeometry args={[0.66, 0.42, 0.26]} /><Mat c="#7a5030" r={0.6} /></mesh>
      {labels.map((l, i) => {
        const cx = (i % 3) - 1, cy = 2 - Math.floor(i / 3), o = i === open ? out : 0;
        return (
          <group key={i} position={[cx * 0.21, 0.07 + cy * 0.13, 0.12 + o * 0.16]}>
            <mesh castShadow><boxGeometry args={[0.19, 0.11, 0.04]} /><Mat c={i === open ? "#d8a048" : "#c89040"} r={0.55} /></mesh>
            <mesh position={[0, 0.012, 0.0205]}><planeGeometry args={[0.15, 0.04]} /><meshBasicMaterial map={labelTex(l)} /></mesh>
            <mesh position={[0, -0.03, 0.026]}><boxGeometry args={[0.05, 0.012, 0.012]} /><Mat c="#c8ccd0" r={0.3} m={0.8} /></mesh>
            {i === open && o > 0.3 && Array.from({ length: 7 }, (_, k) => <Resistor key={k} p={[-0.06 + rnd(k) * 0.12, 0.05, -0.06 + rnd(k * 3) * 0.08 - 0.08]} r={[0, rnd(k * 5) * 3, 0]} s={1.3} kind={k % 2 ? "10K" : "1M"} />)}
          </group>
        );
      })}
    </group>
  );
};
export const labelTex = (l: string) => memoTex("lab" + l, 256, 68, (x, w, h) => {
  x.fillStyle = "#f6efd8"; x.fillRect(0, 0, w, h); x.strokeStyle = "#3a2a1a"; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4);
  x.fillStyle = "#2a1a10"; x.font = F(900, l.length > 8 ? 30 : 38); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(l, w / 2, h / 2 + 2);
});
/** A soldering iron (held: along the forearm, tip forward); `hot` adds a smoke wisp. */
export const Iron: React.FC<{ t?: number; hot?: number; held?: boolean }> = ({ t = 0, hot = 0, held = true }) => (
  <group position={held ? [0, -0.04, 0.03] : [0, 0, 0]} rotation={held ? [-1.2, 0, 0] : [0, 0, 0]}>
    <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.016, 0.018, 0.11, 12]} /><Mat c="#2a5aa8" r={0.5} /></mesh>
    <mesh position={[0, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.006, 0.009, 0.08, 10]} /><Mat c="#c8ccd0" r={0.3} m={0.8} /></mesh>
    <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.006, 0.025, 10]} /><Mat c="#e88a3a" e="#ff6a20" ei={hot} /></mesh>
    {hot > 0 && <Smoke t={t} p={[0, 0.0, 0.15]} k={hot} />}
  </group>
);
/** Little smoke puffs rising from p. */
export const Smoke: React.FC<{ t: number; p: V3; k?: number; s?: number }> = ({ t, p, k = 1, s = 1 }) => (
  <group position={p} scale={s}>
    {Array.from({ length: 6 }, (_, i) => {
      const u = ((t * 0.9 + i / 6) % 1);
      return <mesh key={i} position={[Math.sin(u * 7 + i) * 0.02, u * 0.22, 0]} scale={0.01 + u * 0.03}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#f0f0f0" transparent opacity={(1 - u) * 0.7 * k} depthWrite={false} /></mesh>;
    })}
  </group>
);
/** Wilson's circuit: a wooden base, a breadboard with parts, a green bulb that flashes on pulses, a big toggle switch. */
export const Circuit: React.FC<{ p: V3; t: number; pulses?: number[]; on?: number; s?: number; yaw?: number; resistor?: boolean; smoke?: number }> = ({ p, t, pulses = [], on = 0, s = 1, yaw = 0, resistor = true, smoke = 0 }) => {
  const g = pulseGlow(t, pulses);
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      <mesh position={[0, 0.015, 0]} castShadow receiveShadow><boxGeometry args={[0.42, 0.03, 0.28]} /><Mat c="#a8743a" r={0.6} /></mesh>
      <mesh position={[0, 0.035, 0]} receiveShadow><boxGeometry args={[0.36, 0.012, 0.22]} /><Mat c="#f2ead8" r={0.7} /></mesh>
      {/* tubes, capacitors, wires */}
      {[-0.12, -0.06].map((x, i) => <group key={i} position={[x, 0.04, -0.05]}><mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.018, 0.018, 0.08, 14]} /><Mat c="#c8d8e0" r={0.1} o={0.7} /></mesh><mesh position={[0, 0.085, 0]}><sphereGeometry args={[0.018, 14, 10]} /><Mat c="#c8d8e0" r={0.1} o={0.7} /></mesh></group>)}
      {[0.02, 0.06].map((x, i) => <mesh key={i} position={[x, 0.06, -0.06]}><cylinderGeometry args={[0.012, 0.012, 0.04, 12]} /><Mat c={i ? "#2a5aa8" : "#2a2a2a"} r={0.4} /></mesh>)}
      {[[-0.15, 0.05, 0.1, 0.05, "#d83a3a"], [-0.1, 0.07, 0.12, -0.02, "#2a2a2a"], [0.0, 0.08, 0.14, 0.06, "#e8c040"]].map(([x1, z1, x2, z2, c], i) => (
        <mesh key={i} position={[((x1 as number) + (x2 as number)) / 2, 0.045, ((z1 as number) + (z2 as number)) / 2]} rotation={[0, -Math.atan2((z2 as number) - (z1 as number), (x2 as number) - (x1 as number)), Math.PI / 2]}><cylinderGeometry args={[0.003, 0.003, Math.hypot((x2 as number) - (x1 as number), (z2 as number) - (z1 as number)), 6]} /><Mat c={c as string} /></mesh>
      ))}
      {resistor && <Resistor p={[0.0, 0.05, 0.04]} s={1.6} kind="1M" glow={g * 0.6} />}
      {smoke > 0 && <Smoke t={t} p={[0, 0.05, 0.04]} k={smoke} s={0.6} />}
      {/* the bulb that flashes */}
      <group position={[0.12, 0.04, -0.04]}>
        <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.014, 0.016, 0.03, 12]} /><Mat c="#9aa3ad" m={0.8} r={0.3} /></mesh>
        <mesh position={[0, 0.05, 0]}><sphereGeometry args={[0.024, 16, 12]} /><Mat c={g > 0.05 ? "#c8ffd0" : "#5a7a60"} e="#5aff7a" ei={g * 3} r={0.2} /></mesh>
        <pointLight position={[0, 0.07, 0.02]} color="#6aff8a" intensity={g * 2.4} distance={1.2} decay={1.6} />
      </group>
      {/* the switch */}
      <group position={[0.15, 0.03, 0.09]}>
        <mesh position={[0, 0.012, 0]}><boxGeometry args={[0.05, 0.025, 0.04]} /><Mat c="#2a2a2e" r={0.4} /></mesh>
        <mesh position={[0, 0.03, 0]} rotation={[0, 0, (on > 0.5 ? -30 : 30) * D * (1 - 2 * Math.abs(on - Math.round(on)))]}><group rotation={[0, 0, (on - 0.5) * -60 * D]}><mesh position={[0, 0.025, 0]}><cylinderGeometry args={[0.005, 0.007, 0.05, 10]} /><Mat c="#c8ccd0" m={0.8} r={0.3} /></mesh><mesh position={[0, 0.05, 0]}><sphereGeometry args={[0.01, 12, 10]} /><Mat c="#d83a3a" /></mesh></group></mesh>
      </group>
    </group>
  );
};
/** The pacemaker: a small rounded silver case with a lead wire curling out. */
export const Pacer: React.FC<{ p?: V3; r?: V3; s?: number; glow?: number; lead?: boolean }> = ({ p = [0, 0, 0], r = [0, 0, 0], s = 1, glow = 0, lead = true }) => (
  <group position={p} rotation={r} scale={s}>
    <mesh scale={[1, 0.85, 0.3]} castShadow><sphereGeometry args={[0.03, 28, 20]} /><Mat c="#c8ccd4" m={0.85} r={0.25} /></mesh>
    <mesh position={[0, 0.026, 0]}><boxGeometry args={[0.024, 0.012, 0.012]} /><Mat c="#e8e4dc" r={0.4} /></mesh>
    <mesh position={[0, 0, 0.009]}><circleGeometry args={[0.006, 16]} /><meshBasicMaterial color={glow > 0.05 ? "#9affb0" : "#3a6a4a"} /></mesh>
    {lead && <mesh position={[0.015, 0.05, 0]} rotation={[0, 0, 0.6]}><torusGeometry args={[0.022, 0.0025, 6, 24, Math.PI * 1.4]} /><Mat c="#2a5aa8" r={0.4} /></mesh>}
  </group>
);
/** Held in the palm (hand frame). */
export const HeldPacer: React.FC<{ glow?: number }> = ({ glow = 0 }) => <Pacer p={[0, -0.03, 0.04]} r={[0.2, 0, 0]} s={1.3} glow={glow} />;

// ================= HOSPITAL PROPS =================
/** A hospital bed (head end at -z), white sheets; the patient lies on it at y ~ 0.45. */
export const Bed: React.FC<{ p: V3; yaw?: number }> = ({ p, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.34, 0]} castShadow receiveShadow><boxGeometry args={[0.7, 0.12, 1.5]} /><Mat c="#f4f2ec" r={0.85} /></mesh>
    <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.72, 0.05, 1.52]} /><Mat c="#9aa8b0" m={0.5} r={0.4} /></mesh>
    {[[-0.33, -0.72], [0.33, -0.72], [-0.33, 0.72], [0.33, 0.72]].map(([x, z], i) => <mesh key={i} position={[x, 0.13, z]}><cylinderGeometry args={[0.015, 0.015, 0.26, 8]} /><Mat c="#9aa8b0" m={0.5} r={0.4} /></mesh>)}
    <mesh position={[0, 0.55, -0.76]} castShadow><boxGeometry args={[0.72, 0.5, 0.04]} /><Mat c="#b8c4cc" m={0.4} r={0.4} /></mesh>
    <mesh position={[0, 0.43, -0.55]} rotation={[0.25, 0, 0]} castShadow><boxGeometry args={[0.5, 0.08, 0.28]} /><Mat c="#ffffff" r={0.9} /></mesh>
    <mesh position={[0, 0.42, 0.25]} castShadow><boxGeometry args={[0.68, 0.06, 0.9]} /><Mat c="#a8cce0" r={0.9} /></mesh>
  </group>
);
/** A bedside heart monitor on a stand (screen faces +z) with a live trace. */
export const Monitor: React.FC<{ p: V3; t: number; pulses: number[]; yaw?: number; s?: number; c?: string; dim?: number }> = ({ p, t, pulses, yaw = 0, s = 1, c = "#7dff8a", dim = 1 }) => (
  <group position={p} rotation={[0, yaw, 0]} scale={s}>
    <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.02, 0.02, 0.9, 8]} /><Mat c="#9aa8b0" m={0.5} r={0.4} /></mesh>
    <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.18, 0.2, 0.04, 16]} /><Mat c="#6a7680" m={0.5} r={0.4} /></mesh>
    <mesh position={[0, 1.02, 0]} castShadow><boxGeometry args={[0.42, 0.32, 0.2]} /><Mat c="#d8d4c4" r={0.5} /></mesh>
    <group position={[0, 1.04, 0.102]}>
      <mesh><planeGeometry args={[0.34, 0.22]} /><meshBasicMaterial map={gridTex("#0a2412")} color={new THREE.Color(dim, dim, dim)} /></mesh>
      {dim > 0.2 && <Trace t={t} pulses={pulses} w={0.34} h={0.22} win={3} c={c} />}
    </group>
    <mesh position={[0.15, 0.9, 0.102]}><circleGeometry args={[0.014, 12]} /><meshBasicMaterial color={pulseGlow(t, pulses) > 0.3 ? "#ff5a5a" : "#5a2020"} /></mesh>
  </group>
);
/** The TV-sized 1950s machine on a cart: dials, a needle meter, a cord running to the wall. */
export const BigMachine: React.FC<{ p: V3; t: number; yaw?: number; on?: number; s?: number }> = ({ p, t, yaw = 0, on = 1, s = 1 }) => (
  <group position={p} rotation={[0, yaw, 0]} scale={s}>
    <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.8, 0.04, 0.55]} /><Mat c="#6a7680" m={0.5} r={0.4} /></mesh>
    {[[-0.36, -0.24], [0.36, -0.24], [-0.36, 0.24], [0.36, 0.24]].map(([x, z], i) => <mesh key={i} position={[x, 0.04, z]}><sphereGeometry args={[0.035, 10, 8]} /><Mat c="#2a2a2a" /></mesh>)}
    <mesh position={[0, 0.5, 0]} castShadow receiveShadow><boxGeometry args={[0.78, 0.76, 0.52]} /><Mat c="#c8b898" r={0.55} /></mesh>
    <mesh position={[0, 0.6, 0.262]}><boxGeometry args={[0.5, 0.36, 0.01]} /><Mat c="#3a3a36" r={0.3} /></mesh>
    <mesh position={[0, 0.6, 0.268]}><planeGeometry args={[0.46, 0.32]} /><meshBasicMaterial color={on > 0.5 ? "#f2e8c0" : "#3a3a30"} /></mesh>
    {/* the meter needle */}
    <mesh position={[0, 0.48, 0.272]} rotation={[0, 0, on * Math.sin(t * 6.3) * 0.7]}><boxGeometry args={[0.006, 0.26, 0.004]} /><meshBasicMaterial color="#c0392b" /></mesh>
    {[-0.24, -0.08, 0.08, 0.24].map((x, i) => <mesh key={i} position={[x, 0.25, 0.27]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.035, 0.035, 0.03, 16]} /><Mat c="#2a2a2e" r={0.4} /></mesh>)}
    <mesh position={[0.3, 0.82, 0.265]}><sphereGeometry args={[0.022, 12, 10]} /><Mat c={on > 0.5 ? "#ff5a5a" : "#5a2020"} e="#ff3a3a" ei={on > 0.5 ? 1.5 : 0} /></mesh>
    <mesh position={[0, 0.9, 0]}><boxGeometry args={[0.6, 0.04, 0.4]} /><Mat c="#a89878" r={0.6} /></mesh>
  </group>
);
/** A wall socket (on a wall facing +z) with a plug pushed in by `inn` (0..1) and its cord curving down to `cordTo`. */
export const Socket: React.FC<{ p: V3; inn?: number; cord?: boolean }> = ({ p, inn = 1, cord = true }) => (
  <group position={p}>
    <mesh position={[0, 0, 0.005]}><boxGeometry args={[0.12, 0.16, 0.01]} /><Mat c="#f2ead8" r={0.5} /></mesh>
    {[-0.022, 0.022].map((x) => <mesh key={x} position={[x, 0.01, 0.011]}><boxGeometry args={[0.008, 0.026, 0.002]} /><meshBasicMaterial color="#1a1a1a" /></mesh>)}
    <group position={[0, 0.0, 0.01 + (1 - inn) * 0.12]}>
      <mesh position={[0, 0.0, 0.035]} castShadow><boxGeometry args={[0.08, 0.1, 0.06]} /><Mat c="#3a3a3a" r={0.5} /></mesh>
      {cord && <mesh position={[0, -0.25, 0.07]}><cylinderGeometry args={[0.009, 0.009, 0.5, 8]} /><Mat c="#2a2a2a" r={0.5} /></mesh>}
    </group>
  </group>
);
/** A big round wall clock whose second hand ticks once a second from t0. */
export const Clock: React.FC<{ p: V3; t: number; t0: number; s?: number }> = ({ p, t, t0, s = 1 }) => {
  const k = Math.floor(Math.max(0, t - t0)) + Math.min(1, Math.max(0, t - t0 - Math.floor(Math.max(0, t - t0))) * 8);
  return (
    <group position={p} scale={s}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.3, 0.3, 0.05, 40]} /><Mat c="#3a2a1e" r={0.5} /></mesh>
      <mesh position={[0, 0, 0.026]}><circleGeometry args={[0.27, 40]} /><Mat c="#fbf6e6" r={0.7} /></mesh>
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.sin(i * 30 * D) * 0.23, Math.cos(i * 30 * D) * 0.23, 0.03]}><boxGeometry args={[0.012, 0.04, 0.004]} /><meshBasicMaterial color="#2a2a2a" /></mesh>)}
      <mesh position={[0, 0, 0.034]} rotation={[0, 0, -(k * 6 + 60) * D]}><group><mesh position={[0, 0.11, 0]}><boxGeometry args={[0.008, 0.22, 0.004]} /><meshBasicMaterial color="#c0392b" /></mesh></group></mesh>
      <mesh position={[0, 0, 0.032]} rotation={[0, 0, -40 * D]}><group><mesh position={[0, 0.07, 0]}><boxGeometry args={[0.018, 0.14, 0.004]} /><meshBasicMaterial color="#2a2a2a" /></mesh></group></mesh>
      <mesh position={[0, 0, 0.038]}><circleGeometry args={[0.018, 12]} /><meshBasicMaterial color="#2a2a2a" /></mesh>
    </group>
  );
};
/** A surgical lamp hanging from above (pointing down). */
export const SurgLamp: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.02, 0.02, 1.2, 8]} /><Mat c="#9aa8b0" m={0.5} r={0.4} /></mesh>
    <mesh rotation={[Math.PI, 0, 0]} castShadow><coneGeometry args={[0.35, 0.18, 32, 1, true]} /><Mat c="#e8ece8" r={0.4} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, -0.08, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[0.3, 32]} /><meshBasicMaterial color="#fffbe8" side={THREE.DoubleSide} /></mesh>
  </group>
);

// ================= LOW-DETAIL FOLK (crowds), with an optional glowing heart on the chest =================
const FW = Math.round(PHI_SPAN * PX), FH = Math.round(THETA_SPAN * PX);
const miniBody = (() => { let g: THREE.BufferGeometry | null = null; return () => g ?? (g = new THREE.CapsuleGeometry(0.155, 0.17, 6, 16)); })();
const SK = ["#f7dcc8", "#efc6a6", "#e2ae86", "#cf9468", "#b67a4f", "#99603b", "#7c4a2d", "#663b24"];
export const MiniFolk: React.FC<{ pos: V3; yaw?: number; body: string; skin: number; hair?: string; expr?: Expr; heart?: number; walk?: number; scale?: number }> = ({ pos, yaw = 0, body, skin, hair = "#1e1410", expr = EXPR.happy, heart = 0, walk = -1, scale = 1 }) => {
  const sk = SK[skin];
  const face = useMemo(() => {
    const c = document.createElement("canvas"); c.width = FW; c.height = FH; drawFace(c.getContext("2d")!, expr, { skin: sk, brow: hair });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [JSON.stringify(expr), sk, hair]);
  const sw = walk >= 0 ? Math.sin(walk * Math.PI * 2) : 0, bob = walk >= 0 ? Math.abs(Math.cos(walk * Math.PI * 2)) * 0.02 : 0;
  return (
    <group position={[pos[0], pos[1] + bob, pos[2]]} rotation={[0, yaw, 0]} scale={scale}>
      {[-0.06, 0.06].map((x, i) => <mesh key={x} position={[x, 0.17, 0]} rotation={[(i ? sw : -sw) * 0.35, 0, 0]}><cylinderGeometry args={[0.013, 0.013, 0.34, 6]} /><Mat c="#141414" r={0.45} /></mesh>)}
      <group position={[0, 0.3, 0]} rotation={[4 * D, 0, sw * 0.04]}>
        <mesh position={[0, 0.2, 0]} geometry={miniBody()} castShadow><Mat c={body} r={0.8} /></mesh>
        {heart > 0 && <group position={[0.06, 0.28, 0.15]} scale={0.075 * heart}><Heart beat={0} glow={1} c="#ff5a7a" /><pointLight color="#ff5a7a" intensity={0.5 * heart} distance={0.6} /></group>}
        {[-1, 1].map((k) => <mesh key={k} position={[k * 0.17, 0.3, 0]} rotation={[sw * k * 0.4, 0, k * 0.3]}><cylinderGeometry args={[0.012, 0.012, 0.26, 6]} /><Mat c="#141414" r={0.45} /></mesh>)}
        <group position={[0, 0.62, 0.0]} scale={HEAD_SCALE}>
          <mesh castShadow><sphereGeometry args={[BR, 28, 20]} /><Mat c={sk} r={0.68} /></mesh>
          <mesh renderOrder={2}><sphereGeometry args={[BR * 1.006, 40, 30, Math.PI / 2 - PHI_SPAN / 2, PHI_SPAN, THETA0, THETA_SPAN]} /><meshStandardMaterial map={face} transparent roughness={0.7} depthWrite={false} polygonOffset polygonOffsetFactor={-2} /></mesh>
          <mesh><sphereGeometry args={[BR * 1.04, 28, 14, 0, Math.PI * 2, 0, 0.85]} /><Mat c={hair} r={0.85} side={THREE.DoubleSide} /></mesh>
        </group>
      </group>
    </group>
  );
};
export const MINIS = [
  { body: "#e66a3e", skin: 7, hair: "#1f140e" }, { body: "#4fa7a0", skin: 1, hair: "#c0662f" }, { body: "#2f3f5a", skin: 3 }, { body: "#e8c040", skin: 5 },
  { body: "#8a3a5a", skin: 0, hair: "#d8d4cc" }, { body: "#3f7a4a", skin: 4 }, { body: "#5a6ac8", skin: 6, hair: "#e8e6e0" }, { body: "#f2ead8", skin: 2, hair: "#6a4a30" },
  { body: "#c84a4a", skin: 3, hair: "#2a1a12" }, { body: "#6a4ab0", skin: 5, hair: "#1e1410" },
];

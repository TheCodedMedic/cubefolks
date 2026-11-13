// Short 5 cast and props: Randy (a lanky 1960s teen: crew cut, red-striped T-shirt; droopier eyes and messier hair each
// day), his two friends (Bruce with a whistle, Joe with a basketball), the sleep scientist (lab coat, tie, glasses,
// clipboard), the teacher and the class kid, the dream football Randy (jersey 17, leather helmet), low-detail crowd folk;
// and the props: the giant coffee mug, the spinning wall clock, the day calendar, whistle, basketball and hoop, the street
// sign that becomes a "person", the pinball machine with its WINNER lights, the cartoon brain and its light switch, the
// record book and the stamp. Everything faces +z; units are metres.
import React, { useMemo } from "react";
import * as THREE from "three";
import { drawFace, Expr, EXPR, PHI_SPAN, PX, THETA0, THETA_SPAN } from "../bean/Face";
import { Bean3D, HEAD_SCALE, Look, Pose, R as BR } from "./Bean";

const D = Math.PI / 180;
type V3 = [number, number, number];
export const Mat: React.FC<{ c?: string; r?: number; m?: number; map?: THREE.Texture | null; side?: THREE.Side; e?: string; ei?: number; t?: boolean; o?: number }> = ({ c = "#fff", r = 0.72, m = 0, map, side, e, ei, t, o }) => (
  <meshStandardMaterial color={map ? "#ffffff" : c} map={map ?? null} roughness={r} metalness={m} side={side ?? THREE.FrontSide} emissive={e ?? "#000000"} emissiveIntensity={ei ?? 0} transparent={t || o !== undefined} opacity={o ?? 1} />
);
export const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const TEXCACHE = new Map<string, THREE.Texture>();
export const memoTex = (k: string, w: number, h: number, f: (x: CanvasRenderingContext2D, w: number, h: number) => void) => {
  let t = TEXCACHE.get(k);
  if (!t) { const c = document.createElement("canvas"); c.width = w; c.height = h; f(c.getContext("2d")!, w, h); t = new THREE.CanvasTexture(c); (t as THREE.CanvasTexture).colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; TEXCACHE.set(k, t); }
  return t;
};
export const F = (w: number, sz: number) => `${w} ${sz}px Montserrat, sans-serif`;

// ================= PEOPLE =================
const tee = { kind: "tee" as const, base: "#f4ecd8", accent: "#d8483a", accent2: "#2a3a5a" };
export const LOOKS: Record<string, Look> = {
  randy: { name: "Randy", role: "the kid who stayed awake", skin: 1, outfit: tee, hair: { kind: "short", color: "#7a4a26" }, shoes: "#f2ede0" },
  randyMessy: { name: "Randy", role: "day 4 on", skin: 1, outfit: tee, hair: { kind: "messy", color: "#7a4a26" }, shoes: "#f2ede0" },
  randyBall: { name: "Randy", role: "the football dream", skin: 1, outfit: { kind: "jersey", base: "#c8323c", accent: "#fbf6ec", accent2: "#2a2a30" }, hair: { kind: "short", color: "#7a4a26" }, shoes: "#2a2a30" },
  bruce: { name: "Bruce", role: "friend with the whistle", skin: 5, outfit: { kind: "cardigan", base: "#2f6a4a", accent: "#f2d24a", accent2: "#f4f0e4" }, hair: { kind: "sidePart", color: "#1e1410" }, shoes: "#3a2a1e" },
  joe: { name: "Joe", role: "friend with the basketball", skin: 3, outfit: { kind: "tee", base: "#f2d24a", accent: "#3a6ab0", accent2: "#3a6ab0" }, hair: { kind: "curly", color: "#2a1a12" }, shoes: "#c8323c" },
  sci: { name: "Dr. Dement", role: "the sleep scientist", skin: 0, outfit: { kind: "labcoat", base: "#f6f6f2", accent: "#2a4a8a" }, hair: { kind: "sidePart", color: "#4a3426" }, glasses: "#1e1a18", shoes: "#2b2b2b" },
  teacher: { name: "teacher", role: "", skin: 6, outfit: { kind: "dress", base: "#8a5ab0", accent: "#fff8ee" }, hair: { kind: "topBun", color: "#2a1a12" }, glasses: "#c9a24a", shoes: "#5a3a2a" },
  pupil: { name: "pupil", role: "", skin: 4, outfit: { kind: "hoodie", base: "#4fa7a0", accent: "#fbe9d6" }, hair: { kind: "buns", color: "#2a1a12" }, shoes: "#e66a3e" },
  pupil2: { name: "pupil", role: "", skin: 2, outfit: { kind: "tee", base: "#e8f0f4", accent: "#4f8ac8", accent2: "#2a3a5a" }, hair: { kind: "short", color: "#c0662f" }, shoes: "#3a3a44" },
};
/** Randy's face for a day: tired bags from day 2, bloodshot from day 4. */
export const tiredX = (e: Expr, day: number): Expr => ({ ...e, extras: [...(e.extras ?? []), ...(day >= 2 ? ["bags" as const] : []), ...(day >= 4 ? ["red" as const] : [])] });

export type Who = { look: Look; pose?: Pose; expr?: Expr; pos: V3; yaw?: number; hold?: React.ReactNode; holdL?: React.ReactNode; headExtra?: React.ReactNode; scale?: number; tilt?: [number, number] };
export const Person: React.FC<{ w: Who }> = ({ w }) => (
  <Bean3D look={w.look} pose={w.pose} expr={w.expr} position={w.pos} yaw={w.yaw ?? 0} hold={w.hold} holdL={w.holdL} headExtra={w.headExtra} scale={w.scale ?? 1} tilt={w.tilt} />
);
/** A 1960s leather football helmet (in the head's frame): a brown shell with a centre stripe, a face bar. */
export const Helmet: React.FC = () => (
  <group position={[0, 0.0, 0]}>
    <mesh position={[0, 0.03, -0.01]} scale={[1.1, 0.98, 1.1]} castShadow><sphereGeometry args={[BR * 1.06, 40, 24, Math.PI * 0.82, Math.PI * 1.36, 0, 2.0]} /><Mat c="#5a3418" r={0.5} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 0.03, -0.01]} scale={[1.1, 0.98, 1.1]} castShadow><sphereGeometry args={[BR * 1.07, 40, 24, 0, Math.PI * 2, 0, 0.9]} /><Mat c="#5a3418" r={0.6} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 0.06, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[BR * 1.12, 0.018, 8, 40, Math.PI * 0.6]} /><Mat c="#f2d24a" r={0.5} /></mesh>
  </group>
);
/** A silver whistle on a cord (hand frame or neck). */
export const Whistle: React.FC<{ p?: V3; s?: number }> = ({ p = [0, -0.02, 0.04], s = 1 }) => (
  <group position={p} scale={s} rotation={[0, 0, 0]}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.018, 0.018, 0.03, 16]} /><Mat c="#d8dce0" m={0.85} r={0.25} /></mesh>
    <mesh position={[0, 0.0, 0.03]} castShadow><boxGeometry args={[0.014, 0.016, 0.04]} /><Mat c="#d8dce0" m={0.85} r={0.25} /></mesh>
  </group>
);

// ================= PROPS =================
/** The giant coffee mug (hand frame by default): white with a red stripe and steam. */
export const Mug: React.FC<{ p?: V3; s?: number; t?: number; steam?: boolean }> = ({ p = [0, -0.03, 0.06], s = 1, t = 0, steam = true }) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.07, 0]} castShadow><cylinderGeometry args={[0.07, 0.065, 0.16, 28]} /><Mat c="#3a8ad0" r={0.35} /></mesh>
    <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.0705, 0.0705, 0.04, 28, 1, true]} /><Mat c="#fbf6ec" r={0.4} /></mesh>
    <mesh position={[0, 0.148, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.062, 24]} /><Mat c="#4a2a14" r={0.2} /></mesh>
    <mesh position={[0.08, 0.075, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.035, 0.012, 10, 20, Math.PI]} /><Mat c="#3a8ad0" r={0.35} /></mesh>
    {steam && Array.from({ length: 5 }, (_, i) => { const u = (t * 0.7 + i / 5) % 1; return <mesh key={i} position={[Math.sin(u * 8 + i) * 0.02, 0.16 + u * 0.18, 0]} scale={0.012 + u * 0.03}><sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#ffffff" transparent opacity={(1 - u) * 0.55} depthWrite={false} /></mesh>; })}
  </group>
);
/** A big round wall clock; `spin` = hours shown advanced per second (fast spin for time passing). */
export const Clock: React.FC<{ p: V3; t: number; spin?: number; s?: number; yaw?: number }> = ({ p, t, spin = 0, s = 1, yaw = 0 }) => {
  const hr = 3 + t * spin, mn = hr * 12;
  return (
    <group position={p} scale={s} rotation={[0, yaw, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.3, 0.3, 0.05, 40]} /><Mat c="#2a4a6a" r={0.5} /></mesh>
      <mesh position={[0, 0, 0.026]}><circleGeometry args={[0.27, 40]} /><Mat c="#fbf6e6" r={0.7} /></mesh>
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} position={[Math.sin(i * 30 * D) * 0.23, Math.cos(i * 30 * D) * 0.23, 0.03]}><boxGeometry args={[0.014, 0.045, 0.004]} /><meshBasicMaterial color="#2a2a2a" /></mesh>)}
      <group position={[0, 0, 0.034]} rotation={[0, 0, -mn * 6 * D]}><mesh position={[0, 0.1, 0]}><boxGeometry args={[0.012, 0.2, 0.004]} /><meshBasicMaterial color="#c0392b" /></mesh></group>
      <group position={[0, 0, 0.032]} rotation={[0, 0, -hr * 30 * D]}><mesh position={[0, 0.065, 0]}><boxGeometry args={[0.022, 0.13, 0.004]} /><meshBasicMaterial color="#2a2a2a" /></mesh></group>
      <mesh position={[0, 0, 0.038]}><circleGeometry args={[0.02, 12]} /><meshBasicMaterial color="#2a2a2a" /></mesh>
    </group>
  );
};
const calTex = (day: number) => memoTex("cal" + day, 256, 300, (x, w, h) => {
  x.fillStyle = "#fbf8f1"; x.fillRect(0, 0, w, h);
  x.fillStyle = "#c8323c"; x.fillRect(0, 0, w, 76); x.fillStyle = "#fff"; x.font = F(900, 46); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("DAY", w / 2, 40);
  x.fillStyle = "#1b1410"; x.font = F(900, day > 9 ? 150 : 180); x.fillText(String(day), w / 2, 190);
  x.strokeStyle = "#1b1410"; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8);
});
/** A wall calendar showing a day number (flips with a little swing when `day` changes at `tFlip`). */
export const Calendar: React.FC<{ p: V3; day: number; s?: number; swing?: number }> = ({ p, day, s = 1, swing = 0 }) => (
  <group position={p} scale={s} rotation={[0, 0, Math.sin(swing * 12) * 0.08 * Math.exp(-swing * 3)]}>
    <mesh position={[0, 0.02, -0.005]}><boxGeometry args={[0.4, 0.46, 0.01]} /><Mat c="#8a5a32" /></mesh>
    <mesh position={[0, 0, 0.002]}><planeGeometry args={[0.36, 0.42]} /><Mat map={calTex(day)} r={0.9} /></mesh>
    <mesh position={[0, 0.24, 0.01]}><sphereGeometry args={[0.014, 10, 8]} /><Mat c="#3a3a3a" /></mesh>
  </group>
);
/** An orange basketball. */
export const Ball: React.FC<{ p?: V3; s?: number; spin?: number }> = ({ p = [0, -0.06, 0.05], s = 1, spin = 0 }) => (
  <group position={p} scale={s} rotation={[spin, spin * 0.3, 0]}>
    <mesh castShadow><sphereGeometry args={[0.075, 28, 20]} /><Mat c="#e8762a" r={0.75} /></mesh>
    {[0, 1].map((i) => <mesh key={i} rotation={[0, i * Math.PI / 2, 0]}><torusGeometry args={[0.0755, 0.0028, 6, 40]} /><Mat c="#2a1a10" /></mesh>)}
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.0755, 0.0028, 6, 40]} /><Mat c="#2a1a10" /></mesh>
  </group>
);
/** Ball height for a dribble: bounce period `per`, from hand height h down to the floor. */
export const dribble = (t: number, h = 0.5, per = 0.5) => { const u = ((t / per) % 1 + 1) % 1; return 0.075 + (h - 0.075) * Math.abs(Math.cos(u * Math.PI)); };
/** A wall hoop with a white backboard and a red rim, net. */
export const Hoop: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => (
  <group position={p} scale={s}>
    <mesh castShadow><boxGeometry args={[0.7, 0.45, 0.03]} /><Mat c="#fbf8f1" r={0.6} /></mesh>
    <mesh position={[0, -0.04, 0.016]}><planeGeometry args={[0.26, 0.2]} /><meshBasicMaterial color="#c8323c" /></mesh>
    <mesh position={[0, -0.04, 0.0175]}><planeGeometry args={[0.22, 0.16]} /><meshBasicMaterial color="#fbf8f1" /></mesh>
    <mesh position={[0, -0.18, 0.17]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.13, 0.01, 8, 32]} /><Mat c="#e8562a" m={0.4} r={0.4} /></mesh>
    <mesh position={[0, -0.27, 0.17]}><cylinderGeometry args={[0.13, 0.09, 0.18, 16, 1, true]} /><meshStandardMaterial color="#ffffff" wireframe /></mesh>
  </group>
);
const bladeTex = (s: string, c: string) => memoTex("blade" + s + c, 512, 110, (x, w, h) => {
  x.fillStyle = c; x.fillRect(0, 0, w, h); x.strokeStyle = "#fbf8f1"; x.lineWidth = 8; x.strokeRect(8, 8, w - 16, h - 16);
  x.fillStyle = "#fbf8f1"; x.font = F(900, 64); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(s, w / 2, h / 2 + 3);
});
/** A street-sign post with two blades. With `face` it becomes the "person" Randy sees: a drawn face on the upper blade,
 *  and a stick arm out to shake his hand (arm 0..1 raises it). */
export const StreetSign: React.FC<{ p: V3; yaw?: number; face?: Expr; arm?: number; shake?: number }> = ({ p, yaw = 0, face, arm = 0, shake = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.95, 0]} castShadow><cylinderGeometry args={[0.025, 0.03, 1.9, 12]} /><Mat c="#8a9298" m={0.6} r={0.4} /></mesh>
    <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.07, 0.09, 0.04, 16]} /><Mat c="#6a7278" m={0.5} r={0.4} /></mesh>
    <mesh position={[0, 1.78, 0.02]} castShadow><boxGeometry args={[0.62, 0.15, 0.02]} /><Mat c="#2f7a4a" /></mesh>
    <mesh position={[0, 1.78, 0.031]}><planeGeometry args={[0.6, 0.13]} /><Mat map={bladeTex("ELM ST", "#2f7a4a")} r={0.6} /></mesh>
    <group position={[0, 1.6, 0]} rotation={[0, Math.PI / 2, 0]}>
      <mesh castShadow><boxGeometry args={[0.62, 0.15, 0.02]} /><Mat c="#2f7a4a" /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[0, 0, k * 0.011]} rotation={[0, k < 0 ? Math.PI : 0, 0]}><planeGeometry args={[0.6, 0.13]} /><Mat map={bladeTex("5TH AVE", "#2f7a4a")} r={0.6} /></mesh>)}
    </group>
    {face && <SignFace e={face} />}
    {face && (
      <group position={[0.03, 1.15, 0.02]} rotation={[0, 0, (-25 - 55 * arm + Math.sin(shake * 18) * 10 * Math.min(1, shake * 4)) * D]}>
        <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, 0.36, 8]} /><Mat c="#141414" r={0.45} /></mesh>
        <mesh position={[0.37, 0, 0]}><sphereGeometry args={[0.035, 14, 12]} /><Mat c="#8a9298" m={0.4} r={0.4} /></mesh>
      </group>
    )}
  </group>
);
const SignFace: React.FC<{ e: Expr }> = ({ e }) => {
  const t = useMemo(() => { const c = document.createElement("canvas"); c.width = Math.round(PHI_SPAN * PX); c.height = Math.round(THETA_SPAN * PX); drawFace(c.getContext("2d")!, e, { skin: "#2f7a4a", brow: "#0e2a18" }); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx; }, [JSON.stringify(e)]);
  return <mesh position={[0, 1.36, 0.04]}><planeGeometry args={[0.42, 0.37]} /><meshBasicMaterial map={t} transparent depthWrite={false} /></mesh>;
};
/** A round face plate behind the sign face (a "head" in Randy's eyes). */
export const SignHead: React.FC<{ p: V3; yaw?: number }> = ({ p, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}><mesh position={[0, 1.36, 0.0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.03, 32]} /><Mat c="#3a8a58" r={0.6} /></mesh></group>
);
/** A street lamp (light on). */
export const StreetLamp: React.FC<{ p: V3 }> = ({ p }) => (
  <group position={p}>
    <mesh position={[0, 1.3, 0]} castShadow><cylinderGeometry args={[0.035, 0.05, 2.6, 10]} /><Mat c="#2a3038" m={0.5} r={0.4} /></mesh>
    <mesh position={[0, 2.62, 0]}><sphereGeometry args={[0.13, 18, 14]} /><Mat c="#fff2c0" e="#ffd880" ei={2} /></mesh>
    <pointLight position={[0, 2.4, 0.3]} intensity={3} distance={6} decay={1.3} color="#ffd8a0" />
  </group>
);

// ---- the pinball machine ----
const glassTex = (lit: number) => memoTex("glass" + lit, 512, 400, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#2a1450"); g.addColorStop(1, "#7a2a8a"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; x.fillStyle = (i % 2) === lit % 2 ? "#ffd84a" : "#ff6a9a"; x.beginPath(); x.arc(w / 2 + Math.cos(a) * 220, h / 2 + Math.sin(a) * 170, 9, 0, 7); x.fill(); }
  x.textAlign = "center"; x.textBaseline = "middle";
  if (lit > 0) { x.shadowColor = "#ffe25a"; x.shadowBlur = 30; x.fillStyle = "#fff6b0"; x.font = F(900, 110); x.fillText("WINNER", w / 2, h / 2); x.shadowBlur = 0; x.strokeStyle = "#a8780a"; x.lineWidth = 3; x.strokeText("WINNER", w / 2, h / 2); }
  else { x.fillStyle = "#ffd84a"; x.font = F(900, 70); x.fillText("MOON", w / 2, h / 2 - 40); x.fillText("SHOT", w / 2, h / 2 + 40); }
});
const fieldTex = () => memoTex("pfield", 256, 512, (x, w, h) => {
  x.fillStyle = "#1e4a8a"; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 10; i++) { x.fillStyle = ["#ffd84a", "#ff6a9a", "#7affc8"][i % 3]; x.beginPath(); x.arc(30 + rnd(i) * 196, 40 + rnd(i * 3) * 320, 10, 0, 7); x.fill(); }
  x.strokeStyle = "#fbf8f1"; x.lineWidth = 6; x.beginPath(); x.moveTo(20, 470); x.lineTo(100, 500); x.moveTo(236, 470); x.lineTo(156, 500); x.stroke();
});
/** A 1960s pinball machine (player at +z): the playfield sloping toward the player, the lit backglass at the back.
 *  `win` 0..1 lights WINNER; `t` blinks the lights; `flip` 0..1 kicks the flippers. */
export const Pinball: React.FC<{ p: V3; yaw?: number; t: number; win?: number; flip?: number; s?: number }> = ({ p, yaw = 0, t, win = 0, flip = 0, s = 1 }) => {
  const lit = win > 0.5 ? 1 + (Math.floor(t * 8) % 2) : 0;
  return (
    <group position={p} rotation={[0, yaw, 0]} scale={s}>
      {[[-0.22, 0.32], [0.22, 0.32], [-0.22, -0.42], [0.22, -0.42]].map(([x, z], i) => <mesh key={i} position={[x, 0.3, z]} castShadow><cylinderGeometry args={[0.022, 0.022, 0.6, 8]} /><Mat c="#c8ccd0" m={0.8} r={0.3} /></mesh>)}
      <group position={[0, 0.72, 0]} rotation={[-6 * D, 0, 0]}>
        <mesh castShadow receiveShadow><boxGeometry args={[0.56, 0.2, 0.95]} /><Mat c="#c8323c" r={0.5} /></mesh>
        <mesh position={[0, 0.101, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.5, 0.88]} /><meshBasicMaterial map={fieldTex()} /></mesh>
        <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.5, 0.88]} /><meshStandardMaterial color="#dff0ff" transparent opacity={0.12} roughness={0.05} /></mesh>
        {[-1, 1].map((k) => <mesh key={k} position={[k * 0.07, 0.115, 0.36]} rotation={[0, k * (0.35 - flip * 0.7), 0]}><boxGeometry args={[0.1, 0.02, 0.022]} /><Mat c="#fbf8f1" /></mesh>)}
        <mesh position={[Math.sin(t * 5) * 0.15, 0.125, Math.cos(t * 3.3) * 0.25]}><sphereGeometry args={[0.018, 14, 10]} /><Mat c="#e8ecf0" m={1} r={0.15} /></mesh>
        {[[-0.12, -0.2], [0.12, -0.2], [0, -0.05]].map(([x, z], i) => <mesh key={i} position={[x, 0.13, z]}><cylinderGeometry args={[0.035, 0.035, 0.04, 16]} /><Mat c={["#ffd84a", "#ff6a9a", "#7affc8"][i]} e={["#ffd84a", "#ff6a9a", "#7affc8"][i]} ei={0.5 + 0.5 * Math.sin(t * 10 + i * 2)} /></mesh>)}
      </group>
      <group position={[0, 1.12, -0.46]}>
        <mesh castShadow><boxGeometry args={[0.58, 0.5, 0.12]} /><Mat c="#c8323c" r={0.5} /></mesh>
        <mesh position={[0, 0.0, 0.061]}><planeGeometry args={[0.52, 0.42]} /><meshBasicMaterial map={glassTex(lit)} /></mesh>
        {win > 0.5 && <pointLight position={[0, 0, 0.5]} intensity={3 * win} distance={2.5} decay={1.3} color="#ffe28a" />}
      </group>
    </group>
  );
};

// ---- the cartoon brain ----
const brainTex = () => memoTex("brain", 512, 512, (x, w, h) => {
  x.fillStyle = "#f4a0b4"; x.fillRect(0, 0, w, h);
  x.strokeStyle = "#c8607a"; x.lineWidth = 9; x.lineCap = "round";
  for (let i = 0; i < 46; i++) { const cx = rnd(i) * w, cy = rnd(i * 3) * h; x.beginPath(); x.moveTo(cx, cy); for (let k = 0; k < 4; k++) x.quadraticCurveTo(cx + (rnd(i + k) - 0.5) * 120, cy + (k + 0.5) * 18, cx + (rnd(i * 7 + k) - 0.5) * 80, cy + (k + 1) * 26); x.stroke(); }
});
const BrainFace: React.FC<{ e: Expr }> = ({ e }) => {
  const t = useMemo(() => { const c = document.createElement("canvas"); c.width = Math.round(PHI_SPAN * PX); c.height = Math.round(THETA_SPAN * PX); drawFace(c.getContext("2d")!, e, { skin: "#f4a0b4", brow: "#7a2a40" }); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx; }, [JSON.stringify(e)]);
  return <mesh position={[0, -0.02, 0.4]} renderOrder={3}><planeGeometry args={[0.62, 0.54]} /><meshBasicMaterial map={t} transparent depthWrite={false} /></mesh>;
};
/** The cartoon brain: two lobes with folds, a face, stick arms; size 1 ~ 0.9 m wide. `armR` raises the right arm (0..1). */
export const Brain: React.FC<{ p?: V3; s?: number; face?: Expr; yaw?: number; armR?: number; armL?: number; squash?: number; hold?: React.ReactNode }> = ({ p = [0, 0, 0], s = 1, face, yaw = 0, armR = 0, armL = 0, squash = 1, hold }) => (
  <group position={p} rotation={[0, yaw, 0]} scale={[s / Math.sqrt(squash), s * squash, s / Math.sqrt(squash)]}>
    {[-1, 1].map((k) => <mesh key={k} position={[k * 0.2, 0, 0]} scale={[0.85, 0.8, 1.0]} castShadow><sphereGeometry args={[0.36, 40, 30]} /><Mat map={brainTex()} r={0.5} /></mesh>)}
    <mesh position={[0, -0.3, 0]} rotation={[0.3, 0, 0]}><cylinderGeometry args={[0.06, 0.09, 0.22, 14]} /><Mat c="#e8889c" r={0.5} /></mesh>
    {face && <BrainFace e={face} />}
    {[-1, 1].map((k) => {
      const a = k > 0 ? armR : armL;
      return (
        <group key={k} position={[k * 0.48, -0.08, 0.1]} rotation={[0, 0, k * (-35 + 120 * a) * D]}>
          <mesh position={[0, -0.12, 0]}><cylinderGeometry args={[0.014, 0.014, 0.24, 8]} /><Mat c="#141414" r={0.45} /></mesh>
          <group position={[0, -0.26, 0]}><mesh><sphereGeometry args={[0.04, 14, 12]} /><Mat c="#f4a0b4" /></mesh>{k > 0 && hold}</group>
        </group>
      );
    })}
  </group>
);
/** A big light switch on a plate (on = 1 up, 0 down). */
export const Switch: React.FC<{ p: V3; on: number; s?: number; yaw?: number }> = ({ p, on, s = 1, yaw = 0 }) => (
  <group position={p} scale={s} rotation={[0, yaw, 0]}>
    <mesh castShadow><boxGeometry args={[0.3, 0.45, 0.04]} /><Mat c="#fbf6ec" r={0.4} /></mesh>
    <mesh position={[0, 0, 0.022]}><boxGeometry args={[0.1, 0.2, 0.01]} /><Mat c="#d8d0c0" r={0.4} /></mesh>
    <group position={[0, 0, 0.03]} rotation={[(on > 0.5 ? -1 : 1) * 30 * D, 0, 0]}><mesh position={[0, 0, 0.03]}><boxGeometry args={[0.06, 0.12, 0.06]} /><Mat c={on > 0.5 ? "#ffe25a" : "#8a8a8a"} e="#ffd84a" ei={on > 0.5 ? 0.4 : 0} r={0.4} /></mesh></group>
    {[-0.17, 0.17].map((y) => <mesh key={y} position={[0, y, 0.022]}><circleGeometry args={[0.012, 10]} /><meshBasicMaterial color="#9a9a9a" /></mesh>)}
  </group>
);
/** A wooden clipboard with a sheet (hand frame). */
export const Clipboard: React.FC<{ p?: V3 }> = ({ p = [0, -0.06, 0.05] }) => (
  <group position={p} rotation={[-0.4, 0, 0]}>
    <mesh castShadow><boxGeometry args={[0.16, 0.22, 0.01]} /><Mat c="#a8743a" /></mesh>
    <mesh position={[0, -0.01, 0.006]}><planeGeometry args={[0.14, 0.18]} /><Mat c="#fbf8f1" /></mesh>
    <mesh position={[0, 0.1, 0.01]}><boxGeometry args={[0.06, 0.03, 0.012]} /><Mat c="#c8ccd0" m={0.8} r={0.3} /></mesh>
  </group>
);
const pageTex = (side: 0 | 1) => memoTex("page" + side, 512, 640, (x, w, h) => {
  x.fillStyle = "#fbf3dc"; x.fillRect(0, 0, w, h); x.fillStyle = "#1b1410"; x.textAlign = "center"; x.textBaseline = "middle";
  if (side === 0) {
    x.font = F(900, 46); x.fillText("LONGEST", w / 2, 90); x.fillText("TIME AWAKE", w / 2, 145);
    x.strokeStyle = "#c8a040"; x.lineWidth = 6; x.beginPath(); x.moveTo(60, 185); x.lineTo(w - 60, 185); x.stroke();
    x.fillStyle = "#c8a040"; x.beginPath(); x.arc(w / 2, 330, 95, 0, 7); x.fill(); x.fillStyle = "#fbf3dc"; x.font = F(900, 90); x.fillText("★", w / 2, 336);
    x.fillStyle = "#6a5a40"; for (let i = 0; i < 5; i++) x.fillRect(70, 470 + i * 28, w - 140 - (i % 2) * 80, 10);
  } else {
    x.font = F(900, 54); x.fillText("RANDY", w / 2, 110); x.fillText("GARDNER", w / 2, 172);
    x.fillStyle = "#c8323c"; x.font = F(900, 150); x.fillText("264", w / 2, 330); x.font = F(900, 60); x.fillText("HOURS", w / 2, 435);
    x.fillStyle = "#6a5a40"; for (let i = 0; i < 4; i++) x.fillRect(70, 500 + i * 28, w - 140 - (i % 2) * 80, 10);
  }
});
/** The big record book, open (open 1) or shut (0), on a lectern at p, facing +z. */
export const RecordBook: React.FC<{ p: V3; open?: number; s?: number; glow?: number }> = ({ p, open = 1, s = 1, glow = 0 }) => {
  const a = (1 - open) * Math.PI * 0.98;
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.4, -0.05]} castShadow><cylinderGeometry args={[0.08, 0.14, 0.8, 16]} /><Mat c="#6a3a22" r={0.5} /></mesh>
      <group position={[0, 0.82, 0]} rotation={[0.55, 0, 0]}>
        {/* left cover + page (fixed) */}
        <mesh position={[-0.22, 0, 0]} castShadow><boxGeometry args={[0.44, 0.02, 0.56]} /><Mat c="#1e3a7a" r={0.5} /></mesh>
        <mesh position={[-0.21, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.41, 0.52]} /><Mat map={pageTex(0)} r={0.9} e="#fff2c0" ei={glow * 0.3} /></mesh>
        {/* right cover + page (swings shut around the spine) */}
        <group rotation={[0, 0, a]}>
          <mesh position={[0.22, 0, 0]} castShadow><boxGeometry args={[0.44, 0.02, 0.56]} /><Mat c="#1e3a7a" r={0.5} /></mesh>
          <mesh position={[0.21, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.41, 0.52]} /><Mat map={pageTex(1)} r={0.9} e="#fff2c0" ei={glow * 0.3} /></mesh>
          <mesh position={[0.22, -0.012, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[0.3, 0.12]} /><meshBasicMaterial color="#c8a040" side={THREE.DoubleSide} /></mesh>
        </group>
      </group>
      {glow > 0 && <pointLight position={[0, 1.3, 0.5]} intensity={2 * glow} distance={3} color="#fff0c0" />}
    </group>
  );
};
/** A big rubber stamp coming down (down 0 = raised high, 1 = on the page). */
export const Stamp: React.FC<{ p: V3; down: number }> = ({ p, down }) => (
  <group position={[p[0], p[1] + (1 - down) * 0.7, p[2]]}>
    <mesh position={[0, 0.03, 0]} castShadow><boxGeometry args={[0.3, 0.06, 0.2]} /><Mat c="#c8323c" r={0.6} /></mesh>
    <mesh position={[0, 0.12, 0]} castShadow><cylinderGeometry args={[0.04, 0.05, 0.14, 14]} /><Mat c="#6a3a22" r={0.5} /></mesh>
    <mesh position={[0, 0.23, 0]} castShadow><sphereGeometry args={[0.08, 18, 14]} /><Mat c="#6a3a22" r={0.5} /></mesh>
  </group>
);
/** A cot / bed with a pillow and a blanket (head end at -z). */
export const Cot: React.FC<{ p: V3; yaw?: number }> = ({ p, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.3, 0]} castShadow receiveShadow><boxGeometry args={[0.75, 0.14, 1.55]} /><Mat c="#f4f2ec" r={0.85} /></mesh>
    <mesh position={[0, 0.17, 0]}><boxGeometry args={[0.78, 0.12, 1.58]} /><Mat c="#8a5a32" r={0.6} /></mesh>
    {[[-0.35, -0.74], [0.35, -0.74], [-0.35, 0.74], [0.35, 0.74]].map(([x, z], i) => <mesh key={i} position={[x, 0.06, z]}><boxGeometry args={[0.06, 0.12, 0.06]} /><Mat c="#6a4428" /></mesh>)}
    <mesh position={[0, 0.5, -0.8]} castShadow><boxGeometry args={[0.78, 0.55, 0.06]} /><Mat c="#8a5a32" r={0.6} /></mesh>
    <mesh position={[0, 0.42, -0.58]} rotation={[0.2, 0, 0]} castShadow><boxGeometry args={[0.52, 0.09, 0.28]} /><Mat c="#ffffff" r={0.9} /></mesh>
  </group>
);
/** A school desk with a chair (pupil sits at z ~ +0.25 facing -z... we turn the desk to face the camera). */
export const Desk: React.FC<{ p: V3; yaw?: number }> = ({ p, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.5, 0.15]} castShadow receiveShadow><boxGeometry args={[0.62, 0.04, 0.4]} /><Mat c="#c89a5a" r={0.6} /></mesh>
    {[[-0.28, -0.02], [0.28, -0.02], [-0.28, 0.32], [0.28, 0.32]].map(([x, z], i) => <mesh key={i} position={[x, 0.25, z]}><cylinderGeometry args={[0.015, 0.015, 0.5, 8]} /><Mat c="#3a4a5a" m={0.5} r={0.4} /></mesh>)}
    <mesh position={[0.05, 0.525, 0.18]} rotation={[-Math.PI / 2, 0, 0.2]}><planeGeometry args={[0.2, 0.26]} /><Mat c="#fbf8f1" /></mesh>
  </group>
);

// ================= LOW-DETAIL FOLK (crowds) =================
const FW = Math.round(PHI_SPAN * PX), FH = Math.round(THETA_SPAN * PX);
const miniBody = (() => { let g: THREE.BufferGeometry | null = null; return () => g ?? (g = new THREE.CapsuleGeometry(0.155, 0.17, 6, 16)); })();
const SK = ["#f7dcc8", "#efc6a6", "#e2ae86", "#cf9468", "#b67a4f", "#99603b", "#7c4a2d", "#663b24"];
export const MiniFolk: React.FC<{ pos: V3; yaw?: number; body: string; skin: number; hair?: string; expr?: Expr; cheer?: number; scale?: number }> = ({ pos, yaw = 0, body, skin, hair = "#1e1410", expr = EXPR.happy, cheer = 0, scale = 1 }) => {
  const sk = SK[skin];
  const face = useMemo(() => {
    const c = document.createElement("canvas"); c.width = FW; c.height = FH; drawFace(c.getContext("2d")!, expr, { skin: sk, brow: hair });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [JSON.stringify(expr), sk, hair]);
  return (
    <group position={[pos[0], pos[1] + Math.max(0, cheer) * 0.05, pos[2]]} rotation={[0, yaw, 0]} scale={scale}>
      {[-0.06, 0.06].map((x) => <mesh key={x} position={[x, 0.17, 0]}><cylinderGeometry args={[0.013, 0.013, 0.34, 6]} /><Mat c="#141414" r={0.45} /></mesh>)}
      <group position={[0, 0.3, 0]}>
        <mesh position={[0, 0.2, 0]} geometry={miniBody()} castShadow><Mat c={body} r={0.8} /></mesh>
        {[-1, 1].map((k) => <mesh key={k} position={[k * 0.19, 0.38 + 0.1 * Math.max(0, cheer), 0]} rotation={[0, 0, k * (0.3 + 2.4 * Math.max(0, cheer))]}><cylinderGeometry args={[0.012, 0.012, 0.26, 6]} /><Mat c="#141414" r={0.45} /></mesh>)}
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

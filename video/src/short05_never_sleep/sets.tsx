// Short 5 sets (pieces from Short 4): Randy's 1960s garage den (night or morning), the night street, the football-field
// daydream, the arcade, the violet "You see" stage, the classroom, the record stage. Every set sits at the origin; one set
// per shot. Dark grades keep a face fill light (owner's notes).
import React, { useMemo } from "react";
import * as THREE from "three";
import { Clock, Hoop, Mat, MiniFolk, MINIS, memoTex, rnd as rnd5, StreetLamp } from "./cast";

export type Grade = "day" | "warm" | "dim" | "violet";
type V3 = [number, number, number];
export const tex = (key: string, w: number, h: number, draw: (x: CanvasRenderingContext2D, w: number, h: number) => void, rep?: [number, number]) => {
  const t = memoTex(key + (rep ? rep.join("x") : ""), w, h, draw);
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  return t;
};
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const F = (w: number, sz: number) => `${w} ${sz}px Montserrat, sans-serif`;

// ---------- lights ----------
const shadowP = (sh: number) => ({ "shadow-mapSize": [2048, 2048], "shadow-camera-left": -sh, "shadow-camera-right": sh, "shadow-camera-top": sh, "shadow-camera-bottom": -sh, "shadow-bias": -0.0004 } as any);
/** Lights for a grade; `fill` puts a warm face light in front of a character (always on in dim and violet). */
export const Lights: React.FC<{ g: Grade; fill?: V3; k?: number }> = ({ g, fill, k = 1 }) => {
  if (g === "violet") return (<>
    <hemisphereLight args={["#b8a0ff", "#3a2860", 1.1]} />
    <directionalLight position={[3, 7, 5]} intensity={0.9} color="#a890ff" castShadow {...shadowP(6)} />
    <directionalLight position={[-2, 2, 6]} intensity={1.0} color="#ffe6d0" />
    {fill && <pointLight position={[fill[0], fill[1] + 0.5, fill[2] + 0.9]} intensity={4} distance={6} decay={1.2} color="#fff0e0" />}
  </>);
  if (g === "dim") return (<>
    <hemisphereLight args={["#5a6a9a", "#2a2030", 0.75]} />
    <directionalLight position={[-3, 5, 4]} intensity={0.6} color="#9ab0ff" castShadow {...shadowP(6)} />
    <pointLight position={[fill?.[0] ?? 0, (fill?.[1] ?? 0.8) + 0.6, (fill?.[2] ?? 0) + 1.0]} intensity={3.2} distance={5} decay={1.2} color="#ffd8a8" />
  </>);
  const warm = g === "warm";
  return (<>
    <hemisphereLight args={warm ? ["#fff0d8", "#7a5a40", 1.15 * k] : ["#e4f0ff", "#8a6a4a", 1.1 * k]} />
    <directionalLight position={[3, 7, 6]} intensity={(warm ? 1.9 : 2.2) * k} color={warm ? "#ffe0b0" : "#fff4e0"} castShadow {...shadowP(7)} />
    <directionalLight position={[-3, 2, 5]} intensity={0.5 * k} color="#d8e4ff" />
    {fill && <pointLight position={[fill[0], fill[1] + 0.5, fill[2] + 0.9]} intensity={1.6 * k} distance={4} decay={1.4} color="#fff0e0" />}
  </>);
};

// ---------- shared pieces ----------
const wallpaper = (base: string, dot: string) => tex("wp" + base, 512, 512, (x, w, h) => {
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = dot; x.beginPath(); x.ellipse(i * 64 + (j % 2) * 32 + 16, j * 64 + 32, 7, 11, 0, 0, 7); x.fill(); }
  for (let i = 0; i < 8; i++) { x.fillStyle = "rgba(0,0,0,0.04)"; x.fillRect(i * 64 + 60, 0, 3, h); }
}, [4, 2]);
const planks = (c1: string, c2: string, key: string) => tex("pl" + key, 512, 512, (x, w, h) => {
  for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? c1 : c2; x.fillRect(0, i * 64, w, 64); x.fillStyle = "rgba(0,0,0,0.18)"; x.fillRect(0, i * 64 + 61, w, 3); for (let k = 0; k < 3; k++) { x.fillStyle = "rgba(60,30,10,0.12)"; x.fillRect(rnd(i * 7 + k) * w, i * 64 + 8 + k * 16, 80 + rnd(i + k) * 120, 3); } x.fillStyle = "rgba(0,0,0,0.15)"; x.fillRect(rnd(i * 3) * w, i * 64, 3, 64); }
}, [3, 3]);
const tiles = (a: string, b: string) => tex("tl" + a + b, 256, 256, (x, w, h) => { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { x.fillStyle = (i + j) % 2 ? a : b; x.fillRect(i * 64, j * 64, 64, 64); } x.strokeStyle = "rgba(0,0,0,0.12)"; x.lineWidth = 2; for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); } }, [6, 6]);
/** A room shell: floor, back wall at z = back, side walls at ±side (open to +z), ceiling-less. */
const Room: React.FC<{ floor: THREE.Texture; wall: THREE.Texture | string; back?: number; side?: number; hgt?: number; wallC?: string }> = ({ floor, wall, back = -2.2, side = 3.2, hgt = 3.2 }) => {
  const wm = typeof wall === "string" ? <Mat c={wall} r={0.9} /> : <Mat map={wall} r={0.9} />;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]} receiveShadow><planeGeometry args={[side * 2 + 2, 9]} /><Mat map={floor} r={0.85} /></mesh>
      <mesh position={[0, hgt / 2, back]} receiveShadow>{<planeGeometry args={[side * 2 + 2, hgt]} />}{wm}</mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[k * side, hgt / 2, back + 3.5]} rotation={[0, -k * Math.PI / 2, 0]} receiveShadow><planeGeometry args={[7, hgt]} />{wm}</mesh>)}
      <mesh position={[0, 0.06, back + 0.01]}><boxGeometry args={[side * 2, 0.12, 0.02]} /><Mat c="#5a3a22" r={0.6} /></mesh>
    </>
  );
};
const Window: React.FC<{ p: V3; w?: number; h?: number; night?: boolean; sky?: string }> = ({ p, w = 0.9, h = 0.8, sky = "#a8d4f0" }) => (
  <group position={p}>
    <mesh><boxGeometry args={[w + 0.1, h + 0.1, 0.04]} /><Mat c="#f2ead8" r={0.6} /></mesh>
    <mesh position={[0, 0, 0.022]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={windowTex(sky)} /></mesh>
    <mesh position={[0, 0, 0.03]}><boxGeometry args={[0.03, h, 0.02]} /><Mat c="#f2ead8" /></mesh>
    <mesh position={[0, 0, 0.03]}><boxGeometry args={[w, 0.03, 0.02]} /><Mat c="#f2ead8" /></mesh>
  </group>
);
const windowTex = (sky: string) => tex("win" + sky, 256, 256, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, sky); g.addColorStop(1, "#e8f4fa"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.fillStyle = "rgba(255,255,255,0.9)"; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(50 + i * 70, 70 + i * 20, 22, 0, 7); x.arc(75 + i * 70, 64 + i * 20, 26, 0, 7); x.fill(); }
  x.fillStyle = "#7aa860"; x.beginPath(); x.moveTo(0, h); x.quadraticCurveTo(w * 0.3, h * 0.65, w * 0.6, h * 0.8); x.quadraticCurveTo(w * 0.85, h * 0.7, w, h * 0.78); x.lineTo(w, h); x.fill();
});
const posterTex = (lines: string[], bg: string, fg: string) => tex("po" + lines.join("|") + bg, 256, 340, (x, w, h) => {
  x.fillStyle = bg; x.fillRect(0, 0, w, h); x.strokeStyle = fg; x.lineWidth = 8; x.strokeRect(10, 10, w - 20, h - 20);
  x.fillStyle = fg; x.textAlign = "center"; lines.forEach((l, i) => { x.font = F(900, i ? 26 : 40); x.fillText(l, w / 2, 70 + i * 48); });
  x.strokeStyle = fg; x.lineWidth = 5; x.beginPath(); x.moveTo(30, 270); for (let i = 0; i < 14; i++) x.lineTo(30 + i * 14, 270 + (i % 4 === 2 ? -40 : i % 4 === 3 ? 20 : 0)); x.stroke();
});
const Poster: React.FC<{ p: V3; lines: string[]; bg?: string; fg?: string; s?: number; r?: number }> = ({ p, lines, bg = "#f2e2b8", fg = "#7a2a2a", s = 1, r = 0 }) => (
  <mesh position={p} rotation={[0, 0, r]} scale={s}><planeGeometry args={[0.45, 0.6]} /><Mat map={posterTex(lines, bg, fg)} r={0.9} /></mesh>
);
const Shelf: React.FC<{ p: V3; w?: number; children?: React.ReactNode }> = ({ p, w = 1.2, children }) => (
  <group position={p}>
    <mesh castShadow receiveShadow><boxGeometry args={[w, 0.035, 0.24]} /><Mat c="#8a5a32" r={0.6} /></mesh>
    {children}
  </group>
);
const Jar: React.FC<{ p: V3; c: string }> = ({ p, c }) => (
  <group position={p}><mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.05, 0.05, 0.14, 14]} /><Mat c="#d8e8f0" r={0.1} o={0.55} /></mesh><mesh position={[0, 0.045, 0]}><cylinderGeometry args={[0.045, 0.045, 0.08, 14]} /><Mat c={c} r={0.6} /></mesh><mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.052, 0.052, 0.02, 14]} /><Mat c="#c8a050" m={0.6} r={0.3} /></mesh></group>
);
const Lamp: React.FC<{ p: V3; on?: number }> = ({ p, on = 1 }) => (
  <group position={p}>
    <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.07, 0.08, 0.04, 16]} /><Mat c="#2a5a4a" r={0.4} /></mesh>
    <mesh position={[0.04, 0.2, 0]} rotation={[0, 0, -0.3]}><cylinderGeometry args={[0.01, 0.01, 0.36, 8]} /><Mat c="#2a5a4a" r={0.4} /></mesh>
    <mesh position={[0.1, 0.36, 0.04]} rotation={[0.6, 0, 0.3]}><coneGeometry args={[0.09, 0.12, 20, 1, true]} /><Mat c="#2a5a4a" r={0.4} side={THREE.DoubleSide} /></mesh>
    {on > 0 && <pointLight position={[0.1, 0.3, 0.1]} intensity={1.6 * on} distance={2.5} decay={1.4} color="#ffd8a0" />}
  </group>
);

// ---------- 1. Wilson's workshop (1956) ----------

// ---------- set dressing ----------
const pennantTex = (s: string, bg: string) => tex("pen" + s, 512, 160, (x, w, h) => { x.fillStyle = bg; x.beginPath(); x.moveTo(0, 0); x.lineTo(w, h / 2); x.lineTo(0, h); x.fill(); x.fillStyle = "#fbf8f1"; x.font = F(900, 52); x.textBaseline = "middle"; x.fillText(s, 26, h / 2 + 2); });
const Pennant: React.FC<{ p: V3; s: string; bg?: string; r?: number }> = ({ p, s, bg = "#c8323c", r = -0.08 }) => (
  <mesh position={p} rotation={[0, 0, r]}><planeGeometry args={[0.8, 0.25]} /><meshBasicMaterial map={pennantTex(s, bg)} transparent /></mesh>
);
const Can: React.FC<{ p: V3; c: string; s?: number }> = ({ p, c, s = 1 }) => (
  <group position={p} scale={s}><mesh position={[0, 0.07, 0]} castShadow><cylinderGeometry args={[0.055, 0.055, 0.14, 16]} /><Mat c={c} r={0.5} /></mesh><mesh position={[0, 0.142, 0]}><cylinderGeometry args={[0.057, 0.057, 0.008, 16]} /><Mat c="#c8ccd0" m={0.7} r={0.3} /></mesh></group>
);
const Tree5: React.FC<{ p: V3; s?: number; c?: string }> = ({ p, s = 1, c = "#3a6a4a" }) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.6, 0]} castShadow><cylinderGeometry args={[0.08, 0.12, 1.2, 10]} /><Mat c="#4a3424" /></mesh>
    {[[0, 1.5, 0, 0.6], [0.35, 1.3, 0.1, 0.45], [-0.35, 1.35, 0, 0.45]].map(([x, y, z, r], i) => <mesh key={i} position={[x, y, z]} castShadow><sphereGeometry args={[r, 18, 14]} /><Mat c={c} r={0.9} /></mesh>)}
  </group>
);
const Car: React.FC<{ p: V3; yaw?: number; c?: string }> = ({ p, yaw = 0, c = "#5ab8c8" }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh position={[0, 0.32, 0]} castShadow><boxGeometry args={[1.9, 0.34, 0.8]} /><Mat c={c} r={0.35} m={0.2} /></mesh>
    <mesh position={[-0.1, 0.6, 0]} castShadow><boxGeometry args={[1.0, 0.3, 0.72]} /><Mat c="#fbf8f1" r={0.35} /></mesh>
    {[-0.6, 0.4].map((x) => <mesh key={x} position={[x - 0.1, 0.6, 0.365]}><planeGeometry args={[0.4, 0.22]} /><meshBasicMaterial color="#2a3a5a" /></mesh>)}
    {[[-0.6, 0.4], [0.6, 0.4], [-0.6, -0.4], [0.6, -0.4]].map(([x, z], i) => <mesh key={i} position={[x, 0.16, z]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.16, 0.16, 0.1, 20]} /><Mat c="#1e1e22" r={0.6} /></mesh>)}
    <mesh position={[0.96, 0.34, 0.25]}><sphereGeometry args={[0.06, 12, 10]} /><Mat c="#fff2c0" e="#ffd880" ei={1.2} /></mesh>
    <mesh position={[0, 0.18, 0.41]}><boxGeometry args={[1.95, 0.05, 0.02]} /><Mat c="#d8dce0" m={0.8} r={0.25} /></mesh>
  </group>
);
const Fence: React.FC<{ p: V3; n?: number }> = ({ p, n = 8 }) => (
  <group position={p}>
    {Array.from({ length: n }, (_, i) => <mesh key={i} position={[i * 0.18, 0.28, 0]} castShadow><boxGeometry args={[0.1, 0.56, 0.03]} /><Mat c="#f2ede0" r={0.7} /></mesh>)}
    {[0.18, 0.4].map((y) => <mesh key={y} position={[(n - 1) * 0.09, y, -0.025]}><boxGeometry args={[n * 0.18, 0.05, 0.02]} /><Mat c="#e2dccc" /></mesh>)}
  </group>
);

// ---------- 1. Randy's garage den (1963, San Diego): the science-fair poster, the day calendar, the clock, a hoop, a cot ----------
const nightWin = () => tex("nwin", 256, 256, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#141a40"); g.addColorStop(1, "#3a3a7a"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,250,220,${0.4 + rnd(i) * 0.6})`; x.fillRect(rnd(i * 3) * w, rnd(i * 5) * h * 0.7, 3, 3); }
  x.fillStyle = "#fff6d0"; x.beginPath(); x.arc(w * 0.7, h * 0.3, 34, 0, 7); x.fill(); x.fillStyle = "#141a40"; x.beginPath(); x.arc(w * 0.7 + 16, h * 0.3 - 8, 30, 0, 7); x.fill();
  x.fillStyle = "#1a2a2a"; x.beginPath(); x.moveTo(0, h); x.lineTo(0, h * 0.8); x.lineTo(w * 0.3, h * 0.72); x.lineTo(w * 0.32, h * 0.6); x.lineTo(w * 0.36, h * 0.72); x.lineTo(w, h * 0.82); x.lineTo(w, h); x.fill();
});
const WinN: React.FC<{ p: V3; night: boolean; w?: number; h?: number }> = ({ p, night, w = 0.9, h = 0.8 }) => night ? (
  <group position={p}>
    <mesh><boxGeometry args={[w + 0.1, h + 0.1, 0.04]} /><Mat c="#f2ead8" r={0.6} /></mesh>
    <mesh position={[0, 0, 0.022]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={nightWin()} /></mesh>
    <mesh position={[0, 0, 0.03]}><boxGeometry args={[0.03, h, 0.02]} /><Mat c="#f2ead8" /></mesh>
    <mesh position={[0, 0, 0.03]}><boxGeometry args={[w, 0.03, 0.02]} /><Mat c="#f2ead8" /></mesh>
  </group>
) : <Window p={p} w={w} h={h} sky="#ffd8a0" />;
const fairTex = () => tex("fair", 512, 680, (x, w, h) => {
  x.fillStyle = "#f6efd8"; x.fillRect(0, 0, w, h); x.strokeStyle = "#2a3a5a"; x.lineWidth = 14; x.strokeRect(12, 12, w - 24, h - 24);
  x.fillStyle = "#c8323c"; x.textAlign = "center"; x.textBaseline = "middle";
  ["HOW LONG", "CAN YOU", "STAY", "AWAKE?"].forEach((l, i) => { x.font = F(900, i === 3 ? 96 : 70); x.fillStyle = i === 3 ? "#c8323c" : "#2a3a5a"; x.fillText(l, w / 2, 90 + i * 90 + (i === 3 ? 12 : 0)); });
  // a little eye with a clock pupil
  x.fillStyle = "#fff"; x.strokeStyle = "#1b1410"; x.lineWidth = 8; x.beginPath(); x.ellipse(w / 2, 530, 140, 70, 0, 0, 7); x.fill(); x.stroke();
  x.fillStyle = "#2a3a5a"; x.beginPath(); x.arc(w / 2, 530, 52, 0, 7); x.fill(); x.strokeStyle = "#fff"; x.lineWidth = 7; x.beginPath(); x.moveTo(w / 2, 530); x.lineTo(w / 2, 495); x.moveTo(w / 2, 530); x.lineTo(w / 2 + 26, 540); x.stroke();
  x.fillStyle = "#1b1410"; x.font = F(800, 30); x.fillText("SCIENCE FAIR  1963-64", w / 2, 640);
});
export const FairPoster: React.FC<{ p: V3; s?: number; r?: number }> = ({ p, s = 1, r = 0 }) => (
  <mesh position={p} rotation={[0, 0, r]} scale={s}><planeGeometry args={[0.75, 1.0]} /><Mat map={fairTex()} r={0.9} /></mesh>
);
const pegboard = () => tex("peg", 256, 256, (x, w, h) => { x.fillStyle = "#c8a070"; x.fillRect(0, 0, w, h); x.fillStyle = "rgba(60,30,10,0.35)"; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.beginPath(); x.arc(16 + i * 32, 16 + j * 32, 4, 0, 7); x.fill(); } }, [5, 3]);
export const GARAGE = { poster: [0.95, 1.45, -1.58] as V3, cal: [-0.2, 1.62, -1.57] as V3, clock: [-0.95, 1.85, -1.56] as V3, hoop: [1.75, 2.15, -1.52] as V3, cot: [-1.75, 0, -0.6] as V3 };
/** The den: back wall at z = -1.6. `night` sets the grade and window; `fill` is the face light; `t` drives the clock; `spin` its speed. */
export const Garage: React.FC<{ children?: React.ReactNode; night?: boolean; fill?: V3; t?: number; spin?: number; cot?: boolean }> = ({ children, night = true, fill = [0, 0.9, 0], t = 0, spin = 0.4, cot = true }) => (
  <group>
    {night ? (<>
      <hemisphereLight args={["#ffe2c0", "#3a2a40", 0.75]} />
      <directionalLight position={[2.5, 5, 5]} intensity={1.1} color="#ffd8a8" castShadow {...shadowP(6)} />
      <pointLight position={[0, 2.5, 0.3]} intensity={3.5} distance={6} decay={1.2} color="#ffd890" />
      <pointLight position={[fill[0], fill[1] + 0.5, fill[2] + 1.0]} intensity={2.4} distance={4} decay={1.3} color="#fff0e0" />
    </>) : <Lights g="warm" fill={fill} />}
    <Room floor={planks("#8a7a6a", "#7e6e5e", "gf")} wall={pegboard()} back={-1.6} side={2.6} />
    <WinN p={[-1.5, 1.4, -1.58]} night={night} w={0.75} h={0.65} />
    <FairPoster p={GARAGE.poster} />
    <Clock p={GARAGE.clock} t={t} spin={spin} s={0.75} />
    {/* the bare bulb */}
    <mesh position={[0, 2.62, 0.2]}><cylinderGeometry args={[0.004, 0.004, 0.5, 4]} /><Mat c="#2a2a2a" /></mesh>
    <mesh position={[0, 2.35, 0.2]}><sphereGeometry args={[0.06, 14, 10]} /><Mat c="#fff2c0" e="#ffd070" ei={night ? 1.6 : 0.4} /></mesh>
    {/* a workbench at the left back with a radio */}
    <mesh position={[-0.55, 0.42, -1.3]} castShadow receiveShadow><boxGeometry args={[1.1, 0.06, 0.5]} /><Mat c="#a8743a" r={0.6} /></mesh>
    {[[-1.05, -1.5], [-0.05, -1.5], [-1.05, -1.1], [-0.05, -1.1]].map(([x, z], i) => <mesh key={i} position={[x, 0.2, z]}><boxGeometry args={[0.05, 0.4, 0.05]} /><Mat c="#7a4a22" /></mesh>)}
    <group position={[-0.75, 0.45, -1.35]}><mesh position={[0, 0.1, 0]} castShadow><boxGeometry args={[0.32, 0.2, 0.16]} /><Mat c="#c87a3a" r={0.4} /></mesh><mesh position={[-0.06, 0.1, 0.081]}><circleGeometry args={[0.06, 20]} /><Mat c="#4a3a2a" /></mesh><mesh position={[0.09, 0.12, 0.082]}><planeGeometry args={[0.1, 0.06]} /><Mat c="#f2e2b8" /></mesh></group>
    <Hoop p={GARAGE.hoop} s={0.8} />
    {cot && <group position={GARAGE.cot}><mesh position={[0, 0.3, 0]} castShadow receiveShadow><boxGeometry args={[0.7, 0.12, 1.4]} /><Mat c="#3a5a8a" r={0.85} /></mesh><mesh position={[0, 0.15, 0]}><boxGeometry args={[0.72, 0.18, 1.42]} /><Mat c="#6a4428" /></mesh><mesh position={[0, 0.4, -0.52]} castShadow><boxGeometry args={[0.5, 0.08, 0.26]} /><Mat c="#fbf8f1" r={0.9} /></mesh></group>}
    {/* a braided rug, a shelf of paint cans, pennants, tyres, a lamp */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.004, -0.35]} receiveShadow><circleGeometry args={[0.95, 40]} /><Mat c="#c8783a" r={0.95} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, 0.005, -0.35]}><ringGeometry args={[0.6, 0.7, 40]} /><Mat c="#e8b860" r={0.95} /></mesh>
    <mesh position={[-0.5, 1.02, -1.5]} castShadow><boxGeometry args={[1.0, 0.035, 0.2]} /><Mat c="#8a5a32" /></mesh>
    {[["#c8323c", -0.85], ["#3a6ab0", -0.68], ["#e8c040", -0.51], ["#3f7a4a", -0.34], ["#fbf8f1", -0.17]].map(([c, x], i) => <Can key={i} p={[x as number, 1.04, -1.5]} c={c as string} />)}
    <Pennant p={[0.35, 2.2, -1.57]} s="SAN DIEGO" bg="#2a4a8a" />
    <Pennant p={[-1.3, 2.25, -1.57]} s="GO TEAM" bg="#c8323c" r={0.06} />
    {[0, 1, 2].map((i) => <mesh key={i} position={[2.25, 0.09 + i * 0.16, -1.15]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[0.22, 0.08, 10, 24]} /><Mat c="#2a2a2e" r={0.8} /></mesh>)}
    {/* a stack of comics and a soda crate */}
    <mesh position={[1.3, 0.15, -1.2]} castShadow><boxGeometry args={[0.45, 0.3, 0.32]} /><Mat c="#c8323c" r={0.7} /></mesh>
    {children}
  </group>
);

// ---------- 2. The night street ----------
const houseTex = (k: number) => tex("nh" + k, 256, 256, (x, w, h) => {
  x.fillStyle = ["#6a7aa8", "#8a6a9a", "#5a8a8a", "#9a7a6a"][k % 4]; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 2; i++) { x.fillStyle = rnd(k * 5 + i) > 0.4 ? "#ffd890" : "#2a3050"; x.fillRect(40 + i * 110, 70, 66, 70); x.strokeStyle = "#f2ead8"; x.lineWidth = 6; x.strokeRect(40 + i * 110, 70, 66, 70); }
  x.fillStyle = "#3a2a2a"; x.fillRect(110, 170, 40, 86);
});
const nightSky = () => tex("nsky", 1024, 512, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0e1230"); g.addColorStop(1, "#3a3a78"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 200; i++) { x.fillStyle = `rgba(255,250,230,${0.3 + rnd(i * 2) * 0.7})`; x.fillRect(rnd(i * 13) * w, rnd(i * 17) * h * 0.8, 2, 2); }
});
export const NightStreet: React.FC<{ children?: React.ReactNode; fill?: V3 }> = ({ children, fill = [0, 0.8, 0] }) => (
  <group>
    <hemisphereLight args={["#8a9ae0", "#2a2030", 0.8]} />
    <directionalLight position={[-3, 6, 4]} intensity={0.7} color="#a8b8ff" castShadow {...shadowP(6)} />
    <pointLight position={[fill[0], fill[1] + 0.6, fill[2] + 1.1]} intensity={3.4} distance={5} decay={1.2} color="#ffe0b8" />
    <mesh position={[0, 8, 0]}><sphereGeometry args={[60, 24, 12]} /><meshBasicMaterial map={nightSky()} side={THREE.BackSide} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]} receiveShadow><planeGeometry args={[40, 40]} /><Mat c="#8a8a98" r={0.9} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 2.6]}><planeGeometry args={[40, 2.6]} /><Mat c="#3a3c48" r={0.9} /></mesh>
    {Array.from({ length: 6 }, (_, i) => (
      <group key={i} position={[-7.5 + i * 3, 0, -3.6]}>
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow><boxGeometry args={[2.2, 1.8, 1.6]} /><Mat map={houseTex(i)} r={0.85} /></mesh>
        <mesh position={[0, 2.1, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[1.2, 1.2, 1.65]} /><Mat c="#3a2a3a" r={0.8} /></mesh>
      </group>
    ))}
    <Fence p={[-3.6, 0, -2.5]} n={14} />
    <Fence p={[0.9, 0, -2.5]} n={14} />
    <Tree5 p={[-2.5, 0, -2.2]} s={1.1} /><Tree5 p={[3.6, 0, -2.3]} s={1.2} c="#2f5a40" />
    <Car p={[-1.8, 0, 2.3]} c="#e8a0b0" /><Car p={[2.6, 0, 2.4]} yaw={Math.PI} />
    <group position={[1.6, 0, -1.6]}><mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.025, 0.025, 0.9, 8]} /><Mat c="#4a3424" /></mesh><mesh position={[0, 0.95, 0]} castShadow><boxGeometry args={[0.18, 0.16, 0.32]} /><Mat c="#2a4a8a" r={0.4} /></mesh><mesh position={[0.1, 1.02, 0.06]}><boxGeometry args={[0.02, 0.12, 0.05]} /><Mat c="#c8323c" /></mesh></group>
    <StreetLamp p={[-1.6, 0, -1.2]} />
    <StreetLamp p={[2.6, 0, -1.4]} />
    {children}
  </group>
);

// ---------- 3. The football-field daydream (golden light, a cheering crowd in the stands) ----------
const turf = () => tex("turf", 512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? "#4f9a40" : "#5aa848"; x.fillRect(0, i * 64, w, 64); } x.fillStyle = "#fbf8f1"; x.fillRect(0, 0, w, 6); }, [6, 6]);
export const Field: React.FC<{ children?: React.ReactNode; fill?: V3; t?: number; cheer?: number }> = ({ children, fill = [0, 0.8, 0], t = 0, cheer = 1 }) => (
  <group>
    <Lights g="day" fill={fill} />
    <hemisphereLight args={["#ffe8a8", "#5a8a40", 0.4]} />
    <Sky />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><Mat map={turf()} r={0.95} /></mesh>
    {/* the stands: three tiers with crowd folk */}
    {[0, 1, 2].map((r) => (
      <group key={r}>
        <mesh position={[0, 0.25 + r * 0.45, -3.2 - r * 0.6]} receiveShadow><boxGeometry args={[14, 0.5 + r * 0.9, 0.6]} /><Mat c={["#c8c4bc", "#b8b4ac", "#a8a49c"][r]} r={0.9} /></mesh>
        {Array.from({ length: 16 }, (_, i) => { const m = MINIS[(i + r * 3) % MINIS.length]; const ph = Math.sin(t * 7 + i * 1.7 + r); return <MiniFolk key={i} pos={[-6 + i * 0.8 + (r % 2) * 0.4, 0.5 + r * 0.9, -3.2 - r * 0.6]} {...m} cheer={cheer * (0.5 + 0.5 * ph)} expr={i % 3 ? { eyes: "happy", brows: "raised", mouth: "laugh" } : { eyes: "wide", brows: "raised", mouth: "o" }} scale={0.9} />; })}
      </group>
    ))}
    {/* goal post */}
    <group position={[2.6, 0, -1.8]}>
      <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.04, 0.04, 1.2, 10]} /><Mat c="#f2d24a" /></mesh>
      <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.035, 0.035, 1.4, 10]} /><Mat c="#f2d24a" /></mesh>
      {[-0.7, 0.7].map((x) => <mesh key={x} position={[x, 1.9, 0]}><cylinderGeometry args={[0.03, 0.03, 1.4, 10]} /><Mat c="#f2d24a" /></mesh>)}
    </group>
    {/* pennants */}
    {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[-4 + i, 3.0, -5.0]} rotation={[0, 0, Math.PI]}><coneGeometry args={[0.15, 0.4, 3]} /><Mat c={["#c8323c", "#f2d24a", "#3a6ab0"][i % 3]} /></mesh>)}
    {children}
  </group>
);

// ---------- 4. The arcade (night, neon) ----------
const neonTex = (s: string, c: string) => tex("neon" + s, 512, 160, (x, w, h) => { x.fillStyle = "#1a1030"; x.fillRect(0, 0, w, h); x.shadowColor = c; x.shadowBlur = 26; x.fillStyle = "#fff"; x.font = F(900, 96); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(s, w / 2, h / 2 + 4); x.shadowBlur = 0; x.strokeStyle = c; x.lineWidth = 3; x.strokeText(s, w / 2, h / 2 + 4); });
const checker = () => tiles("#2a2a3a", "#e8e0d0");
export const Arcade: React.FC<{ children?: React.ReactNode; fill?: V3; t?: number }> = ({ children, fill = [0, 0.9, 0], t = 0 }) => (
  <group>
    <hemisphereLight args={["#c8a8ff", "#2a1a3a", 0.9]} />
    <directionalLight position={[2, 5, 5]} intensity={0.9} color="#ffd8f0" castShadow {...shadowP(6)} />
    <pointLight position={[fill[0], fill[1] + 0.6, fill[2] + 1.1]} intensity={3.6} distance={5} decay={1.2} color="#ffe8d0" />
    <pointLight position={[-1.6, 2.2, -1.0]} intensity={2.5} distance={4} color="#ff5aa8" />
    <pointLight position={[1.8, 2.2, -1.0]} intensity={2.5} distance={4} color="#5ac8ff" />
    <Room floor={checker()} wall="#3a2a5a" back={-1.8} side={2.8} />
    <mesh position={[0, 2.3, -1.78]}><planeGeometry args={[1.6, 0.5]} /><meshBasicMaterial map={neonTex("ARCADE", "#ff5aa8")} /></mesh>
    {/* neon strips, a HIGH SCORE sign, a gumball machine, side machines */}
    {[-1.79, -1.785].map((z, i) => <mesh key={i} position={[0, 2.75 - i * 2.6, z]}><boxGeometry args={[5.4, 0.04, 0.02]} /><meshBasicMaterial color={i ? "#5ac8ff" : "#ff5aa8"} /></mesh>)}
    <mesh position={[-1.9, 1.85, -1.77]}><planeGeometry args={[1.0, 0.32]} /><meshBasicMaterial map={neonTex("HI-SCORE", "#5ac8ff")} /></mesh>
    <group position={[2.35, 0, -0.4]}><mesh position={[0, 0.35, 0]} castShadow><cylinderGeometry args={[0.08, 0.12, 0.7, 12]} /><Mat c="#c8323c" r={0.4} /></mesh><mesh position={[0, 0.85, 0]}><sphereGeometry args={[0.2, 20, 16]} /><Mat c="#e8f4ff" r={0.05} o={0.5} /></mesh>{Array.from({ length: 14 }, (_, i) => <mesh key={i} position={[(rnd(i) - 0.5) * 0.24, 0.75 + rnd(i * 3) * 0.16, (rnd(i * 5) - 0.5) * 0.24]}><sphereGeometry args={[0.03, 10, 8]} /><Mat c={["#ff5aa8", "#ffd84a", "#5ac8ff", "#7affc8"][i % 4]} /></mesh>)}</group>
    {/* back-row machines */}
    {[-2.0, -1.2, 1.3, 2.1].map((x, i) => (
      <group key={i} position={[x, 0, -1.35]}>
        <mesh position={[0, 0.8, 0]} castShadow><boxGeometry args={[0.6, 1.6, 0.5]} /><Mat c={["#c8323c", "#3a6ab0", "#e8a030", "#2f8a5a"][i]} r={0.5} /></mesh>
        <mesh position={[0, 1.2, 0.252]}><planeGeometry args={[0.46, 0.4]} /><meshBasicMaterial color={["#ff8ac8", "#8ad8ff", "#ffe28a", "#8affb8"][i]} /></mesh>
        <mesh position={[0, 1.2, 0.26]}><planeGeometry args={[0.1 + 0.06 * Math.sin(t * 6 + i), 0.1]} /><meshBasicMaterial color="#ffffff" /></mesh>
      </group>
    ))}
    {children}
  </group>
);

// ---------- 5. The violet "You see" stage ----------
export const Violet: React.FC<{ children?: React.ReactNode; fill?: V3; dark?: number }> = ({ children, fill = [0, 0.8, 0], dark = 0 }) => (
  <group>
    <hemisphereLight args={["#b8a0ff", "#3a2860", 1.1 * (1 - 0.85 * dark)]} />
    <directionalLight position={[3, 7, 5]} intensity={0.9 * (1 - 0.85 * dark)} color="#a890ff" castShadow {...shadowP(6)} />
    <directionalLight position={[-2, 2, 6]} intensity={1.0 * (1 - 0.85 * dark)} color="#ffe6d0" />
    <pointLight position={[fill[0], fill[1] + 0.5, fill[2] + 0.9]} intensity={4 * (1 - 0.8 * dark)} distance={6} decay={1.2} color="#fff0e0" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[30, 48]} /><Mat c="#3a2a6a" r={0.8} /></mesh>
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.6, 1.7, 64]} /><Mat c="#c9a8ff" e="#8a60ff" ei={0.6} /></mesh>
    <mesh position={[0, 6, -10]}><sphereGeometry args={[22, 24, 16]} /><meshBasicMaterial map={violetSky()} color={new THREE.Color(1 - 0.7 * dark, 1 - 0.7 * dark, 1 - 0.7 * dark)} side={THREE.BackSide} /></mesh>
    {children}
  </group>
);
const violetSky = () => tex("vsky", 1024, 512, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#1b1440"); g.addColorStop(1, "#5a3488"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,240,255,${0.3 + rnd(i) * 0.6})`; x.fillRect(rnd(i * 13) * w, rnd(i * 17) * h, 2, 2); }
});

// ---------- 6. The classroom ----------
const boardTex = () => tex("board", 512, 256, (x, w, h) => {
  x.fillStyle = "#2a4a3a"; x.fillRect(0, 0, w, h); x.strokeStyle = "rgba(255,255,255,0.85)"; x.lineWidth = 4; x.font = F(800, 40); x.fillStyle = "rgba(255,255,255,0.85)";
  x.fillText("2 + 2 = 4", 40, 70); x.fillText("H2O", 330, 70); x.fillText("1066", 40, 150); x.beginPath(); x.arc(380, 160, 40, 0, 7); x.stroke(); x.fillText("A B C", 40, 220);
});
export const Classroom: React.FC<{ children?: React.ReactNode; fill?: V3 }> = ({ children, fill = [0, 0.8, 0] }) => (
  <group>
    <Lights g="day" fill={fill} />
    <Room floor={planks("#c8a070", "#b8925e", "cf")} wall={wallpaper("#f0e2c0", "#e0d0a8")} back={-1.8} side={2.8} />
    <mesh position={[0, 1.45, -1.78]}><planeGeometry args={[2.2, 1.0]} /><Mat map={boardTex()} r={0.9} /></mesh>
    <mesh position={[0, 0.93, -1.75]}><boxGeometry args={[2.3, 0.05, 0.08]} /><Mat c="#8a5a32" /></mesh>
    <Window p={[-2.0, 1.5, -1.78]} w={0.8} h={0.9} />
    <Clock p={[1.75, 2.1, -1.77]} t={0} s={0.55} />
    <mesh position={[0, 2.12, -1.775]}><planeGeometry args={[3.6, 0.2]} /><meshBasicMaterial map={tex("abc", 1024, 64, (x, w, h) => { x.fillStyle = "#fbf3dc"; x.fillRect(0, 0, w, h); x.font = F(900, 44); x.textBaseline = "middle"; "AaBbCcDdEeFfGgHh".split("").forEach((c, i) => { x.fillStyle = ["#c8323c", "#2a6ab0", "#2f8a4a", "#e8a030"][i % 4]; x.fillText(c, 20 + i * 62, h / 2 + 2); }); })} /></mesh>
    <group position={[1.35, 0, -1.3]}><mesh position={[0, 0.38, 0]} castShadow><boxGeometry args={[0.8, 0.76, 0.45]} /><Mat c="#8a5a32" /></mesh><mesh position={[0, 0.76 + 0.03, 0]}><cylinderGeometry args={[0.04, 0.06, 0.06, 10]} /><Mat c="#c8a050" m={0.6} r={0.3} /></mesh><mesh position={[0, 0.98, 0]} castShadow><sphereGeometry args={[0.17, 24, 18]} /><Mat c="#3a8ad0" r={0.5} /></mesh><mesh position={[0.05, 1.02, 0.12]}><sphereGeometry args={[0.07, 12, 10]} /><Mat c="#5aa848" r={0.6} /></mesh><mesh position={[0.25, 0.79, 0.05]} castShadow><boxGeometry args={[0.1, 0.03, 0.1]} /><Mat c="#c8323c" /></mesh></group>
    {children}
  </group>
);

// ---------- 7. The record stage (a warm spotlight, red curtains) ----------
const curtain = () => tex("curt", 256, 256, (x, w, h) => { for (let i = 0; i < 16; i++) { const g = x.createLinearGradient(i * 16, 0, i * 16 + 16, 0); g.addColorStop(0, "#7a1420"); g.addColorStop(0.5, "#b82a38"); g.addColorStop(1, "#7a1420"); x.fillStyle = g; x.fillRect(i * 16, 0, 16, h); } }, [4, 1]);
export const Stage: React.FC<{ children?: React.ReactNode; fill?: V3 }> = ({ children, fill = [0, 0.9, 0] }) => (
  <group>
    <hemisphereLight args={["#ffe8d0", "#4a2020", 0.8]} />
    <spotLight position={[0, 4.5, 2.5]} angle={0.5} penumbra={0.6} intensity={30} distance={10} decay={1.4} color="#fff2d0" castShadow />
    <pointLight position={[fill[0], fill[1] + 0.5, fill[2] + 1.0]} intensity={2.4} distance={4} decay={1.3} color="#fff0e0" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow><planeGeometry args={[20, 20]} /><Mat map={planks("#7a4a2a", "#6a3e22", "stg")} r={0.7} /></mesh>
    <mesh position={[0, 2, -1.8]}><planeGeometry args={[10, 4]} /><Mat map={curtain()} r={0.9} /></mesh>
    <mesh position={[0, 3.6, -1.75]}><boxGeometry args={[10, 0.5, 0.1]} /><Mat c="#c8a040" m={0.5} r={0.35} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, -0.1]}><circleGeometry args={[1.25, 48]} /><meshBasicMaterial color="#fff2c8" transparent opacity={0.18} /></mesh>
    {[-1.3, 1.3].map((x) => <group key={x} position={[x, 0, -1.2]}><mesh position={[0, 0.35, 0]} castShadow><cylinderGeometry args={[0.18, 0.2, 0.7, 20]} /><Mat c="#3a2a4a" r={0.5} /></mesh><mesh position={[0, 0.82, 0]} castShadow><cylinderGeometry args={[0.12, 0.04, 0.22, 20]} /><Mat c="#e8c040" m={0.8} r={0.25} /></mesh><mesh position={[0, 0.72, 0]}><cylinderGeometry args={[0.03, 0.03, 0.06, 10]} /><Mat c="#e8c040" m={0.8} r={0.25} /></mesh></group>)}
    {children}
  </group>
);
export { Poster, Window };
void useMemo; void rnd5;
const grassTex = () => tex("grass", 512, 512, (x, w, h) => { x.fillStyle = "#7aa850"; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.fillStyle = rnd(i) > 0.5 ? "rgba(60,110,40,0.35)" : "rgba(170,210,110,0.35)"; x.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 3, 9); } }, [8, 8]);
const skyDay = () => tex("skyday", 1024, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#6fb4ea"); g.addColorStop(1, "#d4ecf6"); x.fillStyle = g; x.fillRect(0, 0, w, h); for (let i = 0; i < 12; i++) { const cx = rnd(i * 3) * w, cy = 70 + rnd(i * 7) * 180, s = 26 + rnd(i * 11) * 30; x.fillStyle = "rgba(255,255,255,0.9)"; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(cx + (k - 2) * s * 0.8, cy, s * (0.7 + 0.3 * Math.cos(k)), 0, 7); x.fill(); } } });
export const Sky: React.FC = () => <mesh position={[0, 8, 0]}><sphereGeometry args={[60, 24, 12]} /><meshBasicMaterial map={skyDay()} side={THREE.BackSide} /></mesh>;

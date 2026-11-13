// Short 4 sets: Wilson's cosy 1950s electronics workshop (the workbench at the origin), the 1950s hospital room (bed,
// monitor, the TV-sized machine, the wall socket; lights that can cut out), the violet "You see" stage, the barn
// workshop (inside, shelves of little devices) and the barn behind the house (outside), the operating room, and a
// modern street. Every set sits at the origin; one set per shot. Dark grades keep a face fill light (owner's notes).
import React, { useMemo } from "react";
import * as THREE from "three";
import { Mat, memoTex } from "./cast";

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
export const BENCH_Y = 0.5; // the bench top
export const Workshop: React.FC<{ children?: React.ReactNode; g?: Grade; fill?: V3; drawers?: React.ReactNode; dim?: number }> = ({ children, g = "warm", fill = [0, 0.9, -0.45], drawers }) => (
  <group>
    <Lights g={g} fill={fill} />
    <Room floor={planks("#9a6a42", "#8a5c38", "wsf")} wall={wallpaper("#d8c8a0", "#c4b088")} back={-1.6} side={2.8} />
    <Window p={[-1.3, 1.55, -1.58]} />
    <Poster p={[0.9, 1.62, -1.58]} lines={["RADIO", "& PARTS", "CO."]} />
    <Poster p={[1.5, 1.5, -1.58]} lines={["VOLTS", "OHMS", "AMPS"]} bg="#cfe0e8" fg="#2a4a6a" s={0.8} r={0.05} />
    <Shelf p={[0.2, 1.25, -1.45]} w={1.5}>
      {[-0.6, -0.42, -0.24].map((x, i) => <Jar key={i} p={[x, 0.02, 0]} c={["#d83a3a", "#e8c040", "#2a5aa8"][i]} />)}
      {[0.1, 0.3].map((x, i) => <mesh key={i} position={[x, 0.12, 0]} castShadow><boxGeometry args={[0.16, 0.2, 0.18]} /><Mat c={["#6a7a5a", "#8a6a4a"][i]} r={0.6} /></mesh>)}
      <mesh position={[0.55, 0.09, 0]} castShadow><cylinderGeometry args={[0.07, 0.07, 0.14, 16]} /><Mat c="#c87a3a" r={0.4} m={0.4} /></mesh>
    </Shelf>
    {/* the bench */}
    <mesh position={[0, BENCH_Y - 0.025, 0]} castShadow receiveShadow><boxGeometry args={[1.9, 0.05, 0.7]} /><Mat c="#a8743a" r={0.55} /></mesh>
    <mesh position={[0, BENCH_Y - 0.06, 0.34]}><boxGeometry args={[1.9, 0.07, 0.03]} /><Mat c="#8a5a2a" r={0.6} /></mesh>
    {[[-0.88, -0.3], [0.88, -0.3], [-0.88, 0.3], [0.88, 0.3]].map(([x, z], i) => <mesh key={i} position={[x, (BENCH_Y - 0.05) / 2, z]} castShadow><boxGeometry args={[0.06, BENCH_Y - 0.05, 0.06]} /><Mat c="#7a4a22" /></mesh>)}
    <Lamp p={[0.75, BENCH_Y, -0.2]} />
    {drawers}
    {children}
  </group>
);

// ---------- 2. The hospital room ----------
export const Hospital: React.FC<{ children?: React.ReactNode; power?: number; fill?: V3; or?: boolean }> = ({ children, power = 1, fill = [0, 0.8, 0], or = false }) => {
  const dimmed = power < 0.5;
  return (
    <group>
      {dimmed ? <Lights g="dim" fill={fill} /> : <Lights g="day" fill={fill} k={0.55 + 0.45 * power} />}
      {!dimmed && power > 0.6 && <pointLight position={[0, 2.6, 0.5]} intensity={2.5 * power} distance={6} color="#fff8e8" />}
      <Room floor={tiles(or ? "#c8dcd4" : "#e8e4d8", or ? "#a8c4b8" : "#c8c0b0")} wall={or ? "#a8d0c0" : wallpaper("#d8e8e0", "#c4d8cc")} back={-1.8} side={2.8} />
      {!or && <Window p={[-1.5, 1.6, -1.78]} sky={dimmed ? "#2a3060" : "#a8d4f0"} />}
      {!or && <mesh position={[0, 0.6, -1.79]}><planeGeometry args={[5.6, 1.2]} /><Mat c="#c8dcd0" r={0.9} /></mesh>}
      {!or && <Poster p={[1.4, 1.65, -1.78]} lines={["QUIET", "PLEASE"]} bg="#f2f2ea" fg="#2a6a8a" />}
      {/* the ceiling lamp */}
      <mesh position={[0, 2.7, 0]}><cylinderGeometry args={[0.3, 0.36, 0.08, 24]} /><Mat c="#f2f2ea" e="#fff8d8" ei={power > 0.5 ? 1.2 : 0} /></mesh>
      {children}
    </group>
  );
};

// ---------- 3. The violet "You see" stage ----------
export const Violet: React.FC<{ children?: React.ReactNode; fill?: V3 }> = ({ children, fill = [0, 0.8, 0] }) => (
  <group>
    <Lights g="violet" fill={fill} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[30, 48]} /><Mat c="#3a2a6a" r={0.8} /></mesh>
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.6, 1.7, 64]} /><Mat c="#c9a8ff" e="#8a60ff" ei={0.6} /></mesh>
    <mesh position={[0, 6, -10]}><sphereGeometry args={[22, 24, 16]} /><meshBasicMaterial map={violetSky()} side={THREE.BackSide} /></mesh>
    {children}
  </group>
);
const violetSky = () => tex("vsky", 1024, 512, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#1b1440"); g.addColorStop(1, "#5a3488"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,240,255,${0.3 + rnd(i) * 0.6})`; x.fillRect(rnd(i * 13) * w, rnd(i * 17) * h, 2, 2); }
});

// ---------- 4. The barn workshop (inside) and the barn behind the house (outside) ----------
export const BarnIn: React.FC<{ children?: React.ReactNode; fill?: V3 }> = ({ children, fill = [0, 0.9, -0.4] }) => (
  <group>
    <Lights g="warm" fill={fill} />
    <Room floor={planks("#8a6a4a", "#7a5c40", "bf")} wall={planks("#a84a32", "#984028", "bw")} back={-1.7} side={2.8} />
    {/* rafters and hanging bulbs */}
    {[-1, 0, 1].map((x) => <group key={x} position={[x * 1.1, 2.2, -0.4]}><mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.004, 0.004, 0.5, 4]} /><Mat c="#2a2a2a" /></mesh><mesh position={[0, -0.52, 0]}><sphereGeometry args={[0.05, 12, 10]} /><Mat c="#fff2c0" e="#ffd070" ei={1.5} /></mesh><pointLight position={[0, -0.6, 0]} intensity={0.8} distance={3} color="#ffd8a0" /></group>)}
    {/* hay bales */}
    {[[-2.1, -1.2], [-2.2, -0.5], [2.15, -1.1]].map(([x, z], i) => <mesh key={i} position={[x, 0.2, z]} castShadow><boxGeometry args={[0.6, 0.4, 0.45]} /><Mat c="#d8b860" r={0.95} /></mesh>)}
    {/* the bench */}
    <mesh position={[0, BENCH_Y - 0.025, 0]} castShadow receiveShadow><boxGeometry args={[1.9, 0.05, 0.7]} /><Mat c="#a8743a" r={0.55} /></mesh>
    {[[-0.88, -0.3], [0.88, -0.3], [-0.88, 0.3], [0.88, 0.3]].map(([x, z], i) => <mesh key={i} position={[x, (BENCH_Y - 0.05) / 2, z]} castShadow><boxGeometry args={[0.06, BENCH_Y - 0.05, 0.06]} /><Mat c="#7a4a22" /></mesh>)}
    <Lamp p={[-0.75, BENCH_Y, -0.2]} />
    {children}
  </group>
);
const grassTex = () => tex("grass", 512, 512, (x, w, h) => { x.fillStyle = "#7aa850"; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.fillStyle = rnd(i) > 0.5 ? "rgba(60,110,40,0.35)" : "rgba(170,210,110,0.35)"; x.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 3, 9); } }, [8, 8]);
const skyDay = () => tex("skyday", 1024, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#6fb4ea"); g.addColorStop(1, "#d4ecf6"); x.fillStyle = g; x.fillRect(0, 0, w, h); for (let i = 0; i < 12; i++) { const cx = rnd(i * 3) * w, cy = 70 + rnd(i * 7) * 180, s = 26 + rnd(i * 11) * 30; x.fillStyle = "rgba(255,255,255,0.9)"; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(cx + (k - 2) * s * 0.8, cy, s * (0.7 + 0.3 * Math.cos(k)), 0, 7); x.fill(); } } });
export const Sky: React.FC = () => <mesh position={[0, 8, 0]}><sphereGeometry args={[60, 24, 12]} /><meshBasicMaterial map={skyDay()} side={THREE.BackSide} /></mesh>;
const Tree: React.FC<{ p: V3; s?: number }> = ({ p, s = 1 }) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.6, 0]} castShadow><cylinderGeometry args={[0.08, 0.12, 1.2, 10]} /><Mat c="#6a4a2a" /></mesh>
    {[[0, 1.5, 0, 0.6], [0.35, 1.3, 0.1, 0.45], [-0.35, 1.35, 0, 0.45]].map(([x, y, z, r], i) => <mesh key={i} position={[x, y, z]} castShadow><sphereGeometry args={[r, 18, 14]} /><Mat c={["#5a9a48", "#6aa850", "#4f8a40"][i]} r={0.9} /></mesh>)}
  </group>
);
/** The red barn (doors open, glowing inside) at the origin, the white house in front-left. */
export const BarnOut: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <group>
    <Lights g="day" fill={[0, 0.8, 1.5]} />
    <Sky />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><Mat map={grassTex()} r={0.95} /></mesh>
    <group position={[0.6, 0, -2.4]}>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow><boxGeometry args={[2.4, 1.8, 2]} /><Mat c="#b8402e" r={0.8} /></mesh>
      <mesh position={[0, 2.15, 0]} rotation={[0, 0, Math.PI / 4]} castShadow><boxGeometry args={[1.25, 1.25, 2.05]} /><Mat c="#5a3a32" r={0.8} /></mesh>
      <mesh position={[0, 0.65, 1.005]}><planeGeometry args={[0.9, 1.3]} /><meshBasicMaterial color="#ffd890" /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[k * 0.75, 0.65, 1.06]} rotation={[0, k * 0.5, 0]}><boxGeometry args={[0.45, 1.3, 0.05]} /><Mat c="#a03828" /></mesh>)}
      <mesh position={[0, 1.55, 1.01]}><planeGeometry args={[1.0, 0.3]} /><meshBasicMaterial map={signTex("WORKSHOP")} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[k * 0.45, 0.65, 1.01]}><boxGeometry args={[0.04, 1.3, 0.02]} /><Mat c="#f2ead8" /></mesh>)}
    </group>
    <group position={[-2.8, 0, -4.5]}>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow><boxGeometry args={[2.2, 1.8, 1.8]} /><Mat c="#f2ead8" r={0.8} /></mesh>
      <mesh position={[0, 2.1, 0]} rotation={[0, 0, Math.PI / 4]} castShadow><boxGeometry args={[1.2, 1.2, 1.85]} /><Mat c="#3a4a6a" r={0.8} /></mesh>
      {[-0.5, 0.5].map((x) => <mesh key={x} position={[x, 1.1, 0.91]}><planeGeometry args={[0.4, 0.45]} /><meshBasicMaterial color="#9ac8e8" /></mesh>)}
      <mesh position={[0, 0.4, 0.91]}><planeGeometry args={[0.36, 0.8]} /><Mat c="#6a4a2a" /></mesh>
    </group>
    <Tree p={[3.0, 0, -3.5]} s={1.3} /><Tree p={[-4.5, 0, -2]} s={1.1} /><Tree p={[4.5, 0, -6]} s={1.5} />
    {/* a path */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.6, 0.005, 0]}><planeGeometry args={[0.8, 3]} /><Mat c="#c8b080" r={0.95} /></mesh>
    {children}
  </group>
);
const signTex = (s: string) => tex("sign" + s, 512, 150, (x, w, h) => { x.fillStyle = "#f2e2b8"; x.fillRect(0, 0, w, h); x.strokeStyle = "#5a3a22"; x.lineWidth = 10; x.strokeRect(5, 5, w - 10, h - 10); x.fillStyle = "#5a2a1a"; x.font = F(900, 80); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(s, w / 2, h / 2 + 4); });

// ---------- 5. The operating room ----------
export const OR: React.FC<{ children?: React.ReactNode; fill?: V3 }> = ({ children, fill }) => <Hospital or fill={fill}>{children}</Hospital>;

// ---------- 6. A modern street ----------
const facade = (k: number) => tex("fac" + k, 512, 1024, (x, w, h) => {
  const cols = ["#e8b06a", "#7ab8c8", "#e88a7a", "#b8c87a", "#c8a8e0", "#f2d070"];
  x.fillStyle = cols[k % cols.length]; x.fillRect(0, 0, w, h);
  for (let f = 0; f < 4; f++) for (let i = 0; i < 3; i++) { x.fillStyle = "#3a4a5e"; x.fillRect(50 + i * 150, 70 + f * 200, 110, 140); x.fillStyle = "rgba(255,255,255,0.25)"; x.fillRect(58 + i * 150, 78 + f * 200, 30, 124); }
  x.fillStyle = "#2a3a3a"; x.fillRect(30, 860, w - 60, 164); x.fillStyle = "#f2ead8"; x.font = F(900, 50); x.textAlign = "center"; x.fillText(["CAFÉ", "BOOKS", "GYM", "BAKERY", "PHONES", "FLOWERS"][k % 6], w / 2, 920);
  x.fillStyle = "#ffd890"; x.fillRect(60, 950, w - 120, 74);
});
export const Street: React.FC<{ children?: React.ReactNode; fill?: V3 }> = ({ children, fill = [0, 0.8, 0] }) => (
  <group>
    <Lights g="day" fill={fill} />
    <Sky />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]} receiveShadow><planeGeometry args={[40, 40]} /><Mat c="#c8c4bc" r={0.9} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 3.2]}><planeGeometry args={[40, 2.6]} /><Mat c="#5a5c64" r={0.9} /></mesh>
    {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[-8 + i * 2.05, 2, -3.2]} castShadow receiveShadow><boxGeometry args={[2.0, 4, 1]} /><Mat map={facade(i)} r={0.85} /></mesh>)}
    {[-3.5, 0.5, 4.5].map((x, i) => <Tree key={i} p={[x, 0, -1.8]} s={0.9} />)}
    {children}
  </group>
);
export { Poster, Window };
void useMemo;

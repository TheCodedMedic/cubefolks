// Short 3 sets: the 1940s RADAR LAB (two-tone walls, sign, chalkboard, shelves, workbench with the humming tube, dials and
// cables, hanging lamps), the war factory (rows of radar tubes on long benches, brick walls, tall windows), the yard with the
// radar dish, the violet "You see" stage, the showroom (oven, piano, balance), a 1950s kitchen and a modern kitchen.
// Every set sits at the origin; detail lives in canvas textures. A face fill light in every grade (lesson: faces bright).
import React, { useMemo } from "react";
import * as THREE from "three";
import { Mat, MiniTube, rnd } from "./cast";

type V3 = [number, number, number];
export type Grade = "day" | "warm" | "violet" | "cool";
const TEX = new Map<string, THREE.CanvasTexture>();
export const tex = (key: string, w: number, h: number, draw: (x: CanvasRenderingContext2D, w: number, h: number) => void, rep?: [number, number]) => {
  let t = TEX.get(key);
  if (!t) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d")!, w, h);
    t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    TEX.set(key, t);
  }
  return t;
};
const F = (w: number, sz: number) => `${w} ${sz}px Montserrat, sans-serif`;

// ---------- lights ----------
const shadowP = (sh: number) => ({ "shadow-mapSize": [2048, 2048], "shadow-camera-left": -sh, "shadow-camera-right": sh, "shadow-camera-top": sh, "shadow-camera-bottom": -sh, "shadow-bias": -0.0004 } as any);
export const Lights: React.FC<{ g: Grade; sh?: number; fill?: V3 }> = ({ g, sh = 6, fill }) => {
  if (g === "violet") return (<>
    <hemisphereLight args={["#b8a0ff", "#3a2860", 1.1]} />
    <directionalLight position={[3, 7, 5]} intensity={0.9} color="#a890ff" castShadow {...shadowP(sh)} />
    <directionalLight position={[-2, 2, 6]} intensity={1.0} color="#ffe6d0" />
    {fill && <pointLight position={[fill[0], fill[1] + 0.4, fill[2] + 0.8]} intensity={4.5} distance={9} decay={1.1} color="#fff0e0" />}
  </>);
  if (g === "cool") return (<>
    <hemisphereLight args={["#dfeaff", "#5a6a8a", 1.15]} />
    <directionalLight position={[3, 6, 5]} intensity={1.7} color="#e8f0ff" castShadow {...shadowP(sh)} />
    <directionalLight position={[-2, 2, 6]} intensity={0.6} color="#fff0e0" />
  </>);
  return (<>
    <hemisphereLight args={g === "warm" ? ["#fff0d8", "#7a5a3a", 1.15] : ["#e8f2ff", "#8a6a4a", 1.1]} />
    <directionalLight position={[3, 7, 6]} intensity={g === "warm" ? 1.9 : 2.1} color={g === "warm" ? "#ffe2b8" : "#fff4e0"} castShadow {...shadowP(sh)} />
    <directionalLight position={[-3, 2.5, 5]} intensity={0.55} color="#dfe8ff" />
  </>);
};
export const skyTex = (g: "day" | "violet") => tex("sky" + g, 1024, 512, (x, w, h) => {
  const grd = x.createLinearGradient(0, 0, 0, h);
  const st = g === "day" ? ["#6fb4ea", "#d4ecf6"] : ["#1b1440", "#4a2c78"];
  grd.addColorStop(0, st[0]); grd.addColorStop(1, st[1]); x.fillStyle = grd; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 12; i++) {
    const cx = rnd(i * 3) * w, cy = 70 + rnd(i * 7) * 200, s = 26 + rnd(i * 11) * 36;
    x.fillStyle = g === "day" ? "rgba(255,255,255,0.88)" : "rgba(160,140,230,0.22)";
    for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(cx + (k - 2) * s * 0.8, cy + Math.sin(k * 2) * 8, s * (0.7 + 0.3 * Math.cos(k)), 0, Math.PI * 2); x.fill(); }
  }
});
export const Sky: React.FC<{ g: "day" | "violet" }> = ({ g }) => (
  <mesh position={[0, 8, 0]}><sphereGeometry args={[60, 24, 12]} /><meshBasicMaterial map={skyTex(g)} side={THREE.BackSide} /></mesh>
);

// ---------- the radar lab ----------
const labWallTex = () => tex("labwall", 2048, 1024, (x, w, h) => {
  x.fillStyle = "#efe6cc"; x.fillRect(0, 0, w, h);
  x.fillStyle = "#7fa696"; x.fillRect(0, h * 0.58, w, h * 0.42);
  x.fillStyle = "#4f7a6a"; x.fillRect(0, h * 0.58, w, 14);
  for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(80,60,30,${0.015 + rnd(i) * 0.03})`; x.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 30 + rnd(i * 7) * 120, 6 + rnd(i * 9) * 30); }
  // the sign
  x.fillStyle = "#2b2b33"; x.fillRect(w * 0.36, 70, w * 0.28, 120); x.strokeStyle = "#d8b04a"; x.lineWidth = 10; x.strokeRect(w * 0.36 + 10, 80, w * 0.28 - 20, 100);
  x.fillStyle = "#f2c84a"; x.font = F(900, 80); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("RADAR LAB", w / 2, 132);
  // chalkboard with a wave doodle
  x.fillStyle = "#6a4a2a"; x.fillRect(w * 0.06, 150, w * 0.24, 330); x.fillStyle = "#2f4a3a"; x.fillRect(w * 0.06 + 14, 164, w * 0.24 - 28, 302);
  x.strokeStyle = "#f2f2e8"; x.lineWidth = 6; x.beginPath();
  for (let i = 0; i <= 60; i++) { const px = w * 0.08 + i * 7, py = 260 + Math.sin(i * 0.5) * 40; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
  x.font = F(800, 40); x.fillStyle = "#f2f2e8"; x.textAlign = "left"; x.fillText("λ = 12 cm ?", w * 0.08, 390); x.fillText("f ≈ 2.4 GHz", w * 0.08, 440);
  // poster: "KEEP CALM" style safety notice
  x.fillStyle = "#c8323c"; x.fillRect(w * 0.73, 160, w * 0.12, 260); x.fillStyle = "#fbf4dc"; x.font = F(900, 46); x.textAlign = "center";
  ["DANGER", "HIGH", "VOLTAGE"].forEach((l, i) => x.fillText(l, w * 0.79, 230 + i * 60));
  // clock
  x.fillStyle = "#fbfaf4"; x.beginPath(); x.arc(w * 0.92, 200, 60, 0, 7); x.fill(); x.strokeStyle = "#2b2b33"; x.lineWidth = 8; x.stroke();
  x.beginPath(); x.moveTo(w * 0.92, 200); x.lineTo(w * 0.92, 160); x.moveTo(w * 0.92, 200); x.lineTo(w * 0.92 + 30, 210); x.stroke();
});
const floorTex = (k: string, a: string, b: string, n = 8) => tex("floor" + k, 512, 512, (x, w, h) => {
  const s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { x.fillStyle = (i + j) % 2 ? a : b; x.fillRect(i * s, j * s, s, s); }
  for (let i = 0; i < 80; i++) { x.fillStyle = `rgba(0,0,0,${0.02 + rnd(i) * 0.03})`; x.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 40, 8); }
}, [6, 6]);
const Lamp: React.FC<{ p: V3; on?: boolean }> = ({ p, on = true }) => (
  <group position={p}>
    <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.006, 0.006, 1.0, 4]} /><Mat c="#2b2b2b" /></mesh>
    <mesh castShadow><coneGeometry args={[0.22, 0.16, 20, 1, true]} /><Mat c="#3a5a4a" r={0.4} m={0.3} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, -0.05, 0]}><sphereGeometry args={[0.06, 12, 10]} /><Mat c="#fff6d0" e="#ffe8a0" ei={on ? 2 : 0} /></mesh>
  </group>
);
export const BENCH_Z = -1.35, BENCH_H = 0.62;
export const MAG_P: V3 = [0.5, BENCH_H, BENCH_Z];
/** The lab: back wall z = -2.6, left wall x = -3, bench along x at BENCH_Z (top at BENCH_H). */
export const Lab: React.FC<{ children?: React.ReactNode; g?: Grade; fill?: V3; t?: number; noBench?: boolean }> = ({ children, g = "warm", fill, t = 0, noBench }) => (
  <group>
    <Lights g={g} />
    {fill && <pointLight position={[fill[0], fill[1] + 0.5, fill[2] + 1.0]} intensity={2.2} distance={5} decay={1.2} color="#fff2e0" />}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[12, 12]} /><Mat map={floorTex("lab", "#c8b48a", "#8a6a4a")} r={0.6} /></mesh>
    <mesh position={[0, 2.0, -2.6]} receiveShadow><planeGeometry args={[8, 4]} /><Mat map={labWallTex()} r={0.85} /></mesh>
    <mesh position={[-3.0, 2.0, 0.5]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[7, 4]} /><Mat c="#e6dcc0" r={0.9} /></mesh>
    <mesh position={[-3.0, 0.6, 0.5]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[7, 1.2]} /><Mat c="#7fa696" r={0.9} /></mesh>
    <mesh position={[3.0, 2.0, 0.5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow><planeGeometry args={[7, 4]} /><Mat c="#e6dcc0" r={0.9} /></mesh>
    <mesh position={[3.0, 0.6, 0.5]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[7, 1.2]} /><Mat c="#7fa696" r={0.9} /></mesh>
    {/* door in the left wall */}
    <group position={[-2.98, 0, -0.6]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 1.05, 0]}><boxGeometry args={[0.95, 2.1, 0.06]} /><Mat c="#8a5a32" r={0.6} /></mesh>
      <mesh position={[0, 1.45, 0.035]}><planeGeometry args={[0.6, 0.5]} /><Mat c="#cfe4ee" r={0.1} e="#a0c8e0" ei={0.3} /></mesh>
      <mesh position={[0.35, 1.0, 0.06]}><sphereGeometry args={[0.04, 10, 8]} /><Mat c="#d8b04a" m={0.7} r={0.3} /></mesh>
    </group>
    {/* shelves of tubes on the back wall */}
    {[0.9, 1.3].map((y) => (
      <group key={y} position={[-1.7, y + 0.6, -2.45]}>
        <mesh castShadow><boxGeometry args={[1.4, 0.04, 0.3]} /><Mat c="#6a4a2a" r={0.6} /></mesh>
        {[-0.5, -0.17, 0.17, 0.5].map((x, i) => <group key={x} position={[x, 0.02, 0]} scale={0.7}><MiniTube p={[0, 0, 0]} glow={0} />{i % 2 ? null : null}</group>)}
      </group>
    ))}
    {[0.9, 1.3].map((y) => (
      <group key={"r" + y} position={[1.9, y + 0.6, -2.45]}>
        <mesh castShadow><boxGeometry args={[1.3, 0.04, 0.3]} /><Mat c="#6a4a2a" r={0.6} /></mesh>
        {[-0.45, -0.15, 0.15, 0.45].map((x, i) => <mesh key={x} position={[x, 0.12, 0]} castShadow><cylinderGeometry args={[0.06, 0.06, 0.2, 14]} /><Mat c={["#3a6a8a", "#c8763a", "#8a8a90", "#5a7a3a"][i]} r={0.4} m={0.3} /></mesh>)}
      </group>
    ))}
    {/* the workbench */}
    {!noBench && <group position={[0, 0, BENCH_Z]}>
      <mesh position={[0, BENCH_H - 0.025, 0]} castShadow receiveShadow><boxGeometry args={[3.4, 0.05, 0.62]} /><Mat c="#7a5030" r={0.55} /></mesh>
      <mesh position={[0, BENCH_H * 0.5 - 0.03, -0.22]} castShadow><boxGeometry args={[3.3, BENCH_H - 0.06, 0.12]} /><Mat c="#5a3a22" r={0.7} /></mesh>
      {[-1.6, 1.6].map((x) => <mesh key={x} position={[x, BENCH_H / 2, 0.24]} castShadow><boxGeometry args={[0.06, BENCH_H, 0.06]} /><Mat c="#5a3a22" /></mesh>)}
      {/* control rack with dials on the right end */}
      <group position={[1.25, BENCH_H, -0.1]}>
        <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.55, 0.6, 0.32]} /><Mat c="#3a4a44" r={0.5} m={0.3} /></mesh>
        {[[-0.14, 0.42], [0.14, 0.42], [-0.14, 0.2], [0.14, 0.2]].map(([x, y], i) => (
          <group key={i} position={[x, y, 0.162]}>
            <mesh><circleGeometry args={[0.085, 24]} /><Mat c="#f6f0dc" r={0.4} /></mesh>
            <mesh position={[0, 0, 0.004]} rotation={[0, 0, Math.sin(t * (2 + i) + i) * 0.8 - 0.3]}><planeGeometry args={[0.008, 0.14]} /><Mat c="#c8323c" /></mesh>
          </group>
        ))}
        {[-0.18, -0.06, 0.06, 0.18].map((x, i) => <mesh key={x} position={[x, 0.07, 0.165]}><sphereGeometry args={[0.018, 10, 8]} /><Mat c={["#ff4a3a", "#5aff8a", "#ffd84a", "#5ab8ff"][i]} e={["#ff2010", "#20ff60", "#ffc020", "#20a0ff"][i]} ei={0.6 + 0.6 * Math.max(0, Math.sin(t * 5 + i * 1.7))} /></mesh>)}
      </group>
      {/* cables from the rack to the tube */}
      {[0, 1].map((k) => <mesh key={k} position={[0.85, BENCH_H + 0.015, -0.05 - k * 0.06]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, 0.55, 6]} /><Mat c={k ? "#c8323c" : "#2b2b2b"} r={0.5} /></mesh>)}
      {/* tools and papers on the left */}
      <mesh position={[-1.0, BENCH_H + 0.003, 0.05]} rotation={[-Math.PI / 2, 0, 0.2]}><planeGeometry args={[0.3, 0.4]} /><Mat c="#cfe0f0" r={0.9} /></mesh>
      <mesh position={[-1.35, BENCH_H + 0.08, -0.1]} castShadow><cylinderGeometry args={[0.05, 0.05, 0.16, 14]} /><Mat c="#8a8a90" r={0.4} m={0.5} /></mesh>
      <mesh position={[-0.65, BENCH_H + 0.02, -0.12]} castShadow><boxGeometry args={[0.25, 0.04, 0.15]} /><Mat c="#c8323c" r={0.5} /></mesh>
    </group>}
    {[-1.3, 0.3, 1.8].map((x) => <Lamp key={x} p={[x, 2.6, -0.8]} />)}
    {children}
  </group>
);

// ---------- the war factory ----------
const brickTex = () => tex("brick", 1024, 1024, (x, w, h) => {
  x.fillStyle = "#9a5a42"; x.fillRect(0, 0, w, h);
  for (let r = 0; r < 32; r++) for (let c = 0; c < 9; c++) {
    x.fillStyle = ["#a8644a", "#94523a", "#b0704e", "#8a4c36"][(r * 7 + c * 3) % 4];
    x.fillRect(c * 120 + (r % 2) * 60 - 60, r * 32, 112, 26);
  }
  for (let i = 0; i < 3; i++) { const cx = 120 + i * 360; x.fillStyle = "#e8eef0"; x.fillRect(cx, 140, 200, 420); x.fillStyle = "#cfe2ee"; for (let a = 0; a < 3; a++) for (let b = 0; b < 6; b++) x.fillRect(cx + 8 + a * 64, 148 + b * 68, 56, 60); }
  x.fillStyle = "#2b2b33"; x.fillRect(0, 640, w, 110); x.fillStyle = "#f2c84a"; x.font = F(900, 70); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("PLANT 2 · RADAR TUBES", w / 2, 696);
});
export const FACT_ROWS = [-2.0, -0.7, 0.7, 2.0];
export const Factory: React.FC<{ children?: React.ReactNode; t?: number; n?: number; g?: Grade }> = ({ children, t = 0, n = 14, g = "day" }) => (
  <group>
    <Lights g={g} sh={10} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[16, 30]} /><Mat c="#9a9a94" r={0.85} /></mesh>
    <mesh position={[0, 3, -13]}><planeGeometry args={[16, 6]} /><Mat map={brickTex()} r={0.9} /></mesh>
    {[-4.2, 4.2].map((x) => <mesh key={x} position={[x, 3, -4]} rotation={[0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}><planeGeometry args={[22, 6]} /><Mat map={brickTex()} r={0.9} /></mesh>)}
    {FACT_ROWS.map((x, r) => (
      <group key={r} position={[x, 0, 0]}>
        <mesh position={[0, 0.52, -5.5]} castShadow receiveShadow><boxGeometry args={[0.7, 0.05, 12]} /><Mat c="#6a6a70" r={0.5} m={0.4} /></mesh>
        {[-0.3, 0.3].map((k) => <mesh key={k} position={[k, 0.25, -5.5]}><boxGeometry args={[0.04, 0.5, 11.8]} /><Mat c="#4a4a50" /></mesh>)}
        {Array.from({ length: n }, (_, i) => <MiniTube key={i} p={[0, 0.545, 0.2 - i * 0.85]} glow={0.2 + 0.3 * Math.max(0, Math.sin(t * 4 + i + r))} />)}
      </group>
    ))}
    {Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[0, 4.4, -1 - i * 2.6]}><boxGeometry args={[8.4, 0.18, 0.18]} /><Mat c="#5a5a60" r={0.5} m={0.4} /></mesh>)}
    {Array.from({ length: 4 }, (_, i) => [-1.35, 1.35].map((x) => <group key={i + "_" + x} position={[x, 3.6, -1 - i * 3]}><mesh><cylinderGeometry args={[0.005, 0.005, 1.4, 4]} /><Mat c="#2b2b2b" /></mesh><mesh position={[0, -0.7, 0]}><coneGeometry args={[0.3, 0.2, 18, 1, true]} /><Mat c="#3a5a4a" side={THREE.DoubleSide} /></mesh><mesh position={[0, -0.76, 0]}><sphereGeometry args={[0.07, 10, 8]} /><Mat c="#fff6d0" e="#ffe8a0" ei={1.6} /></mesh></group>))}
    {children}
  </group>
);

// ---------- the yard (radar dish, flags) ----------
export const Yard: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <group>
    <Lights g="day" sh={9} />
    <Sky g="day" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[60, 60]} /><Mat c="#9aa88a" r={0.95} /></mesh>
    <mesh position={[0, 0.005, -1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[6, 9]} /><Mat c="#a8a49a" r={0.9} /></mesh>
    <mesh position={[0, 2.2, -9]} castShadow><boxGeometry args={[14, 4.4, 2]} /><Mat map={brickTex()} r={0.9} /></mesh>
    {[-5, 5].map((x) => <mesh key={x} position={[x, 3.5, -8]} castShadow><cylinderGeometry args={[0.35, 0.45, 7, 14]} /><Mat c="#8a4c36" r={0.9} /></mesh>)}
    {children}
  </group>
);

// ---------- the violet "You see" stage ----------
export const Stage: React.FC<{ children?: React.ReactNode; fill?: V3 }> = ({ children, fill }) => (
  <group>
    <Lights g="violet" fill={fill} />
    <Sky g="violet" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[30, 48]} /><Mat c="#3a2a6a" r={0.9} /></mesh>
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[2.0, 2.08, 64]} /><Mat c="#c9a8ff" e="#8a60ff" ei={0.5} /></mesh>
    {Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return <mesh key={i} position={[Math.sin(a) * 9, 0.6 + rnd(i) * 1.6, Math.cos(a) * 9 - 2]}><octahedronGeometry args={[0.15 + rnd(i * 3) * 0.2, 0]} /><Mat c="#c9a8ff" e="#8a60ff" ei={0.7} r={0.4} /></mesh>; })}
    {children}
  </group>
);

// ---------- the showroom ----------
const curtainTex = () => tex("curtain", 1024, 512, (x, w, h) => {
  for (let i = 0; i < 32; i++) { const g = x.createLinearGradient(i * 32, 0, i * 32 + 32, 0); g.addColorStop(0, "#8a1a24"); g.addColorStop(0.5, "#c8323c"); g.addColorStop(1, "#8a1a24"); x.fillStyle = g; x.fillRect(i * 32, 0, 32, h); }
  x.fillStyle = "#d8b04a"; x.fillRect(0, 0, w, 30);
});
export const Showroom: React.FC<{ children?: React.ReactNode; fill?: V3 }> = ({ children, fill }) => (
  <group>
    <Lights g="day" sh={7} />
    {fill && <pointLight position={[fill[0], fill[1] + 0.5, fill[2] + 1.2]} intensity={2} distance={5} decay={1.2} color="#fff2e0" />}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[16, 16]} /><Mat map={floorTex("show", "#b8865a", "#a87a4e", 10)} r={0.4} /></mesh>
    <mesh position={[0, 2.5, -3]}><planeGeometry args={[14, 5]} /><Mat map={curtainTex()} r={0.85} /></mesh>
    <mesh position={[0, 0.15, -2.2]} receiveShadow castShadow><boxGeometry args={[7, 0.3, 1.6]} /><Mat c="#6a3a5a" r={0.7} /></mesh>
    {children}
  </group>
);

// ---------- kitchens ----------
const tileWall = (k: string, a: string, b: string) => tex("tw" + k, 512, 512, (x, w, h) => {
  x.fillStyle = a; x.fillRect(0, 0, w, h); x.strokeStyle = b; x.lineWidth = 4;
  for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); }
}, [6, 3]);
const WindowView: React.FC<{ p: V3; w?: number; h?: number }> = ({ p, w = 1.0, h = 0.8 }) => (
  <group position={p}>
    <mesh><planeGeometry args={[w + 0.1, h + 0.1]} /><Mat c="#fbfaf4" /></mesh>
    <mesh position={[0, 0, 0.005]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={skyTex("day")} /></mesh>
    <mesh position={[0, 0, 0.01]}><planeGeometry args={[0.04, h]} /><Mat c="#fbfaf4" /></mesh>
  </group>
);
/** 1950s kitchen: mint walls, a checker floor, a rounded fridge, counters on the left. Back wall z = -2.4. */
export const Kitchen50: React.FC<{ children?: React.ReactNode; fill?: V3 }> = ({ children, fill }) => (
  <group>
    <Lights g="day" />
    {fill && <pointLight position={[fill[0], fill[1] + 0.5, fill[2] + 1.2]} intensity={2} distance={5} decay={1.2} color="#fff2e0" />}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[12, 12]} /><Mat map={floorTex("k50", "#f4f1ea", "#2b2b33")} r={0.35} /></mesh>
    <mesh position={[0, 2, -2.4]} receiveShadow><planeGeometry args={[8, 4]} /><Mat map={tileWall("k50", "#a8e0d0", "#8ac8b8")} r={0.5} /></mesh>
    <mesh position={[-2.8, 2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[6, 4]} /><Mat c="#bfe8da" r={0.8} /></mesh>
    <mesh position={[2.8, 2, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[6, 4]} /><Mat c="#bfe8da" r={0.8} /></mesh>
    <WindowView p={[-0.9, 1.6, -2.39]} />
    <group position={[-1.6, 0, -2.0]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow><boxGeometry args={[1.8, 0.84, 0.6]} /><Mat c="#f8f4ea" r={0.4} /></mesh>
      <mesh position={[0, 0.86, 0]} castShadow><boxGeometry args={[1.85, 0.05, 0.65]} /><Mat c="#e8504a" r={0.3} /></mesh>
    </group>
    <group position={[1.9, 0, -1.9]}>
      <mesh position={[0, 0.85, 0]} castShadow><capsuleGeometry args={[0.36, 1.0, 8, 20]} /><Mat c="#f2ecda" r={0.3} /></mesh>
      <mesh position={[0.25, 1.1, 0.33]}><boxGeometry args={[0.04, 0.3, 0.04]} /><Mat c="#c0c4cc" m={0.8} r={0.2} /></mesh>
    </group>
    {children}
  </group>
);
/** Modern kitchen: white and wood, a counter along the back with the microwave at MW_P. */
export const MW_P: V3 = [0.15, 0.92, -1.5];
export const KitchenNow: React.FC<{ children?: React.ReactNode; fill?: V3 }> = ({ children, fill }) => (
  <group>
    <Lights g="day" />
    {fill && <pointLight position={[fill[0], fill[1] + 0.5, fill[2] + 1.2]} intensity={2} distance={5} decay={1.2} color="#fff2e0" />}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[12, 12]} /><Mat c="#c8a882" r={0.5} /></mesh>
    <mesh position={[0, 2, -2.2]} receiveShadow><planeGeometry args={[8, 4]} /><Mat map={tileWall("now", "#f4f4f0", "#dcdcd6")} r={0.4} /></mesh>
    <mesh position={[-2.6, 2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[6, 4]} /><Mat c="#e8eef2" r={0.8} /></mesh>
    <mesh position={[2.6, 2, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[6, 4]} /><Mat c="#e8eef2" r={0.8} /></mesh>
    <group position={[0, 0, -1.6]}>
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow><boxGeometry args={[4.6, 0.88, 0.7]} /><Mat c="#3a6a8a" r={0.5} /></mesh>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow><boxGeometry args={[4.7, 0.05, 0.75]} /><Mat c="#f2efe8" r={0.25} /></mesh>
      {[-1.6, -0.6, 0.4, 1.4].map((x) => <mesh key={x} position={[x, 0.75, 0.355]}><boxGeometry args={[0.3, 0.02, 0.02]} /><Mat c="#c0c4cc" m={0.8} r={0.2} /></mesh>)}
    </group>
    {/* upper cabinets */}
    <mesh position={[-1.4, 2.0, -2.0]} castShadow><boxGeometry args={[1.6, 0.7, 0.4]} /><Mat c="#3a6a8a" r={0.5} /></mesh>
    <mesh position={[1.6, 2.0, -2.0]} castShadow><boxGeometry args={[1.4, 0.7, 0.4]} /><Mat c="#3a6a8a" r={0.5} /></mesh>
    <WindowView p={[0.15, 1.85, -2.19]} w={1.1} h={0.6} />
    {/* kettle and plant */}
    <mesh position={[-1.3, 1.02, -1.55]} castShadow><sphereGeometry args={[0.13, 20, 14]} /><Mat c="#e8504a" r={0.3} /></mesh>
    <group position={[1.6, 0.93, -1.6]}>
      <mesh position={[0, 0.08, 0]} castShadow><cylinderGeometry args={[0.1, 0.08, 0.16, 14]} /><Mat c="#f2efe8" r={0.4} /></mesh>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[Math.sin(i * 1.6) * 0.07, 0.25 + i * 0.03, Math.cos(i * 1.6) * 0.07]} rotation={[Math.sin(i) * 0.5, i, 0]} scale={[0.3, 1, 0.08]}><sphereGeometry args={[0.18, 10, 8]} /><Mat c="#4f8a3a" r={0.8} /></mesh>)}
    </group>
    {children}
  </group>
);
void useMemo;

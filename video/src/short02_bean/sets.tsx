// Short 2 sets: a 1902 Hanoi street (ochre colonial tube houses with green shutters, balconies, shop signs, red tile
// roofs, flame trees, a sewer grate, the town hall at the far end), the brick sewer tunnel, a fancy tiled bathroom with a
// pull-chain toilet, the bounty office (counting room), the rice fields with the rat barn (outside and in), the violet
// "You see" stage with the loop turntable, and the economist's classroom. Detail lives in painted canvas textures.
// Every set sits at the origin (a shot renders one set), so directional lights aim at their sets.
// Night and violet grades darken the textures and the sky, not the light on faces (lesson: faces bright in dark grades).
import React, { useMemo } from "react";
import * as THREE from "three";
import { Mat } from "./cast";

export type Grade = "day" | "dusk" | "night" | "violet";
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
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const F = (w: number, sz: number) => `${w} ${sz}px Montserrat, sans-serif`;
type V3 = [number, number, number];
const dark = (g: Grade) => g === "night" || g === "violet";

// ---------- lights (a face fill in every grade) ----------
const Spot: React.FC<{ pos: V3; aim: V3; color?: string; i?: number; angle?: number }> = ({ pos, aim, color = "#ffd9a0", i = 18, angle = 0.55 }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(...aim); tgt.updateMatrixWorld();
  return (<><primitive object={tgt} /><spotLight position={pos} angle={angle} penumbra={0.7} intensity={i} color={color} distance={14} decay={1.2} target={tgt} /></>);
};
export const Lights: React.FC<{ g: Grade; at?: V3; spot?: V3; aim?: V3; sh?: number; fill?: V3 }> = ({ g, at = [0, 0, 0], spot, aim, sh = 9, fill }) => {
  const shadow = { "shadow-mapSize": [2048, 2048], "shadow-camera-left": -sh, "shadow-camera-right": sh, "shadow-camera-top": sh, "shadow-camera-bottom": -sh, "shadow-bias": -0.0004 } as any;
  const P = (p: V3): V3 => [at[0] + p[0], at[1] + p[1], at[2] + p[2]];
  if (g === "violet") return (<>
    <hemisphereLight args={["#b8a0ff", "#3a2860", 1.05]} />
    <directionalLight position={P([3, 7, 5])} intensity={0.9} color="#a890ff" castShadow {...shadow} />
    <directionalLight position={P([-2, 2, 6])} intensity={0.85} color="#ffe6d0" />
    <Spot pos={spot ?? P([0.3, 6, 3])} aim={aim ?? P([0, 0.6, 0])} i={20} />
    {fill && <pointLight position={[fill[0], fill[1] + 0.4, fill[2]]} intensity={4.5} distance={9} decay={1.1} color="#fff0e0" />}
  </>);
  if (g === "night") return (<>
    <hemisphereLight args={["#9aa8ff", "#3a2a3a", 1.0]} />
    <directionalLight position={P([-3, 6, 4])} intensity={0.9} color="#b8c4ff" castShadow {...shadow} />
    <directionalLight position={P([1, 2, 6])} intensity={0.9} color="#ffd8b0" />
  </>);
  return (<>
    <hemisphereLight args={g === "dusk" ? ["#c8b0e0", "#6a4a3a", 1.2] : ["#e4f0ff", "#8a6a4a", 1.1]} />
    <directionalLight position={P([4, 8, 6])} intensity={g === "dusk" ? 1.9 : 2.2} color={g === "dusk" ? "#ffb070" : "#fff0d8"} castShadow {...shadow} />
  </>);
};

// ---------- skies ----------
export const skyTex = (g: Grade, hills = false) => tex("sky" + g + hills, 1024, 512, (x, w, h) => {
  const grd = x.createLinearGradient(0, 0, 0, h);
  const st = { day: ["#6fb4ea", "#d4ecf6"], dusk: ["#3a3a80", "#f4a874"], night: ["#0e1430", "#2e2a5a"], violet: ["#1b1440", "#4a2c78"] }[g];
  grd.addColorStop(0, st[0]); grd.addColorStop(1, st[1]); x.fillStyle = grd; x.fillRect(0, 0, w, h);
  if (dark(g)) { for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(255,255,240,${0.4 + rnd(i) * 0.6})`; x.fillRect(rnd(i * 13) * w, rnd(i * 17) * h * 0.6, 2, 2); } x.fillStyle = "#fff6d0"; x.beginPath(); x.arc(w * 0.72, h * 0.18, 26, 0, 7); x.fill(); }
  for (let i = 0; i < 12; i++) {
    const cx = rnd(i * 3) * w, cy = 70 + rnd(i * 7) * 200, s = 26 + rnd(i * 11) * 36;
    x.fillStyle = g === "day" ? "rgba(255,255,255,0.88)" : g === "dusk" ? "rgba(255,200,170,0.5)" : "rgba(160,140,230,0.22)";
    for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(cx + (k - 2) * s * 0.8, cy + Math.sin(k * 2) * 8, s * (0.7 + 0.3 * Math.cos(k)), 0, Math.PI * 2); x.fill(); }
  }
  if (hills) { // limestone karst hills on the horizon
    for (let i = 0; i < 9; i++) { const cx = i * 130 + rnd(i) * 60, hh = 70 + rnd(i * 5) * 90; x.fillStyle = g === "day" ? ["#8fb0a4", "#7fa496", "#9ab8ac"][i % 3] : "#2a2848"; x.beginPath(); x.moveTo(cx - 90, h); x.quadraticCurveTo(cx - 60, h - hh * 1.1, cx, h - hh - 10); x.quadraticCurveTo(cx + 60, h - hh * 1.1, cx + 90, h); x.fill(); }
  }
});
export const Sky: React.FC<{ g: Grade; hills?: boolean; at?: V3 }> = ({ g, hills, at = [0, 0, 0] }) => (
  <mesh position={[at[0], 8, at[2]]}><sphereGeometry args={[60, 24, 12]} /><meshBasicMaterial map={skyTex(g, hills)} side={THREE.BackSide} /></mesh>
);

// ---------- the Hanoi street ----------
const SHOPS = ["PHARMACIE", "HÀNG BẠC", "CAFÉ", "TẠP HÓA", "THUỐC BẮC", "VẢI LỤA", "LIBRAIRIE", "TRÀ"];
const COLS = ["#e8c068", "#f0d8b0", "#e6b8a0", "#d8d4a8", "#f2c878", "#c8dcd0"];
/** A tube-house facade: two upper floors with tall shuttered windows and a balcony rail, a shop on the ground floor. */
const houseTex = (k: number, g: Grade) => tex("house" + k + g, 1024, 1024, (x, w, h) => {
  const night = dark(g), base = COLS[k % COLS.length];
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(90,60,30,${0.02 + rnd(i + k) * 0.05})`; x.fillRect(rnd(i * 3 + k) * w, rnd(i * 5 + k) * h, 20 + rnd(i * 7) * 90, 6 + rnd(i * 9) * 30); }
  x.fillStyle = "rgba(255,250,235,0.6)"; x.fillRect(0, 0, w, 40); x.fillRect(0, 330, w, 20); x.fillRect(0, 640, w, 24);
  x.fillStyle = "rgba(60,40,30,0.25)"; x.fillRect(0, 40, w, 8); x.fillRect(0, 350, w, 6); x.fillRect(0, 664, w, 8);
  // pilasters
  for (const px of [0, w - 40]) { x.fillStyle = "rgba(255,250,235,0.45)"; x.fillRect(px, 40, 40, 620); }
  for (let f = 0; f < 2; f++) for (let i = 0; i < 2; i++) {
    const cx = w * (0.28 + i * 0.44), top = 90 + f * 310, ww = 170, wh = 220, on = rnd(k * 9 + f * 3 + i) < 0.5;
    x.fillStyle = "rgba(255,250,235,0.75)"; x.beginPath(); x.ellipse(cx, top, ww / 2 + 14, 34, 0, Math.PI, 0); x.fill();
    x.fillStyle = night ? (on ? "#ffcf7a" : "#1d2340") : "#3d4a5e"; x.fillRect(cx - ww / 2, top, ww, wh);
    x.fillStyle = "rgba(255,255,255,0.15)"; x.fillRect(cx - ww / 2 + 10, top + 10, 30, wh - 20);
    // green louvred shutters, open
    for (const s of [-1, 1]) { x.fillStyle = "#3f7a5a"; x.fillRect(cx + s * (ww / 2 + 36) - 34, top, 68, wh); x.fillStyle = "rgba(0,0,0,0.22)"; for (let r = 0; r < 10; r++) x.fillRect(cx + s * (ww / 2 + 36) - 30, top + 8 + r * 21, 60, 6); }
    // balcony rail
    if (f === 0) { x.fillStyle = "#2f3a34"; x.fillRect(cx - ww / 2 - 70, top + wh - 50, ww + 140, 8); for (let b = 0; b < 16; b++) x.fillRect(cx - ww / 2 - 66 + b * ((ww + 132) / 15), top + wh - 50, 4, 58); x.fillRect(cx - ww / 2 - 70, top + wh + 4, ww + 140, 10); }
    // flower pots
    if (rnd(k + i + f) > 0.4) for (let p = 0; p < 3; p++) { x.fillStyle = "#b8643a"; x.fillRect(cx - 60 + p * 50, top + wh - 30, 26, 22); x.fillStyle = ["#e04a5a", "#f2c84a", "#4f8a3a"][p]; x.beginPath(); x.arc(cx - 47 + p * 50, top + wh - 38, 16, 0, 7); x.fill(); }
  }
  // the shop
  const name = SHOPS[k % SHOPS.length];
  x.fillStyle = "#2f3f3a"; x.fillRect(80, 690, w - 160, 80);
  x.fillStyle = "#f2d38a"; x.font = F(900, 58); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(name, w / 2, 732);
  x.fillStyle = night ? "#ffcf7a" : "#5a4a3a"; x.fillRect(110, 790, w - 220, 234);
  // goods: jars, bolts of silk, baskets
  for (let gI = 0; gI < 8; gI++) { x.fillStyle = ["#c8823a", "#e8c070", "#a8323a", "#3f6a9a", "#f0e0b0"][(gI + k) % 5]; x.beginPath(); x.ellipse(170 + gI * 98, 960, 36, 52, 0, 0, 7); x.fill(); }
  for (let gI = 0; gI < 4; gI++) { x.fillStyle = "rgba(255,240,200,0.6)"; x.fillRect(150 + gI * 200, 830, 120, 12); }
  for (let s = 0; s < 3; s++) { x.fillStyle = "#6a3a20"; x.fillRect(110 + s * ((w - 220) / 2) - 6, 790, 14, 234); }
  x.textBaseline = "alphabetic";
});
const roofTex = () => tex("roof", 512, 256, (x, w, h) => { x.fillStyle = "#a84a32"; x.fillRect(0, 0, w, h); for (let j = 0; j < 8; j++) for (let i = 0; i < 18; i++) { x.fillStyle = rnd(i * 7 + j) > 0.5 ? "#b85a3a" : "#983e2a"; x.beginPath(); x.ellipse(i * 30 + (j % 2) * 15, j * 32 + 16, 14, 16, 0, 0, Math.PI); x.fill(); } }, [4, 1]);
const groundTex = () => tex("street", 1024, 1024, (x, w, h) => {
  x.fillStyle = "#b8a07a"; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 1200; i++) { x.fillStyle = `rgba(${rnd(i) > 0.5 ? "90,70,50" : "230,210,170"},${0.06 + rnd(i * 3) * 0.1})`; x.beginPath(); x.arc(rnd(i * 5) * w, rnd(i * 7) * h, 2 + rnd(i * 9) * 8, 0, 7); x.fill(); }
  // stone kerbs and sidewalks at both sides
  for (const sx of [0, w - 230]) { x.fillStyle = "#c8c0b0"; x.fillRect(sx, 0, 230, h); for (let j = 0; j < 16; j++) for (let i = 0; i < 3; i++) { x.strokeStyle = "rgba(80,70,60,0.35)"; x.lineWidth = 3; x.strokeRect(sx + i * 77, j * 64 + (i % 2) * 32, 77, 64); } }
  x.fillStyle = "#8a8070"; x.fillRect(222, 0, 14, h); x.fillRect(w - 236, 0, 14, h);
}, [1, 3]);
export const Tree: React.FC<{ p: V3; s?: number; flowers?: boolean }> = ({ p, s = 1, flowers = true }) => (
  <group position={p} scale={s}>
    <mesh position={[0, 1.2, 0]} castShadow><cylinderGeometry args={[0.1, 0.16, 2.4, 10]} /><Mat c="#6a4a32" r={0.9} /></mesh>
    {[[0, 2.7, 0, 1.0], [0.6, 2.4, 0.2, 0.7], [-0.6, 2.5, -0.1, 0.75], [0.1, 2.5, 0.6, 0.65], [-0.2, 3.1, -0.3, 0.6]].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} castShadow><sphereGeometry args={[r, 14, 10]} /><Mat c={flowers && i % 2 ? "#e0503a" : "#4f8a3a"} r={0.9} /></mesh>
    ))}
  </group>
);
export const LampPost: React.FC<{ p: V3; on?: boolean }> = ({ p, on }) => (
  <group position={p}>
    <mesh position={[0, 1.4, 0]} castShadow><cylinderGeometry args={[0.035, 0.06, 2.8, 10]} /><Mat c="#2a3a34" r={0.5} /></mesh>
    <mesh position={[0, 2.92, 0]}><boxGeometry args={[0.24, 0.3, 0.24]} /><Mat c="#fff3c0" e="#ffcf6a" ei={on ? 1.8 : 0.3} r={0.3} /></mesh>
    <mesh position={[0, 3.12, 0]}><coneGeometry args={[0.2, 0.16, 4]} /><Mat c="#2a3a34" r={0.5} /></mesh>
  </group>
);
/** A red paper lantern (glows at night). */
export const Lantern: React.FC<{ p: V3; on?: boolean }> = ({ p, on }) => (
  <group position={p}>
    <mesh scale={[1, 1.15, 1]}><sphereGeometry args={[0.16, 16, 12]} /><Mat c="#d8322a" e="#ff6a3a" ei={on ? 1.4 : 0.15} r={0.6} /></mesh>
    {[-0.17, 0.17].map((y) => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.07, 0.07, 0.04, 12]} /><Mat c="#2a2420" r={0.5} /></mesh>)}
  </group>
);
/** The sewer grate set in the street (a dark hole under iron bars), centred at p. */
export const Grate: React.FC<{ p?: V3; shine?: number }> = ({ p = [0, 0, 0], shine = 0 }) => (
  <group position={p}>
    <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.95, 0.65]} /><Mat c="#8a8a90" r={0.5} /></mesh>
    <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.8, 0.5]} /><meshBasicMaterial color="#120e10" /></mesh>
    {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[-0.33 + i * 0.11, 0.02, 0]} castShadow><boxGeometry args={[0.04, 0.03, 0.52]} /><Mat c="#4a4a52" e="#fff2c0" ei={shine * 0.6} r={0.3} /></mesh>)}
  </group>
);
/** A shoulder pole with two baskets (a street vendor's), resting on the ground. */
const Baskets: React.FC<{ p: V3; r?: number }> = ({ p, r = 0 }) => (
  <group position={p} rotation={[0, r, 0]}>
    {[-0.45, 0.45].map((x) => <mesh key={x} position={[x, 0.16, 0]} castShadow><cylinderGeometry args={[0.2, 0.16, 0.32, 16]} /><Mat c="#b8904a" r={0.9} /></mesh>)}
    {[-0.45, 0.45].map((x) => <mesh key={"f" + x} position={[x, 0.32, 0]} scale={[1, 0.4, 1]}><sphereGeometry args={[0.18, 12, 8]} /><Mat c={x < 0 ? "#f2c84a" : "#7ab04a"} r={0.9} /></mesh>)}
    <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.02, 0.02, 1.3, 8]} /><Mat c="#8a6a3a" r={0.8} /></mesh>
  </group>
);
/** A rickshaw (a two-wheeled pulled cart). */
const Rickshaw: React.FC<{ p: V3; r?: number }> = ({ p, r = 0 }) => (
  <group position={p} rotation={[0, r, 0]}>
    {[-0.42, 0.42].map((x) => <mesh key={x} position={[x, 0.42, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[0.4, 0.03, 8, 28]} /><Mat c="#2a2420" r={0.6} /></mesh>)}
    <mesh position={[0, 0.62, 0]} castShadow><boxGeometry args={[0.7, 0.12, 0.6]} /><Mat c="#2a2a30" r={0.5} /></mesh>
    <mesh position={[0, 0.95, -0.25]} rotation={[0.3, 0, 0]} castShadow><boxGeometry args={[0.7, 0.6, 0.08]} /><Mat c="#8a2a2a" r={0.6} /></mesh>
    <mesh position={[0, 1.3, -0.1]} rotation={[0.5, 0, 0]} castShadow><cylinderGeometry args={[0.42, 0.42, 0.6, 16, 1, true, -Math.PI / 2, Math.PI]} /><Mat c="#1e1e24" r={0.6} side={THREE.DoubleSide} /></mesh>
    {[-0.3, 0.3].map((x) => <mesh key={"s" + x} position={[x, 0.55, 0.85]} rotation={[Math.PI / 2 - 0.15, 0, 0]} castShadow><cylinderGeometry args={[0.02, 0.02, 1.4, 8]} /><Mat c="#6a4a2a" r={0.6} /></mesh>)}
  </group>
);
const townHallTex = (g: Grade) => tex("hall" + g, 1024, 768, (x, w, h) => {
  x.fillStyle = "#f2dca0"; x.fillRect(0, 0, w, h);
  x.fillStyle = "rgba(255,250,235,0.7)"; for (const yy of [120, 400]) x.fillRect(0, yy, w, 22);
  for (let i = 0; i < 6; i++) { const cx = 90 + i * 170; x.fillStyle = dark(g) ? "#ffcf7a" : "#3d4a5e"; x.beginPath(); x.roundRect(cx - 50, 170, 100, 190, [50, 50, 0, 0]); x.fill(); x.beginPath(); x.roundRect(cx - 50, 460, 100, 210, [50, 50, 0, 0]); x.fill(); x.fillStyle = "#f4efe2"; x.fillRect(cx - 70, 150, 12, 520); }
  x.fillStyle = "#2b3a5a"; x.fillRect(260, 30, 504, 80); x.fillStyle = "#f2d38a"; x.font = F(900, 60); x.textAlign = "center"; x.fillText("HÔTEL DE VILLE", w / 2, 92);
  x.fillStyle = "#5a3a26"; x.beginPath(); x.roundRect(w / 2 - 80, 520, 160, 248, [80, 80, 0, 0]); x.fill();
});
/** The street: along -z from the camera side, houses at x = ±4, the town hall at z = -22, the grate at the origin. */
export const Street: React.FC<{ g?: Grade; children?: React.ReactNode; grate?: number; lanterns?: boolean; spot?: V3; aim?: V3 }> = ({ g = "day", children, grate = 0, lanterns, spot, aim }) => {
  const night = dark(g);
  return (
    <>
      <Lights g={g} spot={spot} aim={aim} sh={10} />
      <Sky g={g} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]} receiveShadow><planeGeometry args={[8.4, 40]} /><Mat map={groundTex()} c={night ? "#9a90b0" : "#fff"} r={0.95} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -8]}><planeGeometry args={[60, 60]} /><Mat c={night ? "#4a4458" : "#a89878"} r={1} /></mesh>
      {[-1, 1].map((side) => Array.from({ length: 6 }, (_, i) => {
        const z = 6 - i * 5.2, k = i * 2 + (side > 0 ? 1 : 0), hgt = 7 + (k % 3) * 0.5;
        return (
          <group key={side + "" + i} position={[side * 4.35, 0, z]} rotation={[0, -side * Math.PI / 2, 0]}>
            <mesh position={[0, hgt / 2, 0]} receiveShadow><boxGeometry args={[5.2, hgt, 0.3]} /><Mat map={houseTex(k, g)} r={0.9} /></mesh>
            <mesh position={[0, hgt + 0.45, -0.6]} rotation={[0.55, 0, 0]} castShadow><boxGeometry args={[5.3, 0.08, 1.9]} /><Mat map={roofTex()} r={0.85} /></mesh>
            <mesh position={[0, 2.62, 0.45]} castShadow><boxGeometry args={[5.0, 0.06, 0.9]} /><Mat c={["#c84040", "#3f6b8a", "#3f7a52", "#d8a040"][k % 4]} r={0.8} /></mesh>
          </group>
        );
      }))}
      <mesh position={[0, 4.2, -21.5]} receiveShadow><boxGeometry args={[12, 8.4, 0.4]} /><Mat map={townHallTex(g)} r={0.9} /></mesh>
      <mesh position={[0, 8.9, -21.5]}><cylinderGeometry args={[0.8, 0.8, 0.2, 24]} /><Mat c="#f4efe2" r={0.7} /></mesh>
      {[-2.9, 2.9].map((x) => [3.5, -3.5, -10.5].map((z) => <Tree key={x + "" + z} p={[x, 0, z]} s={0.95} />))}
      {[-3.1, 3.1].map((x) => [0, -7].map((z) => <LampPost key={x + "" + z} p={[x, 0, z]} on={night} />))}
      <Baskets p={[2.6, 0, 1.4]} r={0.4} />
      <Baskets p={[-2.7, 0, -5.2]} r={-0.3} />
      <Rickshaw p={[2.2, 0, -8.5]} r={0.5} />
      {[[-3.4, 1.0], [3.4, -4.6], [-3.3, -3.6]].map(([x, z], i) => <mesh key={i} position={[x, 0.3, z]} rotation={[0, i, 0]} castShadow receiveShadow><boxGeometry args={[0.55, 0.6, 0.55]} /><Mat c="#b98552" r={0.85} /></mesh>)}
      {lanterns && [-6, -1, 4].map((z) => [-2, -0.7, 0.7, 2].map((x, i) => <Lantern key={z + "" + x} p={[x, 3.2 - Math.abs(i - 1.5) * 0.12, z]} on={night} />))}
      {lanterns && [-6, -1, 4].map((z) => <mesh key={"w" + z} position={[0, 3.35, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.006, 0.006, 8.4, 4]} /><Mat c="#2a2420" /></mesh>)}
      <Grate shine={grate} />
      {children}
    </>
  );
};

// ---------- the sewer tunnel , running along z ----------
export const SEWER: V3 = [0, 0, 0];
const brickTex = (key: string, a: string, b: string, rep: [number, number]) => tex("brick" + key, 512, 512, (x, w, h) => {
  x.fillStyle = b; x.fillRect(0, 0, w, h);
  for (let j = 0; j < 16; j++) for (let i = 0; i < 9; i++) { const k = rnd(i * 13 + j * 7 + key.length); x.fillStyle = `rgb(${parseInt(a.slice(1, 3), 16) - 20 + k * 40},${parseInt(a.slice(3, 5), 16) - 15 + k * 30},${parseInt(a.slice(5, 7), 16) - 10 + k * 20})`; x.fillRect(i * 64 - (j % 2) * 32 + 3, j * 32 + 3, 58, 26); }
}, rep);
export const Sewer: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <group position={SEWER}>
    <hemisphereLight args={["#ffe2b8", "#3a4a48", 1.0]} />
    <directionalLight position={[0, 3, 4]} intensity={0.9} color="#ffe8c8" />
    {[2, -4, -10].map((z) => <pointLight key={z} position={[0, 1.9, z]} intensity={6} distance={7} decay={1.4} color="#ffc070" />)}
    <mesh position={[0, 0.2, -6]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[2, 2, 24, 32, 1, true, Math.PI / 2, Math.PI]} /><Mat map={brickTex("sewer", "#a8664a", "#5a3a2e", [6, 8])} side={THREE.BackSide} r={0.85} /></mesh>
    <mesh position={[0, 0.2, -6]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[2, 2, 24, 32, 1, true, -Math.PI / 2, Math.PI]} /><Mat c="#3a2e2a" side={THREE.BackSide} r={0.85} /></mesh>
    {/* walkways and the water channel */}
    {[-1, 1].map((s) => <mesh key={s} position={[s * 1.05, 0.0, -6]} receiveShadow><boxGeometry args={[1.2, 0.4, 24]} /><Mat map={brickTex("walk", "#b0a090", "#6a5a50", [2, 24])} r={0.9} /></mesh>)}
    <mesh position={[0, 0.06, -6]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.9, 24]} /><Mat c="#4a8a7a" e="#1a4a3a" ei={0.4} r={0.15} /></mesh>
    {[2, -4, -10].map((z) => <mesh key={z} position={[0, 1.95, z]}><sphereGeometry args={[0.1, 12, 8]} /><meshBasicMaterial color="#fff0b0" /></mesh>)}
    {[-1.6, 1.6].map((x) => <mesh key={x} position={[x, 1.3, -6]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.07, 0.07, 24, 10]} /><Mat c="#6a7a6a" r={0.4} /></mesh>)}
    {/* a road sign for the rats */}
    <mesh position={[-1.2, 1.15, -1.5]} rotation={[0, 0.5, 0]}><planeGeometry args={[0.8, 0.4]} /><Mat map={tex("ratsign", 256, 128, (x, w, h) => { x.fillStyle = "#3f7a52"; x.fillRect(0, 0, w, h); x.strokeStyle = "#fff"; x.lineWidth = 8; x.strokeRect(6, 6, w - 12, h - 12); x.fillStyle = "#fff"; x.font = F(900, 40); x.textAlign = "center"; x.fillText("CENTRE →", w / 2, 60); x.font = F(800, 26); x.fillText("toilets 200 m", w / 2, 100); })} r={0.6} /></mesh>
    {children}
  </group>
);

// ---------- the fancy bathroom  ----------
export const BATH: V3 = [0, 0, 0];
const tilesTex = () => tex("tiles", 512, 512, (x, w, h) => { for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = (i + j) % 2 ? "#f4f0e6" : "#2a3a4a"; x.fillRect(i * 64, j * 64, 64, 64); } }, [5, 5]);
const wallTileTex = () => tex("wtile", 512, 512, (x, w, h) => {
  x.fillStyle = "#e8f0ee"; x.fillRect(0, 0, w, h);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const cx = i * 64 + 32, cy = j * 64 + 32; x.strokeStyle = "#c8d4d0"; x.lineWidth = 3; x.strokeRect(i * 64, j * 64, 64, 64); x.fillStyle = "#3a7a9a"; x.beginPath(); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; x.ellipse(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, 10, 5, a, 0, 7); } x.fill(); x.fillStyle = "#e0b040"; x.beginPath(); x.arc(cx, cy, 6, 0, 7); x.fill(); }
}, [6, 3]);
const viewTex = () => tex("bview", 512, 512, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#7ab8e8"); g.addColorStop(1, "#e0eef2"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 7; i++) { const bx = i * 78 - 10, bh = 140 + rnd(i * 5) * 180; x.fillStyle = COLS[i % 6]; x.fillRect(bx, h - bh, 74, bh); x.fillStyle = "#a84a32"; x.beginPath(); x.moveTo(bx - 6, h - bh); x.lineTo(bx + 37, h - bh - 36); x.lineTo(bx + 80, h - bh); x.fill(); x.fillStyle = "#3f7a5a"; for (let k = 0; k < 4; k++) x.fillRect(bx + 12 + (k % 2) * 34, h - bh + 24 + Math.floor(k / 2) * 60, 16, 30); }
  x.fillStyle = "#4f8a3a"; for (let i = 0; i < 6; i++) { x.beginPath(); x.arc(rnd(i) * w, h - 20, 40, 0, 7); x.fill(); }
  x.strokeStyle = "#f4efe2"; x.lineWidth = 18; x.strokeRect(0, 0, w, h); x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke();
});
const bowlGeo = (() => { let g: THREE.LatheGeometry | null = null; return () => g ?? (g = new THREE.LatheGeometry([[0.12, 0], [0.14, 0.2], [0.19, 0.32], [0.22, 0.4], [0.2, 0.41], [0.15, 0.34]].map(([a, b]) => new THREE.Vector2(a, b)), 32)); })();
/** A pull-chain toilet facing +z at p; lid (0 closed .. 1 wide open), water bubbling (0..1). */
export const Toilet: React.FC<{ p: V3; lid?: number; bubble?: number; t?: number }> = ({ p, lid = 0, bubble = 0, t = 0 }) => (
  <group position={p}>
    <mesh geometry={bowlGeo()} scale={[1, 1, 1.25]} castShadow receiveShadow><Mat c="#fbfbf8" r={0.25} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 0.33 + bubble * 0.02 * Math.sin(t * 40), 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.25, 1]}><circleGeometry args={[0.15, 24]} /><Mat c="#8ac8e0" e="#3a7a9a" ei={0.2} r={0.1} /></mesh>
    <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.25, 1]}><torusGeometry args={[0.2, 0.025, 10, 32]} /><Mat c="#6a3a20" r={0.4} /></mesh>
    <group position={[0, 0.44, -0.24]} rotation={[-lid * 1.7, 0, 0]}>
      <mesh position={[0, 0, 0.24]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.25, 1]} castShadow><cylinderGeometry args={[0.22, 0.22, 0.03, 32]} /><Mat c="#7a4424" r={0.4} /></mesh>
    </group>
    <mesh position={[0, 0.3, -0.32]} castShadow><boxGeometry args={[0.26, 0.6, 0.12]} /><Mat c="#fbfbf8" r={0.3} /></mesh>
    {/* the high tank, pipe and chain */}
    <mesh position={[0, 1.9, -0.28]} castShadow><boxGeometry args={[0.5, 0.26, 0.2]} /><Mat c="#6a3a20" r={0.5} /></mesh>
    <mesh position={[0.15, 1.15, -0.32]}><cylinderGeometry args={[0.025, 0.025, 1.5, 8]} /><Mat c="#c8a050" r={0.3} /></mesh>
    <mesh position={[-0.2, 1.55, -0.18]}><cylinderGeometry args={[0.005, 0.005, 0.7, 4]} /><Mat c="#c8a050" r={0.3} /></mesh>
    <mesh position={[-0.2, 1.17, -0.18]}><sphereGeometry args={[0.035, 10, 8]} /><Mat c="#f4efe2" r={0.4} /></mesh>
  </group>
);
export const Bathroom: React.FC<{ children?: React.ReactNode; lid?: number; bubble?: number; t?: number }> = ({ children, lid, bubble, t }) => (
  <group position={BATH}>
    <hemisphereLight args={["#fff6e8", "#7a6a5a", 1.1]} />
    <directionalLight position={[2, 4, 4]} intensity={1.7} color="#fff0d8" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0005} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[7, 7]} /><Mat map={tilesTex()} r={0.35} /></mesh>
    <mesh position={[0, 1.8, -2]} receiveShadow><planeGeometry args={[7, 3.6]} /><Mat map={wallTileTex()} r={0.5} /></mesh>
    <mesh position={[-2.5, 1.8, 0.5]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[6, 3.6]} /><Mat map={wallTileTex()} r={0.5} /></mesh>
    <mesh position={[2.5, 1.8, 0.5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow><planeGeometry args={[6, 3.6]} /><Mat map={wallTileTex()} r={0.5} /></mesh>
    <mesh position={[0, 0.6, -1.98]}><planeGeometry args={[7, 0.08]} /><Mat c="#c8a050" r={0.3} /></mesh>
    <Toilet p={[0, 0, -1.6]} lid={lid} bubble={bubble} t={t} />
    {/* window with a view of the town */}
    <mesh position={[1.4, 1.85, -1.99]}><planeGeometry args={[1.0, 1.2]} /><meshBasicMaterial map={viewTex()} /></mesh>
    {/* claw-foot tub on the left */}
    <group position={[-1.7, 0, -0.8]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0.42, 0]} scale={[1, 0.6, 0.45]} castShadow><sphereGeometry args={[0.75, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /><Mat c="#f8f6f0" r={0.25} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.45, 1]}><torusGeometry args={[0.75, 0.03, 8, 40]} /><Mat c="#f8f6f0" r={0.25} /></mesh>
      {[[-0.5, -0.2], [0.5, -0.2], [-0.5, 0.2], [0.5, 0.2]].map(([x, z], i) => <mesh key={i} position={[x, 0.08, z]}><sphereGeometry args={[0.07, 10, 8]} /><Mat c="#c8a050" r={0.3} /></mesh>)}
    </group>
    {/* sink, mirror, towel, plant */}
    <group position={[1.6, 0, -1.7]}>
      <mesh position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[0.06, 0.1, 0.9, 12]} /><Mat c="#fbfbf8" r={0.3} /></mesh>
      <mesh position={[0, 0.92, 0]} scale={[1, 0.35, 0.8]} castShadow><sphereGeometry args={[0.3, 20, 10]} /><Mat c="#fbfbf8" r={0.25} /></mesh>
    </group>
    <mesh position={[1.6, 1.55, -1.97]}><circleGeometry args={[0.3, 32]} /><Mat c="#c8dce4" r={0.05} /></mesh>
    <mesh position={[1.6, 1.55, -1.975]}><circleGeometry args={[0.34, 32]} /><Mat c="#c8a050" r={0.3} /></mesh>
    <mesh position={[-0.9, 1.2, -1.95]} castShadow><boxGeometry args={[0.5, 0.7, 0.04]} /><Mat c="#d86a8a" r={0.9} /></mesh>
    <group position={[2.0, 0, -0.6]}>
      <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.2, 0.16, 0.4, 14]} /><Mat c="#3a7a9a" r={0.5} /></mesh>
      {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[Math.sin(i * 1.3) * 0.15, 0.6 + i * 0.08, Math.cos(i * 1.3) * 0.15]} rotation={[Math.sin(i) * 0.6, i, Math.cos(i) * 0.6]} scale={[0.3, 1, 0.08]} castShadow><sphereGeometry args={[0.3, 10, 8]} /><Mat c="#4f8a3a" r={0.8} /></mesh>)}
    </group>
    {children}
  </group>
);

// ---------- the bounty office: the counting room  ----------
export const OFFICE: V3 = [0, 0, 0];
const plaqueTex = () => tex("prime", 1024, 300, (x, w, h) => {
  x.fillStyle = "#2b2b33"; x.fillRect(0, 0, w, h); x.strokeStyle = "#d8b04a"; x.lineWidth = 12; x.strokeRect(14, 14, w - 28, h - 28);
  x.fillStyle = "#f2d38a"; x.textAlign = "center"; x.font = F(900, 92); x.fillText("BUREAU DES PRIMES", w / 2, 128); x.font = F(800, 58); x.fillText("1 CENT PAR QUEUE DE RAT", w / 2, 222);
});
const shelfTex = () => tex("ledgers", 1024, 512, (x, w, h) => {
  x.fillStyle = "#5a3a24"; x.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) { let px = 12; while (px < w - 20) { const bw = 22 + rnd(px + r * 99) * 26, bh = 86 + rnd(px * 3 + r) * 30; x.fillStyle = ["#8a2a2a", "#2a4a7a", "#3a6a3a", "#c8a050", "#6a3a2a"][Math.floor(rnd(px * 7 + r) * 5)]; x.fillRect(px, (r + 1) * 128 - 8 - bh, bw, bh); x.fillStyle = "rgba(255,230,160,0.6)"; x.fillRect(px + 3, (r + 1) * 128 - 8 - bh + 14, bw - 6, 5); px += bw + 2; } x.fillStyle = "#3a2416"; x.fillRect(0, (r + 1) * 128 - 8, w, 10); }
});
const ledgerTex = () => tex("ledger", 512, 360, (x, w, h) => {
  x.fillStyle = "#fbf6e6"; x.fillRect(0, 0, w, h); x.fillStyle = "#c8b890"; x.fillRect(w / 2 - 3, 0, 6, h);
  x.fillStyle = "#2a3a7a"; x.font = F(800, 22);
  for (let p = 0; p < 2; p++) for (let i = 0; i < 11; i++) { const y = 30 + i * 30; x.fillText(["|||| |||| ||", "|||| |||| ||||", "|||| |||", "|||| |||| |||| |"][(i + p) % 4], 20 + p * w / 2, y); x.fillStyle = "#a8323a"; x.fillText((1000 + i * 1371 + p * 9000).toLocaleString("en-US"), 170 + p * w / 2, y); x.fillStyle = "#2a3a7a"; }
});
const crateTex = (label: string) => tex("crate" + label, 256, 256, (x, w, h) => {
  x.fillStyle = "#b98552"; x.fillRect(0, 0, w, h); for (let i = 0; i < 5; i++) { x.fillStyle = "rgba(0,0,0,0.12)"; x.fillRect(0, i * 52, w, 4); }
  x.strokeStyle = "#7a5030"; x.lineWidth = 14; x.strokeRect(7, 7, w - 14, h - 14);
  if (label) { x.fillStyle = "#3a2416"; x.font = F(900, 48); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(label, w / 2, h / 2); }
});
/** An open wooden crate full of tails at p (size s). */
export const TailCrate: React.FC<{ p: V3; s?: number; label?: string; fill?: number; r?: number; children?: React.ReactNode }> = ({ p, s = 1, label = "QUEUES", fill = 1, r = 0, children }) => {
  const m = crateTex(label);
  return (
    <group position={p} scale={s} rotation={[0, r, 0]}>
      {[[0, 0.2, 0.3, 0.6, 0.4, 0.03], [0, 0.2, -0.3, 0.6, 0.4, 0.03]].map(([x, y, z, w, h, d], i) => <mesh key={i} position={[x, y, z]} castShadow receiveShadow><boxGeometry args={[w, h, d]} /><Mat map={m} r={0.85} /></mesh>)}
      {[-0.3, 0.3].map((x) => <mesh key={x} position={[x, 0.2, 0]} castShadow><boxGeometry args={[0.03, 0.4, 0.6]} /><Mat map={crateTex("")} r={0.85} /></mesh>)}
      <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.6, 0.03, 0.6]} /><Mat c="#8a5a32" r={0.85} /></mesh>
      {fill > 0 && <mesh position={[0, 0.04 + 0.34 * fill, 0]} scale={[1, 0.35, 1]}><sphereGeometry args={[0.29, 16, 10]} /><Mat map={tailsTex()} r={0.6} /></mesh>}
      {children}
    </group>
  );
};
/** A painted mass of tails (for big crate fills and heaps seen from afar). */
export const tailsTex = () => tex("tails", 512, 512, (x, w, h) => {
  x.fillStyle = "#c8707e"; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 220; i++) { x.strokeStyle = rnd(i) > 0.5 ? "#f4a3b4" : "#e07f95"; x.lineWidth = 7 - rnd(i * 3) * 3; x.lineCap = "round"; x.beginPath(); const a = rnd(i * 5) * w, b = rnd(i * 7) * h; x.moveTo(a, b); x.bezierCurveTo(a + 40, b - 30 + rnd(i) * 60, a + 60, b + 30, a + 100 * (rnd(i * 9) - 0.3), b + 60 * (rnd(i * 11) - 0.5)); x.stroke(); }
});
/** Crates of tails stacked on both sides of the desk (bottom rows first). */
export const CRATE_AT: V3[] = [[-2.3, 0, -1.4], [-2.95, 0, -1.2], [2.3, 0, -1.4], [2.95, 0, -1.2], [-2.6, 0.42, -1.3], [2.6, 0.42, -1.3], [-2.3, 0, -0.6], [2.3, 0, -0.6], [-2.95, 0.42, -1.2], [2.95, 0.42, -1.2], [-2.45, 0.84, -1.3], [2.45, 0.84, -1.3]];
export const Office: React.FC<{ children?: React.ReactNode; g?: Grade; crates?: number; fill?: V3 }> = ({ children, g = "day", crates = 6, fill }) => (
  <group position={OFFICE}>
    {g === "violet" ? <Lights g="violet" at={OFFICE} spot={[OFFICE[0], 5, 2]} aim={[OFFICE[0], 0.8, -0.6]} sh={5} fill={fill ?? [0, 1.4, 2.5]} /> : (<>
      <hemisphereLight args={["#fff2dc", "#6a4a32", 1.05]} />
      <directionalLight position={[2, 5, 4]} intensity={1.7} color="#fff0d8" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-bias={-0.0005} />
    </>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[12, 12]} /><Mat map={tex("wood", 512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? "#9a6a40" : "#a8784a"; x.fillRect(0, i * 64, w, 64); x.fillStyle = "rgba(0,0,0,0.25)"; x.fillRect(0, i * 64, w, 3); x.fillRect(rnd(i) * w, i * 64, 3, 64); } }, [5, 5])} c={g === "violet" ? "#a890d0" : "#fff"} r={0.7} /></mesh>
    <mesh position={[0, 2.2, -2.6]} receiveShadow><planeGeometry args={[12, 4.4]} /><Mat c={g === "violet" ? "#5a4a8a" : "#e8d8a8"} r={0.9} /></mesh>
    <mesh position={[0, 0.5, -2.58]}><planeGeometry args={[12, 1.0]} /><Mat c={g === "violet" ? "#3a2a5a" : "#6a4a2a"} r={0.8} /></mesh>
    <mesh position={[-4.5, 2.2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[8, 4.4]} /><Mat c={g === "violet" ? "#4a3a7a" : "#e0d0a0"} r={0.9} /></mesh>
    <mesh position={[0.4, 3.1, -2.57]}><planeGeometry args={[3.2, 0.94]} /><Mat map={plaqueTex()} r={0.6} /></mesh>
    <mesh position={[-2.6, 1.7, -2.57]}><planeGeometry args={[2.2, 1.6]} /><Mat map={shelfTex()} r={0.8} /></mesh>
    <mesh position={[3.0, 1.9, -2.57]}><planeGeometry args={[1.2, 1.3]} /><meshBasicMaterial map={viewTex()} color={g === "violet" ? "#8070b0" : "#fff"} /></mesh>
    {/* the wall clock */}
    <group position={[2.0, 3.1, -2.55]}><mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.28, 0.28, 0.06, 28]} /><Mat c="#6a3a20" r={0.5} /></mesh><mesh position={[0, 0, 0.035]}><circleGeometry args={[0.23, 28]} /><Mat c="#fbf6e6" r={0.8} /></mesh><mesh position={[0, 0.07, 0.04]}><boxGeometry args={[0.015, 0.15, 0.01]} /><Mat c="#1e1e24" /></mesh><mesh position={[0.05, 0, 0.04]} rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.015, 0.11, 0.01]} /><Mat c="#1e1e24" /></mesh></group>
    {/* the long counting desk */}
    <mesh position={[0, 0.53, -0.7]} castShadow receiveShadow><boxGeometry args={[3.4, 0.07, 1.0]} /><Mat c="#7a4a2a" r={0.55} /></mesh>
    <mesh position={[0, 0.265, -0.22]} receiveShadow><boxGeometry args={[3.4, 0.53, 0.04]} /><Mat c="#6a3a20" r={0.6} /></mesh>
    <mesh position={[-0.2, 0.571, -0.65]} rotation={[-Math.PI / 2, 0, 0.04]}><planeGeometry args={[0.7, 0.49]} /><Mat map={ledgerTex()} r={0.85} /></mesh>
    <group position={[-1.2, 0.565, -0.75]}><mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.02, 0.06, 0.4, 10]} /><Mat c="#c8a050" r={0.4} /></mesh><mesh position={[0, 0.45, 0]}><coneGeometry args={[0.18, 0.16, 16, 1, true]} /><Mat c="#3f8a5a" e="#ffd890" ei={0.4} side={THREE.DoubleSide} r={0.5} /></mesh></group>
    {/* stacked crates of tails behind the desk */}
    {CRATE_AT.slice(0, crates).map((c, i) => <TailCrate key={i} p={c} s={1.05} fill={1} r={(i % 3 - 1) * 0.08} />)}
    {children}
  </group>
);

// ---------- the rice fields and the rat barn  ----------
export const FARM: V3 = [0, 0, 0];
const paddyTex = () => tex("paddy", 1024, 1024, (x, w, h) => {
  x.fillStyle = "#6aa84a"; x.fillRect(0, 0, w, h);
  for (let j = 0; j < 64; j++) for (let i = 0; i < 64; i++) { x.fillStyle = rnd(i * 31 + j) > 0.5 ? "#7ab84f" : "#5a983f"; x.fillRect(i * 16 + 4, j * 16 + 2, 6, 12); }
  for (let k = 0; k < 4; k++) { x.fillStyle = "#a89060"; x.fillRect(0, k * 256, w, 14); x.fillRect(k * 256, 0, 14, h); }
  x.fillStyle = "rgba(150,200,230,0.25)"; for (let i = 0; i < 40; i++) x.fillRect(rnd(i) * w, rnd(i * 3) * h, 60, 6);
}, [6, 6]);
const plankTex = (key: string, a: string, rep: [number, number]) => tex("plank" + key, 512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? a : "#8a5a32"; x.fillRect(i * 64, 0, 64, h); x.fillStyle = "rgba(0,0,0,0.25)"; x.fillRect(i * 64, 0, 4, h); for (let k = 0; k < 3; k++) { x.fillStyle = "rgba(60,30,10,0.4)"; x.beginPath(); x.ellipse(i * 64 + 32, rnd(i * 3 + k) * h, 6, 10, 0, 0, 7); x.fill(); } } }, rep);
const thatchTex = () => tex("thatch", 512, 256, (x, w, h) => { x.fillStyle = "#c8a45a"; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.strokeStyle = rnd(i) > 0.5 ? "#a8843a" : "#e0c070"; x.lineWidth = 2; const a = rnd(i * 3) * w, b = rnd(i * 5) * h; x.beginPath(); x.moveTo(a, b); x.lineTo(a + (rnd(i * 7) - 0.5) * 6, b + 26); x.stroke(); } }, [3, 1]);
const gableGeo = (() => { let g: THREE.ShapeGeometry | null = null; return () => { if (g) return g; const sh = new THREE.Shape(); sh.moveTo(-3, 2.8); sh.lineTo(3, 2.8); sh.lineTo(0, 4.85); sh.closePath(); return (g = new THREE.ShapeGeometry(sh)); }; })();
/** The barn: 6 x 4 m, doors on its +z wall at z = 2 (open 0..1), interior from z = -2 to 2. */
export const Barn: React.FC<{ doors?: number; inside?: boolean }> = ({ doors = 0, inside = true }) => {
  const wall = plankTex("barn", "#9a6a3a", [3, 1]);
  return (
    <group>
      {/* walls: back, sides, front with a 2 m doorway */}
      <mesh position={[0, 1.4, -2]} castShadow receiveShadow><boxGeometry args={[6, 2.8, 0.12]} /><Mat map={wall} r={0.9} /></mesh>
      {[-3, 3].map((x) => <mesh key={x} position={[x, 1.4, 0]} castShadow receiveShadow><boxGeometry args={[0.12, 2.8, 4]} /><Mat map={wall} r={0.9} /></mesh>)}
      {[-2, 2].map((x) => <mesh key={x} position={[x, 1.4, 2]} castShadow receiveShadow><boxGeometry args={[2, 2.8, 0.12]} /><Mat map={wall} r={0.9} /></mesh>)}
      <mesh position={[0, 2.5, 2]} castShadow><boxGeometry args={[2, 0.6, 0.12]} /><Mat map={wall} r={0.9} /></mesh>
      {/* gable roof of thatch: two panels on a 0.6 rad pitch, ridge along z, and the two gable triangles */}
      {[-1, 1].map((s) => <mesh key={s} position={[s * 1.5, 3.86, 0]} rotation={[0, 0, -s * 0.6]} castShadow><boxGeometry args={[4.0, 0.14, 4.8]} /><Mat map={thatchTex()} r={0.95} /></mesh>)}
      {[-1, 1].map((s) => <mesh key={"g" + s} position={[0, 0, s * 2]} geometry={gableGeo()}><Mat c="#8a5a32" r={0.9} side={THREE.DoubleSide} /></mesh>)}
      {/* doors, swinging out */}
      {[-1, 1].map((s) => (
        <group key={"d" + s} position={[s * 1, 0, 2.08]} rotation={[0, s * doors * 1.9, 0]}>
          <mesh position={[-s * 0.5, 1.1, 0]} castShadow><boxGeometry args={[1, 2.2, 0.08]} /><Mat map={plankTex("door", "#a8743e", [1, 1])} r={0.9} /></mesh>
          <mesh position={[-s * 0.5, 1.1, 0.05]} rotation={[0, 0, s * 1.1]}><boxGeometry args={[0.08, 2.3, 0.02]} /><Mat c="#6a4020" r={0.8} /></mesh>
        </group>
      ))}
      {inside && <>
        <pointLight position={[0, 2.3, 0]} intensity={5} distance={6} decay={1.3} color="#ffd890" />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow><planeGeometry args={[5.9, 3.9]} /><Mat map={tex("straw", 512, 512, (x, w, h) => { x.fillStyle = "#d8b45a"; x.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { x.strokeStyle = rnd(i) > 0.5 ? "#b8902e" : "#f0d27a"; x.lineWidth = 2; const a = rnd(i * 3) * w, b = rnd(i * 5) * h; x.beginPath(); x.moveTo(a, b); x.lineTo(a + 18 * (rnd(i * 7) - 0.5), b + 12); x.stroke(); } }, [3, 2])} r={0.95} /></mesh>
        {[[-2.3, -1.5], [2.3, -1.5], [-2.4, 0.4]].map(([x, z], i) => <mesh key={i} position={[x, 0.2, z]} rotation={[0, i * 0.4, 0]} castShadow receiveShadow><boxGeometry args={[0.9, 0.4, 0.5]} /><Mat map={tex("hay", 256, 128, (q, w, h) => { q.fillStyle = "#d8b45a"; q.fillRect(0, 0, w, h); for (let k = 0; k < 260; k++) { q.strokeStyle = rnd(k) > 0.5 ? "#b8902e" : "#f0d27a"; q.lineWidth = 2; q.beginPath(); const a = rnd(k * 3) * w, b = rnd(k * 5) * h; q.moveTo(a, b); q.lineTo(a + 18, b + (rnd(k * 7) - 0.5) * 10); q.stroke(); } q.fillStyle = "#8a6a2a"; q.fillRect(w * 0.3, 0, 6, h); q.fillRect(w * 0.7, 0, 6, h); })} r={0.95} /></mesh>)}
        {/* little rat beds along the back wall, a sign */}
        {[-1.2, -0.4, 0.4, 1.2].map((x, i) => <group key={x} position={[x, 0, -1.6]}><mesh position={[0, 0.06, 0]} castShadow><boxGeometry args={[0.6, 0.12, 0.4]} /><Mat c="#8a5a32" r={0.8} /></mesh><mesh position={[0, 0.13, 0]}><boxGeometry args={[0.54, 0.04, 0.34]} /><Mat c={["#d86a8a", "#6a9ad8", "#e8c060", "#7ab06a"][i]} r={0.9} /></mesh></group>)}
        <mesh position={[0, 2.0, -1.93]}><planeGeometry args={[1.6, 0.5]} /><Mat map={tex("farmsign", 512, 160, (x, w, h) => { x.fillStyle = "#f4e8c8"; x.fillRect(0, 0, w, h); x.strokeStyle = "#8a5a32"; x.lineWidth = 12; x.strokeRect(6, 6, w - 12, h - 12); x.fillStyle = "#a8323a"; x.font = F(900, 60); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("♥ HOME ♥", w / 2, h / 2 + 4); })} r={0.8} /></mesh>
        <mesh position={[0.3, 0.12, 0.2]} castShadow><boxGeometry args={[1.6, 0.24, 0.3]} /><Mat c="#7a6a5a" r={0.9} /></mesh>
        <mesh position={[0.3, 0.245, 0.2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.5, 0.22]} /><Mat c="#f8f4e8" r={0.9} /></mesh>
      </>}
    </group>
  );
};
export const Farm: React.FC<{ children?: React.ReactNode; doors?: number; g?: Grade }> = ({ children, doors = 0, g = "day" }) => (
  <group position={FARM}>
    <Lights g={g} at={FARM} sh={8} />
    <Sky g={g} hills at={FARM} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[80, 80]} /><Mat map={paddyTex()} c={dark(g) ? "#8070b0" : "#fff"} r={0.7} /></mesh>
    {/* the dirt path to the barn */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 6]} receiveShadow><planeGeometry args={[1.6, 16]} /><Mat c="#b89a6a" r={0.95} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} receiveShadow><planeGeometry args={[7, 5]} /><Mat c="#b89a6a" r={0.95} /></mesh>
    <group position={[0, 0, -2]}><Barn doors={doors} /></group>
    {/* palms, a water buffalo-free field, a scarecrow, haystacks, a fence */}
    {[[-5, -3], [5.5, -1], [-7, 4], [7, 6], [-4, 10]].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <mesh position={[0, 1.6, 0]} rotation={[0, 0, 0.08]} castShadow><cylinderGeometry args={[0.08, 0.14, 3.2, 8]} /><Mat c="#8a6a4a" r={0.9} /></mesh>
        {[0, 1, 2, 3, 4, 5].map((k) => <mesh key={k} position={[Math.cos(k) * 0.6, 3.2, Math.sin(k) * 0.6]} rotation={[Math.sin(k) * 0.5, -k, 0.6]} scale={[1.4, 0.06, 0.35]} castShadow><sphereGeometry args={[0.6, 10, 6]} /><Mat c="#4f8a3a" r={0.9} /></mesh>)}
      </group>
    ))}
    {[[3.6, 2.6], [-3.8, 1.6]].map(([x, z], i) => <mesh key={i} position={[x, 0.7, z]} castShadow><coneGeometry args={[0.8, 1.6, 14]} /><Mat map={thatchTex()} r={0.95} /></mesh>)}
    {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[-1.2 - (i % 2) * 0, 0.35, 2.8 + i * 0.9]} castShadow><boxGeometry args={[0.06, 0.7, 0.06]} /><Mat c="#8a6a4a" r={0.9} /></mesh>)}
    <mesh position={[-1.2, 0.55, 6.4]}><boxGeometry args={[0.03, 0.05, 7.4]} /><Mat c="#8a6a4a" r={0.9} /></mesh>
    {children}
  </group>
);

// ---------- the violet "You see" stage with the loop turntable  ----------
export const STAGE: V3 = [0, 0, 0];
export const Stage: React.FC<{ children?: React.ReactNode; spot?: V3; aim?: V3; fill?: V3 }> = ({ children, spot, aim, fill }) => (
  <group position={STAGE}>
    <Lights g="violet" at={STAGE} spot={spot} aim={aim} sh={6} fill={fill} />
    <Sky g="violet" at={STAGE} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[30, 48]} /><Mat c="#3a2a6a" r={0.9} /></mesh>
    {Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return <mesh key={i} position={[Math.sin(a) * 9, 0.6 + rnd(i) * 1.2, Math.cos(a) * 9 - 2]}><octahedronGeometry args={[0.15 + rnd(i * 3) * 0.2, 0]} /><Mat c="#c9a8ff" e="#8a60ff" ei={0.7} r={0.4} /></mesh>; })}
    {children}
  </group>
);

// ---------- the economist's classroom  ----------
export const CLASS: V3 = [0, 0, 0];
const chalkboardTex = (lines: string[], graph: number) => tex("cb" + lines.join("|") + graph.toFixed(2), 1024, 512, (x, w, h) => {
  x.fillStyle = "#26372f"; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,255,255,${0.02 + rnd(i) * 0.04})`; x.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 80 + rnd(i * 7) * 160, 6 + rnd(i * 9) * 20); }
  x.fillStyle = "#f4f4ea"; x.textAlign = graph > 0 ? "left" : "center"; x.textBaseline = "middle";
  lines.forEach((l, i) => { x.font = F(900, graph > 0 ? 58 : 54); x.fillText(l, graph > 0 ? 60 : w / 2, (graph > 0 ? 90 : 170) + i * 100); });
  if (graph > 0) { // a chalk graph: axes and a rising line
    const ox = 640, oy = 430; x.strokeStyle = "#f4f4ea"; x.lineWidth = 8; x.beginPath(); x.moveTo(ox, 90); x.lineTo(ox, oy); x.lineTo(970, oy); x.stroke();
    x.font = F(800, 32); x.fillText("RATS", ox + 10, 80); x.fillText("PAY →", 840, oy + 40);
    x.strokeStyle = "#ffd84a"; x.lineWidth = 10; x.beginPath(); x.moveTo(ox + 10, oy - 30); for (let k = 0; k <= 20 * graph; k++) { const u = k / 20; x.lineTo(ox + 10 + u * 310, oy - 30 - u * u * 290); } x.stroke();
  }
});
export const Classroom: React.FC<{ children?: React.ReactNode; lines?: string[]; graph?: number }> = ({ children, lines = ["REWARD:", "1¢ / TAIL"], graph = 0 }) => (
  <group position={CLASS}>
    <hemisphereLight args={["#fff2dc", "#6a4a32", 1.05]} />
    <directionalLight position={[2, 5, 5]} intensity={1.7} color="#fff0d8" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0005} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[10, 10]} /><Mat map={tex("wood2", 512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? "#8a5a34" : "#9a6a40"; x.fillRect(0, i * 64, w, 64); x.fillStyle = "rgba(0,0,0,0.25)"; x.fillRect(0, i * 64, w, 3); } }, [4, 4])} r={0.7} /></mesh>
    <mesh position={[0, 2, -2.0]} receiveShadow><planeGeometry args={[10, 4]} /><Mat c="#d8c8a0" r={0.9} /></mesh>
    <mesh position={[0, 1.65, -1.96]} castShadow><boxGeometry args={[3.3, 1.75, 0.06]} /><Mat c="#7a4a26" r={0.7} /></mesh>
    <mesh position={[0, 1.65, -1.925]}><planeGeometry args={[3.1, 1.55]} /><Mat map={chalkboardTex(lines, graph)} r={0.95} /></mesh>
    <mesh position={[0, 0.82, -1.86]}><boxGeometry args={[3.1, 0.04, 0.12]} /><Mat c="#7a4a26" r={0.7} /></mesh>
    <mesh position={[-2.6, 1.3, -1.97]}><planeGeometry args={[1.4, 2.0]} /><Mat map={shelfTex()} r={0.8} /></mesh>
    {/* the desk with books and a globe */}
    <mesh position={[2.1, 0.72, -1.0]} castShadow receiveShadow><boxGeometry args={[1.3, 0.06, 0.7]} /><Mat c="#6a3a20" r={0.6} /></mesh>
    {[[1.55, -0.7], [2.65, -0.7], [1.55, -1.3], [2.65, -1.3]].map(([x, z], i) => <mesh key={i} position={[x, 0.36, z]} castShadow><boxGeometry args={[0.06, 0.72, 0.06]} /><Mat c="#5a3420" r={0.6} /></mesh>)}
    <group position={[2.4, 0.75, -1.05]}><mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.06, 0.09, 0.08, 12]} /><Mat c="#c8a050" r={0.4} /></mesh><mesh position={[0, 0.28, 0]} castShadow><sphereGeometry args={[0.18, 24, 16]} /><Mat c="#3f7aaa" r={0.5} /></mesh></group>
    {[0, 1, 2].map((k) => <mesh key={k} position={[1.8, 0.79 + k * 0.07, -1.0]} rotation={[0, 0.2 * k, 0]} castShadow><boxGeometry args={[0.32, 0.07, 0.24]} /><Mat c={["#8a2a2a", "#2a4a7a", "#c8a050"][k]} r={0.7} /></mesh>)}
    {children}
  </group>
);

// Short 1 sets: the 1904 Berlin courtyard (Hans's show: cobbles, stucco tenements with shops and flower boxes, an archway
// onto the street, a chalkboard easel, hay, a trough, barrels, a gas lamp, bunting and a banner), the commission's room,
// and Oskar's study. Detail lives in painted canvas textures (few meshes, 2-3 lights a set). A grade switch lights the
// courtyard deep violet for the "You see" reveal.
import React, { useMemo } from "react";
import * as THREE from "three";

export type Grade = "day" | "violet" | "dusk";
const Mat: React.FC<{ c?: string; r?: number; map?: THREE.Texture | null; e?: string; ei?: number; side?: THREE.Side; t?: boolean }> = ({ c = "#fff", r = 0.8, map, e, ei, side, t }) => (
  <meshStandardMaterial color={map ? "#ffffff" : c} map={map ?? null} roughness={r} metalness={0} emissive={e ?? "#000"} emissiveIntensity={ei ?? 0} side={side ?? THREE.FrontSide} transparent={t} />
);

const TEX = new Map<string, THREE.CanvasTexture>();
const tex = (key: string, w: number, h: number, draw: (x: CanvasRenderingContext2D, w: number, h: number) => void, rep?: [number, number]) => {
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
const F = (w: number, sz: number, fam = "Montserrat, sans-serif") => `${w} ${sz}px ${fam}`;

// ---------- textures ----------
const cobbles = () => tex("cobbles", 1024, 1024, (x, w, h) => {
  x.fillStyle = "#6f6458"; x.fillRect(0, 0, w, h);
  const n = 16, s = w / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n + 1; i++) {
    const ox = (j % 2) * s * 0.5, cx = i * s + ox - s * 0.5, cy = j * s + s / 2, k = rnd(i * 31 + j * 7);
    const base = [168, 152, 132].map((v) => v - 30 + k * 50);
    x.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
    x.beginPath(); x.roundRect(cx - s * 0.44, cy - s * 0.42, s * 0.88, s * 0.84, s * 0.3); x.fill();
    x.fillStyle = "rgba(255,255,255,0.12)"; x.beginPath(); x.ellipse(cx - s * 0.12, cy - s * 0.16, s * 0.22, s * 0.12, -0.3, 0, Math.PI * 2); x.fill();
  }
}, [7, 7]);

/** A Berlin tenement facade: stucco, cornices, windows with shutters and flower boxes, shop fronts on the ground floor. */
const facade = (key: string, base: string, shops: string[], lit: number, night = false) => tex("fac" + key + night, 2048, 1200, (x, w, h) => {
  x.fillStyle = base; x.fillRect(0, 0, w, h);
  // weathering
  for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(80,50,30,${0.02 + rnd(i) * 0.04})`; x.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 30 + rnd(i * 7) * 120, 8 + rnd(i * 9) * 40); }
  // floor bands and cornices
  for (const yy of [300, 620, 900]) { x.fillStyle = "rgba(255,250,235,0.55)"; x.fillRect(0, yy, w, 22); x.fillStyle = "rgba(60,40,30,0.25)"; x.fillRect(0, yy + 22, w, 8); }
  x.fillStyle = "#8a5a44"; x.fillRect(0, 0, w, 40); // roof edge
  // windows on three upper floors
  const cols = 7, cw = w / cols;
  for (let f = 0; f < 3; f++) for (let i = 0; i < cols; i++) {
    const cx = i * cw + cw / 2, top = 80 + f * 300 + (f === 2 ? 20 : 0), ww = 110, wh = 170, k = rnd(i * 13 + f * 29 + key.length);
    const on = k < lit;
    x.fillStyle = "rgba(255,250,235,0.7)"; x.fillRect(cx - ww / 2 - 14, top - 18, ww + 28, 16); // lintel
    x.fillStyle = night ? (on ? "#ffcf7a" : "#1d2340") : on ? "#f7dca0" : "#3d4a5e"; x.fillRect(cx - ww / 2, top, ww, wh);
    if (!on || !night) { x.fillStyle = "rgba(255,255,255,0.18)"; x.fillRect(cx - ww / 2 + 8, top + 8, 26, wh - 16); }
    // curtains
    x.fillStyle = ["#c84f4f", "#e8e0c8", "#5a8a6a", "#d8a040"][Math.floor(k * 4)]; x.fillRect(cx - ww / 2, top, 22, wh); x.fillRect(cx + ww / 2 - 22, top, 22, wh);
    x.strokeStyle = "#f4efe2"; x.lineWidth = 8; x.strokeRect(cx - ww / 2, top, ww, wh); x.beginPath(); x.moveTo(cx, top); x.lineTo(cx, top + wh); x.moveTo(cx - ww / 2, top + wh * 0.38); x.lineTo(cx + ww / 2, top + wh * 0.38); x.stroke();
    // shutters
    x.fillStyle = ["#3f6b52", "#4a5f8a", "#7a3e34"][i % 3];
    for (const s of [-1, 1]) { x.fillRect(cx + s * (ww / 2 + 30) - 22, top, 44, wh); x.fillStyle = "rgba(0,0,0,0.2)"; for (let r = 0; r < 8; r++) x.fillRect(cx + s * (ww / 2 + 30) - 18, top + 10 + r * 20, 36, 5); x.fillStyle = ["#3f6b52", "#4a5f8a", "#7a3e34"][i % 3]; }
    // flower box
    if (k > 0.35) {
      x.fillStyle = "#8a5a34"; x.fillRect(cx - ww / 2 - 10, top + wh, ww + 20, 26);
      for (let p = 0; p < 9; p++) { x.fillStyle = ["#e04a5a", "#f2c84a", "#f08ac0", "#ffffff"][(p + i) % 4]; x.beginPath(); x.arc(cx - ww / 2 + p * 15, top + wh - 6 - rnd(p + i) * 12, 10, 0, Math.PI * 2); x.fill(); x.fillStyle = "#4f8a3a"; x.beginPath(); x.arc(cx - ww / 2 + p * 15 + 7, top + wh + 2, 8, 0, Math.PI * 2); x.fill(); }
    }
  }
  // ground floor: shops and doors
  const sw = w / shops.length;
  shops.forEach((name, i) => {
    const x0 = i * sw + 40, x1 = (i + 1) * sw - 40;
    if (name === "DOOR") {
      x.fillStyle = "#5a3a26"; x.beginPath(); x.roundRect(x0 + sw * 0.25, 960, sw * 0.4, 240, [60, 60, 0, 0]); x.fill();
      x.strokeStyle = "#3a2416"; x.lineWidth = 6; x.strokeRect(x0 + sw * 0.25 + 20, 1000, sw * 0.4 - 40, 180);
      x.fillStyle = "#e8c060"; x.beginPath(); x.arc(x0 + sw * 0.25 + sw * 0.32, 1090, 9, 0, Math.PI * 2); x.fill();
      x.fillStyle = "#f4efe2"; x.font = F(800, 40); x.textAlign = "center"; x.fillText("No. " + (12 + i), x0 + sw * 0.45, 945);
      return;
    }
    x.fillStyle = "#2f3f3a"; x.fillRect(x0, 935, x1 - x0, 70); // sign board
    x.fillStyle = "#f2d38a"; x.font = F(900, 50); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(name, (x0 + x1) / 2, 972);
    x.fillStyle = night ? "#ffcf7a" : "#9ab2c0"; x.fillRect(x0 + 20, 1015, x1 - x0 - 40, 150); // window
    x.fillStyle = "rgba(255,255,255,0.25)"; x.fillRect(x0 + 34, 1025, 30, 130);
    // goods in the window
    for (let g = 0; g < 7; g++) { x.fillStyle = ["#c8823a", "#e8c070", "#a0522d", "#f0e0b0"][g % 4]; x.beginPath(); x.ellipse(x0 + 70 + g * ((x1 - x0 - 140) / 6), 1140, 26, 18, 0, 0, Math.PI * 2); x.fill(); }
    // awning stripes
    for (let s = 0; s < 14; s++) { x.fillStyle = s % 2 ? "#f4efe2" : ["#c84040", "#3f6b8a", "#3f7a52"][i % 3]; x.fillRect(x0 + s * ((x1 - x0) / 14), 905, (x1 - x0) / 14 + 1, 30); }
  });
  x.textBaseline = "alphabetic";
}, undefined);

const sky = (g: Grade) => tex("sky" + g, 1024, 512, (x, w, h) => {
  const grd = x.createLinearGradient(0, 0, 0, h);
  if (g === "violet") { grd.addColorStop(0, "#1b1440"); grd.addColorStop(1, "#4a2c78"); }
  else if (g === "dusk") { grd.addColorStop(0, "#2a3a78"); grd.addColorStop(1, "#f0a070"); }
  else { grd.addColorStop(0, "#6fb0e8"); grd.addColorStop(1, "#cfe6f4"); }
  x.fillStyle = grd; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) {
    const cx = rnd(i * 3) * w, cy = 80 + rnd(i * 7) * 250, s = 30 + rnd(i * 11) * 40;
    x.fillStyle = g === "day" ? "rgba(255,255,255,0.85)" : g === "dusk" ? "rgba(255,200,170,0.5)" : "rgba(160,130,220,0.25)";
    for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(cx + (k - 2) * s * 0.8, cy + Math.sin(k * 2) * 8, s * (0.7 + 0.3 * Math.cos(k)), 0, Math.PI * 2); x.fill(); }
  }
  if (g !== "day") for (let i = 0; i < 80; i++) { x.fillStyle = "rgba(255,255,240,0.8)"; x.fillRect(rnd(i * 13) * w, rnd(i * 17) * h * 0.6, 2, 2); }
});

/** Chalkboard text: lines of sums (chalk). */
export const boardTex = (lines: string[]) => tex("board" + lines.join("|"), 768, 512, (x, w, h) => {
  x.fillStyle = "#26372f"; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,255,255,${0.02 + rnd(i) * 0.04})`; x.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 80 + rnd(i * 7) * 160, 6 + rnd(i * 9) * 20); }
  x.fillStyle = "#f4f4ea"; x.textAlign = "center"; x.textBaseline = "middle";
  const n = lines.length;
  lines.forEach((l, i) => { x.font = F(900, n === 1 ? 170 : n === 2 ? 130 : 96); x.fillText(l, w / 2, h * ((i + 0.5) / n)); });
  // chalk dust under the text
  x.fillStyle = "rgba(255,255,255,0.08)"; x.fillRect(30, h - 40, w - 60, 20);
});

const bannerTex = () => tex("banner", 1024, 200, (x, w, h) => {
  x.fillStyle = "#f6ecd2"; x.fillRect(0, 0, w, h);
  x.strokeStyle = "#c0392b"; x.lineWidth = 12; x.strokeRect(10, 10, w - 20, h - 20);
  x.fillStyle = "#b02a24"; x.font = F(900, 74); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("CLEVER HANS", w / 2, 78);
  x.fillStyle = "#2b2b33"; x.font = F(800, 42); x.fillText("THE THINKING HORSE · DAILY 12 NOON", w / 2, 150);
});
const archTex = () => tex("arch", 512, 640, (x, w, h) => {
  // the street beyond the archway: houses, a tram line, a lamp, people
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#bcd8ee"); g.addColorStop(0.5, "#e8e2d2"); g.addColorStop(1, "#8a8070"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 5; i++) { x.fillStyle = ["#e0b890", "#c8d0b0", "#e8d0c0", "#b8a090", "#d8c8a0"][i]; x.fillRect(i * 110 - 20, 120 + rnd(i) * 60, 120, 420); for (let k = 0; k < 6; k++) { x.fillStyle = "#3d4a5e"; x.fillRect(i * 110 + (k % 2) * 50, 160 + rnd(i) * 60 + Math.floor(k / 2) * 90, 30, 50); } x.fillStyle = ["#e0b890", "#c8d0b0", "#e8d0c0", "#b8a090", "#d8c8a0"][i]; }
  x.fillStyle = "#7a7064"; x.fillRect(0, 520, w, 120);
  x.strokeStyle = "#4a4038"; x.lineWidth = 4; x.beginPath(); x.moveTo(0, 580); x.lineTo(w, 570); x.moveTo(0, 600); x.lineTo(w, 592); x.stroke();
  for (let i = 0; i < 4; i++) { const px = 60 + i * 120; x.fillStyle = ["#2f3f6a", "#7a3e34", "#3f6b52", "#5a4a6a"][i]; x.beginPath(); x.ellipse(px, 515, 16, 26, 0, 0, Math.PI * 2); x.fill(); x.fillStyle = "#e0b090"; x.beginPath(); x.arc(px, 478, 15, 0, Math.PI * 2); x.fill(); x.fillStyle = "#222"; x.fillRect(px - 16, 456, 32, 8); }
});

// ---------- small props ----------
const HayBale: React.FC<{ p: [number, number, number]; r?: number }> = ({ p, r = 0 }) => {
  const map = tex("hay", 256, 128, (x, w, h) => { x.fillStyle = "#d8b45a"; x.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { x.strokeStyle = rnd(i) > 0.5 ? "#b8902e" : "#f0d27a"; x.lineWidth = 2; x.beginPath(); const a = rnd(i * 3) * w, b = rnd(i * 5) * h; x.moveTo(a, b); x.lineTo(a + 18, b + (rnd(i * 7) - 0.5) * 10); x.stroke(); } x.fillStyle = "#8a6a2a"; x.fillRect(w * 0.3, 0, 6, h); x.fillRect(w * 0.7, 0, 6, h); });
  return <mesh position={[p[0], p[1] + 0.2, p[2]]} rotation={[0, r, 0]} castShadow receiveShadow><boxGeometry args={[0.9, 0.4, 0.5]} /><Mat map={map} r={0.95} /></mesh>;
};
const Barrel: React.FC<{ p: [number, number, number] }> = ({ p }) => (
  <group position={p}>
    <mesh position={[0, 0.32, 0]} castShadow receiveShadow><cylinderGeometry args={[0.24, 0.24, 0.64, 18]} /><Mat c="#8a5a32" r={0.8} /></mesh>
    {[0.1, 0.54].map((y) => <mesh key={y} position={[0, y, 0]}><cylinderGeometry args={[0.247, 0.247, 0.04, 18]} /><Mat c="#3a3438" r={0.5} /></mesh>)}
  </group>
);
const Trough: React.FC<{ p: [number, number, number]; r?: number }> = ({ p, r = 0 }) => (
  <group position={p} rotation={[0, r, 0]}>
    <mesh position={[0, 0.22, 0]} castShadow receiveShadow><boxGeometry args={[1.2, 0.4, 0.45]} /><Mat c="#7a6a5a" r={0.9} /></mesh>
    <mesh position={[0, 0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.1, 0.35]} /><Mat c="#4a7a9a" r={0.2} /></mesh>
  </group>
);
const LampPost: React.FC<{ p: [number, number, number]; on?: boolean }> = ({ p, on }) => (
  <group position={p}>
    <mesh position={[0, 1.3, 0]} castShadow><cylinderGeometry args={[0.035, 0.06, 2.6, 10]} /><Mat c="#2a3a34" r={0.5} /></mesh>
    <mesh position={[0, 2.72, 0]}><boxGeometry args={[0.24, 0.3, 0.24]} /><Mat c="#fff3c0" e="#ffcf6a" ei={on ? 1.6 : 0.35} r={0.3} /></mesh>
    <mesh position={[0, 2.92, 0]}><coneGeometry args={[0.2, 0.16, 4]} /><Mat c="#2a3a34" r={0.5} /></mesh>
  </group>
);
const Bunting: React.FC<{ a: [number, number, number]; b: [number, number, number]; n?: number }> = ({ a, b, n = 12 }) => {
  const geo = useMemo(() => {
    const pos: number[] = [], col: number[] = [];
    const cols = ["#d8423a", "#f2c84a", "#3f7ac0", "#4fa75a", "#f4efe2"].map((c) => new THREE.Color(c));
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, sag = Math.sin(u * Math.PI) * 0.5;
      const P = (uu: number) => [a[0] + (b[0] - a[0]) * uu, a[1] + (b[1] - a[1]) * uu - Math.sin(uu * Math.PI) * 0.5, a[2] + (b[2] - a[2]) * uu];
      const p0 = P(u - 0.4 / n), p1 = P(u + 0.4 / n);
      pos.push(...p0, ...p1, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 - 0.28 - sag * 0, (p0[2] + p1[2]) / 2);
      const c = cols[i % cols.length]; for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
  }, [a.join(), b.join(), n]);
  return <mesh geometry={geo}><meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.8} /></mesh>;
};
export const Easel: React.FC<{ p: [number, number, number]; yaw?: number; lines: string[] }> = ({ p, yaw = 0, lines }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    {[-0.5, 0.5].map((x) => <mesh key={x} position={[x, 0.85, -0.05]} rotation={[0.08, 0, 0]} castShadow><boxGeometry args={[0.06, 1.75, 0.05]} /><Mat c="#8a5a30" r={0.7} /></mesh>)}
    <mesh position={[0, 0.85, -0.28]} rotation={[-0.3, 0, 0]} castShadow><boxGeometry args={[0.05, 1.7, 0.04]} /><Mat c="#8a5a30" r={0.7} /></mesh>
    <group position={[0, 1.22, 0.0]} rotation={[-0.08, 0, 0]}>
      <mesh castShadow><boxGeometry args={[1.32, 0.92, 0.05]} /><Mat c="#7a4a26" r={0.7} /></mesh>
      <mesh position={[0, 0, 0.027]}><planeGeometry args={[1.2, 0.8]} /><Mat map={boardTex(lines)} r={0.95} /></mesh>
      <mesh position={[0, -0.47, 0.06]} castShadow><boxGeometry args={[1.2, 0.03, 0.09]} /><Mat c="#7a4a26" r={0.7} /></mesh>
    </group>
  </group>
);

// ---------- the courtyard ----------
// Hans stands at the origin facing +x (yaw π/2); the crowd stands in an arc on the +z side; the easel at (1.5, 0, -0.9).
export const COURT = { hans: [0, 0, 0] as [number, number, number], easel: [1.9, 0, -0.75] as [number, number, number], easelYaw: -0.35 };

const Spot: React.FC<{ pos: [number, number, number]; aim: [number, number, number] }> = ({ pos, aim }) => {
  const tgt = useMemo(() => new THREE.Object3D(), []);
  tgt.position.set(...aim);
  tgt.updateMatrixWorld();
  return (<><primitive object={tgt} /><spotLight position={pos} angle={0.55} penumbra={0.7} intensity={18} color="#ffd9a0" distance={12} decay={1.2} target={tgt} /></>);
};
const Lights: React.FC<{ g: Grade; spot?: [number, number, number]; aim?: [number, number, number] }> = ({ g, spot, aim }) => {
  if (g === "violet") return (
    <>
      <hemisphereLight args={["#7a5ae0", "#2a1848", 0.7]} />
      <directionalLight position={[3, 7, 5]} intensity={0.45} color="#8a70ff" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-bias={-0.0004} />
      <Spot pos={spot ?? [0.5, 6, 3]} aim={aim ?? [0.4, 0.8, 0.8]} />
    </>
  );
  return (
    <>
      <hemisphereLight args={g === "dusk" ? ["#b0a8e0", "#6a4a3a", 1.2] : ["#dfeeff", "#8a6a4a", 1.05]} />
      <directionalLight position={[4, 8, 6]} intensity={g === "dusk" ? 1.8 : 2.1} color={g === "dusk" ? "#ffb070" : "#fff0d8"} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0004} />
    </>
  );
};

export const Courtyard: React.FC<{ g?: Grade; board?: string[]; children?: React.ReactNode; spot?: [number, number, number]; aim?: [number, number, number]; extra?: React.ReactNode }> = ({ g = "day", board = ["2 + 3 = ?"], children, spot, aim }) => {
  const night = g !== "day";
  return (
    <>
      <Lights g={g} spot={spot} aim={aim} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[16, 16]} /><Mat map={cobbles()} c={night ? "#8a80a0" : "#fff"} r={0.95} /></mesh>
      {/* sky dome far behind */}
      <mesh position={[0, 10, 0]}><sphereGeometry args={[40, 24, 12]} /><meshBasicMaterial map={sky(g)} side={THREE.BackSide} /></mesh>
      {/* tenements: back (z-5), left (x-6), right (x+6), front (z+7) */}
      <mesh position={[0, 3.6, -5]} receiveShadow><boxGeometry args={[14, 7.2, 0.3]} /><Mat map={facade("back", "#e8cfa8", ["BÄCKEREI", "DOOR", "KAFFEE"], 0.35, night)} r={0.9} /></mesh>
      <mesh position={[-6, 3.6, 1]} rotation={[0, Math.PI / 2, 0]} receiveShadow><boxGeometry args={[12, 7.2, 0.3]} /><Mat map={facade("left", "#d8b8a0", ["DOOR", "BÜCHER", "DOOR"], 0.5, night)} r={0.9} /></mesh>
      <mesh position={[6, 3.6, 1]} rotation={[0, -Math.PI / 2, 0]} receiveShadow><boxGeometry args={[12, 7.2, 0.3]} /><Mat map={facade("right", "#c8c8a8", ["DOOR", "SCHUHE", "DOOR"], 0.45, night)} r={0.9} /></mesh>
      <mesh position={[0, 3.6, 7]} rotation={[0, Math.PI, 0]} receiveShadow><boxGeometry args={[14, 7.2, 0.3]} /><Mat map={facade("front", "#e0c0b0", ["KÄSE", "DOOR", "BLUMEN"], 0.4, night)} r={0.9} /></mesh>
      {/* the archway onto the street, in the back wall at x = 4 */}
      <mesh position={[4, 1.3, -4.83]}><planeGeometry args={[1.8, 2.6]} /><meshBasicMaterial map={archTex()} color={night ? "#8070a8" : "#ffffff"} /></mesh>
      <mesh position={[4, 2.75, -4.8]}><boxGeometry args={[2.2, 0.3, 0.12]} /><Mat c="#b89878" r={0.8} /></mesh>
      {[3.0, 5.0].map((x) => <mesh key={x} position={[x, 1.3, -4.8]} castShadow><boxGeometry args={[0.22, 2.6, 0.14]} /><Mat c="#b89878" r={0.8} /></mesh>)}
      {/* banner over the show and bunting */}
      <mesh position={[-0.6, 3.15, -4.75]}><planeGeometry args={[4.2, 0.82]} /><Mat map={bannerTex()} r={0.85} /></mesh>
      <Bunting a={[-6, 4.3, -3]} b={[6, 4.3, -1]} n={16} />
      <Bunting a={[-6, 4.6, 3.5]} b={[6, 4.7, 4.5]} n={16} />
      {/* the show: easel, hay, trough, barrels, crates, lamp */}
      <Easel p={COURT.easel} yaw={COURT.easelYaw} lines={board} />
      <HayBale p={[-2.6, 0, -2.2]} r={0.3} />
      <HayBale p={[-2.4, 0.4, -2.2]} r={0.25} />
      <HayBale p={[-3.4, 0, -1.6]} r={1.4} />
      <Trough p={[-1.6, 0, -3.4]} />
      <Barrel p={[3.1, 0, -3.6]} />
      <Barrel p={[3.55, 0, -3.3]} />
      <mesh position={[2.5, 0.25, -3.9]} rotation={[0, 0.3, 0]} castShadow receiveShadow><boxGeometry args={[0.5, 0.5, 0.5]} /><Mat c="#b98552" r={0.85} /></mesh>
      <LampPost p={[-4.6, 0, 0.8]} on={night} />
      <LampPost p={[4.8, 0, 2.6]} on={night} />
      {/* a cart wheel leaning on the left wall */}
      <mesh position={[-5.75, 0.55, -1.8]} rotation={[0, Math.PI / 2, 0.08]} castShadow><torusGeometry args={[0.5, 0.05, 8, 28]} /><Mat c="#6a4a2a" r={0.7} /></mesh>
      {/* potted plants by the doors */}
      {[[-1.2, -4.6], [1.2, -4.6], [-5.6, 3.2], [5.6, -0.6]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.22, 0.17, 0.4, 14]} /><Mat c="#b8643a" r={0.8} /></mesh>
          <mesh position={[0, 0.58, 0]} castShadow><sphereGeometry args={[0.32, 14, 10]} /><Mat c="#4f8a3a" r={0.9} /></mesh>
        </group>
      ))}
      {children}
    </>
  );
};

// ---------- the commission's room (at x = 40) ----------
export const ROOM = [40, 0, 0] as [number, number, number];
const shelfTex = () => tex("shelf", 1024, 512, (x, w, h) => {
  x.fillStyle = "#5a3a24"; x.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) { let px = 12; while (px < w - 20) { const bw = 14 + rnd(px + r * 99) * 22, bh = 80 + rnd(px * 3 + r) * 34; x.fillStyle = ["#8a2a2a", "#2a4a7a", "#3a6a3a", "#c8a050", "#6a3a6a", "#e0d8c0"][Math.floor(rnd(px * 7 + r) * 6)]; x.fillRect(px, (r + 1) * 128 - 8 - bh, bw, bh); x.fillStyle = "rgba(255,230,160,0.5)"; x.fillRect(px + 3, (r + 1) * 128 - 8 - bh + 14, bw - 6, 4); px += bw + 2; } x.fillStyle = "#3a2416"; x.fillRect(0, (r + 1) * 128 - 8, w, 10); }
});
const wallpaper = (key: string, a: string, b: string) => tex("wp" + key, 512, 512, (x, w, h) => { x.fillStyle = a; x.fillRect(0, 0, w, h); x.fillStyle = b; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.beginPath(); x.ellipse(i * 64 + (j % 2) * 32 + 16, j * 64 + 32, 7, 14, 0, 0, Math.PI * 2); x.fill(); } }, [6, 3]);
const plaqueTex = (t1: string, t2: string) => tex("plq" + t1 + t2, 768, 256, (x, w, h) => { x.fillStyle = "#2b2b33"; x.fillRect(0, 0, w, h); x.strokeStyle = "#d8b04a"; x.lineWidth = 10; x.strokeRect(12, 12, w - 24, h - 24); x.fillStyle = "#f2d38a"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = F(900, 70); x.fillText(t1, w / 2, 96); x.font = F(800, 40); x.fillText(t2, w / 2, 180); });
const windowView = (night: boolean) => tex("win" + night, 512, 512, (x, w, h) => {
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, night ? "#141a3a" : "#8ec4ea"); g.addColorStop(1, night ? "#3a2a5a" : "#e6eef0"); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 9; i++) { const bx = i * 60 - 10, bh = 160 + rnd(i * 5) * 200; x.fillStyle = night ? "#1e1a30" : ["#c8a888", "#a8b0a0", "#d8c0a8"][i % 3]; x.fillRect(bx, h - bh, 58, bh); x.beginPath(); x.moveTo(bx, h - bh); x.lineTo(bx + 29, h - bh - 40); x.lineTo(bx + 58, h - bh); x.fill(); for (let k = 0; k < 6; k++) { x.fillStyle = night ? (rnd(i * 9 + k) > 0.5 ? "#ffcf7a" : "#2a2a40") : "#3d4a5e"; x.fillRect(bx + 10 + (k % 2) * 24, h - bh + 20 + Math.floor(k / 2) * 50, 12, 20); } }
  if (night) { x.fillStyle = "#fff8d8"; x.beginPath(); x.arc(400, 90, 34, 0, Math.PI * 2); x.fill(); for (let i = 0; i < 40; i++) x.fillRect(rnd(i * 3) * w, rnd(i * 7) * h * 0.4, 2, 2); }
  x.strokeStyle = "#f4efe2"; x.lineWidth = 16; x.strokeRect(0, 0, w, h); x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke();
});
export const reportTex = (stamp: boolean) => tex("rep" + stamp, 512, 680, (x, w, h) => {
  x.fillStyle = "#fbf6e6"; x.fillRect(0, 0, w, h);
  x.fillStyle = "#2b2b33"; x.textAlign = "center"; x.font = F(900, 40); x.fillText("REPORT OF THE", w / 2, 70); x.font = F(900, 54); x.fillText("13 EXPERTS", w / 2, 130);
  x.font = F(700, 24); x.fillText("on the horse 'Hans' · Berlin, Sept. 1904", w / 2, 172);
  x.textAlign = "left"; x.font = F(700, 26);
  ["Hidden signals .......... none", "Secret helpers .......... none", "Tricks or training ...... none", "Signatures:"].forEach((l, i) => x.fillText(l, 40, 250 + i * 50));
  for (let i = 0; i < 13; i++) { x.strokeStyle = "#2a3a7a"; x.lineWidth = 3; x.beginPath(); const sx = 40 + (i % 5) * 92, sy = 470 + Math.floor(i / 5) * 60; x.moveTo(sx, sy); for (let k = 0; k < 6; k++) x.lineTo(sx + k * 14, sy - 12 + rnd(i * 9 + k) * 22); x.stroke(); }
  if (stamp) { x.save(); x.translate(w / 2, 420); x.rotate(-0.25); x.strokeStyle = "#c0392b"; x.lineWidth = 12; x.strokeRect(-200, -60, 400, 120); x.fillStyle = "#c0392b"; x.font = F(900, 80); x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("NO TRICK", 0, 4); x.restore(); }
});

export const Room: React.FC<{ children?: React.ReactNode; stamp?: boolean }> = ({ children, stamp }) => (
  <group position={ROOM}>
    <hemisphereLight args={["#fff2dc", "#6a4a32", 1.0]} />
    <directionalLight position={[2, 5, 4]} intensity={1.6} color="#fff0d8" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0005} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[10, 10]} /><Mat map={tex("wood", 512, 512, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? "#9a6a40" : "#a8784a"; x.fillRect(0, i * 64, w, 64); x.fillStyle = "rgba(0,0,0,0.25)"; x.fillRect(0, i * 64, w, 3); x.fillRect(rnd(i) * w, i * 64, 3, 64); } }, [4, 4])} r={0.7} /></mesh>
    <mesh position={[0, 2, -2.5]} receiveShadow><planeGeometry args={[10, 4]} /><Mat map={wallpaper("room", "#3f6a5a", "#5a8a74")} r={0.9} /></mesh>
    <mesh position={[-1.7, 1.25, -2.45]}><planeGeometry args={[2.2, 2.0]} /><Mat map={shelfTex()} r={0.8} /></mesh>
    <mesh position={[1.9, 1.5, -2.45]}><planeGeometry args={[1.4, 1.4]} /><meshBasicMaterial map={windowView(false)} /></mesh>
    <mesh position={[0.2, 2.75, -2.44]}><planeGeometry args={[1.8, 0.6]} /><Mat map={plaqueTex("COMMISSION", "SEPTEMBER 1904")} r={0.6} /></mesh>
    <mesh position={[-4, 2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[6, 4]} /><Mat map={wallpaper("room2", "#3f6a5a", "#5a8a74")} r={0.9} /></mesh>
    {/* the long table with a green cloth */}
    <mesh position={[0, 0.7, -0.6]} castShadow receiveShadow><boxGeometry args={[3.2, 0.06, 0.9]} /><Mat c="#2f6a48" r={0.9} /></mesh>
    <mesh position={[0, 0.35, -0.16]} receiveShadow><boxGeometry args={[3.2, 0.7, 0.02]} /><Mat c="#2a5a3e" r={0.9} /></mesh>
    {/* papers, inkwell, a lamp */}
    <mesh position={[0.1, 0.735, -0.5]} rotation={[-Math.PI / 2, 0, 0.05]}><planeGeometry args={[0.42, 0.56]} /><Mat map={reportTex(!!stamp)} r={0.9} /></mesh>
    {[[-0.9, -0.6, 0.3], [0.8, -0.7, -0.2], [-0.5, -0.45, 0.6]].map(([x, z, r], i) => <mesh key={i} position={[x, 0.734, z]} rotation={[-Math.PI / 2, 0, r]}><planeGeometry args={[0.3, 0.4]} /><Mat c="#f4efe0" r={0.9} /></mesh>)}
    <mesh position={[1.2, 0.78, -0.75]} castShadow><cylinderGeometry args={[0.05, 0.06, 0.1, 12]} /><Mat c="#1a1a2a" r={0.3} /></mesh>
    <group position={[-1.3, 0.73, -0.85]}>
      <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.02, 0.06, 0.4, 10]} /><Mat c="#c8a050" r={0.4} /></mesh>
      <mesh position={[0, 0.45, 0]}><coneGeometry args={[0.18, 0.16, 16, 1, true]} /><Mat c="#3f8a5a" e="#ffd890" ei={0.4} side={THREE.DoubleSide} r={0.5} /></mesh>
    </group>
    {children}
  </group>
);

// ---------- Oskar's study (at x = 80), at night ----------
export const STUDY = [80, 0, 0] as [number, number, number];
const pinwallTex = () => tex("pin", 1024, 640, (x, w, h) => {
  x.fillStyle = "#b8925a"; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(90,60,30,${rnd(i) * 0.25})`; x.fillRect(rnd(i * 3) * w, rnd(i * 5) * h, 4, 4); }
  const notes: [number, number, string[], number][] = [
    [80, 60, ["ASKER KNOWS", "→ RIGHT ✓"], -0.05], [380, 40, ["ASKER", "DOESN'T KNOW", "→ WRONG ✗"], 0.04], [700, 70, ["BLINDERS", "→ WRONG ✗"], -0.03],
    [120, 330, ["WATCH THE", "FACES!"], 0.05], [440, 320, ["HEAD LIFT", "= STOP?"], -0.06], [760, 340, ["TRIAL 31", "9 / 9 ✓"], 0.03],
  ];
  for (const [nx, ny, ls, rr] of notes) {
    x.save(); x.translate(nx + 110, ny + 110); x.rotate(rr);
    x.fillStyle = "#fff8d8"; x.fillRect(-110, -100, 220, 200); x.fillStyle = "#2b2b33"; x.font = F(900, 30); x.textAlign = "center";
    ls.forEach((l, i) => x.fillText(l, 0, -40 + i * 42)); x.fillStyle = "#d23b3b"; x.beginPath(); x.arc(0, -88, 10, 0, Math.PI * 2); x.fill(); x.restore();
  }
  x.strokeStyle = "#c0392b"; x.lineWidth = 5; x.beginPath(); x.moveTo(190, 70); x.lineTo(490, 50); x.lineTo(810, 80); x.moveTo(490, 50); x.lineTo(550, 330); x.lineTo(230, 340); x.stroke();
  // a little sketch of a horse head
  x.strokeStyle = "#2b2b33"; x.lineWidth = 4; x.beginPath(); x.arc(940, 560, 40, 0, Math.PI * 2); x.moveTo(960, 590); x.lineTo(1000, 620); x.stroke();
});
export const Study: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <group position={STUDY}>
    <hemisphereLight args={["#8a8ad8", "#3a2a2a", 0.55]} />
    <directionalLight position={[-1.5, 3.5, 3]} intensity={1.3} color="#ffd9a0" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0005} />
    <pointLight position={[0.55, 1.35, -0.5]} intensity={3.5} distance={4} decay={1.5} color="#ffc070" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[8, 8]} /><Mat c="#6a4a34" r={0.8} /></mesh>
    <mesh position={[0, 2, -1.6]} receiveShadow><planeGeometry args={[8, 4]} /><Mat map={wallpaper("study", "#6a4a5a", "#7a5a6a")} r={0.9} /></mesh>
    <mesh position={[-0.55, 1.75, -1.58]}><planeGeometry args={[1.9, 1.2]} /><Mat map={pinwallTex()} r={0.9} /></mesh>
    <mesh position={[1.45, 1.6, -1.58]}><planeGeometry args={[1.0, 1.2]} /><meshBasicMaterial map={windowView(true)} /></mesh>
    <mesh position={[-2.6, 1.3, -1.57]}><planeGeometry args={[1.4, 2.0]} /><Mat map={shelfTex()} r={0.8} /></mesh>
    {/* desk with notes, books, a lamp, a candle */}
    <mesh position={[0.2, 0.75, -0.9]} castShadow receiveShadow><boxGeometry args={[1.6, 0.06, 0.7]} /><Mat c="#7a4a2a" r={0.6} /></mesh>
    {[[-0.5, -0.6], [0.9, -0.6], [-0.5, -1.2], [0.9, -1.2]].map(([x, z], i) => <mesh key={i} position={[x, 0.36, z]} castShadow><boxGeometry args={[0.06, 0.72, 0.06]} /><Mat c="#5a3420" r={0.6} /></mesh>)}
    {[[-0.2, -0.85, 0.3], [0.2, -0.75, -0.2], [0.05, -1.0, 0.8]].map(([x, z, r], i) => <mesh key={i} position={[x, 0.785, z]} rotation={[-Math.PI / 2, 0, r]}><planeGeometry args={[0.26, 0.34]} /><Mat c="#fbf4dc" r={0.9} /></mesh>)}
    {[0, 1, 2].map((k) => <mesh key={k} position={[-0.42, 0.82 + k * 0.07, -1.05]} rotation={[0, 0.2 * k, 0]} castShadow><boxGeometry args={[0.3, 0.07, 0.22]} /><Mat c={["#8a2a2a", "#2a4a7a", "#c8a050"][k]} r={0.7} /></mesh>)}
    <group position={[0.75, 0.78, -1.05]}>
      <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.015, 0.05, 0.44, 10]} /><Mat c="#2a3a34" r={0.4} /></mesh>
      <mesh position={[0, 0.5, 0.05]} rotation={[0.4, 0, 0]}><coneGeometry args={[0.15, 0.14, 16, 1, true]} /><Mat c="#3f8a5a" e="#ffc070" ei={0.8} side={THREE.DoubleSide} r={0.5} /></mesh>
      <mesh position={[0, 0.44, 0.08]}><sphereGeometry args={[0.04, 10, 8]} /><meshBasicMaterial color="#fff2c0" /></mesh>
    </group>
    {children}
  </group>
);

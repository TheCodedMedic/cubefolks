// Short 08 props (rig units; a kid is ~4.1 tall at scale 0.82). Our own designs.
// Held props follow BlockRig's hand frame: origin in the palm, +y out of the top of the fist (forward when the arm hangs,
// up when the arm points forward), +z down the arm toward the fingertips.
// THE RULE: every invisible pet is EMPTY SPACE. A leash is a stiff novelty leash (wire inside), so its empty collar stays
// where the kid's own hand puts it; nothing ever pulls on it.
import React from "react";
import * as THREE from "three";
import { mat, rep } from "../blocky/Textures";
import { box, type Box } from "../blocky/Collide";

type V3 = [number, number, number];

const cache = new Map<string, THREE.CanvasTexture>();
export const canvasTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) => {
  const hit = cache.get(key); if (hit) return hit;
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; cache.set(key, t); return t;
};
const fit = (g: CanvasRenderingContext2D, s: string, maxW: number, size: number, font = "Arial, sans-serif", weight = 900) => {
  let fs = size; do { g.font = `${weight} ${fs}px ${font}`; fs -= 2; } while (g.measureText(s).width > maxW && fs > 8);
};
const B: React.FC<{ p?: V3; s: V3; c: string; rough?: number; metal?: number; rot?: V3; emissive?: string; ei?: number }> = ({ p = [0, 0, 0], s, c, rough = 0.7, metal = 0, rot, emissive, ei = 0.5 }) => (
  <mesh position={p} rotation={rot} castShadow receiveShadow><boxGeometry args={s} /><meshStandardMaterial color={c} roughness={rough} metalness={metal} emissive={emissive ?? "#000"} emissiveIntensity={emissive ? ei : 0} /></mesh>
);
/** A textured flat card (faces +z), both sides drawn. */
const Card: React.FC<{ p?: V3; s: [number, number]; map: THREE.Texture; rot?: V3; back?: string }> = ({ p = [0, 0, 0], s, map, rot, back = "#f2efe6" }) => (
  <group position={p} rotation={rot}>
    <mesh position={[0, 0, 0.012]}><planeGeometry args={s} /><meshStandardMaterial map={map} roughness={0.7} /></mesh>
    <mesh position={[0, 0, -0.012]} rotation={[0, Math.PI, 0]}><planeGeometry args={s} /><meshStandardMaterial color={back} roughness={0.8} /></mesh>
  </group>
);
/** A tube between two points. */
const Tube: React.FC<{ a: V3; b: V3; r: number; c: string; metal?: number }> = ({ a, b, r, c, metal = 0 }) => {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  return <mesh position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} rotation={[e.x, e.y, e.z]} castShadow>
    <cylinderGeometry args={[r, r, L, 8]} /><meshStandardMaterial color={c} roughness={0.5} metalness={metal} />
  </mesh>;
};

// ------------------------------------------------------------------------------------------------ money
const billTex = (v: number) => canvasTex(`bill${v}`, 256, 110, (g, w, h) => {
  g.fillStyle = "#b9d8a4"; g.fillRect(0, 0, w, h); g.strokeStyle = "#2f6a3a"; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = "#2f6a3a"; g.beginPath(); g.ellipse(w / 2, h / 2, 34, 38, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#b9d8a4"; g.font = "900 40px Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("$", w / 2, h / 2 + 2);
  g.fillStyle = "#1f4a28"; g.font = "900 38px Arial"; g.fillText(String(v), 34, 30); g.fillText(String(v), w - 34, h - 28);
});
/** A banknote (2.0 x 0.86 units), flat in its xy plane facing +z. Big on purpose: it has to read on a phone. */
export const Bill: React.FC<{ v?: 5 | 10 | 50; p?: V3; rot?: V3; k?: number }> = ({ v = 10, p, rot, k = 1 }) => (
  <group position={p} rotation={rot} scale={k}><Card s={[2.0, 0.86]} map={billTex(v)} back="#a8c894" /></group>
);
/** A bill held in the hand, sticking up out of the fist (hand frame). */
export const HeldBill: React.FC<{ v?: 5 | 10 | 50; k?: number }> = ({ v = 10, k = 1 }) => (
  <group position={[0, 0.25 + 0.4 * k, 0.15]} rotation={[0, Math.PI / 2, Math.PI / 2]} scale={k}><Card s={[2.0, 0.86]} map={billTex(v)} back="#a8c894" /></group>
);
/** A green cash box with the lid up and bills fanned inside. `fill` 0..1 how full. Origin: bottom centre; 2.4 x 1.0 x 1.6. */
export const CashBox: React.FC<{ fill?: number; open?: number }> = ({ fill = 1, open = 1 }) => {
  const n = Math.round(2 + fill * 8);
  return <group>
    <B p={[0, 0.45, 0]} s={[2.4, 0.9, 1.6]} c="#2f7a4a" metal={0.4} rough={0.4} />
    <B p={[0, 0.92, 0]} s={[2.2, 0.06, 1.4]} c="#1c3a24" />
    {Array.from({ length: n }, (_, i) => <Bill key={i} v={i % 3 === 0 ? 50 : i % 2 ? 10 : 5} p={[-0.7 + (i / n) * 1.4, 1.0 + i * 0.03, 0.05]} rot={[-1.2, 0, (i - n / 2) * 0.12]} k={0.62} />)}
    <group position={[0, 0.9, -0.8]} rotation={[-1.9 * open, 0, 0]}><B p={[0, 0.03, 0.8]} s={[2.4, 0.08, 1.6]} c="#2f7a4a" metal={0.4} rough={0.4} /></group>
    <B p={[0, 0.5, 0.82]} s={[0.5, 0.2, 0.06]} c="#c8ccd0" metal={0.7} />
  </group>;
};
/** The cash box held in front with both hands is awkward for blocky arms: hold it in one hand by its handle (hand frame). */
export const HeldCashBox: React.FC<{ fill?: number }> = ({ fill = 1 }) => (
  <group position={[0, 0.6, 0.35]} rotation={[-Math.PI / 2, 0, 0]} scale={0.8}><CashBox fill={fill} open={1} /></group>
);

// ------------------------------------------------------------------------------------------------ the pet kit
/** The stiff novelty leash: a red strap from the fist, bending forward and down to an EMPTY collar. In the hand frame:
 *  `reach` how far forward the collar sits, `drop` how far down (down the arm when it hangs). `up` true: held high
 *  (BRO's "something tall is on this"): the strap rises out of the top of the fist instead. */
export const Leash: React.FC<{ reach?: number; drop?: number; up?: boolean; color?: string; sway?: number }> = ({ reach = 2.6, drop = 1.4, up = false, color = "#d0322a", sway = 0 }) => {
  // points in the hand frame (y forward/out of the fist, z down the arm)
  const pts: V3[] = up ? [[0, 0.3, 0], [0, 1.2, -0.1], [0, 2.1, 0.0], [sway, 2.6, 0.3]] : [[0, 0.3, 0], [0, reach * 0.5, drop * 0.15], [0, reach * 0.85, drop * 0.6], [sway, reach, drop]];
  const end = pts[pts.length - 1];
  return <group>
    <B p={[0, 0.05, 0.1]} s={[0.4, 0.5, 0.7]} c="#2a2a2e" />
    {pts.slice(1).map((p, i) => <Tube key={i} a={pts[i]} b={p} r={0.09} c={color} />)}
    {/* the empty collar: a ring standing upright, nothing inside it */}
    <mesh position={end} rotation={[0, 0, 0]} castShadow><torusGeometry args={[0.42, 0.09, 8, 20]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
    <mesh position={[end[0], end[1], end[2] + 0.45]}><sphereGeometry args={[0.1, 8, 6]} /><meshStandardMaterial color="#e8c84a" metalness={0.7} roughness={0.3} /></mesh>
  </group>;
};
/** A small open cardboard box with air holes (origin bottom centre, 1.2 cube). `empty` is the joke: look inside, nothing. */
export const PetBox: React.FC<{ p?: V3; rot?: V3; k?: number }> = ({ p, rot, k = 1 }) => (
  <group position={p} rotation={rot} scale={k}>
    <B p={[0, 0.03, 0]} s={[1.2, 0.06, 1.2]} c="#b88a58" />
    {[[0, 0.6, 0.57, 0], [0, 0.6, -0.57, 0], [0.57, 0.6, 0, 1], [-0.57, 0.6, 0, 1]].map(([x, y, z, r], i) => <B key={i} p={[x, y, z]} s={r ? [0.06, 1.2, 1.2] : [1.2, 1.2, 0.06]} c="#c49a66" />)}
    {[[0, 1.22, 0.85, 0.5], [0, 1.22, -0.85, -0.5]].map(([x, y, z, a], i) => <B key={`f${i}`} p={[x, y, z]} s={[1.2, 0.06, 0.6]} rot={[a, 0, 0]} c="#c49a66" />)}
    {[-0.3, 0, 0.3].map((x) => <mesh key={x} position={[x, 0.85, 0.61]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.07, 0.07, 0.02, 10]} /><meshBasicMaterial color="#3a2614" /></mesh>)}
  </group>
);
const certTex = (pet: string) => canvasTex(`cert|${pet}`, 512, 384, (g, w, h) => {
  g.fillStyle = "#fbf3dc"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#c89a2a"; g.lineWidth = 14; g.strokeRect(12, 12, w - 24, h - 24); g.lineWidth = 3; g.strokeRect(30, 30, w - 60, h - 60);
  g.fillStyle = "#3a2a14"; g.textAlign = "center"; g.textBaseline = "middle";
  fit(g, "CERTIFICATE", w - 120, 52, "Georgia, serif"); g.fillText("CERTIFICATE", w / 2, 78);
  fit(g, "OF OWNERSHIP", w - 140, 26, "Georgia, serif", 700); g.fillText("OF OWNERSHIP", w / 2, 118);
  g.fillStyle = "#1b1410"; fit(g, `1 INVISIBLE ${pet}`, w - 90, 54); g.fillText(`1 INVISIBLE ${pet}`, w / 2, 196);
  // gold star seal
  const cx = w - 108, cy = h - 96; g.fillStyle = "#e8b82a"; g.beginPath();
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 26 : 56; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  g.closePath(); g.fill(); g.strokeStyle = "#a8781a"; g.lineWidth = 4; g.stroke();
  g.strokeStyle = "#3a2a14"; g.lineWidth = 3; g.beginPath(); g.moveTo(70, h - 80); g.lineTo(260, h - 80); g.stroke();
  g.fillStyle = "#2a3a8a"; g.font = "italic 700 30px Georgia, serif"; g.textAlign = "left"; g.fillText("Max", 100, h - 100);
});
/** The certificate (3.2 x 2.4), facing +z. */
export const Certificate: React.FC<{ pet?: string; p?: V3; rot?: V3; k?: number }> = ({ pet = "DOG", p, rot, k = 1 }) => (
  <group position={p} rotation={rot} scale={k}><Card s={[3.2, 2.4]} map={certTex(pet)} /></group>
);
/** A certificate held up out of the fist (hand frame), facing the way the character faces when the arm points forward-down. */
export const HeldCert: React.FC<{ pet?: string; k?: number }> = ({ pet = "DOG", k = 0.7 }) => (
  <group position={[0, 0.2 + 1.2 * k, 0.1]} rotation={[0, 0, 0]}><group rotation={[-Math.PI / 2, 0, 0]}><group rotation={[0, 0, 0]} scale={k}><Card s={[3.2, 2.4]} map={certTex(pet)} /></group></group></group>
);

// ------------------------------------------------------------------------------------------------ BRO's stand
const standSignTex = () => canvasTex("standSign", 768, 192, (g, w, h) => {
  g.fillStyle = "#fbf6e8"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#2f6fc8"; g.textAlign = "center"; g.textBaseline = "middle"; fit(g, "INVISIBLE PETS", w - 60, 96, "Comic Sans MS, Arial"); g.fillText("INVISIBLE PETS", w / 2, h * 0.38);
  g.fillStyle = "#d0322a"; fit(g, "$5 EACH!!", w - 200, 64, "Comic Sans MS, Arial"); g.fillText("$5 EACH!!", w / 2, h * 0.78);
});
/** The price list: what's for sale, sold ones crossed out. The ELEPHANT is the one left (the clue in beat 9). */
export const PRICE_ROWS = ["DOG", "CAT", "HAMSTER", "SNAKE", "HORSE", "DRAGON", "ELEPHANT"] as const;
export const SOLD = new Set(["DOG", "CAT", "HAMSTER", "SNAKE", "HORSE", "DRAGON"]);
const priceTex = () => canvasTex("priceList", 384, 576, (g, w, h) => {
  g.fillStyle = "#fbf6e8"; g.fillRect(0, 0, w, h); g.fillStyle = "#cfe0f4"; for (let y = 120; y < h; y += 64) g.fillRect(0, y, w, 3);
  g.fillStyle = "#1b1410"; g.textAlign = "center"; fit(g, "PRICES", w - 40, 64, "Comic Sans MS, Arial"); g.fillText("PRICES", w / 2, 72);
  PRICE_ROWS.forEach((r, i) => {
    const y = 160 + i * 60; g.textAlign = "left"; g.fillStyle = r === "ELEPHANT" ? "#2f6fc8" : "#3a3a3a"; fit(g, r, 230, 40, "Comic Sans MS, Arial"); g.fillText(r, 24, y);
    g.textAlign = "right"; g.fillText("$5", w - 24, y);
    if (SOLD.has(r)) { g.strokeStyle = "#d0322a"; g.lineWidth = 7; g.beginPath(); g.moveTo(16, y - 12); g.lineTo(w - 16, y - 16); g.stroke(); }
  });
});
/** BRO's folding table (6 x 3, top at y 2.4), facing +z (the customers' side), the hand-made sign on its front, a price
 *  list standing on it (right), leashes, boxes, certificates and the cash box (left). Origin: floor centre. */
export const TABLE = { w: 6, d: 3, top: 1.9 } as const;
export const PetTable: React.FC<{ cash?: number; boxes?: number }> = ({ cash = 0.6, boxes = 2 }) => (
  <group>
    <B p={[0, TABLE.top - 0.1, 0]} s={[TABLE.w, 0.2, TABLE.d]} c="#e8e4da" rough={0.6} />
    {[[-2.7, -1.2], [2.7, -1.2], [-2.7, 1.2], [2.7, 1.2]].map(([x, z], i) => <B key={i} p={[x, (TABLE.top - 0.2) / 2, z]} s={[0.15, TABLE.top - 0.2, 0.15]} c="#6a6e74" metal={0.5} />)}
    <Card p={[0, 1.15, TABLE.d / 2 + 0.03]} s={[5.6, 1.4]} map={standSignTex()} />
    <group position={[2.0, TABLE.top, -0.6]} rotation={[-0.2, -0.3, 0]}><Card p={[0, 1.15, 0]} s={[1.6, 2.4]} map={priceTex()} /></group>
    <group position={[-1.6, TABLE.top, -0.3]}><CashBox fill={cash} /></group>
    {Array.from({ length: boxes }, (_, i) => <PetBox key={i} p={[0.1 + i * 0.95, TABLE.top, 0.5 - (i % 2) * 0.5]} k={0.7} rot={[0, 0.25 * i - 0.2, 0]} />)}
    {[0, 1, 2].map((i) => <Certificate key={i} p={[0.9 + i * 0.1, TABLE.top + 0.02 + i * 0.01, 0.9]} rot={[-Math.PI / 2, 0, 0.1 * i]} k={0.35} />)}
    {[0, 1].map((i) => <group key={i} position={[-2.6 + i * 0.4, TABLE.top + 0.1, 1.1]} rotation={[0, 0, 0]}><Tube a={[0, 0, 0]} b={[0.3, 0, -0.9]} r={0.08} c="#d0322a" /><mesh position={[0.3, 0.05, -1.2]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.3, 0.07, 6, 16]} /><meshStandardMaterial color="#d0322a" /></mesh></group>)}
  </group>
);
/** The table's colliders at world position p (facing +z unless yaw = PI: then the customers' side faces -z). */
export const tableCS = (p: V3): Box[] => [box([p[0], TABLE.top / 2, p[2]], [TABLE.w, TABLE.top, TABLE.d], "table")];
/** The price list's position on the table (for close-ups), relative to the table origin. */
export const PRICE_AT: V3 = [2.0, 1.9 + 1.15, -0.6];

// ------------------------------------------------------------------------------------------------ office corridor
const peanutTex = () => canvasTex("peanuts", 512, 640, (g, w, h) => {
  g.fillStyle = "#c8a46a"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${i % 2 ? "90,60,20" : "240,210,150"},0.22)`; g.fillRect((i * 97) % w, (i * 53) % h, 4, 2); }
  for (let y = 0; y < h; y += 8) { g.fillStyle = "rgba(80,50,20,0.08)"; g.fillRect(0, y, w, 2); }
  g.fillStyle = "#b02a20"; g.textAlign = "center"; g.textBaseline = "middle"; fit(g, "PEANUTS", w - 80, 120, "Impact, Arial"); g.fillText("PEANUTS", w / 2, h * 0.42);
  g.fillStyle = "#3a2a14"; fit(g, "EXTRA GIANT SIZE", w - 120, 44); g.fillText("EXTRA GIANT SIZE", w / 2, h * 0.58);
  // a cartoon peanut
  g.fillStyle = "#e8c07a"; g.strokeStyle = "#3a2a14"; g.lineWidth = 6;
  g.beginPath(); g.ellipse(w / 2 - 40, h * 0.76, 46, 34, 0, 0, Math.PI * 2); g.ellipse(w / 2 + 40, h * 0.76, 46, 34, 0, 0, Math.PI * 2); g.fill(); g.stroke();
});
/** A giant burlap sack of peanuts (about 3 wide, 5 tall: taller than BRO), leaning on a wall. Origin: floor centre, faces +z. */
export const PeanutBag: React.FC<{ p?: V3; yaw?: number; lean?: number }> = ({ p, yaw = 0, lean = 0.1 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <group rotation={[-lean, 0, 0]}>
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow scale={[1.5, 2.2, 1.0]}><sphereGeometry args={[1, 20, 16]} /><meshStandardMaterial color="#c8a46a" roughness={0.95} /></mesh>
      <mesh position={[0, 2.1, 0.98]} scale={[1, 1, 1]}><planeGeometry args={[2.3, 2.9]} /><meshStandardMaterial map={peanutTex()} roughness={0.95} transparent alphaTest={0.1} /></mesh>
      <mesh position={[0, 4.55, -0.1]} castShadow><cylinderGeometry args={[0.35, 0.8, 0.9, 12]} /><meshStandardMaterial color="#b8945a" roughness={0.95} /></mesh>
      <mesh position={[0, 4.75, -0.1]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.38, 0.08, 6, 14]} /><meshStandardMaterial color="#6a4a24" /></mesh>
      {/* a few loose peanuts on the floor */}
    </group>
    {[[1.6, 0.9], [1.9, 0.4], [-1.7, 0.8]].map(([x, z], i) => <mesh key={i} position={[x, 0.18, z]} rotation={[0, i, Math.PI / 2]} scale={[0.18, 0.32, 0.18]}><sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#d8b07a" roughness={0.9} /></mesh>)}
  </group>
);
export const peanutCS = (p: V3): Box[] => [box([p[0], 2.3, p[2]], [3.2, 4.6, 2.2], "peanuts")];

// ------------------------------------------------------------------------------------------------ the gym
/** The tiny step stool: two steps (top 1.2), 2 wide. Origin floor centre, steps face +z. */
export const STOOL = { top: 1.2, w: 2.2, d: 2.0 } as const;
export const StepStool: React.FC<{ p?: V3; yaw?: number }> = ({ p, yaw = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <B p={[0, 1.1, -0.4]} s={[2.2, 0.2, 1.2]} c="#e2b23a" rough={0.5} />
    <B p={[0, 0.55, 0.6]} s={[2.2, 0.18, 0.8]} c="#e2b23a" rough={0.5} />
    {[[-1.0, -0.4], [1.0, -0.4]].map(([x, z], i) => <B key={i} p={[x, 0.5, z]} s={[0.18, 1.0, 1.2]} c="#c8961e" />)}
    {[-1.0, 1.0].map((x) => <B key={`l${x}`} p={[x, 0.23, 0.6]} s={[0.18, 0.46, 0.8]} c="#c8961e" />)}
    <B p={[0, 1.215, -0.4]} s={[1.8, 0.03, 0.9]} c="#3a3a3a" rough={0.95} />
  </group>
);
export const stoolCS = (p: V3): Box[] => [box([p[0], 0.6, p[2] - 0.4], [2.2, 1.2, 1.2], "stool"), box([p[0], 0.32, p[2] + 0.6], [2.2, 0.64, 0.8], "stoolStep")];
const ridesTex = () => canvasTex("rides", 768, 576, (g, w, h) => {
  g.fillStyle = "#fbf6e8"; g.fillRect(0, 0, w, h); g.strokeStyle = "#1e4f8a"; g.lineWidth = 16; g.strokeRect(10, 10, w - 20, h - 20);
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "#1e4f8a"; fit(g, "ELEPHANT", w - 80, 140, "Impact, Arial"); g.fillText("ELEPHANT", w / 2, 120);
  fit(g, "RIDES", w - 200, 150, "Impact, Arial"); g.fillText("RIDES", w / 2, 270);
  g.fillStyle = "#d0322a"; fit(g, "$10", w - 300, 190, "Impact, Arial"); g.fillText("$10", w / 2, 440);
  g.fillStyle = "#3a3a3a"; fit(g, "(elephant not shown)", w - 300, 30, "Arial", 700); g.fillText("(elephant not shown)", w / 2, 538);
});
/** The ELEPHANT RIDES $10 sign on an easel (5.4 wide board, 3.8 tall, its centre ~6.2 up). `cover` 0..1 a blue cloth over
 *  it (1 = hidden, 0 = pulled off). The board stays hidden until beat 15: show it only with cover = 1 before. */
export const RidesSign: React.FC<{ p?: V3; yaw?: number; cover?: number }> = ({ p, yaw = 0, cover = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    {[-1.6, 1.6].map((x) => <Tube key={x} a={[x, 0, 0.6]} b={[x * 0.7, 8.4, 0]} r={0.14} c="#8a5a32" />)}
    <Tube a={[0, 0, -1.6]} b={[0, 8.0, -0.1]} r={0.14} c="#8a5a32" />
    <B p={[0, 4.1, 0.25]} s={[5.8, 0.25, 0.7]} c="#8a5a32" />
    {cover < 0.999 && <Card p={[0, 6.2, 0.15]} s={[5.4, 4.05]} map={ridesTex()} />}
    {cover > 0.001 && <group position={[0, 8.3, 0.45]}>
      {/* the cloth: drops away from the top as cover goes 1 -> 0 */}
      <mesh position={[0, -2.15 * cover - (1 - cover) * 5, 0.05 + (1 - cover) * 0.8]} scale={[1, Math.max(0.05, cover), 1]} castShadow>
        <boxGeometry args={[5.9, 4.4, 0.14]} /><meshStandardMaterial color="#2f5fae" roughness={0.9} />
      </mesh>
    </group>}
  </group>
);
export const ridesCS = (p: V3): Box[] => [box([p[0], 4.2, p[2]], [6, 8.4, 2.4], "sign")];
const ticketTex = (n: number) => canvasTex(`ticket${n}`, 384, 192, (g, w, h) => {
  g.fillStyle = "#f2c81e"; g.fillRect(0, 0, w, h); g.fillStyle = "#e0a810"; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(0, 16 + i * 32, 10, 0, Math.PI * 2); g.arc(w, 16 + i * 32, 10, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "#1b1410"; g.setLineDash([8, 6]); g.lineWidth = 3; g.strokeRect(22, 14, w - 44, h - 28);
  g.fillStyle = "#1b1410"; g.textAlign = "center"; g.textBaseline = "middle"; fit(g, "ELEPHANT RIDE", w - 70, 40, "Impact, Arial"); g.fillText("ELEPHANT RIDE", w / 2, 58);
  g.fillStyle = "#d0322a"; fit(g, `#${n}`, w - 120, 80, "Impact, Arial"); g.fillText(`#${n}`, w / 2, 128);
});
/** Ticket #n (2.0 x 1.0) held up out of the fist (hand frame). */
export const HeldTicket: React.FC<{ n?: number; k?: number }> = ({ n = 1, k = 1 }) => (
  <group position={[0, 0.25 + 0.5 * k, 0.15]} rotation={[0, Math.PI / 2, Math.PI / 2]} scale={k}><Card s={[2.0, 1.0]} map={ticketTex(n)} back="#e8b81a" /></group>
);
export const Ticket: React.FC<{ n?: number; p?: V3; rot?: V3; k?: number }> = ({ n = 1, p, rot, k = 1 }) => (
  <group position={p} rotation={rot} scale={k}><Card s={[2.0, 1.0]} map={ticketTex(n)} back="#e8b81a" /></group>
);
/** A small ticket table by the stool (where she takes the money): 4 x 2, top 2.6, with a roll of tickets and the cash box. */
export const TicketTable: React.FC<{ p?: V3; yaw?: number; cash?: number }> = ({ p, yaw = 0, cash = 0.3 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <B p={[0, 2.5, 0]} s={[4, 0.2, 2]} c="#7a4e2c" />
    {[[-1.8, -0.8], [1.8, -0.8], [-1.8, 0.8], [1.8, 0.8]].map(([x, z], i) => <B key={i} p={[x, 1.2, z]} s={[0.2, 2.4, 0.2]} c="#5a3a20" />)}
    <group position={[-0.9, 2.6, 0]}><CashBox fill={cash} /></group>
    <mesh position={[1.2, 3.0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.4, 0.4, 0.9, 16]} /><meshStandardMaterial color="#f2c81e" roughness={0.6} /></mesh>
  </group>
);
export const ticketTableCS = (p: V3): Box[] => [box([p[0], 1.3, p[2]], [4, 2.6, 2], "ticketTable")];

// ------------------------------------------------------------------------------------------------ the field (beat 5)
/** A big leafy tree (trunk 1.6 wide; canopy of blocks), our own. Origin at the trunk's base. */
export const FieldTree: React.FC<{ p?: V3; k?: number; shake?: number }> = ({ p, k = 1, shake = 0 }) => (
  <group position={p} scale={k}>
    <mesh position={[0, 5, 0]} castShadow receiveShadow><boxGeometry args={[1.8, 10, 1.8]} /><meshStandardMaterial {...mat("woodDark", "#6a4a2c", rep("woodDark", 1.8, 10))} /></mesh>
    <group rotation={[0, 0, Math.sin(shake * 30) * 0.02 * shake]} position={[0, 0, 0]}>
      {([[0, 12, 0, 8], [-3, 10.5, 1, 5.5], [3.2, 10.8, -0.5, 5.8], [0.5, 15, 0.5, 5.5], [-1, 11, -3, 5], [1, 11, 3, 5]] as [number, number, number, number][]).map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} castShadow receiveShadow><boxGeometry args={[s, s * 0.8, s]} /><meshStandardMaterial color={["#4f8a3a", "#5f9a42", "#467f34"][i % 3]} roughness={0.95} /></mesh>
      ))}
    </group>
  </group>
);
export const treeCS = (p: V3): Box[] => [box([p[0], 5, p[2]], [1.8, 10, 1.8], "tree")];
/** The playing field: grass, white lines, a soccer goal, the school's brick back and a fence far off. Origin centre. */
export const Field: React.FC<{ tree: V3 }> = ({ tree }) => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[300, 300]} /><meshStandardMaterial {...mat("grass", undefined, rep("grass", 300, 300))} /></mesh>
    {[-20, 20].map((z) => <mesh key={z} position={[0, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[120, 0.4]} /><meshStandardMaterial color="#f6f4ee" roughness={0.9} /></mesh>)}
    <mesh position={[30, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.4, 40]} /><meshStandardMaterial color="#f6f4ee" /></mesh>
    {/* goal at the far end */}
    <group position={[-48, 0, 0]}>
      {[-6, 6].map((z) => <Tube key={z} a={[0, 0, z]} b={[0, 6, z]} r={0.22} c="#f6f4ee" />)}
      <Tube a={[0, 6, -6]} b={[0, 6, 6]} r={0.22} c="#f6f4ee" />
    </group>
    <mesh position={[0, 11, -70]} receiveShadow><boxGeometry args={[160, 22, 10]} /><meshStandardMaterial {...mat("brick", undefined, rep("brick", 160, 22))} /></mesh>
    {Array.from({ length: 14 }, (_, i) => <mesh key={i} position={[-70 + i * 11, 13, -64.9]}><planeGeometry args={[6, 4.5]} /><meshStandardMaterial color="#bcd8ee" roughness={0.1} metalness={0.2} /></mesh>)}
    <FieldTree p={tree} />
    <FieldTree p={[tree[0] - 34, 0, tree[2] - 30]} k={0.9} />
    <FieldTree p={[tree[0] + 40, 0, tree[2] - 36]} k={1.1} />
  </group>
);

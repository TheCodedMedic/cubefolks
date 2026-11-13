// Short 1 cast: Hans the horse (an original Beanfolk horse: a round bean head with the drawn face kit, a soft muzzle with
// its own drawn mouth, a capsule body and thin stick legs with chunky hooves), von Osten, Oskar, the scientists, the
// strangers, low-detail crowd beans, and the props they hold. Hans faces +z; his tapping leg is the front right.
import React, { useMemo } from "react";
import * as THREE from "three";
import { drawFace, Expr, EXPR, PHI_SPAN, PX, THETA0, THETA_SPAN } from "../bean/Face";
import { Bean3D, Look, Pose, R as BR, HEAD_SCALE } from "./Bean";

const D = Math.PI / 180;
const Mat: React.FC<{ c: string; r?: number; map?: THREE.Texture | null; side?: THREE.Side; e?: string; ei?: number }> = ({ c, r = 0.72, map, side, e, ei }) => (
  <meshStandardMaterial color={map ? "#ffffff" : c} map={map ?? null} roughness={r} metalness={0} side={side ?? THREE.FrontSide} emissive={e ?? "#000000"} emissiveIntensity={ei ?? 0} />
);
const dirOn = (theta: number, d: number) => new THREE.Vector3(Math.sin(d) * Math.sin(theta), Math.cos(theta), Math.cos(d) * Math.sin(theta));

// ================= HANS =================
export const HANS = { coat: "#b9773f", mane: "#4b2a17", muzzle: "#f3dfbd", hoof: "#2b1d16", leg: "#4a2c1b", sock: "#f6ead4", ribbon: "#d23b3b" };
const HR = 0.27; // head radius
const HEAD_C: [number, number, number] = [0, 1.47, 0.66]; // head centre (the neck pivot is below it)
const NECK_P: [number, number, number] = [0, 1.02, 0.42]; // neck base pivot
const BODY_Y = 0.8, BODY_R = 0.25, BODY_L = 0.46;
const HL1 = 0.3, HL2 = 0.28, HOOF = 0.065; // leg: upper, lower, hoof height
const HIP_Y = HL1 + HL2 + HOOF; // 0.645
const LEGS: { x: number; z: number; front: boolean }[] = [
  { x: 0.13, z: 0.3, front: true }, { x: -0.13, z: 0.3, front: true }, { x: 0.13, z: -0.3, front: false }, { x: -0.13, z: -0.3, front: false },
];

// Hans's face: the kit's eyes and brows on his coat colour, with a cream blaze; the mouth area is cleared (the muzzle
// carries his mouth). Cached per expression.
const FW = Math.round(PHI_SPAN * PX), FH = Math.round(THETA_SPAN * PX), FCX = FW / 2, FCY = (Math.PI / 2 - THETA0) * PX;
const HCACHE = new Map<string, THREE.CanvasTexture>();
const hansFaceTex = (e: Expr) => {
  const key = JSON.stringify(e);
  let t = HCACHE.get(key);
  if (t) return t;
  const face = document.createElement("canvas"); face.width = FW; face.height = FH;
  drawFace(face.getContext("2d")!, { ...e, mouth: "small" }, { skin: HANS.coat, brow: HANS.mane });
  const c = document.createElement("canvas"); c.width = FW; c.height = FH;
  const ctx = c.getContext("2d")!;
  // the blaze: a cream stripe from the forehead down between the eyes
  ctx.fillStyle = HANS.muzzle;
  ctx.beginPath();
  ctx.moveTo(FCX - 0.07 * PX, FCY - 0.62 * PX); ctx.quadraticCurveTo(FCX, FCY - 0.75 * PX, FCX + 0.07 * PX, FCY - 0.62 * PX);
  ctx.lineTo(FCX + 0.1 * PX, FCY + 0.6 * PX); ctx.lineTo(FCX - 0.1 * PX, FCY + 0.6 * PX); ctx.closePath(); ctx.fill();
  ctx.drawImage(face, 0, 0);
  ctx.clearRect(0, FCY + 0.36 * PX, FW, FH); // the mouth zone is under the muzzle
  t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  HCACHE.set(key, t);
  return t;
};

// the muzzle's own mouth and nostrils (a patch on the muzzle ellipsoid; canvas in angle units like the face kit)
const MPX = 300, MPHI = 2.4, MT0 = 0.75, MTS = 1.9;
const MW = Math.round(MPHI * MPX), MH = Math.round(MTS * MPX), MCX = MW / 2;
const my = (theta: number) => (theta - MT0) * MPX;
export type HMouth = Expr["mouth"] | "snort";
const MCACHE = new Map<string, THREE.CanvasTexture>();
const muzzleTex = (m: HMouth) => {
  let t = MCACHE.get(m);
  if (t) return t;
  const c = document.createElement("canvas"); c.width = MW; c.height = MH;
  const ctx = c.getContext("2d")!, ink = "#2b1a12", dark = "#5a1a1c";
  const flare = m === "snort" ? 1.45 : 1;
  for (const s of [-1, 1]) { // nostrils
    ctx.fillStyle = "#3a2216";
    ctx.beginPath(); ctx.ellipse(MCX + s * 0.36 * MPX, my(1.28), 0.075 * MPX * flare, 0.12 * MPX * flare, s * 0.35, 0, Math.PI * 2); ctx.fill();
  }
  const y0 = my(1.9), hw = 0.42 * MPX;
  ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = ink; ctx.lineWidth = 0.055 * MPX;
  const openM = (top: number, bot: number, w: number, teeth: boolean, tongue: boolean) => {
    ctx.beginPath(); ctx.moveTo(MCX - w, y0 + top); ctx.quadraticCurveTo(MCX, y0 + top + 0.06 * MPX, MCX + w, y0 + top);
    ctx.quadraticCurveTo(MCX + w * 0.8, y0 + bot, MCX, y0 + bot); ctx.quadraticCurveTo(MCX - w * 0.8, y0 + bot, MCX - w, y0 + top); ctx.closePath();
    ctx.fillStyle = dark; ctx.fill(); ctx.save(); ctx.clip();
    if (teeth) { ctx.fillStyle = "#fffdf6"; ctx.fillRect(MCX - w, y0 + top - 4, w * 2, (bot - top) * 0.36 + 4); }
    if (tongue) { ctx.fillStyle = "#e5707a"; ctx.beginPath(); ctx.ellipse(MCX, y0 + bot, w * 0.5, (bot - top) * 0.45, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore(); ctx.stroke();
  };
  const P = (a: number) => a * MPX;
  switch (m) {
    case "smile": case "small": ctx.beginPath(); ctx.arc(MCX, y0 - P(0.3), P(0.42), Math.PI * 0.22, Math.PI * 0.78); ctx.stroke(); break;
    case "grin": openM(-P(0.04), P(0.3), hw, true, false); break;
    case "laugh": openM(-P(0.08), P(0.42), hw * 1.05, true, true); break;
    case "smirk": case "snort":
      ctx.beginPath(); ctx.moveTo(MCX - P(0.3), y0 + P(0.02)); ctx.quadraticCurveTo(MCX + P(0.1), y0 + P(0.12), MCX + P(0.38), y0 - P(0.14)); ctx.stroke(); break;
    case "flat": ctx.beginPath(); ctx.moveTo(MCX - P(0.25), y0); ctx.lineTo(MCX + P(0.25), y0); ctx.stroke(); break;
    case "frown": ctx.beginPath(); ctx.arc(MCX, y0 + P(0.36), P(0.36), Math.PI * 1.22, Math.PI * 1.78); ctx.stroke(); break;
    case "wobbly": ctx.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24, x = MCX - P(0.32) + u * P(0.64), y = y0 + Math.sin(u * Math.PI * 3) * P(0.05); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); break;
    case "o": case "talkO": ctx.beginPath(); ctx.ellipse(MCX, y0 + P(0.06), P(0.13), P(0.17), 0, 0, Math.PI * 2); ctx.fillStyle = dark; ctx.fill(); ctx.stroke(); break;
    case "gritted": openM(-P(0.08), P(0.12), hw * 0.9, true, false); break;
    default: openM(-P(0.03), P(0.2), hw * 0.7, false, true);
  }
  t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  MCACHE.set(m, t);
  return t;
};

/** Hans's state: tap = lift of the tapping leg (0 = hoof down, 1 = fully raised); head [pitch, yaw, roll] deg on the neck;
 *  neck [pitch, yaw]; ears (+ = pricked forward); tail swish; blinders; a body rock. */
export type HansS = { tap?: number; head?: [number, number, number]; neck?: [number, number]; ears?: number; tail?: number; blinders?: boolean; expr?: Expr; mouth?: HMouth; breathe?: number; bow?: boolean; puff?: number };

const Stick: React.FC<{ len: number; r: number; c: string }> = ({ len, r, c }) => (
  <mesh position={[0, -len / 2, 0]} castShadow><cylinderGeometry args={[r, r * 0.9, len, 10]} /><Mat c={c} r={0.55} /></mesh>
);
const HLeg: React.FC<{ hip: number; knee: number }> = ({ hip, knee }) => (
  <group rotation={[-hip * D, 0, 0]}>
    <Stick len={HL1} r={0.03} c={HANS.leg} />
    <group position={[0, -HL1, 0]} rotation={[knee * D, 0, 0]}>
      <mesh><sphereGeometry args={[0.03, 10, 8]} /><Mat c={HANS.leg} r={0.55} /></mesh>
      <Stick len={HL2} r={0.024} c={HANS.leg} />
      <group position={[0, -HL2, 0]} rotation={[(hip - knee) * D, 0, 0]}>
        <mesh position={[0, 0.005, 0]}><cylinderGeometry args={[0.04, 0.034, 0.05, 14]} /><Mat c={HANS.sock} r={0.9} /></mesh>
        <mesh position={[0, -HOOF + 0.024, 0.008]} castShadow><cylinderGeometry args={[0.045, 0.054, 0.05, 16]} /><Mat c={HANS.hoof} r={0.45} /></mesh>
      </group>
    </group>
  </group>
);

export const Hans: React.FC<{ s?: HansS; position?: [number, number, number]; yaw?: number; scale?: number }> = ({ s = {}, position = [0, 0, 0], yaw = 0, scale = 1 }) => {
  const expr = s.expr ?? EXPR.neutral;
  const faceMap = useMemo(() => hansFaceTex(expr), [JSON.stringify(expr)]);
  const mouthMap = useMemo(() => muzzleTex(s.mouth ?? (expr.mouth as HMouth)), [s.mouth, expr.mouth]);
  const tap = s.tap ?? 0, br = s.breathe ?? 0;
  const [hp, hy, hr] = s.head ?? [0, 0, 0];
  const [np, ny] = s.neck ?? [0, 0];
  const tail = s.tail ?? 0, ears = s.ears ?? 0;
  const rel = (p: [number, number, number], o: [number, number, number]): [number, number, number] => [p[0] - o[0], p[1] - o[1], p[2] - o[2]];
  const headRel = rel(HEAD_C, NECK_P);
  const neckLen = Math.hypot(headRel[1], headRel[2]);
  const neckTilt = Math.atan2(headRel[2], headRel[1]);
  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      {/* legs: the front right taps (lifts at the knee, strikes straight) */}
      {LEGS.map((l, i) => {
        const tapping = i === 1;
        const hip = tapping ? 30 * tap : 0, knee = tapping ? 78 * tap : 0;
        return <group key={i} position={[l.x, HIP_Y, l.z]}><HLeg hip={hip} knee={knee} /></group>;
      })}
      {/* body: a soft capsule along z, rocking a touch with each tap */}
      <group position={[0, BODY_Y, 0]} rotation={[-2 * tap * D, 0, 1.2 * tap * D]} scale={[1, 1 + 0.015 * br, 1]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow><capsuleGeometry args={[BODY_R, BODY_L, 10, 28]} /><Mat c={HANS.coat} r={0.75} /></mesh>
        {/* a saddle cloth: red with a gold trim and an H */}
        <mesh position={[0, 0, -0.02]} rotation={[-Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[BODY_R + 0.012, BODY_R + 0.012, 0.42, 28, 1, true, -1.15, 2.3]} /><Mat c={HANS.ribbon} r={0.8} side={THREE.DoubleSide} /></mesh>
        {/* tail */}
        <group position={[0, 0.1, -BODY_L / 2 - BODY_R + 0.04]} rotation={[0.5, tail * 0.5, 0]}>
          {[0, 1, 2, 3, 4].map((k) => (
            <mesh key={k} position={[Math.sin(tail * 2 + k * 0.6) * 0.012 * k, -0.06 * k, -0.035 * k]} castShadow><sphereGeometry args={[0.06 - k * 0.006, 12, 10]} /><Mat c={HANS.mane} r={0.9} /></mesh>
          ))}
        </group>
      </group>
      {/* neck + head */}
      <group position={NECK_P} rotation={[np * D, ny * D, 0]}>
        <mesh position={[0, neckLen / 2 * Math.cos(neckTilt), neckLen / 2 * Math.sin(neckTilt)]} rotation={[neckTilt, 0, 0]} castShadow>
          <capsuleGeometry args={[0.13, neckLen * 0.9, 8, 20]} /><Mat c={HANS.coat} r={0.75} />
        </mesh>
        {/* mane along the back of the neck */}
        {[0, 1, 2, 3, 4, 5].map((k) => {
          const u = k / 5;
          return <mesh key={k} position={[0, 0.06 + headRel[1] * u * 0.95, -0.1 + headRel[2] * u * 0.95 - 0.02]} castShadow><sphereGeometry args={[0.085 - 0.006 * k, 14, 10]} /><Mat c={HANS.mane} r={0.9} /></mesh>;
        })}
        <group position={headRel} rotation={[hp * D, hy * D, hr * D]}>
          <mesh castShadow receiveShadow><sphereGeometry args={[HR, 48, 36]} /><Mat c={HANS.coat} r={0.7} /></mesh>
          <mesh renderOrder={2}>
            <sphereGeometry args={[HR * 1.006, 64, 48, Math.PI / 2 - PHI_SPAN / 2, PHI_SPAN, THETA0, THETA_SPAN]} />
            <meshStandardMaterial map={faceMap} transparent roughness={0.7} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
          </mesh>
          {/* muzzle with its own mouth */}
          <group position={[0, -0.155, 0.2]} scale={[0.18, 0.135, 0.17]}>
            <mesh castShadow><sphereGeometry args={[1, 36, 28]} /><Mat c={HANS.muzzle} r={0.7} /></mesh>
            <mesh renderOrder={2}>
              <sphereGeometry args={[1.01, 48, 36, Math.PI / 2 - MPHI / 2, MPHI, MT0, MTS]} />
              <meshStandardMaterial map={mouthMap} transparent roughness={0.7} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
            </mesh>
          </group>
          {/* ears */}
          {[-1, 1].map((sd) => (
            <group key={sd} position={dirOn(0.42, sd * 0.62).multiplyScalar(HR * 0.96).toArray() as [number, number, number]} rotation={[(-8 + ears * 18) * D, 0, -sd * 22 * D]}>
              <mesh position={[0, 0.07, 0]} castShadow><coneGeometry args={[0.055, 0.17, 14]} /><Mat c={HANS.coat} r={0.75} /></mesh>
              <mesh position={[0, 0.065, 0.022]} scale={[0.6, 0.8, 0.4]}><coneGeometry args={[0.05, 0.15, 12]} /><Mat c="#e7a497" r={0.8} /></mesh>
            </group>
          ))}
          {/* forelock */}
          {[[-0.05, 0.25], [0.05, 0.25], [0, 0.35]].map(([dx, th], k) => (
            <mesh key={k} position={dirOn(th, dx).multiplyScalar(HR * 1.0).toArray() as [number, number, number]} castShadow><sphereGeometry args={[0.07, 12, 10]} /><Mat c={HANS.mane} r={0.9} /></mesh>
          ))}
          {/* bridle band round the muzzle */}
          <mesh position={[0, -0.13, 0.16]} rotation={[Math.PI / 2 - 0.35, 0, 0]} scale={[1.05, 1, 0.9]}><torusGeometry args={[0.16, 0.012, 8, 32]} /><Mat c="#6b3a22" r={0.5} /></mesh>
          {(s.puff ?? 0) > 0.01 && (s.puff ?? 0) < 0.99 && [-1, 1].map((sd) => {
            const u = s.puff ?? 0;
            return [0, 1, 2].map((k) => (
              <mesh key={sd * 10 + k} position={[sd * (0.06 + 0.05 * u + k * 0.02), -0.13 - 0.08 * u - k * 0.02, 0.37 + 0.35 * u + k * 0.05]} scale={0.04 + 0.09 * u + k * 0.012}>
                <sphereGeometry args={[1, 12, 10]} /><meshStandardMaterial color="#f4f4f8" transparent opacity={(1 - u) * 0.9} roughness={1} />
              </mesh>
            ));
          })}
          {s.blinders && [-1, 1].map((sd) => (
            <group key={sd} position={dirOn(1.6, sd * 0.95).multiplyScalar(HR * 1.08).toArray() as [number, number, number]} rotation={[0, sd * 0.95 - sd * 0.35, 0]}>
              <mesh castShadow><boxGeometry args={[0.012, 0.2, 0.17]} /><Mat c="#1e1714" r={0.4} /></mesh>
              <mesh position={[sd * 0.007, 0, 0]}><boxGeometry args={[0.004, 0.17, 0.14]} /><Mat c="#3a2a22" r={0.5} /></mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
};

/** Lift of the tapping leg at t for taps whose hoof-contact times are `taps`: a bump before each contact, 0 at contact. */
export const tapLift = (t: number, taps: number[]) => {
  let u = 0;
  for (let i = 0; i < taps.length; i++) {
    const tk = taps[i], prev = i ? taps[i - 1] : tk - 0.3;
    const d = Math.min(0.24, Math.max(0.1, (tk - prev) * 0.92));
    if (t > tk - d && t <= tk) u = Math.max(u, Math.sin((Math.PI * (t - (tk - d))) / d));
  }
  return u;
};
/** n taps evenly between a and b (contact times). */
export const tapsBetween = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => (n === 1 ? a : a + ((b - a) * i) / (n - 1)));
/** How many taps have landed by t. */
export const tapCount = (t: number, taps: number[]) => taps.filter((x) => t >= x).length;

// ================= HUMANS =================
export const LOOKS: Record<string, Look> = {
  osten: { name: "Wilhelm von Osten", role: "the owner", skin: 2, outfit: { kind: "suit", base: "#26262c", accent: "#26262c" }, hair: { kind: "sidePart", color: "#efece4" }, moustache: true, shoes: "#1d1b1a" },
  oskar: { name: "Oskar", role: "the student", skin: 1, outfit: { kind: "suit", base: "#7a5a3e", accent: "#2f5d8a" }, hair: { kind: "sidePart", color: "#6b4a2b" }, glasses: "#3a3a40", shoes: "#3a2a1e" },
  sci1: { name: "Prof. Stumpf", role: "scientist", skin: 2, outfit: { kind: "labcoat", base: "#f6f6f2", accent: "#2f5d8a" }, hair: { kind: "short", color: "#8d8a84" }, glasses: "#2d2d33", moustache: true, shoes: "#2b2b2b" },
  sci2: { name: "Dr. Adeyemi", role: "scientist", skin: 6, outfit: { kind: "labcoat", base: "#f6f6f2", accent: "#7a5bb8" }, hair: { kind: "bob", color: "#1e1410" }, glasses: "#b03a4a", shoes: "#5a4bb0" },
  sci3: { name: "Dr. Brandt", role: "scientist", skin: 3, outfit: { kind: "labcoat", base: "#f6f6f2", accent: "#3a8a5a" }, hair: { kind: "messy", color: "#3a2416" }, shoes: "#2b2b2b" },
  june: { name: "Greta", role: "a stranger", skin: 1, outfit: { kind: "dress", base: "#4fa7a0", accent: "#fff8ee" }, hair: { kind: "buns", color: "#c0662f" }, shoes: "#c8323c" },
  mabel: { name: "Frieda", role: "a baker", skin: 6, outfit: { kind: "apron", base: "#e5ab3c", accent: "#fbf6ec", accent2: "#d9534f" }, hair: { kind: "topBun", color: "#2a1a12" }, shoes: "#7a4b2f" },
  theo: { name: "Karl", role: "a stranger", skin: 4, outfit: { kind: "stripes", base: "#f2ead8", accent: "#2f5d8a" }, hair: { kind: "curly", color: "#1f140e" }, shoes: "#3b3b44" },
  hollis: { name: "Herr Lenz", role: "a stranger", skin: 3, outfit: { kind: "suit", base: "#4b3a5e", accent: "#d6a340" }, hair: { kind: "short", color: "#2a1d16" }, moustache: true, shoes: "#1d1b1a" },
  kid1: { name: "kid", role: "", skin: 7, outfit: { kind: "hoodie", base: "#e66a3e", accent: "#fbe9d6" }, hair: { kind: "curly", color: "#1f140e" }, shoes: "#f4f1ea" },
  kid2: { name: "kid", role: "", skin: 2, outfit: { kind: "dress", base: "#d65a7a", accent: "#fff3f0" }, hair: { kind: "buns", color: "#e0b050" }, shoes: "#2b2b2b" },
  kid3: { name: "kid", role: "", skin: 4, outfit: { kind: "stripes", base: "#f2ead8", accent: "#3a7a4a" }, hair: { kind: "messy", color: "#2a1d16" }, shoes: "#7a4b2f" },
};

/** von Osten's white beard and black slouch hat, in his head frame (head-centred, before the head scale). */
export const OstenExtras: React.FC<{ hat?: boolean }> = ({ hat = true }) => (
  <>
    <mesh position={[0, -0.2, 0.1]} scale={[1.2, 1.0, 0.85]} castShadow><sphereGeometry args={[0.13, 24, 18]} /><Mat c="#f4f2ec" r={0.95} /></mesh>
    <mesh position={[0, -0.3, 0.12]} scale={[0.8, 1.1, 0.7]} castShadow><sphereGeometry args={[0.1, 20, 14]} /><Mat c="#f4f2ec" r={0.95} /></mesh>
    {hat && (
      <group position={[0, BR * HEAD_SCALE[1] - 0.06, 0]} rotation={[-0.08, 0, 0.05]}>
        <mesh position={[0, 0.0, 0]} castShadow><cylinderGeometry args={[0.36, 0.36, 0.018, 40]} /><Mat c="#1c1b1f" r={0.7} /></mesh>
        <mesh position={[0, 0.09, 0]} castShadow><cylinderGeometry args={[0.2, 0.235, 0.17, 36]} /><Mat c="#1c1b1f" r={0.7} /></mesh>
        <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.238, 0.238, 0.045, 36]} /><Mat c="#3a3238" r={0.5} /></mesh>
        <mesh position={[0, 0.18, 0]} scale={[1, 0.3, 1]}><sphereGeometry args={[0.2, 24, 12]} /><Mat c="#1c1b1f" r={0.7} /></mesh>
      </group>
    )}
  </>
);
/** A bowler hat for a stranger. */
export const Bowler: React.FC<{ c?: string }> = ({ c = "#2a2420" }) => (
  <group position={[0, BR * HEAD_SCALE[1] - 0.07, 0]}>
    <mesh castShadow><cylinderGeometry args={[0.3, 0.3, 0.014, 32]} /><Mat c={c} r={0.6} /></mesh>
    <mesh position={[0, 0.05, 0]} scale={[1, 0.85, 1]} castShadow><sphereGeometry args={[0.22, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><Mat c={c} r={0.6} /></mesh>
  </group>
);

export type Who = { look: Look; pose?: Pose; expr?: Expr; pos: [number, number, number]; yaw?: number; hold?: React.ReactNode; holdL?: React.ReactNode; headExtra?: React.ReactNode; scale?: number; tilt?: [number, number] };
export const Person: React.FC<{ w: Who }> = ({ w }) => (
  <Bean3D look={w.look} pose={w.pose} expr={w.expr} position={w.pos} yaw={w.yaw ?? 0} hold={w.hold} holdL={w.holdL} headExtra={w.headExtra} scale={w.scale ?? 1} tilt={w.tilt} />
);

// ================= PROPS (held: the hand's frame, forearm along -y) =================
const paperTex = (lines: string[], head?: string, w = 256, h = 340) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d")!;
  x.fillStyle = "#fbf7ea"; x.fillRect(0, 0, w, h);
  x.fillStyle = "#2b2b33"; x.font = "800 26px Montserrat, sans-serif"; x.textAlign = "center";
  if (head) x.fillText(head, w / 2, 40);
  x.strokeStyle = "#9bb3d6"; x.lineWidth = 3;
  for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(20, 70 + i * 32); x.lineTo(w - 20, 70 + i * 32); x.stroke(); }
  x.fillStyle = "#33343c"; x.font = "700 22px Montserrat, sans-serif"; x.textAlign = "left";
  lines.forEach((l, i) => x.fillText(l, 24, 64 + i * 32));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const TEXCACHE = new Map<string, THREE.Texture>();
const memo = (k: string, f: () => THREE.Texture) => { let t = TEXCACHE.get(k); if (!t) { t = f(); TEXCACHE.set(k, t); } return t; };

export const Clipboard: React.FC<{ lines?: string[]; head?: string }> = ({ lines = ["signals?  -", "helpers?  -", "tricks?   -", "x x x"], head = "HANS" }) => {
  const map = memo("clip" + head + lines.join(), () => paperTex(lines, head));
  return (
    <group position={[0, -0.05, 0.05]} rotation={[-1.1, 0, 0]}>
      <mesh castShadow><boxGeometry args={[0.15, 0.2, 0.008]} /><Mat c="#9a6a3c" r={0.6} /></mesh>
      <mesh position={[0, -0.008, 0.0045]}><planeGeometry args={[0.13, 0.17]} /><Mat c="#fff" map={map} r={0.9} /></mesh>
      <mesh position={[0, 0.095, 0.008]}><boxGeometry args={[0.06, 0.02, 0.01]} /><Mat c="#c0c0c8" r={0.3} /></mesh>
    </group>
  );
};
export const Magnifier: React.FC = () => (
  <group position={[0, -0.04, 0.02]} rotation={[-0.4, 0, 0]}>
    <mesh position={[0, -0.03, 0]} castShadow><cylinderGeometry args={[0.009, 0.011, 0.09, 10]} /><Mat c="#5a3a22" r={0.5} /></mesh>
    <group position={[0, -0.14, 0]} rotation={[0, 0, 0]}>
      <mesh castShadow><torusGeometry args={[0.055, 0.009, 10, 28]} /><Mat c="#c99a3a" r={0.3} /></mesh>
      <mesh><circleGeometry args={[0.052, 28]} /><meshStandardMaterial color="#cfe8f6" transparent opacity={0.35} roughness={0.05} side={THREE.DoubleSide} /></mesh>
    </group>
  </group>
);
export const Notebook: React.FC = () => {
  const map = memo("note", () => paperTex(["2+3  5  ok", "√16  4  ok", "?    ->  X", "knows? ->", "  RIGHT", "blind -> X"], "OSKAR"));
  return (
    <group position={[0, -0.05, 0.04]} rotation={[-1.2, 0, 0]}>
      <mesh castShadow><boxGeometry args={[0.13, 0.17, 0.014]} /><Mat c="#3a5a8a" r={0.7} /></mesh>
      <mesh position={[0, 0, 0.0075]}><planeGeometry args={[0.12, 0.16]} /><Mat c="#fff" map={map} r={0.9} /></mesh>
    </group>
  );
};
export const Chalk: React.FC = () => (
  <mesh position={[0, -0.035, 0.02]} rotation={[0.6, 0, 0]} castShadow><cylinderGeometry args={[0.008, 0.008, 0.06, 8]} /><Mat c="#fbfbf4" r={0.9} /></mesh>
);
export const Pointer: React.FC = () => (
  <mesh position={[0, -0.03, 0.2]} rotation={[Math.PI / 2 - 0.3, 0, 0]} castShadow><cylinderGeometry args={[0.006, 0.01, 0.5, 8]} /><Mat c="#8a5a30" r={0.6} /></mesh>
);
export const Slate: React.FC<{ text: string }> = ({ text }) => {
  const map = memo("slate" + text, () => {
    const c = document.createElement("canvas"); c.width = 256; c.height = 192; const x = c.getContext("2d")!;
    x.fillStyle = "#2c3a33"; x.fillRect(0, 0, 256, 192); x.strokeStyle = "#a0703c"; x.lineWidth = 18; x.strokeRect(0, 0, 256, 192);
    x.fillStyle = "#f2f2ea"; x.font = "800 64px Montserrat, sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 128, 100);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
  return (
    <group position={[0, -0.06, 0.06]} rotation={[-1.35, 0, 0]}>
      <mesh castShadow><boxGeometry args={[0.2, 0.15, 0.01]} /><Mat c="#a0703c" r={0.7} /></mesh>
      <mesh position={[0, 0, 0.006]}><planeGeometry args={[0.2, 0.15]} /><Mat c="#fff" map={map} r={0.9} /></mesh>
    </group>
  );
};

// ================= LOW-DETAIL CROWD BEANS (6 meshes each, for the back rows) =================
const miniBody = (() => { let g: THREE.BufferGeometry | null = null; return () => g ?? (g = new THREE.CapsuleGeometry(0.155, 0.17, 6, 16)); })();
export const MiniBean: React.FC<{ pos: [number, number, number]; yaw?: number; body: string; skin: number; hair: string; expr?: Expr; hat?: string; lean?: number; lift?: number }> = ({ pos, yaw = 0, body, skin, hair, expr = EXPR.neutral, hat, lean = 0, lift = 0 }) => {
  const sk = ["#f7dcc8", "#efc6a6", "#e2ae86", "#cf9468", "#b67a4f", "#99603b", "#7c4a2d", "#663b24"][skin];
  const face = useMemo(() => {
    const c = document.createElement("canvas"); c.width = FW; c.height = FH; drawFace(c.getContext("2d")!, expr, { skin: sk, brow: hair });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, [JSON.stringify(expr), sk, hair]);
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      {[-0.06, 0.06].map((x) => <mesh key={x} position={[x, 0.17, 0]}><cylinderGeometry args={[0.013, 0.013, 0.34, 6]} /><Mat c="#141414" r={0.45} /></mesh>)}
      <group position={[0, 0.3, 0]} rotation={[lean * D, 0, 0]}>
        <mesh position={[0, 0.2, 0]} geometry={miniBody()} castShadow><Mat c={body} r={0.8} /></mesh>
        <group position={[0, 0.62, 0.0]} rotation={[-lift * D, 0, 0]} scale={HEAD_SCALE}>
          <mesh castShadow><sphereGeometry args={[BR, 28, 20]} /><Mat c={sk} r={0.68} /></mesh>
          <mesh renderOrder={2}><sphereGeometry args={[BR * 1.006, 40, 30, Math.PI / 2 - PHI_SPAN / 2, PHI_SPAN, THETA0, THETA_SPAN]} /><meshStandardMaterial map={face} transparent roughness={0.7} depthWrite={false} polygonOffset polygonOffsetFactor={-2} /></mesh>
          <mesh><sphereGeometry args={[BR * 1.04, 28, 14, 0, Math.PI * 2, 0, hat ? 1.1 : 0.85]} /><Mat c={hat ?? hair} r={0.85} side={THREE.DoubleSide} /></mesh>
        </group>
      </group>
    </group>
  );
};

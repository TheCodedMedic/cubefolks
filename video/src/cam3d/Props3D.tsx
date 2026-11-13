// Hand-held props and the poses that hold them, plus seating and facing helpers.
// Props are drawn in the hand's palm frame (origin at the palm, +z out of the palm, −y toward the fingertips).
import React from "react";
import * as THREE from "three";
import { HandShape, Pose3, STAND, toon } from "./Person3D";

const D = THREE.MathUtils.degToRad;

/** Phone lying in the palm, screen facing out of the palm (toward the face when the forearm is raised). lit: screen glow. */
export const HeldPhone: React.FC<{ lit?: boolean; screen?: string }> = ({ lit = true, screen = "#9FD8FF" }) => (
  <group position={[0, -0.04, 0.034]}>
    <mesh><boxGeometry args={[0.072, 0.148, 0.009]} /><meshStandardMaterial color="#0A0A0F" roughness={0.3} /></mesh>
    <mesh position={[0, 0, 0.005]}><planeGeometry args={[0.064, 0.136]} /><meshStandardMaterial color={screen} emissive={screen} emissiveIntensity={lit ? 1.4 : 0} /></mesh>
    {lit && <pointLight position={[0, 0, 0.12]} color={screen} intensity={0.6} distance={0.8} />}
  </group>
);
/** Paper coffee cup gripped around its middle (cup axis along the palm's x so it stands upright when the palm faces inward). */
export const HeldCup: React.FC<{ tilt?: number }> = ({ tilt = 0 }) => (
  <group position={[0, -0.03, 0.045]} rotation={[0, 0, D(90 + tilt)]}>
    <mesh material={toon("#F1E8D6")} castShadow><cylinderGeometry args={[0.045, 0.036, 0.13, 16]} /></mesh>
    <mesh material={toon("#A0603A")} position={[0, 0.0, 0]}><cylinderGeometry args={[0.0465, 0.04, 0.04, 16, 1, true]} /></mesh>
    <mesh material={toon("#3A2A22")} position={[0, 0.07, 0]}><cylinderGeometry args={[0.047, 0.047, 0.016, 16]} /></mesh>
  </group>
);
export const HeldSpoon: React.FC = () => (
  <group position={[0, -0.03, 0.02]} rotation={[D(-20), 0, 0]}>
    <mesh material={toon("#C9CCD6")} position={[0, -0.06, 0]}><boxGeometry args={[0.012, 0.13, 0.004]} /></mesh>
    <mesh material={toon("#C9CCD6")} position={[0, -0.135, 0.006]} scale={[1, 1.4, 0.5]}><sphereGeometry args={[0.018, 12, 8]} /></mesh>
    <mesh material={toon("#E8C77A")} position={[0, -0.135, 0.012]} scale={[1, 1.2, 0.4]}><sphereGeometry args={[0.013, 10, 6]} /></mesh>
  </group>
);
export const HeldToast: React.FC = () => (
  <mesh position={[0, -0.05, 0.03]} rotation={[0, D(90), 0]} material={toon("#D9A050")}><boxGeometry args={[0.012, 0.11, 0.1]} /></mesh>
);
export const HeldBox: React.FC<{ col?: string }> = ({ col = "#F2B84B" }) => (
  <group position={[0, -0.06, 0.05]}>
    <mesh material={toon(col)} castShadow><boxGeometry args={[0.07, 0.26, 0.18]} /></mesh>
    <mesh material={toon("#D9472B")} position={[0.036, 0.04, 0]}><boxGeometry args={[0.002, 0.08, 0.12]} /></mesh>
  </group>
);
export const HeldBag: React.FC<{ col?: string }> = ({ col = "#F2B84B" }) => (
  <group position={[0, -0.16, 0.02]}>
    <mesh material={toon(col)} castShadow><boxGeometry args={[0.2, 0.24, 0.1]} /></mesh>
    <mesh material={toon("#3A2A22")} position={[0, 0.15, 0]}><torusGeometry args={[0.04, 0.008, 6, 16, Math.PI]} /></mesh>
  </group>
);
/** A cereal bowl to stand on a table (not held). */
export const Bowl: React.FC<{ p: [number, number, number]; col?: string; full?: number }> = ({ p, col = "#F2F4F8", full = 1 }) => (
  <group position={p}>
    <mesh material={toon(col)} castShadow><sphereGeometry args={[0.085, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} /></mesh>
    <mesh position={[0, -0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} material={toon("#E8C77A")}><circleGeometry args={[0.078 * full, 18]} /></mesh>
    {full > 0.2 && Array.from({ length: 7 }, (_, k) => <mesh key={k} position={[Math.cos(k * 2.4) * 0.045, 0.0, Math.sin(k * 2.4) * 0.045]} material={toon("#C98A3A")}><torusGeometry args={[0.011, 0.005, 6, 10]} /></mesh>)}
  </group>
);

// ─── poses that hold things ──────────────────────────────────────────────────
/** Looking at a phone held in the right hand at chest height. */
export const PHONE_LOOK: Pose3 = { ...STAND, armR: [38, 10, 98], wristR: [10, 55], handR: "cradle", armL: [6, 7, 14], handL: "relaxed", headNod: 24 };
/** Holding a cup at the waist, palm in. */
export const CUP_HOLD: Pose3 = { ...STAND, armR: [32, 8, 62], wristR: [5, 80], handR: "grip" };
/** Waving: upper arm out to the side, forearm up beside (not behind) the head, palm to the front, the hand swinging. */
export const wavePose = (t: number, base: Pose3 = STAND): Pose3 => ({ ...base, armR: [20, 78, 105, 90], wristR: [-10 + 18 * Math.sin(t * 9), 90], handR: "wave" });
/** Eating: spoon from bowl to mouth on a cycle (t in seconds). */
// Eating, from the four phases of real spoon-feeding (Nakatake et al., PLoS ONE 2021: reach/scoop, transport, mouth, return):
// the neck bends down over the bowl to scoop, the elbow flexes to about 120–130° to bring the spoon up, the wrist extends so
// the bowl stays level, the head comes up to meet it, the mouth opens just before the spoon arrives and the spoon stops
// in front of the lips. Arm angles solved with forward kinematics of this rig for sitOn(0.46) at a table 0.78 high.
const EAT_SCOOP = { arm: [28, 35, 108, -8], wrist: [21, 112], nod: 24 };
const EAT_MOUTH = { arm: [44, 3, 121, -25], wrist: [-16, 53], nod: 6 };
const EAT_CYCLE = 2.6; // seconds per bite
const eatPhase = (t: number) => {
  const f = ((t / EAT_CYCLE) % 1 + 1) % 1, sm = (x: number) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
  const u = f < 0.2 ? 0 : f < 0.5 ? sm((f - 0.2) / 0.3) : f < 0.62 ? 1 : f < 0.9 ? 1 - sm((f - 0.62) / 0.28) : 0;
  return { f, u };
};
export const eatPose = (t: number, sitting: Pose3): Pose3 => {
  const { f, u } = eatPhase(t), m = (a: number, b: number) => a + (b - a) * u;
  const wig = f < 0.2 ? 3 * Math.sin(f * 60) : 0; // a small scoop in the bowl
  const A = EAT_SCOOP.arm.map((v, i) => m(v, EAT_MOUTH.arm[i]) + (i === 0 ? wig : 0)) as [number, number, number, number];
  return { ...sitting, armR: A, wristR: [m(EAT_SCOOP.wrist[0], EAT_MOUTH.wrist[0]), m(EAT_SCOOP.wrist[1], EAT_MOUTH.wrist[1])], handR: "pinch", armL: [30, 12, 75], handL: "relaxed", headNod: m(EAT_SCOOP.nod, EAT_MOUTH.nod) };
};
/** The eater's mouth: opens as the spoon arrives, closes on it, then chews while the spoon goes back down. */
export const eatFace = (t: number) => {
  const { f } = eatPhase(t);
  const open = f > 0.38 && f < 0.58 ? 0.75 * Math.min(1, (f - 0.38) / 0.1) : f >= 0.62 && f < 0.95 ? 0.18 + 0.14 * Math.sin((f - 0.62) * 60) : 0;
  return { open, sing: true };
};
/** Talking hands: open palms that move with the speech beat. */
export const talkHands = (t: number, base: Pose3, amt = 1): Pose3 => {
  const g = 0.5 + 0.5 * Math.sin(t * 3.1);
  return { ...base, armR: [25 + 25 * g * amt, 14, 70 + 25 * g * amt], handR: "open", wristR: [-10, 30], armL: [15 + 10 * (1 - g) * amt, 10, 50], handL: "relaxed" };
};

// ─── sitting ─────────────────────────────────────────────────────────────────
/** Sit with the pelvis on a seat of height h (m), feet on the floor (thighs level, shins down when the seat is about 0.45 m). */
export const sitOn = (h: number, extra: Pose3 = {}): Pose3 => {
  const knee = h > 0.6 ? 70 : 90;
  return { lean: 4, armL: [40, 6, 60], armR: [40, 6, 60], legL: [88, knee], legR: [84, knee], bob: h + 0.08 - 0.8, handL: "relaxed", handR: "relaxed", ...extra };
};
/** Sitting low on a kerb (seat 0.12–0.18 m): knees up, feet on the road. */
export const kerbSit = (extra: Pose3 = {}): Pose3 => ({ lean: 18, armL: [55, 8, 60], armR: [55, 8, 60], legL: [122, 128], legR: [116, 124], bob: -0.56, handL: "relaxed", handR: "relaxed", ...extra });

/** Yaw that turns a character at `from` to face `to` (both [x, z]). */
export const faceTo = (from: [number, number], to: [number, number]) => Math.atan2(to[0] - from[0], to[1] - from[1]);

/** A plain chair facing yaw (the sitter's back to the backrest). */
export const Chair: React.FC<{ p: [number, number, number]; yaw?: number; col?: string }> = ({ p, yaw = 0, col = "#8A6A4E" }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <mesh material={toon(col)} position={[0, 0.44, 0]} castShadow receiveShadow><boxGeometry args={[0.44, 0.04, 0.42]} /></mesh>
    <mesh material={toon(col)} position={[0, 0.72, -0.2]} castShadow><boxGeometry args={[0.44, 0.5, 0.035]} /></mesh>
    {[[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].map(([x, z], i) => <mesh key={i} material={toon("#4A3424")} position={[x, 0.21, z]}><boxGeometry args={[0.035, 0.42, 0.035]} /></mesh>)}
  </group>
);

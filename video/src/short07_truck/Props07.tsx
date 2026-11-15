// Short 07 props (rig units): the ice cream truck with the EMPTY speaker mount, and the cones.
// The truck is our own design: a cream step-van with pink stripes and scallops, a big cone on the roof, a serving window
// on its right side, a dim pink glow. On the roof front, a speaker MOUNT with nothing on it: a bracket, four bolts, two
// cut wires hanging. That empty mount is the Short's first clue.
import React, { useMemo } from "react";
import * as THREE from "three";
import { mat, rep } from "../blocky/Textures";
import * as K from "../blocky/Collide";
import type { V3 } from "./common";

// ---------------------------------------------------------------- truck geometry (local: forward +z, up +y, right side = -x)
/** Size: 8.4 wide (x), 11 tall, 21 long (z: rear -10.5 .. front +10.5). The serving window is on the right side (-x). */
export const TRUCK = {
  W: 8.4, L: 21, H: 10.4,
  /** the serving window's centre, local (right side, -x) */
  window: [-4.2, 6.2, -1.5] as V3,
  /** the counter ledge under the window (top y, local) */
  ledgeY: 5.0,
  /** the speaker mount on the roof, local */
  mount: [0, 10.4, 5.2] as V3,
  /** the headlights, local */
  lights: [[-2.9, 3.4, 10.55], [2.9, 3.4, 10.55]] as V3[],
};
/** The pale arm that hands the cones out points down-out of the window at this angle. */
const HAND_DOWN = 1.0;
/** Truck-local centre of that pale fist when fully out (handOut = 1). */
export const HAND_FIST: V3 = [-4.2 - 0.1 - 1.75 * Math.cos(1.0), 5.4 - 1.75 * Math.sin(1.0), -1.5];
/** World point for a truck-local point (truck at `p`, heading yaw). */
export const truckPt = (p: V3, yaw: number, l: V3): V3 => {
  const cs = Math.cos(yaw), sn = Math.sin(yaw);
  return [p[0] + l[0] * cs + l[2] * sn, p[1] + l[1], p[2] - l[0] * sn + l[2] * cs];
};
/** The truck's collider (an axis-aligned box: valid for yaw 0, +-pi/2, pi). */
export const truckCS = (p: V3, yaw: number): K.Box[] => {
  const along = Math.abs(Math.sin(yaw)) > 0.7; // driving along x
  const hx = along ? TRUCK.L / 2 : TRUCK.W / 2, hz = along ? TRUCK.W / 2 : TRUCK.L / 2;
  return [K.boxMinMax([p[0] - hx, p[1], p[2] - hz], [p[0] + hx, p[1] + TRUCK.H, p[2] + hz], "truck")];
};

const M = (color: string, rough = 0.5, extra: THREE.MeshStandardMaterialParameters = {}) => ({ color, roughness: rough, metalness: 0, ...extra });
const Bx: React.FC<{ p: V3; s: V3; m: THREE.MeshStandardMaterialParameters; r?: V3; cast?: boolean }> = ({ p, s, m, r = [0, 0, 0], cast = true }) => (
  <mesh position={p} rotation={r} castShadow={cast} receiveShadow><boxGeometry args={s} /><meshStandardMaterial {...m} /></mesh>
);
const Cy: React.FC<{ p: V3; rt: number; rb: number; h: number; m: THREE.MeshStandardMaterialParameters; r?: V3; seg?: number }> = ({ p, rt, rb, h, m, r = [0, 0, 0], seg = 20 }) => (
  <mesh position={p} rotation={r} castShadow receiveShadow><cylinderGeometry args={[rt, rb, h, seg]} /><meshStandardMaterial {...m} /></mesh>
);

/** A scalloped awning edge texture (pink and cream). */
const scallopTex = () => {
  const c = document.createElement("canvas"); c.width = 256; c.height = 64; const g = c.getContext("2d")!;
  g.fillStyle = "#f6d3e0"; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#fbf3e4" : "#ef7fa6"; g.fillRect(i * 32, 0, 32, 30); g.beginPath(); g.arc(i * 32 + 16, 30, 16, 0, Math.PI); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); return t;
};
/** The truck's side sign: a cone picture and the name, our own. */
const signTex = () => {
  const c = document.createElement("canvas"); c.width = 512; c.height = 160; const g = c.getContext("2d")!;
  g.fillStyle = "#fbf3e4"; g.fillRect(0, 0, 512, 160);
  g.strokeStyle = "#e0608c"; g.lineWidth = 10; g.strokeRect(8, 8, 496, 144);
  g.fillStyle = "#e0608c"; g.font = "900 64px Montserrat, sans-serif"; g.textAlign = "center"; g.fillText("SWEET", 300, 76); g.fillText("DREAMS", 300, 136);
  // a little cone
  g.fillStyle = "#d9a35a"; g.beginPath(); g.moveTo(60, 70); g.lineTo(120, 70); g.lineTo(90, 150); g.closePath(); g.fill();
  g.fillStyle = "#f4b6cc"; g.beginPath(); g.arc(90, 62, 34, Math.PI, 0); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
/** The menu board under the window (squares of flavours, no words). */
const menuTex = () => {
  const c = document.createElement("canvas"); c.width = 256; c.height = 128; const g = c.getContext("2d")!;
  g.fillStyle = "#3a2a3a"; g.fillRect(0, 0, 256, 128);
  const cols = ["#f4b6cc", "#a9e0c8", "#f7e08a", "#c9a2e8", "#8fd0f2", "#f2a07a"];
  for (let i = 0; i < 6; i++) { const x = 14 + (i % 3) * 82, y = 12 + Math.floor(i / 3) * 58; g.fillStyle = "#fbf3e4"; g.fillRect(x, y, 70, 48); g.fillStyle = cols[i]; g.beginPath(); g.arc(x + 35, y + 22, 15, 0, Math.PI * 2); g.fill(); g.fillStyle = "#d9a35a"; g.fillRect(x + 30, y + 30, 10, 14); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};

/**
 * The ice cream truck. `glow` 0..1 the dim pink glow (strips, window, under-glow), `lights` 0..1 the headlights,
 * `wheelTurn` radians of wheel spin (pass distance / 1.6), `bob` a small body sway while it rolls.
 * `handOut` 0..1: a pale hand reaches out of the serving window holding a cone (shot 5); `pulse` 0..1 flickers the glow on the jingle.
 */
export const Truck: React.FC<{ position: V3; yaw: number; glow?: number; lights?: number; wheelTurn?: number; bob?: number; handOut?: number; pulse?: number; night?: boolean; spark?: number }> =
  ({ position, yaw, glow = 1, lights = 1, wheelTurn = 0, bob = 0, handOut = 0, pulse = 0, night = true, spark = 0 }) => {
  const sc = useMemo(scallopTex, []), sign = useMemo(signTex, []), menu = useMemo(menuTex, []);
  const cream = { ...mat("plaster", "#f6efe0", rep("plaster", 20, 8)), roughness: 0.45 } as THREE.MeshStandardMaterialParameters;
  const pink = M("#e8749c", 0.4), pinkD = M("#c2557c", 0.45), chrome = M("#d7dade", 0.2, { metalness: 0.85 }), tyre = M("#1c1c1e", 0.9), dark = M("#22222a", 0.6);
  const g = glow * (0.85 + 0.15 * pulse);
  const glowM = (c: string, k: number) => M(c, 0.4, { emissive: c, emissiveIntensity: k * g });
  const glass = M("#5a6f96", 0.06, { metalness: 0.5, emissive: "#34405e", emissiveIntensity: night ? 0.55 : 0.05 });
  const { W, L } = TRUCK;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <group position={[0, 0, 0]} rotation={[0, 0, bob * 0.01]}>
        {/* a step van: the tall box body (rear + driver's compartment), a short hood in front, a big windscreen */}
        <Bx p={[0, 5.9, -1.75]} s={[W, 9.0, 17.5]} m={cream} />
        <Bx p={[0, 3.65, 8.75]} s={[W - 0.2, 4.5, 3.5]} m={cream} />
        <Bx p={[0, 5.95, 10.4]} s={[W - 0.6, 0.12, 0.2]} m={chrome} cast={false} />
        <Bx p={[0, 8.0, 7.05]} s={[W - 1.0, 3.4, 0.12]} m={glass} cast={false} />
        <Bx p={[-1.2, 8.3, 7.13]} s={[0.5, 3.0, 0.02]} m={M("#c8d4ec", 0.1, { emissive: "#8ea0c8", emissiveIntensity: 0.5 })} r={[0, 0, 0.5]} cast={false} />
        <Bx p={[0, 6.4, 7.08]} s={[W - 0.8, 0.25, 0.1]} m={pinkD} cast={false} />
        <Bx p={[0, 9.95, 7.0]} s={[W, 0.5, 0.3]} m={pinkD} />
        {[-1, 1].map((sd) => <Bx key={sd} p={[sd * (W / 2 + 0.05), 7.9, 5.6]} s={[0.1, 2.6, 2.4]} m={glass} cast={false} />)}
        {/* mirrors */}
        {[-1, 1].map((sd) => <group key={sd}><Bx p={[sd * (W / 2 + 0.6), 7.4, 6.9]} s={[0.15, 1.3, 0.8]} m={dark} /><Bx p={[sd * (W / 2 + 0.3), 7.9, 6.9]} s={[0.6, 0.1, 0.1]} m={chrome} /></group>)}
        {/* pink stripes, scallop awning over the window, the side sign */}
        {[-1, 1].map((sd) => <group key={sd}>
          <Bx p={[sd * (W / 2 + 0.03), 2.2, -0.4]} s={[0.06, 0.7, L - 0.6]} m={pink} cast={false} />
          <Bx p={[sd * (W / 2 + 0.04), 9.6, -2.6]} s={[0.06, 0.5, 15.4]} m={glowM("#ff8fb8", 0.9)} cast={false} />
        </group>)}
        <mesh position={[-W / 2 - 0.35, 8.55, -1.5]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[8.2, 1.1]} /><meshStandardMaterial map={sc} side={THREE.DoubleSide} roughness={0.6} /></mesh>
        <mesh position={[W / 2 + 0.05, 6.0, -2.4]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[9, 2.8]} /><meshStandardMaterial map={sign} roughness={0.5} /></mesh>
        <mesh position={[-W / 2 - 0.05, 3.3, -1.5]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[5.4, 1.9]} /><meshStandardMaterial map={menu} roughness={0.5} emissive="#ffffff" emissiveMap={menu} emissiveIntensity={0.25 * g} /></mesh>
        {/* serving window: a lit pink opening with a ledge; the inside is dark and empty */}
        <Bx p={[-W / 2 + 0.2, 6.3, -1.5]} s={[0.3, 3.0, 6.0]} m={glowM("#ff9ac0", 1.1)} cast={false} />
        <Bx p={[-W / 2 - 0.1, 6.3, -1.5]} s={[0.12, 3.2, 6.2]} m={M("#1a0f18", 0.8, { emissive: "#5a1a3a", emissiveIntensity: 0.6 * g })} cast={false} />
        <Bx p={[-W / 2 - 0.5, TRUCK.ledgeY - 0.1, -1.5]} s={[1.2, 0.2, 6.4]} m={chrome} />
        {/* the hand that gives the cones: pale, from the dark */}
        {handOut > 0.001 && <group position={[-W / 2 - 0.1, 5.4, -1.5]} rotation={[0, 0, HAND_DOWN]}>
          <Bx p={[-0.7 * handOut, 0, 0]} s={[1.4 * handOut + 0.6, 1.0, 1.0]} m={M("#3a2a44", 0.7)} />
          <Bx p={[-1.4 * handOut - 0.35, 0, 0]} s={[0.7, 0.98, 0.98]} m={M("#f2ece2", 0.55, { emissive: "#ffd0e0", emissiveIntensity: 0.15 })} />
          <group position={[-1.4 * handOut - 0.35, 0, 0]} rotation={[0, 0, -HAND_DOWN]}><group position={[0, 0.2, 0]}><Cone glow={0.6} /></group></group>
        </group>}
        {/* wheels */}
        {[[-W / 2, -7], [W / 2, -7], [-W / 2, 7], [W / 2, 7]].map(([x, z], i) => (
          <group key={i} position={[x, 1.7, z]} rotation={[wheelTurn, 0, 0]}>
            <Cy p={[0, 0, 0]} rt={1.7} rb={1.7} h={1.2} m={tyre} r={[0, 0, Math.PI / 2]} seg={24} />
            <Cy p={[x < 0 ? -0.62 : 0.62, 0, 0]} rt={0.9} rb={0.9} h={0.08} m={chrome} r={[0, 0, Math.PI / 2]} />
            <Bx p={[x < 0 ? -0.66 : 0.66, 0, 0]} s={[0.05, 1.4, 0.3]} m={dark} cast={false} />
          </group>
        ))}
        <Bx p={[0, 1.3, -2.2]} s={[W - 1.2, 1.0, 17]} m={dark} />
        {/* the big cone on the roof */}
        <group position={[0, 10.4, -4.5]}>
          <Cy p={[0, 0.5, 0]} rt={0.9} rb={1.4} h={1.0} m={pinkD} />
          <Cy p={[0, 2.6, 0]} rt={1.5} rb={0.35} h={3.4} m={{ ...mat("wood", "#d9a35a", [1, 2]), roughness: 0.7 } as THREE.MeshStandardMaterialParameters} r={[Math.PI, 0, 0]} />
          <mesh position={[0, 4.7, 0]} castShadow><sphereGeometry args={[1.75, 24, 16]} /><meshStandardMaterial {...glowM("#f6b4cc", 0.35)} /></mesh>
          <mesh position={[0, 6.0, 0]} castShadow><sphereGeometry args={[1.25, 20, 14]} /><meshStandardMaterial {...glowM("#fbe9d6", 0.3)} /></mesh>
          <mesh position={[0, 7.05, 0]}><sphereGeometry args={[0.38, 12, 10]} /><meshStandardMaterial color="#d22a3a" roughness={0.3} /></mesh>
        </group>
        {/* THE EMPTY SPEAKER MOUNT (roof front): a bracket plate, two uprights, a cradle with nothing in it, bolts, cut wires */}
        <SpeakerMount spark={spark} />
        {/* under-glow */}
        {glow > 0.01 && <mesh position={[0, 0.06, -1]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[W + 4, L + 2]} />
          <meshBasicMaterial color="#ff6fa8" transparent opacity={0.18 * g} depthWrite={false} toneMapped={false} /></mesh>}
        {glow > 0.01 && <pointLight position={[-W / 2 - 3, 6.5, -1.5]} intensity={16 * g} distance={26} decay={1.6} color="#ff8ab8" />}
        {lights > 0.01 && <spotLight position={[0, 2.8, 11.5]} target-position={[0, 0, 40]} angle={0.5} penumbra={0.6} intensity={140 * lights} distance={60} decay={1.4} color="#fff2d0" />}
      </group>
    </group>
  );
};

/** The empty speaker mount (local to the truck, on the roof front). Readable at phone size: a bright steel bracket,
 *  a black empty cradle, two red/black wires dangling with copper ends. */
export const SpeakerMount: React.FC<{ spark?: number }> = ({ spark = 0 }) => {
  const steel = M("#dfe3e8", 0.22, { metalness: 0.75, emissive: "#8090a8", emissiveIntensity: 0.25 }), black = M("#141416", 0.7);
  const [mx, my, mz] = TRUCK.mount;
  return (
    <group position={[mx, my, mz]}>
      <Bx p={[0, 0.1, 0]} s={[4.2, 0.2, 2.4]} m={steel} />
      {[-1.7, 1.7].map((x) => <Bx key={x} p={[x, 1.4, 0]} s={[0.3, 2.6, 0.7]} m={steel} />)}
      {/* the cradle: a U-shaped steel strap with NOTHING in it (you see the sky through it) */}
      <Bx p={[0, 2.6, 0]} s={[3.7, 0.22, 0.7]} m={steel} />
      <Bx p={[0, 0.45, 0]} s={[3.1, 0.5, 0.7]} m={black} />
      {[[-1.5, -0.8], [1.5, -0.8], [-1.5, 0.8], [1.5, 0.8], [-0.5, 0], [0.5, 0]].map(([x, z], i) => <Cy key={i} p={[x, 0.75, z]} rt={0.13} rb={0.13} h={0.22} m={steel} />)}
      {/* cut wires: out of the cradle, over the windscreen edge, dangling; copper ends spark now and then */}
      {[[-0.45, "#d0302a"], [0.45, "#1c1c1e"]].map(([x, col], i) => (
        <group key={i} position={[x as number, 0.7, 1.0]}>
          <mesh position={[0, 0.05, 0.6]} rotation={[1.25, 0, 0]}><cylinderGeometry args={[0.09, 0.09, 1.3, 8]} /><meshStandardMaterial color={col as string} roughness={0.5} /></mesh>
          <mesh position={[0, -0.75 - i * 0.25, 1.3]} rotation={[0.15 * (i ? -1 : 1), 0, 0]}><cylinderGeometry args={[0.09, 0.09, 1.7 + i * 0.5, 8]} /><meshStandardMaterial color={col as string} roughness={0.5} /></mesh>
          <mesh position={[0, -1.65 - i * 0.5, 1.33]}><cylinderGeometry args={[0.06, 0.03, 0.3, 6]} /><meshStandardMaterial color="#e8944a" metalness={0.7} roughness={0.3} emissive="#ffb050" emissiveIntensity={spark * 3} /></mesh>
          {spark > 0.05 && <mesh position={[0, -1.85 - i * 0.5, 1.35]}><sphereGeometry args={[0.28 * spark, 8, 6]} /><meshBasicMaterial color="#fff2c0" toneMapped={false} transparent opacity={0.9} /></mesh>}
        </group>
      ))}
    </group>
  );
};

/**
 * An ice cream cone (rig units), modelled for a hand: origin at the fist, +y up out of the fist when the arm is raised
 * forward (BlockChar `hold`). Cream cone + one pink scoop. `glow` 0..1 a faint inner glow (the truck's cones).
 */
export const Cone: React.FC<{ glow?: number; scoop?: string; scale?: number }> = ({ glow = 0, scoop = "#f6b4cc", scale = 1 }) => (
  <group scale={scale}>
    <mesh position={[0, 0.55, 0]} castShadow><cylinderGeometry args={[0.5, 0.1, 1.5, 16]} />
      <meshStandardMaterial {...mat("wood", "#d9a35a", [1, 1.5])} roughness={0.75} emissive="#ffb070" emissiveIntensity={0.25 * glow} /></mesh>
    {/* waffle ring */}
    <mesh position={[0, 1.25, 0]}><cylinderGeometry args={[0.55, 0.52, 0.18, 16]} /><meshStandardMaterial color="#c88a42" roughness={0.7} /></mesh>
    <mesh position={[0, 1.65, 0]} castShadow><sphereGeometry args={[0.6, 18, 14]} />
      <meshStandardMaterial color={scoop} roughness={0.55} emissive={scoop} emissiveIntensity={0.55 * glow} /></mesh>
    <mesh position={[0, 2.22, 0]}><sphereGeometry args={[0.13, 10, 8]} /><meshStandardMaterial color="#d22a3a" roughness={0.3} /></mesh>
    {glow > 0.01 && <pointLight position={[0, 1.7, 0.6]} intensity={2.4 * glow} distance={4} decay={2} color="#ffc0d8" />}
  </group>
);
/** A free-cone flyer (shot 3), a card 1.6 x 2.2 with a pink cone on it. */
export const Flyer: React.FC = () => {
  const tx = useMemo(() => {
    const c = document.createElement("canvas"); c.width = 128; c.height = 176; const g = c.getContext("2d")!;
    g.fillStyle = "#fbf3e4"; g.fillRect(0, 0, 128, 176); g.fillStyle = "#e0608c"; g.fillRect(0, 0, 128, 34);
    g.fillStyle = "#fff"; g.font = "900 26px Montserrat, sans-serif"; g.textAlign = "center"; g.fillText("FREE", 64, 26);
    g.fillStyle = "#d9a35a"; g.beginPath(); g.moveTo(40, 90); g.lineTo(88, 90); g.lineTo(64, 160); g.closePath(); g.fill();
    g.fillStyle = "#f4b6cc"; g.beginPath(); g.arc(64, 84, 28, Math.PI, 0); g.fill();
    g.fillStyle = "#3a2a3a"; g.font = "800 20px Montserrat, sans-serif"; g.fillText("3 AM", 64, 60);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }, []);
  return <mesh castShadow><boxGeometry args={[1.6, 2.2, 0.04]} /><meshStandardMaterial map={tx} roughness={0.7} /></mesh>;
};

// Short 09 "The Porch Light Code": the live porch lamps, the light switches, the front doors, the lights, the cast and the
// named spots. Everything here is in TOWN rig units (an adult is 5 tall). Two lots matter:
//   HOME: our house (near row, lot 4), lot-local = world. Front wall z = 9, door x = -3, porch floor y = 1.2 to z = 15.
//   BELL: Mr. Bell's house straight across the road (far lot 3): lot-local (x, y, z) -> world (-16 - x, y, 98 - z).
// Lot-local coordinates are the same for both houses (both style A, door at x = -3, front +z), so one helper places a
// lamp, a switch or a door on either house.
import React, { useMemo } from "react";
import * as THREE from "three";
import { BlockLights, Sky, LIGHTS } from "../blocky/Look";
import type { Look } from "../blocky/types";
import { rigBoxes, type CharState } from "../blocky/Collide";
import { DOOR_HW, Kit, doorSlab, Render, STREET, useBuilt, canvasTex } from "./Town09";

export type V3 = [number, number, number];
export type LotId = "home" | "bell";
export const F = STREET.porchY; // porch / ground-floor height (1.2)
const LOT: Record<LotId, { x: number; z: number; rot: number }> = { home: { x: 0, z: 0, rot: 0 }, bell: { x: -16, z: 98, rot: Math.PI } };
/** Lot-local point -> world. */
export const W = (lot: LotId, p: V3): V3 => { const L = LOT[lot]; return lot === "home" ? [p[0], p[1], p[2]] : [L.x - p[0], p[1], L.z - p[2]]; };
/** Lot-local yaw -> world yaw (BlockChar faces +z at yaw 0). */
export const WY = (lot: LotId, yaw: number) => yaw + LOT[lot].rot;
/** A group in a lot's local frame. */
export const InLot: React.FC<{ lot: LotId; children?: React.ReactNode }> = ({ lot, children }) => {
  const L = LOT[lot];
  return <group position={[L.x, 0, L.z]} rotation={[0, L.rot, 0]}>{children}</group>;
};

// ---------------------------------------------------------------- layout (lot-local)
export const DOOR_X = -3, FRONT_Z = 9, PORCH_Z = 15;
/** The porch lamp (beside the door, left of it seen from the street) and the switch right under it. */
export const LAMP_L: V3 = [DOOR_X - DOOR_HW - 1.05, F + 6.0, FRONT_Z + 0.45];
/** The porch-light switch: inside, on the inner face of the front wall, between the door and the big window. */
export const SWITCH_IN_L: V3 = [DOOR_X + DOOR_HW + 0.65, F + 3.7, FRONT_Z - 0.4 - 0.12 - 0.06];
export const SWITCH_OUT_L: V3 = SWITCH_IN_L;
/** Door hinge (left jamb from the street) and the free edge. */
export const HINGE_L: V3 = [DOOR_X - DOOR_HW + 0.27, F, FRONT_Z - 0.2];
/** The big front window (centre). */
export const WIN_L: V3 = [3 * 1.05 + 0.6, F + 4.4, FRONT_Z];
/** Stand spots (feet) */
export const SPOT = {
  porchDoor: [DOOR_X, F, FRONT_Z + 1.8] as V3,     // on the porch, in front of the door
  inDoor: [DOOR_X, F, FRONT_Z - 2.4] as V3,        // inside, in front of the door
  stepTop: [DOOR_X, F, PORCH_Z - 0.6] as V3,
  pathGate: [DOOR_X, 0.04, STREET.fenceZ] as V3,
  sidewalk: [DOOR_X, STREET.sidewalkY, STREET.sidewalkZ] as V3,
  curb: [DOOR_X, 0.12, 37.4] as V3,
};

// ---------------------------------------------------------------- flashes: the code
/** A light's level at t from a list of [on, off] intervals (ramps over ~1 frame, like a real bulb). */
export const lampLevel = (t: number, base: 0 | 1, flips: [number, number][]) => {
  // each [a, b]: the lamp is the opposite of `base` from a to b
  let inv = 0;
  for (const [a, b] of flips) inv = Math.max(inv, Math.min(1, Math.max(0, (t - a) / 0.03)) * Math.min(1, Math.max(0, (b - t) / 0.03)));
  return base === 1 ? 1 - inv : inv;
};
/** Three flashes starting at t0, one every `period` s, each `len` s long. */
export const three = (t0: number, period: number, len = period * 0.5): [number, number][] => [0, 1, 2].map((i) => [t0 + i * period, t0 + i * period + len]);

// ---------------------------------------------------------------- the live porch lamp
const lampTex = () => canvasTex("p09glow", 128, 128, (g) => {
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.25, "rgba(255,255,255,0.5)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
});
const glowMat = (() => { let m: THREE.MeshBasicMaterial | null = null; return () => (m ??= new THREE.MeshBasicMaterial({ map: lampTex(), color: "#ffcf8a", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); })();
/** The porch lamp of a lot at level `on` (0..1): the fixture, the bulb, a halo, a light pool on the porch and a real light. */
export const PorchLamp: React.FC<{ lot: LotId; on: number; power?: number }> = ({ lot, on, power = 1 }) => {
  const [x, y, z] = LAMP_L;
  const gm = useMemo(() => glowMat().clone(), []);
  gm.opacity = on;
  const pm = useMemo(() => glowMat().clone(), []);
  pm.opacity = on * 0.55;
  return (
    <InLot lot={lot}>
      <mesh position={[x, y, z - 0.33]}><boxGeometry args={[0.5, 0.8, 0.2]} /><meshStandardMaterial color="#2c2f33" roughness={0.45} metalness={0.4} /></mesh>
      <mesh position={[x, y + 0.75, z]}><boxGeometry args={[0.9, 0.15, 0.8]} /><meshStandardMaterial color="#2c2f33" roughness={0.45} metalness={0.4} /></mesh>
      <mesh position={[x, y - 0.68, z]}><boxGeometry args={[0.8, 0.12, 0.7]} /><meshStandardMaterial color="#2c2f33" roughness={0.45} metalness={0.4} /></mesh>
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b], i) => (
        <mesh key={i} position={[x + a * 0.33, y, z + b * 0.28]}><boxGeometry args={[0.07, 1.3, 0.07]} /><meshStandardMaterial color="#2c2f33" roughness={0.45} metalness={0.4} /></mesh>
      ))}
      {/* the glass + bulb: bright warm emissive when on, pale grey glass when off */}
      <mesh position={[x, y - 0.05, z]}>
        <boxGeometry args={[0.6, 1.1, 0.5]} />
        <meshStandardMaterial color={on > 0.5 ? "#fff6dc" : "#c9c6bc"} emissive="#ffc46a" emissiveIntensity={3.2 * on} roughness={0.25} toneMapped={false} />
      </mesh>
      {on > 0.01 && <>
        <mesh material={gm} position={[x, y, z + 0.45]} scale={[5.5 * power, 5.5 * power, 1]} renderOrder={6}><planeGeometry args={[1, 1]} /></mesh>
        <mesh material={pm} position={[DOOR_X - 1, F + 0.05, FRONT_Z + 3]} rotation={[-Math.PI / 2, 0, 0]} scale={[13 * power, 9 * power, 1]} renderOrder={5}><planeGeometry args={[1, 1]} /></mesh>
        <pointLight color="#ffc77e" intensity={on * 55 * power} distance={26} decay={1.6} position={[x + 0.4, y - 0.4, z + 1.0]} />
      </>}
    </InLot>
  );
};

/** A light switch plate on a wall (lot-local p, facing +z for `out`, -z inside). `up` = the toggle position 0..1. */
export const Switch: React.FC<{ lot: LotId; inside?: boolean; up: number; big?: number }> = ({ lot, inside = true, up, big = 1 }) => {
  const p = inside ? SWITCH_IN_L : SWITCH_OUT_L, dir = inside ? -1 : 1;
  return (
    <InLot lot={lot}>
      <group position={p} rotation={[0, inside ? Math.PI : 0, 0]} scale={big}>
        <mesh position={[0, 0, 0.03]}><boxGeometry args={[0.55, 0.85, 0.06]} /><meshStandardMaterial color="#f4f1e8" roughness={0.35} /></mesh>
        <mesh position={[0, 0, 0.065]}><boxGeometry args={[0.32, 0.55, 0.02]} /><meshStandardMaterial color="#dcd7ca" roughness={0.4} /></mesh>
        <mesh position={[0, 0, 0.1]} rotation={[(up - 0.5) * -0.9, 0, 0]}>
          <boxGeometry args={[0.14, 0.32, 0.12]} /><meshStandardMaterial color="#fbfaf5" roughness={0.3} />
        </mesh>
      </group>
      {void dir}
    </InLot>
  );
};

/** A house's front door slab, swung open by `open` (0 shut .. 1 = 95 degrees inward). */
export const FrontDoor: React.FC<{ lot: LotId; open: number; color: string; lit?: boolean }> = ({ lot, open, color, lit = true }) => {
  const g = lit ? "glassLit0" : "glassDark";
  const b = useBuilt(`p09door|${color}|${g}`, (k: Kit) => doorSlab(k, DOOR_HW - 0.27, 0, color, g, 0));
  return (
    <InLot lot={lot}>
      <group position={HINGE_L} rotation={[0, open * 1.65, 0]}><Render b={b} /></group>
    </InLot>
  );
};
/** The door's free edge (knob side) in lot-local coordinates for an opening `open`, at height y (for reachArm). */
export const doorKnob = (open: number, inside: boolean): V3 => {
  const a = open * 1.65, r = 2 * DOOR_HW - 0.55 - 0.55;
  return [HINGE_L[0] + Math.cos(a) * r, F + 3.5, HINGE_L[2] - Math.sin(a) * r + (inside ? -0.33 : 0.33) * Math.cos(a)];
};

// ---------------------------------------------------------------- lights
/** Lights for a shot: "night" street (moonlit blue, no baked practical), "dusk", "inNight" (a dim room at night: cool
 *  ambient, warm lamp pools added by the set), "store" (a bright shop). */
// A darker night than the kit's: deep blue, a dim moon, a clean face fill, so the porch lamps and lit windows pop.
// (A new key in the shared LIGHTS table, added here at load; the kit file is untouched. envKind "room" keeps the probe off
// the SKY table, which has no "night09".)
(LIGHTS as any).night09 = {
  hemiSky: "#3e5596", hemiGround: "#141826", hemi: 0.3, key: "sun", keyColor: "#9db4ff", key_: 0.38, keyDir: [0.4, 0.75, 0.5],
  fill: 0.5, fillColor: "#d6e0ff", env: 0.1, envKind: "room", envHorizon: "#14204a", haze: { color: "#0c1532", near: 40, far: 170 },
};
export const Lights09: React.FC<{ time: "night" | "dusk" | "inNight" | "inWarm" | "store"; focus: V3; fill?: number }> = ({ time, focus, fill = 1 }) => {
  if (time === "night") return <><Sky time="night" /><BlockLights time={"night09" as any} focus={focus} practical={false} fill={fill} shadowSpan={40} /></>;
  if (time === "dusk") return <><Sky time="dusk" /><BlockLights time="dusk" focus={focus} fill={fill} /></>;
  if (time === "store") return <BlockLights time="interior" focus={focus} fill={fill} />;
  return <><Sky time="night" /><BlockLights time="interiorNight" focus={focus} fill={fill * (time === "inWarm" ? 1.1 : 0.9)} /></>;
};

// ---------------------------------------------------------------- cast
const PALE = "#e9e4dc";
/** The narrator (the channel's kid): yellow-and-black stripes, spiky blond hair. */
export const ME: Look = { skin: PALE, shirt: "#f2c81e", pants: "#1c1c20", shirtPattern: "stripes", hair: "spiky", hairColor: "#f3d35a" };
export const DAD: Look = { skin: PALE, shirt: "#3f7a46", pants: "#5a5e66", shirtPattern: "plaid", hair: "short", hairColor: "#5a3a22" };
/** Mr. Bell: old neighbour, brown cardigan, white hair, glasses (slippers via <Slippers/>). */
export const BELL: Look = { skin: "#f0d6bf", shirt: "#8a5a3a", pants: "#6b6a66", hair: "short", hairColor: "#f2f0ea", glasses: true };
/** Mr. Bell in his coat (long navy coat over the cardigan). */
export const BELL_COAT: Look = { ...BELL, shirt: "#2e3a52", tie: "#8a5a3a" };
export const KID = 0.82;
/** Height of the middle of the face above the feet for scale s. */
export const eyeY = (s: number) => 4.55 * s;

/** Things worn on a leg (slippers, a knee brace): placed with the same skeleton the renderer draws. */
export const LegWear: React.FC<{ c: CharState; kind: "slippers" | "brace"; side?: 1 | -1 }> = ({ c, kind, side }) => {
  const legs = rigBoxes(c).filter((p) => p.part === "legL" || p.part === "legR").filter((p) => side === undefined || p.part === (side === 1 ? "legL" : "legR"));
  return <>{legs.map((p, i) => {
    const m = new THREE.Matrix4().copy(p.m), pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
    m.decompose(pos, q, sc);
    return (
      <group key={i} position={pos} quaternion={q} scale={sc}>
        {kind === "slippers" ? <>
          <mesh position={[0, -1.82, 0.12]}><boxGeometry args={[1.12, 0.42, 1.34]} /><meshStandardMaterial color="#7a3b4a" roughness={0.95} /></mesh>
          <mesh position={[0, -1.6, 0.62]}><boxGeometry args={[1.0, 0.16, 0.3]} /><meshStandardMaterial color="#e9dfd2" roughness={1} /></mesh>
        </> : <>
          <mesh position={[0, -1.0, 0.02]}><boxGeometry args={[1.1, 0.75, 1.1]} /><meshStandardMaterial color="#2b3f66" roughness={0.6} /></mesh>
          <mesh position={[0, -1.0, 0.59]}><boxGeometry args={[0.5, 0.42, 0.06]} /><meshStandardMaterial color="#d8dde6" roughness={0.4} /></mesh>
          {[-0.28, 0.28].map((dy, j) => <mesh key={j} position={[0, -1.0 + dy, 0.02]}><boxGeometry args={[1.14, 0.1, 1.14]} /><meshStandardMaterial color="#e8e8e8" roughness={0.5} /></mesh>)}
        </>}
      </group>
    );
  })}</>;
};

// ---------------------------------------------------------------- street colliders (world)
import type { Box } from "../blocky/Collide";
const lbox = (lot: LotId, min: V3, max: V3, name?: string): Box => {
  const a = W(lot, min), b = W(lot, max);
  return { min: [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])], max: [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])], name };
};
/** A lot's porch, steps, columns, rails, front wall (solid unless `cut`), front fence; plus the sidewalk/curb strip. */
export const lotCS = (lot: LotId, cut = false): Box[] => {
  const cs: Box[] = [
    lbox(lot, [-10.3, 0, FRONT_Z], [10.3, F, PORCH_Z], "porch"),
    lbox(lot, [DOOR_X - 3.2, 0, 15.05], [DOOR_X + 3.2, 1.2, 15.85], "step0"),
    lbox(lot, [DOOR_X - 3.2, 0, 15.8], [DOOR_X + 3.2, 0.8, 16.6], "step1"),
    lbox(lot, [DOOR_X - 3.2, 0, 16.55], [DOOR_X + 3.2, 0.4, 17.35], "step2"),
    lbox(lot, [DOOR_X - 2.5, 0, 17.35], [DOOR_X + 2.5, 0.09, 30.3], "path"),
    ...[-9.8, -6.6, 0.6, 9.8].map((x, i) => lbox(lot, [x - 0.3, F, 14.25], [x + 0.3, 9.8, 14.85], `col${i}`)),
    lbox(lot, [-9.8, F, 14.35], [-6.6, 4.4, 14.75], "railL"), lbox(lot, [0.6, F, 14.35], [9.8, 4.4, 14.75], "railR"),
    lbox(lot, [-15.6, 0, 29.7], [DOOR_X - 2.78, 3.4, 30.3], "fenceL"), lbox(lot, [DOOR_X + 2.78, 0, 29.7], [10.7, 3.4, 30.3], "fenceR"),
    lbox(lot, [-40, 0, 30.5], [40, 0.12, 34.5], "sidewalk"), lbox(lot, [-40, 0, 37.5], [40, 0.2, 38.0], "curb"),
  ];
  if (!cut) cs.push(lbox(lot, [-10, 0, -9], [10, 18.2, FRONT_Z], "house"));
  return cs;
};

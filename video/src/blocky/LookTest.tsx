// LOOK test stills (role 3): a swatch wall of every texture, and a small street / room under each BlockLights time.
// Render with the LOOK-only entry (does not touch Root.tsx):
//   npx remotion still src/blocky/lookEntry.ts LookStreet out/look_day.png --props='{"time":"day"}'
import React from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam, SW, SH } from "../kit/Short";
import { BlockLights, Grade, Sky, TimeOfDay } from "./Look";
import { mat, rep, TexKind } from "./Textures";
import { BlockChar } from "./BlockRig";
import type { Look } from "./types";

const KINDS: TexKind[] = ["siding", "sidingGrey", "shingle", "brick", "grass", "concrete", "asphalt", "wood", "woodDark", "tile", "carpet", "wallpaper", "fabric", "plaster"];
const KID: Look = { skin: "#e9e4dc", shirt: "#f2c81f", pants: "#1d1d22", shirtPattern: "stripes", hair: "spiky", hairColor: "#f3d34a" };
const DAD: Look = { skin: "#e9e4dc", shirt: "#3f7a46", pants: "#8a8c90", shirtPattern: "plaid", hair: "short", hairColor: "#5a3a22" };

const Canvas: React.FC<{ cam: { pos: [number, number, number]; target: [number, number, number]; fov: number }; children: React.ReactNode }> = ({ cam, children }) => (
  <ThreeCanvas width={SW} height={SH} shadows gl={{ antialias: true, preserveDrawingBuffer: true } as any}
    camera={{ fov: cam.fov, position: cam.pos }} onCreated={({ gl }) => { gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
    <Cam c={cam} />
    {children}
  </ThreeCanvas>
);

export const LookSwatches: React.FC = () => (
  <AbsoluteFill style={{ background: "#222" }}>
    <Canvas cam={{ pos: [0, -1.2, 40], target: [0, -1.2, 0], fov: 52 }}>
      <BlockLights time="day" />
      {KINDS.map((k, i) => {
        const x = ((i % 3) - 1) * 6.2, y = (2.5 - Math.floor(i / 3)) * 6.2 - 1;
        return <mesh key={k} position={[x, y, 0]} receiveShadow><boxGeometry args={[6, 6, 0.3]} /><meshStandardMaterial {...mat(k, undefined, rep(k, 6, 6))} /></mesh>;
      })}
      <mesh position={[6.2, -15.6 - 1 + 6.2 * 0, 0]}><boxGeometry args={[6, 6, 0.3]} /><meshStandardMaterial {...mat("siding", "#9fb0c0", rep("siding", 6, 6))} /></mesh>
    </Canvas>
    <div style={{ position: "absolute", left: 20, top: 16, color: "#fff", font: "700 26px sans-serif" }}>{KINDS.join(" · ")} · siding tinted</div>
  </AbsoluteFill>
);

/** a tiny house: siding box, shingle gable, white trim, door, windows (glowing at night) */
const House: React.FC<{ x: number; z: number; grey?: boolean; lit: boolean }> = ({ x, z, grey, lit }) => {
  const W = 14, H = 11, D = 10;
  const roof = new THREE.Shape(); roof.moveTo(-W / 2 - 0.6, 0); roof.lineTo(0, 5); roof.lineTo(W / 2 + 0.6, 0); roof.lineTo(-W / 2 - 0.6, 0);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, H / 2, 0]} castShadow receiveShadow><boxGeometry args={[W, H, D]} /><meshStandardMaterial {...mat(grey ? "sidingGrey" : "siding", undefined, rep("siding", W, H))} /></mesh>
      <mesh position={[0, H, -D / 2 - 0.4]} castShadow><extrudeGeometry args={[roof, { depth: D + 0.8, bevelEnabled: false }]} /><meshStandardMaterial {...mat("siding", undefined, rep("siding", W, 5))} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 4 + 0.2), H + 2.6, 0]} rotation={[0, 0, -s * Math.atan2(5, W / 2 + 0.6)]} castShadow>
          <boxGeometry args={[Math.hypot(5, W / 2 + 0.6) + 0.4, 0.3, D + 1.2]} /><meshStandardMaterial {...mat("shingle", undefined, rep("shingle", 9, 11))} />
        </mesh>
      ))}
      <mesh position={[0, 3, D / 2 + 0.06]}><boxGeometry args={[2.6, 6, 0.1]} /><meshStandardMaterial {...mat("woodDark", "#7a2a22", [0.6, 1.5])} /></mesh>
      {[[-4.3, 3.6], [4.3, 3.6], [-4.3, 8.2], [4.3, 8.2], [0, 8.2]].map(([wx, wy], i) => (
        <group key={i} position={[wx, wy, D / 2 + 0.06]}>
          <mesh><boxGeometry args={[2.6, 3, 0.12]} /><meshStandardMaterial color="#f4f4f2" roughness={0.6} /></mesh>
          <mesh position={[0, 0, 0.07]}><planeGeometry args={[2.1, 2.5]} /><meshStandardMaterial color={lit ? "#ffd58a" : "#5b6878"} emissive={lit ? "#ffb85a" : "#000"} emissiveIntensity={lit ? 1.4 : 0} roughness={0.15} metalness={0.3} /></mesh>
          {[-1, 1].map((s) => <mesh key={s} position={[s * 1.75, 0, 0.05]}><boxGeometry args={[0.7, 3, 0.1]} /><meshStandardMaterial color="#2f3438" roughness={0.7} /></mesh>)}
        </group>
      ))}
    </group>
  );
};
const Fence: React.FC<{ z: number; x0: number; x1: number }> = ({ z, x0, x1 }) => {
  const n = Math.floor((x1 - x0) / 0.8);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[x0 + i * 0.8, 1.4, z]} castShadow><boxGeometry args={[0.45, 2.8, 0.12]} /><meshStandardMaterial {...mat("wood", "#f3f1ec", [0.15, 0.7])} /></mesh>
      ))}
      {[0.8, 2.1].map((y) => <mesh key={y} position={[(x0 + x1) / 2, y, z - 0.1]} castShadow><boxGeometry args={[x1 - x0, 0.25, 0.08]} /><meshStandardMaterial {...mat("wood", "#f3f1ec", [4, 0.1])} /></mesh>)}
    </group>
  );
};

export const LookStreet: React.FC<{ time: TimeOfDay }> = ({ time }) => {
  const night = time === "night";
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas cam={{ pos: [8, 6.5, 44], target: [-1, 6, 0], fov: 44 }}>
        <Sky time={time} />
        <BlockLights time={time} practicalAt={[0, 7, 9]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[200, 200]} /><meshStandardMaterial {...mat("grass", undefined, rep("grass", 200, 200))} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 18]} receiveShadow><planeGeometry args={[200, 5]} /><meshStandardMaterial {...mat("concrete", undefined, rep("concrete", 200, 5))} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 27]} receiveShadow><planeGeometry args={[200, 12]} /><meshStandardMaterial {...mat("asphalt", undefined, rep("asphalt", 200, 12))} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 11]} receiveShadow><planeGeometry args={[3, 10]} /><meshStandardMaterial {...mat("concrete", undefined, rep("concrete", 3, 10))} /></mesh>
        <House x={0} z={0} lit={night} />
        <House x={-20} z={-3} grey lit={night} />
        <House x={20} z={-2} lit={night} />
        <House x={-6} z={-60} grey lit={night} />
        <House x={18} z={-60} lit={night} />
        <Fence z={15.6} x0={-16} x1={-1.8} />
        <Fence z={15.6} x0={1.8} x1={16} />
        <BlockChar look={KID} position={[-3.5, 0, 20]} yaw={0.35} expr="smile" />
        <BlockChar look={DAD} position={[2.8, 0, 17.5]} yaw={-0.3} expr="smile" scale={1.15} />
      </Canvas>
      <Grade time={time} />
      <div style={{ position: "absolute", left: 20, top: 16, color: "#fff", font: "700 30px sans-serif", textShadow: "0 0 6px #000" }}>{time}</div>
    </AbsoluteFill>
  );
};

export const LookRoom: React.FC<{ time: TimeOfDay }> = ({ time }) => {
  const bath = time === "bathroom", night = time === "interiorNight";
  const W = 16, H = 10, D = 14;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Canvas cam={{ pos: [3, 6, 12.5], target: [-1, 4.2, 0], fov: 55 }}>
        <Sky time={time} />
        <BlockLights time={time} focus={[0, 0, 2]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[W, D + 6]} /><meshStandardMaterial {...mat(bath ? "tile" : "wood", undefined, rep(bath ? "tile" : "wood", W, D + 6))} /></mesh>
        <mesh position={[0, H / 2, -D / 2]} receiveShadow><planeGeometry args={[W, H]} /><meshStandardMaterial {...mat(bath ? "tile" : "wallpaper", bath ? "#dfe9ee" : undefined, rep(bath ? "tile" : "wallpaper", W, H))} /></mesh>
        <mesh position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[D + 6, H]} /><meshStandardMaterial {...mat("plaster", bath ? "#eef2f4" : "#efe6d2", rep("plaster", D + 6, H))} /></mesh>
        <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[W, D + 6]} /><meshStandardMaterial {...mat("plaster", undefined, rep("plaster", W, D + 6))} /></mesh>
        {/* window in the back wall showing the sky */}
        <mesh position={[4, 5.5, -D / 2 + 0.05]}><planeGeometry args={[4.4, 4.4]} /><meshStandardMaterial color="#ffffff" roughness={0.6} /></mesh>
        <mesh position={[4, 5.5, -D / 2 + 0.1]}><planeGeometry args={[3.8, 3.8]} /><meshBasicMaterial color={night ? "#0c1a44" : "#bcd8f2"} /></mesh>
        {/* a counter or table */}
        <mesh position={[-3.5, 1.8, -4]} castShadow receiveShadow><boxGeometry args={[6, 3.6, 3]} /><meshStandardMaterial {...mat(bath ? "plaster" : "woodDark", bath ? "#f4f4f4" : undefined, [1.5, 1])} /></mesh>
        <mesh position={[-3.5, 3.65, -4]} castShadow receiveShadow><boxGeometry args={[6.3, 0.2, 3.2]} /><meshStandardMaterial {...mat(bath ? "concrete" : "wood", bath ? "#e8e8e8" : undefined, [1.5, 1])} /></mesh>
        {!bath && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0.02, 2]} receiveShadow><planeGeometry args={[7, 5]} /><meshStandardMaterial {...mat("carpet", "#8a4a44", rep("carpet", 7, 5))} /></mesh>}
        <BlockChar look={KID} position={[-0.5, 0, 3]} yaw={0.25} expr="smile" />
        <BlockChar look={DAD} position={[3.5, 0, 0.5]} yaw={-0.3} expr="smile" scale={1.15} />
      </Canvas>
      <Grade time={time} />
      <div style={{ position: "absolute", left: 20, top: 16, color: "#fff", font: "700 30px sans-serif", textShadow: "0 0 6px #000" }}>{time}</div>
    </AbsoluteFill>
  );
};

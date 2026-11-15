// Review stills of the shared school sets (SchoolHall.tsx). Not part of the Short.
import React from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam } from "../kit/Short";
import { BlockLights } from "../blocky/Look";
import { Corridor, Gym, CORRIDOR_SPOTS, OFFICE_Z } from "../blocky/SchoolHall";
import { BlockChar } from "../blocky/BlockRig";
import { TOWNSFOLK } from "../blocky/MotionSheet";
type V3 = [number, number, number];
const VIEWS: { scene: () => React.ReactNode; pos: V3; target: V3; fov: number }[] = [
  { scene: () => <><BlockLights time="interior" focus={[0, 0, 10]} /><Corridor /><BlockChar look={TOWNSFOLK[0]} scale={0.82} position={[0, 0, 10]} /></>, pos: [0, 6, 30], target: [0, 4, 0], fov: 50 },
  { scene: () => <><BlockLights time="interior" focus={[4, 0, OFFICE_Z]} /><Corridor officeOpen={0.5} /><BlockChar look={TOWNSFOLK[1]} scale={0.82} position={CORRIDOR_SPOTS.officeFront} yaw={Math.PI / 2} /></>, pos: [-4, 5.5, OFFICE_Z + 14], target: [6, 4, OFFICE_Z], fov: 45 },
  { scene: () => <><BlockLights time="interior" focus={[0, 0, 0]} /><Gym doorsOpen={0.6} /><BlockChar look={TOWNSFOLK[2]} position={[0, 0, 5]} /></>, pos: [10, 12, 22], target: [0, 3, -10], fov: 55 },
  { scene: () => <><BlockLights time="interior" focus={[0, 0, 28]} /><Gym doorsOpen={1} /></>, pos: [0, 6, 42], target: [0, 4, 10], fov: 50 },
];
export const SetPreview: React.FC<{ v: number }> = ({ v }) => {
  const V = VIEWS[v];
  return <AbsoluteFill style={{ background: "#222" }}>
    <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, preserveDrawingBuffer: true } as any} camera={{ fov: V.fov, position: V.pos }} onCreated={({ gl }) => { gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
      <Cam c={{ pos: V.pos, target: V.target, fov: V.fov }} />
      {V.scene()}
    </ThreeCanvas>
  </AbsoluteFill>;
};

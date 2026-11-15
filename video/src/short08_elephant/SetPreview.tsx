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
import { Sky } from "../blocky/Look";
import { SchoolYard } from "../short06_blocky/Town";
import { PetTable, Leash, HeldCert, HeldBill, StepStool, RidesSign, TicketTable, PeanutBag, PetBox, HeldTicket } from "./Props08";
import { BRO, HAYES, KIDS, ME, S, YARD_TABLE, BRO_AT_TABLE, CUSTOMER, STOOL_AT, SIGN_AT, TTABLE_AT, HAYES_GYM, ride, RIDE_Y } from "./common";
type V3 = [number, number, number];
const VIEWS: { scene: () => React.ReactNode; pos: V3; target: V3; fov: number }[] = [
  { scene: () => <><BlockLights time="interior" focus={[0, 0, 10]} /><Corridor /><BlockChar look={TOWNSFOLK[0]} scale={0.82} position={[0, 0, 10]} /></>, pos: [0, 6, 30], target: [0, 4, 0], fov: 50 },
  { scene: () => <><BlockLights time="interior" focus={[4, 0, OFFICE_Z]} /><Corridor officeOpen={0.5} /><BlockChar look={TOWNSFOLK[1]} scale={0.82} position={CORRIDOR_SPOTS.officeFront} yaw={Math.PI / 2} /></>, pos: [-4, 5.5, OFFICE_Z + 14], target: [6, 4, OFFICE_Z], fov: 45 },
  { scene: () => <><BlockLights time="interior" focus={[0, 0, 0]} /><Gym doorsOpen={0.6} /><BlockChar look={TOWNSFOLK[2]} position={[0, 0, 5]} /></>, pos: [10, 12, 22], target: [0, 3, -10], fov: 55 },
  { scene: () => <><BlockLights time="interior" focus={[0, 0, 28]} /><Gym doorsOpen={1} /></>, pos: [0, 6, 42], target: [0, 4, 10], fov: 50 },
  { scene: () => <><Sky time="day" /><BlockLights time="day" focus={YARD_TABLE} /><SchoolYard /><group position={YARD_TABLE}><PetTable /></group>
    <BlockChar look={BRO} scale={S.bro} position={BRO_AT_TABLE} pose={{ armR: 0.9 }} hold={{ R: <Leash /> }} />
    <BlockChar look={KIDS[1]} scale={S.kid} position={CUSTOMER} yaw={Math.PI} pose={{ armR: 1.2, armL: 0.6 }} hold={{ R: <HeldBill v={5} />, L: <HeldCert /> }} />
    <BlockChar look={KIDS[2]} scale={S.kid} position={[CUSTOMER[0] - 5, 0, CUSTOMER[2] + 2]} yaw={2.5} pose={{ armR: 0.4 }} hold={{ R: <Leash reach={2.2} drop={1.6} /> }} />
    <PetBox p={[CUSTOMER[0] - 5, 0, CUSTOMER[2] + 5]} /></>, pos: [YARD_TABLE[0] + 9, 6, YARD_TABLE[2] + 16], target: [YARD_TABLE[0] - 1, 2.5, YARD_TABLE[2] + 1], fov: 45 },
  { scene: () => { const r = ride(0.3, 0, RIDE_Y); return <><BlockLights time="interior" focus={STOOL_AT} /><Gym doorsOpen={1} /><StepStool p={STOOL_AT} /><RidesSign p={SIGN_AT} yaw={0.4} />
    <TicketTable p={TTABLE_AT} /><BlockChar look={HAYES} position={HAYES_GYM} pose={{ armR: 1.3 }} hold={{ R: <HeldTicket /> }} />
    <BlockChar look={BRO} scale={S.bro} position={[STOOL_AT[0], r.lift, STOOL_AT[2]]} pose={r.pose} expr="happy" />
    <PeanutBag p={[-4, 0, 6]} /></>; }, pos: [6, 7, 18], target: [-1, 3.5, -4], fov: 50 },
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

// HOUSE review stills (not part of the Short): one room per frame, BlockChars standing in it. Entry: houseEntry.ts.
import React from "react";
import { AbsoluteFill, Composition, registerRoot, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam } from "../kit/Short";
import type { CamS, V3 } from "../kit/core";
import { BlockChar, POSES } from "../blocky/BlockRig";
import { BlockLights } from "../blocky/Look";
import { DAD, MOM, ME, ME_PJ, BRO, SCALE } from "./cast";
import { Bathroom, BED, DiningRoom, DOORWAY, HALL_MIRRORS, HALL_SPOTS, Hallway, Kitchen, KITCHEN_SINK, MIRROR, Razor, seatAt, SEATS, SEAT_YAW, SINK_FRONT, Bedroom, TABLE, SHOE_SPOT } from "./House";

const c = (pos: V3, target: V3, fov: number): CamS => ({ pos, target, fov });
const refl = (p: V3): V3 => [p[0], p[1], -p[2]];
const at = (x: number, d: number): V3 => [x, 0, d];

const STILLS: { cam: CamS; scene: React.ReactNode }[] = [
  // 0 hook: ME at the mirror, reflection blinking
  { cam: c([0.42, 1.24, 1.0], [0, 1.18, 0.05], 50), scene: <>
    <BlockLights time="bathroom" focus={[0, 0, 1]} />
    <Bathroom towel={1} mirrorWorld={<BlockChar look={ME} scale={SCALE.kid} position={refl(at(0, 0.55))} yaw={0} blink={0.8} expr="smile" />} />
    <BlockChar look={ME} scale={SCALE.kid} position={at(0, 0.55)} yaw={Math.PI} expr="worried" />
  </> },
  // 1 family at the mirror, wide, reflection missing the family
  { cam: c([1.3, 1.6, 4.2], [0, 1.3, 0.4], 50), scene: <>
    <BlockLights time="bathroom" focus={[0, 0, 1]} />
    <Bathroom towel={1} mirrorWorld={<BlockChar look={ME} scale={SCALE.kid} position={refl(at(-0.32, 0.75))} yaw={0} />} />
    {([[DAD, -0.95, SCALE.adult], [ME, -0.32, SCALE.kid], [BRO, 0.22, SCALE.bro], [MOM, 0.8, SCALE.adult]] as const).map(([l, x, s], i) =>
      <BlockChar key={i} look={l} scale={s} position={at(x, 0.8)} yaw={Math.PI} />)}
  </> },
  // 2 towel half off, night
  { cam: c([1.0, 1.3, 2.6], [0, 1.4, 0], 50), scene: <>
    <BlockLights time="interiorNight" focus={[0, 0, 1]} />
    <Bathroom night towel={0.35} mirrorWorld={null} />
    <BlockChar look={ME_PJ} scale={SCALE.kid} position={at(0.2, 0.6)} yaw={Math.PI} pose={POSES.pullTowel} expr="scared" />
  </> },
  // 3 reverse: the doorway full
  { cam: c([-0.6, 1.25, 0.9], [DOORWAY[0], 1.1, DOORWAY[2]], 50), scene: <>
    <BlockLights time="interiorNight" focus={[0, 0, 2]} />
    <Bathroom night towel={1} mirrorWorld={null} />
    {[[DAD, -0.42, SCALE.adult], [MOM, 0.42, SCALE.adult], [BRO, 0, SCALE.bro]].map(([l, x, s], i) =>
      <BlockChar key={i} look={l as any} scale={s as number} position={[DOORWAY[0] + (x as number), 0, DOORWAY[2] - (i === 2 ? 0.35 : 0)]} yaw={Math.PI} expr="stare" />)}
  </> },
  // 4 kitchen
  { cam: c([KITCHEN_SINK[0] + 2.2, 1.5, KITCHEN_SINK[2] + 3.2], [KITCHEN_SINK[0] - 0.1, 1.15, KITCHEN_SINK[2]], 48), scene: <>
    <BlockLights time="morning" focus={KITCHEN_SINK} />
    <Kitchen />
    <BlockChar look={DAD} scale={SCALE.adult} position={KITCHEN_SINK} yaw={Math.PI - 0.35} pose={POSES.shave} hold={{ R: <Razor /> }} />
  </> },
  // 5 dining
  { cam: c([2.2, 1.7, 3.4], [0, 0.8, 0], 50), scene: <>
    <BlockLights time="interior" focus={TABLE} />
    <DiningRoom />
    {([DAD, MOM, BRO, ME] as const).map((l, i) => { const s = [SCALE.adult, SCALE.adult, SCALE.bro, SCALE.kid][i];
      return <BlockChar key={i} look={l} scale={s} position={seatAt(i, s)} yaw={SEAT_YAW[i]} pose={POSES.sit} />; })}
  </> },
  // 6 hallway
  { cam: c([HALL_SPOTS[1][0] + 1.6, 1.5, 2.7], [HALL_MIRRORS[1][0] - 0.6, 1.3, 0], 48), scene: <>
    <BlockLights time="interior" focus={HALL_SPOTS[1]} />
    <Hallway towels={[1, 0.6, 0]} />
    <BlockChar look={MOM} scale={SCALE.adult} position={HALL_SPOTS[1]} yaw={Math.PI} pose={POSES.pullTowel} />
  </> },
  // 7 bedroom
  { cam: c([BED[0] + 2.6, 1.55, BED[2] + 3.4], [BED[0] - 0.2, 0.5, BED[2]], 50), scene: <>
    <BlockLights time="interior" focus={BED} />
    <Bedroom />
  </> },
  // 8 shoes close
  { cam: c([SHOE_SPOT[0] - 0.9, 0.35, SHOE_SPOT[2] + 0.9], [SHOE_SPOT[0], 0.08, SHOE_SPOT[2]], 40), scene: <>
    <BlockLights time="interior" focus={BED} />
    <Bedroom />
  </> },
];

const Still: React.FC = () => {
  const s = STILLS[Math.min(useCurrentFrame(), STILLS.length - 1)];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, preserveDrawingBuffer: true } as any}
        camera={{ fov: s.cam.fov, position: s.cam.pos }} onCreated={({ gl }) => { gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
        <Cam c={s.cam} />
        {s.scene}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
const Root: React.FC = () => <Composition id="HouseStills" component={Still} width={1080} height={1920} fps={30} durationInFrames={STILLS.length} />;
registerRoot(Root);
void [MIRROR, SINK_FRONT, SEATS, SHOE_SPOT];

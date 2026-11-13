// Look test for the Short 3 cast (stills): frame 0-2 Percy front / three-quarter / side with the pocket bar,
// frame 3 coworkers and the egg face, frame 4 family + Gizmo, frame 5 props (tube, oven, piano, molecule, microwave).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Cam, useFonts } from "../kit/Short";
import { orbit } from "../kit/core";
import { EXPR } from "../bean/Face";
import { POSES } from "./Bean";
import { BigOven, Egg, Gizmo, LOOKS, Magnetron, Microwave, Molecule, Person, Piano, PocketBar, Popped, YolkFace } from "./cast";

export const Short03Test: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const pc = (a: number) => ({ pos: orbit([0, 0.7, 0], a, 2.0, 1.0), target: [0, 0.7, 0] as [number, number, number], fov: 38 });
  const cam = f < 3 ? pc([0, 35, 85][f]) : f === 5 ? { pos: [0, 1.4, 4.4] as [number, number, number], target: [0, 0.8, 0] as [number, number, number], fov: 44 } : { pos: [0, 1.1, 4.0] as [number, number, number], target: [0, 0.75, 0] as [number, number, number], fov: 40 };
  return (
    <AbsoluteFill style={{ background: "#d8e4ec" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <Cam c={cam} />
        <hemisphereLight args={["#dfeeff", "#8a6a4a", 1.05]} />
        <directionalLight position={[3, 6, 5]} intensity={2.0} castShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[20, 20]} /><meshStandardMaterial color="#c8b898" /></mesh>
        {f < 3 && <Person w={{ look: LOOKS.percy, pos: [0, 0, 0], pose: POSES.stand, expr: EXPR.happy, extra: <PocketBar melt={f === 2 ? 0.8 : 0.3} steam={0.5} t={1} /> }} />}
        {f === 3 && <>
          <Person w={{ look: LOOKS.egg, pos: [-0.9, 0, 0], expr: EXPR.sad, headExtra: <YolkFace drip={1} /> }} />
          <Person w={{ look: LOOKS.runner, pos: [-0.3, 0, 0.1], expr: EXPR.happy }} />
          <Person w={{ look: LOOKS.tech, pos: [0.3, 0, 0.1], expr: EXPR.smug }} />
          <Person w={{ look: LOOKS.boss, pos: [0.9, 0, 0], expr: EXPR.worried }} />
        </>}
        {f === 4 && <>
          <Person w={{ look: LOOKS.dad, pos: [-0.9, 0, 0], expr: EXPR.happy }} />
          <Person w={{ look: LOOKS.mom, pos: [-0.3, 0, 0.1], expr: EXPR.happy }} />
          <Person w={{ look: LOOKS.kid50, pos: [0.25, 0, 0.1], scale: 0.8, expr: EXPR.silly }} />
          <Gizmo pos={[0.85, 0, 0]} expr={EXPR.happy} pose={POSES.wave} />
          <Person w={{ look: LOOKS.kidNow, pos: [-0.5, 0, -0.9], expr: EXPR.laugh }} />
          <Person w={{ look: LOOKS.worker1, pos: [0.5, 0, -0.9], expr: EXPR.neutral }} />
        </>}
        {f === 5 && <>
          <Magnetron p={[-1.0, 0.0, 0.5]} t={1} s={1.5} />
          <BigOven p={[0.9, 0, -0.6]} glow={0.6} tag={1} />
          <Piano p={[-0.4, 0, -1.2]} s={0.8} />
          <Molecule p={[-0.6, 1.6, 0.4]} s={0.8} />
          <Microwave p={[0.2, 0, 0.8]} on={1} />
          <Egg p={[0.9, 0, 1.0]} t={0} s={2} />
          <Popped p={[0.6, 0.05, 1.3]} s={3} />
        </>}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

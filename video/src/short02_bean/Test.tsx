// Look test for the Short 2 cast (stills only): frame 0-2 the rat front / three-quarter / side, frame 3 the tailless rat
// and a baby, frame 4 the officials and inspector, frame 5 the townspeople and hunters, frame 6 the economist and lady.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Cam, useFonts } from "../kit/Short";
import { orbit } from "../kit/core";
import { EXPR } from "../bean/Face";
import { POSES } from "./Bean";
import { Clipboard, Coin, HeldTail, LOOKS, MiniFolk, Net, Person, Rat, Scissors, TailHeap } from "./cast";

export const Short02Test: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const ratCam = (a: number) => ({ pos: orbit([0, 0.4, 0], a, 2.0, 0.75), target: [0, 0.4, 0] as [number, number, number], fov: 34 });
  const cam = f < 3 ? ratCam([0, 40, 90][f]) : f === 3 ? ratCam(150) : { pos: [0, 1.1, 4.2] as [number, number, number], target: [0, 0.75, 0] as [number, number, number], fov: 40 };
  return (
    <AbsoluteFill style={{ background: "#d8e4ec" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <Cam c={cam} />
        <hemisphereLight args={["#dfeeff", "#8a6a4a", 1.05]} />
        <directionalLight position={[3, 6, 5]} intensity={2.0} castShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[20, 20]} /><meshStandardMaterial color="#c8b898" /></mesh>
        {f < 3 && <><Rat s={{ expr: EXPR.happy, arms: "wave", t: 0.3 }} position={[-0.3, 0, 0]} /><Rat s={{ expr: EXPR.shock, arms: "up", t: 1.1, fur: "#a08c7c" }} position={[0.35, 0, -0.2]} scale={0.9} /></>}
        {f === 3 && <><Rat s={{ expr: EXPR.smug, tail: false, arms: "shrug" }} position={[-0.25, 0, 0]} /><Rat s={{ expr: EXPR.happy, t: 2 }} position={[0.35, 0, 0.2]} scale={0.55} /><TailHeap n={20} w={0.5} d={0.4} h={0.1} p={[0.2, 0, 0.6]} /></>}
        {f === 4 && <>
          <Person w={{ look: LOOKS.chief, pos: [-0.9, 0, 0], pose: POSES.cheer, expr: EXPR.happy }} />
          <Person w={{ look: LOOKS.clerk, pos: [-0.3, 0, 0.1], pose: { ...POSES.stand, armR: [25, 95, 30] }, hold: <HeldTail />, expr: EXPR.neutral }} />
          <Person w={{ look: LOOKS.deputy, pos: [0.3, 0, 0.1], pose: { ...POSES.stand, armR: [25, 95, 30] }, hold: <Coin r={[Math.PI / 2, 0, 0]} s={1.4} p={[0, -0.05, 0.03]} />, expr: EXPR.smug }} />
          <Person w={{ look: LOOKS.inspector, pos: [0.9, 0, 0], pose: { ...POSES.stand, armR: [12, 40, 60] }, hold: <Clipboard />, expr: EXPR.shock }} />
        </>}
        {f === 5 && <>
          <Person w={{ look: LOOKS.hunter1, pos: [-1.0, 0, 0], pose: { ...POSES.stand, armR: [25, 60, 40] }, hold: <Net />, expr: EXPR.happy }} />
          <Person w={{ look: LOOKS.hunter2, pos: [-0.35, 0, 0.1], pose: { ...POSES.stand, armR: [25, 95, 30] }, hold: <Scissors open={0.8} />, expr: EXPR.smug }} />
          <Person w={{ look: LOOKS.woman1, pos: [0.3, 0, 0.1], expr: EXPR.worried }} />
          <Person w={{ look: LOOKS.woman2, pos: [0.95, 0, 0], expr: EXPR.suspicious }} />
          <Person w={{ look: LOOKS.hunter3, pos: [-0.6, 0, -1.0], expr: EXPR.laugh }} />
          <Person w={{ look: LOOKS.farmer, pos: [0.6, 0, -1.0], expr: EXPR.smug }} />
          <MiniFolk pos={[0, 0, -1.6]} body="#5a4632" skin={4} hat="conical" />
        </>}
        {f === 6 && <>
          <Person w={{ look: LOOKS.economist, pos: [-0.5, 0, 0], pose: POSES.point, expr: EXPR.smug }} />
          <Person w={{ look: LOOKS.lady, pos: [0.5, 0, 0], pose: POSES.headHands, expr: EXPR.shock }} />
          <Person w={{ look: LOOKS.kid, pos: [0, 0, 0.6], scale: 0.8, expr: EXPR.happy }} />
        </>}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// ---- set look test: frame k shows set k from a wide camera ----
import { Bathroom, Classroom, Farm, Office, Sewer, Stage, Street } from "./sets";
export const Short02SetTest: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const C = (pos: [number, number, number], target: [number, number, number], fov = 55) => ({ pos, target, fov });
  const cams = [
    C([0.5, 1.6, 5.5], [0, 1.6, -6]), C([0, 1.4, 4], [0, 0.6, -4], 60), C([0.2, 1.3, 2.8], [0, 0.8, -1.6]), C([0, 1.6, 3.4], [0, 1.1, -1.2]),
    C([1.5, 1.6, 12], [0, 1.2, -1]), C([0, 1.5, 1.2], [0, 1, -1.5], 60), C([0, 2.4, 6], [0, 0.6, 0]), C([0, 1.5, 3.2], [0, 1.4, -1.9]), C([0, 1.6, 5.5], [0, 1.6, -6]),
  ];
  const sets = [<Street />, <Sewer />, <Bathroom lid={0.7} />, <Office />, <Farm doors={0.8} />, <Farm doors={1} />, <Stage />, <Classroom graph={1} lines={["PERVERSE", "INCENTIVE"]} />, <Street g="night" lanterns />];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <Cam c={cams[f]} />
        {sets[f]}
        {f === 6 && [0, 1, 2].map((i) => <Rat key={i} position={[i - 1, 0, 0]} s={{ expr: EXPR.happy, tail: i !== 1 }} />)}
        {f === 8 && [0, 1, 2].map((i) => <Rat key={i} position={[i - 1, 0, 0]} s={{ expr: EXPR.shock, tail: false }} />)}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

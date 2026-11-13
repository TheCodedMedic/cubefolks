// Look test for the Short 4 cast (stills): frame 0-2 Wilson front / three-quarter / side with the 1950s doctors,
// frame 3 the patient, the 77-year-old man (both outfits), the nurse and surgeons, frame 4 the modern folk and Gizmo.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Cam, useFonts } from "../kit/Short";
import { orbit, V3 } from "../kit/core";
import { EXPR } from "../bean/Face";
import { Bean3D as GBean } from "../bean/Bean3D";
import { GIZMO } from "../gizmo/GizmoArt";
import { Heart, LOOKS, Person, SurgCap } from "./cast";

export const Short04Test: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const cam = f < 3 ? { pos: orbit([0, 0.7, 0], [0, 40, 90][f], 3.2, 1.1), target: [0, 0.6, 0] as V3, fov: 42 } : { pos: [0, 1.1, 4.0] as V3, target: [0, 0.65, 0] as V3, fov: 42 };
  return (
    <AbsoluteFill style={{ background: "#d8e4ec" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <Cam c={cam} />
        <hemisphereLight args={["#dfeeff", "#8a6a4a", 1.05]} />
        <directionalLight position={[3, 6, 5]} intensity={2.0} castShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[20, 20]} /><meshStandardMaterial color="#c8b898" /></mesh>
        {f < 3 && <>
          <Person w={{ look: LOOKS.wilson, pos: [0, 0, 0.3], expr: EXPR.happy }} />
          <Person w={{ look: LOOKS.doc1, pos: [-0.75, 0, -0.3], expr: EXPR.worried }} />
          <Person w={{ look: LOOKS.doc2, pos: [0.75, 0, -0.3], expr: EXPR.shock }} />
        </>}
        {f === 3 && <>
          <Person w={{ look: LOOKS.patient, pos: [-0.9, 0, 0.2], expr: EXPR.worried }} />
          <Person w={{ look: LOOKS.oldman, pos: [-0.3, 0, 0.3], expr: EXPR.happy }} />
          <Person w={{ look: LOOKS.oldmanOut, pos: [0.3, 0, 0.3], expr: EXPR.laugh }} />
          <Person w={{ look: LOOKS.nurse, pos: [0.9, 0, 0.2], expr: EXPR.smug }} />
          <Person w={{ look: LOOKS.surg1, pos: [-0.45, 0, -0.6], expr: EXPR.neutral, headExtra: <SurgCap /> }} />
          <Person w={{ look: LOOKS.surg2, pos: [0.45, 0, -0.6], expr: EXPR.happy, headExtra: <SurgCap /> }} />
        </>}
        {f === 4 && <>
          <Person w={{ look: LOOKS.teen, pos: [-0.8, 0, 0.2], expr: EXPR.happy }} />
          <Person w={{ look: LOOKS.mum, pos: [-0.25, 0, 0.3], expr: EXPR.happy }} />
          <Person w={{ look: LOOKS.gran, pos: [0.3, 0, 0.3], expr: EXPR.laugh }} />
          <GBean look={GIZMO} position={[0.85, 0, 0.2]} expr={EXPR.shock} />
          <Heart p={[0, 1.6, -0.5]} s={0.6} face={EXPR.happy} />
        </>}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

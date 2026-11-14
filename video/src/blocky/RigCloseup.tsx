// Rig close-up for checking how arms and hands join the body: front, three-quarter, side, back; rest / walk / raised.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Cam } from "../kit/Short";
import { BlockChar } from "./BlockRig";
import { BlockLights } from "./Look";
import type { Look } from "./types";

const A: Look = { skin: "#ece6dc", shirt: "#1d2230", pants: "#1d2230", hair: "short", hairColor: "#2a1c14", tie: "#b02a2a" };
const B: Look = { skin: "#7e5236", shirt: "#e07a2e", pants: "#3a4a6a", hair: "ponytail", hairColor: "#3a2414" };
export const RigCloseup: React.FC<{ walkPhase?: number }> = ({ walkPhase }) => {
  const f = useCurrentFrame();
  const ph = walkPhase ?? f * 0.2;
  const row = (y: number, look: Look, mode: number) => [0, 0.6, 1.57, 2.5].map((yaw, i) => (
    <BlockChar key={i} look={look} position={[-10.5 + i * 7, y, 0]} yaw={yaw} still seed={1}
      walk={mode === 1 ? { phase: ph, amount: 0.9 } : undefined}
      pose={mode === 2 ? { armR: 2.75, armROut: 0.45, armL: 1.5, armLOut: 0 } : mode === 3 ? { armL: 1.2, armLOut: 0.9, armR: 0.6, armROut: 0.5 } : {}} />
  ));
  return (
    <AbsoluteFill style={{ background: "#9fb8cc" }}>
      <ThreeCanvas width={1080} height={1440}>
        <Cam c={{ pos: [0, 11, 46], target: [0, 10.5, 0], fov: 44 }} />
        <BlockLights time="day" focus={[0, 0, 0]} />
        {row(21, A, 0)}{row(14, B, 1)}{row(7, A, 2)}{row(0, B, 3)}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

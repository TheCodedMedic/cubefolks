// Look test for the Short 1 cast and sets (stills only).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Cam, useFonts } from "../kit/Short";
import { orbit } from "../kit/core";
import { Courtyard, Room, Study, ROOM, STUDY } from "./sets";
import { Hans, LOOKS, OstenExtras, Person, MiniBean, Clipboard, Notebook } from "./cast";
import { EXPR } from "../bean/Face";
import { POSES } from "./Bean";

const FaceTest: React.FC<{ f: number }> = ({ f }) => {
  const ex = [EXPR.neutral, EXPR.happy, EXPR.smug, EXPR.shock, EXPR.worried, EXPR.laugh, EXPR.suspicious][f];
  const m = ["smile", "grin", "smirk", "o", "wobbly", "laugh", "flat"][f] as any;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <Cam c={{ pos: [0.9, 1.6, 2.4], target: [0, 1.3, 0.5], fov: 34 }} />
        <Courtyard board={["√16 = ?"]} g={f === 6 ? "violet" : "day"}>
          <Hans yaw={0.25} s={{ expr: ex, mouth: m, blinders: f === 4, head: [0, 0, 0] }} />
          {f === 6 && [-0.4, 0, 0.4].map((a, i) => <MiniBean key={i} pos={[Math.sin(a) * 2 + 0.6, 0, Math.cos(a) * 2 - 1.2]} yaw={a + Math.PI} body="#4a5f8a" skin={i * 3} hair="#2a1d16" expr={EXPR.worried} />)}
        </Courtyard>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const Short01Test: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  if (f >= 7) return <FaceTest f={f - 7} />;
  const views = [
    { pos: [0.6, 1.4, 4.4], target: [0.3, 1.0, 0], fov: 40 },
    { pos: [1.3, 1.5, 2.6], target: [0.9, 1.4, 0], fov: 30 },
    { pos: [0.3, 2.4, 6.2], target: [0.3, 1.0, 0], fov: 50 },
    { pos: [0.3, 1.2, -1.5], target: [0.3, 0.8, 3.0], fov: 50 },
    { pos: [40, 1.5, 2.6], target: [40, 0.9, -0.6], fov: 42 },
    { pos: [80.3, 1.4, 1.6], target: [80, 1.1, -1], fov: 45 },
    { pos: [0.4, 0.4, 1.4], target: [0.4, 0.2, 0], fov: 35 },
  ] as any[];
  const v = views[f % views.length];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <Cam c={v} />
        <Courtyard board={["2 + 3 = ?"]} g={f === 2 ? "violet" : "day"}>
          <Hans yaw={Math.PI / 2} s={{ expr: EXPR.smug, mouth: "smirk", head: [0, -40, 0], blinders: f === 1, neck: [0, 0], tap: f === 6 ? 0.8 : 0 }} />
          <Person w={{ look: LOOKS.osten, pos: [1.15, 0, 0.6], yaw: -0.2, expr: EXPR.happy, headExtra: <OstenExtras />, pose: POSES.point }} />
          <Person w={{ look: LOOKS.oskar, pos: [-1.2, 0, 1.8], yaw: 0.6, expr: EXPR.suspicious, hold: <Notebook /> }} />
          <Person w={{ look: LOOKS.sci1, pos: [2.0, 0, 1.6], yaw: -1.5, expr: EXPR.suspicious, hold: <Clipboard /> }} />
          {[-0.7, -0.35, 0, 0.35, 0.7].map((a, i) => <MiniBean key={i} pos={[Math.sin(a) * 3 + 0.3, 0, Math.cos(a) * 3]} yaw={a + Math.PI} body={["#4a5f8a", "#7a3e34", "#3f6b52", "#c8a040", "#6a4a7a"][i]} skin={(i * 3) % 8} hair="#2a1d16" expr={EXPR.happy} />)}
        </Courtyard>
        <Room stamp><Person w={{ look: LOOKS.sci2, pos: [0, 0, -1.3], expr: EXPR.shock }} /></Room>
        <Study><Person w={{ look: LOOKS.oskar, pos: [0, 0, 0], yaw: 0.3, expr: EXPR.suspicious, hold: <Notebook /> }} /></Study>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

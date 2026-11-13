// Cubefolks: the Remotion root. Each Short registers its compositions here (1080x1920, 30 fps).
import React from "react";
import { Composition } from "remotion";
import { Smoke } from "./Smoke";
import { BlockTest, BlockTestClean, BLOCK_FRAMES } from "./blocky/BlockTest";
import { Short06Blocky, Short06BlockyClean, Short06BlockyAt, SHORT06_FRAMES } from "./short06_blocky/Short06";
import { BlockFaceSheet } from "./blocky/FaceSheet";
import { MotionSheet, MotionCell, MOTION_SHEET_FRAMES } from "./blocky/MotionSheet";

export const Root: React.FC = () => (
  <>
    <Composition id="Smoke" component={Smoke} width={1080} height={1920} fps={30} durationInFrames={90} />
    <Composition id="BlockFaceSheet" component={BlockFaceSheet} width={1080} height={1920} fps={30} durationInFrames={1} />
    <Composition id="MotionSheet" component={MotionSheet as any} width={1080} height={1920} fps={30} durationInFrames={MOTION_SHEET_FRAMES} />
    <Composition id="MotionCell" component={MotionCell as any} width={360} height={480} fps={30} durationInFrames={MOTION_SHEET_FRAMES} defaultProps={{ idx: 0 }} />
    <Composition id="BlockTest" component={BlockTest} width={1080} height={1920} fps={30} durationInFrames={BLOCK_FRAMES} />
    <Composition id="BlockTestClean" component={BlockTestClean} width={1080} height={1920} fps={30} durationInFrames={BLOCK_FRAMES} />
    <Composition id="Short06Blocky" component={Short06Blocky} width={1080} height={1920} fps={30} durationInFrames={SHORT06_FRAMES} />
    <Composition id="Short06BlockyClean" component={Short06BlockyClean} width={1080} height={1920} fps={30} durationInFrames={SHORT06_FRAMES} />
    <Composition id="Short06BlockyAt" component={Short06BlockyAt as any} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{ u: 1 }} />
  </>
);

// Cubefolks: the Remotion root. Each Short registers its compositions here (1080x1920, 30 fps).
import React from "react";
import { Composition } from "remotion";
import { Smoke } from "./Smoke";
import { Short07, Short07Clean, Short07At, SHORT07_FRAMES } from "./short07_truck/Short07";
import { Short08, Short08Clean, Short08At, SHORT08_FRAMES } from "./short08_elephant/Short08";
import { Short09, Short09Clean, Short09At, SHORT09_FRAMES } from "./short09_porch/Short09";
import { Short10, Short10Clean, Short10At, SHORT10_FRAMES } from "./short10_hamster/Short10";
import { BlockTest, BlockTestClean, BLOCK_FRAMES } from "./blocky/BlockTest";
import { Short06Blocky, Short06BlockyClean, Short06BlockyAt, SHORT06_FRAMES } from "./short06_blocky/Short06";
import { BlockFaceSheet } from "./blocky/FaceSheet";
import { RigCloseup } from "./blocky/RigCloseup";
import { ChannelBanner, ChannelAvatar } from "./blocky/ChannelArt";
import { SubscribeBanner } from "./blocky/SubscribeBanner";
import { MotionSheet, MotionCell, MOTION_SHEET_FRAMES } from "./blocky/MotionSheet";

export const Root: React.FC = () => (
  <>
    <Composition id="Short07" component={Short07} width={1080} height={1920} fps={30} durationInFrames={SHORT07_FRAMES} />
    <Composition id="Short07Clean" component={Short07Clean} width={1080} height={1920} fps={30} durationInFrames={SHORT07_FRAMES} />
    <Composition id="Short07At" component={Short07At as any} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{ u: 1 }} />
    <Composition id="Short08" component={Short08} width={1080} height={1920} fps={30} durationInFrames={SHORT08_FRAMES} />
    <Composition id="Short08Clean" component={Short08Clean} width={1080} height={1920} fps={30} durationInFrames={SHORT08_FRAMES} />
    <Composition id="Short08At" component={Short08At as any} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{ u: 1 }} />
    <Composition id="Short09" component={Short09} width={1080} height={1920} fps={30} durationInFrames={SHORT09_FRAMES} />
    <Composition id="Short09Clean" component={Short09Clean} width={1080} height={1920} fps={30} durationInFrames={SHORT09_FRAMES} />
    <Composition id="Short09At" component={Short09At as any} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{ u: 1 }} />
    <Composition id="Short10" component={Short10} width={1080} height={1920} fps={30} durationInFrames={SHORT10_FRAMES} />
    <Composition id="Short10Clean" component={Short10Clean} width={1080} height={1920} fps={30} durationInFrames={SHORT10_FRAMES} />
    <Composition id="Short10At" component={Short10At as any} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{ u: 1 }} />
    <Composition id="Smoke" component={Smoke} width={1080} height={1920} fps={30} durationInFrames={90} />
    <Composition id="BlockFaceSheet" component={BlockFaceSheet} width={1080} height={1920} fps={30} durationInFrames={1} />
    <Composition id="MotionSheet" component={MotionSheet as any} width={1080} height={1920} fps={30} durationInFrames={MOTION_SHEET_FRAMES} />
    <Composition id="SubscribeBanner" component={SubscribeBanner as any} width={2560} height={1440} fps={30} durationInFrames={1} />
    <Composition id="ChannelBanner" component={ChannelBanner as any} width={2560} height={1440} fps={30} durationInFrames={1} defaultProps={{ name: "KEWLHAT" }} />
    <Composition id="ChannelAvatar" component={ChannelAvatar as any} width={800} height={800} fps={30} durationInFrames={1} defaultProps={{ variant: "night" }} />
    <Composition id="RigCloseup" component={RigCloseup as any} width={1080} height={1440} fps={30} durationInFrames={60} />
    <Composition id="MotionCell" component={MotionCell as any} width={360} height={480} fps={30} durationInFrames={MOTION_SHEET_FRAMES} defaultProps={{ idx: 0 }} />
    <Composition id="BlockTest" component={BlockTest} width={1080} height={1920} fps={30} durationInFrames={BLOCK_FRAMES} />
    <Composition id="BlockTestClean" component={BlockTestClean} width={1080} height={1920} fps={30} durationInFrames={BLOCK_FRAMES} />
    <Composition id="Short06Blocky" component={Short06Blocky} width={1080} height={1920} fps={30} durationInFrames={SHORT06_FRAMES} />
    <Composition id="Short06BlockyClean" component={Short06BlockyClean} width={1080} height={1920} fps={30} durationInFrames={SHORT06_FRAMES} />
    <Composition id="Short06BlockyAt" component={Short06BlockyAt as any} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{ u: 1 }} />
  </>
);

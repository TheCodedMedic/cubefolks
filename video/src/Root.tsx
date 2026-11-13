// Beanfolk: the Remotion root. Each Short registers its compositions here (1080x1920, 30 fps).
import React from "react";
import { Composition } from "remotion";
import { Smoke } from "./Smoke";
import { CharacterSheet, SHEET_W, SHEET_H } from "./bean/CharacterSheet";
import { ChannelAvatar, ChannelBanner } from "./bean/ChannelArt";
import { GizmoAvatar, GizmoBanner } from "./gizmo/GizmoArt";
import { FlatSheet } from "./flat/FlatSheet";
import { Short01Test } from "./short01_bean/Test";
import { FaceDbg } from "./short01_bean/FaceDbg";
import { Short03Microwave, Short03MicrowaveCheck, Short03MicrowaveClean, SHORT03_FRAMES } from "./short03_microwave/Short03Microwave";
import { Short03Test } from "./short03_microwave/Test";
import { Short04Test } from "./short04_pacemaker/Test";
import { Short04Pacemaker, Short04PacemakerCheck, Short04PacemakerClean, SHORT04_FRAMES } from "./short04_pacemaker/Short04Pacemaker";
import { Short05NeverSleep, Short05NeverSleepCheck, Short05NeverSleepClean, SHORT05_FRAMES } from "./short05_never_sleep/Short05NeverSleep";
import { Short02SetTest, Short02Test } from "./short02_bean/Test";
import { Short02Bean, Short02BeanCheck, Short02BeanClean, SHORT02_FRAMES } from "./short02_bean/Short02Bean";
import { BlockTest, BlockTestClean, BLOCK_FRAMES } from "./blocky/BlockTest";
import { Short06Blocky, Short06BlockyClean, Short06BlockyAt, SHORT06_FRAMES } from "./short06_blocky/Short06";
import { BlockFaceSheet } from "./blocky/FaceSheet";
import { Short01Bean, Short01BeanCheck, Short01BeanClean, SHORT01_FRAMES } from "./short01_bean/Short01Bean";

export const Root: React.FC = () => (
  <>
    {/* a 3-second vertical test: proves Three.js + software WebGL + the vertical format render in this container */}
    <Composition id="Smoke" component={Smoke} width={1080} height={1920} fps={30} durationInFrames={90} />
    {/* the Beanfolk cast sheet (approval gate): a still */}
    <Composition id="BlockFaceSheet" component={BlockFaceSheet} width={1080} height={1920} fps={30} durationInFrames={1} />
    <Composition id="BeanSheet" component={CharacterSheet} width={SHEET_W} height={SHEET_H} fps={30} durationInFrames={1} />
    {/* channel art: profile picture and banner (stills) */}
    <Composition id="GizmoAvatar" component={GizmoAvatar} width={800} height={800} fps={30} durationInFrames={1} />
    <Composition id="GizmoBanner" component={GizmoBanner} width={2560} height={1440} fps={30} durationInFrames={1} />
    <Composition id="ChannelAvatar" component={ChannelAvatar} width={800} height={800} fps={30} durationInFrames={1} />
    <Composition id="ChannelBanner" component={ChannelBanner} width={2560} height={1440} fps={30} durationInFrames={1} />
    {/* style 2 (Inkfolk) cast sheet */}
    <Composition id="FlatSheet" component={FlatSheet} width={SHEET_W} height={SHEET_H} fps={30} durationInFrames={1} />
    {/* Short 1, Beanfolk 3D */}
    <Composition id="Short01Bean" component={Short01Bean} width={1080} height={1920} fps={30} durationInFrames={SHORT01_FRAMES} />
    <Composition id="Short01BeanClean" component={Short01BeanClean} width={1080} height={1920} fps={30} durationInFrames={SHORT01_FRAMES} />
    <Composition id="Short01BeanCheck" component={Short01BeanCheck} width={1080} height={1920} fps={30} durationInFrames={52} defaultProps={{ u: 0.5 }} />
    <Composition id="FaceDbg" component={FaceDbg} width={1080} height={1920} fps={30} durationInFrames={1} />
    <Composition id="Short01BeanTest" component={Short01Test} width={1080} height={1920} fps={30} durationInFrames={14} />
    {/* Gizmo Origins Short 3, Beanfolk 3D */}
    <Composition id="Short03Microwave" component={Short03Microwave} width={1080} height={1920} fps={30} durationInFrames={SHORT03_FRAMES} />
    <Composition id="Short03MicrowaveClean" component={Short03MicrowaveClean} width={1080} height={1920} fps={30} durationInFrames={SHORT03_FRAMES} />
    <Composition id="Short03MicrowaveCheck" component={Short03MicrowaveCheck} width={1080} height={1920} fps={30} durationInFrames={49} defaultProps={{ u: 0.5 }} />
    <Composition id="Short03Test" component={Short03Test} width={1080} height={1920} fps={30} durationInFrames={6} />
    {/* Gizmo Origins Short 4 (pacemaker), Beanfolk 3D */}
    <Composition id="Short04Pacemaker" component={Short04Pacemaker} width={1080} height={1920} fps={30} durationInFrames={SHORT04_FRAMES} />
    <Composition id="Short04PacemakerClean" component={Short04PacemakerClean} width={1080} height={1920} fps={30} durationInFrames={SHORT04_FRAMES} />
    <Composition id="Short04PacemakerCheck" component={Short04PacemakerCheck} width={1080} height={1920} fps={30} durationInFrames={52} defaultProps={{ u: 0.5 }} />
    <Composition id="Short04Test" component={Short04Test} width={1080} height={1920} fps={30} durationInFrames={5} />
    {/* Beanfolk Short 5 (never slept), Beanfolk 3D */}
    {/* blocky-style test Short */}
    <Composition id="BlockTest" component={BlockTest} width={1080} height={1920} fps={30} durationInFrames={BLOCK_FRAMES} />
    <Composition id="BlockTestClean" component={BlockTestClean} width={1080} height={1920} fps={30} durationInFrames={BLOCK_FRAMES} />
    <Composition id="Short05NeverSleep" component={Short05NeverSleep} width={1080} height={1920} fps={30} durationInFrames={SHORT05_FRAMES} />
    <Composition id="Short05NeverSleepClean" component={Short05NeverSleepClean} width={1080} height={1920} fps={30} durationInFrames={SHORT05_FRAMES} />
    <Composition id="Short05NeverSleepCheck" component={Short05NeverSleepCheck} width={1080} height={1920} fps={30} durationInFrames={35} defaultProps={{ u: 0.5 }} />
    {/* Beanfolk Short 6 (the reflection that blinks first), blocky style */}
    <Composition id="Short06Blocky" component={Short06Blocky} width={1080} height={1920} fps={30} durationInFrames={SHORT06_FRAMES} />
    <Composition id="Short06BlockyClean" component={Short06BlockyClean} width={1080} height={1920} fps={30} durationInFrames={SHORT06_FRAMES} />
    <Composition id="Short06BlockyAt" component={Short06BlockyAt as any} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{ u: 1 }} />
    {/* Short 2, Beanfolk 3D */}
    <Composition id="Short02Bean" component={Short02Bean} width={1080} height={1920} fps={30} durationInFrames={SHORT02_FRAMES} />
    <Composition id="Short02BeanClean" component={Short02BeanClean} width={1080} height={1920} fps={30} durationInFrames={SHORT02_FRAMES} />
    <Composition id="Short02BeanCheck" component={Short02BeanCheck} width={1080} height={1920} fps={30} durationInFrames={54} defaultProps={{ u: 0.5 }} />
    <Composition id="Short02BeanTest" component={Short02Test} width={1080} height={1920} fps={30} durationInFrames={7} />
    <Composition id="Short02SetTest" component={Short02SetTest} width={1080} height={1920} fps={30} durationInFrames={9} />
  </>
);

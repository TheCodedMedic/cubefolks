import React from "react";
import { Composition } from "remotion";
import { LookRoom, LookStreet, LookSwatches } from "./LookTest";
export const LookRoot: React.FC = () => (
  <>
    <Composition id="LookSwatches" component={LookSwatches} width={1080} height={1920} fps={30} durationInFrames={1} />
    <Composition id="LookStreet" component={LookStreet as any} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{ time: "day" }} />
    <Composition id="LookRoom" component={LookRoom as any} width={1080} height={1920} fps={30} durationInFrames={1} defaultProps={{ time: "interior" }} />
  </>
);

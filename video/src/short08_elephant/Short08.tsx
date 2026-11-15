// Short08: scaffold (the Short's lead replaces SHOTS and POPS). Brief: notes/cubefolks/BUILD_BRIEF_07-10.md.
// Every time comes from at(beat, "word") on ./timing.json. Never type a second.
import React from "react";
import { useCurrentFrame } from "remotion";
import TIMING from "./timing.json";
import { makeTiming, Shot, TimingJSON } from "../kit/core";
import { FPS, ShortFrame } from "../kit/Short";
import { PopSpec } from "../kit/Pop";

export const T = makeTiming(TIMING as TimingJSON);
export const SHORT08_FRAMES = Math.round(T.END * FPS);
const EMPTY: Shot = { id: "empty", t0: 0, t1: T.END, scene: () => null, cam: () => ({ pos: [0, 3, 10], target: [0, 3, 0], fov: 40 }), bg: "#203040" };
export const SHOTS: Shot[] = [EMPTY];
export const POPS: PopSpec[] = [];
const HIGHLIGHT: string[] = [];
const Frame: React.FC<{ t: number; captions: boolean }> = ({ t, captions }) => (
  <ShortFrame shots={SHOTS} t={t} T={captions ? T : undefined} pops={captions ? POPS : []} highlight={HIGHLIGHT} single captionY={0.7} />
);
export const Short08: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions />;
export const Short08Clean: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions={false} />;
/** One still at time u (s) for review: --props '{"u":12.3}'. */
export const Short08At: React.FC<{ u: number; captions?: boolean }> = ({ u, captions = true }) => <Frame t={u} captions={captions} />;

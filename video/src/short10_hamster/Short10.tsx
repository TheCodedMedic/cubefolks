// Short10: scaffold (the Short's lead replaces SHOTS and POPS). Brief: notes/cubefolks/BUILD_BRIEF_07-10.md.
// Every time comes from at(beat, "word") on ./timing.json. Never type a second.
import React from "react";
import { useCurrentFrame } from "remotion";
import TIMING from "./timing.json";
import { makeTiming, Shot, TimingJSON } from "../kit/core";
import { FPS, ShortFrame } from "../kit/Short";
import { PopSpec } from "../kit/Pop";

export const T = makeTiming(TIMING as TimingJSON);
export const SHORT10_FRAMES = Math.round(T.END * FPS);
const EMPTY: Shot = { id: "empty", t0: 0, t1: T.END, scene: () => null, cam: () => ({ pos: [0, 3, 10], target: [0, 3, 0], fov: 40 }), bg: "#203040" };
import { PREVIEW } from "./ClassPreview";
import { SHOTS_A, POPS_A } from "./ShotsA";
import { SHOTS_B, POPS_B } from "./ShotsB";
/** Shots A (beats 1-9) then B (beats 10-19); the preview fills in until both land. */
export const SHOTS: Shot[] = SHOTS_A.length || SHOTS_B.length ? [...SHOTS_A, ...SHOTS_B].sort((a, b) => a.t0 - b.t0) : PREVIEW.length ? PREVIEW : [EMPTY];
const { at, atE } = T;
/** The hook stamp is fully on screen at frame 0 (no fade-in); the question (never spoken) pops in for the last 3 s. */
export const POPS: PopSpec[] = [
  { kind: "stamp", text: "ESCAPED (AGAIN)", t0: -0.4, t1: atE(1, "Friday"), x: 0.5, y: 0.16, size: 0.75, rot: -6, color2: "#d22a2a" },
  ...POPS_A, ...POPS_B,
  { kind: "word", text: "Which clue", t0: T.END - 3, t1: T.END, x: 0.5, y: 0.13, size: 0.5, rot: -2, color: "#ffffff", color2: "#2a2f45" },
  { kind: "word", text: "gave him away?", t0: T.END - 2.9, t1: T.END, x: 0.5, y: 0.205, size: 0.5, rot: -2, color: "#ffd84a", color2: "#2a2f45" },
];
void at;
const HIGHLIGHT: string[] = ["locked", "friday", "maya", "key", "taped", "vanished", "drawer", "backpacks", "monday", "never", "nothing", "shells", "peanut", "nest", "filmed", "midnight", "video", "hole", "ride", "getaway"];
const Frame: React.FC<{ t: number; captions: boolean }> = ({ t, captions }) => (
  <ShortFrame shots={SHOTS} t={t} T={captions ? T : undefined} pops={captions ? POPS : []} highlight={HIGHLIGHT} single captionY={0.7} />
);
export const Short10: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions />;
export const Short10Clean: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions={false} />;
/** One still at time u (s) for review: --props '{"u":12.3}'. */
export const Short10At: React.FC<{ u: number; captions?: boolean }> = ({ u, captions = true }) => <Frame t={u} captions={captions} />;

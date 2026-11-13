// Beanfolk Short 6 "The Reflection That Blinks First" (blocky style). notes/short06/CONTRACT.md.
// SHOTS_A (beats 1-7) + SHOTS_B (beats 8-14), one-word captions (white, dark outline), pops; every time from measured words.
import React from "react";
import { useCurrentFrame } from "remotion";
import TIMING from "./timing.json";
import { makeTiming, Shot, TimingJSON } from "../kit/core";
import { FPS, ShortFrame } from "../kit/Short";
import { PopSpec } from "../kit/Pop";
import { SHOTS_B } from "./ShotsB";
import { SHOTS_A, POPS_A } from "./ShotsA";

export const T = makeTiming(TIMING as TimingJSON);
const { at, atE, END } = T;
export const SHORT06_FRAMES = Math.round(END * FPS);

/** Fallback shot so the composition always renders something while builders are still landing. */
const EMPTY: Shot = { id: "empty", t0: 0, t1: END, scene: () => null, cam: () => ({ pos: [0, 3, 10], target: [0, 3, 0], fov: 40 }), bg: "#203040" };
export const SHOTS06: Shot[] = (() => {
  const s = [...SHOTS_A, ...SHOTS_B].sort((a, b) => a.t0 - b.t0);
  return s.length ? s : [EMPTY];
})();

// Pops (all from words). "3 DAYS" lands on "three" (b1); the never-spoken question in the last 3-4 s (b14).
export const POPS06: PopSpec[] = [
  // fully on screen at frame 0 (hook checklist: no fade-in)
  { kind: "word", text: "IT BLINKS FIRST", t0: -0.4, t1: at(1, "three") - 0.12, x: 0.5, y: 0.19, size: 0.55, rot: -3, color: "#ffffff", color2: "#2a2f45" },
  { kind: "word", text: "3 DAYS", t0: at(1, "three"), t1: atE(1, "left."), x: 0.5, y: 0.2, size: 0.85, rot: -4, color: "#ffffff", color2: "#7a1d1d" },
  ...POPS_A,
  { kind: "word", text: "Would you look?", t0: at(14, "first,"), t1: END, x: 0.5, y: 0.2, size: 0.5, rot: -2, color: "#ffffff", color2: "#2a2f45" },
];
const HIGHLIGHT = ["blinks", "three", "alone.", "watching", "first."];

const Frame: React.FC<{ t: number; captions: boolean }> = ({ t, captions }) => (
  <ShortFrame shots={SHOTS06} t={t} T={captions ? T : undefined} pops={captions ? POPS06 : []} highlight={HIGHLIGHT} single captionY={0.62} />
);
export const Short06Blocky: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions />;
export const Short06BlockyClean: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions={false} />;
/** One still at time u (s) for review: `--props '{"u":12.3}'`. */
export const Short06BlockyAt: React.FC<{ u: number; captions?: boolean }> = ({ u, captions = true }) => <Frame t={u} captions={captions} />;

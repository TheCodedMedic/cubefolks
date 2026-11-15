// Short 08 "The Invisible Elephant" (comedy). Plan: notes/cubefolks/STORY_TESTS_v2.md section B; shared pieces: ./common.tsx.
// Every time comes from at(beat, "word") on ./timing.json. Never type a second.
import React from "react";
import { useCurrentFrame } from "remotion";
import type { Shot } from "../kit/core";
import { FPS, ShortFrame } from "../kit/Short";
import { PopSpec } from "../kit/Pop";
import { SetPreview } from "./SetPreview";
import { CUTS, DEBUG, E, END, T } from "./common";
import { SHOTS_A } from "./ShotsA";
import { SHOTS_B } from "./ShotsB";

export { T };
export const SHORT08_FRAMES = Math.round(T.END * FPS);
const placeholder = (id: string, t0: number, t1: number): Shot => ({ id, t0, t1, enter: "cut", scene: () => null, cam: () => ({ pos: [0, 3, 10], target: [0, 3, 0], fov: 40 }), bg: "#203040" });
/** Every cut in CUTS order; a cut with no shot yet renders a dark placeholder. */
export const SHOTS: Shot[] = CUTS.map(([id], i) => {
  const s = [...SHOTS_A, ...SHOTS_B].find((x) => x.id === id);
  return s ?? placeholder(id, CUTS[i][1], i + 1 < CUTS.length ? CUTS[i + 1][1] : END);
});
const Q0 = END - 3; // the on-screen question: the last 3 s (never spoken)
export const POPS: PopSpec[] = [
  { kind: "word", t0: 0, t1: E.lunch1, x: 0.5, y: 0.2, text: "$400", size: 1.5, color: "#7fe08a", color2: "#2f6a3a", rot: -4 },
  { kind: "word", t0: E.five, t1: E.leash3 + 0.3, x: 0.72, y: 0.22, text: "$5", size: 1.1, color: "#7fe08a", color2: "#2f6a3a", rot: 6 },
  { kind: "stamp", t0: E.real + 0.32, t1: E.real + 1.0, x: 0.5, y: 0.3, text: "BONK!", size: 1.0, color2: "#d0322a", rot: -8 },
  { kind: "word", t0: E.fifty, t1: E.fifty + 1.0, x: 0.5, y: 0.22, text: "$50", size: 1.3, color: "#7fe08a", color2: "#2f6a3a", rot: 5 },
  { kind: "word", t0: E.forty, t1: E.forty + 1.1, x: 0.5, y: 0.2, text: "x40", size: 1.2, color: "#ffd84a", rot: -4 },
  { kind: "tag", t0: E.ten15, t1: E.ten15 + 0.9, x: 0.55, y: 0.24, text: "$10", size: 1.0, color: "#7fe08a", rot: -6 },
  { kind: "word", t0: Q0, t1: END + 1, x: 0.5, y: 0.2, text: "WHO SCAMMED", size: 0.62, color: "#ffffff", color2: "#1e4f8a", rot: -3 },
  { kind: "word", t0: Q0 + 0.12, t1: END + 1, x: 0.5, y: 0.275, text: "WHO?", size: 1.05, color: "#ffd84a", rot: 3 },
];
const HIGHLIGHT = ["invisible", "elephant", "four", "hundred", "five", "lined", "horse", "tree.", "principal", "much", "left.", "peanuts", "fifty", "forty", "ten", "first"];
const Frame: React.FC<{ t: number; captions: boolean }> = ({ t, captions }) => (
  <ShortFrame shots={SHOTS} t={t} T={captions ? T : undefined} pops={captions ? POPS : []} highlight={HIGHLIGHT} single captionY={0.7} />
);
export const Short08: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions />;
export const Short08Clean: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions={false} />;
/** One still at time u (s) for review: --props '{"u":12.3}'; {"debug":true} paints clipping parts magenta; {"preview":n} set stills. */
export const Short08At: React.FC<{ u: number; captions?: boolean; preview?: number; debug?: boolean }> = ({ u, captions = true, preview, debug }) => {
  DEBUG.on = !!debug;
  return preview !== undefined ? <SetPreview v={preview} /> : <Frame t={u} captions={captions} />;
};

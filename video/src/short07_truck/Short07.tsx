// Short07 "The Truck With No Speaker". Plan: notes/cubefolks/STORY_TESTS_v2.md section A; contract notes/short07/CONTRACT.md.
// Every time comes from at(beat, "word") on ./timing.json (common.tsx). Never type a second.
import React from "react";
import { useCurrentFrame } from "remotion";
import { Shot } from "../kit/core";
import { FPS, ShortFrame } from "../kit/Short";
import { PopSpec } from "../kit/Pop";
import { T, CUTS, DEBUG, END } from "./common";
import { SHOTS_STREET } from "./ShotsStreet";
import { SHOTS_SCHOOL } from "./ShotsSchool";
import { SHOTS_HOUSE } from "./ShotsHouse";
import { Overlay07 } from "./Overlay07";

export { T };
export const SHORT07_FRAMES = Math.round(T.END * FPS);
const ALL = [...SHOTS_STREET, ...SHOTS_SCHOOL, ...SHOTS_HOUSE];
/** Shots in cut order; a missing one shows a dark placeholder (only while building). */
export const SHOTS: Shot[] = CUTS.map(([id], i) => ALL.find((s) => s.id === id) ?? {
  id, t0: CUTS[i][1], t1: i + 1 < CUTS.length ? CUTS[i + 1][1] : END, enter: "cut" as const, bg: "#203040",
  scene: () => null, cam: () => ({ pos: [0, 3, 10], target: [0, 3, 0], fov: 40 }),
});
export const POPS: PopSpec[] = [];
const HIGHLIGHT: string[] = ["speaker", "3", "a.m.", "free", "toby", "melt", "song", "anywhere", "teacher", "wrong", "closer", "two", "mouth", "bells", "speaker."];
const Frame: React.FC<{ t: number; captions: boolean }> = ({ t, captions }) => (
  <ShortFrame shots={SHOTS} t={t} T={captions ? T : undefined} pops={captions ? POPS : []} highlight={HIGHLIGHT} single captionY={0.7}
    overlay={captions ? <Overlay07 t={t} /> : undefined} />
);
export const Short07: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions />;
export const Short07Clean: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions={false} />;
/** One still at time u (s) for review: --props '{"u":12.3}'; "debug": true paints clipping parts magenta. */
export const Short07At: React.FC<{ u: number; captions?: boolean; debug?: boolean }> = ({ u, captions = true, debug = false }) => {
  DEBUG.on = debug;
  return <Frame t={u} captions={captions} />;
};

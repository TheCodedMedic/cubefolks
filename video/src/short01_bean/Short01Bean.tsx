// Beanfolk Short 1 "Clever Hans" (Beanfolk 3D style): 1080x1920, 30 fps, as long as the voice track.
// Shots in shots.tsx, timing in timing.ts (measured words), the kit's ShortFrame for whips, captions and pop-ins.
import React from "react";
import { useCurrentFrame } from "remotion";
import { FPS, ShortFrame } from "../kit/Short";
import { HIGHLIGHT, POPS } from "./pops";
import { SHOTS } from "./shots";
import { END, T } from "./timing";

export const SHORT01_FRAMES = Math.round(END * FPS);


export const Short01Bean: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return <ShortFrame shots={SHOTS} t={t} T={T} pops={POPS} highlight={HIGHLIGHT} />;
};

/** Review: frame i shows shot i at a fraction of its length (CHECK_U), labelled. */
export const Short01BeanCheck: React.FC<{ u?: number }> = ({ u = 0.5 }) => {
  const i = useCurrentFrame(), s = SHOTS[Math.min(i, SHOTS.length - 1)];
  const t = s.t0 + (s.t1 - s.t0) * u;
  return <ShortFrame shots={SHOTS} t={t} T={T} pops={POPS} highlight={HIGHLIGHT} label={`${s.id} t=${t.toFixed(2)}`} />;
};

/** Thumbnail stills: the same picture and pop-ins, no captions (render with --frame=<n>). */
export const Short01BeanClean: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return <ShortFrame shots={SHOTS} t={t} pops={POPS} highlight={HIGHLIGHT} />;
};

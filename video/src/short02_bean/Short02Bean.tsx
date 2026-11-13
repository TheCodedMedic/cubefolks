// Beanfolk Short 2 "The City That Paid for Rat Tails" (Beanfolk 3D style): 1080x1920, 30 fps, as long as the voice track.
// Shots in shots.tsx, timing in timing.ts (measured words), the kit's ShortFrame for whips, captions and pop-ins, plus
// the tail counter and coin bursts drawn over every shot they span.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { FPS, ShortFrame } from "../kit/Short";
import { HIGHLIGHT, POPS } from "./pops";
import { counterOverlay, SHOTS } from "./shots";
import { END, T } from "./timing";

export const SHORT02_FRAMES = Math.round(END * FPS);

const Frame: React.FC<{ t: number; captions: boolean; label?: string }> = ({ t, captions, label }) => (
  <AbsoluteFill>
    <ShortFrame shots={SHOTS} t={t} T={captions ? T : undefined} pops={POPS} highlight={HIGHLIGHT} label={label} />
    {counterOverlay(t)}
  </AbsoluteFill>
);

export const Short02Bean: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions />;

/** Review: frame i shows shot i at a fraction of its length (u), labelled. */
export const Short02BeanCheck: React.FC<{ u?: number }> = ({ u = 0.5 }) => {
  const i = useCurrentFrame(), s = SHOTS[Math.min(i, SHOTS.length - 1)];
  const t = s.t0 + (s.t1 - s.t0) * u;
  return <Frame t={t} captions label={`${s.id} t=${t.toFixed(2)}`} />;
};

/** Thumbnail stills: the same picture and pop-ins, no captions (render with --frame=<n>). */
export const Short02BeanClean: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions={false} />;

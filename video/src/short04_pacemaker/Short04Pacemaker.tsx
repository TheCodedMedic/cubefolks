// Gizmo Origins Short 4 "The Wrong Part That Saved Millions of Hearts" (Beanfolk 3D style): 1080x1920, 30 fps, as long
// as the voice track. Shots in shots.tsx, timing in timing.ts (measured words), the kit's ShortFrame for whips,
// captions and pop-ins, plus a plug icon on "plugged".
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { back, seg } from "../kit/core";
import { FPS, ShortFrame } from "../kit/Short";
import { H, W } from "../kit/Pop";
import { HIGHLIGHT, POPS } from "./pops";
import { SHOTS } from "./shots";
import { END, EV, P, T } from "./timing";

export const SHORT04_FRAMES = Math.round(END * FPS);

/** A chunky plug icon (pops on "plugged"). */
const PlugIcon: React.FC<{ t: number; t0: number; t1: number }> = ({ t, t0, t1 }) => {
  if (t < t0 || t > t1 + 0.12) return null;
  const k = back(seg(t, t0, t0 + 0.22), 2.4) * (1 - seg(t, t1, t1 + 0.12));
  return (
    <div style={{ position: "absolute", left: 0.74 * W, top: 0.22 * H, transform: `translate(-50%,-50%) rotate(${-12 + Math.sin((t - t0) * 5) * 2}deg) scale(${k})` }}>
      <svg width={260} height={300} viewBox="0 0 260 300" style={{ overflow: "visible", filter: "drop-shadow(0 10px 0 #1b1410)" }}>
        <path d="M130 200 C130 260, 60 250, 40 300" stroke="#1b1410" strokeWidth={30} fill="none" strokeLinecap="round" />
        <path d="M130 200 C130 260, 60 250, 40 300" stroke="#3a3a3a" strokeWidth={16} fill="none" strokeLinecap="round" />
        <rect x={90} y={20} width={22} height={70} rx={8} fill="#c8ccd0" stroke="#1b1410" strokeWidth={8} />
        <rect x={148} y={20} width={22} height={70} rx={8} fill="#c8ccd0" stroke="#1b1410" strokeWidth={8} />
        <rect x={50} y={80} width={160} height={130} rx={36} fill="#ffd84a" stroke="#1b1410" strokeWidth={10} />
        <rect x={70} y={100} width={30} height={90} rx={12} fill="#ffffff" opacity={0.45} />
      </svg>
    </div>
  );
};
export const PLUG_T = EV.plugged;

const Frame: React.FC<{ t: number; captions: boolean; label?: string }> = ({ t, captions, label }) => (
  <AbsoluteFill>
    <ShortFrame shots={SHOTS} t={t} T={captions ? T : undefined} pops={POPS} highlight={HIGHLIGHT} label={label} />
    <PlugIcon t={t} t0={EV.plugged} t1={P(12) - 0.1} />
  </AbsoluteFill>
);

export const Short04Pacemaker: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions />;

/** Review: frame i shows shot i at a fraction of its length (u), labelled. */
export const Short04PacemakerCheck: React.FC<{ u?: number }> = ({ u = 0.5 }) => {
  const i = useCurrentFrame(), s = SHOTS[Math.min(i, SHOTS.length - 1)];
  const t = s.t0 + (s.t1 - s.t0) * u;
  return <Frame t={t} captions label={`${s.id} t=${t.toFixed(2)}`} />;
};

/** Thumbnail stills: the same picture and pop-ins, no captions (render with --frame=<n>). */
export const Short04PacemakerClean: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions={false} />;

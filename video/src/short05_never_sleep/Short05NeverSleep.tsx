// Beanfolk Short 5 "A kid stayed awake for eleven days" (Beanfolk 3D style): 1080x1920, 30 fps, as long as the voice
// track. Shots in shots.tsx, timing in timing.ts (measured words), the kit's ShortFrame for whips and pop-ins; captions
// on top (kept sharp while the picture blurs in s10), plus three custom pop-ins: the crossed-out bed, the football with a
// star and the comment question.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { back, seg } from "../kit/core";
import { FPS, ShortFrame } from "../kit/Short";
import { Captions } from "../kit/Captions";
import { H, W } from "../kit/Pop";
import { BED_X, FOOTBALL, HIGHLIGHT, POPS, QUESTION } from "./pops";
import { focusBlur, SHOTS } from "./shots";
import { END, T } from "./timing";

export const SHORT05_FRAMES = Math.round(END * FPS);

const popK = (t: number, t0: number, t1: number) => (t < t0 || t > t1 + 0.12 ? 0 : back(seg(t, t0, t0 + 0.22), 2.4) * (1 - seg(t, t1, t1 + 0.12)));

/** A bed with a big red cross over it (no more sleep). */
const BedX: React.FC<{ t: number }> = ({ t }) => {
  const k = popK(t, BED_X.t0, BED_X.t1);
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0.28 * W, top: 0.335 * H, transform: `translate(-50%,-50%) rotate(${-6 + Math.sin((t - BED_X.t0) * 5) * 2}deg) scale(${k})` }}>
      <svg width={240} height={176} viewBox="0 0 300 220" style={{ overflow: "visible", filter: "drop-shadow(0 10px 0 #1b1410)" }}>
        <rect x={30} y={70} width={30} height={120} rx={10} fill="#8a5a32" stroke="#1b1410" strokeWidth={8} />
        <rect x={40} y={120} width={230} height={50} rx={14} fill="#3a6ab0" stroke="#1b1410" strokeWidth={8} />
        <rect x={60} y={95} width={70} height={34} rx={14} fill="#fbf8f1" stroke="#1b1410" strokeWidth={8} />
        <rect x={250} y={150} width={22} height={45} rx={6} fill="#8a5a32" stroke="#1b1410" strokeWidth={8} />
        <path d="M40 30 L270 200 M270 30 L40 200" stroke="#1b1410" strokeWidth={46} strokeLinecap="round" />
        <path d="M40 30 L270 200 M270 30 L40 200" stroke="#e2403a" strokeWidth={30} strokeLinecap="round" />
      </svg>
    </div>
  );
};

/** A football with a gold star (the daydream). */
const FootballStar: React.FC<{ t: number }> = ({ t }) => {
  const k = popK(t, FOOTBALL.t0, FOOTBALL.t1);
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0.74 * W, top: 0.2 * H, transform: `translate(-50%,-50%) rotate(${-18 + Math.sin((t - FOOTBALL.t0) * 5) * 3}deg) scale(${k})` }}>
      <svg width={300} height={240} viewBox="0 0 300 240" style={{ overflow: "visible", filter: "drop-shadow(0 10px 0 #1b1410)" }}>
        <ellipse cx={130} cy={130} rx={110} ry={68} fill="#8a4a22" stroke="#1b1410" strokeWidth={10} />
        <path d="M80 130 L180 130" stroke="#fbf8f1" strokeWidth={10} strokeLinecap="round" />
        {[95, 115, 135, 155, 175].map((x) => <path key={x} d={`M${x} 118 L${x} 142`} stroke="#fbf8f1" strokeWidth={8} strokeLinecap="round" />)}
        <path d="M240 10 L255 50 L298 52 L264 78 L276 120 L240 96 L204 120 L216 78 L182 52 L225 50 Z" fill="#ffd84a" stroke="#1b1410" strokeWidth={8} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** The comment question (never spoken), the last 3-4 seconds. */
const Question: React.FC<{ t: number }> = ({ t }) => {
  const k = popK(t, QUESTION.t0, QUESTION.t1);
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0.5 * W, top: 0.105 * H, transform: `translate(-50%,-50%) rotate(${-2 + Math.sin((t - QUESTION.t0) * 3) * 1}deg) scale(${k})` }}>
      <div style={{ background: "#fbf8f1", border: "8px solid #1b1410", borderRadius: 34, padding: "22px 36px", boxShadow: "0 14px 0 #1b1410", fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 62, lineHeight: 1.1, color: "#1b1410", textAlign: "center", whiteSpace: "nowrap" }}>
        How long have <span style={{ color: "#e2403a" }}>YOU</span><br />stayed awake?
        <svg width={70} height={70} viewBox="0 0 70 70" style={{ verticalAlign: "middle", marginLeft: 14 }}>
          <path d="M35 6 L35 50 M14 34 L35 58 L56 34" stroke="#e2403a" strokeWidth={13} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

const Frame: React.FC<{ t: number; captions: boolean; label?: string }> = ({ t, captions, label }) => {
  const b = focusBlur(t);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: b > 0 ? `blur(${b}px)` : undefined }}>
        <ShortFrame shots={SHOTS} t={t} pops={POPS} label={label} />
      </AbsoluteFill>
      <BedX t={t} />
      <FootballStar t={t} />
      <Question t={t} />
      {captions && <Captions T={T} t={t} highlight={HIGHLIGHT} />}
    </AbsoluteFill>
  );
};

export const Short05NeverSleep: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions />;

/** Review: frame i shows shot i at a fraction of its length (u), labelled. */
export const Short05NeverSleepCheck: React.FC<{ u?: number }> = ({ u = 0.5 }) => {
  const i = useCurrentFrame(), s = SHOTS[Math.min(i, SHOTS.length - 1)];
  const t = s.t0 + (s.t1 - s.t0) * u;
  return <Frame t={t} captions label={`${s.id} t=${t.toFixed(2)}`} />;
};

/** Thumbnail stills: the same picture and pop-ins, no captions (render with --frame=<n>). */
export const Short05NeverSleepClean: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions={false} />;

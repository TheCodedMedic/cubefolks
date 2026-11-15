// Short 09 "The Porch Light Code" (wholesome). Brief: notes/cubefolks/BUILD_BRIEF_07-10.md; plan: STORY_TESTS_v2.md C.
// Every time comes from at(beat, "word") on ./timing.json. Never type a second.
import React from "react";
import { useCurrentFrame } from "remotion";
import { back, seg, Shot } from "../kit/core";
import { FPS, ShortFrame } from "../kit/Short";
import { PopSpec } from "../kit/Pop";
import { SHOTS09, FL, T } from "./Shots09";
import { PREVIEW } from "./Preview09";
import { getInputProps } from "remotion";

export { T };
export const SHORT09_FRAMES = Math.round(T.END * FPS);
const { at } = T;
const preview = (() => { try { return !!(typeof window === "undefined" ? {} : getInputProps() as any)?.preview; } catch { return false; } })();
export const SHOTS: Shot[] = preview ? PREVIEW : SHOTS09;
export const POPS: PopSpec[] = [
  { kind: "icon", icon: "?", t0: at(5, "planning"), t1: at(5, "something.", 1, 0.5), x: 0.78, y: 0.2, size: 0.6, rot: 8 },
  { kind: "word", text: "9:00", t0: at(3, "nine,"), t1: at(3, "Mr.", 1, -0.05), x: 0.5, y: 0.3, size: 0.9, rot: -4, color: "#ffffff", color2: "#2a2f45" },
  { kind: "word", text: "9:00", t0: at(7, "Nine"), t1: at(7, "came,", 1, 0.3), x: 0.5, y: 0.3, size: 0.9, rot: 4, color: "#ffffff", color2: "#2a2f45" },
  { kind: "icon", icon: "heart", t0: at(16, "always"), t1: at(16, "come.", 1, 0.45), x: 0.5, y: 0.2, size: 0.75 },
];
const HIGHLIGHT: string[] = ["blinks", "away", "nine", "three", "Mr.", "Bell", "back", "knee", "dark", "slippers", "coat", "scared", "always", "turn", "safe"];

/** The flash counter: three bulbs at the top; bulb i lights when flash i starts (and glows while that flash is on). */
type Count = { fl: [number, number][]; t0: number; t1: number; color: string };
const COUNTS: Count[] = [
  { fl: FL.hook, t0: -1, t1: at(1, "to"), color: "#ffd24a" },
  { fl: FL.bell3, t0: at(3, "blinks", 1, -0.25), t1: at(3, "watches"), color: "#ffffff" },
  { fl: FL.dad4, t0: at(4, "Dad", 1, -0.05), t1: at(5, "I", 1, -0.1), color: "#ffd24a" },
  { fl: FL.bell8, t0: at(8, "Mr."), t1: at(9, "I", 1, -0.1), color: "#ffffff" },
  { fl: FL.bell16, t0: at(16, "always", 1, -0.05), t1: at(17, "I", 1, -0.1), color: "#ffffff" },
  { fl: FL.me17, t0: at(17, "I", 1, -0.05), t1: at(18, "Mr.", 1, -0.1), color: "#ffd24a" },
];
const Bulb: React.FC<{ lit: number; glow: number; color: string }> = ({ lit, glow, color }) => (
  <svg width={150} height={190} viewBox="0 0 100 130" style={{ overflow: "visible", filter: `drop-shadow(0 7px 0 #1b1410)${glow > 0 ? ` drop-shadow(0 0 ${18 * glow}px ${color})` : ""}` }}>
    <path d="M50 6 C24 6 10 26 10 46 C10 64 22 74 30 84 L30 96 L70 96 L70 84 C78 74 90 64 90 46 C90 26 76 6 50 6 Z"
      fill={lit ? color : "#3a3f52"} stroke="#1b1410" strokeWidth={7} />
    <rect x={30} y={96} width={40} height={22} rx={5} fill="#b9bcc4" stroke="#1b1410" strokeWidth={6} />
    {lit ? <path d="M36 44 Q44 34 52 44" stroke="#fff8d8" strokeWidth={7} fill="none" strokeLinecap="round" /> : null}
  </svg>
);
const Counter: React.FC<{ t: number }> = ({ t }) => {
  const c = COUNTS.find((k) => t >= k.t0 && t < k.t1);
  if (!c) return null;
  const k = c.t0 < 0 ? 1 : back(seg(t, c.t0, c.t0 + 0.2), 2.2) * (1 - seg(t, c.t1 - 0.12, c.t1));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 1920 * 0.075, display: "flex", justifyContent: "center", gap: 28, transform: `scale(${k})`, transformOrigin: "50% 50%" }}>
      {c.fl.map(([a, b], i) => {
        const on = t >= a, glow = t >= a && t < b ? 1 : 0;
        return <div key={i} style={{ transform: `scale(${glow ? 1.14 : 1}) rotate(${(i - 1) * 6}deg)` }}><Bulb lit={on ? 1 : 0} glow={glow} color={c.color} /></div>;
      })}
    </div>
  );
};
/** The on-screen question for the last 3 s (never spoken). */
const Question: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T.END - 3;
  if (t < t0) return null;
  const k = back(seg(t, t0, t0 + 0.25), 2.2);
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 1920 * 0.1, transform: `scale(${k})`, display: "flex", justifyContent: "center" }}>
      <div style={{ background: "#fffaf0", border: "7px solid #1b1410", borderRadius: 34, padding: "26px 34px", boxShadow: "0 12px 0 #1b1410", textAlign: "center",
        font: "900 66px Montserrat, sans-serif", color: "#1b1410", lineHeight: 1.12 }}>
        Who would notice if <span style={{ color: "#e0a400" }}>YOUR</span> light stayed dark?
        <div style={{ display: "inline-block", marginLeft: 14, verticalAlign: "middle", transform: "scale(0.42)", transformOrigin: "0 60%", width: 64, height: 80 }}><Bulb lit={1} glow={1} color="#ffd24a" /></div>
      </div>
    </div>
  );
};
const Frame: React.FC<{ t: number; captions: boolean }> = ({ t, captions }) => (
  <ShortFrame shots={SHOTS} t={t} T={captions ? T : undefined} pops={captions ? POPS : []} highlight={HIGHLIGHT} single captionY={0.7}
    overlay={captions ? <><Counter t={t} /><Question t={t} /></> : null} />
);
export const Short09: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions />;
export const Short09Clean: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions={false} />;
/** One still at time u (s) for review: --props '{"u":12.3}'. */
export const Short09At: React.FC<{ u: number; captions?: boolean }> = ({ u, captions = true }) => <Frame t={u} captions={captions} />;

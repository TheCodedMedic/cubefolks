// Word captions: one or two words at a time from the measured timing, heavy rounded white type with a dark stroke and
// shadow at about 60% of the frame height, a tiny pop on each new group, optional highlight colour on key words.
import React, { useMemo } from "react";
import { back, seg, Timing, Word } from "./core";

export const CAPTION = { size: 92, y: 0.6, color: "#ffffff", stroke: "#1b1410", hi: "#ffd84a", font: "Montserrat, sans-serif" };
const bare = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, "");

/** Group words: a short word (≤3 letters) joins the next word of the same beat if the pair stays short and close. */
export const captionGroups = (words: Word[], single = false) => {
  const g: { words: Word[]; s: number; e: number; b: number }[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i], n = words[i + 1];
    const pair = !single && n && n.b === w.b && bare(w.w).length <= 3 && !/[.,!?;:]$/.test(w.w) && (w.w + n.w).length <= 11 && n.s - w.e < 0.2;
    if (pair) { g.push({ words: [w, n], s: w.s, e: n.e, b: w.b }); i++; } else g.push({ words: [w], s: w.s, e: w.e, b: w.b });
  }
  return g;
};

export const Captions: React.FC<{ T: Timing; t: number; highlight?: string[]; hide?: [number, number][]; y?: number; single?: boolean }> = ({ T, t, highlight = [], hide = [], y = CAPTION.y, single = false }) => {
  const groups = useMemo(() => captionGroups(T.words, single), [T, single]);
  if (hide.some(([a, b]) => t >= a && t < b)) return null;
  let k = -1;
  for (let i = 0; i < groups.length; i++) if (groups[i].s <= t + 0.02) k = i;
  if (k < 0) return null;
  const g = groups[k], next = groups[k + 1];
  // hold through short pauses inside a beat; clear in the gap after a beat's last word
  const until = next && next.b === g.b ? next.s : g.e + 0.18;
  if (t > until) return null;
  const hi = new Set(highlight.map(bare));
  const sc = back(seg(t, g.s - 0.02, g.s + 0.12), 2.6) * 0.18 + 0.82;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: `${y * 100}%`, display: "flex", justifyContent: "center", transform: `translateY(-50%) scale(${sc})` }}>
      <div style={{ fontFamily: CAPTION.font, fontWeight: 900, fontSize: CAPTION.size, lineHeight: 1, letterSpacing: 1, textAlign: "center", padding: "0 60px",
        WebkitTextStroke: `14px ${CAPTION.stroke}`, paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(20,12,8,0.55), 0 12px 24px rgba(0,0,0,0.35)" }}>
        {g.words.map((w, i) => (
          <span key={i} style={{ color: hi.has(bare(w.w)) ? CAPTION.hi : CAPTION.color }}>{(i ? " " : "") + w.w}</span>
        ))}
      </div>
    </div>
  );
};

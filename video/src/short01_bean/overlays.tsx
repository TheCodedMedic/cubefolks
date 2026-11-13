// Short 1 2D overlays drawn over the 3D: the hoof-tap counter, the tension meter, head arrows, the genius light bulb,
// newspapers and a scan ring. All pop with an overshoot and are timed from timing.ts.
import React from "react";
import { back, c01, seg } from "../kit/core";
import { H, W } from "../kit/Pop";

const FONT = "Montserrat, sans-serif";
const ink = "#1b1410";

/** Big round counter: the number of taps landed so far, bumping on every tap. */
export const TapCounter: React.FC<{ t: number; taps: number[]; x?: number; y?: number; wrongAfter?: number; color?: string; scale?: number }> = ({ t, taps, x = 0.5, y = 0.22, wrongAfter, color = "#ffd84a", scale = 1 }) => {
  if (t < taps[0] - 0.12) return null;
  const n = taps.filter((k) => t >= k).length;
  const last = n ? taps[n - 1] : taps[0];
  const bump = n ? 1 + 0.35 * (1 - seg(t, last, last + 0.16)) : back(seg(t, taps[0] - 0.12, taps[0]), 2.4) * 0.7;
  const wrong = wrongAfter !== undefined && t >= wrongAfter;
  const s = scale * bump;
  return (
    <div style={{ position: "absolute", left: x * W, top: y * H, transform: `translate(-50%,-50%) scale(${s})` }}>
      <div style={{ width: 250, height: 250, borderRadius: "50%", background: wrong ? "#e2403a" : color, border: `12px solid ${ink}`, boxShadow: `0 14px 0 ${ink}, 0 26px 40px rgba(0,0,0,0.35)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        <svg width={70} height={46} viewBox="0 0 70 46" style={{ marginTop: 6 }}>
          <path d="M10 44 C2 22 14 4 35 4 C56 4 68 22 60 44" stroke={ink} strokeWidth={11} fill="none" strokeLinecap="round" />
        </svg>
        <div style={{ fontWeight: 900, fontSize: 130, lineHeight: 0.9, color: ink }}>{n}</div>
      </div>
    </div>
  );
};

/** A vertical tension gauge: level 0..1 fills green → red, shakes near the top. */
export const TensionMeter: React.FC<{ t: number; t0: number; t1: number; level: number; x?: number; y?: number }> = ({ t, t0, t1, level, x = 0.86, y = 0.32 }) => {
  if (t < t0 || t > t1 + 0.15) return null;
  const k = back(seg(t, t0, t0 + 0.25), 2.2) * (1 - seg(t, t1, t1 + 0.15));
  const L = c01(level), shake = L > 0.7 ? Math.sin(t * 60) * 6 * (L - 0.7) / 0.3 : 0;
  const col = L < 0.4 ? "#4fcf6a" : L < 0.75 ? "#f2b632" : "#e8403a";
  return (
    <div style={{ position: "absolute", left: x * W + shake, top: y * H, transform: `translate(-50%,-50%) scale(${k})`, display: "flex", flexDirection: "column", alignItems: "center", fontFamily: FONT }}>
      <div style={{ fontWeight: 900, fontSize: 42, color: "#fff", WebkitTextStroke: `8px ${ink}`, paintOrder: "stroke fill", marginBottom: 12, letterSpacing: 2 }}>TENSION</div>
      <div style={{ position: "relative", width: 96, height: 480, borderRadius: 48, background: "#fbf6ea", border: `10px solid ${ink}`, overflow: "hidden", boxShadow: `0 12px 0 ${ink}` }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${L * 100}%`, background: col, transition: "none" }} />
        {[0.25, 0.5, 0.75].map((m) => <div key={m} style={{ position: "absolute", left: 0, width: 40, bottom: `${m * 100}%`, height: 8, background: ink }} />)}
      </div>
    </div>
  );
};

/** A bouncing arrow at a screen point (up or down). */
export const Arrow: React.FC<{ t: number; t0: number; t1?: number; x: number; y: number; dir: "up" | "down"; color?: string; size?: number }> = ({ t, t0, t1 = Infinity, x, y, dir, color = "#ffd84a", size = 1 }) => {
  if (t < t0 || t > t1 + 0.12) return null;
  const k = back(seg(t, t0, t0 + 0.2), 2.4) * (1 - seg(t, t1, t1 + 0.12)) * size;
  const bob = Math.sin((t - t0) * 12) * 12 * (dir === "up" ? -1 : 1);
  return (
    <div style={{ position: "absolute", left: x * W, top: y * H + bob, transform: `translate(-50%,-50%) scale(${k}) rotate(${dir === "up" ? 0 : 180}deg)` }}>
      <svg width={110} height={130} viewBox="0 0 110 130" style={{ overflow: "visible", filter: `drop-shadow(0 8px 0 ${ink})` }}>
        <path d="M55 6 L104 62 L74 62 L74 124 L36 124 L36 62 L6 62 Z" fill={color} stroke={ink} strokeWidth={10} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** The genius light bulb over Hans's head: glows, then bursts into a puff at `pop`. */
export const Bulb: React.FC<{ t: number; t0: number; pop: number; x: number; y: number }> = ({ t, t0, pop, x, y }) => {
  if (t < t0 || t > pop + 0.6) return null;
  const k = back(seg(t, t0, t0 + 0.22), 2.4);
  if (t >= pop) {
    const u = seg(t, pop, pop + 0.6);
    return (
      <div style={{ position: "absolute", left: x * W, top: y * H, transform: "translate(-50%,-50%)" }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const a = (i / 7) * Math.PI * 2, r = 40 + 140 * u;
          return <div key={i} style={{ position: "absolute", left: Math.cos(a) * r - 40, top: Math.sin(a) * r - 40, width: 80, height: 80, borderRadius: "50%", background: "#eee8f0", opacity: 1 - u, transform: `scale(${1 - 0.5 * u})` }} />;
        })}
      </div>
    );
  }
  const glow = 0.6 + 0.4 * Math.sin(t * 14);
  return (
    <div style={{ position: "absolute", left: x * W, top: y * H, transform: `translate(-50%,-50%) scale(${k})` }}>
      <svg width={220} height={280} viewBox="0 0 220 280" style={{ overflow: "visible" }}>
        <circle cx={110} cy={100} r={120} fill={`rgba(255,230,120,${0.35 * glow})`} />
        <path d="M110 10 C50 10 20 60 40 110 C52 140 74 150 76 186 L144 186 C146 150 168 140 180 110 C200 60 170 10 110 10 Z" fill="#ffe36a" stroke={ink} strokeWidth={12} />
        <rect x={76} y={194} width={68} height={22} rx={6} fill="#b8b8c0" stroke={ink} strokeWidth={10} />
        <rect x={84} y={220} width={52} height={22} rx={6} fill="#b8b8c0" stroke={ink} strokeWidth={10} />
        <path d="M86 150 L96 100 L110 130 L124 100 L134 150" fill="none" stroke="#e8902a" strokeWidth={8} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** A 1904 newspaper flying in. */
export const Paper: React.FC<{ t: number; t0: number; t1: number; x: number; y: number; rot: number; head: string; sub: string }> = ({ t, t0, t1, x, y, rot, head, sub }) => {
  if (t < t0 || t > t1 + 0.12) return null;
  const u = seg(t, t0, t0 + 0.3), k = back(u, 1.8) * (1 - seg(t, t1, t1 + 0.12));
  const spin = (1 - u) * 300;
  return (
    <div style={{ position: "absolute", left: x * W, top: y * H, transform: `translate(-50%,-50%) rotate(${rot + spin}deg) scale(${k})` }}>
      <div style={{ width: 520, background: "#f2ead2", border: `6px solid ${ink}`, padding: "16px 22px", boxShadow: "0 22px 40px rgba(0,0,0,0.4)", fontFamily: FONT, color: ink }}>
        <div style={{ fontWeight: 900, fontSize: 30, letterSpacing: 6, textAlign: "center", borderBottom: `4px solid ${ink}`, paddingBottom: 6 }}>THE DAILY HERALD · 1904</div>
        <div style={{ fontWeight: 900, fontSize: 66, lineHeight: 1.0, textAlign: "center", margin: "12px 0" }}>{head}</div>
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ width: 150, height: 110, background: "#c8b890", border: `4px solid ${ink}`, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <svg width={120} height={100} viewBox="0 0 120 100"><ellipse cx={55} cy={62} rx={40} ry={18} fill={ink} /><circle cx={92} cy={34} r={18} fill={ink} /><rect x={74} y={38} width={14} height={30} fill={ink} />{[25, 40, 70, 82].map((xx) => <rect key={xx} x={xx} y={70} width={5} height={28} fill={ink} />)}</svg>
          </div>
          <div style={{ flex: 1, fontWeight: 700, fontSize: 22, lineHeight: 1.25 }}>{sub}</div>
        </div>
      </div>
    </div>
  );
};

/** A scan ring locked on a face (Hans reading people). */
export const Scan: React.FC<{ t: number; t0: number; t1: number; x: number; y: number; icon: string; color?: string }> = ({ t, t0, t1, x, y, icon, color = "#5ad8ff" }) => {
  if (t < t0 || t > t1 + 0.12) return null;
  const k = back(seg(t, t0, t0 + 0.2), 2.4) * (1 - seg(t, t1, t1 + 0.12)), spin = (t - t0) * 120;
  return (
    <div style={{ position: "absolute", left: x * W, top: y * H, transform: `translate(-50%,-50%) scale(${k})` }}>
      <svg width={260} height={260} viewBox="0 0 260 260" style={{ overflow: "visible" }}>
        <g transform={`rotate(${spin} 130 130)`}><circle cx={130} cy={130} r={110} fill="none" stroke={color} strokeWidth={10} strokeDasharray="40 22" /></g>
        <circle cx={130} cy={130} r={92} fill="none" stroke="#fff" strokeWidth={4} opacity={0.7} />
      </svg>
      <div style={{ position: "absolute", left: 200, top: -30, fontFamily: FONT, fontWeight: 900, fontSize: 70, color: "#fff", WebkitTextStroke: `10px ${ink}`, paintOrder: "stroke fill" }}>{icon}</div>
    </div>
  );
};

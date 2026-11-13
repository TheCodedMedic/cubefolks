// Short 2 2D overlays over the 3D: the tail counter racing to 20,000 / DAY, coin bursts, the "more pay, more rats"
// graph line going up, and the loop-diagram station labels. All pop with an overshoot; times come from timing.ts.
import React from "react";
import { back, c01, io, seg } from "../kit/core";
import { H, W } from "../kit/Pop";

const FONT = "Montserrat, sans-serif";
const ink = "#1b1410";
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** The tail counter: a ledger card whose number races up (eased) from 0 to `to` between t0 and tHit, then bumps. */
export const TailCounter: React.FC<{ t: number; t0: number; tHit: number; t1: number; to: number; sub?: string; tSub?: number; x?: number; y?: number; from?: number }> = ({ t, t0, tHit, t1, to, sub, tSub = Infinity, x = 0.5, y = 0.2, from = 0 }) => {
  if (t < t0 || t > t1 + 0.12) return null;
  const k = back(seg(t, t0, t0 + 0.22), 2.4) * (1 - seg(t, t1, t1 + 0.12));
  const u = seg(t, t0, tHit), v = Math.round((from + (to - from) * (1 - Math.pow(1 - u, 2.2))) / (u < 1 ? 7 : 1)) * (u < 1 ? 7 : 1);
  const n = Math.min(to, v);
  const bump = t >= tHit ? 1 + 0.25 * (1 - seg(t, tHit, tHit + 0.25)) : 1;
  const hit = t >= tHit;
  return (
    <div style={{ position: "absolute", left: x * W, top: y * H, transform: `translate(-50%,-50%) scale(${k * bump})`, fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, background: hit ? "#ffd84a" : "#fbf6e6", border: `10px solid ${ink}`, borderRadius: 30, padding: "14px 34px", boxShadow: `0 14px 0 ${ink}, 0 26px 40px rgba(0,0,0,0.35)` }}>
        <svg width={90} height={70} viewBox="0 0 90 70"><path d="M8 50 C 20 10, 40 70, 55 30 S 80 20, 84 8" stroke="#e07f95" strokeWidth={11} fill="none" strokeLinecap="round" /><path d="M8 50 C 20 10, 40 70, 55 30 S 80 20, 84 8" stroke={ink} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.3} /></svg>
        <div style={{ fontWeight: 900, fontSize: 116, color: ink, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{n.toLocaleString("en-US")}</div>
      </div>
      {sub && t >= tSub && (
        <div style={{ position: "absolute", right: -30, bottom: -70, transform: `scale(${back(seg(t, tSub, tSub + 0.2), 2.4)}) rotate(-6deg)`, background: "#e2403a", color: "#fff", fontWeight: 900, fontSize: 64, padding: "6px 22px", borderRadius: 16, border: `7px solid ${ink}` }}>{sub}</div>
      )}
    </div>
  );
};

/** A burst of copper coins flying out from (x, y) at t0. */
export const CoinBurst: React.FC<{ t: number; t0: number; x?: number; y?: number; n?: number; seed?: number }> = ({ t, t0, x = 0.5, y = 0.35, n = 14, seed = 1 }) => {
  const u = (t - t0) / 1.1;
  if (u < 0 || u > 1) return null;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2 + rnd(i + seed) * 0.5, sp = 380 + rnd(i * 3 + seed) * 420;
        const px = x * W + Math.cos(a) * sp * io(c01(u * 1.6)), py = y * H + Math.sin(a) * sp * 0.8 * io(c01(u * 1.6)) + 900 * u * u;
        const sc = 1 - 0.3 * u, spin = Math.cos(t * 14 + i);
        return (
          <div key={i} style={{ position: "absolute", left: px, top: py, transform: `translate(-50%,-50%) scale(${sc * Math.max(0.15, Math.abs(spin))}, ${sc})`, opacity: 1 - seg(u, 0.75, 1) }}>
            <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#d48a3a", border: `7px solid ${ink}`, boxShadow: "inset 0 -10px 0 #a8642a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontWeight: 900, fontSize: 44, color: "#7a3a10" }}>1¢</div>
          </div>
        );
      })}
    </>
  );
};

/** A chart card: PAY across, RATS up; the line draws itself upward from t0 (with an arrow head). */
export const GraphUp: React.FC<{ t: number; t0: number; t1: number; x?: number; y?: number }> = ({ t, t0, t1, x = 0.5, y = 0.24 }) => {
  if (t < t0 - 0.05 || t > t1 + 0.12) return null;
  const k = back(seg(t, t0 - 0.05, t0 + 0.17), 2.2) * (1 - seg(t, t1, t1 + 0.12));
  const u = io(seg(t, t0 + 0.1, t0 + 0.9));
  const pts = Array.from({ length: 21 }, (_, i) => { const v = (i / 20) * u; return [70 + v * 460, 330 - (v * 0.15 + v * v * 0.85) * 270 + Math.sin(v * 30) * 6]; });
  const last = pts[pts.length - 1], prev = pts[pts.length - 3] ?? pts[0], ang = Math.atan2(last[1] - prev[1], last[0] - prev[0]);
  return (
    <div style={{ position: "absolute", left: x * W, top: y * H, transform: `translate(-50%,-50%) scale(${k})` }}>
      <svg width={620} height={420} viewBox="0 0 620 420" style={{ overflow: "visible" }}>
        <rect x={6} y={6} width={608} height={408} rx={30} fill="#fbf6e6" stroke={ink} strokeWidth={10} />
        <path d="M70 40 L70 340 L580 340" stroke={ink} strokeWidth={10} fill="none" strokeLinecap="round" />
        <text x={84} y={62} fontFamily={FONT} fontWeight={900} fontSize={40} fill={ink}>RATS</text>
        <text x={430} y={392} fontFamily={FONT} fontWeight={900} fontSize={40} fill={ink}>PAY →</text>
        <polyline points={pts.map((p) => p.join(",")).join(" ")} stroke="#e2403a" strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {u > 0.05 && <polygon points="0,-22 34,0 0,22" transform={`translate(${last[0]},${last[1]}) rotate(${(ang * 180) / Math.PI})`} fill="#e2403a" stroke={ink} strokeWidth={4} />}
      </svg>
    </div>
  );
};

/** A loop-diagram label (a rounded chip with a step number) pinned to a screen point. */
export const StationLabel: React.FC<{ t: number; t0: number; x: number; y: number; n: number; text: string; color: string; on: number }> = ({ t, t0, x, y, n, text, color, on }) => {
  if (on <= 0.01 || t < t0) return null;
  const k = back(seg(t, t0, t0 + 0.22), 2.2) * on;
  return (
    <div style={{ position: "absolute", left: x * W, top: y * H, transform: `translate(-50%,-50%) scale(${k})`, display: "flex", alignItems: "center", gap: 10, fontFamily: FONT }}>
      <div style={{ width: 66, height: 66, borderRadius: "50%", background: ink, color: "#fff", fontWeight: 900, fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</div>
      <div style={{ background: color, border: `7px solid ${ink}`, borderRadius: 20, padding: "6px 22px", fontWeight: 900, fontSize: 52, color: ink, whiteSpace: "nowrap", boxShadow: `0 8px 0 ${ink}` }}>{text}</div>
    </div>
  );
};

/** Hearts floating up from (x, y). */
export const Hearts: React.FC<{ t: number; t0: number; x: number; y: number }> = ({ t, t0, x, y }) => {
  const u = t - t0;
  if (u < 0 || u > 1.6) return null;
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const v = u - i * 0.18; if (v < 0) return null;
        return <div key={i} style={{ position: "absolute", left: x * W + Math.sin(v * 5 + i) * 40 + (i - 1.5) * 50, top: y * H - v * 380, transform: `translate(-50%,-50%) scale(${back(c01(v * 4), 2)})`, opacity: 1 - seg(v, 1.0, 1.4), fontSize: 90, color: "#ef5b7a", WebkitTextStroke: `5px ${ink}`, fontFamily: FONT, fontWeight: 900 }}>♥</div>;
      })}
    </>
  );
};

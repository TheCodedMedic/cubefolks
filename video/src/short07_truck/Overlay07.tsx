// Short 07 pop-ins drawn over the picture: the hook's 3:00 AM digital clock (on screen from frame 0) and the on-screen
// question in the last 3 s (never spoken). Times from words (common.tsx).
import React from "react";
import { back, seg } from "../kit/core";
import { E, END, P } from "./common";

const K = (t: number, t0: number, t1: number) => back(seg(t, t0, t0 + 0.22), 2.4) * (1 - seg(t, t1, t1 + 0.12));

/** A chunky bedside digital clock: red segment digits on black, "3:00 AM", blinking colon. */
const Clock: React.FC<{ t: number }> = ({ t }) => {
  const colon = Math.floor(t * 2) % 2 === 0 ? 1 : 0.25;
  return (
    <div style={{ background: "#151517", border: "10px solid #2c2c30", borderRadius: 34, padding: "18px 44px 22px", boxShadow: "0 16px 0 #0a0a0c, 0 30px 50px rgba(0,0,0,0.5)", display: "flex", alignItems: "baseline", gap: 18 }}>
      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 168, lineHeight: 1, color: "#ff3b3b", letterSpacing: 6,
        textShadow: "0 0 24px rgba(255,40,40,0.85), 0 0 6px rgba(255,90,90,0.9)" }}>
        3<span style={{ opacity: colon }}>:</span>00
      </div>
      <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 64, color: "#ff3b3b", textShadow: "0 0 18px rgba(255,40,40,0.8)" }}>AM</div>
    </div>
  );
};

const Question: React.FC = () => (
  <div style={{ width: 900, background: "#fbf8f1", border: "8px solid #1b1410", borderRadius: 36, padding: "30px 40px", boxShadow: "0 14px 0 #1b1410",
    fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 64, lineHeight: 1.12, color: "#1b1410", textAlign: "center" }}>
    When did you figure out where the <span style={{ color: "#e0608c" }}>song</span> came from? 👀
  </div>
);

export const Overlay07: React.FC<{ t: number }> = ({ t }) => {
  // the clock: fully on screen at frame 0 (popped in "before" the video starts), out at the end of beat 1
  const t1c = P(2) - 0.15, kc = t < 0 ? 0 : (t < t1c ? 1 : 1 - seg(t, t1c, t1c + 0.12));
  // a second small pulse when the narrator says "3 a.m."
  const pulse = 1 + 0.08 * Math.sin(Math.PI * seg(t, E.three, E.three + 0.3));
  const tq = END - 3, kq = K(t, tq, END + 1);
  return (
    <>
      {kc > 0.001 && <div style={{ position: "absolute", left: 540, top: 330, transform: `translate(-50%,-50%) rotate(-3deg) scale(${kc * pulse})` }}><Clock t={t} /></div>}
      {t >= tq && <div style={{ position: "absolute", left: 540, top: 300, transform: `translate(-50%,-50%) rotate(-1.5deg) scale(${kq})` }}><Question /></div>}
    </>
  );
};

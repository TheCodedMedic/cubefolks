// Pop-in graphics on a word: chunky 3D-looking words ("+5 YEARS"), a calendar page, tally marks, a price tag, a stamp,
// big icons (?, !, check, cross). Drawn over the 3D (crisp at 1080 wide), each popping in with an overshoot at t0 and
// out at t1. Place them by frame fraction (x, y) or pin them to a 3D point with project(cam, point).
import React from "react";
import * as THREE from "three";
import { back, CamS, seg, V3 } from "./core";

export const W = 1080, H = 1920;

/** Screen position (fractions 0..1) of a world point for a camera (the Short's 1080x1920 frame). */
export const project = (cam: CamS, p: V3): [number, number] => {
  const c = new THREE.PerspectiveCamera(cam.fov, W / H, 0.05, 500);
  c.position.set(...cam.pos); c.lookAt(...cam.target);
  if (cam.roll) c.rotateZ((cam.roll * Math.PI) / 180);
  c.updateMatrixWorld(); c.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(c);
  return [(v.x + 1) / 2, (1 - v.y) / 2];
};

export type PopKind = "word" | "calendar" | "tally" | "tag" | "stamp" | "icon";
export type PopSpec = {
  kind: PopKind; t0: number; t1?: number; x: number; y: number; size?: number; rot?: number;
  text?: string; sub?: string; color?: string; color2?: string; n?: number; every?: number; icon?: "?" | "!" | "check" | "cross" | "heart";
};

const Extrude: React.FC<{ text: string; size: number; color: string; side: string; depth?: number }> = ({ text, size, color, side, depth = 12 }) => (
  <div style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: size, lineHeight: 1, color, whiteSpace: "nowrap", letterSpacing: 2,
    WebkitTextStroke: `${size * 0.06}px #1b1410`, paintOrder: "stroke fill",
    textShadow: Array.from({ length: depth }, (_, i) => `${(i + 1) * 0.6}px ${(i + 1) * 0.9}px 0 ${side}`).join(",") + `, ${depth}px ${depth * 1.6}px 18px rgba(0,0,0,0.35)` }}>
    {text}
  </div>
);

const body = (p: PopSpec, t: number): React.ReactNode => {
  const s = p.size ?? 1, c = p.color ?? "#ffd84a", c2 = p.color2 ?? "#c0392b";
  switch (p.kind) {
    case "word":
      return <Extrude text={p.text ?? ""} size={150 * s} color={c} side={p.color2 ?? "#b8860b"} />;
    case "calendar":
      return (
        <div style={{ width: 330 * s, borderRadius: 26 * s, background: "#fbf8f1", boxShadow: "0 18px 0 #cfc6b4, 0 30px 40px rgba(0,0,0,0.3)", overflow: "hidden", border: `${5 * s}px solid #1b1410`, fontFamily: "Montserrat, sans-serif" }}>
          <div style={{ background: c2, color: "#fff", fontWeight: 900, fontSize: 46 * s, textAlign: "center", padding: `${14 * s}px 0`, borderBottom: `${5 * s}px solid #1b1410` }}>{p.sub ?? "MONDAY"}</div>
          <div style={{ fontWeight: 900, fontSize: 190 * s, textAlign: "center", color: "#1b1410", lineHeight: 1.1 }}>{p.text ?? "7"}</div>
        </div>
      );
    case "tally": {
      const n = p.n ?? 5, every = p.every ?? 0.12, shown = Math.max(0, Math.min(n, Math.floor((t - p.t0) / every) + 1));
      const groups = Math.ceil(n / 5);
      return (
        <svg width={groups * 170 * s} height={180 * s} viewBox={`0 0 ${groups * 170} 180`} style={{ overflow: "visible" }}>
          {Array.from({ length: shown }, (_, i) => {
            const g = Math.floor(i / 5), k = i % 5, x0 = g * 170 + 20;
            return k < 4
              ? <line key={i} x1={x0 + k * 30} y1={20} x2={x0 + k * 30 + 4} y2={160} stroke="#fbf8f1" strokeWidth={16} strokeLinecap="round" style={{ filter: "drop-shadow(0 6px 0 #1b1410)" }} />
              : <line key={i} x1={x0 - 14} y1={130} x2={x0 + 112} y2={50} stroke="#fbf8f1" strokeWidth={16} strokeLinecap="round" style={{ filter: "drop-shadow(0 6px 0 #1b1410)" }} />;
          })}
        </svg>
      );
    }
    case "tag":
      return (
        <div style={{ position: "relative", display: "flex", alignItems: "center", background: c, padding: `${18 * s}px ${40 * s}px ${18 * s}px ${74 * s}px`, borderRadius: `${20 * s}px`, clipPath: "polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 50%)", fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 92 * s, color: "#1b1410", boxShadow: "inset 0 -10px 0 rgba(0,0,0,0.15)" }}>
          <div style={{ position: "absolute", left: 34 * s, width: 22 * s, height: 22 * s, borderRadius: "50%", background: "#1b1410" }} />
          {p.text}
        </div>
      );
    case "stamp":
      return (
        <div style={{ border: `${12 * s}px solid ${c2}`, borderRadius: 20 * s, padding: `${8 * s}px ${36 * s}px`, color: c2, fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: 110 * s, letterSpacing: 6, opacity: 0.92, mixBlendMode: "multiply" }}>{p.text}</div>
      );
    case "icon": {
      const ic = p.icon ?? "?";
      if (ic === "?" || ic === "!") return <Extrude text={ic} size={260 * s} color={c} side={p.color2 ?? "#b8860b"} depth={16} />;
      const path = ic === "check" ? "M30 95 L80 145 L170 45" : ic === "cross" ? "M45 45 L155 155 M155 45 L45 155" : "M100 170 C20 110 20 40 70 40 C90 40 100 60 100 70 C100 60 110 40 130 40 C180 40 180 110 100 170 Z";
      const col = ic === "check" ? "#3fbf5f" : ic === "cross" ? "#e2403a" : "#ef5b7a";
      return (
        <svg width={220 * s} height={220 * s} viewBox="0 0 200 200" style={{ overflow: "visible", filter: "drop-shadow(0 10px 0 #1b1410)" }}>
          {ic === "heart" ? <path d={path} fill={col} stroke="#1b1410" strokeWidth={10} /> : <>
            <path d={path} stroke="#1b1410" strokeWidth={46} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d={path} stroke={col} strokeWidth={30} fill="none" strokeLinecap="round" strokeLinejoin="round" /></>}
        </svg>
      );
    }
  }
};

/** Draw the pops in force at t (put inside the Short's frame, over the 3D). */
export const Pops: React.FC<{ pops: PopSpec[]; t: number }> = ({ pops, t }) => (
  <>
    {pops.filter((p) => t >= p.t0 && t < (p.t1 ?? Infinity) + 0.12).map((p, i) => {
      const k = back(seg(t, p.t0, p.t0 + 0.22), 2.4) * (1 - seg(t, p.t1 ?? Infinity, (p.t1 ?? Infinity) + 0.12));
      const wob = Math.sin((t - p.t0) * 5) * 1.5;
      return (
        <div key={i} style={{ position: "absolute", left: p.x * W, top: p.y * H, transform: `translate(-50%,-50%) rotate(${(p.rot ?? 0) + wob}deg) scale(${k})` }}>
          {body(p, t)}
        </div>
      );
    })}
  </>
);

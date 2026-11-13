// Episode 16: the floating BALANCE TAG over a person's head: one look for the whole film (every builder uses this, never a copy).
// A clean rounded pill, like a phone notification, glowing softly: green when the balance is positive, red when negative, white digits,
// a small "$". It sits just above the head, scales with distance (but never below a size readable at phone size), and can TICK from one
// amount to another (the digits roll, a soft flash on each change).
// Use it in a shot's `dom(t, cam)`: <BalanceTags cam={cam} tags={[{ p: headTop, amount: ..., from?, t0?, t1? }]} t={t} />
// where `p` is the WORLD position of the top of the head (add ~0.25 m above it yourself if the person wears a hat).
import React from "react";
import * as THREE from "three";
import { CamS, c01, seg } from "./core";
import { V3 } from "../ep04/Vfx";

const W = 1920, H = 1080;
/** Project a world point through a CamS to screen pixels (x, y) and depth (metres in front of the camera; <= 0 = behind). */
export const project = (cam: CamS, p: V3): { x: number; y: number; d: number } => {
  const c = new THREE.PerspectiveCamera(cam.fov, W / H, 0.05, 2000);
  c.position.set(...cam.pos); c.up.set(0, 1, 0); c.lookAt(...cam.target);
  if (cam.roll) c.rotateZ((cam.roll * Math.PI) / 180);
  c.updateMatrixWorld(); c.updateProjectionMatrix();
  const v = new THREE.Vector3(...p), d = v.clone().applyMatrix4(c.matrixWorldInverse).z * -1;
  v.project(c);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, d };
};

/** "$1,214,880.00" style, with the sign in front: −$11,640.00 */
export const money = (a: number, cents = true) => {
  const s = Math.abs(a).toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
  return `${a < 0 ? "−" : ""}$${s}`;
};

export type Tag = { p: V3; amount: number; from?: number; t0?: number; t1?: number; cents?: boolean; scale?: number; show?: number };

/** One tag. `from`→`amount` ticks between t0 and t1 (eased, stepping like a counter). `show` 0..1 fades it in or out. */
export const BalanceTag: React.FC<{ cam: CamS; tag: Tag; t: number }> = ({ cam, tag, t }) => {
  const { p, amount, from, t0 = 0, t1 = 0, cents = true, scale = 1, show = 1 } = tag;
  const pr = project(cam, p);
  if (pr.d <= 0.2 || show <= 0.01) return null;
  const u = from === undefined || t1 <= t0 ? 1 : c01(seg(t, t0, t1));
  const val = from === undefined ? amount : from + (amount - from) * (1 - Math.pow(1 - u, 2));
  const shown = Math.round(val * (cents ? 100 : 1)) / (cents ? 100 : 1);
  const ticking = from !== undefined && u > 0 && u < 1;
  const neg = shown < 0;
  const px = Math.max(26, Math.min(64, (58 * scale * 3.2) / Math.max(0.6, pr.d)));      // font size: readable at phone size, never huge
  const col = neg ? "#FF4D5A" : "#3BE38A", glow = neg ? "rgba(255,60,80,0.55)" : "rgba(40,230,140,0.5)";
  return (
    <div style={{ position: "absolute", left: pr.x, top: pr.y, transform: `translate(-50%, -100%) scale(${ticking ? 1.06 : 1})`, opacity: show,
      padding: `${px * 0.18}px ${px * 0.5}px`, borderRadius: px, background: "rgba(10,14,26,0.82)", border: `${Math.max(2, px * 0.06)}px solid ${col}`,
      boxShadow: `0 0 ${px * 0.6}px ${glow}, 0 ${px * 0.12}px ${px * 0.3}px rgba(0,0,0,0.6)`, color: "#fff", whiteSpace: "nowrap",
      font: `800 ${px}px Montserrat, sans-serif`, letterSpacing: 0.5, fontVariantNumeric: "tabular-nums" }}>
      <span style={{ color: col }}>{neg ? "▼ " : "▲ "}</span>{money(shown, cents)}
    </div>
  );
};

/** Many tags at once (crowds): pass every visible head; tags behind the camera or too far (d > maxD) are skipped. */
export const BalanceTags: React.FC<{ cam: CamS; tags: Tag[]; t: number; maxD?: number }> = ({ cam, tags, t, maxD = 60 }) => (
  <>{tags.filter((g) => { const d = project(cam, g.p).d; return d > 0.2 && d < maxD; }).map((g, i) => <BalanceTag key={i} cam={cam} tag={g} t={t} />)}</>
);

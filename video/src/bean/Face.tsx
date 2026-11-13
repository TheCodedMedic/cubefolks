// Beanfolk face kit, v1: faces drawn on a canvas texture that wraps the front of the head (a sphere patch).
// The canvas is laid out in angle units (P pixels per radian of the head sphere), so a circle on the canvas reads as
// a circle on the head, and profile/back views show the face really turning away (true angles, no billboards).
//
// An expression is { eyes, brows, mouth, extras, look }. Presets are in EXPR. One texture per distinct
// expression+skin+brow colour is cached, so a crowd of identical faces costs one texture.
import React, { useMemo } from "react";
import * as THREE from "three";

export type Eyes = "open" | "happy" | "smug" | "tired" | "wide" | "squint" | "closed" | "wink" | "angry" | "sad" | "blink" | "half";
export type Brows = "none" | "neutral" | "raised" | "worried" | "angry" | "oneUp" | "sad";
export type Mouth =
  | "smile" | "grin" | "smirk" | "flat" | "frown" | "wobbly" | "o" | "gritted" | "laugh" | "pout" | "tongue" | "small"
  | "talkA" | "talkE" | "talkO" | "talkM";
export type Extra = "tears" | "streams" | "sweat" | "blush" | "vein" | "sparkles" | "bags" | "red";
export type Expr = { eyes: Eyes; brows: Brows; mouth: Mouth; extras?: Extra[]; look?: [number, number] };

// the twelve sheet expressions (and the vocabulary scripts pick from)
export const EXPR: Record<string, Expr> = {
  neutral: { eyes: "open", brows: "neutral", mouth: "small" },
  happy: { eyes: "happy", brows: "raised", mouth: "grin" },
  laugh: { eyes: "happy", brows: "raised", mouth: "laugh", extras: ["tears"] },
  smug: { eyes: "smug", brows: "oneUp", mouth: "smirk", look: [0.5, 0] },
  shock: { eyes: "wide", brows: "raised", mouth: "o" },
  worried: { eyes: "open", brows: "worried", mouth: "wobbly", extras: ["sweat"], look: [-0.4, 0.2] },
  sad: { eyes: "sad", brows: "sad", mouth: "frown", extras: ["streams"], look: [0, 0.4] },
  angry: { eyes: "angry", brows: "angry", mouth: "gritted", extras: ["vein"] },
  shy: { eyes: "open", brows: "worried", mouth: "pout", extras: ["blush"], look: [0.6, 0.35] },
  sleepy: { eyes: "closed", brows: "neutral", mouth: "o", look: [0, 0] },
  suspicious: { eyes: "squint", brows: "angry", mouth: "flat", look: [-0.7, 0] },
  silly: { eyes: "wink", brows: "raised", mouth: "tongue", extras: ["sparkles"] },
};

// ---- canvas layout (angle units) ----
export const PX = 320; // pixels per radian
export const PHI_SPAN = 2.4; // horizontal span of the patch (radians, centred on the front)
export const THETA0 = 0.45; // top of the patch (radians from the top pole)
export const THETA_SPAN = 2.1; // vertical span
const W = Math.round(PHI_SPAN * PX), H = Math.round(THETA_SPAN * PX);
const CX = W / 2, CY = (Math.PI / 2 - THETA0) * PX; // canvas point at the front of the head, on the equator
const r = (rad: number) => rad * PX;
// face geometry (radians on the head): shared with Bean3D for the nose and glasses
export const FACE = { eyeDx: 0.4, eyeY: -0.08, eyeRx: 0.215, eyeRy: 0.265, mouthY: 0.5, noseY: 0.2 };

const INK = "#2b1a12";
const shade = (hex: string, k: number) => {
  const c = new THREE.Color(hex);
  c.multiplyScalar(k);
  return "#" + c.getHexString();
};

type Opts = { skin: string; brow: string; moustache?: string };

function eye(ctx: CanvasRenderingContext2D, side: -1 | 1, e: Expr, o: Opts) {
  const ex = CX + side * r(FACE.eyeDx), ey = CY + r(FACE.eyeY);
  let rx = r(FACE.eyeRx), ry = r(FACE.eyeRy);
  const [lx, ly] = e.look ?? [0, 0];
  let kind = e.eyes;
  if (kind === "wink") kind = side === 1 ? "happy" : "open";
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (kind === "blink") {
    // lids shut mid-blink: a gently curved lash line where the eye was
    ctx.strokeStyle = INK; ctx.lineWidth = r(0.05);
    ctx.beginPath(); ctx.moveTo(ex - rx * 0.95, ey + ry * 0.1); ctx.quadraticCurveTo(ex, ey + ry * 0.4, ex + rx * 0.95, ey + ry * 0.1); ctx.stroke();
    return;
  }
  if (kind === "happy" || kind === "closed") {
    // arcs: ^ (happy) or a sleeping curve
    ctx.strokeStyle = INK; ctx.lineWidth = r(0.06);
    ctx.beginPath();
    if (kind === "happy") ctx.arc(ex, ey + ry * 0.35, rx * 0.85, Math.PI * 1.15, Math.PI * 1.85);
    else ctx.arc(ex, ey - ry * 0.05, rx * 0.8, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    return;
  }
  if (kind === "wide") { rx *= 1.12; ry *= 1.12; }
  // white (no glow inside the clip: a shadowed fill under a clip dropped whole eyes on darker skin)
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0)"; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#fffdf8"; ctx.fill();
  ctx.clip();
  if ((e.extras ?? []).includes("red")) {
    // bloodshot (Short 5): a pink wash and little red veins from the corners
    ctx.fillStyle = "rgba(255,120,120,0.22)"; ctx.fillRect(ex - rx, ey - ry, 2 * rx, 2 * ry);
    ctx.strokeStyle = "#d8283a"; ctx.lineWidth = r(0.012); ctx.lineCap = "round";
    for (const [a, l] of [[0.1, 0.7], [-0.25, 0.6], [0.45, 0.55], [Math.PI - 0.1, 0.7], [Math.PI + 0.3, 0.6], [Math.PI - 0.5, 0.5]] as const) {
      const x0 = ex + Math.cos(a) * rx, y0 = ey + Math.sin(a) * ry, x1 = ex + Math.cos(a) * rx * (1 - l), y1 = ey + Math.sin(a) * ry * (1 - l);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + r(0.02), (y0 + y1) / 2 - r(0.02), x1, y1); ctx.stroke();
    }
  }
  // pupil
  const pr = kind === "wide" ? rx * 0.26 : rx * 0.56;
  const px = ex + lx * (rx - pr - r(0.015)), py = ey + ly * (ry - pr - r(0.015)) + (kind === "sad" ? ry * 0.12 : 0);
  ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fillStyle = "#17100c"; ctx.fill();
  ctx.beginPath(); ctx.arc(px - pr * 0.35, py - pr * 0.38, pr * 0.3, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill();
  if (kind !== "wide") { ctx.beginPath(); ctx.arc(px + pr * 0.32, py + pr * 0.36, pr * 0.12, 0, Math.PI * 2); ctx.fill(); }
  // lids (skin), drawn inside the eye clip
  const lid = (topFrac: number, slant: number, bottom = 0) => {
    ctx.fillStyle = shade(o.skin, 0.93);
    if (topFrac > 0) {
      const yl = ey - ry + topFrac * 2 * ry;
      ctx.beginPath();
      ctx.moveTo(ex - rx - 5, ey - ry - 5); ctx.lineTo(ex + rx + 5, ey - ry - 5);
      ctx.lineTo(ex + rx + 5, yl - side * slant * ry); ctx.lineTo(ex - rx - 5, yl + side * slant * ry);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = r(0.03);
      ctx.beginPath(); ctx.moveTo(ex - rx - 5, yl + side * slant * ry); ctx.lineTo(ex + rx + 5, yl - side * slant * ry); ctx.stroke();
    }
    if (bottom > 0) {
      const yb = ey + ry - bottom * 2 * ry;
      ctx.beginPath(); ctx.rect(ex - rx - 5, yb, 2 * rx + 10, ry + 10); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = r(0.025);
      ctx.beginPath(); ctx.moveTo(ex - rx - 5, yb); ctx.lineTo(ex + rx + 5, yb); ctx.stroke();
    }
  };
  if (kind === "smug") lid(0.5, 0);
  if (kind === "half") lid(0.62, 0);
  if (kind === "tired") lid(0.55, 0, 0.12);
  if (kind === "squint") lid(0.4, 0, 0.3);
  if (kind === "angry") lid(0.32, -0.28); // lid lower toward the nose
  if (kind === "sad") lid(0.3, 0.25); // lid lower toward the ear
  ctx.restore();
  ctx.strokeStyle = INK; ctx.lineWidth = r(0.034);
  ctx.beginPath(); ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
}

function brow(ctx: CanvasRenderingContext2D, side: -1 | 1, e: Expr, o: Opts) {
  if (e.brows === "none") return;
  const ex = CX + side * r(FACE.eyeDx), base = CY + r(FACE.eyeY - FACE.eyeRy - 0.1);
  const half = r(FACE.eyeRx * 0.95);
  // inner end (toward the nose) and outer end heights, + = up (radians)
  const shapes: Record<string, [number, number]> = {
    neutral: [0, 0], raised: [0.1, 0.1], worried: [0.1, -0.03], angry: [-0.08, 0.05], sad: [0.07, -0.06],
    oneUp: side === 1 ? [0.12, 0.14] : [-0.02, -0.01],
  };
  const [inner, outer] = shapes[e.brows];
  const xi = ex - side * half, xo = ex + side * half;
  const yi = base - r(inner), yo = base - r(outer);
  ctx.strokeStyle = o.brow; ctx.lineCap = "round"; ctx.lineWidth = r(0.068);
  ctx.beginPath(); ctx.moveTo(xi, yi);
  ctx.quadraticCurveTo((xi + xo) / 2, (yi + yo) / 2 - r(0.035), xo, yo); ctx.stroke();
}

function mouth(ctx: CanvasRenderingContext2D, e: Expr) {
  const r = (a: number) => a * PX * 1.4;
  const mx = CX, my = CY + FACE.mouthY * PX;
  const w = r(0.17);
  ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = INK; ctx.lineWidth = r(0.04);
  const dark = "#5a1a1c", tongue = "#e5707a", teeth = "#fffdf6";
  const open = (top: number, bot: number, hw: number, withTeeth: boolean, withTongue: boolean) => {
    // a D-shaped open mouth: top edge curve, bottom deeper curve
    ctx.beginPath();
    ctx.moveTo(mx - hw, my + top);
    ctx.quadraticCurveTo(mx, my + top + r(0.03), mx + hw, my + top);
    ctx.quadraticCurveTo(mx + hw * 0.8, my + bot, mx, my + bot);
    ctx.quadraticCurveTo(mx - hw * 0.8, my + bot, mx - hw, my + top);
    ctx.closePath();
    ctx.fillStyle = dark; ctx.fill();
    ctx.save(); ctx.clip();
    if (withTeeth) { ctx.fillStyle = teeth; ctx.fillRect(mx - hw, my + top - 5, hw * 2, (bot - top) * 0.32 + 5); }
    if (withTongue) { ctx.fillStyle = tongue; ctx.beginPath(); ctx.ellipse(mx, my + bot, hw * 0.55, (bot - top) * 0.45, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    ctx.stroke();
  };
  switch (e.mouth) {
    case "smile": ctx.beginPath(); ctx.arc(mx, my - r(0.1), r(0.15), Math.PI * 0.2, Math.PI * 0.8); ctx.stroke(); break;
    case "small": ctx.beginPath(); ctx.arc(mx, my - r(0.06), r(0.08), Math.PI * 0.25, Math.PI * 0.75); ctx.stroke(); break;
    case "grin": open(-r(0.03), r(0.13), w, true, false); break;
    case "laugh": open(-r(0.05), r(0.2), w * 1.05, true, true); break;
    case "smirk":
      ctx.beginPath(); ctx.moveTo(mx - r(0.1), my + r(0.01));
      ctx.quadraticCurveTo(mx + r(0.04), my + r(0.05), mx + r(0.14), my - r(0.06)); ctx.stroke(); break;
    case "flat": ctx.beginPath(); ctx.moveTo(mx - r(0.09), my); ctx.lineTo(mx + r(0.09), my); ctx.stroke(); break;
    case "frown": ctx.beginPath(); ctx.arc(mx, my + r(0.13), r(0.13), Math.PI * 1.22, Math.PI * 1.78); ctx.stroke(); break;
    case "wobbly": {
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const u = i / 24, x = mx - r(0.13) + u * r(0.26), y = my + Math.sin(u * Math.PI * 3) * r(0.025);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke(); break;
    }
    case "o": ctx.beginPath(); ctx.ellipse(mx, my + r(0.03), r(0.06), r(0.08), 0, 0, Math.PI * 2); ctx.fillStyle = dark; ctx.fill(); ctx.stroke(); break;
    case "gritted": {
      const hw = r(0.15), hh = r(0.065);
      ctx.beginPath(); ctx.roundRect(mx - hw, my - hh, hw * 2, hh * 2, r(0.04)); ctx.fillStyle = teeth; ctx.fill();
      ctx.save(); ctx.clip(); ctx.lineWidth = r(0.018);
      ctx.beginPath(); ctx.moveTo(mx - hw, my); ctx.lineTo(mx + hw, my);
      for (let k = -2; k <= 2; k++) { ctx.moveTo(mx + k * hw * 0.38, my - hh); ctx.lineTo(mx + k * hw * 0.38, my + hh); }
      ctx.stroke(); ctx.restore();
      ctx.lineWidth = r(0.035); ctx.beginPath(); ctx.roundRect(mx - hw, my - hh, hw * 2, hh * 2, r(0.04)); ctx.stroke(); break;
    }
    case "pout":
      ctx.beginPath(); ctx.moveTo(mx - r(0.05), my + r(0.01));
      ctx.quadraticCurveTo(mx - r(0.025), my - r(0.04), mx, my); ctx.quadraticCurveTo(mx + r(0.025), my - r(0.04), mx + r(0.05), my + r(0.01));
      ctx.stroke(); break;
    case "tongue":
      ctx.beginPath(); ctx.arc(mx, my - r(0.1), r(0.15), Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx + r(0.0), my + r(0.04)); ctx.lineTo(mx + r(0.1), my + r(0.035));
      ctx.lineTo(mx + r(0.1), my + r(0.1)); ctx.arc(mx + r(0.05), my + r(0.1), r(0.05), 0, Math.PI); ctx.closePath();
      ctx.fillStyle = tongue; ctx.fill(); ctx.lineWidth = r(0.03); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(mx + r(0.05), my + r(0.06)); ctx.lineTo(mx + r(0.05), my + r(0.11)); ctx.lineWidth = r(0.015); ctx.stroke();
      break;
    case "talkA": open(-r(0.02), r(0.14), r(0.1), false, true); break;
    case "talkE": open(-r(0.02), r(0.07), r(0.14), true, false); break;
    case "talkO": ctx.beginPath(); ctx.ellipse(mx, my + r(0.03), r(0.07), r(0.09), 0, 0, Math.PI * 2); ctx.fillStyle = dark; ctx.fill(); ctx.stroke(); break;
    case "talkM": ctx.beginPath(); ctx.moveTo(mx - r(0.08), my + r(0.01)); ctx.quadraticCurveTo(mx, my - r(0.02), mx + r(0.08), my + r(0.01)); ctx.stroke(); break;
  }
}

function extras(ctx: CanvasRenderingContext2D, e: Expr) {
  const ex = e.extras ?? [];
  const ey = CY + r(FACE.eyeY);
  for (const k of ex) {
    if (k === "blush") {
      for (const s of [-1, 1]) {
        ctx.fillStyle = "rgba(240,96,110,0.55)";
        ctx.beginPath(); ctx.ellipse(CX + s * r(0.56), CY + r(0.3), r(0.13), r(0.07), 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(200,60,80,0.7)"; ctx.lineWidth = r(0.012);
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(CX + s * r(0.56) + i * r(0.05) - r(0.015), CY + r(0.33)); ctx.lineTo(CX + s * r(0.56) + i * r(0.05) + r(0.015), CY + r(0.27)); ctx.stroke(); }
      }
    }
    if (k === "bags") {
      // dark tired circles under the eyes (Short 5): two soft violet-grey crescents
      for (const sd of [-1, 1]) {
        const bx = CX + sd * r(FACE.eyeDx), by = ey + r(FACE.eyeRy) * 0.78;
        ctx.fillStyle = "rgba(96,58,110,0.42)";
        ctx.beginPath(); ctx.ellipse(bx, by, r(FACE.eyeRx) * 1.08, r(0.13), 0, 0, Math.PI); ctx.fill();
        ctx.strokeStyle = "rgba(70,36,80,0.55)"; ctx.lineWidth = r(0.018);
        ctx.beginPath(); ctx.ellipse(bx, by + r(0.04), r(FACE.eyeRx) * 0.85, r(0.07), 0, 0.2, Math.PI - 0.2); ctx.stroke();
      }
    }
    if (k === "tears") {
      // happy tears: drops at the outer corners
      for (const s of [-1, 1]) drop(ctx, CX + s * r(FACE.eyeDx + FACE.eyeRx + 0.04), ey + r(0.1), r(0.055), "#7cc8f2");
    }
    if (k === "streams") {
      for (const s of [-1, 1]) {
        const x = CX + s * r(FACE.eyeDx + 0.02);
        ctx.fillStyle = "rgba(110,190,240,0.9)";
        ctx.beginPath(); ctx.roundRect(x - r(0.04), ey + r(0.18), r(0.08), r(0.5), r(0.04)); ctx.fill();
        drop(ctx, x, ey + r(0.76), r(0.05), "#6ebef0");
      }
    }
    if (k === "sweat") drop(ctx, CX + r(0.86), CY - r(0.48), r(0.09), "#8fd3f7");
    if (k === "vein") {
      const vx = CX + r(0.8), vy = CY - r(0.66);
      ctx.strokeStyle = "#d8283a"; ctx.lineWidth = r(0.035); ctx.lineCap = "round";
      // the classic cross of four curves, each bowing toward the middle
      for (const [a, b] of [[1, 1], [-1, 1], [1, -1], [-1, -1]] as const) {
        const ang = Math.atan2(-b, -a);
        ctx.beginPath(); ctx.arc(vx + a * r(0.1), vy + b * r(0.1), r(0.08), ang - 0.7, ang + 0.7); ctx.stroke();
      }
    }
    if (k === "sparkles") {
      for (const [x, y, s] of [[0.86, -0.56, 0.09], [0.98, -0.3, 0.055], [-0.88, -0.52, 0.065]]) star(ctx, CX + r(x), CY + r(y), r(s));
    }
  }
}

function drop(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, c: string) {
  ctx.fillStyle = c; ctx.strokeStyle = "#2a6b95"; ctx.lineWidth = s * 0.18;
  ctx.beginPath(); ctx.moveTo(x, y - s * 1.8);
  ctx.bezierCurveTo(x + s * 0.4, y - s * 0.9, x + s, y - s * 0.2, x + s, y + s * 0.2);
  ctx.arc(x, y + s * 0.2, s, 0, Math.PI); ctx.bezierCurveTo(x - s, y - s * 0.2, x - s * 0.4, y - s * 0.9, x, y - s * 1.8);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.beginPath(); ctx.arc(x - s * 0.35, y, s * 0.25, 0, Math.PI * 2); ctx.fill();
}
function star(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = "#ffd84a"; ctx.strokeStyle = "#a8780a"; ctx.lineWidth = s * 0.12;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? s * 0.32 : s; ctx.lineTo(x + Math.sin(a) * rr, y - Math.cos(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
}

function moustache(ctx: CanvasRenderingContext2D, c: string) {
  const r = (a: number) => a * PX * 1.2;
  const mx = CX, my = CY + FACE.noseY * PX + r(0.12);
  ctx.fillStyle = c;
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(mx, my - r(0.03));
    ctx.bezierCurveTo(mx + s * r(0.08), my - r(0.07), mx + s * r(0.2), my - r(0.04), mx + s * r(0.22), my + r(0.04));
    ctx.bezierCurveTo(mx + s * r(0.15), my + r(0.02), mx + s * r(0.07), my + r(0.05), mx, my + r(0.02));
    ctx.closePath(); ctx.fill();
  }
}

export function drawFace(ctx: CanvasRenderingContext2D, e: Expr, o: Opts) {
  ctx.clearRect(0, 0, W, H);
  // on darker skin a soft light halo keeps dark lines (mouth, brows, closed eyes) readable at phone size
  const sk = new THREE.Color(o.skin), lum = 0.2126 * sk.r + 0.7152 * sk.g + 0.0722 * sk.b; // linear
  if (lum < 0.3) { ctx.shadowColor = "rgba(255,226,200,0.85)"; ctx.shadowBlur = r(0.035) * (lum < 0.12 ? 1.5 : 1); }
  extras(ctx, { ...e, extras: (e.extras ?? []).filter((k) => k === "blush" || k === "bags") });
  for (const s of [-1, 1] as const) eye(ctx, s, e, o);
  for (const s of [-1, 1] as const) brow(ctx, s, e, o);
  mouth(ctx, e);
  if (o.moustache) moustache(ctx, o.moustache);
  extras(ctx, { ...e, extras: (e.extras ?? []).filter((k) => k !== "blush" && k !== "bags") });
}

const CACHE = new Map<string, THREE.CanvasTexture>();
export function faceTexture(e: Expr, o: Opts): THREE.CanvasTexture {
  const key = JSON.stringify([e, o]);
  let t = CACHE.get(key);
  if (!t) {
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    drawFace(c.getContext("2d")!, e, o);
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    CACHE.set(key, t);
  }
  return t;
}

// the face patch: a sphere cap just outside the head, carrying the face texture
export const FacePatch: React.FC<{ R: number; expr: Expr; skin: string; brow: string; moustache?: string }> = ({ R, expr, skin, brow, moustache }) => {
  const map = useMemo(() => faceTexture(expr, { skin, brow, moustache }), [JSON.stringify(expr), skin, brow, moustache]);
  return (
    <mesh renderOrder={2}>
      <sphereGeometry args={[R * 1.006, 64, 48, Math.PI / 2 - PHI_SPAN / 2, PHI_SPAN, THETA0, THETA_SPAN]} />
      <meshStandardMaterial map={map} transparent roughness={0.7} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
};

// ---- animation (Step 2): everything is a pure function of time, so any frame renders the same ----
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/** Blink times for one character: every 2-5 s, seeded so two beans never blink together. */
export const blinkAt = (t: number, seed = 0): "open" | "half" | "blink" => {
  let k = 0, tb = 0.6 + hash(seed) * 2.0;
  while (tb + 0.2 < t && k < 400) { tb += 2 + hash(seed * 31 + k) * 3; k++; }
  const d = t - tb;
  if (d < 0 || d > 0.16) return "open";
  return d < 0.04 || d > 0.11 ? "half" : "blink";
};

/** Lip flaps while a character "speaks" between t0 and t1 (about 9 shapes a second, closing at the end).
 *  Pass `env` (0..1, e.g. the narrator's loudness at t) to follow the voice; otherwise a seeded pattern. */
export const talkAt = (t: number, t0: number, t1: number, seed = 0, env?: number): Mouth | null => {
  if (t < t0 || t > t1) return null;
  if (t1 - t < 0.07) return "talkM";
  const i = Math.floor((t - t0) * 9);
  if (env !== undefined) return env < 0.15 ? "talkM" : env < 0.4 ? "talkE" : env < 0.7 ? "talkO" : "talkA";
  return (["talkA", "talkE", "talkO", "talkA", "talkM", "talkE"] as Mouth[])[Math.floor(hash(i * 7 + seed) * 6)];
};

/** An expression track: [[time, expr], ...] sorted by time (times from at(beat, "word")); returns the one in force at t. */
export const exprAt = (track: [number, Expr][], t: number): Expr => {
  let e = track[0][1];
  for (const [tk, ex] of track) if (t >= tk) e = ex;
  return e;
};

/** The live face: an expression with blinks (open eyes only), lip flaps and a quantised look direction (keeps the
 *  texture cache small). `talk` = [t0, t1] spans when this character speaks. */
export const liveFace = (base: Expr, t: number, o: { seed?: number; talk?: [number, number][]; look?: [number, number]; env?: number } = {}): Expr => {
  let e: Expr = { ...base };
  const look = o.look ?? base.look;
  if (look) e.look = [Math.round(look[0] * 5) / 5, Math.round(look[1] * 5) / 5];
  if (e.eyes === "open" || e.eyes === "wide" || e.eyes === "sad") {
    const b = blinkAt(t, o.seed ?? 0);
    if (b !== "open") e.eyes = b;
  }
  for (const [a, b] of o.talk ?? []) {
    const m = talkAt(t, a, b, o.seed ?? 0, o.env);
    if (m) e.mouth = m;
  }
  return e;
};

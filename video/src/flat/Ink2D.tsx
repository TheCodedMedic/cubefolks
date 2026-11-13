// Inkfolk: the Beanfolk cast drawn in the second style (flat 2D characters standing in a lit 3D world), built from the
// measured spec in docs/measured_reports/characters.md (construction rules only; our own characters).
// A character is drawn on a canvas (design units 600 x 1000, soles at y = 975) and shown on a card in 3D that takes the
// scene's light and casts a real shadow. Views: front, 3/4, side (profile, facing right), back.
import React, { useMemo } from "react";
import * as THREE from "three";
import { CAST, Look, OutfitKind, SKIN } from "../bean/Bean3D";

export const INK = "#241726";
export type View = "front" | "quarter" | "side" | "back";
export type FlatExpr = "neutral" | "grin" | "laugh" | "smug" | "shock" | "nervous" | "sad" | "stern" | "whistle" | "dazed" | "pained" | "lick" | "blink" | "talk";
/** Arms: [upper, fore] absolute angles (deg) from straight down; + = outward (front/3/4) or forward (side).
 *  Legs: [hip, knee]: front = outward spread; side = hip forward + knee bend back. lift = feet off the ground (units). */
export type FlatPose = { armL: [number, number]; armR: [number, number]; legL: [number, number]; legR: [number, number]; lean?: number; tilt?: number; lift?: number; holdR?: "front" | "side"; pointR?: boolean };

export const FPOSE: Record<string, FlatPose> = {
  stand: { armL: [10, 6], armR: [10, 6], legL: [6, 0], legR: [6, 0] },
  walk: { armL: [-28, -18], armR: [26, 40], legL: [28, 8], legR: [-24, 30], lean: 4 },
  run: { armL: [-50, 40], armR: [55, 140], legL: [55, 70], legR: [-40, 60], lean: 12, tilt: -4 },
  sit: { armL: [25, 70], armR: [25, 70], legL: [88, 90], legR: [84, 88], lean: -2 },
  jump: { armL: [150, 168], armR: [150, 168], legL: [30, 0], legR: [30, 0], lift: 70, tilt: 3 },
  point: { armL: [8, 4], armR: [84, 88], legL: [8, 0], legR: [5, 0], tilt: -3, pointR: true },
  shrug: { armL: [42, 118], armR: [42, 118], legL: [7, 0], legR: [7, 0], tilt: 6 },
  cheer: { armL: [140, 160], armR: [140, 160], legL: [8, 0], legR: [8, 0] },
  hips: { armL: [38, -42], armR: [38, -42], legL: [9, 0], legR: [9, 0], tilt: -3 },
};

// ---- measured constants (design units; adult build) ----
const A = 118, B = 111, W = 2 * A, HH = 2 * B, u = W / 100;
const CX = 300, SOLE = 975;
const CHIN_TO_TORSO = 1.1 * HH, LEGS = 1.4 * HH;
const TORSO_BOT = SOLE - LEGS, CHIN = TORSO_BOT - CHIN_TO_TORSO, CY = CHIN - B;
const TW = 0.8 * W;
const W0 = 5 * u; // outline base width
const THICK = (65 * Math.PI) / 180; // thick side of the outline (light from the upper left)

const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const col = (hex: string) => new THREE.Color(hex);
const mul = (hex: string, k: [number, number, number]) => { const c = col(hex); return "#" + new THREE.Color(c.r * k[0], c.g * k[1], c.b * k[2]).getHexString(); };
const mix = (a: string, b: string, t: number) => "#" + col(a).lerp(col(b), t).getHexString();
const SH_SKIN: [number, number, number] = [0.96, 0.86, 0.84], SH_CLOTH: [number, number, number] = [0.64, 0.66, 0.74], SH_HAIR: [number, number, number] = [0.75, 0.75, 0.82];

type Blob = { cx: number; cy: number; a: number; b: number; egg: number; nTop: number; nBot: number; asym: number; rot: number; seed: number; noise?: number };
const blobPts = (o: Blob, n = 140): [number, number][] => {
  const pts: [number, number][] = [];
  const cr = Math.cos(o.rot), sr = Math.sin(o.rot);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t), e = s < 0 ? o.nTop : o.nBot;
    let X = Math.sign(c) * Math.pow(Math.abs(c), 2 / e), Y = Math.sign(s) * Math.pow(Math.abs(s), 2 / e);
    X *= (1 + o.egg * Y) * (1 + o.asym * Math.sign(X));
    const k = 1 + (o.noise ?? 0.008) * (Math.sin(2 * t + rnd(o.seed) * 6) * 0.5 + Math.sin(3 * t + rnd(o.seed + 1) * 6) * 0.3 + Math.sin(4 * t + rnd(o.seed + 2) * 6) * 0.2);
    const x = o.a * X * k, y = o.b * Y * k;
    pts.push([o.cx + x * cr - y * sr, o.cy + x * sr + y * cr]);
  }
  return pts;
};
const path = (ctx: CanvasRenderingContext2D, pts: [number, number][]) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };
/** The ink ring: thicker toward the bottom-right (shadow side), about 3:1. */
const inkRing = (ctx: CanvasRenderingContext2D, pts: [number, number][], cx: number, cy: number, w0 = W0, color = INK) => {
  const n = pts.length, outer: [number, number][] = [], inner: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i], [x0, y0] = pts[(i - 1 + n) % n], [x1, y1] = pts[(i + 1) % n];
    let nx = y1 - y0, ny = -(x1 - x0); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    if (nx * (x - cx) + ny * (y - cy) < 0) { nx = -nx; ny = -ny; }
    const w = w0 * (1 + 0.45 * Math.cos(Math.atan2(y - cy, x - cx) - THICK));
    outer.push([x + nx * w * 0.6, y + ny * w * 0.6]); inner.push([x - nx * w * 0.4, y - ny * w * 0.4]);
  }
  ctx.beginPath(); outer.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  inner.reverse().forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  ctx.fillStyle = color; ctx.fill("evenodd");
};
/** Soft crescent shading: shadow colour, then the base colour shifted toward the light and blurred, clipped to the shape. */
const shade = (ctx: CanvasRenderingContext2D, pts: [number, number][], base: string, k: [number, number, number], R: number, shift = 0.3, blur = 0.09) => {
  ctx.save(); path(ctx, pts); ctx.clip();
  ctx.fillStyle = mul(base, k); ctx.fill();
  ctx.filter = `blur(${R * blur}px)`;
  ctx.translate(-R * shift * 0.7, -R * shift * 0.7); path(ctx, pts); ctx.fillStyle = base; ctx.fill();
  ctx.restore();
};
const stroke = (ctx: CanvasRenderingContext2D, pts: [number, number][], w: number, c = INK) => {
  ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = c; ctx.lineWidth = w;
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
};
const dot = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c = INK) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = c; ctx.fill(); };
const D = Math.PI / 180;
const limb = (x: number, y: number, ang: number, len: number, side: number, sideView: boolean): [number, number] =>
  sideView ? [x + Math.sin(ang * D) * len, y + Math.cos(ang * D) * len] : [x + side * Math.sin(ang * D) * len, y + Math.cos(ang * D) * len];

// ---- faces (spec 2.5; u = 1% of the head width; + y = down) ----
function face(ctx: CanvasRenderingContext2D, e: FlatExpr, cx: number, cy: number, f: number, side: boolean, look: Look) {
  const brow = look.hair.kind === "none" ? INK : mix(look.hair.color, INK, 0.5);
  const ex = (k: -1 | 1) => (side ? cx + 27 * u : cx + 7 * u * f + k * (e === "shock" ? 12 : 13) * u);
  const eyes: (-1 | 1)[] = side ? [1] : [-1, 1];
  const mx = side ? cx + 31 * u : cx + 8 * u * f, my = cy + 20 * u;
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const lidded = (x: number) => { stroke(ctx, [[x - 9 * u, cy - 1 * u], [x + 9 * u, cy - 1 * u]], 3.8 * u); ctx.beginPath(); ctx.ellipse(x, cy - 1 * u, 7 * u, 6 * u, 0, 0, Math.PI); ctx.fillStyle = INK; ctx.fill(); };
  const dotEye = (x: number, dx = 0, dy = 0, rx = 3.8, ry = 5.5) => { ctx.beginPath(); ctx.ellipse(x + dx * u, cy + dy * u, rx * u, ry * u, 0, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill(); };
  const arc = (x: number, up: boolean, w = 8, h = 6) => { ctx.beginPath(); ctx.ellipse(x, cy + (up ? 3 : -2) * u, w * u, h * u, 0, up ? Math.PI : 0, up ? 0 : Math.PI, false); ctx.strokeStyle = INK; ctx.lineWidth = 3.8 * u; ctx.stroke(); };
  const brows = (inner: number, outer: number, oneUp = false) => eyes.forEach((k) => {
    const x = ex(k), yi = cy - 20 * u + inner * u, yo = cy - 20 * u + outer * u - (oneUp && k === 1 ? 5 * u : 0);
    const xi = side ? x - 7 * u : x - k * 8 * u, xo = side ? x + 8 * u : x + k * 9 * u;
    ctx.beginPath(); ctx.moveTo(xi, yi - 2.5 * u); ctx.lineTo(xo, yo - 1.2 * u); ctx.lineTo(xo, yo + 1.2 * u); ctx.lineTo(xi, yi + 2.5 * u); ctx.closePath();
    ctx.fillStyle = brow; ctx.fill(); ctx.strokeStyle = brow; ctx.lineWidth = 1.5 * u; ctx.stroke();
  });
  const dmouth = (w: number, h: number, teeth: boolean, tongue: boolean) => {
    ctx.beginPath(); ctx.moveTo(mx - w / 2 * u, my - 2 * u); ctx.lineTo(mx + w / 2 * u, my - 2 * u); ctx.quadraticCurveTo(mx + w / 2 * u, my + h * u, mx, my + h * u); ctx.quadraticCurveTo(mx - w / 2 * u, my + h * u, mx - w / 2 * u, my - 2 * u); ctx.closePath();
    ctx.fillStyle = "#54212a"; ctx.fill(); ctx.save(); ctx.clip();
    if (teeth) { ctx.fillStyle = "#ffffff"; ctx.fillRect(mx - w / 2 * u, my - 3 * u, w * u, 4 * u); }
    if (tongue) { ctx.fillStyle = "#e86e78"; ctx.beginPath(); ctx.ellipse(mx, my + h * u, w * 0.28 * u, h * 0.45 * u, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore(); ctx.strokeStyle = INK; ctx.lineWidth = 3.2 * u; ctx.stroke();
  };
  const dash = (w: number, tilt: number) => stroke(ctx, [[mx - w / 2 * u, my + tilt * u], [mx + w / 2 * u, my - tilt * u]], 4 * u);
  const smileArc = (w: number, h: number, frown = false) => { ctx.beginPath(); ctx.ellipse(mx, my + (frown ? h : -h * 0.3) * u, w / 2 * u, h * u, 0, frown ? Math.PI * 1.1 : Math.PI * 0.1, frown ? Math.PI * 1.9 : Math.PI * 0.9); ctx.strokeStyle = INK; ctx.lineWidth = 4 * u; ctx.stroke(); };
  const O = (w: number, h: number, dx = 0) => { ctx.beginPath(); ctx.ellipse(mx + dx * u, my + 2 * u, w / 2 * u, h / 2 * u, 0, 0, Math.PI * 2); ctx.fillStyle = "#54212a"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3.2 * u; ctx.stroke(); };
  const drop = (x: number, y: number, s: number) => { ctx.beginPath(); ctx.moveTo(x, y - s * 1.7); ctx.quadraticCurveTo(x + s, y - s * 0.2, x + s, y + s * 0.2); ctx.arc(x, y + s * 0.2, s, 0, Math.PI); ctx.quadraticCurveTo(x - s, y - s * 0.2, x, y - s * 1.7); ctx.fillStyle = "#9fd4ff"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2 * u; ctx.stroke(); };
  switch (e) {
    case "neutral": case "talk": eyes.forEach((k) => lidded(ex(k))); brows(0, -1, look.name.length % 2 === 0); e === "talk" ? dmouth(16, 7, false, true) : dash(11, 0.8); break;
    case "blink": eyes.forEach((k) => stroke(ctx, [[ex(k) - 8 * u, cy + 1 * u], [ex(k) + 8 * u, cy + 1 * u]], 3.8 * u)); brows(0, -1); dash(11, 0.8); break;
    case "smug": eyes.forEach((k) => lidded(ex(k))); brows(2, -3, true); ctx.beginPath(); ctx.moveTo(mx - 8 * u, my + 1 * u); ctx.quadraticCurveTo(mx + 2 * u, my + 4 * u, mx + 10 * u, my - 4 * u); ctx.strokeStyle = INK; ctx.lineWidth = 4 * u; ctx.stroke(); break;
    case "stern": eyes.forEach((k) => lidded(ex(k))); brows(3, -2); smileArc(13, 3.5, true); break;
    case "grin": eyes.forEach((k) => arc(ex(k), true)); brows(-3, -3); dmouth(24, 8, true, false); break;
    case "laugh": eyes.forEach((k) => { const x = ex(k), s = side ? 1 : -k; stroke(ctx, [[x - s * 6 * u, cy - 5 * u], [x + s * 5 * u, cy], [x - s * 6 * u, cy + 5 * u]], 3.8 * u); }); brows(-4, -4); dmouth(32, 11, true, true); break;
    case "whistle": eyes.forEach((k) => stroke(ctx, [[ex(k) - 7 * u, cy], [ex(k) + 7 * u, cy]], 3.8 * u)); brows(-2, -4); O(7, 8, 4); break;
    case "nervous": eyes.forEach((k) => dotEye(ex(k), -1.5, 0, 3, 4.5)); brows(-3, 2); { ctx.beginPath(); for (let i = 0; i <= 16; i++) { const x = mx - 9 * u + (i / 16) * 18 * u, y = my + Math.sin((i / 16) * Math.PI * 3) * 1.5 * u; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.strokeStyle = INK; ctx.lineWidth = 3.6 * u; ctx.stroke(); } drop(cx + (side ? -10 : 34) * u, cy - 30 * u, 5 * u); break;
    case "shock": eyes.forEach((k) => { ctx.beginPath(); ctx.arc(ex(k), cy, 11 * u, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3.2 * u; ctx.stroke(); dot(ctx, ex(k), cy, 3 * u); }); brows(-7, -7); O(18, 22); break;
    case "sad": eyes.forEach((k) => dotEye(ex(k), 0, 2)); brows(-3, 3); smileArc(14, 3.5, true); eyes.forEach((k) => { ctx.fillStyle = "rgba(120,190,240,0.9)"; ctx.fillRect(ex(k) - 2.5 * u, cy + 7 * u, 5 * u, 20 * u); drop(ex(k), cy + 31 * u, 3.5 * u); }); break;
    case "dazed": eyes.forEach((k) => { ctx.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.45, r = (i / 40) * 8 * u; const x = ex(k) + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.strokeStyle = INK; ctx.lineWidth = 2.6 * u; ctx.stroke(); }); brows(-3, 2); dash(10, -1); break;
    case "pained": eyes.forEach((k, i) => (i === 0 && !side ? (() => { const x = ex(k); stroke(ctx, [[x - 6 * u, cy - 5 * u], [x + 5 * u, cy], [x - 6 * u, cy + 5 * u]], 3.8 * u); })() : lidded(ex(k)))); brows(-3, 2);
      { ctx.beginPath(); ctx.roundRect(mx - 12 * u, my - 4 * u, 24 * u, 8 * u, 2 * u); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.6 * u; ctx.stroke(); for (const k of [-6, 0, 6]) stroke(ctx, [[mx + k * u, my - 4 * u], [mx + k * u, my + 4 * u]], 1.6 * u); } break;
    case "lick": eyes.forEach((k) => dotEye(ex(k), 2.5, 0)); brows(0, -1); smileArc(14, 4); ctx.beginPath(); ctx.ellipse(mx + 6 * u, my + 4 * u, 3.5 * u, 4.5 * u, 0, 0, Math.PI * 2); ctx.fillStyle = "#e86e78"; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2 * u; ctx.stroke(); break;
  }
  if (side) stroke(ctx, [[cx + 44 * u, cy + 4 * u], [cx + 47 * u, cy + 9 * u], [cx + 43 * u, cy + 10 * u]], 3 * u); // nose tick in profile
  if (look.moustache) eyes.length && [-1, 1].forEach((k) => { if (side && k < 0) return; const x0 = mx + (side ? -2 : 0) * u, y0 = my - 7 * u; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + k * 7 * u, y0 - 3 * u, x0 + k * 14 * u, y0 + 3 * u); ctx.quadraticCurveTo(x0 + k * 6 * u, y0 + 2 * u, x0, y0 + 2 * u); ctx.fillStyle = mix(look.hair.color, INK, 0.3); ctx.fill(); });
  if (look.glasses) eyes.forEach((k) => { ctx.beginPath(); ctx.arc(ex(k), cy, 12 * u, 0, Math.PI * 2); ctx.strokeStyle = look.glasses!; ctx.lineWidth = 2.8 * u; ctx.stroke(); });
  if (look.glasses && !side) stroke(ctx, [[ex(-1) + 12 * u, cy - 2 * u], [ex(1) - 12 * u, cy - 2 * u]], 2.5 * u, look.glasses);
}

// ---- outfits on the torso (clipped), at most ~5 elements ----
function outfit(ctx: CanvasRenderingContext2D, o: Look["outfit"], tx: number, top: number, bot: number, f: number, back: boolean, side: boolean) {
  const h = bot - top, x = tx + (side ? 0.12 * TW : 0.06 * TW * f);
  const A2 = o.accent ?? "#fff";
  const ln = (pts: [number, number][], w = 1.8 * u, c = INK) => stroke(ctx, pts, w, c);
  const k = o.kind as OutfitKind;
  if (k === "stripes") { for (let y = top + 0.12 * h, i = 0; y < bot; y += 0.11 * h, i++) if (i % 2 === 0) { ctx.fillStyle = A2; ctx.fillRect(tx - TW, y, TW * 2, 0.055 * h); } return; }
  if (k === "dress") { for (let y = top + 0.15 * h, r = 0; y < bot; y += 0.09 * h, r++) for (let xx = tx - TW + (r % 2) * 14; xx < tx + TW; xx += 28) dot(ctx, xx, y, 3.6, A2); ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(tx - TW, top + 0.48 * h, TW * 2, 0.05 * h); return; }
  if (back) { if (k === "uniform") { ctx.fillStyle = "#1d1f26"; ctx.fillRect(tx - TW, top + 0.7 * h, TW * 2, 0.06 * h); } if (k === "apron") ln([[tx - 10, top + 0.52 * h], [tx + 10, top + 0.52 * h]], 6, A2); return; }
  if (k === "suit") {
    ctx.fillStyle = "#f7f5ef"; ctx.beginPath(); ctx.moveTo(x - 0.18 * TW, top); ctx.lineTo(x + 0.18 * TW, top); ctx.lineTo(x, top + 0.42 * h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = A2; ctx.beginPath(); ctx.moveTo(x - 4, top + 0.1 * h); ctx.lineTo(x + 4, top + 0.1 * h); ctx.lineTo(x + 9, top + 0.45 * h); ctx.lineTo(x, top + 0.52 * h); ctx.lineTo(x - 9, top + 0.45 * h); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5 * u; ctx.stroke();
    ln([[x - 0.18 * TW, top], [x, top + 0.42 * h], [x + 0.18 * TW, top]]); dot(ctx, x, top + 0.62 * h, 1.4 * u, "#15161b"); dot(ctx, x, top + 0.76 * h, 1.4 * u, "#15161b");
  }
  if (k === "uniform") { for (const yy of [0.28, 0.42, 0.56]) dot(ctx, x, top + yy * h, 2.4 * u, A2); ctx.fillStyle = "#1d1f26"; ctx.fillRect(tx - TW, top + 0.7 * h, TW * 2, 0.07 * h); ctx.fillStyle = A2; ctx.fillRect(x - 9, top + 0.7 * h, 18, 0.07 * h); if (!side) { ctx.fillStyle = A2; ctx.beginPath(); ctx.moveTo(x + 0.22 * TW - 10, top + 0.22 * h); ctx.lineTo(x + 0.22 * TW + 10, top + 0.22 * h); ctx.lineTo(x + 0.22 * TW, top + 0.34 * h); ctx.closePath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5 * u; ctx.stroke(); } }
  if (k === "apron") { ctx.fillStyle = A2; ctx.beginPath(); ctx.roundRect(x - 0.3 * TW, top + 0.2 * h, 0.6 * TW, 0.85 * h, 14); ctx.fill(); ln([[x - 0.3 * TW, top + 0.2 * h], [x - 0.3 * TW, bot]], 1.5 * u, "rgba(0,0,0,0.25)"); ln([[x + 0.3 * TW, top + 0.2 * h], [x + 0.3 * TW, bot]], 1.5 * u, "rgba(0,0,0,0.25)"); ctx.fillStyle = o.accent2 ?? "#d9534f"; ctx.beginPath(); const hx = x, hy = top + 0.62 * h; ctx.moveTo(hx, hy + 8); ctx.bezierCurveTo(hx - 14, hy - 2, hx - 6, hy - 12, hx, hy - 4); ctx.bezierCurveTo(hx + 6, hy - 12, hx + 14, hy - 2, hx, hy + 8); ctx.fill(); }
  if (k === "hoodie") { ctx.fillStyle = "rgba(0,0,0,0.13)"; ctx.beginPath(); ctx.moveTo(x - 0.2 * TW, top + 0.6 * h); ctx.lineTo(x + 0.2 * TW, top + 0.6 * h); ctx.lineTo(x + 0.27 * TW, top + 0.85 * h); ctx.lineTo(x - 0.27 * TW, top + 0.85 * h); ctx.closePath(); ctx.fill(); for (const s of [-1, 1]) { ln([[x + s * 8, top + 0.05 * h], [x + s * 9, top + 0.3 * h]], 1.6 * u, A2); dot(ctx, x + s * 9, top + 0.31 * h, 1.3 * u, A2); } }
  if (k === "chef") { for (const s of [-1, 1]) for (const yy of [0.3, 0.45, 0.6]) dot(ctx, x + s * 0.13 * TW, top + yy * h, 2 * u, o.accent2 ?? "#2b2b2b"); ctx.fillStyle = A2; ctx.beginPath(); ctx.moveTo(x - 0.2 * TW, top); ctx.lineTo(x + 0.2 * TW, top); ctx.lineTo(x, top + 0.2 * h); ctx.closePath(); ctx.fill(); }
  if (k === "labcoat") { ctx.fillStyle = A2; ctx.fillRect(x - 0.09 * TW, top, 0.18 * TW, 0.75 * h); ln([[x - 0.09 * TW, top], [x - 0.09 * TW, bot]], 1.6 * u); ln([[x + 0.09 * TW, top], [x + 0.09 * TW, bot]], 1.6 * u); ln([[x - 0.09 * TW, top + 0.05 * h], [x - 0.22 * TW, top + 0.22 * h], [x - 0.09 * TW, top + 0.38 * h]], 1.6 * u); ln([[x + 0.09 * TW, top + 0.05 * h], [x + 0.22 * TW, top + 0.22 * h], [x + 0.09 * TW, top + 0.38 * h]], 1.6 * u); ctx.fillStyle = "#2c66c9"; ctx.fillRect(x + 0.22 * TW, top + 0.3 * h, 4, 14); ctx.fillStyle = "#d63a3a"; ctx.fillRect(x + 0.22 * TW + 7, top + 0.3 * h, 4, 14); }
}

// ---- hair and hats (low, following the skull; brim to the facing side) ----
function hairAndHat(ctx: CanvasRenderingContext2D, look: Look, head: [number, number][], hc: { cx: number; cy: number }, f: number, back: boolean, side: boolean) {
  const hair = look.hair, hairCol = hair.color;
  const capAbove = (yCut: number, color: string, scallop = false, pushK = 1.03) => {
    // the head's own shape above a cut line, pushed out 3%
    const pts = head.map(([x, y]) => [hc.cx + (x - hc.cx) * pushK, hc.cy + (y - hc.cy) * pushK] as [number, number]);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 600, yCut);
    if (scallop) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(600, 0); ctx.lineTo(600, yCut); for (let x = 600; x >= 0; x -= 30) ctx.quadraticCurveTo(x - 15, yCut + 12, x - 30, yCut); ctx.closePath(); }
    ctx.clip(); shade(ctx, pts, color, SH_HAIR, A, 0.25, 0.08); inkRing(ctx, pts, hc.cx, hc.cy, W0 * 0.9); ctx.restore();
    stroke(ctx, scallop ? [] : [[hc.cx - A * 0.95, yCut], [hc.cx + A * 0.95, yCut]], 0);
  };
  if (back && hair.kind !== "none") { capAbove(hc.cy + B * (hair.kind === "bob" ? 0.75 : 0.35), hairCol, true); }
  else if (hair.kind !== "none") {
    const cut = hc.cy - B * (hair.kind === "bob" ? 0.28 : hair.kind === "curly" ? 0.5 : 0.42);
    if (hair.kind === "bob") {
      // sides fall to the jaw, behind the face edges
      const pts = head.map(([x, y]) => [hc.cx + (x - hc.cx) * 1.06, hc.cy + (y - hc.cy) * 1.04] as [number, number]);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 600, hc.cy + B * 0.6); ctx.clip(); ctx.beginPath(); ctx.rect(0, 0, 600, 1000);
      const fx = hc.cx + f * 0.12 * W; ctx.rect(fx - A * 0.62, hc.cy - B * 0.28, A * 1.24, B * 2); ctx.clip("evenodd");
      shade(ctx, pts, hairCol, SH_HAIR, A, 0.25); inkRing(ctx, pts, hc.cx, hc.cy, W0 * 0.9); ctx.restore();
    } else capAbove(cut, hairCol, true);
    if (hair.kind === "buns") for (const s of [-1, 1]) { const p = blobPts({ cx: hc.cx + s * A * 0.85, cy: hc.cy - B * 0.85, a: 34, b: 32, egg: 0, nTop: 2, nBot: 2, asym: 0, rot: 0, seed: s + 9 }); shade(ctx, p, hairCol, SH_HAIR, 34); inkRing(ctx, p, hc.cx + s * A * 0.85, hc.cy - B * 0.85, W0 * 0.8); }
    if (hair.kind === "topBun") { const p = blobPts({ cx: hc.cx - f * 10, cy: hc.cy - B * 1.12, a: 38, b: 32, egg: 0, nTop: 2, nBot: 2, asym: 0, rot: 0, seed: 4 }); shade(ctx, p, hairCol, SH_HAIR, 38); inkRing(ctx, p, hc.cx, hc.cy - B * 1.12, W0 * 0.8); }
    if (hair.kind === "curly") for (let i = 0; i < 9; i++) { const a = Math.PI * (1.05 + i * 0.1), x = hc.cx + Math.cos(a) * A * 0.98, y = hc.cy + Math.sin(a) * B * 0.98; const p = blobPts({ cx: x, cy: y, a: 24, b: 22, egg: 0, nTop: 2, nBot: 2, asym: 0, rot: 0, seed: i }); shade(ctx, p, hairCol, SH_HAIR, 24); inkRing(ctx, p, x, y, W0 * 0.6); }
    if (hair.kind === "messy") for (const dx of [-0.4, -0.1, 0.2, 0.5]) { const x = hc.cx + dx * A, y = hc.cy - B * 0.98; ctx.beginPath(); ctx.moveTo(x - 12, y + 6); ctx.lineTo(x + 4, y - 26); ctx.lineTo(x + 14, y + 6); ctx.closePath(); ctx.fillStyle = hairCol; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3.5 * u; ctx.stroke(); }
    if (hair.kind === "sidePart") stroke(ctx, [[hc.cx - f * 8 - 0.25 * A, hc.cy - B * 0.95], [hc.cx - 0.1 * A, cut - 4]], 1.4 * u);
  }
  const hat = look.hat;
  if (!hat) return;
  if (hat.kind === "cop") {
    const y0 = hc.cy - B * 0.38, sag = 0.05 * W;
    ctx.beginPath(); ctx.moveTo(hc.cx - A * 1.0, y0); ctx.quadraticCurveTo(hc.cx, y0 + sag, hc.cx + A * 1.0, y0);
    ctx.lineTo(hc.cx + A * 1.08, hc.cy - B * 1.1); ctx.quadraticCurveTo(hc.cx, hc.cy - B * 1.28, hc.cx - A * 1.08, hc.cy - B * 1.1); ctx.closePath();
    ctx.fillStyle = hat.color; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = W0 * 0.85; ctx.stroke();
    if (!back) { const bx = hc.cx + f * A * 0.35; ctx.beginPath(); ctx.ellipse(bx + f * 20, y0 + sag * 0.5, A * 0.62, 12, f * 0.08, 0, Math.PI); ctx.fillStyle = "#16171b"; ctx.fill(); ctx.stroke(); dot(ctx, bx, hc.cy - B * 0.72, 9, hat.accent ?? "#e3b341"); }
    ctx.fillStyle = "#16171b"; ctx.fillRect(hc.cx - A * 1.0, y0 - 18, A * 2, 10);
  }
  if (hat.kind === "chef") {
    const y0 = hc.cy - B * 0.42;
    ctx.beginPath(); ctx.moveTo(hc.cx - A * 0.82, y0); ctx.quadraticCurveTo(hc.cx, y0 + 10, hc.cx + A * 0.82, y0); ctx.lineTo(hc.cx + A * 0.82, y0 - 52); ctx.lineTo(hc.cx - A * 0.82, y0 - 52); ctx.closePath();
    ctx.fillStyle = hat.color; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = W0 * 0.85; ctx.stroke();
    for (const [dx, dy, r] of [[-0.6, -95, 52], [0.6, -95, 52], [0, -125, 62]] as const) { const p = blobPts({ cx: hc.cx + dx * A, cy: y0 + dy, a: r, b: r * 0.85, egg: 0, nTop: 2, nBot: 2, asym: 0, rot: 0, seed: r }); shade(ctx, p, hat.color, [0.88, 0.88, 0.95], r); inkRing(ctx, p, hc.cx + dx * A, y0 + dy, W0 * 0.8); }
  }
}

export type FlatOpts = { look: Look; view: View; expr?: FlatExpr; pose?: FlatPose; prop?: "revolver" | "briefcase" };

/** Draw one character on a 600x1000 canvas. */
export function drawFlat(ctx: CanvasRenderingContext2D, o: FlatOpts) {
  const { look, view } = o, e = o.expr ?? "neutral", p = o.pose ?? FPOSE.stand;
  const side = view === "side", back = view === "back", f = view === "quarter" ? 1 : side ? 1 : 0;
  const skin = SKIN[look.skin], seed = look.name.length * 7 + look.skin;
  const lift = p.lift ?? 0;
  ctx.clearRect(0, 0, 600, 1000);
  ctx.save();
  ctx.translate(0, -lift);
  // lean/tilt about the hips
  const hipY = TORSO_BOT - 0.12 * HH;
  const leanDeg = (p.tilt ?? 0) + (side ? p.lean ?? 0 : 0);
  const bc = col(look.outfit.base), light = 0.2126 * bc.r + 0.7152 * bc.g + 0.0722 * bc.b > 0.35;
  const legC = mix(look.outfit.kind === "dress" || light ? "#3d4440" : look.outfit.base, INK, 0.55);
  // legs
  const legs: [number, number, number][] = side ? [[-1, p.legR[0], p.legR[1]], [1, p.legL[0], p.legL[1]]] : [[-1, p.legR[0], 0], [1, p.legL[0], 0]];
  for (const [s, hip, knee] of legs) {
    const x0 = CX + (side ? s * 4 : s * 15 * u), lenT = LEGS * 0.5 + 0.12 * HH * 0.5;
    const c = side && s < 0 ? mix(legC, INK, 0.5) : legC;
    let k: [number, number], foot: [number, number];
    if (side) { k = limb(x0, hipY, hip, lenT, 1, true); foot = limb(k[0], k[1], hip - knee, lenT, 1, true); stroke(ctx, [[x0, hipY], k, foot], 5.8 * u, c); stroke(ctx, [[foot[0] - 2 * u, foot[1]], [foot[0] + 14 * u, foot[1]]], 7.5 * u, INK); }
    else {
      const ang = hip * (p.lift ? 1 : 0.6);
      foot = [x0 + s * (7 * u + Math.sin(ang * D) * lenT * 2), hipY + Math.cos(ang * D) * (SOLE - 8 - hipY)];
      if (p.lift) { k = [x0 + s * Math.sin(ang * D) * lenT * 1.3, hipY + lenT * 0.9]; foot = [x0 + s * 6, hipY + lenT * 1.55]; } else k = [(x0 + foot[0]) / 2 + s * 4, (hipY + foot[1]) / 2];
      stroke(ctx, [[x0, hipY], k, foot], 5.8 * u, c);
      stroke(ctx, [[foot[0] - s * 3 * u, foot[1]], [foot[0] + s * 13 * u, foot[1] + 1]], 7.5 * u, INK);
    }
  }
  ctx.translate(CX, hipY); ctx.rotate(leanDeg * D); ctx.translate(-CX, -hipY);
  // torso
  const tTop = CHIN - 0.25 * HH, tA = (side ? 0.31 * W : TW / 2), tB = (TORSO_BOT - tTop) / 2, tcx = CX + (side ? 0.04 * W : 0);
  const dressFlare = look.outfit.kind === "dress" ? 0.22 : 0.12;
  const torso = blobPts({ cx: tcx, cy: tTop + tB, a: tA, b: tB, egg: dressFlare, nTop: 2.2, nBot: 2.6, asym: (side ? 0.06 : 0.04 * f), rot: 0, seed: seed + 5 });
  const shoulderY = CHIN + 0.12 * HH;
  const arm = (s: number, a: [number, number], front: boolean) => {
    const x0 = side ? tcx + (front ? 0.1 : -0.05) * W : tcx + s * 0.85 * tA, len = 0.5 * HH;
    const el = limb(x0, shoulderY, a[0], len, s, side), hd = limb(el[0], el[1], a[1], len * 0.95, s, side);
    stroke(ctx, [[x0, shoulderY], el, hd], 5.2 * u, mix(look.outfit.base, INK, 0.5));
    dot(ctx, hd[0], hd[1], 5.5 * u);
    if (s === -1 && p.pointR && !side) stroke(ctx, [hd, limb(hd[0], hd[1], a[1], 16 * u, s, false)], 3 * u);
    if (s === -1 && o.prop === "revolver") revolver(ctx, hd[0], hd[1], side ? 1 : -1);
    if (s === -1 && o.prop === "briefcase") { ctx.fillStyle = "#6b3f22"; ctx.beginPath(); ctx.roundRect(hd[0] - 34, hd[1] + 6, 68, 50, 6); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3.2 * u; ctx.stroke(); stroke(ctx, [[hd[0] - 12, hd[1] + 6], [hd[0] - 12, hd[1] - 4], [hd[0] + 12, hd[1] - 4], [hd[0] + 12, hd[1] + 6]], 2.4 * u); }
  };
  // arms behind the body first (side: the far arm)
  if (side) arm(-1, p.armR, false); else { if (!(p.armL[1] < 0)) arm(1, p.armL, false); if (!(p.armR[1] < 0) && !o.prop) arm(-1, p.armR, false); }
  shade(ctx, torso, look.outfit.base, SH_CLOTH, tA, 0.55, 0.18);
  ctx.save(); path(ctx, torso); ctx.clip(); outfit(ctx, look.outfit, tcx, tTop + 0.12 * HH, TORSO_BOT, f, back, side); ctx.restore();
  inkRing(ctx, torso, tcx, tTop + tB);
  if (side) arm(1, p.armL, true); else { if (p.armL[1] < 0) arm(1, p.armL, true); if (p.armR[1] < 0 || o.prop) arm(-1, p.armR, true); }
  // head
  ctx.translate(CX, CHIN); ctx.rotate((p.tilt ?? 0) * 0.6 * D); ctx.translate(-CX, -CHIN);
  const hc = { cx: CX + (side ? 0.03 * W : 0), cy: CY };
  const head = blobPts({ cx: hc.cx, cy: hc.cy, a: A * (side ? 0.97 : 1), b: B * (view === "quarter" ? 1.02 : 0.94 / 0.94), egg: side ? -0.1 : view === "quarter" ? 0 : -0.12, nTop: view === "quarter" ? 2.2 : 1.75, nBot: view === "quarter" ? 1.9 : 2.3, asym: side ? 0.12 : view === "quarter" ? 0.08 : 0.08 * (rnd(seed) > 0.5 ? 1 : -1), rot: ((side ? 3 : view === "quarter" ? 8 : (rnd(seed + 3) - 0.5) * 8) * D), seed });
  shade(ctx, head, skin, SH_SKIN, A);
  inkRing(ctx, head, hc.cx, hc.cy);
  if (!back) face(ctx, e, hc.cx, hc.cy, f, side, look);
  hairAndHat(ctx, look, head, hc, f, back, side);
  ctx.restore();
}

function revolver(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number) {
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.lineJoin = "round"; ctx.strokeStyle = INK; ctx.lineWidth = 3.4 * u;
  ctx.fillStyle = "#6b7180"; ctx.beginPath(); ctx.roundRect(-6, -40, 120, 20, 5); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#565b68"; ctx.beginPath(); ctx.roundRect(-16, -48, 46, 34, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#7a4a2a"; ctx.beginPath(); ctx.moveTo(-16, -20); ctx.lineTo(10, -20); ctx.lineTo(4, 26); ctx.lineTo(-22, 22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(14, -12, 9, 0, Math.PI); ctx.stroke();
  dot(ctx, 108, -30, 5, "#050505");
  ctx.restore();
}

const CACHE = new Map<string, THREE.CanvasTexture>();
export const flatTexture = (o: FlatOpts) => {
  const key = JSON.stringify(o);
  let t = CACHE.get(key);
  if (!t) {
    const c = document.createElement("canvas"); c.width = 840; c.height = 1400;
    const ctx = c.getContext("2d")!; ctx.scale(1.4, 1.4); drawFlat(ctx, o);
    t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    CACHE.set(key, t);
  }
  return t;
};

/** The character card in 3D: 1.75 m tall (soles at the given position), lit by the scene and casting a shadow.
 *  `mirror` flips the drawing (a side view facing left). Turn the card toward the camera with `yaw`. */
export const FlatChar: React.FC<FlatOpts & { position?: [number, number, number]; yaw?: number; height?: number; mirror?: boolean }> = ({ position = [0, 0, 0], yaw = 0, height = 1.75, mirror, ...o }) => {
  const map = useMemo(() => flatTexture(o), [JSON.stringify(o)]);
  const w = height * 0.6, sole = 975 / 1000;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, height * (0.5 - (1 - sole)), 0]} scale={[mirror ? -1 : 1, 1, 1]} castShadow receiveShadow>
        <planeGeometry args={[w, height]} />
        <meshStandardMaterial map={map} transparent alphaTest={0.5} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
export { CAST };

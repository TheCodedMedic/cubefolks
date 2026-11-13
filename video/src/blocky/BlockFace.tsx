// Classic blocky-game decal faces (notes/short06/CONTRACT.md, FACE): flat solid-black marks printed on the rounded head.
// Two small solid black vertical oval eyes (no whites, no outlines, no glints), a thin black curved smile, simple variants.
// Our own drawing, done in code. The canvas is laid out in HEAD UNITS so the marks keep their true shape on the head:
// the rig wraps the texture on a cylinder strip (radius 0.507, 0.84 tall, 0.84*PI around, centred 0.02 below the head centre),
// i.e. 1.338 units wide by 0.84 tall. The canvas has the same aspect (1024 x 643, 765 px per unit), so a circle drawn here
// is a circle on the head. Drawing coordinates: head units, origin at the head centre, y up, x to the character's left
// as seen by the viewer (viewer's right = +x).
import * as THREE from "three";
import type { Expr } from "./types";

const ARC = 0.507 * 0.84 * Math.PI; // strip width in head units
const STRIP_H = 0.84, STRIP_Y = -0.02; // strip height and its centre (head units)
const W = 1024, K = W / ARC, H = Math.round(STRIP_H * K);
const INK = "#0d0d0d";
const cache = new Map<string, THREE.CanvasTexture>();

// ---- the face layout (head units; head is 1.0 tall, 1.0 wide; top at +0.5) ----
const EY = 0.05;   // eye line: 45% down from the top of the head
const EX = 0.105;  // eye centres, either side of the middle
const ERX = 0.032, ERY = 0.067; // eye half-width / half-height (small vertical ovals)
const LW = 0.021;  // the mouth's line weight

type G = CanvasRenderingContext2D;

/** A solid black oval eye; blink squashes it to a thin line (slightly wider as it closes). */
function eye(g: G, cx: number, cy: number, rx: number, ry: number, blink: number) {
  const k = Math.min(1, Math.max(0, blink));
  const h = Math.max(0.011, ry * (1 - k));
  const w = rx * (1 + 0.3 * k);
  g.beginPath(); g.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2); g.fill();
}
const eyes = (g: G, rx: number, ry: number, blink: number, dy = 0) => {
  eye(g, -EX, EY + dy, rx, ry, blink); eye(g, EX, EY + dy, rx, ry, blink);
};
/** Closed happy eye: a little ^ arch. */
function arch(g: G, cx: number, cy: number) {
  g.lineWidth = LW; g.beginPath(); g.arc(cx, cy - 0.025, 0.04, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
}
/** A short brow stroke; `inner` lifts the end nearest the nose (worried) when > 0. */
function brows(g: G, y: number, inner: number, len = 0.075) {
  g.lineWidth = 0.018;
  for (const s of [-1, 1]) {
    const xi = s * (EX - 0.045), xo = s * (EX + 0.035);
    g.beginPath(); g.moveTo(xo, y); g.lineTo(xi, y + inner); g.stroke();
  }
  void len;
}
/** The classic smile: a thin arc of a circle, centre (0, cy), radius r, half-angle a (radians from straight down). */
function smileArc(g: G, cy: number, r: number, a: number, lw = LW) {
  g.lineWidth = lw; g.beginPath(); g.arc(0, cy, r, Math.PI * 1.5 - a, Math.PI * 1.5 + a); g.stroke();
}

function draw(g: G, expr: Expr, blink: number) {
  switch (expr) {
    case "smile":
      eyes(g, ERX, ERY, blink);
      smileArc(g, 0.02, 0.2, 0.78);
      break;
    case "grin": { // a wide open smile, solid black
      eyes(g, ERX, ERY, blink);
      const cy = 0.0, r = 0.2, a = 0.95;
      g.beginPath(); g.arc(0, cy, r, Math.PI * 1.5 - a, Math.PI * 1.5 + a); g.closePath(); g.fill();
      break;
    }
    case "happy": // eyes shut in ^ ^ arches, big smile
      arch(g, -EX, EY); arch(g, EX, EY);
      smileArc(g, 0.02, 0.2, 0.8);
      break;
    case "worried":
      eyes(g, ERX * 0.95, ERY * 0.88, blink, -0.005);
      brows(g, EY + 0.1, 0.03);
      // small downturned mouth
      g.lineWidth = LW; g.beginPath(); g.arc(0, -0.25, 0.1, Math.PI * 0.28, Math.PI * 0.72); g.stroke();
      break;
    case "scared":
      eyes(g, ERX * 1.12, ERY * 1.15, blink);
      brows(g, EY + 0.115, 0.045);
      g.beginPath(); g.ellipse(0, -0.16, 0.045, 0.034, 0, 0, Math.PI * 2); g.fill(); // small open mouth
      break;
    case "surprised":
      eyes(g, ERX * 1.12, ERY * 1.15, blink);
      g.beginPath(); g.ellipse(0, -0.15, 0.026, 0.036, 0, 0, Math.PI * 2); g.fill(); // small o
      break;
    case "blank": // dot eyes and a short flat line
      eye(g, -EX, EY, 0.024, 0.024, blink); eye(g, EX, EY, 0.024, 0.024, blink);
      g.lineWidth = LW; g.beginPath(); g.moveTo(-0.055, -0.13); g.lineTo(0.055, -0.13); g.stroke();
      break;
    case "smirk": // lopsided: one corner up
      eyes(g, ERX, ERY, blink);
      g.lineWidth = LW; g.beginPath(); g.moveTo(-0.1, -0.135); g.quadraticCurveTo(0.06, -0.19, 0.15, -0.075); g.stroke();
      break;
    case "creepy": { // ordinary eyes, a smile far too wide and thin
      eyes(g, ERX * 0.9, ERY * 0.95, blink);
      const half = 0.31, sag = 0.07, r = (half * half + sag * sag) / (2 * sag);
      smileArc(g, -0.17 + r, r, Math.asin(half / r), 0.013);
      break;
    }
    case "stare": // slightly bigger eyes, no mouth
      eyes(g, ERX * 1.18, ERY * 1.18, blink);
      break;
  }
}

/** A transparent decal-face texture for the rig's face strip. `blink` 0 (open) .. 1 (shut). Cached per (expr, blink to 0.1). */
export function makeFaceTexture(expr: Expr, blink = 0): THREE.CanvasTexture {
  const b = Math.round(Math.min(1, Math.max(0, blink)) * 10) / 10;
  const key = `${expr}:${b}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, W, H);
  // head units -> pixels: x right, y up, origin at the head centre (the strip is centred STRIP_Y below it)
  g.setTransform(K, 0, 0, -K, W / 2, H / 2 + STRIP_Y * K);
  g.fillStyle = INK; g.strokeStyle = INK; g.lineCap = "round"; g.lineJoin = "round";
  draw(g, expr, b);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  cache.set(key, t);
  return t;
}

/** Every expression, in sheet order. */
export const ALL_EXPRS: Expr[] = ["smile", "grin", "happy", "smirk", "surprised", "worried", "scared", "blank", "creepy", "stare"];

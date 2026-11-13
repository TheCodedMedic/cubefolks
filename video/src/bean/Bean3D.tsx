// The Beanfolk rig, v1. Our own pill-people design: a big slightly squashed head (about 40% of the height) with a
// drawn face and a little button nose, a bean-shaped body (a capsule a touch wider at the bottom) whose material IS the
// outfit, thin black stick legs (hip + knee) in coloured shoes, thin stick arms with mitten hands.
// Scene units are metres; a standing bean is about 1.14 tall with its feet on y = 0 (the ground solver lifts the
// pelvis so the lowest shoe touches the ground). The bean faces +z.
import React, { useMemo } from "react";
import * as THREE from "three";
import { Expr, EXPR, FACE, FacePatch } from "./Face";

// ---- proportions ----
export const R = 0.25; // head radius
export const HEAD_SCALE: [number, number, number] = [1.04, 0.95, 1];
const RB = 0.165, RT = 0.145, MID = 0.17; // body: bottom radius, top radius, straight part
export const BODY_H = RB + MID + RT; // 0.48
export const L1 = 0.16, L2 = 0.16, AH = 0.028; // thigh, shin, ankle height (shoe radius)
const LR = 0.0135; // stick radius (legs)
const AR = 0.012; // stick radius (arms)
const HIP_IN = 0.045, HIP_X = 0.07; // hip joints: above the body's bottom, out from the middle
const SH_Y = 0.335, SH_X = 0.148; // shoulders (from the body's bottom)
const UA = 0.14, FA = 0.13; // upper arm, forearm
const NECK = BODY_H - 0.06; // head pivot (from the body's bottom)
const D = Math.PI / 180;

// ---- skin tones: 8 steps, light to deep brown (never near-black) ----
export const SKIN = ["#f7dcc8", "#efc6a6", "#e2ae86", "#cf9468", "#b67a4f", "#99603b", "#7c4a2d", "#663b24"];

// ---- looks ----
export type OutfitKind = "stripes" | "suit" | "uniform" | "apron" | "hoodie" | "dress" | "chef" | "labcoat";
export type Outfit = { kind: OutfitKind; base: string; accent?: string; accent2?: string };
export type HairKind = "none" | "short" | "messy" | "bob" | "buns" | "sidePart" | "topBun" | "curly";
export type HatKind = "none" | "cop" | "chef";
export type Look = {
  name: string; role: string; skin: number; outfit: Outfit;
  hair: { kind: HairKind; color: string }; hat?: { kind: HatKind; color: string; accent?: string };
  glasses?: string; moustache?: boolean; shoes: string;
  /** inventor's goggles pushed up on the forehead: strap, frame and lens colours */
  goggles?: { strap: string; frame: string; lens: string };
};

export const CAST: Look[] = [
  { name: "Pip", role: "the prisoner", skin: 2, outfit: { kind: "stripes", base: "#f2ead8", accent: "#2d2f3a" }, hair: { kind: "messy", color: "#5b3a24" }, shoes: "#3b3b44" },
  { name: "Mr. Hollis", role: "the banker", skin: 0, outfit: { kind: "suit", base: "#30343f", accent: "#c8323c" }, hair: { kind: "sidePart", color: "#a9a39b" }, glasses: "#c9a24a", moustache: true, shoes: "#1d1b1a" },
  { name: "Officer Reyes", role: "the cop", skin: 4, outfit: { kind: "uniform", base: "#2d4b7e", accent: "#e3b341" }, hair: { kind: "short", color: "#2a1d16" }, hat: { kind: "cop", color: "#22355c", accent: "#e3b341" }, shoes: "#1d1b1a" },
  { name: "Mabel", role: "the baker", skin: 6, outfit: { kind: "apron", base: "#e5ab3c", accent: "#fbf6ec", accent2: "#d9534f" }, hair: { kind: "topBun", color: "#2a1a12" }, shoes: "#7a4b2f" },
  { name: "Theo", role: "the kid", skin: 7, outfit: { kind: "hoodie", base: "#e66a3e", accent: "#fbe9d6" }, hair: { kind: "curly", color: "#1f140e" }, shoes: "#f4f1ea" },
  { name: "June", role: "the neighbour", skin: 1, outfit: { kind: "dress", base: "#4fa7a0", accent: "#fff8ee" }, hair: { kind: "buns", color: "#c0662f" }, shoes: "#c8323c" },
  { name: "Chef Bruno", role: "the cook", skin: 3, outfit: { kind: "chef", base: "#fbfaf6", accent: "#d63a3a", accent2: "#2b2b2b" }, hair: { kind: "short", color: "#231915" }, hat: { kind: "chef", color: "#fbfaf6" }, moustache: true, shoes: "#2b2b2b" },
  { name: "Dr. Okafor", role: "the scientist", skin: 5, outfit: { kind: "labcoat", base: "#f6f6f2", accent: "#7a5bb8" }, hair: { kind: "bob", color: "#1e1410" }, glasses: "#b03a4a", shoes: "#5a4bb0" },
];

// ---- poses (degrees) ----
// legs [hip, knee]: hip + = thigh forward, knee + = shin back. arms [raise, swing, elbow]: raise + = out to the side,
// swing + = forward, elbow + = forearm forward. lean + = forward, roll + = to the bean's left. head [pitch, yaw, roll].
export type Pose = {
  legL: [number, number]; legR: [number, number]; armL: [number, number, number]; armR: [number, number, number];
  lean?: number; roll?: number; head?: [number, number, number]; ground?: boolean; hipY?: number; pointR?: boolean; squash?: number;
};
export const POSES: Record<string, Pose> = {
  stand: { legL: [2, 3], legR: [-2, 3], armL: [13, 0, 8], armR: [13, 0, 8] },
  walk: { legL: [26, 8], legR: [-20, 34], armL: [12, -24, 18], armR: [10, 14, 10], lean: 4, head: [0, 0, 0] },
  run: { legL: [62, 88], legR: [-38, 72], armL: [16, -48, 95], armR: [16, 58, 100], lean: 14, head: [-6, 0, 0] },
  sit: { legL: [88, 88], legR: [84, 86], armL: [4, 52, 30], armR: [4, 52, 30], ground: false, hipY: 0.15 + HIP_IN },
  jump: { legL: [40, 82], legR: [22, 66], armL: [150, 6, 12], armR: [150, 6, 12], ground: false, hipY: 0.44, head: [-10, 0, 0], squash: 1.04 },
  point: { legL: [4, 3], legR: [-6, 5], armL: [13, 0, 8], armR: [80, 12, 0], pointR: true, head: [0, -18, 0], roll: 3 },
  shrug: { legL: [2, 3], legR: [-2, 3], armL: [42, 22, 112], armR: [42, 22, 112], head: [0, 0, 9], squash: 0.98 },
  cheer: { legL: [2, 3], legR: [-2, 3], armL: [150, 6, 12], armR: [150, 6, 12], head: [-8, 0, 0], squash: 1.03 },
  headHands: { legL: [3, 4], legR: [-3, 4], armL: [118, 18, 135], armR: [118, 18, 135], head: [4, 0, 0], squash: 0.97 },
  carry: { legL: [2, 3], legR: [-2, 3], armL: [13, 0, 8], armR: [12, 38, 70] },
  lie: { legL: [0, 2], legR: [0, 2], armL: [12, 0, 4], armR: [12, 0, 4] },
  wave: { legL: [2, 3], legR: [-2, 3], armL: [13, 0, 8], armR: [135, 10, 30], head: [0, 0, -6] },
};

// ---- motion (pure functions of time) ----
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const lerpA = <T extends number[]>(a: T, b: T, u: number) => a.map((v, i) => lerp(v, b[i], u)) as T;
/** Blend two poses (u = 0 → a, 1 → b). */
export const mixPose = (a: Pose, b: Pose, u: number): Pose => ({
  legL: lerpA(a.legL, b.legL, u), legR: lerpA(a.legR, b.legR, u), armL: lerpA(a.armL, b.armL, u), armR: lerpA(a.armR, b.armR, u),
  lean: lerp(a.lean ?? 0, b.lean ?? 0, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u),
  head: lerpA((a.head ?? [0, 0, 0]) as [number, number, number], (b.head ?? [0, 0, 0]) as [number, number, number], u), squash: lerp(a.squash ?? 1, b.squash ?? 1, u),
  ground: u < 0.5 ? a.ground : b.ground, pointR: u < 0.5 ? a.pointR : b.pointR,
  hipY: a.hipY !== undefined || b.hipY !== undefined ? lerp(a.hipY ?? groundHipY(a), b.hipY ?? groundHipY(b), u) : undefined,
});
/** Idle: a 2% breathing squash and a slight arm sway. */
export const idlePose = (t: number, base: Pose = POSES.stand, seed = 0): Pose => {
  const b = Math.sin((t + seed) * (Math.PI * 2) / 3.2);
  return { ...base, squash: (base.squash ?? 1) * (1 + 0.02 * b), armL: [base.armL[0] + 1.5 * b, base.armL[1], base.armL[2]], armR: [base.armR[0] + 1.5 * b, base.armR[1], base.armR[2]] };
};
/** Walk cycle; ph in cycles (one cycle = two steps). The ground solver gives the bob; the body sways. */
export const walkPose = (ph: number, amp = 1): Pose => {
  const w = ph * Math.PI * 2, s = Math.sin(w), c = Math.cos(w);
  return {
    legL: [24 * amp * s, 6 + 40 * amp * Math.max(0, c)], legR: [-24 * amp * s, 6 + 40 * amp * Math.max(0, -c)],
    armL: [12, -22 * amp * s, 14], armR: [12, 22 * amp * s, 14], lean: 4 * amp, roll: 3 * amp * s, head: [0, 0, -2 * amp * s],
  };
};
/** Run cycle: big knees, pumping bent arms, a strong lean. */
export const runPose = (ph: number): Pose => {
  const w = ph * Math.PI * 2, s = Math.sin(w), c = Math.cos(w);
  return {
    legL: [45 * s + 10, 20 + 85 * Math.max(0, c)], legR: [-45 * s + 10, 20 + 85 * Math.max(0, -c)],
    armL: [16, -55 * s, 95], armR: [16, 55 * s, 95], lean: 14, roll: 4 * s, head: [-6, 0, 0],
  };
};
export const STRIDE = { walk: 0.52, run: 1.0 }; // metres per cycle, so feet don't slide
/** Walk (or run) along a polyline at a speed (m/s) starting at t0: position, facing and the pose. Stands idle at the end. */
export const along = (pts: [number, number][], t: number, t0: number, speed: number, gait: "walk" | "run" = "walk") => {
  const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  const d = Math.max(0, Math.min(total, (t - t0) * speed));
  let k = 0, acc = 0;
  while (k < lens.length - 1 && acc + lens[k] < d) { acc += lens[k]; k++; }
  const u = lens[k] ? (d - acc) / lens[k] : 0, a = pts[k], b = pts[k + 1] ?? a;
  const pos: [number, number] = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const yaw = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const moving = t >= t0 && d < total;
  const ph = d / STRIDE[gait];
  const pose = moving ? (gait === "run" ? runPose(ph) : walkPose(ph)) : idlePose(t);
  return { pos, yaw, pose, moving, done: d >= total };
};

// ---- helpers ----
const dirOn = (theta: number, d: number): THREE.Vector3 => new THREE.Vector3(Math.sin(d) * Math.sin(theta), Math.cos(theta), Math.cos(d) * Math.sin(theta));
const dropOf = ([h, k]: [number, number]) => L1 * Math.cos(h * D) + L2 * Math.cos((k - h) * D);
export const groundHipY = (p: Pose) => Math.max(dropOf(p.legL), dropOf(p.legR)) + AH;

const Mat: React.FC<{ c: string; r?: number; map?: THREE.Texture; side?: THREE.Side }> = ({ c, r = 0.72, map, side }) => (
  <meshStandardMaterial color={map ? "#ffffff" : c} map={map ?? null} roughness={r} metalness={0} side={side ?? THREE.FrontSide} />
);
const Stick: React.FC<{ a: THREE.Vector3; b: THREE.Vector3; r: number; c: string }> = ({ a, b, r, c }) => {
  const { pos, q, len } = useMemo(() => {
    const dv = b.clone().sub(a);
    return { pos: a.clone().add(b).multiplyScalar(0.5), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dv.clone().normalize()), len: dv.length() };
  }, [a.x, a.y, a.z, b.x, b.y, b.z]);
  return <mesh position={pos} quaternion={q} castShadow><cylinderGeometry args={[r, r, len, 8]} /><Mat c={c} r={0.4} /></mesh>;
};

// the body: a lathe whose v runs with height, so outfit stripes and belts sit level; the front is u = 0.5
const bodyGeometry = (() => {
  let g: THREE.BufferGeometry | null = null;
  return () => {
    if (g) return g;
    const path = new THREE.Path();
    path.absarc(0, RB, RB, -Math.PI / 2, 0, false);
    path.lineTo(RT, RB + MID);
    path.absarc(0, RB + MID, RT, 0, Math.PI / 2, false);
    const pts = path.getSpacedPoints(64).map((p) => new THREE.Vector2(Math.max(p.x, 1e-4), p.y));
    pts[0].x = 1e-4; pts[pts.length - 1].x = 1e-4;
    const lathe = new THREE.LatheGeometry(pts, 64);
    lathe.rotateY(Math.PI);
    const pos = lathe.getAttribute("position"), uv = lathe.getAttribute("uv");
    for (let i = 0; i < pos.count; i++) uv.setY(i, pos.getY(i) / BODY_H);
    lathe.computeVertexNormals();
    g = lathe;
    return g;
  };
})();

// ---- outfit textures (u around the body, front at the middle; v up) ----
const OUTFIT_CACHE = new Map<string, THREE.CanvasTexture>();
const TW = 1024, TH = 512;
const hy = (h: number) => (1 - h / BODY_H) * TH; // canvas y at a height on the body
const PXM = TW / (2 * Math.PI * 0.155); // canvas px per metre around the waist
const fx = (m: number) => TW / 2 + m * PXM; // canvas x at metres right of the front centre (viewer's right)

function drawOutfit(ctx: CanvasRenderingContext2D, o: Outfit) {
  const A = o.accent ?? "#ffffff", A2 = o.accent2 ?? "#333333";
  ctx.fillStyle = o.base; ctx.fillRect(0, 0, TW, TH);
  const rr = (x: number, y: number, w: number, h: number, rad: number, fill: string, stroke?: string, lw = 4) => {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, rad); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  };
  const dot = (x: number, y: number, rad: number, fill: string, stroke?: string) => {
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
  };
  const seam = "rgba(0,0,0,0.22)";
  switch (o.kind) {
    case "stripes": {
      const band = 0.046;
      for (let h = 0, i = 0; h < BODY_H; h += band, i++) if (i % 2) { ctx.fillStyle = A; ctx.fillRect(0, hy(h + band), TW, hy(h) - hy(h + band)); }
      // a little number tag on the chest (the bean's left)
      rr(fx(0.05), hy(0.37), 70, 36, 6, "#fbf8f0", "#2d2f3a", 3);
      ctx.fillStyle = "#2d2f3a"; ctx.font = "900 28px Montserrat, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("042", fx(0.05) + 35, hy(0.37) + 19);
      break;
    }
    case "suit": {
      // shirt V, lapels, tie, buttons, breast pocket
      ctx.fillStyle = "#f7f5ef";
      ctx.beginPath(); ctx.moveTo(fx(-0.075), hy(0.47)); ctx.lineTo(fx(0.075), hy(0.47)); ctx.lineTo(fx(0), hy(0.24)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.45)"; ctx.lineWidth = 5;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(fx(s * 0.075), hy(0.47)); ctx.lineTo(fx(s * 0.03), hy(0.33)); ctx.lineTo(fx(s * 0.06), hy(0.34)); ctx.lineTo(fx(0), hy(0.24)); ctx.stroke(); }
      ctx.fillStyle = A;
      ctx.beginPath(); ctx.moveTo(fx(-0.014), hy(0.42)); ctx.lineTo(fx(0.014), hy(0.42)); ctx.lineTo(fx(0.01), hy(0.395)); ctx.lineTo(fx(-0.01), hy(0.395)); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(fx(-0.009), hy(0.395)); ctx.lineTo(fx(0.009), hy(0.395)); ctx.lineTo(fx(0.024), hy(0.27)); ctx.lineTo(fx(0), hy(0.245)); ctx.lineTo(fx(-0.024), hy(0.27)); ctx.closePath(); ctx.fill();
      for (const h of [0.2, 0.135]) dot(fx(0), hy(h), 8, "#15161b");
      ctx.strokeStyle = seam; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fx(0.07), hy(0.33)); ctx.lineTo(fx(0.115), hy(0.335)); ctx.stroke();
      ctx.fillStyle = "#f7f5ef"; ctx.beginPath(); ctx.moveTo(fx(0.08), hy(0.33)); ctx.lineTo(fx(0.09), hy(0.35)); ctx.lineTo(fx(0.1), hy(0.335)); ctx.lineTo(fx(0.11), hy(0.35)); ctx.lineTo(fx(0.112), hy(0.333)); ctx.fill();
      ctx.strokeStyle = seam; ctx.beginPath(); ctx.moveTo(0, hy(0.02)); ctx.lineTo(0, hy(0.1)); ctx.moveTo(TW, hy(0.02)); ctx.lineTo(TW, hy(0.1)); ctx.stroke();
      break;
    }
    case "uniform": {
      ctx.strokeStyle = seam; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fx(0), hy(0.45)); ctx.lineTo(fx(0), hy(0.1)); ctx.stroke();
      for (const h of [0.39, 0.31, 0.23, 0.16]) dot(fx(0.012), hy(h), 9, A, "rgba(0,0,0,0.35)");
      for (const s of [-1, 1]) {
        rr(fx(s * 0.075) - 34, hy(0.36), 68, 52, 6, "rgba(0,0,0,0.12)");
        rr(fx(s * 0.075) - 36, hy(0.365), 72, 18, 5, "rgba(0,0,0,0.25)");
        dot(fx(s * 0.075), hy(0.355), 5, A);
      }
      // badge on the bean's left chest: a little shield
      ctx.fillStyle = A; ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 3;
      const bx = fx(0.075), by = hy(0.41);
      ctx.beginPath(); ctx.moveTo(bx - 18, by - 14); ctx.lineTo(bx + 18, by - 14); ctx.lineTo(bx + 16, by + 6); ctx.lineTo(bx, by + 18); ctx.lineTo(bx - 16, by + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#1d1f26"; ctx.fillRect(0, hy(0.13), TW, hy(0.09) - hy(0.13));
      rr(fx(0) - 22, hy(0.135), 44, hy(0.085) - hy(0.135), 4, A, "rgba(0,0,0,0.4)", 3);
      break;
    }
    case "apron": {
      // shirt + white apron with bib, waist ties all round with a bow at the back, a pocket with a heart
      ctx.fillStyle = A; ctx.fillRect(0, hy(0.255), TW, hy(0.235) - hy(0.255));
      rr(fx(-0.13), hy(0.25), fx(0.13) - fx(-0.13), hy(0.0) - hy(0.25), 26, A, "rgba(0,0,0,0.15)", 3);
      rr(fx(-0.07), hy(0.42), fx(0.07) - fx(-0.07), hy(0.24) - hy(0.42), 14, A, "rgba(0,0,0,0.15)", 3);
      for (const s of [-1, 1]) { ctx.strokeStyle = A; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(fx(s * 0.06), hy(0.42)); ctx.lineTo(fx(s * 0.11), hy(0.5)); ctx.stroke(); }
      rr(fx(-0.06), hy(0.18), fx(0.06) - fx(-0.06), hy(0.07) - hy(0.18), 12, "rgba(0,0,0,0.0)", "rgba(0,0,0,0.25)", 4);
      ctx.fillStyle = o.accent2 ?? "#d9534f";
      const hx = fx(0), hh = hy(0.125);
      ctx.beginPath(); ctx.moveTo(hx, hh + 16); ctx.bezierCurveTo(hx - 30, hh - 4, hx - 14, hh - 24, hx, hh - 8); ctx.bezierCurveTo(hx + 14, hh - 24, hx + 30, hh - 4, hx, hh + 16); ctx.fill();
      for (const x of [0, TW]) { ctx.fillStyle = A; ctx.beginPath(); ctx.ellipse(x - 28, hy(0.245), 30, 16, 0.3, 0, Math.PI * 2); ctx.ellipse(x + 28, hy(0.245), 30, 16, -0.3, 0, Math.PI * 2); ctx.fill(); }
      break;
    }
    case "hoodie": {
      ctx.fillStyle = "rgba(0,0,0,0.14)"; ctx.fillRect(0, hy(0.045), TW, hy(0) - hy(0.045));
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.beginPath(); ctx.moveTo(fx(-0.08), hy(0.2)); ctx.lineTo(fx(0.08), hy(0.2)); ctx.lineTo(fx(0.115), hy(0.06)); ctx.lineTo(fx(-0.115), hy(0.06)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)"; ctx.lineWidth = 4; ctx.stroke();
      for (const s of [-1, 1]) {
        ctx.strokeStyle = A; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(fx(s * 0.03), hy(0.43)); ctx.quadraticCurveTo(fx(s * 0.036), hy(0.36), fx(s * 0.03), hy(0.3)); ctx.stroke();
        dot(fx(s * 0.03), hy(0.295), 8, A);
      }
      // a little bean logo
      ctx.fillStyle = A; ctx.beginPath(); ctx.ellipse(fx(0), hy(0.26), 22, 30, 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = o.base; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(fx(0) + 14, hy(0.26), 18, Math.PI * 0.75, Math.PI * 1.25); ctx.stroke();
      break;
    }
    case "dress": {
      for (let y = 0; y < TH; y += 52) for (let x = (y / 52) % 2 ? 26 : 0; x < TW + 30; x += 52) dot(x, y + 18, 9, A);
      ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.fillRect(0, hy(0.235), TW, hy(0.21) - hy(0.235));
      for (const s of [-1, 1]) { ctx.fillStyle = A; ctx.beginPath(); ctx.ellipse(fx(s * 0.045), hy(0.43), 52, 30, s * -0.35, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 3; ctx.stroke(); }
      break;
    }
    case "chef": {
      for (const s of [-1, 1]) for (const h of [0.36, 0.28, 0.2]) dot(fx(s * 0.05), hy(h), 9, A2);
      ctx.strokeStyle = seam; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fx(-0.085), hy(0.45)); ctx.quadraticCurveTo(fx(0.05), hy(0.3), fx(0.085), hy(0.05)); ctx.stroke();
      ctx.fillStyle = A; ctx.beginPath(); ctx.moveTo(fx(-0.085), hy(0.47)); ctx.lineTo(fx(0.085), hy(0.47)); ctx.lineTo(fx(0), hy(0.38)); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.08)"; ctx.fillRect(0, hy(0.04), TW, hy(0) - hy(0.04));
      break;
    }
    case "labcoat": {
      ctx.fillStyle = A; ctx.fillRect(fx(-0.04), 0, fx(0.04) - fx(-0.04), hy(0.12));
      ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 4;
      for (const s of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(fx(s * 0.04), hy(0.47)); ctx.lineTo(fx(s * 0.04), hy(0)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(fx(s * 0.04), hy(0.43)); ctx.lineTo(fx(s * 0.085), hy(0.36)); ctx.lineTo(fx(s * 0.04), hy(0.28)); ctx.stroke();
        rr(fx(s * 0.1) - 36, hy(0.16), 72, 54, 6, "rgba(0,0,0,0.05)", "rgba(0,0,0,0.25)", 3);
      }
      // pens in the chest pocket
      rr(fx(0.085) - 26, hy(0.34), 52, 40, 5, "rgba(0,0,0,0.04)", "rgba(0,0,0,0.25)", 3);
      for (const [x, c] of [[-10, "#2c66c9"], [4, "#d63a3a"], [16, "#2b2b2b"]] as const) { ctx.fillStyle = c; ctx.fillRect(fx(0.085) + x - 3, hy(0.36), 6, 20); }
      dot(fx(0.04) + 14, hy(0.21), 7, "#d8d8d2", "rgba(0,0,0,0.3)");
      break;
    }
  }
}
const outfitTexture = (o: Outfit) => {
  const key = JSON.stringify(o);
  let t = OUTFIT_CACHE.get(key);
  if (!t) {
    const c = document.createElement("canvas"); c.width = TW; c.height = TH;
    drawOutfit(c.getContext("2d")!, o);
    t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = THREE.RepeatWrapping;
    OUTFIT_CACHE.set(key, t);
  }
  return t;
};

const darker = (hex: string, k: number) => "#" + new THREE.Color(hex).multiplyScalar(k).getHexString();

// ---- parts ----
const Hair: React.FC<{ kind: HairKind; c: string; hat: boolean }> = ({ kind, c, hat }) => {
  if (kind === "none") return null;
  const sideShell = (w: number, tEnd: number, rr = 1.035) => (
    <mesh castShadow><sphereGeometry args={[R * rr, 48, 32, Math.PI / 2 + w, Math.PI * 2 - 2 * w, 0, tEnd]} /><Mat c={c} r={0.85} side={THREE.DoubleSide} /></mesh>
  );
  const top = (tTop: number, rr = 1.045) => (
    <mesh castShadow><sphereGeometry args={[R * rr, 48, 24, 0, Math.PI * 2, 0, tTop]} /><Mat c={c} r={0.85} side={THREE.DoubleSide} /></mesh>
  );
  const ball = (theta: number, d: number, rad: number, k = 1.0, key?: string | number) => {
    const p = dirOn(theta, d).multiplyScalar(R * k);
    return <mesh key={key} position={p} castShadow><sphereGeometry args={[rad, 20, 14]} /><Mat c={c} r={0.85} /></mesh>;
  };
  switch (kind) {
    case "short": return <>{top(hat ? 1.0 : 0.82)}{sideShell(1.05, 1.32)}</>;
    case "messy": return (
      <>{top(0.84)}{sideShell(1.05, 1.3)}
        {[[0.75, -0.35], [0.78, 0.0], [0.72, 0.35], [0.55, -0.6], [0.55, 0.62]].map(([t, d], i) => (
          <mesh key={i} position={dirOn(t, d).multiplyScalar(R * 1.03)} rotation={[0.5, d, 0]} castShadow><coneGeometry args={[0.035, 0.07, 10]} /><Mat c={c} r={0.85} /></mesh>
        ))}
      </>
    );
    case "bob": return <>{top(1.0)}{sideShell(0.82, 1.98, 1.05)}</>;
    case "sidePart": return (
      <>{top(0.86)}{sideShell(1.05, 1.28)}
        <mesh position={dirOn(0.55, -0.28).multiplyScalar(R * 0.935)} rotation={[0.75, -0.28, 0.15]} scale={[1.5, 0.4, 1.15]} castShadow><sphereGeometry args={[0.085, 24, 16]} /><Mat c={c} r={0.85} /></mesh>
      </>
    );
    case "buns": return <>{top(0.9)}{sideShell(0.95, 1.5)}{ball(0.62, 1.35, 0.085, 1.08)}{ball(0.62, -1.35, 0.085, 1.08)}</>;
    case "topBun": return <>{top(0.92)}{sideShell(0.95, 1.4)}{ball(0.12, Math.PI, 0.1, 1.12)}</>;
    case "curly": return (
      <>{top(0.85, 1.03)}{sideShell(1.05, 1.25, 1.02)}
        {Array.from({ length: 26 }, (_, i) => {
          const t = 0.15 + ((i * 37) % 26) / 26 * 1.0, d = i * 2.39996;
          if (t > 0.78 && Math.cos(d) > 0.45) return null; // keep the forehead clear
          return ball(t, d, 0.05 + (i % 3) * 0.008, 1.05, i);
        })}
      </>
    );
  }
  return null;
};

const Hat: React.FC<{ kind: HatKind; c: string; accent?: string }> = ({ kind, c, accent }) => {
  const top = R * HEAD_SCALE[1];
  if (kind === "cop") return (
    <group position={[0, top - 0.105, 0]}>
      <mesh position={[0, 0.07, 0]} castShadow><cylinderGeometry args={[0.245, 0.222, 0.14, 40]} /><Mat c={c} r={0.6} /></mesh>
      <mesh position={[0, 0.142, 0]} castShadow><cylinderGeometry args={[0.25, 0.245, 0.012, 40]} /><Mat c={c} r={0.6} /></mesh>
      <mesh position={[0, 0.018, 0]}><cylinderGeometry args={[0.226, 0.226, 0.036, 40]} /><Mat c="#16181d" r={0.4} /></mesh>
      <mesh position={[0, 0.005, 0.2]} rotation={[0.28, 0, 0]} scale={[1, 1, 0.55]} castShadow><cylinderGeometry args={[0.16, 0.16, 0.012, 32, 1, false, -Math.PI / 2, Math.PI]} /><Mat c="#16181d" r={0.35} /></mesh>
      <mesh position={[0, 0.075, 0.236]} rotation={[-0.15, 0, 0]}><cylinderGeometry args={[0.028, 0.028, 0.01, 20]} /><Mat c={accent ?? "#e3b341"} r={0.35} /></mesh>
    </group>
  );
  if (kind === "chef") return (
    <group position={[0, top - 0.09, 0]}>
      <mesh position={[0, 0.06, 0]} castShadow><cylinderGeometry args={[0.215, 0.205, 0.12, 40]} /><Mat c={c} r={0.9} /></mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return <mesh key={i} position={[Math.sin(a) * 0.11, 0.21, Math.cos(a) * 0.11]} castShadow><sphereGeometry args={[0.13, 24, 16]} /><Mat c={c} r={0.9} /></mesh>;
      })}
      <mesh position={[0, 0.27, 0]} castShadow><sphereGeometry args={[0.15, 24, 16]} /><Mat c={c} r={0.9} /></mesh>
    </group>
  );
  return null;
};

/** Inventor's goggles resting on the forehead: a strap round the head and two brass-rimmed lenses above the eyes. */
const Goggles: React.FC<{ g: NonNullable<Look["goggles"]> }> = ({ g }) => {
  const th = Math.PI / 2 - 0.52;
  const parts = useMemo(() => [-1, 1].map((s) => {
    const dir = dirOn(th, s * 0.36);
    return { pos: dir.clone().multiplyScalar(R * 1.04), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir) };
  }), []);
  const ringR = R * Math.sin(th) * 1.012, y = R * Math.cos(th);
  return (
    <>
      <mesh position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[ringR, R * 0.045, 12, 64]} /><Mat c={g.strap} r={0.8} /></mesh>
      {parts.map((p, i) => (
        <group key={i} position={p.pos} quaternion={p.q}>
          <mesh castShadow><cylinderGeometry args={[R * 0.2, R * 0.22, R * 0.14, 32]} /><meshStandardMaterial color={g.frame} roughness={0.3} metalness={0.75} /></mesh>
          <mesh position={[0, R * 0.072, 0]}><cylinderGeometry args={[R * 0.165, R * 0.165, 0.004, 32]} /><meshStandardMaterial color={g.lens} roughness={0.08} metalness={0.2} emissive={g.lens} emissiveIntensity={0.35} /></mesh>
          <mesh position={[R * 0.06, R * 0.076, R * 0.06]}><sphereGeometry args={[R * 0.035, 12, 10]} /><meshBasicMaterial color="#ffffff" /></mesh>
        </group>
      ))}
    </>
  );
};

const Glasses: React.FC<{ c: string }> = ({ c }) => {
  const parts = useMemo(() => {
    const th = Math.PI / 2 + FACE.eyeY, rr = R * 1.05;
    const eyes = [-1, 1].map((s) => {
      const dir = dirOn(th, s * FACE.eyeDx);
      return { pos: dir.clone().multiplyScalar(rr), q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir) };
    });
    const ring = R * (FACE.eyeRy + 0.03);
    const inner = [-1, 1].map((s) => dirOn(th, s * (FACE.eyeDx - FACE.eyeRx - 0.06)).multiplyScalar(rr * 0.99));
    const outer = [-1, 1].map((s) => dirOn(th, s * (FACE.eyeDx + FACE.eyeRx + 0.06)).multiplyScalar(rr * 0.99));
    const ear = [-1, 1].map((s) => dirOn(th + 0.05, s * 1.45).multiplyScalar(R * 1.02));
    return { eyes, ring, inner, outer, ear };
  }, []);
  return (
    <>
      {parts.eyes.map((e, i) => (
        <mesh key={i} position={e.pos} quaternion={e.q} castShadow><torusGeometry args={[parts.ring, 0.007, 8, 32]} /><Mat c={c} r={0.35} /></mesh>
      ))}
      <Stick a={parts.inner[0]} b={parts.inner[1]} r={0.006} c={c} />
      <Stick a={parts.outer[0]} b={parts.ear[0]} r={0.005} c={c} />
      <Stick a={parts.outer[1]} b={parts.ear[1]} r={0.005} c={c} />
    </>
  );
};

const Hand: React.FC<{ skin: string; point?: boolean; children?: React.ReactNode }> = ({ skin, point, children }) => (
  <group>
    <mesh scale={[0.85, 1.12, 0.72]} castShadow><sphereGeometry args={[0.033, 18, 14]} /><Mat c={skin} /></mesh>
    <mesh position={[0, 0.006, 0.024]} castShadow><sphereGeometry args={[0.014, 12, 10]} /><Mat c={skin} /></mesh>
    {point && <mesh position={[0, -0.04, 0.0]} castShadow><capsuleGeometry args={[0.011, 0.035, 4, 10]} /><Mat c={skin} /></mesh>}
    {children}
  </group>
);

const Arm: React.FC<{ side: 1 | -1; a: [number, number, number]; skin: string; point?: boolean; hold?: React.ReactNode }> = ({ side, a, skin, point, hold }) => (
  <group position={[side * SH_X, SH_Y, 0]} rotation={[0, 0, side * a[0] * D]}>
    <group rotation={[-a[1] * D, 0, 0]}>
      <mesh position={[0, -UA / 2, 0]} castShadow><cylinderGeometry args={[AR, AR, UA, 8]} /><Mat c="#141414" r={0.45} /></mesh>
      <mesh position={[0, -UA, 0]}><sphereGeometry args={[AR, 8, 8]} /><Mat c="#141414" r={0.45} /></mesh>
      <group position={[0, -UA, 0]} rotation={[-a[2] * D, 0, 0]}>
        <mesh position={[0, -FA / 2, 0]} castShadow><cylinderGeometry args={[AR, AR, FA, 8]} /><Mat c="#141414" r={0.45} /></mesh>
        <group position={[0, -FA - 0.02, 0]}><Hand skin={skin} point={point}>{hold}</Hand></group>
      </group>
    </group>
  </group>
);

const Leg: React.FC<{ side: 1 | -1; l: [number, number]; shoe: string }> = ({ side, l, shoe }) => (
  <group position={[side * HIP_X, 0, 0]} rotation={[-l[0] * D, 0, 0]}>
    <mesh position={[0, -L1 / 2, 0]} castShadow><cylinderGeometry args={[LR, LR, L1, 8]} /><Mat c="#141414" r={0.45} /></mesh>
    <mesh position={[0, -L1, 0]}><sphereGeometry args={[LR, 8, 8]} /><Mat c="#141414" r={0.45} /></mesh>
    <group position={[0, -L1, 0]} rotation={[l[1] * D, 0, 0]}>
      <mesh position={[0, -L2 / 2, 0]} castShadow><cylinderGeometry args={[LR, LR, L2, 8]} /><Mat c="#141414" r={0.45} /></mesh>
      <group position={[0, -L2, 0]} rotation={[(l[0] - l[1]) * D, 0, 0]}>
        <mesh position={[0, 0.002, 0.022]} rotation={[Math.PI / 2, 0, 0]} scale={[1.1, 1, 0.9]} castShadow><capsuleGeometry args={[AH, 0.045, 6, 14]} /><Mat c={shoe} r={0.5} /></mesh>
      </group>
    </group>
  </group>
);

// ---- the bean ----
export const Bean3D: React.FC<{
  look: Look; pose?: Pose; expr?: Expr; position?: [number, number, number]; yaw?: number; scale?: number;
  headOnly?: boolean; hold?: React.ReactNode; breathe?: number; tilt?: [number, number]; holdL?: React.ReactNode;
}> = ({ look, pose = POSES.stand, expr = EXPR.neutral, position = [0, 0, 0], yaw = 0, scale = 1, headOnly, hold, breathe = 0, tilt, holdL }) => {
  const skin = SKIN[look.skin];
  const outfit = useMemo(() => outfitTexture(look.outfit), [JSON.stringify(look.outfit)]);
  const brow = look.hair.kind === "none" ? "#3a2418" : darker(look.hair.color, 0.75);
  const hipY = pose.ground === false ? pose.hipY ?? groundHipY(pose) : groundHipY(pose);
  const sq = (pose.squash ?? 1) * (1 + 0.02 * breathe);
  const [hp, hyaw, hr] = pose.head ?? [0, 0, 0];

  const head = (
    <group rotation={[hp * D, hyaw * D, hr * D]}>
      <group position={[0, R * HEAD_SCALE[1] * 0.75, 0]}>
        <group scale={HEAD_SCALE}>
          <mesh castShadow receiveShadow><sphereGeometry args={[R, 64, 48]} /><Mat c={skin} r={0.68} /></mesh>
          <FacePatch R={R} expr={expr} skin={skin} brow={brow} moustache={look.moustache ? darker(look.hair.color, 0.8) : undefined} />
          <mesh position={dirOn(Math.PI / 2 + FACE.noseY, 0).multiplyScalar(R * 0.985)} castShadow><sphereGeometry args={[0.034, 20, 16]} /><Mat c={darker(skin, 0.96)} r={0.6} /></mesh>
          <Hair kind={look.hair.kind} c={look.hair.color} hat={!!look.hat} />
          {look.glasses && <Glasses c={look.glasses} />}
          {look.goggles && <Goggles g={look.goggles} />}
        </group>
        {look.hat && <Hat kind={look.hat.kind} c={look.hat.color} accent={look.hat.accent} />}
      </group>
    </group>
  );

  if (headOnly) return <group position={position} rotation={[0, yaw, 0]} scale={scale}>{head}</group>;

  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <group rotation={[(tilt?.[0] ?? 0) * D, 0, (tilt?.[1] ?? 0) * D]}>
      <group position={[0, hipY, 0]}>
        <Leg side={1} l={pose.legL} shoe={look.shoes} />
        <Leg side={-1} l={pose.legR} shoe={look.shoes} />
        <group rotation={[(pose.lean ?? 0) * D, 0, (pose.roll ?? 0) * D]}>
          <group position={[0, -HIP_IN, 0]}>
            <group scale={[1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)]}>
              <mesh geometry={bodyGeometry()} scale={[1, 1, 0.9]} castShadow receiveShadow><Mat c="#fff" map={outfit} r={0.78} /></mesh>
              {look.outfit.kind === "dress" && (
                <mesh position={[0, 0.03, 0]} castShadow><cylinderGeometry args={[RB * 1.02, RB * 1.32, 0.12, 48, 1, true]} /><Mat c={look.outfit.base} r={0.78} side={THREE.DoubleSide} /></mesh>
              )}
              {look.outfit.kind === "hoodie" && (
                <mesh position={[0, BODY_H - 0.075, -0.045]} rotation={[Math.PI / 2 + 0.35, 0, 0]} castShadow><torusGeometry args={[0.11, 0.04, 14, 32]} /><Mat c={darker(look.outfit.base, 0.92)} r={0.85} /></mesh>
              )}
              <Arm side={1} a={pose.armL} skin={skin} hold={holdL} />
              <Arm side={-1} a={pose.armR} skin={skin} point={pose.pointR} hold={hold} />
            </group>
            <group position={[0, NECK * sq, 0]}>{head}</group>
          </group>
        </group>
      </group>
      </group>
    </group>
  );
};

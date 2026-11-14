// The blocky toy character (notes/short06/CONTRACT.md, role RIG). Our own design in the classic blocky-game proportions:
// a 2x2x1 box torso, 1x2x1 box arms and legs pivoting at the shoulder and hip, a rounded-cylinder head slightly wider than
// tall with a drawn decal face (makeFaceTexture, owned by FACE), glossy plastic skin and printed-fabric clothes.
// Units: rig units, 5 tall with feet on y=0 (legs 0..2, torso 2..4, head ~4..5). `scale` multiplies (default 1).
// Facing +z; the character's LEFT is +x. Pose angles in radians: arm/leg > 0 swings FORWARD (pi = straight up),
// armLOut/armROut > 0 raises the arm SIDEWAYS away from the body (< 0 swings it across the chest), head = [yaw (+ = turn to
// its left), pitch (+ = look down)], lean > 0 tips the upper body forward from the hips.
// Held props: `hold={{ R: <Razor/> }}`. The prop's origin sits in the palm at the end of the arm; its +y points out of the
// top of the fist (forward when the arm hangs, straight up when the arm is raised forward to pi/2, like a classic
// blocky-game tool grip) and its +z runs down the arm toward the fingertips. Model props in rig units.
import React, { useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame } from "remotion";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Expr, Look, Pose, Walk } from "./types";
import { makeFaceTexture } from "./BlockFace";
import { Glasses, Hair, Hat } from "./Accessories";

const geoCache = new Map<string, THREE.BufferGeometry>();
const rbox = (w: number, h: number, d: number, r = 0.08) => {
  const k = `${w},${h},${d},${r}`;
  if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(w, h, d, 3, r));
  return geoCache.get(k)!;
};

// ---- head: a rounded cylinder, radius HEAD_R (wider than its 1.0 height), centred at its local origin ----
export const HEAD_R = 0.58;
/** Hair, hats and glasses are modelled for a radius-0.5 head; they are scaled by this to fit. */
const HEAD_SX = HEAD_R / 0.5;
let headGeo: THREE.LatheGeometry | null = null;
const getHeadGeo = () => {
  if (headGeo) return headGeo;
  const r = HEAD_R, h = 0.5, b = 0.22, pts: THREE.Vector2[] = [new THREE.Vector2(0, -h)];
  for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + (i / 10) * (Math.PI / 2); pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, -h + b + Math.sin(a) * b)); }
  for (let i = 0; i <= 10; i++) { const a = (i / 10) * (Math.PI / 2); pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, h - b + Math.sin(a) * b)); }
  pts.push(new THREE.Vector2(0, h));
  headGeo = new THREE.LatheGeometry(pts, 64);
  return headGeo;
};
// The face decal: a curved strip just outside the head's front. Same physical size as before (1.34 wide arc x 0.84 tall),
// so FACE's 512x512 canvas maps exactly as it did on the first rig.
const FACE_ARC = (0.84 * Math.PI * 0.507) / (HEAD_R + 0.007);
let faceGeo: THREE.CylinderGeometry | null = null;
const getFaceGeo = () => (faceGeo ??= new THREE.CylinderGeometry(HEAD_R + 0.007, HEAD_R + 0.007, 0.84, 40, 1, true, -FACE_ARC / 2, FACE_ARC));

// ---- printed fabric: base colour + pattern + canvas weave noise (seeded, so every render process draws the same) ----
type Pattern = "plain" | "stripes" | "plaid" | "pajamas";
const prng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const lum = (hex: string) => { const c = new THREE.Color(hex); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; };
const texCache = new Map<string, { map: THREE.CanvasTexture; bump: THREE.CanvasTexture }>();
const N = 256;
/** `rows` = how many stripe/plaid repeats run down this part (so a 2-tall torso and a 1.4-tall sleeve print alike). */
const fabricTex = (pattern: Pattern, base: string, rows: number) => {
  const k = `${pattern}|${base}|${rows}`;
  if (texCache.has(k)) return texCache.get(k)!;
  const c = document.createElement("canvas"); c.width = c.height = N; const g = c.getContext("2d")!;
  const dark = lum(base) > 0.42;
  g.fillStyle = base; g.fillRect(0, 0, N, N);
  const p = N / rows; // one repeat in px
  if (pattern === "stripes") {
    // bold horizontal stripes like the sample's bee shirt: dark ink on light cloth, light on dark cloth
    g.fillStyle = dark ? "rgba(22,20,18,0.92)" : "rgba(255,255,255,0.7)";
    for (let y = 0; y < N; y += p) g.fillRect(0, Math.round(y + p * 0.5), N, Math.round(p * 0.45));
  } else if (pattern === "plaid") {
    // a knit check: wide dark bands both ways (darker where they cross), thin light threads between them
    g.fillStyle = "rgba(0,0,0,0.2)";
    for (let i = 0; i < N; i += p) { g.fillRect(i + p * 0.1, 0, p * 0.36, N); g.fillRect(0, i + p * 0.1, N, p * 0.36); }
    g.fillStyle = "rgba(0,0,0,0.12)";
    for (let i = 0; i < N; i += p) g.fillRect(0, i + p * 0.62, N, p * 0.08);
    g.fillStyle = "rgba(255,255,255,0.22)";
    for (let i = 0; i < N; i += p) { g.fillRect(i + p * 0.72, 0, Math.max(2, p * 0.05), N); g.fillRect(0, i + p * 0.8, N, Math.max(2, p * 0.05)); }
  } else if (pattern === "pajamas") {
    // soft flannel: thin pale pinstripes and little pale stars/moons scattered on a grid
    g.fillStyle = "rgba(255,255,255,0.18)";
    for (let x = 0; x < N; x += p * 0.5) g.fillRect(x, 0, Math.max(2, p * 0.04), N);
    const r = prng(7);
    g.fillStyle = "rgba(255,250,225,0.85)";
    for (let y = 0; y < N; y += p * 0.5) for (let x = 0; x < N; x += p * 0.5) {
      const cx = x + p * 0.25 + (r() - 0.5) * p * 0.12, cy = y + p * 0.25 + (r() - 0.5) * p * 0.12, s = p * 0.07;
      if (((x + y) / (p * 0.5)) % 2 < 1) { // star
        g.beginPath();
        for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? s * 0.45 : s; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
        g.closePath(); g.fill();
      } else { // crescent moon
        g.beginPath(); g.arc(cx, cy, s * 0.9, 0, Math.PI * 2); g.fill();
        g.fillStyle = base; g.beginPath(); g.arc(cx + s * 0.45, cy - s * 0.2, s * 0.8, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(255,250,225,0.85)";
      }
    }
  }
  // canvas weave: per-pixel grain + faint thread lines, both in the colour map (shading) and a bump map (light catches it)
  const img = g.getImageData(0, 0, N, N), d = img.data, r = prng(base.length * 131 + rows * 17 + pattern.length);
  const bc = document.createElement("canvas"); bc.width = bc.height = N; const bg = bc.getContext("2d")!;
  const bimg = bg.createImageData(N, N), bd = bimg.data;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = (y * N + x) * 4;
    const weave = ((x % 3 === 0 ? 1 : 0) + (y % 3 === 0 ? 1 : 0)) * 0.5; // thread grid
    const n = (r() - 0.5) * 0.09 - weave * 0.035;
    for (let ch = 0; ch < 3; ch++) d[i + ch] = Math.max(0, Math.min(255, d[i + ch] * (1 + n)));
    const h = 128 + (r() - 0.5) * 60 - weave * 50;
    bd[i] = bd[i + 1] = bd[i + 2] = h; bd[i + 3] = 255;
  }
  g.putImageData(img, 0, 0); bg.putImageData(bimg, 0, 0);
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const bump = new THREE.CanvasTexture(bc);
  for (const t of [map, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.needsUpdate = true; }
  const v = { map, bump }; texCache.set(k, v); return v;
};

const faceTex = (expr: Expr, blink: number) => makeFaceTexture(expr, Math.max(0, Math.min(1, blink))); // FACE caches

// ---- materials ----
/** Slightly glossy plastic (skin): a soft clearcoat sheen like the sample's toy heads and hands. */
const Skin: React.FC<{ color: string }> = ({ color }) => (
  <meshPhysicalMaterial color={color} roughness={0.42} metalness={0} clearcoat={0.35} clearcoatRoughness={0.35} />
);
/** Printed cloth: canvas-weave map + bump, matte. */
const Cloth: React.FC<{ color: string; pattern?: Pattern; rows: number }> = ({ color, pattern = "plain", rows }) => {
  const { map, bump } = fabricTex(pattern, color, rows);
  return <meshStandardMaterial color="#ffffff" map={map} bumpMap={bump} bumpScale={0.6} roughness={0.88} metalness={0} />;
};

const smooth = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Rows of pattern per rig unit of height (stripes ~3 per unit, like the sample's bee shirt). */
const ROWS: Record<Pattern, number> = { plain: 1, stripes: 3, plaid: 1.6, pajamas: 1.5 };

// ---- the skeleton (shared with Collide.ts, so collision checks see exactly what renders) ----
/** Shoulder pivot: inside the arm, half a unit below the shoulder top (like the classic game), so a raised arm stays
 *  joined to the torso. The arm block spans +0.5 .. -1.5 around it (sleeve +0.5..-0.9, hand -0.9..-1.5). */
export const SHOULDER = { x: 1.5, y: 3.5, top: 0.5, len: 2 } as const;
/** Hand frame: rotate a held prop so its +y is "out of the top of the fist" (= the arm's +z) and its +z runs down the arm. */
export const HAND: { pos: [number, number, number]; rot: [number, number, number] } = { pos: [0, -1.36, 0.08], rot: [Math.PI / 2, 0, 0] };
/** Overhead splay so a raised arm never cuts through the head (0 when the arm hangs: no gap at the hip). */
export const splayFor = (angle: number) => 0.18 * smooth(1.4, 2.6, angle);
/** A sideways-raised arm slides out at the shoulder (its top would otherwise tuck into the chest, since the pivot sits
 *  0.5 below the arm's top): the shoulder moves out by 0.5 sin(sideways angle). */
export const shoulderSlide = (sideways: number) => SHOULDER.top * Math.sin(Math.max(0, sideways));

/** Debug tint for a part that is inside a wall, prop or another person (BlockChar `hits`, from Collide.ts clipParts). */
const HitMat: React.FC = () => <meshBasicMaterial color="#ff00ff" />;

const Arm: React.FC<{ side: 1 | -1; angle: number; out: number; look: Look; pattern: Pattern; prop?: React.ReactNode; hit?: boolean }> = ({ side, angle, out, look, pattern, prop, hit }) => (
  <group position={[side * (SHOULDER.x + shoulderSlide(splayFor(angle) + out)), SHOULDER.y, 0]} rotation={[-angle, 0, side * (splayFor(angle) + out)]}>
    <mesh position={[0, -0.2, 0]} geometry={rbox(1, 1.4, 1, 0.07)} castShadow receiveShadow>
      {hit ? <HitMat /> : <Cloth color={look.shirt} pattern={pattern} rows={Math.max(1, Math.round(ROWS[pattern] * 1.4))} />}
    </mesh>
    {/* the hand: same width as the sleeve and overlapping it, so it reads as one solid block (no floating cube) */}
    <mesh position={[0, -1.19, 0]} geometry={rbox(0.995, 0.62, 0.995, 0.05)} castShadow receiveShadow>{hit ? <HitMat /> : <Skin color={look.skin} />}</mesh>
    {prop && <group position={HAND.pos} rotation={HAND.rot}>{prop}</group>}
  </group>
);

const Leg: React.FC<{ side: 1 | -1; angle: number; look: Look; pattern: Pattern; hit?: boolean }> = ({ side, angle, look, pattern, hit }) => (
  <group position={[side * 0.5, 2, 0]} rotation={[-angle, 0, 0]}>
    <mesh position={[0, -0.85, 0]} geometry={rbox(0.99, 1.7, 0.99, 0.06)} castShadow receiveShadow>
      {hit ? <HitMat /> : <Cloth color={look.pants} pattern={pattern} rows={pattern === "pajamas" ? 3 : 1} />}
    </mesh>
    {pattern === "pajamas" ? ( // bare feet below pyjama cuffs
      <mesh position={[0, -1.85, 0.02]} geometry={rbox(0.95, 0.3, 1.0, 0.08)} castShadow receiveShadow>{hit ? <HitMat /> : <Skin color={look.skin} />}</mesh>
    ) : (
      <mesh position={[0, -1.85, 0.04]} geometry={rbox(1.0, 0.3, 1.06, 0.06)} castShadow receiveShadow>
        {hit ? <HitMat /> : <meshStandardMaterial color="#2a2522" roughness={0.55} metalness={0} />}
      </mesh>
    )}
  </group>
);

/** Every joint value the rig renders, from its props (pure; Collide.ts uses it for forward kinematics). */
export const solveRig = (pose: Pose = {}, walk?: Walk, breathe = 0) => {
  const w = walk ? walk.amount : 0, ph = walk ? walk.phase : 0;
  const swing = Math.sin(ph) * 0.75 * w; // stiff toy swing, arms opposite legs
  const legL = (pose.legL ?? 0) + swing, legR = (pose.legR ?? 0) - swing;
  const armL = (pose.armL ?? 0) - swing + 0.03 * breathe * (1 - w), armR = (pose.armR ?? 0) + swing + 0.03 * breathe * (1 - w);
  // feet planted: a leg is a rigid block (2 from hip to sole, about 0.5 from its centre line to the toe/heel). Swung by a,
  // its lowest corner sits 2cos(a) + 0.5sin(a) below the hip, so the hips move by exactly the difference: the sole's
  // corner touches the floor all through the stride (no heel or toe sinking, no floating). A run adds a hop at mid-stride.
  const a = Math.min(1.3, Math.abs(swing));
  const drop = walk ? 2 - 2 * Math.cos(a) - 0.5 * Math.sin(a) : 0;
  const bob = -drop + (walk?.flight ?? 0) * Math.pow(Math.abs(Math.cos(ph)), 3) * 0.4 * w;
  const sway = Math.sin(ph) * 0.04 * w + (pose.roll ?? 0);
  const [hy, hp] = pose.head ?? [0, 0];
  return { legL, legR, armL, armR, armLOut: pose.armLOut ?? 0, armROut: pose.armROut ?? 0, bob, sway, lean: pose.lean ?? 0, twist: pose.twist ?? 0, hy, hp, tilt: pose.tilt ?? 0 };
};
export type RigParts = "armL" | "armR" | "legL" | "legR" | "torso" | "head";

export type BlockCharProps = {
  look: Look; expr?: Expr; pose?: Pose; walk?: Walk; position?: [number, number, number]; yaw?: number; scale?: number;
  /** 0 open .. 1 shut (add blinkCurve(t, seed) for natural blinks) */
  blink?: number;
  /** props parented to the hands (R = the character's right hand, on -x). Modelled in rig units, +y out of the fist. */
  hold?: { R?: React.ReactNode; L?: React.ReactNode };
  /** no idle breathing (for a frozen, eerie stillness, e.g. the reflection or the staring family) */
  still?: boolean;
  /** de-syncs breathing between characters (default: from the start position; pass one for a moving character) */
  seed?: number;
  /** review only: parts flagged here render flat magenta (#ff00ff) (use clipParts() from Collide.ts to find them) */
  hits?: Partial<Record<RigParts, boolean>>;
};

export const BlockChar: React.FC<BlockCharProps> = ({ look, expr = "smile", pose = {}, walk, position = [0, 0, 0], yaw = 0, scale = 1, blink = 0, hold, still, seed: seedIn, hits }) => {
  const f = useCurrentFrame();
  const seed = seedIn ?? position[0] * 1.37 + position[2] * 0.71; // de-sync idle between characters
  const t = f / 30 + seed;
  const breathe = still ? 0 : Math.sin(t * 2.2);

  const { legL, legR, armL, armR, armLOut, armROut, bob, sway, lean, twist, hy, hp, tilt } = solveRig(pose, walk, breathe);

  const pat: Pattern = look.shirtPattern ?? "plain";
  const legPat: Pattern = pat === "pajamas" ? "pajamas" : "plain";
  const face = useMemo(() => faceTex(expr, blink), [expr, blink]);

  return (
    <group position={position} rotation={[0, yaw, 0]} scale={scale}>
      <group position={[0, bob, 0]} rotation={[0, 0, sway]}>
        <Leg side={1} angle={legL} look={look} pattern={legPat} hit={hits?.legL} />
        <Leg side={-1} angle={legR} look={look} pattern={legPat} hit={hits?.legR} />
        {/* upper body pivots at the hips for lean */}
        <group position={[0, 2, 0]} rotation={[lean, twist, 0]}>
          <group position={[0, -2, 0]}>
            <group position={[0, 3, 0]} scale={[1 + 0.006 * breathe, 1 + 0.012 * breathe, 1 + 0.01 * breathe]}>
              <mesh geometry={rbox(2, 2, 1, 0.1)} castShadow receiveShadow>{hits?.torso ? <HitMat /> : <Cloth color={look.shirt} pattern={pat} rows={Math.round(ROWS[pat] * 2)} />}</mesh>
              {pat === "pajamas" && ( // a contrasting collar trim
                <mesh position={[0, 0.93, 0.02]}><boxGeometry args={[1.0, 0.1, 1.0]} /><meshStandardMaterial color="#f2efe6" roughness={0.85} /></mesh>
              )}
              {look.tie && (
                <group position={[0, 0.25, 0.51]}>
                  <mesh position={[0, 0.55, 0]}><boxGeometry args={[0.26, 0.2, 0.04]} /><meshStandardMaterial color={look.tie} roughness={0.6} /></mesh>
                  <mesh position={[0, 0, 0]}><boxGeometry args={[0.2, 0.95, 0.04]} /><meshStandardMaterial color={look.tie} roughness={0.6} /></mesh>
                </group>
              )}
            </group>
            <Arm side={1} angle={armL} out={armLOut} look={look} pattern={pat} prop={hold?.L} hit={hits?.armL} />
            <Arm side={-1} angle={armR} out={armROut} look={look} pattern={pat} prop={hold?.R} hit={hits?.armR} />
            {/* neck + head */}
            <mesh position={[0, 4.05, 0]} castShadow><cylinderGeometry args={[0.3, 0.3, 0.12, 24]} /><Skin color={look.skin} /></mesh>
            <group position={[0, 4.56 + 0.01 * breathe, 0]} rotation={[0, hy, 0]}>
              <group rotation={[hp, 0, tilt]}>
                <mesh geometry={getHeadGeo()} castShadow receiveShadow>{hits?.head ? <HitMat /> : <Skin color={look.skin} />}</mesh>
                <mesh geometry={getFaceGeo()} position={[0, -0.02, 0]} renderOrder={2}>
                  <meshStandardMaterial map={face} transparent alphaTest={0.05} roughness={0.5} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
                </mesh>
                <group scale={[HEAD_SX, 1, HEAD_SX]}>
                  <Hair look={look} />
                  <Hat look={look} />
                  {look.glasses && <Glasses />}
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

// ---- blinking ----
const hash = (a: number, b: number) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
/**
 * Natural blinking, 0 (open) .. 1 (shut), for `t` seconds. A blink every 2.4-4.4 s (jittered per `seed`), each ~0.17 s
 * (fast close, slightly slower open), with an occasional double blink. Pass a different seed per character.
 */
export const blinkCurve = (t: number, seed = 0): number => {
  const P = 3.4, k = Math.floor((t + seed * 1.91) / P), u = t + seed * 1.91 - k * P;
  const one = (x: number) => (x < 0 || x > 0.17 ? 0 : x < 0.07 ? x / 0.07 : 1 - (x - 0.07) / 0.1);
  const s = 0.3 + hash(k, seed) * 1.9; // blink start inside this period
  let v = one(u - s);
  if (hash(k + 0.5, seed + 3) > 0.78) v = Math.max(v, one(u - s - 0.28)); // double blink
  return Math.max(0, Math.min(1, v));
};

// ---- ready-made poses (static Pose objects; animate by blending, e.g. blendPose(POSES.stand, POSES.wave, u)) ----
export const POSES = {
  stand: {} as Pose,
  /** right arm raised high, slightly out (add wavePose for the moving version) */
  wave: { armR: 2.75, armROut: 0.18, head: [-0.08, -0.04] } as Pose,
  /** right arm straight out forward, pointing */
  point: { armR: 1.5, armROut: -0.12, lean: 0.03, head: [0, 0.02] } as Pose,
  /** right fist (with a razor) up at the cheek, head tipped back a little */
  shave: { armR: 2.05, armROut: -0.36, armL: 0.25, head: [0.12, -0.12] } as Pose,
  /** right hand (spoon) raised in front of the mouth, leaning in */
  eat: { armR: 1.8, armROut: -0.28, armL: 0.9, armLOut: -0.15, lean: 0.07, head: [0, 0.08] } as Pose,
  /** both hands up gripping a towel on the mirror, pulling down (blend the arms lower as the towel comes off) */
  pullTowel: { armL: 2.35, armLOut: -0.12, armR: 2.35, armROut: -0.12, lean: -0.04, head: [0, -0.12] } as Pose,
  /** arms folded across the chest (left over right) */
  cross: { armL: 1.5, armLOut: -0.72, armR: 1.32, armROut: -0.7, head: [0, 0.03] } as Pose,
  /** hands on hips (elbows can't bend: arms angled out and slightly back) */
  hips: { armL: -0.22, armLOut: 0.3, armR: -0.22, armROut: 0.3, head: [0, -0.03] } as Pose,
  /** startled step back: lean back, arms up in front, one foot back */
  recoil: { armL: 1.05, armLOut: 0.28, armR: 1.15, armROut: 0.28, lean: -0.16, legL: -0.18, legR: 0.08, head: [0, -0.1] } as Pose,
  /** sitting: legs straight forward. Put the character at y = seatY - 2 + 0.5 (hip block bottom on the seat). */
  sit: { legL: Math.PI / 2, legR: Math.PI / 2, armL: 0.35, armR: 0.35 } as Pose,
} satisfies Record<string, Pose>;
export type PoseName = keyof typeof POSES;

/** Blend two poses (u 0 = a, 1 = b). */
export const blendPose = (a: Pose, b: Pose, u: number): Pose => {
  const L = (x?: number, y?: number) => (x ?? 0) + ((y ?? 0) - (x ?? 0)) * u;
  const ha = a.head ?? [0, 0], hb = b.head ?? [0, 0];
  return {
    armL: L(a.armL, b.armL), armR: L(a.armR, b.armR), armLOut: L(a.armLOut, b.armLOut), armROut: L(a.armROut, b.armROut),
    legL: L(a.legL, b.legL), legR: L(a.legR, b.legR), lean: L(a.lean, b.lean), head: [L(ha[0], hb[0]), L(ha[1], hb[1])],
    tilt: L(a.tilt, b.tilt), twist: L(a.twist, b.twist), roll: L(a.roll, b.roll),
  };
};

// ---- pose helpers ----
/** A friendly overhead wave on the right arm. `t` in seconds, `amount` 0..1 blends it in. */
export const wavePose = (t: number, amount = 1): Pose => ({ armR: amount * (2.7 + 0.25 * Math.sin(t * 9)), armROut: amount * 0.15, head: [0, -0.05 * amount] });
/** Knocking on a door with the right fist: `k` is a 0..1 knock pulse (1 = fist on the door). */
export const knockPose = (k: number): Pose => ({ armR: 1.35 + 0.35 * k, lean: 0.05 + 0.04 * k, head: [0, 0.05] });
/** Walk input for a character moving at `speed` units/s at time `t` s, feet planted (a step = 4 sin(0.75 amount) rig units).
 *  For paths, starts and stops, use Motion.ts (walkPath). */
export const walkAt = (t: number, speed: number, amount = 1, scale = 1): Walk => ({ phase: (t * speed * Math.PI) / (4 * Math.sin(0.75 * amount) * scale), amount });

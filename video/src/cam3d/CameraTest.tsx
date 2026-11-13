// Camera test reel: ONE 3D street scene, filmed by 20 cameras. Part 1 = the same moment from 8 angles; Part 2 = 12 camera moves.
// Every clip is a function of its own local time; a label names the angle or move so the user can pick by name.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LOOKS, mix3, Person3D, Pose3, run3, STAND, walk3 } from "./Person3D";
import { World3D } from "./World3D";

export const FPS3 = 30;
const HEAD = "'Plus Jakarta Sans'", BODY = "'Manrope'";

// ─── fonts (bundled OFL files in public/fonts) ─────────────────────────────────
const useFonts = () => {
  const [ready, setReady] = useState(false);
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      new FontFace("Plus Jakarta Sans", `url(${staticFile("fonts/PlusJakartaSans.ttf")})`, { weight: "200 800" }).load(),
      new FontFace("Manrope", `url(${staticFile("fonts/Manrope.ttf")})`, { weight: "200 800" }).load(),
    ]).then((fs) => { fs.forEach((f) => document.fonts.add(f)); setReady(true); continueRender(h); });
  }, [h]);
  return ready;
};

// ─── easing ──────────────────────────────────────────────────────────────────
const c01 = (x: number) => Math.max(0, Math.min(1, x));
const io = (x: number) => { x = c01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const expoOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * c01(x)));
const seg = (t: number, a: number, b: number) => c01((t - a) / (b - a));
type V3 = [number, number, number];
const lerp3 = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sc = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const noise = (t: number, s: number) => Math.sin(t * 1.3 + s) * 0.6 + Math.sin(t * 2.7 + s * 2) * 0.3 + Math.sin(t * 5.1 + s * 3) * 0.1;

// ─── the cast and their action ──────────────────────────────────────────────
const RAD = Math.PI / 180;
const A_POS: V3 = [-0.6, 0, 0], B_POS: V3 = [0.6, 0, 0];
const A_YAW = 70 * RAD, B_YAW = -70 * RAD; // facing each other, cheated toward the street
const fwd = (yaw: number): V3 => [Math.sin(yaw), 0, Math.cos(yaw)];
const A_HEAD: V3 = [-0.6 + 0.02, 1.58, 0.01], B_HEAD: V3 = [0.6 - 0.02, 1.58, 0.01];
const SOLO: V3 = [0, 0, 0.6]; // the hero alone by the lamp for the angle shots
const SOLO_HEAD: V3 = [0, 1.57, 0.62];

type Mode = "solo" | "talk" | "walk";
type Cam = { pos: V3; target: V3; fov: number; roll?: number; shake?: number };
type Clip = { kind: "ANGLE" | "MOVE"; title: string; note: string; dur: number; mode: Mode; runner?: (t: number) => number | null; who?: (t: number) => "A" | "B" | null; cam: (t: number, d: number) => Cam };

/** Who is talking at local time t: A first, then turns of 1.6 s. */
const turns = (t: number): "A" | "B" => (Math.floor(t / 1.6) % 2 === 0 ? "A" : "B");

const talkPose = (t: number, speaking: boolean, seed: number): Pose3 => {
  const g = speaking ? 0.5 + 0.5 * Math.sin(t * 3.1 + seed) : 0;
  return {
    ...STAND,
    lean: 3 + (speaking ? 2 * Math.sin(t * 2 + seed) : 0),
    headNod: speaking ? 4 * Math.sin(t * 5 + seed) : 2 + 3 * Math.max(0, Math.sin(t * 2.2 + seed)), // the listener nods
    armR: speaking ? [30 + 25 * g, 12, 70 + 30 * g] : [6, 8, 18],
    armL: speaking ? [14 + 10 * (1 - g), 10, 40] : [4, 7, 12],
    curl: speaking ? 0.2 : 0.45,
    bob: 0.004 * Math.sin(t * 2.4 + seed),
  };
};
const mouth = (t: number, speaking: boolean) => (speaking ? Math.max(0, Math.sin(t * 17) * 0.6 + Math.sin(t * 11) * 0.4) : 0);
const blink = (t: number, seed: number) => ((t + seed) % 3.3) < 0.1;

const Phone3: React.FC<{ lit?: boolean }> = ({ lit = true }) => (
  <group position={[0, -0.1, 0.035]} rotation={[-1.15, 0, 0]}>
    <mesh><boxGeometry args={[0.075, 0.15, 0.01]} /><meshStandardMaterial color="#0A0A0F" roughness={0.3} /></mesh>
    <mesh position={[0, 0, 0.0055]}><planeGeometry args={[0.066, 0.138]} /><meshStandardMaterial color="#9FD8FF" emissive="#7FC8FF" emissiveIntensity={lit ? 1.6 : 0} /></mesh>
  </group>
);
const MapProp: React.FC = () => (
  <group position={[0, -0.12, 0.03]} rotation={[-0.4, 0, 0]}>
    <mesh><boxGeometry args={[0.16, 0.22, 0.012]} /><meshToonMaterial color="#F1E8D6" /></mesh>
    <mesh position={[0.01, 0.02, 0.007]} rotation={[0, 0, 0.6]}><planeGeometry args={[0.012, 0.16]} /><meshBasicMaterial color="#D9472B" /></mesh>
  </group>
);

const Scene: React.FC<{ clip: Clip; t: number }> = ({ clip, t }) => {
  const runnerX = clip.runner?.(t) ?? null;
  return (
    <>
      <World3D />
      {clip.mode === "solo" && (
        <Person3D pos={SOLO} yaw={0.15} look={LOOKS.hero}
          pose={{ ...STAND, headNod: 26 + 3 * Math.sin(t * 1.3), headTurn: 4, armR: [36, 6, 80], armL: [6, 6, 14], curl: 0.6, bob: 0.004 * Math.sin(t * 2.2) }}
          face={{ smile: 0.15, blink: blink(t, 0.4) }} propR={<Phone3 />} />
      )}
      {clip.mode === "talk" && (() => {
        const w = clip.who ? clip.who(t) : turns(t);
        return (
          <>
            <Person3D pos={A_POS} yaw={A_YAW} look={LOOKS.hero} pose={talkPose(t, w === "A", 0)} face={{ smile: 0.5, open: mouth(t, w === "A"), blink: blink(t, 0) }} />
            <Person3D pos={B_POS} yaw={B_YAW} look={LOOKS.oldman} pose={talkPose(t, w === "B", 1.7)} face={{ smile: 0.25, brow: 0.3, open: mouth(t + 0.3, w === "B"), blink: blink(t, 1.9) }} propL={<MapProp />} />
          </>
        );
      })()}
      {clip.mode === "walk" && (
        <Person3D pos={[-3.2 + t * 1.25, 0, 0.2]} yaw={Math.PI / 2} look={LOOKS.hero} pose={walk3(t * 0.95)} face={{ smile: 0.5, blink: blink(t, 0.7) }} />
      )}
      {runnerX !== null && <Person3D pos={[runnerX, 0, 3.0]} yaw={Math.PI / 2} look={LOOKS.runner} pose={run3(t * 1.45)} face={{ smile: 0, open: 0.4, brow: -0.4 }} />}
    </>
  );
};

/** Drives the three.js camera from a Cam state (mutated each frame; Remotion renders the frame after). */
const CamCtl: React.FC<{ cam: Cam; t: number }> = ({ cam, t }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const k = cam.shake ?? 0;
  const jitter: V3 = k ? [noise(t * 9, 1) * k, noise(t * 9, 2) * k, 0] : [0, 0, 0];
  camera.position.set(cam.pos[0], cam.pos[1], cam.pos[2]);
  camera.fov = cam.fov; camera.near = 0.05; camera.far = 900;
  camera.up.set(0, 1, 0);
  camera.lookAt(cam.target[0] + jitter[0], cam.target[1] + jitter[1], cam.target[2]);
  if (cam.roll) camera.rotateZ(cam.roll);
  camera.updateProjectionMatrix();
  return null;
};

// ─── the clips ───────────────────────────────────────────────────────────────
const handheld = (t: number, a = 0.012): V3 => [noise(t, 3) * a, noise(t, 5) * a, 0];
const angle = (title: string, note: string, pos: V3, target: V3, fov: number, roll = 0): Clip => ({
  kind: "ANGLE", title, note, dur: 1.8, mode: "solo",
  cam: (t) => ({ pos: add(lerp3(pos, add(target, sc(add(pos, sc(target, -1)), 0.96)), io(t / 1.8)), handheld(t)), target, fov, roll }),
});
const between = (u: number, a: V3, b: V3) => lerp3(a, b, u);

export const CLIPS: Clip[] = [
  angle("FRONT", "Straight on, eye level: honest, direct", [0.15, 1.5, 3.6], [0, 1.25, 0.6], 30),
  angle("THREE-QUARTER", "45° to the side: the most used angle in film", [2.5, 1.55, 3.0], [0, 1.25, 0.6], 30),
  angle("PROFILE", "Pure side view: a clean silhouette", [3.6, 1.35, 0.75], [0, 1.2, 0.6], 30),
  angle("FROM BEHIND", "We see what he sees", [0.5, 1.75, -2.2], [0, 1.15, 0.9], 40),
  angle("OVER THE SHOULDER", "Behind his shoulder, onto the phone", [-0.8, 1.92, 0.15], [-0.2, 1.12, 1.0], 42),
  angle("LOW ANGLE", "Looking up: power, size", [0.7, 0.28, 2.8], [0, 1.45, 0.6], 40),
  angle("HIGH ANGLE", "Looking down: small, alone", [1.4, 4.6, 3.6], [0, 0.9, 0.6], 34),
  angle("TOP SHOT", "Straight down from above", [0.02, 4.2, 0.62], [0, 0, 0.6], 36, Math.PI),

  { kind: "MOVE", title: "PAN", note: "The camera turns on the spot, from the café to the two of them", dur: 3.6, mode: "talk",
    cam: (t) => ({ pos: [1.2, 1.45, 7.2], target: between(io(seg(t, 0.5, 2.8)), [-4.2, 1.5, -3], [0, 1.4, 0]), fov: 30 }) },
  { kind: "MOVE", title: "WHIP PAN", note: "A fast blur from one face to the other, and back", dur: 3.8, mode: "talk", who: (t) => (t < 1.3 || t > 2.75 ? "A" : "B"),
    cam: (t) => {
      const u = expoOut(seg(t, 1.25, 1.5)) - expoOut(seg(t, 2.7, 2.95));
      return { pos: [0, 1.52, 2.4], target: between(u, A_HEAD, B_HEAD), fov: 26 };
    } },
  { kind: "MOVE", title: "CRASH ZOOM", note: "A sudden zoom into his face on the beat", dur: 3.0, mode: "talk", who: () => "B",
    cam: (t) => {
      const z = expoOut(seg(t, 1.0, 1.18));
      return { pos: [-1.9, 1.5, 3.6], target: between(z, [0, 1.35, 0], B_HEAD), fov: 40 - 31 * z, shake: t > 1.18 ? 0.012 * Math.max(0, 1 - (t - 1.18) / 0.5) : 0 };
    } },
  { kind: "MOVE", title: "CONVERSATION SWING", note: "The camera glides to whoever is speaking", dur: 4.8, mode: "talk", who: (t) => (t < 1.6 || t > 3.3 ? "A" : "B"),
    cam: (t) => {
      const u = io(seg(t, 1.45, 2.05)) - io(seg(t, 3.15, 3.75));
      const tg = between(u, A_HEAD, B_HEAD);
      return { pos: add([tg[0] * 0.45, 1.5, 2.9], handheld(t, 0.01)), target: tg, fov: 30 };
    } },
  { kind: "MOVE", title: "SHOT / REVERSE SHOT", note: "Over one shoulder, then the other, cutting with the dialogue", dur: 4.8, mode: "talk", who: (t) => (Math.floor(t / 1.6) % 2 === 0 ? "B" : "A"),
    cam: (t) => {
      const onB = Math.floor(t / 1.6) % 2 === 0;
      const from = onB ? A_HEAD : B_HEAD, to = onB ? B_HEAD : A_HEAD, f = fwd(onB ? A_YAW : B_YAW);
      const side: V3 = onB ? [f[2] * 0.45, 0, -f[0] * 0.45] : [-f[2] * 0.45, 0, f[0] * 0.45];
      return { pos: add(add(add(from, sc(f, -1.25)), side), [0, 0.16, 0]), target: add(to, [0, -0.08, 0]), fov: 32 };
    } },
  { kind: "MOVE", title: "PULL BACK TO WIDE", note: "From their faces out to the whole street: a runner far away", dur: 5.2, mode: "talk", runner: (t) => -46 + t * 4.2,
    cam: (t) => {
      const u = io(seg(t, 0.4, 4.9));
      return { pos: between(u, [0.1, 1.5, 2.2], [7, 6.0, 7.6]), target: between(u, [0, 1.42, 0], [-14, 0.8, -0.4]), fov: 30 + 10 * u };
    } },
  { kind: "MOVE", title: "LONG LENS FOLLOW", note: "From far away, the camera pans to follow the runner", dur: 4.2, mode: "talk", runner: (t) => -22 + t * 4.4,
    cam: (t) => {
      const rx = -22 + t * 4.4;
      return { pos: [46, 1.5, 3.1], target: [rx + 0.4, 1.05, 3.0], fov: 4.5 };
    } },
  { kind: "MOVE", title: "PUSH IN", note: "A slow move toward his face", dur: 3.8, mode: "talk", who: () => "A",
    cam: (t) => { const d = 3.6 - 2.5 * io(t / 3.8); return { pos: add(A_HEAD, [0.72 * d, -0.04 * d, 0.69 * d]), target: A_HEAD, fov: 30 }; } },
  { kind: "MOVE", title: "TRACKING SHOT", note: "The camera slides alongside him as he walks", dur: 4.2, mode: "walk",
    cam: (t) => {
      const x = -3.2 + t * 1.25;
      return { pos: add([x + 0.2, 1.25, 3.4], handheld(t, 0.01)), target: [x + 0.35, 1.05, 0.2], fov: 34 };
    } },
  { kind: "MOVE", title: "ORBIT", note: "The camera circles around the two of them", dur: 5.2, mode: "talk",
    cam: (t) => {
      const a = (25 + 230 * io(t / 5.2)) * RAD, r = 2.5;
      return { pos: [Math.sin(a) * r, 1.75, Math.cos(a) * r], target: [0, 1.3, 0], fov: 38 };
    } },
  { kind: "MOVE", title: "CRANE UP", note: "From knee height up above the lamp", dur: 4.2, mode: "talk",
    cam: (t) => {
      const u = io(t / 4.2);
      return { pos: between(u, [2.0, 0.45, 3.1], [2.6, 6.8, 5.2]), target: between(u, [0, 1.3, 0], [0, 0.4, 0]), fov: 38 };
    } },
  { kind: "MOVE", title: "DOLLY ZOOM", note: "The camera pulls back as the lens zooms in: the world stretches", dur: 3.8, mode: "talk", who: () => "A",
    cam: (t) => {
      const u = io(seg(t, 0.4, 3.4));
      const d = 1.6 + 5.4 * u, W = 2 * 1.6 * Math.tan((52 * RAD) / 2);
      const dir: V3 = [0.26, 0.0, 0.97];
      return { pos: add(A_HEAD, sc(dir, d)), target: A_HEAD, fov: (2 * Math.atan(W / (2 * d))) / RAD };
    } },
];

export const CLIP_STARTS = CLIPS.map((_, i) => CLIPS.slice(0, i).reduce((sum, c) => sum + c.dur, 0));
export const CAMTEST_FRAMES = Math.round(CLIPS.reduce((s, c) => s + c.dur, 0) * FPS3);

/** Motion blur along the direction the camera turns (whips get a strong streak). */
const blurAt = (clip: Clip, t: number) => {
  const dt = 1 / FPS3;
  const dir = (c: Cam) => { const v = new THREE.Vector3(c.target[0] - c.pos[0], c.target[1] - c.pos[1], c.target[2] - c.pos[2]).normalize(); return v; };
  const a = clip.cam(Math.max(0, t - dt / 2), clip.dur), b = clip.cam(Math.min(clip.dur, t + dt / 2), clip.dur);
  const ang = dir(a).angleTo(dir(b)) / RAD; // degrees per frame
  const zoom = Math.abs(a.fov - b.fov);
  return { x: Math.min(60, Math.max(0, (ang - 0.6) * (900 / a.fov) * 0.35)), z: Math.min(14, zoom * 1.2) };
};

const Label: React.FC<{ clip: Clip; i: number; t: number }> = ({ clip, i, t }) => {
  const p = expoOut(seg(t, 0.05, 0.5));
  const n = clip.kind === "ANGLE" ? i + 1 : i - 7;
  return (
    <div style={{ position: "absolute", left: 70, top: 60, transform: `translateY(${(1 - p) * -20}px)`, opacity: p }}>
      <div style={{ display: "inline-block", padding: "8px 18px", borderRadius: 999, background: clip.kind === "ANGLE" ? "#F2B84B" : "#D9472B", color: clip.kind === "ANGLE" ? "#0B1226" : "#F1F4F2",
        fontFamily: HEAD, fontWeight: 800, fontSize: 22, letterSpacing: "0.14em" }}>{clip.kind} {n}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 64, color: "#F1F4F2", letterSpacing: "-0.03em", lineHeight: 1.05, marginTop: 12, textShadow: "0 8px 30px rgba(0,0,0,0.55)" }}>{clip.title}</div>
      <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 28, color: "rgba(241,244,242,0.82)", marginTop: 6, textShadow: "0 4px 18px rgba(0,0,0,0.6)" }}>{clip.note}</div>
    </div>
  );
};

const Frame: React.FC<{ i: number; t: number }> = ({ i, t }) => {
  const clip = CLIPS[i];
  const cam = clip.cam(t, clip.dur);
  const bl = blurAt(clip, t);
  const id = `mb${i}`;
  return (
    <AbsoluteFill style={{ background: "#0B1226" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={`${bl.x + bl.z} ${bl.z}`} /></filter>
      </svg>
      <AbsoluteFill style={{ filter: bl.x + bl.z > 0.3 ? `url(#${id})` : undefined }}>
        <ThreeCanvas width={1920} height={1080} shadows gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ fov: 35, near: 0.05, far: 900, position: [0, 2, 6] }}>
          <CamCtl cam={cam} t={t} />
          <Scene clip={clip} t={t} />
        </ThreeCanvas>
      </AbsoluteFill>
      <Label clip={clip} i={i} t={t} />
    </AbsoluteFill>
  );
};

const at = (frame: number) => {
  const tt = frame / FPS3;
  let i = CLIP_STARTS.findIndex((s, k) => tt >= s && tt < s + CLIPS[k].dur);
  if (i < 0) i = CLIPS.length - 1;
  return { i, t: tt - CLIP_STARTS[i] };
};

export const CameraTest: React.FC = () => {
  const ready = useFonts();
  const { i, t } = at(useCurrentFrame());
  return ready ? <Frame i={i} t={t} /> : <AbsoluteFill style={{ background: "#0B1226" }} />;
};

/** Review: frame k shows clip floor(k/2) at 35% and 80% of its length. */
export const CamStills: React.FC = () => {
  const ready = useFonts();
  const k = useCurrentFrame();
  const i = Math.floor(k / 2), clip = CLIPS[i];
  const t = clip.dur * (k % 2 ? 0.8 : 0.35);
  return ready ? <Frame i={i} t={t} /> : <AbsoluteFill style={{ background: "#0B1226" }} />;
};
export const CAMSTILL_FRAMES = CLIPS.length * 2;

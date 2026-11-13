// The Short frame: picks the shot at t, keeps every camera moving, and joins shots with whip-pans (the camera yaws
// fast out of one set-up and into the next with horizontal motion blur, about 8 frames), hard cuts or a white flash.
// Captions and pop-ins sit on top. 1080x1920, 30 fps.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CamS, hand, pickShot, seg, Shot, Timing, V3 } from "./core";
import { Captions } from "./Captions";
import { Pops, PopSpec } from "./Pop";

export const FPS = 30, SW = 1080, SH = 1920;
export const WHIP = { half: 0.13, deg: 38, blur: 70 }; // each side of the cut (s), peak yaw (deg), peak blur (px)

export const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const faces = [900, 800].map((w) => new FontFace("Montserrat", `url(${staticFile(`fonts/Montserrat-${w}.woff2`)})`, { weight: String(w) }));
    Promise.all(faces.map((f) => f.load())).then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};

/** Sets the R3F camera each frame (and restores aspect/fov, so nothing leaks into later frames). */
export const Cam: React.FC<{ c: CamS }> = ({ c }) => {
  const { camera, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(...c.pos);
  cam.up.set(0, 1, 0);
  cam.lookAt(...c.target);
  if (c.roll) cam.rotateZ((c.roll * Math.PI) / 180);
  cam.fov = c.fov; cam.aspect = size.width / size.height; cam.near = 0.03; cam.far = 300;
  cam.updateProjectionMatrix();
  return null;
};

const yawAbout = (c: CamS, deg: number): CamS => {
  const a = (deg * Math.PI) / 180, dx = c.target[0] - c.pos[0], dz = c.target[2] - c.pos[2];
  return { ...c, target: [c.pos[0] + dx * Math.cos(a) - dz * Math.sin(a), c.target[1], c.pos[2] + dx * Math.sin(a) + dz * Math.cos(a)] as V3 };
};
const dist = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Every shot moves: a camera that holds still gets a slow 6% push and a ±1.5° drift (lessons: a still camera reads as broken). */
const liven = (s: Shot, t: number): CamS => {
  const c = s.cam(t);
  if (s.still) return c;
  const a = s.cam(s.t0), b = s.cam(s.t1 - 0.01);
  if (dist(a.pos, b.pos) > 0.02 || dist(a.target, b.target) > 0.02 || Math.abs(a.fov - b.fov) > 0.1) return hand(c, t, 0.004);
  const u = seg(t, s.t0, s.t1), dir = s.id.length % 2 ? 1 : -1, ang = ((u - 0.5) * 3 * dir * Math.PI) / 180;
  const dx = c.pos[0] - c.target[0], dz = c.pos[2] - c.target[2], k = 1 - 0.06 * u;
  const rx = dx * Math.cos(ang) - dz * Math.sin(ang), rz = dx * Math.sin(ang) + dz * Math.cos(ang);
  return hand({ ...c, pos: [c.target[0] + rx * k, c.target[1] + (c.pos[1] - c.target[1]) * k, c.target[2] + rz * k] }, t, 0.004);
};

/** The camera and the whip state at t: which shot, its camera (with the whip yaw), the blur in px and a flash level. */
export const frameAt = (shots: Shot[], t: number) => {
  const s = pickShot(shots, t), i = shots.indexOf(s);
  let cam = liven(s, t), blur = 0, flash = 0;
  const next = shots[i + 1], into = s.enter ?? (i % 2 ? "whipL" : "whipR");
  // leaving: whip out during the last WHIP.half before the next shot's start
  if (next && (next.enter ?? ((i + 1) % 2 ? "whipL" : "whipR")).startsWith("whip") && t > s.t1 - WHIP.half) {
    const u = seg(t, s.t1 - WHIP.half, s.t1), dir = (next.enter ?? ((i + 1) % 2 ? "whipL" : "whipR")) === "whipL" ? 1 : -1;
    cam = yawAbout(cam, dir * WHIP.deg * u * u); blur = WHIP.blur * u;
  }
  // arriving: whip in during the first WHIP.half
  if (i > 0 && into.startsWith("whip") && t < s.t0 + WHIP.half) {
    const u = seg(t, s.t0, s.t0 + WHIP.half), dir = into === "whipL" ? 1 : -1;
    cam = yawAbout(cam, -dir * WHIP.deg * (1 - u) * (1 - u)); blur = Math.max(blur, WHIP.blur * (1 - u));
  }
  if (i > 0 && into === "flash") flash = 1 - seg(t, s.t0, s.t0 + 0.25);
  if (next?.enter === "flash") flash = Math.max(flash, seg(t, s.t1 - 0.08, s.t1));
  return { s, cam, blur, flash };
};

export const ShortFrame: React.FC<{
  shots: Shot[]; t: number; T?: Timing; pops?: PopSpec[]; highlight?: string[]; noCaptions?: [number, number][]; label?: string; single?: boolean; captionY?: number; overlay?: React.ReactNode;
}> = ({ shots, t, T, pops = [], highlight, noCaptions, label, single, captionY, overlay }) => {
  useFonts();
  const { s, cam, blur, flash } = frameAt(shots, t);
  return (
    <AbsoluteFill style={{ background: s.bg ?? "#1a1410" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="whipblur" x="-10%" y="-2%" width="120%" height="104%"><feGaussianBlur stdDeviation={`${blur} ${blur * 0.04}`} /></filter>
      </svg>
      <AbsoluteFill style={{ filter: blur > 0.5 ? "url(#whipblur)" : undefined }}>
        <ThreeCanvas width={SW} height={SH} shadows gl={{ antialias: true, preserveDrawingBuffer: true, localClippingEnabled: true } as any}
          camera={{ fov: cam.fov, position: cam.pos }} onCreated={({ gl }) => { gl.localClippingEnabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
          <Cam c={cam} />
          {s.scene(t)}
        </ThreeCanvas>
      </AbsoluteFill>
      {s.dom?.(t, cam)}
      <Pops pops={pops} t={t} />
      {overlay}
      {T && <Captions T={T} t={t} highlight={highlight} hide={noCaptions} single={single} y={captionY} />}
      {flash > 0 && <AbsoluteFill style={{ background: "#fffaf0", opacity: flash }} />}
      {label && <div style={{ position: "absolute", left: 20, top: 16, color: "#fff", font: "700 28px sans-serif", textShadow: "0 0 6px #000" }}>{label}</div>}
    </AbsoluteFill>
  );
};

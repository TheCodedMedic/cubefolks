// The channel banner the owner asked for (2026-11-15): a simple cursive "Subscribe", made creepy.
// 2560x1440; everything inside the 1546x423 strip every device shows (x 507..2053, y 508..931).
// Font: Kaushan Script (Pablo Impallari, SIL Open Font License; public/fonts/KaushanScript-OFL.txt).
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Cam } from "../kit/Short";
import { BlockChar } from "./BlockRig";
import type { Look } from "./types";

/** The owner's own character (their profile picture): yellow blocky head, blue cap worn backwards, black jacket. */
const OWNER: Look = { skin: "#f2c418", shirt: "#141416", pants: "#141416", hair: "none", hat: "capBack", hatColor: "#1d4fd6" };

/** The owner's character standing in the dark beside the word, lit only from below (a flashlight on the ground), smiling. */
const OwnerInTheDark: React.FC<{ left: number; top: number; w: number; h: number }> = ({ left, top, w, h }) => (
  <div style={{ position: "absolute", left, top, width: w, height: h,
    WebkitMaskImage: "radial-gradient(ellipse 48% 52% at 50% 38%, #000 55%, rgba(0,0,0,0) 100%)", maskImage: "radial-gradient(ellipse 48% 52% at 50% 38%, #000 55%, rgba(0,0,0,0) 100%)" } as React.CSSProperties}>
    <ThreeCanvas width={w} height={h} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true } as any} onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}>
      <Cam c={{ pos: [-1.0, 4.2, 8.0], target: [0, 4.35, 0], fov: 30 }} />
      <ambientLight intensity={0.025} color="#8090c0" />
      {/* underlight: warm, low and to one side (a torch held below the chin): half the face falls into shadow */}
      <pointLight position={[-2.3, 2.9, 1.3]} intensity={18} distance={6} decay={1.8} color="#ffcf96" />
      {/* a cold rim from behind so the silhouette separates from the night */}
      <directionalLight position={[4, 7, -6]} intensity={1.1} color="#6f8cff" />
      <BlockChar look={OWNER} position={[0, 0, 0]} yaw={-0.32} expr="smile" still seed={3} pose={{ head: [0.18, 0.1], tilt: 0.14 }} />
    </ThreeCanvas>
  </div>
);

const useKaushan = () => {
  const [h] = useState(() => delayRender("kaushan"));
  useEffect(() => {
    const f = new FontFace("Kaushan", `url(${staticFile("fonts/KaushanScript-Regular.ttf")})`);
    f.load().then((ff) => { document.fonts.add(ff); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};

/** A watcher in the dark: a blocky head-and-shoulders shape barely lighter than the night, two pale staring eyes. */
const Watcher: React.FC<{ x: number; y: number; s: number; eyes?: number; body?: number }> = ({ x, y, s, eyes = 0.92, body = 1 }) => (
  <div style={{ position: "absolute", left: x - 90 * s, top: y - 70 * s, width: 180 * s, height: 260 * s, opacity: body }}>
    {/* head (rounded cylinder seen from the front) and square shoulders, a breath lighter than the background */}
    <div style={{ position: "absolute", left: 22 * s, top: 0, width: 136 * s, height: 118 * s, borderRadius: 34 * s,
      background: "radial-gradient(ellipse at 50% 35%, #1c1f27 0%, #14161c 70%, rgba(15,17,22,0) 100%)" }} />
    <div style={{ position: "absolute", left: 0, top: 128 * s, width: 180 * s, height: 160 * s, borderRadius: 14 * s,
      background: "linear-gradient(#15171d, rgba(12,13,17,0))" }} />
    {/* the eyes: the channel's flat oval decal eyes, but pale, with a faint glow */}
    {[-1, 1].map((k) => (
      <div key={k} style={{ position: "absolute", left: 90 * s + k * 26 * s - 9 * s, top: 46 * s, width: 18 * s, height: 34 * s, borderRadius: "50%",
        background: "#f1ece0", opacity: eyes, boxShadow: `0 0 ${10 * s}px ${3 * s}px rgba(230,225,210,0.35), 0 0 ${40 * s}px ${10 * s}px rgba(200,40,40,0.12)` }} />
    ))}
  </div>
);

/** Just a pair of pale eyes in the dark. */
const Eyes: React.FC<{ x: number; y: number; s: number; o: number }> = ({ x, y, s, o }) => (
  <>{[-1, 1].map((k) => <div key={k} style={{ position: "absolute", left: x + k * 26 * s - 9 * s, top: y, width: 18 * s, height: 34 * s, borderRadius: "50%",
    background: "#f1ece0", opacity: o, boxShadow: `0 0 ${10 * s}px ${3 * s}px rgba(230,225,210,0.3)` }} />)}</>
);

export const SubscribeBanner: React.FC<{ guides?: boolean; text?: string }> = ({ guides = false, text = "Subscribe" }) => {
  useKaushan();
  return (
    <AbsoluteFill style={{ background: "#08090b" }}>
      {/* night mist: slow cold haze, darker at the edges */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 55% 30% at 50% 50%, rgba(60,70,90,0.22) 0%, rgba(20,24,32,0.10) 55%, rgba(0,0,0,0) 100%)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 30% 14% at 38% 60%, rgba(120,130,150,0.07) 0%, rgba(0,0,0,0) 100%), radial-gradient(ellipse 26% 12% at 66% 42%, rgba(120,130,150,0.06) 0%, rgba(0,0,0,0) 100%)" }} />
      {/* watchers: one beside the word (inside the strip: phones see it), two fainter ones out in the dark for desktop/TV */}
      {/* the owner's character, inside the strip (phones see it); two faint pairs of eyes far out in the dark for desktop/TV */}
      <OwnerInTheDark left={1380} top={330} w={900} h={900} />
      <Eyes x={330} y={700} s={0.8} o={0.5} />
      <Eyes x={2330} y={590} s={0.6} o={0.38} />
      {/* the word: a smeared ghost behind, a faint blood-dark under-glow, the pale brush stroke on top */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", transform: "translate(-190px, -6px) rotate(-3deg)" }}>
          <div style={{ position: "absolute", inset: 0, font: "250px Kaushan", color: "#e9e3d6", opacity: 0.18, filter: "blur(14px)", transform: "translate(10px, 14px)" }}>{text}</div>
          <div style={{ position: "absolute", inset: 0, font: "250px Kaushan", color: "#5a0c0c", opacity: 0.55, filter: "blur(4px)", transform: "translate(5px, 8px)" }}>{text}</div>
          <div style={{ position: "relative", font: "250px Kaushan", color: "#ece6da", textShadow: "0 0 18px rgba(236,230,218,0.18)" }}>{text}</div>
        </div>
      </AbsoluteFill>
      {/* film grain (static noise via an SVG turbulence filter) */}
      <svg width={2560} height={1440} style={{ position: "absolute", inset: 0, opacity: 0.08, mixBlendMode: "screen" }}>
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
      {guides && <>
        <div style={{ position: "absolute", left: 507, top: 508, width: 1546, height: 423, border: "4px dashed #00ff88" }} />
        <div style={{ position: "absolute", left: 0, top: 508, width: 2560, height: 423, border: "3px dashed #ff4466" }} />
      </>}
    </AbsoluteFill>
  );
};

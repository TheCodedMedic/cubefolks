// Channel art: the profile picture (800x800) and the banner (2560x1440, everything that matters inside YouTube's
// 1546x423 safe area). The joke: Pip, our striped prisoner, politely "asking" you to subscribe with a cartoon revolver.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Bean3D, CAST, POSES, Pose } from "./Bean3D";
import { Expr } from "./Face";
import { Cam } from "../kit/Short";
import { CamS } from "../kit/core";

const SCRIPT = "Cutie Molly"; // public/fonts/CutieMolly.ttf (the owner's choice)

const M = (c: string, r = 0.45, m = 0.3) => <meshStandardMaterial color={c} roughness={r} metalness={m} />;

/** A chunky cartoon revolver. Origin at the grip; barrel along +z, up is +y. */
export const Revolver: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <group scale={scale} position={[0, 0.045, 0.035]}>
    <mesh position={[0, 0.022, 0.075]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.0145, 0.0145, 0.1, 20]} />{M("#5a5f6b")}</mesh>
    <mesh position={[0, 0.022, 0.125]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.0175, 0.0175, 0.014, 20]} />{M("#4a4f5a")}</mesh>
    <mesh position={[0, 0.022, 0.1325]}><circleGeometry args={[0.009, 20]} /><meshBasicMaterial color="#050505" /></mesh>
    <mesh position={[0, 0.039, 0.115]}><boxGeometry args={[0.006, 0.01, 0.01]} />{M("#4a4f5a")}</mesh>
    <mesh position={[0, 0.034, 0.075]}><boxGeometry args={[0.012, 0.008, 0.1]} />{M("#5a5f6b")}</mesh>
    <mesh position={[0, 0.018, 0.005]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.029, 0.029, 0.045, 6]} />{M("#6b7180")}</mesh>
    <mesh position={[0, 0.014, -0.03]} castShadow><boxGeometry args={[0.026, 0.05, 0.04]} />{M("#5a5f6b")}</mesh>
    <mesh position={[0, 0.045, -0.047]} rotation={[0.5, 0, 0]}><boxGeometry args={[0.01, 0.022, 0.012]} />{M("#3e424b")}</mesh>
    <mesh position={[0, -0.03, -0.048]} rotation={[0.38, 0, 0]} castShadow><boxGeometry args={[0.027, 0.075, 0.034]} />{M("#7a4a2a", 0.6, 0)}</mesh>
    <mesh position={[0, -0.015, -0.005]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.017, 0.004, 8, 16, Math.PI]} />{M("#3e424b")}</mesh>
    <mesh position={[0, -0.01, -0.008]} rotation={[0.3, 0, 0]}><boxGeometry args={[0.005, 0.02, 0.005]} />{M("#2b2e34")}</mesh>
  </group>
);

const Lights: React.FC = () => (
  <>
    <hemisphereLight args={["#fff4e2", "#b48e6a", 1.1]} />
    <directionalLight position={[-3, 5, 6]} intensity={2.4} color="#ffeccf" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02}
      shadow-camera-left={-2} shadow-camera-right={2} shadow-camera-top={2} shadow-camera-bottom={-2} />
    <directionalLight position={[4, 2, -5]} intensity={0.9} color="#ffd6ad" />
  </>
);

const useScriptFont = () => {
  const [h] = useState(() => delayRender("script font"));
  useEffect(() => {
    const f = new FontFace(SCRIPT, `url(${staticFile("fonts/CutieMolly.ttf")})`);
    f.load().then((ff) => { document.fonts.add(ff); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};

const PIP = CAST[0];
const MENACE: Expr = { eyes: "smug", brows: "angry", mouth: "smirk", look: [0, 0] };
// left hand forward at chest height, aiming at the viewer; right hand casually down
const AIM: Pose = { ...POSES.stand, armL: [0, 96, 0], armR: [14, 4, 10], head: [3, 8, -7], lean: 2 };

export const ChannelBanner: React.FC = () => {
  useScriptFont();
  const cam: CamS = { pos: [0.85, 0.86, 5.4], target: [0.85, 0.86, 0], fov: 24 };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, #fbf3e6 0%, #f1e2c9 60%, #e6d0ad 100%)" }}>
      <ThreeCanvas width={2560} height={1440} shadows gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} camera={{ fov: cam.fov }}>
        <Cam c={cam} />
        <Lights />
        <Bean3D look={PIP} pose={AIM} expr={MENACE} position={[0, 0, 0]} yaw={0.38} holdL={<group rotation={[Math.PI / 2 + 0.12, 0, 0]}><group rotation={[0, 0.35, 0]}><Revolver scale={2.6} /></group></group>} />
      </ThreeCanvas>
      <div style={{ position: "absolute", left: 1150, top: 720, transform: "translate(0,-52%) rotate(-4deg)", fontFamily: SCRIPT, fontSize: 182, lineHeight: 1, color: "#ffd84a", whiteSpace: "nowrap",
        WebkitTextStroke: "16px #1d1612", paintOrder: "stroke fill", textShadow: "0 12px 0 #1d1612, 0 22px 26px rgba(0,0,0,0.25)" }}>
        Subscribe
      </div>
    </AbsoluteFill>
  );
};

export const ChannelAvatar: React.FC = () => {
  const cam: CamS = { pos: [0, 0.93, 1.7], target: [0, 0.9, 0], fov: 24 };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, #ffc86b 0%, #f39a3d 75%, #e07f2a 100%)" }}>
      <ThreeCanvas width={800} height={800} shadows gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} camera={{ fov: cam.fov }}>
        <Cam c={cam} />
        <Lights />
        <Bean3D look={PIP} pose={{ ...POSES.stand, head: [0, -8, -8] }} expr={{ eyes: "wink", brows: "raised", mouth: "grin" }} position={[0, 0, 0]} yaw={0.12} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

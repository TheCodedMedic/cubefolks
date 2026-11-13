// Gizmo Origins channel art: the profile picture (800x800) and the banner (2560x1440; everything that matters sits inside
// YouTube's 1546x423 safe area, centred). Same Beanfolk 3D animation, a different look: "Gizmo", an inventor bean in a teal
// workshop jumpsuit with brass goggles, a wrench and a glowing idea bulb, on a navy blueprint full of gears.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Bean3D, Look, POSES, Pose } from "../bean/Bean3D";
import { Expr } from "../bean/Face";
import { Cam } from "../kit/Short";
import { CamS } from "../kit/core";

const TITLE = "Gizmo Display"; // Montserrat 900, public/fonts
const useTitleFont = () => {
  const [h] = useState(() => delayRender("title font"));
  useEffect(() => {
    const f = new FontFace(TITLE, `url(${staticFile("fonts/Montserrat-900.woff2")})`, { weight: "100 900" });
    f.load().then((ff) => { document.fonts.add(ff); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};

export const GIZMO: Look = {
  name: "Gizmo", role: "the inventor", skin: 3,
  outfit: { kind: "uniform", base: "#1f9e95", accent: "#ffb43a" },
  hair: { kind: "messy", color: "#2b1a12" },
  goggles: { strap: "#4a2f22", frame: "#c99a3a", lens: "#7fe3ff" },
  shoes: "#3a2a22",
};

const M = (c: string, r = 0.4, m = 0.5) => <meshStandardMaterial color={c} roughness={r} metalness={m} />;

/** A chunky cartoon wrench, origin at the handle's end, along +y. */
const Wrench: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <group scale={scale}>
    <mesh position={[0, 0.07, 0]} castShadow><boxGeometry args={[0.022, 0.15, 0.012]} />{M("#b9c2cc", 0.35, 0.8)}</mesh>
    <mesh position={[0, 0.165, 0]} castShadow><cylinderGeometry args={[0.036, 0.036, 0.014, 24]} />{M("#b9c2cc", 0.35, 0.8)}</mesh>
    <mesh position={[0, 0.185, 0]}><boxGeometry args={[0.03, 0.035, 0.016]} /><meshStandardMaterial color="#0f2440" /></mesh>
    <mesh position={[0, 0.02, 0]} castShadow><boxGeometry args={[0.03, 0.06, 0.02]} />{M("#e5533d", 0.6, 0)}</mesh>
  </group>
);

/** A cartoon gear: a disc with square teeth and a hole. */
const Gear: React.FC<{ r?: number; teeth?: number; c?: string; position?: [number, number, number]; rot?: number }> = ({ r = 0.12, teeth = 10, c = "#c99a3a", position = [0, 0, 0], rot = 0 }) => (
  <group position={position} rotation={[0, 0, rot]}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[r, r, r * 0.3, 40]} />{M(c, 0.35, 0.75)}</mesh>
    {Array.from({ length: teeth }, (_, i) => {
      const a = (i / teeth) * Math.PI * 2;
      return <mesh key={i} position={[Math.cos(a) * r * 1.08, Math.sin(a) * r * 1.08, 0]} rotation={[0, 0, a]} castShadow><boxGeometry args={[r * 0.28, r * 0.3, r * 0.3]} />{M(c, 0.35, 0.75)}</mesh>;
    })}
    <mesh position={[0, 0, r * 0.16]}><circleGeometry args={[r * 0.32, 24]} /><meshBasicMaterial color="#10223d" /></mesh>
  </group>
);

/** A glowing idea bulb. */
const Bulb: React.FC<{ position: [number, number, number]; s?: number }> = ({ position, s = 1 }) => (
  <group position={position} scale={s}>
    <mesh><sphereGeometry args={[0.1, 32, 24]} /><meshStandardMaterial color="#fff3b0" emissive="#ffd23f" emissiveIntensity={1.6} roughness={0.2} /></mesh>
    <mesh position={[0, -0.12, 0]}><cylinderGeometry args={[0.045, 0.05, 0.06, 20]} />{M("#9aa3ad", 0.4, 0.8)}</mesh>
    <pointLight color="#ffd36b" intensity={1.2} distance={1.5} />
  </group>
);

const Lights: React.FC = () => (
  <>
    <hemisphereLight args={["#e9f6ff", "#28405f", 1.05]} />
    <directionalLight position={[-3, 5, 6]} intensity={2.5} color="#fff1dc" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02}
      shadow-camera-left={-2} shadow-camera-right={2} shadow-camera-top={2} shadow-camera-bottom={-2} />
    <directionalLight position={[4, 2, -4]} intensity={1.1} color="#7fe3ff" />
  </>
);

/** Bright and loud: a sunny yellow-orange sunburst, a faint white grid and white line-drawn gears. */
const Sunburst: React.FC<{ w: number; h: number; cx: number; cy: number; gears: [number, number, number][] }> = ({ w, h, cx, cy, gears }) => {
  const R = Math.hypot(w, h), n = 24;
  return (
    <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="sun" cx={cx / w} cy={cy / h} r="0.9"><stop offset="0%" stopColor="#fff6a8" /><stop offset="40%" stopColor="#ffd23f" /><stop offset="100%" stopColor="#ff8a1f" /></radialGradient>
        <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" /></pattern>
      </defs>
      <rect width={w} height={h} fill="url(#sun)" />
      {Array.from({ length: n }, (_, k) => {
        const a0 = (k / n) * Math.PI * 2, a1 = a0 + Math.PI / n;
        return k % 2 ? null : <path key={k} d={`M${cx} ${cy}L${cx + Math.cos(a0) * R} ${cy + Math.sin(a0) * R}L${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R}Z`} fill="#ffffff" fillOpacity="0.16" />;
      })}
      {gears.map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y})`} fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth={Math.max(4, r / 22)}>
          <circle r={r} /><circle r={r * 0.35} />
          {Array.from({ length: 12 }, (_, k) => <rect key={k} x={-r * 0.1} y={-r * 1.22} width={r * 0.2} height={r * 0.24} transform={`rotate(${k * 30})`} />)}
        </g>
      ))}
    </svg>
  );
};

const HAPPY: Expr = { eyes: "happy", brows: "raised", mouth: "grin", extras: ["sparkles"] };
const EUREKA: Expr = { eyes: "wide", brows: "raised", mouth: "grin", look: [0.25, 0.35] };
// right hand raises the wrench, left hand points up at the idea bulb
const PRESENT: Pose = { ...POSES.cheer, head: [-10, 10, -4] };

export const GizmoAvatar: React.FC = () => {
  const cam: CamS = { pos: [0, 0.98, 1.85], target: [0, 0.92, 0], fov: 24 };
  return (
    <AbsoluteFill>
      <Sunburst w={800} h={800} cx={400} cy={360} gears={[]} />
      <ThreeCanvas width={800} height={800} shadows gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} camera={{ fov: cam.fov }}>
        <Cam c={cam} />
        <Lights />
        <Bean3D look={GIZMO} pose={{ ...POSES.stand, head: [0, -8, -7] }} expr={{ eyes: "wink", brows: "raised", mouth: "grin" }} position={[0, 0, 0]} yaw={0.12} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

export const GizmoBanner: React.FC = () => {
  useTitleFont();
  const cam: CamS = { pos: [0.62, 0.95, 4.6], target: [0.62, 0.9, 0], fov: 24 };
  return (
    <AbsoluteFill>
      <Sunburst w={2560} h={1440} cx={900} cy={700} gears={[]} />
      <ThreeCanvas width={2560} height={1440} shadows gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} camera={{ fov: cam.fov }}>
        <Cam c={cam} />
        <Lights />
        <Bean3D look={GIZMO} pose={PRESENT} expr={EUREKA} position={[0, 0, 0]} yaw={0.32} />
        <Bulb position={[0.0, 1.62, 0.05]} s={1.15} />
      </ThreeCanvas>
      <div style={{ position: "absolute", left: 1150, top: 668, fontFamily: TITLE, fontWeight: 900, fontSize: 138, lineHeight: 0.95, color: "#ffffff", whiteSpace: "nowrap",
        WebkitTextStroke: "18px #10223d", paintOrder: "stroke fill", textShadow: "0 14px 0 #10223d, 0 26px 34px rgba(120,40,0,0.35)", transform: "translateY(-50%) rotate(-3deg)" }}>
        GIZMO<br /><span style={{ color: "#2fd0c4" }}>ORIGINS</span>
      </div>
      <div style={{ position: "absolute", left: 1170, top: 808, fontFamily: TITLE, fontWeight: 900, fontSize: 56, color: "#ffffff", letterSpacing: 3,
        background: "#e8302a", padding: "12px 56px", borderRadius: 80, border: "7px solid #10223d", boxShadow: "0 10px 0 #10223d", transform: "rotate(-3deg)" }}>
        SUBSCRIBE
      </div>
    </AbsoluteFill>
  );
};

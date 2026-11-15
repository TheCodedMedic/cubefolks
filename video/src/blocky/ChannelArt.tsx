// Channel art: the banner (2560x1440; everything that matters inside the 1546x423 centre strip every device shows) and
// profile pictures (800x800, read in a small circle). Built from our own blocky cast in the popular avatar styles
// (soft/cute, emo, streetwear, preppy, Y2K) plus the narrator kid; no logos, names or branded items of any game.
import React from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { Cam, useFonts } from "../kit/Short";
import type { CamS } from "../kit/core";
import { BlockChar } from "./BlockRig";
import { BlockLights, Sky } from "./Look";
import { MyStreet, STREET } from "../short06_blocky/Town";
import type { Expr, Look, Pose } from "./types";
import * as M from "./Motion";

type V3 = [number, number, number];
const PALE = "#ece6dc", LIGHT = "#f0d0ae", WARM = "#c98e62", DEEP = "#7e5236";

/** The cast in today's popular avatar styles (our own designs). */
export const SKINS: Record<string, Look> = {
  narrator: { skin: PALE, shirt: "#f2c81e", pants: "#1c1c20", shirtPattern: "stripes", hair: "spiky", hairColor: "#f3d35a" },
  soft: { skin: LIGHT, shirt: "#f6c6d6", pants: "#f4efe8", hair: "long", hairColor: "#c98a5a", acc: ["bow"], accColor: "#ff8fb8" },
  emo: { skin: PALE, shirt: "#1d1d24", pants: "#3a3a44", hair: "emo", hairColor: "#141018", acc: ["headphones"], accColor: "#8a5cf0" },
  street: { skin: DEEP, shirt: "#e86a2a", pants: "#2a3346", hair: "short", hairColor: "#1a120c", hat: "cap", hatColor: "#1f3f8a" },
  preppy: { skin: WARM, shirt: "#e9dcc0", pants: "#3a4f7a", shirtPattern: "plaid", hair: "bob", hairColor: "#2a1a10", glasses: true, tie: "#9a2a3a" },
  y2k: { skin: LIGHT, shirt: "#b9a2ee", pants: "#8fc3f0", hair: "ponytail", hairColor: "#f0d27a", acc: ["headphones"], accColor: "#7ee0c8" },
  sage: { skin: PALE, shirt: "#9bb59a", pants: "#4a4a52", hair: "bun", hairColor: "#6a4024" },
};

type Who = { look: Look; at: V3; yaw: number; pose?: Pose; expr?: Expr; scale?: number; hold?: { R?: React.ReactNode; L?: React.ReactNode } };
const Person: React.FC<Who> = ({ look, at, yaw, pose, expr = "smile", scale = 1, hold }) =>
  <BlockChar look={look} position={at} yaw={yaw} pose={pose} expr={expr} scale={scale} still hold={hold} seed={1} />;

/** A chunky flashlight held in the fist (its lens points out of the top of the fist). */
const Flashlight: React.FC = () => (
  <group>
    <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.16, 0.16, 0.8, 16]} /><meshStandardMaterial color="#2a2a30" roughness={0.4} /></mesh>
    <mesh position={[0, 0.85, 0]}><cylinderGeometry args={[0.26, 0.17, 0.3, 16]} /><meshStandardMaterial color="#3a3a42" roughness={0.4} /></mesh>
    <mesh position={[0, 1.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.22, 20]} /><meshBasicMaterial color="#fff6c8" /></mesh>
  </group>
);

// ---------------------------------------------------------------- the banner
const SW = STREET.sidewalkZ, SY = STREET.sidewalkY;
const CX = -2.2; // scene centre (keeps the fence gate post out from behind the name)
const BANNER_CAM: CamS = { pos: [CX, 4.5, SW + 26], target: [CX, 3.95, SW - 2], fov: 30 };
const camAt = BANNER_CAM.pos;
const faceCam = (p: V3, k = 1) => Math.atan2(camAt[0] - p[0], camAt[2] - p[2]) * k;

const BannerScene: React.FC = () => {
  // inside the mobile strip: the narrator (left) and the emo kid (right) frame the name; desktop/TV add four more
  const cast: Who[] = ([
    { look: SKINS.narrator, at: [CX - 6.3, SY, SW + 1.2], yaw: 0, pose: { armL: 1.45, armLOut: 0.05, armR: 0.55, armROut: 0.25, head: [0.15, 0] }, expr: "surprised", scale: 0.95, hold: { L: <Flashlight /> } },
    { look: SKINS.emo, at: [CX + 6.3, SY, SW + 1.2], yaw: 0, pose: { armL: 0.12, armR: -0.06, armLOut: 0.03, armROut: 0.03, head: [-0.12, 0.04], tilt: 0.09 }, expr: "smirk", scale: 0.95 },
    { look: SKINS.soft, at: [CX - 10.9, SY, SW - 0.6], yaw: 0, pose: M.wave(0.12, 0, Infinity, 1), expr: "happy" },
    { look: SKINS.street, at: [CX + 10.9, SY, SW - 0.6], yaw: 0, pose: M.point(1, 0, Infinity, 0.1, -1), expr: "grin" },
    { look: SKINS.preppy, at: [CX - 15.2, SY, SW - 2.2], yaw: 0, pose: M.hips(1, 0), expr: "smile" },
    { look: SKINS.y2k, at: [CX + 15.2, SY, SW - 2.2], yaw: 0, pose: M.shrug(0.5, 0, 1), expr: "grin" },
  ] as Who[]).map((w) => ({ ...w, yaw: faceCam(w.at, 0.8) }));
  // the creepy one: a neighbour on the porch behind, staring straight at us (the channel's twist)
  const creep: Who = { look: SKINS.sage, at: [-4.2, STREET.porchY, 11.6], yaw: faceCam([-4.2, 0, 11.6]), expr: "stare", pose: { head: [0, -0.04] } };
  return (
    <>
      <Sky time="dusk" />
      <BlockLights time="dusk" focus={[0, 0, SW]} shadowSpan={30} fill={1.35} />
      <MyStreet time="dusk" />
      {cast.map((w, i) => <Person key={i} {...w} />)}
      <Person {...creep} />
    </>
  );
};

/** Big chunky game-title lettering: white fill, thick navy outline, a hard 3D drop. */
const Title: React.FC<{ text: string; size: number }> = ({ text, size }) => (
  <div style={{
    font: `900 ${size}px Montserrat, sans-serif`, letterSpacing: size * 0.02, color: "#ffffff", lineHeight: 1,
    WebkitTextStroke: `${size * 0.13}px #14183a`, paintOrder: "stroke fill",
    textShadow: `0 ${size * 0.07}px 0 #14183a, 0 ${size * 0.11}px 0 #0a0c20, 0 ${size * 0.16}px ${size * 0.12}px rgba(0,0,0,0.45)`,
  } as React.CSSProperties}>{text}</div>
);

export const ChannelBanner: React.FC<{ name?: string; tagline?: string; guides?: boolean }> = ({ name = "KEWLHAT", tagline = "STRANGE STORIES FROM A BLOCKY TOWN", guides = false }) => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: "#1c2448" }}>
      <ThreeCanvas width={2560} height={1440} shadows gl={{ antialias: true, preserveDrawingBuffer: true } as any}
        onCreated={({ gl }) => { gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
        <Cam c={BANNER_CAM} />
        <BannerScene />
      </ThreeCanvas>
      {/* the name and tagline, centred in the mobile-safe strip (1546x423 at 507..2053, 508..931) */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, transform: "translateY(-8px)" }}>
          <Title text={name} size={name.length > 8 ? 150 : 172} />
          <div style={{ font: "800 38px Montserrat, sans-serif", color: "#14183a", background: "#ffd23a", padding: "10px 26px", borderRadius: 12,
            border: "5px solid #14183a", letterSpacing: 2, boxShadow: "0 7px 0 #14183a" }}>{tagline}</div>
        </div>
      </AbsoluteFill>
      {guides && <>
        <div style={{ position: "absolute", left: 507, top: 508, width: 1546, height: 423, border: "4px dashed #00ff88" }} />
        <div style={{ position: "absolute", left: 352, top: 508, width: 1855, height: 423, border: "3px dashed #ffaa00" }} />
        <div style={{ position: "absolute", left: 0, top: 508, width: 2560, height: 423, border: "3px dashed #ff4466" }} />
      </>}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- profile pictures (read in a small circle)
const AV_AT: V3 = [-8.6, SY, SW]; // a clear stretch of sidewalk (no mailbox or post in front)
const AVATAR_CAMS: Record<string, CamS> = {
  night: { pos: [AV_AT[0] + 1.7, 4.85, SW + 6.4], target: [AV_AT[0] - 0.2, 4.25, SW], fov: 30 },
  pop: { pos: [1.5, 4.7, 6.2], target: [-0.15, 4.2, 0], fov: 30 },
};
export const ChannelAvatar: React.FC<{ variant?: "night" | "pop"; guides?: boolean }> = ({ variant = "night", guides = false }) => {
  const night = variant === "night";
  const c = AVATAR_CAMS[variant];
  const at: V3 = night ? AV_AT : [0, 0, 0];
  const yaw = Math.atan2(c.pos[0] - at[0], c.pos[2] - at[2]) * 0.85;
  const pose = M.mix({ armL: 1.45, armLOut: 0.05 }, { head: [0.12, -0.04] });
  // night: someone stands on the lawn behind him, staring (the channel's twist), small over his shoulder
  const behind: V3 = [AV_AT[0] - 5.6, 0, SW - 10];
  return (
    <AbsoluteFill style={{ background: night ? "#1c2448" : "#3b2a8a" }}>
      {!night && <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #7a6cff 0%, #4a37c8 45%, #23195e 100%)" }} />}
      <ThreeCanvas width={800} height={800} shadows gl={{ antialias: true, preserveDrawingBuffer: true, alpha: !night } as any}
        onCreated={({ gl }) => { gl.shadowMap.type = THREE.PCFSoftShadowMap; if (!night) gl.setClearColor(0x000000, 0); }}>
        <Cam c={c} />
        {night ? <><Sky time="dusk" /><BlockLights time="dusk" focus={at} shadowSpan={14} fill={1.6} /><MyStreet time="dusk" />
          <Person look={SKINS.sage} at={behind} yaw={Math.atan2(c.pos[0] - behind[0], c.pos[2] - behind[2])} expr="stare" /></>
          : <BlockLights time="day" focus={at} shadowSpan={10} fill={1.3} haze={false} />}
        <Person look={SKINS.narrator} at={at} yaw={yaw} pose={pose} expr="surprised" hold={{ L: <Flashlight /> }} />
      </ThreeCanvas>
      {guides && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "0 0 0 4000px rgba(0,0,0,0.55)", border: "3px dashed #00ff88" }} />}
    </AbsoluteFill>
  );
};

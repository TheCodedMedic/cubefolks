// BlockFaceSheet: every decal expression on a head, front and three-quarter, plus a blink strip (a 1080x1920 still).
// The heads copy the rig's head and face-strip geometry (BlockRig.tsx) so the sheet shows exactly what the rig shows.
import React from "react";
import { AbsoluteFill } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ALL_EXPRS, makeFaceTexture } from "./BlockFace";
import type { Expr } from "./types";

const SW = 1080, SH = 1920;
let headGeo: THREE.LatheGeometry | null = null;
const getHeadGeo = () => {
  if (headGeo) return headGeo;
  const r = 0.5, h = 0.5, b = 0.16, pts: THREE.Vector2[] = [new THREE.Vector2(0, -h)];
  for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, -h + b + Math.sin(a) * b)); }
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, h - b + Math.sin(a) * b)); }
  pts.push(new THREE.Vector2(0, h));
  return (headGeo = new THREE.LatheGeometry(pts, 48));
};
const faceGeo = new THREE.CylinderGeometry(0.507, 0.507, 0.84, 32, 1, true, -0.42 * Math.PI, 0.84 * Math.PI);
const torsoGeo = new RoundedBoxGeometry(1.6, 0.45, 0.8, 3, 0.1);

const Head: React.FC<{ expr: Expr; blink?: number; yaw: number; pos: [number, number]; skin: string; shirt: string; s: number }> =
  ({ expr, blink = 0, yaw, pos, skin, shirt, s }) => (
    <group position={[pos[0], pos[1], 0]} scale={s} rotation={[0.08, yaw, 0]}>
      <mesh geometry={getHeadGeo()}><meshStandardMaterial color={skin} roughness={0.42} /></mesh>
      <mesh geometry={faceGeo} position={[0, -0.02, 0]} renderOrder={2}>
        <meshStandardMaterial map={makeFaceTexture(expr, blink)} transparent alphaTest={0.05} roughness={0.6} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh geometry={torsoGeo} position={[0, -0.78, 0]}><meshStandardMaterial color={shirt} roughness={0.8} /></mesh>
    </group>
  );

const SKINS = ["#e9e4dc", "#f1c9a2", "#e9e4dc", "#c99a6e", "#e9e4dc"];
const SHIRTS = ["#3d6b46", "#c9a23a", "#b8566e", "#3c5a8a", "#6b6b6b"];
const COLW = SW / 4, ROWH = 300, TOP = 70;

export const BlockFaceSheet: React.FC = () => {
  const heads: React.ReactNode[] = [], labels: React.ReactNode[] = [];
  ALL_EXPRS.forEach((e, i) => {
    const row = Math.floor(i / 2), col0 = (i % 2) * 2;
    for (let v = 0; v < 2; v++) {
      const cx = (col0 + v + 0.5) * COLW, cy = TOP + row * ROWH + 110;
      heads.push(<Head key={`${e}${v}`} expr={e} yaw={v ? -0.62 : 0} pos={[cx - SW / 2, SH / 2 - cy]} s={150}
        skin={SKINS[row]} shirt={SHIRTS[row]} />);
    }
    labels.push(<div key={e} style={{ position: "absolute", left: col0 * COLW, width: 2 * COLW, top: TOP + row * ROWH + 252, textAlign: "center",
      font: "700 34px sans-serif", color: "#222" }}>{e}</div>);
  });
  // blink strip: smile at blink 0, .4, .8, 1
  [0, 0.4, 0.8, 1].forEach((b, i) => {
    const cx = (i + 0.5) * COLW, cy = TOP + 5 * ROWH + 110;
    heads.push(<Head key={`b${i}`} expr="smile" blink={b} yaw={0} pos={[cx - SW / 2, SH / 2 - cy]} s={150} skin="#e9e4dc" shirt="#c9a23a" />);
    labels.push(<div key={`bl${i}`} style={{ position: "absolute", left: i * COLW, width: COLW, top: TOP + 5 * ROWH + 252, textAlign: "center",
      font: "700 30px sans-serif", color: "#222" }}>{`blink ${b}`}</div>);
  });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#cfdbe6, #eef1f3)" }}>
      <ThreeCanvas width={SW} height={SH} orthographic camera={{ position: [0, 0, 1000], zoom: 1, near: 1, far: 5000 }}
        gl={{ antialias: true, preserveDrawingBuffer: true } as any}>
        <hemisphereLight args={["#ffffff", "#8a8f99", 1.4]} />
        <directionalLight position={[300, 500, 900]} intensity={1.6} />
        <directionalLight position={[-600, 100, 400]} intensity={0.4} />
        {heads}
      </ThreeCanvas>
      {labels}
    </AbsoluteFill>
  );
};

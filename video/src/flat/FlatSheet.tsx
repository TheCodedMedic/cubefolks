// The Inkfolk character sheet (style 2: flat ink characters on lit cards in 3D): the same 8 cast, 4 views, 6 poses, 12 expressions.
// One orthographic camera over the whole sheet (tilted down a little so the ground contact reads); HTML labels on top.
import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAST, SKIN } from "../bean/Bean3D";
import { FlatChar, FPOSE, FlatExpr, View } from "./Ink2D";

const SHEET_W = 3840, SHEET_H = 2160;
const K = 300; // px per world unit
const T = 12 * (Math.PI / 180); // camera tilt
const wx = (px: number) => (px - SHEET_W / 2) / K;
const wy = (py: number) => (SHEET_H / 2 - py) / (K * Math.cos(T)); // world y of a ground point at screen y (z = 0)

const Cam: React.FC = () => {
  const { camera, size } = useThree();
  const c = camera as THREE.OrthographicCamera;
  c.left = -size.width / 2 / K; c.right = size.width / 2 / K; c.top = size.height / 2 / K; c.bottom = -size.height / 2 / K;
  c.near = 0.1; c.far = 100;
  c.position.set(0, Math.sin(T) * 30, Math.cos(T) * 30);
  c.lookAt(0, 0, 0);
  c.updateProjectionMatrix();
  return null;
};

const Disc: React.FC<{ x: number; y: number; c: string; r?: number }> = ({ x, y, c, r = 0.27 }) => (
  <mesh position={[x, y - 0.015, 0]} receiveShadow><cylinderGeometry args={[r, r, 0.03, 48]} /><meshStandardMaterial color={c} roughness={0.85} /></mesh>
);

const Crate: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <group position={[x, y, -0.02]}>
    <mesh position={[0, 0.075, 0]} castShadow receiveShadow><boxGeometry args={[0.32, 0.15, 0.24]} /><meshStandardMaterial color="#b98552" roughness={0.8} /></mesh>
    {[-0.1, 0.1].map((dx) => <mesh key={dx} position={[dx, 0.075, 0.121]}><boxGeometry args={[0.025, 0.15, 0.004]} /><meshStandardMaterial color="#8e6239" roughness={0.8} /></mesh>)}
  </group>
);

const Briefcase: React.FC = () => (
  <group position={[0, -0.075, 0]}>
    <mesh castShadow><boxGeometry args={[0.03, 0.1, 0.15]} /><meshStandardMaterial color="#6b3f22" roughness={0.6} /></mesh>
    <mesh position={[0, 0.06, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.025, 0.006, 8, 16, Math.PI]} /><meshStandardMaterial color="#3a2414" roughness={0.5} /></mesh>
    <mesh position={[0.016, 0.02, 0]}><boxGeometry args={[0.004, 0.012, 0.03]} /><meshStandardMaterial color="#d8b04a" roughness={0.3} /></mesh>
  </group>
);

// layout (screen px)
const CARD_W = 930, CARD_X = (i: number) => 15 + 960 * i + CARD_W / 2;
const CARD_ROWS = [640, 1172]; // feet line of each card row
const VIEW_DX = [-1.12, -0.37, 0.37, 1.12]; // world x offsets within a card
const VIEWS: { n: string; v: View }[] = [{ n: "FRONT", v: "front" }, { n: "3/4", v: "quarter" }, { n: "SIDE", v: "side" }, { n: "BACK", v: "back" }];
const POSE_Y = 1640, POSE_X = (i: number) => 320 + i * 640;
const POSE_LIST: { n: string; pose: keyof typeof FPOSE; who: number; expr: FlatExpr; view: View; prop?: "revolver" | "briefcase" }[] = [
  { n: "WALK + CARRY", pose: "walk", who: 1, expr: "neutral", view: "side", prop: "briefcase" },
  { n: "RUN", pose: "run", who: 4, expr: "nervous", view: "side" },
  { n: "SIT", pose: "sit", who: 0, expr: "whistle", view: "side" },
  { n: "JUMP FOR JOY", pose: "jump", who: 5, expr: "grin", view: "front" },
  { n: "POINT", pose: "point", who: 2, expr: "stern", view: "quarter" },
  { n: "SHRUG", pose: "shrug", who: 6, expr: "smug", view: "front" },
];
const EXPR_Y = 2000, EXPR_X = (i: number) => 165 + i * 319;
const EXPR_LIST: { n: FlatExpr; who: number }[] = [
  { n: "neutral", who: 0 }, { n: "grin", who: 5 }, { n: "laugh", who: 4 }, { n: "smug", who: 1 }, { n: "shock", who: 7 }, { n: "nervous", who: 3 },
  { n: "sad", who: 0 }, { n: "stern", who: 2 }, { n: "whistle", who: 5 }, { n: "dazed", who: 6 }, { n: "pained", who: 7 }, { n: "lick", who: 4 },
];

const useFonts = () => {
  const [h] = useState(() => delayRender("fonts"));
  useEffect(() => {
    const faces = [new FontFace("Montserrat", `url(${staticFile("fonts/Montserrat-900.woff2")})`, { weight: "900" }),
      new FontFace("Montserrat", `url(${staticFile("fonts/Montserrat-800.woff2")})`, { weight: "800" })];
    Promise.all(faces.map((f) => f.load())).then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};

const label: React.CSSProperties = { position: "absolute", transform: "translateX(-50%)", whiteSpace: "nowrap", fontFamily: "Montserrat, sans-serif", color: "#3b2a1f" };

export const FlatSheet: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#f7ecda, #efdcc0)" }}>
      {/* cards */}
      {[0, 1].map((row) => [0, 1, 2, 3].map((col) => (
        <div key={`${row}${col}`} style={{ position: "absolute", left: CARD_X(col) - CARD_W / 2, top: CARD_ROWS[row] - 455, width: CARD_W, height: 517, borderRadius: 34, background: "rgba(255,255,255,0.45)", border: "3px solid rgba(120,80,40,0.12)" }} />
      )))}
      <div style={{ position: "absolute", left: 15, top: 1250, width: SHEET_W - 30, height: 460, borderRadius: 34, background: "rgba(255,255,255,0.32)" }} />
      <div style={{ position: "absolute", left: 15, top: 1722, width: SHEET_W - 30, height: 425, borderRadius: 34, background: "rgba(255,255,255,0.32)" }} />

      <ThreeCanvas width={SHEET_W} height={SHEET_H} orthographic shadows gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }} style={{ position: "absolute", inset: 0 }}>
        <Cam />
        <hemisphereLight args={["#fff4e2", "#b48e6a", 1.15]} />
        <directionalLight position={[-5, 8, 7]} intensity={2.3} color="#ffeccf" castShadow shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} shadow-camera-near={0.5} shadow-camera-far={40} shadow-bias={-0.0004} shadow-normalBias={0.02} />
        <directionalLight position={[5, 3, -6]} intensity={0.7} color="#ffd6ad" />

        {CAST.map((look, i) => {
          const row = Math.floor(i / 4), col = i % 4, y = wy(CARD_ROWS[row]), cx = wx(CARD_X(col));
          return VIEWS.map((v, j) => (
            <group key={`${i}-${j}`}>
              <Disc x={cx + VIEW_DX[j]} y={y} c="#d9b98f" />
              <FlatChar look={look} view={v.v} position={[cx + VIEW_DX[j], y, 0]} height={1.5} />
            </group>
          ));
        })}

        {POSE_LIST.map((p, i) => {
          const x = wx(POSE_X(i)), y = wy(POSE_Y);
          return (
            <group key={p.n}>
              <Disc x={x} y={y} c="#d3b088" r={0.42} />
              {p.pose === "sit" && <Crate x={x} y={y} />}
              <FlatChar look={CAST[p.who]} pose={FPOSE[p.pose]} expr={p.expr} view={p.view} prop={p.prop} position={[x, y, p.pose === "sit" ? 0.15 : 0]} height={1.5} />
            </group>
          );
        })}

        {EXPR_LIST.map((e, i) => (
          <group key={e.n} scale={2.3} position={[wx(EXPR_X(i)), wy(EXPR_Y) - 2.3 * 0.62 * 1.3 * 0.98, 0]}><FlatChar look={CAST[e.who]} expr={e.n} view="front" height={1.3} /></group>
        ))}
      </ThreeCanvas>

      {/* title + skin palette */}
      <div style={{ ...label, left: 40, top: 22, transform: "none", fontSize: 64, fontWeight: 900, letterSpacing: 1 }}>BEANFOLK <span style={{ fontWeight: 800, fontSize: 40, opacity: 0.6 }}>· INKFOLK · style 2 cast sheet · for approval</span></div>
      <div style={{ position: "absolute", right: 40, top: 30, display: "flex", gap: 12, alignItems: "center", fontFamily: "Montserrat", fontWeight: 800, fontSize: 30, color: "#3b2a1f" }}>
        SKIN
        {SKIN.map((c, i) => <div key={c} style={{ width: 54, height: 54, borderRadius: 27, background: c, border: "3px solid rgba(0,0,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: i < 4 ? "#3b2a1f" : "#fff" }}>{i + 1}</div>)}
      </div>

      {CAST.map((look, i) => {
        const row = Math.floor(i / 4), col = i % 4;
        return (
          <React.Fragment key={look.name}>
            <div style={{ ...label, left: CARD_X(col), top: CARD_ROWS[row] + 22, fontSize: 38, fontWeight: 900 }}>
              {look.name} <span style={{ fontWeight: 800, fontSize: 28, opacity: 0.6 }}>· {look.role} · skin {look.skin + 1}</span>
            </div>
            {VIEWS.map((v, j) => (
              <div key={v.n} style={{ ...label, left: CARD_X(col) + VIEW_DX[j] * K, top: CARD_ROWS[row] - 445, fontSize: 20, fontWeight: 800, opacity: 0.45 }}>{v.n}</div>
            ))}
          </React.Fragment>
        );
      })}
      {POSE_LIST.map((p, i) => (
        <div key={p.n} style={{ ...label, left: POSE_X(i), top: POSE_Y + 22, fontSize: 32, fontWeight: 900 }}>{p.n}</div>
      ))}
      {EXPR_LIST.map((e, i) => (
        <div key={e.n} style={{ ...label, left: EXPR_X(i), top: EXPR_Y + 95, fontSize: 28, fontWeight: 900, background: "#fbf3e6", padding: "4px 18px", borderRadius: 20, boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>{e.n}</div>
      ))}
    </AbsoluteFill>
  );
};

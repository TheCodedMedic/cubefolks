// The test set: an evening street. The street runs along x. The café and the near buildings stand at z = −3 (facing +z);
// the near pavement is z −3..1.6, the road z 1.6..8, the far pavement z 8..10, and the far buildings stand at z = 10.5 (facing −z).
import React, { useMemo } from "react";
import * as THREE from "three";
import { toon } from "./Person3D";

const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const canvasTex = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
};

/** Sky dome: deep navy overhead to a warm amber band on the horizon. */
const Sky: React.FC<{ night?: boolean }> = ({ night }) => {
  const tex = useMemo(() => canvasTex(4, 512, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 512);
    if (night) { gr.addColorStop(0, "#04060F"); gr.addColorStop(0.3, "#0B1226"); gr.addColorStop(0.46, "#1E2A4A"); gr.addColorStop(0.5, "#2E3A5E"); gr.addColorStop(0.53, "#121828"); gr.addColorStop(1, "#080A12"); } else {
    gr.addColorStop(0, "#0B1226"); gr.addColorStop(0.32, "#1B2A4E"); gr.addColorStop(0.43, "#5A4A6E"); gr.addColorStop(0.49, "#E39A5C"); gr.addColorStop(0.53, "#2A2A44"); gr.addColorStop(1, "#141426"); }
    g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  }), [night]);
  return <mesh><sphereGeometry args={[500, 32, 16]} /><meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} /></mesh>;
};

/** One facade texture: a wall colour with a window grid; some windows lit warm. */
const useFacade = (seed: number) => useMemo(() => {
  const base = canvasTex(256, 512, (g) => {
    g.fillStyle = "#ffffff"; g.fillRect(0, 0, 256, 512);
    for (let r = 0; r < 7; r++) for (let c = 0; c < 3; c++) {
      g.fillStyle = "#2a3050"; g.fillRect(28 + c * 76, 30 + r * 68, 46, 44);
    }
  });
  const glow = canvasTex(256, 512, (g) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, 256, 512);
    for (let r = 0; r < 7; r++) for (let c = 0; c < 3; c++) {
      if (rnd(seed + r * 7 + c) > 0.55) { g.fillStyle = rnd(seed + r + c * 3) > 0.5 ? "#ffcf7a" : "#ffb35a"; g.fillRect(28 + c * 76, 30 + r * 68, 46, 44); }
    }
  });
  return { base, glow };
}, [seed]);

export const Building: React.FC<{ x: number; z: number; w: number; h: number; d: number; color: string; seed: number; flash?: number; glow?: number }> = ({ x, z, w, h, d, color, seed, flash = 0, glow = 1.1 }) => {
  const f = useFacade(seed % 5);
  const mat = useMemo(() => {
    const b = f.base.clone(); b.needsUpdate = true; b.wrapS = b.wrapT = THREE.RepeatWrapping; b.repeat.set(Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(h / 5)));
    const g = f.glow.clone(); g.needsUpdate = true; g.wrapS = g.wrapT = THREE.RepeatWrapping; g.repeat.copy(b.repeat);
    return new THREE.MeshStandardMaterial({ color, map: b, emissive: "#ffffff", emissiveMap: g, emissiveIntensity: 1.1, roughness: 0.9 });
  }, [f, color, w, h]);
  mat.emissiveIntensity = glow + flash * 3;
  return <mesh position={[x, h / 2, z]} material={mat} receiveShadow><boxGeometry args={[w, h, d]} /></mesh>;
};

const Cafe: React.FC = () => {
  const sign = useMemo(() => canvasTex(512, 128, (g) => {
    g.fillStyle = "#1B2A4E"; g.fillRect(0, 0, 512, 128);
    g.fillStyle = "#F6E7C8"; g.font = "800 86px 'Plus Jakarta Sans'"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("CAFÉ", 256, 68);
  }), []);
  const awning = useMemo(() => {
    const t = canvasTex(512, 64, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#F1E8D6" : "#C8322C"; g.fillRect(i * 64, 0, 64, 64); } });
    return t;
  }, []);
  return (
    <group position={[-2.6, 0, -3]}>
      <mesh position={[0, 2.6, -0.4]} material={toon("#6B4A3E")} receiveShadow><boxGeometry args={[6.4, 5.2, 0.8]} /></mesh>
      {/* shop window, warm and lit from inside */}
      <mesh position={[-0.9, 1.25, 0.01]}><planeGeometry args={[3.2, 1.7]} /><meshStandardMaterial color="#3a2a20" emissive="#ffb35a" emissiveIntensity={0.9} /></mesh>
      <mesh position={[-0.9, 1.25, 0.02]} material={toon("#2B1D18")}><boxGeometry args={[3.35, 0.08, 0.04]} /></mesh>
      {/* door */}
      <mesh position={[1.7, 1.1, 0.01]} material={toon("#1B2A4E")}><planeGeometry args={[1.0, 2.2]} /></mesh>
      <mesh position={[2.05, 1.1, 0.04]}><sphereGeometry args={[0.04, 10, 8]} /><meshStandardMaterial color="#F2B84B" emissive="#F2B84B" emissiveIntensity={0.6} /></mesh>
      {/* sign + striped awning */}
      <mesh position={[0, 3.05, 0.02]}><planeGeometry args={[2.2, 0.55]} /><meshBasicMaterial map={sign} /></mesh>
      <mesh position={[0, 2.45, 0.45]} rotation={[D(62), 0, 0]} castShadow><planeGeometry args={[6.2, 1.1]} /><meshToonMaterial map={awning} side={THREE.DoubleSide} /></mesh>
      {/* tables by the window */}
      {[-2.2, -0.4].map((x) => (
        <group key={x} position={[x, 0, 0.9]}>
          <mesh position={[0, 0.72, 0]} material={toon("#2B1D18")} castShadow><cylinderGeometry args={[0.32, 0.32, 0.04, 20]} /></mesh>
          <mesh position={[0, 0.36, 0]} material={toon("#2B1D18")}><cylinderGeometry args={[0.03, 0.03, 0.72, 8]} /></mesh>
        </group>
      ))}
    </group>
  );
};
const D = THREE.MathUtils.degToRad;

const Lamp: React.FC<{ x: number; z: number; light?: boolean }> = ({ x, z, light }) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 1.7, 0]} material={toon("#22263A")} castShadow><cylinderGeometry args={[0.05, 0.08, 3.4, 10]} /></mesh>
    <mesh position={[0, 3.45, 0]}><sphereGeometry args={[0.17, 16, 12]} /><meshStandardMaterial color="#ffe2a8" emissive="#ffd27a" emissiveIntensity={3} /></mesh>
    {light && <pointLight position={[0, 3.3, 0]} color="#ffc777" intensity={9} distance={9} decay={1.6} />}
  </group>
);

const Tree: React.FC<{ x: number; z: number; s: number }> = ({ x, z, s }) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh position={[0, 0.9, 0]} material={toon("#3A2A22")} castShadow><cylinderGeometry args={[0.08, 0.12, 1.8, 8]} /></mesh>
    <mesh position={[0, 2.3, 0]} material={toon("#2E4A3A")} castShadow><sphereGeometry args={[0.9, 14, 10]} /></mesh>
    <mesh position={[0.35, 2.75, 0.2]} material={toon("#36574A")} castShadow><sphereGeometry args={[0.55, 12, 8]} /></mesh>
  </group>
);

/** night: rain-night colours and wet road. rewrite(i, t): building height multiplier and flash, for the "city rewriting itself" shots. */
export type Rewrite = (i: number, x?: number, z?: number) => { k: number; flash: number };
export const World3D: React.FC<{ night?: boolean; rewrite?: Rewrite; noLamp?: boolean; nearTrees?: boolean; lamps?: boolean; bare?: boolean; cafe?: boolean; glow?: number }> = ({ night, rewrite, noLamp, nearTrees = true, lamps = true, bare, cafe = true, glow }) => {
  const near = useMemo(() => {
    const out: { x: number; w: number; h: number; c: string; s: number }[] = [];
    let x = 0.8;
    for (let i = 0; i < 26; i++) { const w = 4 + rnd(i) * 5; out.push({ x: x + w / 2, w, h: 5 + rnd(i + 50) * 9, c: ["#4A4466", "#5A4E58", "#3E4A66", "#6A5A52"][i % 4], s: i }); x += w + 0.3; }
    x = -5.9;
    for (let i = 0; i < 26; i++) { const w = 4 + rnd(i + 9) * 5; out.push({ x: x - w / 2, w, h: 5 + rnd(i + 70) * 9, c: ["#5A4E58", "#3E4A66", "#4A4466", "#6A5A52"][i % 4], s: i + 30 }); x -= w + 0.3; }
    return out;
  }, []);
  const far = useMemo(() => {
    const out: { x: number; w: number; h: number; c: string; s: number }[] = [];
    let x = -150;
    for (let i = 0; i < 50; i++) { const w = 4 + rnd(i + 200) * 6; out.push({ x: x + w / 2, w, h: 6 + rnd(i + 300) * 12, c: ["#3E4A66", "#4A4466", "#58506A"][i % 3], s: i + 60 }); x += w + 0.4; }
    return out;
  }, []);
  return (
    <>
      {!bare && <Sky night={night} />}
      {!bare && <fog attach="fog" args={night ? ["#0E1424", 16, 120] : ["#2A2A48", 22, 170]} />}
      {/* ground: pavements, kerbs, road, centre dashes */}
      {night ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.7]} receiveShadow><planeGeometry args={[400, 4.6]} /><meshStandardMaterial color="#2A2C40" roughness={0.75} metalness={0.0} /></mesh>
        : <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.7]} material={toon("#4A4560")} receiveShadow><planeGeometry args={[400, 4.6]} /></mesh>}
      <mesh position={[0, 0.06, 1.6]} material={toon("#6A6480")} receiveShadow><boxGeometry args={[400, 0.12, 0.18]} /></mesh>
      {night ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 4.8]} receiveShadow><planeGeometry args={[400, 6.4]} /><meshStandardMaterial color="#161A2A" roughness={0.62} metalness={0.05} /></mesh>
        : <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 4.8]} material={toon("#24243A")} receiveShadow><planeGeometry args={[400, 6.4]} /></mesh>}
      {Array.from({ length: 80 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-200 + i * 5, 0.0, 4.8]} material={toon("#E8DFC8")}><planeGeometry args={[2.2, 0.12]} /></mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 9.2]} material={toon("#4A4560")} receiveShadow><planeGeometry args={[400, 2.4]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} material={toon("#1A1A2A")}><planeGeometry args={[800, 800]} /></mesh>
      {near.map((b, i) => { const rw = rewrite?.(i, b.x, -3.9); return <Building key={`n${b.s}`} x={b.x} z={-3.4 - 0.5} w={b.w} h={b.h * (rw?.k ?? 1)} d={1} color={b.c} seed={b.s} flash={rw?.flash} glow={glow} />; })}
      {far.map((b, i) => { const rw = rewrite?.(i + 100, b.x, 11); return <Building key={`f${b.s}`} x={b.x} z={11} w={b.w} h={b.h * (rw?.k ?? 1)} d={1} color={b.c} seed={b.s} flash={rw?.flash} glow={glow} />; })}
      {cafe && <Cafe />}
      {!noLamp && <Lamp x={1.2} z={1.45} light />}
      {lamps && Array.from({ length: 22 }, (_, i) => <Lamp key={i} x={-110 + i * 11 + (i >= 10 ? 11 : 0)} z={1.3} light={night && Math.abs(-110 + i * 11 + (i >= 10 ? 11 : 0)) < 40} />)}
      {Array.from({ length: 30 }, (_, i) => (i % 2 && !nearTrees ? null : <Tree key={i} x={-150 + i * 10 + 5} z={i % 2 ? 1.25 : 8.4} s={0.9 + rnd(i + 900) * 0.4} />))}
      {/* bench */}
      <group position={[-7.2, 0, 0.7]}>
        <mesh position={[0, 0.45, 0]} material={toon("#6B4A3E")} castShadow><boxGeometry args={[1.6, 0.06, 0.45]} /></mesh>
        <mesh position={[0, 0.75, -0.2]} material={toon("#6B4A3E")} castShadow><boxGeometry args={[1.6, 0.4, 0.05]} /></mesh>
        {[-0.7, 0.7].map((x) => <mesh key={x} position={[x, 0.22, 0]} material={toon("#22263A")}><boxGeometry args={[0.06, 0.45, 0.4]} /></mesh>)}
      </group>
      {/* light */}
      {!bare && <>
      <hemisphereLight args={night ? ["#5A6EA8", "#141018", 0.7] : ["#9DB2E0", "#3A2A30", 1.1]} />
      <directionalLight position={[-14, 10, 16]} color={night ? "#8FA8E0" : "#FFC890"} intensity={night ? 1.1 : 2.4} castShadow
        shadow-mapSize={[2048, 2048]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-near={1} shadow-camera-far={60} shadow-bias={-0.0004} shadow-normalBias={0.02} />
      <directionalLight position={[6, 6, -16]} color="#9FC4FF" intensity={night ? 2.2 : 1.6} />
      </>}
    </>
  );
};

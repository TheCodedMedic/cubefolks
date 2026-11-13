// Short 4 "The Wrong Part That Saved Millions of Hearts" (Beanfolk 3D): the set-ups. Every time comes from timing.ts
// (measured words). Every set sits at the origin; a shot renders one set. Faces turn toward the camera.
import React from "react";
import * as THREE from "three";
import { CamS, c01, io, lerp, orbit, out3, popIn, seg, Shot, V3 } from "../kit/core";
import { EXPR, Expr, liveFace } from "../bean/Face";
import { Bean3D as GBean } from "../bean/Bean3D";
import { GIZMO } from "../gizmo/GizmoArt";
import { idlePose, mixPose, Pose, POSES, walkPose } from "./Bean";
import { Bed, BigMachine, Circuit, Clock, Drawers, Heart, HeldPacer, Iron, labelTex, LOOKS, Mat, MINIS, MiniFolk, Monitor, Pacer, Person, pulseGlow, Resistor, Scope, Smoke, Socket, Spark, SurgCap, SurgLamp, Who } from "./cast";
import { BarnIn, BarnOut, BENCH_Y, Hospital, OR, Street, Violet, Workshop } from "./sets";
import { CUTS, END, EV, P, PE, PULSES, span } from "./timing";

const D = Math.PI / 180;
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** The yaw that turns a character at p to face the point c. */
const face = (p: V3, c: V3) => Math.atan2(c[0] - p[0], c[2] - p[2]);

// ---------- expressions ----------
const X: Record<string, Expr> = {
  ...EXPR,
  focus: { eyes: "open", brows: "worried", mouth: "pout", look: [-0.2, 0.5] } as Expr,
  focusR: { eyes: "open", brows: "neutral", mouth: "small", look: [0.5, 0.4] } as Expr,
  proud: { eyes: "happy", brows: "raised", mouth: "smile", extras: ["sparkles"] } as Expr,
  wonder: { eyes: "wide", brows: "raised", mouth: "smile", extras: ["sparkles"] } as Expr,
  frozen: { eyes: "wide", brows: "raised", mouth: "o", extras: ["sweat"] } as Expr,
  watch: { eyes: "open", brows: "raised", mouth: "small", look: [0.3, 0.2] } as Expr,
  scared: { eyes: "wide", brows: "worried", mouth: "wobbly", extras: ["sweat"] } as Expr,
  calm: { eyes: "closed", brows: "neutral", mouth: "smile" } as Expr,
  tired: { eyes: "tired", brows: "worried", mouth: "small" } as Expr,
  talk: { eyes: "open", brows: "raised", mouth: "smile" } as Expr,
  sly: { eyes: "smug", brows: "oneUp", mouth: "smirk", look: [0.6, 0.1] } as Expr,
};
const live = (e: Expr, t: number, seed: number) => liveFace(e, t, { seed });

// ---------- poses ----------
const work: Pose = { ...POSES.stand, armL: [14, 62, 52], armR: [14, 62, 52], lean: 8, head: [10, 0, 0] };
const reachR: Pose = { ...POSES.stand, armR: [40, 72, 8], lean: 6, head: [8, -18, 0] };
const holdUp: Pose = { ...POSES.stand, armR: [30, 95, 40], head: [-4, 0, 0] };
const cheerPose = (t: number, seed: number): Pose => mixPose(POSES.cheer, POSES.stand, 0.5 + 0.5 * Math.sin(t * 9 + seed * 2));
const lean: Pose = { ...POSES.stand, armL: [14, 40, 60], armR: [14, 40, 60], lean: 14, head: [6, 0, 0] };
const jolt: Pose = { ...POSES.headHands, lean: -8 };
const thumbs: Pose = { ...POSES.stand, armR: [40, 80, 100], head: [0, 0, -6] };

// ---------- cameras ----------
const FOVK = 1.35;
const C = (pos: V3, target: V3, fov = 40): CamS => ({ pos, target, fov: fov * FOVK });
const mv = (id: string, a: CamS, b: CamS) => (t: number): CamS => {
  const [t0, t1] = span(id), u = io(seg(t, t0, t1));
  const L = (p: V3, q: V3): V3 => [lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)];
  return { pos: L(a.pos, b.pos), target: L(a.target, b.target), fov: lerp(a.fov, b.fov, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u) };
};
const orb = (id: string, c: V3, a0: number, a1: number, r0: number, r1: number, y0: number, y1: number, fov = 38, ty = c[1]) => (t: number): CamS => {
  const [t0, t1] = span(id), u = io(seg(t, t0, t1));
  return { pos: orbit(c, lerp(a0, a1, u), lerp(r0, r1, u), lerp(y0, y1, u)), target: [c[0], ty, c[2]], fov: fov * FOVK };
};

// ---------- the workshop ----------
const WIL: V3 = [0, 0, -0.55];
const SCOPE_P: V3 = [0.48, BENCH_Y, -0.05], CIRC_P: V3 = [0.02, BENCH_Y, 0.06], DRAW_P: V3 = [-0.62, BENCH_Y, -0.12];
const wilson = (t: number, o: Partial<Who> = {}): Who => ({ look: LOOKS.wilson, pos: WIL, yaw: 0, pose: idlePose(t, work, 1), expr: live(X.focus, t, 1), ...o });
const Bench: React.FC<{ t: number; pulses?: number[]; open?: number; circuit?: Partial<React.ComponentProps<typeof Circuit>>; noCircuit?: boolean; children?: React.ReactNode; g?: "warm" | "dim" }> = ({ t, pulses = PULSES.lab, open = 0, circuit = {}, noCircuit, children, g }) => (
  <Workshop g={g} drawers={<Drawers p={DRAW_P} yaw={0.35} out={open} />}>
    <Scope p={SCOPE_P} yaw={-0.4} t={t} pulses={pulses} />
    {!noCircuit && <Circuit p={CIRC_P} t={t} pulses={pulses} {...circuit} />}
    <Clock p={[-0.15, 1.75, -1.56]} t={t} t0={EV.once9} s={0.6} />
    {children}
  </Workshop>
);
/** The loop shot: Wilson reaching into the parts drawer, the scope ticking; u = t (first shot) or t - END (last). */
const LC: V3 = [-0.25, 0.75, -0.25];
const loopCam = (u: number): CamS => ({ pos: orbit(LC, 18 + 6 * u, 2.35 - 0.22 * u, 1.18 - 0.03 * u), target: [LC[0], LC[1] + 0.02 * u, LC[2]], fov: 40 * FOVK });
const loopScene = (u: number, tFace: number) => {
  const k = u + 100, reach = 0.5 + 0.5 * Math.sin(k * 2.4);
  return (
    <Bench t={tFace} open={1}>
      <Person w={wilson(tFace, { yaw: -0.25, pose: mixPose(work, reachR, 0.55 + 0.45 * reach), expr: live(X.focusR, tFace, 1) })} />
    </Bench>
  );
};

// ---------- the hospital ----------
const BED: V3 = [0, 0, -0.6];
/** A character half-sitting up in bed (tilted back 60 degrees), face toward the room. */
const InBed: React.FC<{ look: Who["look"]; expr: Expr; t: number; drape?: boolean }> = ({ look, expr, drape }) => (
  <>
    <Person w={{ look, pos: [0, 0.385, -0.66], yaw: 0, tilt: [-58, 0], pose: { ...POSES.lie, armL: [16, 30, 20], armR: [16, 30, 20] }, expr }} />
    {drape && <mesh position={[0, 0.6, -0.42]} rotation={[-0.5, 0, 0]} castShadow><boxGeometry args={[0.62, 0.05, 0.6]} /><Mat c="#6aa890" r={0.9} /></mesh>}
  </>
);
const MON_P: V3 = [0.82, 0, -1.25], MACH_P: V3 = [-1.0, 0, -1.05];
const Cord: React.FC<{ a: V3; b: V3 }> = ({ a, b }) => {
  const geo = React.useMemo(() => {
    const m: V3 = [(a[0] + b[0]) / 2, 0.02, (a[2] + b[2]) / 2];
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), new THREE.Vector3(...m), new THREE.Vector3(...b));
    return new THREE.TubeGeometry(c, 30, 0.01, 6, false);
  }, [a.join(), b.join()]);
  return <mesh geometry={geo}><Mat c="#2a2a2a" r={0.5} /></mesh>;
};
const doc = (look: Who["look"], p: V3, t: number, e: Expr, pose?: Pose, seed = 0, o: Partial<Who> = {}) => <Person w={{ look, pos: p, yaw: face(p, [0, 0, 2.5]), pose: pose ?? idlePose(t, POSES.stand, seed), expr: live(e, t, 20 + seed), ...o }} />;

// ---------- the violet stage ----------
const HEART_P: V3 = [0.3, 0.95, -0.4];
const sparkDown = (u: number, stop = 1): V3 => { const v = Math.min(u, stop); return [HEART_P[0] + Math.sin(v * 6) * 0.05, HEART_P[1] + 0.42 - v * 0.85, HEART_P[2] + 0.32]; };
const Wall: React.FC<{ p: V3; k: number }> = ({ p, k }) => (
  <group position={p} scale={k}>
    {[-1, 0, 1].map((i) => <mesh key={i} position={[i * 0.075, 0, 0]} castShadow><boxGeometry args={[0.07, 0.05, 0.06]} /><Mat c="#9a8a9a" r={0.8} /></mesh>)}
    {[-0.5, 0.5].map((i) => <mesh key={i} position={[i * 0.075, 0.052, 0]} castShadow><boxGeometry args={[0.07, 0.05, 0.06]} /><Mat c="#8a7a8a" r={0.8} /></mesh>)}
  </group>
);
const PED: V3 = [-0.3, 0, 0.2];
const Pedestal: React.FC<{ t: number; pulses?: number[] }> = ({ t, pulses = [] }) => (
  <group>
    <mesh position={[PED[0], 0.22, PED[2]]} castShadow receiveShadow><cylinderGeometry args={[0.22, 0.25, 0.44, 24]} /><Mat c="#e8dcff" r={0.5} /></mesh>
    <Circuit p={[PED[0], 0.44, PED[2]]} t={t} pulses={pulses} on={1} yaw={0.5} s={0.9} />
  </group>
);
const WIRE_A: V3 = [PED[0] + 0.12, 0.5, PED[2] - 0.05], WIRE_B: V3 = [HEART_P[0] - 0.35, HEART_P[1] + 0.3, HEART_P[2] + 0.2];
const wireAt = (u: number): V3 => { const m: V3 = [(WIRE_A[0] + WIRE_B[0]) / 2, 0.35, (WIRE_A[2] + WIRE_B[2]) / 2 + 0.2]; const v = 1 - u; return [v * v * WIRE_A[0] + 2 * v * u * m[0] + u * u * WIRE_B[0], v * v * WIRE_A[1] + 2 * v * u * m[1] + u * u * WIRE_B[1], v * v * WIRE_A[2] + 2 * v * u * m[2] + u * u * WIRE_B[2]]; };
const Wire: React.FC = () => {
  const geo = React.useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(Array.from({ length: 12 }, (_, i) => new THREE.Vector3(...wireAt(i / 11)))), 40, 0.012, 6, false), []);
  return <mesh geometry={geo}><Mat c="#2a5aa8" r={0.4} /></mesh>;
};
/** The heart's beat (0..1) for pulses: a quick squeeze after each. */
const beatOf = (t: number, pulses: number[]) => pulses.reduce((a, p) => Math.max(a, t >= p && t < p + 0.3 ? Math.sin(((t - p) / 0.3) * Math.PI) : 0), 0);
/** The last spark sent along the wire for pulses (u along the wire then down the heart). */
const sparkTrip = (t: number, pulses: number[]) => { const last = pulses.filter((p) => p - 0.45 <= t).pop(); return last === undefined ? -1 : (t - (last - 0.45)) / 0.45; };

// ---------- the street ----------
const Crowd: React.FC<{ t: number; n?: number; zs?: number[]; heart?: number }> = ({ t, n = 14, zs = [-1.4, -0.6, 0.4, 1.4], heart = 1 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const z = zs[i % zs.length] + (rnd(i * 3) - 0.5) * 0.3, dir = i % 2 ? 1 : -1, sp = 0.45 + rnd(i) * 0.2;
      const x = ((rnd(i * 7) * 12 + dir * sp * t) % 12 + 12) % 12 - 6;
      const m = MINIS[i % MINIS.length];
      return <MiniFolk key={i} pos={[x, 0, z]} yaw={dir > 0 ? Math.PI / 2 - 0.5 : -Math.PI / 2 + 0.5} {...m} heart={heart} walk={(t * sp) / 0.5 + rnd(i)} scale={0.9 + rnd(i * 5) * 0.2} expr={i % 3 ? X.happy : X.proud} />;
    })}
  </>
);
const ChestHeart: React.FC<{ p: V3; yaw?: number; t: number; seed?: number }> = ({ p, yaw = 0, t, seed = 0 }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <group position={[0.055, 0.6, 0.15]} scale={0.07}><Heart beat={beatOf(t, Array.from({ length: 80 }, (_, i) => i * 0.85 + seed * 0.2))} glow={1} c="#ff5a7a" /></group>
    <pointLight position={[0.06, 0.6, 0.3]} color="#ff6a8a" intensity={0.6} distance={0.8} />
  </group>
);

// ---------- the shots ----------
type Def = Omit<Shot, "t0" | "t1" | "enter" | "id">;
const DEFS: Record<string, Def> = {
  // B1 "In 1956, a man grabbed the wrong part from a box, and his machine started beating like a heart."
  s01_hook: { scene: (t) => loopScene(t, t), cam: (t) => loopCam(t), still: true },
  s02_grab: {
    scene: (t) => {
      const u = seg(t, EV.grabbed - 0.05, EV.grabbed + 0.45);
      return (
        <Bench t={t} open={1}>
          <Person w={wilson(t, { yaw: -0.3, pose: mixPose(reachR, holdUp, out3(seg(t, EV.grabbed + 0.35, EV.wrong))), hold: u > 0.6 ? <Resistor p={[0, -0.04, 0.03]} s={2.4} kind="1M" /> : undefined, expr: live(u > 0.6 ? X.happy : X.focusR, t, 1) })} />
        </Bench>
      );
    },
    cam: mv("s02_grab", C([-0.3, 1.05, 1.1], [-0.3, 0.75, -0.3], 36), C([-0.35, 1.0, 0.9], [-0.3, 0.75, -0.3], 34)),
  },
  s03_wrong: {
    scene: (t) => (
      <Bench t={t} noCircuit>
        <Resistor p={[0.02, 0.86, -0.1]} r={[0.3, t * 0.8, 0.15]} s={7} kind="1M" glow={0.15 + 0.15 * Math.sin(t * 8)} />
        <Person w={wilson(t, { pose: idlePose(t, holdUp, 1), expr: live(X.happy, t, 1) })} />
      </Bench>
    ),
    cam: mv("s03_wrong", C([0.25, 0.95, 1.2], [0, 0.85, -0.2], 34), C([0.1, 0.92, 0.95], [0, 0.86, -0.2], 32)),
  },
  s04_machine: {
    scene: (t) => <Bench t={t} circuit={{ on: 1 }}><Person w={wilson(t, { pose: idlePose(t, work, 1), expr: live(X.watch, t, 1), yaw: 0.35 })} /></Bench>,
    cam: mv("s04_machine", C([0.0, 1.0, 1.35], [0.35, 0.68, -0.05], 36), C([0.05, 0.95, 1.15], [0.38, 0.68, -0.05], 32)),
  },
  s05_heart: {
    scene: (t) => (
      <Bench t={t} circuit={{ on: 1 }}>
        <Person w={wilson(t, { yaw: 0.3, pose: idlePose(t, POSES.stand, 1), expr: live(t > EV.heart1 - 0.1 ? X.wonder : X.watch, t, 1) })} />
      </Bench>
    ),
    cam: mv("s05_heart", C([-0.3, 1.0, 0.95], [0.02, 0.88, -0.55], 32), C([-0.25, 0.98, 0.8], [0.02, 0.88, -0.55], 30)),
  },
  // B2 "His name was Wilson Greatbatch, and he was building a gadget to record heartbeats."
  s06_name: {
    scene: (t) => <Bench t={t}><Person w={wilson(t, { pose: idlePose(t, POSES.wave, 1), expr: live(X.happy, t, 1) })} /></Bench>,
    cam: orb("s06_name", [0, 0.82, -0.55], -14, 10, 1.75, 1.5, 1.05, 1.0, 34),
  },
  s07_build: {
    scene: (t) => (
      <Bench t={t} pulses={[]}>
        <Person w={wilson(t, { pose: idlePose(t, work, 1), hold: <Iron t={t} hot={1} />, expr: live(X.focus, t, 1) })} />
      </Bench>
    ),
    cam: orb("s07_build", [0, 0.6, -0.15], -42, -22, 2.2, 1.9, 1.35, 1.2, 38, 0.65),
  },
  s08_record: {
    scene: (t) => <Bench t={t} pulses={[EV.record + 0.1, EV.record + 0.75, EV.heartbeats + 0.5]}><Person w={wilson(t, { yaw: 0.45, pose: idlePose(t, lean, 1), expr: live(X.proud, t, 1) })} /></Bench>,
    cam: mv("s08_record", C([-0.1, 1.05, 1.5], [0.25, 0.75, -0.2], 36), C([0.0, 1.0, 1.3], [0.3, 0.75, -0.2], 34)),
  },
  // B3 "He reached for a tiny resistor."
  s09_reach: {
    scene: (t) => {
      const u = seg(t, EV.reached, EV.reached + 0.5);
      return <Bench t={t} pulses={[]} open={u}><Person w={wilson(t, { yaw: -0.3, pose: mixPose(work, reachR, out3(u)), expr: live(X.focusR, t, 1) })} /></Bench>;
    },
    cam: mv("s09_reach", C([-1.6, 1.15, 1.35], [-0.45, 0.7, -0.25], 38), C([-1.4, 1.1, 1.15], [-0.45, 0.7, -0.25], 36)),
  },
  s10_tiny: {
    scene: (t) => <Bench t={t} pulses={[]} open={1}><Person w={wilson(t, { yaw: -0.3, pose: reachR, expr: live(X.focusR, t, 1) })} /></Bench>,
    cam: mv("s10_tiny", C([-0.5, 1.0, 0.75], [-0.62, 0.68, 0.0], 26), C([-0.55, 0.95, 0.6], [-0.62, 0.68, 0.02], 22)),
  },
  // B4 "But he grabbed one a hundred times too strong."
  s11_two: {
    scene: (t) => (
      <Bench t={t} pulses={[]} noCircuit>
        {(["10K", "1M"] as const).map((k, i) => (
          <group key={k}>
            <Resistor p={[i ? 0.2 : -0.2, 0.75, 0.05]} r={[0.2, 0.3 * Math.sin(t * 1.5 + i), 0]} s={6.5} kind={k} />
            <mesh position={[i ? 0.2 : -0.2, 0.6, 0.12]}><planeGeometry args={[0.24, 0.07]} /><meshBasicMaterial map={labelTex(k)} /></mesh>
          </group>
        ))}
        <Person w={wilson(t, { pose: idlePose(t, POSES.stand, 1), expr: live(X.happy, t, 1) })} />
      </Bench>
    ),
    cam: mv("s11_two", C([0, 0.95, 1.25], [0, 0.82, 0], 34), C([0, 0.92, 1.0], [0, 0.82, 0], 32)),
  },
  s12_x100: {
    scene: (t) => {
      const g = out3(seg(t, EV.hundred, EV.hundred + 0.5));
      return (
        <Bench t={t} pulses={[]} noCircuit>
          <Resistor p={[-0.32, 0.72, 0.05]} r={[0.2, 0, 0]} s={6.5 * (1 - 0.35 * g)} kind="10K" />
          <Resistor p={[0.12, 0.72 + 0.12 * g, 0.05]} r={[0.2, 0.2 * Math.sin(t * 2), 0]} s={6.5 * (1 + 0.9 * g)} kind="1M" glow={g * (0.5 + 0.3 * Math.sin(t * 12))} />
          <Person w={wilson(t, { pose: idlePose(t, POSES.shrug, 1), expr: live(X.happy, t, 1), pos: [0.05, 0, -0.6] })} />
        </Bench>
      );
    },
    cam: mv("s12_x100", C([0.3, 0.75, 1.15], [0, 0.85, 0], 36), C([0.2, 0.72, 1.3], [0, 0.88, 0], 38)),
  },
  // B5 "He soldered it in, switched it on, and froze."
  s13_solder: {
    scene: (t) => (
      <Bench t={t} pulses={[]} circuit={{ smoke: 1 }}>
        <Person w={wilson(t, { pose: idlePose(t, work, 1), hold: <Iron t={t} hot={1} />, expr: live(X.focus, t, 1) })} />
      </Bench>
    ),
    cam: mv("s13_solder", C([0.3, 0.95, 0.95], [0.0, 0.7, -0.2], 32), C([0.22, 0.92, 0.8], [0.0, 0.7, -0.2], 30)),
  },
  s14_switch: {
    scene: (t) => <Bench t={t} pulses={[]} circuit={{ on: out3(seg(t, EV.on5 - 0.15, EV.on5)) }}><Person w={wilson(t, { pose: idlePose(t, work, 1), expr: live(X.focus, t, 1) })} /></Bench>,
    cam: mv("s14_switch", C([0.45, 0.75, 0.55], [0.18, 0.56, 0.12], 26), C([0.4, 0.72, 0.48], [0.18, 0.56, 0.13], 22)),
  },
  s15_froze: {
    scene: (t) => <Bench t={t} pulses={[]} circuit={{ on: 1 }}><Person w={wilson(t, { pose: { ...POSES.stand, armL: [30, 30, 40], armR: [30, 30, 40], squash: 1.03 }, expr: X.frozen })} /></Bench>,
    cam: mv("s15_froze", C([0, 0.95, 0.9], [0, 0.9, -0.55], 30), C([0, 0.93, 0.55], [0, 0.9, -0.55], 24)),
  },
  // B6 "The circuit went quiet, then pulsed."
  s16_quiet: {
    scene: (t) => <Bench t={t} pulses={[]} circuit={{ on: 1 }}><Person w={wilson(t, { yaw: 0.4, pose: idlePose(t, lean, 1), expr: live(X.watch, t, 1) })} /></Bench>,
    cam: mv("s16_quiet", C([0.1, 1.25, 1.5], [0.2, 0.75, -0.3], 36), C([0.15, 1.2, 1.3], [0.2, 0.75, -0.3], 34)),
  },
  s17_pulsed: {
    scene: (t) => <Bench t={t} circuit={{ on: 1 }}><Person w={wilson(t, { yaw: 0.4, pose: t > EV.pulsed ? jolt : lean, expr: live(t > EV.pulsed ? X.shock : X.watch, t, 1) })} /></Bench>,
    cam: mv("s17_pulsed", C([0.1, 0.85, 1.05], [0.45, 0.72, 0.1], 30), C([0.15, 0.83, 0.9], [0.45, 0.72, 0.1], 28)),
  },
  // B7 "Quiet, pulse."  B8 "Quiet, pulse."
  s18_q1: {
    scene: (t) => <Bench t={t} circuit={{ on: 1 }}><Person w={wilson(t, { yaw: 0.1, pose: idlePose(t, lean, 1), expr: live(pulseGlow(t, PULSES.lab) > 0.2 ? X.wonder : X.watch, t, 1) })} /></Bench>,
    cam: mv("s18_q1", C([-0.15, 1.0, 0.8], [0.0, 0.9, -0.55], 30), C([-0.1, 0.98, 0.68], [0.0, 0.9, -0.55], 28)),
  },
  s19_q2: {
    scene: (t) => <Bench t={t} circuit={{ on: 1 }}><Person w={wilson(t, { yaw: 0.2, pose: idlePose(t, lean, 1), expr: live(X.wonder, t, 1) })} /></Bench>,
    cam: mv("s19_q2", C([-0.3, 0.85, 0.6], [0.12, 0.58, -0.02], 30), C([-0.22, 0.8, 0.5], [0.12, 0.58, -0.02], 26)),
  },
  // B9 "Once every second, just like a heart."
  s20_second: {
    scene: (t) => <Bench t={t} circuit={{ on: 1 }}><Person w={wilson(t, { yaw: 0.5, pose: idlePose(t, POSES.stand, 1), head: undefined, expr: live(X.wonder, t, 1) } as Partial<Who>)} /></Bench>,
    cam: mv("s20_second", C([0.15, 1.25, 1.6], [0.05, 1.2, -1.0], 38), C([0.25, 1.1, 1.3], [0.15, 1.0, -0.6], 36)),
  },
  s21_like: {
    scene: (t) => {
      const k = out3(seg(t, EV.like9 - 0.1, EV.heart9 + 0.1));
      return (
        <Bench t={t} circuit={{ on: 1 }}>
          {k > 0.01 && <Heart p={[0.5, 1.12 + 0.1 * k, 0.05]} s={0.22 * k} beat={beatOf(t, [EV.heart9, EV.heart9 + 0.8])} face={X.happy} />}
          <Person w={wilson(t, { yaw: 0.45, pose: idlePose(t, POSES.stand, 1), expr: live(X.wonder, t, 1) })} />
        </Bench>
      );
    },
    cam: mv("s21_like", C([0.7, 1.0, 1.2], [0.25, 0.9, -0.2], 36), C([0.6, 0.98, 1.0], [0.28, 0.92, -0.2], 34)),
  },
  // B10 "Meanwhile, doctors had patients whose hearts kept slowing down until they stopped."
  s22_meanwhile: {
    scene: (t) => (
      <Hospital fill={[0, 0.9, -0.6]}>
        <Bed p={BED} />
        <InBed look={LOOKS.patient} expr={live(X.tired, t, 5)} t={t} />
        {doc(LOOKS.doc1, [-0.7, 0, -0.35], t, X.worried, undefined, 1)}
        {doc(LOOKS.doc2, [0.7, 0, -0.3], t, X.worried, undefined, 2)}
        <Monitor p={MON_P} t={t} pulses={PULSES.slow} yaw={-0.35} />
      </Hospital>
    ),
    cam: mv("s22_meanwhile", C([0.4, 1.7, 2.6], [0, 0.7, -0.6], 40), C([0.2, 1.5, 2.2], [0, 0.72, -0.6], 40)),
  },
  s23_doctors: {
    scene: (t) => (
      <Hospital fill={[0, 0.9, -0.3]}>
        <Bed p={BED} />
        <InBed look={LOOKS.patient} expr={live(X.tired, t, 5)} t={t} />
        {doc(LOOKS.doc1, [-0.55, 0, -0.1], t, X.worried, POSES.shrug, 1)}
        {doc(LOOKS.doc2, [0.55, 0, -0.05], t, X.scared, { ...POSES.stand, armR: [118, 30, 140], head: [0, 0, 8] }, 2)}
        <Monitor p={MON_P} t={t} pulses={PULSES.slow} yaw={-0.35} />
      </Hospital>
    ),
    cam: orb("s23_doctors", [0, 0.82, -0.2], -12, 8, 1.9, 1.7, 1.05, 1.0, 38),
  },
  s24_slowing: {
    scene: (t) => (
      <Hospital fill={[0.3, 0.9, -0.7]}>
        <Bed p={BED} />
        <InBed look={LOOKS.patient} expr={live(X.sleepy, t, 5)} t={t} />
        <Monitor p={MON_P} t={t} pulses={PULSES.slow} yaw={-0.35} />
      </Hospital>
    ),
    cam: mv("s24_slowing", C([0.55, 1.15, 0.6], [0.55, 0.95, -1.1], 34), C([0.75, 1.15, 0.35], [0.75, 1.0, -1.15], 28)),
  },
  s25_stopped: {
    scene: (t) => (
      <Hospital fill={[0, 0.9, -0.3]}>
        <Bed p={BED} />
        <InBed look={LOOKS.patient} expr={live(X.sleepy, t, 5)} t={t} />
        {doc(LOOKS.doc1, [-0.55, 0, -0.1], t, t > EV.stopped ? X.shock : X.worried, t > EV.stopped ? POSES.headHands : undefined, 1)}
        {doc(LOOKS.nurse, [0.55, 0, -0.05], t, t > EV.stopped ? X.scared : X.worried, t > EV.stopped ? POSES.headHands : undefined, 3)}
        <Monitor p={MON_P} t={t} pulses={PULSES.slow} yaw={-0.35} c={t > EV.stopped ? "#ff6a6a" : "#7dff8a"} />
      </Hospital>
    ),
    cam: mv("s25_stopped", C([0.6, 1.2, 1.9], [0.1, 0.8, -0.5], 38), C([0.4, 1.1, 1.5], [0.1, 0.85, -0.5], 34)),
  },
  // B11 "The only machines that could help were as big as a TV and plugged into the wall."
  s26_machine: {
    scene: (t) => {
      const [t0] = span("s26_machine"), u = out3(seg(t, t0, t0 + 1.2));
      const mp: V3 = [lerp(-2.4, MACH_P[0], u), 0, MACH_P[2] + 0.2 * (1 - u)];
      return (
        <Hospital fill={[-0.8, 0.9, -0.6]}>
          <Bed p={BED} />
          <InBed look={LOOKS.patient} expr={live(X.watch, t, 5)} t={t} />
          <BigMachine p={mp} t={t} yaw={0.35} on={0} />
          <Person w={{ look: LOOKS.nurse, pos: [mp[0] - 0.55, 0, mp[2] + 0.35], yaw: face([mp[0] - 0.55, 0, mp[2] + 0.35], [1.2, 0, 2]), pose: u < 1 ? walkPose((t - t0) * 1.6) : POSES.stand, expr: live(X.happy, t, 3) }} />
        </Hospital>
      );
    },
    cam: mv("s26_machine", C([0.5, 1.4, 2.4], [-0.6, 0.6, -0.8], 40), C([0.2, 1.3, 2.0], [-0.6, 0.62, -0.8], 40)),
  },
  s27_tv: {
    scene: (t) => (
      <Hospital fill={[-0.8, 0.9, -0.6]}>
        <Bed p={BED} />
        <InBed look={LOOKS.patient} expr={live(X.watch, t, 5)} t={t} />
        <BigMachine p={MACH_P} t={t} yaw={0.35} on={1} />
        {doc(LOOKS.doc1, [-0.35, 0, -0.35], t, X.proud, { ...POSES.stand, armR: [60, 40, 30] }, 1)}
      </Hospital>
    ),
    cam: mv("s27_tv", C([-0.2, 0.45, 1.2], [-0.85, 0.6, -1.0], 40), C([-0.35, 0.4, 0.95], [-0.9, 0.65, -1.0], 40)),
  },
  s28_plug: {
    scene: (t) => (
      <Hospital fill={[-1.4, 0.4, -1.4]}>
        <BigMachine p={MACH_P} t={t} yaw={0.35} on={1} />
        <Socket p={[-1.5, 0.35, -1.79]} inn={out3(seg(t, EV.plugged - 0.2, EV.plugged + 0.15))} />
        <Cord a={[-1.5, 0.2, -1.7]} b={[-1.2, 0.25, -1.3]} />
      </Hospital>
    ),
    cam: mv("s28_plug", C([-1.15, 0.55, -0.95], [-1.5, 0.33, -1.78], 34), C([-1.25, 0.5, -1.15], [-1.5, 0.33, -1.78], 30)),
  },
  // B12 "If the power went out, the patient was in serious trouble."
  s29_power: {
    scene: (t) => {
      const fl = t < EV.out - 0.25 ? 1 : t < EV.out ? (Math.sin(t * 70) > 0 ? 1 : 0.2) : 0.1;
      return (
        <Hospital power={fl} fill={[0, 0.9, -0.5]}>
          <Bed p={BED} />
          <InBed look={LOOKS.patient} expr={live(t > EV.out ? X.shock : X.watch, t, 5)} t={t} />
          <BigMachine p={MACH_P} t={t} yaw={0.35} on={fl > 0.5 ? 1 : 0} />
          <Monitor p={MON_P} t={t} pulses={PULSES.machine} yaw={-0.35} dim={fl > 0.5 ? 1 : 0.1} />
          {doc(LOOKS.doc2, [0.6, 0, 0.0], t, t > EV.out ? X.scared : X.watch, undefined, 2)}
        </Hospital>
      );
    },
    cam: mv("s29_power", C([0.2, 1.5, 2.3], [0, 0.75, -0.6], 40), C([0.1, 1.4, 2.0], [0, 0.78, -0.6], 40)),
  },
  s30_trouble: {
    scene: (t) => (
      <Hospital power={0.1} fill={[0, 0.85, -0.45]}>
        <Bed p={BED} />
        <InBed look={LOOKS.patient} expr={live(X.scared, t, 5)} t={t} />
        {doc(LOOKS.nurse, [-0.55, 0, -0.1], t, X.scared, POSES.headHands, 3)}
        {doc(LOOKS.doc1, [0.6, 0, -0.1], t, X.shock, { ...POSES.stand, armR: [30, 80, 40] }, 1, { hold: <pointLight color="#ffd890" intensity={1.2} distance={2} /> })}
      </Hospital>
    ),
    cam: mv("s30_trouble", C([0, 1.25, 1.2], [0, 0.85, -0.55], 34), C([0, 1.2, 0.9], [0, 0.85, -0.6], 30)),
  },
  // B13 "You see, every heartbeat starts with a tiny electrical spark."
  s31_yousee: {
    scene: (t) => <Violet fill={HEART_P}><Heart p={HEART_P} beat={beatOf(t, PULSES.heart)} face={live(X.happy, t, 9)} /></Violet>,
    cam: orb("s31_yousee", HEART_P, -25, 10, 3.0, 2.5, 1.3, 1.15, 38),
  },
  s32_spark: {
    scene: (t) => {
      const u = seg(t, EV.tiny13, EV.spark13 + 0.35);
      return (
        <Violet fill={HEART_P}>
          <Heart p={HEART_P} beat={beatOf(t, [EV.spark13 + 0.35])} face={live(X.happy, t, 9)} glow={beatOf(t, [EV.spark13 + 0.35])} />
          <Spark p={sparkDown(u)} t={t} s={popIn(t, EV.tiny13 - 0.05, 1e9)} />
        </Violet>
      );
    },
    cam: mv("s32_spark", C([0.6, 1.35, 1.7], [0.15, 1.0, -0.2], 36), C([0.4, 1.2, 1.45], [0.15, 0.95, -0.2], 36)),
  },
  // B14 "In those patients, the spark wasn't getting through."
  s33_patients: {
    scene: (t) => (
      <Violet fill={[-0.9, 0.8, 0.4]}>
        <Heart p={HEART_P} c="#c86a7a" face={live(X.tired, t, 9)} />
        <Spark p={sparkDown(0)} t={t} s={0.8} />
        <Person w={{ look: LOOKS.patient, pos: [-0.6, 0, 0.45], yaw: face([-0.6, 0, 0.45], [0, 0, 2.5]), pose: { ...POSES.stand, armR: [20, 60, 110] }, expr: live(X.worried, t, 5) }} />
      </Violet>
    ),
    cam: mv("s33_patients", C([-0.4, 1.2, 2.4], [-0.35, 0.85, -0.1], 38), C([-0.3, 1.15, 2.1], [-0.3, 0.85, -0.1], 38)),
  },
  s34_blocked: {
    scene: (t) => {
      const [t0] = span("s34_blocked"), u = seg(t, t0, t0 + 0.5), stop = 0.42, hit = u >= stop;
      return (
        <Violet fill={HEART_P}>
          <Heart p={HEART_P} c="#c86a7a" face={live(X.sad, t, 9)} />
          <Wall p={sparkDown(0.5)} k={1.6} />
          {!hit || Math.sin(t * 50) > -0.2 ? <Spark p={sparkDown(u, stop)} t={t} s={hit ? 0.6 + 0.3 * Math.sin(t * 30) : 1} c={hit ? "#ff7a4a" : "#ffe25a"} /> : null}
          {hit && <Smoke t={t} p={sparkDown(stop)} s={1.5} />}
        </Violet>
      );
    },
    cam: mv("s34_blocked", C([0.45, 1.25, 2.2], [0.25, 0.9, -0.4], 38), C([0.35, 1.15, 1.9], [0.25, 0.9, -0.4], 36)),
  },
  // B15 "And Wilson's mistake made the exact spark a heart needs, once every second."
  s35_mistake: {
    scene: (t) => (
      <Violet fill={[-0.6, 0.8, 0.4]}>
        <Heart p={HEART_P} c="#c86a7a" face={live(X.watch, t, 9)} />
        <Pedestal t={t} />
        <Person w={{ look: LOOKS.wilson, pos: [-0.72, 0, 0.4], yaw: face([-0.72, 0, 0.4], [0, 0, 2.5]), pose: idlePose(t, { ...POSES.point, armR: [70, 60, 0] }, 1), expr: live(X.proud, t, 1) }} />
      </Violet>
    ),
    cam: mv("s35_mistake", C([-0.2, 1.15, 2.8], [-0.2, 0.8, -0.05], 40), C([-0.25, 1.1, 2.5], [-0.25, 0.8, 0.0], 40)),
  },
  s36_exact: {
    scene: (t) => {
      const ps = [EV.spark15 + 0.2, EV.heart9 > 0 ? EV.needs + 0.15 : 0], tr = sparkTrip(t, ps);
      const b = beatOf(t, ps), heal = out3(seg(t, ps[0], ps[0] + 0.5));
      return (
        <Violet fill={[-0.3, 0.8, 0.3]}>
          <Heart p={HEART_P} c={heal > 0.5 ? "#e8475f" : "#c86a7a"} beat={b} glow={b} face={live(heal > 0.5 ? X.happy : X.watch, t, 9)} />
          <Pedestal t={t} pulses={ps} />
          <Wire />
          {tr >= 0 && tr < 1 && <Spark p={wireAt(tr)} t={t} s={0.8} />}
          <Person w={{ look: LOOKS.wilson, pos: [-0.72, 0, 0.4], yaw: face([-0.72, 0, 0.4], [0, 0, 2.5]), pose: idlePose(t, POSES.stand, 1), expr: live(X.wonder, t, 1) }} />
        </Violet>
      );
    },
    cam: mv("s36_exact", C([-0.1, 1.3, 3.0], [-0.1, 0.8, -0.1], 40), C([0.0, 1.25, 2.7], [-0.05, 0.8, -0.1], 40)),
  },
  s37_once: {
    scene: (t) => {
      const [t0, t1] = span("s37_once"), ps = PULSES.heart.filter((p) => p >= t0 - 0.1), tr = sparkTrip(t, ps), b = beatOf(t, ps);
      const gz = out3(seg(t, t0 + 0.25, t0 + 0.6)), gx = lerp(1.5, 0.82, gz);
      return (
        <Violet fill={[0.2, 0.8, 0.4]}>
          <Heart p={HEART_P} beat={b} glow={b} face={live(X.happy, t, 9)} />
          <Pedestal t={t} pulses={ps} />
          <Wire />
          {tr >= 0 && tr < 1 && <Spark p={wireAt(tr)} t={t} s={0.8} />}
          <Person w={{ look: LOOKS.wilson, pos: [-0.72, 0, 0.4], yaw: face([-0.72, 0, 0.4], [0, 0, 2.5]), pose: cheerPose(t, 1), expr: live(X.laugh, t, 1) }} />
          {/* channel cameo: Gizmo peeks in from the right edge */}
          <GBean look={GIZMO} position={[gx, 0, 0.75]} yaw={face([gx, 0, 0.75], [0, 0, 3.5])} pose={t > t0 + 0.7 ? thumbs : { ...POSES.stand, lean: -10, roll: 10 }} expr={live(t > t0 + 0.7 ? X.proud : X.shock, t, 30)} />
          {void t1}
        </Violet>
      );
    },
    cam: mv("s37_once", C([0.05, 1.25, 3.7], [0.05, 0.8, 0.0], 40), C([0.1, 1.2, 3.4], [0.05, 0.8, 0.0], 40)),
  },
  // B16 "So he shrank it until it fit in the palm of your hand."
  s38_shrank: {
    scene: (t) => {
      const u = io(seg(t, EV.shrank, EV.fit + 0.2));
      return (
        <Bench t={t} noCircuit pulses={[]}>
          {u < 0.92 && <Circuit p={[0.02, BENCH_Y, 0.06]} t={t} s={1 - 0.88 * u} on={1} />}
          {u >= 0.85 && <Pacer p={[0.02, BENCH_Y + 0.03, 0.06]} r={[-1.2, 0, 0]} s={popIn(t, EV.fit) * 1.6} />}
          <Person w={wilson(t, { pose: idlePose(t, lean, 1), expr: live(X.focus, t, 1) })} />
        </Bench>
      );
    },
    cam: mv("s38_shrank", C([0.45, 1.1, 1.3], [0.02, 0.62, -0.05], 36), C([0.35, 1.0, 1.05], [0.02, 0.6, -0.05], 32)),
  },
  s39_palm: {
    scene: (t) => <Bench t={t} noCircuit pulses={[]}><Person w={wilson(t, { pose: idlePose(t, { ...POSES.stand, armR: [25, 92, 55] }, 1), hold: <HeldPacer glow={pulseGlow(t, [EV.palm + 0.2, EV.palm + 1.0])} />, expr: live(X.proud, t, 1) })} /></Bench>,
    cam: mv("s39_palm", C([-0.2, 0.95, 0.95], [-0.06, 0.8, -0.45], 34), C([-0.15, 0.92, 0.8], [-0.06, 0.8, -0.45], 32)),
  },
  // B17 "He quit his job and built them in the barn behind his house."
  s40_quit: {
    scene: (t) => {
      const [t0] = span("s40_quit"), d = (t - t0) * 0.45, p: V3 = [-0.6 + d, 0, 0.9];
      return (
        <BarnOut>
          <Person w={{ look: LOOKS.wilson, pos: p, yaw: 1.1, pose: { ...walkPose(d / 0.5), armR: [135, 10, 30 + 20 * Math.sin(t * 9)] }, expr: live(X.happy, t, 1) }} />
        </BarnOut>
      );
    },
    cam: mv("s40_quit", C([0.6, 1.1, 3.0], [-0.3, 0.7, 0.8], 38), C([0.9, 1.05, 2.8], [0.0, 0.7, 0.8], 38)),
  },
  s41_barn: {
    scene: (t) => (
      <BarnIn>
        {[1.0, 1.4].map((y, j) => (
          <group key={y} position={[0, y, -1.5]}>
            <mesh castShadow><boxGeometry args={[2.0, 0.035, 0.24]} /><Mat c="#8a5a32" r={0.6} /></mesh>
            {Array.from({ length: 12 }, (_, i) => <Pacer key={i} p={[-0.9 + i * 0.165, 0.05, 0.02]} s={1.5} glow={pulseGlow(t, [EV.built + (i + j) * 0.07])} />)}
          </group>
        ))}
        {Array.from({ length: 6 }, (_, i) => <Pacer key={i} p={[-0.5 + i * 0.2, BENCH_Y + 0.01, 0.1]} r={[-Math.PI / 2, 0, 0]} s={1.4} />)}
        <Person w={{ look: LOOKS.wilson, pos: [0.1, 0, -0.55], yaw: 0, pose: idlePose(t, work, 1), hold: <Iron t={t} hot={1} />, expr: live(X.proud, t, 1) }} />
      </BarnIn>
    ),
    cam: orb("s41_barn", [0, 0.9, -0.6], 20, 0, 2.4, 2.1, 1.2, 1.15, 40),
  },
  s42_house: {
    scene: () => <BarnOut />,
    cam: mv("s42_house", C([2.5, 1.4, 4.5], [0, 1.0, -2.6], 44), C([2.0, 2.4, 5.0], [-0.4, 1.0, -2.8], 46)),
  },
  // B18 "In 1960, surgeons placed one inside a seventy-seven-year-old man."
  s43_1960: {
    scene: (t) => (
      <OR fill={[0, 0.9, -0.5]}>
        <Bed p={BED} />
        <InBed look={LOOKS.oldman} expr={live(X.calm, t, 7)} t={t} drape />
        <SurgLamp p={[0, 1.9, -0.6]} />
        {doc(LOOKS.surg1, [-0.62, 0, -0.35], t, X.focus, { ...POSES.stand, armL: [14, 60, 40], armR: [14, 60, 40] }, 1, { headExtra: <SurgCap />, yaw: 0.6 })}
        {doc(LOOKS.surg2, [0.62, 0, -0.3], t, X.watch, undefined, 2, { headExtra: <SurgCap />, yaw: -0.6 })}
        <Monitor p={MON_P} t={t} pulses={PULSES.steady} yaw={-0.35} />
      </OR>
    ),
    cam: mv("s43_1960", C([0.3, 1.8, 2.4], [0, 0.75, -0.6], 40), C([0.1, 1.6, 2.0], [0, 0.78, -0.6], 40)),
  },
  s45_placed: {
    scene: (t) => {
      const u = out3(seg(t, EV.placed, EV.inside + 0.3));
      return (
        <OR fill={[0, 0.9, -0.4]}>
          <Bed p={BED} />
          <InBed look={LOOKS.oldman} expr={live(X.calm, t, 7)} t={t} drape />
          <Pacer p={[0.02, lerp(1.0, 0.72, u), lerp(-0.25, -0.38, u)]} r={[-0.9, 0, 0]} s={2.2} glow={u > 0.95 ? 1 : 0} />
          {doc(LOOKS.surg1, [-0.5, 0, -0.2], t, X.focus, { ...POSES.stand, armR: [40, 80, 30] }, 1, { headExtra: <SurgCap />, yaw: 0.9 })}
        </OR>
      );
    },
    cam: mv("s45_placed", C([0.4, 1.45, 0.6], [0.0, 0.78, -0.5], 34), C([0.35, 1.4, 0.5], [0.0, 0.78, -0.5], 32)),
  },
  s46_man: {
    scene: (t) => (
      <OR fill={[0, 0.9, -0.6]}>
        <Bed p={BED} />
        <InBed look={LOOKS.oldman} expr={live(X.calm, t, 7)} t={t} drape />
        <Monitor p={MON_P} t={t} pulses={PULSES.steady} yaw={-0.35} />
      </OR>
    ),
    cam: mv("s46_man", C([0.3, 1.75, 0.45], [0.0, 0.85, -0.85], 32), C([0.25, 1.7, 0.3], [0.0, 0.85, -0.85], 28)),
  },
  // B19 "His heart beat steady again."
  s47_steady: {
    scene: (t) => (
      <OR fill={[0.2, 0.9, -0.6]}>
        <Bed p={BED} />
        <InBed look={LOOKS.oldman} expr={live(t > EV.steady ? X.happy : X.calm, t, 7)} t={t} drape />
        <Monitor p={MON_P} t={t} pulses={PULSES.steady} yaw={-0.35} />
        {doc(LOOKS.surg2, [-0.6, 0, -0.2], t, X.laugh, cheerPose(t, 2), 2, { headExtra: <SurgCap /> })}
      </OR>
    ),
    cam: mv("s47_steady", C([0.9, 1.75, 1.3], [0.3, 0.85, -0.8], 38), C([0.75, 1.7, 1.1], [0.3, 0.85, -0.8], 36)),
  },
  // B20 "Today, millions of people walk around with one in their chest."
  s48_today: {
    scene: (t) => <Street><Crowd t={t} n={20} /></Street>,
    cam: mv("s48_today", C([0, 2.4, 6.0], [0, 0.6, -0.5], 44), C([0, 2.0, 5.2], [0, 0.6, -0.5], 44)),
  },
  s49_walk: {
    scene: (t) => {
      const [t0] = span("s49_walk"), d = (t - t0) * 0.5, p: V3 = [0, 0, -0.4 + d];
      return (
        <Street fill={p}>
          <Crowd t={t} n={10} zs={[-1.6, -1.2]} />
          <Person w={{ look: LOOKS.oldmanOut, pos: p, yaw: 0, pose: walkPose(d / 0.52), expr: live(X.happy, t, 7) }} />
          <ChestHeart p={p} t={t} />
        </Street>
      );
    },
    cam: (t) => { const [t0] = span("s49_walk"), d = (t - t0) * 0.5; return C([0.35, 0.95, 1.6 + d], [0, 0.75, -0.4 + d], 36); },
  },
  s50_chest: {
    scene: (t) => (
      <Street fill={[0, 0.8, 0]}>
        <Crowd t={t} n={8} zs={[-1.7]} />
        {([[LOOKS.teen, [-0.55, 0, 0.1]], [LOOKS.gran, [0.0, 0, 0.25]], [LOOKS.mum, [0.55, 0, 0.1]]] as const).map(([lk, p], i) => {
          const pp = p as unknown as V3, y = face(pp, [0, 0, 3]);
          return <React.Fragment key={i}><Person w={{ look: lk, pos: pp, yaw: y, pose: i === 1 ? idlePose(t, POSES.wave, i) : idlePose(t, POSES.stand, i), expr: live(i === 1 ? X.proud : X.happy, t, 40 + i) }} /><ChestHeart p={pp} yaw={y} t={t} seed={i} /></React.Fragment>;
        })}
      </Street>
    ),
    cam: mv("s50_chest", C([0, 0.85, 2.1], [0, 0.7, 0.1], 38), C([0, 0.8, 1.75], [0, 0.68, 0.1], 36)),
  },
  // B21 "All because of one wrong part from one box."
  s51_part: {
    scene: (t) => (
      <Bench t={t} noCircuit pulses={[]}>
        <Resistor p={[0.0, 0.75, 0.05]} r={[0.2, t * 0.6, 0.1]} s={6} kind="1M" glow={0.3 + 0.2 * Math.sin(t * 5)} />
        <Person w={wilson(t, { pose: idlePose(t, POSES.stand, 1), expr: live(X.proud, t, 1) })} />
      </Bench>
    ),
    cam: mv("s51_part", C([0.0, 0.9, 1.3], [0, 0.82, -0.1], 34), C([0.0, 0.86, 1.0], [0, 0.8, -0.1], 30)),
  },
  s52_box: {
    scene: (t) => <Bench t={t} open={0.6}><Person w={wilson(t, { yaw: -0.4, pose: idlePose(t, { ...POSES.stand, armR: [40, 70, 20] }, 1), expr: live(X.sly, t, 1) })} /></Bench>,
    cam: mv("s52_box", C([-1.2, 1.05, 1.2], [-0.35, 0.78, -0.3], 38), C([-1.05, 1.0, 1.0], [-0.35, 0.78, -0.3], 36)),
  },
  // B22 "And it all began when..."
  s53_loop: { scene: (t) => loopScene(t - END, t), cam: (t) => loopCam(t - END), still: true },
};

export const SHOTS: Shot[] = CUTS.map(([id, t0, enter], i) => {
  const d = DEFS[id];
  if (!d) throw new Error("no shot def " + id);
  return { id, t0, t1: i + 1 < CUTS.length ? CUTS[i + 1][1] : END, enter, ...d };
});
void c01; void PE; void P; void Spark;

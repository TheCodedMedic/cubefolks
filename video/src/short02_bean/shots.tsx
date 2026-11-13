// Short 2 "The City That Paid for Rat Tails" (Beanfolk 3D): the 54 set-ups. Every time comes from timing.ts (measured
// words). Every set sits at the origin; a shot renders one set. Faces are always turned toward the camera (face()).
import React from "react";
import { CamS, io, lerp, orbit, out3, seg, Shot, V3, c01, popIn } from "../kit/core";
import { project } from "../kit/Pop";
import { EXPR, Expr, exprAt, liveFace } from "../bean/Face";
import { idlePose, mixPose, Pose, POSES, walkPose } from "./Bean";
import { Basket, Bowl, Chalk, Clipboard, Coin, CoinStack, FURS, HeldBowl, HeldTail, LOOKS, LooseTail, MINIS, MiniFolk, Net, Notice, noticeTex, Person, Rat, RatS, Scissors, TailHeap, Who } from "./cast";
import { Bathroom, Classroom, Farm, Lantern, Office, Sewer, Stage, Street, TailCrate, tailsTex } from "./sets";
import { at, DROPS, END, EV, loopAngle, LOOP_T0, P, PE, PS, span, CUTS } from "./timing";
import { CoinBurst, GraphUp, Hearts, StationLabel, TailCounter } from "./overlays";

const D = Math.PI / 180;
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mod = (a: number, b: number) => ((a % b) + b) % b;
/** The yaw that turns a character at p to face the point c. */
const face = (p: V3, c: V3) => Math.atan2(c[0] - p[0], c[2] - p[2]);

// ---------- expressions ----------
const X: Record<string, Expr> = {
  ...EXPR,
  proud: { eyes: "happy", brows: "raised", mouth: "smile", extras: ["sparkles"] } as Expr,
  greedy: { eyes: "smug", brows: "raised", mouth: "grin", extras: ["sparkles"] } as Expr,
  talk: { eyes: "open", brows: "raised", mouth: "smile" } as Expr,
  watch: { eyes: "open", brows: "raised", mouth: "small", look: [0, 0.2] } as Expr,
  sly: { eyes: "smug", brows: "oneUp", mouth: "smirk", look: [0.6, 0.1] } as Expr,
  sheepish: { eyes: "happy", brows: "worried", mouth: "grin", extras: ["sweat", "blush"] } as Expr,
  scared: { eyes: "wide", brows: "worried", mouth: "wobbly", extras: ["sweat"] } as Expr,
  think: { eyes: "open", brows: "worried", mouth: "pout", look: [-0.5, -0.6] } as Expr,
  lookBack: { eyes: "open", brows: "worried", mouth: "wobbly", extras: ["sweat"], look: [-0.8, 0.3] } as Expr,
  hush: { eyes: "smug", brows: "worried", mouth: "pout", extras: ["sweat"], look: [0.6, 0] } as Expr,
  dazzled: { eyes: "wide", brows: "raised", mouth: "grin", extras: ["sparkles"] } as Expr,
};
const live = (e: Expr, t: number, seed: number, talk?: [number, number][]) => liveFace(e, t, { seed, talk });
const RE = [X.happy, X.smug, X.silly, X.laugh, X.sly];

// ---------- poses ----------
const showR: Pose = { ...POSES.stand, armR: [30, 70, 55] };
const sideUp: Pose = { ...POSES.stand, armR: [100, 30, 15] };
const showUp: Pose = { ...POSES.stand, armR: [40, 95, 25], head: [-6, 0, 0] };
const carryBoth: Pose = { ...POSES.stand, armL: [14, 62, 70], armR: [14, 62, 70] };
const cheerPose = (t: number, seed: number): Pose => mixPose(POSES.cheer, POSES.stand, 0.5 + 0.5 * Math.sin(t * 9 + seed * 2));
const clapPose = (t: number, seed: number): Pose => { const c = Math.abs(Math.sin(t * 10 + seed)); return { ...POSES.stand, armL: [20, 70, 40 + 30 * c], armR: [20, 70, 40 + 30 * c] }; };
const thinkPose: Pose = { ...POSES.stand, armR: [118, 30, 140], head: [0, 0, 8] };
const crossArms: Pose = { ...POSES.stand, armL: [12, 60, 120], armR: [12, 62, 118] };
const tiptoe = (t: number): Pose => { const w = walkPose(t * 1.3, 0.6); return { ...w, lean: -4, armL: [30, 10, 100], armR: [70, 60, 120], head: [0, 20, 0] }; };

// ---------- rats ----------
type SwarmO = { tailless?: number; speed?: number; scale?: number; y?: number; dir?: "x" | "z" | "any"; exprs?: Expr[]; from?: number; popAt?: number; popEvery?: number };
/** n rats scurrying in a box [x0, x1] x [z0, z1], wrapping at the edges (keep the box wider than the frame). */
const Swarm: React.FC<{ t: number; n: number; seed?: number; box: [number, number, number, number]; o?: SwarmO }> = ({ t, n, seed = 0, box, o = {} }) => {
  const [x0, x1, z0, z1] = box, W = x1 - x0, L = z1 - z0;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const r1 = rnd(i * 3 + seed), r2 = rnd(i * 7 + seed), r3 = rnd(i * 11 + seed), r4 = rnd(i * 13 + seed);
        const dir = o.dir ?? "x";
        let a = dir === "x" ? (r1 > 0.5 ? 90 : -90) + (r2 - 0.5) * 50 : dir === "z" ? (r1 > 0.5 ? 0 : 180) + (r2 - 0.5) * 40 : r1 * 360;
        a *= D;
        const sp = (o.speed ?? 1.1) * (0.75 + r3 * 0.5);
        const x = x0 + mod(r2 * W + Math.sin(a) * sp * t, W), z = z0 + mod(r4 * L + Math.cos(a) * sp * t, L);
        const pop = o.popAt !== undefined ? popIn(t, o.popAt + (o.popEvery ?? 0.04) * i, 1e9) : 1;
        if (pop <= 0.01) return null;
        const tailless = r4 < (o.tailless ?? 0);
        return <Rat key={i} position={[x, o.y ?? 0, z]} yaw={a} scale={(o.scale ?? 0.6) * (0.85 + r1 * 0.3) * pop}
          s={{ run: t * sp / 0.32 + r3, t: t + i, fur: FURS[i % FURS.length], tail: !tailless, expr: (o.exprs ?? RE)[i % (o.exprs ?? RE).length] }} />;
      })}
    </>
  );
};
/** One rat at p facing yaw, with a live face. */
const R1 = (t: number, p: V3, yaw: number, s: RatS, scale = 0.7, seed = 0) => (
  <Rat position={p} yaw={yaw} scale={scale} s={{ t: t + seed, ...s, expr: s.expr ? live(s.expr, t, 40 + seed) : undefined }} />
);

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

// ---------- the street scenes ----------
const TABLE: V3 = [0, 0, -1.75];
const CHIEF_P: V3 = [-0.62, 0, -1.75], HUNT_P: V3 = [0.62, 0, -1.65];
const BountyTable: React.FC<{ coins?: number }> = ({ coins = 6 }) => (
  <group position={TABLE}>
    <mesh position={[0, 0.7, 0]} castShadow receiveShadow><boxGeometry args={[0.8, 0.05, 0.55]} /><meshStandardMaterial color="#7a4a2a" roughness={0.6} /></mesh>
    {[[-0.35, -0.22], [0.35, -0.22], [-0.35, 0.22], [0.35, 0.22]].map(([x, z], i) => <mesh key={i} position={[x, 0.35, z]} castShadow><boxGeometry args={[0.05, 0.7, 0.05]} /><meshStandardMaterial color="#5a3420" /></mesh>)}
    <CoinStack p={[-0.2, 0.725, 0.05]} n={coins} />
    <CoinStack p={[-0.08, 0.725, -0.1]} n={Math.max(1, coins - 3)} />
    <TailCrate p={[0.22, 0.725, -0.02]} s={0.4} />
  </group>
);
/** Townsfolk in the background of the street (low detail, on the sidewalks). */
const Folk: React.FC<{ t: number; mood?: "watch" | "shock" | "happy"; at?: number }> = ({ t, mood = "watch", at: z0 = -4 }) => (
  <>
    {MINIS.slice(0, 7).map((m, i) => {
      const side = i % 2 ? 1 : -1, p: V3 = [side * (2.6 + rnd(i) * 0.9), 0, z0 - i * 1.1];
      return <MiniFolk key={i} pos={p} yaw={face(p, [0, 0, 3])} {...m} expr={mood === "shock" ? X.shock : mood === "happy" ? X.happy : X.watch} arms={mood === "shock" ? 0.6 + 0.2 * Math.sin(t * 8 + i) : 0} />;
    })}
  </>
);
const chiefW = (t: number, o: Partial<Who> = {}): Who => ({ look: LOOKS.chief, pos: CHIEF_P, yaw: 1.05, pose: idlePose(t, POSES.stand, 1), expr: live(X.happy, t, 3), ...o });

/** The loop: one continuous orbit-and-push through the last shot and on into the first (u = t - END there, u = t here). */
const LC: V3 = [0, 0.85, -1.6];
const loopCam = (u: number): CamS => ({ pos: orbit(LC, 16 + 7 * u, 4.5 - 0.35 * u, 1.75 - 0.08 * u), target: [LC[0], LC[1] + 0.05 * u, LC[2]], fov: 46 });
const loopScene = (u: number, tFace: number) => {
  const k = u + 100;
  const give = c01(Math.sin(k * 2.2) * 0.5 + 0.5);
  return (
    <Street>
      <BountyTable />
      <Person w={chiefW(tFace, { pose: mixPose(POSES.stand, showR, give), hold: <Coin p={[0, -0.05, 0.03]} r={[Math.PI / 2, 0, 0]} s={1.3} />, expr: live(X.greedy, tFace, 3) })} />
      <Person w={{ look: LOOKS.hunter1, pos: HUNT_P, yaw: -1.05, pose: mixPose(POSES.stand, showR, 1 - give), hold: <HeldTail />, expr: live(X.happy, tFace, 5) }} />
      <Person w={{ look: LOOKS.hunter2, pos: [1.35, 0, -1.0], yaw: face([1.35, 0, -1.0], [0, 0, 2]), pose: idlePose(k, POSES.stand, 2), hold: <Basket />, expr: live(X.smug, tFace, 6) }} />
      <Swarm t={k} n={14} seed={3} box={[-5, 5, -0.6, 1.4]} o={{ scale: 0.5 }} />
      <Folk t={k} at={-3.5} />
    </Street>
  );
};

// ---------- the office ----------
const DESK_Z = -0.7;
const officials = (t: number, o: { mood?: "talk" | "cheer" | "count" | "shock" | "neutral"; skipChief?: boolean } = {}) => {
  const m = o.mood ?? "neutral";
  const pose = (s: number) => (m === "cheer" ? cheerPose(t, s) : m === "shock" ? POSES.headHands : idlePose(t, POSES.stand, s));
  const ex = (s: number) => live(m === "cheer" ? (s % 2 ? X.laugh : X.greedy) : m === "shock" ? X.shock : X.talk, t, 20 + s);
  return (
    <>
      {!o.skipChief && <Person w={{ look: LOOKS.chief, pos: [0.0, 0, -1.35], yaw: 0, pose: pose(1), expr: ex(1) }} />}
      <Person w={{ look: LOOKS.clerk, pos: [-0.75, 0, -1.3], yaw: 0.2, pose: pose(2), expr: ex(2) }} />
      <Person w={{ look: LOOKS.deputy, pos: [0.75, 0, -1.3], yaw: -0.2, pose: pose(3), expr: ex(3) }} />
    </>
  );
};
/** A heap of tails on the desk growing with t (0..1). */
const DeskHeap: React.FC<{ g: number; p?: V3 }> = ({ g, p = [0.35, 0.56, DESK_Z] }) => (
  <group position={p}>
    <mesh position={[0, 0, 0]} scale={[0.45 * (0.4 + g), 0.22 * g + 0.01, 0.32 * (0.4 + g)]}><sphereGeometry args={[1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial map={tailsTex()} roughness={0.6} /></mesh>
    <TailHeap n={Math.round(6 + 14 * g)} w={0.6 * (0.4 + g)} d={0.4 * (0.4 + g)} h={0.2 * g} seed={4} />
  </group>
);
/** Tails falling from a basket at height onto the desk at each drop time. */
const Falling: React.FC<{ t: number; drops: number[]; from: V3; to: V3 }> = ({ t, drops, from, to }) => (
  <>
    {drops.map((d, i) => {
      const u = seg(t, d - 0.35, d);
      if (t < d - 0.35 || t > d + 0.05) return null;
      return <LooseTail key={i} k={i} p={[lerp(from[0], to[0], u), lerp(from[1], to[1], u * u), lerp(from[2], to[2], u)]} r={[u * 3 + i, i, u * 2]} />;
    })}
  </>
);

// ---------- the loop turntable ----------
const TT_R = 2.0;
const STATIONS = [
  { text: "CATCH", color: "#8ad0ff" }, { text: "SNIP", color: "#ff9a8a" }, { text: "RELEASE", color: "#9ae08a" },
  { text: "BABIES", color: "#ffd0e8" }, { text: "NEW TAILS", color: "#ffd84a" }, { text: "CENTS", color: "#f2b632" },
];
const stA = (k: number, t: number) => k * 60 + loopAngle(t); // a station's world angle (deg)
const stPos = (k: number, t: number, r = TT_R, y = 0): V3 => [Math.sin(stA(k, t) * D) * r, y, Math.cos(stA(k, t) * D) * r];
const Station: React.FC<{ k: number; t: number }> = ({ k, t }) => {
  const sn = c01((t - EV.snipped) / 0.15);
  switch (k) {
    case 0: return (<>
      <Person w={{ look: LOOKS.hunter1, pos: [-0.35, 0, -0.1], yaw: 0.5, pose: { ...POSES.stand, armR: [40, 80, 30] }, hold: <Net />, expr: live(X.greedy, t, 61) }} />
      {R1(t, [0.25, 0, 0.25], -0.3, { expr: X.scared, arms: "up" }, 0.55, 1)}
    </>);
    case 1: return (<>
      <Person w={{ look: LOOKS.hunter2, pos: [-0.35, 0, -0.1], yaw: 0.6, pose: { ...POSES.stand, armR: [30, 80, 40] }, hold: <Scissors open={0.5 + 0.5 * Math.cos(t * 18)} />, expr: live(X.sly, t, 62) }} />
      {R1(t, [0.25, 0, 0.25], -0.6, { expr: X.shock, tail: false }, 0.55, 2)}
      <LooseTail p={[0.55, 0, 0.0]} r={[0, 2.2, 0]} k={1} />
    </>);
    case 2: return (<>{R1(t, [0.1, 0, 0.15], 0.9, { expr: X.happy, tail: false, run: t * 3, arms: "wave" }, 0.6, 3)}<Person w={{ look: LOOKS.hunter3, pos: [-0.45, 0, -0.55], yaw: 0.4, pose: POSES.wave, expr: live(X.happy, t, 64) }} /></>);
    case 3: return (<>
      {R1(t, [0, 0, 0], 0, { expr: X.proud, tail: false }, 0.65, 4)}
      {[[-0.4, 0.2], [-0.2, 0.42], [0.2, 0.42], [0.4, 0.2]].map(([x, z], i) => <React.Fragment key={i}>{R1(t, [x, 0, z], (x > 0 ? -0.3 : 0.3), { expr: RE[i], tailGrow: 0.2, arms: i % 2 ? "up" : "down" }, 0.32, 10 + i)}</React.Fragment>)}
    </>);
    case 4: return (<>{[-0.3, 0.3].map((x, i) => <React.Fragment key={i}>{R1(t, [x, 0, 0.1], -x, { expr: X.proud, arms: "up", wag: Math.sin(t * 6 + i) }, 0.55, 20 + i)}</React.Fragment>)}</>);
    case 5: return (<>
      <Person w={{ look: LOOKS.hunter3, pos: [-0.2, 0, -0.1], yaw: 0.3, pose: { ...POSES.stand, armR: [20, 40, 60] }, hold: <Basket />, expr: live(X.greedy, t, 63) }} />
      <CoinStack p={[0.45, 0, 0.2]} n={14} /><CoinStack p={[0.6, 0, 0.0]} n={9} />
    </>);
  }
  void sn;
  return null;
};
const Arrow3: React.FC<{ a0: number; a1: number }> = ({ a0, a1 }) => {
  const am = (a1 * D), tip: V3 = [Math.sin(am) * TT_R, 0.1, Math.cos(am) * TT_R];
  return (
    <>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, (a0 - 90) * D]}><torusGeometry args={[TT_R, 0.04, 8, 24, (a1 - a0) * D]} /><meshStandardMaterial color="#ffd84a" emissive="#c89a20" emissiveIntensity={0.4} /></mesh>
      <mesh position={tip} rotation={[0, am + Math.PI / 2, -Math.PI / 2]}><coneGeometry args={[0.1, 0.22, 12]} /><meshStandardMaterial color="#ffd84a" emissive="#c89a20" emissiveIntensity={0.4} /></mesh>
    </>
  );
};
const Turntable: React.FC<{ t: number }> = ({ t }) => (
  <group rotation={[0, loopAngle(t) * D, 0]}>
    <mesh position={[0, 0.03, 0]} receiveShadow><cylinderGeometry args={[2.9, 2.95, 0.06, 64]} /><meshStandardMaterial color="#7a5ac8" roughness={0.6} /></mesh>
    <mesh position={[0, 0.065, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.0, 1.08, 64]} /><meshStandardMaterial color="#c9a8ff" emissive="#8a60ff" emissiveIntensity={0.5} /></mesh>
    {[0, 1, 2, 3, 4, 5].map((k) => <Arrow3 key={"a" + k} a0={k * 60 + 18} a1={k * 60 + 42} />)}
    {[0, 1, 2, 3, 4, 5].map((k) => (
      <group key={k} position={[Math.sin(k * 60 * D) * TT_R, 0.06, Math.cos(k * 60 * D) * TT_R]} rotation={[0, k * 60 * D, 0]}>
        <Station k={k} t={t} />
      </group>
    ))}
    {/* the big coin in the middle, standing and spinning */}
    <group position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, t * 2]}><Coin s={5.5} /></group>
  </group>
);
/** Labels for the stations that face the camera. */
const Labels: React.FC<{ t: number; cam: CamS; t0?: number; only?: number[] }> = ({ t, cam, t0 = LOOP_T0, only }) => (
  <>
    {STATIONS.map((s, k) => {
      if (only && !only.includes(k)) return null;
      const p = stPos(k, t, TT_R, 1.45), [x, y] = project(cam, p);
      const dx = cam.pos[0] - p[0], dz = cam.pos[2] - p[2], out = [Math.sin(stA(k, t) * D), Math.cos(stA(k, t) * D)];
      const facing = (dx * out[0] + dz * out[1]) / Math.hypot(dx, dz);
      const on = c01((facing + 0.1) / 0.4) * (x > 0.12 && x < 0.88 && y > 0.05 && y < 0.56 ? 1 : 0);
      return <StationLabel key={k} t={t} t0={t0 + k * 0.05} x={x} y={y} n={k + 1} text={s.text} color={s.color} on={on} />;
    })}
  </>
);
/** A camera looking at station k from outside the turntable (follows it as it turns). */
const stCam = (k: number, t: number, da: number, r: number, y: number, ty = 0.55, fov = 40): CamS => {
  const a = stA(k, t) + da, s = stPos(k, t);
  return C([Math.sin(a * D) * r, y, Math.cos(a * D) * r], [s[0], ty, s[2]], fov);
};

// ---------- the barn ----------
const BARN_RATS = (t: number, n = 16, seed = 5) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const x = -1.9 + (i % 8) * 0.54 + rnd(i) * 0.1, z = -3.0 + Math.floor(i / 8) * 0.8 + rnd(i * 3) * 0.15;
      const eat = i % 3 === 0;
      return <React.Fragment key={i}>{R1(t, [x, 0, z], face([x, 0, z], [0, 0, 3]) + (rnd(i * 5) - 0.5) * 0.6, { expr: eat ? X.happy : RE[i % 5], arms: eat ? "eat" : "down", bow: i % 4 === 1 ? "#e8508a" : undefined, fur: FURS[i % 5], hop: Math.max(0, Math.sin(t * 6 + i)) * 0.04 }, 0.5, 70 + i + seed)}</React.Fragment>;
    })}
  </>
);

// ---------- the shots ----------
type Def = Omit<Shot, "t0" | "t1" | "enter" | "id">;
const DEFS: Record<string, Def> = {
  // B1 "In 1902, a city paid people to kill rats, and ended up with more rats than ever."
  s01_hook: { scene: (t) => loopScene(t, t), cam: (t) => loopCam(t), still: true },
  s02_paid: {
    scene: (t) => {
      const u = seg(t, EV.paid, EV.paid + 0.5);
      return (
        <Street>
          <BountyTable />
          <Person w={chiefW(t, { pose: mixPose(POSES.stand, showR, u), hold: <Coin p={[0, -0.05, 0.03]} r={[Math.PI / 2, 0, 0]} s={1.4} />, expr: live(X.greedy, t, 3) })} />
          <Person w={{ look: LOOKS.hunter1, pos: HUNT_P, yaw: -1.05, pose: mixPose(showR, POSES.cheer, seg(t, EV.paid + 0.5, EV.paid + 0.7)), hold: t < EV.paid + 0.5 ? <HeldTail /> : undefined, expr: live(t > EV.paid + 0.5 ? X.laugh : X.happy, t, 5) }} />
          <Folk t={t} at={-3.8} />
        </Street>
      );
    },
    cam: mv("s02_paid", C([0.1, 1.3, 1.5], [0, 0.95, -1.7], 38), C([0.05, 1.25, 1.05], [0, 0.95, -1.7], 36)),
  },
  s03_kill: {
    scene: (t) => {
      const [t0] = span("s03_kill"), d = (t - t0) * 1.4;
      return (
        <Street>
          {R1(t, [0.2, 0, -2.6 + d], 0, { expr: X.scared, run: d / 0.3, arms: "up" }, 0.75, 1)}
          <Person w={{ look: LOOKS.hunter2, pos: [-0.25, 0, -3.8 + d], yaw: 0.1, pose: { ...walkPose(d / 0.6, 1.2), armR: [40, 120, 20] }, hold: <Net />, expr: live(X.greedy, t, 7) }} />
          <Folk t={t} at={-5} />
        </Street>
      );
    },
    cam: mv("s03_kill", C([0.9, 0.7, 0.6], [0.0, 0.6, -2.4], 40), C([0.8, 0.75, 0.9], [0.0, 0.6, -1.6], 40)),
  },
  s04_more: {
    scene: (t) => (
      <Street>
        <TailCrate p={[0, 0, -1.5]} s={1} label="" fill={0} />
        <Person w={{ look: LOOKS.chief, pos: [0, 0.42, -1.5], yaw: 0, pose: t > EV.more1 ? POSES.headHands : POSES.stand, expr: live(t > EV.more1 ? X.shock : X.worried, t, 3) }} />
        <Swarm t={t} n={46} seed={9} box={[-4.5, 4.5, -4.5, 1.5]} o={{ scale: 0.55, popAt: span("s04_more")[0], popEvery: 0.025 }} />
      </Street>
    ),
    cam: mv("s04_more", C([0, 1.5, 1.4], [0, 0.9, -1.5], 42), C([0, 3.4, 3.6], [0, 0.6, -1.6], 44)),
  },
  // B2 "The city was Hanoi, and its shiny new sewers had become a highway for rats."
  s05_hanoi: {
    scene: (t) => (
      <Street>
        <Folk t={t} at={-2} />
        {[0, 1, 2].map((i) => { const z = -6 + ((t * 0.9 + i * 2.5) % 7); return <MiniFolk key={i} pos={[(i - 1) * 0.9, 0, z]} yaw={0} body={MINIS[i + 2].body} skin={MINIS[i + 2].skin} hat={i === 1 ? "conical" : null} />; })}
        <Swarm t={t} n={6} seed={2} box={[-4, 4, -2, 2]} o={{ scale: 0.45 }} />
      </Street>
    ),
    cam: mv("s05_hanoi", C([0.6, 5.5, 6], [0, 3.2, -14], 50), C([0.4, 1.7, 4.2], [0, 2.6, -14], 48)),
  },
  s06_sewers: {
    scene: (t) => {
      const up = out3(seg(t, EV.sewers - 0.1, EV.sewers + 0.35));
      return (
        <Street grate={0.5 + 0.5 * Math.sin(t * 9)}>
          {up > 0 && R1(t, [0, -0.45 + 0.45 * up, -0.05], 0, { expr: t > EV.sewers + 0.3 ? X.sly : X.watch, arms: "down" }, 0.55, 3)}
          <Folk t={t} at={-3.5} />
        </Street>
      );
    },
    cam: mv("s06_sewers", C([0.15, 0.85, 1.6], [0, 0.15, 0], 38), C([0.35, 0.6, 1.25], [0, 0.22, 0], 36)),
    dom: (t, cam) => { const [x, y] = project(cam, [0.2, 0.05, 0.1]); const k = Math.sin(seg(t, EV.shiny, EV.shiny + 0.6) * Math.PI); return k > 0 ? <div style={{ position: "absolute", left: x * 1080, top: y * 1920, transform: `translate(-50%,-50%) scale(${k}) rotate(${t * 90}deg)`, fontSize: 200, color: "#fff7c0", textShadow: "0 0 30px #ffe680" }}>✦</div> : null; },
  },
  s07_highway: {
    scene: (t) => (
      <Sewer>
        {[-1, 1].map((s) => Array.from({ length: 7 }, (_, i) => {
          const z = -14 + mod(t * 2.2 + i * 2.1 + (s > 0 ? 1 : 0), 15);
          return <React.Fragment key={s + "" + i}>{R1(t, [s * 0.95, 0.2, z], 0, { expr: RE[i % 5], run: t * 6 + i, fur: FURS[i % 5] }, 0.55, i + (s > 0 ? 10 : 0))}</React.Fragment>;
        }))}
      </Sewer>
    ),
    cam: mv("s07_highway", C([0.2, 0.75, 3.0], [0, 0.4, -4], 46), C([-0.2, 0.9, 2.2], [0, 0.45, -4], 44)),
  },
  // B3 "Rats popped out of toilets in the fanciest homes in town."
  s08_toilet: {
    scene: (t) => {
      const pop = out3(seg(t, EV.popped - 0.05, EV.popped + 0.25)), lid = out3(seg(t, EV.popped - 0.12, EV.popped + 0.1));
      return (
        <Bathroom lid={lid} bubble={t < EV.popped ? 1 : 0} t={t}>
          {pop > 0 && R1(t, [0, 0.0 + 0.32 * pop, -1.58], 0, { expr: X.happy, arms: "up" }, 0.5, 5)}
        </Bathroom>
      );
    },
    cam: mv("s08_toilet", C([0.5, 1.1, 0.5], [0, 0.55, -1.6], 38), C([0.3, 1.0, 0.1], [0, 0.6, -1.6], 36)),
  },
  s09_lady: {
    scene: (t) => (
      <Bathroom lid={1} t={t}>
        {R1(t, [0, 0.32, -1.58], 0.4, { expr: X.silly, arms: "wave" }, 0.5, 5)}
        <Person w={{ look: LOOKS.lady, pos: [0.9, 0, -0.9], yaw: -0.6, pose: t > EV.fanciest ? POSES.headHands : { ...POSES.stand, armL: [30, 40, 60], armR: [30, 40, 60] }, expr: live(t > EV.fanciest ? X.shock : X.worried, t, 8) }} />
      </Bathroom>
    ),
    cam: orb("s09_lady", [0.4, 0.75, -1.2], -6, 10, 3.3, 3.0, 1.4, 1.3, 40),
  },
  // B4 "So the officials made a simple offer."
  s10_officials: {
    scene: (t) => (
      <Office>
        <Person w={{ look: LOOKS.chief, pos: [0.0, 0, -1.35], yaw: 0, pose: t > EV.offer - 0.3 ? showR : thinkPose, expr: live(t > EV.offer - 0.3 ? X.happy : X.think, t, 21) }} />
        <Person w={{ look: LOOKS.clerk, pos: [-0.7, 0, -1.3], yaw: 0.45, pose: idlePose(t, POSES.stand, 2), expr: live(X.talk, t, 22, [[PS(4), EV.officials + 0.5]]) }} />
        <Person w={{ look: LOOKS.deputy, pos: [0.7, 0, -1.3], yaw: -0.45, pose: idlePose(t, POSES.stand, 3), expr: live(X.watch, t, 23) }} />
      </Office>
    ),
    cam: mv("s10_officials", C([0.6, 1.35, 1.6], [0, 1.0, -1.3], 38), C([0.3, 1.3, 1.25], [0, 1.0, -1.3], 36)),
  },
  s11_offer: {
    scene: (t) => (
      <Office>
        <Person w={{ look: LOOKS.chief, pos: [-0.35, 0, -1.35], yaw: 0.3, pose: { ...POSES.point, armR: [80, 12, 0], head: [0, -10, 0] }, expr: live(X.talk, t, 21, [[PS(5), PE(5)]]) }} />
        <group position={[0.2, 0.565, -0.8]} scale={popIn(t, EV.simple, 1e9)} rotation={[-0.12, -0.15, 0]}>
          <mesh position={[0, 0.3, -0.02]} castShadow><boxGeometry args={[0.5, 0.64, 0.03]} /><meshStandardMaterial color="#8a5a32" /></mesh>
          <mesh position={[0, 0.3, 0.0]}><planeGeometry args={[0.44, 0.58]} /><meshStandardMaterial map={noticeTex("1¢", "PAR QUEUE|DE RAT")} roughness={0.9} /></mesh>
        </group>
        <Person w={{ look: LOOKS.deputy, pos: [0.7, 0, -1.3], yaw: -0.45, pose: clapPose(t, 2), expr: live(X.happy, t, 23) }} />
      </Office>
    ),
    cam: mv("s11_offer", C([-0.3, 1.25, 1.5], [-0.15, 1.15, -1.3], 36), C([-0.2, 1.25, 1.1], [-0.15, 1.2, -1.3], 34)),
  },
  // B5 "Bring us a rat tail, and we'll pay you one cent."
  s13_tail: {
    scene: (t) => (
      <Street>
        {R1(t, [0, 0, -0.6], 1.0, { expr: t > EV.tail ? X.scared : X.watch, head: [10, -55, 0], wag: Math.sin(t * 10) * 1.5 }, 0.9, 9)}
        <Folk t={t} at={-4} />
      </Street>
    ),
    cam: orb("s13_tail", [-0.15, 0.4, -0.75], -5, 25, 1.9, 1.7, 0.8, 0.7, 38),
  },
  s14_cent: {
    scene: (t) => {
      const u = seg(t, EV.pay - 0.1, EV.cent + 0.05), y = 0.57 + 0.9 * (1 - u * u);
      return (
        <Office>
          {officials(t, { mood: t > EV.cent ? "cheer" : "talk", skipChief: false })}
          <Coin p={[0.5, u < 1 ? y : 0.575, -0.45]} r={[u < 1 ? t * 22 : 0, 0, 0]} s={2.0} />
          <CoinStack p={[-0.5, 0.565, -0.5]} n={12} />
        </Office>
      );
    },
    cam: mv("s14_cent", C([0.1, 1.1, 0.9], [0, 0.95, -0.6], 40), C([0.15, 1.0, 0.65], [0, 0.9, -0.5], 38)),
  },
  // B6 "Tails poured in by the thousands."
  s15_poured: {
    scene: (t) => (
      <Office>
        {officials(t, { mood: "count" })}
        <DeskHeap g={seg(t, span("s15_poured")[0], span("s16_thousands")[1]) * 0.7} />
        {[LOOKS.hunter1, LOOKS.woman2, LOOKS.hunter3].map((lk, i) => (
          <Person key={i} w={{ look: lk, pos: [-0.9 + i * 0.6, 0, 0.15 + (i % 2) * 0.25], yaw: Math.PI - 0.6 + i * 0.25, pose: { ...POSES.stand, armR: [20, 110 - 20 * Math.sin(t * 4 + i), 30] }, hold: <Basket />, expr: live(X.happy, t, 30 + i) }} />
        ))}
        <Falling t={t} drops={DROPS.poured} from={[0.4, 1.4, -0.3]} to={[0.35, 0.64, DESK_Z]} />
      </Office>
    ),
    cam: mv("s15_poured", C([2.7, 1.4, 1.5], [-0.1, 0.8, -0.5], 40), C([2.5, 1.4, 1.1], [-0.1, 0.8, -0.5], 38)),
  },
  s16_thousands: {
    scene: (t) => (
      <Office>
        {officials(t, { mood: "shock" })}
        <DeskHeap g={0.7 + 0.3 * seg(t, span("s16_thousands")[0], span("s16_thousands")[1])} />
        <Falling t={t} drops={DROPS.thousands} from={[0.3, 1.6, -0.2]} to={[0.35, 0.74, DESK_Z]} />
      </Office>
    ),
    cam: mv("s16_thousands", C([-0.5, 1.15, 1.3], [0.2, 1.0, -0.9], 40), C([-0.3, 1.4, 1.0], [0.2, 1.0, -0.9], 38)),
  },
  // B7 "Some days, more than twenty thousand of them."
  s17_queue: {
    scene: (t) => (
      <Street>
        {Array.from({ length: 12 }, (_, i) => {
          const z = 1.5 - i * 1.0, x = 0.4 + Math.sin(i * 1.3) * 0.15, m = MINIS[i % 7];
          return i < 3
            ? <Person key={i} w={{ look: [LOOKS.hunter1, LOOKS.woman1, LOOKS.hunter3][i], pos: [x, 0, z], yaw: face([x, 0, z], [1.8, 0, 3]), pose: { ...POSES.stand, armR: [20, 40, 60] }, hold: <Basket />, expr: live(X.happy, t, 40 + i) }} />
            : <MiniFolk key={i} pos={[x, 0, z]} yaw={face([x, 0, z], [1.8, 0, 3])} body={m.body} skin={m.skin} hat={m.hat ?? null} expr={X.happy} arms={0.15} />;
        })}
      </Street>
    ),
    cam: mv("s17_queue", C([2.4, 1.5, 3.2], [0.3, 1.0, -1.0], 40), C([1.9, 1.6, 1.2], [0.3, 1.0, -5], 42)),
  },
  s18_twenty: {
    scene: (t) => (
      <Office crates={Math.min(12, 4 + Math.floor(seg(t, EV.twenty - 0.2, EV.them7) * 9))}>
        {officials(t, { mood: t > EV.twenty + 0.3 ? "cheer" : "shock" })}
        <DeskHeap g={1} />
      </Office>
    ),
    cam: mv("s18_twenty", C([0, 1.4, 3.2], [0, 1.0, -1.2], 46), C([0, 1.6, 3.8], [0, 1.0, -1.2], 48)),
  },
  // B8 "The officials cheered, counting tails in big wooden crates."
  s19_cheer: {
    scene: (t) => <Office crates={12}>{officials(t, { mood: "cheer" })}<DeskHeap g={1} /></Office>,
    cam: orb("s19_cheer", [0, 1.0, -1.3], -28, -6, 2.4, 2.1, 1.05, 1.0, 38, 1.05),
  },
  s20_count: {
    scene: (t) => {
      const n = DROPS.count.filter((d) => t >= d).length, ph = DROPS.count.map((d) => seg(t, d - 0.22, d)).find((u) => u > 0 && u < 1) ?? 0;
      return (
        <Office crates={12}>
          <Person w={{ look: LOOKS.clerk, pos: [-0.2, 0, -1.3], yaw: 0.25, pose: { ...POSES.stand, armR: [20, 60 + 30 * Math.sin(ph * Math.PI), 50] }, hold: ph > 0 ? <HeldTail /> : undefined, expr: live(X.greedy, t, 22) }} />
          <DeskHeap g={0.6} p={[0.4, 0.56, DESK_Z]} />
          <TailCrate p={[-0.55, 0.565, DESK_Z + 0.05]} s={0.55} fill={0.3 + n * 0.15} />
          <CoinStack p={[0.0, 0.565, -0.45]} n={4 + n * 2} />
        </Office>
      );
    },
    cam: mv("s20_count", C([0.4, 1.3, 0.6], [-0.2, 0.95, -0.9], 36), C([0.25, 1.25, 0.35], [-0.2, 0.95, -0.9], 34)),
  },
  s21_crates: {
    scene: (t) => (
      <Office crates={12}>
        {officials(t, { mood: "cheer" })}
        {[[-1.3, 0.8], [-0.7, 1.0], [0.7, 1.0], [1.3, 0.8]].map(([x, z], i) => <TailCrate key={i} p={[x, 0, z]} r={i * 0.3} />)}
        <DeskHeap g={1} />
      </Office>
    ),
    cam: mv("s21_crates", C([0.2, 1.0, 2.6], [0, 0.6, 0.2], 44), C([0.0, 3.0, 3.4], [0, 0.6, -0.6], 46)),
  },
  // B9 "But the streets were still crawling."
  s22_streets: {
    scene: (t) => (
      <Street>
        <Swarm t={t} n={34} seed={21} box={[-4.5, 4.5, -6, 1.5]} o={{ scale: 0.55 }} />
        <Person w={{ look: LOOKS.woman1, pos: [-3.4, 0.6, 1.0], yaw: face([-3.4, 0, 1.0], [0, 0, 4]), pose: POSES.headHands, expr: live(X.scared, t, 50) }} />
        <Folk t={t} mood="shock" at={-4} />
      </Street>
    ),
    cam: mv("s22_streets", C([1.2, 2.4, 4.6], [-0.4, 0.5, -1.2], 46), C([0.6, 2.0, 4.0], [-0.6, 0.5, -1.2], 44)),
  },
  s23_crawling: {
    scene: (t) => (
      <Street>
        <Swarm t={t} n={18} seed={33} box={[-2.5, 2.5, -4, -0.6]} o={{ scale: 0.6, dir: "z", speed: 1.3 }} />
        <Folk t={t} mood="shock" at={-5} />
      </Street>
    ),
    cam: mv("s23_crawling", C([0.3, 0.35, 1.2], [0, 0.35, -3], 44), C([-0.2, 0.4, 1.4], [0, 0.35, -3], 44)),
  },
  // B10 "And people started noticing something odd."
  s24_people: {
    scene: (t) => (
      <Street>
        <Person w={{ look: LOOKS.woman2, pos: [2.9, 0, -1.9], yaw: face([2.9, 0, -1.9], [1.4, 0, 0.7]), pose: idlePose(t, POSES.stand, 1), expr: live(t > EV.noticing ? X.suspicious : X.watch, t, 51) }} />
        <Person w={{ look: LOOKS.hunter3, pos: [3.5, 0, -2.5], yaw: face([3.5, 0, -2.5], [1.4, 0, 0.7]), pose: thinkPose, expr: live(X.think, t, 52) }} />
        <Swarm t={t} n={8} seed={41} box={[-2, 2, -2, 0.5]} o={{ scale: 0.5, tailless: 0.7 }} />
      </Street>
    ),
    cam: mv("s24_people", C([1.3, 1.25, 0.9], [3.1, 0.95, -2.1], 38), C([1.6, 1.2, 0.3], [3.1, 0.98, -2.1], 34)),
  },
  s25_odd: {
    scene: (t) => (
      <Street>
        <Person w={{ look: LOOKS.woman2, pos: [2.9, 0, -1.9], yaw: face([2.9, 0, -1.9], [1.6, 0, 0]), pose: { ...POSES.stand, lean: 6, head: [4, 0, 0] }, expr: live({ ...X.suspicious, look: [0, 0.6] }, t, 51) }} />
        {R1(t, [2.25, 0, -1.2], -0.3, { expr: X.sheepish, tail: false }, 0.55, 11)}
      </Street>
    ),
    cam: orb("s25_odd", [2.6, 0.7, -1.6], -35, -55, 2.1, 1.9, 0.95, 0.9, 36),
  },
  // B11 "Rats were running around with no tails."
  s26_running: {
    scene: (t) => (
      <Street g="dusk" lanterns>
        <Swarm t={t} n={12} seed={52} box={[-3, 3, -2.6, -0.4]} o={{ scale: 0.6, tailless: 1, speed: 1.0 }} />
      </Street>
    ),
    cam: mv("s26_running", C([1.6, 0.55, 1.6], [0, 0.35, -1.4], 44), C([0.6, 0.6, 1.7], [0, 0.35, -1.4], 42)),
  },
  s27_notail: {
    scene: (t) => (
      <Street g="dusk" lanterns>
        {R1(t, [0, 0, -0.6], 3.1, { expr: t > EV.no ? X.sheepish : X.lookBack, tail: false, head: [0, -80, 0] }, 0.85, 12)}
        <Person w={{ look: LOOKS.woman1, pos: [-1.0, 0, -1.7], yaw: face([-1.0, 0, -1.7], [0.6, 0, 1.2]), pose: t > EV.tails11 - 0.1 ? POSES.headHands : idlePose(t), expr: live(t > EV.tails11 - 0.1 ? X.shock : X.watch, t, 53) }} />
      </Street>
    ),
    cam: mv("s27_notail", C([0.9, 0.75, 0.9], [-0.1, 0.45, -0.9], 38), C([0.75, 0.7, 0.65], [-0.1, 0.45, -0.9], 36)),
  },
  // B12 "Meanwhile, outside the city, inspectors found barns full of rats, fed and cared for like pets."
  s29_meanwhile: {
    scene: (t) => <Farm doors={0}><Person w={{ look: LOOKS.inspector, pos: [0.1, 0, 6.5], yaw: Math.PI, pose: walkPose(t * 1.4), hold: <Clipboard />, expr: live(X.watch, t, 60) }} /></Farm>,
    cam: mv("s29_meanwhile", C([3, 6.5, 14], [0, 1.0, -1], 46), C([2.6, 3.2, 11], [0, 1.2, -1], 44)),
  },
  s30_inspector: {
    scene: (t) => {
      const [t0] = span("s30_inspector"), z = 4.2 - (t - t0) * 0.75, doors = out3(seg(t, EV.barns, EV.barns + 0.5));
      const stop = t > EV.barns + 0.2;
      return (
        <Farm doors={doors}>
          <Person w={{ look: LOOKS.inspector, pos: [0.15, 0, stop ? 4.2 - (EV.barns + 0.2 - t0) * 0.75 : z], yaw: Math.PI, pose: stop ? { ...POSES.headHands, armR: [12, 40, 60] } : { ...walkPose((t - t0) * 1.45), armR: [12, 40, 60] }, hold: <Clipboard />, expr: live(stop ? X.shock : X.watch, t, 60) }} />
          {doors > 0.3 && BARN_RATS(t, 10)}
        </Farm>
      );
    },
    cam: mv("s30_inspector", C([2.6, 1.3, 1.5], [0.1, 1.0, 3.8], 42), C([2.9, 1.35, 1.9], [0.0, 1.0, 3.0], 44)),
  },
  s32_full: {
    scene: (t) => (
      <Farm doors={1}>
        {BARN_RATS(t, 16)}
        <Person w={{ look: LOOKS.farmer, pos: [1.4, 0, -2.6], yaw: face([1.4, 0, -2.6], [-0.2, 0, -0.5]), pose: t > EV.fed ? { ...POSES.stand, armR: [30, 90, 30] } : idlePose(t), hold: <HeldBowl />, expr: live(X.happy, t, 61) }} />
      </Farm>
    ),
    cam: mv("s32_full", C([0.3, 1.6, 0.9], [0, 0.4, -2.4], 46), C([0.2, 1.5, 0.4], [0, 0.4, -2.5], 44)),
  },
  s34_pets: {
    scene: (t) => (
      <Farm doors={1}>
        {BARN_RATS(t, 8, 9)}
        <Person w={{ look: LOOKS.farmer, pos: [0.3, 0, -1.6], yaw: 0, pose: carryBoth, expr: live(X.laugh, t, 61) }} />
        {R1(t, [0.3, 0.52, -1.32], 0, { expr: X.happy, bow: "#e8508a", arms: "up" }, 0.42, 30)}
      </Farm>
    ),
    cam: mv("s34_pets", C([0.6, 1.05, 0.2], [0.3, 0.8, -1.5], 38), C([0.5, 1.0, -0.05], [0.3, 0.8, -1.5], 36)),
    dom: (t) => <Hearts t={t} t0={EV.pets} x={0.5} y={0.42} />,
  },
  // B13 "You see, the city wasn't paying for dead rats."
  s35_yousee: {
    scene: (t) => (
      <Office g="violet" crates={8}>
        <Person w={{ look: LOOKS.chief, pos: [0, 0, -1.3], yaw: 0, pose: crossArms, expr: live(X.smug, t, 21) }} />
        <TailCrate p={[0.7, 0.565, DESK_Z]} s={0.7} />
      </Office>
    ),
    cam: orb("s35_yousee", [0, 0.95, -1.0], -20, 12, 2.3, 2.0, 1.2, 1.15, 38),
  },
  s36_dead: {
    scene: (t) => (
      <Office g="violet" crates={8}>
        <Person w={{ look: LOOKS.chief, pos: [0, 0, -1.3], yaw: 0, pose: t > EV.dead + 0.3 ? { ...POSES.point, head: [0, 18, 0] } : POSES.shrug, expr: live(t > EV.dead + 0.3 ? X.greedy : X.smug, t, 21) }} />
        <TailCrate p={[-0.55, 0.565, DESK_Z]} s={0.7} label="RATS" fill={0} />
        <TailCrate p={[0.55, 0.565, DESK_Z]} s={0.7} />
      </Office>
    ),
    cam: mv("s36_dead", C([0, 1.25, 1.4], [0, 1.0, -0.9], 38), C([0, 1.2, 1.05], [0, 1.0, -0.9], 36)),
  },
  // B14 "It was paying for tails."
  s37_tails: {
    scene: (t) => (
      <Office g="violet" crates={8}>
        <Person w={{ look: LOOKS.chief, pos: [0, 0, -1.3], yaw: 0, pose: mixPose(POSES.stand, sideUp, seg(t, P(14), P(14) + 0.3)), hold: <HeldTail />, expr: live(t > EV.tails14 ? X.dazzled : X.happy, t, 21) }} />
        <CoinStack p={[0.4, 0.565, -0.5]} n={10} />
      </Office>
    ),
    cam: mv("s37_tails", C([-0.4, 1.2, 1.2], [0, 1.05, -1.3], 38), C([-0.25, 1.2, 0.9], [0, 1.1, -1.3], 36)),
  },
  // B15 "And a rat doesn't need its tail to make more rats."
  s38_rat: {
    scene: (t) => <Stage spot={[0.3, 5, 2]} aim={[0, 0.3, 0]}>{R1(t, [0, 0, 0], 0.2, { expr: t > EV.need ? X.smug : X.watch, tail: false, arms: t > EV.need ? "shrug" : "down" }, 0.9, 13)}</Stage>,
    cam: orb("s38_rat", [0, 0.45, 0], -25, 15, 2.0, 1.75, 0.8, 0.7, 36),
  },
  s39_make: {
    scene: (t) => (
      <Stage spot={[0.3, 5, 2]} aim={[0, 0.3, 0]}>
        {R1(t, [0, 0, 0], 0.1, { expr: X.proud, tail: false, arms: "up" }, 0.9, 13)}
        {[[-0.6, 0.3], [0.6, 0.3], [-0.35, 0.6], [0.35, 0.6], [0, 0.75]].map(([x, z], i) => {
          const k = popIn(t, EV.make15 + i * 0.12, 1e9);
          return k > 0.01 ? <React.Fragment key={i}>{R1(t, [x, 0, z], -x * 0.5, { expr: RE[i], arms: i % 2 ? "up" : "wave" }, 0.4 * k, 14 + i)}</React.Fragment> : null;
        })}
      </Stage>
    ),
    cam: mv("s39_make", C([0, 1.0, 2.6], [0, 0.45, 0.2], 40), C([0, 1.2, 3.0], [0, 0.4, 0.2], 42)),
  },
  // B16 "So clever hunters caught a rat, snipped off its tail, and let it go."
  s40_catch: {
    scene: (t) => <Stage fill={DEFS.s40_catch.cam(t).pos}><Turntable t={t} /></Stage>,
    cam: (t) => { const u = io(seg(t, ...span("s40_catch"))); return stCam(0, t, lerp(-30, -18, u), lerp(5.2, 4.3, u), lerp(2.4, 1.6, u), 0.6, 40); },
    dom: (t, cam) => <Labels t={t} cam={cam} only={[0, 1, 5]} />,
  },
  s41_snip: {
    scene: (t) => <Stage fill={DEFS.s41_snip.cam(t).pos}><Turntable t={t} /></Stage>,
    cam: (t) => { const u = io(seg(t, ...span("s41_snip"))); return stCam(1, t, lerp(-8, 4, u), lerp(4.3, 4.0, u), lerp(1.5, 1.35, u), 0.55, 40); },
    dom: (t, cam) => <Labels t={t} cam={cam} t0={span("s41_snip")[0]} only={[1]} />,
  },
  s42_go: {
    scene: (t) => <Stage fill={DEFS.s42_go.cam(t).pos}><Turntable t={t} /></Stage>,
    cam: (t) => { const u = io(seg(t, ...span("s42_go"))); return stCam(2, t, lerp(4, 14, u), lerp(3.9, 3.6, u), lerp(1.25, 1.15, u), 0.5, 40); },
    dom: (t, cam) => <Labels t={t} cam={cam} t0={span("s42_go")[0]} only={[2]} />,
  },
  // B17 "Every rat they freed had babies, and every baby grew a brand new tail."
  s43_freed: {
    scene: (t) => <Stage fill={DEFS.s43_freed.cam(t).pos}><Turntable t={t} /></Stage>,
    cam: (t) => { const u = io(seg(t, ...span("s43_freed"))); return stCam(2, t, lerp(-10, 35, u), lerp(4.4, 4.6, u), lerp(1.6, 1.9, u), 0.5, 42); },
    dom: (t, cam) => <Labels t={t} cam={cam} t0={span("s43_freed")[0]} only={[2, 3]} />,
  },
  s44_babies: {
    scene: (t) => <Stage fill={DEFS.s44_babies.cam(t).pos}><Turntable t={t} /></Stage>,
    cam: (t) => { const u = io(seg(t, ...span("s44_babies"))); return stCam(3, t, lerp(-10, -2, u), lerp(3.7, 3.4, u), lerp(1.25, 1.1, u), 0.4, 40); },
    dom: (t, cam) => <Labels t={t} cam={cam} t0={span("s44_babies")[0]} only={[3]} />,
  },
  s45_grew: {
    scene: (t) => <Stage fill={DEFS.s45_grew.cam(t).pos}><Turntable t={t} /></Stage>,
    cam: (t) => { const u = io(seg(t, ...span("s45_grew"))); return stCam(4, t, lerp(-10, -2, u), lerp(3.6, 3.4, u), lerp(1.2, 1.1, u), 0.45, 40); },
    dom: (t, cam) => <Labels t={t} cam={cam} t0={span("s45_grew")[0]} only={[4]} />,
  },
  s45b_spin: {
    scene: (t) => <Stage fill={DEFS.s45b_spin.cam(t).pos}><Turntable t={t} /></Stage>,
    cam: (t) => { const u = io(seg(t, ...span("s45b_spin"))); return C([0, lerp(5.2, 6.6, u), lerp(5.6, 5.0, u)], [0, 0.3, 0.2], 46); },
    dom: (t, cam) => <Labels t={t} cam={cam} t0={span("s45b_spin")[0]} />,
  },
  // B18 "Some people stopped hunting altogether and simply farmed them."
  s46_stopped: {
    scene: (t) => (
      <Farm doors={1}>
        <Person w={{ look: LOOKS.farmer, pos: [0.5, 0, 1.2], yaw: face([0.5, 0, 1.2], [1.6, 0, 4]), pose: t > EV.altogether ? crossArms : { ...POSES.stand, armR: [60, 30, 10] }, hold: t > EV.altogether ? undefined : <Net />, expr: live(t > EV.altogether ? X.sly : X.think, t, 61) }} />
        {t > EV.altogether && <group position={[1.3, 0.05, 1.3]} rotation={[Math.PI / 2 - 0.1, 0, 0.6]}><Net /></group>}
        {[[-0.6, 0.6], [-0.2, 0.3], [1.2, 0.5]].map(([x, z], i) => <React.Fragment key={i}>{R1(t, [x, 0, z], face([x, 0, z], [1.6, 0, 4]), { expr: RE[i], arms: i === 1 ? "wave" : "down" }, 0.5, 80 + i)}</React.Fragment>)}
      </Farm>
    ),
    cam: mv("s46_stopped", C([1.8, 1.2, 4.2], [0.4, 0.9, 0.9], 38), C([1.5, 1.2, 3.5], [0.4, 0.95, 1.0], 36)),
  },
  s47_farmed: {
    scene: (t) => (
      <Farm doors={1}>
        {BARN_RATS(t, 16, 3)}
        <Person w={{ look: LOOKS.farmer, pos: [0.4, 0, -1.2], yaw: face([0.4, 0, -1.2], [-1, 0, 2]), pose: { ...POSES.stand, armR: [30, 90, 30] }, hold: <HeldBowl />, expr: live(X.greedy, t, 61) }} />
        <Bowl p={[-0.6, 0, -2.2]} /><Bowl p={[0.9, 0, -2.6]} />
      </Farm>
    ),
    cam: mv("s47_farmed", C([0.5, 1.25, 0.9], [0.1, 0.7, -2.3], 44), C([0.3, 1.3, 0.5], [0.1, 0.7, -2.4], 44)),
  },
  // B19 "The more the city paid, the more rats it got."
  s48_paid: {
    scene: (t) => (
      <Office crates={12}>
        {officials(t, { mood: "talk" })}
        {[LOOKS.hunter1, LOOKS.hunter2, LOOKS.farmer].map((lk, i) => (
          <Person key={i} w={{ look: lk, pos: [-0.7 + i * 0.7, 0, 0.3 + (i % 2) * 0.2], yaw: face([-0.7 + i * 0.7, 0, 0.3], [0.9, 0, 2.8]), pose: cheerPose(t, i), expr: live(X.laugh, t, 90 + i) }} />
        ))}
        <CoinStack p={[0.2, 0.565, -0.5]} n={14} /><CoinStack p={[-0.3, 0.565, -0.6]} n={10} />
      </Office>
    ),
    cam: mv("s48_paid", C([0.9, 1.35, 3.0], [0, 0.85, -0.4], 42), C([0.7, 1.4, 2.6], [0, 0.85, -0.4], 40)),
    dom: (t) => <CoinBurst t={t} t0={EV.paid19} x={0.5} y={0.42} />,
  },
  s49_got: {
    scene: (t) => (
      <Street>
        <BountyTable coins={2} />
        <Person w={{ look: LOOKS.chief, pos: [0, 0.75, -1.75], yaw: 0, pose: POSES.headHands, expr: live(X.scared, t, 3) }} />
        <Swarm t={t} n={60} seed={61} box={[-4.5, 4.5, -5.5, 1.2]} o={{ scale: 0.55, popAt: EV.the19, popEvery: 0.015 }} />
        <Folk t={t} mood="shock" at={-4} />
      </Street>
    ),
    cam: mv("s49_got", C([0, 1.9, 2.4], [0, 1.1, -1.7], 44), C([0, 2.6, 3.4], [0, 1.0, -1.7], 46)),
    dom: (t) => <GraphUp t={t} t0={EV.the19} t1={P(20) - 0.1} y={0.22} />,
  },
  // B20 "Economists call this a perverse incentive."
  s50_econ: {
    scene: (t) => (
      <Classroom lines={["PAY ↑", "RATS ↑"]} graph={1}>
        <Person w={{ look: LOOKS.economist, pos: [-0.7, 0, -0.85], yaw: lerp(0.9, 0.45, io(seg(t, ...span("s50_econ")))), pose: { ...POSES.stand, armR: [100, 20, 30] }, hold: <Chalk />, expr: live(X.talk, t, 95) }} />
      </Classroom>
    ),
    cam: mv("s50_econ", C([0.7, 1.25, 2.4], [-0.35, 1.1, -1.4], 40), C([0.5, 1.2, 2.0], [-0.35, 1.1, -1.4], 38)),
  },
  s51_perverse: {
    scene: (t) => (
      <Classroom lines={["PERVERSE", "INCENTIVE"]} graph={1}>
        <Person w={{ look: LOOKS.economist, pos: [-0.8, 0, -0.85], yaw: 0.35, pose: { ...POSES.point, head: [0, 30, 0] }, expr: live(X.sly, t, 95) }} />
      </Classroom>
    ),
    cam: orb("s51_perverse", [-0.35, 1.15, -1.4], 22, 6, 3.4, 3.1, 1.3, 1.25, 40),
  },
  // B21 "When you reward the proof instead of the result, people just make more proof."
  s52_proof: {
    scene: (t) => (
      <Classroom lines={["PROOF = TAIL", "RESULT = FEWER RATS"]}>
        <Person w={{ look: LOOKS.economist, pos: [-0.5, 0, -1.1], yaw: 0.25, pose: mixPose(POSES.stand, sideUp, seg(t, EV.proof1 - 0.2, EV.proof1 + 0.1)), hold: <HeldTail />, expr: live(X.talk, t, 95) }} />
        <mesh position={[0.6, 0.4, -0.9]} castShadow><boxGeometry args={[0.6, 0.8, 0.5]} /><meshStandardMaterial color="#7a4a26" /></mesh>
        {R1(t, [0.6, 0.8, -0.85], -0.3, { expr: X.sheepish, arms: "shrug" }, 0.5, 15)}
      </Classroom>
    ),
    cam: mv("s52_proof", C([0.3, 1.3, 2.4], [0.0, 1.15, -1.2], 42), C([0.2, 1.25, 2.0], [0.0, 1.1, -1.2], 40)),
  },
  s53_result: {
    scene: (t) => (
      <Classroom lines={["PROOF = TAIL", "RESULT = FEWER RATS"]}>
        <Person w={{ look: LOOKS.economist, pos: [-0.5, 0, -1.1], yaw: 0.25, pose: sideUp, hold: <HeldTail />, expr: live(X.talk, t, 95, [[EV.result - 0.4, EV.result + 0.3]]) }} />
        <mesh position={[0.6, 0.4, -0.9]} castShadow><boxGeometry args={[0.6, 0.8, 0.5]} /><meshStandardMaterial color="#7a4a26" /></mesh>
        {R1(t, [0.6, 0.8, -0.85], -0.3, { expr: X.worried, arms: "shrug" }, 0.5, 15)}
      </Classroom>
    ),
    cam: orb("s53_result", [0.0, 1.15, -1.2], -10, 12, 3.3, 3.0, 1.3, 1.25, 40),
  },
  s54_moreproof: {
    scene: (t) => (
      <Farm doors={1}>
        <group position={[0.2, 0, -0.6]}>
          <mesh scale={[0.9, 0.55 + 0.25 * seg(t, span("s54_moreproof")[0], EV.proof2), 0.7]}><sphereGeometry args={[1, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial map={tailsTex()} roughness={0.6} /></mesh>
          <TailHeap n={24} w={1.6} d={1.2} h={0.4} seed={7} />
        </group>
        <Person w={{ look: LOOKS.hunter2, pos: [-0.75, 0, 0.5], yaw: face([-0.75, 0, 0.5], [0, 0, 4]), pose: crossArms, expr: live(X.sly, t, 96) }} />
        {[[1.4, -0.2], [1.0, 0.6], [-0.6, 0.7]].map(([x, z], i) => <React.Fragment key={i}>{R1(t, [x, 0, z], face([x, 0, z], [0.4, 0, 4]), { expr: RE[i + 1], arms: "up" }, 0.5, 100 + i)}</React.Fragment>)}
      </Farm>
    ),
    cam: mv("s54_moreproof", C([0.0, 1.5, 3.9], [-0.3, 0.6, -0.4], 44), C([0.1, 2.1, 4.5], [-0.3, 0.6, -0.4], 46)),
  },
  // B22 "Hanoi quietly cancelled the bounty."
  s55_quietly: {
    scene: (t) => {
      const [t0, t1] = span("s55_quietly"), u = seg(t, t0, t1);
      return (
        <Street>
          <NoticeBoard />
          <Person w={{ look: LOOKS.chief, pos: [lerp(0.6, -0.4, u), 0, -1.6], yaw: -1.2, pose: tiptoe(t), expr: live(X.hush, t, 3) }} />
        </Street>
      );
    },
    cam: mv("s55_quietly", C([0.6, 1.2, 2.2], [-0.6, 0.95, -2.0], 42), C([0.4, 1.2, 1.8], [-0.7, 0.95, -2.0], 40)),
  },
  s56_cancel: {
    scene: (t) => (
      <Street>
        <NoticeBoard stamped={t > EV.cancelled + 0.1} />
        <Person w={{ look: LOOKS.chief, pos: [-0.75, 0, -1.75], yaw: face([-0.75, 0, -1.75], [0.1, 0, 0.3]), pose: { ...POSES.stand, armL: [70 - 40 * Math.sin(Math.PI * seg(t, EV.cancelled - 0.15, EV.cancelled + 0.2)), 70, 10] }, expr: live(t > EV.cancelled + 0.2 ? X.sheepish : X.hush, t, 3) }} />
      </Street>
    ),
    cam: mv("s56_cancel", C([0.2, 1.25, 0.5], [-1.1, 1.15, -2.1], 42), C([0.05, 1.25, 0.2], [-1.1, 1.15, -2.1], 40)),
  },
  // B23 "Which is the real story of how..."
  s57_loop: { scene: (t) => loopScene(t - END, t), cam: (t) => loopCam(t - END), still: true },
};

/** The bounty notice board on the street (left side), stamped CANCELLED after the stamp. */
const NoticeBoard: React.FC<{ stamped?: boolean }> = ({ stamped }) => (
  <group position={[-1.7, 0, -2.4]} rotation={[0, 0.7, 0]}>
    {[-0.5, 0.5].map((x) => <mesh key={x} position={[x, 0.8, 0]} castShadow><boxGeometry args={[0.07, 1.6, 0.07]} /><meshStandardMaterial color="#6a4020" /></mesh>)}
    <mesh position={[0, 1.4, 0]} castShadow><boxGeometry args={[1.0, 1.0, 0.05]} /><meshStandardMaterial color="#8a5a32" /></mesh>
    <group position={[0, 1.4, 0.03]}>
      <mesh position={[0, 0, 0.002]}><planeGeometry args={[0.6, 0.8]} /><meshStandardMaterial map={noticeTex("1¢", "PAR QUEUE|DE RAT")} roughness={0.9} /></mesh>
      {stamped && <mesh position={[0, 0.0, 0.03]} rotation={[0, 0, 0.25]}><planeGeometry args={[0.7, 0.16]} /><meshBasicMaterial color="#c0392b" transparent opacity={0.85} /></mesh>}
    </group>
  </group>
);

export const SHOTS: Shot[] = CUTS.map(([id, t0, enter], i) => {
  const d = DEFS[id];
  if (!d) throw new Error("no shot def " + id);
  return { id, t0, t1: i + 1 < CUTS.length ? CUTS[i + 1][1] : END, enter, ...d };
});
/** Shots that carry the tail counter and coin bursts (drawn by the Short frame). */
export const counterOverlay = (t: number) => (
  <>
    <TailCounter t={t} t0={EV.tails6} tHit={EV.twenty + 0.45} t1={P(8) - 0.1} to={20000} sub="/ DAY" tSub={EV.twenty + 0.45} y={0.2} />
    <CoinBurst t={t} t0={EV.cent} x={0.5} y={0.4} />
    <CoinBurst t={t} t0={EV.twenty + 0.45} x={0.5} y={0.3} seed={4} n={18} />
  </>
);
void Lantern; void at;

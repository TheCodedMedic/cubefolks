// Short 3 "The Chocolate Bar That Invented the Microwave" (Beanfolk 3D): the 49 set-ups. Every time comes from timing.ts
// (measured words). Every set sits at the origin; a shot renders one set. Faces turn toward the camera (face()).
import React from "react";
import { CamS, io, lerp, orbit, seg, Shot, V3, c01, popIn } from "../kit/core";
import { project } from "../kit/Pop";
import { EXPR, Expr, liveFace } from "../bean/Face";
import { along, idlePose, mixPose, Pose, POSES, runPose } from "./Bean";
import { Balance, BigOven, Egg, Gizmo, HeldGoo, HeldTube, LOOKS, Magnetron, Microwave, MiniFolk, MINIS, Molecule, Newspaper, Person, Piano, PocketBar, PopBurst, PopcornBag, Popped, RadarDish, rnd, Screwdriver, Thermo, Who, YolkFace } from "./cast";
import { Factory, FACT_ROWS, Kitchen50, KitchenNow, Lab, MAG_P, MW_P, Showroom, Stage, Yard } from "./sets";
import { at, BOOM_T0, BURST_T0, CUTS, END, EV, P, span } from "./timing";

const D = Math.PI / 180;
/** The yaw that turns a character at p to face the point c. */
const face = (p: V3, c: V3) => Math.atan2(c[0] - p[0], c[2] - p[2]);

// ---------- expressions ----------
const X: Record<string, Expr> = {
  ...EXPR,
  proud: { eyes: "happy", brows: "raised", mouth: "smile", extras: ["sparkles"] } as Expr,
  talk: { eyes: "open", brows: "raised", mouth: "smile" } as Expr,
  watch: { eyes: "open", brows: "raised", mouth: "small", look: [0, 0.2] } as Expr,
  curious: { eyes: "open", brows: "oneUp", mouth: "pout", look: [0.3, 0.3] } as Expr,
  sheepish: { eyes: "happy", brows: "worried", mouth: "grin", extras: ["sweat", "blush"] } as Expr,
  think: { eyes: "open", brows: "worried", mouth: "pout", look: [-0.5, -0.6] } as Expr,
  down: { eyes: "open", brows: "worried", mouth: "wobbly", look: [0, 0.8] } as Expr,
  dazzled: { eyes: "wide", brows: "raised", mouth: "grin", extras: ["sparkles"] } as Expr,
  aha: { eyes: "wide", brows: "raised", mouth: "grin", extras: ["sparkles"] } as Expr,
  yuck: { eyes: "closed", brows: "angry", mouth: "wobbly" } as Expr,
  glum: { eyes: "half", brows: "sad", mouth: "flat" } as Expr,
  dizzy: { eyes: "closed", brows: "raised", mouth: "laugh" } as Expr,
  hotFace: { eyes: "squint", brows: "worried", mouth: "o", extras: ["sweat"] } as Expr,
  gasp: { eyes: "wide", brows: "worried", mouth: "o", extras: ["sweat"] } as Expr,
};
const live = (e: Expr, t: number, seed: number) => liveFace(e, t, { seed });

// ---------- poses ----------
const showR: Pose = { ...POSES.stand, armR: [30, 70, 55] };
const presentR: Pose = { ...POSES.stand, armR: [70, 40, 20], head: [0, -10, 0] };
const holdUp: Pose = { ...POSES.stand, armR: [25, 95, 45], head: [6, 0, 0] };
const scratch: Pose = { ...POSES.stand, armR: [125, 20, 140], head: [0, 0, 8] };
const reach: Pose = { ...POSES.stand, armR: [18, 72, 30], armL: [18, 60, 40], lean: 8 };
const pocketPose: Pose = { ...POSES.stand, armL: [22, 40, 105], head: [22, 0, 0] };
const crossArms: Pose = { ...POSES.stand, armL: [12, 60, 120], armR: [12, 62, 118] };
const leanIn: Pose = { ...POSES.stand, lean: 16, head: [10, 0, 0], armL: [20, 10, 30], armR: [20, 10, 30] };
const recoil: Pose = { ...POSES.headHands, lean: -14, head: [-10, 0, 0] };
const salute: Pose = { ...POSES.stand, armR: [100, 20, 150] };
const cheerPose = (t: number, seed: number): Pose => mixPose(POSES.cheer, POSES.stand, 0.5 + 0.5 * Math.sin(t * 9 + seed * 2));
const clapPose = (t: number, seed: number): Pose => { const c = Math.abs(Math.sin(t * 10 + seed)); return { ...POSES.stand, armL: [20, 70, 40 + 30 * c], armR: [20, 70, 40 + 30 * c] }; };
const laughPose = (t: number, seed: number): Pose => ({ ...POSES.stand, armL: [30, 50, 110], armR: [30, 50, 110], lean: 8 + 6 * Math.sin(t * 14 + seed), head: [-8, 0, 0] });

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

// ---------- the lab people ----------
const PERCY_P: V3 = [-0.12, 0, -0.62];
const percyW = (t: number, o: Partial<Who> = {}): Who => ({ look: LOOKS.percy, pos: PERCY_P, yaw: 0.15, pose: idlePose(t, POSES.stand, 1), expr: live(X.talk, t, 1), ...o });
/** Experiment layout: Percy at the left of the bench end, the kernels / egg in front of the glowing tube. */
const EXP_P: V3 = [-0.38, 0, -0.82];
const ITEM_P: V3 = [0.16, MAG_P[1], -1.1];
const EGGY_P: V3 = [0.62, 0, -0.66];
const tech = (t: number, o: Partial<Who> = {}): Who => ({ look: LOOKS.tech, pos: [-1.5, 0, -0.95], yaw: 0.5, pose: idlePose(t, POSES.stand, 4), expr: live(X.watch, t, 4), ...o });
const runner = (t: number, o: Partial<Who> = {}): Who => ({ look: LOOKS.runner, pos: [1.55, 0, -0.75], yaw: -0.5, pose: idlePose(t, POSES.stand, 5), expr: live(X.watch, t, 5), ...o });
const eggy = (t: number, o: Partial<Who> = {}): Who => ({ look: LOOKS.egg, pos: EGGY_P, yaw: -0.75, pose: idlePose(t, POSES.stand, 6), expr: live(X.curious, t, 6), ...o });

/** Popcorn lying around after the burst (on the bench and the floor). */
const Litter: React.FC<{ n?: number }> = ({ n = 40 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const onBench = i % 3 === 0, x = (rnd(i * 3) - 0.5) * (onBench ? 2.4 : 4.5), z = onBench ? -1.35 + (rnd(i * 7) - 0.5) * 0.5 : -0.9 + (rnd(i * 7) - 0.5) * 2.4;
      return <Popped key={i} p={[x, onBench ? MAG_P[1] + 0.02 : 0.02, z]} s={1.3} r={i} />;
    })}
  </>
);
/** Popcorn raining down over the lab (each piece falls from above on its own loop). */
const PopRain: React.FC<{ t: number; t0: number; n?: number }> = ({ t, t0, n = 60 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const dt = t - t0 - rnd(i * 5) * 0.5; if (dt < 0) return null;
      const x = (rnd(i * 3) - 0.5) * 4.5, z = -1.9 + rnd(i * 7) * 2.6, y = Math.max(0.02, 2.6 + rnd(i * 11) * 0.8 - 4.9 * dt * dt);
      return <Popped key={i} p={[x, y, z]} s={1.6} r={i + dt * 5} />;
    })}
  </>
);

/** Microwaves as glowing arcs leaving a source toward +x (or invisible: faint, dashed). */
const Waves: React.FC<{ t: number; o: V3; n?: number; R?: number; ghost?: number; on?: number; s?: number }> = ({ t, o, n = 6, R = 4, ghost = 0, on = 1, s = 1 }) => (
  <group position={o} scale={s}>
    {Array.from({ length: n }, (_, k) => {
      const u = ((t * 0.9 + k / n) % 1), r = 0.25 + u * R;
      const op = on * (1 - u) * (ghost > 0 ? 0.25 + 0.2 * Math.sin(t * 20 + k) : 0.9);
      return (
        <mesh key={k} rotation={[0, 0, -50 * D]}>
          <torusGeometry args={[r, 0.035 * (1 - ghost * 0.5), 8, 40, 100 * D]} />
          <meshStandardMaterial color="#ffe08a" emissive="#ffb030" emissiveIntensity={1.4} transparent opacity={op} depthWrite={false} />
        </mesh>
      );
    })}
  </group>
);

/** A giant see-through popcorn kernel with molecules inside. */
const BigKernel: React.FC<{ p?: V3; s?: number; hot?: number; children?: React.ReactNode; popped?: number }> = ({ p = [0, 1.3, 0], s = 1, hot = 0, children, popped = 0 }) => {
  const col = hot > 0.5 ? "#ffa040" : "#f2c040";
  return (
    <group position={p} scale={s}>
      {children}
      {popped < 0.01 ? (
        <mesh scale={[1.25, 1.0, 1.0]} renderOrder={5}><sphereGeometry args={[1.0, 48, 32]} /><meshStandardMaterial color={col} emissive="#ff6a10" emissiveIntensity={hot * 0.5} transparent opacity={0.28} roughness={0.2} depthWrite={false} /></mesh>
      ) : (
        <group scale={0.4 + popped * 0.6}>
          {[[0, 0, 0, 0.7], [0.55, 0.35, 0.1, 0.5], [-0.5, 0.4, 0.05, 0.5], [0.1, -0.5, 0.3, 0.45], [-0.2, 0.7, 0.4, 0.4], [0.4, -0.2, 0.55, 0.38]].map(([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]}><sphereGeometry args={[r, 24, 18]} /><meshStandardMaterial color={i === 3 ? "#f6e2a0" : "#fffbee"} roughness={0.85} /></mesh>
          ))}
        </group>
      )}
    </group>
  );
};
/** Molecules inside the kernel: k of them on a ring, spinning back and forth at `rate` (Hz), hot 0..1. */
const MolRing: React.FC<{ t: number; n: number; rate: number; amp?: number; hot?: number; s?: number; exprs?: Expr[]; jig?: number }> = ({ t, n, rate, amp = 40, hot = 0, s = 0.55, exprs, jig = 0 }) => (
  <>
    {Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + 0.4, rr = n === 1 ? 0 : 0.55;
      const sp = Math.sin(t * rate * Math.PI * 2 + i * 1.7) * amp * D;
      const jx = jig * 0.04 * Math.sin(t * 37 + i * 3), jy = jig * 0.04 * Math.sin(t * 41 + i * 5);
      const e = exprs ? exprs[i % exprs.length] : hot > 0.5 ? X.hotFace : X.happy;
      return <Molecule key={i} p={[Math.cos(a) * rr * 1.2 + jx, Math.sin(a) * rr * 0.8 + jy, Math.sin(a * 2) * 0.15]} s={s} spin={sp} hot={hot} expr={live(e, t, 80 + i)} />;
    })}
  </>
);
/** Wavy heat lines rising from a projected 3D point (drawn over the picture). */
const HeatWaves: React.FC<{ t: number; cam: CamS; p: V3; on: number; w?: number }> = ({ t, cam, p, on, w = 420 }) => {
  if (on <= 0.01) return null;
  const [x, y] = project(cam, p);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: 5 }, (_, k) => {
        const u = ((t * 0.7 + k / 5) % 1), cx = x * 1080 + (k - 2) * (w / 5), cy = y * 1920 - u * 520;
        const d = Array.from({ length: 9 }, (_, j) => `${j ? "L" : "M"} ${cx + Math.sin(j * 1.2 + t * 8 + k) * 22} ${cy - j * 26}`).join(" ");
        return <path key={k} d={d} stroke="#ff9a2a" strokeWidth={14} fill="none" strokeLinecap="round" opacity={on * Math.sin(u * Math.PI)} />;
      })}
    </svg>
  );
};
/** Little sparks from a screwdriver tip (projected). */
const Sparks: React.FC<{ t: number; cam: CamS; p: V3; on?: number }> = ({ t, cam, p, on = 1 }) => {
  const [x, y] = project(cam, p);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: 10 }, (_, k) => {
        const u = ((t * 3 + rnd(k)) % 1), a = rnd(k * 3) * Math.PI * 2;
        const px = x * 1080 + Math.cos(a) * u * 90, py = y * 1920 + Math.sin(a) * u * 90 + u * u * 60;
        return <circle key={k} cx={px} cy={py} r={7 * (1 - u)} fill="#fff3a0" opacity={on * (1 - u)} />;
      })}
    </svg>
  );
};

// ---------- the loop: one continuous orbit through the last shot into the first (u = t - END there, u = t here) ----------
const LC: V3 = [0.1, 0.85, -0.85];
const loopCam = (u: number): CamS => ({ pos: orbit(LC, -16 + 6 * u, 2.55 - 0.22 * u, 1.22), target: [LC[0], LC[1] + 0.03 * u, LC[2]], fov: 42 });
const loopScene = (u: number, tFace: number) => {
  const k = u + 100;
  return (
    <Lab t={k} fill={PERCY_P}>
      <Magnetron p={MAG_P} t={k} />
      <Person w={percyW(tFace, { yaw: 0.2, pose: idlePose(k, presentR, 1), expr: live(X.talk, tFace, 1), extra: <PocketBar melt={0} /> })} />
      <Person w={tech(k, { pose: idlePose(k, { ...POSES.stand, armR: [20, 60, 60] }, 4), hold: <Screwdriver />, expr: live(X.happy, tFace, 4) })} />
      <Person w={runner(k, { expr: live(X.watch, tFace, 5) })} />
    </Lab>
  );
};

// ---------- the violet stage: the giant tube on its side, waves going right ----------
const GM_P: V3 = [-0.9, 0, -0.6];
const giantTube = (t: number, glow = 1) => <Magnetron p={GM_P} s={4} t={t} glow={glow} yaw={Math.PI / 2} />;

type Def = Omit<Shot, "t0" | "t1" | "enter" | "id">;
const thinkPose: Pose = { ...POSES.stand, armR: [118, 30, 140], head: [0, 0, 8] };
const DEFS: Record<string, Def> = {
  // B1 "In 1945, a man invented a new way to cook because a chocolate bar melted in his pocket."
  s01_hook: { scene: (t) => loopScene(t, t), cam: (t) => loopCam(t), still: true },
  s02_invented: {
    scene: (t) => (
      <Showroom fill={[-0.4, 0, -0.9]}>
        <BigOven p={[0.45, 0, -1.25]} glow={0.6 + 0.3 * Math.sin(t * 6)} t={t} yaw={-0.2} />
        <Person w={{ look: LOOKS.percy, pos: [-0.4, 0, -0.85], yaw: 0.35, pose: mixPose(POSES.stand, presentR, io(seg(t, EV.invented, EV.invented + 0.4))), expr: live(t > EV.cook ? X.proud : X.happy, t, 1) }} />
      </Showroom>
    ),
    cam: mv("s02_invented", C([0.2, 0.8, 2.1], [0.05, 1.0, -1.1], 42), C([0.0, 0.95, 1.6], [0.05, 1.05, -1.1], 40)),
  },
  s03_choc: {
    scene: (t) => {
      const m = c01(seg(t, EV.melted, EV.pocket + 0.4)) * 0.55;
      return (
        <Lab t={t} fill={PERCY_P}>
          <Magnetron p={MAG_P} t={t} />
          <Person w={percyW(t, { yaw: 0, pose: idlePose(t, POSES.stand, 1), expr: live(X.happy, t, 1), extra: <PocketBar melt={m} steam={m} t={t} /> })} />
        </Lab>
      );
    },
    cam: mv("s03_choc", C([0.4, 1.0, 0.6], [-0.05, 0.78, -0.5], 34), C([0.32, 0.95, 0.45], [-0.04, 0.76, -0.5], 34)),
  },
  // B2 "His name was Percy Spencer, and he had never even finished school."
  s04_name: {
    scene: (t) => (
      <Lab t={t} fill={PERCY_P}>
        <Magnetron p={MAG_P} t={t} />
        <Person w={percyW(t, { pose: idlePose(t, mixPose(POSES.stand, POSES.wave, 0.5 + 0.5 * Math.sin(t * 8)), 1), expr: live(X.happy, t, 1), extra: <PocketBar /> })} />
        <Person w={tech(t)} />
      </Lab>
    ),
    cam: orb("s04_name", [-0.1, 0.85, -0.6], 18, 4, 2.0, 1.75, 1.15, 1.1, 38, 0.92),
  },
  s05_school: {
    scene: (t) => (
      <Lab t={t} fill={PERCY_P}>
        <Magnetron p={MAG_P} t={t} glow={0.4} />
        <Person w={percyW(t, { yaw: 0.1, pose: idlePose(t, scratch, 1), expr: live(X.sheepish, t, 1), extra: <PocketBar /> })} />
      </Lab>
    ),
    cam: mv("s05_school", C([0.2, 1.05, 0.95], [-0.1, 0.95, -0.62], 36), C([0.1, 1.02, 0.6], [-0.1, 0.97, -0.62], 34)),
  },
  // B3 "But he built radar parts for the war, and he was brilliant at it."
  s06_built: {
    scene: (t) => (
      <Lab t={t}>
        <Magnetron p={MAG_P} t={t} glow={0.5} />
        <Person w={{ look: LOOKS.percy, pos: [-0.12, 0, -1.95], yaw: 0.35, pose: { ...reach, armR: [18, 72 + 8 * Math.sin(t * 14), 30], head: [14, 0, 0] }, hold: <Screwdriver />, expr: live(X.curious, t, 1) }} />
      </Lab>
    ),
    cam: mv("s06_built", C([0.9, 1.1, -0.2], [0.35, 0.78, -1.5], 38), C([0.65, 1.0, -0.45], [0.35, 0.78, -1.5], 36)),
    dom: (t, cam) => <Sparks t={t} cam={cam} p={[0.42, 0.78, -1.3]} />,
  },
  s07_war: {
    scene: (t) => (
      <Yard>
        <RadarDish p={[0.4, 0, -3.2]} t={t} />
        <Person w={{ look: LOOKS.percy, pos: [-0.6, 0, -1.2], yaw: 0.4, pose: salute, expr: live(X.proud, t, 1) }} />
        <Person w={{ look: LOOKS.worker1, pos: [-1.3, 0, -1.7], yaw: 0.6, pose: salute, expr: live(X.happy, t, 7) }} />
      </Yard>
    ),
    cam: mv("s07_war", C([0.3, 0.55, 2.4], [-0.1, 1.6, -2.0], 46), C([0.0, 0.5, 2.0], [-0.1, 1.9, -2.0], 48)),
  },
  s08_brilliant: {
    scene: (t) => (
      <Lab t={t} fill={PERCY_P}>
        <Magnetron p={MAG_P} t={t} />
        <Person w={percyW(t, { pose: idlePose(t, POSES.cheer, 1), expr: live(X.proud, t, 1), extra: <PocketBar /> })} />
        <Person w={tech(t, { pos: [-0.85, 0, -0.85], yaw: 0.6, pose: clapPose(t, 1), expr: live(X.happy, t, 4) })} />
        <Person w={runner(t, { pos: [0.75, 0, -0.85], yaw: -0.6, pose: clapPose(t, 2), expr: live(X.laugh, t, 5) })} />
      </Lab>
    ),
    cam: mv("s08_brilliant", C([0.0, 0.95, 1.6], [-0.05, 0.85, -0.7], 42), C([0.0, 1.0, 1.15], [-0.05, 0.9, -0.7], 40)),
  },
  // B4 "One day, standing next to a humming radar tube, he felt something sticky."
  s09_oneday: {
    scene: (t) => {
      const [t0, t1] = span("s09_oneday");
      const w = along([[-1.6, -0.3], [-0.6, -0.55], [-0.12, -0.62]], t, t0, 1.35 / ((t1 - t0) * 0.75));
      return (
        <Lab t={t}>
          <Magnetron p={MAG_P} t={t} />
          <Person w={{ look: LOOKS.percy, pos: [w.pos[0], 0, w.pos[1]], yaw: w.done ? 0.2 : w.yaw, pose: w.pose, expr: live(X.happy, t, 1), extra: <PocketBar /> }} />
          <Person w={tech(t, { pos: [-1.9, 0, -1.9], yaw: 0.2, pose: { ...reach, head: [12, 0, 0] }, expr: live(X.curious, t, 4) })} />
          <Person w={runner(t, { pos: [1.7, 0, -1.0] })} />
        </Lab>
      );
    },
    cam: mv("s09_oneday", C([-0.6, 1.5, 2.3], [-0.6, 0.75, -0.8], 46), C([0.1, 1.4, 2.0], [-0.05, 0.75, -0.8], 44)),
  },
  s10_humming: {
    scene: (t) => (
      <Lab t={t}>
        <Magnetron p={MAG_P} t={t} glow={1.3} />
        <Waves t={t} o={[MAG_P[0], MAG_P[1] + 0.17, MAG_P[2] + 0.1]} R={1.2} n={4} on={0.35} s={0.6} />
        <Person w={percyW(t, { pos: [-0.12, 0, -0.95], yaw: 0.25, expr: live(X.watch, t, 1), extra: <PocketBar melt={0.15} /> })} />
      </Lab>
    ),
    cam: mv("s10_humming", C([0.95, 0.95, -0.3], [0.38, 0.82, -1.3], 36), C([0.8, 0.9, -0.5], [0.4, 0.8, -1.3], 34)),
  },
  s11_sticky: {
    scene: (t) => {
      const u = io(seg(t, EV.felt, EV.felt + 0.35));
      return (
        <Lab t={t} fill={PERCY_P}>
          <Magnetron p={MAG_P} t={t} />
          <Person w={percyW(t, { yaw: 0.1, pose: mixPose(POSES.stand, pocketPose, u), expr: live(u > 0.5 ? X.down : X.watch, t, 1), extra: <PocketBar melt={0.35 + 0.15 * u} steam={0.5} t={t} /> })} />
        </Lab>
      );
    },
    cam: mv("s11_sticky", C([0.25, 1.05, 0.65], [-0.1, 0.85, -0.6], 36), C([0.18, 1.0, 0.45], [-0.1, 0.82, -0.6], 34)),
  },
  // B5 "His chocolate bar had turned to goo."
  s12_goo: {
    scene: (t) => {
      const m = 0.5 + 0.5 * io(seg(t, EV.choc5, EV.turned5 + 0.2));
      return (
        <Lab t={t} fill={PERCY_P}>
          <Magnetron p={MAG_P} t={t} />
          <Person w={percyW(t, { yaw: 0, pose: pocketPose, expr: live(X.down, t, 1), extra: <PocketBar melt={m} steam={1} t={t} /> })} />
        </Lab>
      );
    },
    cam: mv("s12_goo", C([0.35, 0.95, 0.45], [-0.04, 0.72, -0.52], 32), C([0.28, 0.9, 0.3], [-0.04, 0.7, -0.52], 32)),
  },
  s13_goo2: {
    scene: (t) => (
      <Lab t={t} fill={PERCY_P}>
        <Magnetron p={MAG_P} t={t} />
        <Person w={percyW(t, { yaw: 0.05, pose: idlePose(t, holdUp, 1), hold: <HeldGoo melt={1} />, expr: live(t > EV.goo ? X.shock : X.gasp, t, 1) })} />
      </Lab>
    ),
    cam: mv("s13_goo2", C([0.05, 1.0, 0.55], [-0.05, 0.92, -0.6], 34), C([0.0, 0.98, 0.38], [-0.05, 0.93, -0.6], 32)),
  },
  // B6 "The room wasn't hot."  B7 "He wasn't hot."
  s14_room: {
    scene: (t) => (
      <Lab t={t}>
        <Magnetron p={MAG_P} t={t} />
        <Thermo p={[-1.25, 1.35, -2.55]} level={0.38} s={1.6} />
        <Person w={tech(t, { pos: [-1.6, 0, -1.0], yaw: 0.5, pose: idlePose(t, POSES.shrug, 4), expr: live(X.happy, t, 4) })} />
        <Person w={runner(t, { pos: [-0.55, 0, -1.0], yaw: -0.3, pose: idlePose(t, crossArms, 5), expr: live(X.talk, t, 5) })} />
      </Lab>
    ),
    cam: mv("s14_room", C([0.1, 1.3, 1.2], [-1.0, 1.0, -1.6], 42), C([-0.2, 1.25, 0.9], [-1.1, 1.05, -1.8], 40)),
  },
  s15_he: {
    scene: (t) => (
      <Lab t={t} fill={PERCY_P}>
        <Magnetron p={MAG_P} t={t} />
        <Person w={percyW(t, { pose: idlePose(t, POSES.shrug, 1), expr: live(X.think, t, 1), extra: <PocketBar melt={1} /> })} />
      </Lab>
    ),
    cam: mv("s15_he", C([-0.2, 1.02, 0.6], [-0.1, 0.92, -0.62], 36), C([-0.1, 1.0, 0.45], [-0.1, 0.94, -0.62], 34)),
  },
  // B8 "So he sent someone out for a bag of popcorn kernels."
  s16_sent: {
    scene: (t) => {
      const [t0] = span("s16_sent");
      const r = along([[0.9, -0.7], [-1.0, -0.4], [-2.4, -0.6], [-3.4, -0.6]], t, t0 + 0.25, 3.0, "run");
      return (
        <Lab t={t}>
          <Magnetron p={MAG_P} t={t} />
          <Person w={percyW(t, { pos: [0.4, 0, -0.75], yaw: -0.5, pose: { ...POSES.point, head: [0, -10, 0] }, expr: live(X.talk, t, 1), extra: <PocketBar melt={1} /> })} />
          <Person w={{ look: LOOKS.runner, pos: [r.pos[0], 0, r.pos[1]], yaw: r.yaw, pose: r.pose, expr: live(X.happy, t, 5) }} />
        </Lab>
      );
    },
    cam: mv("s16_sent", C([0.2, 1.4, 2.3], [-0.6, 0.8, -0.7], 46), C([-0.3, 1.35, 2.1], [-1.1, 0.8, -0.7], 46)),
  },
  s17_bag: {
    scene: (t) => {
      const [t0] = span("s17_bag");
      const r = along([[-2.6, -0.5], [-0.9, -0.55]], t, t0, 2.6, "run");
      return (
        <Lab t={t} fill={[-0.5, 0, -0.6]}>
          <Magnetron p={MAG_P} t={t} />
          <Person w={percyW(t, { pos: [0.15, 0, -0.7], yaw: -0.6, pose: idlePose(t, POSES.stand, 1), expr: live(r.done ? X.happy : X.watch, t, 1), extra: <PocketBar melt={1} /> })} />
          <Person w={{ look: LOOKS.runner, pos: [r.pos[0], 0, r.pos[1]], yaw: r.done ? 0.9 : r.yaw, pose: r.done ? idlePose(t, showR, 5) : { ...r.pose, armR: [20, 50, 60] }, hold: <PopcornBag s={0.8} />, expr: live(X.proud, t, 5) }} />
        </Lab>
      );
    },
    cam: mv("s17_bag", C([-0.2, 1.1, 1.6], [-0.6, 0.85, -0.7], 42), C([-0.4, 1.05, 1.25], [-0.45, 0.85, -0.65], 40)),
  },
  // B9 "He held them near the tube, and they burst all over the lab."
  s18_held: {
    scene: (t) => (
      <Lab t={t}>
        <Magnetron p={MAG_P} t={t} glow={1.2} />
        <PopBurst t={t} t0={BURST_T0} o={ITEM_P} n={34} />
        <mesh position={[ITEM_P[0], ITEM_P[1] + 0.005, ITEM_P[2]]}><cylinderGeometry args={[0.09, 0.07, 0.012, 20]} /><meshStandardMaterial color="#e8e0d0" /></mesh>
        <Person w={{ look: LOOKS.percy, pos: EXP_P, yaw: 0.95, pose: leanIn, expr: live(X.curious, t, 1) }} />
      </Lab>
    ),
    cam: mv("s18_held", C([0.55, 1.15, 0.9], [-0.05, 0.75, -1.0], 38), C([0.5, 1.08, 0.7], [-0.02, 0.74, -1.0], 36)),
  },
  s19_burst: {
    scene: (t) => (
      <Lab t={t}>
        <Magnetron p={MAG_P} t={t} glow={1.2} />
        <PopBurst t={t} t0={BURST_T0} o={ITEM_P} n={34} />
        <PopBurst t={t} t0={BURST_T0 + 0.15} o={ITEM_P} n={30} seed={7} up={3.2} spread={2.2} />
        <Person w={{ look: LOOKS.percy, pos: EXP_P, yaw: 0.8, pose: mixPose(leanIn, recoil, io(seg(t, EV.burst, EV.burst + 0.25))), expr: live(X.shock, t, 1) }} />
      </Lab>
    ),
    cam: mv("s19_burst", C([0.6, 1.1, 0.5], [0.0, 0.85, -1.0], 40), C([0.75, 1.3, 1.1], [0.0, 0.95, -1.0], 44)),
  },
  s20_lab: {
    scene: (t) => (
      <Lab t={t}>
        <Magnetron p={MAG_P} t={t} />
        <PopRain t={t} t0={span("s20_lab")[0] - 0.4} />
        <Litter n={30} />
        <Person w={{ look: LOOKS.percy, pos: EXP_P, yaw: 0.4, pose: cheerPose(t, 1), expr: live(X.laugh, t, 1) }} />
        <Person w={tech(t, { pos: [-1.4, 0, -0.5], yaw: 0.5, pose: laughPose(t, 4), expr: live(X.laugh, t, 4) })} />
        <Person w={runner(t, { pos: [1.1, 0, -0.55], yaw: -0.5, pose: cheerPose(t, 5), expr: live(X.silly, t, 5) })} />
      </Lab>
    ),
    cam: orb("s20_lab", [0, 0.9, -0.8], -12, 10, 3.0, 2.7, 1.6, 1.5, 42, 0.85),
  },
  // B10 "Next, he tried an egg."
  s21_egg: {
    scene: (t) => (
      <Lab t={t}>
        <Magnetron p={MAG_P} t={t} glow={0.8} />
        <Litter n={30} />
        <Egg p={ITEM_P} t={t} />
        <Person w={{ look: LOOKS.percy, pos: EXP_P, yaw: 0.85, pose: mixPose(reach, POSES.stand, io(seg(t, EV.tried, EV.egg))), expr: live(X.smug, t, 1) }} />
        <Person w={eggy(t, { pose: idlePose(t, leanIn, 6), expr: live(X.curious, t, 6) })} />
      </Lab>
    ),
    cam: mv("s21_egg", C([0.0, 1.15, 1.0], [0.1, 0.78, -0.95], 40), C([0.15, 1.05, 0.7], [0.15, 0.78, -0.95], 38)),
  },
  // B11 "It wobbled, shook, and exploded right in a coworker's face."
  s22_wobble: {
    scene: (t) => (
      <Lab t={t}>
        <Magnetron p={MAG_P} t={t} glow={1.3} />
        <Egg p={ITEM_P} t={t} wob={1} shake={c01(seg(t, EV.shook, EV.shook + 0.2))} />
        <Person w={eggy(t, { pos: [0.6, 0, -0.7], yaw: -0.9, pose: idlePose(t, leanIn, 6), expr: live(t > EV.shook ? X.gasp : X.curious, t, 6) })} />
      </Lab>
    ),
    cam: mv("s22_wobble", C([-0.75, 1.05, 0.8], [0.35, 0.8, -0.9], 36), C([-0.65, 1.0, 0.6], [0.35, 0.79, -0.9], 34)),
  },
  s24_splat: {
    scene: (t) => {
      const hit = t > BOOM_T0 + 0.08;
      return (
        <Lab t={t}>
          <Magnetron p={MAG_P} t={t} glow={1.3} />
          <Litter n={30} />
          <Egg p={ITEM_P} t={t} boom={t - BOOM_T0} dir={[0.5, 0.55, 0.75]} />
          <Person w={eggy(t, { pos: [0.5, 0, -0.75], pose: hit ? mixPose(leanIn, recoil, io(seg(t, BOOM_T0 + 0.05, BOOM_T0 + 0.3))) : leanIn, expr: live(hit ? X.yuck : X.gasp, t, 6), headExtra: hit ? <YolkFace drip={c01((t - BOOM_T0) * 1.5)} /> : undefined })} />
          <Person w={{ look: LOOKS.percy, pos: EXP_P, yaw: 0.85, pose: mixPose(POSES.stand, recoil, io(seg(t, BOOM_T0, BOOM_T0 + 0.25))), expr: live(X.shock, t, 1) }} />
        </Lab>
      );
    },
    cam: mv("s24_splat", C([0.2, 1.1, 0.9], [0.15, 0.85, -0.9], 40), C([0.25, 1.15, 1.2], [0.15, 0.88, -0.9], 42)),
  },
  s25_face: {
    scene: (t) => (
      <Lab t={t} fill={[0.5, 0, -0.75]}>
        <Magnetron p={MAG_P} t={t} glow={0.6} />
        <Person w={eggy(t, { pos: [0.5, 0, -0.75], yaw: -0.25, pose: idlePose(t, POSES.stand, 6), expr: live(t > EV.face + 0.1 ? X.glum : X.yuck, t, 6), headExtra: <YolkFace drip={0.7 + 0.3 * seg(t, ...span("s25_face"))} /> })} />
        <Person w={{ look: LOOKS.percy, pos: [-0.4, 0, -1.2], yaw: 0.5, pose: laughPose(t, 1), expr: live(X.laugh, t, 1) }} />
      </Lab>
    ),
    cam: mv("s25_face", C([0.25, 1.08, 0.5], [0.3, 0.95, -0.85], 36), C([0.3, 1.05, 0.3], [0.38, 0.95, -0.8], 34)),
  },
  // B12 "Meanwhile, the war was ending, and his factory's thousands of radar tubes were about to become useless."
  s26_meanwhile: {
    scene: (t) => (
      <Yard>
        <RadarDish p={[2.2, 0, -4.5]} t={t} />
        <Person w={{ look: LOOKS.worker1, pos: [-0.35, 0, -1.0], yaw: 0.2, pose: { ...POSES.stand, armR: [25, 92, 40], armL: [25, 92, 40] }, hold: <Newspaper />, expr: live(X.dazzled, t, 7) }} />
        <Person w={{ look: LOOKS.worker2, pos: [0.55, 0, -1.3], yaw: -0.3, pose: cheerPose(t, 2), expr: live(X.laugh, t, 8) }} />
        {MINIS.slice(0, 6).map((m, i) => { const p: V3 = [-2.2 + i * 0.9, 0, -2.8 - (i % 2) * 0.6]; return <MiniFolk key={i} pos={p} yaw={face(p, [0, 0, 3])} {...m} expr={i % 2 ? X.laugh : X.happy} arms={0.6 + 0.3 * Math.sin(t * 9 + i)} />; })}
      </Yard>
    ),
    cam: mv("s26_meanwhile", C([0.0, 1.1, 1.4], [0.1, 0.95, -1.4], 44), C([0.1, 1.05, 1.05], [0.05, 0.95, -1.3], 42)),
  },
  s27_factory: {
    scene: (t) => (
      <Factory t={t}>
        {[0, 1, 2, 3, 4, 5].map((i) => { const p: V3 = [i % 2 ? 1.35 : -1.35, 0, -1.5 - i * 1.8]; return <MiniFolk key={i} pos={p} yaw={i % 2 ? -1.2 : 1.2} {...MINIS[i]} expr={X.watch} />; })}
      </Factory>
    ),
    cam: mv("s27_factory", C([0.0, 1.5, 2.6], [0.0, 0.9, -6], 46), C([0.0, 1.5, 1.4], [0.0, 0.9, -6], 46)),
  },
  s28_thousands: {
    scene: (t) => (
      <Factory t={t} n={14}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const p: V3 = [FACT_ROWS[i % 4] + (i % 4 < 2 ? 0.65 : -0.65), 0, -1 - i * 1.3]; return <MiniFolk key={i} pos={p} yaw={face(p, [0, 0, 4])} {...MINIS[i]} expr={X.watch} />; })}
      </Factory>
    ),
    cam: mv("s28_thousands", C([1.0, 2.0, 2.4], [0, 0.6, -4], 46), C([0.4, 5.0, 3.0], [0, 0.4, -5], 50)),
  },
  s29_useless: {
    scene: (t) => (
      <Factory t={t} n={10}>
        <Person w={{ look: LOOKS.boss, pos: [0, 0, -0.6], yaw: 0, pose: idlePose(t, showR, 9), hold: <HeldTube />, expr: live(t > EV.useless ? X.sad : X.glum, t, 9) }} />
        <Person w={{ look: LOOKS.worker1, pos: [-0.75, 0, -1.2], yaw: 0.3, pose: { ...POSES.shrug, head: [10, 0, 0] }, expr: live(X.glum, t, 7) }} />
        <Person w={{ look: LOOKS.worker2, pos: [0.75, 0, -1.25], yaw: -0.3, pose: { ...POSES.stand, head: [14, 0, 6] }, expr: live(X.sad, t, 8) }} />
      </Factory>
    ),
    cam: mv("s29_useless", C([0.1, 1.15, 1.5], [0, 0.95, -0.8], 40), C([0.05, 1.1, 1.0], [0, 0.98, -0.7], 36)),
  },
  // B13 "You see, that radar tube was firing out invisible microwaves."
  s30_yousee: {
    scene: (t) => (
      <Stage fill={[0.7, 0, 0.1]}>
        {giantTube(t, 0.6)}
        <Person w={{ look: LOOKS.percy, pos: [0.7, 0, 0.1], yaw: -0.25, pose: { ...POSES.point, armR: [80, 12, 0], head: [0, 10, 0] }, expr: live(X.aha, t, 1) }} />
      </Stage>
    ),
    cam: orb("s30_yousee", [-0.1, 1.0, -0.3], 10, -6, 4.8, 4.4, 1.5, 1.4, 42, 0.95),
  },
  s31_firing: {
    scene: (t) => (
      <Stage fill={[1.2, 0, 0.3]}>
        {giantTube(t, 1.4)}
        <Waves t={t} o={[GM_P[0] + 0.45, 0.7, GM_P[2]]} R={4} n={6} />
        <Person w={{ look: LOOKS.percy, pos: [1.2, 0, 0.3], yaw: -0.5, pose: idlePose(t, POSES.headHands, 1), expr: live(X.shock, t, 1) }} />
      </Stage>
    ),
    cam: mv("s31_firing", C([0.2, 1.2, 5.0], [0.1, 0.85, -0.3], 44), C([0.4, 1.1, 4.5], [0.2, 0.85, -0.3], 42)),
  },
  s32_invisible: {
    scene: (t) => (
      <Stage fill={[1.2, 0, 0.3]}>
        {giantTube(t, 1.2)}
        <Waves t={t} o={[GM_P[0] + 0.45, 0.7, GM_P[2]]} R={4} n={6} ghost={1} />
        <Person w={{ look: LOOKS.percy, pos: [1.2, 0, 0.3], yaw: -0.3 + 0.4 * Math.sin(t * 3), pose: idlePose(t, POSES.shrug, 1), expr: live({ ...X.think, look: [Math.sin(t * 3) * 0.8, 0] }, t, 1) }} />
      </Stage>
    ),
    cam: mv("s32_invisible", C([1.6, 1.15, 2.4], [0.9, 0.9, 0.1], 40), C([1.8, 1.1, 2.1], [1.0, 0.9, 0.2], 38)),
  },
  // B14 "And microwaves make the tiny water molecules inside food spin back and forth, billions of times a second."
  s33_molecule: {
    scene: (t) => (
      <Stage fill={[0, 0.8, 0.8]}>
        <Waves t={t} o={[-3, 1.3, 0]} R={3.5} n={5} on={0.6} />
        <group position={[0, 1.3, 0]} scale={popIn(t, P(14) + 0.1, 1e9, 0.35)}><Molecule s={1.6} spin={Math.sin(t * 3) * 0.15} expr={live(X.happy, t, 80)} /></group>
      </Stage>
    ),
    cam: mv("s33_molecule", C([0.0, 1.5, 4.2], [0, 1.3, 0], 40), C([0.0, 1.45, 3.4], [0, 1.32, 0], 38)),
  },
  s34_inside: {
    scene: (t) => (
      <Stage fill={[0, 0.8, 0.8]}>
        <Waves t={t} o={[-3, 1.3, 0]} R={3.5} n={5} on={0.6} />
        <BigKernel p={[0, 1.3, 0]} s={1.3}><MolRing t={t} n={4} rate={0.6} amp={15} /></BigKernel>
      </Stage>
    ),
    cam: mv("s34_inside", C([0.4, 1.7, 5.0], [0, 1.3, 0], 40), C([0.2, 1.5, 4.3], [0, 1.3, 0], 40)),
  },
  s35_spin: {
    scene: (t) => {
      const [t0] = span("s35_spin"), rate = 1.2 + (t - t0) * 2.5;
      return (
        <Stage fill={[0, 0.8, 0.8]}>
          <Waves t={t * 2} o={[-3, 1.3, 0]} R={3.5} n={6} />
          <group position={[0, 1.3, 0]}><Molecule s={1.5} spin={Math.sin((t - t0) * rate * Math.PI * 2) * 45 * D} expr={live(t > EV.forth ? X.dizzy : X.silly, t, 80)} /></group>
        </Stage>
      );
    },
    cam: mv("s35_spin", C([0.5, 1.45, 3.4], [0, 1.35, 0], 40), C([-0.3, 1.4, 3.1], [0, 1.35, 0], 38)),
  },
  s36_billions: {
    scene: (t) => (
      <Stage fill={[0, 0.8, 0.8]}>
        <Waves t={t * 3} o={[-3.5, 1.3, 0]} R={4} n={8} />
        {Array.from({ length: 12 }, (_, i) => {
          const p: V3 = [((i % 4) - 1.5) * 1.05, 0.5 + Math.floor(i / 4) * 0.85, -0.4 * (i % 2)];
          return <Molecule key={i} p={p} s={0.65} spin={Math.sin(t * 40 + i) * 50 * D} expr={live(i % 3 ? X.dizzy : X.laugh, t, 80 + i)} />;
        })}
      </Stage>
    ),
    cam: mv("s36_billions", C([0.0, 1.4, 3.3], [0, 1.35, 0], 42), C([0.0, 1.45, 4.4], [0, 1.4, 0], 44)),
  },
  // B15 "All that jiggling turns into heat, right inside the food."
  s37_jiggle: {
    scene: (t) => {
      const [t0, t1] = span("s37_jiggle"), h = seg(t, t0, t1);
      return (
        <Stage fill={[0, 0.8, 0.8]}>
          <BigKernel p={[0, 1.3, 0]} s={1.3} hot={h}><MolRing t={t} n={5} rate={9} amp={35} hot={h} jig={1} /></BigKernel>
        </Stage>
      );
    },
    cam: mv("s37_jiggle", C([-0.4, 1.4, 4.0], [0, 1.3, 0], 40), C([0.2, 1.35, 3.6], [0, 1.3, 0], 40)),
  },
  s38_heat: {
    scene: (t) => {
      const pop = c01((t - EV.food15) / 0.25);
      return (
        <Stage fill={[0, 0.8, 0.8]}>
          <BigKernel p={[0, 1.3, 0]} s={1.3} hot={1} popped={pop}>{pop < 0.01 && <MolRing t={t} n={5} rate={11} amp={40} hot={1} jig={1.4} />}</BigKernel>
          {pop > 0 && <pointLight position={[0, 1.4, 1.6]} intensity={2.5} distance={6} color="#fff0d0" />}
        </Stage>
      );
    },
    cam: mv("s38_heat", C([0.0, 1.35, 4.1], [0, 1.35, 0], 42), C([0.0, 1.3, 4.6], [0, 1.4, 0], 44)),
    dom: (t, cam) => <HeatWaves t={t} cam={cam} p={[0, 2.5, 0]} on={1 - c01((t - EV.food15) / 0.3)} />,
  },
  // B16 "That's why the snack got hot, but the room didn't."
  s39_snack: {
    scene: (t) => (
      <Lab t={t} fill={PERCY_P}>
        <Magnetron p={MAG_P} t={t} />
        <Person w={percyW(t, { pose: idlePose(t, holdUp, 1), hold: <HeldGoo melt={1} />, expr: live(t > EV.hot16 ? X.aha : X.think, t, 1) })} />
      </Lab>
    ),
    cam: mv("s39_snack", C([0.15, 1.0, 0.65], [-0.08, 0.9, -0.6], 36), C([0.05, 0.98, 0.45], [-0.08, 0.92, -0.6], 34)),
    dom: (t, cam) => <HeatWaves t={t} cam={cam} p={[0.02, 1.0, -0.45]} on={0.8} w={160} />,
  },
  s40_room: {
    scene: (t) => {
      const [t0] = span("s40_room"), g = io(seg(t, t0 + 0.15, t0 + 0.55));
      return (
        <Lab t={t} g="cool">
          <Magnetron p={MAG_P} t={t} />
          <Thermo p={[-1.25, 1.35, -2.55]} level={0.3} s={1.6} cool />
          <Person w={tech(t, { pos: [-1.3, 0, -1.1], yaw: 0.4, expr: live(X.happy, t, 4) })} />
          <Person w={percyW(t, { pos: [-0.3, 0, -0.9], pose: idlePose(t, crossArms, 1), expr: live(X.smug, t, 1) })} />
          {/* Gizmo peeks in from the right edge */}
          <Gizmo pos={[lerp(1.2, 0.5, g), 0, -0.1]} yaw={-0.55} pose={{ ...POSES.wave, roll: -8 * g, lean: 6 }} expr={live(g > 0.6 ? X.dazzled : X.shock, t, 30)} />
        </Lab>
      );
    },
    cam: mv("s40_room", C([0.0, 1.3, 1.9], [-0.25, 0.95, -1.0], 44), C([0.05, 1.28, 1.65], [-0.2, 0.95, -1.0], 44)),
  },
  // B17 "So his company turned a war machine into a kitchen machine."
  s41_war: {
    scene: (t) => (
      <Showroom fill={[0, 0, -0.6]}>
        <mesh position={[0, 0.35, -1.0]} castShadow><cylinderGeometry args={[0.35, 0.4, 0.7, 24]} /><meshStandardMaterial color="#4a5a3a" roughness={0.6} /></mesh>
        <Magnetron p={[0, 0.7, -1.0]} s={1.6} t={t} army />
        <Person w={{ look: LOOKS.boss, pos: [-0.75, 0, -0.75], yaw: 0.5, pose: idlePose(t, thinkPose, 9), expr: live(X.think, t, 9) }} />
        <Person w={{ look: LOOKS.percy, pos: [0.75, 0, -0.75], yaw: -0.5, pose: idlePose(t, showR, 1), expr: live(X.smug, t, 1) }} />
      </Showroom>
    ),
    cam: mv("s41_war", C([0.4, 1.25, 2.4], [0, 0.95, -0.9], 44), C([-0.2, 1.2, 2.1], [0, 0.95, -0.9], 44)),
  },
  s42_kitchen: {
    scene: (t) => {
      const [t0] = span("s42_kitchen");
      return (
        <Showroom fill={[0, 0, -0.6]}>
          <group position={[0, 0, -1.0]} scale={popIn(t, t0 + 0.05, 1e9, 0.35)}><BigOven glow={0.8} t={t} /></group>
          <Person w={{ look: LOOKS.boss, pos: [-0.85, 0, -0.65], yaw: 0.5, pose: cheerPose(t, 3), expr: live(X.dazzled, t, 9) }} />
          <Person w={{ look: LOOKS.percy, pos: [0.85, 0, -0.65], yaw: -0.5, pose: idlePose(t, presentR, 1), expr: live(X.proud, t, 1) }} />
        </Showroom>
      );
    },
    cam: mv("s42_kitchen", C([0.0, 1.15, 2.7], [0, 1.0, -0.9], 46), C([0.0, 1.2, 2.4], [0, 1.05, -0.9], 46)),
  },
  // B18 "The first one was taller than a man and weighed as much as a piano."
  s43_taller: {
    scene: (t) => (
      <Showroom fill={[0.3, 0, -0.7]}>
        <BigOven p={[-0.25, 0, -1.0]} t={t} />
        <Person w={{ look: LOOKS.percy, pos: [0.35, 0, -0.75], yaw: -0.35, pose: { ...POSES.stand, head: [-28, -15, 0], armR: [20, 10, 20] }, expr: live({ ...X.shock, look: [-0.4, -0.7] }, t, 1) }} />
      </Showroom>
    ),
    cam: mv("s43_taller", C([0.3, 0.45, 1.5], [0.0, 0.7, -0.9], 46), C([0.25, 0.8, 1.8], [0.0, 1.25, -0.9], 48)),
  },
  s44_piano: {
    scene: (t) => {
      const [t0] = span("s44_piano"), tip = 9 * Math.exp(-(t - t0) * 2.4) * Math.cos((t - t0) * 7);
      return (
        <Showroom fill={[0, 0.6, -0.6]}>
          <Balance p={[0, 0, -1.4]} tip={tip} W={0.78} pan={0.44}
            left={<group scale={0.62}><BigOven /></group>}
            right={<group scale={0.58} rotation={[0, -0.25, 0]}><Piano /></group>} />
        </Showroom>
      );
    },
    cam: orb("s44_piano", [0.1, 0.9, -1.4], 22, 14, 3.6, 3.35, 1.45, 1.4, 44, 0.85),
  },
  // B19 "It cost about five thousand dollars."
  s45_cost: {
    scene: (t) => (
      <Kitchen50 fill={[0.2, 0, -0.5]}>
        <BigOven p={[0.0, 0, -1.6]} t={t} tag={popIn(t, EV.five - 0.1, 1e9)} />
        <Person w={{ look: LOOKS.dad, pos: [-0.75, 0, -0.6], yaw: 0.25, pose: t > EV.five ? POSES.headHands : idlePose(t, POSES.stand, 11), expr: live(t > EV.five ? X.gasp : X.happy, t, 11) }} />
        <Person w={{ look: LOOKS.mom, pos: [0.15, 0, -0.45], yaw: 0, pose: t > EV.five + 0.15 ? { ...POSES.stand, armL: [30, 80, 130], armR: [30, 80, 130] } : idlePose(t, POSES.stand, 12), expr: live(t > EV.five + 0.15 ? X.shock : X.happy, t, 12) }} />
        <Person w={{ look: LOOKS.kid50, pos: [0.85, 0, -0.55], yaw: -0.3, scale: 0.8, pose: idlePose(t, POSES.jump, 13), expr: live(X.dazzled, t, 13) }} />
      </Kitchen50>
    ),
    cam: mv("s45_cost", C([0.0, 1.2, 2.0], [0.0, 1.05, -1.0], 46), C([0.1, 1.2, 1.6], [0.05, 1.05, -1.0], 44)),
  },
  // B20 "Today, almost every kitchen has one."
  s46_today: {
    scene: (t) => {
      const [t0] = span("s46_today"), door = 1 - io(seg(t, t0 + 0.2, t0 + 0.5));
      return (
        <KitchenNow fill={[0.6, 0, -0.8]}>
          <Microwave p={MW_P} s={1.2} t={t} door={door} on={door < 0.05 ? 1 : 0} display={door < 0.05 ? "2:00" : "0:00"} />
          <Person w={{ look: LOOKS.kidNow, pos: [0.75, 0, -0.85], yaw: -0.45, pose: { ...POSES.stand, armR: [22, 80, 30] }, expr: live(X.happy, t, 14) }} />
        </KitchenNow>
      );
    },
    cam: mv("s46_today", C([0.2, 1.3, 1.1], [0.3, 1.0, -1.4], 40), C([0.25, 1.25, 0.8], [0.3, 1.0, -1.4], 38)),
  },
  s47_every: {
    scene: (t) => {
      const ding = EV.one20, door = io(seg(t, ding + 0.05, ding + 0.35));
      return (
        <KitchenNow fill={[0.6, 0, -0.8]}>
          <Microwave p={MW_P} s={1.2} t={t} door={door} on={door > 0.05 ? 0.6 : 1} display={t > ding ? "0:00" : "0:01"} popAt={span("s47_every")[0]} />
          <Person w={{ look: LOOKS.kidNow, pos: [0.75, 0, -0.85], yaw: -0.4, pose: t > ding ? cheerPose(t, 3) : idlePose(t, POSES.stand, 14), expr: live(t > ding ? X.laugh : X.watch, t, 14) }} />
          <Person w={{ look: LOOKS.teen, pos: [-0.65, 0, -0.75], yaw: 0.45, pose: t > ding ? clapPose(t, 2) : idlePose(t, crossArms, 15), expr: live(t > ding ? X.happy : X.watch, t, 15) }} />
        </KitchenNow>
      );
    },
    cam: mv("s47_every", C([0.1, 1.25, 1.6], [0.15, 1.0, -1.3], 42), C([0.15, 1.2, 1.3], [0.15, 1.0, -1.3], 40)),
  },
  // B21 "Not bad for a guy with no diploma and a ruined snack."
  s48_notbad: {
    scene: (t) => (
      <Showroom fill={[0, 0, -0.5]}>
        <BigOven p={[-0.75, 0.3, -2.0]} t={t} glow={0.5} />
        <group position={[0.75, 0.3, -2.0]}><mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.6, 0.8, 0.5]} /><meshStandardMaterial color="#f2efe8" /></mesh><Microwave p={[0, 0.8, 0]} s={1.0} t={t} on={1} /></group>
        <Person w={{ look: LOOKS.percy, pos: [0, 0, -0.5], yaw: 0, pose: idlePose(t, crossArms, 1), expr: live(X.smug, t, 1) }} />
      </Showroom>
    ),
    cam: mv("s48_notbad", C([0.3, 1.0, 1.6], [0, 1.0, -0.8], 44), C([0.1, 0.98, 1.05], [0, 0.98, -0.6], 40)),
  },
  s49_ruined: {
    scene: (t) => (
      <Lab t={t} fill={PERCY_P}>
        <Magnetron p={MAG_P} t={t} />
        <Person w={percyW(t, { pose: idlePose(t, holdUp, 1), hold: <HeldGoo melt={1} />, expr: live(t > EV.snack21 ? X.silly : X.sheepish, t, 1), extra: <PocketBar melt={1} /> })} />
      </Lab>
    ),
    cam: mv("s49_ruined", C([-0.15, 1.02, 0.6], [-0.1, 0.92, -0.6], 36), C([-0.05, 1.0, 0.42], [-0.1, 0.93, -0.6], 34)),
  },
  // B22 "And it all started when..."
  s50_loop: { scene: (t) => loopScene(t - END, t), cam: (t) => loopCam(t - END), still: true },
};

export const SHOTS: Shot[] = CUTS.map(([id, t0, enter], i) => {
  const d = DEFS[id];
  if (!d) throw new Error("no shot def " + id);
  return { id, t0, t1: i + 1 < CUTS.length ? CUTS[i + 1][1] : END, enter, ...d };
});
void at; void P; void runPose; void Piano;

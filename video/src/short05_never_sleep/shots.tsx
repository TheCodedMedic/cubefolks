// Short 5 "A kid stayed awake for eleven days" (Beanfolk 3D): the set-ups. Every time comes from timing.ts (measured
// words). Every set sits at the origin; a shot renders one set. Faces turn toward the camera.
import React from "react";
import { CamS, io, lerp, orbit, out3, popIn, seg, Shot, V3 } from "../kit/core";
import { project } from "../kit/Pop";
import { EXPR, Expr, liveFace } from "../bean/Face";
import { idlePose, mixPose, Pose, POSES, walkPose } from "./Bean";
import { Ball, Brain, Calendar, Clipboard, Helmet, LOOKS, Mat, Mug, Person, Pinball, RecordBook, Stamp, StreetSign, Switch, Whistle, Who, tiredX, Desk } from "./cast";
import { Arcade, Classroom, Field, GARAGE, Garage, NightStreet, Stage, Violet } from "./sets";
import { ballY, BLINKS, CUTS, END, EV, LOOP_SPAN, P, span } from "./timing";

const D = Math.PI / 180;
/** The yaw that turns a character at p to face the point c. */
const face = (p: V3, c: V3) => Math.atan2(c[0] - p[0], c[2] - p[2]);

// ---------- expressions ----------
const X: Record<string, Expr> = {
  ...EXPR,
  wired: { eyes: "wide", brows: "raised", mouth: "grin", look: [0.2, 0] } as Expr,
  proud: { eyes: "happy", brows: "raised", mouth: "smile", extras: ["sparkles"] } as Expr,
  talk: { eyes: "open", brows: "raised", mouth: "smile" } as Expr,
  droopy: { eyes: "tired", brows: "worried", mouth: "small" } as Expr,
  half: { eyes: "half", brows: "neutral", mouth: "flat" } as Expr,
  dopey: { eyes: "half", brows: "raised", mouth: "smile" } as Expr,
  squint: { eyes: "squint", brows: "worried", mouth: "pout", look: [0.5, 0] } as Expr,
  greet: { eyes: "happy", brows: "raised", mouth: "grin" } as Expr,
  wonder: { eyes: "wide", brows: "raised", mouth: "smile", extras: ["sparkles"] } as Expr,
  baffled: { eyes: "open", brows: "worried", mouth: "flat", look: [0.4, 0] } as Expr,
  sly: { eyes: "smug", brows: "oneUp", mouth: "smirk", look: [0.5, 0.1] } as Expr,
  wink: { eyes: "wink", brows: "oneUp", mouth: "smirk" } as Expr,
  asleep: { eyes: "closed", brows: "neutral", mouth: "o" } as Expr,
  yawn: { eyes: "closed", brows: "worried", mouth: "o" } as Expr,
  stare: { eyes: "wide", brows: "neutral", mouth: "flat" } as Expr,
  focus: { eyes: "open", brows: "angry", mouth: "gritted", look: [0.4, 0.3] } as Expr,
};
const live = (e: Expr, t: number, seed: number) => liveFace(e, t, { seed });
/** Randy's face on a day (bags from day 2, bloodshot from day 4). */
const rx = (e: Expr, t: number, day: number) => tiredX(live(e, t, 1), day);
const randyLook = (day: number) => (day >= 4 ? LOOKS.randyMessy : LOOKS.randy);

// ---------- poses ----------
const holdUp: Pose = { ...POSES.stand, armR: [30, 95, 40], head: [-4, 0, 0] };
const mugUp: Pose = { ...POSES.stand, armR: [34, 42, 48], armL: [16, 0, 10] };
const thumbs: Pose = { ...POSES.stand, armR: [40, 80, 100], head: [0, 0, -6] };
const slump: Pose = { ...POSES.stand, armL: [8, 10, 10], armR: [22, 60, 70], lean: 10, head: [12, 0, 8], squash: 0.95 };
const reachR: Pose = { ...POSES.stand, armR: [30, 78, 10], lean: 6, head: [4, -8, 0] };
const dribbleP: Pose = { ...POSES.stand, armR: [14, 45, 30], lean: 8, legL: [14, 20], legR: [-6, 14] };
const blow: Pose = { ...POSES.stand, armR: [20, 80, 120], lean: 4, head: [-4, 0, 0] };
const flipP: Pose = { ...POSES.stand, armL: [14, 62, 52], armR: [14, 62, 52], lean: 10, head: [10, 0, 0] };
const hipsP: Pose = { ...POSES.stand, armL: [55, -10, 110], armR: [55, -10, 110], lean: -6, head: [-8, 0, 0], squash: 1.04 };
const armsUp = (t: number, s: number): Pose => mixPose(POSES.cheer, POSES.stand, 0.25 + 0.25 * Math.sin(t * 9 + s));
const clap = (t: number, s: number): Pose => ({ ...POSES.stand, armL: [30, 60, 30 + 25 * Math.sin(t * 14 + s)], armR: [30, 60, 30 + 25 * Math.sin(t * 14 + s)] });
/** Acting helpers: a hop height, a body sway, a nod-off cycle, a victory dance. */
const hop = (t: number, rate = 2, h = 0.05) => Math.abs(Math.sin(t * rate * Math.PI)) * h;
const up = (p: V3, dy: number): V3 => [p[0], p[1] + dy, p[2]];
const sway = (p: Pose, t: number, s: number, deg = 4): Pose => ({ ...p, roll: (p.roll ?? 0) + Math.sin(t * 2.2 + s) * deg, lean: (p.lean ?? 0) + Math.sin(t * 1.6 + s) * deg * 0.6, head: [((p.head ?? [0, 0, 0])[0]) + Math.sin(t * 1.9 + s) * deg * 0.5, (p.head ?? [0, 0, 0])[1], ((p.head ?? [0, 0, 0])[2]) - Math.sin(t * 2.2 + s) * deg * 0.8] });
const dance = (t: number): Pose => {
  const ph = Math.sin(t * 9);
  return { ...POSES.stand, armL: [150 - 70 * Math.max(0, -ph), 10, 20], armR: [150 - 70 * Math.max(0, ph), 10, 20], legL: [6 + 26 * Math.max(0, ph), 4 + 40 * Math.max(0, ph)], legR: [6 + 26 * Math.max(0, -ph), 4 + 40 * Math.max(0, -ph)], roll: 9 * ph, head: [-6, 0, 12 * ph], squash: 1.03 };
};
/** Nodding off: eyelids droop, the head sinks, then a jolt awake (period per). Returns [head pitch, eyes]. */
const nodOff = (t: number, t0: number, per = 1.1): [number, Expr["eyes"]] => {
  const u = ((((t - t0) / per) % 1) + 1) % 1;
  if (u < 0.45) return [u * 20, "tired"];
  if (u < 0.78) return [9 + (u - 0.45) * 70, "closed"];
  return [Math.max(0, 32 - (u - 0.78) * 300), "wide"];
};
const ballUp: Pose = { ...POSES.stand, armR: [125, 10, 20], armL: [40, 20, 40], head: [-6, 0, 0], squash: 1.03 };

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

// ---------- the den ----------
const RP: V3 = [0, 0, -0.4]; // Randy's mark in the den
/** The den with the day calendar (flips when the day changes at `flip`). */
const Den: React.FC<{ t: number; day: number; night?: boolean; spin?: number; fill?: V3; flipT?: number; children?: React.ReactNode }> = ({ t, day, night = true, spin = 0.5, fill, flipT = -9, children }) => (
  <Garage night={night} t={t} spin={spin} fill={fill ?? [RP[0], 0.9, RP[2]]}>
    <Calendar p={GARAGE.cal} day={day} swing={t - flipT} />
    {children}
  </Garage>
);
const randy = (t: number, day: number, o: Partial<Who> = {}): Who => ({ look: randyLook(day), pos: RP, yaw: 0, pose: idlePose(t, POSES.stand, 1), expr: rx(X.neutral, t, day), ...o });

/** The loop shot (frame 1 and the last shot): day-11 Randy, wired, bloodshot, a giant mug, the clock spinning. u = t (first) or t - END (last). */
const LOOP_LEN = LOOP_SPAN + EV.eleven1;
const loopCam = (u: number): CamS => {
  const k = io((u + LOOP_SPAN) / LOOP_LEN);
  return C([lerp(0.35, 0.18, k), lerp(1.12, 1.08, k), lerp(1.75, 1.2, k)], [lerp(-0.2, -0.12, k), lerp(1.12, 1.06, k), -0.6], 38);
};
const loopScene = (u: number, tFace: number) => {
  const k = u + 100, jit = Math.sin(k * 31) * 0.6 + Math.sin(k * 17) * 0.4;
  const e = X.wired, look: [number, number] = [Math.round(Math.sin(k * 2.3) * 3) / 5, 0];
  return (
    <Den t={k} day={11} spin={9}>
      <Person w={randy(tFace, 11, { pose: { ...sway(idlePose(k, mugUp, 1), k, 1, 4), head: [Math.sin(k * 1.9) * 3, jit * 4, jit * 2 + Math.sin(k * 2.2) * 4] }, hold: <Mug s={1.7} t={k} />, expr: tiredX({ ...e, look, eyes: (k * 1.15) % 1 < 0.14 ? "half" : "wide" }, 11) })} />
    </Den>
  );
};

// ---------- the friends ----------
const BRUCE: V3 = [-0.43, 0, -0.12], JOE: V3 = [0.45, 0, -0.08];
const bruce = (t: number, o: Partial<Who> = {}): Who => ({ look: LOOKS.bruce, pos: BRUCE, yaw: 0.25, pose: idlePose(t, POSES.stand, 3), expr: live(X.happy, t, 3), hold: <Whistle />, ...o });
const joe = (t: number, o: Partial<Who> = {}): Who => ({ look: LOOKS.joe, pos: JOE, yaw: -0.25, pose: idlePose(t, dribbleP, 5), expr: live(X.happy, t, 5), ...o });
/** Joe's dribbled ball (beside his right hand), bouncing from t0. */
const JoeBall: React.FC<{ t: number; t0: number; p?: V3; yaw?: number }> = ({ t, t0, p = JOE, yaw = -0.25 }) => {
  const side = -0.2, fwd = 0.16;
  return <Ball p={[p[0] + side * Math.cos(yaw) + fwd * Math.sin(yaw), ballY(t, t0, 0.42), p[2] - side * Math.sin(yaw) + fwd * Math.cos(yaw)]} spin={t * 6} />;
};

// ---------- the night street ----------
const SIGN: V3 = [0.55, 0, -0.55];

// ---------- the football ----------
const Football: React.FC<{ p?: V3; s?: number }> = ({ p = [0, -0.02, 0.05], s = 1 }) => (
  <group position={p} scale={s} rotation={[0.4, 0, 0.6]}>
    <mesh scale={[0.6, 0.6, 1]} castShadow><sphereGeometry args={[0.1, 24, 18]} /><Mat c="#8a4a22" r={0.6} /></mesh>
    <mesh position={[0, 0.058, 0]}><boxGeometry args={[0.012, 0.006, 0.09]} /><Mat c="#fbf8f1" /></mesh>
    {[-0.03, -0.01, 0.01, 0.03].map((z) => <mesh key={z} position={[0, 0.06, z]}><boxGeometry args={[0.03, 0.006, 0.005]} /><Mat c="#fbf8f1" /></mesh>)}
  </group>
);

// ---------- the arcade ----------
const PIN: V3 = [0.05, 0, -0.55], PIN_YAW = -Math.PI / 2; // player side faces -x
const RANDY_PIN: V3 = [-0.72, 0, -0.55], SCI_PIN: V3 = [-1.1, 0, 0.1];
const sci = (t: number, o: Partial<Who> = {}): Who => ({ look: LOOKS.sci, pos: SCI_PIN, yaw: 1.4, pose: idlePose(t, { ...POSES.stand, armL: [14, 50, 60] }, 7), holdL: <Clipboard />, expr: live(X.neutral, t, 7), ...o });

// ---------- the violet brain ----------
const BRAIN_P: V3 = [0.0, 0.95, -0.25], SW_P: V3 = [0.4, 0.95, -0.1];
/** 0..1: the world is "off" during a microsleep blink. */
const darkAt = (t: number) => BLINKS.reduce((a, b) => Math.max(a, t >= b && t < b + 0.18 ? 1 : 0), 0);
const Pedestal: React.FC = () => <mesh position={[BRAIN_P[0], 0.2, BRAIN_P[2]]} castShadow receiveShadow><cylinderGeometry args={[0.3, 0.34, 0.4, 28]} /><Mat c="#e8dcff" r={0.5} /></mesh>;
const BrainSet: React.FC<{ t: number; e: Expr; armR?: number; dark?: number; children?: React.ReactNode }> = ({ t, e, armR = 0, dark = 0, children }) => (
  <Violet fill={[BRAIN_P[0], 0.7, BRAIN_P[2]]} dark={dark}>
    <Pedestal />
    <Brain p={[BRAIN_P[0], BRAIN_P[1] + Math.sin(t * 2.2) * 0.03, BRAIN_P[2]]} face={dark > 0.5 ? X.asleep : live(e, t, 9)} armR={armR} s={0.55} />
    <mesh position={[SW_P[0], SW_P[1] * 0.5, SW_P[2] - 0.06]}><cylinderGeometry args={[0.03, 0.03, SW_P[1], 10]} /><Mat c="#c9a8ff" /></mesh>
    <Switch p={SW_P} on={1 - dark} s={0.8} yaw={-0.3} />
    {children}
  </Violet>
);

// ---------- floating Z's (dom over the 3D, pinned to a world point) ----------
const Zs = (p: V3, n = 3, size = 90) => (t: number, cam: CamS) => {
  const [x, y] = project(cam, p);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const u = (t * 0.6 + i / n) % 1;
        return <div key={i} style={{ position: "absolute", left: x * 1080 + u * 160 + i * 10, top: y * 1920 - u * 260, transform: `translate(-50%,-50%) rotate(${-12 + u * 20}deg)`, opacity: Math.min(1, (1 - u) * 2), fontFamily: "Montserrat, sans-serif", fontWeight: 900, fontSize: size * (0.6 + 0.6 * u), color: "#c9e4ff", WebkitTextStroke: "6px #1b2a4a", paintOrder: "stroke fill" }}>Z</div>;
      })}
    </>
  );
};

// ---------- the shots ----------
type Def = Omit<Shot, "t0" | "t1" | "enter" | "id">;
const DEFS: Record<string, Def> = {
  // B1 "A kid stayed awake for eleven days straight, and he did it for a science fair."
  s01_hook: { scene: (t) => loopScene(t, t), cam: (t) => loopCam(t), still: true },
  s02_eleven: {
    scene: (t) => {
      const [t0] = span("s02_eleven"), day = 1 + Math.min(10, Math.floor(seg(t, t0, t0 + 0.75) * 10.99));
      return (
        <Den t={t} day={day} spin={12} flipT={t0 + 0.75}>
          <Person w={randy(t, 11, { pos: [0.22, 0, -1.0], yaw: -0.25, pose: t > t0 + 0.45 ? { ...idlePose(t, mugUp, 1), head: [-14, 0, 6] } : sway(idlePose(t, mugUp, 1), t, 2, 4), hold: <Mug s={1.5} t={t} />, expr: tiredX(t > t0 + 0.45 ? X.yawn : { ...X.stare, look: [-0.6, -0.2] }, 11) })} />
        </Den>
      );
    },
    cam: mv("s02_eleven", C([0.05, 1.3, 0.95], [0.02, 1.3, -1.4], 36), C([0.02, 1.34, 0.7], [0.02, 1.36, -1.4], 34)),
  },
  s03_fair: {
    scene: (t) => (
      <Den t={t} day={1} night={false} spin={0.05} fill={[1.55, 0.9, -1.0]}>
        <Person w={randy(t, 1, { pos: up([1.42, 0, -0.95], hop(t, 2.2, 0.035)), yaw: -0.15, pose: idlePose(t, POSES.point, 1), expr: live(X.proud, t, 1) })} />
      </Den>
    ),
    cam: orb("s03_fair", [1.12, 1.15, -1.2], -6, 10, 2.7, 2.4, 1.25, 1.2, 40),
  },
  s04_poster: {
    scene: (t) => (
      <Den t={t} day={1} night={false} spin={0.05} fill={[1.6, 0.9, -1.0]}>
        <Person w={randy(t, 1, { pos: [0.98, 0, -1.02], yaw: -0.1, pose: { ...idlePose(t, thumbs, 1), head: [8 * Math.max(0, Math.sin(t * 7)), 0, -6] }, expr: live(X.happy, t, 1) })} />
      </Den>
    ),
    cam: mv("s04_poster", C([1.0, 1.3, 0.75], [0.98, 1.3, -1.5], 38), C([1.0, 1.28, 0.5], [0.98, 1.3, -1.5], 36)),
  },
  // B2 "His name was Randy Gardner, and his friends took shifts keeping him awake."
  s05_name: {
    scene: (t) => <Den t={t} day={1} night={false} spin={0.05}><Person w={randy(t, 1, { pos: up(RP, hop(t, 2.4, 0.04)), pose: { ...idlePose(t, POSES.wave, 1), armR: [135 + 15 * Math.sin(t * 12), 10, 30 + 25 * Math.sin(t * 12)], head: [0, 0, -6 + 6 * Math.sin(t * 6)] }, expr: live(X.greet, t, 1) })} /></Den>,
    cam: orb("s05_name", [RP[0], 0.85, RP[2]], -16, 10, 1.75, 1.5, 1.0, 0.98, 36),
  },
  s06_friends: {
    scene: (t) => {
      const k1 = popIn(t, EV.friends - 0.05, END + 9), k2 = popIn(t, EV.friends + 0.12, END + 9);
      return (
        <Den t={t} day={1} spin={0.5}>
          <Person w={randy(t, 1, { expr: live(X.happy, t, 1) })} />
          {k1 > 0.01 && <Person w={bruce(t, { scale: k1, pose: idlePose(t, POSES.wave, 3) })} />}
          {k2 > 0.01 && <Person w={joe(t, { scale: k2 })} />}
          {k2 > 0.5 && <JoeBall t={t} t0={EV.friends} />}
        </Den>
      );
    },
    cam: mv("s06_friends", C([0.0, 1.15, 2.6], [0, 0.78, -0.3], 42), C([0.0, 1.1, 2.35], [0, 0.78, -0.3], 40)),
  },
  s07_whistle: {
    scene: (t) => {
      const j = out3(seg(t, EV.shifts, EV.shifts + 0.12));
      return (
        <Den t={t} day={1} spin={0.5}>
          <Person w={bruce(t, { pos: [-0.38, 0, -0.35], yaw: 1.1, pose: blow, expr: { eyes: "closed", brows: "raised", mouth: "o", extras: ["blush"] } })} />
          <Person w={randy(t, 1, { pos: [0.05, 0.14 * Math.sin(Math.PI * seg(t, EV.shifts, EV.shifts + 0.32)), -0.38], yaw: -0.5, pose: mixPose(POSES.stand, { ...POSES.headHands, squash: 1.06 }, j), expr: j > 0.3 ? X.shock : live(X.droopy, t, 1) })} />
        </Den>
      );
    },
    cam: mv("s07_whistle", C([0.55, 1.08, 1.6], [-0.16, 0.9, -0.36], 36), C([0.5, 1.05, 1.4], [-0.16, 0.9, -0.36], 34)),
  },
  s08_hoops: {
    scene: (t) => {
      const [t0] = span("s08_hoops"), u = seg(t, t0 + 0.35, t0 + 0.75);
      const shoot: V3 = [lerp(1.3, 1.75, u), 1.0 + Math.sin(u * Math.PI) * 0.9 + u * 0.95, lerp(-0.6, -1.35, u)];
      return (
        <Den t={t} day={1} spin={6} fill={[1.2, 0.9, -0.6]}>
          <Person w={randy(t, 1, { pos: [1.25, 0, -0.55], yaw: -0.35, pose: u > 0 ? armsUp(t, 1) : idlePose(t, holdUp, 1), expr: live(u > 0.5 ? X.happy : X.droopy, t, 1), hold: u <= 0 ? <Ball /> : undefined })} />
          {u > 0 && u < 1.05 && <Ball p={shoot} spin={t * 8} />}
          <Person w={joe(t, { pos: [0.4, 0, -0.35], yaw: 0.5, pose: clap(t, 5), expr: live(X.laugh, t, 5) })} />
          <Person w={bruce(t, { pos: [-0.25, 0, -0.75], yaw: 0.6, pose: idlePose(t, POSES.cheer, 3), expr: live(X.happy, t, 3) })} />
        </Den>
      );
    },
    cam: mv("s08_hoops", C([0.15, 1.35, 1.6], [1.15, 1.25, -0.9], 40), C([0.3, 1.4, 1.35], [1.25, 1.35, -0.9], 38)),
  },
  // B3 "By day two, he couldn't focus his eyes."
  s09_day2: {
    scene: (t) => { const [hp, ey] = nodOff(t, P(3), 1.05); return <Den t={t} day={2} spin={4} flipT={EV.day2}><Person w={randy(t, 2, { pos: [0.05, 0, -0.75], pose: { ...idlePose(t, slump, 1), head: [hp, 0, 8 + hp * 0.3] }, hold: <Mug s={1.3} t={t} />, expr: tiredX({ ...X.droopy, eyes: ey, brows: ey === "wide" ? "raised" : "worried", mouth: ey === "wide" ? "o" : "small" }, 2) })} /></Den>; },
    cam: mv("s09_day2", C([-0.15, 1.3, 1.25], [-0.05, 1.15, -1.0], 38), C([-0.1, 1.2, 0.85], [0.0, 1.05, -1.0], 34)),
  },
  s10_focus: {
    // Randy's view: Joe holding up the ball, doubled and swimming out of focus (the blur is added in the frame)
    scene: (t) => {
      const w = Math.sin(t * 3) * 0.06 + 0.1;
      return (
        <Den t={t} day={2} spin={4} fill={[0, 0.9, -0.5]}>
          {[-w, w].map((dx, i) => <Person key={i} w={joe(t, { pos: [dx, 0, -0.5 - i * 0.02], yaw: 0, pose: idlePose(t, holdUp, 5), hold: <Ball />, expr: live(X.talk, t, 5) })} />)}
        </Den>
      );
    },
    cam: mv("s10_focus", C([0, 1.05, 1.15], [0, 0.95, -0.5], 36, ), { ...C([0.04, 1.02, 1.0], [0, 0.95, -0.5], 34), roll: 4 }),
  },
  // B4 "By day four, he thought a street sign was a person."
  s11_day4: {
    scene: (t) => {
      const [t0] = span("s11_day4"), d = (t - t0) * 0.45, ph = d / 0.52;
      return (
        <NightStreet fill={[0, 0.9, -0.2 + d]}>
          <Person w={randy(t, 4, { pos: [Math.sin(t * 2.6) * 0.06, 0, -0.2 + d], pose: sway(walkPose(ph), t, 1, 7), expr: rx({ ...X.droopy, eyes: (t * 0.9) % 1 < 0.25 ? "closed" : "tired" }, t, 4) })} />
          <Person w={bruce(t, { pos: [-0.5, 0, -0.45 + d], yaw: 0, pose: walkPose(ph + 0.3), expr: live(X.talk, t, 3) })} />
          <Person w={joe(t, { pos: [0.5, 0, -0.5 + d], yaw: 0, pose: walkPose(ph + 0.6), hold: <Ball />, expr: live(X.happy, t, 5) })} />
        </NightStreet>
      );
    },
    cam: (t) => { const [t0] = span("s11_day4"), d = (t - t0) * 0.45; return C([0.25, 1.15, 2.0 + d * 0.8], [0, 0.75, -0.3 + d], 40); },
  },
  s12_sign: {
    scene: (t) => (
      <NightStreet fill={[-0.25, 0.9, -0.2]}>
        <StreetSign p={SIGN} yaw={-0.4} />
        <Person w={randy(t, 4, { pos: [-0.25, 0, -0.25], yaw: 0.35, pose: idlePose(t, { ...POSES.stand, lean: 8 + 7 * Math.sin(t * 3), head: [0, 22 + 10 * Math.sin(t * 2.4), 14 * Math.sin(t * 2)] }, 1), expr: rx(t > EV.sign + 0.1 ? { ...X.shock, look: [0.6, 0] } : X.squint, t, 4) })} />
      </NightStreet>
    ),
    cam: mv("s12_sign", C([0.05, 1.2, 1.65], [0.12, 1.12, -0.4], 40), C([0.08, 1.18, 1.4], [0.12, 1.12, -0.4], 38)),
  },
  s13_person: {
    scene: (t) => {
      const shake = Math.max(0, t - EV.person);
      return (
        <NightStreet fill={[0.0, 0.9, -0.3]}>
          <StreetSign p={SIGN} yaw={-0.55} face={live(X.happy, t, 11)} arm={out3(seg(t, EV.was4, EV.was4 + 0.3))} shake={shake} />
          <Person w={randy(t, 4, { pos: [-0.05, shake > 0 ? hop(t, 3, 0.05) : 0, -0.32], yaw: 0.85, pose: { ...reachR, armR: [30, 78 + Math.sin(shake * 18) * 8 * Math.min(1, shake * 4), 10] }, expr: rx(X.greet, t, 4) })} />
          <Person w={bruce(t, { pos: [-0.3, 0, -1.25], yaw: 0.4, pose: idlePose(t, POSES.headHands, 3), hold: undefined, expr: live(X.shock, t, 3) })} />
        </NightStreet>
      );
    },
    cam: mv("s13_person", C([0.4, 1.25, 1.55], [0.28, 1.12, -0.5], 40), C([0.38, 1.22, 1.3], [0.3, 1.14, -0.5], 38)),
  },
  // B5 "Then he decided he was a famous football player."
  s14_decided: {
    scene: (t) => (
      <NightStreet fill={[0, 0.9, -0.3]}>
        <Person w={randy(t, 4, { pos: [0, 0, -0.3], pose: { ...idlePose(t, hipsP, 1), squash: 1 + 0.08 * out3(seg(t, EV.decided, EV.decided + 0.5)), head: [-8 - 6 * out3(seg(t, EV.decided, EV.decided + 0.5)), 0, 0] }, expr: tiredX(live(X.proud, t, 1), 4) })} />
        <Person w={bruce(t, { pos: [-0.75, 0, -0.75], yaw: 0.6, expr: live(X.baffled, t, 3) })} />
      </NightStreet>
    ),
    cam: mv("s14_decided", C([0.1, 0.55, 1.6], [0, 0.95, -0.3], 36), C([0.1, 0.62, 1.3], [0, 0.98, -0.3], 34)),
  },
  s15_famous: {
    scene: (t) => (
      <Field t={t} fill={[0, 0.9, 0]}>
        <Person w={{ look: LOOKS.randyBall, pos: [0, hop(t, 2.6, 0.12), 0], yaw: 0, pose: { ...idlePose(t, ballUp, 1), legL: [10 + 30 * hop(t, 2.6, 1), 50 * hop(t, 2.6, 1)], legR: [10 + 30 * hop(t, 2.6, 1), 50 * hop(t, 2.6, 1)], ground: false, hipY: 0.33 }, hold: <Football s={1.3} />, headExtra: <Helmet />, expr: live(X.proud, t, 1) }} />
      </Field>
    ),
    cam: orb("s15_famous", [0, 0.85, 0], -22, 8, 2.1, 1.85, 0.75, 0.82, 42, 0.95),
  },
  s16_player: {
    scene: (t) => (
      <NightStreet fill={[-0.2, 0.9, 0]}>
        <Person w={bruce(t, { pos: [-0.35, 0, 0.0], yaw: 0.2, pose: idlePose(t, POSES.headHands, 3), expr: live(X.worried, t, 3) })} />
        <Person w={joe(t, { pos: [0.4, 0, -0.05], yaw: -0.2, pose: idlePose(t, POSES.shrug, 5), hold: undefined, expr: live(X.suspicious, t, 5) })} />
        <Person w={randy(t, 4, { pos: [0.1, 0, -1.4], pose: idlePose(t, hipsP, 1), expr: tiredX(live(X.proud, t, 1), 4) })} />
      </NightStreet>
    ),
    cam: mv("s16_player", C([0.05, 1.05, 1.75], [0.0, 0.85, -0.3], 38), C([0.05, 1.02, 1.55], [0.0, 0.85, -0.3], 36)),
  },
  // B6 "But on the last night, he beat a sleep scientist at pinball."
  s17_last: {
    scene: (t) => (
      <Arcade t={t} fill={[-0.6, 0.9, -0.2]}>
        <Pinball p={PIN} yaw={PIN_YAW} t={t} />
        <Person w={randy(t, 11, { pos: RANDY_PIN, yaw: Math.PI / 2 - 0.35, pose: { ...idlePose(t, flipP, 1), armL: [14, 62, 52 + 18 * Math.max(0, Math.sin(t * 9))], armR: [14, 62, 52 + 18 * Math.max(0, Math.sin(t * 9 + 2))], roll: 5 * Math.sin(t * 4.5) }, expr: rx(X.focus, t, 11) })} />
        <Person w={sci(t)} />
      </Arcade>
    ),
    cam: mv("s17_last", C([0.45, 1.35, 1.45], [-0.45, 0.95, -0.3], 38), C([0.35, 1.3, 1.25], [-0.48, 0.95, -0.3], 36)),
  },
  s18_scientist: {
    scene: (t) => (
      <Arcade t={t} fill={[-0.6, 0.9, 0.1]}>
        <Pinball p={PIN} yaw={PIN_YAW} t={t} flip={Math.max(0, Math.sin(t * 9))} />
        <Person w={randy(t, 11, { pos: RANDY_PIN, yaw: Math.PI / 2 - 0.35, pose: idlePose(t, flipP, 1), expr: rx(X.focus, t, 11) })} />
        <Person w={sci(t, { yaw: 0.9, expr: live(X.smug, t, 7) })} />
      </Arcade>
    ),
    cam: mv("s18_scientist", C([-0.3, 1.15, 1.35], [-0.9, 0.95, -0.2], 36), C([-0.35, 1.1, 1.15], [-0.9, 0.95, -0.2], 34)),
  },
  s19_pinball: {
    scene: (t) => (
      <Arcade t={t} fill={[-0.5, 0.9, -0.2]}>
        <Pinball p={PIN} yaw={PIN_YAW} t={t} win={1} />
        <Person w={randy(t, 11, { pos: up(RANDY_PIN, hop(t, 3, 0.07)), yaw: 1.0 + 0.3 * Math.sin(t * 4.5), pose: dance(t), expr: tiredX(live(X.laugh, t, 1), 11) })} />
        <Person w={sci(t, { yaw: 0.9, pose: idlePose(t, POSES.headHands, 7), holdL: undefined, expr: live(X.shock, t, 7) })} />
      </Arcade>
    ),
    cam: mv("s19_pinball", C([0.2, 1.3, 1.75], [-0.55, 1.0, -0.3], 40), C([0.15, 1.28, 1.55], [-0.55, 1.0, -0.3], 38)),
  },
  // B7 "So how was his brain still working?"
  s20_how: {
    scene: (t) => <Arcade t={t} fill={[0, 0.9, -0.4]}><Person w={randy(t, 11, { pos: [0, 0, -0.4], pose: sway(idlePose(t, POSES.shrug, 1), t, 3, 7), expr: rx(X.dopey, t, 11) })} /></Arcade>,
    cam: mv("s20_how", C([0.2, 1.05, 1.1], [0, 0.95, -0.4], 34), C([0.1, 1.02, 0.8], [0, 0.95, -0.4], 30)),
  },
  s21_brain: {
    scene: (t) => {
      const k = popIn(t, EV.brain7 + 0.05, END + 9, 0.3);
      return (
        <Arcade t={t} fill={[0, 0.9, -0.4]}>
          <Person w={randy(t, 11, { pos: [0, 0, -0.4], pose: { ...idlePose(t, POSES.stand, 1), head: [-12, 0, 0] }, expr: tiredX({ ...X.stare, look: [0, -0.8] }, 11) })} />
          {k > 0.01 && <Brain p={[0, 1.55 + 0.05 * Math.sin(t * 3), -0.4]} s={0.32 * k} face={live({ ...X.worried }, t, 9)} />}
        </Arcade>
      );
    },
    cam: mv("s21_brain", C([0.15, 1.05, 1.5], [0, 1.2, -0.4], 38), C([0.1, 1.1, 1.3], [0, 1.25, -0.4], 36)),
  },
  // B8 "You see, scientists think his brain was cheating."
  s22_yousee: {
    scene: (t) => <BrainSet t={t} e={X.sly} />,
    cam: orb("s22_yousee", [0.12, 0.95, -0.2], -14, 6, 1.75, 1.55, 1.15, 1.05, 38),
  },
  s23_cheating: {
    scene: (t) => <BrainSet t={t} e={t > EV.cheating - 0.05 ? X.wink : X.sly} armR={out3(seg(t, EV.cheating, EV.cheating + 0.3)) * 0.5} />,
    cam: mv("s23_cheating", C([0.0, 1.1, 1.2], [-0.02, 1.0, -0.2], 34), C([0.0, 1.05, 1.0], [-0.02, 1.0, -0.2], 31)),
  },
  // B9 "It slipped into tiny naps, just seconds long, while his eyes stayed open."
  s24_naps: {
    scene: (t) => <BrainSet t={t} e={X.sly} armR={0.6 + 0.2 * Math.sin(t * 6)} dark={darkAt(t)} />,
    cam: mv("s24_naps", C([0.2, 1.15, 1.6], [0.12, 0.98, -0.2], 38), C([0.18, 1.1, 1.4], [0.12, 0.98, -0.2], 36)),
  },
  s25_seconds: {
    scene: (t) => <BrainSet t={t} e={X.wonder} armR={0.7 + 0.15 * Math.sin(t * 8)} dark={darkAt(t)} />,
    cam: mv("s25_seconds", C([0.55, 1.15, 1.05], [0.25, 0.98, -0.15], 34), C([0.5, 1.12, 0.9], [0.25, 0.98, -0.15], 32)),
  },
  s26_open: {
    scene: (t) => {
      const dk = darkAt(t);
      return (
        <Violet fill={[0, 0.9, -0.3]} dark={dk * 0.7}>
          <Person w={randy(t, 11, { pos: [0, 0, -0.3], pose: sway(idlePose(t, flipP, 1), t, 4, 5), expr: tiredX({ ...X.stare, look: [0, 0] }, 11) })} />
        </Violet>
      );
    },
    cam: mv("s26_open", C([0.0, 1.0, 1.15], [0, 0.95, -0.3], 36), C([0.0, 1.0, 0.9], [0, 0.97, -0.3], 32)),
    dom: Zs([0.18, 1.35, -0.3], 3, 80),
  },
  // B10 "They're called microsleeps, and you've probably had one in class."
  s27_micro: {
    scene: (t) => <BrainSet t={t} e={X.proud} armR={0.6} dark={darkAt(t)} />,
    cam: orb("s27_micro", [0.12, 0.95, -0.2], 16, 2, 1.7, 1.5, 1.2, 1.1, 38),
  },
  s28_class: {
    scene: (t) => {
      const nod = seg(t, EV.one10, EV.one10 + 0.22) * (1 - seg(t, EV.one10 + 0.4, EV.one10 + 0.5));
      const pupilE: Expr = nod > 0.5 ? X.asleep : t > EV.one10 + 0.4 ? X.shock : live(X.droopy, t, 13);
      return (
        <Classroom fill={[0.1, 0.8, 0.1]}>
          <mesh position={[0.1, 0.2, -0.05]} castShadow><boxGeometry args={[0.36, 0.4, 0.3]} /><Mat c="#7a5a3a" /></mesh>
          <Person w={{ look: LOOKS.pupil, pos: [0.1, 0.4 - 0.19, -0.05], yaw: 0, pose: { ...POSES.sit, armL: [10, 60, 70], armR: [10, 60, 70], head: [38 * nod, 0, 6 * nod] }, expr: pupilE }} />
          <Desk p={[0.1, 0, 0.0]} />
          <Person w={{ look: LOOKS.pupil2, pos: [-0.75, 0.21, -0.5], yaw: 0.15, pose: { ...POSES.sit, armL: [10, 60, 70], armR: [10, 60, 70] }, expr: live(X.neutral, t, 14) }} />
          <Desk p={[-0.75, 0, -0.45]} yaw={0.15} />
          <Person w={{ look: LOOKS.teacher, pos: [-1.0, 0, -1.35], yaw: 0.5, pose: idlePose(t, POSES.point, 15), expr: live(X.talk, t, 15) }} />
        </Classroom>
      );
    },
    cam: mv("s28_class", C([0.45, 1.15, 1.45], [-0.1, 0.75, -0.3], 38), C([0.4, 1.05, 1.2], [0.0, 0.75, -0.2], 34)),
  },
  // B11 "After eleven days, Randy slept fourteen hours and woke up fine."
  s29_eleven: {
    scene: (t) => <Den t={t} day={11} spin={3} flipT={EV.eleven11}><Person w={randy(t, 11, { pos: [0.1, 0, -0.75], pose: { ...sway(idlePose(t, POSES.cheer, 1), t, 5, 6), squash: 1 + 0.06 * Math.sin(Math.PI * seg(t, P(11), EV.randy11)) }, expr: tiredX(X.yawn, 11) })} /></Den>,
    cam: mv("s29_eleven", C([-0.2, 1.25, 1.35], [0.0, 1.15, -1.0], 38), C([-0.15, 1.2, 1.0], [0.05, 1.1, -1.0], 34)),
  },
  s30_slept: {
    scene: (t) => {
      // he flops straight back onto the pillow (a little bounce), then the blanket and the snoring
      const [t0] = span("s30_slept"), u = seg(t, t0, t0 + 0.38), f = u * u, bnc = Math.sin(Math.PI * seg(t, t0 + 0.38, t0 + 0.6)) * 4;
      return (
        <Den t={t} day={11} spin={14}>
          <Person w={randy(t, 11, { pos: [GARAGE.cot[0], 0.37, GARAGE.cot[2] + 0.62], tilt: [-84 * f + bnc, 0], pose: { ...mixPose(POSES.stand, POSES.lie, f), ground: false, hipY: lerp(0.36, 0.2, f), armL: [lerp(13, 60, f), 0, 8], armR: [lerp(13, 60, f), 0, 8] }, expr: f < 0.6 ? tiredX(X.yawn, 11) : X.asleep })} />
          {u >= 1 && <mesh position={[GARAGE.cot[0], 0.47 + 0.012 * Math.sin(t * 3), GARAGE.cot[2] + 0.28]} scale={[1, 1, 0.3 + 0.7 * out3(seg(t, t0 + 0.55, t0 + 0.85))]} castShadow><boxGeometry args={[0.66, 0.08, 0.66]} /><Mat c="#c8323c" r={0.9} /></mesh>}
        </Den>
      );
    },
    cam: mv("s30_slept", C([-1.2, 1.5, 0.7], [-1.72, 0.5, -0.75], 40), C([-1.3, 1.4, 0.5], [-1.72, 0.5, -0.75], 38)),
    dom: Zs([GARAGE.cot[0], 0.65, GARAGE.cot[2] - 0.45], 3, 90),
  },
  s31_fine: {
    scene: (t) => (
      <Den t={t} day={12} night={false} spin={0.05}>
        <Person w={randy(t, 1, { pos: up(RP, hop(t, 2.8, 0.1)), pose: dance(t), expr: live(X.laugh, t, 1) })} />
        <Person w={bruce(t, { pose: clap(t, 3), expr: live(X.happy, t, 3) })} />
        <Person w={joe(t, { pose: clap(t, 5), expr: live(X.laugh, t, 5) })} />
      </Den>
    ),
    cam: mv("s31_fine", C([0.0, 1.0, 2.2], [0, 0.78, -0.3], 38), C([0.0, 0.98, 1.95], [0, 0.78, -0.3], 36)),
  },
  // B12 "His record was so risky, Guinness stopped accepting new ones."
  s32_record: {
    scene: (t) => (
      <Stage fill={[0.55, 0.9, -0.2]}>
        <RecordBook p={[-0.28, 0, -0.25]} glow={0.6 + 0.3 * Math.sin(t * 4)} />
        <Person w={randy(t, 1, { pos: up([0.3, 0, 0.0], hop(t, 2, 0.03)), yaw: -0.4, pose: { ...idlePose(t, thumbs, 1), head: [0, 0, -6 + 8 * Math.sin(t * 5)] }, expr: live(X.proud, t, 1) })} />
      </Stage>
    ),
    cam: mv("s32_record", C([0.05, 1.45, 2.1], [0.02, 0.92, -0.2], 38), C([0.03, 1.4, 1.85], [0.02, 0.92, -0.2], 36)),
  },
  s33_stopped: {
    scene: (t) => {
      const down = out3(seg(t, EV.stopped - 0.18, EV.stopped)) * (1 - seg(t, EV.stopped + 0.25, EV.stopped + 0.5));
      const shut = io(seg(t, EV.accepting, EV.accepting + 0.4));
      return (
        <Stage fill={[0.55, 0.9, -0.2]}>
          <RecordBook p={[-0.28, 0, -0.25]} open={1 - shut} glow={0.3} />
          <Stamp p={[-0.18, 0.92, -0.15]} down={down} />
          <Person w={randy(t, 1, { pos: [0.3, 0.12 * Math.sin(Math.PI * seg(t, EV.stopped, EV.stopped + 0.3)), 0.0], yaw: -0.5, pose: idlePose(t, t > EV.stopped ? POSES.headHands : thumbs, 1), expr: live(t > EV.stopped ? X.shock : X.proud, t, 1) })} />
        </Stage>
      );
    },
    cam: mv("s33_stopped", C([0.05, 1.4, 2.05], [0.02, 0.92, -0.2], 38), C([0.03, 1.35, 1.8], [0.02, 0.92, -0.2], 36)),
  },
  // B13 "So no one can officially beat the time..."
  s34_noone: {
    scene: (t) => (
      <Stage fill={[0.45, 0.9, -0.2]}>
        <RecordBook p={[-0.28, 0, -0.25]} open={0} />
        <Person w={randy(t, 1, { pos: [0.3, 0, 0.0], yaw: -0.3, pose: sway(idlePose(t, { ...POSES.stand, armL: [40, 60, 120], armR: [40, 60, 120] }, 1), t, 6, 3), expr: live(t > EV.officially ? X.wink : X.smug, t, 1) })} />
      </Stage>
    ),
    cam: orb("s34_noone", [0.02, 0.9, -0.15], 16, -4, 2.05, 1.8, 1.15, 1.05, 38),
  },
  s35_loop: { scene: (t) => loopScene(t - END, t), cam: (t) => loopCam(t - END), still: true },
};

export const SHOTS: Shot[] = CUTS.map(([id, t0, enter], i) => {
  const d = DEFS[id];
  if (!d) throw new Error("no shot def " + id);
  return { id, t0, t1: i + 1 < CUTS.length ? CUTS[i + 1][1] : END, enter, ...d };
});
/** Randy's eyes can't focus: the blur (px) on the picture in s10. */
export const focusBlur = (t: number) => { const [a, b] = span("s10_focus"); return t >= a && t < b ? 4 + 4 * Math.abs(Math.sin((t - a) * 4)) : 0; };
void P; void D;

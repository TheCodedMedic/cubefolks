// Short 1 "Clever Hans" (Beanfolk 3D): the 52 set-ups. Every time comes from timing.ts (measured words).
// World: Hans at the origin facing +x (his head turned toward the crowd on the +z side), the easel at (1.9, 0, -0.75),
// von Osten's spot at (2.55, 0, -0.25) facing the crowd, the crowd in an arc around (0.8, 0, 0) on the +z side.
import React from "react";
import * as THREE from "three";
import { CamS, io, lerp, nz, orbit, seg, Shot, V3, c01, out3 } from "../kit/core";
import { project } from "../kit/Pop";
import { EXPR, Expr, exprAt, liveFace } from "../bean/Face";
import { along, idlePose, mixPose, Pose, POSES, walkPose } from "./Bean";
import { Bowler, Chalk, Clipboard, Hans, HansS, LOOKS, Magnifier, MiniBean, Notebook, OstenExtras, Person, Pointer, Slate, tapLift, Who } from "./cast";
import { Courtyard, Grade, Room, ROOM, Study, STUDY } from "./sets";
import { at, CUTS, END, EV, P, PE, span, TAPS } from "./timing";
import { Arrow, Bulb, Paper, Scan, TapCounter, TensionMeter } from "./overlays";

const HY = Math.PI / 2;
const D = Math.PI / 180;
const HEAD: V3 = [0.64, 1.45, 0.1]; // Hans's head (looking at the crowd)
const HOOF: V3 = [0.3, 0.05, 0.13]; // the tapping hoof
const OSTEN: V3 = [2.55, 0, -0.25], OSTEN_YAW = -0.9;
const CC: V3 = [0.8, 0, 0]; // crowd centre
const arcPos = (deg: number, r: number): V3 => [CC[0] + Math.sin(deg * D) * r, 0, CC[2] + Math.cos(deg * D) * r];
const arcYaw = (deg: number) => deg * D + Math.PI;
const FRONT = [-38, -13, 13, 38];
const BACK = [-54, -36, -18, 0, 18, 36, 54];

// ---------- expressions ----------
const X: Record<string, Expr> = {
  ...EXPR,
  tense: { eyes: "wide", brows: "worried", mouth: "gritted", extras: ["sweat"], look: [0, 0.35] } as Expr,
  relax: { eyes: "happy", brows: "raised", mouth: "smile" } as Expr,
  groan: { eyes: "half", brows: "sad", mouth: "frown" } as Expr,
  watch: { eyes: "open", brows: "raised", mouth: "small", look: [0, 0.25] } as Expr,
  eyeroll: { eyes: "open", brows: "oneUp", mouth: "flat", look: [0.3, -1] } as Expr,
  proud: { eyes: "happy", brows: "raised", mouth: "smile", extras: ["sparkles"] } as Expr,
  blank: { eyes: "open", brows: "worried", mouth: "wobbly", look: [0, -0.6] } as Expr,
  sideeye: { eyes: "half", brows: "angry", mouth: "flat", look: [0.8, 0] } as Expr,
  sly: { eyes: "smug", brows: "oneUp", mouth: "smirk", look: [0.7, 0.1] } as Expr,
  think: { eyes: "open", brows: "worried", mouth: "pout", extras: ["sweat"], look: [-0.5, -0.7] } as Expr,
};

// ---------- Hans ----------
const hans = (t: number, o: Partial<HansS> = {}, taps: number[] = []): HansS => ({
  breathe: Math.sin(t * 2.1), tail: Math.sin(t * 1.6) * 0.7, ears: 0.3 + 0.25 * Math.sin(t * 0.8 + 1),
  neck: [0, -25], head: [0, -30, 0], expr: X.smug, tap: tapLift(t, taps), ...o,
});
const live = (e: Expr, t: number, seed: number, talk?: [number, number][]) => liveFace(e, t, { seed, talk });
const H: React.FC<{ s: HansS; t: number }> = ({ s, t }) => <Hans yaw={HY} s={{ ...s, expr: live(s.expr ?? X.smug, t, 7) }} />;

/** Dust puffs at the hoof on each tap contact. */
const Dust: React.FC<{ t: number; taps: number[]; at?: V3 }> = ({ t, taps, at: p = HOOF }) => {
  const k = taps.filter((x) => t >= x && t < x + 0.35).pop();
  if (k === undefined) return null;
  const u = (t - k) / 0.35;
  return (
    <group position={[p[0], 0.02, p[2]]}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        return <mesh key={i} position={[Math.cos(a) * (0.05 + 0.16 * u), 0.03 + 0.05 * u, Math.sin(a) * (0.05 + 0.16 * u)]} scale={0.025 + 0.03 * u}>
          <sphereGeometry args={[1, 8, 6]} /><meshStandardMaterial color="#d8c8a8" transparent opacity={0.85 * (1 - u)} roughness={1} />
        </mesh>;
      })}
    </group>
  );
};

// ---------- people ----------
const OSTEN_W = (t: number, o: Partial<Who> = {}): Who => ({ look: LOOKS.osten, pos: OSTEN, yaw: OSTEN_YAW, pose: idlePose(t, POSES.stand, 1), expr: live(X.happy, t, 3), headExtra: <OstenExtras />, ...o });
const cheerPose = (t: number, seed: number): Pose => mixPose(POSES.cheer, POSES.stand, 0.5 + 0.5 * Math.sin(t * 9 + seed * 2));
const clapPose = (t: number, seed: number): Pose => { const c = Math.abs(Math.sin(t * 10 + seed)); return { ...POSES.stand, armL: [20, 70, 40 + 30 * c], armR: [20, 70, 40 + 30 * c] }; };
const thinkPose: Pose = { ...POSES.stand, armR: [118, 30, 140], head: [0, 0, 8] };
const holdUp: Pose = { ...POSES.stand, armR: [25, 95, 30] };

type Mood = "neutral" | "happy" | "cheer" | "tense" | "relax" | "shock" | "watch" | "groan" | "laugh" | "lift";
const FRONT_LOOKS = [LOOKS.theo, LOOKS.june, LOOKS.mabel, LOOKS.hollis];
const MINI = [
  { body: "#4a5f8a", skin: 0, hair: "#6b4a2b", hat: "#3a2a22" }, { body: "#7a3e34", skin: 5, hair: "#1e1410" }, { body: "#3f6b52", skin: 2, hair: "#c0662f" },
  { body: "#c8a040", skin: 7, hair: "#1e1410", hat: "#2a2420" }, { body: "#6a4a7a", skin: 3, hair: "#2a1d16" }, { body: "#2f5d8a", skin: 1, hair: "#e0b050" }, { body: "#a05a3a", skin: 6, hair: "#1e1410", hat: "#4a3a2a" },
];
const moodExpr = (m: Mood, i: number): Expr => ({
  neutral: X.watch, happy: X.happy, cheer: i % 2 ? X.laugh : X.happy, tense: X.tense, relax: X.relax, shock: X.shock, watch: X.watch, groan: X.groan, laugh: X.laugh, lift: X.relax,
}[m]);
/** The crowd: 4 full beans in front, 7 low-detail beans behind. `skip` hides front-row people (by index). */
const Crowd: React.FC<{ t: number; mood: Mood; skip?: number[]; back?: boolean; tension?: number; lift?: number; only?: number[] }> = ({ t, mood, skip = [], back = true, tension = 0, lift = 0, only }) => (
  <>
    {FRONT.map((a, i) => {
      if (skip.includes(i) || (only && !only.includes(i))) return null;
      const base = mood === "cheer" ? cheerPose(t, i) : mood === "happy" || mood === "laugh" ? clapPose(t, i) : idlePose(t, POSES.stand, i);
      const lean = tension * 7, pitch = tension * 12 - lift * 6;
      const pose: Pose = { ...base, lean: (base.lean ?? 0) + lean, head: [(base.head?.[0] ?? 0) + pitch, 0, 0] };
      return <Person key={i} w={{ look: FRONT_LOOKS[i], pos: arcPos(a, 2.45), yaw: arcYaw(a), pose, expr: live(moodExpr(mood, i), t, 11 + i), headExtra: i === 3 ? <Bowler /> : undefined }} />;
    })}
    {back && BACK.map((a, i) => (
      <MiniBean key={i} pos={arcPos(a, 3.35)} yaw={arcYaw(a)} {...MINI[i]} expr={moodExpr(mood, i + 1)} lean={tension * 6} lift={-tension * 10 + lift * 6 + (mood === "cheer" ? 8 * Math.max(0, Math.sin(t * 9 + i)) : 0)} />
    ))}
  </>
);

// ---------- scene builders ----------
type CourtO = { g?: Grade; board?: string[]; hans?: HansS | null; osten?: Who | null; crowd?: React.ReactNode; extra?: React.ReactNode; spot?: V3; aim?: V3; taps?: number[] };
const court = (t: number, o: CourtO) => (
  <Courtyard g={o.g} board={o.board} spot={o.spot} aim={o.aim}>
    {o.hans !== null && <H t={t} s={o.hans ?? hans(t)} />}
    {o.osten !== null && <Person w={o.osten ?? OSTEN_W(t)} />}
    {o.crowd}
    {o.taps && <Dust t={t} taps={o.taps} />}
    {o.extra}
  </Courtyard>
);
const SCI = (k: 1 | 2 | 3) => (k === 1 ? LOOKS.sci1 : k === 2 ? LOOKS.sci2 : LOOKS.sci3);

// ---------- cameras ----------
const FOVK = 1.35; // the vertical frame needs wider lenses than first framed
const C = (pos: V3, target: V3, fov = 40): CamS => ({ pos, target, fov: fov * FOVK });
/** A move from a to b over the shot (eased), with a little hand-held life. */
const mv = (id: string, a: CamS, b: CamS) => (t: number): CamS => {
  const [t0, t1] = span(id), u = io(seg(t, t0, t1));
  const L = (p: V3, q: V3): V3 => [lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)];
  return { pos: L(a.pos, b.pos), target: L(a.target, b.target), fov: lerp(a.fov, b.fov, u), roll: lerp(a.roll ?? 0, b.roll ?? 0, u) };
};
const orb = (id: string, c: V3, a0: number, a1: number, r0: number, r1: number, y0: number, y1: number, fov = 38, ty = c[1]) => (t: number): CamS => {
  const [t0, t1] = span(id), u = io(seg(t, t0, t1));
  return { pos: orbit(c, lerp(a0, a1, u), lerp(r0, r1, u), lerp(y0, y1, u)), target: [c[0], ty, c[2]], fov: fov * FOVK };
};

/** The loop camera: one continuous orbit-and-push that runs through the last shot and on into the first. u = t - END
 *  in the last shot and u = t in the first, so the last frame flows straight into frame 0. */
const LOOP_C: V3 = [0.7, 1.0, 0.1];
const loopCam = (u: number): CamS => ({ pos: orbit(LOOP_C, -30 + 10 * u, 4.4 - 0.45 * u, 2.7 - 0.25 * u), target: [LOOP_C[0], 1.05 + 0.03 * u, LOOP_C[2]], fov: 50 });
/** The loop scene state (same function of u on both sides of the seam). */
const loopScene = (u: number, tFace: number, pops = false) => {
  const taps = u > 0 ? TAPS.hook : [];
  return court(tFace, {
    board: ["2 + 3 = ?"],
    hans: hans(u + 100, { expr: u > 0.9 ? X.happy : X.smug, tap: tapLift(u, taps) }),
    crowd: <Crowd t={u + 100} mood="cheer" />, taps,
  });
};

// ---------- the shots ----------
type Def = Omit<Shot, "t0" | "t1" | "enter" | "id">;
const DEFS: Record<string, Def> = {
  // B1 "In 1904, a horse in Berlin could do math better than most schoolchildren."
  s01_hook: { scene: (t) => loopScene(t, t), cam: (t) => loopCam(t), still: true },
  s02_hans: {
    scene: (t) => court(t, { hans: hans(t, { expr: exprAt([[0, X.smug], [at(1, "could"), X.proud]], t), mouth: t > at(1, "could") ? "grin" : "smirk" }, TAPS.hook), taps: TAPS.hook, crowd: <Crowd t={t} mood="happy" /> }),
    cam: mv("s02_hans", C([2.0, 0.95, 1.95], [0.6, 1.3, 0.1], 38), C([1.6, 1.1, 1.5], [0.62, 1.38, 0.1], 34)),
  },
  s03_kids: {
    scene: (t) => court(t, {
      osten: null, hans: hans(t, { expr: X.sly, neck: [0, -10], head: [0, -50, 0] }),
      extra: <>
        <Person w={{ look: LOOKS.kid1, pos: [-3.0, 0, 2.0], yaw: 0.25, scale: 0.8, pose: thinkPose, expr: live(X.think, t, 21) }} />
        <Person w={{ look: LOOKS.kid2, pos: [-2.5, 0, 2.15], yaw: 0, scale: 0.8, pose: { ...POSES.stand, armR: [12, 40, 60] }, hold: <Slate text="2+2=5" />, expr: live(X.worried, t, 22) }} />
        <Person w={{ look: LOOKS.kid3, pos: [-2.0, 0, 2.0], yaw: -0.25, scale: 0.8, pose: t > EV.school ? POSES.headHands : POSES.shrug, expr: live(t > EV.school ? X.sad : X.shock, t, 23) }} />
      </>,
    }),
    cam: mv("s03_kids", C([-2.2, 1.05, 4.6], [-2.5, 0.7, 2.0], 40), C([-2.3, 0.95, 4.2], [-2.45, 0.68, 2.0], 38)),
  },
  // B2 "His name was Hans, and he answered by tapping his hoof."
  s04_name: {
    scene: (t) => court(t, { hans: hans(t, { expr: exprAt([[0, X.happy], [EV.hansName, X.proud]], t), mouth: "grin", head: [-12 * Math.sin(Math.PI * seg(t, EV.hansName - 0.1, EV.hansName + 0.5)), -30, 0] }), crowd: <Crowd t={t} mood="happy" /> }),
    cam: orb("s04_name", [0.64, 1.38, 0.1], 25, 62, 1.7, 1.45, 1.55, 1.5, 36),
  },
  s05_hoof: {
    scene: (t) => court(t, { hans: hans(t, { expr: X.smug }, TAPS.hoof), taps: TAPS.hoof, crowd: <Crowd t={t} mood="watch" /> }),
    cam: mv("s05_hoof", C([1.05, 0.28, 1.2], [0.3, 0.25, 0.1], 40), C([0.85, 0.22, 0.95], [0.3, 0.22, 0.12], 36)),
  },
  // B3 "Two plus three? Five taps."
  s06_board: {
    scene: (t) => court(t, { board: ["2 + 3 = ?"], osten: OSTEN_W(t, { pose: POSES.point, hold: undefined, expr: live(X.happy, t, 3, [[PS3(), EV.two + 0.9]]) }), crowd: <Crowd t={t} mood="watch" /> }),
    cam: mv("s06_board", C([1.6, 1.4, 2.6], [2.3, 1.05, -0.45], 40), C([1.8, 1.32, 2.25], [2.35, 1.05, -0.45], 37)),
  },
  s07_five: {
    scene: (t) => court(t, { board: ["2 + 3 = ?"], hans: hans(t, { expr: X.sly }, TAPS.five), taps: TAPS.five, crowd: <Crowd t={t} mood="watch" /> }),
    cam: mv("s07_five", C([-0.05, 1.15, 2.1], [0.2, 0.85, 0], 46), C([0.2, 1.08, 1.9], [0.25, 0.85, 0], 44)),
    dom: (t) => <TapCounter t={t} taps={TAPS.five} y={0.2} />,
  },
  // B4 "The square root of sixteen? Four taps, and a proud little snort."
  s08_root: {
    scene: (t) => court(t, { board: ["√16 = ?"], osten: OSTEN_W(t, { pose: POSES.point, expr: live(X.happy, t, 3, [[P(4), EV.root + 0.5]]) }), crowd: <Crowd t={t} mood="watch" tension={0.3} /> }),
    cam: mv("s08_root", C([2.5, 0.85, 1.9], [2.0, 1.2, -0.6], 40), C([2.35, 1.0, 1.45], [2.0, 1.22, -0.6], 36)),
  },
  s09_four: {
    scene: (t) => court(t, { board: ["√16 = ?"], hans: hans(t, { expr: X.sly }, TAPS.four), taps: TAPS.four, crowd: <Crowd t={t} mood="watch" /> }),
    cam: mv("s09_four", C([2.2, 0.75, 1.75], [0.45, 0.85, 0.1], 42), C([1.95, 0.8, 1.5], [0.45, 0.88, 0.1], 40)),
    dom: (t) => <TapCounter t={t} taps={TAPS.four} y={0.2} />,
  },
  s10_snort: {
    scene: (t) => court(t, {
      board: ["√16 = 4"],
      hans: hans(t, { expr: exprAt([[0, X.proud], [EV.snort, X.smug]], t), mouth: t >= EV.snort ? "snort" : "smile", head: [-14 * out3(seg(t, EV.proud - 0.2, EV.proud + 0.3)), -30, 0], puff: seg(t, EV.snort, EV.snort + 0.55) }),
      crowd: <Crowd t={t} mood={t > EV.snort ? "laugh" : "happy"} />,
    }),
    cam: mv("s10_snort", C([1.45, 1.55, 1.25], [0.68, 1.38, 0.12], 32), C([1.28, 1.5, 1.05], [0.68, 1.4, 0.12], 30)),
  },
  // B5 "His owner, a retired math teacher, swore he had taught him everything himself."
  s11_owner: {
    scene: (t) => court(t, { board: ["√16 = 4"], osten: OSTEN_W(t, { pose: POSES.wave, expr: live(X.happy, t, 3) }), crowd: <Crowd t={t} mood="happy" /> }),
    cam: mv("s11_owner", C([1.85, 1.25, 1.55], [2.55, 0.9, -0.25], 36), C([2.05, 1.12, 1.2], [2.55, 0.95, -0.25], 32)),
  },
  s12_teacher: {
    scene: (t) => court(t, {
      board: ["1 + 1 = 2", "2 + 2 = 4", "3 × 3 = 9"],
      hans: hans(t, { expr: X.watch, neck: [0, 5], head: [5, 25, 0] }),
      osten: OSTEN_W(t, { pose: { ...POSES.point, armR: [70, 30, 0] }, hold: <Pointer />, expr: live({ ...X.happy, eyes: "open", mouth: "smile" }, t, 3, [[EV.retired, EV.swore - 0.2]]) }),
      crowd: <Crowd t={t} mood="watch" />,
    }),
    cam: mv("s12_teacher", C([-0.7, 1.85, 1.5], [2.1, 1.1, -0.5], 38), C([-0.35, 1.75, 1.25], [2.15, 1.1, -0.5], 36)),
  },
  s13_swore: {
    scene: (t) => court(t, {
      board: ["1 + 1 = 2", "2 + 2 = 4", "3 × 3 = 9"],
      osten: OSTEN_W(t, { pose: { ...POSES.stand, armR: [150, 6, 12], armL: [20, 60, 125], head: [-6, 0, 0] }, expr: live(X.proud, t, 3) }),
      crowd: <Crowd t={t} mood="watch" />,
    }),
    cam: orb("s13_swore", [2.55, 1.0, -0.25], -66, -36, 1.9, 1.6, 1.15, 1.1, 34),
  },
  // B6 "Scientists rolled their eyes and came to expose the trick."
  s14_eyeroll: {
    scene: (t) => (
      <Room>
        {[1, 2, 3].map((k) => {
          const e = t >= EV.rolled ? X.eyeroll : X.suspicious;
          return <Person key={k} w={{ look: SCI(k as 1 | 2 | 3), pos: [(k - 2) * 0.62, 0, -1.3], yaw: (2 - k) * 0.15, pose: k === 2 ? { ...POSES.stand, armL: [30, 50, 100], armR: [30, 50, 100] } : idlePose(t, POSES.stand, k), expr: live(e, t, 30 + k), hold: k === 1 ? <Clipboard /> : undefined }} />;
        })}
      </Room>
    ),
    cam: mv("s14_eyeroll", C([40.2, 1.45, 1.9], [40, 0.95, -1.2], 40), C([40.05, 1.35, 1.5], [40, 0.97, -1.2], 38)),
  },
  s15_march: {
    scene: (t) => court(t, {
      hans: null, osten: null,
      extra: [1, 2, 3].map((k) => {
        const [t0] = span("s15_march");
        const w = along([[4.0 + (k - 2) * 0.45, -4.6 - (k === 2 ? 0.35 : 0)], [3.4 + (k - 2) * 0.45, -1.8 - (k === 2 ? 0.35 : 0)]], t, t0 - 0.4, 1.0);
        return <Person key={k} w={{ look: SCI(k as 1 | 2 | 3), pos: [w.pos[0], 0, w.pos[1]], yaw: w.yaw, pose: k === 1 ? { ...w.pose, armR: [25, 70, 40] } : w.pose, expr: live(t > EV.trick ? X.angry : X.suspicious, t, 30 + k), hold: k === 1 ? <Magnifier /> : k === 3 ? <Clipboard /> : undefined }} />;
      }),
    }),
    cam: mv("s15_march", C([4.6, 1.0, -0.5], [3.8, 0.9, -3.4], 40), C([4.5, 1.0, -0.8], [3.75, 0.9, -3.2], 38)),
  },
  // B7 "They searched for hidden signals, secret helpers, anything at all."
  s16_signals: {
    scene: (t) => court(t, {
      osten: null, hans: hans(t, { expr: X.sideeye, mouth: "flat" }),
      extra: <Person w={{ look: LOOKS.sci1, pos: [1.12, 0, 0.72], yaw: -2.53, pose: { ...POSES.stand, armR: [20, 112, 10], head: [-14, 0, 0], lean: 4 }, hold: <Magnifier />, holdL: <Clipboard />, expr: live(X.suspicious, t, 31) }} />,
      crowd: <Crowd t={t} mood="watch" />,
    }),
    cam: mv("s16_signals", C([2.05, 1.35, 0.1], [0.9, 1.25, 0.42], 36), C([1.88, 1.33, 0.22], [0.9, 1.25, 0.42], 34)),
  },
  s17_helpers: {
    scene: (t) => court(t, {
      osten: null, hans: hans(t, { expr: X.sideeye, neck: [0, -45], head: [0, -40, 0] }),
      extra: <Person w={{ look: LOOKS.sci2, pos: [-1.9, 0, -1.75], yaw: 0.59, pose: { ...POSES.stand, lean: 22, armR: [20, 80, 30], head: [14, 0, 0] }, hold: <Magnifier />, expr: live(X.suspicious, t, 32) }} />,
    }),
    cam: mv("s17_helpers", C([-0.75, 1.05, -0.05], [-2.0, 0.65, -1.85], 40), C([-0.95, 0.95, -0.35], [-2.0, 0.65, -1.85], 38)),
  },
  s18_anything: {
    scene: (t) => court(t, {
      osten: null, hans: hans(t, { expr: { ...X.sideeye, look: [0, 0.8] }, neck: [12, -10], head: [25, -20, 0] }),
      extra: <>
        <Person w={{ look: LOOKS.sci3, pos: [0.15, 0, 0.62], yaw: Math.PI, pose: { legL: [60, 100], legR: [55, 95], armL: [20, 60, 30], armR: [20, 95, 20], lean: 45, head: [30, 0, 0] }, hold: <Magnifier />, expr: live(X.suspicious, t, 33) }} />
        <Person w={{ look: LOOKS.sci1, pos: [-0.9, 0, 0.9], yaw: 2.6, pose: { ...POSES.stand, lean: 20, armR: [20, 60, 10], head: [25, 0, 0] }, hold: <Magnifier />, expr: live(X.suspicious, t, 31) }} />
      </>,
    }),
    cam: mv("s18_anything", C([0.05, 0.55, -1.7], [0.15, 0.55, 0.5], 44), C([0.12, 0.5, -1.4], [0.15, 0.55, 0.5], 42)),
  },
  // B8 "Nothing."
  s19_nothing: {
    scene: (t) => (
      <Room stamp={t >= EV.nothing}>
        {[1, 2, 3].map((k) => <Person key={k} w={{ look: SCI(k as 1 | 2 | 3), pos: [(k - 2) * 0.62, 0, -1.3], yaw: (2 - k) * 0.15, pose: t >= EV.nothing ? POSES.shrug : POSES.stand, expr: live(t >= EV.nothing ? X.shock : X.suspicious, t, 30 + k) }} />)}
      </Room>
    ),
    cam: mv("s19_nothing", C([40.12, 1.85, 0.75], [40.1, 0.8, -0.75], 40), C([40.12, 1.7, 0.5], [40.1, 0.82, -0.8], 38)),
  },
  // B9 "They sent the owner away and let strangers ask the questions."
  s20_away: {
    scene: (t) => {
      const [t0] = span("s20_away");
      const w = along([[2.4, -1.0], [3.8, -4.3]], t, t0, 0.95);
      return court(t, {
        osten: OSTEN_W(t, { pos: [w.pos[0], 0, w.pos[1]], yaw: w.yaw, pose: w.pose, expr: live(X.sad, t, 3) }),
        hans: hans(t, { expr: X.worried, neck: [0, 10], head: [0, 30, 0] }),
        extra: <Person w={{ look: LOOKS.sci1, pos: [1.9, 0, 0.5], yaw: 0.2, pose: POSES.point, hold: <Clipboard />, expr: live(X.angry, t, 31) }} />,
        crowd: <Crowd t={t} mood="shock" />,
      });
    },
    cam: (t) => { const [t0, t1] = span("s20_away"), w = along([[2.4, -1.0], [3.8, -4.3]], t, t0, 0.95), u = io(seg(t, t0, t1)); return C([lerp(3.9, 4.1, u), 1.35, lerp(1.2, 0.8, u)], [w.pos[0], 0.85, w.pos[1]], 40); },
  },
  s21_strangers: {
    scene: (t) => {
      const [t0] = span("s21_strangers");
      const q = [LOOKS.june, LOOKS.theo, LOOKS.mabel];
      return court(t, {
        osten: null, board: ["7 − 3 = ?"],
        extra: q.map((lk, i) => {
          const w = along([[0.8 + i * 0.55, 2.3 + i * 0.25], [2.2 + i * 0.55, 0.4 + i * 0.5]], t, t0 - 0.2, 0.9);
          return <Person key={i} w={{ look: lk, pos: [w.pos[0], 0, w.pos[1]], yaw: w.yaw, pose: w.pose, expr: live(X.happy, t, 40 + i) }} />;
        }),
        crowd: <Crowd t={t} mood="watch" skip={[0, 1, 2, 3]} />,
      });
    },
    cam: mv("s21_strangers", C([3.5, 1.25, 2.7], [1.4, 0.85, 1.6], 44), C([3.4, 1.2, 2.4], [1.7, 0.85, 1.2], 42)),
  },
  s22_ask: {
    scene: (t) => court(t, {
      board: ["7 − 3 = ?"],
      osten: { look: LOOKS.june, pos: OSTEN, yaw: OSTEN_YAW, pose: POSES.point, expr: live(X.happy, t, 40, [[at(9, "ask"), PE(9)]]) },
      hans: hans(t, { expr: X.sly }),
      extra: <Person w={{ look: LOOKS.sci2, pos: [3.2, 0, 0.9], yaw: -2.0, hold: <Clipboard />, pose: holdUp, expr: live(X.suspicious, t, 32) }} />,
      crowd: <Crowd t={t} mood="watch" skip={[1]} />,
    }),
    cam: mv("s22_ask", C([1.7, 1.3, 2.4], [2.35, 1.0, -0.35], 40), C([1.95, 1.25, 2.05], [2.4, 1.0, -0.35], 38)),
  },
  // B10 "Hans still got them right."
  s23_right: {
    scene: (t) => court(t, {
      board: ["7 − 3 = 4"],
      osten: { look: LOOKS.june, pos: OSTEN, yaw: OSTEN_YAW, pose: t > EV.right ? POSES.cheer : POSES.stand, expr: live(t > EV.right ? X.happy : X.watch, t, 40) },
      hans: hans(t, { expr: t > EV.right ? X.proud : X.sly }, TAPS.right), taps: TAPS.right,
      extra: <>
        <Person w={{ look: LOOKS.sci2, pos: [3.2, 0, 0.9], yaw: -2.0, hold: <Clipboard />, pose: holdUp, expr: live(t > EV.right ? X.shock : X.suspicious, t, 32) }} />
        <Person w={{ look: LOOKS.sci3, pos: [-1.2, 0, 1.2], yaw: 2.2, pose: t > EV.right ? POSES.headHands : POSES.stand, expr: live(t > EV.right ? X.shock : X.suspicious, t, 33) }} />
      </>,
      crowd: <Crowd t={t} mood={t > EV.right ? "cheer" : "watch"} skip={[1]} />,
    }),
    cam: mv("s23_right", C([0.05, 1.65, 3.45], [0.95, 0.9, 0], 46), C([0.4, 1.5, 3.05], [0.95, 0.9, 0], 44)),
    dom: (t) => <TapCounter t={t} taps={TAPS.right} y={0.2} color="#7fe08a" />,
  },
  // B11 "Meanwhile, a young student named Oskar noticed something strange."
  s24_meanwhile: {
    scene: (t) => court(t, {
      extra: <Person w={{ look: LOOKS.oskar, pos: [-4.2, 0, 1.25], yaw: 1.81, pose: { ...POSES.stand, armR: [12, 40, 60], roll: -4 }, hold: <Notebook />, expr: live(X.suspicious, t, 50) }} />,
      crowd: <Crowd t={t} mood="happy" />,
    }),
    cam: mv("s24_meanwhile", C([-2.75, 1.3, 1.55], [-4.2, 1.0, 1.2], 38), C([-3.0, 1.2, 1.5], [-4.2, 1.0, 1.2], 34)),
  },
  s25_oskar: {
    scene: (t) => (
      <Study>
        <Person w={{ look: LOOKS.oskar, pos: [0, 0, -0.55], yaw: 0.25, pose: { ...POSES.stand, armR: [12, 40, 60], armL: [12, 30, 70] }, hold: <Notebook />, holdL: <Chalk />, expr: live(X.suspicious, t, 50) }} />
      </Study>
    ),
    cam: mv("s25_oskar", C([80.55, 1.35, 1.45], [79.9, 1.2, -0.8], 42), C([80.45, 1.25, 1.0], [79.95, 1.15, -0.8], 38)),
  },
  s26_noticed: {
    scene: (t) => (
      <Study>
        <Person w={{ look: LOOKS.oskar, pos: [0, 0, -0.55], yaw: 0.25, pose: { ...POSES.stand, armR: [12, 40, 60], head: [0, t > EV.strange ? 0 : 10, 0] }, hold: <Notebook />, expr: live(t > EV.strange ? X.shock : X.suspicious, t, 50) }} />
      </Study>
    ),
    cam: orb("s26_noticed", [80, 0.97, -0.55], 5, 28, 1.15, 0.95, 1.05, 1.02, 32),
  },
  // B12 "When the person asking didn't know the answer, Hans got it wrong."
  s27_asker: {
    scene: (t) => court(t, {
      board: ["17 × 3 = ?"],
      osten: { look: LOOKS.hollis, pos: OSTEN, yaw: OSTEN_YAW, pose: thinkPose, expr: live(X.think, t, 43), headExtra: <Bowler /> },
      crowd: <Crowd t={t} mood="watch" skip={[3]} />,
    }),
    cam: mv("s27_asker", C([1.55, 1.25, 1.45], [2.4, 1.0, -0.35], 38), C([1.8, 1.18, 1.05], [2.45, 1.0, -0.3], 34)),
  },
  s28_shrug: {
    scene: (t) => court(t, {
      board: ["17 × 3 = ?"],
      osten: { look: LOOKS.hollis, pos: OSTEN, yaw: OSTEN_YAW, pose: t > EV.answer ? POSES.shrug : thinkPose, expr: live(t > EV.answer ? { ...X.shy, extras: ["sweat"] } : X.think, t, 43), headExtra: <Bowler /> },
      hans: hans(t, { expr: { ...X.worried, look: [0.6, 0] }, neck: [0, -5], head: [0, 20, 6] }),
      extra: <Person w={{ look: LOOKS.oskar, pos: [3.4, 0, 1.4], yaw: -2.3, pose: holdUp, hold: <Notebook />, expr: live(X.suspicious, t, 50) }} />,
      crowd: <Crowd t={t} mood="watch" skip={[3]} />,
    }),
    cam: mv("s28_shrug", C([0.2, 1.35, 2.3], [1.6, 1.15, -0.1], 40), C([0.45, 1.3, 2.0], [1.65, 1.15, -0.1], 38)),
  },
  s29_wrong: {
    scene: (t) => court(t, {
      board: ["17 × 3 = ?"],
      osten: { look: LOOKS.hollis, pos: OSTEN, yaw: OSTEN_YAW, pose: POSES.shrug, expr: live(X.shy, t, 43), headExtra: <Bowler /> },
      hans: hans(t, { expr: t > EV.wrong ? X.shock : X.worried, mouth: t > EV.wrong ? "o" : "wobbly" }, TAPS.wrong), taps: TAPS.wrong,
      crowd: <Crowd t={t} mood={t > EV.wrong ? "groan" : "watch"} skip={[3]} />,
    }),
    cam: mv("s29_wrong", C([2.0, 1.05, 2.1], [0.4, 0.9, 0.1], 42), C([1.8, 1.05, 1.85], [0.4, 0.92, 0.1], 40)),
    dom: (t) => <TapCounter t={t} taps={TAPS.wrong} y={0.2} wrongAfter={EV.wrong} />,
  },
  // B13 "And when Hans wore blinders, his genius vanished completely."
  s30_blinders: {
    scene: (t) => court(t, {
      osten: null,
      hans: hans(t, { expr: t > EV.blinders ? X.worried : X.watch, blinders: t > EV.blinders, neck: [0, -15], head: [0, -20, 0] }),
      extra: <Person w={{ look: LOOKS.oskar, pos: [1.25, 0, 0.5], yaw: -2.3, pose: { ...POSES.stand, armL: [70, 70, 30], armR: [70, 70, 30], head: [-12, 0, 0] }, expr: live(X.happy, t, 50) }} />,
      crowd: <Crowd t={t} mood="watch" />,
    }),
    cam: mv("s30_blinders", C([1.55, 1.62, 1.45], [0.7, 1.38, 0.15], 36), C([1.4, 1.58, 1.25], [0.7, 1.38, 0.15], 32)),
  },
  s31_vanish: {
    scene: (t) => court(t, {
      osten: null, board: ["2 + 3 = ?"],
      hans: hans(t, { expr: t > EV.vanished ? X.blank : X.worried, mouth: t > EV.vanished ? "wobbly" : "flat", blinders: true, neck: [0, -15], head: [0, -20, 0] }, TAPS.blind), taps: TAPS.blind,
      crowd: <Crowd t={t} mood={t > EV.vanished ? "groan" : "watch"} />,
    }),
    cam: mv("s31_vanish", C([1.85, 1.5, 2.45], [0.4, 1.15, 0.0], 44), C([1.6, 1.45, 2.1], [0.4, 1.15, 0.0], 42)),
    dom: (t, cam) => { const [x, y] = project(cam, [0.62, 2.1, 0.1]); return <Bulb t={t} t0={span("s31_vanish")[0] + 0.05} pop={EV.vanished} x={x} y={y} />; },
  },
  // B14 "You see, Hans couldn't count at all."   (deep violet from here to the end of B18)
  s32_yousee: {
    scene: (t) => court(t, { g: "violet", osten: null, board: ["?"], hans: hans(t, { expr: X.neutral }), crowd: <Crowd t={t} mood="watch" back={false} />, spot: [0.6, 6, 2], aim: [0.3, 0.8, 0.2] }),
    cam: mv("s32_yousee", C([1.75, 1.85, 2.5], [0.4, 1.05, 0], 42), C([2.0, 2.15, 2.95], [0.4, 1.0, 0], 44)),
  },
  s33_cantcount: {
    scene: (t) => court(t, { g: "violet", osten: null, board: ["?"], hans: hans(t, { expr: t > EV.count ? { ...X.blank, look: [0, -0.8] } : X.watch, mouth: t > EV.count ? "wobbly" : "smile", head: [0, -30, 8 * Math.sin(t * 3)] }), spot: [0.6, 6, 2], aim: [0.5, 1.2, 0.2] }),
    cam: orb("s33_cantcount", [0.66, 1.42, 0.12], 30, 52, 1.35, 1.2, 1.55, 1.5, 32),
  },
  // B15 "He was counting on us."
  s34_us: {
    scene: (t) => court(t, { g: "violet", osten: null, hans: hans(t, { expr: X.sly }), crowd: <Crowd t={t} mood="watch" />, spot: [0.5, 5, -1], aim: [0.8, 0.9, 2.5] }),
    cam: mv("s34_us", C([0.15, 2.0, -0.75], [0.9, 0.95, 2.4], 44), C([0.3, 1.92, -0.5], [0.9, 0.95, 2.4], 42)),
    dom: (t, cam) => <>{[-13, 13].map((a, i) => { const [x, y] = project(cam, [arcPos(a, 2.45)[0], 1.55, arcPos(a, 2.45)[2]]); return <Arrow key={i} t={t} t0={EV.us - 0.05 + i * 0.08} x={x} y={y} dir="down" size={0.8} />; })}</>,
  },
  // B16 "As his hoof got close to the right number, everyone watching tensed up without realizing it."
  s35_close: {
    scene: (t) => court(t, { g: "violet", osten: null, board: ["2 + 3 = ?"], hans: hans(t, { expr: X.sly }, TAPS.reveal), taps: TAPS.reveal, crowd: <Crowd t={t} mood="watch" tension={0.25} />, spot: [0.8, 5, 2.5], aim: [0.3, 0.2, 0.2] }),
    cam: mv("s35_close", C([0.95, 0.3, 1.25], [0.3, 0.28, 0.1], 40), C([0.8, 0.27, 1.0], [0.3, 0.26, 0.1], 36)),
    dom: (t) => <><TapCounter t={t} taps={TAPS.reveal} y={0.2} x={0.36} color="#c9a8ff" /><TensionMeter t={t} t0={span("s35_close")[0]} t1={END} level={tension(t)} /></>,
  },
  s36_eyes: {
    scene: (t) => court(t, { g: "violet", osten: null, board: ["2 + 3 = ?"], hans: hans(t, { expr: { ...X.sly, look: [lerp(-0.2, 0.9, seg(t, at(16, "close"), at(16, "number,"))), 0.2] } }, TAPS.reveal), taps: TAPS.reveal, crowd: <Crowd t={t} mood="watch" tension={0.5} />, spot: [1.5, 4, 2.5], aim: [0.66, 1.4, 0.1] }),
    cam: mv("s36_eyes", C([1.2, 1.52, 0.9], [0.66, 1.42, 0.12], 28), C([1.08, 1.5, 0.78], [0.66, 1.42, 0.12], 26)),
    dom: (t) => <><TapCounter t={t} taps={TAPS.reveal} y={0.2} x={0.36} color="#c9a8ff" /><TensionMeter t={t} t0={span("s35_close")[0]} t1={END} level={tension(t)} /></>,
  },
  s37_tense: {
    scene: (t) => court(t, { g: "violet", osten: null, hans: null, taps: TAPS.reveal, crowd: <Crowd t={t} mood="tense" tension={tension(t)} />, spot: [0.5, 5, -1], aim: [0.8, 0.9, 2.4] }),
    cam: mv("s37_tense", C([0.85, 1.3, 0.05], [0.8, 0.95, 2.4], 40), C([0.82, 1.25, 0.35], [0.8, 0.95, 2.4], 38)),
    dom: (t, cam) => <>
      <TapCounter t={t} taps={TAPS.reveal} y={0.2} x={0.36} color="#c9a8ff" /><TensionMeter t={t} t0={span("s35_close")[0]} t1={END} level={tension(t)} />
      {[-13, 13].map((a, i) => { const [x, y] = project(cam, [arcPos(a, 2.45)[0], 1.55, arcPos(a, 2.45)[2]]); return <Arrow key={i} t={t} t0={EV.tensed - 0.25 + i * 0.06} x={x} y={y} dir="down" color="#ff6a5a" size={0.7} />; })}
    </>,
  },
  s38_face: {
    scene: (t) => court(t, { g: "violet", osten: null, crowd: <Crowd t={t} mood="tense" tension={tension(t)} />, spot: [0.5, 5, -1], aim: [0.24, 0.95, 2.44] }),
    cam: mv("s38_face", C([0.48, 1.12, 0.95], [0.22, 0.95, 2.45], 30), C([0.44, 1.1, 1.15], [0.22, 0.95, 2.45], 28)),
    dom: (t) => <><TapCounter t={t} taps={TAPS.reveal} y={0.2} x={0.36} color="#c9a8ff" /><TensionMeter t={t} t0={span("s35_close")[0]} t1={END} level={tension(t)} /></>,
  },
  // B17 "On the final tap, they relaxed, their heads lifted just a tiny bit, and Hans stopped."
  s39_final: {
    scene: (t) => court(t, { g: "violet", osten: null, hans: hans(t, { expr: X.sly }, TAPS.reveal), taps: TAPS.reveal, crowd: <Crowd t={t} mood="tense" tension={tension(t)} />, spot: [0.8, 5, 2.5], aim: [0.3, 0.2, 0.2] }),
    cam: mv("s39_final", C([1.15, 0.38, 1.05], [0.3, 0.28, 0.13], 40), C([0.92, 0.3, 0.82], [0.3, 0.25, 0.13], 34)),
    dom: (t) => <><TapCounter t={t} taps={TAPS.reveal} y={0.2} x={0.36} color="#ffd84a" scale={1.15} /><TensionMeter t={t} t0={span("s35_close")[0]} t1={END} level={tension(t)} /></>,
  },
  s40_relax: {
    scene: (t) => court(t, { g: "violet", osten: null, hans: null, crowd: <Crowd t={t} mood={t > EV.relaxed ? "relax" : "tense"} tension={tension(t)} />, spot: [0.5, 5, -1], aim: [0.8, 0.9, 2.4] }),
    cam: mv("s40_relax", C([0.8, 1.3, 0.35], [0.8, 0.95, 2.4], 46), C([0.8, 1.25, 0.1], [0.8, 0.95, 2.4], 46)),
    dom: (t) => <TensionMeter t={t} t0={span("s35_close")[0]} t1={END} level={tension(t)} />,
  },
  s41_lift: {
    scene: (t) => court(t, { g: "violet", osten: null, hans: null, crowd: <Crowd t={t} mood="lift" only={[1, 2]} back={false} lift={lift(t)} />, spot: [0.5, 5, 0.5], aim: [0.8, 0.9, 2.4] }),
    cam: mv("s41_lift", C([0.8, 1.05, 0.45], [0.8, 1.0, 2.42], 44), C([0.8, 1.03, 0.7], [0.8, 1.0, 2.42], 42)),
    dom: (t, cam) => <>
      <TensionMeter t={t} t0={span("s35_close")[0]} t1={END} level={tension(t)} />
      {[-13, 13].map((a, i) => { const [x, y] = project(cam, [arcPos(a, 2.45)[0], 1.5, arcPos(a, 2.45)[2]]); return <Arrow key={i} t={t} t0={EV.lifted + i * 0.08} x={x} y={y} dir="up" color="#7fe08a" size={0.75} />; })}
    </>,
  },
  s42_stopped: {
    scene: (t) => court(t, { g: "violet", osten: null, board: ["2 + 3 = ?"], hans: hans(t, { expr: t > EV.stopped ? { ...X.silly, extras: ["sparkles"] } : X.sly, mouth: t > EV.stopped ? "grin" : "smirk" }), crowd: <Crowd t={t} mood="relax" />, spot: [0.6, 6, 2], aim: [0.4, 1.0, 0.2] }),
    cam: mv("s42_stopped", C([2.0, 1.4, 2.0], [0.5, 1.2, 0.1], 40), C([1.8, 1.42, 1.75], [0.55, 1.25, 0.1], 38)),
    dom: (t) => <TensionMeter t={t} t0={span("s35_close")[0]} t1={span("s42_stopped")[1] - 0.15} level={tension(t)} />,
  },
  // B18 "Even Oskar, who knew the secret, couldn't stop himself from doing it."
  s43_oskar: {
    scene: (t) => court(t, {
      g: "violet", board: ["3 + 2 = ?"], spot: [1.8, 5, 2.2], aim: [1.6, 0.9, 0.0],
      osten: { look: LOOKS.oskar, pos: OSTEN, yaw: OSTEN_YAW, pose: holdUp, hold: <Notebook />, expr: live({ eyes: "open", brows: "angry", mouth: "flat", extras: ["sweat"], look: [0, 0.3] }, t, 50, [[P(18), at(18, "secret,")]]) },
      hans: hans(t, { expr: X.sly }, TAPS.oskar), taps: TAPS.oskar, crowd: <Crowd t={t} mood="watch" back={false} />,
    }),
    cam: mv("s43_oskar", C([1.2, 1.35, 2.1], [2.2, 1.0, -0.2], 42), C([1.4, 1.3, 1.85], [2.25, 1.0, -0.2], 40)),
    dom: (t) => <TapCounter t={t} taps={TAPS.oskar} y={0.2} x={0.5} color="#c9a8ff" scale={0.8} />,
  },
  s44_doing: {
    scene: (t) => court(t, {
      g: "violet", board: ["3 + 2 = ?"], spot: [1.8, 5, 2.2], aim: [2.4, 1.0, -0.2],
      osten: { look: LOOKS.oskar, pos: OSTEN, yaw: OSTEN_YAW, pose: t > EV.doing ? POSES.headHands : { ...holdUp, head: [t > EV.himself ? -10 : 6, 0, 0] }, hold: t > EV.doing ? undefined : <Notebook />, expr: live(t > EV.doing ? X.sad : t > EV.himself ? X.shock : { eyes: "open", brows: "angry", mouth: "flat", extras: ["sweat"], look: [0, 0.3] }, t, 50) },
      hans: hans(t, { expr: t > EV.himself ? X.sly : X.watch }, TAPS.oskar), taps: TAPS.oskar,
    }),
    cam: orb("s44_doing", [2.55, 0.9, -0.25], -62, -44, 1.5, 1.3, 1.1, 1.05, 34),
    dom: (t, cam) => { const [x, y] = project(cam, [2.55, 1.5, -0.25]); return <><TapCounter t={t} taps={TAPS.oskar} y={0.2} x={0.5} color="#c9a8ff" scale={0.8} /><Arrow t={t} t0={EV.himself} x={x} y={y} dir="up" color="#7fe08a" size={0.8} /></>; },
  },
  // B19 "Scientists still call it the Clever Hans effect, and it's why experiments today are run blind."
  s45_still: {
    scene: (t) => court(t, {
      osten: null, board: ["HANS", "EFFECT"], hans: hans(t, { expr: X.proud, mouth: "grin" }),
      extra: [1, 2, 3].map((k) => <Person key={k} w={{ look: SCI(k as 1 | 2 | 3), pos: [[1.6, 2.25, 1.0][k - 1], 0, [0.95, 0.35, 1.45][k - 1]], yaw: [0.1, -0.25, 0.35][k - 1], pose: { ...holdUp, head: [8 * Math.max(0, Math.sin(t * 6 + k)), 0, 0] }, hold: <Clipboard />, expr: live(X.happy, t, 30 + k) }} />),
      crowd: <Crowd t={t} mood="happy" skip={[2, 3]} />,
    }),
    cam: mv("s45_still", C([1.3, 2.6, 3.4], [1.2, 0.9, 0.4], 42), C([1.25, 2.3, 3.05], [1.2, 0.9, 0.4], 40)),
  },
  s46_effect: {
    scene: (t) => court(t, { board: ["HANS", "EFFECT"], hans: hans(t, { expr: X.proud, mouth: "grin", head: [-10, -30, 0] }), crowd: <Crowd t={t} mood="cheer" /> }),
    cam: mv("s46_effect", C([1.55, 0.6, 1.55], [0.6, 1.3, 0.1], 42), C([1.4, 0.72, 1.3], [0.62, 1.32, 0.1], 40)),
  },
  s47_blind: {
    scene: (t) => court(t, {
      osten: null, board: ["? + ? = ?"],
      hans: hans(t, { expr: { ...X.blank, look: [0.4, 0] }, neck: [0, -10], head: [0, -15, 8 * Math.sin(t * 2)] }, TAPS.blindtest), taps: TAPS.blindtest,
      extra: <>
        <Screen p={[1.55, 0, 0.75]} yaw={-0.5} />
        <Person w={{ look: LOOKS.sci3, pos: [2.25, 0, 1.25], yaw: -2.4, pose: holdUp, hold: <Clipboard head="BLIND" />, expr: live({ eyes: "closed", brows: "neutral", mouth: "small" }, t, 33, [[span("s47_blind")[0], at(19, "today")]]) }} />
        <Person w={{ look: LOOKS.sci2, pos: [3.3, 0, 0.0], yaw: -1.9, pose: { ...POSES.stand, armL: [30, 50, 100], armR: [30, 50, 100] }, expr: live(X.suspicious, t, 32) }} />
      </>,
      crowd: <Crowd t={t} mood="watch" skip={[2, 3]} />,
    }),
    cam: mv("s47_blind", C([3.7, 1.65, 2.4], [1.2, 0.9, 0.3], 42), C([3.45, 1.55, 2.1], [1.2, 0.9, 0.3], 40)),
  },
  // B20 "So Hans was a genius after all, just not at math."
  s48_genius: {
    scene: (t) => court(t, { g: "dusk", board: ["2 + 3 = ?"], hans: hans(t, { expr: X.proud, mouth: "grin", head: [-8, -30, 0] }), crowd: <Crowd t={t} mood="cheer" />, osten: OSTEN_W(t, { pose: clapPose(t, 2), expr: live(X.laugh, t, 3) }) }),
    cam: orb("s48_genius", [0.64, 1.3, 0.1], 18, 58, 2.3, 2.0, 1.55, 1.45, 40),
  },
  s49_notmath: {
    scene: (t) => court(t, { g: "dusk", board: ["2 + 3 = ?"], osten: null, hans: hans(t, { expr: t > EV.math ? X.silly : X.watch, mouth: t > EV.math ? "tongue" : "smile", neck: [0, 0], head: [0, 20, -10 * seg(t, EV.math - 0.2, EV.math + 0.2)] }) }),
    cam: mv("s49_notmath", C([0.85, 1.6, 2.5], [1.25, 1.3, -0.25], 42), C([1.0, 1.55, 2.2], [1.3, 1.3, -0.25], 40)),
  },
  // B21 "He was a genius at reading people."
  s50_reading: {
    scene: (t) => court(t, { osten: null, hans: hans(t, { expr: X.sly }), crowd: <Crowd t={t} mood="watch" /> }),
    cam: mv("s50_reading", C([0.15, 2.05, -0.75], [0.9, 0.95, 2.4], 44), C([0.3, 1.95, -0.5], [0.9, 0.95, 2.4], 42)),
    dom: (t, cam) => <>{[-38, -13, 13, 38].map((a, i) => { const p = arcPos(a, 2.45); const [x, y] = project(cam, [p[0], 0.95, p[2]]); return <Scan key={i} t={t} t0={EV.reading + i * 0.18} t1={span("s50_reading")[1] - 0.1} x={x} y={y} icon={["!", "?", "♥", "!"][i]} />; })}</>,
  },
  // B22 "And we were so easy to read that the whole world believed..."
  s51_easy: {
    scene: (t) => court(t, { osten: null, hans: hans(t, {}), crowd: <Crowd t={t} mood={Math.floor(t * 3) % 2 ? "laugh" : "shock"} /> }),
    cam: (t) => { const [t0, t1] = span("s51_easy"), u = io(seg(t, t0, t1)), x = lerp(-0.4, 2.0, u); return C([x, 1.08, 0.75], [x * 0.9 + 0.08, 0.95, 2.4], 40); },
  },
  s52_world: {
    scene: (t) => loopScene(t - END, t),
    cam: (t) => loopCam(t - END),
    still: true,
    dom: (t) => <>
      <Paper t={t} t0={EV.whole - 0.05} t1={END - 0.25} x={0.3} y={0.25} rot={-8} head="HORSE CAN COUNT!" sub="Berlin's clever Hans solves sums by tapping his hoof." />
      <Paper t={t} t0={EV.world} t1={END - 0.2} x={0.68} y={0.36} rot={7} head="13 EXPERTS: NO TRICK" sub="The commission finds no signals and no helpers." />
    </>,
  },
};
function PS3() { return at(3, "Two") - 0.1; }

/** Tension of the watchers during the reveal: rises with each tap toward the right number, drops on the final tap. */
function tension(t: number) {
  const r = TAPS.reveal;
  if (t < r[0]) return 0.05;
  if (t < r[3]) return 0.1 + 0.6 * ((t - r[0]) / (r[3] - r[0]));
  if (t < r[4]) return 0.7 + 0.28 * seg(t, r[3], r[3] + 0.6);
  return 0.98 * (1 - io(seg(t, EV.relaxed - 0.05, EV.relaxed + 0.5)));
}
/** Head lift (0..1) of the watchers on the final tap. */
function lift(t: number) { return io(seg(t, EV.lifted - 0.1, EV.lifted + 0.35)); }

/** A folding screen (the blind test). */
const Screen: React.FC<{ p: V3; yaw: number }> = ({ p, yaw }) => (
  <group position={p} rotation={[0, yaw, 0]}>
    {[-1, 0, 1].map((k) => (
      <mesh key={k} position={[k * 0.42, 0.75, Math.abs(k) * 0.12]} rotation={[0, -k * 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.42, 1.5, 0.03]} /><meshStandardMaterial color={["#c8b48a", "#d8c49a", "#c8b48a"][k + 1]} roughness={0.85} />
      </mesh>
    ))}
  </group>
);

export const SHOTS: Shot[] = CUTS.map(([id, t0, enter], i) => {
  const d = DEFS[id];
  if (!d) throw new Error("no shot def " + id);
  return { id, t0, t1: i + 1 < CUTS.length ? CUTS[i + 1][1] : END, enter, ...d };
});
export { nz, c01, THREE };

// Short 10, SHOTS-B (builder: claude/short10-shotsb): shots 16-34, beats 10-19, from P(10) to T.END. See ./CONTRACT.md.
// Every cut and every action time comes from at(beat, "word") / P(beat). Rig units (Classroom, Props).
// Bedroom shots: ME's room at night (time "interiorNight", face fill). The recording (22, 28, 29): the classroom seen from
// the phone propped on a stack of books on desk 8, with a phone UI in dom (REC dot, "FRI 2:14 PM").
import React from "react";
import type { CamS, Shot } from "../kit/core";
import type { PopSpec } from "../kit/Pop";
import { AbsoluteFill } from "remotion";
import { Grade } from "../blocky/Look";
import { Classroom, CLASSROOM_CS, DESK, SINK } from "../blocky/Classroom";
import * as M from "../blocky/Motion";
import * as Pr from "./Props";
import * as SA from "./ShotsA";
import { T, at, P, KC, ME, MAYA, KIDS, KID, Ch, st, Lights, cam, move, add, L3, type V3 } from "./common";

const PI = Math.PI;
const c01 = M.clamp01;
import { rnd } from "../kit/core";
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const fwd = (yaw: number, d: number): V3 => [Math.sin(yaw) * d, 0, Math.cos(yaw) * d];

// ───────────────────────────── cut list (all from words) ─────────────────────────────
const C = {
  s16: P(10),                       // b10 "Then I found": bedroom, ME unzips the backpack, tips it out
  s17: at(10, "shells") - KC,       // CLUE: the shells spill onto the bed
  s18: P(11),                       // b11 "I never packed any.": ME shakes head
  s19: P(12),                       // b12 "And at home, my hamster Peanut": Peanut on her wheel
  s20: at(12, "kept") - KC,         // CLUE: the second nest, with a shell
  s21: P(13),                       // b13 "So the next Friday": ME props the phone on the books
  s22: at(13, "filmed") - KC,       // the phone screen: REC
  s23: P(14),                       // b14 "At home, I set my backpack": ME sets the bag by Peanut's cage
  s24: at(14, "next") - KC,         // Peanut's cage: the side door is open
  s25: P(15),                       // b15 "At midnight": the clock 11:59 -> 12:00
  s26a: at(15, "something") - KC,   // the backpack pocket wiggles
  s26b: at(15, "inside") - KC,      // ME sits up (head snap)
  s27: P(16),                       // b16 "I checked the video.": ME grabs the phone, presses play
  s28: P(17),                       // b17 recording: the drawer out, Sir Nibbles pops out of the hole
  s29: at(17, "straight") - KC,     // recording: he drops into ME's open pocket
  s30: P(18),                       // b18 bedroom: he climbs out of the bag into Peanut's cage, they curl up (aha)
  s31: at(18, "Monday's") - KC,     // ME's slow smirk
  s32: at(18, "was", 2) - KC,       // Monday cleanup: he climbs back up into the hole
  s33: P(19),                       // b19 Friday: ME sets the bag beside the cage, pocket open, winks
  s34: at(19, "right") - KC,        // shot 1's angle: the empty cage, the wheel turning (loops to frame 0)
};
const ORDER = ["s16", "s17", "s18", "s19", "s20", "s21", "s22", "s23", "s24", "s25", "s26a", "s26b", "s27", "s28", "s29", "s30", "s31", "s32", "s33", "s34"] as const;
type Id = typeof ORDER[number];
const span = (id: Id): [number, number] => { const i = ORDER.indexOf(id); return [C[id], i + 1 < ORDER.length ? C[ORDER[i + 1]] : T.END]; };
const mk = (id: Id, s: Omit<Shot, "id" | "t0" | "t1">): Shot => { const [t0, t1] = span(id); return { enter: "cut", ...s, id: `b${id.slice(1)}`, t0, t1 }; };
const mv = (id: Id, from: CamS, to: CamS, sway = 0.015) => (t: number) => { const [a, b] = span(id); return move(from, to, t, a, b, sway); };
/** Local shot time: seconds since the shot started. */
const lt = (id: Id, t: number) => t - C[id];

// ───────────────────────────── bedroom ─────────────────────────────
const NIGHT_LAMP: V3 = [-3.0, 4.6, -8.6];
const Night: React.FC<{ focus: V3; clock?: string; peanut?: React.ReactNode; wheel?: number }> = ({ focus, clock = "11:59", peanut, wheel = 0 }) => <>
  <Lights time="interiorNight" focus={focus} practicalAt={NIGHT_LAMP} />
  <Pr.Bedroom clock={clock} peanutCage={<Pr.Cage color="#e86aa0" lock={false} tape={0} sideDoorOpen nest2 wheel={wheel}>{peanut}</Pr.Cage>} />
</>;
const nightDom = () => <Grade time="interiorNight" />;
/** Peanut's cage local floor height (bedding). */
const PB = Pr.CAGE.base;
/** Peanut's cage is drawn at 0.8: a hamster drawn in world coordinates near it uses this scale. */
const HS = 0.85;
/** The tip-out spot on the bed (shots 16-18): the bag lies on the blanket, its pocket toward the camera side. */
const BED_BAG: V3 = [-5.65, 2.03, -0.9];
const BED_BAG_YAW = -1.0;
/** ME beside the bed (shots 16-18). */
const ME_BED: V3 = [-3.15, 0, -0.75];
/** The backpack on the floor by Peanut's desk (shots 23-30): pocket toward the room's back-left (the shot-30 camera). */
const HB: V3 = Pr.HOME_BAG;
const HB_YAW = -1.95;
const HB_POCKET: V3 = add(HB, add(fwd(HB_YAW, 0.55), [0, 1.0, 0]));

/** Sunflower shells tumbling from `from` to scattered spots around `to` (radius r), each starting at its own time. */
const FallingShells: React.FC<{ t: number; t0: number; from: V3; to: V3; n?: number; r?: number; dur?: number; spread?: number }> = ({ t, t0, from, to, n = 22, r = 0.9, dur = 0.38, spread = 0.7 }) => <group>
  {Array.from({ length: n }, (_, k) => {
    const ts = t0 + rnd(k * 1.7) * spread, u = c01((t - ts) / dur);
    if (t < ts) return null;
    const a = rnd(k + 3.1) * PI * 2, d = Math.sqrt(rnd(k * 2.3 + 1)) * r;
    const end: V3 = [to[0] + Math.cos(a) * d, to[1] + 0.03, to[2] + Math.sin(a) * d];
    const p = L3(from, end, u), hop = Math.sin(PI * u) * 0.35;
    const rot = (1 - u) * 6 * rnd(k + 8) + rnd(k * 7) * 6;
    return <group key={k} position={[p[0], p[1] + hop, p[2]]} rotation={[0, rot, u < 1 ? rot * 0.7 : 0]}>
      <mesh castShadow><boxGeometry args={[0.17, 0.055, 0.085]} /><meshStandardMaterial color="#2c2a2a" roughness={0.6} /></mesh>
      <mesh position={[0, 0.03, 0]}><boxGeometry args={[0.15, 0.012, 0.025]} /><meshStandardMaterial color="#efe9da" roughness={0.6} /></mesh>
    </group>;
  })}
</group>;

/** ME in bed: lying (up = 0) to sitting up (up = 1), turned on the hip. Wrapped (rotated) so the audit skips it: kept clear by eye. */
const BED_HIP: V3 = [-8.1, 2.0, -5.6];
const InBed: React.FC<{ t: number; up: number; expr?: any; pose?: any; blinkSeed?: number }> = ({ t, up, expr = "blank", pose = {}, blinkSeed = 3 }) => {
  const th = -PI / 2 * (1 - up), legs = PI / 2 * up, hip = 1.5 * KID;
  return <group position={[BED_HIP[0], BED_HIP[1] + 0.42 * (1 - up), BED_HIP[2]]} rotation={[th, 0, 0]}>
    <Ch look={ME} t={t} noAudit blinkSeed={blinkSeed} expr={expr}
      a={{ position: [0, -hip, 0], yaw: 0, pose: M.mix({ legL: legs, legR: legs, armL: 0.2 * up, armR: 0.2 * up }, pose) }} />
  </group>;
};
/** The blanket over ME's legs (a soft quilt on top of the bed's own cover). */
const Quilt: React.FC = () => <mesh position={[-8.1, 2.5, -2.4]} castShadow receiveShadow>
  <boxGeometry args={[5.4, 0.9, 6.4]} /><meshStandardMaterial color="#4a7ac8" roughness={0.95} />
</mesh>;

// ───────────────────────────── classroom ─────────────────────────────
const CCS = [...CLASSROOM_CS, ...Pr.CAGE_CS, ...Pr.BAG_CS];
const CCS_NOBAGS = [...CLASSROOM_CS, ...Pr.CAGE_CS];
/** The recording set-up on desk 8: a stack of books with the phone, its back (camera) toward the cage. */
const D8 = DESK(8);
const STACK: V3 = [D8.desk[0] - 1.0, D8.desk[1], D8.desk[2] + 0.5];
const STACK_YAW = Math.atan2(-(Pr.HOLE[0] - STACK[0]), -(Pr.HOLE[2] - STACK[2]));
/** The phone's lens (world): the phone sits 1.54 up on the stack, 0.05 toward its screen side. */
const LENS: V3 = add(STACK, add(fwd(STACK_YAW, -0.1), [0, 1.56, 0]));
/** A recording frame: from the lens toward a target, with a tiny digital drift. */
const recCam = (target: V3, fov: number, t: number): CamS => ({ pos: LENS, target: [target[0], target[1] + Math.sin(t * 0.7) * 0.03, target[2] + Math.sin(t * 0.5) * 0.04], fov });
/** The phone UI over a recording: a rounded bezel, a REC dot, the stamp, and (playback) a progress bar. */
const PhoneUI: React.FC<{ t: number; play?: number }> = ({ t, play }) => {
  const on = Math.floor(t * 2.2) % 2 === 0;
  const secs = 12 + Math.floor((t - C.s22) * 1);
  const font = "Montserrat, sans-serif";
  return <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", inset: 34, borderRadius: 78, boxShadow: "0 0 0 120px #0b0c10, inset 0 0 0 6px rgba(255,255,255,0.18)" }} />
    <div style={{ position: "absolute", left: 92, top: 110, display: "flex", alignItems: "center", gap: 16, fontFamily: font, fontWeight: 800, fontSize: 52, color: "#fff", textShadow: "0 3px 6px rgba(0,0,0,0.6)" }}>
      <div style={{ width: 34, height: 34, borderRadius: 17, background: "#ff2a2a", opacity: on ? 1 : 0.25, boxShadow: "0 0 18px #ff2a2a" }} />
      REC <span style={{ fontWeight: 600, fontSize: 44, opacity: 0.9, marginLeft: 8 }}>00:{String(Math.min(59, Math.max(0, secs))).padStart(2, "0")}</span>
    </div>
    <div style={{ position: "absolute", right: 92, top: 112, fontFamily: font, fontWeight: 800, fontSize: 50, color: "#fff", background: "rgba(0,0,0,0.38)", padding: "8px 20px", borderRadius: 14 }}>FRI 2:14 PM</div>
    {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], k) => <div key={k} style={{ position: "absolute", width: 70, height: 70, left: x ? undefined : 120, right: x ? 120 : undefined, top: y ? undefined : 250, bottom: y ? 520 : undefined,
      borderLeft: x ? undefined : "6px solid rgba(255,255,255,0.75)", borderRight: x ? "6px solid rgba(255,255,255,0.75)" : undefined,
      borderTop: y ? undefined : "6px solid rgba(255,255,255,0.75)", borderBottom: y ? "6px solid rgba(255,255,255,0.75)" : undefined }} />)}
    {play !== undefined && <div style={{ position: "absolute", left: 110, right: 110, bottom: 150, display: "flex", alignItems: "center", gap: 26 }}>
      <div style={{ width: 0, height: 0, borderTop: "26px solid transparent", borderBottom: "26px solid transparent", borderLeft: "42px solid #fff" }} />
      <div style={{ flex: 1, height: 12, borderRadius: 6, background: "rgba(255,255,255,0.35)", position: "relative" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${play * 100}%`, borderRadius: 6, background: "#ff3b3b" }} />
        <div style={{ position: "absolute", left: `calc(${play * 100}% - 15px)`, top: -9, width: 30, height: 30, borderRadius: 15, background: "#fff" }} />
      </div>
    </div>}
  </AbsoluteFill>;
};
/** Cleanup kids in the classroom (the recording and Monday): one wipes the shelf by the cage, one sweeps. */
const WIPE_AT: V3 = [16.4, 0, 0.9];
const SWEEP_AT: V3 = [12.2, 0, 8.4];
const wiper = (t: number) => ({ position: WIPE_AT, yaw: PI / 2, pose: M.mix(M.idle(t, 4, 0.5), { armR: 1.25 + 0.12 * Math.sin(t * 9), armROut: 0.15 + 0.25 * Math.sin(t * 4.5), lean: 0.12, head: [0, 0.2] as [number, number] }) });
const sweeper = (t: number) => ({ position: SWEEP_AT, yaw: PI / 2 + 0.5, pose: M.mix(M.idle(t, 7, 0.5), { armR: 0.7 + 0.3 * Math.sin(t * 6), armL: 0.5 + 0.3 * Math.sin(t * 6), twist: 0.25 * Math.sin(t * 6), lean: 0.15, head: [0, 0.25] as [number, number] }) });
/** Sir Nibbles' path out of the hole and down into ME's pocket (the recording): u 0..1 over [a, b]. */
const NIB_S = 0.68;
const hopArc = (p0: V3, p1: V3, u: number, h: number): V3 => { const p = L3(p0, p1, u); return [p[0], p[1] + 4 * h * u * (1 - u), p[2]]; };

// ───────────────────────────── the loop camera (shot 1's angle) ─────────────────────────────
/** Builder A exports SHOT1_CAM(t) from ShotsA.tsx; until it lands this local copy frames the empty cage low, a slow push. */
const SHOT1_LOCAL = (t: number): CamS => {
  const h = Pr.HOLE, u = c01(t / 2.4);
  return { pos: [lerp(h[0] - 8.0, h[0] - 7.0, u), lerp(4.4, 4.6, u), lerp(h[2] - 1.7, h[2] - 1.5, u)], target: [Pr.CAGE_CENTER[0], 3.2, Pr.CAGE_CENTER[2]], fov: 40 };
};
const shot1Cam = (t: number): CamS => { const f = (SA as any).SHOT1_CAM as ((t: number) => CamS) | undefined; return f ? f(t) : SHOT1_LOCAL(t); };
/** Pull a camera back along its view line by d (for a push that ends exactly on shot 1's first framing). */
const backOff = (c: CamS, d: number): CamS => { const v = [c.pos[0] - c.target[0], c.pos[1] - c.target[1], c.pos[2] - c.target[2]], l = Math.hypot(v[0], v[1], v[2]) || 1; return { ...c, pos: [c.pos[0] + v[0] / l * d, c.pos[1] + v[1] / l * d, c.pos[2] + v[2] / l * d] }; };

// ───────────────────────────── shots ─────────────────────────────
// 16 (MW) bedroom: ME unzips the backpack on the bed and tips it out.
const s16 = mk("s16", {
  scene: (t) => {
    const u = lt("s16", t), [a, b] = span("s16"), D = b - a;
    const zip = c01(u / (D * 0.4)), tip = M.ease(c01((u - D * 0.45) / (D * 0.45))) * 0.85;
    const reach = M.env(t, a, Infinity, 0.15);
    const pose = M.mix(M.idle(t, 1, 0.4), { armR: 0.95 * reach + 0.25 * tip, armL: 0.8 * reach + 0.3 * tip, armROut: 0.12 * Math.sin(u * 14) * (1 - zip) * reach, lean: 0.18 * reach, head: [0, 0.1] });
    const mouth = add(BED_BAG, add(fwd(BED_BAG_YAW, 1.1), [0, 0.25, 0]));
    return <>
      <Night focus={[-5, 0, -1]} />
      <Pr.Backpack p={BED_BAG} yaw={BED_BAG_YAW} color={Pr.ME_BAG.color} stripe={Pr.ME_BAG.stripe} open={zip} tip={tip} />
      <FallingShells t={t} t0={a + D * 0.82} from={mouth} to={add(BED_BAG, fwd(BED_BAG_YAW, 1.7))} n={8} />
      <Ch look={ME} t={t} expr={u < D * 0.6 ? "smile" : "surprised"} cs={Pr.BEDROOM_CS} a={{ position: ME_BED, yaw: -1.3, pose }} />
    </>;
  },
  cam: mv("s16", cam([-11.2, 5.6, 3.0], [-4.3, 2.7, -0.9], 40), cam([-10.9, 5.4, 2.6], [-4.3, 2.7, -0.9], 38)),
  dom: nightDom,
});
// 17 (C) CLUE: the shells spill onto the bed from the tipped bag; ME stares down at them.
const s17 = mk("s17", {
  scene: (t) => {
    const [a] = span("s17");
    const mouth = add(BED_BAG, add(fwd(BED_BAG_YAW, 1.1), [0, 0.25, 0]));
    return <>
      <Night focus={BED_BAG} />
      <Pr.Backpack p={BED_BAG} yaw={BED_BAG_YAW} color={Pr.ME_BAG.color} stripe={Pr.ME_BAG.stripe} open={1} tip={0.85 + 0.04 * Math.sin((t - a) * 9) * M.env(t, a, a + 0.8)} />
      <FallingShells t={t} t0={a - 0.25} from={mouth} to={add(BED_BAG, fwd(BED_BAG_YAW, 1.75))} n={30} r={0.85} spread={0.9} />
      <Ch look={ME} t={t} expr="surprised" cs={Pr.BEDROOM_CS} a={{ position: ME_BED, yaw: -1.3, pose: M.mix(M.idle(t, 1, 0.4), { armR: 1.1, armL: 1.05, lean: 0.2, head: [0.1, 0.45] }, M.recoil(t, a + 0.35, a + 1.2)) }} />
    </>;
  },
  cam: mv("s17", cam([-8.3, 5.3, 3.3], [-6.9, 2.2, -0.3], 40), cam([-8.1, 5.0, 2.9], [-6.9, 2.2, -0.3], 38)),
  dom: nightDom,
});
// 18 (M) ME shakes head: "I never packed any." Shells and the bag in the foreground.
const s18 = mk("s18", {
  scene: (t) => {
    const [a] = span("s18");
    const camP: V3 = [-8.4, 4.6, 2.8];
    const yaw = M.yawTo(ME_BED, camP);
    return <>
      <Night focus={ME_BED} />
      <Pr.Backpack p={BED_BAG} yaw={BED_BAG_YAW} color={Pr.ME_BAG.color} stripe={Pr.ME_BAG.stripe} open={1} tip={0.85} />
      <Pr.Shells p={add(BED_BAG, add(fwd(BED_BAG_YAW, 1.75), [0, 0.03, 0]))} r={0.85} n={30} seed={4} />
      <Ch look={ME} t={t} expr="worried" cs={Pr.BEDROOM_CS} a={{ position: add(ME_BED, [0.35, 0, 0.2]), yaw, pose: M.mix(M.idle(t, 2, 0.5), M.headShake(t, at(11, "never") - 0.05, at(11, "any.") + 0.25), M.spread(t, at(11, "packed") - 0.1, at(11, "any.") + 0.5)) }} />
    </>;
  },
  cam: mv("s18", cam([-7.4, 5.7, 7.6], [-3.0, 3.0, -0.5], 40), cam([-7.0, 5.5, 7.0], [-3.0, 3.05, -0.5], 38)),
  dom: nightDom,
});
// 19 (MW) Peanut runs on her wheel in her cage on ME's desk.
const s19 = mk("s19", {
  scene: (t) => <>
    <Night focus={Pr.PCAGE_POS} wheel={-t * 7} peanut={<Pr.Hamster look={Pr.PEANUT} p={[-1.1, PB + 0.07, -0.35]} yaw={PI / 2} walk={t * 34} s={0.82} />} />
  </>,
  cam: mv("s19", cam([1.8, 5.8, 3.8], [10.2, 3.8, -2.2], 40), cam([2.6, 5.6, 3.2], [10.2, 3.8, -2.2], 38)),
  dom: nightDom,
});
// 20 (C) CLUE: a second nest of shredded paper in the corner, a shell on top; Peanut trots over and sniffs it.
const NEST_W = Pr.pcagePoint([-Pr.CAGE.w / 2 + 0.6, PB, Pr.CAGE.d / 2 - 0.6]);
const s20 = mk("s20", {
  scene: (t) => {
    const u = c01(lt("s20", t) / 0.7);
    const p0: V3 = [0.4, PB, 0.0], p1: V3 = [-1.0, PB, 0.25];
    const p = L3(p0, p1, M.ease(u));
    return <>
      <Night focus={NEST_W} wheel={0.3} peanut={<>
        <Pr.Hamster look={Pr.PEANUT} p={p} yaw={u < 1 ? -PI / 2 - 0.15 : -PI / 2 + 0.7} walk={u < 1 ? t * 30 : undefined} lookYaw={u >= 1 ? 0.35 * Math.sin(t * 5) : 0} />
        <Pr.Shells p={[-1.6, PB, 0.1]} r={0.3} n={4} seed={9} />
      </>} />
    </>;
  },
  cam: mv("s20", cam([9.2, 4.25, -7.6], [9.85, 3.55, -3.1], 40), cam([9.3, 4.15, -7.0], [9.85, 3.55, -3.1], 38)),
  dom: nightDom,
});
// 21 (MW) classroom, next Friday: ME props the phone on the book stack on desk 8, then points at the cage.
const ME21: V3 = [0.5, 0, 8.0];
const s21 = mk("s21", {
  scene: (t) => {
    const [a, b] = span("s21"), D = b - a, u = t - a, placed = u > D * 0.42;
    const reach = M.env(t, a, a + D * 0.5, 0.12, 0.12);
    const yaw = M.turn(M.yawTo(ME21, STACK), PI / 2 - 0.15, t, a + D * 0.5, 0.25).yaw;
    const pose = M.mix(M.idle(t, 1, 0.4), { armR: 2.05 * reach, armL: 0.25 * reach, lean: 0.0, head: [0, 0.18 * reach] }, M.point(t, a + D * 0.55, Infinity, 0.35));
    const seat4 = DESK(4).seat, seat6 = DESK(6).seat;
    const maya = M.walkPath([[-7.4, 0, 11.5], [-7.4, 0, -3]], t, a - 0.6, { scale: KID });
    return <>
      <Lights focus={[4, 0, 5]} />
      <Classroom clock={2.23} />
      <Pr.ClassCage drawer={0} wheel={t * 3} />
      <Pr.BagRow meOpen={0} />
      <Pr.BookStack p={STACK} yaw={STACK_YAW} phone={placed} />
      <Ch look={ME} t={t} expr={placed ? "grin" : "smile"} cs={CLASSROOM_CS} others={[st(maya)]} hold={placed ? undefined : { R: <Pr.Phone screen="rec" /> }}
        a={{ position: ME21, yaw, pose, walk: M.turn(0, 1, t, a + D * 0.5, 0.25).walk }} />
      <Ch look={KIDS[1]} t={t} cs={CLASSROOM_CS} blinkSeed={2} a={{ position: [seat4[0], M.seatedY(seat4[1], KID), seat4[2]], yaw: PI, pose: M.mix({ legL: PI / 2, legR: PI / 2, armL: 0.35, armR: 0.35 }, M.seatedIdle(t, 2)) }} />
      <Ch look={KIDS[4]} t={t} cs={CLASSROOM_CS} blinkSeed={5} a={{ position: [seat6[0], M.seatedY(seat6[1], KID), seat6[2]], yaw: PI, pose: M.mix({ legL: PI / 2, legR: PI / 2, armL: 0.35, armR: 0.35 }, M.seatedIdle(t, 5)) }} />
      <Ch look={MAYA} t={t} cs={CLASSROOM_CS} others={[st({ position: ME21, yaw })]} blinkSeed={7} a={maya} />
    </>;
  },
  cam: mv("s21", cam([9.5, 7.4, 15.5], [0.9, 2.6, 8.2], 40), cam([9.0, 7.2, 14.8], [0.9, 2.6, 8.2], 38)),
});
// 22 (C) the phone screen, recording the cleanup: Maya carries the food drawer off toward the sink (the hole now open),
// a kid wipes the shelf, a kid sweeps. REC.
const s22 = mk("s22", {
  scene: (t) => {
    const [a] = span("s22");
    const mw = M.walkPath([[16.2, 0, Pr.HOLE[2] + 0.2], [16.0, 0, 12.0]], t, a - 0.15, { scale: KID, gait: "stroll" });
    const maya = { ...mw, pose: M.mix(mw.pose, { armR: 1.05, armL: 1.05, armROut: -0.12, armLOut: -0.12 }) };
    const tray = add(mw.position, add(fwd(mw.yaw, 1.15), [0, 2.05, 0]));
    const w = wiper(t), s = sweeper(t);
    return <>
      <Lights focus={Pr.CAGE_POS} />
      <Classroom clock={2.23} />
      <Pr.ClassCage drawer={null} wheel={t * 2} tape={1} />
      <Pr.BagRow meOpen={1} />
      <group position={tray} rotation={[0, mw.yaw, 0]}><Pr.DrawerTray /></group>
      <Ch look={MAYA} t={t} expr="smile" cs={CCS} others={[st(w), st(s)]} blinkSeed={7} a={maya} />
      <Ch look={KIDS[0]} t={t} cs={CCS} others={[st(maya), st(s)]} blinkSeed={1} a={w} />
      <Ch look={KIDS[2]} t={t} cs={CCS} others={[st(maya), st(w)]} blinkSeed={3} a={s} />
    </>;
  },
  cam: (t) => recCam([17.6, 2.6, 6.2], 30, t),
  dom: (t) => <PhoneUI t={t} />,
});
// 23 (MW) bedroom: ME sets the backpack on the floor by the desk, under Peanut's cage, and glances up at it.
const ME23: V3 = [6.4, 0, -3.6];
const s23 = mk("s23", {
  scene: (t) => {
    const [a, b] = span("s23"), D = b - a;
    const t0 = a + 0.05, down = M.ease(c01((t - t0) / (D * 0.45)));
    const bag: V3 = L3(add(ME23, add(fwd(M.yawTo(ME23, HB), 1.35), [0, 1.25, 0])), HB, down);
    const yaw = M.yawTo(ME23, HB);
    const pose = M.mix(M.idle(t, 1, 0.4), { armR: 0.9 * (1 - down) + 0.2, armL: 0.9 * (1 - down) + 0.2 }, M.pickUp(t, t0, D * 0.75), { head: [0, -0.22 * Math.sin(PI * c01((t - t0) / (D * 0.75)))] }, M.headSnap(t, a + D * 0.7, 0.5, -0.35));
    return <>
      <Night focus={[7.5, 0, -2]} wheel={t * 2} peanut={<Pr.Hamster look={Pr.PEANUT} p={[0.6, PB, 0.2]} yaw={-0.6} lookYaw={0.3 * Math.sin(t * 3)} />} />
      <Pr.Backpack p={bag} yaw={HB_YAW} color={Pr.ME_BAG.color} stripe={Pr.ME_BAG.stripe} open={0.6} />
      <Ch look={ME} t={t} expr={t > a + D * 0.7 ? "smirk" : "smile"} cs={Pr.BEDROOM_CS} a={{ position: ME23, yaw, pose }} />
    </>;
  },
  cam: mv("s23", cam([3.4, 6.0, 8.8], [6.9, 2.4, -2.0], 38), cam([3.6, 5.8, 8.1], [6.9, 2.4, -2.0], 36)),
  dom: nightDom,
});
// 24 (M) Peanut's cage: the little side door is open; Peanut peeks out, sniffing; the bag waits below.
const s24 = mk("s24", {
  scene: (t) => {
    const u = c01(lt("s24", t) / 0.5);
    return <>
      <Night focus={Pr.PCAGE_POS} wheel={t * 2} peanut={<Pr.Hamster look={Pr.PEANUT} p={[lerp(-0.9, -1.55, M.ease(u)), PB, 0.0]} yaw={-PI / 2} walk={u < 1 ? t * 28 : undefined} lookYaw={u >= 1 ? 0.45 * Math.sin(t * 6) : 0} />} />
      <Pr.Backpack p={HB} yaw={HB_YAW} color={Pr.ME_BAG.color} stripe={Pr.ME_BAG.stripe} open={0.6} />
    </>;
  },
  cam: mv("s24", cam([5.8, 5.1, -9.0], [9.9, 3.6, -3.4], 40), cam([6.2, 4.9, -8.7], [9.9, 3.65, -3.4], 38)),
  dom: nightDom,
});
// 25 (C) the clock: 11:59 -> 12:00 on "midnight".
const s25 = mk("s25", {
  scene: (t) => {
    const flip = at(15, "midnight") + 0.12;
    return <>
      <Night focus={Pr.BEDSIDE_CLOCK} clock={t < flip ? "11:59" : "12:00"} />
    </>;
  },
  cam: mv("s25", cam(add(Pr.BEDSIDE_CLOCK, [1.2, 0.75, 3.2]), add(Pr.BEDSIDE_CLOCK, [0, 0.05, 0]), 40), cam(add(Pr.BEDSIDE_CLOCK, [0.95, 0.6, 2.55]), add(Pr.BEDSIDE_CLOCK, [0, 0.05, 0]), 40)),
  dom: nightDom,
});
// 26a (C) the backpack pocket wiggles: something scratches inside it.
const s26a = mk("s26a", {
  scene: (t) => {
    const [a] = span("s26a");
    const w = M.env(t, at(15, "scratched") - 0.15, Infinity, 0.1);
    return <>
      <Night focus={HB} wheel={0} />
      <group position={[Math.sin(t * 31) * 0.03 * w, 0, 0]}><Pr.Backpack p={HB} yaw={HB_YAW + Math.sin(t * 23) * 0.03 * w} color={Pr.ME_BAG.color} stripe={Pr.ME_BAG.stripe} open={0.6 + 0.15 * Math.sin(t * 17) * w} wiggle={0.3 + w} t={t} /></group>
      {void a}
    </>;
  },
  cam: mv("s26a", cam(add(HB, add(fwd(HB_YAW, 5.5), [0.5, 2.6, 0])), add(HB, [0, 1.0, 0]), 40), cam(add(HB, add(fwd(HB_YAW, 4.9), [0.45, 2.4, 0])), add(HB, [0, 1.0, 0]), 38)),
  dom: nightDom,
});
// 26b (M) ME sits bolt upright in bed, head snapping toward the noise.
const s26b = mk("s26b", {
  scene: (t) => {
    const [a] = span("s26b");
    const up = M.snap(c01((t - a - 0.02) / 0.22), 1.6);
    return <>
      <Night focus={BED_HIP} />
      <Quilt />
      <InBed t={t} up={Math.min(1, up)} expr={t > a + 0.1 ? "scared" : "blank"} pose={M.mix(M.headSnap(t, a + 0.16, 0.95, 0.05), { armL: 0.5 * up, armR: 0.4 * up })} />
    </>;
  },
  cam: mv("s26b", cam([-4.3, 5.0, 2.8], [-8.0, 3.1, -5.0], 40), cam([-4.6, 4.9, 2.2], [-8.0, 3.2, -5.0], 38), 0.03),
  dom: nightDom,
});
// 27 (M) ME grabs the phone off the bed and presses play; the screen lights ME's face.
const PHONE_BED: V3 = [-6.4, 2.06, -5.3];
const PHONE_HELD: V3 = [-8.1, 3.55, -4.25];
const s27 = mk("s27", {
  scene: (t) => {
    const [a, b] = span("s27"), D = b - a;
    const g = M.ease(c01((t - a - D * 0.15) / (D * 0.4)));
    const ph = L3(PHONE_BED, PHONE_HELD, g);
    const press = Math.sin(PI * c01((t - at(16, "video")) / 0.25));
    return <>
      <Night focus={BED_HIP} />
      <Quilt />
      <InBed t={t} up={1} expr={g < 1 ? "worried" : "stare"} pose={{ armL: 0.4 + 0.75 * g + Math.sin(PI * g) * 0.5, armLOut: 0.5 * Math.sin(PI * g), armR: 0.3 + 0.9 * g + 0.18 * press, head: [0.35 * (1 - g), 0.3 * g], twist: 0.25 * Math.sin(PI * g) }} />
      <Pr.Phone p={ph} r={[g * 0.95 - (1 - g) * PI / 2, PI, 0]} screen={t > at(16, "video") ? "play" : "rec"} />
      {g > 0.5 && <pointLight position={add(PHONE_HELD, [0, 0.1, -0.5])} intensity={2.2} distance={3.5} decay={2} color="#9cc4ff" />}
    </>;
  },
  cam: mv("s27", cam([-5.0, 4.9, 2.2], [-7.8, 3.3, -5.0], 40), cam([-5.4, 4.7, 1.4], [-7.8, 3.4, -5.0], 38)),
  dom: nightDom,
});
// 28 (C) the recording: the drawer is out (Maya took it to the sink), Sir Nibbles pokes out of the drawer hole.
const HOLE_IN: V3 = [Pr.HOLE[0] + 0.85, Pr.CAGE_POS[1] + Pr.DRAWER.y0 + 0.04, Pr.HOLE[2]];
const HOLE_LIP: V3 = [Pr.HOLE[0] - 0.12, HOLE_IN[1], Pr.HOLE[2]];
const recPlay = (t: number) => c01((t - C.s28) / (C.s30 - C.s28)) * 0.7 + 0.2;
const s28 = mk("s28", {
  scene: (t) => {
    const [a, b] = span("s28"), D = b - a;
    const u = M.ease(c01((t - a - D * 0.2) / (D * 0.55)));
    const p = L3(HOLE_IN, HOLE_LIP, u);
    const w = wiper(t), s = sweeper(t);
    return <>
      <Lights focus={Pr.CAGE_POS} />
      <Classroom clock={2.25} />
      <Pr.ClassCage drawer={null} wheel={t * 2} tape={1} />
      <Pr.BagRow meOpen={1} />
      <Pr.Hamster look={Pr.NIBBLES} p={p} yaw={-PI / 2} s={NIB_S} walk={u > 0 && u < 1 ? t * 26 : undefined} lookYaw={u >= 1 ? 0.5 * Math.sin((t - a) * 6) : 0} cheeks={0.3} />
      <Ch look={KIDS[0]} t={t} cs={CCS} others={[st(s)]} blinkSeed={1} a={w} />
      <Ch look={KIDS[2]} t={t} cs={CCS} others={[st(w)]} blinkSeed={3} a={s} />
    </>;
  },
  cam: (t) => recCam([18.9, 2.0, 4.85], 17, t),
  dom: (t) => <PhoneUI t={t} play={recPlay(t)} />,
});
// 29 (C) the recording: he hops off the lip and drops straight into ME's open backpack pocket below.
const s29 = mk("s29", {
  scene: (t) => {
    const [a] = span("s29");
    const land = at(17, "backpack") + 0.05, t0 = land - 0.42;
    const u = c01((t - t0) / (land - t0));
    const sink = c01((t - land) / 0.25);
    const p = t < t0 ? HOLE_LIP : u < 1 ? hopArc(HOLE_LIP, add(Pr.POCKET, [0, 0.15, 0]), u, 0.45) : add(Pr.POCKET, [0, 0.15 - 0.5 * sink, 0]);
    const w = wiper(t), s = sweeper(t);
    return <>
      <Lights focus={Pr.CAGE_POS} />
      <Classroom clock={2.25} />
      <Pr.ClassCage drawer={null} wheel={t * 2} tape={1} />
      {Pr.BAG_ROW.map((g, k) => <Pr.Backpack key={k} p={g.p} yaw={-PI / 2} color={g.color} stripe={g.stripe} open={g.me ? 1 : 0} wiggle={g.me ? 1 - c01((t - land) / 0.6) : 0} t={t} />)}
      {sink < 1 && <Pr.Hamster look={Pr.NIBBLES} p={p} yaw={-PI / 2} s={NIB_S} cheeks={0.3} lookYaw={t < t0 ? 0.4 * Math.sin((t - a) * 5) : 0} />}
      <Ch look={KIDS[0]} t={t} cs={CCS} others={[st(s)]} blinkSeed={1} a={w} />
      <Ch look={KIDS[2]} t={t} cs={CCS} others={[st(w)]} blinkSeed={3} a={s} />
    </>;
  },
  cam: (t) => recCam([18.6, 1.85, 4.85], 14, t),
  dom: (t) => <PhoneUI t={t} play={recPlay(t)} />,
});
// 30 (MW) bedroom: Sir Nibbles climbs out of the backpack, hops up onto the desk, slips in through Peanut's side door,
// and the two curl up in the second nest. (The "aha" sting.)
const N_TOP: V3 = add(HB, [0, 2.0, 0]);
const N_DESK: V3 = [Pr.HOME_DESK.x0 + 0.35, Pr.DESK_H, -2.2];
const N_DOOR: V3 = [Pr.PCAGE_POS[0] - 0.35, Pr.DESK_H, -4.15];
const N_IN: V3 = [Pr.PCAGE_POS[0] - 0.35, Pr.DESK_H + PB * 0.8, -3.35];
const N_NEST: V3 = [Pr.PCAGE_POS[0] - 0.05, Pr.DESK_H + PB * 0.8, -2.45];
const nibbles30 = (t: number): { p: V3; yaw: number; walk?: number; curl: number } => {
  const [a] = span("s30");
  const k = [0.0, 0.3, 0.5, 0.82, 0.98, 1.12];
  const u = t - a;
  if (u < k[1]) { const v = M.ease(c01(u / k[1])); return { p: v < 0.45 ? L3(add(HB_POCKET, [0, -0.45, 0]), HB_POCKET, v / 0.45) : L3(HB_POCKET, N_TOP, (v - 0.45) / 0.55), yaw: HB_YAW + PI, walk: t * 30, curl: 0 }; }
  if (u < k[2]) { const v = c01((u - k[1]) / (k[2] - k[1])); return { p: hopArc(N_TOP, N_DESK, v, 0.55), yaw: M.yawTo(N_TOP, N_DESK), curl: 0 }; }
  if (u < k[3]) { const v = c01((u - k[2]) / (k[3] - k[2])); return { p: L3(N_DESK, N_DOOR, v), yaw: M.yawTo(N_DESK, N_DOOR), walk: t * 34, curl: 0 }; }
  if (u < k[4]) { const v = c01((u - k[3]) / (k[4] - k[3])); return { p: hopArc(N_DOOR, N_IN, v, 0.3), yaw: 0, curl: 0 }; }
  if (u < k[5]) { const v = c01((u - k[4]) / (k[5] - k[4])); return { p: L3(N_IN, N_NEST, v), yaw: M.yawTo(N_IN, N_NEST), walk: t * 30, curl: 0 }; }
  return { p: N_NEST, yaw: M.yawTo(N_IN, N_NEST) + 0.8, curl: M.ease(c01((u - k[5]) / 0.25)) };
};
const s30 = mk("s30", {
  scene: (t) => {
    const n = nibbles30(t), [a] = span("s30");
    const pc = M.ease(c01((t - a - 1.15) / 0.25));
    return <>
      <Night focus={[8.4, 0, -2.4]} wheel={t * 1.5} peanut={<Pr.Hamster look={Pr.PEANUT} p={[-1.2, PB, 0.35]} yaw={-PI / 2 - 0.8} curl={pc} lookYaw={pc < 0.2 ? 0.4 : 0} blink={pc} />} />
      <Pr.Backpack p={HB} yaw={HB_YAW} color={Pr.ME_BAG.color} stripe={Pr.ME_BAG.stripe} open={1} wiggle={t - a < 0.3 ? 1 : 0} t={t} />
      <Pr.Hamster look={Pr.NIBBLES} p={n.p} yaw={n.yaw} walk={n.walk} curl={n.curl} blink={n.curl} s={HS} cheeks={0.2} />
    </>;
  },
  cam: (t) => {
    const [a, b] = span("s30"), tp = a + 0.95;
    const wide = move(cam([-2.4, 5.6, -2.9], [8.6, 2.3, -2.1], 40), cam([-1.8, 5.5, -2.9], [8.6, 2.4, -2.1], 39), t, a, tp, 0.015);
    return move(wide, cam([5.4, 5.5, -5.8], [10.0, 3.8, -2.9], 38), t, tp, b - 0.05, 0.01);
  },
  dom: nightDom,
});
// 31 (M) ME, sitting up in bed with the phone, looks up from the screen toward Peanut's cage and slowly smirks.
const s31 = mk("s31", {
  scene: (t) => {
    const [a, b] = span("s31"), D = b - a;
    const up = M.ease(c01((t - a - D * 0.15) / (D * 0.45)));
    return <>
      <Night focus={BED_HIP} />
      <Quilt />
      <InBed t={t} up={1} expr={up < 0.5 ? "smile" : "smirk"} pose={{ armL: 1.15, armR: 1.2, head: [0.75 * up, 0.3 * (1 - up) - 0.04 * up], tilt: 0.12 * up, twist: 0.12 * up }} />
      <Pr.Phone p={PHONE_HELD} r={[0.95, PI, 0]} screen="play" />
      <pointLight position={add(PHONE_HELD, [0, 0.1, -0.5])} intensity={2.2} distance={3.5} decay={2} color="#9cc4ff" />
    </>;
  },
  cam: mv("s31", cam([-5.6, 4.9, 1.6], [-8.0, 3.7, -5.3], 40), cam([-6.0, 4.8, 0.6], [-8.0, 3.75, -5.3], 38)),
  dom: nightDom,
});
// 32 (MW) Monday cleanup: the drawer is out, ME's bag below; Sir Nibbles climbs out of the pocket and back up into the hole.
const B_TOP: V3 = [18.45, 2.04, Pr.HOLE[2]];
const s32 = mk("s32", {
  scene: (t) => {
    const [a, b] = span("s32"), u = (t - a) / (b - a);
    let p: V3, walk: number | undefined, yaw = PI / 2;
    if (u < 0.35) { const v = M.ease(u / 0.35); p = v < 0.45 ? L3(add(Pr.POCKET, [0, -0.5, 0]), add(Pr.POCKET, [0, 0.04, 0]), v / 0.45) : L3(add(Pr.POCKET, [0, 0.04, 0]), B_TOP, (v - 0.45) / 0.55); walk = t * 30; }
    else if (u < 0.6) p = hopArc(B_TOP, HOLE_LIP, (u - 0.35) / 0.25, 0.45);
    else { p = L3(HOLE_LIP, add(HOLE_IN, [0.4, 0, 0]), M.ease((u - 0.6) / 0.4)); walk = t * 30; }
    const w = wiper(t);
    return <>
      <Lights focus={Pr.CAGE_POS} />
      <Classroom clock={8.75} boardText="Monday" />
      <Pr.ClassCage drawer={null} wheel={t * 2} tape={1} />
      {Pr.BAG_ROW.map((g, k) => <Pr.Backpack key={k} p={g.p} yaw={-PI / 2} color={g.color} stripe={g.stripe} open={g.me ? 1 : 0} wiggle={g.me && u < 0.3 ? 1 : 0} t={t} />)}
      <Pr.Hamster look={Pr.NIBBLES} p={p} yaw={yaw} walk={walk} s={NIB_S} cheeks={0.2} />
      <Ch look={KIDS[0]} t={t} cs={CCS} blinkSeed={1} a={w} />
    </>;
  },
  cam: mv("s32", cam([12.0, 4.0, 10.2], [18.9, 1.9, 4.9], 36), cam([12.6, 3.8, 9.6], [18.9, 1.9, 4.9], 34)),
});
// 33 (MW) Friday: ME sets the striped backpack down right beside the cage, pocket open, turns to the camera, smirks and winks.
const ME33: V3 = [16.55, 0, Pr.HOLE[2]];
const CAM33: V3 = [18.0, 5.2, -6.5];
const MAYA_SINK: V3 = [SINK[0] + 0.9, 0, SINK[2] - 0.6];
const s33 = mk("s33", {
  scene: (t) => {
    const [a, b] = span("s33"), D = b - a;
    const down = M.ease(c01((t - a - 0.05) / (D * 0.38)));
    const meBag = Pr.BAG_ROW.find((g) => g.me)!;
    const bag = L3(add(ME33, [1.15, 1.2, 0]), meBag.p, down);
    const tt = a + D * 0.48;
    const tr = M.turn(PI / 2, M.yawTo(ME33, CAM33), t, tt, 0.3);
    const wink = c01((t - (tt + 0.4)) / 0.12) * (1 - c01((t - (tt + 0.62)) / 0.12));
    const pose = M.mix(M.idle(t, 1, 0.4), { armR: 0.85 * (1 - down), armL: 0.85 * (1 - down) }, M.pickUp(t, a + 0.02, D * 0.62), { head: [0, -0.22 * Math.sin(PI * c01((t - a - 0.02) / (D * 0.62)))] }, M.point(t, tt + 0.3), { tilt: 0.16 * wink, head: [0, -0.04 * wink] });
    const maya = { position: MAYA_SINK, yaw: -0.4, pose: M.mix(M.idle(t, 3, 0.5), M.stir(t, a - 1, Infinity, 2.4)) };
    return <>
      <Lights focus={[17, 0, 4]} />
      <Classroom clock={2.2} />
      <Pr.ClassCage drawer={0} wheel={t * 2.5} tape={1}><Pr.Hamster look={Pr.NIBBLES} p={[0.3, Pr.CAGE.base, 0.25]} yaw={-0.7} lookYaw={0.4 * Math.sin(t * 3)} cheeks={0.8} /></Pr.ClassCage>
      {Pr.BAG_ROW.filter((g) => !g.me).map((g, k) => <Pr.Backpack key={k} p={g.p} yaw={-PI / 2} color={g.color} stripe={g.stripe} />)}
      <Pr.Backpack p={bag} yaw={-PI / 2} color={Pr.ME_BAG.color} stripe={Pr.ME_BAG.stripe} open={1} />
      <Ch look={ME} t={t} cs={CCS_NOBAGS} others={[st(maya)]} expr={t < tt ? "smile" : "smirk"} a={{ position: ME33, yaw: tr.yaw, walk: tr.walk, pose }} />
      <Ch look={MAYA} t={t} cs={CLASSROOM_CS} blinkSeed={7} a={maya} />
    </>;
  },
  cam: mv("s33", cam(CAM33, [17.3, 2.4, 4.9], 44), cam(add(CAM33, [-0.2, -0.3, 1.2]), [17.2, 2.5, 4.9], 42)),
});
// 34 (M) shot 1's angle: the empty cage, the wheel still turning, the door taped and padlocked. Ends on shot 1's first framing.
const s34 = mk("s34", {
  scene: (t) => <>
    <Lights focus={Pr.CAGE_CENTER} />
    <Classroom />
    <Pr.ClassCage drawer={0} wheel={((u) => 7.5 * u - 0.6 * u * u)(t - T.END + 0.6)} tape={1} lock />
  </>,
  // lead: shot 1's own push run backwards in time (SHOT1_CAM extrapolates for t < 0), the same room/clock/wheel phase as
  // shot 1, so the last frame continues straight into frame 0.
  cam: (t) => shot1Cam(t - T.END),
});
void Ch;

export const SHOTS_B: Shot[] = [s16, s17, s18, s19, s20, s21, s22, s23, s24, s25, s26a, s26b, s27, s28, s29, s30, s31, s32, s33, s34];
/** Small CLUE tags, upper part of the frame, short. */
export const POPS_B: PopSpec[] = [
  { kind: "tag", t0: at(10, "shells") + 0.15, t1: P(11) - 0.05, x: 0.5, y: 0.16, text: "SHELLS?", size: 0.75, color: "#ffd84a" },
  { kind: "tag", t0: at(12, "second") - 0.05, t1: P(13) - 0.05, x: 0.5, y: 0.16, text: "NEST #2", size: 0.75, color: "#ffd84a" },
  { kind: "word", t0: at(18, "I") + 0.1, t1: at(18, "Monday's") - 0.15, x: 0.5, y: 0.15, text: "AHA!", size: 0.8 },
];

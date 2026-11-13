// Blocky-style test Short (notes/blocky_test/CONTRACT.md): 7 shots, every time from measured words (timing.json).
// "Every house on Maple Street has the same family living in it. / Same dad, same mom, same little kid. /
//  And tonight, one of them knocked on my door."
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import TIMING from "./timing.json";
import { c01, CamS, io, lerp, makeTiming, nz, orbit, push, seg, Shot, TimingJSON, V3 } from "../kit/core";
import { FPS, ShortFrame } from "../kit/Short";
import { PopSpec } from "../kit/Pop";
import type { Expr, Look, Pose } from "./types";
import { BlockChar, wavePose, BlockLights, FrontDoorInterior, HOUSE_X, MapleStreet, PORCH, Sky } from "./parts";

export const T = makeTiming(TIMING as TimingJSON);
const { at, atE, P, END } = T;
export const BLOCK_FRAMES = Math.round(END * FPS);

// ---- moments (all from words) ----
export const EV = {
  has: at(1, "has"), same1: at(1, "same"), family: at(1, "family"),
  dad: at(2, "dad,"), mom: at(2, "mom,"), kid: at(2, "kid."), little: at(2, "little"),
  and3: at(3, "And"), tonight: at(3, "tonight,"), one: at(3, "one"), knocked: at(3, "knocked"), door: at(3, "door."),
};
/** Three slow knocks starting on "knocked" (spacing from the word's own length). */
const KD = (EV.door - EV.knocked) / 2 + 0.12; // the same spacing as cues.py
export const KNOCKS = [EV.knocked, EV.knocked + KD, EV.knocked + 2 * KD];

// ---- cast ----
const DAD: Look = { skin: "#f2c9a0", shirt: "#3b6fd1", pants: "#2f3440", hair: "short", hairColor: "#5a3a22", tie: "#d23a3a" };
const MOM: Look = { skin: "#f2c9a0", shirt: "#4fb36a", pants: "#3a3f5a", hair: "bob", hairColor: "#7a3e1e" };
const KID: Look = { skin: "#f2c9a0", shirt: "#ffcf3a", pants: "#3b6fd1", shirtPattern: "stripes", hair: "short", hairColor: "#5a3a22", hat: "cap" };
const ME: Look = { skin: "#9a6a44", shirt: "#8fb8e8", pants: "#8fb8e8", shirtPattern: "plaid", hair: "spiky", hairColor: "#1e1410" };

/** The same wave on every lawn, in perfect sync (one clock for everyone). */
const wave = (t: number): Pose => wavePose(t);
const blinkAt = (t: number) => { const u = (t % 2.7) / 0.14; return u < 1 ? Math.sin(u * Math.PI) : 0; };

/** Porch spot for house i (the builder's PORCH, moved to that house). */
const PX0 = HOUSE_X.reduce((a, b) => (Math.abs(b - PORCH[0]) < Math.abs(a - PORCH[0]) ? b : a));
const porch = (i: number): V3 => [HOUSE_X[i] + (PORCH[0] - PX0), PORCH[1], PORCH[2]];
const LAWN = 4.5; // family stands this far in front of the porch, on the lawn

type FamOpts = { expr?: Expr; pose?: (t: number, who: number) => Pose; head?: number; inside?: number; walk?: number };
/** One family (dad, mom, kid) in front of house i. inside 0..1 = walking back in through the door. */
const Family: React.FC<{ i: number; t: number; o?: FamOpts }> = ({ i, t, o = {} }) => {
  const p = porch(i), k = o.inside ?? 0;
  const zf = p[2] + LAWN, z = lerp(zf, p[2] - 0.5, k), turned = k > 0 ? Math.PI : 0;
  const members: [Look, number, number][] = [[DAD, -3.4, 1], [MOM, 0, 1], [KID, 3.9, 0.68]];
  return (
    <>
      {members.map(([look, dx, sc], m) => {
        const xx = p[0] + dx * (1 - k * 0.9);
        if (k > 0.97) return null;
        return <BlockChar key={m} look={look} scale={sc} position={[xx, k > 0.6 ? p[1] : 0, z]} yaw={turned}
          expr={o.expr ?? "smile"} blink={blinkAt(t)} pose={o.pose?.(t, m) ?? {}}
          walk={k > 0 && k < 1 ? { phase: t * 9, amount: 0.8 } : undefined} />;
      })}
    </>
  );
};
const Street: React.FC<{ t: number; time: "day" | "dusk" | "night"; o?: FamOpts; focus?: V3 }> = ({ t, time, o, focus }) => (
  <>
    <Sky time={time} />
    <BlockLights time={time} focus={focus} />
    <MapleStreet time={time} />
    {HOUSE_X.map((_, i) => <Family key={i} i={i} t={t} o={o} />)}
  </>
);

const c = (pos: V3, target: V3, fov: number): CamS => ({ pos, target, fov });
const mid = Math.floor(HOUSE_X.length / 2);
const H = (i: number) => HOUSE_X[Math.max(0, Math.min(HOUSE_X.length - 1, i))];
const FZ = PORCH[2] + LAWN; // the families' line

// ---- shots ----
const CUTS: [string, number][] = [
  ["s1_street", 0], ["s2_row", EV.has - 0.06], ["s3_three", P(2)], ["s4_dusk", P(3)],
  ["s5_hall", EV.one - 0.06], ["s6_door", EV.knocked - 0.04], ["s7_peep", EV.door - 0.06],
];
const span = (id: string): [number, number] => { const i = CUTS.findIndex((x) => x[0] === id); return [CUTS[i][1], i + 1 < CUTS.length ? CUTS[i + 1][1] : END]; };
const mk = (id: string, s: Omit<Shot, "id" | "t0" | "t1">): Shot => { const [t0, t1] = span(id); return { id, t0, t1, ...s }; };

const SHOTS: Shot[] = [
  // (1) the hook in frame 0: the whole row of identical houses, an identical family waving on every lawn
  mk("s1_street", {
    enter: "cut",
    scene: (t) => <Street t={t} time="day" o={{ pose: (tt) => wave(tt), expr: "grin" }} />,
    cam: (t) => push(c([H(mid) + 8, 7.5, FZ + 15], [H(mid) - 22, 2.6, FZ - 1], 52), c([H(mid) + 6.5, 7, FZ + 13], [H(mid) - 22, 2.6, FZ - 1], 50), t, 0, span("s1_street")[1]),
  }),
  // (2) track along the row: same dad, same mom, same kid on each lawn, waving in sync
  mk("s2_row", {
    scene: (t) => <Street t={t} time="day" o={{ pose: (tt) => wave(tt), expr: "smile" }} focus={[H(1), 0, FZ]} />,
    cam: (t) => { const [a, b] = span("s2_row"); const u = io(seg(t, a, b)); const x = lerp(H(0) - 4, H(2) + 4, u);
      return c([x - 9, 8.5, FZ + 13], [x + 2, 2.8, FZ], 42); },
  }),
  // (3) close on one family: dad, mom, kid smiling; on "kid" all three heads turn together to us
  mk("s3_three", {
    scene: (t) => <Street t={t} time="day" o={{
      expr: t > EV.kid ? "blank" : "smile",
      pose: (tt) => ({ head: [lerp(0.15, -0.5, io(seg(tt, EV.kid - 0.1, EV.kid + 0.2))), 0] }),
    }} />,
    cam: (t) => { const p = porch(mid), [a, b] = span("s3_three");
      const u = seg(t, a, b);
      if (t >= EV.kid - 0.04) { const w = io(seg(t, EV.kid - 0.04, EV.kid + 0.3)); // pull back: all three heads turn together
        return c([p[0] + lerp(-1.4, -2.5, w), lerp(3.4, 4.8, w), FZ + lerp(7, 17, w)], [p[0] + lerp(3.9, 0.9, w), lerp(3, 3.0, w), FZ], lerp(38, 42, w)); }
      const kid = t >= EV.little - 0.12, x = t < EV.mom - 0.05 ? p[0] - 3.4 : kid ? p[0] + 3.9 : p[0];
      return c([x + (kid ? 1.6 + u : -4.5 - u * 1.5), kid ? 3.4 : 4.4, FZ + 10 - u * 1.5 - (kid ? 2.5 : 0)], [x, kid ? 3 : 3.6, FZ], 38); },
  }),
  // (4) dusk: every family turns and walks back inside at the same moment
  mk("s4_dusk", {
    scene: (t) => { const [a, b] = span("s4_dusk"); return <Street t={t} time="dusk" o={{ expr: "blank", inside: io(seg(t, a + 0.05, b + 0.1)) }} />; },
    cam: (t) => { const [a, b] = span("s4_dusk"); return push(c([H(mid) - 10, 13, FZ + 40], [H(mid) + 4, 3, FZ - 3], 50), c([H(mid) - 8, 12, FZ + 35], [H(mid) + 4, 3, FZ - 3], 48), t, a, b); },
  }),
  // (5) night, inside: our kid in pyjamas in the hallway, the door behind, worried
  mk("s5_hall", {
    scene: (t) => <>
      <Sky time="night" /><BlockLights time="night" />
      <FrontDoorInterior knock={0} />
      <BlockChar look={ME} expr="worried" blink={0} scale={0.68} position={[1.6, 0, 5]} yaw={0.25} pose={{ head: [-0.25, 0] }} />
    </>,
    cam: (t) => { const [a, b] = span("s5_hall"); return push(c([4.5, 3.6, 13], [0.6, 3.0, 2], 40), c([3.6, 3.4, 11.5], [0.8, 3.0, 2], 38), t, a, b); },
  }),
  // (6) the door shakes on each knock
  mk("s6_door", {
    enter: "cut",
    scene: (t) => <>
      <Sky time="night" /><BlockLights time="night" />
      <FrontDoorInterior knock={knockAmt(t)} />
      <BlockChar look={ME} expr="scared" blink={0} scale={0.68} position={[2.4, 0, 4.5]} yaw={Math.PI + 0.5} pose={{ lean: -0.1 }} />
    </>,
    cam: (t) => { const [a, b] = span("s6_door"); return push(c([-0.8, 4, 11], [0, 3.8, 0], 42), c([-0.6, 3.9, 9], [0, 3.8, 0], 40), t, a, b); },
  }),
  // (7) peephole: the same little kid outside, creepy face, holds to the end
  mk("s7_peep", {
    enter: "cut", bg: "#000",
    scene: (t) => { const p = porch(mid); return <>
      <Sky time="night" /><BlockLights time="night" practicalAt={[p[0], 6.8, p[2] - 0.5]} /><MapleStreet time="night" />
      <BlockChar look={KID} expr="creepy" blink={0} scale={0.68} position={[p[0], p[1], p[2] + 1.5]} yaw={Math.PI} pose={{ head: [0, -0.15 + nz(t, 3) * 0.02] }} />
    </>; },
    cam: (t) => { const p = porch(mid), [a] = span("s7_peep"); const u = io(seg(t, a, a + 0.6));
      return c([p[0], 4.3, p[2] - 1.3], [p[0], lerp(3.0, 3.4, u), p[2] + 1.5], lerp(74, 62, u)); },
    dom: () => <Peephole />,
  }),
];

/** Door shake: a sharp decaying jolt on each knock. */
function knockAmt(t: number) { return KNOCKS.reduce((m, k) => (t >= k ? Math.max(m, Math.exp(-(t - k) * 14)) : m), 0); }

/** The peephole: a round fish-eye window in black with a soft rim. */
const Peephole: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, transparent 0, transparent 430px, rgba(0,0,0,0.55) 470px, #000 520px)" }} />
);

const POPS: PopSpec[] = [
  { kind: "word", text: "MAPLE STREET", t0: -0.3, t1: EV.has - 0.1, x: 0.5, y: 0.16, size: 0.62, rot: -3, color: "#ffd84a" },
];

const Frame: React.FC<{ t: number; captions: boolean }> = ({ t, captions }) => (
  <ShortFrame shots={SHOTS} t={t} T={captions ? T : undefined} pops={POPS} highlight={["same", "knocked", "door."]} />
);
export const BlockTest: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions />;
export const BlockTestClean: React.FC = () => <Frame t={useCurrentFrame() / FPS} captions={false} />;
export { SHOTS as BLOCK_SHOTS, c01, orbit };

// Short 09 "The Porch Light Code": every shot. Times come from at(beat, "word") on ./timing.json (never a typed second).
// Story rule: Mr. Bell always flashes first (his lit porch blinks OFF three times), we answer (our dark porch flashes ON
// three times). The flashes are counted from a stable view, with the bulb counter on screen.
import React from "react";
import TIMING from "./timing.json";
import { CamS, io, lerp, makeTiming, nz, seg, Shot, TimingJSON } from "../kit/core";
import * as M from "../blocky/Motion";
import { groundFn, reachArm, type Box } from "../blocky/Collide";
import type { Expr, Pose } from "../blocky/types";
import { Street09 } from "./Town09";
import {
  BELL, BELL_COAT, DAD, DOOR_X, F, FrontDoor, FRONT_Z, InLot, KID, LAMP_L, Lights09, lampLevel, lotCS, ME, PorchLamp,
  Switch, SWITCH_IN_L, three, W, WIN_L, WY, eyeY, doorKnob, type V3,
} from "./Porch09";
import { BELL_CS, BellRoom, Cart, CerealBox, CLOCK, COAT_HOOK, COUCH, Grocery, GROCERY_CS, GX, OUR_CS, OTTOMAN, OurRoom } from "./Interior09";
import { C, st, type A } from "./Ch09";

export const T = makeTiming(TIMING as TimingJSON);
const { at, atE, P } = T;
const K = 0.06;

// ---------------------------------------------------------------- the cut list
const CUTS: [string, number][] = [
  ["s01_hook", 0],                          // b1 our porch blinks 3x, seen from Mr. Bell's hall over his shoulder
  ["s02_nod", at(1, "to") - K],             // he nods, steps back in, the door shuts
  ["s03_store", P(2)],                      // b2 grocery: Dad checks his watch, abandons the cart
  ["s04_cereal", at(2, "even") - K],        // ME with a cereal box: shrug
  ["s05_path", at(2, "grocery") - K],       // dusk: Dad hurries up our path, ME trailing
  ["s06_bellflash", P(3)],                  // b3 9:00, Mr. Bell in his doorway blinks his lamp 3x (CLUE)
  ["s07_watch", at(3, "and") - K],          // he watches our window
  ["s08_dadflash", P(4)],                   // b4 Dad flashes ours back 3x (CLUE)
  ["s10_stairs", at(5, "I") - K],           // b5 ME on the stairs, arms folded, suspicious
  ["s11_couch", P(6)],                      // b6 Dad on the couch, knee brace, falls asleep
  ["s12_clock", at(6, "couch") - K],        // the clock: 8:59 -> 9:00
  ["s13_dark", at(7, "came") - K],          // b7 our porch stays dark
  ["s14_again", P(8)],                      // b8 Mr. Bell flashes again, slower (CLUE)
  ["s15_wave", P(9)],                       // b9 ME waves behind the curtain
  ["s16_pov", at(9, "but") - K],            // his view: our window is dark
  ["s17_slippers", P(10)],                  // b10 slippers, tilt up
  ["s17_stare", at(10, "staring") - K],     // the stare (ambiguous, a little creepy)
  ["s18_look", P(11)],                      // b11 ME looks from the window to Dad and back
  ["s19_tiptoe", at(11, "or") - K],         // ME tiptoes between Dad and the door
  ["s20_coat", P(12)],                      // b12 Mr. Bell grabs his coat
  ["s21_cross", at(12, "hurried") - K],     // aerial: he hurries across the street
  ["s22_open", P(13)],                      // b13 ME opens the door first
  ["s23_knock", at(13, "before") - K],      // his fist up, the knock never lands
  ["s24_face", P(14)],                      // b14 not angry: worried
  ["s25_past", P(15)],                      // b15 he looks past ME, hand on his chest: scared
  ["s26_wake", at(15, "happened") - K],     // Dad wakes and waves: relief
  ["s27_laugh", P(16)],                     // b16 the two men laugh on the couch
  ["s28_switch", at(16, "meant") - K],      // our switch, ME's hand near it (CLUE)
  ["s29_next", at(16, "always") - K],       // next night: Mr. Bell flashes first (CLUE)
  ["s30_me", at(17, "I") - K],              // b17 ME on tiptoe flashes ours back (CLUE)
  ["s31_nod", P(18)],                       // b18 he sees it, nods, happy
  ["s32_home", at(18, "knowing") - K],      // shot-1 angle: he goes in, his porch goes dark -> loops to s01
];
const span = (id: string): [number, number] => { const i = CUTS.findIndex((x) => x[0] === id); if (i < 0) throw new Error(id); return [CUTS[i][1], i + 1 < CUTS.length ? CUTS[i + 1][1] : T.END]; };

// ---------------------------------------------------------------- the code (flash schedules)
/** Our porch flashes ON three times / Mr. Bell's lit porch blinks OFF three times. */
export const FL = {
  hook: three(at(1, "Our", 1, -0.1), (at(1, "neighbor") - at(1, "Our")) / 2, 0.21),
  bell3: three(at(3, "blinks"), (at(3, "times") - at(3, "blinks")) / 2, 0.24),
  dad4: three(at(4, "flashes", 1, -0.1), (at(4, "back") - at(4, "Dad")) / 2.2, 0.17),
  bell8: three(at(8, "Mr.", 1, 0.08), (at(8, "again") - at(8, "Mr.")) / 2, 0.26),
  bell16: three(at(16, "always", 1, 0.06), (at(17, "Tonight") - at(16, "always")) / 3.2, 0.16),
  me17: three(at(17, "took"), (at(17, "switch") - at(17, "took")) / 3, 0.15),
};
const ourLamp = (t: number, fl: [number, number][] = []) => lampLevel(t, 0, fl);
const bellLamp = (t: number, fl: [number, number][] = []) => lampLevel(t, 1, fl);
/** Switch toggle position for a flash list: up (1) while the light differs from base. */
const toggle = (t: number, fl: [number, number][], base: 0 | 1) => { const l = lampLevel(t, base, fl); return base === 0 ? l : 1 - l; };
/** A hand pressing the switch: a small dip of the arm on every flip (on and off). */
const flickPulse = (t: number, fl: [number, number][]) => fl.flatMap(([a, b]) => [a, b]).reduce((m, x) => Math.max(m, Math.sin(Math.PI * seg(t, x - 0.07, x + 0.05))), 0);

// ---------------------------------------------------------------- helpers
const c = (pos: V3, target: V3, fov: number): CamS => ({ pos, target, fov });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mv = (id: string, from: CamS, to: CamS, sway = 0.006) => (t: number): CamS => {
  const [a, b] = span(id), u = io(seg(t, a, b)) * 0.85 + seg(t, a, b) * 0.15;
  return { pos: [lerp(from.pos[0], to.pos[0], u) + nz(t, 1) * sway, lerp(from.pos[1], to.pos[1], u) + nz(t, 2) * sway, lerp(from.pos[2], to.pos[2], u)],
    target: [lerp(from.target[0], to.target[0], u), lerp(from.target[1], to.target[1], u), lerp(from.target[2], to.target[2], u)], fov: lerp(from.fov, to.fov, u) };
};
const B = (p: V3): V3 => W("bell", p); // Mr. Bell's lot-local -> world
const BY = (yaw: number) => WY("bell", yaw);
const yawTo = M.yawTo;
const OUR_WIN: V3 = [WIN_L[0], WIN_L[1], FRONT_Z]; // world (home lot = world)
/** Mr. Bell, standing at the lot-local point p, facing our window. */
const bellFacingUs = (p: V3) => yawTo(B(p), OUR_WIN);
const KS = KID;

/** Where someone stands inside a doorway to reach the inside switch with the RIGHT hand while facing OUT (+z local). */
const DOORWAY_SPOT: V3 = [DOOR_X + 0.75, F, FRONT_Z - 2.77];
/** The inner face of the front wall (lot-local z). */
const INNER_Z = FRONT_Z - 0.4 - 0.12;
/** Arm on the switch (right arm out sideways), pressing on each flip. */
const onSwitch = (lot: "home" | "bell", a: A, s: number, t: number, fl: [number, number][], side: 1 | -1 = -1, lift = 0): Pose => {
  const press = flickPulse(t, fl);
  // home: side-on to the wall, the fist's end flat on the plate. bell: in his doorway facing out, arm straight out sideways
  // in front of the wall, the fist on the plate's edge (hidden by the door frame from outside).
  const target = W(lot, [SWITCH_IN_L[0], SWITCH_IN_L[1] - 0.1 * press, INNER_Z - 0.05]);
  return reachArm(st(a, s, lift), side, target).pose;
};

// ---------------------------------------------------------------- scenes
type StreetO = { time?: "night" | "dusk"; homeCut?: boolean; bellCut?: boolean; our?: number; bell?: number; ourDoor?: number; bellDoor?: number; focus?: V3; inside?: "home" | "bell"; t: number; room?: Partial<React.ComponentProps<typeof OurRoom>>; coat?: boolean };
const World: React.FC<StreetO & { children?: React.ReactNode }> = ({ time = "night", homeCut = false, bellCut = false, our = 0, bell = 1, ourDoor = 0, bellDoor = 0, focus = [0, 0, 20], inside, t, room, coat = true, children }) => <>
  <Lights09 time={inside ? "inNight" : time} focus={focus} />
  <Street09 time={time} homeCut={homeCut} bellCut={bellCut} />
  <PorchLamp lot="home" on={our} />
  <PorchLamp lot="bell" on={bell} />
  {homeCut && <><FrontDoor lot="home" open={ourDoor} color="doorRed" lit={our > 0.5} /><OurRoom t={t} {...room} /><Switch lot="home" up={our} /></>}
  {bellCut && <><FrontDoor lot="bell" open={bellDoor} color="doorGreen" lit={bell > 0.5} /><BellRoom coat={coat} /><Switch lot="bell" up={bell} /></>}
  {children}
</>;
const CS_STREET: Box[] = [...lotCS("home"), ...lotCS("bell")];
const CS_HOMECUT: Box[] = [...lotCS("home", true), ...OUR_CS, ...lotCS("bell")];
const CS_BELLCUT: Box[] = [...lotCS("home"), ...lotCS("bell", true), ...BELL_CS];
const gStreet = groundFn(CS_STREET), gHome = groundFn(CS_HOMECUT);

// ---- Mr. Bell in his doorway at the switch (s01, s06, s07, s14, s29) ----
const BELL_DOOR_AT: V3 = B(DOORWAY_SPOT);
const bellAtSwitch = (t: number, fl: [number, number][], look: number, o: { expr?: Expr; lower?: [number, number] } = {}): A => {
  const yaw = BY(0), a: A = { position: BELL_DOOR_AT, yaw, pose: M.mix(M.idle(t, 3, 0.5), { head: [look, 0.03] }) };
  let arm = onSwitch("bell", a, 1, t, fl, 1);
  if (o.lower) { // the hand comes back off the wall, then down
    const u = seg(t, o.lower[0], o.lower[1]); arm = { armL: lerp(arm.armL ?? 0, 0.05, io(u)), armLOut: lerp(arm.armLOut ?? 0, 0.03, io(Math.min(1, u * 2))) }; }
  return { ...a, pose: M.mix(a.pose, arm) };
};

// ---- the shots ----
const mk = (id: string, s: Omit<Shot, "id" | "t0" | "t1">): Shot => { const [t0, t1] = span(id); return { enter: "cut", ...s, id, t0, t1 }; };
/** The over-the-shoulder hook camera inside Mr. Bell's hall, looking out through his door at our house. */
const HOOK_CAM = (): CamS => c(B([DOOR_X - 1.0, 5.4, -2.6]), [-3.4, 5.6, 10], 40);

const SHOTS_RAW: Shot[] = [
  // (1) HOOK, frame 0: our porch light is already ON (flash 1 of 3); Mr. Bell's arm comes down from his switch in the
  // foreground (a sliver at the frame edge); three bulbs on screen count the flashes.
  mk("s01_hook", {
    scene: (t) => { const [, b] = span("s01_hook"); const a = bellAtSwitch(t, [], 0.02, { lower: [at(1, "house"), at(1, "neighbor")] });
      return <World t={t} bellCut bellDoor={0.92} our={ourLamp(t, FL.hook)} bell={1} focus={[-6, 0, 50]}>
        <C look={BELL} t={t} a={a} cs={CS_BELLCUT} wear={["slippers"]} blinkSeed={2} />{void b}
      </World>; },
    cam: (t) => mv("s01_hook", HOOK_CAM(), c(add(HOOK_CAM().pos, [0, -0.05, -0.6]), [-3.4, 5.5, 10], 38.5))(t),
  }),
  // (2) he nods ("keep him away"), steps back in and swings the door shut: from his porch
  mk("s02_nod", {
    scene: (t) => { const [a0, b0] = span("s02_nod");
      const w = M.walkPath([BELL_DOOR_AT, B([DOOR_X + 0.75, F, FRONT_Z - 5.6])], t, a0 + 0.3, { gait: "walk" });
      const back: A = { position: w.position, yaw: BY(0), walk: w.walk ? { ...w.walk, phase: -w.walk.phase } : undefined, pose: M.mix(M.nod(t, a0 + 0.02, 2, 4.5)) };
      return <World t={t} bellCut bellDoor={lerp(0.92, 0.05, io(seg(t, a0 + 0.35, b0)))} our={0} bell={1} focus={B([-3, 0, 12])}>
        <C look={BELL} t={t} a={back} expr="happy" cs={CS_BELLCUT} wear={["slippers"]} blinkSeed={2} />
      </World>; },
    cam: mv("s02_nod", c(B([-1.4, 5.9, 13.9]), B([-2.6, 4.4, 6.4]), 40), c(B([-1.5, 5.85, 13.4]), B([-2.6, 4.4, 6.4]), 39)),
  }),
  // (3) the grocery store: Dad checks his watch on "rushes", lets go of the cart and walks off fast past the camera
  mk("s03_store", {
    scene: (t) => { const [a0] = span("s03_store"), go = at(2, "home");
      const p0: V3 = [GX + 1.5, 0, 7.6];
      const w = M.walkPath([p0, [GX - 2.6, 0, 6.0], [GX - 2.6, 0, -16]], t, go, { gait: "hurry", yaw0: Math.PI, turnIn: 0.12 });
      const watch: Pose = { armL: 1.4 * M.env(t, at(2, "rushes") - 0.1, go + 0.05, 0.12, 0.1), armLOut: -0.3 * M.env(t, at(2, "rushes") - 0.1, go + 0.05, 0.12, 0.1), head: [0.25 * M.env(t, at(2, "rushes"), go, 0.1, 0.1), 0.38 * M.env(t, at(2, "rushes"), go, 0.1, 0.1)] };
      const push: Pose = t < go ? { armR: 1.1, armL: t < at(2, "rushes") - 0.1 ? 1.1 : 0 } : {};
      const a: A = { ...w, pose: M.mix(w.pose, t < go ? M.idle(t, 5, 0.4) : null, push, watch) };
      return <><Lights09 time="store" focus={[GX, 0, 4]} /><Grocery /><Cart at={[GX + 1.5, 0, 3.4]} yaw={Math.PI} />
        <C look={DAD} t={t} a={a} cs={GROCERY_CS} expr={t < go ? "worried" : "surprised"} blinkSeed={5} />{void a0}</>; },
    cam: mv("s03_store", c([GX - 3.4, 7.2, -7.5], [GX + 1.0, 3.6, 5.5], 44), c([GX - 3.2, 7.1, -6.6], [GX + 1.0, 3.6, 5.5], 43)),
  }),
  // (4) ME holding a cereal box, confused: shrug
  mk("s04_cereal", {
    scene: (t) => { const [a0] = span("s04_cereal"); const p: V3 = [GX + 1.2, 0, 2];
      const a: A = { position: p, yaw: Math.PI + 0.35, pose: M.mix(M.idle(t, 7), M.shrug(t, a0 + 0.12, a0 + 0.75), { armR: 1.0 * (1 - M.env(t, a0 + 0.12, a0 + 0.75, 0.15, 0.2)) }) };
      return <><Lights09 time="store" focus={[GX, 0, 2]} /><Grocery /><Cart at={[GX + 1.5, 0, 7.4]} yaw={Math.PI} />
        <C look={ME} s={KS} t={t} a={a} cs={GROCERY_CS} expr="worried" hold={{ R: <CerealBox /> }} blinkSeed={1} /></>; },
    cam: mv("s04_cereal", c([GX - 0.6, 4.2, -8], [GX + 1.0, 3.0, 2], 36), c([GX - 0.5, 4.1, -7.2], [GX + 1.0, 3.0, 2], 35)),
  }),
  // (5) dusk: Dad hurries up our front path, ME trailing
  mk("s05_path", {
    scene: (t) => { const [a0] = span("s05_path");
      const d = M.walkPath([[DOOR_X, 0.04, 26], [DOOR_X, 0.04, 18], [DOOR_X, F, 13.5]], t, a0 - 0.15, { gait: "hurry", ground: gStreet });
      const m = M.walkPath([[DOOR_X + 0.4, 0.12, 34], [DOOR_X + 0.4, 0.04, 22]], t, a0 - 0.15, { gait: "walk", scale: KS, ground: gStreet });
      return <World t={t} time="dusk" our={0} bell={1} focus={[DOOR_X, 0, 22]}>
        <C look={DAD} t={t} a={d} cs={CS_STREET} others={[st(m, KS)]} expr="worried" blinkSeed={5} />
        <C look={ME} s={KS} t={t} a={{ ...m, pose: M.mix(m.pose, { head: [0, -0.1] }) }} cs={CS_STREET} others={[st(d)]} expr="worried" blinkSeed={1} />
      </World>; },
    cam: mv("s05_path", c([3.5, 6.5, 45], [DOOR_X - 1, 3.6, 21], 40), c([3.2, 6.4, 43.5], [DOOR_X - 1, 3.6, 21], 39)),
  }),
  // (6) 9:00. Mr. Bell in his doorway, right hand on the switch, blinks his porch light three times (CLUE: stable view)
  mk("s06_bellflash", {
    scene: (t) => { const a = bellAtSwitch(t, FL.bell3, 0.05);
      return <World t={t} bellCut bellDoor={0.92} bell={bellLamp(t, FL.bell3)} focus={B([-3, 0, 12])}>
        <C look={BELL} t={t} a={a} cs={CS_BELLCUT} expr="blank" wear={["slippers"]} blinkSeed={2} />
      </World>; },
    cam: mv("s06_bellflash", c(B([1.5, 5.4, 22]), B([-4.6, 5.0, 9.5]), 34), c(B([1.2, 5.4, 21]), B([-4.6, 5.0, 9.5]), 33)),
  }),
  // (7) he watches our window: closer, his lamp above him
  mk("s07_watch", {
    scene: (t) => { const a: A = { position: BELL_DOOR_AT, yaw: bellFacingUs(DOORWAY_SPOT), pose: M.idle(t, 3, 0.3) };
      return <World t={t} bellCut bellDoor={0.92} bell={1} focus={B([-3, 0, 12])}>
        <C look={BELL} t={t} a={a} cs={CS_BELLCUT} expr="blank" blink={0} still wear={["slippers"]} />
      </World>; },
    cam: mv("s07_watch", c(B([-6.2, 5.6, 16.5]), B([-4.0, 5.2, 8.0]), 30), c(B([-5.9, 5.6, 15.4]), B([-4.0, 5.2, 8.0]), 29)),
  }),
  // (8) our hall: Dad flicks our switch three times; the porch outside the window flashes (CLUE)
  mk("s08_dadflash", {
    scene: (t) => { const a0: A = { position: SWITCH_STAND(1), yaw: -Math.PI / 2, pose: M.idle(t, 5, 0.4) };
      const a = { ...a0, pose: M.mix(a0.pose, onSwitch("home", a0, 1, t, FL.dad4, 1), { head: [-0.25, 0.05] }) };
      return <World t={t} homeCut inside="home" our={ourLamp(t, FL.dad4)} focus={[-3, F, 6]} room={{ hall: 1, lamp: 1 }}>
        <C look={DAD} t={t} a={a} cs={CS_HOMECUT} expr="smile" blinkSeed={5} />
      </World>; },
    cam: mv("s08_dadflash", c([-6.4, 5.6, 1.6], [1.2, 4.2, 6.6], 42), c([-6.0, 5.55, 2.0], [1.2, 4.2, 6.6], 41)),
  }),
  // (10) ME on the stairs, arms folded, suspicious (smirk), watching Dad walk away from the door
  mk("s10_stairs", {
    scene: (t) => { const [a0] = span("s10_stairs"); const sx = -7.75, i = 2, seat: V3 = [sx, 1.2 + (i + 1) * 0.75, 2.2 - (i + 0.5) * 0.9];
      const me: A = { ...M.sit(seat, seat, Math.PI * 0.12, t, -5, 0.1, KS), pose: undefined };
      const meA: A = { ...me, pose: M.mix(M.sit(seat, seat, Math.PI * 0.12, t, -5, 0.1, KS).pose, M.crossArms(t, a0 + 0.1), { head: [lerp(0.15, 0.6, io(seg(t, a0, a0 + 1.1))), 0.06] }) };
      return <World t={t} homeCut inside="home" our={0} focus={[-4, F, 3]} room={{ hall: 1, lamp: 1 }}>
        <C look={ME} s={KS} t={t} a={meA} cs={CS_HOMECUT} allow={["seat", "step2", "step1", "step3"]} expr={t < a0 + 0.3 ? "smile" : "smirk"} blinkSeed={1} />
      </World>; },
    cam: mv("s10_stairs", c([-1.6, 5.6, 6.8], [-7.6, 3.9, 0.2], 40), c([-1.9, 5.5, 6.3], [-7.6, 3.9, 0.2], 39)),
  }),
  // (11) Dad on the couch, knee brace, leg up on the ottoman: winces on "hurt", nods off on "asleep"
  mk("s11_couch", {
    scene: (t) => { const a = dadCouch(t, at(6, "asleep"));
      return <World t={t} homeCut inside="home" our={0} focus={[6, F, 1]} room={{ lamp: 1, hall: 0 }}>
        <C look={DAD} t={t} a={a} cs={CS_HOMECUT} expr={t < at(6, "hurt") ? "smile" : t < at(6, "asleep") ? "worried" : "smile"} blink={t > at(6, "asleep") + 0.1 ? 1 : undefined} wear={["brace"]} blinkSeed={5} />
      </World>; },
    cam: mv("s11_couch", c([0.6, 6.4, 5.4], [7.4, 4.0, 0.0], 40), c([1.1, 6.3, 5.0], [7.4, 4.0, 0.0], 39)),
  }),
  // (12) the clock above the couch: 8:59 -> 9:00 on "Nine"
  mk("s12_clock", {
    scene: (t) => <World t={t} homeCut inside="home" our={0} focus={[6, F, 1]} room={{ lamp: 0.6, clock: t < at(7, "Nine") ? [8, 59] : [9, 0] }}>
      <C look={DAD} t={t} a={dadCouch(t, -10)} cs={CS_HOMECUT} blink={1} wear={["brace"]} />
    </World>,
    cam: mv("s12_clock", c([5.4, 7.6, 1.6], [CLOCK[0], CLOCK[1] - 0.6, CLOCK[2]], 34), c([5.9, 7.7, 1.4], [CLOCK[0], CLOCK[1] - 0.6, CLOCK[2]], 32)),
  }),
  // (13) our house from across the road: the porch stays dark (his light is on behind the camera)
  mk("s13_dark", {
    scene: (t) => <World t={t} our={0} bell={1} focus={[-2, 0, 20]} />,
    cam: mv("s13_dark", c([7, 5.0, 61], [-2, 6, 9], 36), c([6.2, 5.0, 58.5], [-2, 6, 9], 35)),
  }),
  // (14) Mr. Bell flashes again, slower, staring across (CLUE: stable view)
  mk("s14_again", {
    scene: (t) => { const a = bellAtSwitch(t, FL.bell8, 0.12);
      return <World t={t} bellCut bellDoor={0.92} bell={bellLamp(t, FL.bell8)} focus={B([-3, 0, 12])}>
        <C look={BELL} t={t} a={a} cs={CS_BELLCUT} expr="worried" wear={["slippers"]} blinkSeed={2} />
      </World>; },
    cam: mv("s14_again", c(B([-11, 7.4, 21]), B([-4.0, 4.6, 9.0]), 34), c(B([-10.4, 7.3, 20]), B([-4.0, 4.6, 9.0]), 33)),
  }),
  // (15) ME waves from behind the curtain (seen from the porch through our window)
  mk("s15_wave", {
    scene: (t) => { const [a0] = span("s15_wave"); const p: V3 = [WIN_L[0] - 0.3, F, FRONT_Z - 2.6];
      const a: A = { position: p, yaw: 0.05, pose: M.mix(M.idle(t, 7, 0.5), M.wave(t, at(9, "waved") - 0.05, Infinity, 1, 1.1)) };
      return <World t={t} homeCut inside="home" our={0} focus={[3, F, 6]} room={{ curtain: io(seg(t, a0, a0 + 0.3)) * 0.7, lamp: 0, hall: 0 }}>
        <C look={ME} s={KS} t={t} a={a} cs={CS_HOMECUT} expr="worried" blinkSeed={1} />
      </World>; },
    cam: mv("s15_wave", c([WIN_L[0] + 0.6, 4.9, 13.8], [WIN_L[0] - 0.2, 4.2, 7.0], 34), c([WIN_L[0] + 0.5, 4.9, 13.3], [WIN_L[0] - 0.2, 4.2, 7.0], 33)),
    dom: () => null,
  }),
  // (16) Mr. Bell's view across the road: our window is just dark glass
  mk("s16_pov", {
    scene: (t) => <World t={t} our={0} bell={1} focus={[2, 0, 12]} />,
    cam: mv("s16_pov", c(B([-4.4, 6.2, 13.5]), [OUR_WIN[0], OUR_WIN[1] - 0.4, OUR_WIN[2]], 15), c(B([-4.4, 6.2, 13.5]), [OUR_WIN[0], OUR_WIN[1] - 0.4, OUR_WIN[2]], 12.5)),
  }),
  // (17) he stands there in his slippers: low on the slippers, tilting up
  mk("s17_slippers", {
    scene: (t) => <World t={t} bell={1} focus={B([-3, 0, 12])}><C look={BELL} t={t} a={bellStand(t)} cs={CS_STREET} expr="blank" blink={0} still wear={["slippers"]} /></World>,
    cam: (t) => { const [a0, b0] = span("s17_slippers"), u = io(seg(t, a0, b0)), p = BELL_STAND();
      const tg: V3 = [p[0], lerp(p[1] + 0.6, p[1] + 3.0, u), p[2]];
      return c(add(p, [lerp(-2.2, -2.4, u), 1.6, lerp(-6.2, -6.6, u)]), tg, 40); },
  }),
  // (18) the stare: blank face, no blink, his porch light right above him. Slow push in.
  mk("s17_stare", {
    scene: (t) => <World t={t} bell={1} focus={B([-3, 0, 12])}><C look={BELL} t={t} a={bellStand(t)} cs={CS_STREET} expr="stare" blink={0} still wear={["slippers"]} /></World>,
    cam: (t) => { const p = BELL_STAND(), h = add(p, [0, eyeY(1) - 0.2, 0]);
      return mv("s17_stare", c(add(h, [-1.6, 0.5, -8.6]), add(h, [0, -0.7, 0]), 34), c(add(h, [-1.25, 0.35, -6.6]), add(h, [0, -0.55, 0]), 31))(t); },
  }),
  // (19) ME at the window looks back at sleeping Dad, then back out
  mk("s18_look", {
    scene: (t) => { const [a0, b0] = span("s18_look"); const p: V3 = [WIN_L[0] - 0.3, F, FRONT_Z - 2.6];
      const hy = 1.15 * M.env(t, at(11, "didn't"), at(11, "Dad") + 0.15, 0.18, 0.2);
      const a: A = { position: p, yaw: 0.05, pose: M.mix(M.idle(t, 7, 0.4), { head: [hy, 0.04], twist: 0.25 * hy / 1.15 }) };
      return <World t={t} homeCut inside="home" our={0} focus={[5, F, 4]} room={{ curtain: 0.5, lamp: 0, hall: 0 }}>
        <C look={ME} s={KS} t={t} a={a} cs={CS_HOMECUT} others={[st(dadCouch(t, -10))]} expr="worried" blinkSeed={1} />
        <C look={DAD} t={t} a={dadCouch(t, -10)} cs={CS_HOMECUT} blink={1} wear={["brace"]} />{void a0}
      </World>; },
    cam: mv("s18_look", c([8.4, 5.8, 0.6], [WIN_L[0] - 0.6, 4.1, FRONT_Z - 2.6], 40), c([8.2, 5.75, 1.1], [WIN_L[0] - 0.6, 4.1, FRONT_Z - 2.6], 39)),
  }),
  // (20) Dad snoring; ME tiptoes from the window toward the door
  mk("s19_tiptoe", {
    scene: (t) => { const [a0] = span("s19_tiptoe");
      const w = M.walkPath([[WIN_L[0] - 0.3, F, FRONT_Z - 2.6], [1.2, F, 4.4], [-1.6, F, 5.4]], t, a0 + 0.05, { gait: "stroll", scale: KS, speed: 3.2, yaw0: 0.05, turnIn: 0.25 });
      const a: A = { ...w, pose: M.mix(w.pose, { lean: 0.12, armL: 0.5, armR: 0.5, armLOut: 0.25, armROut: 0.25, head: [0.4, 0.1] }) };
      const d = dadCouch(t, -10);
      return <World t={t} homeCut inside="home" our={0} focus={[3, F, 3]} room={{ curtain: 0.5, lamp: 0, hall: 0 }}>
        <C look={ME} s={KS} t={t} a={a} cs={CS_HOMECUT} others={[st(d)]} expr="worried" blinkSeed={1} />
        <C look={DAD} t={t} a={d} cs={CS_HOMECUT} blink={1} wear={["brace"]} />
      </World>; },
    cam: mv("s19_tiptoe", c([5.0, 7.6, -7.0], [1.0, 3.2, 4.4], 44), c([4.6, 7.5, -6.4], [1.0, 3.2, 4.4], 43)),
  }),
  // (21) Mr. Bell's hall: he takes his coat from the stand and swings it on
  mk("s20_coat", {
    scene: (t) => { const g = at(12, "grabbed"), on = at(12, "coat") + 0.12;
      const p = B([-6.3, F, 4.6]), hook = B(COAT_HOOK);
      const w = M.walkPath([B([-3.0, F, 0.5]), p], t, at(12, "Then") - 0.5, { gait: "hurry", yaw1: yawTo(p, hook) });
      const base: A = { ...w };
      let pose: Pose = M.mix(w.pose);
      if (t > g - 0.25 && t < on) pose = M.mix(pose, reachArm(st(base), 1, hook).pose);
      if (t >= on) pose = M.mix(pose, { armL: -0.5 * M.env(t, on, on + 0.35, 0.1, 0.12), armR: -0.5 * M.env(t, on, on + 0.35, 0.1, 0.12), armLOut: 0.3, armROut: 0.3, head: [0, -0.1] });
      const a: A = { ...base, pose };
      return <World t={t} bellCut bellDoor={0.3} bell={1} inside="bell" coat={t < g} focus={B([-5, F, 4])}>
        <C look={t < on ? BELL : BELL_COAT} t={t} a={a} cs={CS_BELLCUT} allow={["coatStand"]} expr="worried" wear={["slippers"]} blinkSeed={2}
          hold={t >= g && t < on ? { L: <mesh position={[0, 1.6, 0]}><boxGeometry args={[1.4, 3.6, 0.5]} /><meshStandardMaterial color="#2e3a52" roughness={0.9} /></mesh> } : undefined} />
      </World>; },
    cam: mv("s20_coat", c(B([-0.6, 6.3, 7.4]), B([-6.4, 4.0, 3.6]), 44), c(B([-0.8, 6.25, 7.0]), B([-6.4, 4.0, 3.6]), 43)),
  }),
  // (22) game camera, high above the street: a tiny Mr. Bell hurries across the road in his coat and slippers
  mk("s21_cross", {
    scene: (t) => { const [a0] = span("s21_cross"); const w = M.walkPath([[-12.6, 0.12, 66], [-9, 0.03, 52], [-4, 0.03, 40], [DOOR_X, 0.12, 33]], t, a0 - 0.9, { gait: "hurry", speed: 9.5, ground: gStreet });
      return <World t={t} bell={1} focus={[-8, 0, 50]}><C look={BELL_COAT} t={t} a={w} cs={CS_STREET} expr="worried" wear={["slippers"]} /></World>; },
    cam: mv("s21_cross", c([-24, 40, 26], [-8, 0, 52], 50), c([-23, 39, 27.5], [-8, 0, 52], 49)),
  }),
  // (23) inside: ME pulls our door open before he can knock
  mk("s22_open", {
    scene: (t) => { const [a0, b0] = span("s22_open"); const op = 0.42 * io(seg(t, a0 + 0.3, b0));
      const k = doorKnob(op, true), p: V3 = [lerp(0.9, 1.8, io(seg(t, a0 + 0.3, b0))), F, lerp(6.8, 5.3, io(seg(t, a0 + 0.3, b0)))];
      const a0A: A = { position: p, yaw: yawTo(p, k) + 0.5, pose: M.mix({ lean: 0.04 }) };
      const a: A = { ...a0A, pose: M.mix(a0A.pose, reachArm(st(a0A, KS), -1, k).pose) };
      return <World t={t} homeCut inside="home" our={0} ourDoor={op} focus={[-2, F, 6]} room={{ curtain: 0.3, lamp: 0, hall: 0.6 }}>
        <C look={ME} s={KS} t={t} a={a} cs={CS_HOMECUT} expr="worried" blinkSeed={1} />
        <C look={BELL_COAT} t={t} a={{ position: [DOOR_X + 0.2, F, 12.6], yaw: Math.PI, pose: M.knock(t, at(13, "knock"), 1) }} cs={CS_HOMECUT} expr="worried" wear={["slippers"]} />
      </World>; },
    cam: mv("s22_open", c([-6.6, 5.4, 1.2], [-1.0, 3.8, 7.2], 46), c([-6.3, 5.4, 1.5], [-1.0, 3.8, 7.2], 45)),
  }),
  // (24) on our porch: the door swings open, his fist is already up to knock, and stops
  mk("s23_knock", {
    scene: (t) => { const [a0, b0] = span("s23_knock"); const op = lerp(0.42, 0.75, io(seg(t, a0, b0 - 0.3)));
      const fist: Pose = { armR: 1.55, armROut: 0.05, lean: 0.03, head: [0, 0.03] };
      const bA: A = { position: [DOOR_X + 0.2, F, 12.6], yaw: Math.PI, pose: M.mix(M.idle(t, 3, 0.3), fist) };
      const me: A = { position: [DOOR_X + 0.6, F, 6.4], yaw: 0.05, pose: M.idle(t, 7, 0.4) };
      return <World t={t} homeCut our={0} ourDoor={op} focus={[-3, F, 11]} room={{ hall: 0.8, lamp: 0 }}>
        <C look={BELL_COAT} t={t} a={bA} cs={CS_HOMECUT} others={[st(me, KS)]} expr={t < at(13, "knock") ? "worried" : "surprised"} wear={["slippers"]} blinkSeed={2} />
        <C look={ME} s={KS} t={t} a={me} cs={CS_HOMECUT} expr="worried" blinkSeed={1} />
      </World>; },
    cam: mv("s23_knock", c([5.6, 5.4, 13.0], [-2.4, 4.4, 10.8], 42), c([5.2, 5.4, 13.1], [-2.4, 4.4, 10.8], 41)),
  }),
  // (25) not angry: worried. Seen from inside, warm hall light on his face; ME's head a sliver at the bottom
  mk("s24_face", {
    scene: (t) => <World t={t} homeCut inside="home" our={0} ourDoor={0.75} focus={[-3, F, 9]} room={{ hall: 1, lamp: 0 }}>
      <C look={BELL_COAT} t={t} a={{ position: [DOOR_X + 0.2, F, 12.6], yaw: Math.PI, pose: M.mix(M.idle(t, 3, 0.4), M.headShake(t, at(14, "angry"), at(14, "angry") + 0.6, 3)) }} cs={CS_HOMECUT} expr="worried" wear={["slippers"]} blinkSeed={2} />
      <C look={ME} s={KS} t={t} a={{ position: [DOOR_X + 1.5, F, 6.6], yaw: -0.15, pose: M.idle(t, 7, 0.4) }} cs={CS_HOMECUT} expr="worried" blinkSeed={1} />
    </World>,
    cam: mv("s24_face", c([DOOR_X - 0.9, 6.3, 2.6], [DOOR_X + 0.2, 5.2, 12.6], 28), c([DOOR_X - 0.85, 6.25, 3.3], [DOOR_X + 0.2, 5.2, 12.6], 27)),
  }),
  // (26) he looks past ME into the house, hand on his chest: scared
  mk("s25_past", {
    scene: (t) => { const [a0] = span("s25_past");
      const pose = M.mix(M.idle(t, 3, 0.3), { armL: 1.38 * M.env(t, a0 + 0.1), armLOut: -0.33 * M.env(t, a0 + 0.1), head: [0.45 * M.env(t, a0 + 0.05), -0.05], lean: 0.08 * M.env(t, a0 + 0.1) });
      return <World t={t} homeCut our={0} ourDoor={0.75} focus={[-3, F, 11]} room={{ hall: 1, lamp: 0 }}>
        <C look={BELL_COAT} t={t} a={{ position: [DOOR_X + 0.2, F, 11.4], yaw: Math.PI, pose }} cs={CS_HOMECUT} expr="scared" wear={["slippers"]} blinkSeed={2} />
        <C look={ME} s={KS} t={t} a={{ position: [DOOR_X - 0.8, F, 7.0], yaw: 0.15, pose: M.idle(t, 7, 0.4) }} cs={CS_HOMECUT} expr="worried" blinkSeed={1} />
      </World>; },
    cam: mv("s25_past", c([DOOR_X - 2.2, 5.0, 16.6], [DOOR_X + 0.4, 4.9, 10.6], 36), c([DOOR_X - 2.0, 5.0, 16.0], [DOOR_X + 0.4, 4.9, 10.6], 35)),
  }),
  // (27) Dad wakes and waves from the couch: relief
  mk("s26_wake", {
    scene: (t) => { const [a0] = span("s26_wake"); const d = dadCouch(t, -10, a0 + 0.02);
      const a: A = { ...d, pose: M.mix(d.pose, { head: [0.0, -0.05 * M.env(t, a0 + 0.1)] }, M.wave(t, a0 + 0.22, Infinity, 1, 1.0)) };
      return <World t={t} homeCut inside="home" our={0} ourDoor={0.75} focus={[6, F, 1]} room={{ lamp: 1, hall: 1 }}>
        <C look={DAD} t={t} a={a} cs={CS_HOMECUT} expr={t < a0 + 0.15 ? "surprised" : "happy"} blink={t < a0 + 0.05 ? 1 : undefined} wear={["brace"]} blinkSeed={5} />
      </World>; },
    cam: mv("s26_wake", c([2.4, 5.6, 2.4], [7.4, 4.4, 0.6], 40), c([2.8, 5.5, 2.2], [7.4, 4.4, 0.6], 39)),
  }),
  // (28) the two men laugh on the couch
  mk("s27_laugh", {
    scene: (t) => { const [a0] = span("s27_laugh"); const d = dadCouch(t, 1e6), bseat: V3 = [7.4, COUCH.seat, -3.3];
      const b: A = M.sit(bseat, bseat, -Math.PI / 2, t, -5, 0.1);
      const bA: A = { ...b, pose: M.mix(b.pose, M.laugh(t, a0 + 0.1, Infinity), { head: [0.25, 0] }) };
      const dA: A = { ...d, pose: M.mix(d.pose, M.laugh(t, a0 + 0.18, Infinity), { head: [-0.25, 0] }) };
      return <World t={t} homeCut inside="home" our={0} ourDoor={0.05} focus={[6, F, -1]} room={{ lamp: 1, hall: 1 }}>
        <C look={DAD} t={t} a={dA} cs={CS_HOMECUT} others={[st(bA)]} expr="laugh" wear={["brace"]} blinkSeed={5} />
        <C look={BELL_COAT} t={t} a={bA} cs={CS_HOMECUT} others={[st(dA)]} expr="laugh" wear={["slippers"]} blinkSeed={2} />
      </World>; },
    cam: mv("s27_laugh", c([1.4, 5.8, -1.2], [7.6, 4.0, -1.1], 42), c([1.8, 5.7, -1.2], [7.6, 4.0, -1.1], 41)),
  }),
  // (29) CLUE: our light switch; ME's hand comes up next to it
  mk("s28_switch", {
    scene: (t) => { const [a0] = span("s28_switch");
      const a: A = { position: SWITCH_STAND(KS), yaw: -Math.PI / 2, pose: M.idle(t, 7, 0.3) };
      const full = onSwitch("home", a, KS, -10, [], 1), u = io(seg(t, a0 + 0.15, a0 + 0.7));
      const aa: A = { ...a, pose: M.mix(a.pose, { armL: (full.armL ?? 0) * u * 0.92, armLOut: (full.armLOut ?? 0) * u, head: [0.35, -0.14] }) };
      return <World t={t} homeCut inside="home" our={0} focus={[0, F, 7]} room={{ hall: 1, lamp: 1 }}>
        <C look={ME} s={KS} t={t} a={aa} cs={CS_HOMECUT} expr="smile" blinkSeed={1} />
      </World>; },
    cam: (t) => { const w = sw0(); return mv("s28_switch", c(add(w, [-2.9, 0.2, -3.6]), add(w, [0.2, -0.7, -0.6]), 36), c(add(w, [-2.6, 0.15, -3.2]), add(w, [0.2, -0.7, -0.6]), 34))(t); },
  }),
  // (30) the next night: Mr. Bell flashes first (CLUE: stable view)
  mk("s29_next", {
    scene: (t) => { const a = bellAtSwitch(t, FL.bell16, 0.04);
      return <World t={t} bellCut bellDoor={0.92} bell={bellLamp(t, FL.bell16)} focus={B([-3, 0, 12])}>
        <C look={BELL} t={t} a={a} cs={CS_BELLCUT} expr="smile" wear={["slippers"]} blinkSeed={2} />
      </World>; },
    cam: mv("s29_next", c(B([-1.0, 5.6, 17.5]), B([-4.6, 4.9, 9.2]), 32), c(B([-1.2, 5.6, 16.7]), B([-4.6, 4.9, 9.2]), 31)),
  }),
  // (31) ME, on tiptoe, takes Dad's turn: three flashes (CLUE)
  mk("s30_me", {
    scene: (t) => { const [a0] = span("s30_me"); const lift = 0.3 * io(seg(t, a0, a0 + 0.2));
      const a0A: A = { position: SWITCH_STAND(KS), yaw: -Math.PI / 2, pose: M.idle(t, 7, 0.3) };
      const a: A = { ...a0A, pose: M.mix(a0A.pose, onSwitch("home", a0A, KS, t, FL.me17, 1, lift), { head: [-0.3, -0.12] }) };
      return <World t={t} homeCut inside="home" our={ourLamp(t, FL.me17)} focus={[-3, F, 6]} room={{ hall: 1, lamp: 1 }}>
        <C look={ME} s={KS} t={t} a={a} lift={lift} cs={CS_HOMECUT} expr="grin" blinkSeed={1} />
      </World>; },
    cam: mv("s30_me", c([-5.4, 4.6, 2.4], [1.0, 3.8, 6.4], 40), c([-5.0, 4.55, 2.8], [1.0, 3.8, 6.4], 39)),
  }),
  // (32) Mr. Bell sees our answer: nods, smiles
  mk("s31_nod", {
    scene: (t) => { const [a0] = span("s31_nod"); const a: A = { position: BELL_DOOR_AT, yaw: bellFacingUs(DOORWAY_SPOT), pose: M.mix(M.idle(t, 3, 0.4), M.nod(t, a0 + 0.2, 2, 4)) };
      return <World t={t} bellCut bellDoor={0.92} bell={1} focus={B([-3, 0, 12])}>
        <C look={BELL} t={t} a={a} cs={CS_BELLCUT} expr={t < a0 + 0.15 ? "smile" : "happy"} wear={["slippers"]} blinkSeed={2} />
      </World>; },
    cam: mv("s31_nod", c(B([-5.6, 5.7, 15.4]), B([-4.0, 5.3, 8.0]), 30), c(B([-5.4, 5.7, 14.6]), B([-4.0, 5.3, 8.0]), 29)),
  }),
  // (33) the hook angle: he steps back in and switches his porch light off on "safe" (loops into shot 1)
  mk("s32_home", {
    scene: (t) => { const off = at(18, "safe"); const a = bellAtSwitch(t, [], 0.02, { lower: [off + 0.12, off + 0.4] });
      const press = Math.sin(Math.PI * seg(t, off - 0.15, off + 0.1));
      const aa: A = { ...a, pose: M.mix(a.pose, { armR: 0.12 * press }) };
      return <World t={t} bellCut bellDoor={0.92} our={0} bell={t < off ? 1 : 0} focus={[-6, 0, 50]}>
        <C look={BELL} t={t} a={aa} cs={CS_BELLCUT} expr="happy" wear={["slippers"]} blinkSeed={2} />
      </World>; },
    cam: mv("s32_home", c(add(HOOK_CAM().pos, [0, 0.05, 0.6]), [-3.4, 5.7, 10], 41.5), HOOK_CAM()),
  }),
];

// ---------------------------------------------------------------- cameras (review pass 2: medium framing, 6-12 units away)
/** A camera `d` from p, in direction `yaw` (world, 0 = +z), at height h above p's floor, aimed at height th, sliding
 *  `push` closer over the shot. */
const orbitCam = (id: string, p: V3, yaw: number, d: number, h: number, th: number, fov: number, push = 0.08, side = 0): ((t: number) => CamS) => {
  const at2 = (dd: number, yy: number): V3 => [p[0] + Math.sin(yy) * dd, p[1] + h, p[2] + Math.cos(yy) * dd];
  const tg: V3 = [p[0], p[1] + th, p[2]];
  return mv(id, c(at2(d, yaw), tg, fov), c(at2(d * (1 - push), yaw + side), tg, fov - 1));
};
const bellDoorW = () => BELL_DOOR_AT;
const CAMS: Record<string, (t: number) => CamS> = {
  s01_hook: mv("s01_hook", c(B([-4.4, 6.6, 13.2]), [-3, 5.6, 10], 30), c(B([-4.4, 6.55, 12.6]), [-3, 5.6, 10], 29)),
  s32_home: mv("s32_home", c(B([-4.4, 6.65, 13.8]), [-3, 5.7, 10], 31), c(B([-4.4, 6.6, 13.2]), [-3, 5.6, 10], 30)),
  s02_nod: orbitCam("s02_nod", bellDoorW(), Math.PI, 8.6, 5.6, 3.6, 36),
  s06_bellflash: orbitCam("s06_bellflash", B([-4.6, F, 6.9]), Math.PI + 0.12, 10.8, 5.6, 4.3, 38),
  s07_watch: orbitCam("s07_watch", bellDoorW(), Math.PI - 0.12, 7.4, 4.9, 4.3, 28),
  s14_again: orbitCam("s14_again", B([-4.6, F, 6.9]), Math.PI - 0.05, 10.8, 7.2, 4.3, 38),
  s29_next: orbitCam("s29_next", B([-4.6, F, 6.9]), Math.PI + 0.2, 10.8, 5.4, 4.3, 38),
  s31_nod: orbitCam("s31_nod", B([-3.0, F, 6.6]), Math.PI + 0.1, 8.4, 5.0, 4.0, 30),
  s17_slippers: (t) => { const [a0, b0] = span("s17_slippers"), u = io(seg(t, a0, b0)), p = BELL_STAND(), y = yawTo(p, OUR_WIN) - 0.25;
    return c([p[0] + Math.sin(y) * 8.5, p[1] + 1.5, p[2] + Math.cos(y) * 8.5], [p[0], p[1] + lerp(0.8, 3.4, u), p[2]], 44); },
  s17_stare: orbitCam("s17_stare", BELL_STAND(), yawTo(BELL_STAND(), OUR_WIN) - 0.18, 7.0, 4.8, 4.4, 28, 0.18),
  s08_dadflash: mv("s08_dadflash", c([-5.4, 5.8, 2.4], [0.4, 4.2, 5.8], 42), c([-5.0, 5.75, 2.7], [0.4, 4.2, 5.8], 41)),
  s30_me: mv("s30_me", c([-5.0, 5.0, 2.8], [0.4, 3.7, 5.9], 40), c([-4.6, 4.95, 3.1], [0.4, 3.7, 5.9], 39)),
  s10_stairs: mv("s10_stairs", c([-6.2, 5.8, 7.8], [-7.75, 4.0, 0.0], 40), c([-6.3, 5.7, 7.2], [-7.75, 4.0, 0.0], 39)),
  s11_couch: mv("s11_couch", c([-1.8, 6.6, 5.4], [7.4, 4.0, 0.9], 40), c([-1.2, 6.5, 5.0], [7.4, 4.0, 0.9], 39)),
  s12_clock: mv("s12_clock", c([2.6, 9.6, 0.4], [CLOCK[0], CLOCK[1] - 1.0, CLOCK[2]], 30), c([3.4, 9.5, 0.4], [CLOCK[0], CLOCK[1] - 0.8, CLOCK[2]], 26)),
  s18_look: mv("s18_look", c([8.2, 5.6, 8.0], [WIN_L[0] - 0.3, 4.2, FRONT_Z - 2.6], 44), c([8.0, 5.55, 7.8], [WIN_L[0] - 0.3, 4.2, FRONT_Z - 2.6], 43)),
  s20_coat: mv("s20_coat", c(B([2.4, 6.4, 0.2]), B([-6.0, 4.0, 4.4]), 40), c(B([2.0, 6.3, 0.5]), B([-6.0, 4.0, 4.4]), 39)),
  s22_open: mv("s22_open", c([6.2, 6.0, -2.2], [-1.4, 4.0, 7.4], 42), c([5.8, 5.95, -1.8], [-1.4, 4.0, 7.4], 41)),
  s23_knock: mv("s23_knock", c([6.6, 5.6, 13.6], [-2.6, 4.4, 11.4], 40), c([6.2, 5.6, 13.6], [-2.6, 4.4, 11.4], 39)),
  s24_face: mv("s24_face", c([-4.0, 6.3, 0.8], [DOOR_X + 0.2, 5.5, 12.6], 25), c([-3.95, 6.25, 1.6], [DOOR_X + 0.2, 5.5, 12.6], 24)),
  s25_past: mv("s25_past", c([1.6, 6.9, 2.0], [DOOR_X + 0.2, 5.4, 11.4], 28), c([1.5, 6.85, 2.6], [DOOR_X + 0.2, 5.4, 11.4], 27)),
  s26_wake: mv("s26_wake", c([-1.0, 6.0, 1.8], [7.4, 4.0, 0.9], 36), c([-0.4, 5.9, 1.7], [7.4, 4.0, 0.9], 35)),
  s27_laugh: mv("s27_laugh", c([-2.6, 6.0, -1.2], [7.4, 4.0, -1.2], 42), c([-2.0, 5.9, -1.2], [7.4, 4.0, -1.2], 41)),
  s28_switch: (t) => { const w = sw0(); return mv("s28_switch", c(add(w, [-6.2, 0.5, -6.6]), add(w, [0.0, -1.2, -0.8]), 30), c(add(w, [-5.8, 0.45, -6.2]), add(w, [0.0, -1.0, -0.8]), 29))(t); },
};
/** Portrait frames are narrow: like the game's camera (fov ~70), every medium shot gets a wide lens so whole bodies and
 *  the place around them fit (review pass 3). Long-lens and wide shots keep theirs. */
const KEEP_FOV = new Set(["s01_hook", "s32_home", "s13_dark", "s16_pov", "s21_cross"]);
const widen = (f: (t: number) => CamS) => (t: number): CamS => { const k = f(t); return { ...k, fov: Math.min(64, k.fov * 1.6) }; };
export const SHOTS09: Shot[] = SHOTS_RAW.map((s) => { const cam = CAMS[s.id] ?? s.cam; return { ...s, cam: KEEP_FOV.has(s.id) ? cam : widen(cam) }; });

// ---------------------------------------------------------------- scene pieces used by several shots
/** Where someone of scale s stands (side-on, facing +x) so the right arm out sideways lands on our switch. */
function SWITCH_STAND(s: number): V3 { return [SWITCH_IN_L[0], F, INNER_Z - (1.5 + 2.0) * s - 0.02]; }
function sw0(): V3 { return W("home", SWITCH_IN_L); }
/** Dad on the couch facing -x, braced leg up on the ottoman; `sleepAt`: his head drops (asleep). */
function dadCouch(t: number, sleepAt: number, wakeAt = 1e6): A {
  const seat: V3 = [7.4, COUCH.seat, (OTTOMAN.z0 + OTTOMAN.z1) / 2];
  const a = M.sit(seat, seat, -Math.PI / 2, t, -5, 0.1);
  const z = io(seg(t, sleepAt, sleepAt + 0.35)) * (1 - io(seg(t, wakeAt, wakeAt + 0.25))), snore = Math.sin(t * 2.4) * 0.03 * z;
  return { ...a, pose: M.mix(a.pose, { head: [0.1 * z, 0.32 * z + snore], tilt: 0.22 * z, lean: -0.06 * z, armL: -0.25 * z, armR: -0.25 * z }) };
}
/** Mr. Bell standing at the top of his porch steps (world). */
function BELL_STAND(): V3 { return B([DOOR_X + 0.4, F, 13.4]); }
function bellStand(t: number): A { const p = BELL_STAND(); return { position: p, yaw: yawTo(p, OUR_WIN), pose: { head: [0, 0.02 + nz(t, 3) * 0.004] } }; }

export { CUTS, span };
void atE; void LAMP_L; void InLot;

// ---------------------------------------------------------------- events for the sound (episodes/09_porch_light/events09.json)
/** Every sound-worthy action in the picture, from the same word anchors the shots use. kind: what it is; t: seconds. */
export const EVENTS09 = (): { kind: string; t: number; t1?: number; note?: string }[] => {
  const ev: { kind: string; t: number; t1?: number; note?: string }[] = [];
  const flips = (name: string, fl: [number, number][], where: string) => fl.forEach(([a, b], i) => {
    ev.push({ kind: "switch_click", t: a, note: `${name} flash ${i + 1} on (${where})` });
    ev.push({ kind: "switch_clack", t: b, note: `${name} flash ${i + 1} off (${where})` });
  });
  flips("our porch (hook)", FL.hook, "seen from across the street"); flips("Mr. Bell", FL.bell3, "his doorway, close");
  flips("Dad", FL.dad4, "our hall, close"); flips("Mr. Bell again", FL.bell8, "his doorway, close");
  flips("Mr. Bell next night", FL.bell16, "his doorway, close"); flips("ME", FL.me17, "our hall, close");
  ev.push({ kind: "switch_click", t: at(18, "safe"), note: "Mr. Bell switches his porch light off (goes home)" });
  const [s02a, s02b] = span("s02_nod"); ev.push({ kind: "door_close", t: s02b - 0.08, note: "Mr. Bell's door shuts" }); void s02a;
  ev.push({ kind: "cart_rattle", t: at(2, "home"), note: "Dad lets go of the cart" });
  ev.push({ kind: "steps_hurry_shop", t: at(2, "home"), t1: span("s03_store")[1], note: "Dad hurries off (store floor)" });
  ev.push({ kind: "steps_hurry_path", t: span("s05_path")[0], t1: span("s05_path")[1], note: "Dad up our path, dusk" });
  ev.push({ kind: "clock_tick", t: span("s12_clock")[0], t1: span("s12_clock")[1], note: "wall clock" });
  ev.push({ kind: "clock_flip", t: at(7, "Nine"), note: "8:59 -> 9:00 (a soft chime)" });
  ev.push({ kind: "snore", t: at(6, "asleep"), t1: span("s19_tiptoe")[1], note: "Dad snoring softly (only in our living room shots)" });
  ev.push({ kind: "tiptoe", t: span("s19_tiptoe")[0], t1: span("s19_tiptoe")[1], note: "ME tiptoes on wood" });
  ev.push({ kind: "coat_whoosh", t: at(12, "coat", 1, 0.12), note: "coat swung on" });
  ev.push({ kind: "slipper_steps_fast", t: at(12, "hurried", 1, -0.1), t1: span("s21_cross")[1], note: "slippers slapping across the road" });
  ev.push({ kind: "door_open", t: span("s22_open")[0] + 0.3, note: "ME pulls our door open" });
  ev.push({ kind: "knock_that_never_comes", t: at(13, "knock"), note: "the fist stops: silence / a tiny breath" });
  ev.push({ kind: "laugh_two_men", t: span("s27_laugh")[0] + 0.1, t1: span("s27_laugh")[1], note: "Dad and Mr. Bell laugh" });
  ev.push({ kind: "piano_rise", t: at(15, "scared"), note: "warm piano rises (the turn: scared FOR Dad)" });
  ev.push({ kind: "question_pop", t: T.END - 3, note: "on-screen question pops in" });
  return ev.sort((x, y) => x.t - y.t);
};
/** Where each shot is (for ambience beds). */
export const PLACE09: Record<string, "street_night" | "street_dusk" | "store" | "our_room" | "bell_hall"> = {
  s01_hook: "bell_hall", s02_nod: "street_night", s03_store: "store", s04_cereal: "store", s05_path: "street_dusk",
  s06_bellflash: "street_night", s07_watch: "street_night", s08_dadflash: "our_room", s10_stairs: "our_room", s11_couch: "our_room",
  s12_clock: "our_room", s13_dark: "street_night", s14_again: "street_night", s15_wave: "our_room", s16_pov: "street_night",
  s17_slippers: "street_night", s17_stare: "street_night", s18_look: "our_room", s19_tiptoe: "our_room", s20_coat: "bell_hall",
  s21_cross: "street_night", s22_open: "our_room", s23_knock: "street_night", s24_face: "our_room", s25_past: "street_night",
  s26_wake: "our_room", s27_laugh: "our_room", s28_switch: "our_room", s29_next: "street_night", s30_me: "our_room",
  s31_nod: "street_night", s32_home: "bell_hall",
};

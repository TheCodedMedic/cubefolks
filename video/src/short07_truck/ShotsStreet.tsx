// Short 07 street shots (lead): the truck at night. s01 (hook), s04-s05 (Toby gets a cone), s19-s21 (it stops at our
// house), s35 (the loop into s01). Rig units; the street is Short 6's MyStreet (runs along x; our house HOME lot x = 0,
// Toby lives next door at lot x = 32; near lane of the road z ~43.5).
import React from "react";
import { MyStreet, STREET } from "../short06_blocky/Town";
import { BlockLights, Sky, Grade } from "../blocky/Look";
import * as M from "../blocky/Motion";
import * as K from "../blocky/Collide";
import type { Shot } from "../kit/core";
import { io, lerp, seg } from "../kit/core";
import { add, c, Ch, E, eyeY, isWrong, mk, mv, notePulse, S, span, st, TOBY, V3 } from "./common";
import { Cone, HAND_FIST, Truck, TRUCK, truckCS, truckPt } from "./Props07";

// ---------------------------------------------------------------- the truck's moves
const LANE_Z = 43.5, YAW = -Math.PI / 2; // driving -x, the serving window faces our houses (-z)
const STOP_X = 4;                         // "outside my window": in front of our house
const TOBY_TRUCK_X = 30.5;                // parked at Toby's (lot 32): the window lands just right of his gate
/** Truck x for a roll that decelerates from x0 to x1 over [a, b] (stopping at b). */
const roll = (t: number, x0: number, x1: number, a: number, b: number) => { const u = seg(t, a, b); return lerp(x0, x1, 1 - (1 - u) * (1 - u)); };
const wheel = (x: number) => -x / 1.7;
/** The jingle starts before frame 0 (it is already playing): picture pulses use this t0 (sound places the jingle here too). */
export const JINGLE_T0 = -0.4;
const TruckAt: React.FC<{ x: number; t: number; glow?: number; lights?: number; bob?: number; handOut?: number }> = ({ x, t, glow = 1, lights = 1, bob = 0, handOut = 0 }) =>
  <Truck position={[x, 0.03, LANE_Z]} yaw={YAW} glow={glow} lights={lights} wheelTurn={wheel(x)} bob={bob} handOut={handOut} pulse={notePulse(t, JINGLE_T0)} spark={isWrong(t, JINGLE_T0) ? notePulse(t, JINGLE_T0) : 0} />;

// ---------------------------------------------------------------- the night street
const Night: React.FC<{ focus: V3; children?: React.ReactNode }> = ({ focus, children }) => <>
  <Sky time="night" />
  <BlockLights time="night" focus={focus} practicalAt={[0, 7, 14]} />
  <MyStreet time="night" />
  {children}
</>;
/** Street colliders near Toby's walk (lot 32): the picket fence beside his gate, the curb is a step (groundFn). */
const streetCS = (truckX: number): K.Box[] => [
  K.box([32, 0.06, 32.5], [60, 0.12, 4], "sidewalk"),
  K.box([32, 0.1, 37.75], [60, 0.2, 0.5], "curb"),
  K.box([32 - 1.9 - 6.85, 1.5, 30], [13.7, 3, 0.4], "fence"), K.box([32 + 1.9 + 6.85, 1.5, 30], [13.7, 3, 0.4], "fence"),
  ...truckCS([truckX, 0.03, LANE_Z], YAW),
];
const ground = K.groundFn(streetCS(TOBY_TRUCK_X));
/** For the clip checks: the solid things (the 0.12 sidewalk and 0.2 curb are steps the ground function handles). */
const solidCS = (truckX: number) => streetCS(truckX).filter((b) => b.name !== "sidewalk" && b.name !== "curb");

// ---------------------------------------------------------------- Toby at the truck (s04-s05)
const WIN = () => truckPt([TOBY_TRUCK_X, 0.03, LANE_Z], YAW, TRUCK.window); // serving window centre (world)
const FIST = () => truckPt([TOBY_TRUCK_X, 0.03, LANE_Z], YAW, HAND_FIST);
const TOBY_STOP = (): V3 => [FIST()[0] + 1.15, 0.2, 37.5]; // the pale fist straight in front of his right shoulder
const TOBY_PATH = (): V3[] => [[36.2, 0.12, 33.4], [33.0, 0.12, 33.6], [32.2, 0, 36.2], TOBY_STOP()];
const TOBY_GO = () => E.last3 - 0.01 - M.walkDuration(TOBY_PATH(), { scale: S.kid });
/** When Toby's fingers close on the cone (the hand-off), inside s05. */
const tobyTook = () => { const [a, b] = span("s05_handoff"); return lerp(a, b, 0.62); };
const tobyAct = (t: number) => {
  const [a] = span("s04_tobywalk");
  const w = M.walkPath(TOBY_PATH(), t, TOBY_GO(), { scale: S.kid, gait: "walk", ground, yaw1: 0, turnOut: 0.25 });
  // reaching up for the cone: from the end of the walk, the right hand goes up toward the window ledge
  const tReach = E.last3 - 0.22; void a;
  const k = M.ease(seg(t, tReach, tReach + 0.35));
  const base: M.Act = M.act(w, !w.moving && M.idle(t, 3, 0.5), { head: [0, -0.35 * k] });
  if (k <= 0) return base;
  const tk = tobyTook(), back = M.ease(seg(t, tk, tk + 0.3));
  const target: V3 = add(FIST(), [0, -0.4, -0.1]); // just under the pale fist: the hand-off
  const r = K.reachArm(st(base, S.kid), -1, target);
  const ar = lerp(base.pose?.armR ?? 0, r.pose.armR ?? 0, k), ao = lerp(base.pose?.armROut ?? 0, r.pose.armROut ?? 0, k);
  const snap = M.headSnap(t, tk + 0.12, -1.15, 0.05).head ?? [0, 0];
  return { ...base, pose: { ...base.pose, armR: lerp(ar, 1.05, back), armROut: lerp(ao, 0.05, back), head: [snap[0], lerp(-0.35 * k, 0.05, back)] } };
};

// ---------------------------------------------------------------- cameras
// s01/s35 hook framing: low across the road (far side), looking back at the truck in front of our house.
const HOOK0 = c([-24, 6.5, 72], [5, 7.4, 42], 40), HOOK1 = c([-16.5, 8.4, 63.5], [4, 9.5, 42], 34);
const PRE = c([-27, 6.0, 75], [7, 7.2, 42], 42);

// ---------------------------------------------------------------- shots
export const SHOTS_STREET: Shot[] = [
  // (1) THE HOOK, frame 0: the truck creeps in at 3 a.m., glowing, and stops in front of our house; the camera pushes
  // up toward the roof where the EMPTY speaker mount sits, wires hanging. 3:00 AM on screen (Overlay07).
  mk("s01_truck", {
    scene: (t) => { const [a, b] = span("s01_truck"), x = roll(t, 16, STOP_X, a, b + 0.3);
      return <Night focus={[x, 0, LANE_Z]}><TruckAt t={t} x={x} bob={Math.sin(t * 6) * (1 - seg(t, a, b))} /></Night>; },
    cam: (t) => { const [a, b] = span("s01_truck"), x = roll(t, 16, STOP_X, a, b + 0.3), m = truckPt([x, 0.03, LANE_Z], YAW, TRUCK.mount);
      const g0 = add(m, [-1, -4.0, 0]), g1 = add(m, [0, -0.6, 0]);
      return mv("s01_truck", { ...HOOK0, target: L(g0, HOOK0.target, 0) }, { ...HOOK1, target: g1 })(t); },
    dom: () => <Grade time="night" />,
  }),
  // (4) "Toby took one": next door, Toby walks across the verge and off the curb to the truck's glowing window
  mk("s04_tobywalk", {
    scene: (t) => { const a = tobyAct(t);
      return <Night focus={[TOBY_TRUCK_X, 0, 40]}>
        <TruckAt t={t} x={TOBY_TRUCK_X} lights={0.6} />
        <Ch look={TOBY} a={a} t={t} scale={S.kid} expr={t < E.last3 - 0.1 ? "smile" : "happy"} blinkSeed={3} cs={solidCS(TOBY_TRUCK_X)} />
      </Night>; },
    cam: mv("s04_tobywalk", c([6, 4.4, 38.7], [32, 3.2, 35.6], 30), c([7.2, 4.3, 38.6], [32, 3.4, 35.9], 29)),
    dom: () => <Grade time="night" />,
  }),
  // (5) "last week": close at the window: a pale hand comes out of the dark with a glowing cone; Toby's hand takes it
  mk("s05_handoff", {
    scene: (t) => { const [a] = span("s05_handoff"), out = M.ease(seg(t, a - 0.1, a + 0.25)), took = t > tobyTook();
      const ta = tobyAct(t);
      return <Night focus={[TOBY_TRUCK_X, 0, 40]}>
        <TruckAt t={t} x={TOBY_TRUCK_X} lights={0.6} handOut={took ? 0 : out} />
        <Ch look={TOBY} a={ta} t={t} scale={S.kid} expr={t > tobyTook() + 0.12 ? "creepy" : "happy"} blinkSeed={3} cs={solidCS(TOBY_TRUCK_X)}
          hold={took ? { R: <Cone glow={0.8} /> } : undefined} />
      </Night>; },
    cam: (t) => { const w = WIN(), h = add(TOBY_STOP(), [0, eyeY(S.kid), 0]);
      const g = L(FIST(), h, 0.35); void w;
      return mv("s05_handoff", c(add(g, [-11.5, 0.4, 1.0]), add(g, [0, 0.6, 0]), 46), c(add(g, [-10.5, 0.35, 0.95]), add(g, [0, 0.6, 0]), 44))(t); },
    dom: () => <Grade time="night" />,
  }),
  // (19) "Last night": aerial straight down the dark street, the pink glow creeping toward our house
  mk("s19_aerial", {
    scene: (t) => { const [a, b] = span("s19_aerial"), x = lerp(52, 22, seg(t, a, b + 0.4));
      return <Night focus={[x - 10, 0, 30]}><TruckAt t={t} x={x} /></Night>; },
    cam: mv("s19_aerial", c([78, 40, 60], [12, 0, 36], 46), c([72, 38, 58.5], [8, 0, 36], 45)),
    dom: () => <Grade time="night" />,
  }),
  // (20) "the truck stopped outside our house": from our lawn, its window side to us, it rolls in and stops with a dip
  mk("s20_stops", {
    scene: (t) => { const [a, b] = span("s20_stops"), x = roll(t, 22, STOP_X, a, lerp(a, b, 0.75)), stopped = seg(t, lerp(a, b, 0.75), b);
      return <Night focus={[x, 0, 38]}><TruckAt t={t} x={x} bob={Math.sin(stopped * Math.PI * 2) * (1 - stopped) * 4} /></Night>; },
    cam: mv("s20_stops", c([-6, 14, 9.6], [5, 3.5, 42], 46), c([-5.6, 13.6, 10.6], [5, 3.6, 42], 45)),
    dom: () => <Grade time="night" />,
  }),
  // (21) "The engine went quiet": the cab front low and close; the headlights die on "quiet", the roof cone still glows
  mk("s21_engine", {
    scene: (t) => { const off = 1 - seg(t, E.quiet, E.quiet + 0.12);
      return <Night focus={[STOP_X, 0, LANE_Z]}><TruckAt t={t} x={STOP_X} lights={off} bob={Math.sin(t * 40) * 0.6 * off} /></Night>; },
    cam: (t) => { const f = truckPt([STOP_X, 0.03, LANE_Z], YAW, [0, 5.5, 10.5]);
      return mv("s21_engine", c(add(f, [-19, -1.6, -9.5]), add(f, [3, 0.4, 0]), 40), c(add(f, [-17.6, -1.5, -8.8]), add(f, [3, 0.6, 0]), 39))(t); },
    dom: () => <Grade time="night" />,
  }),
  // (35) "its next speaker.": the same street, the truck rolling back in toward the hook's start; ends on s01's first frame
  mk("s35_loop", {
    scene: (t) => { const [a, b] = span("s35_loop"), x = lerp(28, 16, seg(t, a, b));
      return <Night focus={[x, 0, LANE_Z]}><TruckAt t={t} x={x} bob={Math.sin(t * 6)} /></Night>; },
    cam: (t) => { const [a, b] = span("s35_loop"), x = lerp(28, 16, seg(t, a, b)), m = truckPt([x, 0.03, LANE_Z], YAW, TRUCK.mount);
      const end = { ...HOOK0, target: add(truckPt([16, 0.03, LANE_Z], YAW, TRUCK.mount), [-1, -4.0, 0]) };
      return mv("s35_loop", { ...PRE, target: add(m, [-1, -4.2, 0]) }, end, 0)(t); },
    dom: () => <Grade time="night" />,
  }),
];
function L(a: V3, b: V3, u: number): V3 { return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; }
void io; void STREET;

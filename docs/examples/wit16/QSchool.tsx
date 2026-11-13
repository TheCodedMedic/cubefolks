// Episode 16 full film, window "school" (core.tsx WIN2.school, beats 19-25): the school parking lot (Tyler's shiny new car, $2.31,
// "My dad says don't worry about it."), the hallway (Jordan at his locker, $3,840, "Lawns, man."), then the montage of numbers popping
// over heads like price tags (the shoes in the hall, the coach polishing his boat photo −$48,200, the lunch lady humming at the fryer
// $61,350, the principal's perfect suit −$9,870, the art teacher on a rusty bicycle $212,400). Every time is a measured word.
import React from "react";
import { CamS, L3, P, Shot, WIN2, at, c01, ex, io, seg } from "./core";
import { W16 } from "./Cast16";
import { BalanceTags, Tag, money, project } from "./Balance";
import { Face3, Look3, Person3D, Pose3, STAND } from "../cam3d/Person3D";
import { Bike6, Car6, RIDER6, reachArm, riderPose } from "../cam3d/Vehicles3D";
import { V3 } from "../ep04/Vfx";
import { headWorld, ptOf } from "../wit09/SetsPorch";
import { SCHOOL, SchoolFront } from "../wit10/SetsSchool";
import { FarCrowd, HallSet } from "../wit13/SetsQDinner";
import { BoatPhoto, CAR_P, Cloth, CoachOffice, FryBasket, FryKitchen, HALL_KIDS16, HallKids, LOOK_ART, LOOK_COACH, LOOK_LUNCH, LOOK_PRINCIPAL, OpenLocker, TYLER_P, YOU_LOT_P, kidHead } from "./SetsQSchool";

const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const sm = (u: number) => { const x = c01(u); return x * x * (3 - 2 * x); };
const [T0, T1] = WIN2.school[0];

// ─── the shot clock (all from words) ─────────────────────────────────────────────────────────────────────────────
const S_CAR = T0;                               // "Zero to sixty in four seconds.": Tyler by his new car
const S_PAY = P(20);                            // "How much is the payment?": you, squinting at his number
const S_DAD = P(21);                            // "My dad says don't worry about it.": Tyler, the grin a beat too long
const S_HALL = P(22);                           // "Jordan. How do you have three thousand, eight hundred dollars?": the locker two-shot
const S_LAWN = P(23);                           // "Lawns, man. Lawns, every Saturday since I was twelve."
const S_WAIT = at(23, "Wait") - 0.1;            // "Wait. How do you know that?": the squint, a push in
const S_LUCKY = P(24);                          // "Lucky guess.": you, caught
const S_SHOES = P(25);                          // "By lunch, you've stopped trusting anyone's shoes.": the feet in the hall, tilt up to the numbers
const S_COACH = at(25, "guy") - 0.22;           // "The guy with the boat is drowning."
const S_LUNCH = at(25, "lady") - 0.22;        // "The lady at the fryer is fine."
const S_PRIN = at(25, "principal's") - 0.2;        // "The principal's suit is on a payment plan."
const S_ART = at(25, "payment") - 0.1;          // the art teacher sails past on a rusty bike
const POP = 0.3;                                // a montage number pops in this long after its cut (cues_school.py: a ding each)
export const SCHOOL_POPS = [S_CAR + POP, S_HALL + POP, S_SHOES + 1.2, S_COACH + POP, S_LUNCH + POP, S_PRIN + POP, S_ART + POP];

// ─── people ──────────────────────────────────────────────────────────────────────────────────────────────────────
type Who = { pos: V3; yaw: number; pose: Pose3; look: Look3; face?: Face3; propL?: React.ReactNode; propR?: React.ReactNode; s?: number };
const P3: React.FC<{ w: Who }> = ({ w }) => <Person3D pos={w.pos} yaw={w.yaw} pose={w.pose} look={w.look} face={w.face} propL={w.propL} propR={w.propR} s={w.s} />;
const top = (w: Who, up = 0.3): V3 => ptOf(headWorld({ pos: w.pos, yaw: w.yaw, pose: w.pose, look: w.look, s: w.s }), [0, up, 0]);
const yawTo = (a: V3, b: V3) => Math.atan2(b[0] - a[0], b[2] - a[2]);

// the lot: Tyler (sunglasses, popped collar) by the car; you on the curb
const tyler = (t: number): Who => {
  const zero = sm(seg(t, at(19, "Zero") - 0.1, at(19, "Zero") + 0.3)) * (1 - sm(seg(t, S_PAY - 0.2, S_PAY + 0.3)));
  const dad = sm(seg(t, at(21, "dad") - 0.1, at(21, "dad") + 0.3));
  const base: Pose3 = { ...STAND, lean: -3 };
  return {
    pos: TYLER_P, yaw: yawTo(TYLER_P, YOU_LOT_P), look: W16.tyler,
    pose: { ...base, armL: [lerp(20, 62, zero), lerp(30, 58, zero), lerp(40, 20, zero)], handL: zero > 0.4 ? "open" : "relaxed", armR: [lerp(8, 26, dad), 8, lerp(14, 110, dad)], handR: dad > 0.5 ? "relaxed" : "relaxed",
      headTurn: lerp(0, 25, zero), headNod: -6 + 4 * dad, neckTilt: 6 * dad },
    face: { smile: 0.7 - 0.15 * dad + 0.1 * Math.sin(t * 2), brow: 0.2 + 0.25 * dad },
  };
};
const youLot = (t: number): Who => {
  const sq = sm(seg(t, S_PAY, S_PAY + 0.4));
  return { pos: YOU_LOT_P, yaw: yawTo(YOU_LOT_P, TYLER_P), look: W16.you, pose: { ...STAND, armL: [4, 7, 12], armR: [4, 7, 12], headNod: lerp(-4, -12, sq), headTurn: 0 },
    face: { brow: lerp(0.1, -0.45, sq), eyesBig: lerp(0.2, 0.05, sq), smile: 0 } };
};
// the hall: Jordan at his locker (faded green tee, cap backwards), you across from him
const JORDAN_P: V3 = [0.3, 0, 1.3], YOU_HALL_P: V3 = [-0.78, 0, 0.82];
const jordan = (t: number): Who => {
  const lawn = sm(seg(t, at(23, "Lawns") - 0.15, at(23, "Lawns") + 0.25)) * (1 - sm(seg(t, S_WAIT - 0.2, S_WAIT + 0.2)));
  const wait = sm(seg(t, at(23, "Wait") - 0.05, at(23, "Wait") + 0.35));
  const g = Math.sin(t * 5.2) * lawn;
  return {
    pos: JORDAN_P, yaw: yawTo(JORDAN_P, YOU_HALL_P) - 0.25 * (1 - wait), look: W16.jordan,
    pose: { ...STAND, lean: lerp(0, 6, wait), armR: [lerp(10, 48 + 8 * g, lawn), lerp(8, 18, lawn), lerp(20, 80, lawn)], handR: lawn > 0.4 ? "open" : "relaxed",
      armL: [lerp(30, 10, wait), 10, lerp(70, 20, wait)], handL: "relaxed", headTurn: lerp(-10, 0, wait), headNod: lerp(0, 6, wait), neckTilt: 8 * wait },
    face: { smile: lerp(0.45, 0, wait), brow: lerp(0.15, -0.55, wait), eyesBig: 0 },
  };
};
const youHall = (t: number): Who => {
  const ask = sm(seg(t, at(22, "How") - 0.1, at(22, "How") + 0.3)), caught = sm(seg(t, S_LUCKY - 0.1, S_LUCKY + 0.3));
  return { pos: YOU_HALL_P, yaw: yawTo(YOU_HALL_P, JORDAN_P), look: W16.you,
    pose: { ...STAND, armR: [lerp(8, 22, ask * (1 - caught)), 14, lerp(14, 95, ask * (1 - caught))], handR: "open", wristR: [0, 60 * ask], armL: [lerp(4, 40, caught), 12, lerp(10, 120, caught)], handL: "relaxed", headNod: lerp(-2, 4, caught), headTurn: lerp(0, -12, caught) },
    face: { eyesBig: lerp(0.55, 0.15, caught), brow: lerp(0.35, 0.1, caught), smile: lerp(0, 0.5, caught) } };
};
// the montage
const COACH_P: V3 = [0, 0, 0];
const coach = (t: number): Who => {
  const rub = Math.sin(t * 9) * 0.035, base: Pose3 = { ...STAND, lean: 8, headNod: 22 };
  return { pos: COACH_P, yaw: 0, look: LOOK_COACH, pose: { ...base, armL: reachArm(base, 1, [0.04, 1.18, 0.34]), handL: "grip", armR: reachArm(base, -1, [-0.02 + rub, 1.24 + rub * 0.5, 0.38]), handR: "grip" },
    face: { smile: 0.75, brow: 0.2 }, propL: <BoatPhoto />, propR: <Cloth /> };
};
const LUNCH_P: V3 = [0.1, 0, -0.1];
const lunch = (t: number): Who => {
  const base: Pose3 = { ...STAND, lean: 4, headNod: 6 + 3 * Math.sin(t * 2.4), neckTilt: 6 * Math.sin(t * 1.2) };
  return { pos: LUNCH_P, yaw: 2.6, look: LOOK_LUNCH, pose: { ...base, armR: reachArm(base, -1, [-0.12, 1.02, 0.42]), handR: "grip", armL: [12, 14, 40], handL: "relaxed", twist: 4 * Math.sin(t * 1.2) },
    face: { smile: 0.6, open: 0.12 + 0.08 * Math.abs(Math.sin(t * 6)), sing: true, closed: Math.sin(t * 0.9) > 0.6 }, propR: <FryBasket /> };
};
const PRIN_P: V3 = [2.4, 0, 0.9];
const principal = (t: number): Who => {
  const base: Pose3 = { ...STAND, lean: -2 }, tug = 0.012 * Math.sin(t * 6);
  return { pos: PRIN_P, yaw: Math.PI - 0.25, look: LOOK_PRINCIPAL, pose: { ...base, armR: reachArm(base, -1, [0.0, 1.38 + tug, 0.17]), handR: "pinch", armL: reachArm(base, 1, [0.03, 1.3, 0.16]), handL: "pinch", headNod: -8, headTurn: 6 },
    face: { smile: 0.4, brow: 0.1 } };
};
const ART_V = 3.4, ART_Z = 10.7, ART_X0 = 3.0;
const artX = (t: number) => ART_X0 + ART_V * (t - S_ART);
const artBike = (t: number): V3 => [artX(t), SCHOOL.roadY, ART_Z];
const artist = (t: number): Who => {
  const d = artX(t) - ART_X0, crank = d / 0.9, bp = artBike(t);
  return { pos: [bp[0], bp[1] + RIDER6[1], bp[2]], yaw: Math.PI / 2, look: LOOK_ART, pose: { ...riderPose(crank), headTurn: -24, headNod: -4 }, face: { smile: 0.8, brow: 0.2 } };
};

// ─── the numbers: the bus's cleanTags (at most 6, never overlapping, nobody at the frame edge; the named first) ──────
const MARGIN = 70;
type NTag = Tag & { named?: boolean };
const cleanTags = (cam: CamS, tags: NTag[], max = 6): Tag[] => {
  const pr = tags.map((g) => ({ g, p: project(cam, g.p) })).filter(({ p }) => p.d > 0.3);
  const order = [...pr.filter((x) => x.g.named), ...pr.filter((x) => !x.g.named).sort((a, b) => a.p.d - b.p.d)];
  const kept: { x0: number; x1: number; y0: number; y1: number }[] = [], out: Tag[] = [];
  for (const { g, p } of order) {
    if (out.length >= max) break;
    const scale = g.named ? 1 : 0.7;
    const px = Math.max(26, Math.min(64, (58 * scale * 3.2) / Math.max(0.6, p.d)));
    const w = px * (1.3 + 0.62 * (money(g.amount, g.cents ?? true).length + 2)), h = px * 1.45;
    const box = { x0: p.x - w / 2 - 8, x1: p.x + w / 2 + 8, y0: p.y - h - 6, y1: p.y + 4 };
    if (box.x0 < MARGIN || box.x1 > 1920 - MARGIN || box.y0 < 30 || p.y > 1080 - MARGIN) continue;
    if (kept.some((k) => k.x0 < box.x1 && box.x0 < k.x1 && k.y0 < box.y1 && box.y0 < k.y1)) continue;
    kept.push(box); out.push({ ...g, scale });
  }
  return out;
};
const pop = (t: number, t0: number) => ex(seg(t, t0, t0 + 0.25));
const Tags: React.FC<{ t: number; cam: CamS; tags: NTag[]; max?: number }> = ({ t, cam, tags, max }) => <BalanceTags cam={cam} tags={cleanTags(cam, tags, max)} t={t} />;

// ─── the scenes ──────────────────────────────────────────────────────────────────────────────────────────────────
const lotScene = (t: number) => (
  <>
    <SchoolFront t={t} bikes={3} />
    <Car6 p={CAR_P} yaw={Math.PI / 2} col="#C8102E" />
    <Car6 p={[2.2, SCHOOL.roadY, 9.05]} yaw={Math.PI / 2} col="#8A8E96" />
    <Car6 p={[13.6, SCHOOL.roadY, 9.05]} yaw={Math.PI / 2} col="#2A3A5A" />
    <P3 w={tyler(t)} /><P3 w={youLot(t)} />
  </>
);
const hallScene = (t: number, who: Who[]) => (
  <>
    <HallSet t={t} lightTo={[0, 0, 0.6]} />
    <OpenLocker x={0.62} />
    <FarCrowd t={t} x0={-16} x1={-5} n={22} />
    {who.map((w, i) => <P3 key={i} w={w} />)}
  </>
);
const C = (pos: V3, target: V3, fov: number): CamS => ({ pos, target, fov });
const camLerp = (a: CamS, b: CamS, u: number): CamS => ({ pos: L3(a.pos, b.pos, u), target: L3(a.target, b.target, u), fov: lerp(a.fov, b.fov, u) });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ─── THE SHOTS ───────────────────────────────────────────────────────────────────────────────────────────────────
export const SHOTS: Shot[] = [
  // a1 · the parking lot: Tyler by his shiny red car, sunglasses on, "Zero to sixty in four seconds." ($2.31); you on the curb.
  // A slow arc from the plaza, the car long behind him.
  {
    id: "s1car", t0: S_CAR, t1: S_PAY,
    scene: (t) => lotScene(t),
    cam: (t) => { const u = io(seg(t, S_CAR, S_PAY)); return camLerp(C([10.4, 1.35, 5.0], [7.5, 1.15, 7.9], 42), C([9.9, 1.4, 4.7], [7.35, 1.2, 7.6], 38), u); },
    dom: (t, cam) => <Tags t={t} cam={cam} tags={[{ p: top(tyler(t)), amount: 2.31, named: true, show: pop(t, S_CAR + POP) }, { p: top(youLot(t)), amount: 4.12, named: true }]} />,
  },
  // a2 · "How much is the payment?": over Tyler's shoulder onto you, squinting up at his number.
  {
    id: "s2pay", t0: S_PAY, t1: S_DAD,
    scene: (t) => lotScene(t),
    cam: (t) => { const u = io(seg(t, S_PAY, S_DAD)), h = top(youLot(t), 0); return camLerp(C([8.3, 1.92, 8.02], [h[0], h[1] - 0.12, h[2]], 38), C([8.25, 1.9, 7.95], [h[0], h[1] - 0.12, h[2]], 33), u); },
    dom: (t, cam) => <Tags t={t} cam={cam} tags={[{ p: top(youLot(t)), amount: 4.12, named: true }, { p: top(tyler(t)), amount: 2.31, named: true }]} />,
  },
  // a3 · "My dad says don't worry about it.": Tyler close, the car behind him, the grin held a beat too long; $2.31 over him.
  {
    id: "s3dad", t0: S_DAD, t1: S_HALL,
    scene: (t) => lotScene(t),
    cam: (t) => { const u = io(seg(t, S_DAD, S_HALL)), h = top(tyler(t), 0); return camLerp(C([7.0, 1.62, 6.55], [h[0], h[1] - 0.12, h[2]], 38), C([7.12, 1.6, 6.78], [h[0], h[1] - 0.1, h[2]], 31), u); },
    dom: (t, cam) => <Tags t={t} cam={cam} tags={[{ p: top(tyler(t)), amount: 2.31, named: true }]} />,
  },
  // b1 · the hallway: Jordan at his open locker (faded tee, grass-stained sneakers) and you: "Jordan. How do you have three
  // thousand, eight hundred dollars?" A slow push on the two-shot; $3,840 pops in over him.
  {
    id: "s4hall", t0: S_HALL, t1: S_LAWN,
    scene: (t) => hallScene(t, [jordan(t), youHall(t)]),
    cam: (t) => { const u = io(seg(t, S_HALL, S_LAWN)); return camLerp(C([-0.1, 1.62, -1.35], [-0.2, 1.4, 1.1], 46), C([-0.15, 1.6, -0.95], [-0.2, 1.42, 1.1], 40), u); },
    dom: (t, cam) => <Tags t={t} cam={cam} tags={[{ p: top(jordan(t)), amount: 3840, cents: false, named: true, show: pop(t, S_HALL + POP) }, { p: top(youHall(t)), amount: 4.12, named: true }]} />,
  },
  // b2 · "Lawns, man.": Jordan three-quarter, the hand telling it; the lockers behind.
  {
    id: "s5lawns", t0: S_LAWN, t1: S_WAIT,
    scene: (t) => hallScene(t, [jordan(t), youHall(t)]),
    cam: (t) => { const u = io(seg(t, S_LAWN, S_WAIT)), h = top(jordan(t), 0); return camLerp(C([-0.65, 1.62, 0.1], [h[0], h[1] - 0.2, h[2]], 40), C([-0.5, 1.62, 0.22], [h[0], h[1] - 0.18, h[2]], 36), u); },
    dom: (t, cam) => <Tags t={t} cam={cam} tags={[{ p: top(jordan(t)), amount: 3840, cents: false, named: true }]} />,
  },
  // b3 · "Wait. How do you know that?": a push in on his squint.
  {
    id: "s6wait", t0: S_WAIT, t1: S_LUCKY,
    scene: (t) => hallScene(t, [jordan(t), youHall(t)]),
    cam: (t) => { const u = io(seg(t, S_WAIT, S_LUCKY)), h = top(jordan(t), 0); return camLerp(C([-0.5, 1.62, 0.3], [h[0], h[1] - 0.15, h[2]], 34), C([-0.3, 1.6, 0.52], [h[0], h[1] - 0.12, h[2]], 30), u); },
    dom: (t, cam) => <Tags t={t} cam={cam} tags={[{ p: top(jordan(t)), amount: 3840, cents: false, named: true }]} />,
  },
  // b4 · "Lucky guess.": you, caught, over Jordan's shoulder; a sheepish half-smile, the hand to the back of the neck.
  {
    id: "s7lucky", t0: S_LUCKY, t1: S_SHOES,
    scene: (t) => hallScene(t, [jordan(t), youHall(t)]),
    cam: (t) => { const u = io(seg(t, S_LUCKY, S_SHOES)), h = top(youHall(t), 0); return camLerp(C([-0.02, 1.6, 1.66], [h[0], h[1] - 0.05, h[2]], 50), C([-0.08, 1.6, 1.62], [h[0], h[1] - 0.04, h[2]], 46), u); },
    dom: (t, cam) => <Tags t={t} cam={cam} tags={[{ p: top(youHall(t)), amount: 4.12, named: true }]} />,
  },
  // m1 · "By lunch, you've stopped trusting anyone's shoes.": low on the hallway floor, sneakers and boots striding past, then a
  // tilt up to the numbers popping over their heads.
  {
    id: "s8shoes", t0: S_SHOES, t1: S_COACH,
    scene: (t) => <><HallSet t={t} lightTo={[-1, 0, 0]} /><FarCrowd t={t} x0={-16} x1={-6} n={20} /><HallKids t={t} t0={S_SHOES} /></>,
    cam: (t) => { const u = io(seg(t, S_SHOES + 0.3, S_COACH - 0.1)); return camLerp(C([-1.1, 0.28, -1.62], [-0.6, 0.18, 1.6], 50), C([-1.2, 1.15, -1.62], [-0.6, 1.75, 1.6], 52), u); },
    dom: (t, cam) => <Tags t={t} cam={cam} tags={HALL_KIDS16.map((k, i) => ({ p: kidHead(k, t, S_SHOES), amount: k.amount, cents: Math.abs(k.amount) < 1000, show: pop(t, S_SHOES + 1.0 + i * 0.09) }))} max={5} />,
  },
  // m2 · "The guy with the boat is drowning.": the coach in his office polishing a framed photo of his boat, beaming; −$48,200.
  {
    id: "s9coach", t0: S_COACH, t1: S_LUNCH,
    scene: (t) => <><CoachOffice /><P3 w={coach(t)} /></>,
    cam: (t) => { const u = io(seg(t, S_COACH, S_LUNCH)); return camLerp(C([0.85, 1.55, 2.8], [0.0, 1.45, 0.1], 40), C([0.65, 1.52, 2.35], [0.0, 1.48, 0.1], 36), u); },
    dom: (t, cam) => <Tags t={t} cam={cam} tags={[{ p: top(coach(t), 0.36), amount: -48200, cents: false, named: true, show: pop(t, S_COACH + POP) }]} />,
  },
  // m3 · "The lady at the fryer is fine.": the lunch lady humming at the fryer, basket in the oil, a little sway; $61,350.
  {
    id: "s10lunch", t0: S_LUNCH, t1: S_PRIN,
    scene: (t) => <><FryKitchen t={t} /><P3 w={lunch(t)} /></>,
    cam: (t) => { const u = io(seg(t, S_LUNCH, S_PRIN)); return camLerp(C([2.3, 1.6, -0.1], [0.1, 1.55, -0.15], 44), C([2.1, 1.58, -0.15], [0.1, 1.58, -0.15], 40), u); },
    dom: (t, cam) => <Tags t={t} cam={cam} tags={[{ p: top(lunch(t), 0.34), amount: 61350, cents: false, named: true, show: pop(t, S_LUNCH + POP) }]} />,
  },
  // m4 · "The principal's suit is on a payment plan.": the principal in the hall, a perfect navy suit, straightening his tie; −$9,870.
  {
    id: "s11prin", t0: S_PRIN, t1: S_ART,
    scene: (t) => <><HallSet t={t} lightTo={[2.4, 0, 0.9]} /><FarCrowd t={t} x0={-14} x1={-3} n={20} /><P3 w={principal(t)} /></>,
    cam: (t) => { const u = io(seg(t, S_PRIN, S_ART)); return camLerp(C([2.05, 1.2, -1.05], [2.4, 1.45, 0.9], 40), C([2.12, 1.32, -0.8], [2.4, 1.5, 0.9], 35), u); },
    dom: (t, cam) => <Tags t={t} cam={cam} tags={[{ p: top(principal(t)), amount: -9870, cents: false, named: true, show: pop(t, S_PRIN + POP) }]} />,
  },
  // m5 · the art teacher sails past the school on a rusty old bicycle, grinning; $212,400. The camera pans with her.
  {
    id: "s12art", t0: S_ART, t1: T1, noBlur: true,
    scene: (t) => {
      const bp = artBike(t), d = artX(t) - ART_X0;
      return <><SchoolFront t={t} bikes={2} />
        <group position={bp} rotation={[0, Math.PI / 2, 0]}><Bike6 p={[0, 0, 0]} spin={d / 0.34} crank={d / 0.9} col="#8A4A2A" /></group>
        <P3 w={artist(t)} /></>;
    },
    cam: (t) => { const h = top(artist(t), 0); return { pos: [lerp(3.6, 5.6, sm(seg(t, S_ART, T1))), 1.35, 7.4], target: add(h, [0.3, -0.45, 0]), fov: 40 }; },
    dom: (t, cam) => <Tags t={t} cam={cam} tags={[{ p: top(artist(t)), amount: 212400, cents: false, named: true, show: pop(t, S_ART + POP) }]} />,
  },
];
export const Type: React.FC<{ t: number }> = () => null;

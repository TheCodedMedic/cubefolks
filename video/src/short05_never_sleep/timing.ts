// Short 5 (never slept) timing: every cut, pop, face and sound from measured words (never a typed second).
// No React or Three here, so `node video/scripts/dump_short05_never_sleep.mjs` can export the same times for the cue sheet.
import TIMING from "./timing.json";
import { makeTiming, TimingJSON } from "../kit/core";

export const T = makeTiming(TIMING as TimingJSON);
export const { at, atE, P, PS, PE } = T;
export const END = T.END;

export type EnterK = "whipL" | "whipR" | "cut" | "flash";
/** Shot starts: [id, t0, how the picture enters]. Each shot runs to the next start (the last to END). */
export const CUTS: [string, number, EnterK][] = [
  // B1 A kid stayed awake for eleven days straight, and he did it for a science fair.
  ["s01_hook", 0, "cut"],
  ["s02_eleven", at(1, "eleven"), "whipR"],
  ["s03_fair", at(1, "and"), "whipL"],
  ["s04_poster", at(1, "science"), "whipR"],
  // B2 His name was Randy Gardner, and his friends took shifts keeping him awake.
  ["s05_name", P(2), "whipL"],
  ["s06_friends", at(2, "and"), "whipR"],
  ["s07_whistle", at(2, "shifts"), "whipL"],
  ["s08_hoops", at(2, "keeping"), "whipR"],
  // B3 By day two, he couldn't focus his eyes.
  ["s09_day2", P(3), "whipL"],
  ["s10_focus", at(3, "couldn't"), "whipR"],
  // B4 By day four, he thought a street sign was a person.
  ["s11_day4", P(4), "whipL"],
  ["s12_sign", at(4, "thought"), "whipR"],
  ["s13_person", at(4, "was"), "whipL"],
  // B5 Then he decided he was a famous football player.
  ["s14_decided", P(5), "whipR"],
  ["s15_famous", at(5, "famous"), "flash"],
  ["s16_player", at(5, "player."), "whipL"],
  // B6 But on the last night, he beat a sleep scientist at pinball.
  ["s17_last", P(6), "whipR"],
  ["s18_scientist", at(6, "he"), "whipL"],
  ["s19_pinball", at(6, "pinball."), "whipR"],
  // B7 So how was his brain still working?
  ["s20_how", P(7), "whipL"],
  ["s21_brain", at(7, "brain"), "whipR"],
  // B8 You see, scientists think his brain was cheating.
  ["s22_yousee", P(8), "flash"],
  ["s23_cheating", at(8, "brain"), "whipL"],
  // B9 It slipped into tiny naps, just seconds long, while his eyes stayed open.
  ["s24_naps", P(9), "whipR"],
  ["s25_seconds", at(9, "just"), "whipL"],
  ["s26_open", at(9, "while"), "whipR"],
  // B10 They're called microsleeps, and you've probably had one in class.
  ["s27_micro", P(10), "whipL"],
  ["s28_class", at(10, "you've"), "whipR"],
  // B11 After eleven days, Randy slept fourteen hours and woke up fine.
  ["s29_eleven", P(11), "whipL"],
  ["s30_slept", at(11, "Randy"), "whipR"],
  ["s31_fine", at(11, "woke"), "whipL"],
  // B12 His record was so risky, Guinness stopped accepting new ones.
  ["s32_record", P(12), "whipR"],
  ["s33_stopped", at(12, "Guinness"), "whipL"],
  // B13 So no one can officially beat the time...
  ["s34_noone", P(13), "whipR"],
  ["s35_loop", at(13, "beat"), "whipL"],
];
export const span = (id: string): [number, number] => {
  const i = CUTS.findIndex((c) => c[0] === id);
  if (i < 0) throw new Error("no shot " + id);
  return [CUTS[i][1], i + 1 < CUTS.length ? CUTS[i + 1][1] : END];
};

/** Named moments for pops, faces and sounds. */
export const EV = {
  kid: at(1, "kid"), awake1: at(1, "awake"), eleven1: at(1, "eleven"), straight: at(1, "straight,"), and1: at(1, "and"), did: at(1, "did"), science: at(1, "science"), fair: at(1, "fair."),
  name: at(2, "name"), randy2: at(2, "Randy"), gardner: at(2, "Gardner,"), friends: at(2, "friends"), took: at(2, "took"), shifts: at(2, "shifts"), keeping: at(2, "keeping"), awake2: at(2, "awake."),
  day2: at(3, "day"), two: at(3, "two,"), couldnt: at(3, "couldn't"), focus: at(3, "focus"), eyes3: at(3, "eyes."),
  day4: at(4, "day"), four: at(4, "four,"), thought: at(4, "thought"), street: at(4, "street"), sign: at(4, "sign"), was4: at(4, "was"), person: at(4, "person."),
  then5: at(5, "Then"), decided: at(5, "decided"), famous: at(5, "famous"), football: at(5, "football"), player: at(5, "player."),
  last: at(6, "last"), night6: at(6, "night,"), beat6: at(6, "beat"), sleep6: at(6, "sleep"), scientist: at(6, "scientist"), pinball: at(6, "pinball."),
  how: at(7, "how"), brain7: at(7, "brain"), working: at(7, "working?"),
  yousee: at(8, "You"), scientists: at(8, "scientists"), brain8: at(8, "brain"), cheating: at(8, "cheating."),
  slipped: at(9, "slipped"), tiny: at(9, "tiny"), naps: at(9, "naps,"), just: at(9, "just"), seconds: at(9, "seconds"), while9: at(9, "while"), eyes9: at(9, "eyes"), open: at(9, "open."),
  called: at(10, "called"), micro: at(10, "microsleeps,"), youve: at(10, "you've"), one10: at(10, "one"), class10: at(10, "class."),
  eleven11: at(11, "eleven"), randy11: at(11, "Randy"), slept: at(11, "slept"), fourteen: at(11, "fourteen"), hours: at(11, "hours"), woke: at(11, "woke"), fine: at(11, "fine."),
  record: at(12, "record"), risky: at(12, "risky,"), guinness: at(12, "Guinness"), stopped: at(12, "stopped"), accepting: at(12, "accepting"), ones: at(12, "ones."),
  noone: at(13, "no"), officially: at(13, "officially"), beat13: at(13, "beat"), time13: at(13, "time..."),
};

/** Microsleep blinks: the world goes dark for a split second (a light-switch click on each), in the reveal. */
export const BLINKS = [EV.naps, EV.naps + 0.2, EV.seconds, EV.open, EV.micro + 0.15];
/** Whistle blasts (Bruce) and the basketball bounces (Joe), from the words. */
export const WHISTLES = [EV.shifts];
const every = (a: number, b: number, dt: number) => { const r: number[] = []; for (let x = a; x < b; x += dt) r.push(x); return r; };
export const DRIB = 0.45;
/** Ball height for a dribble started at t0 (floor contacts at t0 + DRIB/2 + k*DRIB, listed in BOUNCES). */
export const ballY = (t: number, t0: number, h = 0.5) => { const u = ((((t - t0) / DRIB) % 1) + 1) % 1; return h - (h - 0.075) * Math.sin(Math.PI * u); };
export const BOUNCES = [...every(EV.friends + DRIB / 2, EV.shifts - 0.13, DRIB), ...every(EV.keeping + DRIB / 2, P(3) - 0.13, DRIB)];
/** The loop: the last shot runs on into the first (u = t - END there, u = t here). */
export const LOOP_SPAN = END - EV.beat13;

// Short 4 (pacemaker) timing: every cut, pulse, pop, face and sound from measured words (never a typed second).
// No React or Three here, so `node video/scripts/dump_short04_pacemaker.mjs` can export the same times for the cue sheet.
import TIMING from "./timing.json";
import { makeTiming, TimingJSON } from "../kit/core";

export const T = makeTiming(TIMING as TimingJSON);
export const { at, atE, P, PS, PE } = T;
export const END = T.END;

export type EnterK = "whipL" | "whipR" | "cut" | "flash";
/** Shot starts: [id, t0, how the picture enters]. Each shot runs to the next start (the last to END). */
export const CUTS: [string, number, EnterK][] = [
  // B1 In 1956, a man grabbed the wrong part from a box, and his machine started beating like a heart.
  ["s01_hook", 0, "cut"],
  ["s02_grab", at(1, "man"), "whipR"],
  ["s03_wrong", at(1, "wrong"), "whipL"],
  ["s04_machine", at(1, "and"), "whipR"],
  ["s05_heart", at(1, "like"), "whipL"],
  // B2 His name was Wilson Greatbatch, and he was building a gadget to record heartbeats.
  ["s06_name", P(2), "whipR"],
  ["s07_build", at(2, "and"), "whipL"],
  ["s08_record", at(2, "record"), "whipR"],
  // B3 He reached for a tiny resistor.
  ["s09_reach", P(3), "whipL"],
  ["s10_tiny", at(3, "tiny"), "whipR"],
  // B4 But he grabbed one a hundred times too strong.
  ["s11_two", P(4), "whipL"],
  ["s12_x100", at(4, "hundred"), "whipR"],
  // B5 He soldered it in, switched it on, and froze.
  ["s13_solder", P(5), "whipL"],
  ["s14_switch", at(5, "switched"), "whipR"],
  ["s15_froze", at(5, "and"), "cut"],
  // B6 The circuit went quiet, then pulsed.
  ["s16_quiet", P(6), "whipL"],
  ["s17_pulsed", at(6, "then"), "whipR"],
  // B7 Quiet, pulse.  B8 Quiet, pulse.
  ["s18_q1", P(7), "whipL"],
  ["s19_q2", P(8), "whipR"],
  // B9 Once every second, just like a heart.
  ["s20_second", P(9), "whipL"],
  ["s21_like", at(9, "just"), "whipR"],
  // B10 Meanwhile, doctors had patients whose hearts kept slowing down until they stopped.
  ["s22_meanwhile", P(10), "flash"],
  ["s23_doctors", at(10, "doctors"), "whipL"],
  ["s24_slowing", at(10, "hearts"), "whipR"],
  ["s25_stopped", at(10, "until"), "whipL"],
  // B11 The only machines that could help were as big as a TV and plugged into the wall.
  ["s26_machine", P(11), "whipR"],
  ["s27_tv", at(11, "big"), "whipL"],
  ["s28_plug", at(11, "plugged"), "whipR"],
  // B12 If the power went out, the patient was in serious trouble.
  ["s29_power", P(12), "whipL"],
  ["s30_trouble", at(12, "patient"), "cut"],
  // B13 You see, every heartbeat starts with a tiny electrical spark.
  ["s31_yousee", P(13), "flash"],
  ["s32_spark", at(13, "tiny"), "whipL"],
  // B14 In those patients, the spark wasn't getting through.
  ["s33_patients", P(14), "whipR"],
  ["s34_blocked", at(14, "wasn't"), "whipL"],
  // B15 And Wilson's mistake made the exact spark a heart needs, once every second.
  ["s35_mistake", P(15), "whipR"],
  ["s36_exact", at(15, "exact"), "whipL"],
  ["s37_once", at(15, "once"), "whipR"],
  // B16 So he shrank it until it fit in the palm of your hand.
  ["s38_shrank", P(16), "whipL"],
  ["s39_palm", at(16, "palm"), "whipR"],
  // B17 He quit his job and built them in the barn behind his house.
  ["s40_quit", P(17), "whipL"],
  ["s41_barn", at(17, "built"), "whipR"],
  ["s42_house", at(17, "behind"), "whipL"],
  // B18 In 1960, surgeons placed one inside a seventy-seven-year-old man.
  ["s43_1960", P(18), "whipR"],
  ["s45_placed", at(18, "placed"), "whipR"],
  ["s46_man", at(18, "seventy-seven-year-old"), "whipL"],
  // B19 His heart beat steady again.
  ["s47_steady", P(19), "whipR"],
  // B20 Today, millions of people walk around with one in their chest.
  ["s48_today", P(20), "flash"],
  ["s49_walk", at(20, "people"), "whipL"],
  ["s50_chest", at(20, "one"), "whipR"],
  // B21 All because of one wrong part from one box.
  ["s51_part", P(21), "whipL"],
  ["s52_box", at(21, "from"), "whipR"],
  // B22 And it all began when...
  ["s53_loop", P(22), "whipL"],
];
export const span = (id: string): [number, number] => {
  const i = CUTS.findIndex((c) => c[0] === id);
  if (i < 0) throw new Error("no shot " + id);
  return [CUTS[i][1], i + 1 < CUTS.length ? CUTS[i + 1][1] : END];
};

/** Named moments for pops, faces and sounds. */
export const EV = {
  y1956: at(1, "1956,"), grabbed: at(1, "grabbed"), wrong: at(1, "wrong"), box1: at(1, "box,"), machine: at(1, "machine"), beating: at(1, "beating"), heart1: at(1, "heart."),
  wilson: at(2, "Wilson"), building: at(2, "building"), gadget: at(2, "gadget"), record: at(2, "record"), heartbeats: at(2, "heartbeats."),
  reached: at(3, "reached"), tiny: at(3, "tiny"), resistor: at(3, "resistor."),
  grabbed4: at(4, "grabbed"), hundred: at(4, "hundred"), strong: at(4, "strong."),
  soldered: at(5, "soldered"), in5: at(5, "in,"), switched: at(5, "switched"), on5: at(5, "on,"), froze: at(5, "froze."),
  circuit: at(6, "circuit"), quiet6: at(6, "quiet,"), pulsed: at(6, "pulsed."),
  quiet7: at(7, "Quiet,"), pulse7: at(7, "pulse."), quiet8: at(8, "Quiet,"), pulse8: at(8, "pulse."),
  once9: at(9, "Once"), second9: at(9, "second,"), like9: at(9, "like"), heart9: at(9, "heart."),
  meanwhile: at(10, "Meanwhile,"), doctors: at(10, "doctors"), patients10: at(10, "patients"), hearts10: at(10, "hearts"), slowing: at(10, "slowing"), until: at(10, "until"), stopped: at(10, "stopped."),
  machines: at(11, "machines"), big: at(11, "big"), tv: at(11, "TV"), plugged: at(11, "plugged"), wall: at(11, "wall."),
  power: at(12, "power"), out: at(12, "out,"), patient12: at(12, "patient"), serious: at(12, "serious"), trouble: at(12, "trouble."),
  yousee: at(13, "You"), heartbeat13: at(13, "heartbeat"), starts: at(13, "starts"), tiny13: at(13, "tiny"), electrical: at(13, "electrical"), spark13: at(13, "spark."),
  patients14: at(14, "patients,"), spark14: at(14, "spark"), wasnt: at(14, "wasn't"), through: at(14, "through."),
  wilsons: at(15, "Wilson's"), mistake: at(15, "mistake"), exact: at(15, "exact"), spark15: at(15, "spark"), needs: at(15, "needs,"), once15: at(15, "once"), second15: at(15, "second."),
  shrank: at(16, "shrank"), fit: at(16, "fit"), palm: at(16, "palm"), hand: at(16, "hand."),
  quit: at(17, "quit"), job: at(17, "job"), built: at(17, "built"), barn: at(17, "barn"), behind: at(17, "behind"), house: at(17, "house."),
  y1960: at(18, "1960,"), surgeons: at(18, "surgeons"), placed: at(18, "placed"), inside: at(18, "inside"), old: at(18, "seventy-seven-year-old"), man18: at(18, "man."),
  heart19: at(19, "heart"), steady: at(19, "steady"), again: at(19, "again."),
  today: at(20, "Today,"), millions: at(20, "millions"), walk: at(20, "walk"), chest: at(20, "chest."),
  all21: at(21, "All"), one21: at(21, "one"), wrong21: at(21, "wrong"), part21: at(21, "part"), box21: at(21, "box."),
  began: at(22, "began"), when: at(22, "when..."),
};

const every = (a: number, b: number, dt = 1) => { const r: number[] = []; for (let x = a; x < b; x += dt) r.push(x); return r; };
/** Pulse (blip) times: the lab scope, the slowing monitor, the machine's monitor, the violet heart, the steady monitor. */
export const PULSES = {
  lab: [...every(0.3, PE(1) + 0.3), EV.pulsed, EV.pulse7, EV.pulse8, ...every(EV.once9, PE(9) + 0.6), ...every(EV.once15, PE(15) + 0.6), ...every(P(21), END + 3)],
  slow: [EV.doctors, EV.doctors + 0.7, EV.doctors + 1.55, EV.doctors + 2.6],
  machine: every(P(11), EV.out),
  heart: [EV.heartbeat13, EV.spark13, ...every(EV.exact + 0.1, EV.once15 - 0.2, 0.7), ...every(EV.once15, PE(15) + 0.2)],
  steady: every(P(18) + 0.2, PE(19) + 0.6, 0.8),
};
/** The loop: the last shot runs on into the first (u = t - END there, u = t here). */
export const LOOP_SPAN = END - P(22);

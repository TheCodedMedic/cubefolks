// Short 1 (Beanfolk 3D) timing: every cut, tap, pop and mood change, all from measured words (never a typed second).
// No React or Three here, so `node video/scripts/dump_short01_bean.mjs` can export the same times for the sound cue sheet.
import TIMING from "./timing.json";
import { makeTiming, TimingJSON } from "../kit/core";

export const T = makeTiming(TIMING as TimingJSON);
export const { at, atE, P, PS, PE } = T;
export const END = T.END;

export type EnterK = "whipL" | "whipR" | "cut" | "flash";
/** Shot starts: [id, t0, how the picture enters]. Each shot runs to the next start (the last to END). */
export const CUTS: [string, number, EnterK][] = [
  ["s01_hook", 0, "cut"],
  ["s02_hans", at(1, "a"), "whipR"],
  ["s03_kids", at(1, "math"), "whipL"],
  ["s04_name", P(2), "whipR"],
  ["s05_hoof", at(2, "and"), "whipL"],
  ["s06_board", P(3), "whipR"],
  ["s07_five", at(3, "Five"), "cut"],
  ["s08_root", P(4), "whipL"],
  ["s09_four", at(4, "Four"), "cut"],
  ["s10_snort", at(4, "and"), "whipR"],
  ["s11_owner", P(5), "whipL"],
  ["s12_teacher", at(5, "retired"), "whipR"],
  ["s13_swore", at(5, "swore"), "whipL"],
  ["s14_eyeroll", P(6), "whipR"],
  ["s15_march", at(6, "and"), "whipL"],
  ["s16_signals", P(7), "whipR"],
  ["s17_helpers", at(7, "secret"), "whipL"],
  ["s18_anything", at(7, "anything"), "whipR"],
  ["s19_nothing", P(8), "cut"],
  ["s20_away", P(9), "whipL"],
  ["s21_strangers", at(9, "and"), "whipR"],
  ["s22_ask", at(9, "ask"), "whipL"],
  ["s23_right", P(10), "whipR"],
  ["s24_meanwhile", P(11), "flash"],
  ["s25_oskar", at(11, "young"), "whipL"],
  ["s26_noticed", at(11, "noticed"), "whipR"],
  ["s27_asker", P(12), "whipL"],
  ["s28_shrug", at(12, "didn't"), "whipR"],
  ["s29_wrong", at(12, "Hans"), "whipL"],
  ["s30_blinders", P(13), "whipR"],
  ["s31_vanish", at(13, "his"), "whipL"],
  ["s32_yousee", P(14), "flash"],
  ["s33_cantcount", at(14, "Hans"), "whipR"],
  ["s34_us", P(15), "whipL"],
  ["s35_close", P(16), "whipR"],
  ["s36_eyes", at(16, "close"), "whipL"],
  ["s37_tense", at(16, "everyone"), "whipR"],
  ["s38_face", at(16, "tensed"), "cut"],
  ["s39_final", P(17), "flash"],
  ["s40_relax", at(17, "they"), "whipL"],
  ["s41_lift", at(17, "heads"), "whipR"],
  ["s42_stopped", at(17, "and"), "whipL"],
  ["s43_oskar", P(18), "whipR"],
  ["s44_doing", at(18, "couldn't"), "whipL"],
  ["s45_still", P(19), "flash"],
  ["s46_effect", at(19, "Clever"), "whipR"],
  ["s47_blind", at(19, "and"), "whipL"],
  ["s48_genius", P(20), "whipR"],
  ["s49_notmath", at(20, "just"), "whipL"],
  ["s50_reading", P(21), "whipR"],
  ["s51_easy", P(22), "whipL"],
  ["s52_world", at(22, "that"), "whipR"],
];
export const span = (id: string): [number, number] => {
  const i = CUTS.findIndex((c) => c[0] === id);
  if (i < 0) throw new Error("no shot " + id);
  return [CUTS[i][1], i + 1 < CUTS.length ? CUTS[i + 1][1] : END];
};

const between = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => (n === 1 ? a : a + ((b - a) * i) / (n - 1)));
/** Hoof-contact times of every tap run. */
export const TAPS = {
  hook: between(at(1, "1904,", 1, 0.35), at(1, "Berlin"), 3),
  hoof: [at(2, "tapping", 1, 0.12), at(2, "hoof.", 1, 0.08)],
  five: between(at(3, "Five", 1, 0.08), PE(3) - 0.02, 5),
  four: between(at(4, "Four", 1, 0.08), at(4, "and", 1, -0.03), 4),
  right: between(at(10, "Hans", 1, 0.05), at(10, "right."), 4),
  wrong: between(at(12, "Hans", 1, 0.06), PE(12) + 0.1, 7),
  blind: between(at(13, "his", 1, 0.05), PE(13) + 0.05, 8),
  reveal: [at(16, "hoof"), at(16, "close"), at(16, "number,"), at(16, "tensed"), at(17, "tap,")],
  oskar: between(at(18, "Oskar,", 1, 0.08), at(18, "stop"), 5),
  blindtest: between(at(19, "experiments"), PE(19) + 0.05, 6),
};

/** Named moments for pops, faces and sounds. */
export const EV = {
  y1904: at(1, "1904,"), berlin: at(1, "Berlin"), school: at(1, "schoolchildren."),
  hansName: at(2, "Hans,"),
  two: at(3, "Two"), root: at(4, "sixteen?"), snort: at(4, "snort."), proud: at(4, "proud"),
  retired: at(5, "retired"), swore: at(5, "swore"), everything: at(5, "everything"),
  rolled: at(6, "rolled"), trick: at(6, "trick."),
  signals: at(7, "signals,"), helpers: at(7, "helpers,"), anything: at(7, "anything"),
  nothing: at(8, "Nothing."),
  away: at(9, "away"), strangers: at(9, "strangers"), questions: at(9, "questions."),
  right: at(10, "right."),
  meanwhile: at(11, "Meanwhile,"), oskar: at(11, "Oskar"), strange: at(11, "strange."),
  didnt: at(12, "didn't"), answer: at(12, "answer,"), wrong: at(12, "wrong."),
  blinders: at(13, "blinders,"), vanished: at(13, "vanished"),
  yousee: at(14, "You"), count: at(14, "count"),
  us: at(15, "us."),
  tensed: at(16, "tensed"),
  relaxed: at(17, "relaxed,"), lifted: at(17, "lifted"), stopped: at(17, "stopped."),
  secret: at(18, "secret,"), himself: at(18, "himself"), doing: at(18, "doing"),
  clever: at(19, "Clever"), blind: at(19, "blind."),
  genius: at(20, "genius"), math: at(20, "math."),
  reading: at(21, "reading"), people: at(21, "people."),
  easy: at(22, "easy"), whole: at(22, "whole"), world: at(22, "world"), believed: at(22, "believed..."),
};

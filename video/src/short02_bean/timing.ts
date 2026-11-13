// Short 2 (Beanfolk 3D) timing: every cut, pop, mood change and sound, all from measured words (never a typed second).
// No React or Three here, so `node video/scripts/dump_short02_bean.mjs` can export the same times for the sound cue sheet.
import TIMING from "./timing.json";
import { makeTiming, TimingJSON } from "../kit/core";

export const T = makeTiming(TIMING as TimingJSON);
export const { at, atE, P, PS, PE } = T;
export const END = T.END;

export type EnterK = "whipL" | "whipR" | "cut" | "flash";
/** Shot starts: [id, t0, how the picture enters]. Each shot runs to the next start (the last to END). */
export const CUTS: [string, number, EnterK][] = [
  // B1 In 1902, a city paid people to kill rats, and ended up with more rats than ever.
  ["s01_hook", 0, "cut"],
  ["s02_paid", at(1, "a"), "whipR"],
  ["s03_kill", at(1, "kill"), "whipL"],
  ["s04_more", at(1, "ended"), "whipR"],
  // B2 The city was Hanoi, and its shiny new sewers had become a highway for rats.
  ["s05_hanoi", P(2), "whipL"],
  ["s06_sewers", at(2, "and"), "whipR"],
  ["s07_highway", at(2, "had"), "whipL"],
  // B3 Rats popped out of toilets in the fanciest homes in town.
  ["s08_toilet", P(3), "whipR"],
  ["s09_lady", at(3, "the"), "whipL"],
  // B4 So the officials made a simple offer.
  ["s10_officials", P(4), "whipR"],
  ["s11_offer", at(4, "simple"), "whipL"],
  // B5 Bring us a rat tail, and we'll pay you one cent.
  ["s13_tail", at(5, "rat"), "whipR"],
  ["s14_cent", at(5, "we'll"), "whipL"],
  // B6 Tails poured in by the thousands.
  ["s15_poured", P(6), "whipL"],
  ["s16_thousands", at(6, "by"), "whipR"],
  // B7 Some days, more than twenty thousand of them.
  ["s17_queue", P(7), "whipL"],
  ["s18_twenty", at(7, "twenty"), "cut"],
  // B8 The officials cheered, counting tails in big wooden crates.
  ["s19_cheer", P(8), "whipR"],
  ["s20_count", at(8, "counting"), "whipL"],
  ["s21_crates", at(8, "big"), "whipR"],
  // B9 But the streets were still crawling.
  ["s22_streets", P(9), "whipL"],
  ["s23_crawling", at(9, "still"), "whipR"],
  // B10 And people started noticing something odd.
  ["s24_people", P(10), "whipL"],
  ["s25_odd", at(10, "something"), "whipR"],
  // B11 Rats were running around with no tails.
  ["s26_running", P(11), "whipL"],
  ["s27_notail", at(11, "with"), "whipR"],
  // B12 Meanwhile, outside the city, inspectors found barns full of rats, fed and cared for like pets.
  ["s29_meanwhile", P(12), "flash"],
  ["s30_inspector", at(12, "inspectors"), "whipL"],
  ["s32_full", at(12, "rats,"), "whipR"],
  ["s34_pets", at(12, "like"), "whipR"],
  // B13 You see, the city wasn't paying for dead rats.
  ["s35_yousee", P(13), "flash"],
  ["s36_dead", at(13, "paying"), "whipL"],
  // B14 It was paying for tails.
  ["s37_tails", P(14), "whipR"],
  // B15 And a rat doesn't need its tail to make more rats.
  ["s38_rat", P(15), "whipL"],
  ["s39_make", at(15, "make"), "whipR"],
  // B16 So clever hunters caught a rat, snipped off its tail, and let it go.
  ["s40_catch", P(16), "whipL"],
  ["s41_snip", at(16, "snipped"), "whipR"],
  ["s42_go", at(16, "and", 1), "whipL"],
  // B17 Every rat they freed had babies, and every baby grew a brand new tail.
  ["s43_freed", P(17), "whipR"],
  ["s44_babies", at(17, "babies,"), "whipL"],
  ["s45_grew", at(17, "baby"), "whipR"],
  ["s45b_spin", at(17, "brand"), "whipL"],
  // B18 Some people stopped hunting altogether and simply farmed them.
  ["s46_stopped", P(18), "whipR"],
  ["s47_farmed", at(18, "simply"), "whipL"],
  // B19 The more the city paid, the more rats it got.
  ["s48_paid", P(19), "whipR"],
  ["s49_got", at(19, "the", 3), "whipL"],
  // B20 Economists call this a perverse incentive.
  ["s50_econ", P(20), "whipR"],
  ["s51_perverse", at(20, "perverse"), "whipL"],
  // B21 When you reward the proof instead of the result, people just make more proof.
  ["s52_proof", P(21), "whipR"],
  ["s53_result", at(21, "instead"), "whipL"],
  ["s54_moreproof", at(21, "people"), "whipR"],
  // B22 Hanoi quietly cancelled the bounty.
  ["s55_quietly", P(22), "whipL"],
  ["s56_cancel", at(22, "cancelled"), "cut"],
  // B23 Which is the real story of how...
  ["s57_loop", P(23), "whipR"],
];
export const span = (id: string): [number, number] => {
  const i = CUTS.findIndex((c) => c[0] === id);
  if (i < 0) throw new Error("no shot " + id);
  return [CUTS[i][1], i + 1 < CUTS.length ? CUTS[i + 1][1] : END];
};

/** Named moments for pops, faces and sounds. */
export const EV = {
  y1902: at(1, "1902,"), paid: at(1, "paid"), kill: at(1, "kill"), more1: at(1, "more"), ever: at(1, "ever."),
  hanoi: at(2, "Hanoi,"), shiny: at(2, "shiny"), sewers: at(2, "sewers"), highway: at(2, "highway"),
  popped: at(3, "popped"), toilets: at(3, "toilets"), fanciest: at(3, "fanciest"),
  officials: at(4, "officials"), offer: at(4, "offer."), simple: at(4, "simple"),
  bring: at(5, "Bring"), tail: at(5, "tail,"), pay: at(5, "pay"), cent: at(5, "cent."), one: at(5, "one"),
  tails6: at(6, "Tails"), poured: at(6, "poured"), thousands: at(6, "thousands."),
  days: at(7, "days,"), twenty: at(7, "twenty"), them7: at(7, "them."),
  cheered: at(8, "cheered,"), counting: at(8, "counting"), crates: at(8, "crates."),
  streets: at(9, "streets"), crawling: at(9, "crawling."),
  noticing: at(10, "noticing"), odd: at(10, "odd."),
  running: at(11, "running"), no: at(11, "no"), tails11: at(11, "tails."),
  meanwhile: at(12, "Meanwhile,"), outside: at(12, "outside"), inspectors: at(12, "inspectors"), found: at(12, "found"), barns: at(12, "barns"),
  rats12: at(12, "rats,"), fed: at(12, "fed"), cared: at(12, "cared"), pets: at(12, "pets."),
  yousee: at(13, "You"), dead: at(13, "dead"), wasnt: at(13, "wasn't"),
  tails14: at(14, "tails."),
  need: at(15, "need"), make15: at(15, "make"), rats15: at(15, "rats."),
  caught: at(16, "caught"), snipped: at(16, "snipped"), go: at(16, "go."), let: at(16, "let"),
  freed: at(17, "freed"), baby: at(17, "baby"), babies: at(17, "babies,"), grew: at(17, "grew"), brand: at(17, "brand"), newTail: at(17, "tail."),
  stopped: at(18, "stopped"), altogether: at(18, "altogether"), farmed: at(18, "farmed"),
  paid19: at(19, "paid,"), more19: at(19, "more", 2), the19: at(19, "the", 3), got: at(19, "got."),
  economists: at(20, "Economists"), perverse: at(20, "perverse"), incentive: at(20, "incentive."),
  reward: at(21, "reward"), proof1: at(21, "proof"), result: at(21, "result,"), people21: at(21, "people"), proof2: at(21, "proof."),
  quietly: at(22, "quietly"), cancelled: at(22, "cancelled"), bounty: at(22, "bounty."),
  which: at(23, "Which"), how: at(23, "how..."),
};

const between = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => (n === 1 ? a : a + ((b - a) * i) / (n - 1)));
/** Tails landing on the desk / coins paid (the clinks), and the tail-counter run. */
export const DROPS = {
  poured: between(at(6, "poured", 1, 0.1), PE(6), 5),
  thousands: between(at(6, "by"), PE(6) + 0.1, 4),
  count: between(EV.counting, at(8, "big", 1, -0.05), 4),
};
/** The loop turntable's angle (deg) at t: it starts on "catch" and turns ever faster through the reveal. */
export const LOOP_T0 = P(16);
export const loopAngle = (t: number) => {
  const u = Math.max(0, t - LOOP_T0);
  return -(u * 18 + u * u * 5.2);
};

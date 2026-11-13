// Short 3 (Beanfolk 3D) timing: every cut, pop, face change and sound, all from measured words (never a typed second).
// No React or Three here, so `node video/scripts/dump_short03_microwave.mjs` can export the same times for the sound cue sheet.
import TIMING from "./timing.json";
import { makeTiming, TimingJSON } from "../kit/core";

export const T = makeTiming(TIMING as TimingJSON);
export const { at, atE, P, PS, PE } = T;
export const END = T.END;

export type EnterK = "whipL" | "whipR" | "cut" | "flash";
/** Shot starts: [id, t0, how the picture enters]. Each shot runs to the next start (the last to END). */
export const CUTS: [string, number, EnterK][] = [
  // B1 In 1945, a man invented a new way to cook because a chocolate bar melted in his pocket.
  ["s01_hook", 0, "cut"],
  ["s02_invented", at(1, "invented"), "whipR"],
  ["s03_choc", at(1, "chocolate"), "whipL"],
  // B2 His name was Percy Spencer, and he had never even finished school.
  ["s04_name", P(2), "whipR"],
  ["s05_school", at(2, "never"), "whipL"],
  // B3 But he built radar parts for the war, and he was brilliant at it.
  ["s06_built", P(3), "whipR"],
  ["s07_war", at(3, "for"), "whipL"],
  ["s08_brilliant", at(3, "he", 2), "whipR"],
  // B4 One day, standing next to a humming radar tube, he felt something sticky.
  ["s09_oneday", P(4), "whipL"],
  ["s10_humming", at(4, "humming"), "whipR"],
  ["s11_sticky", at(4, "he"), "whipL"],
  // B5 His chocolate bar had turned to goo.
  ["s12_goo", P(5), "whipR"],
  ["s13_goo2", at(5, "turned"), "cut"],
  // B6 The room wasn't hot.  B7 He wasn't hot.
  ["s14_room", P(6), "whipL"],
  ["s15_he", P(7), "whipR"],
  // B8 So he sent someone out for a bag of popcorn kernels.
  ["s16_sent", P(8), "whipL"],
  ["s17_bag", at(8, "a"), "whipR"],
  // B9 He held them near the tube, and they burst all over the lab.
  ["s18_held", P(9), "whipL"],
  ["s19_burst", at(9, "burst"), "cut"],
  ["s20_lab", at(9, "over"), "whipR"],
  // B10 Next, he tried an egg.
  ["s21_egg", P(10), "whipL"],
  // B11 It wobbled, shook, and exploded right in a coworker's face.
  ["s22_wobble", P(11), "whipR"],
  ["s24_splat", at(11, "exploded"), "flash"],
  ["s25_face", at(11, "a"), "whipL"],
  // B12 Meanwhile, the war was ending, and his factory's thousands of radar tubes were about to become useless.
  ["s26_meanwhile", P(12), "flash"],
  ["s27_factory", at(12, "and"), "whipR"],
  ["s28_thousands", at(12, "thousands"), "whipL"],
  ["s29_useless", at(12, "were"), "whipR"],
  // B13 You see, that radar tube was firing out invisible microwaves.
  ["s30_yousee", P(13), "flash"],
  ["s31_firing", at(13, "was"), "whipL"],
  ["s32_invisible", at(13, "invisible"), "whipR"],
  // B14 And microwaves make the tiny water molecules inside food spin back and forth, billions of times a second.
  ["s33_molecule", P(14), "whipL"],
  ["s34_inside", at(14, "inside"), "whipR"],
  ["s35_spin", at(14, "spin"), "whipL"],
  ["s36_billions", at(14, "billions"), "whipR"],
  // B15 All that jiggling turns into heat, right inside the food.
  ["s37_jiggle", P(15), "whipL"],
  ["s38_heat", at(15, "heat,"), "whipR"],
  // B16 That's why the snack got hot, but the room didn't.
  ["s39_snack", P(16), "whipL"],
  ["s40_room", at(16, "but"), "whipR"],
  // B17 So his company turned a war machine into a kitchen machine.
  ["s41_war", P(17), "whipL"],
  ["s42_kitchen", at(17, "into"), "flash"],
  // B18 The first one was taller than a man and weighed as much as a piano.
  ["s43_taller", P(18), "whipR"],
  ["s44_piano", at(18, "and"), "whipL"],
  // B19 It cost about five thousand dollars.
  ["s45_cost", P(19), "whipR"],
  // B20 Today, almost every kitchen has one.
  ["s46_today", P(20), "whipL"],
  ["s47_every", at(20, "kitchen"), "whipR"],
  // B21 Not bad for a guy with no diploma and a ruined snack.
  ["s48_notbad", P(21), "whipL"],
  ["s49_ruined", at(21, "and"), "whipR"],
  // B22 And it all started when...
  ["s50_loop", P(22), "whipL"],
];
export const span = (id: string): [number, number] => {
  const i = CUTS.findIndex((c) => c[0] === id);
  if (i < 0) throw new Error("no shot " + id);
  return [CUTS[i][1], i + 1 < CUTS.length ? CUTS[i + 1][1] : END];
};

/** Named moments for pops, faces and sounds. */
export const EV = {
  y1945: at(1, "1945,"), invented: at(1, "invented"), cook: at(1, "cook"), chocolate: at(1, "chocolate"), melted: at(1, "melted"), pocket: at(1, "pocket."),
  percy: at(2, "Percy"), spencer: at(2, "Spencer,"), never: at(2, "never"), finished: at(2, "finished"), school: at(2, "school."),
  built: at(3, "built"), radar3: at(3, "radar"), war3: at(3, "war,"), brilliant: at(3, "brilliant"),
  oneDay: at(4, "One"), standing: at(4, "standing"), humming: at(4, "humming"), tube4: at(4, "tube,"), felt: at(4, "felt"), sticky: at(4, "sticky."),
  choc5: at(5, "chocolate"), turned5: at(5, "turned"), goo: at(5, "goo."),
  room6: at(6, "room"), wasnt6: at(6, "wasn't"), hot6: at(6, "hot."), wasnt7: at(7, "wasn't"), hot7: at(7, "hot."),
  sent: at(8, "sent"), someone: at(8, "someone"), bag: at(8, "bag"), popcorn: at(8, "popcorn"), kernels: at(8, "kernels."),
  held: at(9, "held"), near: at(9, "near"), burst: at(9, "burst"), all9: at(9, "all"), lab: at(9, "lab."),
  next: at(10, "Next,"), tried: at(10, "tried"), egg: at(10, "egg."),
  wobbled: at(11, "wobbled,"), shook: at(11, "shook,"), exploded: at(11, "exploded"), coworkers: at(11, "coworker's"), face: at(11, "face."),
  meanwhile: at(12, "Meanwhile,"), ending: at(12, "ending,"), factorys: at(12, "factory's"), thousands: at(12, "thousands"), tubes12: at(12, "tubes"), useless: at(12, "useless."),
  yousee: at(13, "You"), firing: at(13, "firing"), invisible: at(13, "invisible"), microwaves13: at(13, "microwaves."),
  make: at(14, "make"), tiny: at(14, "tiny"), water: at(14, "water"), molecules: at(14, "molecules"), inside14: at(14, "inside"), food14: at(14, "food"),
  spin: at(14, "spin"), back: at(14, "back"), forth: at(14, "forth,"), billions: at(14, "billions"), second: at(14, "second."),
  jiggling: at(15, "jiggling"), heat: at(15, "heat,"), inside15: at(15, "inside"), food15: at(15, "food."),
  snack16: at(16, "snack"), hot16: at(16, "hot,"), room16: at(16, "room"), didnt: at(16, "didn't."),
  company: at(17, "company"), war17: at(17, "war"), into: at(17, "into"), kitchen17: at(17, "kitchen"), machine2: at(17, "machine.", 1),
  first: at(18, "first"), taller: at(18, "taller"), man18: at(18, "man"), weighed: at(18, "weighed"), piano: at(18, "piano."),
  cost: at(19, "cost"), five: at(19, "five"), dollars: at(19, "dollars."),
  today: at(20, "Today,"), every: at(20, "every"), kitchen20: at(20, "kitchen"), one20: at(20, "one."),
  notBad: at(21, "Not"), guy: at(21, "guy"), no: at(21, "no"), diploma: at(21, "diploma"), ruined: at(21, "ruined"), snack21: at(21, "snack."),
  and22: at(22, "And"), started: at(22, "started"), when: at(22, "when..."),
};
/** The popcorn burst starts on "burst" (a few kernels go just before). */
export const BURST_T0 = EV.burst - 0.05;
/** The egg explodes on "exploded". */
export const BOOM_T0 = EV.exploded + 0.05;

// Short 2 pop-ins and caption highlights (no React here, so the sound cue sheet can read the same times).
import type { PopSpec } from "../kit/Pop";
import { at, EV, P } from "./timing";

export const POPS: PopSpec[] = [
  { kind: "word", text: "1902", t0: EV.y1902, t1: at(1, "a", 1, -0.12), x: 0.5, y: 0.2, size: 1.25 },
  { kind: "tag", text: "HANOI", t0: EV.hanoi, t1: at(2, "and", 1, -0.12), x: 0.5, y: 0.2, size: 1.0, color: "#ffd84a" },
  { kind: "icon", icon: "!", t0: EV.popped, t1: at(3, "the", 1, -0.12), x: 0.72, y: 0.24, size: 0.9 },
  { kind: "word", text: "1¢ PER TAIL", t0: EV.one, t1: P(6) - 0.1, x: 0.5, y: 0.2, size: 0.7 },
  { kind: "word", text: "NO TAIL?!", t0: EV.no, t1: P(12) - 0.1, x: 0.5, y: 0.2, size: 0.95, color: "#ff8a6a", color2: "#a03020", rot: -5 },
  { kind: "icon", icon: "?", t0: EV.odd, t1: P(11) - 0.1, x: 0.68, y: 0.24, size: 0.9 },
  { kind: "word", text: "MEANWHILE...", t0: EV.meanwhile, t1: at(12, "inspectors", 1, -0.12), x: 0.5, y: 0.2, size: 0.75, color: "#c9a8ff", color2: "#5a3a9a" },
  { kind: "icon", icon: "!", t0: EV.rats12, t1: at(12, "like", 1, -0.12), x: 0.5, y: 0.22, size: 1.0 },
  { kind: "icon", icon: "heart", t0: EV.pets, t1: P(13) - 0.1, x: 0.66, y: 0.26, size: 0.9 },
  { kind: "icon", icon: "cross", t0: EV.dead, t1: P(14) - 0.1, x: 0.5, y: 0.22, size: 1.2 },
  { kind: "icon", icon: "check", t0: EV.tails14, t1: P(15) - 0.1, x: 0.7, y: 0.24, size: 1.1 },
  { kind: "stamp", text: "RAT FARM", t0: EV.farmed, t1: P(19) - 0.1, x: 0.5, y: 0.2, size: 1.0, rot: -10 },
  { kind: "word", text: "PERVERSE", t0: EV.perverse, t1: P(21) - 0.1, x: 0.5, y: 0.16, size: 0.95, color: "#ff8a6a", color2: "#a03020" },
  { kind: "word", text: "INCENTIVE", t0: EV.incentive, t1: P(21) - 0.1, x: 0.5, y: 0.235, size: 0.9 },
  { kind: "word", text: "PROOF ≠ RESULT", t0: EV.result, t1: at(21, "people", 1, -0.12), x: 0.5, y: 0.2, size: 0.72, color: "#ffffff", color2: "#8a8aa0" },
  { kind: "stamp", text: "CANCELLED", t0: EV.cancelled, t1: P(23) - 0.1, x: 0.5, y: 0.3, size: 1.0, rot: -12 },
];
export const HIGHLIGHT = ["1902,", "Hanoi,", "sewers", "highway", "toilets", "fanciest", "tail,", "one", "cent.", "Tails", "thousands.", "twenty", "thousand", "cheered,",
  "crates.", "crawling.", "odd.", "no", "tails.", "Meanwhile,", "barns", "pets.", "see,", "dead", "tail", "snipped", "go.", "babies,", "new", "farmed",
  "more", "got.", "perverse", "incentive.", "proof", "result,", "proof.", "quietly", "cancelled", "bounty.", "real", "how..."];

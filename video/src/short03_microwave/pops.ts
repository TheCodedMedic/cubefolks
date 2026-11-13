// Short 3 pop-ins and caption highlights (no React here, so the sound cue sheet can read the same times).
import type { PopSpec } from "../kit/Pop";
import { at, EV, P } from "./timing";

export const POPS: PopSpec[] = [
  { kind: "word", text: "1945", t0: EV.y1945, t1: at(1, "a", 1, -0.12), x: 0.5, y: 0.2, size: 1.25 },
  { kind: "tag", text: "PERCY SPENCER", t0: EV.percy, t1: at(2, "never", 1, -0.12), x: 0.5, y: 0.2, size: 0.9, color: "#ffd84a" },
  { kind: "stamp", text: "NO DIPLOMA", t0: EV.finished, t1: P(3) - 0.1, x: 0.5, y: 0.22, size: 1.0, rot: -10 },
  { kind: "icon", icon: "!", t0: EV.sticky, t1: P(5) - 0.1, x: 0.7, y: 0.22, size: 1.0 },
  { kind: "word", text: "GOO!", t0: EV.goo, t1: P(6) - 0.1, x: 0.5, y: 0.2, size: 1.2, color: "#c8844a", color2: "#4a2010", rot: -6 },
  { kind: "icon", icon: "cross", t0: EV.hot6, t1: P(7) - 0.1, x: 0.72, y: 0.24, size: 1.0 },
  { kind: "icon", icon: "cross", t0: EV.hot7, t1: P(8) - 0.1, x: 0.72, y: 0.24, size: 1.0 },
  // three POP!s that never overlap: top-left, then mid-right (both out before the third), then upper-centre
  { kind: "word", text: "POP!", t0: EV.burst + 0.02, t1: at(9, "over", 1, -0.12), x: 0.27, y: 0.12, size: 0.85, rot: -12 },
  { kind: "word", text: "POP!", t0: EV.burst + 0.2, t1: at(9, "over", 1, -0.12), x: 0.72, y: 0.31, size: 0.8, rot: 10, color: "#ffffff", color2: "#c8323c" },
  { kind: "word", text: "POP!", t0: at(9, "over", 1, 0.02), t1: P(10) - 0.1, x: 0.5, y: 0.2, size: 0.95, rot: -4 },
  { kind: "stamp", text: "SPLAT!", t0: EV.exploded + 0.05, t1: at(11, "a", 1, -0.1), x: 0.5, y: 0.22, size: 1.15, rot: -8 },
  { kind: "word", text: "MEANWHILE...", t0: EV.meanwhile, t1: at(12, "and", 1, -0.12), x: 0.5, y: 0.2, size: 0.75, color: "#c9a8ff", color2: "#5a3a9a" },
  { kind: "stamp", text: "USELESS", t0: EV.useless, t1: P(13) - 0.1, x: 0.5, y: 0.22, size: 1.0, rot: -10 },
  { kind: "word", text: "1,000,000,000", t0: EV.billions, t1: P(15) - 0.1, x: 0.5, y: 0.17, size: 0.85 },
  { kind: "word", text: "SPINS / SEC", t0: EV.billions + 0.3, t1: P(15) - 0.1, x: 0.5, y: 0.235, size: 0.75, color: "#c9a8ff", color2: "#5a3a9a" },
  { kind: "word", text: "HEAT INSIDE", t0: EV.heat, t1: P(16) - 0.1, x: 0.5, y: 0.2, size: 0.95, color: "#ffb04a", color2: "#a03a10" },
  { kind: "word", text: "750 LB", t0: EV.piano, t1: P(19) - 0.1, x: 0.5, y: 0.2, size: 1.15 },
  { kind: "word", text: "$5,000", t0: EV.five, t1: P(20) - 0.1, x: 0.5, y: 0.2, size: 1.3, color: "#7ae08a", color2: "#1a5a2a" },
  { kind: "icon", icon: "check", t0: EV.every, t1: P(21) - 0.1, x: 0.5, y: 0.15, size: 1.0 },
  { kind: "word", text: "EVERY KITCHEN", t0: EV.every + 0.15, t1: P(21) - 0.1, x: 0.5, y: 0.235, size: 0.8 },
  { kind: "stamp", text: "NO DIPLOMA", t0: EV.no, t1: at(21, "and", 1, -0.1), x: 0.5, y: 0.22, size: 0.9, rot: 8 },
];
export const HIGHLIGHT = ["1945,", "invented", "cook", "chocolate", "melted", "pocket.", "Percy", "Spencer,", "never", "school.", "radar", "war,", "brilliant",
  "humming", "sticky.", "goo.", "hot.", "wasn't", "popcorn", "kernels.", "burst", "lab.", "egg.", "wobbled,", "shook,", "exploded", "face.", "Meanwhile,",
  "ending,", "thousands", "useless.", "see,", "invisible", "microwaves.", "water", "molecules", "spin", "billions", "second.", "jiggling", "heat,", "food.",
  "snack", "didn't.", "war", "kitchen", "taller", "piano.", "five", "thousand", "dollars.", "every", "diploma", "ruined", "snack.", "started", "when..."];

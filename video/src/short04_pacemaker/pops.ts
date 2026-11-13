// Short 4 pop-ins and caption highlights (no React here, so the sound cue sheet can read the same times).
import type { PopSpec } from "../kit/Pop";
import { at, EV, P, PULSES } from "./timing";

const PURPLE = { color: "#c9a8ff", color2: "#5a3a9a" };
const GREEN = { color: "#8aff9a", color2: "#1f7a3a" };
export const POPS: PopSpec[] = [
  { kind: "word", text: "1956", t0: EV.y1956, t1: at(1, "man", 1, -0.12), x: 0.5, y: 0.19, size: 1.25 },
  { kind: "stamp", text: "WRONG PART!", t0: EV.wrong, t1: at(1, "and", 1, -0.12), x: 0.5, y: 0.2, size: 0.72, rot: -8 },
  { kind: "icon", icon: "heart", t0: EV.heart1, t1: P(2) - 0.1, x: 0.72, y: 0.22, size: 0.9 },
  { kind: "tag", text: "WILSON GREATBATCH", t0: EV.wilson, t1: at(2, "and", 1, -0.12), x: 0.5, y: 0.2, size: 0.62, color: "#ffd84a" },
  { kind: "word", text: "10K", t0: EV.tiny, t1: P(4) - 0.1, x: 0.5, y: 0.2, size: 1.0, color: "#ffb36a", color2: "#a0521a" },
  { kind: "word", text: "x100", t0: EV.hundred, t1: P(5) - 0.1, x: 0.5, y: 0.19, size: 1.3, color: "#ff8a6a", color2: "#a03020", rot: -6 },
  { kind: "icon", icon: "!", t0: EV.froze, t1: P(6) - 0.1, x: 0.74, y: 0.22, size: 0.9 },
  { kind: "word", text: "PULSE", t0: EV.pulsed, t1: P(7) - 0.1, x: 0.5, y: 0.19, size: 1.0, ...GREEN },
  { kind: "word", text: "PULSE", t0: EV.pulse7, t1: P(8) - 0.1, x: 0.5, y: 0.19, size: 1.0, ...GREEN, rot: 4 },
  { kind: "word", text: "PULSE", t0: EV.pulse8, t1: P(9) - 0.1, x: 0.5, y: 0.19, size: 1.0, ...GREEN, rot: -4 },
  { kind: "word", text: "1 PER SECOND", t0: EV.second9, t1: at(9, "just", 1, -0.12), x: 0.5, y: 0.19, size: 0.68, ...GREEN },
  { kind: "icon", icon: "heart", t0: EV.heart9, t1: P(10) - 0.1, x: 0.5, y: 0.22, size: 1.1 },
  { kind: "word", text: "MEANWHILE...", t0: EV.meanwhile, t1: at(10, "doctors", 1, -0.12), x: 0.5, y: 0.19, size: 0.75, ...PURPLE },
  { kind: "icon", icon: "?", t0: EV.stopped, t1: P(11) - 0.1, x: 0.72, y: 0.22, size: 0.85 },
  { kind: "word", text: "TV-SIZED", t0: EV.tv, t1: at(11, "plugged", 1, -0.12), x: 0.5, y: 0.19, size: 1.0 },
  { kind: "stamp", text: "POWER CUT", t0: EV.out, t1: at(12, "patient", 1, -0.12), x: 0.5, y: 0.2, size: 0.85, rot: -8, color2: "#e2403a" },
  { kind: "icon", icon: "!", t0: EV.trouble, t1: P(13) - 0.1, x: 0.5, y: 0.2, size: 1.0 },
  { kind: "word", text: "SPARK", t0: EV.spark13, t1: P(14) - 0.1, x: 0.5, y: 0.19, size: 1.05, color: "#ffe25a", color2: "#a87a10" },
  { kind: "stamp", text: "BLOCKED", t0: EV.wasnt, t1: P(15) - 0.1, x: 0.5, y: 0.2, size: 1.0, rot: -10, color2: "#e2403a" },
  { kind: "icon", icon: "check", t0: EV.needs, t1: at(15, "once", 1, -0.12), x: 0.72, y: 0.22, size: 0.9 },
  { kind: "word", text: "FITS IN YOUR PALM", t0: EV.palm, t1: P(17) - 0.1, x: 0.5, y: 0.19, size: 0.6 },
  { kind: "tag", text: "THE BARN", t0: EV.barn, t1: P(18) - 0.1, x: 0.5, y: 0.19, size: 0.85, color: "#ffd84a" },
  { kind: "word", text: "1960", t0: EV.y1960, t1: at(18, "placed", 1, -0.12), x: 0.5, y: 0.19, size: 1.25 },
  { kind: "word", text: "77", t0: EV.old, t1: P(19) - 0.1, x: 0.74, y: 0.2, size: 1.2, color: "#ffffff", color2: "#7a7a90" },
  { kind: "icon", icon: "heart", t0: EV.steady, t1: P(20) - 0.1, x: 0.72, y: 0.22, size: 1.0 },
  { kind: "word", text: "MILLIONS ♥", t0: EV.millions, t1: at(20, "walk", 1, -0.12), x: 0.5, y: 0.19, size: 0.95, color: "#ff8aa0", color2: "#a02a4a" },
];
/** The green "PULSE" blips follow the lab scope (counted by the cue sheet as pops). */
export const PULSE_POPS = [EV.pulsed, EV.pulse7, EV.pulse8];
export const HIGHLIGHT = ["1956,", "wrong", "part", "heart.", "Wilson", "Greatbatch,", "heartbeats.", "tiny", "resistor.", "hundred", "strong.", "froze.", "quiet,",
  "pulsed.", "Quiet,", "pulse.", "second,", "Meanwhile,", "slowing", "stopped.", "TV", "plugged", "wall.", "power", "serious", "trouble.", "see,", "spark.", "spark",
  "wasn't", "through.", "mistake", "exact", "palm", "quit", "barn", "1960,", "seventy-seven-year-old", "steady", "millions", "chest.", "one", "box.", "began"];
void PULSES;

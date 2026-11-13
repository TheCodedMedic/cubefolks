// Short 5 pop-ins and caption highlights (no React here, so the sound cue sheet can read the same times).
import type { PopSpec } from "../kit/Pop";
import { at, END, EV, P } from "./timing";

const PURPLE = { color: "#c9a8ff", color2: "#5a3a9a" };
const CAL = { kind: "calendar" as const, x: 0.8, y: 0.17, size: 0.5, color2: "#c8323c" };
export const POPS: PopSpec[] = [
  { kind: "word", text: "11 DAYS AWAKE", t0: 0, t1: EV.and1 - 0.12, x: 0.5, y: 0.14, size: 0.72, color: "#ffd84a" },
  { kind: "word", text: "AGE 17", t0: EV.did, t1: EV.science - 0.12, x: 0.5, y: 0.16, size: 0.95, color: "#ffffff", color2: "#7a7a90" },
  { kind: "tag", text: "RANDY GARDNER", t0: EV.randy2, t1: EV.friends - 0.12, x: 0.5, y: 0.15, size: 0.66, color: "#ffd84a" },
  { kind: "word", text: "1964", t0: EV.gardner, t1: EV.friends - 0.12, x: 0.5, y: 0.235, size: 0.55, color: "#ffffff", color2: "#7a7a90" },
  { ...CAL, text: "1", sub: "DAY", t0: EV.shifts, t1: P(3) - 0.12 },
  { ...CAL, text: "2", sub: "DAY", t0: EV.day2, t1: P(4) - 0.12 },
  { ...CAL, text: "4", sub: "DAY", t0: EV.day4, t1: EV.thought - 0.12 },
  { kind: "word", text: "???", t0: EV.sign, t1: P(5) - 0.12, x: 0.5, y: 0.16, size: 1.2, color: "#ffd84a" },
  { ...CAL, text: "11", sub: "DAY", t0: EV.last, t1: EV.beat6 - 0.12 },
  { kind: "tag", text: "SLEEP SCIENTIST", t0: EV.sleep6, t1: EV.pinball - 0.12, x: 0.5, y: 0.15, size: 0.62, color: "#ffffff" },
  { kind: "word", text: "WINNER", t0: EV.pinball, t1: P(7) - 0.12, x: 0.5, y: 0.16, size: 1.1, color: "#fff2a0", color2: "#c8780a", rot: -5 },
  { kind: "icon", icon: "?", t0: EV.how, t1: EV.brain7 - 0.05, x: 0.76, y: 0.2, size: 0.9 },
  { kind: "stamp", text: "CHEATING!", t0: EV.cheating, t1: P(9) - 0.12, x: 0.5, y: 0.18, size: 0.82, rot: -8, color2: "#e2403a" },
  { kind: "word", text: "zZz", t0: EV.naps, t1: EV.just - 0.12, x: 0.5, y: 0.16, size: 1.1, ...PURPLE },
  { kind: "word", text: "2 SECONDS", t0: EV.seconds, t1: EV.while9 - 0.12, x: 0.5, y: 0.16, size: 0.9, color: "#ffffff", color2: "#5a3a9a" },
  { kind: "word", text: "MICROSLEEP", t0: EV.micro, t1: EV.youve - 0.12, x: 0.5, y: 0.16, size: 0.85, ...PURPLE },
  { kind: "word", text: "264 HOURS AWAKE", t0: EV.eleven11, t1: EV.fourteen - 0.12, x: 0.5, y: 0.15, size: 0.64, color: "#ffd84a" },
  { kind: "word", text: "14 HOURS", t0: EV.fourteen, t1: EV.woke - 0.12, x: 0.5, y: 0.16, size: 1.0, color: "#9ad8ff", color2: "#2a5a9a" },
  { kind: "icon", icon: "check", t0: EV.fine, t1: P(12) - 0.12, x: 0.76, y: 0.2, size: 0.9 },
  { kind: "stamp", text: "RECORD CLOSED", t0: EV.stopped, t1: P(13) - 0.12, x: 0.5, y: 0.3, size: 0.62, rot: -8, color2: "#e2403a" },
];
/** Custom pop-ins drawn in Short05NeverSleep.tsx: the crossed-out bed, the football with a star, the comment question. */
export const BED_X = { t0: EV.kid + 0.1, t1: EV.eleven1 - 0.05 };
export const FOOTBALL = { t0: EV.football, t1: P(6) - 0.12 };
export const QUESTION = { t0: EV.accepting, t1: END + 1 };
export const HIGHLIGHT = ["kid", "awake", "eleven", "days", "straight,", "science", "fair.", "Randy", "Gardner,", "shifts", "awake.", "two,", "focus", "four,", "street",
  "sign", "person.", "famous", "football", "player.", "last", "beat", "scientist", "pinball.", "brain", "working?", "see,", "cheating.", "tiny", "naps,", "seconds",
  "open.", "microsleeps,", "class.", "fourteen", "hours", "fine.", "record", "risky,", "Guinness", "stopped", "officially", "time..."];
void at;

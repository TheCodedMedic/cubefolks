// Short 1 pop-ins and caption highlights (no React here, so the sound cue sheet can read the same times).
import type { PopSpec } from "../kit/Pop";
import { at, EV, P } from "./timing";

export const POPS: PopSpec[] = [
  { kind: "word", text: "1904", t0: EV.y1904, t1: at(1, "a", 1, -0.12), x: 0.5, y: 0.22, size: 1.25 },
  { kind: "tag", text: "BERLIN", t0: EV.berlin, t1: at(1, "math", 1, -0.12), x: 0.5, y: 0.2, size: 0.9, color: "#ffd84a" },
  { kind: "icon", icon: "?", t0: EV.school, t1: P(2) - 0.1, x: 0.5, y: 0.24, size: 0.9 },
  { kind: "word", text: "HANS", t0: EV.hansName, t1: at(2, "and", 1, -0.12), x: 0.5, y: 0.2, size: 1.3 },
  { kind: "word", text: "2 + 3 = ?", t0: EV.two, t1: at(3, "Five", 1, -0.12), x: 0.5, y: 0.2, size: 0.95 },
  { kind: "word", text: "√16 = ?", t0: EV.root, t1: at(4, "Four", 1, -0.12), x: 0.5, y: 0.2, size: 1.05 },
  { kind: "word", text: "SNORT!", t0: EV.snort, t1: P(5) - 0.1, x: 0.5, y: 0.2, size: 0.9, color: "#ffffff", color2: "#8a8aa0", rot: -6 },
  { kind: "tag", text: "RETIRED MATH TEACHER", t0: EV.retired, t1: at(5, "swore", 1, -0.12), x: 0.5, y: 0.2, size: 0.55, color: "#ffd84a" },
  { kind: "icon", icon: "heart", t0: EV.swore, t1: P(6) - 0.1, x: 0.68, y: 0.26, size: 0.8 },
  { kind: "word", text: "TRICK?", t0: EV.trick, t1: P(7) - 0.1, x: 0.5, y: 0.2, size: 1.0, color: "#ff8a6a", color2: "#a03020" },
  { kind: "icon", icon: "?", t0: EV.signals, t1: at(7, "secret", 1, -0.12), x: 0.3, y: 0.22, size: 0.8 },
  { kind: "icon", icon: "?", t0: EV.helpers, t1: at(7, "anything", 1, -0.12), x: 0.7, y: 0.22, size: 0.8 },
  { kind: "icon", icon: "?", t0: EV.anything, t1: P(8) - 0.1, x: 0.5, y: 0.2, size: 0.9 },
  { kind: "stamp", text: "NO TRICK", t0: EV.nothing, t1: P(9) - 0.08, x: 0.5, y: 0.16, size: 1.05, rot: -12 },
  { kind: "icon", icon: "check", t0: EV.right, t1: P(11) - 0.1, x: 0.72, y: 0.3, size: 1.1 },
  { kind: "word", text: "MEANWHILE...", t0: EV.meanwhile, t1: at(11, "young", 1, -0.12), x: 0.5, y: 0.2, size: 0.75, color: "#c9a8ff", color2: "#5a3a9a" },
  { kind: "tag", text: "OSKAR", t0: EV.oskar, t1: at(11, "noticed", 1, -0.12), x: 0.5, y: 0.2, size: 0.95, color: "#8ad0ff" },
  { kind: "icon", icon: "!", t0: EV.strange, t1: P(12) - 0.1, x: 0.7, y: 0.24, size: 0.9 },
  { kind: "icon", icon: "?", t0: EV.didnt, t1: at(12, "Hans", 1, -0.12), x: 0.62, y: 0.22, size: 0.9 },
  { kind: "icon", icon: "cross", t0: EV.wrong, t1: P(13) - 0.1, x: 0.5, y: 0.36, size: 1.7 },
  { kind: "tag", text: "BLINDERS", t0: EV.blinders, t1: at(13, "his", 1, -0.12), x: 0.5, y: 0.2, size: 0.9, color: "#ffd84a" },
  { kind: "icon", icon: "cross", t0: EV.vanished + 0.35, t1: P(14) - 0.1, x: 0.5, y: 0.36, size: 1.4 },
  { kind: "word", text: "1, 2, 3...?", t0: EV.count, t1: P(15) - 0.1, x: 0.5, y: 0.2, size: 0.85, color: "#c9a8ff", color2: "#5a3a9a" },
  { kind: "word", text: "CLEVER HANS", t0: EV.clever, t1: at(19, "and", 1, -0.12), x: 0.5, y: 0.16, size: 0.78 },
  { kind: "word", text: "EFFECT", t0: EV.clever + 0.25, t1: at(19, "and", 1, -0.12), x: 0.5, y: 0.25, size: 1.1, color: "#ff8a6a", color2: "#a03020" },
  { kind: "stamp", text: "BLIND TEST", t0: EV.blind, t1: P(20) - 0.1, x: 0.5, y: 0.26, size: 0.95, rot: -8, color2: "#2f5d8a" },
  { kind: "word", text: "GENIUS", t0: EV.genius, t1: at(20, "just", 1, -0.12), x: 0.5, y: 0.2, size: 1.2 },
  { kind: "word", text: "MATH", t0: at(20, "just"), t1: P(21) - 0.1, x: 0.5, y: 0.22, size: 1.2, color: "#ffffff", color2: "#8a8aa0" },
  { kind: "icon", icon: "cross", t0: EV.math, t1: P(21) - 0.1, x: 0.5, y: 0.22, size: 1.3 },
];
export const HIGHLIGHT = ["1904,", "Berlin", "math", "Hans", "Hans,", "hoof.", "Five", "Four", "snort.", "swore", "Scientists", "trick.", "Nothing.", "strangers",
  "right.", "Oskar", "Oskar,", "strange.", "wrong.", "blinders,", "vanished", "see,", "us.", "tensed", "relaxed,", "lifted", "stopped.", "Clever", "effect,", "blind.",
  "genius", "people.", "believed..."];

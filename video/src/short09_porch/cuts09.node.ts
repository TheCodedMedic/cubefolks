// Node helper (dev): prints the cut list, the shots' places and the sound events as JSON (episodes/09_porch_light/events09.json).
// Build: npx esbuild src/short09_porch/cuts09.node.ts --bundle --platform=node --outfile=out/cuts09.cjs --jsx=automatic
import { CUTS, T, EVENTS09, PLACE09 } from "./Shots09";
console.log(JSON.stringify({ end: T.END, cuts: CUTS.map(([id, t0], i) => ({ id, t0, t1: i + 1 < CUTS.length ? CUTS[i + 1][1] : T.END, place: PLACE09[id] })), events: EVENTS09() }, null, 1));

// Writes video/src/short10_hamster/cuts.json ([{id, t0, enter}]) from SHOTS, for the cue sheet.
// npx esbuild tools/cuts10.tsx --bundle --platform=node --outfile=out/cuts10.cjs --log-level=error && node out/cuts10.cjs
import * as fs from "fs";
import { SHOTS } from "../src/short10_hamster/Short10";
fs.writeFileSync(__dirname + "/../src/short10_hamster/cuts.json", JSON.stringify(SHOTS.map((s) => ({ id: s.id, t0: +s.t0.toFixed(4), t1: +s.t1.toFixed(4), enter: s.enter ?? "whip" })), null, 1));
console.log(SHOTS.length, "shots");

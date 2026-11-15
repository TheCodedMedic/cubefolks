// Review stills for Short 07 with ONE bundle: node tools/stills07.mjs <outDir> <comp> <t1,t2,...|every> [debug]
// "every": one still per second (the contact sheet); else a comma list of times in seconds. Composition Short07At (u = time).
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import path from "path";
import fs from "fs";

const [outDir, comp = "Short07At", list = "every", dbg] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), webpackOverride: (c) => c });
const T = JSON.parse(fs.readFileSync("src/short07_truck/timing.json", "utf8"));
const times = list === "every" ? Array.from({ length: Math.ceil(T.end) }, (_, i) => i + 0.5) : list.split(",").map(Number);
const conc = 3;
let i = 0;
const work = async () => {
  while (i < times.length) {
    const u = times[i++];
    const inputProps = { u, captions: true, debug: dbg === "debug" };
    const composition = await selectComposition({ serveUrl, id: comp, inputProps });
    await renderStill({ composition, serveUrl, output: path.join(outDir, `t${u.toFixed(2).padStart(6, "0")}.png`), inputProps, timeoutInMilliseconds: 240000 });
    process.stdout.write(".");
  }
};
await Promise.all(Array.from({ length: conc }, work));
console.log(`\n${times.length} stills -> ${outDir}`);

// Export Short 5 (never slept) times for the sound cue sheet: cuts (with how each shot enters), named moments, blinks,
// whistles, bounces and pops.  node video/scripts/dump_short05_never_sleep.mjs > episodes/05_never_sleep/cue_times_bean.json
import { build } from "esbuild";
const r = await build({
  stdin: { contents: 'import { CUTS, EV, END, BLINKS, WHISTLES, BOUNCES } from "./timing"; import { POPS, BED_X, FOOTBALL, QUESTION } from "./pops"; console.log(JSON.stringify({ CUTS, EV, END, BLINKS, WHISTLES, BOUNCES, BED_X, FOOTBALL, QUESTION, POPS: POPS.map((p) => ({ kind: p.kind, t0: p.t0, text: p.text, icon: p.icon })) }, null, 1));', resolveDir: new URL("../src/short05_never_sleep", import.meta.url).pathname, loader: "ts" },
  bundle: true, platform: "node", format: "esm", write: false, loader: { ".json": "json" },
});
await import("data:text/javascript;base64," + Buffer.from(r.outputFiles[0].text).toString("base64"));

// Export Short 2 (Bean) times for the sound cue sheet: cuts (with how each shot enters), taps, named moments, pops.
// node video/scripts/dump_short02_bean.mjs > episodes/02_rat_bounty/cue_times_bean.json
import { build } from "esbuild";
const r = await build({
  stdin: { contents: 'import { CUTS, DROPS, EV, END } from "./timing"; import { POPS } from "./pops"; console.log(JSON.stringify({ CUTS, DROPS, EV, END, POPS: POPS.map((p) => ({ kind: p.kind, t0: p.t0, text: p.text, icon: p.icon })) }, null, 1));', resolveDir: new URL("../src/short02_bean", import.meta.url).pathname, loader: "ts" },
  bundle: true, platform: "node", format: "esm", write: false, loader: { ".json": "json" },
});
const code = r.outputFiles[0].text;
await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));

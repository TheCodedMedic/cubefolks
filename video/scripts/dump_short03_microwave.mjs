// Export Short 3 (Bean) times for the sound cue sheet: cuts (with how each shot enters), taps, named moments, pops.
// node video/scripts/dump_short03_microwave.mjs > episodes/03_microwave/cue_times_bean.json
import { build } from "esbuild";
const r = await build({
  stdin: { contents: 'import { CUTS, EV, END, BURST_T0, BOOM_T0 } from "./timing"; import { POPS } from "./pops"; console.log(JSON.stringify({ CUTS, EV, END, BURST_T0, BOOM_T0, POPS: POPS.map((p) => ({ kind: p.kind, t0: p.t0, text: p.text, icon: p.icon })) }, null, 1));', resolveDir: new URL("../src/short03_microwave", import.meta.url).pathname, loader: "ts" },
  bundle: true, platform: "node", format: "esm", write: false, loader: { ".json": "json" },
});
const code = r.outputFiles[0].text;
await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));

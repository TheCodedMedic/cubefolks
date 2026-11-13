// Export Short 6 cuts (id, t0, enter) for the sound cue sheet:  node video/scripts/dump_short06.mjs > video/src/short06_blocky/cuts.json
import { build } from "esbuild";
const r = await build({
  stdin: { contents: 'import { SHOTS06 } from "./Short06"; console.log(JSON.stringify(SHOTS06.map((s) => ({ id: s.id, t0: +s.t0.toFixed(3), t1: +s.t1.toFixed(3), enter: s.enter ?? "cut" })), null, 1));', resolveDir: new URL("../src/short06_blocky", import.meta.url).pathname, loader: "tsx" },
  bundle: true, platform: "node", format: "esm", write: false, loader: { ".json": "json", ".png": "dataurl", ".jpg": "dataurl" }, external: ["three", "react", "remotion", "@remotion/*", "@react-three/*"], jsx: "automatic",
});
await import("data:text/javascript;base64," + Buffer.from(r.outputFiles[0].text).toString("base64"));

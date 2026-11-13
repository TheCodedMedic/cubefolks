// node scripts/stills.mjs <Composition> <outDir> <frame> [frame...]: bundle once, render many stills (review).
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
const exe = fs.existsSync("/opt/pw-browsers") ? fs.readdirSync("/opt/pw-browsers").filter((d) => d.startsWith("chromium_headless_shell-")).map((d) => `/opt/pw-browsers/${d}/chrome-headless-shell-linux64/chrome-headless-shell`).find((e) => fs.existsSync(e)) : undefined;
const [, , id, out, ...frames] = process.argv;
fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id, browserExecutable: exe, chromiumOptions: { gl: "swangle" } });
for (const f of frames.map(Number)) {
  await renderStill({ serveUrl, composition, frame: f, output: path.join(out, `f${String(f).padStart(4, "0")}.png`), browserExecutable: exe, chromiumOptions: { gl: "swangle" }, scale: Number(process.env.SCALE ?? 0.5) });
  console.log("still", f);
}

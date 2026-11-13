// Remotion settings for this studio. On the Mac nothing changes (angle GL, Remotion's own Chrome, --port=3301 by hand).
// In a Claude cloud container (no GPU, Chromium preinstalled under /opt/pw-browsers, no Chrome download) every
// `npx remotion render/still/compositions` command picks the right browser and software WebGL automatically, so the
// long --browser-executable / --gl flags in the docs are optional there. Flags on the command line still win.
import { Config } from "@remotion/cli/config";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const browsersDir = "/opt/pw-browsers";
const cloud = process.platform === "linux" && existsSync(browsersDir);
if (cloud) {
  const shells = readdirSync(browsersDir)
    .filter((d) => d.startsWith("chromium_headless_shell-"))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const d of shells) {
    const exe = join(browsersDir, d, "chrome-headless-shell-linux64", "chrome-headless-shell");
    if (existsSync(exe)) {
      Config.setBrowserExecutable(exe);
      break;
    }
  }
  Config.setChromiumOpenGlRenderer("swangle"); // software WebGL: there is no GPU in the container
  Config.setConcurrency(4); // 4 cores; more only slows it down
}

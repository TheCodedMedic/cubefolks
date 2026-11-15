// Fast clip audit for Short 09 (no rendering): every frame of every shot, every <C> character, the same checks as the
// debug render (Collide.clipParts + footGap). Build + run:
//   npx esbuild src/short09_porch/clipAudit09.tsx --bundle --platform=node --outfile=out/clip09.cjs --jsx=automatic && node out/clip09.cjs [shotId]
import { SHOTS09 } from "./Shots09";
import { C } from "./Ch09";
import * as K from "../blocky/Collide";

const walk = (n: any, out: any[]) => {
  if (!n || typeof n !== "object") return;
  if (Array.isArray(n)) { n.forEach((x) => walk(x, out)); return; }
  if (n.type === C) out.push(n.props);
  if (n.props?.children) walk(n.props.children, out);
};
const only = process.argv[2];
let total = 0;
for (const s of SHOTS09) {
  if (only && !s.id.includes(only)) continue;
  const bad: string[] = [];
  for (let f = Math.ceil(s.t0 * 30); f < s.t1 * 30; f++) {
    const t = f / 30, chars: any[] = [];
    walk(s.scene(t), chars);
    chars.forEach((p, k) => {
      const sc = p.s ?? 1, lift = p.lift ?? 0;
      const c: K.CharState = { position: [p.a.position[0], p.a.position[1] + lift, p.a.position[2]], yaw: p.a.yaw, scale: sc, pose: p.a.pose, walk: p.a.walk };
      const why: string[] = [];
      K.clipParts(c, p.cs ?? [], p.others ?? [], 0.04 * sc, p.allow ?? ["seat"], why);
      const gap = K.footGap(c, p.cs ?? []);
      if (lift === 0 && gap < -0.12 * sc) why.push(`feet${gap.toFixed(2)}`);
      if (lift === 0 && gap > 0.25 * sc && !(p.a.pose?.legL > 1)) why.push(`float+${gap.toFixed(2)}`);
      if (why.length) bad.push(`f${f} #${k}(${p.look?.shirt}) ${why.join(",")}`);
    });
  }
  total += bad.length;
  console.log(`${s.id}: ${bad.length} hits` + (bad.length ? "\n   " + bad.slice(0, 8).join("\n   ") + (bad.length > 8 ? `\n   ... (${bad.length - 8} more)` : "") : ""));
}
console.log(`TOTAL clipping character-frames: ${total}`);

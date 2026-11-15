// Short 10 clip audit without rendering: every shot, every frame, every <Ch> in the scene fragment (common.tsx rule).
// Build + run: npx esbuild tools/clip10.tsx --bundle --platform=node --outfile=out/clip10.cjs --log-level=error && node out/clip10.cjs [shotId]
import React from "react";
import { SHOTS } from "../src/short10_hamster/Short10";
import { Ch } from "../src/short10_hamster/common";
import * as K from "../src/blocky/Collide";

const walk = (n: any, out: any[]) => {
  if (!n || typeof n !== "object") return;
  if (Array.isArray(n)) { n.forEach((x) => walk(x, out)); return; }
  if (n.type === Ch) out.push(n.props);
  if (n.props?.children) walk(n.props.children, out);
};
const only = process.argv[2];
let total = 0;
for (const s of SHOTS) {
  if (only && s.id !== only) continue;
  const bad: string[] = []; let chars = 0;
  for (let f = Math.ceil(s.t0 * 30); f < s.t1 * 30; f++) {
    const t = f / 30, cs: any[] = [];
    walk(s.scene(t), cs); chars = Math.max(chars, cs.length);
    cs.forEach((p, k) => {
      if (p.noAudit) return;
      const sc = p.scale ?? 0.82, lift = p.lift ?? 0;
      const stt: K.CharState = { position: [p.a.position[0], p.a.position[1] + lift, p.a.position[2]], yaw: p.a.yaw, scale: sc, pose: p.a.pose, walk: p.a.walk };
      const why: string[] = [];
      K.clipParts(stt, p.cs ?? [], p.others ?? [], 0.04 * sc, p.allow ?? ["seat"], why);
      const gap = K.footGap(stt, p.cs ?? []);
      if (lift === 0 && gap < -0.12 * sc) why.push(`feet${gap.toFixed(2)}`);
      if (lift === 0 && gap > 0.25 * sc && !(p.a.pose?.legL || p.a.walk)) why.push(`float${gap.toFixed(2)}`);
      if (why.length) bad.push(`f${f} ${p.look?.shirt ?? ""}#${k} ${why.join(",")}`);
    });
  }
  total += bad.length;
  console.log(`${s.id} (${chars} people): ${bad.length} hits` + (bad.length ? "\n   " + bad.slice(0, 8).join("\n   ") + (bad.length > 8 ? `\n   ... (${bad.length - 8} more)` : "") : ""));
}
console.log(`TOTAL clipping frames: ${total}`);

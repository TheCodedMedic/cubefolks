// Fast clip audit without rendering: runs every motion-sheet cell over every frame and applies the same checks the
// debug render paints (Collide.clipParts + footGap). Build: npx esbuild tools/clipAudit.tsx --bundle --platform=node --outfile=out/clipAudit.cjs
import React from "react";
import { CELLS, C } from "../src/blocky/MotionSheet";
import * as K from "../src/blocky/Collide";

const walk = (n: any, out: any[]) => {
  if (!n || typeof n !== "object") return;
  if (Array.isArray(n)) { n.forEach((x) => walk(x, out)); return; }
  if (n.type === C) out.push(n.props);
  if (n.props?.children) walk(n.props.children, out);
};
const only = process.argv[2] !== undefined ? Number(process.argv[2]) : -1;
CELLS.forEach((cell, i) => {
  if (only >= 0 && i !== only) return;
  const bad: string[] = [];
  for (let f = 0; f < 240; f++) {
    const t = f / 30, chars: any[] = [];
    walk(cell.run(t).scene, chars);
    chars.forEach((p, k) => {
      const s = p.scale ?? 1, lift = p.lift ?? 0;
      const st: K.CharState = { position: [p.a.position[0], p.a.position[1] + lift, p.a.position[2]], yaw: p.a.yaw, scale: s, pose: p.a.pose, walk: p.a.walk };
      const why: string[] = [];
      K.clipParts(st, p.cs ?? [], p.others ?? [], 0.04 * s, p.allow ?? ["seat"], why);
      const gap = K.footGap(st, p.cs ?? []);
      const parts = why;
      if (lift === 0 && gap < -0.12 * s) parts.push(`feet${gap.toFixed(2)}`);
      if (parts.length) bad.push(`f${f} #${k} ${parts.join(",")}`);
    });
  }
  console.log(`${i + 1}. ${cell.name}: ${bad.length} hits` + (bad.length ? "\n   " + bad.slice(0, 12).join("\n   ") + (bad.length > 12 ? `\n   ... (${bad.length - 12} more)` : "") : ""));
});

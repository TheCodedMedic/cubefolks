// Short 07 clip audit (no rendering): every <Ch/> in every shot, every frame, with its colliders and the other people.
// Build + run: npx esbuild tools/clipAudit07.tsx --bundle --platform=node --outfile=out/clipAudit07.cjs --jsx=automatic --loader:.json=json && node out/clipAudit07.cjs [shotIdPrefix]
import { SHOTS } from "../src/short07_truck/Short07";
import { Ch } from "../src/short07_truck/common";
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
  if (only && !s.id.startsWith(only)) continue;
  const bad: string[] = [];
  let people = 0;
  for (let f = Math.ceil(s.t0 * 30); f < s.t1 * 30; f++) {
    const t = f / 30, chars: any[] = [];
    walk(s.scene(t), chars);
    people = Math.max(people, chars.length);
    chars.forEach((p, k) => {
      const sc = p.scale ?? 1, lift = p.lift ?? 0;
      const stt: K.CharState = { position: [p.a.position[0], p.a.position[1] + lift, p.a.position[2]], yaw: p.a.yaw, scale: sc, pose: p.a.pose, walk: p.a.walk };
      const why: string[] = [];
      K.clipParts(stt, p.cs ?? [], p.others ?? [], 0.04 * sc, p.allow ?? ["seat"], why);
      if (!p.noFeet && lift === 0) { const gap = K.footGap(stt, p.cs ?? []); if (gap < -0.12 * sc) why.push(`feet${gap.toFixed(2)}`); }
      if (why.length) bad.push(`f${f} #${k} ${why.join(",")}`);
    });
  }
  total += bad.length;
  console.log(`${s.id}: ${people} people, ${bad.length} hits` + (bad.length ? "\n   " + bad.slice(0, 10).join("\n   ") + (bad.length > 10 ? `\n   ... (${bad.length - 10} more)` : "") : ""));
}
console.log(`TOTAL ${total} clipping frames`);

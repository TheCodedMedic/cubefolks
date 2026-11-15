// Short 08 clip audit (no rendering): every <Ch/> in every shot, every frame, with its colliders and the other people.
// Build + run (from video/): npx esbuild src/short08_elephant/audit08.tsx --bundle --platform=node --outfile=out/audit08.cjs --jsx=automatic --loader:.json=json --log-level=error && node out/audit08.cjs [shotIdPrefix]
import { SHOTS } from "./Short08";
import { Ch } from "./common";
import * as K from "../blocky/Collide";

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
  let people = 0, nocs = 0;
  for (let f = Math.ceil(s.t0 * 30); f < s.t1 * 30; f++) {
    const t = f / 30, chars: any[] = [];
    walk(s.scene(t), chars);
    people = Math.max(people, chars.length);
    chars.forEach((p, k) => {
      if (!p.cs?.length) nocs++;
      const sc = p.scale ?? 1, lift = p.lift ?? 0;
      const stt: K.CharState = { position: [p.a.position[0], p.a.position[1] + lift, p.a.position[2]], yaw: p.a.yaw, scale: sc, pose: p.a.pose, walk: p.a.walk };
      const why: string[] = [];
      K.clipParts(stt, p.cs ?? [], p.others ?? [], 0.04 * sc, p.allow ?? ["seat"], why);
      if (!p.noFeet && lift === 0) { const gap = K.footGap(stt, p.cs ?? []); if (gap < -0.12 * sc) why.push(`feet${gap.toFixed(2)}`); if (gap > 0.15 * sc) why.push(`float${gap.toFixed(2)}`); }
      if (why.length) bad.push(`f${f} #${k} ${why.join(",")}`);
    });
  }
  total += bad.length;
  console.log(`${s.id}: ${people} people, ${bad.length} hits${nocs ? ` (WARNING: ${nocs} person-frames without colliders)` : ""}` + (bad.length ? "\n   " + bad.slice(0, 10).join("\n   ") + (bad.length > 10 ? `\n   ... (${bad.length - 10} more)` : "") : ""));
}
console.log(`TOTAL ${total} clipping frames`);

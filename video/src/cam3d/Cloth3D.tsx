// Cloth with folds and creases (user note, 2026-10-24: "add folds and creases to the clothes too").
// Limbs and the torso are no longer smooth cylinders and lathes: their surfaces are displaced by fold patterns.
// - Sleeves: creases on the inside of the elbow that deepen as the elbow bends, fabric bunching above the cuff,
//   a few long folds down the sleeve.
// - Trousers: creases behind the knee that deepen with the bend, a pressed front crease, stacking at the ankle.
// - Torso: soft horizontal folds where a hoodie blouses over its ribbed hem, diagonal folds from the armpits,
//   vertical drape on the skirt of long coats, gentle folds across the back.
// Geometry is cached by shape and a quantised bend, so a pose costs nothing after its first frame.
import * as THREE from "three";

const cache = new Map<string, THREE.BufferGeometry>();
const band = (u: number, a: number, b: number, soft = 0.06) => { const s = (x: number) => Math.min(1, Math.max(0, x)); return s((u - a) / soft) * s((b - u) / soft); };

export type LimbKind = "upperArm" | "forearm" | "thigh" | "shin";

/** A limb segment hanging from its joint (length l, radius r0 at the joint, r1 at the end), with folds.
 * Same placement as the rig's Seg cylinder: centred at y = −l/2. bend: the joint angle at the elbow or knee (deg). */
export const foldedLimb = (kind: LimbKind, l: number, r0: number, r1: number, bend: number) => {
  const bq = Math.round(Math.max(0, Math.min(150, bend)) / 15) * 15;
  const key = `${kind}|${l.toFixed(3)}|${r0}|${r1}|${bq}`;
  const hit = cache.get(key); if (hit) return hit;
  const g = new THREE.CylinderGeometry(r0, r1, l, 32, 36, true);
  const p = g.attributes.position as THREE.BufferAttribute;
  const k = bq / 150; // 0 straight … 1 fully bent
  // which side is the inside of the bend: elbows fold toward +z (forearm swings forward), knees toward −z
  const inner = kind === "thigh" || kind === "shin" ? -1 : 1;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const u = (l / 2 - y) / l;                  // 0 at the joint (top), 1 at the far end
    const th = Math.atan2(x, z);                // 0 = front (+z)
    const r = Math.hypot(x, z) || 1e-6;
    const facing = Math.max(0, inner * Math.cos(th)); // 1 on the inside of the bend
    let d = 0;
    // long soft folds down the fabric
    d += 0.005 * Math.sin(th * 5 + 1.1 + u * 2.2) * (0.6 + 0.4 * Math.sin(u * 7));
    if (kind === "upperArm") {
      d += (0.004 + 0.012 * k) * band(u, 0.68, 1.05, 0.08) * Math.pow(facing, 1.5) * Math.sin(u * 95 + Math.sin(th * 3) * 1.4);
      d += 0.005 * band(u, 0.0, 0.25) * Math.sin(th * 3 + 0.4) * Math.max(0, Math.sin(th)); // pull from the shoulder seam
    } else if (kind === "forearm") {
      d += (0.004 + 0.012 * k) * band(u, -0.05, 0.3, 0.08) * Math.pow(facing, 1.5) * Math.sin(u * 95 + Math.sin(th * 3) * 1.4);
      d += 0.009 * band(u, 0.72, 1.0, 0.07) * Math.sin(u * 80 + Math.sin(th * 2 + 0.7) * 2.2);       // bunching above the cuff
    } else if (kind === "thigh") {
      d += (0.004 + 0.013 * k) * band(u, 0.72, 1.05, 0.08) * Math.pow(facing, 1.3) * Math.sin(u * 70 + Math.sin(th * 2) * 1.6);
      d += 0.0045 * Math.exp(-(th * th) / 0.012);                                                  // pressed front crease
      d += 0.004 * band(u, 0.0, 0.3) * Math.sin(th * 4 + 2.0);                                     // pull at the hip
    } else {
      d += (0.004 + 0.012 * k) * band(u, -0.05, 0.28, 0.08) * Math.pow(facing, 1.3) * Math.sin(u * 70 + Math.sin(th * 2) * 1.6);
      d += 0.0042 * Math.exp(-(th * th) / 0.012) * (1 - u * 0.5);
      d += 0.011 * band(u, 0.74, 1.0, 0.06) * Math.sin(u * 60 + Math.sin(th * 2 + 1.3) * 2.6);      // stacking at the ankle
    }
    const s = (r + d) / r; p.setX(i, x * s); p.setZ(i, z * s);
  }
  g.computeVertexNormals();
  cache.set(key, g);
  return g;
};

/** The torso: the rig's profile (radius, height) smoothed and turned, then folded. kind: hoodie, jacket, long (coat/robe). */
export const foldedTorso = (pts: THREE.Vector2[], kind: "hoodie" | "jacket" | "long") => {
  const key = `torso|${kind}|${pts.map((v) => v.x.toFixed(3) + "," + v.y.toFixed(3)).join(";")}`;
  const hit = cache.get(key); if (hit) return hit;
  const prof = new THREE.SplineCurve(pts).getPoints(60);
  const g = new THREE.LatheGeometry(prof, 64);
  const p = g.attributes.position as THREE.BufferAttribute;
  const y0 = pts[0].y, y1 = pts[pts.length - 1].y;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), r = Math.hypot(x, z);
    if (r < 1e-4) continue;
    const ph = Math.atan2(x, z);        // 0 = front
    const side = Math.abs(Math.sin(ph)); // 1 at the sides
    const back = Math.max(0, -Math.cos(ph));
    let d = 0;
    if (kind === "hoodie") {
      // the body blouses over the ribbed hem: soft wavy horizontal folds just above it
      d += 0.013 * band(y, y0 + 0.06, y0 + 0.19, 0.05) * Math.sin(y * 85 + Math.sin(ph * 3 + 0.5) * 1.8);
    } else if (kind === "jacket") {
      d += 0.008 * band(y, y0 + 0.02, y0 + 0.14, 0.04) * Math.sin(ph * 7 + 0.9);
    } else {
      // the skirt of a long coat or robe hangs in vertical folds that widen toward the hem
      const skirt = Math.max(0, Math.min(1, (0.0 - y) / 0.42));
      d += 0.02 * skirt * Math.sin(ph * 6 + 0.7 + Math.sin(ph * 2) * 0.6);
    }
    // diagonal folds from the armpits across the sides of the chest
    d += 0.01 * band(y, 0.18, 0.44, 0.06) * Math.pow(side, 2) * Math.sin(y * 48 + Math.cos(ph) * 6);
    // gentle folds across the back between the shoulder blades and above the waist
    d += 0.007 * back * band(y, 0.08, 0.36, 0.08) * Math.sin(y * 36 + ph * 2.2);
    // a little slack at the front of the belly
    d += 0.005 * Math.max(0, Math.cos(ph)) * band(y, 0.05, 0.25, 0.06) * Math.sin(y * 30 + 1.2);
    if (y > y1 - 0.06) d *= 0.2; // no folds at the neckline
    if (kind !== "long" && y < y0 + 0.05) d = 0; // the hem band sits on a clean edge
    const s = (r + d) / r; p.setX(i, x * s); p.setZ(i, z * s);
  }
  g.computeVertexNormals();
  cache.set(key, g);
  return g;
};

/** Fold a hood or hood-pouch geometry in place (radial wrinkles that grow toward the free edge). */
export const foldShell = (g: THREE.BufferGeometry, amp: number, elFrom: number) => {
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3(p.getX(i), p.getY(i), p.getZ(i)), r = v.length();
    if (r < 1e-4) continue;
    const el = Math.asin(Math.max(-1, Math.min(1, v.y / r))), az = Math.atan2(v.x, v.z);
    const w = Math.max(0, Math.min(1, (elFrom - el) / 0.5));
    const d = amp * w * Math.sin(az * 9 + Math.sin(el * 5) * 1.5) + amp * 0.35 * Math.sin(az * 4 + el * 7);
    v.multiplyScalar((r + d) / r); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
};

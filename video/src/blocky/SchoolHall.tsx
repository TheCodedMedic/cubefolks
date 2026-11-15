// Shared school sets (BUILD_BRIEF_07-10: owned by lead 08): the CORRIDOR with lockers, the principal's OFFICE DOOR (a door
// with a window, in the corridor's right wall), and the GYM (big double doors, floor lines, bleachers, hoops).
// Units: RIG UNITS (an adult BlockChar at scale 1 is 5 tall; kids ~0.82). Every solid thing is a collider (Collide.ts Box),
// doors are 5 wide (a character is 4 across the arms), aisles at least 5.
//
// CORRIDOR: runs along z (z -50 .. 50), floor y = 0, walls at x = +-8, lockers 1.4 deep (fronts at x = +-6.6), ceiling 12.
//   Classroom doors in the locker banks; the far end (z = -50) has a window wall with daylight. The OFFICE door sits in the
//   right wall (x = +8) at z = OFFICE.z, facing -x into the corridor; its window shows the lit office behind.
// GYM: x -36 .. 36, z -28 .. 28, height 22. Double doors (two 5-wide leaves) centred in the front wall z = +28, swinging
//   INTO the gym (toward -z); a lobby outside (z 28 .. 44). Bleachers along the back wall (z = -28), hoops at x = +-36.
import React from "react";
import * as THREE from "three";
import { mat, rep, type TexKind } from "./Textures";
import { box, type Box } from "./Collide";

type V3 = [number, number, number];

// ------------------------------------------------------------------------------------------------ small helpers
const texCache = new Map<string, THREE.CanvasTexture>();
const canvasTex = (key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat?: [number, number]) => {
  const k = key + (repeat ? `|${repeat[0]},${repeat[1]}` : "");
  const hit = texCache.get(k); if (hit) return hit;
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.needsUpdate = true; texCache.set(k, t); return t;
};
const fitText = (g: CanvasRenderingContext2D, s: string, maxW: number, size: number, weight = 900) => {
  let fs = size; do { g.font = `${weight} ${fs}px Arial, sans-serif`; fs -= 2; } while (g.measureText(s).width > maxW && fs > 8);
};

/** A box mesh: plain colour, or a Textures kind (tinted by c). */
export const SBox: React.FC<{ p: V3; s: V3; c?: string; kind?: TexKind; rough?: number; metal?: number; emissive?: string; ei?: number; shadow?: boolean; map?: THREE.Texture; rot?: V3 }> =
  ({ p, s, c = "#cccccc", kind, rough = 0.8, metal = 0, emissive, ei = 1, shadow = true, map, rot }) => (
  <mesh position={p} rotation={rot} castShadow={shadow} receiveShadow>
    <boxGeometry args={s} />
    {kind ? <meshStandardMaterial {...mat(kind, c, rep(kind, Math.max(s[0], s[2]), Math.max(s[1], Math.min(s[0], s[2]))))} />
      : <meshStandardMaterial color={map ? "#ffffff" : c} map={map} roughness={rough} metalness={metal} emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? ei : 0} />}
  </mesh>
);
/** A flat plane (floors with their own textures, signs). Faces +z unless rotated. */
const Plane: React.FC<{ p: V3; s: [number, number]; rot?: V3; map?: THREE.Texture; c?: string; rough?: number; emissive?: string; ei?: number; transparent?: boolean }> =
  ({ p, s, rot, map, c = "#ffffff", rough = 0.8, emissive, ei = 1, transparent }) => (
  <mesh position={p} rotation={rot} receiveShadow>
    <planeGeometry args={s} />
    <meshStandardMaterial color={c} map={map} roughness={rough} emissive={emissive ?? "#000000"} emissiveMap={emissive ? map : undefined} emissiveIntensity={emissive ? ei : 0} transparent={transparent} alphaTest={transparent ? 0.3 : 0} />
  </mesh>
);

/** Turn a collider list modelled in a local frame by q quarter turns about y, then move it by d (axis-aligned stays axis-aligned). */
export const placeBoxes = (bs: Box[], d: V3, q = 0): Box[] => bs.map((b) => {
  const pts = [b.min, b.max].map((p): V3 => {
    let [x, z] = [p[0], p[2]];
    for (let i = 0; i < ((q % 4) + 4) % 4; i++) [x, z] = [z, -x]; // +90 deg about y (BlockChar yaw convention)
    return [x + d[0], p[1] + d[1], z + d[2]];
  });
  return { name: b.name, min: [Math.min(pts[0][0], pts[1][0]), pts[0][1], Math.min(pts[0][2], pts[1][2])], max: [Math.max(pts[0][0], pts[1][0]), pts[1][1], Math.max(pts[0][2], pts[1][2])] };
});
/** World point from a local point of a frame turned q quarter turns and moved by d (same convention as placeBoxes). */
export const placePoint = (p: V3, d: V3, q = 0): V3 => { let [x, z] = [p[0], p[2]]; for (let i = 0; i < ((q % 4) + 4) % 4; i++) [x, z] = [z, -x]; return [x + d[0], p[1] + d[1], z + d[2]]; };

// ------------------------------------------------------------------------------------------------ textures
const lockerTex = (color: string) => canvasTex(`locker|${color}`, 128, 512, (g, w, h) => {
  g.fillStyle = color; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h); // seams
  g.fillStyle = "rgba(255,255,255,0.12)"; g.fillRect(4, 0, 3, h);
  for (const y0 of [28, 380]) for (let i = 0; i < 5; i++) { g.fillStyle = "rgba(0,0,0,0.5)"; g.fillRect(30, y0 + i * 14, 68, 6); } // vents
  g.fillStyle = "#c8ccd0"; g.fillRect(92, 230, 14, 60); g.fillStyle = "rgba(0,0,0,0.4)"; g.fillRect(92, 286, 14, 4); // handle
  g.fillStyle = "#e8e4d8"; g.fillRect(40, 130, 46, 24); g.fillStyle = "#333"; g.font = "700 18px Arial"; g.textAlign = "center"; g.fillText(String(100 + (color.length * 7) % 90), 63, 149);
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, h - 10, w, 10);
}, undefined);
const corkTex = (seed: number) => canvasTex(`cork|${seed}`, 512, 256, (g, w, h) => {
  g.fillStyle = "#b8865a"; g.fillRect(0, 0, w, h);
  let s = seed * 997 + 1; const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() > 0.5 ? "90,50,20" : "230,190,140"},0.25)`; g.fillRect(r() * w, r() * h, 3, 3); }
  const papers = ["#fbf6e8", "#ffd84a", "#8fd3f0", "#f4a6c0", "#b8e08a"];
  for (let i = 0; i < 7; i++) {
    const pw = 70 + r() * 60, ph = 60 + r() * 80, x = 20 + r() * (w - pw - 40), y = 16 + r() * (h - ph - 32);
    g.save(); g.translate(x + pw / 2, y + ph / 2); g.rotate((r() - 0.5) * 0.2);
    g.fillStyle = papers[i % papers.length]; g.fillRect(-pw / 2, -ph / 2, pw, ph);
    g.fillStyle = "rgba(40,40,60,0.55)"; for (let k = 0; k < 4; k++) g.fillRect(-pw / 2 + 8, -ph / 2 + 14 + k * 12, pw * (0.5 + r() * 0.35), 4);
    g.fillStyle = "#d22a20"; g.beginPath(); g.arc(0, -ph / 2 + 6, 5, 0, Math.PI * 2); g.fill(); g.restore();
  }
  g.strokeStyle = "#7a5432"; g.lineWidth = 14; g.strokeRect(0, 0, w, h);
});
const signTex = (key: string, lines: string[], bg: string, fg: string, w = 512, h = 160) => canvasTex(`sign|${key}`, w, h, (g) => {
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = fg; g.textAlign = "center"; g.textBaseline = "middle";
  lines.forEach((s, i) => { fitText(g, s, w - 60, lines.length === 1 ? h * 0.55 : h * 0.34); g.fillText(s, w / 2, (h * (i + 1)) / (lines.length + 1) + 2); });
});
const pennantTex = (text: string, bg: string) => canvasTex(`pennant|${text}|${bg}`, 512, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h); g.fillStyle = bg; g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h / 2); g.lineTo(0, h); g.closePath(); g.fill();
  g.fillStyle = "#fbf6e8"; g.textAlign = "left"; g.textBaseline = "middle"; fitText(g, text, w * 0.62, 72); g.fillText(text, 26, h / 2 + 3);
});
/** Gym floor: honey maple boards with a basketball court (long axis along x) painted on. Covers 72 x 56. */
const courtTex = () => canvasTex("gymCourt", 2048, 1593, (g, w, h) => {
  const s = w / 72; // px per unit
  // boards: strips along x
  for (let y = 0; y < h; y += s * 0.9) {
    const k = Math.sin(y * 12.9898) * 43758.5453, v = k - Math.floor(k);
    g.fillStyle = `rgb(${200 + v * 22},${150 + v * 18},${88 + v * 14})`; g.fillRect(0, y, w, s * 0.9);
    g.fillStyle = "rgba(90,50,20,0.25)"; g.fillRect(0, y, w, 1.5);
    for (let x = (v * 7 % 1) * s * 8; x < w; x += s * 8) g.fillRect(x, y, 1.5, s * 0.9);
  }
  const X = (u: number) => w / 2 + u * s, Y = (v: number) => h / 2 + v * s;
  g.lineWidth = s * 0.28;
  // painted key areas
  g.fillStyle = "rgba(196,52,46,0.85)"; for (const sx of [-1, 1]) g.fillRect(sx < 0 ? X(-32) : X(32 - 12), Y(-4), s * 12, s * 8);
  g.fillStyle = "rgba(30,70,140,0.85)"; g.beginPath(); g.arc(X(0), Y(0), s * 4.5, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#fbf6e8";
  g.strokeRect(X(-32), Y(-20), s * 64, s * 40); // boundary
  g.beginPath(); g.moveTo(X(0), Y(-20)); g.lineTo(X(0), Y(20)); g.stroke(); // half-court line
  g.beginPath(); g.arc(X(0), Y(0), s * 4.5, 0, Math.PI * 2); g.stroke();
  for (const sx of [-1, 1]) {
    const bx = sx * 32;
    g.strokeRect(sx < 0 ? X(bx) : X(bx - 12), Y(-4), s * 12, s * 8);
    g.beginPath(); g.arc(X(bx - sx * 12), Y(0), s * 4, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(X(bx - sx * 2), Y(0), s * 15, sx < 0 ? -Math.PI / 2 : Math.PI / 2, sx < 0 ? Math.PI / 2 : Math.PI * 1.5); g.stroke();
  }
  // the school's owl in the centre circle (our own mascot: two rings and a beak)
  g.fillStyle = "#fbf6e8"; for (const ex of [-1.4, 1.4]) { g.beginPath(); g.arc(X(ex), Y(-0.6), s * 1.1, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#1b1410"; for (const ex of [-1.4, 1.4]) { g.beginPath(); g.arc(X(ex), Y(-0.6), s * 0.5, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#ffd84a"; g.beginPath(); g.moveTo(X(-0.5), Y(0.6)); g.lineTo(X(0.5), Y(0.6)); g.lineTo(X(0), Y(1.6)); g.closePath(); g.fill();
});
const tileFloorTex = () => canvasTex("vct", 512, 512, (g, w, h) => {
  const n = 4, c = w / n, cols = ["#e8e4da", "#dcd8cc", "#e8e4da", "#c9d6d2"];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    g.fillStyle = (i + j) % 5 === 0 ? "#b9c9c4" : cols[(i * 3 + j) % 4]; g.fillRect(i * c, j * c, c, c);
    for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(${k % 2 ? "0,0,0" : "255,255,255"},0.06)`; g.fillRect(i * c + ((k * 37) % c), j * c + ((k * 53) % c), 3, 2); }
    g.strokeStyle = "rgba(0,0,0,0.12)"; g.lineWidth = 2; g.strokeRect(i * c, j * c, c, c);
  }
}, [8, 50]);
const windowSkyTex = () => canvasTex("winSky", 256, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#9fc8f0"); gr.addColorStop(0.7, "#d8ecfa"); gr.addColorStop(1, "#8fbf6a");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = "#5f8f45"; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(20 + i * 48, h * 0.78, 30, 0, Math.PI * 2); g.fill(); }
});

// ------------------------------------------------------------------------------------------------ shared pieces
const WALL = "#e9e3d2", WALL_LOW = "#3f6f9a", TRIM = "#f6f2e8", LOCKER_BLUE = "#2f5f9e", LOCKER_RED = "#b03a2e";
/** Ceiling light panels (glowing) on a ceiling at height y. */
const CeilingLights: React.FC<{ xs: number[]; zs: number[]; y: number; size?: [number, number] }> = ({ xs, zs, y, size = [3, 6] }) => (
  <>{xs.flatMap((x) => zs.map((z) => (
    <mesh key={`${x},${z}`} position={[x, y - 0.06, z]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={size} /><meshStandardMaterial color="#ffffff" emissive="#fff6e6" emissiveIntensity={1.4} /></mesh>
  )))}</>
);
/** A classroom door seen from the corridor: a wooden door in a frame with a narrow window, a number plate. Faces +z (local). */
const ClassDoor: React.FC<{ num: string }> = ({ num }) => (
  <group>
    <SBox p={[0, 3.6, 0.05]} s={[5.6, 7.4, 0.3]} c={TRIM} />
    <SBox p={[0, 3.5, 0.15]} s={[4.8, 7.0, 0.25]} c="#a87444" kind="wood" />
    <SBox p={[1.2, 4.6, 0.3]} s={[0.9, 2.4, 0.06]} c="#bcd8ee" rough={0.1} metal={0.2} emissive="#7a9ab8" ei={0.4} />
    <SBox p={[-1.7, 3.3, 0.38]} s={[0.25, 0.9, 0.25]} c="#c8ccd0" metal={0.6} rough={0.3} />
    <Plane p={[0, 7.75, 0.22]} s={[1.6, 0.6]} map={signTex(`room${num}`, [num], "#1f4d36", "#f2efe6", 256, 96)} />
  </group>
);

// ================================================================================================ CORRIDOR
export const CORRIDOR = { halfW: 8, lockerD: 1.4, lockerH: 7.4, z0: -50, z1: 50, ceil: 12 } as const;
/** The principal's office door in the right wall (x = +8), at this z; the door faces -x into the corridor. */
export const OFFICE_Z = -18;
/** Gaps in the locker banks for classroom doors: [side (1 = left wall x=-8, -1 = right wall x=+8), z]. */
const CLASS_DOORS: [1 | -1, number, string][] = [[1, -32, "104"], [1, 6, "106"], [1, 34, "108"], [-1, 14, "105"], [-1, 38, "107"]];
/** The office door assembly replaces the right wall over z OFFICE_Z +- OFFICE_HALF. */
const OFFICE_HALF = 6.5;
/** The right wall in two pieces around the office door. */
const rightWallSpans = (): [number, number][] => [[CORRIDOR.z0, OFFICE_Z - OFFICE_HALF], [OFFICE_Z + OFFICE_HALF, CORRIDOR.z1]];

/** Locker runs [z0, z1] on one side, skipping door gaps. */
const lockerRuns = (side: 1 | -1) => {
  const gaps: [number, number][] = CLASS_DOORS.filter((d) => d[0] === side).map((d) => [d[1] - 3.6, d[1] + 3.6]);
  if (side === -1) gaps.push([OFFICE_Z - 7.5, OFFICE_Z + 7]);
  gaps.sort((a, b) => a[0] - b[0]);
  const runs: [number, number][] = []; let z = CORRIDOR.z0 + 4;
  for (const [a, b] of gaps) { if (a - z > 1) runs.push([z, a]); z = b; }
  if (CORRIDOR.z1 - 2 - z > 1) runs.push([z, CORRIDOR.z1 - 2]);
  return runs;
};
/** Corridor colliders (walls, lockers, end walls, the bench by the office). The office door's own colliders come from officeDoorCS. */
export const corridorCS = (officeOpen = 0): Box[] => {
  const { halfW: W, lockerD: D, lockerH: H, z0, z1, ceil } = CORRIDOR;
  const cs: Box[] = [
    box([-W - 0.5, ceil / 2, 0], [1, ceil, z1 - z0], "wall"),
    ...rightWallSpans().map(([a, b]) => box([W + 0.5, ceil / 2, (a + b) / 2], [1, ceil, b - a], "wall")),
    box([0, ceil / 2, z0 - 0.5], [2 * W + 2, ceil, 1], "endWall"),
  ];
  for (const side of [1, -1] as const) for (const [a, b] of lockerRuns(side))
    cs.push(box([side === 1 ? -W + D / 2 : W - D / 2, H / 2, (a + b) / 2], [D, H, b - a], "lockers"));
  cs.push(box([W - 1.0, 0.9, OFFICE_Z - 5.0], [2.0, 1.8, 3.4], "bench"));
  return [...cs, ...officeDoorCS(officeOpen)];
};
/** Named spots in the corridor (feet positions on the floor). */
export const CORRIDOR_SPOTS = {
  center: [0, 0, 0] as V3,
  /** just outside the office door, in the corridor */
  officeFront: [3.2, 0, OFFICE_Z] as V3,
  /** where the bag of peanuts / a prop leans: against the wall right of the office door (the corridor side, toward +z) */
  officeWallProp: [CORRIDOR.halfW - 1.0, 0, OFFICE_Z + 4.4] as V3,
  /** the bench beside the office door (seat top), on the other side */
  bench: [CORRIDOR.halfW - 1.0, 1.8, OFFICE_Z - 5.0] as V3,
  /** the window end (far) and the open end (near) */
  far: [0, 0, CORRIDOR.z0 + 6] as V3, near: [0, 0, CORRIDOR.z1 - 6] as V3,
};

/** The school corridor. `officeOpen` 0..1 swings the office door open (into the office). `officeLit` lights the office behind. */
export const Corridor: React.FC<{ officeOpen?: number; officeLit?: boolean }> = ({ officeOpen = 0, officeLit = true }) => {
  const { halfW: W, lockerD: D, lockerH: H, z0, z1, ceil } = CORRIDOR, L = z1 - z0;
  return <group>
    {/* floor, ceiling */}
    <Plane p={[0, 0.01, (z0 + z1) / 2]} s={[2 * W, L]} rot={[-Math.PI / 2, 0, 0]} map={tileFloorTex()} rough={0.35} />
    <SBox p={[0, ceil + 0.25, (z0 + z1) / 2]} s={[2 * W + 2, 0.5, L]} c="#f2f0ea" shadow={false} />
    <CeilingLights xs={[0]} zs={[-42, -30, -18, -6, 6, 18, 30, 42]} y={ceil} size={[3.2, 5]} />
    {/* walls: painted block, a blue lower band, trim rail */}
    <SBox p={[-(W + 0.5), ceil / 2, (z0 + z1) / 2]} s={[1, ceil, L]} c={WALL} kind="plaster" />
    {rightWallSpans().map(([a, b]) => <SBox key={a} p={[W + 0.5, ceil / 2, (a + b) / 2]} s={[1, ceil, b - a]} c={WALL} kind="plaster" />)}
    {[1, -1].map((side) => <SBox key={side} p={[side * -(W - 0.02), 8.6, (z0 + z1) / 2]} s={[0.1, 0.35, L]} c={WALL_LOW} />)}
    {/* the far end: a big window wall with daylight */}
    <SBox p={[0, ceil / 2, z0 - 0.5]} s={[2 * W + 2, ceil, 1]} c={WALL} kind="plaster" />
    <Plane p={[0, 6, z0 + 0.06]} s={[10, 7.5]} map={windowSkyTex()} emissive="#ffffff" ei={0.9} />
    {[-5, -1.7, 1.7, 5].map((x) => <SBox key={x} p={[x, 6, z0 + 0.15]} s={[0.3, 7.6, 0.2]} c={TRIM} />)}
    {[2.25, 9.75].map((y) => <SBox key={y} p={[0, y, z0 + 0.15]} s={[10.4, 0.3, 0.2]} c={TRIM} />)}
    <SBox p={[0, 6, z0 + 0.15]} s={[10.4, 0.25, 0.2]} c={TRIM} />
    {/* lockers: blue on the left, red on the right; a dark kick plate */}
    {([1, -1] as const).map((side) => lockerRuns(side).map(([a, b]) => {
      const x = side === 1 ? -W + D / 2 : W - D / 2, len = b - a, t = lockerTex(side === 1 ? LOCKER_BLUE : LOCKER_RED).clone();
      t.wrapS = THREE.RepeatWrapping; t.repeat.set(len / 1.6, 1); t.needsUpdate = true;
      return <group key={`${side},${a}`}>
        <mesh position={[x, H / 2 + 0.25, (a + b) / 2]} castShadow receiveShadow><boxGeometry args={[D, H - 0.5, len]} />
          {[0, 1, 2, 3, 4, 5].map((i) => <meshStandardMaterial key={i} attach={`material-${i}`} color={i === (side === 1 ? 0 : 1) ? "#ffffff" : side === 1 ? LOCKER_BLUE : LOCKER_RED} map={i === (side === 1 ? 0 : 1) ? t : undefined} roughness={0.45} metalness={0.25} />)}
        </mesh>
        <SBox p={[x, 0.125, (a + b) / 2]} s={[D, 0.25, len]} c="#2a2c30" />
        <SBox p={[x, H + 0.05, (a + b) / 2]} s={[D + 0.1, 0.1, len]} c="#22406a" />
      </group>;
    }))}
    {/* classroom doors */}
    {CLASS_DOORS.map(([side, z, n]) => <group key={n} position={[side === 1 ? -W : W, 0, z]} rotation={[0, side === 1 ? Math.PI / 2 : -Math.PI / 2, 0]}><ClassDoor num={n} /></group>)}
    {/* bulletin boards and pennants above the lockers */}
    {[[1, -40], [1, -14], [1, 20], [-1, 0], [-1, 26]].map(([side, z], i) => (
      <Plane key={i} p={[side === 1 ? -W + 0.02 : W - 0.02, 9.9, z]} s={[7, 3.4]} rot={[0, side === 1 ? Math.PI / 2 : -Math.PI / 2, 0]} map={corkTex(i + 1)} />
    ))}
    {[[1, -24, "READ!", "#c4342e"], [-1, -36, "BE KIND", "#2f7fc8"], [1, 28, "GO OWLS", "#2f8f5a"], [-1, 46, "SCIENCE FAIR", "#e07a2e"]].map(([side, z, s, c], i) => (
      <Plane key={`p${i}`} p={[(side as number) === 1 ? -W + 0.04 : W - 0.04, 10.3, z as number]} s={[4, 2]} rot={[0, (side as number) === 1 ? Math.PI / 2 : -Math.PI / 2, 0]} map={pennantTex(s as string, c as string)} transparent />
    ))}
    {/* exit sign, a clock */}
    <Plane p={[0, 10.8, z0 + 0.1]} s={[2.4, 0.8]} map={signTex("exit", ["EXIT"], "#b02a20", "#ffffff", 256, 96)} emissive="#ffffff" ei={0.6} />
    <group position={[-W + 0.1, 10.1, 12]} rotation={[0, Math.PI / 2, Math.PI / 2]}>
      <mesh><cylinderGeometry args={[0.9, 0.9, 0.15, 24]} /><meshStandardMaterial color="#f8f6f0" roughness={0.4} /></mesh>
    </group>
    {/* the office door + bench */}
    <OfficeDoor open={officeOpen} lit={officeLit} />
    <group position={[W - 1.0, 0, OFFICE_Z - 5.0]}>
      <SBox p={[0, 1.65, 0]} s={[1.8, 0.3, 3.4]} c="#9a6a3c" kind="wood" />
      {[-1.3, 1.3].map((z) => <SBox key={z} p={[0, 0.75, z]} s={[1.4, 1.5, 0.25]} c="#3a3c40" metal={0.4} />)}
    </group>
  </group>;
};

// ================================================================================================ OFFICE DOOR
// Local frame: the wall plane is z = 0, the corridor is +z, the office -z; the opening (5 wide, 7.2 tall) is centred on x = 0,
// hinged at x = -2.5, swinging into the office. Placed in the corridor's right wall: world = placePoint(local, OFFICE_AT, -1)
// (local +z -> world -x, local +x -> world +z).
const DW = 5, DH = 7.2;
export const OFFICE_AT: V3 = [CORRIDOR.halfW, 0, OFFICE_Z];
const OQ = -1;
/** World point from the office door's local frame. */
export const officePoint = (p: V3): V3 => placePoint(p, OFFICE_AT, OQ);
/** Where the door handle is (world), for reachArm, at an opening 0..1 (corridor side, pushing in). */
export const officeHandle = (open: number, out = 0.35): V3 => {
  const a = (Math.PI / 2) * 0.95 * open, along = DW - 0.6;
  return officePoint([-DW / 2 + Math.cos(a) * along + Math.sin(a) * out, 3.4, -0.2 - Math.sin(a) * along + Math.cos(a) * out]);
};
/** Office door colliders in world space (the leaf shut, open, or none while it swings: keep people clear while it moves). */
export const officeDoorCS = (open = 0): Box[] => {
  const cs: Box[] = [
    box([-DW / 2 - 0.2, DH / 2, 0.05], [0.4, DH, 0.4], "frame"), box([DW / 2 + 0.2, DH / 2, 0.05], [0.4, DH, 0.4], "frame"),
    box([0, DH + (CORRIDOR.ceil - DH) / 2, -0.5], [DW + 0.8, CORRIDOR.ceil - DH, 1], "wall"),
    box([-(DW / 2 + 0.4 + 1.8), CORRIDOR.ceil / 2, -0.5], [3.6, CORRIDOR.ceil, 1], "wall"), box([DW / 2 + 0.4 + 1.8, CORRIDOR.ceil / 2, -0.5], [3.6, CORRIDOR.ceil, 1], "wall"),
    box([0, 4, -9], [16, 8, 0.5], "officeBack"), box([-7.5, 4, -4.5], [0.5, 8, 9], "officeSide"), box([7.5, 4, -4.5], [0.5, 8, 9], "officeSide"),
    box([2.5, 1.5, -6.2], [6, 3, 2.6], "desk"),
  ];
  if (open < 0.04) cs.push(box([0, DH / 2, -0.2], [DW, DH, 0.3], "door"));
  else if (open > 0.96) cs.push({ min: [-DW / 2 - 0.25, 0, -0.2 - DW], max: [-DW / 2 + 0.35, DH, -0.1], name: "door" });
  return placeBoxes(cs, OFFICE_AT, OQ);
};
/** The principal's office door with a window (and the plaque), in the corridor wall. Behind it, a lit little office. */
export const OfficeDoor: React.FC<{ open?: number; lit?: boolean }> = ({ open = 0, lit = true }) => {
  const a = (Math.PI / 2) * 0.95 * open; // swings into the office (local -z)
  return <group position={OFFICE_AT} rotation={[0, (OQ * Math.PI) / 2, 0]}>
    {/* frame + transom plaque */}
    <SBox p={[-DW / 2 - 0.2, DH / 2, 0.08]} s={[0.4, DH, 0.4]} c="#5a3a22" kind="woodDark" />
    <SBox p={[DW / 2 + 0.2, DH / 2, 0.08]} s={[0.4, DH, 0.4]} c="#5a3a22" kind="woodDark" />
    <SBox p={[0, DH + 0.2, 0.08]} s={[DW + 0.8, 0.4, 0.4]} c="#5a3a22" kind="woodDark" />
    <Plane p={[0, DH + 1.3, 0.12]} s={[4.6, 1.3]} map={signTex("principal", ["PRINCIPAL", "MRS. HAYES"], "#1b2a44", "#f2d27a", 512, 150)} />
    {/* the wall above the door (the corridor wall is behind the lockers elsewhere; here it is the door's own wall) */}
    <SBox p={[0, DH + (CORRIDOR.ceil - DH) / 2, -0.5]} s={[DW + 0.8, CORRIDOR.ceil - DH, 1]} c={WALL} kind="plaster" />
    {/* wall panels left and right of the door, flush with the corridor wall face */}
    {[-1, 1].map((sx) => <SBox key={sx} p={[sx * (DW / 2 + 0.4 + 1.8), CORRIDOR.ceil / 2, -0.5]} s={[3.6, CORRIDOR.ceil, 1]} c={WALL} kind="plaster" />)}
    {/* the leaf: hinged at x = -DW/2, a frosted-glass window with "OFFICE" lettering, kick plate, handle */}
    <group position={[-DW / 2, 0, -0.2]} rotation={[0, a, 0]}>
      <SBox p={[DW / 2, DH / 2, 0]} s={[DW - 0.05, DH - 0.05, 0.28]} c="#8a5a32" kind="wood" />
      <mesh position={[DW / 2, 4.9, 0.15]}><planeGeometry args={[2.8, 2.4]} />
        <meshStandardMaterial color="#ffffff" map={signTex("officeGlass", ["OFFICE"], "#d8e6ee", "#1b2a44", 256, 220)} emissive={lit ? "#fff0d0" : "#000000"} emissiveIntensity={lit ? 0.08 : 0} roughness={0.3} />
      </mesh>
      <SBox p={[DW / 2, 4.9, 0.13]} s={[3.0, 2.6, 0.04]} c="#f2efe6" />
      <SBox p={[DW / 2, 0.5, 0.16]} s={[DW - 0.4, 0.7, 0.04]} c="#b8bcc2" metal={0.6} rough={0.3} />
      <SBox p={[DW - 0.6, 3.4, 0.25]} s={[0.6, 0.18, 0.25]} c="#d8b04a" metal={0.7} rough={0.25} />
      <SBox p={[DW - 0.6, 3.4, -0.25]} s={[0.6, 0.18, 0.25]} c="#d8b04a" metal={0.7} rough={0.25} />
    </group>
    {/* the office behind: carpet, warm walls, a desk with a lamp, a window, a plant (seen through the door) */}
    <group>
      <SBox p={[0, -0.02, -4.5]} s={[15, 0.04, 9]} c="#6a3a3a" kind="carpet" shadow={false} />
      <SBox p={[0, 4, -9]} s={[16, 8, 0.5]} c="#efe2c4" kind="wallpaper" />
      <SBox p={[-7.5, 4, -4.5]} s={[0.5, 8, 9]} c="#efe2c4" kind="wallpaper" />
      <SBox p={[7.5, 4, -4.5]} s={[0.5, 8, 9]} c="#efe2c4" kind="wallpaper" />
      <SBox p={[0, 8.2, -4.5]} s={[16, 0.4, 9]} c="#f2f0ea" shadow={false} />
      <SBox p={[2.5, 2.9, -6.2]} s={[6, 0.3, 2.6]} c="#6a3a1e" kind="woodDark" />
      <SBox p={[2.5, 1.4, -6.2]} s={[5.6, 2.8, 2.2]} c="#5a301a" kind="woodDark" />
      <Plane p={[-3, 4.4, -8.7]} s={[4, 3]} map={windowSkyTex()} emissive="#ffffff" ei={0.8} />
      <mesh position={[4.4, 3.6, -6.4]}><sphereGeometry args={[0.45, 16, 10]} /><meshStandardMaterial color="#fff2c8" emissive="#ffd890" emissiveIntensity={lit ? 1.5 : 0} /></mesh>
      <SBox p={[-5.8, 1.2, -7.6]} s={[1.2, 2.4, 1.2]} c="#a0522d" />
      <mesh position={[-5.8, 3.2, -7.6]}><sphereGeometry args={[1.2, 12, 10]} /><meshStandardMaterial color="#3f8a46" roughness={0.9} /></mesh>
      {lit && <pointLight position={[0, 6.5, -4]} intensity={40} distance={16} color="#ffe2b0" />}
    </group>
  </group>;
};

// ================================================================================================ GYM
export const GYM = { x0: -36, x1: 36, z0: -28, z1: 28, h: 22, doorW: 5, doorH: 9, lobbyZ: 44 } as const;
/** Spots in the gym (feet, floor y = 0). */
export const GYM_SPOTS = {
  center: [0, 0, 0] as V3,
  /** just inside the doors and just outside them (lobby side) */
  inside: [0, 0, GYM.z1 - 6] as V3, outside: [0, 0, GYM.z1 + 6] as V3,
  /** the front row of the bleachers (seat top y, along the back wall) */
  bleacher: (x: number, row = 0): V3 => [x, 1.4 * (row + 1), GYM.z0 + 1.2 + row * 2.2 + 1.1],
};
/** Hinge points of the two door leaves (world), and the handle of each at an opening 0..1 (the lobby side). */
export const gymHandle = (side: 1 | -1, open: number, out = 0.35): V3 => {
  // side -1 = left leaf (hinge at x = -5), +1 = right leaf (hinge at x = +5); leaves swing into the gym (-z)
  const a = open * (Math.PI / 2) * 0.92, along = GYM.doorW - 0.6;
  const hx = side * GYM.doorW;
  return [hx - side * along * Math.cos(a) - side * out * Math.sin(a), 3.6, GYM.z1 + 0.2 - along * Math.sin(a) + out * Math.cos(a)];
};
const BLEACH = { rows: 4, rowH: 1.4, rowD: 2.2, x0: -26, x1: 26 };
/** Gym colliders: walls (with the door opening), bleachers (tiers named "seat"), the lobby walls, the door leaves. */
export const gymCS = (doorsOpen = 0): Box[] => {
  const { x0, x1, z0, z1, h, doorW, doorH, lobbyZ } = GYM;
  const cs: Box[] = [
    box([x0 - 0.5, h / 2, 0], [1, h, z1 - z0], "wall"), box([x1 + 0.5, h / 2, 0], [1, h, z1 - z0], "wall"), box([0, h / 2, z0 - 0.5], [x1 - x0, h, 1], "wall"),
    box([(x0 - doorW) / 2, h / 2, z1 + 0.5], [-doorW - x0, h, 1], "wall"), box([(x1 + doorW) / 2, h / 2, z1 + 0.5], [x1 - doorW, h, 1], "wall"),
    box([0, doorH + (h - doorH) / 2, z1 + 0.5], [2 * doorW, h - doorH, 1], "wall"),
    box([-14.5, 6, (z1 + lobbyZ) / 2 + 0.5], [1, 12, lobbyZ - z1], "lobbyWall"), box([14.5, 6, (z1 + lobbyZ) / 2 + 0.5], [1, 12, lobbyZ - z1], "lobbyWall"),
  ];
  for (let r = 0; r < BLEACH.rows; r++) {
    const zc = z0 + 1.2 + r * BLEACH.rowD + BLEACH.rowD / 2, top = BLEACH.rowH * (r + 1);
    cs.push(box([(BLEACH.x0 + BLEACH.x1) / 2, top / 2, zc], [BLEACH.x1 - BLEACH.x0, top, BLEACH.rowD], "seat"));
  }
  cs.push(box([0, 0.6, z0 + 0.6], [BLEACH.x1 - BLEACH.x0, 1.2, 1.2], "bleacherBack"));
  // door leaves: shut across the opening, or open against the inside of the front wall's opening sides
  for (const side of [-1, 1] as const) {
    if (doorsOpen < 0.04) cs.push(box([side * doorW / 2, doorH / 2, z1 + 0.2], [doorW, doorH, 0.3], "door"));
    else if (doorsOpen > 0.96) cs.push(box([side * (doorW - 0.2), doorH / 2, z1 + 0.2 - doorW / 2], [0.9, doorH, doorW], "door"));
  }
  return cs;
};
/** The gym. `doorsOpen` 0..1 swings both big doors into the gym. `lobby` draws the hall outside the doors. */
export const Gym: React.FC<{ doorsOpen?: number; lobby?: boolean }> = ({ doorsOpen = 0, lobby = true }) => {
  const { x0, x1, z0, z1, h, doorW, doorH, lobbyZ } = GYM;
  const a = doorsOpen * (Math.PI / 2) * 0.92;
  const WALLC = "#e6dcc6", BAND = "#1e4f8a";
  return <group>
    {/* floor with the court, a ceiling with truss lights */}
    <Plane p={[0, 0.01, 0]} s={[x1 - x0, z1 - z0]} rot={[-Math.PI / 2, 0, 0]} map={courtTex()} rough={0.3} />
    <SBox p={[0, h + 0.25, 0]} s={[x1 - x0 + 2, 0.5, z1 - z0 + 2]} c="#d8d4cc" shadow={false} />
    {[-14, 0, 14].map((z) => <SBox key={z} p={[0, h - 1, z]} s={[x1 - x0, 0.6, 0.6]} c="#8a8e94" metal={0.4} shadow={false} />)}
    <CeilingLights xs={[-24, -8, 8, 24]} zs={[-14, 0, 14]} y={h - 1.3} size={[2.6, 2.6]} />
    {/* walls: painted block with a blue band, high windows */}
    <SBox p={[x0 - 0.5, h / 2, 0]} s={[1, h, z1 - z0]} c={WALLC} kind="plaster" />
    <SBox p={[x1 + 0.5, h / 2, 0]} s={[1, h, z1 - z0]} c={WALLC} kind="plaster" />
    <SBox p={[0, h / 2, z0 - 0.5]} s={[x1 - x0, h, 1]} c={WALLC} kind="plaster" />
    <SBox p={[(x0 - doorW) / 2, h / 2, z1 + 0.5]} s={[-doorW - x0, h, 1]} c={WALLC} kind="plaster" />
    <SBox p={[(x1 + doorW) / 2, h / 2, z1 + 0.5]} s={[x1 - doorW, h, 1]} c={WALLC} kind="plaster" />
    <SBox p={[0, doorH + (h - doorH) / 2, z1 + 0.5]} s={[2 * doorW, h - doorH, 1]} c={WALLC} kind="plaster" />
    {[[x0 + 0.02, 0, Math.PI / 2], [x1 - 0.02, 0, -Math.PI / 2]].map(([x, , r], i) => <SBox key={i} p={[x, 4.5, 0]} s={[0.06, 1.2, z1 - z0]} c={BAND} rot={[0, 0, 0]} />)}
    <SBox p={[0, 4.5, z0 + 0.02]} s={[x1 - x0, 1.2, 0.06]} c={BAND} />
    <SBox p={[-(doorW + (x1 - doorW) / 2), 4.5, z1 - 0.02]} s={[x1 - doorW, 1.2, 0.06]} c={BAND} />
    <SBox p={[doorW + (x1 - doorW) / 2, 4.5, z1 - 0.02]} s={[x1 - doorW, 1.2, 0.06]} c={BAND} />
    {[-24, -12, 0, 12, 24].map((x) => <Plane key={x} p={[x, 17, z0 + 0.04]} s={[7, 3.4]} map={windowSkyTex()} emissive="#ffffff" ei={0.7} />)}
    {/* banners on the back wall */}
    <Plane p={[0, 11.5, z0 + 0.06]} s={[16, 3]} map={signTex("gymBanner", ["HOME OF THE OWLS"], "#1e4f8a", "#ffd84a", 1024, 192)} />
    {[-22, 22].map((x, i) => <Plane key={x} p={[x, 11, z0 + 0.06]} s={[4, 2]} map={pennantTex(i ? "CHAMPS" : "GO OWLS", i ? "#c4342e" : "#2f8f5a")} transparent />)}
    {/* bleachers */}
    {Array.from({ length: BLEACH.rows }, (_, r) => {
      const zc = z0 + 1.2 + r * BLEACH.rowD + BLEACH.rowD / 2, top = BLEACH.rowH * (r + 1);
      return <group key={r}>
        <SBox p={[(BLEACH.x0 + BLEACH.x1) / 2, top - 0.15, zc]} s={[BLEACH.x1 - BLEACH.x0, 0.3, BLEACH.rowD]} c="#c89a5c" kind="wood" />
        <SBox p={[(BLEACH.x0 + BLEACH.x1) / 2, (top - 0.3) / 2, zc + BLEACH.rowD / 2 - 0.1]} s={[BLEACH.x1 - BLEACH.x0, top - 0.3, 0.2]} c="#8a6a4a" kind="wood" />
      </group>;
    })}
    {/* hoops on the end walls */}
    {[-1, 1].map((sx) => <group key={sx} position={[sx * (x1 - 0.5), 0, 0]} rotation={[0, sx === 1 ? -Math.PI / 2 : Math.PI / 2, 0]}>
      <SBox p={[0, 13, 2.4]} s={[0.4, 0.4, 4.8]} c="#8a8e94" metal={0.4} />
      <SBox p={[0, 13.4, 4.8]} s={[6, 3.8, 0.2]} c="#f8f6f0" />
      <SBox p={[0, 12.8, 4.92]} s={[2.2, 1.6, 0.04]} c="#c4342e" />
      <SBox p={[0, 12.8, 4.95]} s={[1.8, 1.2, 0.04]} c="#f8f6f0" />
      <mesh position={[0, 11.8, 5.8]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.8, 0.07, 6, 20]} /><meshStandardMaterial color="#e05a1e" metalness={0.4} roughness={0.4} /></mesh>
    </group>)}
    {/* a scoreboard and a clock on the back wall */}
    <group position={[-12, 15.5, z0 + 0.3]}>
      <SBox p={[0, 0, 0]} s={[6, 3, 0.4]} c="#1b1d22" />
      <Plane p={[0, 0, 0.21]} s={[5.4, 2.4]} map={signTex("score", ["HOME 00  GUEST 00"], "#1b1d22", "#ff6a3a", 512, 200)} emissive="#ffffff" ei={0.8} />
    </group>
    {/* the big doors: frame, two leaves with push bars and small windows */}
    <SBox p={[0, doorH + 0.25, z1 + 0.2]} s={[2 * doorW + 1, 0.5, 1.3]} c="#3a5a7a" metal={0.3} />
    {[-1, 1].map((sx) => <SBox key={`f${sx}`} p={[sx * (doorW + 0.25), doorH / 2, z1 + 0.2]} s={[0.5, doorH, 1.3]} c="#3a5a7a" metal={0.3} />)}
    {([-1, 1] as const).map((side) => (
      <group key={side} position={[side * doorW, 0, z1 + 0.2]} rotation={[0, -side * a, 0]}>
        <SBox p={[-side * doorW / 2, doorH / 2, 0]} s={[doorW - 0.06, doorH - 0.06, 0.3]} c="#2f6f9a" metal={0.35} rough={0.45} />
        <SBox p={[-side * (doorW / 2 + 0.6), 6.4, 0.17]} s={[1.0, 2.2, 0.04]} c="#bcd8ee" rough={0.1} emissive="#9ab8d0" ei={0.3} />
        <SBox p={[-side * (doorW / 2 + 0.6), 6.4, -0.17]} s={[1.0, 2.2, 0.04]} c="#bcd8ee" rough={0.1} emissive="#9ab8d0" ei={0.3} />
        <SBox p={[-side * doorW / 2, 3.6, 0.35]} s={[doorW - 1.0, 0.3, 0.3]} c="#c8ccd0" metal={0.7} rough={0.3} />
        <SBox p={[-side * doorW / 2, 3.6, -0.35]} s={[doorW - 1.0, 0.3, 0.3]} c="#c8ccd0" metal={0.7} rough={0.3} />
      </group>
    ))}
    <Plane p={[0, doorH + 1.5, z1 + 1.02]} s={[6, 1.5]} map={signTex("gymSign", ["GYM"], "#1e4f8a", "#ffd84a", 512, 128)} />
    {/* the lobby outside the doors: tiled floor, walls, a trophy case */}
    {lobby && <group>
      <Plane p={[0, 0.01, (z1 + lobbyZ) / 2 + 0.5]} s={[30, lobbyZ - z1]} rot={[-Math.PI / 2, 0, 0]} map={tileFloorTex()} rough={0.35} />
      {[-1, 1].map((sx) => <SBox key={sx} p={[sx * 15, 6, (z1 + lobbyZ) / 2 + 0.5]} s={[1, 12, lobbyZ - z1]} c={WALL} kind="plaster" />)}
      <SBox p={[0, 12.25, (z1 + lobbyZ) / 2 + 0.5]} s={[30, 0.5, lobbyZ - z1]} c="#f2f0ea" shadow={false} />
      <CeilingLights xs={[0]} zs={[z1 + 5, z1 + 12]} y={12} size={[3, 4]} />
      <group position={[-14.4, 0, z1 + 9]} rotation={[0, Math.PI / 2, 0]}>
        <SBox p={[0, 3.5, 0]} s={[6, 5, 1.2]} c="#6a3a1e" kind="woodDark" />
        <SBox p={[0, 4, 0.62]} s={[5.4, 3.6, 0.04]} c="#cfe0ec" rough={0.05} metal={0.3} />
        {[-1.6, 0, 1.6].map((x) => <mesh key={x} position={[x, 4.2, 0.2]}><cylinderGeometry args={[0.3, 0.4, 1.2, 10]} /><meshStandardMaterial color="#d8b04a" metalness={0.8} roughness={0.25} /></mesh>)}
      </group>
    </group>}
  </group>;
};

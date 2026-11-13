// A real 3D character built from simple shapes, so it reads correctly from every camera angle:
// glossy black sphere head with cream face marks wrapped on the sphere, a rounded oval torso (jacket),
// shoulder caps, tapered arms and legs with elbows and knees, hands with a thumb and four fingers, shoes with a sole.
// Units: metres-ish. Feet on y = 0, hips at y = 0.8, head centre at about y = 1.56. Facing +z at yaw 0.
import React, { useMemo } from "react";
import * as THREE from "three";
import { BeardStrands, HairSpec, HairStrands, HoodDown, HoodUp } from "./Hair3D";
import { foldedLimb, foldedTorso, LimbKind } from "./Cloth3D";

export type Pose3 = {
  lean?: number;     // torso lean forward (deg)
  twist?: number;    // torso twist about y (deg)
  headTurn?: number; // head turn about y (deg), + = to the character's left
  headNod?: number;  // + looks down (deg)
  reach?: number;    // arm length scale (1 = normal); a quiet 1.2 lets arms wrap round a back in a hug
  neckTilt?: number; // head tilt sideways from the base of the neck (deg), + = toward the character's right (hugs, leaning on a shoulder)
  armL?: Arm; // left arm: forward swing, outward swing, elbow bend, and optional upper-arm roll (deg, + turns the elbow outward/down)
  armR?: Arm;
  legL?: [number, number];         // left leg: forward swing, knee bend (deg)
  legR?: [number, number];
  bob?: number;      // whole body vertical offset
  curl?: number;     // finger curl 0 open .. 1 fist (used when no hand shape is given)
  handL?: HandShape; handR?: HandShape;          // named hand shapes (see HANDS)
  wristL?: [number, number]; wristR?: [number, number]; // wrist bend (deg, + toward the palm) and twist (deg, about the forearm)
  // optional, used by the run cycle (cam3d/Run3D.tsx); left out, nothing changes:
  adL?: number; adR?: number;     // hip adduction (deg, + swings the foot toward the midline)
  footL?: number; footR?: number; // foot pitch (deg, + toes down) relative to the pelvis, replacing the automatic ankle
  hips?: [number, number];        // pelvis yaw and roll (deg) under the torso: legs and pelvis turn, the torso keeps lean/twist
};

/** Hand shapes: curl per finger (index, middle, ring, pinky), thumb curl, finger spread. */
export type HandShape = "relaxed" | "open" | "fist" | "point" | "grip" | "pinch" | "wave" | "thumbsUp" | "flat" | "cradle";
export const HANDS: Record<HandShape, { f: [number, number, number, number]; th: number; spread: number }> = {
  relaxed: { f: [0.25, 0.32, 0.4, 0.48], th: 0.25, spread: 0.1 },
  open: { f: [0.05, 0.05, 0.08, 0.1], th: 0.05, spread: 0.6 },
  wave: { f: [0, 0, 0, 0], th: 0, spread: 1 },
  flat: { f: [0, 0, 0, 0], th: 0.3, spread: 0 },
  fist: { f: [1, 1, 1, 1], th: 0.9, spread: 0 },
  point: { f: [0, 1, 1, 1], th: 0.85, spread: 0 },
  grip: { f: [0.62, 0.68, 0.72, 0.78], th: 0.55, spread: 0 },
  pinch: { f: [0.55, 0.85, 0.95, 1], th: 0.6, spread: 0 },
  thumbsUp: { f: [1, 1, 1, 1], th: -0.4, spread: 0 },
  cradle: { f: [0.1, 0.12, 0.16, 0.2], th: 0.55, spread: 0.05 }, // a phone resting on the palm and fingers, screen up
};

export type Arm = [number, number, number] | [number, number, number, number];
export type Face3 = { smile?: number; open?: number; brow?: number; blink?: boolean; closed?: boolean; eyesBig?: number; sing?: boolean; tears?: number }; // sing: keep `open` even outside the character's lines; tears 0..1: wet streaks run down from both eyes (1 = to the jaw, with a drop)

/** Bare skin below shorts (every character has the channel's black skin). */
const SKIN_BARE = "#121216";

export type Look3 = {
  coat: string; coatDark: string; trousers: string; shoes: string;
  long?: boolean; cap?: string; button?: boolean; sleeveless?: boolean; shorts?: boolean; hoodie?: boolean; beanie?: string; scarf?: string; hoodUp?: boolean; earphones?: boolean; scar?: boolean; whistle?: boolean;
  skin?: string; // skin tone for NON-main characters (head, neck, hands, bare arms); default = the channel's black (the main character keeps it). Face marks go dark on light skin.
  voice?: string; // speaker key in the episode's lip track (mouth follows that voice)
  scars?: boolean; // glowing scars of light up both forearms (the older you, Ep05)
  hair?: string; // hair colour: a hair cap (gives a person a different silhouette)
  bun?: boolean; // with hair: a bun at the back
  // Ep06 additions (2026-10-24): grooming, hairstyles and outfits so every person reads differently
  hairStyle?: "short" | "swept" | "buzz" | "ponytail" | "long" | "balding" | "curly" | "bun"; // with hair: the cut (default "short"; bun: true also gives "bun")
  hairGrey?: number;   // 0..1 share of grey strands
  hairLength?: number; // long hair / ponytail length (m)
  beardGrey?: number;  // 0..1 grey in the beard
  stubble?: string;    // short stubble colour
  streak?: string;     // a grey streak at the front of the hair
  glasses?: string;    // frame colour
  beard?: string;      // full beard colour (jaw and chin)
  mustache?: string;   // mustache colour
  earrings?: string;   // small studs
  headScale?: [number, number, number]; // head proportions (wide, tall, deep): faces differ per person
  shortSleeves?: boolean; // forearms bare (scrubs, gowns, tees)
  vneck?: string;      // a V-neck opening (scrubs, gowns)
  pocket?: string;     // a chest pocket
  badge?: string;      // an ID badge on a lanyard (lanyard colour)
  shirt?: string;      // an open coat over a shirt (lab coat): the shirt colour shows down the front
  tie?: string;
  stethoscope?: boolean;
  apron?: string;      // a work apron over the front
  cardigan?: string;   // a button-front opening (button colour)
  belt?: string;       // a tied belt at the waist (robes)
  helmet?: string;     // a bike helmet
  towel?: string;      // a towel wrapped on the head (after a shower)
  surgicalCap?: string;
  headphones?: string; // over-ear headphones
};

/** Per-frame rig state, set by the episode's ShotFrame: the film time, and a lip track (0..1 mouth opening while that voice speaks, null otherwise). */
export const RIG: { t: number; lip: null | ((t: number, voice: string) => number | null); tables: Table3[] } = { t: 0, lip: null, tables: [] };
/** A table top in world space (sets register theirs in RIG.tables each frame; ShotFrame clears the list). */
export type Table3 = { x0: number; x1: number; z0: number; z1: number; top: number };

// ─── table guard: no arm or hand may pass through a table (user note, Part 2) ───────────────────────────────
// Forward kinematics of this rig's arm (same chain as `arm` below, ignoring rotX/rotZ): sample points along the
// upper arm, forearm and hand; if any sits inside a registered table top (or just under its surface), raise the arm
// (more forward swing and elbow bend) until it clears, so the forearm ends up resting on the top instead.
const _m = new THREE.Matrix4(), _t = new THREE.Matrix4(), _v = new THREE.Vector3();
const mul = (m: THREE.Matrix4, k: "x" | "y" | "z" | "t", a: number, b = 0, c = 0) => {
  if (k === "t") _t.makeTranslation(a, b, c); else if (k === "x") _t.makeRotationX(a); else if (k === "y") _t.makeRotationY(a); else _t.makeRotationZ(a);
  return m.multiply(_t);
};
const armSamples = (pos: [number, number, number], yaw: number, pose: Pose3, side: 1 | -1, a: Arm, rk: number): THREE.Vector3[] => {
  const D2 = (x: number) => (x * Math.PI) / 180, cl = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
  const m = _m.identity(); mul(m, "t", pos[0], pos[1], pos[2]); mul(m, "y", yaw); mul(m, "t", 0, 0.8 + (pose.bob ?? 0), 0);
  mul(m, "x", D2(pose.lean ?? 0)); mul(m, "y", D2(pose.twist ?? 0)); mul(m, "t", side * 0.215, 0.44, -0.01);
  mul(m, "z", side * D2(cl(a[1], -10, 170))); mul(m, "x", -D2(cl(a[0], -80, 180))); mul(m, "y", side * D2(cl(a[3] ?? 0, -110, 110)));
  const out: THREE.Vector3[] = [];
  for (const u of [0.5, 0.75, 1]) out.push(_v.set(0, -0.27 * rk * u, 0).applyMatrix4(m).clone());
  mul(m, "t", 0, -0.27 * rk, 0); mul(m, "x", -D2(cl(a[2], 0, 150)));
  for (const u of [0.25, 0.5, 0.75, 1]) out.push(_v.set(0, -0.25 * rk * u, 0).applyMatrix4(m).clone());
  out.push(_v.set(0, -0.25 * rk - 0.1, 0).applyMatrix4(m).clone()); // fingertips (roughly, hand hanging on)
  return out;
};
// samples: 3 on the upper arm, 4 on the forearm (radius ~5 cm: needs 4 cm over the top), then the fingertips (need 1 cm)
const hits = (ps: THREE.Vector3[], tables: Table3[]) => ps.some((p, i) => tables.some((tb) => p.x > tb.x0 - 0.04 && p.x < tb.x1 + 0.04 && p.z > tb.z0 - 0.04 && p.z < tb.z1 + 0.04 && p.y > tb.top - 0.12 && p.y < tb.top + (i === ps.length - 1 ? 0.01 : 0.04)));
export const guardArms = (pos: [number, number, number], yaw: number, pose: Pose3, tables: Table3[]): Pose3 => {
  if (!tables.length || (pose.bob ?? 0) > -0.15) return pose; // seated people only (standing arms hang beside tables)
  const rk = pose.reach ?? 1;
  const fix = (side: 1 | -1, a0: Arm | undefined): Arm | undefined => {
    if (!a0 || !hits(armSamples(pos, yaw, pose, side, a0, rk), tables)) return a0;
    // the smallest change of forward swing and elbow bend that clears the top: the forearm comes to rest on it
    let best: Arm | undefined, bestC = 1e9;
    for (let d0 = -24; d0 <= 36; d0 += 4) for (let d2 = -60; d2 <= 70; d2 += 5) {
      const c = Math.abs(d0) * 1.4 + Math.abs(d2);
      if (c >= bestC) continue;
      const a: Arm = [a0[0] + d0, a0[1], Math.max(0, Math.min(150, a0[2] + d2)), a0[3]] as Arm;
      if (!hits(armSamples(pos, yaw, pose, side, a, rk), tables)) { best = a; bestC = c; }
    }
    return best ?? a0;
  };
  return { ...pose, armL: fix(1, pose.armL), armR: fix(-1, pose.armR) };
};
export const LOOKS: Record<string, Look3> = {
  hero: { coat: "#E9E2D0", coatDark: "#C9BFA6", trousers: "#2B3042", shoes: "#17101A", button: true },
  oldman: { coat: "#8A6A4A", coatDark: "#634B33", trousers: "#2F3442", shoes: "#1A1410", long: true, cap: "#6A6A72" },
  // the channel hero (2026-10-23): signature blue hoodie, dark jeans, light trainers
  hoodie: { coat: "#2E5FD0", coatDark: "#1F3F94", trousers: "#27324F", shoes: "#E9ECF4", hoodie: true, voice: "YOU" },
  jamie: { coat: "#A0303C", coatDark: "#7A2230", trousers: "#1E222E", shoes: "#E9ECF4", hoodie: true, hoodUp: true, earphones: true, voice: "JAMIE" },
  coach: { coat: "#2E6A4A", coatDark: "#1F4A34", trousers: "#2E6A4A", shoes: "#151515", cap: "#1B2A4E", whistle: true, voice: "COACH" },
  keeper: { coat: "#C8E04A", coatDark: "#9AB030", trousers: "#1E222E", shoes: "#151515" },
  older: { coat: "#1E3C8A", coatDark: "#142A60", trousers: "#20242F", shoes: "#2A2A2A", hoodie: true, scar: true },
  // Ep05: you, twenty years of jumps later (faded blue hoodie, glowing scars on both arms); Mum (warm cardigan, hair in a bun)
  olderYou: { coat: "#3D5A8E", coatDark: "#2A3F66", trousers: "#2A2E38", shoes: "#3A3A3A", hoodie: true, scars: true, hair: "#9A9AA2", voice: "OLDER" },
  mum: { coat: "#C98A4E", coatDark: "#A06A38", trousers: "#3A3F55", shoes: "#5A3A2A", long: true, hair: "#2A1C16", bun: true, voice: "MUM" },
  teacher: { coat: "#6A4E8A", coatDark: "#4E3868", trousers: "#2A2A34", shoes: "#151515", long: true },
  // extras for crowds: varied coats and hats (no sister-channel teal coat or mustard scarf)
  ex1: { coat: "#B8432F", coatDark: "#8A2F20", trousers: "#2B2B33", shoes: "#1A1410", long: true },
  ex2: { coat: "#C9B48A", coatDark: "#A08B62", trousers: "#3A3A44", shoes: "#2A1E16", long: true, beanie: "#5A5A66" },
  ex3: { coat: "#4E7A4A", coatDark: "#36583A", trousers: "#2A2A30", shoes: "#151515", beanie: "#D9472B" },
  ex4: { coat: "#5A5E6E", coatDark: "#40434F", trousers: "#2B2F3A", shoes: "#111111", button: false },
  ex5: { coat: "#E7D9C4", coatDark: "#C6B79F", trousers: "#6A4E3A", shoes: "#3A2A20", scarf: "#7A3E8A" },
  ex6: { coat: "#7A4E8E", coatDark: "#5A3870", trousers: "#2A2236", shoes: "#151515", cap: "#3A4A6A" },
  ex7: { coat: "#2F2F36", coatDark: "#1E1E24", trousers: "#2F2F36", shoes: "#0E0E0E", long: true },
  ex8: { coat: "#E58A3A", coatDark: "#B8682A", trousers: "#27324F", shoes: "#E9ECF4" },
  runner: { coat: "#3D7DCA", coatDark: "#2A5B98", trousers: "#1F2433", shoes: "#F1F4F2" },
};

const D = THREE.MathUtils.degToRad;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const INK = "#0E070D";
const FACE = "#F4EFE6";

// three-step toon ramp shared by every cloth material: flat light / mid / shade, like the 2D look
const ramp = (() => {
  const data = new Uint8Array([78, 78, 78, 255, 128, 128, 128, 255, 176, 176, 176, 255, 220, 220, 220, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(data, 5, 1, THREE.RGBAFormat);
  t.minFilter = THREE.NearestFilter; t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
})();
const toonCache = new Map<string, THREE.MeshToonMaterial>();
export const toon = (c: string) => {
  if (!toonCache.has(c)) toonCache.set(c, new THREE.MeshToonMaterial({ color: c, gradientMap: ramp }));
  return toonCache.get(c)!;
};
const gloss = new THREE.MeshPhysicalMaterial({ color: INK, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.15 });
/** Hands and bare forearms: matte (the user, 2026-10-26: hands must not look shiny); the head keeps its gloss. */
const skinMatte = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.85, metalness: 0 });
const faceMat = new THREE.MeshBasicMaterial({ color: FACE });
/** The head gloss, the matte skin and the face-mark materials of one character. */
export type SkinSet = { gloss: THREE.Material; matte: THREE.Material; face: THREE.Material };
const BASE_SKIN: SkinSet = { gloss, matte: skinMatte, face: faceMat };
const SKIN_CACHE = new Map<string, SkinSet>();
/** Non-main characters may have their own skin tone (the owner, 2026-10-29: the black head is strict only for the main character). */
export const skinSet = (c?: string): SkinSet => {
  if (!c) return BASE_SKIN;
  let k = SKIN_CACHE.get(c);
  if (!k) {
    const col = new THREE.Color(c); const lum = 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b;
    k = { gloss: new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.4, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
      matte: new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0 }),
      face: new THREE.MeshBasicMaterial({ color: lum > 0.28 ? "#1B1009" : FACE }) };
    SKIN_CACHE.set(c, k);
  }
  return k;
};
const SkinCtx = React.createContext<SkinSet>(BASE_SKIN);

/** A tapered limb segment hanging down from its joint (length l), with a round cap at the joint. */
const Seg: React.FC<{ l: number; r0: number; r1: number; mat: THREE.Material; cap?: boolean }> = ({ l, r0, r1, mat, cap = true }) => (
  <>
    {cap && <mesh material={mat} castShadow><sphereGeometry args={[r0, 18, 14]} /></mesh>}
    <mesh material={mat} position={[0, -l / 2, 0]} castShadow><cylinderGeometry args={[r0, r1, l, 18]} /></mesh>
  </>
);

/** A cloth limb segment with folds (sleeves, trouser legs): same placement as Seg. */
const ClothSeg: React.FC<{ kind: LimbKind; l: number; r0: number; r1: number; bend: number; mat: THREE.Material; cap?: boolean }> = ({ kind, l, r0, r1, bend, mat, cap = true }) => (
  <>
    {cap && <mesh material={mat} castShadow><sphereGeometry args={[r0 * 1.01, 18, 14]} /></mesh>}
    <mesh geometry={foldedLimb(kind, l, r0, r1, bend)} material={mat} position={[0, -l / 2, 0]} castShadow />
  </>
);

/** Hand at the end of the forearm: palm, four two-joint fingers that curl, an opposable thumb, a wrist that bends and twists.
 * Local frame before the wrist: −y runs along the forearm, the palm faces +z. side = +1 left hand, −1 right hand.
 * Default twist turns the palm toward the body when the arm hangs. Props attach at the palm (children). */
const Hand: React.FC<{ shape: HandShape | number; side: number; wrist?: [number, number]; children?: React.ReactNode }> = ({ shape, side, wrist, children }) => {
  const h = typeof shape === "number" ? { f: [shape, shape, shape, shape] as [number, number, number, number], th: shape * 0.8, spread: 0.1 } : HANDS[shape];
  const S = React.useContext(SkinCtx);
  const bend = wrist?.[0] ?? 8, twist = wrist?.[1] ?? -side * 80;
  return (
    <group rotation={[0, D(twist), 0]}>
      <group rotation={[-D(bend), 0, 0]}>
        <mesh material={S.matte} scale={[0.046, 0.055, 0.024]} position={[0, -0.045, 0]} castShadow><sphereGeometry args={[1, 16, 12]} /></mesh>
        {[-1.5, -0.5, 0.5, 1.5].map((k, i) => {
          const c = h.f[i], len = i === 3 ? 0.8 : i === 1 ? 1.08 : 1;
          return (
            <group key={k} position={[k * 0.0185, -0.092, 0.004]} rotation={[-D(8 + 70 * c), 0, D(k * 6 * h.spread)]}>
              <mesh material={S.matte} position={[0, -0.017 * len, 0]} castShadow><capsuleGeometry args={[0.0102, 0.022 * len, 4, 8]} /></mesh>
              <group position={[0, -0.036 * len, 0]} rotation={[-D(85 * c), 0, 0]}>
                <mesh material={S.matte} position={[0, -0.012 * len, 0]}><capsuleGeometry args={[0.0095, 0.016 * len, 4, 8]} /></mesh>
              </group>
            </group>
          );
        })}
        <group position={[side * 0.04, -0.045, 0.012]} rotation={[-D(25 + 45 * Math.max(0, h.th)), 0, side * D(h.th < 0 ? -10 : 40 - 25 * h.th)]}>
          <mesh material={S.matte} position={[0, -0.016, 0]} castShadow><capsuleGeometry args={[0.012, 0.022, 4, 8]} /></mesh>
          <group position={[0, -0.032, 0]} rotation={[-D(50 * Math.max(0, h.th)), 0, 0]}>
            <mesh material={S.matte} position={[0, -0.011, 0]}><capsuleGeometry args={[0.011, 0.014, 4, 8]} /></mesh>
          </group>
        </group>
        <group position={[0, -0.075, 0.03]}>{children}</group>
      </group>
    </group>
  );
};

/** Shoe: heel, toe pointing forward (+z), a lighter sole. */
const Shoe: React.FC<{ color: string }> = ({ color }) => (
  <group position={[0, -0.03, 0.04]}>
    <mesh material={toon(color)} scale={[0.055, 0.04, 0.12]} castShadow><sphereGeometry args={[1, 16, 12]} /></mesh>
    <mesh material={toon("#3A3040")} position={[0, -0.03, 0]} scale={[0.056, 0.012, 0.122]}><sphereGeometry args={[1, 16, 8]} /></mesh>
  </group>
);

// torso profile (radius, height) from the hips (0) to the neck base (0.52), turned into an oval body
const torsoPts = (long: boolean) => {
  const p: [number, number][] = long
    ? [[0, -0.42], [0.25, -0.42], [0.235, -0.2], [0.2, 0.0], [0.185, 0.12], [0.2, 0.3], [0.215, 0.42], [0.19, 0.48], [0.1, 0.52], [0, 0.53]]
    : [[0, -0.07], [0.205, -0.07], [0.2, 0.02], [0.185, 0.12], [0.2, 0.3], [0.215, 0.42], [0.19, 0.48], [0.1, 0.52], [0, 0.53]];
  return p.map(([r, y]) => new THREE.Vector2(r, y));
};
const DEPTH = 0.66; // torso depth relative to width

/** A cream mark following the head sphere: points given as (azimuth, elevation) in radians. */
const SurfaceLine: React.FC<{ R: number; pts: [number, number][]; w: number }> = ({ R, pts, w }) => {
  const S = React.useContext(SkinCtx);
  const geo = useMemo(() => {
    const v = pts.map(([az, el]) => new THREE.Vector3(R * Math.cos(el) * Math.sin(az), R * Math.sin(el), R * Math.cos(el) * Math.cos(az)));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(v), 24, w, 6, false);
  }, [R, w, JSON.stringify(pts)]);
  return <mesh geometry={geo} material={S.face} />;
};

const tearMat = new THREE.MeshStandardMaterial({ color: "#7FB8E6", emissive: "#3E7AB0", emissiveIntensity: 0.6, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.85 });
const SurfaceLineM: React.FC<{ R: number; pts: [number, number][]; w: number; mat: THREE.Material }> = ({ R, pts, w, mat }) => {
  const geo = useMemo(() => {
    const v = pts.map(([az, el]) => new THREE.Vector3(R * Math.cos(el) * Math.sin(az), R * Math.sin(el), R * Math.cos(el) * Math.cos(az)));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(v), 24, w, 6, false);
  }, [R, w, JSON.stringify(pts)]);
  return <mesh geometry={geo} material={mat} />;
};
/** A ring (eye) or disc (pupil) lying on the head sphere at (azimuth, elevation). */
const OnHead: React.FC<{ R: number; az: number; el: number; children: React.ReactNode }> = ({ R, az, el, children }) => (
  <group rotation={[-el, az, 0]}>
    <group position={[0, 0, R * 0.995]}>{children}</group>
  </group>
);

const Head: React.FC<{ face: Face3; cap?: string; hood?: string; earphones?: boolean }> = ({ face, cap, hood, earphones }) => {
  const S = React.useContext(SkinCtx);
  const R = 0.23;
  const smile = face.smile ?? 0.4, open = face.open ?? 0, brow = face.brow ?? 0, big = face.eyesBig ?? 0;
  const eyeR = 0.036 * (1 + 0.3 * big);
  const ey = face.blink ? 0.12 : 1;
  const mouth: [number, number][] = [-1, -0.5, 0, 0.5, 1].map((s) => [s * 0.27, -0.32 - smile * 0.09 * (1 - s * s)]);
  return (
    <group>
      <mesh material={S.gloss} castShadow><sphereGeometry args={[R, 40, 30]} /></mesh>
      {[-1, 1].map((e) => (
        <React.Fragment key={e}>
          {face.closed ? (
            // softly closed eye: one thin line curving down in the middle (hugs, relief, tears)
            <SurfaceLine R={R + 0.002} w={0.0065} pts={[-1, -0.5, 0, 0.5, 1].map((s) => [e * 0.33 + s * 0.1, 0.045 - 0.018 * (1 - s * s)] as [number, number])} />
          ) : (
            <OnHead R={R} az={e * 0.33} el={0.08}>
              <mesh material={S.face} scale={[1, ey, 1]}><torusGeometry args={[eyeR, 0.0085, 8, 28]} /></mesh>
              {!face.blink && <mesh material={S.face} position={[0, -0.004, 0.004]}><circleGeometry args={[eyeR * 0.42, 18]} /></mesh>}
            </OnHead>
          )}
          {/* brow: + brow = worried (inner ends up), − = angry */}
          <SurfaceLine R={R + 0.002} w={0.0075} pts={[[e * 0.2, 0.3 + brow * 0.06], [e * 0.33, 0.32], [e * 0.46, 0.3 - brow * 0.03]]} />
        </React.Fragment>
      ))}
      {/* tears: a bright wet line from under each eye down the cheek, a drop gathering at its end */}
      {(face.tears ?? 0) > 0.02 && [-1, 1].map((e) => {
        const k = Math.min(1, face.tears ?? 0), el1 = 0.0 - 0.36 * k, az = (el: number) => e * (0.31 + 0.05 * (0.0 - el));
        const pts: [number, number][] = [0, 0.25, 0.5, 0.75, 1].map((u) => { const el = 0.0 + (el1 - 0.0) * u; return [az(el), el]; });
        return <group key={`tr${e}`}>
          <SurfaceLineM R={R + 0.003} w={0.0042} pts={pts} mat={tearMat} />
          <OnHead R={R + 0.004} az={az(el1)} el={el1}><mesh material={tearMat}><sphereGeometry args={[0.0075, 10, 8]} /></mesh></OnHead>
        </group>;
      })}
      {open > 0.12 ? (
        <OnHead R={R} az={0} el={-0.34}>
          <mesh material={S.face} scale={[1, 0.35 + open * 0.9, 1]}><torusGeometry args={[0.032, 0.0085, 8, 24]} /></mesh>
        </OnHead>
      ) : (
        <SurfaceLine R={R + 0.002} w={0.0085} pts={mouth} />
      )}
      {hood && (
        <mesh material={toon(hood)} scale={[1.2, 1.16, 1.2]} position={[0, 0.02, -0.03]} castShadow>
          <sphereGeometry args={[R, 32, 20, D(140), D(260), 0, D(122)]} />
        </mesh>
      )}
      {hood && (
        <mesh material={toon(hood)} scale={[1.2, 1.16, 1.2]} position={[0, 0.02, -0.03]}>
          <sphereGeometry args={[R, 32, 8, 0, Math.PI * 2, 0, D(48)]} />
        </mesh>
      )}
      
      {earphones && [-1, 1].map((k) => <mesh key={k} position={[k * R * 0.86, -0.06, R * 0.42]}><sphereGeometry args={[0.022, 10, 8]} /><meshBasicMaterial color="#F4F4F4" /></mesh>)}
      {cap && (
        <group rotation={[D(-8), 0, 0]}>
          <mesh material={toon(cap)} position={[0, 0.07, 0]} scale={[1.04, 0.62, 1.06]}>
            <sphereGeometry args={[R, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh material={toon("#55555C")} position={[0, 0.085, R * 0.95]} rotation={[D(12), 0, 0]} scale={[1, 0.14, 0.62]}>
            <cylinderGeometry args={[0.16, 0.16, 0.12, 24, 1, false, -Math.PI / 2, Math.PI]} />
          </mesh>
        </group>
      )}
    </group>
  );
};

/** The strand-hair spec for a look (seeded by the character's colours, so each person keeps the same hair in every shot). */
const hairSpec = (look: Look3, _pos: [number, number, number]): HairSpec => ({
  style: look.bun ? "bun" : (look.hairStyle ?? "short"), color: look.hair!, grey: look.hairGrey, streak: look.streak, length: look.hairLength,
  seed: [...(look.hair! + look.coat)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 100000,
});

/** (Superseded by strand hair in Hair3D.tsx; kept for reference.) Hair by style: a cap (short), a ponytail, long hair down the back, a balding fringe, or curls. */
const Hair: React.FC<{ look: Look3 }> = ({ look }) => {
  const m = toon(look.hair!), st = look.hairStyle ?? "short";
  return (
    <group>
      {st !== "balding" && <>
        <mesh material={m} position={[0, 0.03, -0.02]} scale={[1.07, 0.92, 1.08]}><sphereGeometry args={[0.23, 28, 16, D(140), D(260), 0, Math.PI * 0.55]} /></mesh>
        <mesh material={m} position={[0, 0.03, -0.02]} scale={[1.07, 0.92, 1.08]}><sphereGeometry args={[0.23, 16, 12, D(40), D(100), 0, Math.PI * 0.33]} /></mesh>
      </>}
      {st === "balding" && <group position={[0, 0.0, -0.01]} rotation={[0, D(-160), 0]}><mesh material={m} rotation={[Math.PI / 2, 0, 0]} scale={[1.04, 1.06, 1]}><torusGeometry args={[0.225, 0.034, 10, 28, D(220)]} /></mesh></group>}
      {st === "curly" && Array.from({ length: 16 }, (_, k) => { const a = (k / 16) * Math.PI * 2, r = k % 2 ? 0.16 : 0.2; return <mesh key={k} material={m} position={[Math.sin(a) * r, 0.17 + (k % 3) * 0.02, Math.cos(a) * r - 0.03]}><sphereGeometry args={[0.055, 10, 8]} /></mesh>; })}
      {st === "ponytail" && <><mesh material={m} position={[0, 0.06, -0.24]}><sphereGeometry args={[0.04, 10, 8]} /></mesh><mesh material={m} position={[0, -0.06, -0.27]} rotation={[D(14), 0, 0]}><capsuleGeometry args={[0.045, 0.18, 6, 10]} /></mesh></>}
      {st === "long" && <mesh material={m} position={[0, -0.1, -0.08]} scale={[1.05, 1.3, 0.75]}><sphereGeometry args={[0.23, 24, 14, D(100), D(160), Math.PI * 0.3, Math.PI * 0.55]} /></mesh>}
      {look.bun && <mesh material={m} position={[0, 0.12, -0.2]}><sphereGeometry args={[0.085, 16, 12]} /></mesh>}
      {look.streak && <mesh material={toon(look.streak)} position={[0, 0.03, -0.02]} scale={[1.075, 0.925, 1.085]}><sphereGeometry args={[0.23, 6, 10, D(58), D(16), Math.PI * 0.02, Math.PI * 0.31]} /></mesh>}
    </group>
  );
};

/** Glasses, beard, mustache, earrings, headphones and head coverings, wrapped on the head sphere (R 0.23). */
const Groom: React.FC<{ look: Look3 }> = ({ look }) => {
  const R = 0.23;
  return (
    <group>
      {look.glasses && (
        <group>
          {[-1, 1].map((e) => (
            <OnHead key={e} R={R + 0.018} az={e * 0.33} el={0.08}>
              <mesh material={toon(look.glasses!)}><torusGeometry args={[0.052, 0.0065, 8, 28]} /></mesh>
            </OnHead>
          ))}
          <OnHead R={R + 0.02} az={0} el={0.1}><mesh material={toon(look.glasses)} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.005, 0.005, 0.045, 6]} /></mesh></OnHead>
          {[-1, 1].map((e) => <mesh key={e} material={toon(look.glasses!)} position={[e * R * 0.93, 0.03, -0.02]} rotation={[0, 0, 0]}><boxGeometry args={[0.008, 0.008, 0.2]} /></mesh>)}
        </group>
      )}
      {(look.beard || look.mustache || look.stubble) && <BeardStrands beard={{ color: look.beard ?? look.mustache ?? look.stubble!, beard: !!look.beard, mustache: !!look.mustache || !!look.beard, stubble: !!look.stubble && !look.beard, grey: look.beardGrey }} />}
      {look.earrings && [-1, 1].map((k) => <mesh key={k} material={toon(look.earrings!)} position={[k * R * 0.98, -0.07, 0.01]}><sphereGeometry args={[0.014, 10, 8]} /></mesh>)}
      {look.headphones && (
        <>
          <mesh material={toon(look.headphones)} position={[0, 0.02, -0.01]} rotation={[0, 0, 0]}><torusGeometry args={[R + 0.035, 0.014, 8, 32, Math.PI]} /></mesh>
          {[-1, 1].map((k) => <mesh key={k} material={toon(look.headphones!)} position={[k * (R + 0.02), 0.0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.065, 0.065, 0.05, 20]} /></mesh>)}
        </>
      )}
      {look.helmet && (
        <group rotation={[D(-6), 0, 0]}>
          <mesh material={toon(look.helmet)} position={[0, 0.06, -0.02]} scale={[1.12, 0.78, 1.25]}><sphereGeometry args={[R, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <mesh material={toon("#1E1E24")} position={[0, 0.1, R * 1.12]} rotation={[D(20), 0, 0]} scale={[0.16, 0.012, 0.06]}><sphereGeometry args={[1, 12, 6]} /></mesh>
        </group>
      )}
      {look.towel && (
        <group>
          <mesh material={toon(look.towel)} position={[0, 0.08, -0.03]} scale={[1.1, 0.9, 1.1]}><sphereGeometry args={[R, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
          <mesh material={toon(look.towel)} position={[0, 0.27, -0.06]} rotation={[D(-30), 0, 0]}><torusGeometry args={[0.07, 0.035, 10, 20]} /></mesh>
        </group>
      )}
      {look.surgicalCap && <mesh material={toon(look.surgicalCap)} position={[0, 0.05, -0.015]} scale={[1.06, 0.82, 1.08]}><sphereGeometry args={[R, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.52]} /></mesh>}
    </group>
  );
};

export const Person3D: React.FC<{
  pos: [number, number, number]; yaw?: number; pose?: Pose3; face?: Face3; look?: Look3;
  propR?: React.ReactNode; propL?: React.ReactNode; rotX?: number; rotZ?: number; ghost?: number; s?: number; // s: body size (1 adult; ~0.55 a six-year-old)
  hairWind?: [number, number, number]; // head-local push on long hair (default: from running speed, plus a slow sway)
}> = ({ pos, yaw = 0, pose: pose0 = {}, face: face0 = {}, look = LOOKS.hoodie, propR, propL, rotX = 0, rotZ = 0, s: size = 1, hairWind: hairWind0 }) => {  // default = the channel hero (blue hoodie); LOOKS.hero is the retired ivory jacket
  // idle life: everyone breathes, sways and blinks a little, each on their own phase
  const t = RIG.t, seed = pos[0] * 3.1 + pos[2] * 1.7;
  const breath = Math.sin((t / 3.6) * Math.PI * 2 + seed), sway = (f: number, k: number) => Math.sin(t * f + seed * k);
  const addArm = (a: Arm | undefined, k: number): Arm => { const b = a ?? [0, 6, 8]; return [b[0] + 2 * sway(0.7, k), b[1] + 1.2 * sway(0.5, k + 1), b[2] + 2.5 * sway(0.9, k + 2), b[3]] as Arm; };
  // the table guard runs on the held pose (stable from frame to frame); idle sway is added on top
  const poseG: Pose3 = guardArms(pos, yaw, pose0, RIG.tables);
  const pose: Pose3 = { ...poseG, headTurn: (poseG.headTurn ?? 0) + 2.5 * sway(0.55, 1), headNod: (poseG.headNod ?? 0) + 1.8 * sway(0.43, 2), bob: (poseG.bob ?? 0) + 0.004 * breath, armL: addArm(poseG.armL, 3), armR: addArm(poseG.armR, 5) };
  // lip sync: while this character's own line plays, the mouth follows their voice; otherwise it stays closed unless an expression opens it
  const lipV = look.voice && RIG.lip ? RIG.lip(t, look.voice) : null;
  const face: Face3 = { ...face0, open: lipV !== null ? lipV * 0.9 : look.voice && RIG.lip && !face0.sing ? 0 : face0.open, blink: face0.blink ?? (((t + seed * 0.37) % 3.7 + 3.7) % 3.7 < 0.11) };
  const lean = (pose.lean ?? 0) + 0.8 * breath, twist = pose.twist ?? 0;
  // wind on long hair (head-local): running streams it back; a slow idle sway otherwise; a shot can push it with hairWind
  const run = clamp(((pose0.lean ?? 0) - 6) / 16, 0, 1);
  const hairWind: [number, number, number] = hairWind0 ?? [0.12 * Math.sin(t * 1.1 + seed), 0.35 * run, -1.6 * run + 0.06 * Math.sin(t * 0.8 + seed * 2)];
  const longT = !!look.long && (pose.bob ?? 0) > -0.15;
  const torsoGeo = useMemo(() => foldedTorso(torsoPts(longT), longT ? "long" : look.hoodie ? "hoodie" : "jacket"), [longT, look.hoodie]);
  const coat = toon(look.coat), coatDark = toon(look.coatDark), legs = toon(look.trousers);
  const rk = pose.reach ?? 1;
  const arm = (side: 1 | -1, a: Arm = [0, 6, 8], prop?: React.ReactNode) => (
    <group position={[side * 0.215, 0.44, -0.01]}>
      <mesh material={coat} castShadow><sphereGeometry args={[0.078, 18, 14]} /></mesh>
      <group rotation={[0, 0, side * D(clamp(a[1], -10, 170))]}>
        <group rotation={[-D(clamp(a[0], -80, 180)), 0, 0]}>
          <group rotation={[0, side * D(clamp(a[3] ?? 0, -110, 110)), 0]}>
          <ClothSeg kind="upperArm" l={0.27 * rk} r0={0.064} r1={0.055} bend={a[2]} mat={coat} cap={false} />
          <group position={[0, -0.27 * rk, 0]} rotation={[-D(clamp(a[2], 0, 150)), 0, 0]}>
            {look.shortSleeves ? <Seg l={0.24 * rk} r0={0.055} r1={0.046} mat={SK.matte} /> : <ClothSeg kind="forearm" l={0.24 * rk} r0={0.055} r1={0.046} bend={a[2]} mat={coat} />}
            {look.shortSleeves
              ? <mesh material={coat} position={[0, 0.005, 0]}><cylinderGeometry args={[0.068, 0.07, 0.05, 16]} /></mesh>
              : <mesh material={coatDark} position={[0, -0.235 * rk, 0]}><cylinderGeometry args={[0.05, 0.05, 0.03, 16]} /></mesh>}
            <group position={[0, -0.235 * rk - 0.015, 0]}><Hand shape={(side === 1 ? pose.handL : pose.handR) ?? (pose.curl !== undefined ? pose.curl : "relaxed")} side={side} wrist={side === 1 ? pose.wristL : pose.wristR}>{prop}</Hand></group>
            {look.scar && side === -1 && <mesh position={[0, -0.12, 0.05]}><boxGeometry args={[0.012, 0.22, 0.012]} /><meshBasicMaterial color="#BFE6FF" toneMapped={false} /></mesh>}
            {look.scars && [[-0.05, 0.3, 0.2], [-0.12, -0.25, 0.15], [-0.18, 0.15, 0.12]].map(([y, rz, l], k) => <mesh key={k} position={[0.01 * k, y, 0.052]} rotation={[0, 0, rz]}><boxGeometry args={[0.01, l, 0.008]} /><meshBasicMaterial color="#CFEBFF" toneMapped={false} /></mesh>)}
          </group>
          </group>
        </group>
      </group>
    </group>
  );
  const SK = skinSet(look.skin);
  const leg = (side: 1 | -1, l: [number, number] = [0, 0], ad = 0, foot?: number) => (
    <group position={[side * 0.095, 0, 0]} rotation={[0, 0, -side * D(ad)]}>
    <group rotation={[-D(clamp(l[0], -90, 135)), 0, 0]}>
      <ClothSeg kind="thigh" l={0.39} r0={0.088} r1={0.066} bend={l[1]} mat={legs} />
      <group position={[0, -0.39, 0]} rotation={[D(clamp(l[1], 0, 150)), 0, 0]}>
        <ClothSeg kind="shin" l={0.36} r0={0.064} r1={0.05} bend={l[1]} mat={look.shorts ? (look.skin ? SK.matte : toon(SKIN_BARE)) : legs} />
        <group position={[0, -0.36, 0]} rotation={[foot === undefined ? -D(clamp(l[1], 0, 150) - clamp(l[0], -90, 110)) * 0.35 : D(foot + clamp(l[0], -90, 135) - clamp(l[1], 0, 150)), 0, 0]}><Shoe color={look.shoes} /></group>
      </group>
    </group>
    </group>
  );
  const fz = (r: number) => r * DEPTH + 0.006; // front surface of the oval torso
  return (
    <SkinCtx.Provider value={SK}>
    <group position={pos} rotation={[0, yaw, 0]} scale={size}>
      <group rotation={[rotX, 0, rotZ]}>
      <group position={[0, 0.8 + (pose.bob ?? 0), 0]}>
        <group rotation={[0, D(pose.hips?.[0] ?? 0), D(pose.hips?.[1] ?? 0)]}>
        {leg(1, pose.legL, pose.adL, pose.footL)}
        {leg(-1, pose.legR, pose.adR, pose.footR)}
        {/* pelvis under the jacket hem */}
        {!longT && <mesh material={legs} position={[0, -0.02, 0]} scale={[0.19, 0.1, 0.19 * DEPTH * 0.98]} castShadow><sphereGeometry args={[1, 20, 12]} /></mesh>}
        </group>
        <group rotation={[D(lean), D(twist), 0]}>
          <mesh geometry={torsoGeo} material={coat} scale={[1 + 0.006 * breath, 1, DEPTH * (1 + 0.012 * breath)]} castShadow receiveShadow />
          {/* buttons on the front: ONE vermilion button at the top, three cream below */}
          {look.button && (
            <>
              <mesh position={[0.035, 0.38, fz(0.205)]}><sphereGeometry args={[0.019, 14, 10]} /><meshToonMaterial color="#D9472B" gradientMap={ramp} /></mesh>
              {[0.26, 0.16, 0.06].map((y) => (
                <mesh key={y} position={[0.035, y, fz(0.19)]} material={toon("#F6F1E6")}><sphereGeometry args={[0.012, 10, 8]} /></mesh>
              ))}
            </>
          )}
          {/* collar ring around the neck (jackets) or the hoodie's hood, drawstrings, pocket and ribbed hem */}
          {!look.hoodie && <mesh material={coatDark} position={[0, 0.5, 0.005]} scale={[1, 1, 0.85]}><cylinderGeometry args={[0.085, 0.13, 0.07, 24, 1, true]} /></mesh>}
          {look.hoodie && (
            <>
              <mesh material={coat} position={[0, 0.5, -0.01]} rotation={[Math.PI / 2 + D(14), 0, 0]} scale={[1, 0.85, 1]} castShadow><torusGeometry args={[0.115, 0.04, 12, 28]} /></mesh>
              {!look.hoodUp && <HoodDown color={look.coat} lining={look.coatDark} />}
              {[-1, 1].map((k) => (
                <group key={k} position={[k * 0.045, 0.46, fz(0.2) + 0.012]} rotation={[D(-6), 0, k * D(4)]}>
                  <mesh material={toon("#EDEBE4")} position={[0, -0.07, 0]}><cylinderGeometry args={[0.006, 0.006, 0.14, 6]} /></mesh>
                  <mesh material={toon("#C9C4B8")} position={[0, -0.145, 0]}><cylinderGeometry args={[0.009, 0.009, 0.022, 8]} /></mesh>
                </group>
              ))}
              <mesh material={coatDark} position={[0, 0.1, fz(0.188) - 0.004]} scale={[0.135, 0.065, 0.02]}><sphereGeometry args={[1, 20, 10]} /></mesh>
              <mesh material={coatDark} position={[0, -0.045, 0]} scale={[1, 1, DEPTH]}><cylinderGeometry args={[0.214, 0.212, 0.055, 40, 1, true]} /></mesh>
            </>
          )}
          {look.vneck && <mesh material={toon(look.vneck)} position={[0, 0.455, fz(0.2) + 0.004]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 0.9, 1]}><circleGeometry args={[0.075, 3]} /></mesh>}
          {look.pocket && <mesh material={toon(look.pocket)} position={[0.095, 0.31, fz(0.205) + 0.003]} scale={[1, 1, 0.3]}><boxGeometry args={[0.07, 0.07, 0.01]} /></mesh>}
          {look.shirt && (
            <>
              <mesh material={toon(look.shirt)} position={[0, 0.27, fz(0.205) + 0.002]}><boxGeometry args={[0.1, 0.44, 0.012]} /></mesh>
              {[-1, 1].map((k) => <mesh key={k} material={coatDark} position={[k * 0.06, 0.37, fz(0.205) + 0.008]} rotation={[0, 0, k * D(18)]}><boxGeometry args={[0.03, 0.2, 0.01]} /></mesh>)}
              {look.tie && <><mesh material={toon(look.tie)} position={[0, 0.3, fz(0.205) + 0.012]}><boxGeometry args={[0.032, 0.3, 0.01]} /></mesh><mesh material={toon(look.tie)} position={[0, 0.46, fz(0.2) + 0.012]}><boxGeometry args={[0.04, 0.035, 0.016]} /></mesh></>}
            </>
          )}
          {look.cardigan && (
            <>
              <mesh material={coatDark} position={[0, 0.2, fz(0.205) + 0.003]}><boxGeometry args={[0.012, 0.5, 0.008]} /></mesh>
              {[0.36, 0.24, 0.12, 0.0].map((y) => <mesh key={y} material={toon(look.cardigan!)} position={[0.022, y, fz(0.2) + 0.008]}><sphereGeometry args={[0.012, 10, 8]} /></mesh>)}
            </>
          )}
          {look.belt && <mesh material={toon(look.belt)} position={[0, 0.1, 0]} scale={[1, 1, DEPTH * 1.04]}><cylinderGeometry args={[0.192, 0.192, 0.04, 32, 1, true]} /></mesh>}
          {look.apron && (
            <>
              {/* the bib on the chest; the skirt hinges at the hips and follows the thighs when sitting or riding */}
              <mesh material={toon(look.apron)} position={[0, 0.2, fz(0.19) + 0.006]} rotation={[D(4), 0, 0]}><boxGeometry args={[0.28, 0.42, 0.006]} /></mesh>
              <group position={[0, -0.01, fz(0.19) + 0.012]} rotation={[-D(Math.min(85, Math.max(0, ((pose.legL?.[0] ?? 0) + (pose.legR?.[0] ?? 0)) / 2 - (pose.lean ?? 0)))), 0, 0]}>
                <mesh material={toon(look.apron)} position={[0, -0.15, 0]}><boxGeometry args={[0.28, 0.3, 0.006]} /></mesh>
              </group>
              <mesh material={toon(look.apron)} position={[0, 0.03, fz(0.2) + 0.02]}><boxGeometry args={[0.16, 0.09, 0.008]} /></mesh>
              {[-1, 1].map((k) => <mesh key={k} material={toon(look.apron!)} position={[k * 0.11, 0.47, 0.06]} rotation={[D(-30), 0, k * D(12)]}><boxGeometry args={[0.022, 0.16, 0.01]} /></mesh>)}
            </>
          )}
          {look.badge && (
            <>
              {[-1, 1].map((k) => <mesh key={k} material={toon(look.badge!)} position={[k * 0.04, 0.39, fz(0.21) + 0.012]} rotation={[0, 0, k * D(16)]}><boxGeometry args={[0.012, 0.18, 0.006]} /></mesh>)}
              <mesh material={toon("#F4F4F2")} position={[0, 0.28, fz(0.205) + 0.016]}><boxGeometry args={[0.05, 0.07, 0.006]} /></mesh>
              <mesh material={toon(look.badge)} position={[0, 0.3, fz(0.205) + 0.02]}><boxGeometry args={[0.05, 0.018, 0.004]} /></mesh>
            </>
          )}
          {look.stethoscope && (
            <>
              <mesh material={toon("#3A3F4A")} position={[0, 0.5, 0.0]} rotation={[Math.PI / 2 + D(12), 0, 0]} scale={[1, 0.82, 1]}><torusGeometry args={[0.13, 0.009, 8, 32]} /></mesh>
              {[-1, 1].map((k) => <mesh key={k} material={toon("#3A3F4A")} position={[k * 0.075, 0.37, fz(0.21) + 0.016]} rotation={[0, 0, k * D(6)]}><cylinderGeometry args={[0.008, 0.008, 0.2, 8]} /></mesh>)}
              <mesh material={toon("#B8BCC4")} position={[0.085, 0.26, fz(0.205) + 0.02]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.025, 0.025, 0.012, 16]} /></mesh>
            </>
          )}
          {arm(1, pose.armL, propL)}
          {arm(-1, pose.armR, propR)}
          <mesh material={SK.gloss} position={[0, 0.58, 0]}><cylinderGeometry args={[0.055, 0.06, 0.12, 16]} /></mesh>
          {look.whistle && <mesh position={[0.04, 0.3, 0.15]} material={toon("#D9D9D9")}><boxGeometry args={[0.05, 0.025, 0.03]} /></mesh>}
          {look.scarf && <mesh material={toon(look.scarf)} position={[0, 0.52, 0.0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.9, 1]}><torusGeometry args={[0.1, 0.045, 10, 24]} /></mesh>}
          <group position={[0, 0.58, 0]} rotation={[0, 0, D(pose.neckTilt ?? 0)]}><group position={[0, 0.21, 0.01]} rotation={[D(pose.headNod ?? 0), D(pose.headTurn ?? 0), 0]} scale={look.headScale ?? [1, 1, 1]}>
            <Head face={face} cap={look.cap} earphones={look.earphones} />
            <Groom look={look} />
            {look.hoodUp && <HoodUp color={look.coat} lining={look.coatDark} />}
            {look.hair && !look.towel && !look.helmet && !look.surgicalCap && !look.hoodUp && <HairStrands hair={hairSpec(look, pos)} wind={hairWind} />}
            {look.beanie && (
              <group>
                <mesh material={toon(look.beanie)} position={[0, 0.06, -0.01]} scale={[1.06, 0.8, 1.06]}><sphereGeometry args={[0.23, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} /></mesh>
                <mesh material={toon(look.beanie)} position={[0, 0.07, -0.01]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.235, 0.025, 8, 32]} /></mesh>
              </group>
            )}
          </group></group>
        </group>
      </group>
      </group>
    </group>
    </SkinCtx.Provider>
  );
};

// ─── poses ───────────────────────────────────────────────────────────────────
export const SIT: Pose3 = { lean: 4, armL: [40, 6, 60], armR: [40, 6, 60], legL: [90, 90], legR: [86, 88], bob: -0.38 };
export const STAND: Pose3 = { armL: [4, 7, 10], armR: [4, 7, 10], legL: [2, 2], legR: [-2, 2] };

/** Walk: phase in cycles (1 = one full stride pair). Knee straight at contact, most bent mid-swing; arms opposite. */
export const walk3 = (ph: number, amp = 1): Pose3 => {
  const a = ph * Math.PI * 2;
  const leg = (p: number): [number, number] => [26 * amp * Math.sin(p), 6 + 46 * amp * Math.max(0, Math.cos(p - 0.6))];
  const armSw = (p: number): [number, number, number] => [-22 * amp * Math.sin(p), 7, 14 + 18 * Math.max(0, -Math.sin(p))];
  return { lean: 4, legL: leg(a), legR: leg(a + Math.PI), armL: armSw(a), armR: armSw(a + Math.PI), bob: -0.02 * Math.abs(Math.cos(a)) };
};

/** Run: longer stride, high knee, elbows at about 90 degrees, forward lean. */
export const run3 = (ph: number): Pose3 => {
  const a = ph * Math.PI * 2;
  const leg = (p: number): [number, number] => [42 * Math.sin(p), 18 + 95 * Math.max(0, Math.cos(p - 0.9))];
  const armSw = (p: number): [number, number, number] => [-46 * Math.sin(p), 10, 85];
  return { lean: 14, legL: leg(a), legR: leg(a + Math.PI), armL: armSw(a), armR: armSw(a + Math.PI), bob: 0.05 * Math.abs(Math.sin(a)) - 0.02, curl: 0.9 };
};

/** A full sprint (top speed), from sprint biomechanics: strong forward lean; opposite arm and leg; the knee drives up to
 * about 85° of hip flexion with the heel tucked tight under the hip in recovery (knee ~120°), then the leg extends back
 * through toe-off (hip ~−15°, knee ~30°); arms pump hard from the hip to about chin height with the elbow held near 90°
 * (closing in front, opening behind); knife hands; a small bob twice a stride. `t` in seconds; `cad` strides per second
 * (elite sprinters ~2.3; the time-runners go far beyond: ~4.5). */
export const sprint3 = (t: number, cad = 4.5, seed = 0): Pose3 => {
  const ph = t * Math.PI * 2 * cad + seed;
  const leg = (p: number): [number, number] => [35 + 50 * Math.sin(p), 25 + 105 * (0.5 + 0.5 * Math.cos(p - 0.9))];
  const arm = (p: number): Arm => [22 + 58 * Math.sin(p), 10, 88 - 22 * Math.sin(p)];
  return { lean: 22, headNod: -14, legL: leg(ph), legR: leg(ph + Math.PI), armL: arm(ph + Math.PI), armR: arm(ph), bob: 0.035 * Math.abs(Math.cos(ph)) - 0.02, handL: "flat", handR: "flat" };
};
export const mix3 = (a: Pose3, b: Pose3, u: number): Pose3 => {
  const m = (x = 0, y = 0) => x + (y - x) * u;
  const m2 = (x: [number, number] = [0, 0], y: [number, number] = [0, 0]): [number, number] => [m(x[0], y[0]), m(x[1], y[1])];
  const m3 = (x: Arm = [0, 0, 0], y: Arm = [0, 0, 0]): Arm => [m(x[0], y[0]), m(x[1], y[1]), m(x[2], y[2]), m(x[3] ?? 0, y[3] ?? 0)];
  return {
    lean: m(a.lean, b.lean), twist: m(a.twist, b.twist), headTurn: m(a.headTurn, b.headTurn), headNod: m(a.headNod, b.headNod), neckTilt: m(a.neckTilt, b.neckTilt), reach: m(a.reach ?? 1, b.reach ?? 1),
    armL: m3(a.armL, b.armL), armR: m3(a.armR, b.armR), legL: m2(a.legL, b.legL), legR: m2(a.legR, b.legR), bob: m(a.bob, b.bob), curl: m(a.curl ?? 0.35, b.curl ?? 0.35),
    handL: u < 0.5 ? a.handL : b.handL, handR: u < 0.5 ? a.handR : b.handR,
    wristL: a.wristL || b.wristL ? m2(a.wristL ?? [8, -80], b.wristL ?? [8, -80]) : undefined, wristR: a.wristR || b.wristR ? m2(a.wristR ?? [8, 80], b.wristR ?? [8, 80]) : undefined,
  };
};

// Short 07 HOUSE shots: s02 s03 s22-s34 (ME's bedroom at night, the upstairs hallway, the morning kitchen).
// Sets: ./Rooms07.tsx (RIG UNITS). Contract: notes/short07/CONTRACT.md. Every time is a word anchor (E.*, at(), P()).
// Jingle sync (the lead places the sound at the same t0s):
//   s22-s23: no note sync (the song swells under b12: a slow glow ramp + flicker only);
//   MOM_T0 (= E.mom13) for s24-s27: the song follows Mom (cone glow, her bob, chest glow);
//   s28-s29: SILENCE (the song stops dead on "Then"): she is still, tiny breathing only;
//   BLAST_T0 (= BLAST_T0) for s30-s34: the whole song with bells; jolts on each note, hardest on the wrong note.
import React, { useMemo } from "react";
import * as THREE from "three";
import { lerp, type Shot } from "../kit/core";
import { BlockLights, Grade } from "../blocky/Look";
import * as M from "../blocky/Motion";
import * as K from "../blocky/Collide";
import type { Expr, Pose } from "../blocky/types";
import { Ch, st, mk, mv, c, E, T, P, PE, at, MOM_T0, BLAST_T0, ME_PJ, MOM, S, notePulse, isWrong, blinkOn, span, JINGLE_NOTE, WRONG_IN_BAR, type V3, type CamS } from "./common";
import { Cone, Flyer } from "./Props07";
import {
  Bedroom07, Blanket, bedroomCS, BED, BED_SIT, DOORWAY_OUT, WINDOW_SPOT, curtainEdge, CURTAIN_Z,
  Kitchen07, kitchenCS, BIN, KITCHEN_MOM,
} from "./Rooms07";

const KS = S.kid;
const JINGLE_NEAR = MOM_T0;
const flick = (t: number) => 0.5 + 0.5 * Math.sin(t * 9.1) * Math.sin(t * 3.7);
const Night: React.FC<{ focus: V3; fill?: number }> = ({ focus, fill = 1 }) => <BlockLights time="interiorNight" focus={focus} fill={fill} />;
const grade = () => <Grade time="interiorNight" />;
/** Words of a beat as [start, end] (Mom's mouth when the narrator quotes her). */
const words = (b: number, from?: string) => {
  const ws = T.words.filter((w) => w.b === b);
  const i = from ? ws.findIndex((w) => w.w.toLowerCase().startsWith(from)) : 0;
  return ws.slice(Math.max(0, i)).map((w) => [w.s, w.e] as [number, number]);
};
const pulseSum = (t: number, t0: number) => notePulse(t, t0) * (isWrong(t, t0) ? 2.2 : 1);

// ---------------------------------------------------------------- ME in bed (kid, sitting up, legs under the blanket)
const BED_ALLOW = ["mattress", "bedFrame", "seat"];
const seatY = M.seatedY(BED.top, KS);
/** ME sitting up in bed at hips x, with a pose on top of the classic sit (legs out). */
const bedAct = (x: number, t: number, extra: Pose, seed = 3): M.Act => ({
  position: [x, seatY, BED_SIT.z], yaw: BED_SIT.yaw, seed,
  pose: M.mix({ legL: Math.PI / 2, legR: Math.PI / 2, armL: 0.6, armR: 0.6 }, M.seatedIdle(t, seed, 0.6), extra),
});
const meHead = (x: number): V3 => [x, seatY + M.seatedY(0, 0) * 0 + 4.56 * KS, BED_SIT.z];
const chinY = seatY + 3.4 * KS;
/** Trembling (small, fast) for a scared kid. */
const shiver = (t: number, k = 1): Pose => ({ roll: 0.012 * Math.sin(t * 37) * k, head: [0.02 * Math.sin(t * 29) * k, 0.015 * Math.sin(t * 41) * k] });

// ---------------------------------------------------------------- Mom at night (two cones)
const MOM_IN: V3 = [8.4, 0, 0.5];                       // where she stops after stepping in (s27-s30)
const ME_BACK: V3 = [BED_SIT.back, 0, BED_SIT.z];
const momYawIn = M.yawTo(MOM_IN, ME_BACK);
/** Both arms forward holding the cones (upright at ~1.3-1.5 rad). */
const coneArms = (k = 1): Pose => ({ armL: 1.3 * k, armR: 1.3 * k, armLOut: -0.24 * k, armROut: -0.24 * k });
const cones = (glow: number) => ({ R: <Cone glow={glow} />, L: <Cone glow={glow} /> });
/** The jingle in her body: a jolt on each note (bigger on the wrong note). */
const jolt = (t: number, t0: number, k = 1): Pose => {
  const p = notePulse(t, t0), w = isWrong(t, t0) ? 1 : 0, n = M.clamp01((t - t0) * 10), sgn = Math.floor((t - t0) / 0.19) % 2 ? 1 : -1;
  const a = p * k * n * (1 + 1.6 * w);
  return { lean: -0.05 * a, head: [0.05 * sgn * a, -0.1 * a], armL: 0.1 * a, armR: 0.1 * a, roll: 0.025 * sgn * a, tilt: 0.28 * w * p * k * n };
};
/** Her "speaker" glow: a pink light at her chest pulsing on the notes. */
const ChestGlow: React.FC<{ at: V3; t: number; t0: number; base?: number; k?: number }> = ({ at, t, t0, base = 4, k = 30 }) =>
  <pointLight position={[at[0], 3.6, at[2]]} intensity={base + k * pulseSum(t, t0)} distance={14} decay={1.6} color="#ff7ab0" />;

/** Cones lowered (the silence before the reveal): arms come down from holding them up to hanging forward, cones out of a tight frame. */
const lowArms = (k: number): Pose => ({ armL: lerp(1.3, 0.3, k), armR: lerp(1.3, 0.3, k), armLOut: lerp(-0.24, 0.0, k), armROut: lerp(-0.24, 0.0, k) });
/**
 * A WIDE-open gaping mouth worn over the "stare" face (the kit's faces have no wide-open mouth): an ellipse decal on the
 * head's curved front, following the head exactly (Collide.rigBoxes uses the renderer's skeleton). `open` 0..1 its height;
 * `glow` 0..1 a pink light deep inside (the song).
 */
const MOUTH_TEX = (() => { let t: THREE.Texture | null = null; return () => {
  if (t) return t;
  const cv = document.createElement("canvas"); cv.width = 128; cv.height = 128; const g = cv.getContext("2d")!;
  g.fillStyle = "#0b0507"; g.beginPath(); g.ellipse(64, 64, 62, 62, 0, 0, Math.PI * 2); g.fill();
  t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; }; })();
const GapeMouth: React.FC<{ who: ReturnType<typeof st>; open: number; glow?: number }> = ({ who, open, glow = 0 }) => {
  const head = K.rigBoxes(who).find((b) => b.part === "head")!;
  const pos = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  head.m.decompose(pos, q, sc);
  const R = 0.595, w = 0.46, arc = w / R, h = 0.06 + 0.42 * open;
  const geo = useMemo(() => new THREE.CylinderGeometry(R, R, 1, 24, 1, true, -arc / 2, arc), [arc]);
  const geoIn = useMemo(() => new THREE.CylinderGeometry(R + 0.002, R + 0.002, 1, 24, 1, true, -arc * 0.3, arc * 0.6), [arc]);
  if (open <= 0.01) return null;
  return <group position={pos} quaternion={q} scale={sc}>
    <mesh geometry={geo} position={[0, -0.13 - 0.05 * open, 0]} scale={[1, h, 1]}>
      <meshBasicMaterial map={MOUTH_TEX()} transparent alphaTest={0.4} depthWrite={false} polygonOffset polygonOffsetFactor={-4} />
    </mesh>
    {glow > 0.01 && <mesh geometry={geoIn} position={[0, -0.16 - 0.05 * open, 0]} scale={[1, h * 0.55, 1]}>
      <meshBasicMaterial map={MOUTH_TEX()} color="#ff5a9a" transparent alphaTest={0.4} opacity={0.85 * glow} toneMapped={false} depthWrite={false} polygonOffset polygonOffsetFactor={-6} />
    </mesh>}
  </group>;
};
/** Her mouth (world), facing -x at MOM_IN: the front of the head, a bit below its centre. */
const MOUTH: V3 = [MOM_IN[0] - 0.62, 4.32, MOM_IN[2]];
const NOTE_COLS = ["#ff7ab0", "#ffb0d4", "#ff5a9a", "#ffd0e6"];
/**
 * The song bursting out of her mouth: on each note onset (BLAST_T0 grid) a soft pink ring puffs out and a small musical
 * note flies off, both drifting toward `toward` (the camera) and fading; the wrong note puffs a bigger, whiter ring.
 */
const SongBurst: React.FC<{ t: number; t0: number; from: V3; toward: V3 }> = ({ t, t0, from, toward }) => {
  if (t < t0) return null;
  const d = [toward[0] - from[0], toward[1] - from[1], toward[2] - from[2]], L = Math.hypot(d[0], d[1], d[2]);
  const f: V3 = [d[0] / L, d[1] / L, d[2] / L];
  const side: V3 = [-f[2], 0, f[0]];
  const yaw = Math.atan2(f[0], f[2]);
  const n = Math.floor((t - t0) / JINGLE_NOTE), out: React.ReactNode[] = [];
  for (let k = Math.max(0, n - 5); k <= n; k++) {
    const age = t - (t0 + k * JINGLE_NOTE), life = 0.85;
    if (age < 0 || age > life) continue;
    const u = age / life, wrong = ((k % 8) + 8) % 8 === WRONG_IN_BAR;
    const fade = (1 - u) * Math.min(1, age / 0.05);
    const dist = 0.25 + 2.6 * (1 - Math.pow(1 - u, 2));
    const sd = (k % 2 ? 1 : -1) * (0.35 + 1.1 * u);
    const ring: V3 = [from[0] + f[0] * dist + side[0] * sd, from[1] + f[1] * dist + 0.2 + 0.7 * u, from[2] + f[2] * dist + side[2] * sd];
    const r = (wrong ? 0.3 : 0.16) + (wrong ? 0.8 : 0.42) * u;
    out.push(<mesh key={"r" + k} position={ring} rotation={[0, yaw, 0]}>
      <torusGeometry args={[r, wrong ? 0.07 : 0.045, 8, 40]} />
      <meshBasicMaterial color={wrong ? "#fff0f6" : "#ff8ac0"} transparent opacity={0.7 * fade} toneMapped={false} depthWrite={false} />
    </mesh>);
    // a little musical note: head, stem, flag; flies up and out to one side
    const sx = (k % 2 ? 1 : -1) * (0.5 + 0.35 * ((k * 7) % 3)) * u, up = 0.4 + 1.3 * u;
    const np: V3 = [from[0] + f[0] * dist * 0.8 + side[0] * sx, from[1] + up, from[2] + f[2] * dist * 0.8 + side[2] * sx];
    const col = wrong ? "#ffffff" : NOTE_COLS[k % NOTE_COLS.length], s = (wrong ? 1.4 : 1) * (0.8 + 0.3 * Math.sin(u * 3));
    const mm = <meshBasicMaterial color={col} transparent opacity={fade} toneMapped={false} depthWrite={false} />;
    out.push(<group key={"n" + k} position={np} rotation={[0, yaw, 0.25 * Math.sin(k + u * 4)]} scale={s}>
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0.4]} scale={[1.3, 1, 0.4]}><sphereGeometry args={[0.13, 12, 8]} />{mm}</mesh>
      <mesh position={[0.15, 0.3, 0]}><boxGeometry args={[0.04, 0.6, 0.04]} />{mm}</mesh>
      <mesh position={[0.26, 0.52, 0]} rotation={[0, 0, -0.6]}><boxGeometry args={[0.24, 0.07, 0.04]} />{mm}</mesh>
    </group>);
  }
  return <group>{out}</group>;
};

// ---------------------------------------------------------------- s32-s34: the spare cone in front of ME
const SPARE: V3 = [-6.8, 3.8, 1.8];                     // where her left hand ends (the cone stands on it)
const MOM_REACH_YAW = Math.PI - 0.25;
const MOM_REACH: V3 = (() => { const p = K.standToReach(SPARE, MOM_REACH_YAW, 1, 1.5, 1, 0.12); return [p[0], 0, Math.max(p[2], BED.z1 + 0.85)]; })();
const REACH_FINAL = K.reachArm({ position: MOM_REACH, yaw: MOM_REACH_YAW, pose: { armR: 1.3, armROut: 0.06, lean: 0.12 } }, 1, SPARE);
const momReach = (t: number, tStep: number, tArm: number, t0: number) => {
  const from: V3 = [MOM_REACH[0] - 0.8 * Math.sin(MOM_REACH_YAW), 0, MOM_REACH[2] - 0.8 * Math.cos(MOM_REACH_YAW)];
  const w = M.walkPath([from, MOM_REACH], t, tStep, { gait: "stroll", speed: 3.2 });
  const base: Pose = M.mix(w.pose, M.idle(t, 5, 0.3), { armR: 1.3, armROut: 0.06, lean: 0.12 * M.ease(M.seg(t, tArm, tArm + 0.3)) }, jolt(t, t0, 0.3));
  const a0: M.Act = { position: w.position, yaw: w.yaw, walk: w.walk, pose: base };
  const r = REACH_FINAL;
  const k = M.ease(M.seg(t, tArm, tArm + 0.38));
  return { ...a0, pose: { ...base, armL: 1.15 * (1 - k) + (r.pose.armL ?? 0) * k, armLOut: 0.05 * (1 - k) + (r.pose.armLOut ?? 0) * k } };
};

// ================================================================= the shots
export const SHOTS_HOUSE: Shot[] = [
  // ---- s02: ME in pyjamas peeks between the curtains; the head snaps toward the sound (night, pink glow on the glass)
  (() => {
    const id = "s02_window", [a, b] = span(id);
    const yaw0 = Math.PI + 0.15;
    return mk(id, {
      scene: (t) => {
        const part = M.ease(M.seg(t, a + 0.05, a + 0.5)) * 0.7 + 0.12 * M.ease(M.seg(t, E.three, E.three + 0.3));
        const base: Pose = M.mix(M.idle(t, 2, 0.5), { armR: 0.15, lean: 0.05 },
          M.headSnap(t, E.three - 0.05, 0.85, -0.04), shiver(t, M.seg(t, E.am, E.am + 0.2)));
        const a0: M.Act = { position: WINDOW_SPOT, yaw: yaw0, pose: base };
        const r = K.reachArm(st(a0, KS), 1, [curtainEdge(part) - 0.1, 3.3, CURTAIN_Z + 0.25]);
        const me: M.Act = { ...a0, pose: { ...base, ...r.pose } };
        const expr: Expr = t < E.three - 0.05 ? "worried" : t < E.am ? "surprised" : "scared";
        const glow = 0.7 + 0.25 * notePulse(t, 0) ;
        return <Bedroom07 part={part} outside={glow} lamp={0.25}>
          <Night focus={[2, 0, -6]} />
          <Ch look={ME_PJ} scale={KS} a={me} t={t} expr={expr} blinkSeed={2} cs={bedroomCS(0)} />
        </Bedroom07>;
      },
      cam: mv(id, c([-9.3, 5.3, -1.2], [2.4, 3.0, -7.4], 40), c([-7.5, 5.0, -2.1], [2.4, 3.1, -7.4], 37)),
      dom: grade,
    });
  })(),

  // ---- s03: morning kitchen, ME's POV: Mom drops the free-cone flyer in the bin at her side, then wags a finger at us
  (() => {
    const id = "s03_kitchen", [a] = span(id);
    const camP: V3 = [-2.6, 4.2, 8.6];
    const yaw = M.yawTo(KITCHEN_MOM, camP);
    const tRel = E.mom2 + 0.12;
    const over: V3 = [BIN.p[0] - 0.15, BIN.top + 0.85, BIN.p[2]];
    const drop = K.reachArm({ position: KITCHEN_MOM, yaw, pose: { twist: 0.15, head: [0.8, 0.25] } }, 1, over);
    return mk(id, {
      scene: (t) => {
        // she looks down at the bin, arm out over it, lets go; head back to us; the right hand points and wags on "never take"
        const look = M.ease(M.seg(t, a - 0.3, a)) * (1 - M.ease(M.seg(t, tRel + 0.15, tRel + 0.4)));
        const kIn = M.ease(M.seg(t, a - 0.5, a)), kL = kIn * (1 - M.ease(M.seg(t, tRel + 0.16, tRel + 0.4))), kO = kIn * (1 - M.ease(M.seg(t, tRel + 0.08, tRel + 0.3)));
        const wag = M.clamp01(M.seg(t, E.never, E.never + 0.1)) * (1 - M.seg(t, PE(2) - 0.1, PE(2) + 0.1));
        const pose: Pose = M.mix(M.idle(t, 4, 0.5),
          { head: [0.8 * look, 0.25 * look], twist: 0.15 * look },
          { armL: 0.05 + ((drop.pose.armL ?? 0) - 0.05) * kL + 0.45 * Math.sin(Math.PI * M.seg(t, tRel, tRel + 0.4)), armLOut: (drop.pose.armLOut ?? 0) * kO },
          M.point(t, E.never - 0.12, PE(2) + 0.3, 0.3), { armROut: 0.22 * Math.sin((t - E.never) * Math.PI * 2 * 3.2) * wag, lean: 0.05 * wag },
          M.headShake(t, E.take, E.take + 0.5, 3));
        const mom: M.Act = { position: KITCHEN_MOM, yaw, pose };
        const expr: Expr = t < tRel + 0.2 ? "smile" : t < E.never - 0.02 ? "worried" : M.talk(t, words(2, "never"), "worried", "talk");
        // the flyer: pinched in the left hand, then it drops into the bin with a tumble
        const hand = K.handEnd(st(mom), 1);
        const relH = K.handEnd(st({ position: KITCHEN_MOM, yaw, pose: { twist: 0.15, head: [0.8, 0.25], ...drop.pose } }), 1);
        const fu = M.seg(t, tRel, tRel + 0.3), fall = fu * fu;
        const fp: V3 = t < tRel ? [hand[0], hand[1] - 1.0, hand[2]] : [relH[0], lerp(relH[1] - 1.0, 1.2, fall), relH[2]];
        const lid = M.ease(M.seg(t, tRel - 0.35, tRel - 0.1)) * (1 - M.ease(M.seg(t, tRel + 0.45, tRel + 0.7)));
        return <Kitchen07 lid={lid}>
          <BlockLights time="interior" focus={[2, 0, -2]} />
          {fu < 1 && <group position={fp} rotation={[0.2 + 2.2 * fall, yaw + 1.2 + 0.4 * fall, 0.3 * fall]}><Flyer /></group>}
          <Ch look={MOM} a={mom} t={t} expr={expr} blinkSeed={5} cs={kitchenCS()} />
        </Kitchen07>;
      },
      cam: mv(id, c(camP, [2.8, 3.2, -2.6], 40), c([-1.9, 4.2, 8.6], [2.6, 3.4, -2.8], 38)),
    });
  })(),

  // ---- s22: the dark upstairs hallway, nobody; the camera drifts toward ME's door; the stairwell glows on the notes
  mk("s22_hall", {
    scene: (t) => {
      const [a, b] = span("s22_hall");
      const stair = 0.35 + 0.35 * M.seg(t, a, b) + 0.25 * flick(t);
      return <Bedroom07 open={0} stair={stair} outside={0.7} lamp={0}>
        <Night focus={[22, 0, 0]} fill={0.7} />
      </Bedroom07>;
    },
    cam: mv("s22_hall", c([37, 5.4, 1.2], [10, 4.0, -0.2], 44), c([31, 5.0, 0.6], [10, 4.2, 0], 40), 0.01),
    dom: grade,
  }),

  // ---- s23: ME in bed pulls the blanket up to the chin, eyes on the door
  mk("s23_bed", {
    scene: (t) => {
      const up = 0.15 + 0.85 * M.ease(M.seg(t, E.getting + 0.02, E.getting + 0.42));
      const pose: Pose = M.mix({ armL: 0.7 + 0.5 * up, armR: 0.7 + 0.5 * up, armLOut: -0.2 * up, armROut: -0.2 * up, head: [0, -0.04] }, shiver(t, up));
      const me = bedAct(BED_SIT.start, t, pose);
      const expr: Expr = t < E.closer ? "worried" : "scared";
      return <Bedroom07 open={0} outside={0.6} stair={0.6} lamp={0.3}>
        <Night focus={[-6, 0, 0]} />
        <Blanket hipX={BED_SIT.start} z={BED_SIT.z} up={up} chinY={chinY} />
        <Ch look={ME_PJ} scale={KS} a={me} t={t} expr={expr} blinkSeed={3} cs={bedroomCS(0)} allow={BED_ALLOW} noFeet />
      </Bedroom07>;
    },
    cam: mv("s23_bed", c([3.4, 6.3, -7.4], [-6.4, 3.0, 0.4], 38), c([2.4, 6.0, -6.9], [-6.4, 3.2, 0.4], 36)),
    dom: grade,
  }),

  // ---- s24: the door swings open: Mom in the doorway, a cone in each hand, backlit from the hall
  mk("s24_door", {
    scene: (t) => {
      const open = M.ease(M.seg(t, E.opened13, E.opened13 + 0.55));
      const csDoor = open > 0.95 || open < 0.05 ? bedroomCS(open) : bedroomCS(open).filter((x) => x.name !== "door");
      const mom: M.Act = { position: DOORWAY_OUT, yaw: -Math.PI / 2, pose: M.mix(M.idle(t, 6, 0.5), coneArms(), { tilt: 0.12 * M.ease(M.seg(t, E.bedroom, E.door13 + 0.3)) }) };
      const glow = 0.45 + 0.35 * notePulse(t, JINGLE_NEAR);
      return <Bedroom07 open={open} hall={open} stair={0.8} outside={0.5} lamp={0.3}>
        <Night focus={[8, 0, 0]} />
        <Ch look={MOM} a={mom} t={t} expr={t < E.door13 ? "smile" : "creepy"} hold={cones(glow)} blinkSeed={6} cs={csDoor} />
      </Bedroom07>;
    },
    cam: mv("s24_door", c([-8.4, 5.6, 5.6], [12, 4.0, -0.2], 31), c([-7.0, 5.5, 5.0], [12, 4.1, -0.2], 29)),
    dom: grade,
  }),

  // ---- s25: the two cones close, glowing faintly (Mom in the doorway behind them)
  mk("s25_cones", {
    scene: (t) => {
      const mom: M.Act = { position: DOORWAY_OUT, yaw: -Math.PI / 2, pose: M.mix(M.idle(t, 6, 0.4), coneArms(), { tilt: 0.12, armL: 0.04 * notePulse(t, JINGLE_NEAR), armR: 0.04 * notePulse(t, JINGLE_NEAR) }) };
      const glow = 0.6 + 0.4 * notePulse(t, JINGLE_NEAR);
      return <Bedroom07 open={1} hall={1} stair={0.8} outside={0.5} lamp={0.3}>
        <Night focus={[11, 0, 0]} />
        <Ch look={MOM} a={mom} t={t} expr="creepy" hold={cones(glow)} blinkSeed={6} cs={bedroomCS(1)} />
      </Bedroom07>;
    },
    cam: mv("s25_cones", c([-0.6, 4.4, 3.4], [12.2, 3.9, 0], 34), c([0.6, 4.4, 3.1], [12.2, 4.0, 0], 33)),
    dom: grade,
  }),

  // ---- s26: ME backs away across the bed (two scoots, hands pushing back, a recoil)
  mk("s26_backs", {
    scene: (t) => {
      const t0 = E.backed - 0.05;
      const s1 = M.ease(M.seg(t, t0, t0 + 0.2)), s2 = M.ease(M.seg(t, t0 + 0.24, t0 + 0.46));
      const x = lerp(BED_SIT.start, BED_SIT.back, 0.5 * s1 + 0.5 * s2);
      const hop = 0.12 * KS * (Math.sin(Math.PI * M.seg(t, t0, t0 + 0.2)) + Math.sin(Math.PI * M.seg(t, t0 + 0.24, t0 + 0.46)));
      const push = M.env(t, t0 - 0.05, t0 + 0.5, 0.08, 0.15);
      const pose: Pose = M.mix({ armL: -0.35 * push + 1.6 * (1 - push) * M.seg(t, t0 + 0.4, t0 + 0.6), armR: -0.35 * push + 1.6 * (1 - push) * M.seg(t, t0 + 0.4, t0 + 0.6), armLOut: 0.15 * push, armROut: 0.15 * push },
        { lean: -0.04 * push }, M.recoil(t, E.away, Infinity), shiver(t, 0.6));
      const me = bedAct(x, t, pose);
      return <Bedroom07 open={1} hall={1} stair={0.8} outside={0.5} lamp={0.3}>
        <Night focus={[-6, 0, 0]} />
        <Blanket hipX={x} z={BED_SIT.z} up={0.15} chinY={chinY} />
        <Ch look={ME_PJ} scale={KS} a={me} t={t} lift={hop} expr="scared" blinkSeed={3} cs={bedroomCS(1)} allow={BED_ALLOW} noFeet />
      </Bedroom07>;
    },
    cam: mv("s26_backs", c([2.3, 6.2, 8.6], [-7.4, 2.9, 0.5], 38), c([1.4, 6.0, 8.0], [-7.6, 3.0, 0.5], 36)),
    dom: grade,
  }),

  // ---- s27: Mom steps in slowly; the music comes from her (bob + chest glow on the notes, t0 = MOM_T0)
  mk("s27_stepsin", {
    scene: (t) => {
      const [a] = span("s27_stepsin");
      const w = M.walkPath([[12.6, 0, -0.2], MOM_IN], t, a, { gait: "stroll", speed: 3.4, yaw1: momYawIn, turnOut: 0.3 });
      const pose = M.mix(w.pose, coneArms(), { armLOut: 0.1, armROut: 0.1, tilt: 0.12 }, jolt(t, MOM_T0, 0.55));
      const mom: M.Act = { position: w.position, yaw: w.yaw, walk: w.walk, pose };
      const me = bedAct(BED_SIT.back, t, M.mix(M.recoil(t, -10), shiver(t, 1)));
      const glow = 0.6 + 0.4 * notePulse(t, MOM_T0);
      const cs = bedroomCS(1);
      return <Bedroom07 open={1} hall={1} stair={0.8} outside={0.5} lamp={0.3}>
        <Night focus={[2, 0, 0]} />
        <ChestGlow at={w.position} t={t} t0={MOM_T0} base={3} k={18} />
        <Blanket hipX={BED_SIT.back} z={BED_SIT.z} up={0.15} chinY={chinY} />
        <Ch look={MOM} a={mom} t={t} expr="creepy" hold={cones(glow)} blinkSeed={6} cs={cs} others={[st(me, KS)]} />
        <Ch look={ME_PJ} scale={KS} a={me} t={t} expr="scared" blinkSeed={3} cs={cs} allow={BED_ALLOW} noFeet others={[st(mom)]} />
      </Bedroom07>;
    },
    cam: mv("s27_stepsin", c([-6.2, 6.6, 7.4], [5.5, 3.6, 0.6], 42), c([-5.6, 6.4, 6.8], [6.5, 3.6, 0.8], 40)),
    dom: grade,
  }),

  // ---- s28: the song stops dead on "Then": silence; Mom's smile, her head tilts (still, breathing only)
  mk("s28_tilt", {
    scene: (t) => {
      const [a, b] = span("s28_tilt");
      const tilt = 0.12 + 0.32 * M.ease(M.seg(t, a + 0.02, b));
      const mom: M.Act = { position: MOM_IN, yaw: momYawIn, pose: M.mix(M.idle(t, 6, 0.2), coneArms(), { tilt, head: [0.05, -0.05] }, { lean: 0.012 * Math.sin(t * 2.6), head: [0, 0.01 * Math.sin(t * 2.6)] }) };
      return <Bedroom07 open={1} hall={1} stair={0.8} outside={0.5} lamp={0.3}>
        <Night focus={[6, 0, 1]} />
        <ChestGlow at={MOM_IN} t={t} t0={1e9} base={3} k={0} />
        <Ch look={MOM} a={mom} t={t} expr="creepy" blink={0} hold={cones(0.55)} blinkSeed={6} cs={bedroomCS(1)} />
      </Bedroom07>;
    },
    cam: mv("s28_tilt", c([-4.2, 4.9, 1.6], [8.4, 3.7, 0.5], 38), c([-2.6, 4.8, 1.45], [8.4, 3.8, 0.5], 37), 0.003),
    dom: grade,
  }),

  // ---- s29: the slow push continues to medium-close; her mouth opens WIDE on "opened" and holds (silence)
  mk("s29_mouth", {
    scene: (t) => {
      const op = M.ease(M.seg(t, E.opened16, E.opened16 + 0.25));
      const mom: M.Act = { position: MOM_IN, yaw: momYawIn, pose: M.mix(M.idle(t, 6, 0.15), lowArms(1), { tilt: 0.44 - 0.14 * op, head: [0.05, -0.16 * op], lean: -0.03 * op }, { lean: 0.01 * Math.sin(t * 2.6) }) };
      const expr: Expr = t < E.opened16 ? "creepy" : "stare";
      return <Bedroom07 open={1} hall={1} stair={0.8} outside={0.5} lamp={0.3}>
        <Night focus={[7, 0, 1]} />
        <ChestGlow at={MOM_IN} t={t} t0={1e9} base={3} k={0} />
        <Ch look={MOM} a={mom} t={t} expr={expr} blink={0} hold={cones(0.55)} blinkSeed={6} cs={bedroomCS(1)} />
        <GapeMouth who={st(mom)} open={op} />
      </Bedroom07>;
    },
    cam: mv("s29_mouth", c([-0.4, 4.75, 1.35], [8.4, 3.95, 0.5], 33), c([1.6, 4.65, 1.15], [8.4, 4.0, 0.5], 33), 0.003),
    dom: grade,
  }),

  // ---- s30: THE TWIST: the whole jingle blasts out of her; she jolts on every note, hardest on the wrong note; pink pulses
  mk("s30_jingle", {
    scene: (t) => {
      const mom: M.Act = { position: MOM_IN, yaw: momYawIn, pose: M.mix({ ...jolt(t, BLAST_T0, 1.6), armL: 0, armR: 0 }, lowArms(1), { armL: -0.55, armR: -0.55, tilt: 0.3, head: [0.05, -0.16] }) };
      const p = pulseSum(t, BLAST_T0);
      return <Bedroom07 open={1} hall={0.6} stair={1} outside={0.4} lamp={0.15}>
        <Night focus={[7, 0, 1]} fill={0.75} />
        {/* the pink light from her SIDE (her right, -z), pulsing on every note, plus a faint glow at the mouth */}
        <pointLight position={[MOM_IN[0] - 0.6, 5.0, MOM_IN[2] - 3.4]} intensity={22 + 70 * p} distance={12} decay={1.6} color="#ff6aa8" />
        <pointLight position={[MOUTH[0] - 0.6, MOUTH[1], MOUTH[2]]} intensity={2 + 6 * p} distance={4} decay={2} color="#ffc0dc" />
        <SongBurst t={t} t0={BLAST_T0} from={MOUTH} toward={[1.5, 4.6, 2.2]} />
        <Ch look={MOM} a={mom} t={t} expr="stare" blink={0} hold={cones(0.8 + 0.6 * p)} blinkSeed={6} cs={bedroomCS(1)} />
        <GapeMouth who={st(mom)} open={1 + 0.12 * p} glow={0.35 + 0.65 * Math.min(1, p)} />
      </Bedroom07>;
    },
    cam: (t) => {
      const base = mv("s30_jingle", c([1.8, 4.5, 2.4], [8.4, 3.95, 0.5], 36), c([2.6, 4.45, 2.15], [8.4, 4.0, 0.5], 36))(t);
      const k = 0.06 * pulseSum(t, BLAST_T0);
      return { ...base, pos: [base.pos[0], base.pos[1] + k, base.pos[2] + k * 0.5], roll: 0.012 * pulseSum(t, BLAST_T0) * (Math.floor((t - BLAST_T0) / 0.19) % 2 ? 1 : -1) } as CamS;
    },
    dom: grade,
  }),

  // ---- s31: ME pressed back against the headboard and wall, hands up, the pink pulses washing over him
  mk("s31_cower", {
    scene: (t) => {
      const me = bedAct(BED_SIT.back, t, M.mix(M.cower(t, E.bells - 0.1), { lean: -0.02 }, shiver(t, 1.4)));
      return <Bedroom07 open={1} hall={1} stair={1} outside={0.6} lamp={0.3}>
        <Night focus={[-6, 0, 0]} />
        <pointLight position={[-2.5, 4.2, 2.5]} intensity={6 + 40 * pulseSum(t, BLAST_T0)} distance={14} decay={1.6} color="#ff7ab0" />
        <Blanket hipX={BED_SIT.back} z={BED_SIT.z} up={0.15} chinY={chinY} />
        <Ch look={ME_PJ} scale={KS} a={me} t={t} expr="scared" blinkSeed={3} cs={bedroomCS(1)} allow={BED_ALLOW} noFeet />
      </Bedroom07>;
    },
    cam: mv("s31_cower", c([1.5, 6.3, 7.4], [-8.2, 3.0, 0.5], 40), c([0.6, 6.1, 6.8], [-8.3, 3.1, 0.5], 38)),
    dom: grade,
  }),

  // ---- s32: Mom steps to the bed and holds the spare cone out toward ME (left hand, reachArm to a point in front of him)
  mk("s32_offer", {
    scene: (t) => {
      const [a] = span("s32_offer");
      const mom = momReach(t, a, E.held18 + 0.05, BLAST_T0);
      const me = bedAct(BED_SIT.back, t, M.mix(M.cower(t, -10, E.held18 + 0.1), shiver(t, 1)));
      const cs = bedroomCS(1);
      return <Bedroom07 open={1} hall={1} stair={1} outside={0.6} lamp={0.3}>
        <Night focus={[-6, 0, 2]} />
        <ChestGlow at={mom.position} t={t} t0={BLAST_T0} base={4} k={16} />
        <Blanket hipX={BED_SIT.back} z={BED_SIT.z} up={0.15} chinY={chinY} />
        <Ch look={MOM} a={mom} t={t} expr="creepy" hold={{ R: <Cone glow={0.6} />, L: <Cone glow={0.6 + 0.5 * notePulse(t, BLAST_T0)} /> }} blinkSeed={6} cs={cs} others={[st(me, KS)]} />
        <Ch look={ME_PJ} scale={KS} a={me} t={t} expr="scared" blinkSeed={3} cs={cs} allow={BED_ALLOW} noFeet others={[st(mom)]} />
      </Bedroom07>;
    },
    cam: mv("s32_offer", c([-3.6, 7.4, -6.8], [-5.9, 3.5, 3.0], 42), c([-3.9, 7.1, -6.2], [-6.0, 3.6, 3.0], 40)),
    dom: grade,
  }),

  // ---- s33: the cone in front of ME, close: it glows and hums (upper 60% of the frame), his face behind it
  mk("s33_spare", {
    scene: (t) => {
      const mom = momReach(t, -10, -10, BLAST_T0);
      const me = bedAct(BED_SIT.back, t, M.mix({ armL: 0.25, armR: 0.2, armROut: -0.04 }, shiver(t, 1), { head: [-0.25, -0.12] }));
      const cs = bedroomCS(1);
      const hum = notePulse(t, BLAST_T0);
      return <Bedroom07 open={1} hall={1} stair={1} outside={0.6} lamp={0.3}>
        <Night focus={[-7, 0, 1]} />
        <pointLight position={[SPARE[0], SPARE[1] + 1.8, SPARE[2] + 0.4]} intensity={4 + 10 * hum} distance={6} decay={2} color="#ff9ac8" />
        <Blanket hipX={BED_SIT.back} z={BED_SIT.z} up={0.15} chinY={chinY} />
        <Ch look={MOM} a={mom} t={t} expr="creepy" hold={{ R: <Cone glow={0.6} />, L: <Cone glow={0.9 + 0.8 * hum} /> }} blinkSeed={6} cs={cs} others={[st(me, KS)]} />
        <Ch look={ME_PJ} scale={KS} a={me} t={t} expr="scared" blinkSeed={3} cs={cs} allow={BED_ALLOW} noFeet others={[st(mom)]} />
      </Bedroom07>;
    },
    cam: (t) => {
      const base = mv("s33_spare", c([-2.4, 5.2, -3.6], [-7.4, 4.6, 1.2], 44), c([-2.9, 5.1, -3.2], [-7.4, 4.6, 1.2], 41))(t);
      const h = 0.015 * notePulse(t, BLAST_T0);
      return { ...base, pos: [base.pos[0] + h, base.pos[1], base.pos[2]] };
    },
    dom: grade,
  }),

  // ---- s34: ME's face, slow push, eyes on the cone (scared, then the stare)
  mk("s34_meface", {
    scene: (t) => {
      const mom = momReach(t, -10, -10, BLAST_T0);
      const me = bedAct(BED_SIT.back, t, M.mix({ armL: 0.25, armR: 0.2, armROut: -0.04, head: [-0.3, -0.12] }, shiver(t, lerp(1, 0.3, M.seg(t, E.supposed, E.supposed + 0.3)))));
      const cs = bedroomCS(1);
      const hum = notePulse(t, BLAST_T0);
      const expr: Expr = t < E.supposed ? "scared" : "stare";
      return <Bedroom07 open={1} hall={1} stair={1} outside={0.6} lamp={0.3}>
        <Night focus={[-8, 0, 0]} />
        <pointLight position={[SPARE[0], SPARE[1] + 1.8, SPARE[2] + 0.2]} intensity={5 + 8 * hum} distance={6} decay={2} color="#ff9ac8" />
        <Blanket hipX={BED_SIT.back} z={BED_SIT.z} up={0.15} chinY={chinY} />
        <Ch look={MOM} a={mom} t={t} expr="creepy" hold={{ R: <Cone glow={0.6} />, L: <Cone glow={0.9 + 0.6 * hum} /> }} blinkSeed={6} cs={cs} others={[st(me, KS)]} />
        <Ch look={ME_PJ} scale={KS} a={me} t={t} expr={expr} blink={expr === "stare" ? 0 : undefined} blinkSeed={3} cs={cs} allow={BED_ALLOW} noFeet others={[st(mom)]} />
      </Bedroom07>;
    },
    cam: mv("s34_meface", c([-3.4, 3.8, -1.4], [-8.5, 4.0, 0.5], 38), c([-4.3, 3.9, -0.9], [-8.5, 4.1, 0.5], 35)),
    dom: grade,
  }),
];
void meHead; void P; void blinkOn;

// The SET for the blocky-style test (notes/blocky_test/CONTRACT.md, section SET).
// MapleStreet: a row of IDENTICAL two-storey toy houses (same colour, door, porch, mailbox), lawns, white picket fences,
// sidewalk, road with lane marks, bare trees, street lamps (glow at dusk/night). FrontDoorInterior: a cosy night hallway
// looking at the front door from inside, with a peephole; `knock` 0..1 shakes the door.
//
// Units: 1 unit = 1 rig unit (the BlockChar is 5 units tall). Houses face +z (toward the street).
//   house body z -5..5, porch floor top y=0.6 at z 5..8.5, lawn to z 15, fence z 15, sidewalk z 15.5..19, road z 19..31
//   (centre line z 25), far sidewalk z 31..34. Doors are 7 units tall.
// Lights: MapleStreet adds no real lights (BlockLights does that); lamps and windows glow with emissive materials and
// additive glow pools. FrontDoorInterior adds one warm point light (the table lamp) plus a dim fill.
import React, { useMemo } from "react";
import * as THREE from "three";

type Time = "day" | "dusk" | "night";
type V3 = [number, number, number];

export const HOUSE_X: number[] = [-66, -44, -22, 0, 22, 44, 66];
/** Standing spot on the porch of the middle house (HOUSE_X[3]), just in front of the door, feet on the porch floor. */
export const PORCH: V3 = [0, 0.6, 6.6];
/** Handy street constants (z of lawn spot, sidewalk centre, road centre) for placing families and cameras. */
export const STREET = { lawnZ: 11, fenceZ: 15, sidewalkZ: 17.2, roadZ: 25, farSidewalkZ: 32.5, doorH: 7 };

// ---- palette (plastic toy) ----
const C = {
  wall: "#f7dc98", trim: "#ffffff", roof: "#d6504a", door: "#2f6fc0", knob: "#f2c14e", porch: "#e9e2d0",
  lawn: "#6cc04a", lawn2: "#5fb13f", path: "#cfcac0", sidewalk: "#d9d6cf", curb: "#bdb9b0", road: "#4a4d55",
  lane: "#f7d046", fence: "#ffffff", mailbox: "#3b4f8a", flag: "#e2443b", trunk: "#7a5236", pole: "#3d4148",
  chimney: "#b5503e", glassDay: "#9fd4f2",
};

const plastic = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0, ...extra });

const glowTexture = (() => {
  let tex: THREE.CanvasTexture | null = null;
  return () => {
    if (tex) return tex;
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,0.45)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };
})();

/** One InstancedMesh for many copies of a box/cylinder (pickets, lane marks, branches). */
const Inst: React.FC<{ geo: THREE.BufferGeometry; mat: THREE.Material; items: { p: V3; r?: V3; s?: V3 }[]; shadow?: boolean }> = ({ geo, mat, items, shadow = true }) => {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mat, items.length);
    const o = new THREE.Object3D();
    items.forEach((it, i) => {
      o.position.set(...it.p); o.rotation.set(...(it.r ?? [0, 0, 0])); o.scale.set(...(it.s ?? [1, 1, 1]));
      o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true; m.castShadow = shadow; m.receiveShadow = true;
    m.computeBoundingSphere();
    return m;
  }, [geo, mat, items, shadow]);
  return <primitive object={mesh} />;
};

const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 14);
const roofGeo = (() => {
  const s = new THREE.Shape(); s.moveTo(-6, 0); s.lineTo(6, 0); s.lineTo(0, 5.2); s.lineTo(-6, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 17.4, bevelEnabled: false });
  g.translate(0, 0, -8.7); g.rotateY(Math.PI / 2);
  return g;
})();
// picket: a thin box with a pointed top (box + rotated box looks toy-like enough)
const picketGeo = (() => {
  const s = new THREE.Shape(); s.moveTo(-0.22, 0); s.lineTo(0.22, 0); s.lineTo(0.22, 2.1); s.lineTo(0, 2.45); s.lineTo(-0.22, 2.1); s.lineTo(-0.22, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false }); g.translate(0, 0, -0.08);
  return g;
})();

type Mats = ReturnType<typeof useStreetMats>;
const useStreetMats = (time: Time) =>
  useMemo(() => {
    const lit = time !== "day";
    const winGlow = time === "night" ? 1.6 : time === "dusk" ? 0.9 : 0;
    return {
      wall: plastic(C.wall), trim: plastic(C.trim), roof: plastic(C.roof), door: plastic(C.door), knob: plastic(C.knob, { metalness: 0.3, roughness: 0.3 }),
      porch: plastic(C.porch), lawn: plastic(C.lawn, { roughness: 0.8 }), lawn2: plastic(C.lawn2, { roughness: 0.8 }), path: plastic(C.path),
      sidewalk: plastic(C.sidewalk, { roughness: 0.7 }), curb: plastic(C.curb), road: plastic(C.road, { roughness: 0.75 }),
      lane: plastic(C.lane), fence: plastic(C.fence), mailbox: plastic(C.mailbox), flag: plastic(C.flag), trunk: plastic(C.trunk, { roughness: 0.7 }),
      pole: plastic(C.pole, { roughness: 0.5 }), chimney: plastic(C.chimney),
      glass: lit
        ? plastic("#ffd98a", { emissive: new THREE.Color("#ffc86a"), emissiveIntensity: winGlow, roughness: 0.2 })
        : plastic(C.glassDay, { roughness: 0.15, metalness: 0.1 }),
      bulb: lit ? plastic("#fff2c4", { emissive: new THREE.Color("#ffd27a"), emissiveIntensity: 2.4 }) : plastic("#f4f1e6", { roughness: 0.2 }),
      porchBulb: lit ? plastic("#fff2c4", { emissive: new THREE.Color("#ffcf73"), emissiveIntensity: 2 }) : plastic("#f4f1e6", { roughness: 0.2 }),
      pool: new THREE.MeshBasicMaterial({ map: glowTexture(), color: "#ffcf7a", transparent: true, opacity: time === "night" ? 0.55 : 0.3,
        blending: THREE.AdditiveBlending, depthWrite: false }),
      halo: new THREE.MeshBasicMaterial({ map: glowTexture(), color: "#ffdc94", transparent: true, opacity: time === "night" ? 0.85 : 0.5,
        blending: THREE.AdditiveBlending, depthWrite: false }),
      lit,
    };
  }, [time]);

const M: React.FC<{ m: THREE.Material; p: V3; s: V3; r?: V3; g?: THREE.BufferGeometry; shadow?: boolean }> = ({ m, p, s, r, g = box, shadow = true }) => (
  <mesh geometry={g} material={m} position={p} scale={s} rotation={r} castShadow={shadow} receiveShadow />
);

const Window: React.FC<{ mats: Mats; p: V3; w: number; h: number }> = ({ mats, p, w, h }) => (
  <group position={p}>
    <M m={mats.trim} p={[0, 0, 0]} s={[w + 0.5, h + 0.5, 0.25]} />
    <M m={mats.glass} p={[0, 0, 0.1]} s={[w, h, 0.12]} shadow={false} />
    <M m={mats.trim} p={[0, 0, 0.2]} s={[0.18, h, 0.08]} shadow={false} />
    <M m={mats.trim} p={[0, 0, 0.2]} s={[w, 0.18, 0.08]} shadow={false} />
    <M m={mats.trim} p={[0, -h / 2 - 0.3, 0.25]} s={[w + 0.9, 0.22, 0.5]} />
  </group>
);

/** One house, local origin at the ground centre of the house, front wall at z=+5. */
const House: React.FC<{ mats: Mats; x: number }> = ({ mats, x }) => (
  <group position={[x, 0, 0]}>
    {/* body + roof + chimney */}
    <M m={mats.wall} p={[0, 9, 0]} s={[16, 18, 10]} />
    <M m={mats.trim} p={[0, 9.1, 5.02]} s={[16.2, 0.35, 0.3]} />
    <M m={mats.trim} p={[0, 18, 0]} s={[16.6, 0.5, 10.6]} />
    <mesh geometry={roofGeo} material={mats.roof} position={[0, 18.2, 0]} castShadow receiveShadow />
    <M m={mats.chimney} p={[5, 21.5, -1.5]} s={[1.6, 4.5, 1.6]} />
    {/* front door with frame and knob (door 3.4 x 7, bottom on the porch floor y=0.6) */}
    <M m={mats.trim} p={[0, 4.35, 5.05]} s={[4.3, 7.6, 0.3]} />
    <M m={mats.door} p={[0, 4.1, 5.2]} s={[3.4, 7, 0.2]} />
    <M m={mats.trim} p={[0, 5.6, 5.32]} s={[2.0, 2.2, 0.05]} shadow={false} />
    <M m={mats.door} p={[0, 5.6, 5.35]} s={[1.6, 1.8, 0.05]} shadow={false} />
    <M m={mats.knob} p={[1.2, 4.0, 5.38]} s={[0.35, 0.35, 0.25]} />
    <M m={mats.porchBulb} p={[-2.7, 6.6, 5.25]} s={[0.5, 0.8, 0.4]} shadow={false} />
    {mats.lit && (
      <>
        <mesh material={mats.halo} position={[-2.7, 6.6, 5.5]}><planeGeometry args={[3.2, 3.2]} /></mesh>
        <mesh material={mats.pool} position={[-0.5, 0.62, 6.8]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[9, 7]} /></mesh>
        <mesh material={mats.pool} position={[-1.2, 4.2, 5.46]}><planeGeometry args={[9, 9]} /></mesh>
      </>
    )}
    {/* windows: two downstairs, three upstairs */}
    <Window mats={mats} p={[-5, 4.6, 5.05]} w={3.2} h={3.6} />
    <Window mats={mats} p={[5, 4.6, 5.05]} w={3.2} h={3.6} />
    {[-5, 0, 5].map((wx) => <Window key={wx} mats={mats} p={[wx, 13.3, 5.05]} w={2.8} h={3.4} />)}
    {/* porch: floor, step, posts, little roof */}
    <M m={mats.porch} p={[0, 0.3, 6.75]} s={[9, 0.6, 3.5]} />
    <M m={mats.porch} p={[0, 0.15, 8.9]} s={[4, 0.3, 1]} />
    {[-4, 4].map((px) => <M key={px} m={mats.trim} p={[px, 4.3, 8.1]} s={[0.5, 7.4, 0.5]} />)}
    <M m={mats.roof} p={[0, 8.15, 6.9]} s={[9.8, 0.45, 4.2]} />
    {/* path to the sidewalk */}
    <M m={mats.path} p={[0, 0.06, 12.1]} s={[2.6, 0.12, 6]} shadow={false} />
    {/* mailbox right of the path at the fence line */}
    <M m={mats.trunk} p={[2.6, 1.6, 15.6]} s={[0.3, 3.2, 0.3]} />
    <M m={mats.mailbox} p={[2.6, 3.5, 15.6]} s={[0.9, 0.9, 1.6]} />
    <mesh geometry={cyl} material={mats.mailbox} position={[2.6, 3.95, 15.6]} rotation={[Math.PI / 2, 0, 0]} scale={[0.9, 1.6, 0.9]} castShadow />
    <M m={mats.flag} p={[3.1, 4.1, 15.4]} s={[0.1, 1.0, 0.18]} shadow={false} />
    <M m={mats.flag} p={[3.1, 4.5, 15.65]} s={[0.1, 0.4, 0.5]} shadow={false} />
  </group>
);

const BareTree: React.FC<{ mats: Mats; p: V3; seed: number }> = ({ mats, p, seed }) => {
  const br = useMemo(() => {
    const out: { p: V3; r: V3; s: V3 }[] = [];
    for (let i = 0; i < 6; i++) {
      const a = seed * 1.7 + i * 2.1, h = 5 + (i % 3) * 1.6, tilt = 0.6 + (i % 2) * 0.25, len = 3.2 - (i % 3) * 0.5;
      const dx = Math.cos(a) * Math.sin(tilt) * len / 2, dz = Math.sin(a) * Math.sin(tilt) * len / 2, dy = Math.cos(tilt) * len / 2;
      out.push({ p: [dx, h + dy, dz], r: [Math.sin(a) * tilt, 0, -Math.cos(a) * tilt], s: [0.32, len, 0.32] });
    }
    return out;
  }, [seed]);
  return (
    <group position={p}>
      <M m={mats.trunk} g={cyl} p={[0, 3.5, 0]} s={[0.8, 7, 0.8]} />
      <M m={mats.trunk} g={cyl} p={[0, 8, 0]} s={[0.45, 2.5, 0.45]} />
      <Inst geo={cyl} mat={mats.trunk} items={br} />
    </group>
  );
};

const Lamp: React.FC<{ mats: Mats; p: V3 }> = ({ mats, p }) => (
  <group position={p}>
    <M m={mats.pole} g={cyl} p={[0, 0.3, 0]} s={[0.9, 0.6, 0.9]} />
    <M m={mats.pole} g={cyl} p={[0, 5.5, 0]} s={[0.35, 11, 0.35]} />
    <M m={mats.pole} p={[0, 10.9, 0.9]} s={[0.3, 0.3, 1.9]} />
    <M m={mats.pole} p={[0, 10.85, 1.9]} s={[1.3, 0.35, 1.3]} />
    <M m={mats.bulb} p={[0, 10.55, 1.9]} s={[1.0, 0.35, 1.0]} shadow={false} />
    {mats.lit && (
      <>
        <mesh material={mats.halo} position={[0, 10.4, 1.95]}><planeGeometry args={[4.5, 4.5]} /></mesh>
        <mesh material={mats.pool} position={[0, 0.17, 1.9]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[11, 11]} /></mesh>
      </>
    )}
  </group>
);

export const MapleStreet: React.FC<{ time: Time }> = ({ time }) => {
  const mats = useStreetMats(time);
  const x0 = HOUSE_X[0] - 14, x1 = HOUSE_X[HOUSE_X.length - 1] + 14, W = x1 - x0 + 60, cx = (x0 + x1) / 2;
  const pickets = useMemo(() => {
    const out: { p: V3 }[] = [];
    for (let x = x0 - 20; x <= x1 + 20; x += 0.9) {
      if (HOUSE_X.some((h) => Math.abs(x - h) < 1.6)) continue; // gate gap at each path
      out.push({ p: [x, 0, STREET.fenceZ] });
    }
    return out;
  }, [x0, x1]);
  const rails = useMemo(() => {
    const out: { p: V3; s: V3 }[] = [];
    const xs = [x0 - 20, ...HOUSE_X.flatMap((h) => [h - 1.6, h + 1.6]), x1 + 20];
    for (let i = 0; i < xs.length; i += 2) {
      const a = xs[i], b = xs[i + 1];
      for (const y of [0.7, 1.6]) out.push({ p: [(a + b) / 2, y, STREET.fenceZ - 0.15], s: [b - a, 0.22, 0.12] });
    }
    return out;
  }, [x0, x1]);
  const lanes = useMemo(() => {
    const out: { p: V3 }[] = [];
    for (let x = x0 - 40; x <= x1 + 40; x += 6) out.push({ p: [x, 0.13, STREET.roadZ] });
    return out;
  }, [x0, x1]);
  const gaps = HOUSE_X.slice(0, -1).map((h, i) => (h + HOUSE_X[i + 1]) / 2);
  const lampXs = [HOUSE_X[0] - 11, ...gaps, HOUSE_X[HOUSE_X.length - 1] + 11];
  return (
    <group>
      {/* ground: lawn strip, back yard, far side */}
      <M m={mats.lawn} p={[cx, -0.5, -10]} s={[W, 1, 60]} />
      <M m={mats.lawn2} p={[cx, -0.45, 10]} s={[W, 1, 10]} shadow={false} />
      {/* sidewalk + curb (near) */}
      <M m={mats.sidewalk} p={[cx, 0.1, STREET.sidewalkZ]} s={[W, 0.2, 3.6]} shadow={false} />
      <M m={mats.curb} p={[cx, 0.12, 19.1]} s={[W, 0.24, 0.4]} shadow={false} />
      {/* road + lane marks */}
      <M m={mats.road} p={[cx, 0.02, STREET.roadZ]} s={[W, 0.2, 11.6]} shadow={false} />
      <Inst geo={box} mat={mats.lane} items={lanes.map((l) => ({ ...l, s: [3, 0.04, 0.35] as V3 }))} shadow={false} />
      {/* far side: curb, sidewalk, lawn */}
      <M m={mats.curb} p={[cx, 0.12, 30.9]} s={[W, 0.24, 0.4]} shadow={false} />
      <M m={mats.sidewalk} p={[cx, 0.1, STREET.farSidewalkZ]} s={[W, 0.2, 3.0]} shadow={false} />
      <M m={mats.lawn} p={[cx, -0.5, 54]} s={[W, 1, 40]} shadow={false} />
      {/* the identical houses */}
      {HOUSE_X.map((x) => <House key={x} mats={mats} x={x} />)}
      {/* white picket fence */}
      <Inst geo={picketGeo} mat={mats.fence} items={pickets} />
      <Inst geo={box} mat={mats.fence} items={rails} />
      {/* bare trees on every other gap (front lawns), lamps along the sidewalk */}
      {gaps.filter((_, i) => i % 2 === 0).map((x, i) => <BareTree key={x} mats={mats} p={[x, 0, 11]} seed={i + 1} />)}
      {[HOUSE_X[0] - 12, HOUSE_X[HOUSE_X.length - 1] + 12].map((x, i) => <BareTree key={x} mats={mats} p={[x, 0, 9]} seed={i + 7} />)}
      {lampXs.map((x) => <Lamp key={x} mats={mats} p={[x, 0, 16.3]} />)}
    </group>
  );
};

// ---------------------------------------------------------------------------------------------------------------------
// Interior: the hallway behind the front door at night. Door in the wall at z=0 (facing +z, into the hall), door bottom
// y=0, 3.6 wide x 7.2 tall; peephole at (0, 5.3, 0.15). The hall runs from z=0 to z=16; the camera stands in the hall
// (e.g. pos [1.5, 4.2, 12], target [0, 4, 0]). Peephole close-up: pos [0, 5.3, 2.4], target [0, 5.3, 0].
export const INTERIOR = { door: [0, 3.6, 0] as V3, peephole: [0, 5.3, 0.15] as V3, floorY: 0 };

export const FrontDoorInterior: React.FC<{ knock: number }> = ({ knock }) => {
  const mats = useMemo(() => ({
    wall: plastic("#e7c9a1"), wainscot: plastic("#fbf3e4"), floor: plastic("#a8703f", { roughness: 0.55 }), ceiling: plastic("#f3e6d2"),
    door: plastic("#7a4a2a", { roughness: 0.5 }), panel: plastic("#6a3f22", { roughness: 0.5 }), trim: plastic("#fbf3e4"),
    brass: plastic("#e2b84a", { metalness: 0.5, roughness: 0.3 }), rug: plastic("#b9433d", { roughness: 0.9 }), rug2: plastic("#f0c75e", { roughness: 0.9 }),
    lens: plastic("#1a1a22", { roughness: 0.1, metalness: 0.4 }), hook: plastic("#3a3a40", { metalness: 0.4, roughness: 0.4 }),
    coatA: plastic("#3f6fb5"), coatB: plastic("#e0a03a"), coatC: plastic("#5c9e52"),
    table: plastic("#8a5a35"), shade: plastic("#fff0c8", { emissive: new THREE.Color("#ffc76e"), emissiveIntensity: 1.3 }),
    lampBase: plastic("#5c6f8f"), night: plastic("#1d2747", { emissive: new THREE.Color("#141c38"), emissiveIntensity: 0.6 }),
    halo: new THREE.MeshBasicMaterial({ map: glowTexture(), color: "#ffcf86", transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }),
  }), []);
  const k = Math.max(0, Math.min(1, knock));
  // knock: the door jumps toward the viewer and rattles; the hinge side (x=-1.8) stays put
  const shake = k * Math.sin(k * Math.PI * 6);
  return (
    <group>
      <ambientLight intensity={0.18} color="#8fa0d8" />
      <pointLight position={[4.6, 5.2, 4.5]} intensity={60} distance={30} decay={1.6} color="#ffbe6e" castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.002} />
      {/* floor, ceiling, walls */}
      <M m={mats.floor} p={[0, -0.25, 8]} s={[12, 0.5, 16]} />
      <M m={mats.ceiling} p={[0, 10.25, 8]} s={[12, 0.5, 16]} shadow={false} />
      {/* door wall in two parts around the opening (3.6 x 7.2) */}
      <M m={mats.wall} p={[-3.9, 5, -0.25]} s={[4.2, 10, 0.5]} />
      <M m={mats.wall} p={[3.9, 5, -0.25]} s={[4.2, 10, 0.5]} />
      <M m={mats.wall} p={[0, 8.6, -0.25]} s={[3.6, 2.8, 0.5]} />
      <M m={mats.night} p={[0, 3.6, -0.6]} s={[3.6, 7.2, 0.1]} shadow={false} />
      <M m={mats.wall} p={[-6, 5, 8]} s={[0.5, 10, 16]} />
      <M m={mats.wall} p={[6, 5, 8]} s={[0.5, 10, 16]} />
      {/* wainscot + skirting */}
      <M m={mats.wainscot} p={[-5.7, 1.6, 8]} s={[0.12, 3.2, 16]} />
      <M m={mats.wainscot} p={[5.7, 1.6, 8]} s={[0.12, 3.2, 16]} />
      <M m={mats.wainscot} p={[-3.9, 1.6, 0.05]} s={[4.2, 3.2, 0.12]} />
      <M m={mats.wainscot} p={[3.9, 1.6, 0.05]} s={[4.2, 3.2, 0.12]} />
      {/* door frame */}
      <M m={mats.trim} p={[-2.05, 3.7, 0.08]} s={[0.5, 7.6, 0.25]} />
      <M m={mats.trim} p={[2.05, 3.7, 0.08]} s={[0.5, 7.6, 0.25]} />
      <M m={mats.trim} p={[0, 7.45, 0.08]} s={[4.6, 0.5, 0.25]} />
      {/* the door: pivots at its hinge so a knock rattles it */}
      <group position={[-1.8, 0, 0]} rotation={[0, shake * 0.03, shake * 0.004]}>
        <group position={[1.8 + shake * 0.02, 0, 0.0 + k * 0.06]}>
          <M m={mats.door} p={[0, 3.6, 0]} s={[3.56, 7.16, 0.3]} />
          {[[-0.75, 5.3], [0.75, 5.3], [-0.75, 2.0], [0.75, 2.0]].map(([px, py]) => (
            <M key={`${px}${py}`} m={mats.panel} p={[px, py, 0.17]} s={[1.1, py > 3 ? 2.6 : 2.8, 0.06]} shadow={false} />
          ))}
          {/* peephole: brass ring + dark lens */}
          <mesh material={mats.brass} position={[0, 5.3, 0.2]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.1, 24]} /></mesh>
          <mesh material={mats.lens} position={[0, 5.3, 0.25]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.1, 0.1, 0.06, 20]} /></mesh>
          {/* knob, deadbolt */}
          <mesh material={mats.brass} position={[1.3, 3.5, 0.32]} castShadow><sphereGeometry args={[0.24, 20, 14]} /></mesh>
          <M m={mats.brass} p={[1.3, 4.3, 0.2]} s={[0.35, 0.35, 0.12]} />
        </group>
      </group>
      {/* rug */}
      <M m={mats.rug} p={[0, 0.03, 5]} s={[4.4, 0.06, 6]} shadow={false} />
      <M m={mats.rug2} p={[0, 0.07, 5]} s={[3.4, 0.04, 5]} shadow={false} />
      <M m={mats.rug} p={[0, 0.1, 5]} s={[2.6, 0.04, 4.2]} shadow={false} />
      {/* coat hooks on the left wall, with coats */}
      <M m={mats.trim} p={[-5.75, 6.4, 5]} s={[0.2, 0.6, 5]} />
      {[3.4, 5, 6.6].map((z, i) => (
        <group key={z}>
          <M m={mats.hook} p={[-5.5, 6.4, z]} s={[0.4, 0.15, 0.15]} />
          <M m={[mats.coatA, mats.coatB, mats.coatC][i]} p={[-5.35, 5.0 - (i % 2) * 0.3, z]} s={[0.5, 2.8, 1.2]} />
        </group>
      ))}
      {/* side table + lamp on the right */}
      <M m={mats.table} p={[5, 2.6, 4.5]} s={[1.6, 0.25, 3]} />
      {[[4.4, 3.3], [5.6, 3.3], [4.4, 5.7], [5.6, 5.7]].map(([tx, tz]) => <M key={`${tx}${tz}`} m={mats.table} p={[tx, 1.25, tz]} s={[0.22, 2.5, 0.22]} />)}
      <mesh material={mats.lampBase} position={[5, 3.4, 4.5]} castShadow><cylinderGeometry args={[0.35, 0.5, 1.4, 18]} /></mesh>
      <mesh material={mats.shade} position={[5, 4.6, 4.5]}><cylinderGeometry args={[0.55, 0.9, 1.1, 22, 1, true]} /></mesh>
      <mesh material={mats.halo} position={[4.9, 4.6, 4.8]}><planeGeometry args={[4, 4]} /></mesh>
    </group>
  );
};

// LOOK for the blocky style (notes/short06/CONTRACT.md, role 3): lights, sky, a soft image-based ambient and a tiny grade.
// Aim: the soft, slightly overcast, bright "blocky game" daylight of the owner's sample (pale blue sky, white cumulus,
// gentle shadows, a faint haze on distant houses), deep-blue nights where faces still read, warm bright interiors.
//
// BlockLights time:  "day" | "morning" | "dusk" | "night" | "interior" | "interiorNight" | "bathroom"
//   lights: hemisphere + key (sun/moon directional, or a ceiling spot indoors, soft shadows) + a camera-following face fill
//   (no shadows) + an optional warm practical (porch lamp / ceiling lamp) = at most 3 lights + hemisphere.
//   It also sets scene.environment to a small procedural sky/room light probe (soft ambient + plastic sheen; not a light)
//   and a light distance haze for the street times.
// Sky time: any of the above (interiors show the matching sky through windows).
// Grade time: a very light DOM vignette for night / interiorNight only; renders nothing otherwise. Put it in a shot's dom().
// Units: rig units (a person is 5 tall); the sun's shadow camera covers ~70x70 units around `focus`.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { AbsoluteFill } from "remotion";

export type TimeOfDay = "day" | "morning" | "dusk" | "night" | "interior" | "interiorNight" | "bathroom";
type V3 = [number, number, number];

type LightSet = {
  hemiSky: string; hemiGround: string; hemi: number;
  /** key: a directional sun/moon outdoors, a soft ceiling spot indoors */
  key: "sun" | "spot"; keyColor: string; key_: number;
  /** sun: direction FROM the scene TO the sun; spot: offset of the lamp from `focus` */
  keyDir: V3;
  fill: number; fillColor: string;        // camera-following face fill
  env: number; envKind: "sky" | "room";   // light-probe strength
  envHorizon?: string;                    // room probe's wall colour (default white)
  angle?: number;                         // indoor spot cone (default 1.05)
  practical?: { color: string; intensity: number; pos: V3; distance: number };
  haze?: { color: string; near: number; far: number };
};

export const LIGHTS: Record<TimeOfDay, LightSet> = {
  // soft bright daylight: a high, slightly hazy sun (soft shadows), big sky fill, light haze on distant houses
  day: {
    hemiSky: "#d9ebff", hemiGround: "#a8a088", hemi: 1.0, key: "sun", keyColor: "#fff6e8", key_: 1.5, keyDir: [-0.45, 0.85, 0.55],
    fill: 0.25, fillColor: "#ffffff", env: 0.55, envKind: "sky", haze: { color: "#dce8f2", near: 70, far: 260 },
  },
  // early morning: lower, warmer sun from the other side, cooler sky, a touch more haze
  morning: {
    hemiSky: "#d4e2f5", hemiGround: "#a59a86", hemi: 1.0, key: "sun", keyColor: "#ffe6c4", key_: 1.5, keyDir: [0.6, 0.55, 0.6],
    fill: 0.3, fillColor: "#fff3e6", env: 0.5, envKind: "sky", haze: { color: "#e6e4e0", near: 50, far: 220 },
  },
  dusk: {
    hemiSky: "#c9a6d8", hemiGround: "#8a6a5a", hemi: 1.2, key: "sun", keyColor: "#ffaa66", key_: 2.0, keyDir: [-0.8, 0.28, 0.45],
    fill: 0.35, fillColor: "#ffe2cc", env: 0.4, envKind: "sky", haze: { color: "#c99aa8", near: 50, far: 220 },
  },
  // moonlit blue: blue key + strong blue sky fill + a clean face fill, so faces stay bright; optional warm porch practical
  night: {
    hemiSky: "#7d97d8", hemiGround: "#353a58", hemi: 1.25, key: "sun", keyColor: "#a9c0ff", key_: 1.1, keyDir: [0.4, 0.75, 0.5],
    fill: 0.75, fillColor: "#d6e0ff", env: 0.35, envKind: "sky", haze: { color: "#1c2c58", near: 45, far: 200 },
    practical: { color: "#ffc27a", intensity: 60, pos: [0, 6.5, 4], distance: 30 },
  },
  // warm lived-in room in daytime: a soft ceiling spot + bright window-ish fill, warm floor bounce
  interior: {
    hemiSky: "#fff4e4", hemiGround: "#b8946c", hemi: 1.1, key: "spot", keyColor: "#fff1dc", key_: 140, keyDir: [1.5, 10, 5],
    fill: 0.35, fillColor: "#fff8f0", env: 0.6, envKind: "room",
  },
  // the house at night: one warm lamp, blue night through the windows, face fill keeps faces bright
  interiorNight: {
    // clearly night: one warm ceiling-light pool, dim cool ambient, dark windows; a soft face fill keeps faces readable
    hemiSky: "#5a6fa8", hemiGround: "#2a2420", hemi: 0.25, key: "spot", keyColor: "#ffc98a", key_: 110, keyDir: [0.6, 9.2, 1.2], angle: 0.72,
    fill: 1.0, fillColor: "#eef0f6", env: 0.08, envKind: "room", envHorizon: "#1a2240",
  },
  // bathroom: clean cool-white vanity light from above the mirror, bright tiles
  bathroom: {
    hemiSky: "#f2f6ff", hemiGround: "#b9b4aa", hemi: 1.0, key: "spot", keyColor: "#f4f7ff", key_: 130, keyDir: [0, 9.5, 3],
    fill: 0.4, fillColor: "#ffffff", env: 0.6, envKind: "room",
  },
};

// ---------- the light probe (scene.environment): a tiny gradient sky or room, prefiltered once per renderer ----------
const envCache = new WeakMap<THREE.WebGLRenderer, Map<string, THREE.Texture>>();
const probeScene = (time: TimeOfDay) => {
  const L = LIGHTS[time], k = SKY[skyFor(time)];
  const scene = new THREE.Scene();
  const top = new THREE.Color(L.envKind === "room" ? L.hemiSky : k.top), hor = new THREE.Color(L.envKind === "room" ? (L.envHorizon ?? "#ffffff") : k.horizon);
  const gnd = new THREE.Color(L.hemiGround);
  const geo = new THREE.SphereGeometry(10, 32, 16), pos = geo.attributes.position, cols: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 10, c = y >= 0 ? hor.clone().lerp(top, Math.pow(y, 0.6)) : hor.clone().lerp(gnd, Math.min(1, -y * 4));
    cols.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  // a broad soft bright patch: the sun's side of an overcast sky, or a window/ceiling panel indoors
  const d = new THREE.Vector3(...L.keyDir).normalize();
  const panel = new THREE.Mesh(new THREE.CircleGeometry(L.envKind === "room" ? 4 : 3, 24),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(L.keyColor).multiplyScalar(L.envKind === "room" ? 2.2 : 1.6), side: THREE.DoubleSide }));
  panel.position.copy(d.multiplyScalar(8)); panel.lookAt(0, 0, 0); scene.add(panel);
  return scene;
};
const getEnv = (gl: THREE.WebGLRenderer, time: TimeOfDay) => {
  let m = envCache.get(gl); if (!m) envCache.set(gl, (m = new Map()));
  const hit = m.get(time); if (hit) return hit;
  const pm = new THREE.PMREMGenerator(gl);
  const t = pm.fromScene(probeScene(time), 0.04).texture; pm.dispose();
  m.set(time, t); return t;
};

export const BlockLights: React.FC<{
  time: TimeOfDay;
  /** where the warm practical sits (porch lamp, ceiling lamp); default [0,6.5,4] at night, 6.8 above focus indoors */
  practicalAt?: V3;
  /** add/remove the warm practical (default: on for night only; interiorNight's ceiling pool is the key spot) */
  practical?: boolean;
  /** centre of the shadow camera / what the indoor spot aims at (move it with the shot) */
  focus?: V3;
  /** scale the face fill (1 = default) */
  fill?: number;
  /** distance haze for street times (default on outdoors) */
  haze?: boolean;
  /** half-size of the sun's shadow camera (default 36: covers ~70x70 units). Smaller = crisper shadows. */
  shadowSpan?: number;
}> = ({ time, practicalAt, practical, focus = [0, 0, 0], fill = 1, haze, shadowSpan = 36 }) => {
  const L = LIGHTS[time];
  const { gl, scene } = useThree();
  const target = useMemo(() => new THREE.Object3D(), []);
  target.position.set(...focus);
  target.updateMatrixWorld();
  const fillTarget = useMemo(() => new THREE.Object3D(), []);
  const fillRef = React.useRef<THREE.DirectionalLight>(null);

  // light probe + haze: set synchronously so the very first rendered frame has them
  const env = getEnv(gl, time);
  scene.environment = env;
  (scene as any).environmentIntensity = L.env;
  const hz = (haze ?? !!L.haze) && L.haze;
  if (hz) { if (!(scene.fog instanceof THREE.Fog)) scene.fog = new THREE.Fog(hz.color, hz.near, hz.far); else { scene.fog.color.set(hz.color); scene.fog.near = hz.near; scene.fog.far = hz.far; } }
  else scene.fog = null;
  useEffect(() => () => { if (scene.environment === env) scene.environment = null; scene.fog = null; }, [scene, env]);

  // face fill: a soft light from just above-left of the camera, aimed where the camera looks
  const { camera } = useThree();
  const placeFill = () => {
    const f = fillRef.current; if (!f) return;
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
    f.position.copy(camera.position).addScaledVector(right, -1.5).add(new THREE.Vector3(0, 1.5, 0));
    fillTarget.position.copy(camera.position).addScaledVector(fwd, 10); fillTarget.updateMatrixWorld();
  };
  useFrame(placeFill, -1);

  const showPractical = practical ?? time === "night"; // interiorNight: the spot is the one ceiling light
  const P = L.practical ?? { color: "#ffc27a", intensity: 60, pos: [0, 6.5, 4] as V3, distance: 30 };
  const S = shadowSpan;
  const d = new THREE.Vector3(...L.keyDir).normalize().multiplyScalar(60);
  return (
    <>
      <hemisphereLight args={[L.hemiSky, L.hemiGround, L.hemi]} />
      {L.key === "sun" ? (
        <directionalLight
          color={L.keyColor} intensity={L.key_} position={[focus[0] + d.x, focus[1] + d.y, focus[2] + d.z]} target={target}
          castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.04}
          shadow-camera-left={-S} shadow-camera-right={S} shadow-camera-top={S} shadow-camera-bottom={-S}
          shadow-camera-near={1} shadow-camera-far={140}
        />
      ) : (
        <spotLight
          color={L.keyColor} intensity={L.key_} decay={2} distance={0} angle={L.angle ?? 1.05} penumbra={1}
          position={[focus[0] + L.keyDir[0], focus[1] + L.keyDir[1], focus[2] + L.keyDir[2]]} target={target}
          castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0006} shadow-normalBias={0.04} shadow-camera-near={0.5} shadow-camera-far={60}
        />
      )}
      <primitive object={fillTarget} />
      <directionalLight ref={fillRef} color={L.fillColor} intensity={L.fill * fill} target={fillTarget} />
      {showPractical && (
        <pointLight color={P.color} intensity={time === "interiorNight" ? 40 : P.intensity} distance={P.distance} decay={2}
          position={practicalAt ?? (time === "interiorNight" ? [focus[0], focus[1] + 6.8, focus[2]] : P.pos)} />
      )}
    </>
  );
};

// ---------- sky ----------
type SkyKey = "day" | "morning" | "dusk" | "night";
const skyFor = (t: TimeOfDay): SkyKey => (t === "interior" ? "day" : t === "interiorNight" ? "night" : t === "bathroom" ? "morning" : t);
const SKY: Record<SkyKey, { top: string; mid: string; horizon: string; ground: string; clouds: number; cover: number; cloudCol: string; cloudShade: string; stars: number; glow: string; moon: number; sunDir: V3 }> = {
  // the sample: a clear light blue with big soft white cumulus, pale near the horizon
  day: { top: "#5d9fe0", mid: "#8fc0ee", horizon: "#dbeaf6", ground: "#a7b7a2", clouds: 1, cover: 0.5, cloudCol: "#ffffff", cloudShade: "#b9c6d6", stars: 0, glow: "#fff6e0", moon: 0, sunDir: [-0.45, 0.85, 0.55] },
  morning: { top: "#79a7d8", mid: "#a9c6e6", horizon: "#f0e6da", ground: "#b2b4a4", clouds: 1, cover: 0.45, cloudCol: "#fff8f0", cloudShade: "#c3c3cc", stars: 0, glow: "#fff0d8", moon: 0, sunDir: [0.6, 0.55, 0.6] },
  dusk: { top: "#3a3f8f", mid: "#c86a9c", horizon: "#ffb36b", ground: "#5a3e4a", clouds: 0.8, cover: 0.45, cloudCol: "#ffc0a0", cloudShade: "#8a5a7a", stars: 0.15, glow: "#ffd08a", moon: 0, sunDir: [-0.8, 0.28, 0.45] },
  // the sample's night: near-black navy overhead, a clear deep blue towards the horizon, a soft moon glow
  night: { top: "#040a22", mid: "#0d1d4e", horizon: "#2b4c95", ground: "#0b1430", clouds: 0.35, cover: 0.42, cloudCol: "#3a4f86", cloudShade: "#141f45", stars: 0.8, glow: "#c8d8ff", moon: 1, sunDir: [0.4, 0.55, -0.6] },
};

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = p.xyww; // always at the far plane
}`;

const frag = /* glsl */ `
uniform vec3 uTop, uMid, uHorizon, uGround, uCloud, uShade, uGlow, uSun;
uniform float uClouds, uCover, uStars, uMoon, uDrift;
varying vec3 vDir;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 6; i++){ s += a * noise(p); p = p * 2.02 + 7.1; a *= 0.5; } return s; }
float cloud(vec2 uv){
  // big puffy cumulus: a low-frequency mass shaped by finer billows
  float base = fbm(uv * 0.35);
  float bill = fbm(uv * 1.3 + 4.0);
  return smoothstep(1.0 - uCover - 0.1, 1.0 - uCover + 0.22, base * 0.75 + bill * 0.35);
}
void main() {
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 col = y > 0.0
    ? mix(mix(uHorizon, uMid, smoothstep(0.0, 0.22, y)), uTop, smoothstep(0.18, 0.9, y))
    : mix(uHorizon, uGround, smoothstep(0.0, 0.06, -y));
  vec3 sd3 = normalize(uSun);
  float sd = max(dot(d, sd3), 0.0);
  col += uGlow * pow(sd, 18.0) * 0.25;
  if (y > 0.0) {
    vec2 uv = d.xz / (y + 0.08) * 1.6 + vec2(uDrift, 0.0);
    float c = cloud(uv) * uClouds * smoothstep(0.0, 0.12, y);
    // light from above / sunward: sample the density a little towards the sun; denser there = shadowed underside
    float ahead = cloud(uv + normalize(sd3.xz + 1e-4) * 0.35);
    float lit = clamp(1.0 - (ahead - c) * 1.2 + fbm(uv * 3.0) * 0.25 - 0.1, 0.0, 1.0);
    vec3 cc = mix(uShade, uCloud, lit);
    cc = mix(cc, uHorizon, smoothstep(0.25, 0.0, y) * 0.6); // distant clouds fade into the haze
    col = mix(col, cc, c);
    // stars (deterministic, no twinkle), hidden behind clouds
    vec2 g = d.xz / (y + 0.3) * 90.0;
    vec2 gi = floor(g);
    float r = h21(gi);
    float star = step(0.986, r) * smoothstep(0.35, 0.0, length(fract(g) - 0.5)) * (0.4 + 0.6 * h21(gi + 3.7));
    col += vec3(star) * uStars * smoothstep(0.08, 0.35, y) * (1.0 - c);
  }
  // moon: a small bright disc with a wide soft halo
  col += uGlow * uMoon * (pow(sd, 40.0) * 0.45 + pow(sd, 400.0) * 0.6 + smoothstep(0.99955, 0.9997, sd) * 1.4);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

export const Sky: React.FC<{ time: TimeOfDay; drift?: number; radius?: number; sunDir?: V3 }> = ({ time, drift = 0, radius = 140, sunDir }) => {
  const k = SKY[skyFor(time)];
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() },
      uGround: { value: new THREE.Color() }, uCloud: { value: new THREE.Color() }, uShade: { value: new THREE.Color() },
      uGlow: { value: new THREE.Color() }, uSun: { value: new THREE.Vector3() }, uClouds: { value: 0 }, uCover: { value: 0.5 },
      uStars: { value: 0 }, uMoon: { value: 0 }, uDrift: { value: 0 },
    },
  }), []);
  const u = mat.uniforms;
  u.uTop.value.set(k.top); u.uMid.value.set(k.mid); u.uHorizon.value.set(k.horizon); u.uGround.value.set(k.ground);
  u.uCloud.value.set(k.cloudCol); u.uShade.value.set(k.cloudShade); u.uGlow.value.set(k.glow);
  u.uSun.value.set(...(sunDir ?? k.sunDir)); u.uClouds.value = k.clouds; u.uCover.value = k.cover;
  u.uStars.value = k.stars; u.uMoon.value = k.moon; u.uDrift.value = drift;
  return (
    <mesh material={mat} renderOrder={-1000} frustumCulled={false}>
      <sphereGeometry args={[radius, 64, 32]} />
    </mesh>
  );
};

// ---------- grade: a very light vignette for night scenes only (DOM overlay; put it in a shot's dom()) ----------
export const Grade: React.FC<{ time: TimeOfDay; strength?: number }> = ({ time, strength = 1 }) => {
  if (time !== "night" && time !== "interiorNight") return null;
  const a = 0.32 * strength;
  return (
    <AbsoluteFill style={{
      pointerEvents: "none",
      background: `radial-gradient(ellipse 75% 62% at 50% 46%, rgba(4,8,30,0) 55%, rgba(4,8,30,${a}) 100%)`,
    }} />
  );
};

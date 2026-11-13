// Chunky toy-like hair and hats for the blocky rig. Head: a rounded cylinder centred at local (0,0,0), radius 0.5,
// height 1.0 (top at y = 0.5), face looking +z. Hair "cap" draws short hair under a cap; <Hat> draws the cap for
// look.hat === "cap" OR look.hair === "cap" (so the rig can always render both <Hair/> and <Hat/>).
// The rig scales these by HEAD_R/0.5 in x and z to fit its wider head; model everything here for radius 0.5.
// Hair is slightly glossy (roughness 0.45) like moulded toy hair; <Glasses/> are round black frames with pale lenses.
import React from "react";
import * as THREE from "three";
import type { Look } from "./types";

const DS = THREE.DoubleSide;
const mat = (color: string, rough = 0.45) => <meshStandardMaterial color={color} roughness={rough} metalness={0} side={DS} />;

// A shell around the head: a cylinder segment covering the back/sides from yBot..yTop. Theta 0 = +z (face side).
const Shell: React.FC<{ color: string; r?: number; yTop: number; yBot: number; open: number }> = ({ color, r = 0.545, yTop, yBot, open }) => {
  // `open`: the angle (radians) of the face opening, centred on +z
  const h = yTop - yBot;
  return (
    <mesh position={[0, yBot + h / 2, 0]} castShadow>
      <cylinderGeometry args={[r, r, h, 40, 1, true, open / 2, Math.PI * 2 - open]} />
      {mat(color)}
    </mesh>
  );
};

// A rounded dome of hair over the top of the head (flush at the sides, a soft rounded crown, no hat-like brim).
const TopCap: React.FC<{ color: string; r?: number; h?: number; y?: number }> = ({ color, r = 0.55, h = 0.2, y = 0.56 }) => (
  <group position={[0, y - h / 2, 0]}>
    <mesh position={[0, h * 0.25, 0]} castShadow><cylinderGeometry args={[r, r, h * 0.5, 40]} />{mat(color)}</mesh>
    <mesh position={[0, h * 0.5, 0]} scale={[1, 0.42, 1]} castShadow><sphereGeometry args={[r, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />{mat(color)}</mesh>
  </group>
);

export const Hair: React.FC<{ look: Look }> = ({ look }) => {
  const c = look.hairColor ?? "#4a2e1c";
  const hatOn = !!look.hat && look.hat !== "none";
  // under a hat, only the hair that shows below it (back and sides)
  if (hatOn && look.hair !== "none") return <Hair look={{ ...look, hair: look.hair === "bob" || look.hair === "long" ? look.hair : "cap", hat: "none" }} />;
  switch (look.hair ?? "short") {
    case "none": return null;
    case "short":
      return (
        <group>
          <TopCap color={c} />
          <Shell color={c} yTop={0.6} yBot={0.05} open={Math.PI * 0.95} />
          {/* front fringe block */}
          <mesh position={[0.06, 0.47, 0.42]} rotation={[0.25, 0, -0.08]} castShadow><boxGeometry args={[0.8, 0.16, 0.22]} />{mat(c)}</mesh>
        </group>
      );
    case "bob":
      return (
        <group>
          <TopCap color={c} r={0.58} />
          <Shell color={c} r={0.58} yTop={0.62} yBot={-0.38} open={Math.PI * 0.62} />
          {/* straight fringe */}
          <mesh position={[0, 0.44, 0.44]} rotation={[0.18, 0, 0]} castShadow><boxGeometry args={[0.92, 0.2, 0.22]} />{mat(c)}</mesh>
          {/* chunky side panels framing the face */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.44, 0.04, 0.3]} rotation={[0, s * 0.55, 0]} castShadow><boxGeometry args={[0.16, 0.86, 0.3]} />{mat(c)}</mesh>
          ))}
        </group>
      );
    case "spiky": { // a tidy blocky hair cap hugging the head, with a few chunky spikes (top stays <= 0.25 above the head)
      // [x, z, height, tilt forward/back, roll sideways, base width]
      const spikes: [number, number, number, number, number, number][] = [
        [0, 0.24, 0.2, 0.55, 0, 0.17], [-0.26, 0.16, 0.18, 0.45, 0.45, 0.16], [0.26, 0.16, 0.18, 0.45, -0.45, 0.16],
        [-0.14, -0.08, 0.2, -0.1, 0.25, 0.17], [0.14, -0.08, 0.2, -0.1, -0.25, 0.17], [0, -0.3, 0.17, -0.5, 0, 0.16],
        [-0.36, -0.2, 0.15, -0.3, 0.6, 0.14], [0.36, -0.2, 0.15, -0.3, -0.6, 0.14],
      ];
      return (
        <group>
          {/* a low flat dome: the spikes, not the dome, give the height */}
          <mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.545, 0.545, 0.1, 40]} />{mat(c)}</mesh>
          <mesh position={[0, 0.55, 0]} scale={[1, 0.24, 1]} castShadow><sphereGeometry args={[0.545, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />{mat(c)}</mesh>
          <Shell color={c} r={0.545} yTop={0.52} yBot={0.06} open={Math.PI * 0.95} />
          {spikes.map(([x, z, h, tx, rz, w], i) => (
            <mesh key={i} position={[x, 0.6 + h * 0.8 - 0.02 - Math.hypot(x, z) * 0.12, z]} rotation={[tx, Math.PI / 4, rz]} castShadow>
              <coneGeometry args={[w * 1.35, h * 1.6, 4]} />{mat(c)}
            </mesh>
          ))}
          {/* chunky fringe: a block across the forehead with two short points hanging down */}
          <mesh position={[0, 0.47, 0.44]} rotation={[0.25, 0, 0]} castShadow><boxGeometry args={[0.86, 0.15, 0.2]} />{mat(c)}</mesh>
          {[-0.2, 0.12].map((x, i) => (
            <mesh key={"f" + i} position={[x, 0.36, 0.5]} rotation={[0.2, Math.PI / 4, Math.PI]} castShadow><coneGeometry args={[0.1, 0.14, 4]} />{mat(c)}</mesh>
          ))}
        </group>
      );
    }
    case "bun":
      return (
        <group>
          <TopCap color={c} />
          <Shell color={c} yTop={0.6} yBot={-0.05} open={Math.PI * 0.85} />
          <mesh position={[0, 0.48, 0.42]} rotation={[0.3, 0, 0]} castShadow><boxGeometry args={[0.86, 0.12, 0.2]} />{mat(c)}</mesh>
          <mesh position={[0, 0.86, -0.12]} castShadow><sphereGeometry args={[0.26, 28, 20]} />{mat(c)}</mesh>
          <mesh position={[0, 0.7, -0.08]} castShadow><torusGeometry args={[0.16, 0.05, 10, 24]} />{mat("#e05a7a")}</mesh>
        </group>
      );
    case "long": // straight hair past the shoulders, a full fringe, side curtains framing the face
      return (
        <group>
          <TopCap color={c} r={0.57} />
          <Shell color={c} r={0.565} yTop={0.6} yBot={-0.5} open={Math.PI * 0.6} />
          <mesh position={[0, 0.43, 0.45]} rotation={[0.2, 0, 0]} castShadow><boxGeometry args={[0.9, 0.22, 0.2]} />{mat(c)}</mesh>
          {/* back fall, hanging behind the shoulders */}
          <mesh position={[0, -0.75, -0.5]} rotation={[-0.06, 0, 0]} castShadow><boxGeometry args={[1.02, 1.3, 0.18]} />{mat(c)}</mesh>
          {/* side curtains down to the collarbone, over the front of the shoulders */}
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.47, -0.25, 0.22]} rotation={[0, s * 0.45, 0]} castShadow><boxGeometry args={[0.16, 1.3, 0.42]} />{mat(c)}</mesh>
              <mesh position={[s * 0.5, -0.45, -0.18]} castShadow><boxGeometry args={[0.14, 1.0, 0.6]} />{mat(c)}</mesh>
            </group>
          ))}
        </group>
      );
    case "ponytail": // pulled back: short hair on top, a band and a thick tail hanging from the back of the head
      return (
        <group>
          <TopCap color={c} />
          <Shell color={c} yTop={0.6} yBot={-0.1} open={Math.PI * 0.9} />
          <mesh position={[0, 0.46, 0.43]} rotation={[0.28, 0, 0]} castShadow><boxGeometry args={[0.86, 0.13, 0.2]} />{mat(c)}</mesh>
          <mesh position={[0, 0.3, -0.58]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.13, 0.13, 0.1, 16]} />{mat("#d8434f")}</mesh>
          <group position={[0, 0.3, -0.62]} rotation={[-0.32, 0, 0]}>
            <mesh position={[0, -0.42, 0]} castShadow><cylinderGeometry args={[0.17, 0.08, 0.85, 14]} />{mat(c)}</mesh>
            <mesh position={[0, -0.05, 0]} castShadow><sphereGeometry args={[0.17, 14, 10]} />{mat(c)}</mesh>
          </group>
        </group>
      );
    case "cap": // short hair showing below a cap (the cap itself comes from <Hat>)
      return (
        <group>
          <Shell color={c} yTop={0.42} yBot={0.02} open={Math.PI * 0.95} />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.5, 0.22, 0.12]} castShadow><boxGeometry args={[0.1, 0.3, 0.26]} />{mat(c)}</mesh>
          ))}
        </group>
      );
  }
  return null;
};

export const Hat: React.FC<{ look: Look }> = ({ look }) => {
  const kind = look.hat && look.hat !== "none" ? look.hat : look.hair === "cap" ? "cap" : "none";
  const col = look.shirt ?? "#d23b3b";
  if (kind === "cap") {
    return (
      <group position={[0, 0.48, 0]}>
        <mesh castShadow><cylinderGeometry args={[0.575, 0.575, 0.2, 40]} />{mat(col)}</mesh>
        <mesh position={[0, 0.1, 0]} scale={[1, 0.62, 1]} castShadow>
          <sphereGeometry args={[0.575, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />{mat(col)}
        </mesh>
        {/* stiff toy brim pointing forward over the face */}
        <mesh position={[0, -0.06, 0.66]} rotation={[0.08, 0, 0]} castShadow><boxGeometry args={[0.82, 0.07, 0.42]} />{mat(col)}</mesh>
        <mesh position={[0, 0.47, 0]} castShadow><cylinderGeometry args={[0.07, 0.07, 0.06, 16]} />{mat("#ffffff")}</mesh>
      </group>
    );
  }
  if (kind === "beanie") {
    return (
      <group position={[0, 0.44, 0]}>
        <mesh position={[0, 0.17, 0]} castShadow><cylinderGeometry args={[0.55, 0.565, 0.34, 40]} />{mat(col, 0.9)}</mesh>
        <mesh position={[0, 0.33, 0]} scale={[1, 0.55, 1]} castShadow>
          <sphereGeometry args={[0.55, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />{mat(col, 0.9)}
        </mesh>
        {/* folded cuff */}
        <mesh position={[0, 0.02, 0]} castShadow><cylinderGeometry args={[0.6, 0.6, 0.24, 40]} />{mat(new THREE.Color(col).multiplyScalar(0.75).getStyle(), 0.9)}</mesh>
        {/* pom-pom */}
        <mesh position={[0, 0.7, 0]} castShadow><sphereGeometry args={[0.15, 20, 16]} />{mat("#f4f1ea", 1)}</mesh>
      </group>
    );
  }
  return null;
};

/** Round black-framed glasses with pale lenses on the face, temples running back over the ears. */
export const Glasses: React.FC = () => (
  <group position={[0, 0.07, 0]}>
    {[-1, 1].map((s) => (
      <group key={s} position={[s * 0.19, 0, 0.52]} rotation={[0, s * 0.33, 0]}>
        <mesh><torusGeometry args={[0.13, 0.025, 10, 32]} /><meshStandardMaterial color="#151311" roughness={0.35} /></mesh>
        <mesh position={[0, 0, -0.005]}><circleGeometry args={[0.12, 32]} />
          <meshPhysicalMaterial color="#eef3f6" transparent opacity={0.28} roughness={0.08} clearcoat={1} depthWrite={false} />
        </mesh>
        <mesh position={[s * 0.2, 0, -0.32]} rotation={[0, s * -0.33, 0]}><boxGeometry args={[0.025, 0.03, 0.6]} /><meshStandardMaterial color="#151311" roughness={0.35} /></mesh>
      </group>
    ))}
    <mesh position={[0, 0.02, 0.555]}><boxGeometry args={[0.12, 0.025, 0.025]} /><meshStandardMaterial color="#151311" roughness={0.35} /></mesh>
  </group>
);

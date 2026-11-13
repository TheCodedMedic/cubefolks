// A placeholder bean (pill body, round head, stick legs) on a little stage, with a slow camera orbit. NOT the final
// character design: the first build task replaces it with the approved Beanfolk rig (docs/PLAN.md, step 1).
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";

const Cam: React.FC<{ a: number }> = ({ a }) => {
  const { camera } = useThree();
  camera.position.set(Math.sin(a) * 5, 1.6, Math.cos(a) * 5);
  camera.lookAt(0, 0.9, 0);
  return null;
};

export const Smoke: React.FC = () => {
  const f = useCurrentFrame(), a = -0.4 + f / 150;
  return (
    <AbsoluteFill style={{ background: "#f4d9a8" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: true, preserveDrawingBuffer: true }} camera={{ fov: 40 }}>
        <Cam a={a} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[2, 4, 3]} intensity={1.6} castShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[2.2, 48]} /><meshStandardMaterial color="#c98b5a" /></mesh>
        <mesh position={[0, 0.95, 0]} castShadow><capsuleGeometry args={[0.28, 0.42, 8, 24]} /><meshStandardMaterial color="#2f6fd6" roughness={0.7} /></mesh>
        <mesh position={[0, 1.62, 0]} castShadow><sphereGeometry args={[0.42, 40, 32]} /><meshStandardMaterial color="#e2b48c" roughness={0.6} /></mesh>
        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, 0.28, 0]} castShadow><cylinderGeometry args={[0.025, 0.025, 0.56, 8]} /><meshStandardMaterial color="#111" /></mesh>
        ))}
      </ThreeCanvas>
      <div style={{ position: "absolute", top: "60%", width: "100%", textAlign: "center", color: "#fff", font: "900 96px Montserrat, sans-serif",
        WebkitTextStroke: "6px #000", paintOrder: "stroke" }}>BEANFOLK</div>
    </AbsoluteFill>
  );
};

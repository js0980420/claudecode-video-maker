import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame } from "remotion";
import { CropPreset, ThreeSceneConfig } from "../../types";
import { dimensionsForCropPreset } from "../../utils/cropPresets";
import { BLACK } from "../../constants";

const MAX_WIDTH = 980;
const MAX_HEIGHT = 520;

const PrimitiveGeometry: React.FC<{ primitive: NonNullable<ThreeSceneConfig["primitive"]> }> = ({
  primitive,
}) => {
  if (primitive === "sphere") return <sphereGeometry args={[1.2, 48, 48]} />;
  if (primitive === "torus") return <torusGeometry args={[1, 0.34, 32, 72]} />;
  return <boxGeometry args={[1.9, 1.9, 1.9]} />;
};

export const ThreeScene: React.FC<{
  scene?: ThreeSceneConfig;
  cropPreset?: CropPreset;
}> = ({ scene, cropPreset }) => {
  const frame = useCurrentFrame();
  const frameSize = dimensionsForCropPreset(MAX_WIDTH, MAX_HEIGHT, cropPreset);
  const primitive = scene?.primitive ?? "box";
  const rotationSpeed = scene?.rotationSpeed ?? 0.018;
  const cameraZ = scene?.cameraZ ?? 5;
  const color = scene?.color ?? "#E63946";

  return (
    <div
      style={{
        width: frameSize.width,
        height: frameSize.height,
        borderRadius: 18,
        overflow: "hidden",
        background: BLACK,
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }}
    >
      <ThreeCanvas width={frameSize.width} height={frameSize.height}>
        <perspectiveCamera makeDefault position={[0, 0, cameraZ]} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[4, 5, 5]} intensity={1.1} />
        <pointLight position={[-3, -2, 4]} intensity={0.6} />
        <mesh rotation={[0.25, frame * rotationSpeed, 0.1]}>
          <PrimitiveGeometry primitive={primitive} />
          <meshStandardMaterial color={color} roughness={0.42} metalness={0.18} />
        </mesh>
      </ThreeCanvas>
    </div>
  );
};

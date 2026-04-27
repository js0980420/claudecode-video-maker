import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame } from "remotion";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CropPreset, ThreeSceneConfig, VideoContent } from "../../types";
import { dimensionsForCropPreset } from "../../utils/cropPresets";
import { findAsset } from "../../utils/assets";
import { cameraPositionForFrame } from "../../utils/threeCamera";
import { backgroundForEnvironmentPreset } from "../../utils/threePresets";
import { BLACK } from "../../constants";
import { staticFile } from "remotion";

const MAX_WIDTH = 980;
const MAX_HEIGHT = 520;
const MISSING_COLOR = "#E63946";

const LightRig: React.FC<{ preset?: ThreeSceneConfig["lightingPreset"] }> = ({
  preset = "studio",
}) => {
  if (preset === "soft") {
    return (
      <>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={0.55} />
      </>
    );
  }
  if (preset === "dramatic") {
    return (
      <>
        <ambientLight intensity={0.18} />
        <directionalLight position={[5, 5, 2]} intensity={1.35} />
        <pointLight position={[-4, -2, 3]} intensity={0.7} color="#7FB3FF" />
      </>
    );
  }
  if (preset === "product") {
    return (
      <>
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 6, 5]} intensity={1.15} />
        <directionalLight position={[-5, 3, 2]} intensity={0.45} />
      </>
    );
  }
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 5]} intensity={1.1} />
      <pointLight position={[-3, -2, 4]} intensity={0.6} />
    </>
  );
};

const PrimitiveGeometry: React.FC<{ primitive: NonNullable<ThreeSceneConfig["primitive"]> }> = ({
  primitive,
}) => {
  if (primitive === "sphere") return <sphereGeometry args={[1.2, 48, 48]} />;
  if (primitive === "torus") return <torusGeometry args={[1, 0.34, 32, 72]} />;
  return <boxGeometry args={[1.9, 1.9, 1.9]} />;
};

const TextureMaterial: React.FC<{ color: string; textureUrl: string }> = ({
  color,
  textureUrl,
}) => {
  const texture = useLoader(TextureLoader, textureUrl);
  return (
    <meshStandardMaterial
      color={color}
      map={texture}
      roughness={0.42}
      metalness={0.18}
    />
  );
};

const PrimitiveObject: React.FC<{
  scene?: ThreeSceneConfig;
  textureUrl?: string;
}> = ({ scene, textureUrl }) => {
  const frame = useCurrentFrame();
  const primitive = scene?.primitive ?? "box";
  const rotationSpeed = scene?.rotationSpeed ?? 0.018;
  const color = scene?.color ?? "#E63946";

  return (
    <mesh rotation={[0.25, frame * rotationSpeed, 0.1]}>
      <PrimitiveGeometry primitive={primitive} />
      {textureUrl ? (
        <TextureMaterial color={color} textureUrl={textureUrl} />
      ) : (
        <meshStandardMaterial color={color} roughness={0.42} metalness={0.18} />
      )}
    </mesh>
  );
};

const ModelObject: React.FC<{ modelUrl: string; scale: number }> = ({
  modelUrl,
  scale,
}) => {
  const frame = useCurrentFrame();
  const gltf = useLoader(GLTFLoader, modelUrl);
  return (
    <primitive
      object={gltf.scene}
      scale={scale}
      rotation={[0, frame * 0.012, 0]}
    />
  );
};

export const ThreeScene: React.FC<{
  scene?: ThreeSceneConfig;
  cropPreset?: CropPreset;
  assets?: VideoContent["assets"];
}> = ({ scene, cropPreset, assets }) => {
  const frame = useCurrentFrame();
  const frameSize = dimensionsForCropPreset(MAX_WIDTH, MAX_HEIGHT, cropPreset);
  const cameraZ = scene?.cameraZ ?? 5;
  const cameraPosition = cameraPositionForFrame(
    scene?.cameraAnimation,
    frame,
    cameraZ,
  );
  const background = backgroundForEnvironmentPreset(scene?.environmentPreset);
  const modelAsset = scene?.modelAssetId
    ? findAsset(assets, scene.modelAssetId, "model3d")
    : null;
  const rawTextureAsset = scene?.textureAssetId
    ? findAsset(assets, scene.textureAssetId)
    : null;
  const textureAsset =
    rawTextureAsset?.kind === "texture" || rawTextureAsset?.kind === "image"
      ? rawTextureAsset
      : null;

  if (scene?.modelAssetId && !modelAsset) {
    return (
      <div
        style={{
          width: frameSize.width,
          height: frameSize.height,
          borderRadius: 18,
          background: "#FFF5F5",
          color: MISSING_COLOR,
          border: `3px solid ${MISSING_COLOR}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 900 }}>MISSING 3D MODEL ASSET</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{scene.modelAssetId}</div>
      </div>
    );
  }

  if (scene?.textureAssetId && !textureAsset) {
    return (
      <div
        style={{
          width: frameSize.width,
          height: frameSize.height,
          borderRadius: 18,
          background: "#FFF5F5",
          color: MISSING_COLOR,
          border: `3px solid ${MISSING_COLOR}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 900 }}>MISSING 3D TEXTURE ASSET</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>{scene.textureAssetId}</div>
      </div>
    );
  }

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
      <ThreeCanvas
        width={frameSize.width}
        height={frameSize.height}
        camera={{ position: cameraPosition, fov: 45 }}
      >
        <color attach="background" args={[background]} />
        <LightRig preset={scene?.lightingPreset} />
        {modelAsset ? (
          <ModelObject
            modelUrl={staticFile(modelAsset.src)}
            scale={scene?.modelScale ?? 1}
          />
        ) : (
          <PrimitiveObject
            scene={scene}
            textureUrl={textureAsset ? staticFile(textureAsset.src) : undefined}
          />
        )}
      </ThreeCanvas>
    </div>
  );
};

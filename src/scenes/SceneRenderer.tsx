import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { SceneConfig, VideoContent } from "../types";
import { SceneLayout } from "./SceneLayout";
import { parseHighlights } from "../utils/parseHighlights";
import { BLACK } from "../constants";
import { IconPair } from "./templates/IconPair";
import { CrossedItems } from "./templates/CrossedItems";
import { Terminal } from "./templates/Terminal";
import { ChatBox } from "./templates/ChatBox";
import { PhoneCTA } from "./templates/PhoneCTA";
import { VideoClip } from "./templates/VideoClip";
import { ImageBackground } from "./templates/ImageBackground";

type Props = {
  scene: SceneConfig;
  sceneNumber: number;
  totalScenes: number;
  sceneDuration: number;
  brand: VideoContent["brand"];
  assets?: VideoContent["assets"];
};

export const SceneRenderer: React.FC<Props> = ({
  scene,
  sceneNumber,
  totalScenes,
  sceneDuration,
  brand,
  assets,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.6 },
  });

  // Description fades in late, scaled to scene length so short scenes
  // still get a visible reveal.
  const descStart = Math.min(36, Math.max(20, sceneDuration * 0.45));
  const descEnd = descStart + 14;
  const descOpacity = interpolate(frame, [descStart, descEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneLayout
      brand={brand}
      sceneNumber={sceneNumber}
      totalScenes={totalScenes}
      sceneDuration={sceneDuration}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: scene.visual.type === "centerText" ? 24 : 40,
        }}
      >
        <div
          style={{
            fontSize: scene.visual.type === "centerText" ? 96 : 72,
            fontWeight: 900,
            letterSpacing: 2,
            opacity: titleSpring,
            transform: `translateY(${(1 - titleSpring) * -24}px)`,
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          {parseHighlights(scene.title, brand.primaryColor)}
        </div>

        <VisualSlot
          scene={scene}
          accentColor={brand.primaryColor}
          assets={assets}
        />

        {scene.description ? (
          <div
            style={{
              fontSize: scene.visual.type === "centerText" ? 36 : 30,
              opacity: descOpacity,
              color: BLACK,
              textAlign: "center",
            }}
          >
            {parseHighlights(scene.description, brand.primaryColor)}
          </div>
        ) : null}
      </div>
    </SceneLayout>
  );
};

const VisualSlot: React.FC<{
  scene: SceneConfig;
  accentColor: string;
  assets?: VideoContent["assets"];
}> = ({ scene, accentColor, assets }) => {
  switch (scene.visual.type) {
    case "centerText":
      return null;
    case "iconPair":
      return <IconPair {...scene.visual} accentColor={accentColor} />;
    case "crossedItems":
      return <CrossedItems {...scene.visual} accentColor={accentColor} />;
    case "terminal":
      return <Terminal {...scene.visual} accentColor={accentColor} />;
    case "chatBox":
      return <ChatBox {...scene.visual} accentColor={accentColor} />;
    case "phoneCTA":
      return <PhoneCTA {...scene.visual} accentColor={accentColor} />;
    case "videoClip":
      return <VideoClip {...scene.visual} assets={assets} />;
    case "imageBackground":
      return <ImageBackground {...scene.visual} assets={assets} />;
  }
};

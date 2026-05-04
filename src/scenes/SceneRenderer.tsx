import React from "react";
import {
  useCurrentFrame,
  interpolate,
  Easing,
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

type Props = {
  scene: SceneConfig;
  sceneNumber: number;
  totalScenes: number;
  sceneDuration: number;
  brand: VideoContent["brand"];
};

export const SceneRenderer: React.FC<Props> = ({
  scene,
  sceneNumber,
  totalScenes,
  sceneDuration,
  brand,
}) => {
  const frame = useCurrentFrame();

  // #3 stagger: title(delay 0) / visual(delay 4) / desc(delay 8),Back easing
  function staggerSlide(delay: number) {
    const f = Math.max(0, frame - delay);
    return interpolate(f, [0, 18], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(1.3)),
    });
  }

  const titleP = staggerSlide(0);
  const visualP = staggerSlide(4);
  const descP = staggerSlide(8);

  // #5 title glow:呼吸式 drop-shadow
  const glow = 12 + Math.sin(frame / 15) * 6;

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
            opacity: titleP,
            transform: `translateY(${(1 - titleP) * 24}px)`,
            textAlign: "center",
            lineHeight: 1.15,
            filter: `drop-shadow(0 0 ${glow}px ${brand.primaryColor}AA)`,
          }}
        >
          {parseHighlights(scene.title, brand.primaryColor)}
        </div>

        <div
          style={{
            opacity: visualP,
            transform: `translateY(${(1 - visualP) * 24}px)`,
          }}
        >
          <VisualSlot scene={scene} accentColor={brand.primaryColor} />
        </div>

        {scene.description ? (
          <div
            style={{
              fontSize: scene.visual.type === "centerText" ? 36 : 30,
              opacity: descP,
              transform: `translateY(${(1 - descP) * 24}px)`,
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
}> = ({ scene, accentColor }) => {
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
  }
};

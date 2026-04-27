import React from "react";
import { AbsoluteFill, Series, Sequence, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { WHITE } from "./constants";
import { SceneRenderer } from "./scenes/SceneRenderer";
import { VideoContent } from "./types";

export type VideoProps = {
  content: VideoContent;
  sceneDurationsFrames: number[];
};

const FALLBACK_FRAMES = 120;

export const MyComposition: React.FC<VideoProps> = ({
  content,
  sceneDurationsFrames,
}) => {
  const scenes = content.scenes;

  const safeDurations = scenes.map((_, i) => {
    const v = sceneDurationsFrames?.[i];
    return typeof v === "number" && Number.isFinite(v) && v > 0
      ? v
      : FALLBACK_FRAMES;
  });
  const totalFrames = safeDurations.reduce((sum, d) => sum + d, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: WHITE }}>
      <Series>
        {scenes.map((scene, i) => (
          <Series.Sequence
            key={scene.id}
            durationInFrames={safeDurations[i]}
            layout="none"
          >
            <SceneRenderer
              scene={scene}
              sceneNumber={i + 1}
              totalScenes={scenes.length}
              sceneDuration={safeDurations[i]}
              brand={content.brand}
            />
          </Series.Sequence>
        ))}
      </Series>

      {content.voiceover.enabled
        ? scenes.map((scene, i) => {
            if (!scene.voiceover) return null;
            const from = safeDurations
              .slice(0, i)
              .reduce((sum, d) => sum + d, 0);
            const file = `voiceover/${scene.id}.wav`;
            return (
              <Sequence key={scene.id} from={from} layout="none">
                <Audio src={staticFile(file)} volume={1} />
              </Sequence>
            );
          })
        : null}

      {content.bgm.enabled && content.bgm.file ? (
        <BgmTrack
          file={content.bgm.file}
          volume={content.bgm.volume ?? 0.55}
          totalFrames={totalFrames}
          fadeInFrames={content.bgm.fadeInFrames ?? 18}
          fadeOutFrames={content.bgm.fadeOutFrames ?? 30}
        />
      ) : null}
    </AbsoluteFill>
  );
};

const BgmTrack: React.FC<{
  file: string;
  volume: number;
  totalFrames: number;
  fadeInFrames: number;
  fadeOutFrames: number;
}> = ({ file, volume, totalFrames, fadeInFrames, fadeOutFrames }) => (
  <Audio
    src={staticFile(file)}
    loop
    loopVolumeCurveBehavior="extend"
    volume={(f) => {
      const inGain = Math.min(1, f / fadeInFrames);
      const outGain = Math.min(1, (totalFrames - f) / fadeOutFrames);
      return volume * Math.max(0, Math.min(inGain, outGain));
    }}
  />
);

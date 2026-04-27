import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { WHITE } from "../constants";
import { SceneRenderer } from "../scenes/SceneRenderer";
import { SceneTimelineClip, Timeline } from "./types";

export type TimelineCompositionProps = {
  timeline: Timeline;
};

function renderSceneClip(timeline: Timeline, clip: SceneTimelineClip) {
  return (
    <Sequence
      key={clip.id}
      from={clip.from}
      durationInFrames={clip.durationInFrames}
      layout="none"
    >
      <SceneRenderer
        scene={clip.scene}
        sceneNumber={clip.sceneNumber}
        totalScenes={clip.totalScenes}
        sceneDuration={clip.durationInFrames}
        brand={timeline.brand}
        assets={timeline.assets}
      />
    </Sequence>
  );
}

export const TimelineComposition: React.FC<TimelineCompositionProps> = ({
  timeline,
}) => (
  <AbsoluteFill style={{ backgroundColor: WHITE }}>
    {timeline.tracks.map((track) =>
      track.clips.map((clip) =>
        clip.type === "scene" ? renderSceneClip(timeline, clip) : null,
      ),
    )}
  </AbsoluteFill>
);

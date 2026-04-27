import { VideoContent } from "../types";
import { Timeline, SceneTimelineClip } from "./types";
import { timingMarkersToTimelineMarkers } from "../utils/timingMarkers";

function durationForScene(
  content: VideoContent,
  sceneIndex: number,
  sceneDurationsFrames?: number[],
): number {
  const explicit = sceneDurationsFrames?.[sceneIndex];
  if (typeof explicit === "number" && Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }
  const scene = content.scenes[sceneIndex];
  return Math.ceil(
    (scene.durationSeconds ?? content.meta.fallbackSceneSeconds) * content.meta.fps,
  );
}

export function compileShortFormTimeline(
  content: VideoContent,
  sceneDurationsFrames?: number[],
): Timeline {
  let cursor = 0;
  const sceneClips: SceneTimelineClip[] = content.scenes.map((scene, i) => {
    const durationInFrames = durationForScene(content, i, sceneDurationsFrames);
    const clip: SceneTimelineClip = {
      id: scene.id,
      type: "scene",
      scene,
      sceneNumber: i + 1,
      totalScenes: content.scenes.length,
      from: cursor,
      durationInFrames,
    };
    cursor += durationInFrames;
    return clip;
  });

  return {
    id: content.meta.videoName,
    width: content.meta.width,
    height: content.meta.height,
    fps: content.meta.fps,
    durationInFrames: cursor,
    brand: content.brand,
    assets: content.assets,
    markers: timingMarkersToTimelineMarkers(content.markers, content.meta.fps),
    tracks: [
      {
        id: "scenes",
        kind: "scene",
        clips: sceneClips,
      },
    ],
  };
}

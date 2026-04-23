import "./index.css";
import { CalculateMetadataFunction, Composition, Still } from "remotion";
import { MyComposition, VideoProps } from "./Composition";
import { content as mainContent } from "./content";
import { content as testContent } from "./content-test";
import { ThumbnailYT } from "./thumbnails/ThumbnailYT";
import { ThumbnailIG } from "./thumbnails/ThumbnailIG";
import { ThumbnailReel } from "./thumbnails/ThumbnailReel";
import durationsJson from "../public/voiceover/durations.json";

const durations = durationsJson as Record<string, number>;

const sceneDurationSeconds = (content: typeof mainContent, sceneId: string): number => {
  const scene = content.scenes.find((s) => s.id === sceneId);
  if (!scene) return content.meta.fallbackSceneSeconds;
  if (content.voiceover.enabled && typeof durations[sceneId] === "number") {
    return durations[sceneId] + content.meta.sceneTailSeconds;
  }
  return scene.durationSeconds ?? content.meta.fallbackSceneSeconds;
};

const createComposition = (content: typeof mainContent) => {
  const SCENE_DURATIONS_FRAMES = content.scenes.map((scene) =>
    Math.ceil(sceneDurationSeconds(content, scene.id) * content.meta.fps),
  );

  const TOTAL_FRAMES = SCENE_DURATIONS_FRAMES.reduce((sum, d) => sum + d, 0);

  const calculateMetadata: CalculateMetadataFunction<VideoProps> = ({
    props,
  }) => ({
    durationInFrames: TOTAL_FRAMES,
    props: { ...props, sceneDurationsFrames: SCENE_DURATIONS_FRAMES },
  });

  return { TOTAL_FRAMES, SCENE_DURATIONS_FRAMES, calculateMetadata };
};

export const RemotionRoot: React.FC = () => {
  const main = createComposition(mainContent);
  const test = createComposition(testContent);

  return (
    <>
      {/* 主要影片 */}
      <Composition
        id={mainContent.meta.videoName}
        component={MyComposition}
        durationInFrames={main.TOTAL_FRAMES}
        fps={mainContent.meta.fps}
        width={mainContent.meta.width}
        height={mainContent.meta.height}
        defaultProps={{ sceneDurationsFrames: main.SCENE_DURATIONS_FRAMES }}
        calculateMetadata={main.calculateMetadata}
      />

      {/* 測試影片 */}
      <Composition
        id={testContent.meta.videoName}
        component={MyComposition}
        durationInFrames={test.TOTAL_FRAMES}
        fps={testContent.meta.fps}
        width={testContent.meta.width}
        height={testContent.meta.height}
        defaultProps={{ sceneDurationsFrames: test.SCENE_DURATIONS_FRAMES }}
        calculateMetadata={test.calculateMetadata}
      />

      {mainContent.thumbnails.yt ? (
        <Still
          id="ThumbnailYT"
          component={ThumbnailYT}
          width={1280}
          height={720}
          defaultProps={{
            content: mainContent.thumbnails.yt,
            primaryColor: mainContent.brand.primaryColor,
          }}
        />
      ) : null}
      {mainContent.thumbnails.ig ? (
        <Still
          id="ThumbnailIG"
          component={ThumbnailIG}
          width={1080}
          height={1080}
          defaultProps={{
            content: mainContent.thumbnails.ig,
            primaryColor: mainContent.brand.primaryColor,
          }}
        />
      ) : null}
      {mainContent.thumbnails.reel ? (
        <Still
          id="ThumbnailReel"
          component={ThumbnailReel}
          width={1080}
          height={1920}
          defaultProps={{
            content: mainContent.thumbnails.reel,
            primaryColor: mainContent.brand.primaryColor,
          }}
        />
      ) : null}
    </>
  );
};

import "./index.css";
import { CalculateMetadataFunction, Composition, Still } from "remotion";
import { MyComposition, VideoProps } from "./Composition";
import { content as mainContent } from "./content";
import { content as testContent } from "./content-test";
import { ThumbnailYT } from "./thumbnails/ThumbnailYT";
import { ThumbnailIG } from "./thumbnails/ThumbnailIG";
import { ThumbnailReel } from "./thumbnails/ThumbnailReel";
import { BannerYT } from "./BannerYT";
import { BannerFB } from "./BannerFB";
import { PostIG } from "./PostIG";
import { BannerLI } from "./BannerLI";
import durationsJson from "../public/voiceover/durations.json";
import { TUTORIAL_STEPS_JSON } from "./tutorial/content";
import { parseTutorialData } from "./tutorial/steps-data";
import {
  TutorialComposition,
  calcTutorialDurationFrames,
  TUTORIAL_FPS,
  TUTORIAL_WIDTH,
  TUTORIAL_HEIGHT,
} from "./tutorial/TutorialComposition";
import { TUTORIAL_CONFIG } from "./tutorial/config";
import {
  TutorialThumbnailYT,
  TutorialThumbnailIG,
  TutorialThumbnailReel,
} from "./tutorial/TutorialThumbnails";

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
  const tutorialData = parseTutorialData(TUTORIAL_STEPS_JSON);
  const tutorialDurationFrames = calcTutorialDurationFrames(tutorialData);
  const tutorialId = TUTORIAL_CONFIG.videoName; // Remotion composition id

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

      {/* Tutorial prototype(階段 1 — 純截圖輪播) */}
      <Composition
        id={tutorialId}
        component={TutorialComposition}
        durationInFrames={tutorialDurationFrames}
        fps={TUTORIAL_FPS}
        width={TUTORIAL_WIDTH}
        height={TUTORIAL_HEIGHT}
        defaultProps={{ data: tutorialData }}
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

      {/* YouTube channel banner(2560x1440,中央 1546x423 是 mobile-safe 區) */}
      <Still
        id="BannerYT"
        component={BannerYT}
        width={2560}
        height={1440}
        defaultProps={{
          headlineLeft: "自動化拍片整合",
          headlineAccent: "工作流",
          headlineRight: "",
          subline: "Claude Code × 隨拚隨改 × 真人配音 × 自動發片到 YT / IG / Threads",
          footerLine: "日更發片神器",
          decorLeftTop: "$ npx claudecode-video-maker",
          decorRightBottom: "→ YouTube · Instagram · Threads",
          primaryColor: TUTORIAL_CONFIG.accentColor,
        }}
      />

      {/* Facebook 粉專橫幅(1640x624,HD;FB 顯示時 desktop ~820x312,mobile 中央裁切) */}
      <Still
        id="BannerFB"
        component={BannerFB}
        width={1640}
        height={624}
        defaultProps={{
          headlineLeft: "自動化拍片整合",
          headlineAccent: "工作流",
          headlineRight: "",
          subline: "Claude Code × 隨拚隨改 × 真人配音 × 自動發片到 YT / IG / Threads",
          footerLine: "日更發片神器",
          tagline: [
            "把工具連結丟給 Claude Code 安裝,再告訴它影片需求就可以了,所有功能全靠對話完成",
            "就是這麼簡單無腦,點這張圖查看工具連結 ☝️",
          ],
          primaryColor: TUTORIAL_CONFIG.accentColor,
        }}
      />

      {/* Instagram 4:5 動態貼文(1080x1350)— feed post 用,不是 profile 橫幅。
          tagline 不寫「點圖片看連結」之類 CTA(IG feed post 不能點擊跳連結) */}
      <Still
        id="PostIG"
        component={PostIG}
        width={1080}
        height={1350}
        defaultProps={{
          headlineLeft: "自動化拍片整合",
          headlineAccent: "工作流",
          headlineRight: "",
          subline: "Claude Code × 隨拚隨改 × 真人配音 × 自動發片到 YT / IG / Threads",
          footerLine: "日更發片神器",
          tagline: [
            "把工具連結丟給 Claude Code 安裝,再告訴它影片需求就可以了,所有功能全靠對話完成",
          ],
          primaryColor: TUTORIAL_CONFIG.accentColor,
        }}
      />

      {/* LinkedIn 個人 profile 橫幅(1584x396,4:1)— 沿用 YT corner-decor 結構,無 tagline */}
      <Still
        id="BannerLI"
        component={BannerLI}
        width={1584}
        height={396}
        defaultProps={{
          headlineLeft: "自動化拍片整合",
          headlineAccent: "工作流",
          headlineRight: "",
          subline: "Claude Code × 隨拚隨改 × 真人配音 × 自動發片到 YT / IG / Threads",
          footerLine: "日更發片神器",
          decorLeftTop: "$ npx claudecode-video-maker",
          decorRightBottom: "→ YouTube · Instagram · Threads",
          primaryColor: TUTORIAL_CONFIG.accentColor,
        }}
      />

      {/* Tutorial thumbnails (平台膠囊由 config.thumbnail.platformBadge 決定) */}
      <Still
        id={`${tutorialId}-ThumbnailYT`}
        component={TutorialThumbnailYT}
        width={1280}
        height={720}
        defaultProps={{
          content: TUTORIAL_CONFIG.thumbnail.content,
          primaryColor: TUTORIAL_CONFIG.accentColor,
          platformBadge: TUTORIAL_CONFIG.thumbnail.platformBadge,
        }}
      />
      <Still
        id={`${tutorialId}-ThumbnailIG`}
        component={TutorialThumbnailIG}
        width={1080}
        height={1080}
        defaultProps={{
          content: TUTORIAL_CONFIG.thumbnail.content,
          primaryColor: TUTORIAL_CONFIG.accentColor,
          platformBadge: TUTORIAL_CONFIG.thumbnail.platformBadge,
        }}
      />
      <Still
        id={`${tutorialId}-ThumbnailReel`}
        component={TutorialThumbnailReel}
        width={1080}
        height={1920}
        defaultProps={{
          content: TUTORIAL_CONFIG.thumbnail.content,
          primaryColor: TUTORIAL_CONFIG.accentColor,
          platformBadge: TUTORIAL_CONFIG.thumbnail.platformBadge,
        }}
      />
    </>
  );
};

import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { TutorialData, TutorialStep } from "./types";
import { StepScene, stepDurationFrames, splitIntoPages } from "./StepScene";
import { IntroScene, INTRO_DURATION_FRAMES } from "./IntroScene";
import { OutroScene, OUTRO_DURATION_FRAMES } from "./OutroScene";
import { TUTORIAL_CONFIG } from "./config";
import { TUTORIAL_DURATIONS } from "./content";
import { WHITE } from "../constants";

const FPS = 30;
const ACCENT_COLOR = TUTORIAL_CONFIG.accentColor;
const VIDEO_NAME = TUTORIAL_CONFIG.videoName;
const TAIL_FRAMES = 15; // 0.5s 尾巴,避免音訊還沒講完就切場

function introDurationFrames(): number {
  const audioSec = TUTORIAL_DURATIONS.intro ?? 0;
  const audioFrames = Math.ceil(audioSec * FPS) + TAIL_FRAMES;
  return Math.max(INTRO_DURATION_FRAMES, audioFrames);
}

function outroDurationFrames(): number {
  const audioSec = TUTORIAL_DURATIONS.outro ?? 0;
  const audioFrames = Math.ceil(audioSec * FPS) + TAIL_FRAMES;
  return Math.max(OUTRO_DURATION_FRAMES, audioFrames);
}

function pageAudioDurationsFor(step: TutorialStep): (number | null)[] {
  const pages = splitIntoPages(step.blocks);
  const pageCount = Math.max(pages.length, step.voiceovers?.length ?? 0, 1);
  const result: (number | null)[] = [];
  for (let i = 0; i < pageCount; i++) {
    const key = `${step.id}-p${i + 1}`;
    const sec = TUTORIAL_DURATIONS[key];
    result.push(typeof sec === "number" ? sec : null);
  }
  return result;
}

function stepTotalFrames(step: TutorialStep): number {
  return stepDurationFrames(step, pageAudioDurationsFor(step));
}

export type TutorialCompositionProps = {
  data: TutorialData;
};

export const TutorialComposition: React.FC<TutorialCompositionProps> = ({
  data,
}) => {
  const introDur = introDurationFrames();
  let cursor = introDur;
  return (
    <AbsoluteFill style={{ background: WHITE }}>
      {/* BGM 鋪底,整段迴圈 */}
      <Audio src={staticFile("music/bgm.mp3")} loop volume={0.2} />

      <Sequence from={0} durationInFrames={introDur}>
        <IntroScene
          accentColor={ACCENT_COLOR}
          titleAccent={TUTORIAL_CONFIG.intro.titleAccent}
          titleSuffix={TUTORIAL_CONFIG.intro.titleSuffix}
          platform={TUTORIAL_CONFIG.intro.platform}
          durationFrames={introDur}
        />
        {data.intro?.voiceover ? (
          <Audio src={staticFile(`voiceover/${VIDEO_NAME}/intro.wav`)} />
        ) : null}
      </Sequence>
      {data.steps.map((step) => {
        const from = cursor;
        const duration = stepTotalFrames(step);
        cursor += duration;
        return (
          <Sequence
            key={step.id}
            from={from}
            durationInFrames={duration}
          >
            <StepScene
              step={step}
              accentColor={ACCENT_COLOR}
              pageAudioDurations={pageAudioDurationsFor(step)}
              watermark={TUTORIAL_CONFIG.watermark}
              videoName={VIDEO_NAME}
            />
          </Sequence>
        );
      })}
      {/* Outro Sequence — config.outro 有設才接 */}
      {TUTORIAL_CONFIG.outro
        ? (() => {
            const outroDur = outroDurationFrames();
            return (
              <Sequence from={cursor} durationInFrames={outroDur}>
                <OutroScene
                  accentColor={ACCENT_COLOR}
                  title={TUTORIAL_CONFIG.outro.title}
                  subtitle={TUTORIAL_CONFIG.outro.subtitle}
                  nextChapter={TUTORIAL_CONFIG.outro.nextChapter}
                  durationFrames={outroDur}
                />
                {data.outro?.voiceover ? (
                  <Audio
                    src={staticFile(`voiceover/${VIDEO_NAME}/outro.wav`)}
                  />
                ) : null}
              </Sequence>
            );
          })()
        : null}
    </AbsoluteFill>
  );
};

export function calcTutorialDurationFrames(data: TutorialData): number {
  const stepsDur = data.steps.reduce((sum, s) => sum + stepTotalFrames(s), 0);
  const outroDur = TUTORIAL_CONFIG.outro ? outroDurationFrames() : 0;
  return introDurationFrames() + stepsDur + outroDur;
}

export const TUTORIAL_FPS = FPS;
export const TUTORIAL_WIDTH = 1920;
export const TUTORIAL_HEIGHT = 1080;

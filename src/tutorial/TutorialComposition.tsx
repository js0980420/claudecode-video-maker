import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { TutorialData } from "./types";
import { StepScene, stepDurationFrames } from "./StepScene";
import { WHITE } from "../constants";

const FPS = 30;
const ACCENT_COLOR = "#E63946";

export type TutorialCompositionProps = {
  data: TutorialData;
};

export const TutorialComposition: React.FC<TutorialCompositionProps> = ({
  data,
}) => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: WHITE }}>
      {data.steps.map((step) => {
        const from = cursor;
        const duration = stepDurationFrames(step);
        cursor += duration;
        return (
          <Sequence
            key={step.id}
            from={from}
            durationInFrames={duration}
          >
            <StepScene step={step} accentColor={ACCENT_COLOR} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export function calcTutorialDurationFrames(data: TutorialData): number {
  return data.steps.reduce((sum, s) => sum + stepDurationFrames(s), 0);
}

export const TUTORIAL_FPS = FPS;
export const TUTORIAL_WIDTH = 1920;
export const TUTORIAL_HEIGHT = 1080;

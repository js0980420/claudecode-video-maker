import React from "react";
import { Sequence, staticFile, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { SpeedRampSegment } from "../../types";
import { speedRampToVideoSegments } from "../../utils/speedRamp";

export const SpeedRampedVideo: React.FC<{
  src: string;
  fit: "cover" | "contain";
  muted?: boolean;
  volume?: number;
  startFromSeconds?: number;
  endAtSeconds?: number;
  playbackRate?: number;
  speedRamp?: SpeedRampSegment[];
}> = ({
  src,
  fit,
  muted = true,
  volume = 0,
  startFromSeconds = 0,
  endAtSeconds,
  playbackRate = 1,
  speedRamp,
}) => {
  const { fps } = useVideoConfig();

  if (speedRamp && speedRamp.length > 0) {
    return (
      <>
        {speedRampToVideoSegments(speedRamp, fps, startFromSeconds).map(
          (segment, index) => (
            <Sequence
              key={index}
              from={segment.from}
              durationInFrames={segment.durationInFrames}
              premountFor={Math.min(fps, 30)}
            >
              <Video
                src={staticFile(src)}
                muted={muted}
                objectFit={fit}
                playbackRate={segment.playbackRate}
                trimBefore={segment.trimBeforeFrames}
                trimAfter={segment.trimAfterFrames}
                volume={() => (muted ? 0 : volume)}
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </Sequence>
          ),
        )}
      </>
    );
  }

  return (
    <Video
      src={staticFile(src)}
      muted={muted}
      objectFit={fit}
      playbackRate={playbackRate}
      trimBefore={Math.max(0, Math.floor(startFromSeconds * fps))}
      trimAfter={
        endAtSeconds === undefined
          ? undefined
          : Math.max(0, Math.floor(endAtSeconds * fps))
      }
      volume={() => (muted ? 0 : volume)}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};

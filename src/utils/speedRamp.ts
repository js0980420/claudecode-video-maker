import { SpeedRampSegment } from "../types";

export type SpeedRampVideoSegment = {
  from: number;
  durationInFrames: number;
  trimBeforeFrames: number;
  trimAfterFrames: number;
  playbackRate: number;
};

export function speedRampDurationSeconds(segments: SpeedRampSegment[]): number {
  return segments.reduce((sum, segment) => sum + segment.durationSeconds, 0);
}

export function speedRampToVideoSegments(
  segments: SpeedRampSegment[],
  fps: number,
  startFromSeconds = 0,
): SpeedRampVideoSegment[] {
  let outputCursor = 0;
  let sourceCursorFrames = Math.max(0, Math.floor(startFromSeconds * fps));

  return segments.map((segment) => {
    const durationInFrames = Math.max(1, Math.ceil(segment.durationSeconds * fps));
    const sourceDurationFrames = Math.max(
      1,
      Math.ceil(durationInFrames * segment.playbackRate),
    );
    const result: SpeedRampVideoSegment = {
      from: outputCursor,
      durationInFrames,
      trimBeforeFrames: sourceCursorFrames,
      trimAfterFrames: sourceCursorFrames + sourceDurationFrames,
      playbackRate: segment.playbackRate,
    };
    outputCursor += durationInFrames;
    sourceCursorFrames += sourceDurationFrames;
    return result;
  });
}

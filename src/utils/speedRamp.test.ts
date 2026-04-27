import { test } from "node:test";
import assert from "node:assert/strict";
import {
  speedRampDurationSeconds,
  speedRampToVideoSegments,
} from "./speedRamp";

test("speedRampDurationSeconds sums output durations", () => {
  assert.equal(
    speedRampDurationSeconds([
      { durationSeconds: 1, playbackRate: 1 },
      { durationSeconds: 2.5, playbackRate: 2 },
    ]),
    3.5,
  );
});

test("speedRampToVideoSegments maps output timing to source trims", () => {
  assert.deepEqual(
    speedRampToVideoSegments(
      [
        { durationSeconds: 1, playbackRate: 1 },
        { durationSeconds: 2, playbackRate: 2 },
      ],
      30,
      3,
    ),
    [
      {
        from: 0,
        durationInFrames: 30,
        trimBeforeFrames: 90,
        trimAfterFrames: 120,
        playbackRate: 1,
      },
      {
        from: 30,
        durationInFrames: 60,
        trimBeforeFrames: 120,
        trimAfterFrames: 240,
        playbackRate: 2,
      },
    ],
  );
});

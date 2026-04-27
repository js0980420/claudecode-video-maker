import { test } from "node:test";
import assert from "node:assert/strict";
import { cameraPositionForFrame } from "./threeCamera";

test("cameraPositionForFrame returns static default position", () => {
  assert.deepEqual(cameraPositionForFrame(undefined, 10, 5), [0, 0, 5]);
  assert.deepEqual(cameraPositionForFrame({ type: "static" }, 10, 5), [0, 0, 5]);
});

test("cameraPositionForFrame interpolates dolly position", () => {
  assert.deepEqual(
    cameraPositionForFrame(
      { type: "dolly", fromZ: 8, toZ: 4, durationFrames: 100 },
      25,
      5,
    ),
    [0, 0, 7],
  );
});

test("cameraPositionForFrame computes orbit position", () => {
  assert.deepEqual(
    cameraPositionForFrame(
      { type: "orbit", radius: 5, height: 1, speed: Math.PI / 2 },
      1,
      4,
    ).map((value) => Math.round(value * 1000) / 1000),
    [5, 1, 0],
  );
});

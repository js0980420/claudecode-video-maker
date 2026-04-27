import { test } from "node:test";
import assert from "node:assert/strict";
import {
  timingMarkerFrame,
  timingMarkersToTimelineMarkers,
} from "./timingMarkers";

test("timingMarkerFrame converts seconds to frames", () => {
  assert.equal(timingMarkerFrame({ id: "beat-1", seconds: 1.5 }, 30), 45);
});

test("timingMarkerFrame prefers explicit frame values", () => {
  assert.equal(
    timingMarkerFrame({ id: "cut-1", seconds: 1.5, frame: 12 }, 30),
    12,
  );
});

test("timingMarkersToTimelineMarkers normalizes kind and timing", () => {
  assert.deepEqual(
    timingMarkersToTimelineMarkers(
      [
        { id: "a", seconds: 1, kind: "beat", label: "Beat" },
        { id: "b", frame: 12, sceneId: "scene-01" },
      ],
      24,
    ),
    [
      { id: "a", kind: "beat", frame: 24, label: "Beat", sceneId: undefined },
      { id: "b", kind: "custom", frame: 12, label: undefined, sceneId: "scene-01" },
    ],
  );
});

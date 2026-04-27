import { test } from "node:test";
import assert from "node:assert/strict";
import { dimensionsForCropPreset, isCropPreset } from "./cropPresets";

test("dimensionsForCropPreset preserves max dimensions without a preset", () => {
  assert.deepEqual(dimensionsForCropPreset(980, 420), {
    width: 980,
    height: 420,
  });
});

test("dimensionsForCropPreset fits horizontal and square ratios", () => {
  assert.deepEqual(dimensionsForCropPreset(980, 420, "16:9"), {
    width: 747,
    height: 420,
  });
  assert.deepEqual(dimensionsForCropPreset(980, 420, "1:1"), {
    width: 420,
    height: 420,
  });
});

test("dimensionsForCropPreset fits vertical platform ratios", () => {
  assert.deepEqual(dimensionsForCropPreset(980, 420, "4:5"), {
    width: 336,
    height: 420,
  });
  assert.deepEqual(dimensionsForCropPreset(980, 420, "9:16"), {
    width: 236,
    height: 420,
  });
});

test("isCropPreset accepts only supported crop presets", () => {
  assert.equal(isCropPreset("9:16"), true);
  assert.equal(isCropPreset("3:2"), false);
});

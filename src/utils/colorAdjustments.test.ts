import { test } from "node:test";
import assert from "node:assert/strict";
import {
  colorAdjustmentFilter,
  vignetteBackground,
} from "./colorAdjustments";

test("colorAdjustmentFilter returns none without adjustment", () => {
  assert.equal(colorAdjustmentFilter(), "none");
});

test("colorAdjustmentFilter formats and clamps values", () => {
  assert.equal(
    colorAdjustmentFilter({
      brightness: 2.5,
      contrast: -1,
      saturation: 1.25,
    }),
    "brightness(2) contrast(0) saturate(1.25)",
  );
});

test("vignetteBackground returns overlay only when enabled", () => {
  assert.equal(vignetteBackground(), null);
  assert.equal(
    vignetteBackground({ vignette: 0.35 }),
    "radial-gradient(circle at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.35) 100%)",
  );
});

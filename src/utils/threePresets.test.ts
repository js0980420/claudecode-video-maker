import { test } from "node:test";
import assert from "node:assert/strict";
import {
  backgroundForEnvironmentPreset,
  isThreeEnvironmentPreset,
  isThreeLightingPreset,
} from "./threePresets";

test("three preset guards accept supported values", () => {
  assert.equal(isThreeLightingPreset("studio"), true);
  assert.equal(isThreeLightingPreset("flat"), false);
  assert.equal(isThreeEnvironmentPreset("cool"), true);
  assert.equal(isThreeEnvironmentPreset("hdr"), false);
});

test("backgroundForEnvironmentPreset returns stable colors", () => {
  assert.equal(backgroundForEnvironmentPreset(undefined), "#090A0F");
  assert.equal(backgroundForEnvironmentPreset("warm"), "#211914");
  assert.equal(backgroundForEnvironmentPreset("white"), "#F6F7F9");
});

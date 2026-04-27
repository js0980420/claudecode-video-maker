import { test } from "node:test";
import assert from "node:assert/strict";
import { validateEditPlan } from "./validate";

test("validateEditPlan accepts a minimal valid plan", () => {
  const result = validateEditPlan({
    objective: "Create a product demo",
    targetDurationSeconds: 45,
    platform: "reel",
    sourceAssetIds: ["clip-1", "clip-2"],
    narration: { type: "script", text: "Here is the story." },
    stylePreset: "product",
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateEditPlan rejects invalid fields with paths", () => {
  const result = validateEditPlan({
    objective: "",
    targetDurationSeconds: 0,
    platform: "reel",
    sourceAssetIds: ["clip-1", "clip-1"],
    narration: { type: "segments", segments: [{ id: "a", text: "" }] },
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes("objective: must be a non-empty string"));
  assert.ok(result.errors.includes("targetDurationSeconds: must be a positive number"));
  assert.ok(result.errors.includes("sourceAssetIds[1]: duplicate asset id: clip-1"));
  assert.ok(
    result.errors.includes("narration.segments[0].text: must be a non-empty string"),
  );
});

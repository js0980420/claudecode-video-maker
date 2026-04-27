import { test } from "node:test";
import assert from "node:assert/strict";
import { applyEditPlanHooks } from "./aiHooks";
import { EditPlan } from "./types";

const basePlan: EditPlan = {
  objective: "Create a launch edit",
  targetDurationSeconds: 30,
  platform: "reel",
  sourceAssetIds: ["clip"],
  narration: { type: "none" },
};

test("applyEditPlanHooks applies sync and async hooks in order", async () => {
  const result = await applyEditPlanHooks(basePlan, [
    (plan) => ({ ...plan, title: "Launch" }),
    async (plan) => ({ ...plan, stylePreset: "product" }),
  ]);

  assert.equal(result.title, "Launch");
  assert.equal(result.stylePreset, "product");
});

test("applyEditPlanHooks rejects invalid hook output", async () => {
  await assert.rejects(
    () =>
      applyEditPlanHooks(basePlan, [
        (plan) => ({ ...plan, targetDurationSeconds: 0 }),
      ]),
    /returned invalid plan/,
  );
});

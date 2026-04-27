import { test } from "node:test";
import assert from "node:assert/strict";
import {
  replaceSourceAsset,
  retimeEditPlan,
  switchEditPlanPlatform,
} from "./iterations";
import { EditPlan } from "./types";

const plan: EditPlan = {
  objective: "Iterate an edit",
  targetDurationSeconds: 30,
  platform: "youtube",
  sourceAssetIds: ["a", "b"],
  narration: { type: "none" },
};

test("replaceSourceAsset replaces one asset without mutating the plan", () => {
  const result = replaceSourceAsset(plan, "a", "c");
  assert.deepEqual(result.sourceAssetIds, ["c", "b"]);
  assert.deepEqual(plan.sourceAssetIds, ["a", "b"]);
});

test("retimeEditPlan updates target duration", () => {
  assert.equal(retimeEditPlan(plan, 45).targetDurationSeconds, 45);
  assert.throws(() => retimeEditPlan(plan, 0), /Invalid iterated edit plan/);
});

test("switchEditPlanPlatform updates platform", () => {
  assert.equal(switchEditPlanPlatform(plan, "reel").platform, "reel");
});

test("replaceSourceAsset rejects missing source assets", () => {
  assert.throws(() => replaceSourceAsset(plan, "missing", "c"), /not found/);
});

import { existsSync, readFileSync } from "node:fs";
import { content } from "../src/content";
import { EditPlan } from "../src/edit-plan/types";
import { validateEditPlan } from "../src/edit-plan/validate";

const args = process.argv.slice(2);
const planFlagIndex = args.indexOf("--plan");
const planPath =
  planFlagIndex === -1 ? "input/edit-plan.json" : args[planFlagIndex + 1];

if (!planPath) {
  console.error("Usage: npm run validate:edit-plan -- --plan path/to/edit-plan.json");
  process.exit(1);
}

if (!existsSync(planPath)) {
  if (planFlagIndex === -1) {
    console.log("No edit plan found; edit-plan validation skipped.");
    process.exit(0);
  }
  console.error(`Edit plan file does not exist: ${planPath}`);
  process.exit(1);
}

let plan: EditPlan;
try {
  plan = JSON.parse(readFileSync(planPath, "utf-8")) as EditPlan;
} catch (error) {
  console.error(`Edit plan JSON parse failed: ${(error as Error).message}`);
  process.exit(1);
}

const result = validateEditPlan(plan);
const errors = [...result.errors];
const assetIds = new Set(content.assets?.assets.map((asset) => asset.id) ?? []);

for (const assetId of plan.sourceAssetIds ?? []) {
  if (!assetIds.has(assetId)) {
    errors.push(`sourceAssetIds: missing asset in content.assets: ${assetId}`);
  }
}

if (errors.length > 0) {
  console.error("Edit plan validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Edit plan validation passed: ${planPath}`);

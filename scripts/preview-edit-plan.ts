import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { spawnSync } from "node:child_process";
import { content } from "../src/content";
import { EditPlan } from "../src/edit-plan/types";
import { planEditTimeline } from "../src/edit-plan/ruleBasedPlanner";

const args = process.argv.slice(2);
const planIndex = args.indexOf("--plan");
const outIndex = args.indexOf("--out");
const frameIndex = args.indexOf("--frame");
const planPath = planIndex === -1 ? undefined : args[planIndex + 1];
const outPath =
  outIndex === -1 ? "output/edit-plan-preview.png" : args[outIndex + 1];
const frame = frameIndex === -1 ? "0" : args[frameIndex + 1];

if (!planPath || !outPath || !frame) {
  console.error(
    "Usage: npm run preview:edit-plan -- --plan input/edit-plan.json --out output/edit-plan-preview.png [--frame 0]",
  );
  process.exit(1);
}

let plan: EditPlan;
try {
  plan = JSON.parse(readFileSync(planPath, "utf-8")) as EditPlan;
} catch (error) {
  console.error(`Edit plan JSON parse failed: ${(error as Error).message}`);
  process.exit(1);
}

try {
  mkdirSync(dirname(outPath), { recursive: true });
  mkdirSync("output", { recursive: true });

  const timeline = planEditTimeline(plan, content.assets ?? { assets: [] }, {
    brand: content.brand,
    fps: content.meta.fps,
  });
  const propsPath = "output/edit-plan-preview-props.json";
  writeFileSync(propsPath, JSON.stringify({ timeline }, null, 2));

  const result = spawnSync(
    "npx",
    [
      "remotion",
      "still",
      "EditPlanPreview",
      outPath,
      "--props",
      propsPath,
      "--frame",
      frame,
      "--scale",
      "0.25",
    ],
    { stdio: "inherit" },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  console.log(`Edit plan preview wrote ${outPath}`);
} catch (error) {
  console.error(`Edit plan preview failed: ${(error as Error).message}`);
  process.exit(1);
}

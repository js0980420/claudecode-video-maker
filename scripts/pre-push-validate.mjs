import { spawnSync } from "node:child_process";

const steps = [
  ["npm", ["run", "validate:bootstrap"]],
  ["npm", ["run", "validate:content"]],
  ["npm", ["run", "validate:tutorial"]],
  ["npm", ["run", "validate:voiceover"]],
  ["npm", ["run", "validate:edit-plan"]],
  ["npm", ["run", "validate:assets"]],
  ["npm", ["run", "smoke:media-scenes"]],
  ["npm", ["run", "smoke:3d-scenes"]],
  ["npm", ["run", "smoke:frame-fit"]],
  ["npm", ["run", "lint"]],
  [
    "npx",
    [
      "tsx",
      "--test",
      "src/edit-plan/aiHooks.test.ts",
      "src/edit-plan/iterations.test.ts",
      "src/edit-plan/ruleBasedPlanner.test.ts",
      "src/edit-plan/validate.test.ts",
      "src/tutorial/steps-data.test.ts",
      "src/timeline/subtitles.test.ts",
      "src/utils/audioDucking.test.ts",
      "src/utils/colorAdjustments.test.ts",
      "src/utils/cropPresets.test.ts",
      "src/utils/speedRamp.test.ts",
      "src/utils/threeCamera.test.ts",
      "src/utils/threePresets.test.ts",
      "src/utils/timingMarkers.test.ts",
    ],
  ],
];

for (const [command, args] of steps) {
  console.log(`\n$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\npre-push validation failed: ${command} ${args.join(" ")}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\npre-push validation passed.");

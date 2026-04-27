import { spawnSync } from "node:child_process";

const steps = [
  ["npm", ["run", "validate:bootstrap"]],
  ["npm", ["run", "validate:content"]],
  ["npm", ["run", "validate:tutorial"]],
  ["npm", ["run", "validate:assets"]],
  ["npm", ["run", "smoke:media-scenes"]],
  ["npm", ["run", "lint"]],
  ["npx", ["tsx", "--test", "src/tutorial/steps-data.test.ts", "src/timeline/subtitles.test.ts"]],
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

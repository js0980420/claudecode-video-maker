import { existsSync } from "node:fs";
import { join } from "node:path";

const requiredFiles = [
  {
    path: "src/content.ts",
    reason: "short-form content import used by Root.tsx and render scripts",
  },
  {
    path: "src/tutorial/config.ts",
    reason: "tutorial branding/config import used by Root.tsx",
  },
  {
    path: "src/tutorial/content.ts",
    reason: "tutorial steps/durations shim imported by Root.tsx",
  },
  {
    path: "public/voiceover/durations.json",
    reason: "short-form voiceover duration import used by Root.tsx",
  },
];

const missing = requiredFiles.filter((file) => !existsSync(join(process.cwd(), file.path)));

if (missing.length > 0) {
  console.error("Bootstrap validation failed. Missing generated local files:");
  for (const file of missing) {
    console.error(`- ${file.path}: ${file.reason}`);
  }
  console.error("");
  console.error("Run `npm install` or `node scripts/init-content.mjs` to create them.");
  process.exit(1);
}

console.log("Bootstrap validation passed.");

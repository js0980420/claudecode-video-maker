// Postinstall: copy content.example.ts to content.ts on first install,
// and create an empty durations.json so the bundle compiles even before
// any voiceover has been generated.

import { existsSync, copyFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const contentTarget = join(root, "src", "content.ts");
const contentExample = join(root, "src", "content.example.ts");

if (!existsSync(contentTarget)) {
  if (existsSync(contentExample)) {
    copyFileSync(contentExample, contentTarget);
    console.log("✓ Created src/content.ts from content.example.ts");
  } else {
    console.warn("⚠ src/content.example.ts missing — skipping content init");
  }
}

const durationsPath = join(root, "public", "voiceover", "durations.json");
if (!existsSync(durationsPath)) {
  mkdirSync(join(root, "public", "voiceover"), { recursive: true });
  writeFileSync(durationsPath, "{}\n");
  console.log("✓ Created empty public/voiceover/durations.json");
}

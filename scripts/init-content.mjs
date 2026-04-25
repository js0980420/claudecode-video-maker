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

const tutorialConfigTarget = join(root, "src", "tutorial", "config.ts");
const tutorialConfigExample = join(root, "src", "tutorial", "config.example.ts");

if (!existsSync(tutorialConfigTarget)) {
  if (existsSync(tutorialConfigExample)) {
    copyFileSync(tutorialConfigExample, tutorialConfigTarget);
    console.log("✓ Created src/tutorial/config.ts from config.example.ts");
  } else {
    console.warn("⚠ src/tutorial/config.example.ts missing — skipping tutorial config init");
  }
}

const tutorialContentTarget = join(root, "src", "tutorial", "content.ts");
const tutorialContentExample = join(root, "src", "tutorial", "content.example.ts");

if (!existsSync(tutorialContentTarget)) {
  if (existsSync(tutorialContentExample)) {
    copyFileSync(tutorialContentExample, tutorialContentTarget);
    console.log("✓ Created src/tutorial/content.ts from content.example.ts");
  } else {
    console.warn("⚠ src/tutorial/content.example.ts missing — skipping tutorial content init");
  }
}

const durationsPath = join(root, "public", "voiceover", "durations.json");
if (!existsSync(durationsPath)) {
  mkdirSync(join(root, "public", "voiceover"), { recursive: true });
  writeFileSync(durationsPath, "{}\n");
  console.log("✓ Created empty public/voiceover/durations.json");
}

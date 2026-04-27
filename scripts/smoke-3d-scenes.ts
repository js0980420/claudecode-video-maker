import { mkdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { PNG } from "pngjs";
import { content } from "../src/content";

const threeSceneIndex = content.scenes.findIndex(
  (scene) => scene.visual.type === "threeScene",
);

if (threeSceneIndex === -1) {
  console.log("No 3D scenes found; smoke check skipped.");
  process.exit(0);
}

const fps = content.meta.fps;
const frame =
  content.scenes
    .slice(0, threeSceneIndex)
    .reduce(
      (sum, scene) =>
        sum + Math.ceil((scene.durationSeconds ?? content.meta.fallbackSceneSeconds) * fps),
      0,
    ) + Math.min(fps, 15);

mkdirSync("output", { recursive: true });

const outputPath = "output/three-scene-smoke.png";
const result = spawnSync(
  "npx",
  [
    "remotion",
    "still",
    content.meta.videoName,
    outputPath,
    "--frame",
    String(frame),
    "--scale",
    "0.25",
  ],
  { stdio: "inherit" },
);

if (result.status !== 0) {
  console.error(`3D scene smoke render failed (exit ${result.status}).`);
  process.exit(result.status ?? 1);
}

const png = PNG.sync.read(readFileSync(outputPath));
let visiblePixels = 0;
let minLuma = 255;
let maxLuma = 0;

for (let i = 0; i < png.data.length; i += 4) {
  const alpha = png.data[i + 3];
  if (alpha === 0) continue;
  visiblePixels++;
  const luma = Math.round(
    png.data[i] * 0.2126 + png.data[i + 1] * 0.7152 + png.data[i + 2] * 0.0722,
  );
  minLuma = Math.min(minLuma, luma);
  maxLuma = Math.max(maxLuma, luma);
}

if (visiblePixels === 0 || maxLuma - minLuma < 4) {
  console.error(
    `3D scene smoke check failed: ${outputPath} appears blank or single-color.`,
  );
  process.exit(1);
}

console.log(`3D scene smoke check wrote ${outputPath}.`);

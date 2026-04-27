import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { content } from "../src/content";

const mediaSceneIndex = content.scenes.findIndex(
  (scene) =>
    scene.visual.type === "videoClip" ||
    scene.visual.type === "imageBackground" ||
    scene.visual.type === "brollSequence",
);

if (mediaSceneIndex === -1) {
  console.log("No media scenes found; smoke check skipped.");
  process.exit(0);
}

const fps = content.meta.fps;
const frame =
  content.scenes
    .slice(0, mediaSceneIndex)
    .reduce(
      (sum, scene) =>
        sum + Math.ceil((scene.durationSeconds ?? content.meta.fallbackSceneSeconds) * fps),
      0,
    ) + Math.min(fps, 15);

mkdirSync("output", { recursive: true });

const outputPath = "output/media-scene-smoke.png";
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
  console.error(`Media scene smoke check failed (exit ${result.status}).`);
  process.exit(result.status ?? 1);
}

console.log(`Media scene smoke check wrote ${outputPath}.`);

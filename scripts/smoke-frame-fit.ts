import { mkdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { PNG } from "pngjs";
import { content } from "../src/content";

type FrameCheck = {
  id: string;
  outputPath: string;
  frame?: number;
};

function assertNonBlankPng(path: string) {
  const png = PNG.sync.read(readFileSync(path));
  let visiblePixels = 0;
  let minLuma = 255;
  let maxLuma = 0;

  for (let i = 0; i < png.data.length; i += 4) {
    const alpha = png.data[i + 3];
    if (alpha === 0) continue;
    visiblePixels++;
    const luma = Math.round(
      png.data[i] * 0.2126 +
        png.data[i + 1] * 0.7152 +
        png.data[i + 2] * 0.0722,
    );
    minLuma = Math.min(minLuma, luma);
    maxLuma = Math.max(maxLuma, luma);
  }

  if (visiblePixels === 0 || maxLuma - minLuma < 4) {
    throw new Error(`${path} appears blank or single-color`);
  }
}

function renderStill(check: FrameCheck): "rendered" | "skipped" {
  const args = ["remotion", "still", check.id, check.outputPath, "--scale", "0.25"];
  if (check.frame !== undefined) {
    args.push("--frame", String(check.frame));
  }
  const result = spawnSync("npx", args, { encoding: "utf-8" });
  if (result.status !== 0) {
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
    if (
      output.includes("@tailwindcss/oxide") &&
      output.includes("Cannot find native binding")
    ) {
      console.warn(
        "Frame fit smoke check skipped: Tailwind native binding is unavailable in this Node/npm environment.",
      );
      return "skipped";
    }
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(`Frame fit render failed for ${check.id} (exit ${result.status})`);
  }
  assertNonBlankPng(check.outputPath);
  return "rendered";
}

mkdirSync("output", { recursive: true });

const checks: FrameCheck[] = [
  {
    id: content.meta.videoName,
    outputPath: "output/frame-fit-desktop.png",
    frame: Math.min(content.meta.fps, 15),
  },
];

if (content.thumbnails.reel) {
  checks.push({
    id: "ThumbnailReel",
    outputPath: "output/frame-fit-mobile-reel.png",
  });
}

try {
  for (const check of checks) {
    const result = renderStill(check);
    if (result === "skipped") process.exit(0);
  }
} catch (error) {
  console.error(`Frame fit smoke check failed: ${(error as Error).message}`);
  process.exit(1);
}

console.log(`Frame fit smoke check passed (${checks.length} stills).`);

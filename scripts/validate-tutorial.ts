import { createRequire } from "node:module";
import { TUTORIAL_DURATIONS, TUTORIAL_STEPS_JSON } from "../src/tutorial/content";
import { parseTutorialData } from "../src/tutorial/steps-data";

const requireWithAssets = createRequire(import.meta.url);
for (const ext of [".png", ".jpg", ".jpeg", ".webp", ".svg"]) {
  requireWithAssets.extensions[ext] = (module, filename) => {
    module.exports = filename;
  };
}

const { TUTORIAL_CONFIG } = requireWithAssets("../src/tutorial/config");

const errors: string[] = [];
const warnings: string[] = [];

function fail(path: string, message: string) {
  errors.push(`${path}: ${message}`);
}

function warn(path: string, message: string) {
  warnings.push(`${path}: ${message}`);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

try {
  const data = parseTutorialData(TUTORIAL_STEPS_JSON);

  if (TUTORIAL_CONFIG.videoName === "your-video-name") {
    warn("TUTORIAL_CONFIG.videoName", "still uses the default placeholder value");
  }
  if (!isNonEmptyString(TUTORIAL_CONFIG.videoName)) {
    fail("TUTORIAL_CONFIG.videoName", "must be a non-empty string");
  }
  if (!isHexColor(TUTORIAL_CONFIG.accentColor)) {
    fail("TUTORIAL_CONFIG.accentColor", "must be a #RRGGBB hex color");
  }
  if (!isNonEmptyString(TUTORIAL_CONFIG.intro.titleAccent)) {
    fail("TUTORIAL_CONFIG.intro.titleAccent", "must be a non-empty string");
  }
  if (!isNonEmptyString(TUTORIAL_CONFIG.intro.titleSuffix)) {
    fail("TUTORIAL_CONFIG.intro.titleSuffix", "must be a non-empty string");
  }
  if (TUTORIAL_CONFIG.intro.platform) {
    if (!isNonEmptyString(TUTORIAL_CONFIG.intro.platform.icon)) {
      fail("TUTORIAL_CONFIG.intro.platform.icon", "must be a non-empty string");
    }
    if (!isNonEmptyString(TUTORIAL_CONFIG.intro.platform.label)) {
      fail("TUTORIAL_CONFIG.intro.platform.label", "must be a non-empty string");
    }
  }
  if (TUTORIAL_CONFIG.outro) {
    if (!isNonEmptyString(TUTORIAL_CONFIG.outro.title)) {
      fail("TUTORIAL_CONFIG.outro.title", "must be a non-empty string");
    }
    if (
      TUTORIAL_CONFIG.outro.subtitle !== undefined &&
      !isNonEmptyString(TUTORIAL_CONFIG.outro.subtitle)
    ) {
      fail("TUTORIAL_CONFIG.outro.subtitle", "must be non-empty when provided");
    }
    if (
      TUTORIAL_CONFIG.outro.nextChapter !== undefined &&
      !isNonEmptyString(TUTORIAL_CONFIG.outro.nextChapter)
    ) {
      fail("TUTORIAL_CONFIG.outro.nextChapter", "must be non-empty when provided");
    }
  }
  if (TUTORIAL_CONFIG.watermark) {
    if (!isNonEmptyString(TUTORIAL_CONFIG.watermark.src)) {
      fail("TUTORIAL_CONFIG.watermark.src", "must be a non-empty string");
    }
    if (
      TUTORIAL_CONFIG.watermark.size !== undefined &&
      (!Number.isFinite(TUTORIAL_CONFIG.watermark.size) || TUTORIAL_CONFIG.watermark.size <= 0)
    ) {
      fail("TUTORIAL_CONFIG.watermark.size", "must be a positive number when provided");
    }
  }

  const thumb = TUTORIAL_CONFIG.thumbnail.content;
  if (!Array.isArray(thumb.titleParts) || thumb.titleParts.length !== 3) {
    fail("TUTORIAL_CONFIG.thumbnail.content.titleParts", "must contain exactly three strings");
  }
  if (!Array.isArray(thumb.features) || thumb.features.length === 0) {
    fail("TUTORIAL_CONFIG.thumbnail.content.features", "must be a non-empty array");
  }
  if (!isNonEmptyString(thumb.tagline)) {
    fail("TUTORIAL_CONFIG.thumbnail.content.tagline", "must be a non-empty string");
  }
  if (!isNonEmptyString(thumb.brand)) {
    fail("TUTORIAL_CONFIG.thumbnail.content.brand", "must be a non-empty string");
  }

  for (const [key, value] of Object.entries(TUTORIAL_DURATIONS)) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      fail(`TUTORIAL_DURATIONS.${key}`, "must be a non-negative finite number");
    }
  }

  for (const step of data.steps) {
    const pages = step.blocks.filter((block) => block.type === "pageBreak").length + 1;
    if (step.voiceovers && step.voiceovers.length > pages) {
      fail(`steps.${step.id}.voiceovers`, "has more entries than page count");
    }
  }

  if (data.steps.some((step) => step.id === "placeholder-s1")) {
    warn("TUTORIAL_STEPS_JSON", "still uses the default placeholder tutorial content");
  }
} catch (error) {
  fail("TUTORIAL_STEPS_JSON", (error as Error).message);
}

if (warnings.length > 0) {
  console.warn("Tutorial validation warnings:");
  warnings.forEach((message) => console.warn(`- ${message}`));
}

if (errors.length > 0) {
  console.error("Tutorial validation failed:");
  errors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Tutorial validation passed.");

import { content } from "../src/content";
import { SceneConfig, ThumbnailContent } from "../src/types";

const errors: string[] = [];

function fail(path: string, message: string) {
  errors.push(`${path}: ${message}`);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function validateThumbnail(path: string, thumbnail: ThumbnailContent) {
  if (!Array.isArray(thumbnail.titleParts) || thumbnail.titleParts.length !== 3) {
    fail(`${path}.titleParts`, "must contain exactly three strings");
  } else {
    thumbnail.titleParts.forEach((part, i) => {
      if (!isNonEmptyString(part)) fail(`${path}.titleParts[${i}]`, "must be a non-empty string");
    });
  }
  if (!Array.isArray(thumbnail.features) || thumbnail.features.length === 0) {
    fail(`${path}.features`, "must be a non-empty string array");
  } else {
    thumbnail.features.forEach((feature, i) => {
      if (!isNonEmptyString(feature)) fail(`${path}.features[${i}]`, "must be a non-empty string");
    });
  }
  if (!isNonEmptyString(thumbnail.tagline)) fail(`${path}.tagline`, "must be a non-empty string");
  if (!isNonEmptyString(thumbnail.brand)) fail(`${path}.brand`, "must be a non-empty string");
}

function validateScene(scene: SceneConfig, index: number) {
  const path = `scenes[${index}]`;
  if (!isNonEmptyString(scene.id)) fail(`${path}.id`, "must be a non-empty string");
  if (!isNonEmptyString(scene.title)) fail(`${path}.title`, "must be a non-empty string");
  if (scene.description !== undefined && !isNonEmptyString(scene.description)) {
    fail(`${path}.description`, "must be a non-empty string when provided");
  }
  if (scene.voiceover !== undefined && !isNonEmptyString(scene.voiceover)) {
    fail(`${path}.voiceover`, "must be a non-empty string when provided");
  }
  if (scene.durationSeconds !== undefined && !isPositiveNumber(scene.durationSeconds)) {
    fail(`${path}.durationSeconds`, "must be a positive number when provided");
  }

  switch (scene.visual.type) {
    case "centerText":
      break;
    case "iconPair":
      if (!scene.visual.left) fail(`${path}.visual.left`, "is required");
      if (!scene.visual.right) fail(`${path}.visual.right`, "is required");
      if (
        scene.visual.connector !== undefined &&
        scene.visual.connector !== "+" &&
        scene.visual.connector !== "→" &&
        scene.visual.connector !== "&"
      ) {
        fail(`${path}.visual.connector`, "must be +, →, or &");
      }
      break;
    case "crossedItems":
      if (!scene.visual.left) fail(`${path}.visual.left`, "is required");
      if (!scene.visual.right) fail(`${path}.visual.right`, "is required");
      break;
    case "terminal":
      if (!Array.isArray(scene.visual.lines) || scene.visual.lines.length === 0) {
        fail(`${path}.visual.lines`, "must be a non-empty array");
      } else {
        scene.visual.lines.forEach((line, i) => {
          if (!isNonEmptyString(line.text)) fail(`${path}.visual.lines[${i}].text`, "must be non-empty");
        });
      }
      break;
    case "chatBox":
      if (!Array.isArray(scene.visual.messages) || scene.visual.messages.length === 0) {
        fail(`${path}.visual.messages`, "must be a non-empty array");
      } else {
        scene.visual.messages.forEach((message, i) => {
          if (message.role !== "user" && message.role !== "assistant") {
            fail(`${path}.visual.messages[${i}].role`, "must be user or assistant");
          }
          if (!isNonEmptyString(message.text)) {
            fail(`${path}.visual.messages[${i}].text`, "must be non-empty");
          }
        });
      }
      break;
    case "phoneCTA":
      for (const key of ["senderName", "senderInitial", "messagePreview", "ctaText"] as const) {
        if (!isNonEmptyString(scene.visual[key])) fail(`${path}.visual.${key}`, "must be non-empty");
      }
      break;
    case "videoClip":
      if (!isNonEmptyString(scene.visual.assetId)) {
        fail(`${path}.visual.assetId`, "must be a non-empty asset id");
      }
      if (
        scene.visual.fit !== undefined &&
        scene.visual.fit !== "cover" &&
        scene.visual.fit !== "contain"
      ) {
        fail(`${path}.visual.fit`, "must be cover or contain");
      }
      break;
  }
}

if (!isNonEmptyString(content.meta.videoName)) fail("meta.videoName", "must be a non-empty string");
if (!isPositiveNumber(content.meta.width)) fail("meta.width", "must be a positive number");
if (!isPositiveNumber(content.meta.height)) fail("meta.height", "must be a positive number");
if (!isPositiveNumber(content.meta.fps)) fail("meta.fps", "must be a positive number");
if (!isPositiveNumber(content.meta.sceneTailSeconds)) {
  fail("meta.sceneTailSeconds", "must be a positive number");
}
if (!isPositiveNumber(content.meta.fallbackSceneSeconds)) {
  fail("meta.fallbackSceneSeconds", "must be a positive number");
}

if (!isNonEmptyString(content.brand.name)) fail("brand.name", "must be a non-empty string");
if (content.brand.subtitle !== undefined && !isNonEmptyString(content.brand.subtitle)) {
  fail("brand.subtitle", "must be a non-empty string when provided");
}
if (!isHexColor(content.brand.primaryColor)) fail("brand.primaryColor", "must be a #RRGGBB hex color");

if (!Array.isArray(content.scenes) || content.scenes.length === 0) {
  fail("scenes", "must be a non-empty array");
} else {
  const ids = new Set<string>();
  content.scenes.forEach((scene, i) => {
    validateScene(scene, i);
    if (ids.has(scene.id)) fail(`scenes[${i}].id`, `duplicate scene id: ${scene.id}`);
    ids.add(scene.id);
  });
}

if (typeof content.voiceover.enabled !== "boolean") {
  fail("voiceover.enabled", "must be boolean");
}
if (content.voiceover.enabled) {
  const missing = content.scenes.filter((scene) => !scene.voiceover).map((scene) => scene.id);
  if (missing.length > 0) {
    fail("voiceover", `enabled but scenes are missing voiceover text: ${missing.join(", ")}`);
  }
}

if (typeof content.bgm.enabled !== "boolean") fail("bgm.enabled", "must be boolean");
if (content.bgm.enabled && !isNonEmptyString(content.bgm.file)) {
  fail("bgm.file", "must be set when bgm.enabled is true");
}
if (content.bgm.volume !== undefined && (content.bgm.volume < 0 || content.bgm.volume > 1)) {
  fail("bgm.volume", "must be between 0 and 1");
}

if (content.thumbnails.yt) validateThumbnail("thumbnails.yt", content.thumbnails.yt);
if (content.thumbnails.ig) validateThumbnail("thumbnails.ig", content.thumbnails.ig);
if (content.thumbnails.reel) validateThumbnail("thumbnails.reel", content.thumbnails.reel);

if (errors.length > 0) {
  console.error("Short-form content validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Short-form content validation passed.");

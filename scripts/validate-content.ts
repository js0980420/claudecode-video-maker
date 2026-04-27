import { content } from "../src/content";
import { SceneConfig, ThumbnailContent } from "../src/types";
import { isCropPreset } from "../src/utils/cropPresets";

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

function validateSpeedRamp(
  path: string,
  speedRamp: unknown,
  options: { hasPlaybackRate?: boolean; hasEndAtSeconds?: boolean } = {},
) {
  if (speedRamp === undefined) return;
  if (!Array.isArray(speedRamp) || speedRamp.length === 0) {
    fail(path, "must be a non-empty array when provided");
    return;
  }
  if (options.hasPlaybackRate) {
    fail(path, "cannot be combined with playbackRate");
  }
  if (options.hasEndAtSeconds) {
    fail(path, "cannot be combined with endAtSeconds");
  }
  speedRamp.forEach((segment, i) => {
    const segmentPath = `${path}[${i}]`;
    if (
      typeof segment !== "object" ||
      segment === null ||
      !("durationSeconds" in segment) ||
      !isPositiveNumber((segment as { durationSeconds?: unknown }).durationSeconds)
    ) {
      fail(`${segmentPath}.durationSeconds`, "must be a positive number");
    }
    if (
      typeof segment !== "object" ||
      segment === null ||
      !("playbackRate" in segment) ||
      !isPositiveNumber((segment as { playbackRate?: unknown }).playbackRate)
    ) {
      fail(`${segmentPath}.playbackRate`, "must be a positive number");
    }
  });
}

function validateColorAdjustment(path: string, adjustment: unknown) {
  if (adjustment === undefined) return;
  if (typeof adjustment !== "object" || adjustment === null || Array.isArray(adjustment)) {
    fail(path, "must be an object when provided");
    return;
  }
  const values = adjustment as Record<string, unknown>;
  for (const key of ["brightness", "contrast", "saturation"] as const) {
    const value = values[key];
    if (
      value !== undefined &&
      (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 2)
    ) {
      fail(`${path}.${key}`, "must be a number between 0 and 2");
    }
  }
  const vignette = values.vignette;
  if (
    vignette !== undefined &&
    (typeof vignette !== "number" || !Number.isFinite(vignette) || vignette < 0 || vignette > 1)
  ) {
    fail(`${path}.vignette`, "must be a number between 0 and 1");
  }
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
      if (
        scene.visual.cropPreset !== undefined &&
        !isCropPreset(scene.visual.cropPreset)
      ) {
        fail(`${path}.visual.cropPreset`, "must be 16:9, 1:1, 4:5, or 9:16");
      }
      if (
        scene.visual.startFromSeconds !== undefined &&
        scene.visual.startFromSeconds < 0
      ) {
        fail(`${path}.visual.startFromSeconds`, "must be >= 0");
      }
      if (
        scene.visual.endAtSeconds !== undefined &&
        scene.visual.endAtSeconds <= 0
      ) {
        fail(`${path}.visual.endAtSeconds`, "must be > 0");
      }
      if (
        scene.visual.startFromSeconds !== undefined &&
        scene.visual.endAtSeconds !== undefined &&
        scene.visual.endAtSeconds <= scene.visual.startFromSeconds
      ) {
        fail(`${path}.visual.endAtSeconds`, "must be greater than startFromSeconds");
      }
      if (
        scene.visual.playbackRate !== undefined &&
        scene.visual.playbackRate <= 0
      ) {
        fail(`${path}.visual.playbackRate`, "must be > 0");
      }
      validateSpeedRamp(`${path}.visual.speedRamp`, scene.visual.speedRamp, {
        hasPlaybackRate: scene.visual.playbackRate !== undefined,
        hasEndAtSeconds: scene.visual.endAtSeconds !== undefined,
      });
      validateColorAdjustment(
        `${path}.visual.colorAdjustment`,
        scene.visual.colorAdjustment,
      );
      if (
        scene.visual.volume !== undefined &&
        (scene.visual.volume < 0 || scene.visual.volume > 1)
      ) {
        fail(`${path}.visual.volume`, "must be between 0 and 1");
      }
      if (
        scene.visual.muted !== undefined &&
        typeof scene.visual.muted !== "boolean"
      ) {
        fail(`${path}.visual.muted`, "must be boolean");
      }
      break;
    case "imageBackground":
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
      if (
        scene.visual.cropPreset !== undefined &&
        !isCropPreset(scene.visual.cropPreset)
      ) {
        fail(`${path}.visual.cropPreset`, "must be 16:9, 1:1, 4:5, or 9:16");
      }
      if (
        scene.visual.dim !== undefined &&
        (scene.visual.dim < 0 || scene.visual.dim > 0.8)
      ) {
        fail(`${path}.visual.dim`, "must be between 0 and 0.8");
      }
      validateColorAdjustment(
        `${path}.visual.colorAdjustment`,
        scene.visual.colorAdjustment,
      );
      break;
    case "brollSequence":
      if (!Array.isArray(scene.visual.items) || scene.visual.items.length === 0) {
        fail(`${path}.visual.items`, "must be a non-empty array");
      } else {
        scene.visual.items.forEach((item, i) => {
          const itemPath = `${path}.visual.items[${i}]`;
          if (!isNonEmptyString(item.assetId)) {
            fail(`${itemPath}.assetId`, "must be a non-empty asset id");
          }
          if (
            item.fit !== undefined &&
            item.fit !== "cover" &&
            item.fit !== "contain"
          ) {
            fail(`${itemPath}.fit`, "must be cover or contain");
          }
          if (
            item.durationSeconds !== undefined &&
            !isPositiveNumber(item.durationSeconds)
          ) {
            fail(`${itemPath}.durationSeconds`, "must be a positive number when provided");
          }
          if (
            item.startFromSeconds !== undefined &&
            item.startFromSeconds < 0
          ) {
            fail(`${itemPath}.startFromSeconds`, "must be >= 0");
          }
          if (
            item.endAtSeconds !== undefined &&
            item.endAtSeconds <= 0
          ) {
            fail(`${itemPath}.endAtSeconds`, "must be > 0");
          }
          if (
            item.startFromSeconds !== undefined &&
            item.endAtSeconds !== undefined &&
            item.endAtSeconds <= item.startFromSeconds
          ) {
            fail(`${itemPath}.endAtSeconds`, "must be greater than startFromSeconds");
          }
          if (
            item.playbackRate !== undefined &&
            item.playbackRate <= 0
          ) {
            fail(`${itemPath}.playbackRate`, "must be > 0");
          }
          validateSpeedRamp(`${itemPath}.speedRamp`, item.speedRamp, {
            hasPlaybackRate: item.playbackRate !== undefined,
            hasEndAtSeconds: item.endAtSeconds !== undefined,
          });
          validateColorAdjustment(`${itemPath}.colorAdjustment`, item.colorAdjustment);
          if (
            item.volume !== undefined &&
            (item.volume < 0 || item.volume > 1)
          ) {
            fail(`${itemPath}.volume`, "must be between 0 and 1");
          }
          if (
            item.muted !== undefined &&
            typeof item.muted !== "boolean"
          ) {
            fail(`${itemPath}.muted`, "must be boolean");
          }
          if (item.caption !== undefined && !isNonEmptyString(item.caption)) {
            fail(`${itemPath}.caption`, "must be a non-empty string when provided");
          }
        });
      }
      if (
        scene.visual.fit !== undefined &&
        scene.visual.fit !== "cover" &&
        scene.visual.fit !== "contain"
      ) {
        fail(`${path}.visual.fit`, "must be cover or contain");
      }
      if (
        scene.visual.cropPreset !== undefined &&
        !isCropPreset(scene.visual.cropPreset)
      ) {
        fail(`${path}.visual.cropPreset`, "must be 16:9, 1:1, 4:5, or 9:16");
      }
      validateColorAdjustment(
        `${path}.visual.colorAdjustment`,
        scene.visual.colorAdjustment,
      );
      break;
    case "talkingHead":
      if (!isNonEmptyString(scene.visual.speakerAssetId)) {
        fail(`${path}.visual.speakerAssetId`, "must be a non-empty video asset id");
      }
      if (
        scene.visual.supportingAssetId !== undefined &&
        !isNonEmptyString(scene.visual.supportingAssetId)
      ) {
        fail(`${path}.visual.supportingAssetId`, "must be non-empty when provided");
      }
      if (
        scene.visual.layout !== undefined &&
        scene.visual.layout !== "full" &&
        scene.visual.layout !== "split" &&
        scene.visual.layout !== "pictureInPicture"
      ) {
        fail(`${path}.visual.layout`, "must be full, split, or pictureInPicture");
      }
      if (
        scene.visual.fit !== undefined &&
        scene.visual.fit !== "cover" &&
        scene.visual.fit !== "contain"
      ) {
        fail(`${path}.visual.fit`, "must be cover or contain");
      }
      if (
        scene.visual.cropPreset !== undefined &&
        !isCropPreset(scene.visual.cropPreset)
      ) {
        fail(`${path}.visual.cropPreset`, "must be 16:9, 1:1, 4:5, or 9:16");
      }
      if (
        scene.visual.startFromSeconds !== undefined &&
        scene.visual.startFromSeconds < 0
      ) {
        fail(`${path}.visual.startFromSeconds`, "must be >= 0");
      }
      if (
        scene.visual.endAtSeconds !== undefined &&
        scene.visual.endAtSeconds <= 0
      ) {
        fail(`${path}.visual.endAtSeconds`, "must be > 0");
      }
      if (
        scene.visual.startFromSeconds !== undefined &&
        scene.visual.endAtSeconds !== undefined &&
        scene.visual.endAtSeconds <= scene.visual.startFromSeconds
      ) {
        fail(`${path}.visual.endAtSeconds`, "must be greater than startFromSeconds");
      }
      if (
        scene.visual.playbackRate !== undefined &&
        scene.visual.playbackRate <= 0
      ) {
        fail(`${path}.visual.playbackRate`, "must be > 0");
      }
      validateSpeedRamp(`${path}.visual.speedRamp`, scene.visual.speedRamp, {
        hasPlaybackRate: scene.visual.playbackRate !== undefined,
        hasEndAtSeconds: scene.visual.endAtSeconds !== undefined,
      });
      validateColorAdjustment(
        `${path}.visual.colorAdjustment`,
        scene.visual.colorAdjustment,
      );
      if (
        scene.visual.volume !== undefined &&
        (scene.visual.volume < 0 || scene.visual.volume > 1)
      ) {
        fail(`${path}.visual.volume`, "must be between 0 and 1");
      }
      if (
        scene.visual.muted !== undefined &&
        typeof scene.visual.muted !== "boolean"
      ) {
        fail(`${path}.visual.muted`, "must be boolean");
      }
      if (
        scene.visual.speakerName !== undefined &&
        !isNonEmptyString(scene.visual.speakerName)
      ) {
        fail(`${path}.visual.speakerName`, "must be a non-empty string when provided");
      }
      if (
        scene.visual.speakerRole !== undefined &&
        !isNonEmptyString(scene.visual.speakerRole)
      ) {
        fail(`${path}.visual.speakerRole`, "must be a non-empty string when provided");
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

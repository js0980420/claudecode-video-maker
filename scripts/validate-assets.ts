import { existsSync } from "node:fs";
import { join, normalize } from "node:path";
import { content } from "../src/content";
import { AssetManifest, AssetKind, MediaAsset } from "../src/types";

const errors: string[] = [];
const manifest = (content as { assets?: AssetManifest }).assets ?? { assets: [] };
const validKinds = new Set<AssetKind>([
  "image",
  "video",
  "audio",
  "model3d",
  "texture",
  "font",
]);

function fail(path: string, message: string) {
  errors.push(`${path}: ${message}`);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSafePublicPath(src: string) {
  const normalized = normalize(src);
  return (
    normalized === src &&
    !src.startsWith("/") &&
    !src.startsWith("\\") &&
    !src.includes("..") &&
    !/^[a-zA-Z]:/.test(src)
  );
}

function validateAsset(asset: MediaAsset, index: number) {
  const path = `assets[${index}]`;
  if (!isNonEmptyString(asset.id)) fail(`${path}.id`, "must be a non-empty string");
  if (!validKinds.has(asset.kind)) fail(`${path}.kind`, `must be one of ${Array.from(validKinds).join(", ")}`);
  if (!isNonEmptyString(asset.src)) {
    fail(`${path}.src`, "must be a non-empty public-relative path");
  } else {
    if (!isSafePublicPath(asset.src)) {
      fail(`${path}.src`, "must be a safe path relative to public/");
    } else if (!existsSync(join(process.cwd(), "public", asset.src))) {
      fail(`${path}.src`, `file does not exist under public/: ${asset.src}`);
    }
  }
  if (asset.tags !== undefined) {
    if (!Array.isArray(asset.tags)) {
      fail(`${path}.tags`, "must be a string array when provided");
    } else {
      asset.tags.forEach((tag, i) => {
        if (!isNonEmptyString(tag)) fail(`${path}.tags[${i}]`, "must be a non-empty string");
      });
    }
  }
  if (asset.kind === "font" && !isNonEmptyString(asset.family)) {
    fail(`${path}.family`, "must be set for font assets");
  }
}

if (!Array.isArray(manifest.assets)) {
  fail("assets", "must contain an assets array");
} else {
  const ids = new Set<string>();
  manifest.assets.forEach((asset, i) => {
    validateAsset(asset, i);
    if (ids.has(asset.id)) fail(`assets[${i}].id`, `duplicate asset id: ${asset.id}`);
    ids.add(asset.id);
  });
}

if (errors.length > 0) {
  console.error("Asset validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Asset validation passed (${manifest.assets.length} assets).`);

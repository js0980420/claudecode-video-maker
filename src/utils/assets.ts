import { AssetKind, AssetManifest, MediaAsset } from "../types";

export const EMPTY_ASSET_MANIFEST: AssetManifest = { assets: [] };

export function getAssets(manifest?: AssetManifest): MediaAsset[] {
  return manifest?.assets ?? EMPTY_ASSET_MANIFEST.assets;
}

export function findAsset(
  manifest: AssetManifest | undefined,
  id: string,
  kind?: AssetKind,
): MediaAsset | null {
  const asset = getAssets(manifest).find((item) => item.id === id);
  if (!asset) return null;
  if (kind && asset.kind !== kind) return null;
  return asset;
}

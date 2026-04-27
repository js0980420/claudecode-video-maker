import { CropPreset } from "../types";

const ASPECT_RATIOS: Record<CropPreset, number> = {
  "16:9": 16 / 9,
  "1:1": 1,
  "4:5": 4 / 5,
  "9:16": 9 / 16,
};

export function isCropPreset(value: unknown): value is CropPreset {
  return (
    value === "16:9" ||
    value === "1:1" ||
    value === "4:5" ||
    value === "9:16"
  );
}

export function dimensionsForCropPreset(
  maxWidth: number,
  maxHeight: number,
  preset?: CropPreset,
) {
  if (!preset) return { width: maxWidth, height: maxHeight };
  const target = ASPECT_RATIOS[preset];
  const maxAspect = maxWidth / maxHeight;
  if (target >= maxAspect) {
    return {
      width: maxWidth,
      height: Math.round(maxWidth / target),
    };
  }
  return {
    width: Math.round(maxHeight * target),
    height: maxHeight,
  };
}

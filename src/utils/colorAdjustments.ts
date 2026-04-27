import { ColorAdjustment } from "../types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function colorAdjustmentFilter(adjustment?: ColorAdjustment): string {
  if (!adjustment) return "none";
  const brightness = clamp(adjustment.brightness ?? 1, 0, 2);
  const contrast = clamp(adjustment.contrast ?? 1, 0, 2);
  const saturation = clamp(adjustment.saturation ?? 1, 0, 2);
  return `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`;
}

export function vignetteBackground(adjustment?: ColorAdjustment): string | null {
  const amount = clamp(adjustment?.vignette ?? 0, 0, 1);
  if (amount === 0) return null;
  return `radial-gradient(circle at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${amount}) 100%)`;
}

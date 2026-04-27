import { ThreeEnvironmentPreset, ThreeLightingPreset } from "../types";

export function isThreeLightingPreset(value: unknown): value is ThreeLightingPreset {
  return (
    value === "studio" ||
    value === "soft" ||
    value === "dramatic" ||
    value === "product"
  );
}

export function isThreeEnvironmentPreset(
  value: unknown,
): value is ThreeEnvironmentPreset {
  return value === "dark" || value === "warm" || value === "cool" || value === "white";
}

export function backgroundForEnvironmentPreset(
  preset: ThreeEnvironmentPreset | undefined,
) {
  if (preset === "warm") return "#211914";
  if (preset === "cool") return "#111B24";
  if (preset === "white") return "#F6F7F9";
  return "#090A0F";
}

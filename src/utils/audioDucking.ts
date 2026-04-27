import { AudioDuckingConfig } from "../types";

export type AudioDuckingRange = {
  from: number;
  to: number;
};

export function duckingMultiplierAtFrame(
  frame: number,
  ranges: AudioDuckingRange[],
  config?: AudioDuckingConfig,
): number {
  if (!config?.enabled || ranges.length === 0) return 1;

  const ducked = Math.max(0, Math.min(1, config.volumeMultiplier ?? 0.35));
  const attackFrames = Math.max(0, config.attackFrames ?? 12);
  const releaseFrames = Math.max(0, config.releaseFrames ?? 18);

  return ranges.reduce((current, range) => {
    if (frame < range.from - attackFrames || frame > range.to + releaseFrames) {
      return current;
    }
    if (frame < range.from) {
      const progress = attackFrames === 0 ? 1 : (frame - (range.from - attackFrames)) / attackFrames;
      return Math.min(current, 1 - (1 - ducked) * progress);
    }
    if (frame <= range.to) {
      return Math.min(current, ducked);
    }
    const progress = releaseFrames === 0 ? 1 : (frame - range.to) / releaseFrames;
    return Math.min(current, ducked + (1 - ducked) * progress);
  }, 1);
}

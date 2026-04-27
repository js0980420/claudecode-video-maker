import React from "react";
import { AbsoluteFill, Img, Sequence, staticFile, useVideoConfig } from "remotion";
import {
  AssetManifest,
  BrollSequenceItem,
  ColorAdjustment,
  MediaAsset,
} from "../../types";
import { findAsset } from "../../utils/assets";
import {
  colorAdjustmentFilter,
  vignetteBackground,
} from "../../utils/colorAdjustments";
import { dimensionsForCropPreset } from "../../utils/cropPresets";
import { speedRampDurationSeconds } from "../../utils/speedRamp";
import { parseHighlights } from "../../utils/parseHighlights";
import { BLACK, WHITE } from "../../constants";
import { SpeedRampedVideo } from "./SpeedRampedVideo";

const MISSING_COLOR = "#E63946";
const WIDTH = 1100;
const HEIGHT = 520;

function durationForItem(
  item: BrollSequenceItem,
  fps: number,
): number | null {
  if (item.durationSeconds !== undefined) {
    return Math.ceil(item.durationSeconds * fps);
  }
  if (item.speedRamp && item.speedRamp.length > 0) {
    return Math.ceil(speedRampDurationSeconds(item.speedRamp) * fps);
  }
  if (
    item.startFromSeconds !== undefined &&
    item.endAtSeconds !== undefined &&
    item.endAtSeconds > item.startFromSeconds
  ) {
    const playbackRate = item.playbackRate ?? 1;
    return Math.ceil(((item.endAtSeconds - item.startFromSeconds) / playbackRate) * fps);
  }
  return null;
}

function itemDurations(
  items: BrollSequenceItem[],
  fps: number,
  sceneDuration: number,
): number[] {
  const explicit = items.map((item) => durationForItem(item, fps));
  const explicitTotal = explicit.reduce<number>(
    (sum, frames) => sum + (frames ?? 0),
    0,
  );
  const implicitCount = explicit.filter((frames) => frames === null).length;
  if (implicitCount === 0) {
    return explicit.map((frames) => Math.max(1, frames ?? 1));
  }
  const fallback = Math.max(
    1,
    Math.floor(Math.max(1, sceneDuration - explicitTotal) / implicitCount),
  );
  return explicit.map((frames) => Math.max(1, frames ?? fallback));
}

const MissingAsset: React.FC<{ assetId: string }> = ({ assetId }) => (
  <AbsoluteFill
    style={{
      background: "#FFF5F5",
      color: MISSING_COLOR,
      border: `3px solid ${MISSING_COLOR}`,
      justifyContent: "center",
      alignItems: "center",
      gap: 18,
    }}
  >
    <div style={{ fontSize: 34, fontWeight: 900 }}>MISSING B-ROLL ASSET</div>
    <div style={{ fontSize: 24, fontWeight: 700 }}>{assetId}</div>
    <div style={{ fontSize: 18 }}>Check content.assets.</div>
  </AbsoluteFill>
);

const BrollAssetFrame: React.FC<{
  item: BrollSequenceItem;
  asset: MediaAsset | null;
  fit: "cover" | "contain";
  accentColor: string;
  colorAdjustment?: ColorAdjustment;
}> = ({ item, asset, fit, accentColor, colorAdjustment }) => {
  const resolvedAdjustment = item.colorAdjustment ?? colorAdjustment;
  const vignette = vignetteBackground(resolvedAdjustment);
  if (!asset || (asset.kind !== "image" && asset.kind !== "video")) {
    return <MissingAsset assetId={item.assetId} />;
  }

  return (
    <AbsoluteFill style={{ background: BLACK }}>
      {asset.kind === "video" ? (
        <SpeedRampedVideo
          src={asset.src}
          muted={item.muted ?? true}
          fit={item.fit ?? fit}
          playbackRate={item.playbackRate ?? 1}
          speedRamp={item.speedRamp}
          startFromSeconds={item.startFromSeconds}
          endAtSeconds={item.endAtSeconds}
          volume={item.volume}
          colorAdjustment={resolvedAdjustment}
        />
      ) : (
        <Img
          src={staticFile(asset.src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: item.fit ?? fit,
            display: "block",
            filter: colorAdjustmentFilter(resolvedAdjustment),
          }}
        />
      )}
      {vignette ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: vignette,
            pointerEvents: "none",
          }}
        />
      ) : null}
      {item.caption ? (
        <div
          style={{
            position: "absolute",
            left: 28,
            right: 28,
            bottom: 26,
            color: WHITE,
            fontSize: 30,
            fontWeight: 900,
            lineHeight: 1.15,
            textShadow: "0 3px 18px rgba(0,0,0,0.65)",
          }}
        >
          {parseHighlights(item.caption, accentColor)}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const BrollSequence: React.FC<{
  items: BrollSequenceItem[];
  assets?: AssetManifest;
  accentColor: string;
  sceneDuration: number;
  fit?: "cover" | "contain";
  cropPreset?: "16:9" | "1:1" | "4:5" | "9:16";
  colorAdjustment?: ColorAdjustment;
}> = ({
  items,
  assets,
  accentColor,
  sceneDuration,
  fit = "cover",
  cropPreset,
  colorAdjustment,
}) => {
  const { fps } = useVideoConfig();
  const frameSize = dimensionsForCropPreset(WIDTH, HEIGHT, cropPreset);
  const durations = itemDurations(items, fps, sceneDuration);
  let cursor = 0;

  return (
    <div
      style={{
        position: "relative",
        width: frameSize.width,
        height: frameSize.height,
        borderRadius: 18,
        overflow: "hidden",
        background: BLACK,
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }}
    >
      {items.map((item, index) => {
        const from = cursor;
        const durationInFrames = durations[index];
        cursor += durationInFrames;
        return (
          <Sequence
            key={`${item.assetId}-${index}`}
            from={from}
            durationInFrames={durationInFrames}
            premountFor={Math.min(fps, 30)}
          >
            <BrollAssetFrame
              item={item}
              asset={findAsset(assets, item.assetId)}
              fit={fit}
              accentColor={accentColor}
              colorAdjustment={colorAdjustment}
            />
          </Sequence>
        );
      })}
    </div>
  );
};

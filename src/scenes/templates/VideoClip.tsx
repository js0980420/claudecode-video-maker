import React from "react";
import { staticFile, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { AssetManifest } from "../../types";
import { findAsset } from "../../utils/assets";
import { dimensionsForCropPreset } from "../../utils/cropPresets";
import { BLACK, GRAY, WHITE } from "../../constants";

const MISSING_COLOR = "#E63946";

export const VideoClip: React.FC<{
  assetId: string;
  assets?: AssetManifest;
  fit?: "cover" | "contain";
  cropPreset?: "16:9" | "1:1" | "4:5" | "9:16";
  startFromSeconds?: number;
  endAtSeconds?: number;
  playbackRate?: number;
  volume?: number;
  muted?: boolean;
}> = ({
  assetId,
  assets,
  fit = "cover",
  cropPreset,
  startFromSeconds = 0,
  endAtSeconds,
  playbackRate = 1,
  volume = 0,
  muted = true,
}) => {
  const { fps } = useVideoConfig();
  const frameSize = dimensionsForCropPreset(980, 420, cropPreset);
  const asset = findAsset(assets, assetId, "video");
  if (!asset) {
    return (
      <div
        style={{
          width: frameSize.width,
          height: frameSize.height,
          borderRadius: 24,
          background: "#FFF5F5",
          color: MISSING_COLOR,
          border: `3px solid ${MISSING_COLOR}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 900 }}>MISSING VIDEO ASSET</div>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{assetId}</div>
        <div style={{ fontSize: 18 }}>Check content.assets.</div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: frameSize.width,
        height: frameSize.height,
        borderRadius: 24,
        background: BLACK,
        color: WHITE,
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }}
    >
      <Video
        src={staticFile(asset.src)}
        muted={muted}
        objectFit={fit}
        playbackRate={playbackRate}
        trimBefore={Math.max(0, Math.floor(startFromSeconds * fps))}
        trimAfter={
          endAtSeconds === undefined
            ? undefined
            : Math.max(0, Math.floor(endAtSeconds * fps))
        }
        volume={() => (muted ? 0 : volume)}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 24,
          bottom: 20,
          fontSize: 24,
          fontWeight: 900,
          color: WHITE,
          textShadow: "0 2px 12px rgba(0,0,0,0.5)",
        }}
      >
        {asset.label ?? asset.id}
        {asset.attribution ? (
          <span style={{ color: GRAY, marginLeft: 12, fontSize: 16 }}>
            {asset.attribution}
          </span>
        ) : null}
      </div>
    </div>
  );
};

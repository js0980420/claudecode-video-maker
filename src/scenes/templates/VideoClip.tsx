import React from "react";
import { AssetManifest } from "../../types";
import { findAsset } from "../../utils/assets";
import { BLACK, GRAY, WHITE } from "../../constants";

const MISSING_COLOR = "#E63946";

export const VideoClip: React.FC<{
  assetId: string;
  assets?: AssetManifest;
  fit?: "cover" | "contain";
}> = ({ assetId, assets }) => {
  const asset = findAsset(assets, assetId, "video");
  return (
    <div
      style={{
        width: 980,
        height: 420,
        borderRadius: 24,
        background: asset ? BLACK : "#FFF5F5",
        color: asset ? WHITE : MISSING_COLOR,
        border: `3px solid ${asset ? BLACK : MISSING_COLOR}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 18,
        overflow: "hidden",
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 900 }}>
        {asset ? "VIDEO CLIP" : "MISSING VIDEO ASSET"}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: asset ? "#DDDDDD" : MISSING_COLOR,
        }}
      >
        {asset ? asset.src : assetId}
      </div>
      <div style={{ fontSize: 18, color: asset ? GRAY : MISSING_COLOR }}>
        {asset ? "Playback is enabled by the media renderer." : "Check content.assets."}
      </div>
    </div>
  );
};

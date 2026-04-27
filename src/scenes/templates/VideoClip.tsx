import React from "react";
import { staticFile } from "remotion";
import { Video } from "@remotion/media";
import { AssetManifest } from "../../types";
import { findAsset } from "../../utils/assets";
import { BLACK, GRAY, WHITE } from "../../constants";

const MISSING_COLOR = "#E63946";

export const VideoClip: React.FC<{
  assetId: string;
  assets?: AssetManifest;
  fit?: "cover" | "contain";
}> = ({ assetId, assets, fit = "cover" }) => {
  const asset = findAsset(assets, assetId, "video");
  if (!asset) {
    return (
      <div
        style={{
          width: 980,
          height: 420,
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
        width: 980,
        height: 420,
        borderRadius: 24,
        background: BLACK,
        color: WHITE,
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }}
    >
      <Video
        src={staticFile(asset.src)}
        muted
        objectFit={fit}
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

import React from "react";
import { Img, staticFile } from "remotion";
import { AssetManifest } from "../../types";
import { findAsset } from "../../utils/assets";
import { dimensionsForCropPreset } from "../../utils/cropPresets";
import { BLACK, GRAY, WHITE } from "../../constants";

const MISSING_COLOR = "#E63946";

export const ImageBackground: React.FC<{
  assetId: string;
  assets?: AssetManifest;
  fit?: "cover" | "contain";
  cropPreset?: "16:9" | "1:1" | "4:5" | "9:16";
  dim?: number;
}> = ({ assetId, assets, fit = "cover", cropPreset, dim = 0.12 }) => {
  const frameSize = dimensionsForCropPreset(980, 420, cropPreset);
  const asset = findAsset(assets, assetId, "image");
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
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 900 }}>MISSING IMAGE ASSET</div>
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
        overflow: "hidden",
        background: BLACK,
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }}
    >
      <Img
        src={staticFile(asset.src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: fit,
          display: "block",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `rgba(0,0,0,${Math.max(0, Math.min(0.8, dim))})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 24,
          bottom: 20,
          color: WHITE,
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 2,
          textTransform: "uppercase",
          textShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}
      >
        {asset.label ?? asset.id}
        {asset.attribution ? (
          <span style={{ color: GRAY, marginLeft: 12 }}>{asset.attribution}</span>
        ) : null}
      </div>
    </div>
  );
};

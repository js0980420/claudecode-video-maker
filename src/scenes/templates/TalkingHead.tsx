import React from "react";
import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";
import { AssetManifest, MediaAsset, TalkingHeadLayout } from "../../types";
import { findAsset } from "../../utils/assets";
import { BLACK, WHITE } from "../../constants";

const MISSING_COLOR = "#E63946";

const MissingAsset: React.FC<{ assetId: string; label: string }> = ({
  assetId,
  label,
}) => (
  <AbsoluteFill
    style={{
      background: "#FFF5F5",
      color: MISSING_COLOR,
      border: `3px solid ${MISSING_COLOR}`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
    }}
  >
    <div style={{ fontSize: 30, fontWeight: 900 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 700 }}>{assetId}</div>
    <div style={{ fontSize: 16 }}>Check content.assets.</div>
  </AbsoluteFill>
);

const MediaPane: React.FC<{
  asset: MediaAsset | null;
  assetId: string;
  fit: "cover" | "contain";
  label: string;
  startFromSeconds?: number;
  endAtSeconds?: number;
  playbackRate?: number;
  volume?: number;
  muted?: boolean;
}> = ({
  asset,
  assetId,
  fit,
  label,
  startFromSeconds = 0,
  endAtSeconds,
  playbackRate = 1,
  volume = 0,
  muted = true,
}) => {
  const { fps } = useVideoConfig();
  if (!asset || (asset.kind !== "video" && asset.kind !== "image")) {
    return <MissingAsset assetId={assetId} label={label} />;
  }

  if (asset.kind === "image") {
    return (
      <Img
        src={staticFile(asset.src)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: fit,
          display: "block",
        }}
      />
    );
  }

  return (
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
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};

export const TalkingHead: React.FC<{
  speakerAssetId: string;
  supportingAssetId?: string;
  assets?: AssetManifest;
  accentColor: string;
  layout?: TalkingHeadLayout;
  fit?: "cover" | "contain";
  startFromSeconds?: number;
  endAtSeconds?: number;
  playbackRate?: number;
  volume?: number;
  muted?: boolean;
  speakerName?: string;
  speakerRole?: string;
}> = ({
  speakerAssetId,
  supportingAssetId,
  assets,
  accentColor,
  layout = "full",
  fit = "cover",
  startFromSeconds,
  endAtSeconds,
  playbackRate,
  volume,
  muted,
  speakerName,
  speakerRole,
}) => {
  const speaker = findAsset(assets, speakerAssetId, "video");
  const supporting = supportingAssetId ? findAsset(assets, supportingAssetId) : null;
  const resolvedLayout = supportingAssetId ? layout : "full";

  return (
    <div
      style={{
        position: "relative",
        width: 1100,
        height: 520,
        borderRadius: 18,
        overflow: "hidden",
        background: BLACK,
        boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
      }}
    >
      {resolvedLayout === "split" ? (
        <div style={{ display: "flex", width: "100%", height: "100%" }}>
          <div style={{ position: "relative", flex: "0 0 62%", height: "100%" }}>
            <MediaPane
              asset={speaker}
              assetId={speakerAssetId}
              fit={fit}
              label="MISSING SPEAKER VIDEO"
              startFromSeconds={startFromSeconds}
              endAtSeconds={endAtSeconds}
              playbackRate={playbackRate}
              volume={volume}
              muted={muted}
            />
          </div>
          <div
            style={{
              position: "relative",
              flex: "0 0 38%",
              height: "100%",
              borderLeft: "4px solid rgba(255,255,255,0.12)",
            }}
          >
            <MediaPane
              asset={supporting}
              assetId={supportingAssetId ?? ""}
              fit={fit}
              label="MISSING SUPPORTING ASSET"
              muted
            />
          </div>
        </div>
      ) : (
        <AbsoluteFill>
          <MediaPane
            asset={speaker}
            assetId={speakerAssetId}
            fit={fit}
            label="MISSING SPEAKER VIDEO"
            startFromSeconds={startFromSeconds}
            endAtSeconds={endAtSeconds}
            playbackRate={playbackRate}
            volume={volume}
            muted={muted}
          />
          {resolvedLayout === "pictureInPicture" && supportingAssetId ? (
            <div
              style={{
                position: "absolute",
                right: 28,
                top: 28,
                width: 330,
                height: 190,
                borderRadius: 12,
                overflow: "hidden",
                border: "4px solid rgba(255,255,255,0.85)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
              }}
            >
              <MediaPane
                asset={supporting}
                assetId={supportingAssetId}
                fit={fit}
                label="MISSING SUPPORTING ASSET"
                muted
              />
            </div>
          ) : null}
        </AbsoluteFill>
      )}

      {speakerName || speakerRole ? (
        <div
          style={{
            position: "absolute",
            left: 28,
            bottom: 26,
            padding: "14px 20px",
            borderLeft: `8px solid ${accentColor}`,
            background: "rgba(0,0,0,0.72)",
            color: WHITE,
            boxShadow: "0 12px 34px rgba(0,0,0,0.22)",
          }}
        >
          {speakerName ? (
            <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>
              {speakerName}
            </div>
          ) : null}
          {speakerRole ? (
            <div
              style={{
                marginTop: speakerName ? 8 : 0,
                fontSize: 18,
                fontWeight: 800,
                color: "rgba(255,255,255,0.78)",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              {speakerRole}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

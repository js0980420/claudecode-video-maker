import React from "react";
import { AbsoluteFill } from "remotion";
import { BLACK, FONT_FAMILY, GRAY, WHITE } from "../constants";
import { FeatureChip } from "./FeatureChips";
import { ThumbnailProps } from "./ThumbnailYT";
import { parseHighlights } from "../utils/parseHighlights";

export const ThumbnailIG: React.FC<ThumbnailProps> = ({
  content,
  primaryColor,
}) => {
  const [prefix, accent, suffix] = content.titleParts;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: WHITE,
        color: BLACK,
        fontFamily: FONT_FAMILY,
        padding: 70,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontSize: 108,
          fontWeight: 900,
          letterSpacing: -2,
          lineHeight: 1.05,
        }}
      >
        {prefix ? (
          <div style={{ fontSize: 60, fontWeight: 700, color: GRAY }}>
            {prefix}
          </div>
        ) : null}
        <div
          style={{
            background: primaryColor,
            color: WHITE,
            padding: "14px 36px",
            borderRadius: 18,
            display: "inline-block",
            marginTop: 4,
            letterSpacing: 0,
          }}
        >
          {accent}
        </div>
        {suffix ? <div style={{ marginTop: 14 }}>{suffix}</div> : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          width: "100%",
        }}
      >
        {content.features.map((f) => (
          <div key={f} style={{ display: "flex", justifyContent: "center" }}>
            <FeatureChip
              label={f}
              fontSize={36}
              accentColor={primaryColor}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 900 }}>
          {parseHighlights(content.tagline, primaryColor)}
        </div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 900,
            color: GRAY,
            letterSpacing: 8,
          }}
        >
          {content.brand}
        </div>
      </div>
    </AbsoluteFill>
  );
};

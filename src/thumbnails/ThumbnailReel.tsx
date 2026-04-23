import React from "react";
import { AbsoluteFill } from "remotion";
import { BLACK, FONT_FAMILY, GRAY, WHITE } from "../constants";
import { FeatureChip } from "./FeatureChips";
import { ThumbnailProps } from "./ThumbnailYT";
import { parseHighlights } from "../utils/parseHighlights";

export const ThumbnailReel: React.FC<ThumbnailProps> = ({
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
        paddingTop: 220,
        paddingBottom: 260,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div
        style={{
          textAlign: "center",
          fontSize: 132,
          fontWeight: 900,
          letterSpacing: -3,
          lineHeight: 1,
        }}
      >
        {prefix ? (
          <div style={{ fontSize: 72, fontWeight: 700, color: GRAY }}>
            {prefix}
          </div>
        ) : null}
        <div
          style={{
            background: primaryColor,
            color: WHITE,
            padding: "18px 40px",
            borderRadius: 22,
            display: "inline-block",
            marginTop: 12,
            letterSpacing: 0,
          }}
        >
          {accent}
        </div>
        {suffix ? <div style={{ marginTop: 28 }}>{suffix}</div> : null}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 22,
          alignItems: "center",
        }}
      >
        {content.features.map((f) => (
          <FeatureChip
            key={f}
            label={f}
            fontSize={46}
            accentColor={primaryColor}
          />
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          {parseHighlights(content.tagline, primaryColor)}
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 900,
            color: GRAY,
            letterSpacing: 10,
            marginTop: 14,
          }}
        >
          {content.brand}
        </div>
      </div>
    </AbsoluteFill>
  );
};

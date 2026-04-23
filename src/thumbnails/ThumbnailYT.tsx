import React from "react";
import { AbsoluteFill } from "remotion";
import { BLACK, FONT_FAMILY, GRAY, WHITE } from "../constants";
import { FeatureChip } from "./FeatureChips";
import { ThumbnailContent } from "../types";
import { parseHighlights } from "../utils/parseHighlights";

export type ThumbnailProps = {
  content: ThumbnailContent;
  primaryColor: string;
};

export const ThumbnailYT: React.FC<ThumbnailProps> = ({
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
        padding: 56,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          fontSize: 72,
          fontWeight: 900,
          letterSpacing: -1,
          lineHeight: 1,
          flexWrap: "nowrap",
          whiteSpace: "nowrap",
        }}
      >
        {prefix ? (
          <span style={{ whiteSpace: "nowrap" }}>{prefix}</span>
        ) : null}
        <span
          style={{
            background: primaryColor,
            color: WHITE,
            padding: "10px 22px",
            borderRadius: 12,
            letterSpacing: 0,
            whiteSpace: "nowrap",
          }}
        >
          {accent}
        </span>
        {suffix ? (
          <span style={{ whiteSpace: "nowrap" }}>{suffix}</span>
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: -1,
            lineHeight: 1,
          }}
        >
          {parseHighlights(content.tagline, primaryColor)}
        </div>
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
          }}
        >
          {content.features.map((f) => (
            <FeatureChip
              key={f}
              label={f}
              fontSize={26}
              accentColor={primaryColor}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 22,
            color: GRAY,
            fontWeight: 700,
            borderLeft: `5px solid ${primaryColor}`,
            paddingLeft: 14,
            letterSpacing: 3,
          }}
        >
          {content.brand}
        </div>
      </div>
    </AbsoluteFill>
  );
};

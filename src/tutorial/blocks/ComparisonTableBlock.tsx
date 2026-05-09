import React from "react";
import { ComparisonTableBlock as ComparisonTableBlockType } from "../types";
import { BLACK, FONT_FAMILY } from "../../constants";

type Props = {
  block: ComparisonTableBlockType;
  accentColor: string;
};

const ArrowSVG: React.FC<{ color: string }> = ({ color }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M8 24H40M40 24L28 12M40 24L28 36"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ComparisonTableBlock: React.FC<Props> = ({ block, accentColor }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 16,
      width: "100%",
      maxWidth: 1400,
      fontFamily: FONT_FAMILY,
    }}
  >
    {block.rows.map((row, i) => (
      <div
        key={i}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: "#F8F9FA",
          borderRadius: 16,
          padding: "16px 24px",
          border: "1px solid #E9ECEF",
        }}
      >
        {/* Label chip */}
        <div
          style={{
            background: accentColor,
            color: "#FFFFFF",
            borderRadius: 8,
            padding: "6px 16px",
            fontSize: 22,
            fontWeight: 700,
            whiteSpace: "nowrap",
            flexShrink: 0,
            minWidth: 140,
            textAlign: "center",
          }}
        >
          {row.label}
        </div>

        {/* Before */}
        <div
          style={{
            flex: 1,
            fontSize: 24,
            color: "#666666",
            textDecoration: "line-through",
            textAlign: "center",
          }}
        >
          {row.before}
        </div>

        <ArrowSVG color={accentColor} />

        {/* After */}
        <div
          style={{
            flex: 1,
            fontSize: 26,
            fontWeight: 700,
            color: BLACK,
            textAlign: "center",
          }}
        >
          {row.after}
        </div>
      </div>
    ))}
  </div>
);

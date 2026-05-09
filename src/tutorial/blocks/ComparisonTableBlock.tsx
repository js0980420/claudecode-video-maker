import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ComparisonTableBlock as ComparisonTableBlockType } from "../types";
import { BLACK, FONT_FAMILY } from "../../constants";

type Props = {
  block: ComparisonTableBlockType;
  accentColor: string;
  revealFrame?: number;
};

const FADE = 16;
const ROW_STAGGER = 7;

const ArrowSVG: React.FC<{ color: string }> = ({ color }) => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ flexShrink: 0 }}>
    <path d="M8 24H40M40 24L28 12M40 24L28 36" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ComparisonTableBlock: React.FC<Props> = ({ block, accentColor, revealFrame = 0 }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 1400, fontFamily: FONT_FAMILY }}>
      {block.rows.map((row, i) => {
        const start = revealFrame + i * ROW_STAGGER;
        const p = interpolate(frame, [start, start + FADE], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.out(Easing.back(1.15)),
        });
        const tx = Math.round(interpolate(frame, [start, start + FADE], [40, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.out(Easing.back(1.15)),
        }));
        return (
          <div
            key={i}
            style={{
              display: "flex", alignItems: "center", gap: 16,
              background: "#F8F9FA",
              borderRadius: 16,
              padding: "16px 24px",
              border: "1px solid #E9ECEF",
              opacity: p,
              transform: `translateX(${tx}px)`,
            }}
          >
            <div style={{
              background: accentColor, color: "#FFFFFF",
              borderRadius: 8, padding: "6px 16px",
              fontSize: 22, fontWeight: 700,
              whiteSpace: "nowrap", flexShrink: 0,
              minWidth: 140, textAlign: "center",
            }}>
              {row.label}
            </div>
            <div style={{ flex: 1, fontSize: 24, color: "#666666", textDecoration: "line-through", textAlign: "center" }}>
              {row.before}
            </div>
            <ArrowSVG color={accentColor} />
            <div style={{ flex: 1, fontSize: 26, fontWeight: 700, color: BLACK, textAlign: "center" }}>
              {row.after}
            </div>
          </div>
        );
      })}
    </div>
  );
};

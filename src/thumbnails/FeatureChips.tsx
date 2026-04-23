import React from "react";
import { BLACK, WHITE } from "../constants";

export const FeatureChip: React.FC<{
  label: string;
  fontSize: number;
  accentColor: string;
  padding?: string;
}> = ({ label, fontSize, accentColor, padding }) => (
  <div
    style={{
      padding: padding ?? `${fontSize * 0.35}px ${fontSize * 0.7}px`,
      border: `${Math.max(3, fontSize * 0.08)}px solid ${BLACK}`,
      borderRadius: 999,
      fontSize,
      fontWeight: 900,
      color: BLACK,
      background: WHITE,
      display: "inline-flex",
      alignItems: "center",
      gap: fontSize * 0.35,
      whiteSpace: "nowrap",
      lineHeight: 1,
    }}
  >
    <span style={{ color: accentColor, fontWeight: 900 }}>✓</span>
    {label}
  </div>
);

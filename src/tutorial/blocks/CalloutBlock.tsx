import React from "react";
import { CalloutBlock as CalloutBlockType } from "../types";
import { MarkdownLite } from "../markdown-lite";
import { BLACK, FONT_FAMILY } from "../../constants";

type Props = {
  block: CalloutBlockType;
  accentColor: string;
};

const KIND_COLORS: Record<CalloutBlockType["kind"], { bg: string; border: string }> = {
  tip:  { bg: "#FFF8E1", border: "#FFC107" },
  info: { bg: "#E3F2FD", border: "#2196F3" },
  warn: { bg: "#FFEBEE", border: "#F44336" },
};

export const CalloutBlock: React.FC<Props> = ({ block, accentColor }) => {
  const { bg, border } = KIND_COLORS[block.kind];
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        padding: "20px 28px",
        background: bg,
        borderLeft: `6px solid ${border}`,
        borderRadius: 8,
        maxWidth: 1400,
        width: "100%",
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ fontSize: 32, lineHeight: 1 }}>{block.icon}</div>
      <div style={{ fontSize: 28, lineHeight: 1.5, color: BLACK, flex: 1 }}>
        <MarkdownLite text={block.text} accentColor={accentColor} />
      </div>
    </div>
  );
};

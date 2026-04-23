import React from "react";
import { CodeBlock as CodeBlockType } from "../types";
import { BLACK, FONT_FAMILY, WHITE } from "../../constants";

type Props = {
  block: CodeBlockType;
  accentColor: string;
};

export const CodeBlock: React.FC<Props> = ({ block, accentColor }) => (
  <div
    style={{
      width: "100%",
      maxWidth: 1400,
      background: WHITE,
      border: `4px solid ${BLACK}`,
      borderRadius: 12,
      overflow: "hidden",
      fontFamily: `"SF Mono", "Menlo", "Consolas", "Courier New", ${FONT_FAMILY}`,
    }}
  >
    <div
      style={{
        background: BLACK,
        color: WHITE,
        padding: "8px 16px",
        fontSize: 16,
        letterSpacing: 1,
      }}
    >
      Terminal
    </div>
    <div
      style={{
        padding: "18px 22px",
        fontSize: 24,
        color: accentColor,
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
      }}
    >
      {block.text}
    </div>
  </div>
);

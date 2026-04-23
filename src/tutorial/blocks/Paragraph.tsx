import React from "react";
import { ParagraphBlock } from "../types";
import { MarkdownLite } from "../markdown-lite";
import { BLACK, FONT_FAMILY } from "../../constants";

type Props = {
  block: ParagraphBlock;
  accentColor: string;
};

export const Paragraph: React.FC<Props> = ({ block, accentColor }) => (
  <div
    style={{
      fontSize: 32,
      lineHeight: 1.6,
      color: BLACK,
      fontFamily: FONT_FAMILY,
      textAlign: "left",
      maxWidth: 1400,
    }}
  >
    <MarkdownLite text={block.text} accentColor={accentColor} />
  </div>
);

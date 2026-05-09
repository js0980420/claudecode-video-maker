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
      // width 100% + maxWidth 1400 強制撐到固定寬,每個 paragraph 起點一致(內部
      // textAlign left,列點 1/2/3/4 跟項目符號都對齊在同一垂直線)。沒這個 width
      // 時,wrapper justifyContent center 會把短句往右偏、長句往左偏 → 列點歪斜。
      width: "100%",
      maxWidth: 1400,
      WebkitFontSmoothing: "antialiased",
    }}
  >
    <MarkdownLite text={block.text} accentColor={accentColor} />
  </div>
);

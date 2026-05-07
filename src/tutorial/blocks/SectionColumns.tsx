import React from "react";
import { ParagraphBlock } from "../types";
import { MarkdownLite } from "../markdown-lite";
import { BLACK, FONT_FAMILY } from "../../constants";

export type Section = {
  header: ParagraphBlock;
  bullets: ParagraphBlock[];
};

type Props = {
  sections: Section[];
  accentColor: string;
};

export const SectionColumns: React.FC<Props> = ({ sections, accentColor }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 100,
        width: "100%",
        maxWidth: 1400,
        alignItems: "flex-start",
      }}
    >
      {sections.map((section, i) => (
        <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {/* section header */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              lineHeight: 1.6,
              color: BLACK,
              fontFamily: FONT_FAMILY,
              marginBottom: 4,
            }}
          >
            <MarkdownLite text={section.header.text} accentColor={accentColor} />
          </div>
          {/* bullets */}
          {section.bullets.map((b, j) => (
            <div
              key={j}
              style={{
                fontSize: 32,
                lineHeight: 1.6,
                color: BLACK,
                fontFamily: FONT_FAMILY,
                paddingLeft: 72,
              }}
            >
              <MarkdownLite text={b.text} accentColor={accentColor} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

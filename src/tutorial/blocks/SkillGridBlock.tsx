import React from "react";
import { SkillGridBlock as SkillGridBlockType } from "../types";
import { BLACK, FONT_FAMILY } from "../../constants";

type Props = {
  block: SkillGridBlockType;
  accentColor: string;
};

export const SkillGridBlock: React.FC<Props> = ({ block, accentColor }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 12,
      width: "100%",
      maxWidth: 1400,
      fontFamily: FONT_FAMILY,
    }}
  >
    {block.categories.map((cat, i) => (
      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        {/* Category label */}
        <div
          style={{
            background: accentColor,
            color: "#FFFFFF",
            borderRadius: 8,
            padding: "4px 14px",
            fontSize: 20,
            fontWeight: 700,
            whiteSpace: "nowrap",
            flexShrink: 0,
            minWidth: 110,
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {cat.name}
        </div>

        {/* Skills chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {cat.skills.map((skill, j) => (
            <div
              key={j}
              style={{
                background: "#F1F3F5",
                color: BLACK,
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 18,
                fontFamily: `"SF Mono", "Menlo", "Consolas", monospace`,
                border: `1px solid ${accentColor}44`,
              }}
            >
              {skill}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

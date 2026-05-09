import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { SkillGridBlock as SkillGridBlockType } from "../types";
import { BLACK, FONT_FAMILY } from "../../constants";

type Props = {
  block: SkillGridBlockType;
  accentColor: string;
  revealFrame?: number;
};

const CAT_STAGGER = 6;
const CHIP_STAGGER = 3;
const FADE = 12;

export const SkillGridBlock: React.FC<Props> = ({ block, accentColor, revealFrame = 0 }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 1400, fontFamily: FONT_FAMILY }}>
      {block.categories.map((cat, i) => {
        const catStart = revealFrame + i * CAT_STAGGER;
        const catP = interpolate(frame, [catStart, catStart + FADE], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const catTy = Math.round(interpolate(frame, [catStart, catStart + FADE], [16, 0], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.out(Easing.back(1.2)),
        }));
        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16, opacity: catP, transform: `translateY(${catTy}px)` }}>
            <div style={{
              background: accentColor, color: "#FFFFFF",
              borderRadius: 8, padding: "4px 14px",
              fontSize: 20, fontWeight: 700,
              whiteSpace: "nowrap", flexShrink: 0,
              minWidth: 110, textAlign: "center", marginTop: 4,
            }}>
              {cat.name}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {cat.skills.map((skill, j) => {
                const chipStart = catStart + 4 + j * CHIP_STAGGER;
                const chipP = interpolate(frame, [chipStart, chipStart + FADE], [0, 1], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                  easing: Easing.out(Easing.back(1.4)),
                });
                const chipTy = Math.round(interpolate(frame, [chipStart, chipStart + FADE], [10, 0], {
                  extrapolateLeft: "clamp", extrapolateRight: "clamp",
                  easing: Easing.out(Easing.back(1.4)),
                }));
                return (
                  <div
                    key={j}
                    style={{
                      background: "#F1F3F5", color: BLACK,
                      borderRadius: 6, padding: "4px 12px",
                      fontSize: 18,
                      fontFamily: `"SF Mono", "Menlo", "Consolas", monospace`,
                      border: `1px solid ${accentColor}44`,
                      opacity: chipP,
                      transform: `translateY(${chipTy}px)`,
                    }}
                  >
                    {skill}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { FeatureCardsBlock as FeatureCardsBlockType } from "../types";
import { BLACK, FONT_FAMILY } from "../../constants";

type Props = {
  block: FeatureCardsBlockType;
  accentColor: string;
  revealFrame?: number;
};

const FADE = 14;
const GRID_STAGGER = 5;
const LIST_STAGGER = 9;

export const FeatureCardsBlock: React.FC<Props> = ({ block, accentColor, revealFrame = 0 }) => {
  const frame = useCurrentFrame();

  if (block.layout === "list") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: 1400, fontFamily: FONT_FAMILY }}>
        {block.cards.map((card, i) => {
          const start = revealFrame + i * LIST_STAGGER;
          const p = interpolate(frame, [start, start + FADE], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          const tx = Math.round(interpolate(frame, [start, start + FADE], [-32, 0], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
            easing: Easing.out(Easing.back(1.2)),
          }));
          return (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "flex-start", gap: 24,
                padding: "24px 28px",
                background: "#FFFFFF",
                border: `2px solid ${accentColor}22`,
                borderRadius: 20,
                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                opacity: p,
                transform: `translateX(${tx}px)`,
              }}
            >
              <div style={{ fontSize: 52, lineHeight: 1, flexShrink: 0, marginTop: 4 }}>{card.icon}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: BLACK, lineHeight: 1.3 }}>{card.title}</div>
                {card.desc ? (
                  <div style={{ fontSize: 22, color: "#555555", lineHeight: 1.6, whiteSpace: "pre-line" }}>{card.desc}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Grid layout
  const count = block.cards.length;
  const cols = count <= 3 ? count : 3;

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 20, width: "100%", maxWidth: 1400, fontFamily: FONT_FAMILY }}>
      {block.cards.map((card, i) => {
        const start = revealFrame + i * GRID_STAGGER;
        const p = interpolate(frame, [start, start + FADE], [0, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.out(Easing.back(1.3)),
        });
        const scale = interpolate(frame, [start, start + FADE], [0.82, 1], {
          extrapolateLeft: "clamp", extrapolateRight: "clamp",
          easing: Easing.out(Easing.back(1.3)),
        });
        return (
          <div
            key={i}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              padding: "28px 20px",
              background: "#FFFFFF",
              border: `2px solid ${accentColor}22`,
              borderRadius: 20,
              boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
              opacity: p,
              transform: `scale(${scale})`,
            }}
          >
            <div style={{ fontSize: 48, lineHeight: 1 }}>{card.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: BLACK, textAlign: "center", lineHeight: 1.3 }}>{card.title}</div>
            {card.desc ? (
              <div style={{ fontSize: 20, color: "#666666", textAlign: "center", lineHeight: 1.5, whiteSpace: "pre-line" }}>{card.desc}</div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

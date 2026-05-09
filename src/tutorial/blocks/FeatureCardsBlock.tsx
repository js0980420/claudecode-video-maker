import React from "react";
import { FeatureCardsBlock as FeatureCardsBlockType } from "../types";
import { BLACK, FONT_FAMILY } from "../../constants";

type Props = {
  block: FeatureCardsBlockType;
  accentColor: string;
};

export const FeatureCardsBlock: React.FC<Props> = ({ block, accentColor }) => {
  if (block.layout === "list") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          width: "100%",
          maxWidth: 1400,
          fontFamily: FONT_FAMILY,
        }}
      >
        {block.cards.map((card, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 24,
              padding: "24px 28px",
              background: "#FFFFFF",
              border: `2px solid ${accentColor}22`,
              borderRadius: 20,
              boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            }}
          >
            {/* Left: icon */}
            <div style={{ fontSize: 52, lineHeight: 1, flexShrink: 0, marginTop: 4 }}>
              {card.icon}
            </div>

            {/* Right: title + desc */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: BLACK,
                  lineHeight: 1.3,
                }}
              >
                {card.title}
              </div>
              {card.desc ? (
                <div
                  style={{
                    fontSize: 22,
                    color: "#555555",
                    lineHeight: 1.6,
                    whiteSpace: "pre-line",
                  }}
                >
                  {card.desc}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Grid layout (default)
  const count = block.cards.length;
  const cols = count <= 3 ? count : 3;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 20,
        width: "100%",
        maxWidth: 1400,
        fontFamily: FONT_FAMILY,
      }}
    >
      {block.cards.map((card, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "28px 20px",
            background: "#FFFFFF",
            border: `2px solid ${accentColor}22`,
            borderRadius: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.07)",
          }}
        >
          <div style={{ fontSize: 48, lineHeight: 1 }}>{card.icon}</div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: BLACK,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {card.title}
          </div>
          {card.desc ? (
            <div
              style={{
                fontSize: 20,
                color: "#666666",
                textAlign: "center",
                lineHeight: 1.5,
                whiteSpace: "pre-line",
              }}
            >
              {card.desc}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

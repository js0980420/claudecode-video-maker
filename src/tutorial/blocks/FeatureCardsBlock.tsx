import React from "react";
import { FeatureCardsBlock as FeatureCardsBlockType } from "../types";
import { BLACK, FONT_FAMILY } from "../../constants";

type Props = {
  block: FeatureCardsBlockType;
  accentColor: string;
};

export const FeatureCardsBlock: React.FC<Props> = ({ block, accentColor }) => {
  const count = block.cards.length;
  // 3 cards → 1 row; 4-6 cards → 2 rows (3+3 or 2+2)
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
                lineHeight: 1.4,
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

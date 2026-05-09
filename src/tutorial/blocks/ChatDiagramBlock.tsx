import React from "react";
import { ChatDiagramBlock as ChatDiagramBlockType } from "../types";
import { BLACK, FONT_FAMILY } from "../../constants";

type Props = { block: ChatDiagramBlockType };

// Anthropic-style Claude Code logo:
// 5 rounded bars arranged in a fan pattern on orange circle
const ClaudeCodeLogo: React.FC<{ size: number }> = ({ size }) => {
  const r = size / 2;
  const barAngles = [-28, -14, 0, 14, 28];
  const barFractions = [0.44, 0.58, 0.66, 0.58, 0.44];
  const barW = size * 0.09;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id="cgr" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </radialGradient>
      </defs>
      <circle cx={r} cy={r} r={r} fill="url(#cgr)" />
      <g transform={`translate(${r} ${r})`}>
        {barAngles.map((angle, i) => {
          const h = barFractions[i] * size;
          return (
            <rect
              key={i}
              x={-barW / 2}
              y={-h / 2}
              width={barW}
              height={h}
              rx={barW / 2}
              fill="white"
              opacity={0.95}
              transform={`rotate(${angle})`}
            />
          );
        })}
      </g>
    </svg>
  );
};

const PersonSVG: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="18" r="13" fill="#94A3B8" />
    <path d="M8 58C8 43.6 19.2 32 32 32C44.8 32 56 43.6 56 58" stroke="#94A3B8" strokeWidth="7" strokeLinecap="round" />
  </svg>
);

const ArrowSVG: React.FC<{ color?: string }> = ({ color = "#CBD5E1" }) => (
  <svg width="52" height="20" viewBox="0 0 52 20" fill="none" style={{ flexShrink: 0 }}>
    <path d="M2 10H50M50 10L40 3M50 10L40 17" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Cloud + Server icons for no-access variant
const InfraIcons: React.FC = () => (
  <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
    {/* Cloud */}
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
      <path d="M60 48H22C12.1 48 4 39.9 4 30C4 20.1 12.1 12 22 12C22.7 12 23.4 12.1 24.1 12.2C27.2 6.1 33.6 2 41 2C51.5 2 60 10.5 60 21C60 21.3 60 21.6 60 22C65.5 23.3 70 28.2 70 34C70 41.7 65.7 48 60 48Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="3" />
    </svg>
    {/* Server */}
    <svg width="60" height="70" viewBox="0 0 60 70" fill="none">
      <rect x="4" y="4" width="52" height="20" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="3" />
      <circle cx="48" cy="14" r="4" fill="#94A3B8" />
      <rect x="4" y="30" width="52" height="20" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="3" />
      <circle cx="48" cy="40" r="4" fill="#94A3B8" />
      <rect x="4" y="56" width="52" height="10" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="3" />
    </svg>
  </div>
);

// Blocked connection line with ⛔
const BlockedArrow: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
    <svg width="80" height="20" viewBox="0 0 80 20" fill="none">
      <line x1="2" y1="10" x2="78" y2="10" stroke="#FCA5A5" strokeWidth="3" strokeDasharray="6 4" />
    </svg>
    <div style={{ fontSize: 36 }}>⛔</div>
  </div>
);

export const ChatDiagramBlock: React.FC<Props> = ({ block }) => {
  if (block.variant === "chat-fail") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          width: "100%",
          maxWidth: 1400,
          fontFamily: FONT_FAMILY,
          padding: "8px 0",
        }}
      >
        {/* Person */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <PersonSVG size={72} />
          <div style={{ fontSize: 18, color: "#94A3B8" }}>你</div>
        </div>

        <ArrowSVG />

        {/* Speech bubble */}
        <div
          style={{
            flex: 1,
            background: "#F8FAFC",
            border: "2px solid #E2E8F0",
            borderRadius: 20,
            padding: "18px 28px",
            fontSize: 28,
            fontWeight: 600,
            color: BLACK,
            lineHeight: 1.5,
          }}
        >
          「{block.message}」
        </div>

        <ArrowSVG />

        {/* Claude Code */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <ClaudeCodeLogo size={76} />
          <div style={{ fontSize: 17, color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>Claude Code</div>
        </div>

        <ArrowSVG color="#FCA5A5" />

        {/* Result */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <div style={{ fontSize: 56, lineHeight: 1, color: "#EF4444" }}>✗</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#EF4444", whiteSpace: "nowrap" }}>
            {block.resultText}
          </div>
        </div>
      </div>
    );
  }

  // no-access variant
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        width: "100%",
        maxWidth: 1400,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {/* Claude Code */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <ClaudeCodeLogo size={80} />
          <div style={{ fontSize: 17, color: "#64748B", fontWeight: 600 }}>Claude Code</div>
        </div>

        <BlockedArrow />

        {/* Cloud + Server */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <InfraIcons />
          <div style={{ fontSize: 17, color: "#64748B", fontWeight: 600 }}>雲端基礎設施</div>
        </div>
      </div>

      {/* No-access items */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        {block.items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#FEF2F2",
              border: "1.5px solid #FECACA",
              borderRadius: 10,
              padding: "8px 18px",
              fontSize: 20,
              color: "#DC2626",
            }}
          >
            <span>✗</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

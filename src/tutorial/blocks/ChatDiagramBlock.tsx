import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { ChatDiagramBlock as ChatDiagramBlockType } from "../types";
import { BLACK, FONT_FAMILY } from "../../constants";
import { useTypingChars, TypingCursor } from "../TypingText";

type Props = { block: ChatDiagramBlockType; revealFrame?: number };

const FADE = 12;

function useAppear(frame: number, start: number, overshoot = 1.3) {
  const p = interpolate(frame, [start, start + FADE], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(overshoot)),
  });
  const ty = Math.round(interpolate(frame, [start, start + FADE], [14, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(overshoot)),
  }));
  return { opacity: p, transform: `translateY(${ty}px)` };
}

const ClaudeCodeLogo: React.FC<{ size: number }> = ({ size }) => (
  <Img
    src={staticFile("images/claude-code-logo.png")}
    style={{ width: size, height: size, borderRadius: size * 0.22, flexShrink: 0 }}
  />
);

const PersonSVG: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <circle cx="32" cy="18" r="13" fill="#94A3B8" />
    <path d="M8 58C8 43.6 19.2 32 32 32C44.8 32 56 43.6 56 58" stroke="#94A3B8" strokeWidth="7" strokeLinecap="round" />
  </svg>
);

const ArrowSVG: React.FC<{ color?: string; frame: number; start: number }> = ({ color = "#CBD5E1", frame, start }) => {
  const p = interpolate(frame, [start, start + FADE], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <svg width="52" height="20" viewBox="0 0 52 20" fill="none" style={{ flexShrink: 0, opacity: p }}>
      <path d="M2 10H50M50 10L40 3M50 10L40 17" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const InfraIcons: React.FC = () => (
  <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
      <path d="M60 48H22C12.1 48 4 39.9 4 30C4 20.1 12.1 12 22 12C22.7 12 23.4 12.1 24.1 12.2C27.2 6.1 33.6 2 41 2C51.5 2 60 10.5 60 21C60 21.3 60 21.6 60 22C65.5 23.3 70 28.2 70 34C70 41.7 65.7 48 60 48Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="3" />
    </svg>
    <svg width="60" height="70" viewBox="0 0 60 70" fill="none">
      <rect x="4" y="4" width="52" height="20" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="3" />
      <circle cx="48" cy="14" r="4" fill="#94A3B8" />
      <rect x="4" y="30" width="52" height="20" rx="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="3" />
      <circle cx="48" cy="40" r="4" fill="#94A3B8" />
      <rect x="4" y="56" width="52" height="10" rx="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="3" />
    </svg>
  </div>
);

// 醒目結果特效：衝擊波擴散 + ✗ 強力彈入 + 文字滑上
const ImpactResult: React.FC<{ resultText: string; start: number; frame: number }> = ({
  resultText, start, frame,
}) => {
  // 衝擊波：迅速擴散 + 淡出
  const ringScale = interpolate(frame, [start, start + 10], [0.2, 2.8], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const ringOpacity = interpolate(frame, [start, start + 14], [0.7, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // ✗ 超大 overshoot 砰！進場（back 5.5 = 縮放到 1.4x 再彈回）
  const xScale = interpolate(frame, [start, start + 11], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(5.5)),
  });
  const xOpacity = interpolate(frame, [start, start + 4], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // 文字：✗ 落定後滑上來
  const textStart = start + 9;
  const textOpacity = interpolate(frame, [textStart, textStart + 8], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const textTy = Math.round(interpolate(frame, [textStart, textStart + 8], [12, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.4)),
  }));

  // 背景閃光
  const flashOpacity = interpolate(
    frame,
    [start, start + 4, start + 14],
    [0, 0.14, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, position: "relative" }}>
      {/* 背景紅色閃光 */}
      <div style={{
        position: "absolute", inset: -20, borderRadius: 20,
        background: "#EF4444", opacity: flashOpacity, pointerEvents: "none",
      }} />
      {/* 衝擊波擴散圈 */}
      <div style={{
        position: "absolute",
        width: 80, height: 80, borderRadius: "50%",
        border: "5px solid #EF4444",
        opacity: ringOpacity,
        transform: `scale(${ringScale})`,
        top: "calc(50% - 50px)", left: "calc(50% - 40px)",
        pointerEvents: "none",
      }} />
      {/* ✗ 主體 */}
      <div style={{
        fontSize: 68, lineHeight: 1, color: "#EF4444", fontWeight: 900,
        opacity: xOpacity, transform: `scale(${xScale})`,
        position: "relative", zIndex: 1,
      }}>
        ✗
      </div>
      {/* 文字 */}
      <div style={{
        fontSize: 22, fontWeight: 700, color: "#EF4444", whiteSpace: "nowrap",
        opacity: textOpacity, transform: `translateY(${textTy}px)`,
        position: "relative", zIndex: 1,
      }}>
        {resultText}
      </div>
    </div>
  );
};

// 語音泡打字元件：泡泡淡入後文字逐字打出
const SPEECH_RATE = 0.85; // chars/frame — 中文打字手感
const SpeechBubble: React.FC<{ message: string; bubbleStart: number; frame: number }> = ({
  message, bubbleStart, frame,
}) => {
  // 泡泡出現後 4 幀開始打字（讓泡泡先浮出）
  const typingStart = bubbleStart + 4;
  const { shown, isTyping } = useTypingChars(message, typingStart, SPEECH_RATE);
  const doneAt = typingStart + message.length / SPEECH_RATE;
  const bubbleAppear = useAppear(frame, bubbleStart);
  return (
    <div
      style={{
        flex: 1, background: "#F8FAFC",
        border: "2px solid #E2E8F0", borderRadius: 20,
        padding: "18px 28px", fontSize: 28, fontWeight: 600,
        color: BLACK, lineHeight: 1.5,
        ...bubbleAppear,
      }}
    >
      「{shown}
      <TypingCursor isTyping={isTyping} doneAt={doneAt} color="#64748B" height="0.85em" />
      {!isTyping ? "」" : ""}
    </div>
  );
};

export const ChatDiagramBlock: React.FC<Props> = ({ block, revealFrame = 0 }) => {
  const frame = useCurrentFrame();

  if (block.variant === "chat-fail") {
    // Sequential reveal: person(0) → arrow1(6) → bubble(10) → arrow2(18) → logo(22) → arrow3(30) → result(34)
    const t = (offset: number) => revealFrame + offset;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 24, width: "100%", maxWidth: 1400, fontFamily: FONT_FAMILY, padding: "8px 0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0, ...useAppear(frame, t(0)) }}>
          <PersonSVG size={72} />
          <div style={{ fontSize: 18, color: "#94A3B8" }}>你</div>
        </div>

        <ArrowSVG frame={frame} start={t(6)} />

        <SpeechBubble message={block.message} bubbleStart={t(10)} frame={frame} />

        <ArrowSVG frame={frame} start={t(18)} />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0, ...useAppear(frame, t(22)) }}>
          <ClaudeCodeLogo size={76} />
          <div style={{ fontSize: 17, color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>Claude Code</div>
        </div>

        <ArrowSVG color="#FCA5A5" frame={frame} start={t(30)} />

        <ImpactResult resultText={block.resultText} start={t(34)} frame={frame} />
      </div>
    );
  }

  // no-access variant: logo(0) → blocked arrow(10) → infra(18) → chips stagger(28+)
  const t = (offset: number) => revealFrame + offset;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 1400, fontFamily: FONT_FAMILY }}>
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, ...useAppear(frame, t(0)) }}>
          <ClaudeCodeLogo size={80} />
          <div style={{ fontSize: 17, color: "#64748B", fontWeight: 600 }}>Claude Code</div>
        </div>

        {/* Blocked dashed line + ⛔ */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, ...useAppear(frame, t(10)) }}>
          <svg width="80" height="20" viewBox="0 0 80 20" fill="none">
            <line x1="2" y1="10" x2="78" y2="10" stroke="#FCA5A5" strokeWidth="3" strokeDasharray="6 4" />
          </svg>
          <div style={{ fontSize: 36 }}>⛔</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, ...useAppear(frame, t(18)) }}>
          <InfraIcons />
          <div style={{ fontSize: 17, color: "#64748B", fontWeight: 600 }}>雲端基礎設施</div>
        </div>
      </div>

      {/* No-access chips stagger in */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
        {block.items.map((item, i) => {
          const chipStart = t(28 + i * 8);
          const chipP = interpolate(frame, [chipStart, chipStart + FADE], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
            easing: Easing.out(Easing.back(1.4)),
          });
          const chipTy = Math.round(interpolate(frame, [chipStart, chipStart + FADE], [10, 0], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
            easing: Easing.out(Easing.back(1.4)),
          }));
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 10, padding: "8px 18px", fontSize: 20, color: "#DC2626", opacity: chipP, transform: `translateY(${chipTy}px)` }}>
              <span>✗</span>
              <span>{item}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

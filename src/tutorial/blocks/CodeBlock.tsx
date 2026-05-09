import React from "react";
import { CodeBlock as CodeBlockType } from "../types";
import { BLACK, FONT_FAMILY, WHITE } from "../../constants";
import { useTypingChars, TypingCursor } from "../TypingText";

type Props = {
  block: CodeBlockType;
  accentColor: string;
  revealFrame?: number;
};

const TERMINAL_RATE = 2.0; // chars/frame — 快速終端輸入手感

export const CodeBlock: React.FC<Props> = ({ block, accentColor, revealFrame = 0 }) => {
  const { shown, isTyping } = useTypingChars(block.text, revealFrame, TERMINAL_RATE);
  const doneAt = revealFrame + block.text.length / TERMINAL_RATE;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1400,
        background: WHITE,
        border: `4px solid ${BLACK}`,
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: `"SF Mono", "Menlo", "Consolas", "Courier New", ${FONT_FAMILY}`,
      }}
    >
      {/* Terminal title bar */}
      <div
        style={{
          background: BLACK,
          color: WHITE,
          padding: "8px 16px",
          fontSize: 16,
          letterSpacing: 1,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Traffic light dots */}
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E", display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840", display: "inline-block" }} />
        <span style={{ marginLeft: 8 }}>Terminal</span>
      </div>

      {/* Code content with typing animation */}
      <div
        style={{
          padding: "18px 22px",
          fontSize: 24,
          color: accentColor,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          minHeight: 60,
        }}
      >
        {shown}
        <TypingCursor
          isTyping={isTyping}
          doneAt={doneAt}
          color={accentColor}
          height="0.9em"
          width={3}
        />
      </div>
    </div>
  );
};

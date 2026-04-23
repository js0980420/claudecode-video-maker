import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { SceneVisual } from "../../types";
import { BLACK, FONT_FAMILY, WHITE } from "../../constants";

type Props = Extract<SceneVisual, { type: "chatBox" }> & {
  accentColor: string;
};

const TYPE_FRAMES_PER_MESSAGE = 20;
const PAUSE_BETWEEN_MESSAGES = 6;
const BUBBLE_GRAY = "#F1F1F4";

export const ChatBox: React.FC<Props> = ({
  appName,
  messages,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerPop = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14 },
  });

  let cursor = 22;
  const messageProgresses = messages.map((m) => {
    const start = cursor;
    const end = start + TYPE_FRAMES_PER_MESSAGE;
    const progress = interpolate(frame, [start, end], [0, m.text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const appear = interpolate(frame, [start - 6, start], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    cursor = end + PAUSE_BETWEEN_MESSAGES;
    return { progress, appear, message: m };
  });

  return (
    <div
      style={{
        transform: `scale(${containerPop})`,
        width: 880,
        background: WHITE,
        border: `6px solid ${BLACK}`,
        borderRadius: 20,
        overflow: "hidden",
        fontFamily: FONT_FAMILY,
      }}
    >
      {appName ? (
        <div
          style={{
            background: BLACK,
            color: WHITE,
            padding: "12px 22px",
            fontSize: 16,
            letterSpacing: 2,
            fontWeight: 700,
          }}
        >
          {appName}
        </div>
      ) : null}
      <div
        style={{
          padding: "28px 26px",
          minHeight: 180,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {messageProgresses.map(({ progress, appear, message }, i) => {
          const visible = message.text.substring(0, Math.floor(progress));
          const isUser = message.role === "user";
          const bubbleBg = isUser
            ? message.accent
              ? accentColor
              : BLACK
            : BUBBLE_GRAY;
          const textColor = isUser ? WHITE : BLACK;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                opacity: appear,
                transform: `translateY(${(1 - appear) * 8}px)`,
              }}
            >
              {progress > 0 ? (
                <div
                  style={{
                    background: bubbleBg,
                    color: textColor,
                    padding: "12px 22px",
                    borderRadius: 18,
                    fontSize: 26,
                    fontWeight: 600,
                    maxWidth: "78%",
                    lineHeight: 1.3,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {visible || " "}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

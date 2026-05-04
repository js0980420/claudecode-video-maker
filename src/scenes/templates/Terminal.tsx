import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { SceneVisual } from "../../types";
import { BLACK, FONT_FAMILY, WHITE } from "../../constants";

type Props = Extract<SceneVisual, { type: "terminal" }> & {
  accentColor: string;
};

const TYPE_FRAMES_PER_LINE = 22;
const PAUSE_BETWEEN_LINES = 4;

export const Terminal: React.FC<Props> = ({ appName, lines, accentColor }) => {
  const frame = useCurrentFrame();

  // #3 stagger: 容器整體以 Back easing 進場
  const containerP = interpolate(Math.max(0, frame - 10), [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
  });

  const caret = Math.floor(frame / 8) % 2;

  // Compute progress for each line by accumulating start offsets
  let cursor = 24; // start typing after this many frames
  const lineProgresses = lines.map((line) => {
    const start = cursor;
    const end = start + TYPE_FRAMES_PER_LINE;
    const progress = interpolate(frame, [start, end], [0, line.text.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    cursor = end + PAUSE_BETWEEN_LINES;
    return { progress, line };
  });

  // #5 游標 glow
  const caretGlow = 8 + Math.sin(frame / 10) * 4;

  return (
    <div
      style={{
        opacity: containerP,
        transform: `scale(${containerP}) translateY(${(1 - containerP) * 24}px)`,
        width: 880,
        background: WHITE,
        border: `6px solid ${BLACK}`,
        borderRadius: 16,
        overflow: "hidden",
        // Mono first; falls back to FONT_FAMILY (Noto Sans TC) for CJK chars
        // so terminal lines can mix English commands with non-Latin text.
        fontFamily: `"SF Mono", "Menlo", "Consolas", "Courier New", ${FONT_FAMILY}`,
      }}
    >
      <div
        style={{
          background: BLACK,
          padding: "10px 18px",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <Dot color="#FF5F57" />
        <Dot color="#FEBC2E" />
        <Dot color="#28C840" />
        {appName ? (
          <div
            style={{
              color: WHITE,
              fontSize: 14,
              marginLeft: 14,
              letterSpacing: 2,
              fontFamily: "inherit",
            }}
          >
            {appName}
          </div>
        ) : null}
      </div>
      <div
        style={{
          padding: "22px 26px",
          minHeight: 160,
          fontSize: 24,
          color: BLACK,
          lineHeight: 1.6,
        }}
      >
        {lineProgresses.map(({ progress, line }, i) => {
          const visible = line.text.substring(0, Math.floor(progress));
          const stillTyping = progress > 0 && progress < line.text.length;
          return (
            <div key={i} style={{ marginTop: i === 0 ? 0 : 8 }}>
              {progress > 0 ? (
                <>
                  <span style={{ color: line.accent ? accentColor : BLACK }}>
                    {visible}
                  </span>
                  {stillTyping && caret ? (
                    <span style={{ color: BLACK, filter: `drop-shadow(0 0 ${caretGlow}px ${BLACK})` }}>▌</span>
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ width: 12, height: 12, borderRadius: 6, background: color }} />
);

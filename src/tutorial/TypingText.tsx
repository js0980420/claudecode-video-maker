import React from "react";
import { useCurrentFrame } from "remotion";

/**
 * 計算目前應該顯示幾個字元，並回傳 isTyping 狀態。
 * rate: chars per frame（speech ~0.8, terminal ~2.0）
 */
export function useTypingChars(
  text: string,
  startFrame: number,
  rate = 1.0,
): { shown: string; isTyping: boolean } {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const charCount = Math.min(text.length, Math.floor(elapsed * rate));
  return { shown: text.slice(0, charCount), isTyping: charCount < text.length };
}

/**
 * 游標：打字中穩定顯示；打字結束後繼續閃爍 90 幀（3 秒），之後消失。
 * 非對稱週期（顯示 11f / 隱藏 7f）比完全對稱更像真實游標。
 */
export const TypingCursor: React.FC<{
  isTyping: boolean;
  doneAt: number;       // text.length / rate + startFrame（打字完成的 frame）
  color?: string;
  height?: number | string;
  width?: number;
}> = ({ isTyping, doneAt, color = "#555", height = "1em", width = 2.5 }) => {
  const frame = useCurrentFrame();
  if (isTyping) {
    return <CursorBar color={color} height={height} width={width} />;
  }
  // 打字完成後：閃爍 90 幀再淡出
  const sinceFinish = frame - doneAt;
  if (sinceFinish > 90) return null;
  const visible = (frame % 18) < 11;
  return visible ? <CursorBar color={color} height={height} width={width} /> : null;
};

const CursorBar: React.FC<{ color: string; height: number | string; width: number }> = ({ color, height, width }) => (
  <span
    style={{
      display: "inline-block",
      width,
      height,
      background: color,
      marginLeft: 3,
      verticalAlign: "text-bottom",
      borderRadius: 2,
    }}
  />
);

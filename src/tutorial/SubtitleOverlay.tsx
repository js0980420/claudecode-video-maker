import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { TutorialStep } from "./types";

// ── 型別 ──────────────────────────────────────────────────────────────────────

type Segment = {
  from: number; // 秒(相對於影片開頭)
  to: number;   // 秒
  text: string;
};

export type SubtitleOverlayProps = {
  introText: string;         // intro.voiceover
  outroText: string;         // outro.voiceover
  steps: TutorialStep[];     // 含 voiceovers[]
  durations: Record<string, number>; // wav 長度(秒)
  introOffsetSec?: number;
};

// ── 切句邏輯 ──────────────────────────────────────────────────────────────────

/**
 * CC 風格：按 ，。？！；切句，中括號 [...] 內視為整體不切。
 * 移除行尾 ，。（顯示更乾淨）；保留 ？！：...、 等其他標點。
 */
function splitIntoSentences(text: string): string[] {
  if (!text) return [];

  const PLACEHOLDER = "";
  const brackets: string[] = [];
  const safe = text.replace(/\[[^\]]*\]/g, (m) => {
    brackets.push(m);
    return PLACEHOLDER;
  });

  // CC 風格：按 ，。？！；、切句，每句獨立顯示
  const parts: string[] = [];
  let cur = "";
  for (const ch of safe) {
    cur += ch;
    if ("，。？！；、".includes(ch)) {
      const t = cur.trim();
      if (t) parts.push(t);
      cur = "";
    }
  }
  const remaining = cur.trim();
  if (remaining) parts.push(remaining);

  let idx = 0;
  return parts
    .map((s) => s.replace(new RegExp(PLACEHOLDER, "g"), () => brackets[idx++] ?? ""))
    // 移除行尾 ，。；顯示更乾淨；保留 ？！：...、
    .map((s) => s.replace(/[，。]\s*$/, "").trim())
    .filter(Boolean);
}

/**
 * 計算一個句子的「有效字數」(不計空白,中括號視為其內容字數)。
 */
function charCount(s: string): number {
  return s.replace(/\s/g, "").length || 1;
}

/**
 * 把一段 voiceover 文字拆成帶時間的 segments。
 * @param text     voiceover 字串
 * @param startSec 這段配音在影片中的起始秒數
 * @param durSec   這段配音的總秒數
 */
function textToSegments(
  text: string,
  startSec: number,
  durSec: number,
): Segment[] {
  if (!text || durSec <= 0) return [];
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return [];

  const totalChars = sentences.reduce((sum, s) => sum + charCount(s), 0);
  const out: Segment[] = [];
  let cursor = startSec;
  const MIN_DUR = 1.2;

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const ratio = charCount(s) / totalChars;
    const rawDur = durSec * ratio;
    const remaining = startSec + durSec - cursor;
    let sDur: number;
    if (i === sentences.length - 1) {
      sDur = remaining;
    } else {
      const reservedForRest = MIN_DUR * (sentences.length - i - 1);
      sDur = Math.max(MIN_DUR, Math.min(rawDur, remaining - reservedForRest));
    }
    out.push({ from: cursor, to: cursor + sDur, text: s });
    cursor += sDur;
  }
  return out;
}

// ── buildSegments ─────────────────────────────────────────────────────────────

function buildSegments(
  introText: string,
  outroText: string,
  steps: TutorialStep[],
  durations: Record<string, number>,
): Segment[] {
  const out: Segment[] = [];
  let cursor = 0; // 秒

  // 1. intro
  const introDur = durations["intro"] ?? 0;
  out.push(...textToSegments(introText, cursor, introDur));
  const INTRO_MIN_SEC = 90 / 30;
  const TAIL_SEC = 15 / 30;
  const introSceneSec = Math.max(INTRO_MIN_SEC, Math.ceil(introDur * 30) / 30 + TAIL_SEC);
  cursor = introSceneSec;

  // 2. steps
  for (const step of steps) {
    const voiceovers = step.voiceovers ?? [];
    const HEAD_DELAY_SEC = 15 / 30;
    const PAGE_TAIL_SEC = 15 / 30;
    const pageCount = Math.max(voiceovers.length, 1);

    for (let i = 0; i < pageCount; i++) {
      const wavKey = `${step.id}-p${i + 1}`;
      const audioDur = durations[wavKey] ?? 0;
      const voiceover = voiceovers[i] ?? "";

      const audioStartSec = cursor + HEAD_DELAY_SEC;
      out.push(...textToSegments(voiceover, audioStartSec, audioDur));

      const pageDurSec =
        audioDur > 0
          ? Math.max(
              (15 + 5 + 0 + 8) / 30 + PAGE_TAIL_SEC,
              HEAD_DELAY_SEC + audioDur + TAIL_SEC,
            )
          : (15 + 5 + 0 + 8) / 30 + PAGE_TAIL_SEC;

      cursor += pageDurSec;
    }
  }

  // 3. outro
  const outroDur = durations["outro"] ?? 0;
  out.push(...textToSegments(outroText, cursor, outroDur));

  return out;
}

// ── 元件 ──────────────────────────────────────────────────────────────────────

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({
  introText,
  outroText,
  steps,
  durations,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isReel = height > width;

  // 16:9 (YT) 不嵌字幕，走 SRT CC track
  if (!isReel) return null;

  const t = frame / fps;

  const segments = useMemo(
    () => buildSegments(introText, outroText, steps, durations),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [introText, outroText],
  );

  const current = segments.find((s) => t >= s.from && t < s.to);

  if (!current) return null;

  const fontSize = isReel ? 42 : 32;
  const marginBottom = isReel ? 380 : 60;
  const maxWidth = isReel ? 960 : 1700;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          bottom: marginBottom,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize,
            color: "white",
            textShadow:
              "2px 2px 0 black, -2px -2px 0 black, 2px -2px 0 black, -2px 2px 0 black",
            fontWeight: 600,
            maxWidth,
            textAlign: "center",
            padding: "8px 16px",
            background: "rgba(0,0,0,0.5)",
            borderRadius: 4,
            lineHeight: 1.5,
          }}
        >
          {current.text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

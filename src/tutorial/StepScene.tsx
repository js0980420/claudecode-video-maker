import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Block, TutorialStep, Watermark } from "./types";
import { Paragraph } from "./blocks/Paragraph";
import { ImageBlock } from "./blocks/ImageBlock";
import { CodeBlock } from "./blocks/CodeBlock";
import { CalloutBlock } from "./blocks/CalloutBlock";
import { BLACK, FONT_FAMILY, WHITE } from "../constants";

type Props = {
  step: TutorialStep;
  accentColor: string;
  pageAudioDurations?: (number | null | undefined)[]; // seconds per page, or null/undefined
  watermark?: Watermark; // 右下角浮水印(預設 bottomRight);省略則不顯示
  videoName: string; // 用來組音訊檔路徑:voiceover/<videoName>/<step.id>-pN.wav
};

const FPS = 30;
const TAIL_FRAMES = 15; // 0.5s tail after audio to avoid cut-off
const START_OFFSET_FRAMES = 5; // 0.17s — 標題出現後第一個 block 立刻出現
const STAGGER_FRAMES = 10; // 0.33s — 相鄰 block 的起始間隔(快節奏,跟音訊搭)
const FADE_IN_FRAMES = 8; // 0.27s — block 淡入過渡
const HEAD_DELAY_FRAMES = 30; // 1s — 換頁時先讓 title 站定再開始 reveal + audio,避免太衝
const PAGE_TAIL_FRAMES = 30; // 1s — 最後一個 block 顯示完之後讓觀眾看一下

export function splitIntoPages(blocks: Block[]): Block[][] {
  const pages: Block[][] = [[]];
  for (const b of blocks) {
    if (b.type === "pageBreak") {
      pages.push([]);
    } else {
      pages[pages.length - 1].push(b);
    }
  }
  // 排除空 page(例如開頭或結尾誤插 pageBreak)
  return pages.filter((p) => p.length > 0);
}

export function pageDurationFrames(
  pageBlocks: Block[],
  audioDurationSec?: number | null,
): number {
  // natural = HEAD_DELAY + 所有 block 依序淡入 + PAGE_TAIL
  const revealFrames =
    HEAD_DELAY_FRAMES +
    START_OFFSET_FRAMES +
    Math.max(0, pageBlocks.length - 1) * STAGGER_FRAMES +
    FADE_IN_FRAMES;
  let total = revealFrames + PAGE_TAIL_FRAMES;
  if (audioDurationSec && audioDurationSec > 0) {
    const audioFrames =
      HEAD_DELAY_FRAMES + Math.ceil(audioDurationSec * FPS) + TAIL_FRAMES;
    total = Math.max(total, audioFrames);
  }
  return total;
}

export function stepDurationFrames(
  step: TutorialStep,
  pageAudioDurations?: (number | null | undefined)[],
): number {
  const pages = splitIntoPages(step.blocks);
  return pages.reduce(
    (sum, p, i) => sum + pageDurationFrames(p, pageAudioDurations?.[i] ?? null),
    0,
  );
}

export const StepScene: React.FC<Props> = ({
  step,
  accentColor,
  pageAudioDurations,
  watermark,
  videoName,
}) => {
  const pages = splitIntoPages(step.blocks);
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: WHITE }}>
      {pages.map((pageBlocks, i) => {
        const audioSec = pageAudioDurations?.[i] ?? null;
        const dur = pageDurationFrames(pageBlocks, audioSec);
        const from = cursor;
        cursor += dur;
        const audioSrc = step.voiceovers?.[i]
          ? staticFile(`voiceover/${videoName}/${step.id}-p${i + 1}.wav`)
          : null;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <PageContent
              title={step.title}
              blocks={pageBlocks}
              accentColor={accentColor}
              watermark={watermark}
            />
            {audioSrc ? (
              <Sequence from={HEAD_DELAY_FRAMES}>
                <Audio src={audioSrc} />
              </Sequence>
            ) : null}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const WatermarkOverlay: React.FC<{ watermark: Watermark }> = ({ watermark }) => {
  const size = watermark.size ?? 72;
  const opacity = watermark.opacity ?? 0.85;
  const position = watermark.position ?? "bottomRight";
  const margin = 32;
  const positionStyles: Record<NonNullable<Watermark["position"]>, React.CSSProperties> = {
    bottomRight: { bottom: margin, right: margin },
    bottomLeft: { bottom: margin, left: margin },
    topRight: { top: margin, right: margin },
    topLeft: { top: margin, left: margin },
  };
  // src 可以是:
  //   - bundled 的 URL(來自 config.ts 的 import ... from "../../input/...")
  //   - public/ 下的相對路徑(需自行用 staticFile 包)
  // 簡單偵測:已經是 http/blob/data URL 或 /_bundle 開頭就直接用,否則 staticFile。
  const resolvedSrc =
    /^(https?:|blob:|data:|\/)/.test(watermark.src)
      ? watermark.src
      : staticFile(watermark.src);
  return (
    <Img
      src={resolvedSrc}
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        opacity,
        ...positionStyles[position],
      }}
    />
  );
};

const PageContent: React.FC<{
  title: string;
  blocks: Block[];
  accentColor: string;
  watermark?: Watermark;
}> = ({ title, blocks, accentColor, watermark }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.6 },
  });

  // block 的 reveal 時機加上 HEAD_DELAY,跟音訊起點對齊。
  // title 不延遲(spring 從 frame 0 跑),所以換頁時先看到標題定下來再 reveal blocks。
  const blockTimings = blocks.map((_, i) => ({
    from: HEAD_DELAY_FRAMES + START_OFFSET_FRAMES + i * STAGGER_FRAMES,
  }));

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: WHITE,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 64px",
        gap: 24,
        fontFamily: FONT_FAMILY,
        color: BLACK,
        boxSizing: "border-box",
      }}
    >
      {watermark ? <WatermarkOverlay watermark={watermark} /> : null}

      <div
        style={{
          fontSize: 56,
          fontWeight: 900,
          opacity: titleSpring,
          transform: `translateY(${(1 - titleSpring) * -20}px)`,
          textAlign: "left",
          lineHeight: 1.2,
          width: "100%",
          maxWidth: 1400,
        }}
      >
        {title}
      </div>

      {blocks.map((block, i) => {
        const { from } = blockTimings[i];
        const opacity = interpolate(
          frame,
          [from, from + FADE_IN_FRAMES],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const translateY = interpolate(
          frame,
          [from, from + FADE_IN_FRAMES],
          [16, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return (
          <div
            key={i}
            style={{
              opacity,
              transform: `translateY(${translateY}px)`,
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <BlockRenderer block={block} accentColor={accentColor} />
          </div>
        );
      })}
    </div>
  );
};

const BlockRenderer: React.FC<{ block: Block; accentColor: string }> = ({
  block,
  accentColor,
}) => {
  switch (block.type) {
    case "paragraph": return <Paragraph block={block} accentColor={accentColor} />;
    case "image":     return <ImageBlock block={block} />;
    case "code":      return <CodeBlock block={block} accentColor={accentColor} />;
    case "callout":   return <CalloutBlock block={block} accentColor={accentColor} />;
    case "pageBreak": return null; // 不該走到這裡(splitIntoPages 已過濾)
  }
};

import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Block, TutorialStep } from "./types";
import { Paragraph } from "./blocks/Paragraph";
import { ImageBlock } from "./blocks/ImageBlock";
import { CodeBlock } from "./blocks/CodeBlock";
import { CalloutBlock } from "./blocks/CalloutBlock";
import { BLACK, FONT_FAMILY, WHITE } from "../constants";

type Props = {
  step: TutorialStep;
  accentColor: string;
};

const FPS = 30;
const OVERLAP_FRAMES = 9;

export function blockDurationFrames(block: Block): number {
  switch (block.type) {
    case "paragraph": return 2.0 * FPS;
    case "image":     return 3.0 * FPS;
    case "code":      return 3.0 * FPS;
    case "callout":   return 2.5 * FPS;
    case "pageBreak": return 0;
  }
}

function splitIntoPages(blocks: Block[]): Block[][] {
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

export function pageDurationFrames(pageBlocks: Block[]): number {
  let total = 0;
  pageBlocks.forEach((b, i) => {
    const d = blockDurationFrames(b);
    total += d - (i === 0 ? 0 : OVERLAP_FRAMES);
  });
  total += FPS; // 1 秒 tail
  return total;
}

export function stepDurationFrames(step: TutorialStep): number {
  const pages = splitIntoPages(step.blocks);
  return pages.reduce((sum, p) => sum + pageDurationFrames(p), 0);
}

export const StepScene: React.FC<Props> = ({ step, accentColor }) => {
  const pages = splitIntoPages(step.blocks);
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: WHITE }}>
      {pages.map((pageBlocks, i) => {
        const dur = pageDurationFrames(pageBlocks);
        const from = cursor;
        cursor += dur;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <PageContent
              title={step.title}
              blocks={pageBlocks}
              accentColor={accentColor}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const PageContent: React.FC<{
  title: string;
  blocks: Block[];
  accentColor: string;
}> = ({ title, blocks, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.6 },
  });

  let cursor = FPS * 0.5;
  const blockTimings = blocks.map((b, i) => {
    const from = cursor - (i === 0 ? 0 : OVERLAP_FRAMES);
    const duration = blockDurationFrames(b);
    cursor = from + duration;
    return { from, duration };
  });

  return (
    <div
      style={{
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
          [from, from + 12],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        const translateY = interpolate(
          frame,
          [from, from + 12],
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

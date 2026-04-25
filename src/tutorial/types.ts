/**
 * Prototype-only types for the tutorial capture pipeline.
 * 故意不合併進 src/types.ts,prototype 可隨時整個 src/tutorial/ 刪除。
 */

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

export type ParagraphBlock = { type: "paragraph"; text: string };
export type ImageBlock = { type: "image"; src: string; alt: string };
export type CodeBlock = { type: "code"; text: string };
export type CalloutBlock = {
  type: "callout";
  kind: "tip" | "info" | "warn";
  icon: string;
  text: string;
};
export type PageBreakBlock = { type: "pageBreak" };

export type Block =
  | ParagraphBlock
  | ImageBlock
  | CodeBlock
  | CalloutBlock
  | PageBreakBlock;

export type TutorialStep = {
  id: string;
  title: string;
  blocks: Block[];
  voiceovers?: string[]; // index = page index (0-based); matches pageBreak split
  pointAt: Point | null;
  highlightBox: Box | null;
};

export type TutorialData = {
  source: string;
  chapter: string;
  capturedAt: string;
  intro?: { voiceover?: string };
  steps: TutorialStep[];
};

// ============================================================
// Tutorial-specific config (brand / titles / platform badge)
// ============================================================

import type { ThumbnailContent } from "../types";
import type { IconName } from "./icons";

export type PlatformBadge = {
  icon: IconName;
  label: string;
};

/**
 * 浮水印(sponsor / brand mark),以圖檔方式固定在畫面某角落。
 * src 相對於 public/,由 Remotion staticFile() 解析。
 */
export type Watermark = {
  src: string; // 例如 "images/zeabur.png"
  size?: number; // px,預設 72
  opacity?: number; // 0..1,預設 0.85
  position?: "bottomRight" | "bottomLeft" | "topRight" | "topLeft"; // 預設 bottomRight
};

/**
 * Video-specific configuration. All user-facing text, brand,
 * accent color, platform indicators live here. Not in source code.
 *
 * File at src/tutorial/config.ts (gitignored) exports this;
 * src/tutorial/config.example.ts is the template other devs see.
 */
export type TutorialConfig = {
  // 對應 public/screenshots/<videoName>/ 與 public/voiceover/<videoName>/ 的資料夾名,
  // 共用元件靠這個 derive intro/step 音訊路徑與 Remotion composition id。
  // 各 video worktree 必填,例:"tutorial-ch1" / "tutorial-ch2"。
  videoName: string;
  accentColor: string; // hex, e.g. "#E63946"
  intro: {
    titleAccent: string; // e.g. "Claude Code"
    titleSuffix: string; // e.g. "安裝教學" or "Tutorial"
    platform?: PlatformBadge; // optional pill below title
  };
  watermark?: Watermark; // 每個 step scene 右下角的浮水印
  thumbnail: {
    content: ThumbnailContent; // titleParts/features/tagline/brand
    platformBadge?: PlatformBadge; // optional overlay on thumbnails
  };
};

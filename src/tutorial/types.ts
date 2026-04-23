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
  pointAt: Point | null;
  highlightBox: Box | null;
};

export type TutorialData = {
  source: string;
  chapter: string;
  capturedAt: string;
  steps: TutorialStep[];
};

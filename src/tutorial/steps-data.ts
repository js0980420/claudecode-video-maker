import { TutorialData, TutorialStep, Block } from "./types";

function parseBlock(raw: unknown, ctx: string): Block {
  if (!raw || typeof raw !== "object") {
    throw new Error(`${ctx}: not an object`);
  }
  const b = raw as Record<string, unknown>;
  const t = b.type;
  if (t === "paragraph") {
    if (typeof b.text !== "string" || !b.text.length) {
      throw new Error(`${ctx}: paragraph.text must be non-empty string`);
    }
    return { type: "paragraph", text: b.text };
  }
  if (t === "image") {
    for (const k of ["src", "alt"] as const) {
      if (typeof b[k] !== "string") {
        throw new Error(`${ctx}: image.${k} must be string`);
      }
    }
    return { type: "image", src: b.src as string, alt: b.alt as string };
  }
  if (t === "code") {
    if (typeof b.text !== "string" || !b.text.length) {
      throw new Error(`${ctx}: code.text must be non-empty string`);
    }
    return { type: "code", text: b.text };
  }
  if (t === "callout") {
    const kind = b.kind;
    if (kind !== "tip" && kind !== "info" && kind !== "warn") {
      throw new Error(`${ctx}: callout.kind invalid: ${String(kind)}`);
    }
    for (const k of ["icon", "text"] as const) {
      if (typeof b[k] !== "string") {
        throw new Error(`${ctx}: callout.${k} must be string`);
      }
    }
    return {
      type: "callout",
      kind,
      icon: b.icon as string,
      text: b.text as string,
    };
  }
  if (t === "pageBreak") {
    return { type: "pageBreak" };
  }
  throw new Error(`${ctx}: unknown block type: ${String(t)}`);
}

export function parseTutorialData(raw: unknown): TutorialData {
  if (!raw || typeof raw !== "object") {
    throw new Error("tutorial data: expected object");
  }
  const obj = raw as Record<string, unknown>;
  const steps = obj.steps;
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error("tutorial data: steps must be a non-empty array");
  }
  const parsedSteps: TutorialStep[] = steps.map((s, i) => {
    if (!s || typeof s !== "object") {
      throw new Error(`tutorial data: step[${i}] not an object`);
    }
    const step = s as Record<string, unknown>;
    for (const k of ["id", "title"] as const) {
      if (typeof step[k] !== "string" || !(step[k] as string).length) {
        throw new Error(`tutorial data: step[${i}].${k} must be non-empty string`);
      }
    }
    const blocks = step.blocks;
    if (!Array.isArray(blocks) || blocks.length === 0) {
      throw new Error(`tutorial data: step[${i}].blocks must be non-empty array`);
    }
    return {
      id: step.id as string,
      title: step.title as string,
      blocks: blocks.map((b, j) =>
        parseBlock(b, `tutorial data: step[${i}].blocks[${j}]`),
      ),
      pointAt: null,
      highlightBox: null,
    };
  });
  return {
    source: String(obj.source ?? ""),
    chapter: String(obj.chapter ?? ""),
    capturedAt: String(obj.capturedAt ?? ""),
    steps: parsedSteps,
  };
}

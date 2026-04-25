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
    const size = b.size;
    if (size !== undefined && size !== "default" && size !== "hero") {
      throw new Error(`${ctx}: callout.size invalid: ${String(size)}`);
    }
    return {
      type: "callout",
      kind,
      icon: b.icon as string,
      text: b.text as string,
      ...(size ? { size } : {}),
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
      voiceovers: Array.isArray(step.voiceovers)
        ? (step.voiceovers as unknown[]).map((v, vi) => {
            if (typeof v !== "string" || v.length === 0) {
              throw new Error(
                `tutorial data: step[${i}].voiceovers[${vi}] must be non-empty string`,
              );
            }
            return v;
          })
        : undefined,
      pageTitles: Array.isArray(step.pageTitles)
        ? (step.pageTitles as unknown[]).map((t, ti) => {
            if (t === null || t === undefined) return null;
            if (typeof t !== "string") {
              throw new Error(
                `tutorial data: step[${i}].pageTitles[${ti}] must be string or null`,
              );
            }
            return t;
          })
        : undefined,
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
    intro:
      obj.intro && typeof obj.intro === "object"
        ? {
            voiceover:
              typeof (obj.intro as Record<string, unknown>).voiceover ===
              "string"
                ? ((obj.intro as Record<string, unknown>).voiceover as string)
                : undefined,
          }
        : undefined,
    outro:
      obj.outro && typeof obj.outro === "object"
        ? {
            voiceover:
              typeof (obj.outro as Record<string, unknown>).voiceover ===
              "string"
                ? ((obj.outro as Record<string, unknown>).voiceover as string)
                : undefined,
          }
        : undefined,
    steps: parsedSteps,
  };
}

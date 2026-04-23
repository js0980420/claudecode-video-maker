/**
 * 執行:npx tsx --test src/tutorial/steps-data.test.ts
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTutorialData } from "./steps-data";

const minimalStep = {
  id: "ch1-s1",
  title: "t",
  blocks: [{ type: "paragraph", text: "hello" }],
  pointAt: null,
  highlightBox: null,
};

test("parseTutorialData: 接受最小合法資料", () => {
  const input = {
    source: "s", chapter: "c", capturedAt: "t",
    steps: [minimalStep],
  };
  const result = parseTutorialData(input);
  assert.equal(result.steps.length, 1);
  assert.equal(result.steps[0].blocks.length, 1);
});

test("parseTutorialData: steps 為空陣列拒絕", () => {
  const input = { source: "s", chapter: "c", capturedAt: "t", steps: [] };
  assert.throws(() => parseTutorialData(input), /steps/);
});

test("parseTutorialData: 接受各種 block 類型", () => {
  const input = {
    source: "s", chapter: "c", capturedAt: "t",
    steps: [
      {
        id: "s1", title: "t", pointAt: null, highlightBox: null,
        blocks: [
          { type: "paragraph", text: "hello" },
          { type: "image", src: "x.png", alt: "y" },
          { type: "code", text: "curl x" },
          { type: "callout", kind: "tip", icon: "💡", text: "z" },
        ],
      },
    ],
  };
  const result = parseTutorialData(input);
  assert.equal(result.steps[0].blocks.length, 4);
  assert.equal(result.steps[0].blocks[0].type, "paragraph");
  assert.equal(result.steps[0].blocks[3].type, "callout");
});

test("parseTutorialData: 拒絕 blocks 為空陣列", () => {
  const input = {
    source: "s", chapter: "c", capturedAt: "t",
    steps: [{ ...minimalStep, blocks: [] }],
  };
  assert.throws(() => parseTutorialData(input), /blocks/);
});

test("parseTutorialData: 拒絕未知 block type", () => {
  const input = {
    source: "s", chapter: "c", capturedAt: "t",
    steps: [
      {
        ...minimalStep,
        blocks: [{ type: "banana", text: "?" }],
      },
    ],
  };
  assert.throws(() => parseTutorialData(input), /type/);
});

test("parseTutorialData: 接受 pageBreak block", () => {
  const input = {
    source: "s", chapter: "c", capturedAt: "t",
    steps: [
      {
        id: "s1", title: "t", pointAt: null, highlightBox: null,
        blocks: [
          { type: "paragraph", text: "a" },
          { type: "pageBreak" },
          { type: "paragraph", text: "b" },
        ],
      },
    ],
  };
  const result = parseTutorialData(input);
  assert.equal(result.steps[0].blocks.length, 3);
  assert.equal(result.steps[0].blocks[1].type, "pageBreak");
});

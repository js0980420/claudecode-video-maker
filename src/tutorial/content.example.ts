/**
 * Per-video 內容 shim — 把 static JSON imports 集中在這一個檔。
 *
 * 為什麼需要:Remotion 用 webpack bundler,`import x from "./foo.json"`
 * 路徑必須是 build-time 字串字面值,不能用 runtime 變數。所以雖然其他
 * 共用元件可以靠 TUTORIAL_CONFIG.videoName 動態組路徑(staticFile),
 * steps.json 和 durations.json 這兩個 JSON import 一定要在某個地方
 * 寫死路徑 — 那個地方就是這個檔。
 *
 * 用法:
 *   1. 這個 content.example.ts 留在 main(範本,各 worktree 共用基礎)。
 *   2. 各 video worktree 第一次 npm install 會自動 cp → src/tutorial/content.ts
 *      (gitignored,各 video branch 自己擁有)。
 *   3. 把 content.ts 裡 PLACEHOLDER 區塊整段刪掉,取消註解 import 兩行
 *      並改成你這支影片的 videoName。
 *
 * Per-video content.ts 應該長這樣:
 *
 *   import stepsJson from "../../public/screenshots/tutorial-ch2/steps.json";
 *   import durations from "../../public/voiceover/tutorial-ch2/durations.json";
 *   export const TUTORIAL_STEPS_JSON = stepsJson;
 *   export const TUTORIAL_DURATIONS = durations as Record<string, number>;
 */

// PLACEHOLDER — 沒設定真實 import 時讓 main 仍能 type-check / build。
// 各 video worktree 把下面整段刪掉,改成上面註解示範的 import 寫法。
export const TUTORIAL_STEPS_JSON: unknown = {
  source: "",
  chapter: "請編輯 src/tutorial/content.ts 指向你這支影片的 steps.json",
  capturedAt: "1970-01-01T00:00:00.000Z",
  steps: [
    {
      id: "placeholder-s1",
      title: "尚未設定 content.ts",
      blocks: [
        {
          type: "paragraph",
          text: "把 src/tutorial/content.ts 的 PLACEHOLDER 區塊刪掉,改成 import 自己的 steps.json + durations.json。",
        },
      ],
      pointAt: null,
      highlightBox: null,
    },
  ],
};

export const TUTORIAL_DURATIONS: Record<string, number> = {};

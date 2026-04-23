# Claude Videos

A [Remotion](https://www.remotion.dev/) marketing-video template designed to be driven entirely by **Claude Code** — every piece of content (script, scenes, voiceover, BGM, thumbnails) lives in a single typed config file. Decoupled modules, any number of scenes, bilingual.

> 一個用 Claude Code 對話就能完成的 Remotion 行銷影片模板。所有文案、場景、AI 配音、背景音樂、縮圖都集中在一個型別化的 config 檔案。各模組可獨立開關，場景數量任意。

---

## Quick start / 快速開始

```bash
git clone <this-repo>
cd <this-repo>
npm install   # 自動建立 src/content.ts (從 content.example.ts 複製)
npm run dev   # 開啟 Remotion Studio (http://localhost:3000)
```

That's it — the demo video plays out of the box (5 scenes, no audio).

第一步就會看到範例影片（5 個場景，無配音）。要客製化內容，往下看。

---

## Customize with Claude Code / 用 Claude Code 客製化

The whole video is one file: **`src/content.ts`** (gitignored, your private copy).

整支影片只有一個檔案：`src/content.ts`（已加入 .gitignore，是你的私人版本）。

Just ask Claude Code:

> 「幫我把 src/content.ts 改成關於 [我的產品] 的 30 秒影片，5 個場景，主色換成 #00BFA5」
> "Open src/content.ts and make a 30-second video about [my product] with 5 scenes, primary color #00BFA5"

Claude Code will edit `content.ts` directly — no need to touch component code.

> 💡 `meta.videoName` 是檔名來源 — 改名後 render 出來的 `mp4` / `png` 也會自動換名，不會覆蓋舊版本。

---

## What's modular / 模組化部分

Every module can be turned off independently in `content.ts`:

| Module        | How to disable | What happens |
|---------------|---------------|--------------|
| **AI voiceover** | `voiceover.enabled = false` | Falls back to `scene.durationSeconds` |
| **BGM**       | `bgm.enabled = false` | No background music track |
| **Thumbnails** | Omit `thumbnails.yt` / `ig` / `reel` | Format isn't registered |
| **Scenes**    | Add / remove items in `scenes: [...]` | Composition length recalculates automatically |

Want a new visual template? Add a variant to `SceneVisual` in `src/types.ts` and a case in `src/scenes/SceneRenderer.tsx`.

要新增場景視覺類型？在 `src/types.ts` 的 `SceneVisual` 加 variant，然後在 `SceneRenderer.tsx` 加對應 case。

---

## Input assets / 素材輸入 (`input/`)

把要在影片裡用到的素材丟到 `input/` 對應的子資料夾，Claude Code 就能讀到並用於 `content.ts`。資料夾結構會被 git 追蹤，**檔案內容本身被 gitignore**（不會洩漏你的素材）。

```
input/
  images/   # 圖片素材 (PNG / JPG / SVG / WebP …)
  videos/   # 影片素材 (MP4 / MOV / WebM …)
  audio/    # 音訊素材 (MP3 / WAV / AAC …)
```

跟 Claude Code 對話範例：

> 「把 `input/images/logo.png` 加到第一個場景右上角」
> 「用 `input/audio/bgm.mp3` 當背景音樂」

> 💡 **BGM 例外**：背景音樂仍走 `public/music/bgm.mp3`（給 Remotion 在 bundle 時直接 `staticFile()` 讀取）。`input/audio/` 適合放原始素材，最終要被 Composition 用的音樂請放到 `public/music/`。

---

## AI voiceover (optional) / AI 配音（選用）

Uses Google Gemini's `gemini-2.5-flash-preview-tts`. Free tier: 10 req/min.

```bash
cp .env.example .env       # 把 GOOGLE_API_KEY 填進去
# In src/content.ts set voiceover.enabled = true
npm run voiceover          # 為每個場景生成 public/voiceover/<scene-id>.wav
npm run voiceover -- scene-03   # 只重新生成單一場景
```

Voice options: `Puck` (energetic), `Kore`, `Aoede`, `Charon`, `Leda`. For non-English content set `voiceover.promptPrefix` (e.g. `"請用繁體中文說："`) to force the language.

非英文內容請在 `voiceover.promptPrefix` 強制指定語言，例如 `"請用熱情活潑的繁體中文說："`，避免被 TTS 模型誤判語系。

---

## Background music (optional) / 背景音樂（選用）

Drop a CC-licensed track at `public/music/bgm.mp3` (the file is gitignored). Then in `content.ts` set:

```ts
bgm: {
  enabled: true,
  file: "music/bgm.mp3",
  volume: 0.55,
  attribution: "Music: <Title> by <Author> (CC BY 4.0)",
},
```

Free sources: [Kevin MacLeod / incompetech.com](https://incompetech.com/), [YouTube Audio Library](https://studio.youtube.com/), [Pixabay Music](https://pixabay.com/music/).

**Don't forget to credit the artist in your video description if the license requires it.**

---

## Render / 輸出影片

一個指令同時輸出影片 + 三種縮圖，全部依 `meta.videoName` 命名、自動分類到 `output/`：

```bash
npm run render
```

輸出結構：

```
output/
  videos/
    <videoName>.mp4              # 主影片
  thumbnails/
    yt/<videoName>.png           # YouTube 16:9
    ig/<videoName>.png           # Instagram 1:1
    reel/<videoName>.png         # Reel 9:16
```

> 💡 改 `meta.videoName` 等於開新影片版本 — 舊檔案不會被覆蓋。

### 其他渲染指令 / Other render commands

```bash
npm run render:test    # 渲染 src/content-test.ts 定義的測試影片 (用來快速驗證)
npm run render:studio  # 直接呼叫 remotion render，自己帶參數
```

也可以單獨輸出某張縮圖：

```bash
npx remotion still ThumbnailYT output/thumbnails/yt/preview.png
```

---

## Project layout / 專案結構

```
src/
  content.example.ts     # 預設範例（會被追蹤、可公開）
  content.ts             # 你的私人版本（gitignored，由 postinstall 從 example 複製）
  content-test.ts        # 快速測試用的最小化影片
  types.ts               # VideoContent / SceneVisual 型別
  Root.tsx               # 同時註冊主影片 + 測試影片 + 縮圖
  Composition.tsx        # 迭代 content.scenes
  scenes/
    SceneRenderer.tsx    # 依 visual.type 分派模板
    SceneLayout.tsx      # 淡入淡出、品牌角落、場景計數
    templates/           # 一個檔案一種視覺類型
      IconPair.tsx
      CrossedItems.tsx
      Terminal.tsx
      PhoneCTA.tsx
      CenterText.tsx
  thumbnails/            # YT 16:9, IG 1:1, Reel 9:16
  icons.tsx              # 內建 SVG 圖示
  utils/parseHighlights.tsx  # `[bracket]` 主色高亮解析
scripts/
  generate-voiceover.ts  # 讀 content.ts → 呼叫 Gemini TTS
  render-organized.mjs   # `npm run render` 後端：輸出影片 + 三縮圖到 output/
  init-content.mjs       # postinstall：複製 example → content.ts
input/                   # 你要用到的素材（內容 gitignored）
  images/  videos/  audio/
output/                  # 渲染輸出（內容 gitignored，結構保留）
  videos/
  thumbnails/{yt,ig,reel}/
public/
  voiceover/             # 生成的 WAV（gitignored）
  music/                 # 你的 BGM 檔案（gitignored）
```

> 📁 `input/` 跟 `output/` 都是「**結構追蹤、內容不追蹤**」— clone 下來會看到空資料夾，但你的素材跟渲染檔不會被推上 git。

---

## License

MIT for the framework code. **Your `content.ts` is yours** — gitignored by default.

---

## About Remotion / 關於 Remotion

Remotion is normally installed by running this in your terminal:

```bash
npx create-video@latest
```

This repo is a pre-packaged Remotion project — `npm install` already includes Remotion as a dependency, so you don't need to run `create-video` again.

Remotion 的官方安裝方式是在終端機執行 `npx create-video@latest` 建立一個新專案。本 repo 已經是打包好的 Remotion 專案，`npm install` 就會自動安裝 Remotion，不需要再跑 `create-video`。

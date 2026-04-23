# Claude Videos

> 英文版請看 [README.md](./README.md)。

一個可以完全用 **Claude Code** 對話驅動的 [Remotion](https://www.remotion.dev/) 行銷影片模板。所有文案、場景、AI 配音、背景音樂、縮圖都集中在一個型別化的 config 檔案裡。各模組可獨立開關,場景數量任意。

---

## 快速開始

```bash
git clone <this-repo>
cd <this-repo>
npm install   # postinstall 會從 src/content.example.ts 複製出 src/content.ts
npm run dev   # 開啟 Remotion Studio(http://localhost:3000)
```

裝完就能看到範例影片(5 個場景、無配音)。要客製化內容往下看。

---

## 用 Claude Code 客製化 — 生成影片的 Prompt 範例

整支影片只有一個檔案:**`src/content.ts`**(已加入 .gitignore,是你的私人版本)。

你不用改 React 元件,只要用自然語言描述想要的影片,讓 Claude Code 去改寫 `content.ts`。以下是實際有效的 prompt 範例:

**從零開始生成**

> 「幫我把 `src/content.ts` 改成關於 [我的 SaaS 產品] 的 30 秒影片,5 個場景,主色換成 `#00BFA5`,語氣要熱情活潑。」

> 「把 `src/content.ts` 改寫成一支 20 秒的手機 App 預告片。第 1 個場景勾起興趣、第 2–3 個場景講兩個主要功能、第 4 個場景放社群證明、第 5 個場景是『立即下載』CTA。」

**在現有結構上微調**

> 「`src/content.ts` 的結構保留,把每個場景的文字換成 [我的產品] 的內容,場景類型和時長都不要動。」

> 「把 `brand.primaryColor` 改成 `#FF6B35`、`meta.videoName` 改成 `product-launch-v2`、每個場景縮短到 3 秒。」

**新增或移除場景**

> 「在 scene-02 後面插入一個新場景,用 `terminal` 視覺類型,秀出三個安裝我工具的 npm 指令。」

> 「刪掉 scene-04,把 scene-05 換成 `phoneCTA` 場景,連到 `@myhandle`。」

**使用自己的素材**

> 「把 `input/images/logo.png` 放到 scene-01 的右上角,`input/audio/bgm.mp3` 當背景音樂。」

**啟用配音與縮圖**

> 「打開繁體中文 AI 配音(把 `voiceover.promptPrefix` 設成強制語系的前綴),然後產生 YouTube、Instagram 方形、Reel 9:16 三種縮圖,用同一句標語。」

> 💡 `meta.videoName` 是檔名來源 — 改名後 render 出來的 `mp4` / `png` 會自動換名,舊版本不會被覆蓋。

---

## 模組化部分

每個模組都能在 `content.ts` 獨立關閉:

| 模組           | 如何關閉                                 | 關閉後行為                              |
|----------------|------------------------------------------|-----------------------------------------|
| **AI 配音**    | `voiceover.enabled = false`              | 時長回退到 `scene.durationSeconds`     |
| **背景音樂**   | `bgm.enabled = false`                    | 不附加背景音樂軌                        |
| **縮圖**       | 省略 `thumbnails.yt` / `ig` / `reel`     | 對應格式就不會被註冊                    |
| **場景**       | 在 `scenes: [...]` 中增刪                | Composition 總長自動重新計算            |

想新增場景視覺類型?在 `src/types.ts` 的 `SceneVisual` 加 variant,然後在 `src/scenes/SceneRenderer.tsx` 加對應 case。

---

## 素材輸入(`input/`)

把要在影片裡用到的素材丟到 `input/` 對應的子資料夾,Claude Code 就能讀到並用於 `content.ts`。資料夾結構會被 git 追蹤,**檔案內容本身被 gitignore**(不會洩漏你的素材)。

```
input/
  images/   # 圖片素材(PNG / JPG / SVG / WebP …)
  videos/   # 影片素材(MP4 / MOV / WebM …)
  audio/    # 音訊素材(MP3 / WAV / AAC …)
```

跟 Claude Code 對話範例:

> 「把 `input/images/logo.png` 加到第一個場景右上角。」
>
> 「用 `input/audio/bgm.mp3` 當背景音樂。」

> 💡 **BGM 例外**:背景音樂仍走 `public/music/bgm.mp3`(給 Remotion 在 bundle 時直接 `staticFile()` 讀取)。`input/audio/` 適合放原始素材,最終要被 Composition 用的音樂請放到 `public/music/`。

---

## AI 配音(選用)

使用 Google Gemini 的 `gemini-2.5-flash-preview-tts`。免費額度:每分鐘 10 次。

```bash
cp .env.example .env            # 把 GOOGLE_API_KEY 填進去
# 在 src/content.ts 把 voiceover.enabled 改成 true
npm run voiceover               # 為每個場景生成 public/voiceover/<scene-id>.wav
npm run voiceover -- scene-03   # 只重新生成單一場景
```

可選音色:`Puck`(熱情活潑)、`Kore`、`Aoede`、`Charon`、`Leda`。非英文內容請在 `voiceover.promptPrefix` 強制指定語言,例如 `"請用熱情活潑的繁體中文說:"`,避免被 TTS 模型誤判語系。

---

## 背景音樂(選用)

把 CC 授權的音樂檔放到 `public/music/bgm.mp3`(檔案本身被 gitignore)。然後在 `content.ts` 設定:

```ts
bgm: {
  enabled: true,
  file: "music/bgm.mp3",
  volume: 0.55,
  attribution: "Music: <Title> by <Author> (CC BY 4.0)",
},
```

免費音樂來源:[Kevin MacLeod / incompetech.com](https://incompetech.com/)、[YouTube Audio Library](https://studio.youtube.com/)、[Pixabay Music](https://pixabay.com/music/)。

**如果授權要求,請在影片描述中標注原作者。**

---

## 渲染輸出

一個指令同時輸出影片 + 三種縮圖,全部依 `meta.videoName` 命名,用尾綴區分用途,放在 `output/` 根目錄:

```bash
npm run render
```

輸出結構:

```
output/
  <videoName>.mp4        # 主影片
  <videoName>-yt.png     # YouTube 16:9
  <videoName>-ig.png     # Instagram 1:1
  <videoName>-reel.png   # Reel 9:16
```

> 💡 改 `meta.videoName` 等於開新影片版本 — 舊檔案不會被覆蓋。

### 其他渲染指令

```bash
npm run render:test    # 渲染 src/content-test.ts 定義的測試影片(快速驗證用)
npm run render:studio  # 直接呼叫 remotion render,自己帶參數
```

也可以單獨輸出某張縮圖:

```bash
npx remotion still ThumbnailYT output/preview-yt.png
```

---

## 專案結構

```
src/
  content.example.ts     # 預設範例(會被追蹤、可公開)
  content.ts             # 你的私人版本(gitignored,由 postinstall 從 example 複製)
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
  thumbnails/            # YT 16:9、IG 1:1、Reel 9:16
  icons.tsx              # 內建 SVG 圖示
  utils/parseHighlights.tsx  # `[中括號]` 主色高亮解析
scripts/
  generate-voiceover.ts  # 讀 content.ts → 呼叫 Gemini TTS
  render-organized.mjs   # `npm run render` 後端:輸出影片 + 三縮圖到 output/
  init-content.mjs       # postinstall:複製 example → content.ts
input/                   # 你要用到的素材(內容 gitignored)
  images/  videos/  audio/
output/                  # 渲染輸出(內容 gitignored,資料夾本身保留)
                         # <videoName>.mp4 / <videoName>-yt.png / -ig.png / -reel.png
public/
  voiceover/             # 生成的 WAV(gitignored)
  music/                 # 你的 BGM 檔案(gitignored)
```

> 📁 `input/` 跟 `output/` 都是「**結構追蹤、內容不追蹤**」— clone 下來會看到空資料夾,但你的素材跟渲染檔不會被推上 git。

---

## 授權

框架程式碼採 MIT 授權。**你的 `content.ts` 是你的** — 預設已經 gitignore。

---

## 關於 Remotion

Remotion 的官方安裝方式是在終端機執行:

```bash
npx create-video@latest
```

本 repo 已經是打包好的 Remotion 專案,`npm install` 就會自動安裝 Remotion,不需要再跑 `create-video`。

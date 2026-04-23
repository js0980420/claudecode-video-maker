# Claude Videos

A [Remotion](https://www.remotion.dev/) marketing-video template designed to be driven entirely by **Claude Code** — every piece of content (script, scenes, voiceover, BGM, thumbnails) lives in a single typed config file. Decoupled modules, any number of scenes, bilingual.

> 一個用 Claude Code 對話就能完成的 Remotion 行銷影片模板。所有文案、場景、AI 配音、背景音樂、縮圖都集中在一個型別化的 config 檔案。各模組可獨立開關，場景數量任意。

---

## Quick start / 快速開始

```bash
git clone <this-repo>
cd <this-repo>
npm install   # also creates src/content.ts from the example
npm run dev   # opens Remotion Studio at http://localhost:3000
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

## AI voiceover (optional) / AI 配音（選用）

Uses Google Gemini's `gemini-2.5-flash-preview-tts`. Free tier: 10 req/min.

```bash
cp .env.example .env       # then put your GOOGLE_API_KEY in .env
# In src/content.ts set voiceover.enabled = true
npm run voiceover          # generates public/voiceover/<scene-id>.wav for every scene
npm run voiceover -- scene-03   # regenerate just one scene
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

```bash
npm run render -- <composition-id> out/video.mp4
# e.g. npm run render -- Video out/demo.mp4
```

Render thumbnails as PNG:

```bash
npx remotion still ThumbnailYT out/thumbnail-yt.png
npx remotion still ThumbnailIG out/thumbnail-ig.png
npx remotion still ThumbnailReel out/thumbnail-reel.png
```

---

## Project layout / 專案結構

```
src/
  content.example.ts     # the demo content shipped with the repo
  content.ts             # YOUR private copy (gitignored)
  types.ts               # VideoContent / SceneVisual schema
  Root.tsx               # registers compositions from content
  Composition.tsx        # iterates content.scenes
  scenes/
    SceneRenderer.tsx    # dispatches on visual.type
    SceneLayout.tsx      # fade in/out, brand corners, scene counter
    templates/           # one file per visual type
      IconPair.tsx
      CrossedItems.tsx
      Terminal.tsx
      PhoneCTA.tsx
      CenterText.tsx
  thumbnails/            # YT 16:9, IG 1:1, Reel 9:16
  icons.tsx              # built-in SVG icons
  utils/parseHighlights.tsx  # `[bracket]` accent-color parser
scripts/
  generate-voiceover.ts  # reads content.ts, calls Gemini TTS
  init-content.mjs       # postinstall: copies example → content.ts
public/
  voiceover/             # generated WAVs (gitignored)
  music/                 # your BGM file (gitignored)
```

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

Remotion 的官方安裝方式是在終端機執行 `npx create-video@latest` 建立一個新專案。本 repo 已經是打包好的 Remotion 專案，`npm install` 就會自動安裝 Remotion，不需要再跑多餘的ame指令。

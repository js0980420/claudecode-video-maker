---
name: tutorial-publish-pipeline
description: 教學影片 render + publish 跨平台 pipeline 共用規則 — 雙 mp4(16:9 + 9:16)/ 9:16 直式內容置中 / 字幕燒進 mp4 / YT 章節 / 全平台 public 預設 / 文案全形指令半形 / 脆 publish pattern。任何要 render 教學影片或 publish 到 YT/IG/脆 的 AI 動工前先讀,可避免重做。
---

# Tutorial Publish Pipeline — 跨平台規則

> 給 Claude Videos 專案的教學片管線(`src/tutorial/` + `public/screenshots/<name>/steps.json` 流程)。短片管線(`src/content.ts`)不適用,但 publish API 部分相同。
>
> 跟其他 skill 的關係:這份是「影片本體 + 跨平台 publish 流程」共用層;細部 token / API 限制看 `youtube-publishing-rules` / `instagram-publishing-rules` / `threads-publishing-rules` / `threads-algorithm-rules`。

---

## 1. Render 一律出兩支 mp4(16:9 + 9:16)

每次 `npm run render:tutorial` 必須輸出:
- `output/<videoName>.mp4` = **1920×1080**(YT 用)
- `output/<videoName>-reel.mp4` = **1080×1920**(IG Reel / 脆 inline 用)

實作:`src/Root.tsx` 註冊**兩個 composition**,都用同一個 `TutorialComposition` 元件(尺寸換):
```tsx
<Composition id={videoName} component={TutorialComposition} width={1920} height={1080} ... />
<Composition id={`${videoName}-Reel`} component={TutorialComposition} width={1080} height={1920} ... />
```
`scripts/render-tutorial.mjs` 跑兩次 `npx remotion render`(先 16:9,再 9:16)。

**理由**:每支教學影片都要跨平台,YT 橫式 / IG/脆 直式必備兩個版本。

---

## 2. 9:16 直式 layout 內容**垂直置中**

`StepScene` / `IntroScene` / `OutroScene` 預設給 16:9(內容高 ~700px)設計;放進 1920 高的 9:16 容器,下方會有 **1200px+ 空白**。必須用 `useVideoConfig()` 條件判斷:

```tsx
import { useVideoConfig } from "remotion";

const { width, height } = useVideoConfig();
const isReel = height > width;

// blocks container style:
{
  display: "flex",
  flexDirection: "column",
  justifyContent: isReel ? "center" : "flex-start",  // 關鍵
}
```

橫式維持 `flex-start`(原 layout 不破壞),直式改 `center`。

**不要**:hard-code 9:16 layout 寫死 fontSize / spacing / max-width — 那會破壞 16:9 既有風格(StepScene 是共用元件)。

---

## 3. 字幕燒進 mp4(hardcoded)

教學影片**所有平台**都要字幕,且**燒進 mp4**(不依賴各平台 caption API)。

**理由**:
- IG Reel / 脆 inline video 沒 SRT API → 只能 hardcoded
- YT 有 captions API,但 hardcoded 跨平台一致 + 字體/樣式可控
- 觀眾關靜音也看得到字

**做法**(`scripts/generate-subtitles.mjs` 或類似):
1. 讀 `public/screenshots/<name>/steps.json` 的 `voiceovers[]` + `public/voiceover/<name>/durations.json`
2. 累加時間戳產 SRT(每段 voiceover = 1 SRT entry)
3. ffmpeg 燒進兩支 mp4:
   ```bash
   ffmpeg -i input.mp4 -vf "subtitles=foo.srt:force_style='Fontname=PingFang TC,Fontsize=32,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,Outline=2,Alignment=2,MarginV=80'" output.mp4
   ```
4. 輸出 `output/<name>-with-subs.mp4` 跟 `output/<name>-reel-with-subs.mp4`
5. publish 用 with-subs 版本

---

## 4. YT description 必含影片章節

**每支教學片**的 YT description 必須有 chapter 區塊:

```
═══════ 影片章節 ═══════

0:00 第一個章節名
0:22 第二個章節名
...
2:29 結尾
```

YT 規則:
- 第一個 chapter **必須 0:00**
- 至少 3 個 chapter(我們通常 7-10 個)
- **每兩個 chapter 間距 ≥ 10 秒**(< 10s 會被 reject 不顯示)

時間戳算法:
- 從 `public/voiceover/<name>/durations.json` 累加 voiceover wav 長度
- 加 ~1s buffer 給每個 step 的 spring 動畫
- 太短的 step(< 10s)合併進相鄰 chapter

---

## 5. 全平台 publish 預設 **public**

**規則**:YT / IG / 脆 一律 public,不用 private 預設。

```js
// publish-youtube.mjs / publish-instagram.mjs / publish-threads.mjs
const VISIBILITY = opts.visibility ?? "public";  // 預設 public(專案規則)
```

**理由**:日更頻道每次發片就是公開,不需要 private 預發確認。如果某次想 private,顯式給 `--visibility private`。

---

## 6. 文案全形標點 / 指令半形

**中文段落**(voiceover / paragraph / callout / description / caption / hashtag tagline)→ **全形標點**:
- 逗號 `,` →「,」(U+FF0C)
- 句號 `.` →「。」(U+3002)
- 冒號 `:` →「:」(U+FF1A)
- 括號 `()` →「()」(U+FF08 / U+FF09)
- 驚嘆號 `!` →「!」(U+FF01)

**Code / URL / 變數名 / yaml / JSON / shell** → **維持半形**(觀眾要複製貼上跑指令)。

混合行(如 `cron 設 '0 0 1 * *'(每月 1 號 = 30 天頻率)`)分開處理:中文括號全形,cron syntax `'0 0 1 * *'` 半形。

**YT description 額外規則**:
- 不能含 `<` 或 `>`(`youtube-publishing-rules` skill)
- placeholder 用全形書名號 `〈〉`(替代 `<>`)
- shell `&&` 可保留(YT 不擋這個,擋的只有 `<>`)

---

## 7. 脆 publish pattern(教學影片)

**主貼文**(`publish-threads.mjs`):
- **上傳 9:16 mp4**(inline 播放,觀眾不離開脆)
- 文字內容:實質教學(三步驟之類,不是「去看影片」廢話)
- **末尾附 IG Reel URL**(自動 unfurl 成預覽卡片,Meta 自家整合,**不算 R6 外部連結降權**)
- **不放 YT URL 在主貼文**(YT 是 R6 外部連結,降權)

**自己第一個留言**(發完主貼文 30 秒內接,P3 自己回留言演算法加分):
- YT 影片 URL
- repo URL(範本來源)
- 講「完整指令在 YT 資訊欄」(資訊指引,不算 R1 bait)

**發後 3 小時策略**(P1 紅利期,`threads-algorithm-rules` skill):
- 優先回:有實質案例 / 反駁 / 延伸的留言
- 不用回:「+1」「同意」純表情

---

## 8. 發布順序

```
1. YT publish(16:9 mp4 + 全形 description + chapters)→ 拿 YT URL
2. IG Reel publish(9:16 mp4 + caption + 5 hashtag)→ 拿 IG_REEL_URL
3. 脆 publish(9:16 mp4 + 主貼文末附 IG_REEL_URL)→ 拿 thread_id
4. 脆留言(YT URL + repo + 「指令在 YT 資訊欄」)
```

YT 先發理由:description 字元上限最寬鬆(5000)、章節對齊有彈性、URL 給後面平台引用。

---

## 9. 共用基礎更新流程

**改動 main 的 scripts/ / src/tutorial/ / src/Root.tsx 等共用元件後**:
1. main commit + push
2. **既有 worktree 各自跑 `git merge main`** 才會拿到新改動
3. 新 worktree(`git worktree add ... -b video/<new> main`)自動繼承

實際工作:每次跨 worktree 開新影片前先在 main pull 最新,worktree merge main。

---

## 10. 不在當前 scope(YAGNI)

- Word-level 字幕(隨講字 highlight)→ 整段字幕夠用,word timing 太貴
- Auto-generated 縮圖(從影片 frame 截)→ 已有 `<videoName>-yt.png` Still composition
- 多語言字幕 → 中文一支
- 影片廣告插入 → YT 自動處理

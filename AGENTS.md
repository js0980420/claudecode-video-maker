# Claude Videos — Agent Rules (Codex / OpenAI)

> 適用：Codex 及其他讀取 AGENTS.md 的 agent。
> 同一套規則也寫在 CLAUDE.md（Claude Code）、GEMINI.md（Gemini CLI）、.github/copilot-instructions.md（GitHub Copilot）、.cursor/rules/remotion.mdc（Cursor）。
> 詳細 skill 在 `.claude/skills/` 目錄，讀對應 SKILL.md 取得完整說明。

---

## 專案架構

- **main branch**：共用基礎元件（`src/scenes/`、`src/tutorial/`、`Root.tsx`、render scripts）
- **每支影片**：`video/<name>` branch + `.worktrees/<name>/` 工作目錄
- **不要在 main worktree 改影片內容**（content.ts / steps.json / voiceover / screenshots）

```bash
# 開新影片
git worktree add .worktrees/<name> -b video/<name> main

# 繼續舊影片
cd .worktrees/<name>
```

---

## 遠端推送規則

- **origin 只有 main**，`video/*` 只保本地，絕對不推遠端
- 意外推上去立刻 `git push origin --delete video/<name>`

---

## Remotion 渲染規則（9:16 踩坑）

### 1. Sub-pixel 文字跳動修法

`justifyContent: "center"` 在 9:16 下可能產生 0.5px 位移導致文字逐幀跳動。

**修法**：`PageContent` 最外層 div 加：
```tsx
transform: "translateZ(0)",  // 強制 GPU layer，對齊整數像素
```

**動畫一律用 `translateY + Math.round()`，不用 `scale`：**
```tsx
// ❌
transform: `scale(${scale})`

// ✅
const ty = Math.round(interpolate(frame, [start, end], [20, 0], { easing }));
transform: `translateY(${ty}px)`
```

### 2. 9:16 垂直置中

```tsx
const { height, width } = useVideoConfig();
const isReel = height > width;

<div style={{
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: isReel ? "center" : "flex-start",  // ← 這行
}}>
```

### 3. 列點對齊

- **16:9**：`justifyContent: center` + `Paragraph width: 100%`（不縮排）
- **9:16**：`justifyContent: flex-start` + `paddingLeft: 60`（兩層階梯）
- callout / code：始終 `justifyContent: center`

---

## Tutorial 配音工作流程

**強制順序（不可跳步）：**

1. 鎖定所有 `image` / `code` / `callout` blocks（圖檔名填進 steps.json）
2. 對著畫面寫 `voiceovers[]` 字串
3. 跑 `npx tsx scripts/generate-tutorial-voiceover.ts <name>` 產 wav
4. **第一輪預覽**：`npm run dev`，驗配音 + 排版，字幕**關閉**
5. 配音調整迴圈（改字串 → 重產 wav → 重新預覽，可多輪）
6. 使用者確認配音定稿 → 開啟 `<SubtitleOverlay>`
7. **第二輪預覽**：驗字幕不擋畫面 / 無換行錯誤
8. **使用者明確說「render / 出片」** → 才跑 `npm run render:tutorial`

⚠️ 沒說「render」就不動 render 指令，即使預覽看起來 OK。

---

## ElevenLabs 設定

| 項目 | 值 |
|------|-----|
| 模型 | `eleven_v3`（不用 multilingual_v2） |
| 語速 | `ELEVENLABS_SPEED=0.85` |

**發音地雷詞（寫 voiceover 字串時替換）：**

| 原文 | 替換成 |
|------|--------|
| `SQL` | `SEQUEL` |
| `PostgreSQL` | `Postgre SEQUEL` |
| `GB`（容量） | `G B` |
| `Zeabur` | `Zee-bur` |
| `.dev`（域名） | `點 D E V` |
| `確認` | `確定` |
| `MIT 授權` | `M I T license` |

---

## 字幕規則

- 切句觸發：`，。？！；、`
- 移除行尾：`，。`
- 保留行尾：`？！：...、`
- `MIN_DUR = 1.2s`
- 實作：`SubtitleOverlay` React 元件，**不是 ffmpeg burn-in**
- 兩處必須同步改：`src/tutorial/SubtitleOverlay.tsx` + `scripts/generate-subtitles.mjs`

---

## Render 規則

每次 render 出**兩支 mp4**，**parallel** 同時跑：

```bash
npx concurrently \
  "npx remotion render <name> output/<name>.mp4 --concurrency 4" \
  "npx remotion render <name>-Reel output/<name>-reel.mp4 --concurrency 4"
```

- `output/<name>.mp4`：1920×1080（YT）
- `output/<name>-reel.mp4`：1080×1920（IG Reel / 脆）

---

## 發布規則

**順序：YT → IG → Threads**

### YouTube
- Description **不能含 `<` `>`**，改用 `〈〉`
- 必須含章節（0:00 起，間距 ≥ 10s，從 durations.json 算）
- quota：1600 點/支，每天上限 6 支

### Instagram Reels
- 最多 **5 個 hashtag**
- Cover 必須 JPG

### Threads（脆）
- 主貼文 + 第一則留言：**零外連結**（含 instagram.com URL）
- 連結 reply 延後 **≥ 3 小時**（P1 紅利期過）
- 第一則留言：發完主貼文 30 秒內，純文字 engagement hook

### 全平台
- 預設 **public**，不需要 private 確認
- 中文段落用**全形標點**；code / URL / shell 維持**半形**

---

## PageBreak 規則

`steps.json` 裡 **`pages.length` 必須 === `voiceovers.length`**。
手動加太累用 `.claude/skills/tutorial-auto-pagebreak/SKILL.md` 的算法。

---

## 完整 Skill 參考

詳細規則在 `.claude/skills/` 目錄：

| Skill 檔案 | 適用時機 |
|-----------|---------|
| `tutorial-reel-rendering/SKILL.md` | 改任何 StepScene / 動畫 |
| `tutorial-voiceover-style/SKILL.md` | 寫或改 voiceover 字串 |
| `tutorial-publish-pipeline/SKILL.md` | render 或 publish |
| `tutorial-auto-pagebreak/SKILL.md` | 加 pageBreak |
| `youtube-publishing-rules/SKILL.md` | YT 上傳細節 |
| `instagram-publishing-rules/SKILL.md` | IG 上傳細節 |
| `threads-publishing-rules/SKILL.md` | Threads API 細節 |
| `threads-algorithm-rules/SKILL.md` | 脆演算法紅線 |
| `x-publishing-rules/SKILL.md` | X (Twitter) 發文規則 |

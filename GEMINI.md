# Claude Videos — Agent Rules (Gemini CLI)

> 與 AGENTS.md 內容相同。Gemini CLI 讀此檔，其他 agent 讀各自對應的入口檔案。
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
  justifyContent: isReel ? "center" : "flex-start",
}}>
```

### 3. 列點對齊

- **16:9**：`justifyContent: center` + `Paragraph width: 100%`
- **9:16**：`justifyContent: flex-start` + `paddingLeft: 60`
- callout / code：始終 `justifyContent: center`

---

## Tutorial 配音工作流程

**強制順序：**

1. 鎖定所有 blocks（圖檔名填進 steps.json）
2. 寫 `voiceovers[]` 字串
3. 產 wav：`npx tsx scripts/generate-tutorial-voiceover.ts <name>`
4. **第一輪預覽**（字幕關閉）→ 驗配音
5. 配音調整迴圈（改 → 重產 wav → 重看）
6. 配音定稿 → 開啟 `<SubtitleOverlay>`
7. **第二輪預覽**（帶字幕）→ 驗字幕
8. **使用者明確說「render / 出片」** → 才跑 `npm run render:tutorial`

---

## ElevenLabs 設定

| 項目 | 值 |
|------|-----|
| 模型 | `eleven_v3` |
| 語速 | `ELEVENLABS_SPEED=0.85` |

**發音地雷詞：**

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

- 切句觸發：`，。？！；、`；移除行尾 `，。`；保留 `？！：...、`
- `MIN_DUR = 1.2s`
- `SubtitleOverlay` React 元件，**不是 ffmpeg burn-in**
- 兩處同步改：`src/tutorial/SubtitleOverlay.tsx` + `scripts/generate-subtitles.mjs`

---

## Render 規則

Parallel 出兩支 mp4：

```bash
npx concurrently \
  "npx remotion render <name> output/<name>.mp4 --concurrency 4" \
  "npx remotion render <name>-Reel output/<name>-reel.mp4 --concurrency 4"
```

---

## 發布規則

**順序：YT → IG → Threads**

- **YT**：description 禁 `<>`，用 `〈〉`；必含章節（≥ 10s 間距）
- **IG**：最多 5 hashtag
- **Threads**：主貼文 + 第一則留言零外連結；連結 reply ≥ 3 小時後
- 全平台預設 **public**；中文全形標點，code/URL 半形

---

## 完整 Skill 參考

詳細規則在 `.claude/skills/` 目錄各 `SKILL.md`：
`tutorial-reel-rendering` / `tutorial-voiceover-style` / `tutorial-publish-pipeline` /
`tutorial-auto-pagebreak` / `youtube-publishing-rules` / `instagram-publishing-rules` /
`threads-publishing-rules` / `threads-algorithm-rules` / `x-publishing-rules`

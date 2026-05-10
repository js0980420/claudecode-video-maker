# Claude Videos — GitHub Copilot Instructions

> 詳細 skill 在 `.claude/skills/` 目錄，讀對應 SKILL.md 取得完整說明。

## 專案架構

- **main branch**：共用基礎元件（`src/scenes/`、`src/tutorial/`、`Root.tsx`、render scripts）
- **每支影片**：`video/<name>` branch + `.worktrees/<name>/` 工作目錄
- **不要在 main worktree 改 content.ts / steps.json / voiceover / screenshots**

## Git 規則

- `video/*` branch **只保本地**，絕對不推 origin
- origin 只有 main

## Remotion 渲染規則（9:16）

### Sub-pixel 文字跳動

PageContent 最外層 div 必須有：
```tsx
transform: "translateZ(0)",
```

動畫用 `translateY + Math.round()`，**不用 scale**：
```tsx
// ✅
const ty = Math.round(interpolate(frame, [start, end], [20, 0], { easing }));
transform: `translateY(${ty}px)`
```

### 9:16 垂直置中

```tsx
const isReel = height > width;
justifyContent: isReel ? "center" : "flex-start"
```

### 列點對齊

- 16:9：`justifyContent: center` + `Paragraph width: 100%`
- 9:16：`justifyContent: flex-start` + `paddingLeft: 60`
- callout / code：始終 center

## 配音工作流程

1. 鎖定 blocks → 寫 voiceovers → 產 wav
2. 第一輪預覽（字幕關閉）→ 驗配音
3. 配音調整迴圈
4. 配音定稿 → 開 `<SubtitleOverlay>`
5. 第二輪預覽（帶字幕）
6. **使用者說「render」才跑 `npm run render:tutorial`**

## ElevenLabs

- 模型：`eleven_v3`；語速：`0.85`
- 發音地雷詞：`SQL`→`SEQUEL`、`確認`→`確定`、`Zeabur`→`Zee-bur`、`GB`→`G B`

## 字幕

- 切句：`，。？！；、`；移除行尾 `，。`；保留 `？！：...`
- `SubtitleOverlay` React 元件（不是 ffmpeg）
- `SubtitleOverlay.tsx` + `generate-subtitles.mjs` 必須同步改

## Render

Parallel 兩支 mp4（16:9 + 9:16），`--concurrency 4`

## 發布

YT → IG → Threads；全 public；YT description 禁 `<>`；Threads 主貼文零外連結

## Skill 參考

`.claude/skills/` 目錄下各 `SKILL.md`：
- `tutorial-reel-rendering` — 9:16 渲染品質
- `tutorial-voiceover-style` — 配音規範
- `tutorial-publish-pipeline` — render + 發布流程
- `youtube-publishing-rules` / `instagram-publishing-rules` / `threads-publishing-rules`

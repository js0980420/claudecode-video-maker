# Claude Videos — 給 Claude Code 的工作規則

## 🌳 專案架構 — main + 每支影片一個 worktree

**main branch** 只放「共用基礎」:元件(`src/scenes/`, `src/tutorial/`, `Root.tsx`, `types.ts`)、範本(`*.example.ts`)、render scripts、tooling。**不應** commit 任何特定影片的 content/voiceover/screenshots。

**每支影片** = 一個 `video/<videoName>` branch + `.worktrees/<videoName>/` workdir。影片的 content.ts / steps.json / voiceover / screenshots / input 都在那個 branch,互不干擾,可同時編輯、隨時 render。

### 要做新影片時

```bash
git worktree add .worktrees/<new-name> -b video/<new-name> main
cd .worktrees/<new-name>
npm install               # node_modules 各 worktree 獨立
cp src/content.example.ts src/content.ts        # 短片
# 或 cp src/tutorial/config.example.ts src/tutorial/config.ts   # 教學
# 開始改 content,render,commit 到 video/<new-name>
```

branch 命名用 **ASCII**,不用中文。

### 要繼續改舊影片

```bash
cd .worktrees/<old-name>    # 直接進去,不用 git checkout
# 改、render、commit 到它自己的 video/<old-name> branch
```

### 共用基礎更新(scenes/ 元件、render script...)

1. 在 **main worktree** 改、commit
2. 各個 `.worktrees/<name>/` 需要升級時:`git merge main`(或 `rebase`,依情況)

通用改進 FROM video branch:如果某支影片做的改進(如新 scene type)值得共用,在 main worktree `git merge --no-ff video/<name>` 挑進來。

## 🎨 影片內容邏輯 cheat sheet

- **短片管線**:`src/content.ts` 一個檔案 = meta / brand / scenes / voiceover / bgm / thumbnails。場景類型:`iconPair` / `crossedItems` / `terminal` / `phoneCTA` / `centerText` / `chatBox`。新增類型要改 `src/types.ts` 的 `SceneVisual` 和 `src/scenes/SceneRenderer.tsx`。
- **教學片管線**:`public/screenshots/<name>/steps.json` + `src/tutorial/config.ts`。blocks 類型:`paragraph` / `image` / `code` / `callout` / `pageBreak`。pageBreak 分鏡可用 `tutorial-auto-pagebreak` skill 自動插。
- **文字 highlight**:`[中括號]` 自動套 brand primaryColor。
- 短片 vs 教學片**刻意保持兩條獨立管線**(資訊密度與節奏完全不同),不合併。

## 🗣️ 語言慣例

- 回應、commit、檔案內的使用者可見文案:**繁體中文**。
- 程式碼 / 識別字 / 路徑 / branch 名:英文 / ASCII。
- Git commit 遵循 Conventional Commits,訊息用繁中解釋「為什麼這樣改」。
- Commit 範圍偏好:只對「實際功能代碼 / 共用基礎」commit。影片視覺/腳本/配音等 content 迭代不自動 commit,等使用者明確說「commit 這支影片」才動手。

## 🚫 不要做的事

- **不要在 main worktree 做影片工作**。要改 content.ts / steps.json / voiceover 等 per-video 檔案,先 `cd .worktrees/<name>/`。main 現在應該只有 example 範本。
- 不要在不同 video branch 之間互抄 content 檔 —— 直接 `git worktree add ... -b video/<name-B> video/<name-A>` 從 A branch 開 B,再改。
- 不要動 `*.example.ts`(範本,tracked 在 main)。
- 不要 commit 私人 content/voiceover/screenshots 到 main。
- **不要**用舊的 `npm run archive` 流程(已退役)。`src/videos-archive/` 目錄還在 gitignore 裡作歷史備份,新工作一律走 worktree。

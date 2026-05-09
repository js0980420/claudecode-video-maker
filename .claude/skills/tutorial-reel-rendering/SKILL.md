---
name: tutorial-reel-rendering
description: 9:16 Reel 影片兩大渲染問題的根因與修法：(1) justifyContent:center 造成 sub-pixel 文字跳動、(2) 字幕 CC 風格切句規則（、，。？！；斷行，移除 ，。，保留 ？！：...、）。每次動 StepScene / SubtitleOverlay / 任何 block 動畫時必讀。
---

# Tutorial Reel 渲染品質規則

## 1. 9:16 sub-pixel 文字跳動 — `translateZ(0)` 修法

### 根本原因

`justifyContent: "center"` 在 9:16（1080×1920）模式下計算垂直置中：

```
top offset = (1920 - 內容高) / 2
```

當內容高是奇數，結果是 `x.5px`（小數點像素）。Chromium 文字渲染使用 sub-pixel 精度，文字靠近換行邊界時，0.5px 的位移就會讓文字在「要換行 / 不換行」之間逐幀跳動，整排高度差一行，所有元素一起抖動。

16:9（`flex-start` 從整數 padding 起始）沒有這個問題。

### 修法：`transform: "translateZ(0)"`

在 `StepScene.tsx` 的 `PageContent` 最外層 div 加：

```tsx
transform: "translateZ(0)",  // 強制 GPU compositing layer，對齊整數像素
```

`translateZ(0)` 強制建立 GPU compositing layer。Chromium 會把這個 layer 對齊整數像素，所有子元素就不會落在小數點位置，文字換行計算穩定，跳動消失。

### scale 動畫也會造成鄰近元素跳動

`transform: scale(fractional)` 無法 Math.round()，在 back easing overshoot（scale > 1）時元素視覺上超出邊界，在 9:16 centering 環境中會造成鄰近元素 sub-pixel 位移。

**所有 block 動畫一律用 `translateY + Math.round()`，不用 scale：**

```tsx
// ❌ 會跳動
const scale = interpolate(frame, [start, start + FADE], [0.82, 1], { easing: Easing.out(Easing.back(1.3)) });
transform: `scale(${scale})`

// ✅ 整數像素
const ty = Math.round(interpolate(frame, [start, start + FADE], [20, 0], { easing: Easing.out(Easing.back(1.3)) }));
transform: `translateY(${ty}px)`
```

適用所有元件：`FeatureCardsBlock`、`SkillGridBlock`、`ChatDiagramBlock`（`useAppear` + no-access chips）、未來新增的 block。

---

## 2. 字幕 CC 風格切句規則

### 切句觸發字元

```
，。？！；、
```

每遇到以上任一字元就切成新字幕行，每行獨立顯示（CC 風格短句輪播）。

### 顯示規則

- **移除行尾**：`，。`（顯示更乾淨，無需讀標點）
- **保留行尾**：`？！：...、`（有語意或節奏意義）

```tsx
.map((s) => s.replace(/[，。]\s*$/, "").trim())
```

### 為什麼要加 `、`（頓號）

列舉型句子（如「租伺服器比價、一句話部署應用、AI API 自動接入…」）若只切 `，。`，整串列舉不斷行，塞成一行字幕。加 `、` 後每個列舉項各顯示一行，節奏自然。

### MIN_DUR

CC 風格短句比原本句號切法更細，每句更短。`MIN_DUR = 1.2s`（原 1.5s），避免短句一閃而過。

### 實作位置

兩個地方必須同步修改（改一個就要改兩個）：
1. `src/tutorial/SubtitleOverlay.tsx` — `splitIntoSentences()` — 9:16 Reel 燒入字幕
2. `scripts/generate-subtitles.mjs` — `splitSentences()` — YT SRT CC track

---

## 3. Checklist：新增 block 動畫時

- [ ] 動畫用 `translateY + Math.round()`，不用 `scale`
- [ ] `interpolate` 回傳的 pixel 值全部 `Math.round()`
- [ ] `PageContent` 外層 `transform: "translateZ(0)"` 已存在（不要刪）
- [ ] 9:16 預覽確認無文字跳動後才 render

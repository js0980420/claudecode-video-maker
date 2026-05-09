# 中文文字跳動（headless render artifact）

## 症狀

Remotion Studio 預覽正常，但 render 出來的 mp4 中，特定文字（尤其是句尾幾個字）會在兩個位置之間持續跳動。

## 根本原因

Headless Chrome 軟體渲染模式（無 GPU）的 sub-pixel 字寬計算有 ±0.5–1px 的 frame-to-frame 浮動。當一段文字的總寬度**剛好在換行臨界點**，瀏覽器每幀對「這個字要不要換行」的決定可能不同，造成行尾字元跳動。

## 觸發條件

- 9:16 直式（1080px 寬），段落容器寬度約 892px
- 長段落文字（混合中英文）長度接近容器寬度
- 同一 stacking context 內有持續改變的 frame-dependent 值（如 `spring()`、每幀動的 background）

## 診斷順序

1. **確認只在 render 出現（非 Studio）** → headless rendering artifact，非邏輯 bug
2. **確認是特定字元跳** → 文字在換行臨界點
3. **關掉所有動畫還是跳** → 純字型排版問題，動畫無關

## 修正方法（依優先順序）

### 方法 1：強制換行（最快）

在 steps.json 的 paragraph text 用 `\n` 在臨界字前強制換行：

```json
{ "type": "paragraph", "text": "你跟 [Claude Code] 說「幫我部署到伺服器上」\n它做不到。" }
```

`\n` 會被 MarkdownLite 渲染成 `<br/>`，排版不再需要決定換行位置。

### 方法 2：改短文字

刪掉臨界點附近的標點或詞語，讓該行明顯短於容器寬度。

### 方法 3：避免持續 repaint

`spring()` 數學上永遠輕微振盪，每幀都是新值，觸發 stacking context 整體 repaint。改用 `interpolate` + `extrapolateRight: "clamp"`，動畫結束後輸出 exactly 1.0，不再觸發重繪：

```typescript
// ❌ spring 永遠振盪
const progress = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });

// ✅ interpolate 收斂後完全靜止
const progress = interpolate(frame, [0, 15], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});
```

### 方法 4：Math.round 動畫值

`translateY` 的小數像素值會改變文字相對位置，影響 sub-pixel 排版：

```typescript
// ❌ 小數像素 → 每幀排版略不同
transform: `translateY(${translateY}px)`

// ✅ 整數像素 → 排版穩定
transform: `translateY(${Math.round(translateY)}px)`
```

## 不建議的方向

- **移除所有動畫** — 可以根除 repaint 觸發，但問題是文字本身在臨界點，動畫不是根因
- **AmbientBg 加 willChange/translateZ** — 如果問題是文字在臨界點，GPU layer 隔離無效
- **WebkitFontSmoothing** — 對 headless 軟體渲染無效

/**
 * scripts/generate-subtitles.mjs
 *
 * 從 steps.json + durations.json 產出 SRT 字幕檔。給 YT 16:9 影片
 * 走 CC track(YT 播放器底部 controls bar 會擋到嵌入字幕,CC 自動避開)。
 *
 * 9:16 IG/Threads 影片的字幕是 SubtitleOverlay 直接畫在 frame 上,不用 SRT。
 *
 * 用法(在 worktree 根目錄執行):
 *   node scripts/generate-subtitles.mjs
 *   或 node scripts/generate-subtitles.mjs <video-name>(覆寫 config.ts 抓的 name)
 *
 * 輸入(cwd-relative):
 *   src/tutorial/config.ts            (沒給 video-name arg 時從這抓)
 *   public/screenshots/<video>/steps.json
 *   public/voiceover/<video>/durations.json
 *
 * 輸出:
 *   output/<video>.srt
 *
 * 時間軸:跟 src/tutorial/SubtitleOverlay.tsx buildSegments 一致 ——
 *   intro       :0 → introDur
 *   每個 step page:cursor + 0.5s(HEAD_DELAY)後音訊起點;page 全長 ≥ HEAD + audioDur + 0.5s(TAIL)
 *   outro       :cursor 直接起音訊(OutroScene 內部從 0 起)
 *
 * 章節時長與 SubtitleOverlay buildSegments 同步,改動其中一邊請同步另一邊。
 */

import fs from "fs";
import path from "path";

const cwd = process.cwd();

// ───────────────────────────────────────────────────────────────────
// 抓 video name
// ───────────────────────────────────────────────────────────────────
let videoName = process.argv[2];
if (!videoName) {
  const configPath = path.join(cwd, "src", "tutorial", "config.ts");
  if (!fs.existsSync(configPath)) {
    console.error("找不到 src/tutorial/config.ts。先 npm install 跑 postinstall,或傳 video-name arg。");
    process.exit(1);
  }
  const m = fs.readFileSync(configPath, "utf-8").match(/videoName:\s*["']([^"']+)["']/);
  if (!m) {
    console.error("無法從 config.ts 抓 videoName,請傳 video-name arg。");
    process.exit(1);
  }
  videoName = m[1];
}

const stepsPath = path.join(cwd, "public", "screenshots", videoName, "steps.json");
const durationsPath = path.join(cwd, "public", "voiceover", videoName, "durations.json");
const outputDir = path.join(cwd, "output");
const srtPath = path.join(outputDir, `${videoName}.srt`);

if (!fs.existsSync(stepsPath)) {
  console.error(`❌ 找不到 steps.json: ${stepsPath}`);
  process.exit(1);
}
if (!fs.existsSync(durationsPath)) {
  console.error(`❌ 找不到 durations.json: ${durationsPath}`);
  process.exit(1);
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const steps = JSON.parse(fs.readFileSync(stepsPath, "utf-8"));
const durations = JSON.parse(fs.readFileSync(durationsPath, "utf-8"));

// ───────────────────────────────────────────────────────────────────
// 時間軸常數(SubtitleOverlay.tsx 同步)
// ───────────────────────────────────────────────────────────────────
const FPS = 30;
const HEAD_DELAY_SEC = 15 / FPS;            // step page 前 0.5s buffer
const TAIL_SEC = 15 / FPS;                   // step page 後 0.5s tail
const INTRO_MIN_SEC = 90 / FPS;              // intro 最短 3s
const STEP_NATURAL_MIN_SEC = (15 + 5 + 0 + 8) / FPS + TAIL_SEC; // ~1.43s

// ───────────────────────────────────────────────────────────────────
// 工具函式
// ───────────────────────────────────────────────────────────────────
function toSrtTimestamp(seconds) {
  const ms = Math.round(seconds * 1000);
  const hh = Math.floor(ms / 3600000);
  const mm = Math.floor((ms % 3600000) / 60000);
  const ss = Math.floor((ms % 60000) / 1000);
  const mmm = ms % 1000;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")},${String(mmm).padStart(3, "0")}`;
}

function cleanText(text) {
  return text
    .replace(/\[([^\]]+)\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .trim();
}

function countChars(text) {
  const noEmoji = text.replace(/\p{Emoji_Presentation}/gu, "");
  return [...noEmoji].length;
}

/** 按全形句號「。」/全形逗號「，」切句,中括號內視為整體不切 */
function splitSentences(text) {
  const sentences = [];
  let current = "";
  let inBracket = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "[") {
      inBracket = true;
      current += ch;
    } else if (ch === "]") {
      inBracket = false;
      current += ch;
    } else if (!inBracket && (ch === "，" || ch === "。")) {
      current += ch;
      const t = current.trim();
      if (t.length > 0) sentences.push(t);
      current = "";
    } else {
      current += ch;
    }
  }
  const remaining = current.trim();
  if (remaining.length > 0) sentences.push(remaining);
  return sentences.filter((s) => s.length > 0);
}

/** 一段 voiceover → 多句 SRT,按字數比例分配時長 */
function splitEntry(text, duration) {
  const sentences = splitSentences(text);
  if (sentences.length <= 1) return [{ text, duration }];
  const totalChars = sentences.reduce((sum, s) => sum + countChars(s), 0);
  if (totalChars === 0) return [{ text, duration }];
  return sentences.map((s) => ({
    text: s,
    duration: duration * (countChars(s) / totalChars),
  }));
}

// ───────────────────────────────────────────────────────────────────
// 建立 entries 並對齊影片真實時間軸
// ───────────────────────────────────────────────────────────────────
const entries = []; // { start, end, text }

function pushSection(rawText, audioStartSec, audioDur) {
  if (!rawText || audioDur <= 0) return;
  const cleaned = cleanText(rawText);
  const splits = splitEntry(cleaned, audioDur);
  let c = audioStartSec;
  for (const s of splits) {
    entries.push({ start: c, end: c + s.duration, text: s.text });
    c += s.duration;
  }
}

let cursor = 0; // 秒,當前 scene 起點

// 1. intro(音訊從 0 起)
if (steps.intro?.voiceover) {
  const introDur = durations["intro"] ?? 0;
  pushSection(steps.intro.voiceover, cursor, introDur);
  const introSceneSec = Math.max(INTRO_MIN_SEC, Math.ceil(introDur * FPS) / FPS + TAIL_SEC);
  cursor = introSceneSec;
}

// 2. 各 step 各 page
for (const step of steps.steps ?? []) {
  const voiceovers = step.voiceovers ?? [];
  const pageCount = Math.max(voiceovers.length, 1);
  for (let i = 0; i < pageCount; i++) {
    const wavKey = `${step.id}-p${i + 1}`;
    const audioDur = durations[wavKey] ?? 0;
    const audioStartSec = cursor + HEAD_DELAY_SEC;
    pushSection(voiceovers[i] ?? "", audioStartSec, audioDur);
    const pageDurSec = audioDur > 0
      ? Math.max(STEP_NATURAL_MIN_SEC, HEAD_DELAY_SEC + audioDur + TAIL_SEC)
      : STEP_NATURAL_MIN_SEC;
    cursor += pageDurSec;
  }
}

// 3. outro(OutroScene 從 0 直接播音訊,不像 step 有 HEAD_DELAY)
if (steps.outro?.voiceover) {
  const outroDur = durations["outro"] ?? 0;
  pushSection(steps.outro.voiceover, cursor, outroDur);
}

// ───────────────────────────────────────────────────────────────────
// 輸出 SRT
// ───────────────────────────────────────────────────────────────────
let srt = "";
for (let idx = 0; idx < entries.length; idx++) {
  const { start, end, text } = entries[idx];
  srt += `${idx + 1}\n`;
  srt += `${toSrtTimestamp(start)} --> ${toSrtTimestamp(end)}\n`;
  srt += `${text}\n\n`;
}

fs.writeFileSync(srtPath, srt, "utf-8");

const avgChars = entries.length
  ? Math.round(entries.reduce((s, e) => s + countChars(e.text), 0) / entries.length)
  : 0;
const maxChars = entries.length
  ? Math.max(...entries.map((e) => countChars(e.text)))
  : 0;
const totalSec = entries.length ? entries[entries.length - 1].end : 0;

console.log(`✅ SRT 生成完成`);
console.log(`   影片: ${videoName}`);
console.log(`   entries: ${entries.length} (切句後)`);
console.log(`   平均字數: ${avgChars} 字/entry`);
console.log(`   最長 entry: ${maxChars} 字`);
console.log(`   總時長: ${toSrtTimestamp(totalSec)} (${totalSec.toFixed(2)} 秒)`);
console.log(`   輸出: ${srtPath}`);

/**
 * scripts/render-tutorial.mjs
 *
 * 渲染 tutorial 影片(`videoName` 從 src/tutorial/config.ts 讀)+ 3 張縮圖。
 * 對應 render-organized.mjs(短片管線)。
 *
 * 用法:
 *   npm run render:tutorial
 *   或在 worktree 裡:node scripts/render-tutorial.mjs
 *
 * 輸出:
 *   output/<videoName>.mp4          (1920×1080 16:9,YT 用)
 *   output/<videoName>-reel.mp4     (1080×1920 9:16,IG Reel / Threads 用)
 *   output/<videoName>-yt.png
 *   output/<videoName>-ig.png
 *   output/<videoName>-reel.png
 *
 * 速度:雙 mp4 parallel + concurrency 4x,~10 分鐘出片。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn, spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const outputDir = path.join(projectRoot, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const configPath = path.join(projectRoot, "src", "tutorial", "config.ts");
if (!fs.existsSync(configPath)) {
  console.error("找不到 src/tutorial/config.ts。先 npm install 跑 postinstall。");
  process.exit(1);
}
const configText = fs.readFileSync(configPath, "utf-8");
const m = configText.match(/videoName:\s*["']([^"']+)["']/);
if (!m || !m[1]) {
  console.error("無法從 src/tutorial/config.ts 抓到 videoName");
  process.exit(1);
}
const videoName = m[1];

console.log(`\n🎬 開始渲染 tutorial: ${videoName}\n`);

const CONCURRENCY = "4";

function renderVideoParallel(compositionId, outputPath, label) {
  return new Promise((resolve) => {
    const proc = spawn(
      "npx",
      ["remotion", "render", compositionId, outputPath, "--concurrency", CONCURRENCY],
      { cwd: projectRoot },
    );
    const prefix = (chunk) =>
      chunk
        .toString()
        .split("\n")
        .filter((line) => line.length > 0)
        .map((line) => `[${label}] ${line}`)
        .join("\n");
    proc.stdout.on("data", (d) => process.stdout.write(prefix(d) + "\n"));
    proc.stderr.on("data", (d) => process.stderr.write(prefix(d) + "\n"));
    proc.on("close", (code) => resolve(code));
  });
}

function runSubtitlesGen() {
  return new Promise((resolve) => {
    const proc = spawn(
      "node",
      ["scripts/generate-subtitles.mjs"],
      { cwd: projectRoot },
    );
    const prefix = (chunk) =>
      chunk
        .toString()
        .split("\n")
        .filter((line) => line.length > 0)
        .map((line) => `[SRT] ${line}`)
        .join("\n");
    proc.stdout.on("data", (d) => process.stdout.write(prefix(d) + "\n"));
    proc.stderr.on("data", (d) => process.stderr.write(prefix(d) + "\n"));
    proc.on("close", (code) => resolve(code));
  });
}

console.log("📹 並行渲染 16:9 + 9:16 兩支 mp4 + SRT (concurrency 4x)...\n");
const videoOut = `output/${videoName}.mp4`;
const reelOut = `output/${videoName}-reel.mp4`;

const [videoCode, reelCode, srtCode] = await Promise.all([
  renderVideoParallel(videoName, videoOut, "16:9"),
  renderVideoParallel(`${videoName}-Reel`, reelOut, "9:16"),
  runSubtitlesGen(),
]);

if (videoCode !== 0) {
  console.error(`\n❌ 16:9 影片渲染失敗 (exit ${videoCode})`);
  process.exit(1);
}
console.log(`\n✅ ${videoOut}`);

if (reelCode !== 0) {
  console.error(`❌ 9:16 Reel 渲染失敗 (exit ${reelCode}) — 縮圖繼續`);
} else {
  console.log(`✅ ${reelOut}`);
}

if (srtCode !== 0) {
  console.error(`⚠️ SRT 生成失敗 (exit ${srtCode}) — mp4 不受影響`);
} else {
  console.log(`✅ output/${videoName}.srt`);
}
console.log();

function runRemotionSync(subcommand, compositionId, outputPath) {
  return spawnSync(
    "npx",
    ["remotion", subcommand, compositionId, outputPath],
    { cwd: projectRoot, stdio: "inherit" },
  );
}

const thumbs = [
  { compSuffix: "ThumbnailYT", fileSuffix: "yt", label: "YouTube" },
  { compSuffix: "ThumbnailIG", fileSuffix: "ig", label: "Instagram" },
  { compSuffix: "ThumbnailReel", fileSuffix: "reel", label: "Reel" },
];
for (const t of thumbs) {
  const compId = `${videoName}-${t.compSuffix}`;
  const out = `output/${videoName}-${t.fileSuffix}.png`;
  console.log(`🖼  ${t.label} 縮圖...`);
  const r = runRemotionSync("still", compId, out);
  if (r.status !== 0) {
    console.error(`⚠️ ${t.label} 縮圖失敗 (exit ${r.status})`);
    continue;
  }
  console.log(`✅ ${out}`);

  // Reel composition 額外輸出 JPG —— IG / Threads cover 必須是 JPG (skill 規定)。
  // YT / IG 縮圖留 PNG 即可,YT thumbnail 接受 PNG 且品質較佳。
  if (t.fileSuffix === "reel") {
    const jpgOut = `output/${videoName}-${t.fileSuffix}.jpg`;
    const conv = spawnSync(
      "python3",
      [
        "-c",
        `from PIL import Image; Image.open('${out}').convert('RGB').save('${jpgOut}', 'JPEG', quality=92)`,
      ],
      { cwd: projectRoot, stdio: "inherit" },
    );
    if (conv.status !== 0) {
      console.error(`⚠️ ${t.label} JPG 轉檔失敗,但 PNG 已存。可手動跑 PIL 轉。`);
    } else {
      console.log(`✅ ${jpgOut}`);
    }
  }
}

console.log("\n🎉 全部完成。");

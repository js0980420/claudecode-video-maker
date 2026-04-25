/**
 * scripts/publish-youtube.mjs
 *
 * 上傳本機 mp4 到自己 YouTube 頻道。跟 Threads / IG 不一樣 ——
 * YouTube **直接收 binary**,不用先 host 在公網。
 *
 * 用法:
 *   node scripts/publish-youtube.mjs \
 *     --video output/tutorial-ch2.mp4 \
 *     --title "教學 Ch.2 Mac 開發工具安裝" \
 *     --description "..." \
 *     [--tags "claudecode,自動化,aivideo"] \
 *     [--thumbnail output/tutorial-ch2-yt.jpg] \
 *     [--visibility public|unlisted|private]   (預設 private)
 *
 * 環境變數(.env):
 *   YOUTUBE_CLIENT_ID
 *   YOUTUBE_CLIENT_SECRET
 *   YOUTUBE_REFRESH_TOKEN  ← 跑完 youtube-oauth.mjs 之後會自動填
 *
 * 流程:
 *   1. refresh_token → 換一小時 access_token
 *   2. POST videos.insert(multipart/related,JSON metadata + 影片 binary)
 *   3. (選填)thumbnails.set 上自訂縮圖(JPG / PNG 都吃,< 2MB)
 *
 * 注意事項:
 *   - 預設上傳是 private,沒帶 --visibility public 就要進 Studio 手動切公開
 *   - 每支影片消耗 1600 quota 點(預設每天 10,000 點 → 一天最多 6 支)
 *   - thumbnails.set 需要頻道完成「自訂縮圖」驗證(綁手機就會自動開)
 *   - mp4 大小 < 256 GB,影片長度 < 12 小時(個人發片基本不會碰到)
 */
import fs from "fs";
import path from "path";

function findEnvFile() {
  let dir = process.cwd();
  while (true) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
function loadEnv() {
  const envPath = findEnvFile();
  if (!envPath) return;
  const text = fs.readFileSync(envPath, "utf-8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnv();

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET in .env");
  process.exit(1);
}
if (!REFRESH_TOKEN) {
  console.error(
    "❌ Missing YOUTUBE_REFRESH_TOKEN — 先跑 node scripts/youtube-oauth.mjs",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    opts[args[i].slice(2)] = args[i + 1];
    i++;
  }
}

const VIDEO = opts.video;
const TITLE = opts.title;
const DESCRIPTION = opts.description ?? "";
const TAGS = opts.tags ? opts.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
const THUMBNAIL = opts.thumbnail; // 本機路徑,選填
const VISIBILITY = opts.visibility ?? "private"; // 預設 private,確認過再改

if (!VIDEO || !TITLE) {
  console.error(
    '用法:node scripts/publish-youtube.mjs --video <path> --title "..." [--description "..."] [--tags "a,b"] [--thumbnail <path>] [--visibility public|unlisted|private]',
  );
  process.exit(1);
}
if (!fs.existsSync(VIDEO)) {
  console.error(`❌ video 找不到:${VIDEO}`);
  process.exit(1);
}
if (THUMBNAIL && !fs.existsSync(THUMBNAIL)) {
  console.error(`❌ thumbnail 找不到:${THUMBNAIL}`);
  process.exit(1);
}
if (!["public", "unlisted", "private"].includes(VISIBILITY)) {
  console.error(`❌ visibility 必須是 public / unlisted / private,你給的是 ${VISIBILITY}`);
  process.exit(1);
}

async function getAccessToken() {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    }).toString(),
  });
  const j = await resp.json();
  if (!resp.ok) {
    throw new Error(
      `refresh_token 換 access_token 失敗:${JSON.stringify(j)}\n` +
        `→ 7 天過期了 / 被使用者撤銷 / scope 不對。重跑 node scripts/youtube-oauth.mjs`,
    );
  }
  return j.access_token;
}

async function uploadVideo(accessToken) {
  const metadata = {
    snippet: {
      title: TITLE,
      description: DESCRIPTION,
      tags: TAGS,
      // 28 = Science & Technology;其他常見:22 People & Blogs / 27 Education
      categoryId: "28",
      defaultLanguage: "zh-Hant",
    },
    status: {
      privacyStatus: VISIBILITY,
      selfDeclaredMadeForKids: false,
      madeForKids: false,
    },
  };

  const videoBuffer = fs.readFileSync(VIDEO);
  const boundary = "---------------ytupload" + Math.random().toString(36).slice(2);
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\n` +
        `Content-Type: video/mp4\r\n\r\n`,
    ),
    videoBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  console.log(`   uploading ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB...`);
  const resp = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": body.length.toString(),
      },
      body,
    },
  );
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`videos.insert ${resp.status}:\n${text}`);
  }
  return JSON.parse(text);
}

async function setThumbnail(accessToken, videoId) {
  const buffer = fs.readFileSync(THUMBNAIL);
  const ext = path.extname(THUMBNAIL).toLowerCase();
  const mime = ext === ".png" ? "image/png" : "image/jpeg";
  const resp = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}&uploadType=media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mime,
      },
      body: buffer,
    },
  );
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`thumbnails.set ${resp.status}:\n${text}`);
  }
  return JSON.parse(text);
}

async function main() {
  console.log("📤 YouTube 上傳");
  console.log(`   video: ${VIDEO}`);
  console.log(`   title: ${TITLE}`);
  if (DESCRIPTION) console.log(`   description: ${DESCRIPTION.slice(0, 60)}${DESCRIPTION.length > 60 ? "…" : ""}`);
  if (TAGS.length) console.log(`   tags: ${TAGS.join(", ")}`);
  if (THUMBNAIL) console.log(`   thumbnail: ${THUMBNAIL}`);
  console.log(`   visibility: ${VISIBILITY}`);

  console.log("\n1. refresh_token → access_token...");
  const accessToken = await getAccessToken();
  console.log("   ✓");

  console.log("\n2. 上傳影片...");
  const uploaded = await uploadVideo(accessToken);
  const videoId = uploaded.id;
  console.log(`   ✓ video id = ${videoId}`);

  if (THUMBNAIL) {
    console.log("\n3. 上傳自訂縮圖...");
    await setThumbnail(accessToken, videoId);
    console.log("   ✓");
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  console.log(`\n🎉 上傳成功!`);
  console.log(`   ${url}`);
  if (VISIBILITY === "private") {
    console.log("\n   ⚠️  目前是 private,要公開請進 https://studio.youtube.com 改可見性,");
    console.log("       或下次發片時加 --visibility public");
  }
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});

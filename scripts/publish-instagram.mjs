/**
 * scripts/publish-instagram.mjs
 *
 * 用 Instagram Graph API 把 mp4 自動發成 Reels。
 *
 * 同 Threads:Meta 不收 binary 上傳,mp4 必須 host 在公開 HTTPS URL
 * (Cloudflare R2 / S3 / Zeabur 靜態站 / GitHub Releases),Meta server 自己去抓。
 *
 * 用法:
 *   node scripts/publish-instagram.mjs --url <mp4-public-url> [--caption "貼文文字"] [--cover <jpg-url>]
 *
 * 環境變數(.env,從 cwd 往上找):
 *   IG_ACCESS_TOKEN  Long-lived token(~60 天),從
 *                    App Dashboard → Instagram → API setup with Instagram Login
 *                    → Generate Token 拿。scope 含:
 *                    instagram_business_basic + instagram_business_content_publish
 *   IG_USER_ID       選填,預設 "me"。要明確指定就填 /me 回傳的 id 欄位
 *                    (在 graph.instagram.com 那條線下,不是 user_id)
 *
 *   ▸ 驗證 token:
 *     curl "https://graph.instagram.com/v25.0/me?fields=user_id,username,account_type,id&access_token=<TOKEN>"
 *     回傳的 id 才是新線用的 IG_USER_ID
 *
 * IG Reels 三段式流程(跟 Threads 幾乎一樣):
 *   1. POST /{ig-user-id}/media (media_type=REELS, video_url=...) → 拿 creation_id
 *   2. 輪詢 GET /{creation_id}?fields=status_code 等到 status_code=FINISHED
 *      (Reels 通常 30s~3min)
 *   3. POST /{ig-user-id}/media_publish (creation_id=...) → 拿 ig media id
 *
 * Reels 影片規格(踩過 Threads 那條坑就不會錯):
 *   - mp4, H.264 video + AAC audio
 *   - pix_fmt yuv420p, color range tv (mpeg) ← 不是這個會 ERROR=UNKNOWN
 *   - 9:16 直式建議(1080×1920),3s ~ 15min,< 1GB
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

const TOKEN = process.env.IG_ACCESS_TOKEN;
const IG_USER_ID = process.env.IG_USER_ID ?? "me";
if (!TOKEN) {
  console.error("❌ Missing IG_ACCESS_TOKEN in .env");
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
const VIDEO_URL = opts.url;
const CAPTION = opts.caption ?? "";
let COVER_URL = opts.cover; // optional — 沒給會自動 derive
const SHARE_TO_FEED = opts["share-to-feed"] !== "false"; // 預設同步發到 Feed

if (!VIDEO_URL) {
  console.error('用法:node scripts/publish-instagram.mjs --url <mp4-url> [--caption "..."] [--cover <jpg-url>]');
  console.error("例:--url https://your-zeabur-app.zeabur.app/tutorial-ch2.mp4");
  process.exit(1);
}
if (!/^https:\/\//.test(VIDEO_URL)) {
  console.error("❌ video URL 必須是 HTTPS(Meta server 不抓 http)");
  process.exit(1);
}

// 自動 derive cover URL —— 慣例:`<name>-threads.mp4` 對應 `<name>-reel.jpg`
// 沒帶 --cover 也會自動嘗試這個路徑(若 R2 沒這檔會 404,Meta 用第一幀當縮圖)
if (!COVER_URL) {
  const derived = VIDEO_URL.replace(/-threads\.mp4$/, "-reel.jpg")
    .replace(/-reel\.mp4$/, "-reel.jpg")
    .replace(/\.mp4$/, ".jpg");
  if (derived !== VIDEO_URL) {
    COVER_URL = derived;
    console.log(`ℹ️  自動 derive cover URL:${COVER_URL}`);
    console.log(`   (要關掉自動 derive 改帶 --cover '' 即可)`);
  }
}

if (COVER_URL && !/^https:\/\//.test(COVER_URL)) {
  console.error("❌ cover URL 必須是 HTTPS");
  process.exit(1);
}

const BASE = "https://graph.instagram.com/v25.0";

async function api(method, pathSeg, params = {}, body = null) {
  const url = new URL(`${BASE}/${pathSeg}`);
  url.searchParams.set("access_token", TOKEN);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const init = { method };
  if (body) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  // Meta API 偶發網路抖動 (fetch failed),retry 3 次,避免 polling 中途整個崩掉
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(url, init);
      const text = await resp.text();
      if (!resp.ok) {
        throw new Error(
          `IG API ${method} ${pathSeg} → ${resp.status}\n${text}`,
        );
      }
      return JSON.parse(text);
    } catch (err) {
      lastErr = err;
      // HTTP 狀態錯誤(4xx/5xx)是業務問題,不重試;只 retry 網路層失敗
      if (err.message?.startsWith("IG API")) throw err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw lastErr;
}

async function main() {
  console.log("📤 Instagram Reels 發佈");
  console.log(`   video: ${VIDEO_URL}`);
  if (COVER_URL) console.log(`   cover: ${COVER_URL}`);
  if (CAPTION) console.log(`   caption: ${CAPTION}`);
  console.log(`   share_to_feed: ${SHARE_TO_FEED}`);

  // 1. 建立 Reels container
  console.log("\n1. 建立 Reels container...");
  const createParams = {
    media_type: "REELS",
    video_url: VIDEO_URL,
    share_to_feed: SHARE_TO_FEED ? "true" : "false",
  };
  if (CAPTION) createParams.caption = CAPTION;
  if (COVER_URL) createParams.cover_url = COVER_URL;
  const created = await api("POST", `${IG_USER_ID}/media`, createParams);
  const creationId = created.id;
  console.log(`   ✓ creation_id = ${creationId}`);

  // 2. 等 Meta 轉檔
  console.log("\n2. 等 Meta 處理影片...");
  const maxAttempts = 60; // 60 × 5s = 5min 上限
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await api("GET", creationId, {
      fields: "status_code,status",
    });
    const code = s.status_code;
    process.stdout.write(
      `   [${i + 1}/${maxAttempts}] status_code=${code}${s.status ? ` (${s.status})` : ""}        \r`,
    );
    if (code === "FINISHED") {
      console.log("\n   ✓ 處理完成");
      break;
    }
    if (code === "ERROR" || code === "EXPIRED") {
      throw new Error(
        `Container ${code}: ${s.status ?? "(no detail)"}`,
      );
    }
    if (i === maxAttempts - 1) {
      throw new Error("等超過 5 分鐘,Meta 還沒處理完。可能 mp4 編碼不對(pix_fmt / color range)。");
    }
  }

  // 3. publish
  console.log("\n3. 正式發佈...");
  const published = await api("POST", `${IG_USER_ID}/media_publish`, {
    creation_id: creationId,
  });
  console.log(`   ✓ ig media id = ${published.id}`);

  try {
    const detail = await api("GET", published.id, {
      fields: "permalink,timestamp,media_type",
    });
    console.log(`\n🎉 發佈成功!`);
    console.log(`   ${detail.permalink ?? `https://www.instagram.com (找你最新的 Reel,id=${published.id})`}`);
  } catch {
    console.log(`\n🎉 發佈成功,ig media id = ${published.id}`);
    console.log("   進 https://www.instagram.com 看你最新的 Reel");
  }
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});

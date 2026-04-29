/**
 * scripts/update-youtube.mjs
 *
 * 更新已上線 YouTube 影片的 metadata（snippet + status）。
 * 使用 YouTube Data API v3 的 videos.update 端點。
 *
 * 用法:
 *   node scripts/update-youtube.mjs <video-id> [options]
 *     --title "..."
 *     --description-file <path>     讀檔當 description（避開 shell $VAR 展開問題）
 *     --description "..."           或直接給字串
 *     --tags "a,b,c"
 *     --category 28
 *     --visibility public|unlisted|private
 *
 * 只更新有給的欄位，其他欄位維持原樣。
 *
 * 環境變數（.env）:
 *   YOUTUBE_CLIENT_ID
 *   YOUTUBE_CLIENT_SECRET
 *   YOUTUBE_REFRESH_TOKEN
 */
import fs from "fs";
import path from "path";

// ── 讀 .env ─────────────────────────────────────────────────────────────────

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

// ── 驗證必要環境變數 ─────────────────────────────────────────────────────────

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

// ── 解析 CLI 參數 ─────────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);

// 第一個非 -- 開頭的參數是 video-id
const VIDEO_ID = rawArgs[0] && !rawArgs[0].startsWith("--") ? rawArgs[0] : null;

if (!VIDEO_ID) {
  console.error(
    "用法: node scripts/update-youtube.mjs <video-id> [--title \"...\"] [--description-file <path>] [--description \"...\"] [--tags \"a,b,c\"] [--category 28] [--visibility public|unlisted|private]",
  );
  process.exit(1);
}

const opts = {};
for (let i = 1; i < rawArgs.length; i++) {
  if (rawArgs[i].startsWith("--")) {
    opts[rawArgs[i].slice(2)] = rawArgs[i + 1];
    i++;
  }
}

// 解析各欄位（未給的保持 undefined，代表「不動此欄位」）
const NEW_TITLE = opts["title"];
const NEW_DESCRIPTION = opts["description-file"]
  ? fs.readFileSync(opts["description-file"], "utf-8")
  : opts["description"];
const NEW_TAGS = opts["tags"]
  ? opts["tags"].split(",").map((t) => t.trim()).filter(Boolean)
  : undefined;
const NEW_CATEGORY = opts["category"] ? String(opts["category"]) : undefined;
const NEW_VISIBILITY = opts["visibility"];

if (NEW_VISIBILITY && !["public", "unlisted", "private"].includes(NEW_VISIBILITY)) {
  console.error(
    `❌ visibility 必須是 public / unlisted / private，你給的是 ${NEW_VISIBILITY}`,
  );
  process.exit(1);
}

// 確保至少給了一個要更新的欄位
const hasAnyUpdate =
  NEW_TITLE !== undefined ||
  NEW_DESCRIPTION !== undefined ||
  NEW_TAGS !== undefined ||
  NEW_CATEGORY !== undefined ||
  NEW_VISIBILITY !== undefined;

if (!hasAnyUpdate) {
  console.error(
    "❌ 沒有指定任何要更新的欄位。請至少給 --title / --description / --description-file / --tags / --category / --visibility 其中一個。",
  );
  process.exit(1);
}

// ── OAuth：refresh_token → access_token ──────────────────────────────────────

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
      `refresh_token 換 access_token 失敗: ${JSON.stringify(j)}\n` +
        `→ token 過期了 / 被撤銷 / scope 不對。請重跑 node scripts/youtube-oauth.mjs`,
    );
  }
  return j.access_token;
}

// ── GET 現有 metadata ─────────────────────────────────────────────────────────

async function getCurrentMetadata(accessToken) {
  const url =
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${VIDEO_ID}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const text = await resp.text();
  if (!resp.ok) {
    // 403 scope 不足時給明確提示
    if (resp.status === 403 && text.includes("insufficientPermissions")) {
      throw new Error(
        `videos.list 403 — scope 不足（現有 refresh_token 只有 youtube.upload，` +
        `需要 youtube 完整 scope）\n` +
        `→ BLOCKED: 請重跑 node scripts/youtube-oauth.mjs（已更新為完整 youtube scope）`,
      );
    }
    throw new Error(`videos.list ${resp.status}:\n${text}`);
  }
  const data = JSON.parse(text);
  if (!data.items || data.items.length === 0) {
    throw new Error(`找不到 video id = ${VIDEO_ID}（可能 id 錯誤或沒有存取權限）`);
  }
  return data.items[0];
}

// ── PUT 更新 metadata ─────────────────────────────────────────────────────────

async function updateMetadata(accessToken, current) {
  // Merge：只覆蓋使用者有給的欄位，其他維持原本 API 回傳值
  const snippet = { ...current.snippet };

  if (NEW_TITLE !== undefined) snippet.title = NEW_TITLE;
  if (NEW_DESCRIPTION !== undefined) snippet.description = NEW_DESCRIPTION;
  if (NEW_TAGS !== undefined) snippet.tags = NEW_TAGS;
  if (NEW_CATEGORY !== undefined) snippet.categoryId = NEW_CATEGORY;

  // YouTube API 要求 snippet 必須帶 categoryId，確保不遺失
  if (!snippet.categoryId) snippet.categoryId = "28";

  const status = { ...current.status };
  if (NEW_VISIBILITY !== undefined) status.privacyStatus = NEW_VISIBILITY;

  const body = {
    id: VIDEO_ID,
    snippet,
    status,
  };

  const resp = await fetch(
    "https://www.googleapis.com/youtube/v3/videos?part=snippet,status",
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`videos.update ${resp.status}:\n${text}`);
  }
  return JSON.parse(text);
}

// ── 主流程 ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("✏️  YouTube 影片 Metadata 更新");
  console.log(`   video-id: ${VIDEO_ID}`);
  if (NEW_TITLE !== undefined) console.log(`   title: ${NEW_TITLE}`);
  if (NEW_DESCRIPTION !== undefined) {
    const preview = NEW_DESCRIPTION.slice(0, 60);
    console.log(
      `   description: ${preview}${NEW_DESCRIPTION.length > 60 ? "…" : ""} (共 ${NEW_DESCRIPTION.length} 字元)`,
    );
  }
  if (NEW_TAGS !== undefined) console.log(`   tags: ${NEW_TAGS.join(", ")}`);
  if (NEW_CATEGORY !== undefined) console.log(`   category: ${NEW_CATEGORY}`);
  if (NEW_VISIBILITY !== undefined) console.log(`   visibility: ${NEW_VISIBILITY}`);

  console.log("\n1. refresh_token → access_token...");
  let accessToken;
  try {
    accessToken = await getAccessToken();
  } catch (err) {
    // OAuth 失敗時明確提示，不嘗試重 OAuth（需要瀏覽器互動）
    console.error("\n❌ OAuth 失敗 — BLOCKED");
    console.error("   " + err.message);
    console.error(
      "\n   可能原因:\n" +
      "   1. refresh_token 7 天過期（Testing mode 限制）\n" +
      "   2. refresh_token 的 scope 不夠（需要 youtube，不能只有 youtube.upload）\n" +
      "\n   請手動執行: node scripts/youtube-oauth.mjs\n" +
      "   （youtube-oauth.mjs 已更新為完整 youtube scope，重跑即可）",
    );
    process.exit(1);
  }
  console.log("   ✓");

  console.log("\n2. 取得目前 metadata...");
  const current = await getCurrentMetadata(accessToken);
  console.log(`   ✓ title = "${current.snippet.title}"`);
  console.log(`   ✓ privacyStatus = "${current.status.privacyStatus}"`);
  console.log(
    `   ✓ description 目前 ${current.snippet.description?.length ?? 0} 字元`,
  );

  console.log("\n3. 更新 metadata...");
  const updated = await updateMetadata(accessToken, current);
  console.log("   ✓");

  console.log("\n── 更新結果 ──────────────────────────────────────────────────");
  console.log(`   title:         ${updated.snippet.title}`);
  console.log(`   privacyStatus: ${updated.status.privacyStatus}`);
  console.log(`   description:   ${updated.snippet.description?.length ?? 0} 字元`);
  if (updated.snippet.description) {
    const preview = updated.snippet.description.slice(0, 80);
    console.log(`   description 預覽: ${preview}${updated.snippet.description.length > 80 ? "…" : ""}`);
  }
  console.log(`\n🎉 完成！`);
  console.log(`   https://www.youtube.com/watch?v=${VIDEO_ID}`);
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});

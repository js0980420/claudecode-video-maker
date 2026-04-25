/**
 * scripts/youtube-oauth.mjs
 *
 * 一次性流程:跑 OAuth 拿 YouTube refresh_token,寫進 .env 的
 * YOUTUBE_REFRESH_TOKEN。之後 publish-youtube.mjs 就直接用 refresh_token
 * 換 access_token,不用再跑這支。
 *
 * Testing mode 下 refresh_token 7 天會失效,過期重跑這支即可。
 *
 * 用法:
 *   node scripts/youtube-oauth.mjs
 *
 * 流程:
 *   1. 印一個 Google 授權 URL,並嘗試自動開瀏覽器
 *   2. 你登入 Google + 授權(會看到 "App isn't verified" 警告 →
 *      點「進階」→「前往 <app name>(不安全)」,Testing mode 個人用就是這樣)
 *   3. Google 把 code 丟回 http://localhost:8765/oauth2callback
 *   4. 本支腳本拿 code 換 refresh_token,寫進 .env
 *
 * 環境變數(.env):
 *   YOUTUBE_CLIENT_ID
 *   YOUTUBE_CLIENT_SECRET
 *   YOUTUBE_REFRESH_TOKEN  ← 跑完會自動填進來
 */
import http from "http";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { URL } from "url";

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
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET in .env");
  process.exit(1);
}

const PORT = 8765;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
// youtube.upload 同時涵蓋 videos.insert 跟 thumbnails.set,最小授權
const SCOPE = "https://www.googleapis.com/auth/youtube.upload";

const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
authUrl.searchParams.set("client_id", CLIENT_ID);
authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
authUrl.searchParams.set("response_type", "code");
authUrl.searchParams.set("scope", SCOPE);
authUrl.searchParams.set("access_type", "offline"); // 必加,沒有就拿不到 refresh_token
authUrl.searchParams.set("prompt", "consent"); // 強制重發 refresh_token(避免重跑時拿不到)

console.log("🔐 YouTube OAuth\n");
console.log("如果瀏覽器沒自動開,手動貼這個 URL 進瀏覽器:");
console.log(authUrl.toString());
console.log("\n等待授權回傳... (Ctrl+C 取消)\n");

// 跨平台開瀏覽器
const opener =
  process.platform === "darwin" ? "open"
  : process.platform === "win32" ? "start ''"
  : "xdg-open";
exec(`${opener} "${authUrl.toString()}"`, (err) => {
  if (err) {
    // 安靜失敗,使用者用上面那行 URL 手動開
  }
});

function appendOrReplaceEnv(key, value) {
  const envPath = findEnvFile();
  if (!envPath) {
    console.error("❌ 找不到 .env");
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  let replaced = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(`${key}=`)) {
      lines[i] = `${key}=${value}`;
      replaced = true;
      break;
    }
  }
  if (!replaced) lines.push(`${key}=${value}`);
  fs.writeFileSync(envPath, lines.join("\n"));
}

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/oauth2callback")) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h1>授權被拒絕:${error}</h1>`);
    console.error(`\n❌ OAuth 拒絕:${error}`);
    server.close();
    process.exit(1);
  }
  if (!code) {
    res.writeHead(400);
    res.end("No code");
    return;
  }
  try {
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }).toString(),
    });
    const tokens = await tokenResp.json();
    if (!tokenResp.ok) {
      throw new Error(JSON.stringify(tokens));
    }
    if (!tokens.refresh_token) {
      // 通常是因為先前已經授權過,Google 不重發 refresh_token
      throw new Error(
        "回傳沒有 refresh_token。先到 https://myaccount.google.com/permissions 把這個 app 的授權移除,再重跑這支腳本。",
      );
    }
    appendOrReplaceEnv("YOUTUBE_REFRESH_TOKEN", tokens.refresh_token);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      "<h1>✅ 授權完成,可以關掉這個視窗</h1><p>refresh_token 已寫進 .env</p>",
    );
    console.log("✅ refresh_token 已寫進 .env");
    console.log(`   access_token (1 小時有效):${tokens.access_token.slice(0, 20)}...`);
    console.log(`   scope:${tokens.scope}`);
    console.log("\n下次發片直接 node scripts/publish-youtube.mjs ...");
    server.close();
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h1>換 token 失敗</h1><pre>${err.message}</pre>`);
    console.error("\n❌", err.message);
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  // ready,等 callback
});

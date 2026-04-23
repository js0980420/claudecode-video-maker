import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { content } from "../src/content";

// 簡易 .env 讀取（避免引入 dotenv 套件）
function loadEnv() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf-8");
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

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error(
    "❌ Missing GOOGLE_API_KEY in .env (get one from Google AI Studio)",
  );
  process.exit(1);
}

if (!content.voiceover.enabled) {
  console.error(
    "❌ content.voiceover.enabled is false — set it to true in src/content.ts first",
  );
  process.exit(1);
}

const MODEL = content.voiceover.model ?? "gemini-2.5-flash-preview-tts";
const VOICE = content.voiceover.voice ?? "Puck";
const PROMPT_PREFIX = content.voiceover.promptPrefix ?? "";

type SceneToRender = { id: string; text: string };

const ALL_SCENES: SceneToRender[] = content.scenes
  .filter((s) => Boolean(s.voiceover))
  .map((s) => ({ id: s.id, text: s.voiceover as string }));

if (ALL_SCENES.length === 0) {
  console.error(
    "❌ No scenes have a `voiceover` field set in src/content.ts",
  );
  process.exit(1);
}

function pcmToWav(
  pcm: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16,
): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const fileSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(fileSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcm]);
}

async function generateForScene(scene: SceneToRender): Promise<number> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: PROMPT_PREFIX + scene.text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: VOICE },
        },
      },
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `TTS failed for ${scene.id}: ${response.status}\n${errText}`,
    );
  }

  const json = (await response.json()) as {
    candidates?: {
      content?: { parts?: { inlineData?: { data: string } }[] };
    }[];
  };
  const audioB64 = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioB64) {
    console.error(`❌ Unexpected response for ${scene.id}:`);
    console.error(JSON.stringify(json, null, 2).slice(0, 800));
    throw new Error("No audio in response");
  }
  const pcm = Buffer.from(audioB64, "base64");
  const wav = pcmToWav(pcm);

  const outDir = join("public", "voiceover");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${scene.id}.wav`);
  writeFileSync(outPath, wav);
  const seconds = pcm.length / (24000 * 2);
  console.log(
    `✓ ${scene.id}: ${(wav.length / 1024).toFixed(1)} KB (${seconds.toFixed(2)}s) → ${outPath}`,
  );
  return seconds;
}

// CLI: npm run voiceover                  → regenerate all
//      npm run voiceover -- scene-03      → only specific scenes
const filter = process.argv.slice(2);
const toGenerate =
  filter.length > 0
    ? ALL_SCENES.filter((s) => filter.includes(s.id))
    : ALL_SCENES;

if (toGenerate.length === 0) {
  console.error(`❌ No matching scenes for: ${filter.join(", ")}`);
  console.error(`   Available: ${ALL_SCENES.map((s) => s.id).join(", ")}`);
  process.exit(1);
}
console.log(
  `🎙️  Generating voiceover with voice="${VOICE}" for: ${toGenerate.map((s) => s.id).join(", ")}`,
);

const durationsPath = join("public", "voiceover", "durations.json");
let durations: Record<string, number> = {};
if (existsSync(durationsPath)) {
  durations = JSON.parse(readFileSync(durationsPath, "utf-8"));
}

for (const scene of toGenerate) {
  const seconds = await generateForScene(scene);
  durations[scene.id] = seconds;
  // Avoid Gemini's 10 req/min rate limit
  if (toGenerate.indexOf(scene) < toGenerate.length - 1) {
    await new Promise((r) => setTimeout(r, 7000));
  }
}

writeFileSync(durationsPath, JSON.stringify(durations, null, 2));
console.log(`\n🎙️  Done — ${toGenerate.length} clip(s) written.`);

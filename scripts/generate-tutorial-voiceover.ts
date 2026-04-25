/**
 * scripts/generate-tutorial-voiceover.ts
 *
 * 從指定 video 的 steps.json 取出 intro + 每個 step 的 voiceovers[],
 * 透過 TTS provider 產出 .wav,寫入 public/voiceover/<name>/。
 *
 * 用法:
 *   tsx scripts/generate-tutorial-voiceover.ts <video-name> [...filterIds]
 *
 * Provider 切換(env):
 *   TTS_PROVIDER=elevenlabs (預設) | gemini
 *
 * ElevenLabs 必填:ELEVENLABS_API_KEY、ELEVENLABS_VOICE_ID
 *   選填:ELEVENLABS_MODEL(預設 eleven_multilingual_v2)
 *        ELEVENLABS_SAMPLE_RATE(預設 24000,Pro tier 才能用 44100)
 *
 * Gemini 必填:GOOGLE_API_KEY
 *   選填:GEMINI_VOICE(預設 Aoede)
 *        GEMINI_MODEL(預設 gemini-2.5-flash-preview-tts)
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";

const name = process.argv[2];
if (!name) {
  console.error(
    "用法:tsx scripts/generate-tutorial-voiceover.ts <video-name> [...filterIds]",
  );
  console.error("例:tsx scripts/generate-tutorial-voiceover.ts tutorial-ch2");
  process.exit(1);
}
const STEPS_PATH = join("public", "screenshots", name, "steps.json");
if (!existsSync(STEPS_PATH)) {
  console.error(`找不到 steps.json:${STEPS_PATH}`);
  process.exit(1);
}
const tutorialJson = JSON.parse(readFileSync(STEPS_PATH, "utf-8"));

// 從 cwd 往上走找最近的 .env(讓 worktree 共用 main 的 .env)
function findEnvFile(): string | null {
  let dir = process.cwd();
  while (true) {
    const candidate = join(dir, ".env");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function loadEnv() {
  const envPath = findEnvFile();
  if (!envPath) return;
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

const PROVIDER = (process.env.TTS_PROVIDER ?? "elevenlabs").toLowerCase();

const OUTPUT_DIR = join("public", "voiceover", name);

type ClipToRender = { id: string; text: string };
type AudioResult = { pcm: Buffer; sampleRate: number };

const clips: ClipToRender[] = [];
if (tutorialJson?.intro?.voiceover) {
  clips.push({ id: "intro", text: tutorialJson.intro.voiceover });
}
for (const step of tutorialJson.steps ?? []) {
  if (Array.isArray(step.voiceovers)) {
    step.voiceovers.forEach((text: string, i: number) => {
      clips.push({ id: `${step.id}-p${i + 1}`, text });
    });
  }
}
if (clips.length === 0) {
  console.error("❌ 沒有任何 voiceover 腳本 (intro 或 step.voiceovers 都沒填)");
  process.exit(1);
}

function pcmToWav(
  pcm: Buffer,
  sampleRate: number,
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

// ---- ElevenLabs ----
function makeElevenLabsProvider() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const model = process.env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2";
  // PCM 取樣率:Starter / Creator 上限 24000;Pro 才解鎖 44100。
  const sampleRate = Number(process.env.ELEVENLABS_SAMPLE_RATE ?? 24000);
  // 語速倍率:0.5 ~ 2.0,1.0 = 原速,< 1 變慢、> 1 變快。沒設就跟模型預設走。
  const speedRaw = process.env.ELEVENLABS_SPEED;
  const speed = speedRaw ? Number(speedRaw) : undefined;

  if (!apiKey) {
    console.error("❌ Missing ELEVENLABS_API_KEY in .env");
    process.exit(1);
  }
  if (!voiceId) {
    console.error("❌ Missing ELEVENLABS_VOICE_ID in .env");
    console.error(
      "    去 ElevenLabs Voice Library,點 clone 完的 voice → 複製 ID 貼進 .env",
    );
    process.exit(1);
  }

  return {
    label: `ElevenLabs ${model} @ ${sampleRate}Hz, voice=${voiceId}${speed !== undefined ? `, speed=${speed}` : ""}`,
    delayMs: 0, // Creator 同時併發 5,順序 call 沒壓力
    async generate(clip: ClipToRender): Promise<AudioResult> {
      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_${sampleRate}`;
      const body: Record<string, unknown> = { text: clip.text, model_id: model };
      if (speed !== undefined) {
        body.voice_settings = { speed };
      }
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(
          `ElevenLabs TTS failed for ${clip.id}: ${resp.status}\n${errText}`,
        );
      }
      const pcm = Buffer.from(await resp.arrayBuffer());
      if (pcm.length === 0) {
        throw new Error(`ElevenLabs returned empty audio for ${clip.id}`);
      }
      return { pcm, sampleRate };
    },
  };
}

// ---- Gemini ----
function makeGeminiProvider() {
  const apiKey = process.env.GOOGLE_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-preview-tts";
  const voice = process.env.GEMINI_VOICE ?? "Aoede";
  const sampleRate = 24000; // Gemini TTS 固定 24kHz

  if (!apiKey) {
    console.error("❌ Missing GOOGLE_API_KEY in .env");
    process.exit(1);
  }

  return {
    label: `Gemini ${model}, voice=${voice}`,
    delayMs: 7000, // Gemini TTS 限速嚴,維持原本 7 秒間隔
    async generate(clip: ClipToRender): Promise<AudioResult> {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = {
        contents: [{ parts: [{ text: clip.text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
        },
      };
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(
          `Gemini TTS failed for ${clip.id}: ${resp.status}\n${errText}`,
        );
      }
      const json = (await resp.json()) as {
        candidates?: {
          content?: { parts?: { inlineData?: { data: string } }[] };
        }[];
      };
      const audioB64 =
        json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioB64) {
        console.error(`❌ Unexpected Gemini response for ${clip.id}:`);
        console.error(JSON.stringify(json, null, 2).slice(0, 800));
        throw new Error("No audio in Gemini response");
      }
      return { pcm: Buffer.from(audioB64, "base64"), sampleRate };
    },
  };
}

const provider =
  PROVIDER === "gemini"
    ? makeGeminiProvider()
    : PROVIDER === "elevenlabs"
      ? makeElevenLabsProvider()
      : (() => {
          console.error(
            `❌ 未知 TTS_PROVIDER="${PROVIDER}"。支援:elevenlabs, gemini`,
          );
          process.exit(1);
        })();

const filter = process.argv.slice(3);
const toGenerate =
  filter.length > 0 ? clips.filter((c) => filter.includes(c.id)) : clips;

if (toGenerate.length === 0) {
  console.error(`❌ No matching clips for: ${filter.join(", ")}`);
  console.error(`   Available: ${clips.map((c) => c.id).join(", ")}`);
  process.exit(1);
}
console.log(`🎙️  ${provider.label}`);
console.log(`   clips: ${toGenerate.map((c) => c.id).join(", ")}`);

const durationsPath = join(OUTPUT_DIR, "durations.json");
let durations: Record<string, number> = {};
if (existsSync(durationsPath)) {
  durations = JSON.parse(readFileSync(durationsPath, "utf-8"));
}

void (async () => {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  for (let i = 0; i < toGenerate.length; i++) {
    const clip = toGenerate[i];
    const { pcm, sampleRate } = await provider.generate(clip);
    const wav = pcmToWav(pcm, sampleRate);
    const outPath = join(OUTPUT_DIR, `${clip.id}.wav`);
    writeFileSync(outPath, wav);
    const seconds = pcm.length / (sampleRate * 2); // 16-bit mono
    durations[clip.id] = seconds;
    console.log(
      `✓ ${clip.id}: ${(wav.length / 1024).toFixed(1)} KB (${seconds.toFixed(2)}s) → ${outPath}`,
    );
    if (provider.delayMs > 0 && i < toGenerate.length - 1) {
      await new Promise((r) => setTimeout(r, provider.delayMs));
    }
  }
  writeFileSync(durationsPath, JSON.stringify(durations, null, 2));
  console.log(`\n🎙️  Done — ${toGenerate.length} clip(s) written.`);
})();

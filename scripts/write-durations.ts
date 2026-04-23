import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = "public/voiceover";
const files = readdirSync(dir).filter((f) => f.endsWith(".wav"));

const durations: Record<string, number> = {};

for (const file of files) {
  const path = join(dir, file);
  // 讀 WAV 頭確認格式
  const fd = readFileSync(path);
  const sampleRate = fd.readUInt32LE(24);
  const channels = fd.readUInt16LE(22);
  const bitsPerSample = fd.readUInt16LE(34);
  const bytesPerSample = (channels * bitsPerSample) / 8;
  const dataSize = statSync(path).size - 44; // 44-byte RIFF header
  const seconds = dataSize / sampleRate / bytesPerSample;

  const id = file.replace(/\.wav$/, "");
  durations[id] = seconds;
  console.log(
    `${file}: ${seconds.toFixed(3)}s (${sampleRate}Hz ${channels}ch ${bitsPerSample}bit)`,
  );
}

writeFileSync(
  join(dir, "durations.json"),
  JSON.stringify(durations, null, 2),
);
console.log(`\n✓ wrote ${dir}/durations.json`);

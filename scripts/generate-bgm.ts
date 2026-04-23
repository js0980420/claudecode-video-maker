import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const FFMPEG_CANDIDATES = [
  "node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg",
  "node_modules/@remotion/compositor-linux-x64-musl/ffmpeg",
  "node_modules/@remotion/compositor-darwin-arm64/ffmpeg",
  "node_modules/@remotion/compositor-darwin-x64/ffmpeg",
  "node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe",
];
const ffmpeg = FFMPEG_CANDIDATES.find((p) => existsSync(p)) ?? "ffmpeg";

// 流行 I-V-vi-IV 進行（C-G-Am-F），每和弦 2 秒、8 秒一循環 = 120 BPM
type Chord = {
  name: string;
  root: number;
  third: number;
  fifth: number;
  octave: number;
};

const CHORDS: Chord[] = [
  { name: "C", root: 261.63, third: 329.63, fifth: 392.0, octave: 523.25 },
  { name: "G", root: 196.0, third: 246.94, fifth: 293.66, octave: 392.0 },
  { name: "Am", root: 220.0, third: 261.63, fifth: 329.63, octave: 440.0 },
  { name: "F", root: 174.61, third: 220.0, fifth: 261.63, octave: 349.23 },
];

const BAR_DURATION = 2; // 秒
const NOTES_PER_BAR = 4;
const NOTE_DURATION = BAR_DURATION / NOTES_PER_BAR; // 0.5s
const TOTAL = CHORDS.length * BAR_DURATION;

const BASS_VOLUME = 0.22;
const ARP_VOLUME = 0.38;
const STAB_VOLUME = 0.18; // 每音、一個 stab 三音疊加 ≈ 0.54

function buildFilter(): string {
  const lines: string[] = [];
  const labels: string[] = [];
  let idx = 0;

  const pushSource = (
    freq: number,
    startSec: number,
    durSec: number,
    vol: number,
  ) => {
    const label = `s${idx++}`;
    lines.push(
      `sine=frequency=${freq}:duration=${durSec}:sample_rate=44100,` +
        `adelay=${Math.round(startSec * 1000)}:all=1,volume=${vol}[${label}]`,
    );
    labels.push(`[${label}]`);
  };

  CHORDS.forEach((chord, barIdx) => {
    const barStart = barIdx * BAR_DURATION;

    // 低音線：根音延續整個 bar
    pushSource(chord.root / 2, barStart, BAR_DURATION, BASS_VOLUME);

    // 琶音 pattern：[octave, 5th, 3rd, 5th]
    const arpPattern = [chord.octave, chord.fifth, chord.third, chord.fifth];
    arpPattern.forEach((freq, j) => {
      pushSource(freq, barStart + j * NOTE_DURATION, NOTE_DURATION, ARP_VOLUME);
    });

    // 和弦 stab：beat 1 和 beat 3 各打一下（增加節奏感）
    const stabLen = 0.16;
    [0, 1].forEach((halfBar) => {
      const stabStart = barStart + halfBar * (BAR_DURATION / 2);
      [chord.root, chord.third, chord.fifth].forEach((freq) => {
        pushSource(freq, stabStart, stabLen, STAB_VOLUME);
      });
    });
  });

  // 全部混音（normalize=0 保留相加音量）
  lines.push(
    `${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest,` +
      `volume=1.3[out]`,
  );

  return lines.join(";");
}

const filter = buildFilter();
const outPath = join("public", "music", "bgm.mp3");

const args = [
  "-y",
  "-filter_complex",
  filter,
  "-map",
  "[out]",
  "-t",
  String(TOTAL),
  "-acodec",
  "libmp3lame",
  "-b:a",
  "192k",
  outPath,
];

console.log(`🎼 ffmpeg: ${ffmpeg}`);
console.log(`🎼 進行: ${CHORDS.map((c) => c.name).join(" → ")} (120 BPM)`);
console.log(`🎼 長度: ${TOTAL}s → ${outPath}`);

const result = spawnSync(ffmpeg, args, { stdio: "inherit" });
process.exit(result.status ?? 0);

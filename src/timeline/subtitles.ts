import type { Caption } from "@remotion/captions";
import { parseSrt } from "@remotion/captions";
import { SubtitleTimelineClip } from "./types";

export type SubtitleCue = Caption & {
  id: string;
};

export type SubtitleTrack = {
  id: string;
  language?: string;
  label?: string;
  cues: SubtitleCue[];
};

export function captionToCue(caption: Caption, index: number): SubtitleCue {
  return {
    ...caption,
    id: `cue-${String(index + 1).padStart(4, "0")}`,
  };
}

export function captionsToTrack(
  captions: Caption[],
  options: { id?: string; language?: string; label?: string } = {},
): SubtitleTrack {
  return {
    id: options.id ?? "subtitles",
    language: options.language,
    label: options.label,
    cues: captions.map(captionToCue),
  };
}

export function cueToTimelineClip(
  cue: SubtitleCue,
  fps: number,
): SubtitleTimelineClip {
  const from = Math.max(0, Math.floor((cue.startMs / 1000) * fps));
  const endFrame = Math.max(from + 1, Math.ceil((cue.endMs / 1000) * fps));
  return {
    id: cue.id,
    type: "subtitleCue",
    cueId: cue.id,
    text: cue.text,
    from,
    durationInFrames: endFrame - from,
  };
}

export function subtitleTrackToTimelineClips(
  track: SubtitleTrack,
  fps: number,
): SubtitleTimelineClip[] {
  return track.cues.map((cue) => cueToTimelineClip(cue, fps));
}

export function parseSrtToTrack(
  input: string,
  options: { id?: string; language?: string; label?: string } = {},
): SubtitleTrack {
  const { captions } = parseSrt({ input });
  return captionsToTrack(captions, options);
}

function parseTimestampMs(raw: string): number {
  const normalized = raw.trim().replace(",", ".");
  const parts = normalized.split(":");
  if (parts.length < 2 || parts.length > 3) {
    throw new Error(`Invalid subtitle timestamp: ${raw}`);
  }
  const secondsPart = parts.pop() as string;
  const minutes = Number(parts.pop());
  const hours = parts.length === 1 ? Number(parts.pop()) : 0;
  const seconds = Number(secondsPart);
  if (![hours, minutes, seconds].every(Number.isFinite)) {
    throw new Error(`Invalid subtitle timestamp: ${raw}`);
  }
  return Math.round(((hours * 60 + minutes) * 60 + seconds) * 1000);
}

export function parseVttToTrack(
  input: string,
  options: { id?: string; language?: string; label?: string } = {},
): SubtitleTrack {
  const normalized = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = normalized
    .replace(/^WEBVTT[^\n]*\n/, "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const captions: Caption[] = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    const timingLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timingLineIndex === -1) continue;
    const timingLine = lines[timingLineIndex];
    const [startRaw, endAndSettings] = timingLine.split("-->").map((part) => part.trim());
    const endRaw = endAndSettings.split(/\s+/)[0];
    const text = lines.slice(timingLineIndex + 1).join("\n").trim();
    if (!text) continue;
    captions.push({
      text,
      startMs: parseTimestampMs(startRaw),
      endMs: parseTimestampMs(endRaw),
      timestampMs: null,
      confidence: null,
    });
  }

  return captionsToTrack(captions, options);
}

export function parseSubtitleTextToTrack(
  input: string,
  format: "srt" | "vtt",
  options: { id?: string; language?: string; label?: string } = {},
): SubtitleTrack {
  return format === "srt"
    ? parseSrtToTrack(input, options)
    : parseVttToTrack(input, options);
}

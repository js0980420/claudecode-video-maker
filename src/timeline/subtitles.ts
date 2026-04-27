import type { Caption } from "@remotion/captions";
import { parseSrt } from "@remotion/captions";
import { SubtitleTimelineClip, TimelineTrack } from "./types";

export type SubtitleCue = Caption & {
  id: string;
};

export type SubtitleTrack = {
  id: string;
  language?: string;
  label?: string;
  cues: SubtitleCue[];
};

export type SubtitleBurnInOptions = {
  enabled?: boolean;
  trackId?: string;
  style?: SubtitleTimelineClip["style"];
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

function sentenceEnds(text: string) {
  return /[.!?。！？]\s*$/.test(text.trim());
}

export function captionsToSentenceTrack(
  captions: Caption[],
  options: { id?: string; language?: string; label?: string } = {},
): SubtitleTrack {
  const cues: SubtitleCue[] = [];
  let buffer: Caption[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    const first = buffer[0];
    const last = buffer[buffer.length - 1];
    cues.push({
      id: `cue-${String(cues.length + 1).padStart(4, "0")}`,
      text: buffer.map((caption) => caption.text).join(" ").replace(/\s+/g, " ").trim(),
      startMs: first.startMs,
      endMs: last.endMs,
      timestampMs: null,
      confidence: null,
    });
    buffer = [];
  };

  for (const caption of captions) {
    buffer.push(caption);
    if (sentenceEnds(caption.text)) flush();
  }
  flush();

  return {
    id: options.id ?? "sentences",
    language: options.language,
    label: options.label,
    cues,
  };
}

export function cueToTimelineClip(
  cue: SubtitleCue,
  fps: number,
  style: SubtitleTimelineClip["style"] = "standard",
): SubtitleTimelineClip {
  const from = Math.max(0, Math.floor((cue.startMs / 1000) * fps));
  const endFrame = Math.max(from + 1, Math.ceil((cue.endMs / 1000) * fps));
  return {
    id: cue.id,
    type: "subtitleCue",
    cueId: cue.id,
    text: cue.text,
    style,
    from,
    durationInFrames: endFrame - from,
  };
}

export function subtitleTrackToTimelineClips(
  track: SubtitleTrack,
  fps: number,
  style: SubtitleTimelineClip["style"] = "standard",
): SubtitleTimelineClip[] {
  return track.cues.map((cue) => cueToTimelineClip(cue, fps, style));
}

export function subtitleTrackToTimelineTrack(
  track: SubtitleTrack,
  fps: number,
  options: SubtitleBurnInOptions = {},
): TimelineTrack | null {
  if (options.enabled === false) return null;
  return {
    id: options.trackId ?? track.id,
    kind: "subtitle",
    clips: subtitleTrackToTimelineClips(track, fps, options.style),
  };
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

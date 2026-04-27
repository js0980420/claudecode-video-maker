import type { Caption } from "@remotion/captions";
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

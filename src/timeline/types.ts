import {
  AssetManifest,
  SceneConfig,
  ThreeSceneConfig,
  TimingMarkerKind,
  VideoContent,
} from "../types";

export type TimelineTransition =
  | { type: "cut" }
  | { type: "fade"; durationFrames: number }
  | { type: "crossfade"; durationFrames: number }
  | { type: "slide"; durationFrames: number; direction: "left" | "right" | "up" | "down" }
  | { type: "push"; durationFrames: number; direction: "left" | "right" | "up" | "down" };

export type TimelineClipBase = {
  id: string;
  from: number;
  durationInFrames: number;
  transitionIn?: TimelineTransition;
  transitionOut?: TimelineTransition;
};

export type SceneTimelineClip = TimelineClipBase & {
  type: "scene";
  scene: SceneConfig;
  sceneNumber: number;
  totalScenes: number;
};

export type VideoAssetTimelineClip = TimelineClipBase & {
  type: "videoAsset";
  assetId: string;
  fit?: "cover" | "contain";
  startFromSeconds?: number;
  endAtSeconds?: number;
  playbackRate?: number;
  volume?: number;
  muted?: boolean;
};

export type ImageAssetTimelineClip = TimelineClipBase & {
  type: "imageAsset";
  assetId: string;
  fit?: "cover" | "contain";
  dim?: number;
};

export type TextOverlayTimelineClip = TimelineClipBase & {
  type: "textOverlay";
  text: string;
  tone?: "title" | "body" | "caption";
};

export type TitleOverlayTimelineClip = TimelineClipBase & {
  type: "titleOverlay";
  title: string;
  kicker?: string;
  subtitle?: string;
};

export type LowerThirdTimelineClip = TimelineClipBase & {
  type: "lowerThird";
  title: string;
  subtitle?: string;
  label?: string;
};

export type SubtitleTimelineClip = TimelineClipBase & {
  type: "subtitleCue";
  cueId?: string;
  text: string;
  style?: "standard" | "sentence" | "youtube" | "reel" | "tutorial";
};

export type AudioAssetTimelineClip = TimelineClipBase & {
  type: "audioAsset";
  assetId: string;
  volume?: number;
  loop?: boolean;
};

export type ThreeSceneTimelineClip = TimelineClipBase & {
  type: "threeScene";
  scene?: ThreeSceneConfig;
};

export type TimelineClip =
  | SceneTimelineClip
  | VideoAssetTimelineClip
  | ImageAssetTimelineClip
  | TextOverlayTimelineClip
  | TitleOverlayTimelineClip
  | LowerThirdTimelineClip
  | SubtitleTimelineClip
  | AudioAssetTimelineClip
  | ThreeSceneTimelineClip;

export type TimelineTrackKind =
  | "scene"
  | "video"
  | "overlay"
  | "audio"
  | "subtitle";

export type TimelineTrack = {
  id: string;
  kind: TimelineTrackKind;
  clips: TimelineClip[];
};

export type TimelineMarker = {
  id: string;
  kind: TimingMarkerKind;
  frame: number;
  label?: string;
  sceneId?: string;
};

export type Timeline = {
  id: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  brand: VideoContent["brand"];
  assets?: AssetManifest;
  markers?: TimelineMarker[];
  tracks: TimelineTrack[];
};

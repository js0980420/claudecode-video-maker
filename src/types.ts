// ============================================================
// VideoContent — single source of truth for the whole video.
// Everything Claude Code (or you) touches to change content
// lives in src/content.ts (which imports these types).
//
// 所有影片內容的唯一來源。任何要修改的文案、場景、配音、
// BGM、縮圖設定，全部寫在 src/content.ts。
// ============================================================

export type IconName =
  | "claudeCode"
  | "remotion"
  | "editor"
  | "code"
  | "animation"
  | "voice"
  | "phone"
  | "terminal"
  | "rocket"
  | "spark"
  | "chat";

export type IconRef =
  | { kind: "builtin"; name: IconName; label?: string }
  | { kind: "emoji"; char: string; label?: string };

// ----- User media assets ---------------------------------------
// These are render-ready assets, normally under public/ and referenced by
// stable ids from scene visuals or future timeline clips.

export type AssetKind = "image" | "video" | "audio" | "model3d" | "font";

export type AssetBase = {
  id: string;
  kind: AssetKind;
  src: string; // path under public/, e.g. "videos/demo.mp4"
  label?: string;
  attribution?: string;
  tags?: string[];
};

export type ImageAsset = AssetBase & {
  kind: "image";
  width?: number;
  height?: number;
};

export type VideoAsset = AssetBase & {
  kind: "video";
  width?: number;
  height?: number;
  durationSeconds?: number;
  codec?: string;
};

export type AudioAsset = AssetBase & {
  kind: "audio";
  durationSeconds?: number;
};

export type Model3DAsset = AssetBase & {
  kind: "model3d";
  format?: "glb" | "gltf" | "obj" | "fbx" | string;
};

export type FontAsset = AssetBase & {
  kind: "font";
  family: string;
};

export type MediaAsset =
  | ImageAsset
  | VideoAsset
  | AudioAsset
  | Model3DAsset
  | FontAsset;

export type AssetManifest = {
  assets: MediaAsset[];
};

// Title / description support [bracket] syntax for accent color.
//   "用 [Claude Code] 做影片" → "Claude Code" 會被上重點色
//   "Made with [Claude] + [Remotion]" — same idea
// Use \n for line breaks.
export type RichText = string;

export type CropPreset = "16:9" | "1:1" | "4:5" | "9:16";

export type SpeedRampSegment = {
  durationSeconds: number; // output duration for this segment
  playbackRate: number; // source speed during this segment
};

export type ColorAdjustment = {
  brightness?: number; // 0..2, default 1
  contrast?: number; // 0..2, default 1
  saturation?: number; // 0..2, default 1
  vignette?: number; // 0..1, default 0
};

export type AudioDuckingConfig = {
  enabled: boolean;
  volumeMultiplier?: number; // 0..1, default 0.35
  attackFrames?: number; // default 12
  releaseFrames?: number; // default 18
};

export type TimingMarkerKind =
  | "beat"
  | "cut"
  | "emphasis"
  | "caption"
  | "custom";

export type TimingMarker = {
  id: string;
  kind?: TimingMarkerKind;
  seconds?: number;
  frame?: number;
  label?: string;
  sceneId?: string;
};

export type ThreeScenePrimitive = "box" | "sphere" | "torus";

export type ThreeSceneConfig = {
  primitive?: ThreeScenePrimitive;
  color?: string;
  rotationSpeed?: number;
  cameraZ?: number;
};

export type BrollSequenceItem = {
  assetId: string; // id of an image or video asset from content.assets
  durationSeconds?: number;
  fit?: "cover" | "contain";
  startFromSeconds?: number; // video assets only; ignored for images
  endAtSeconds?: number; // video assets only; ignored for images
  playbackRate?: number; // video assets only; default 1
  speedRamp?: SpeedRampSegment[]; // video assets only; mutually exclusive with playbackRate/endAtSeconds
  volume?: number; // video assets only; 0..1, default 0
  muted?: boolean; // video assets only; default true
  colorAdjustment?: ColorAdjustment;
  caption?: RichText;
};

export type TalkingHeadLayout = "full" | "split" | "pictureInPicture";

// ----- Scene visual templates ----------------------------------
// Each scene picks one visual template and provides its data.
// Want a new template? Add a variant here, then handle it in
// SceneRenderer.tsx.

export type SceneVisual =
  | { type: "centerText" } // no visual, title + description only
  | {
      type: "iconPair";
      left: IconRef;
      right: IconRef;
      connector?: "+" | "→" | "&";
    }
  | {
      type: "crossedItems";
      left: IconRef;
      right: IconRef;
    }
  | {
      type: "terminal";
      appName?: string; // titlebar text, e.g. "claude code"
      lines: { text: string; accent?: boolean }[];
    }
  | {
      type: "chatBox";
      // 對話框視覺（類 Claude Code / ChatGPT 氣泡）。
      // user 訊息右對齊、accent 可選為主色底；assistant 訊息左對齊白底。
      appName?: string; // 對話框頂端的標籤，例如 "claude code"
      messages: {
        role: "user" | "assistant";
        text: string;
        accent?: boolean; // user 訊息才會吃 accent：true = 主色底，false/undefined = 黑底
      }[];
    }
  | {
      type: "phoneCTA";
      senderName: string;
      senderInitial: string; // single letter shown in avatar circle
      messagePreview: string;
      ctaText: string; // big red button label
    }
  | {
      type: "videoClip";
      assetId: string; // id of a video asset from content.assets
      fit?: "cover" | "contain";
      cropPreset?: CropPreset;
      startFromSeconds?: number;
      endAtSeconds?: number;
      playbackRate?: number;
      speedRamp?: SpeedRampSegment[];
      volume?: number; // 0..1, default 0
      muted?: boolean; // default true
      colorAdjustment?: ColorAdjustment;
    }
  | {
      type: "imageBackground";
      assetId: string; // id of an image asset from content.assets
      fit?: "cover" | "contain";
      cropPreset?: CropPreset;
      dim?: number; // 0..0.8 overlay opacity
      colorAdjustment?: ColorAdjustment;
    }
  | {
      type: "brollSequence";
      items: BrollSequenceItem[];
      fit?: "cover" | "contain"; // default for items
      cropPreset?: CropPreset;
      colorAdjustment?: ColorAdjustment;
    }
  | {
      type: "talkingHead";
      speakerAssetId: string; // id of a video asset from content.assets
      supportingAssetId?: string; // optional image or video asset from content.assets
      layout?: TalkingHeadLayout;
      fit?: "cover" | "contain";
      cropPreset?: CropPreset;
      startFromSeconds?: number;
      endAtSeconds?: number;
      playbackRate?: number;
      speedRamp?: SpeedRampSegment[];
      volume?: number;
      muted?: boolean;
      colorAdjustment?: ColorAdjustment;
      speakerName?: string;
      speakerRole?: string;
    }
  | {
      type: "threeScene";
      scene?: ThreeSceneConfig;
      cropPreset?: CropPreset;
    };

export type SceneConfig = {
  id: string; // used for voiceover file naming, must be unique
  title: RichText;
  visual: SceneVisual;
  description?: RichText;
  voiceover?: string; // text passed to TTS; omit to skip this scene
  durationSeconds?: number; // used when voiceover.enabled is false
};

// ----- Thumbnails ----------------------------------------------

export type ThumbnailFormat = "yt" | "ig" | "reel";

export type ThumbnailContent = {
  // Title rendered as 3 lines: prefix + accentBox + suffix.
  // e.g. ["用", "Claude Code", "做影片"] →
  //   "用" / [red box: Claude Code] / "做影片"
  titleParts: [string, string, string];
  features: string[]; // chip labels in the middle
  tagline: RichText; // bottom punchline, supports [brackets]
  brand: string; // tiny brand text at the very bottom
};

// ----- Top-level config ----------------------------------------

export type VideoContent = {
  meta: {
    videoName: string; // 影片名稱 — 用來自動識別和命名檔案
    width: number;
    height: number;
    fps: number;
    sceneTailSeconds: number; // silence after each voiceover
    fallbackSceneSeconds: number; // duration when voiceover disabled
  };
  brand: {
    name: string; // bottom-right of every scene, e.g. "ALEX"
    subtitle?: string; // appears next to brand name
    primaryColor: string; // accent color used everywhere (hex)
  };
  assets?: AssetManifest; // optional render-ready assets referenced by scene ids
  markers?: TimingMarker[];
  scenes: SceneConfig[]; // any number of scenes
  voiceover: {
    enabled: boolean;
    voice?: string; // Gemini TTS voice (e.g. "Puck", "Kore")
    model?: string; // default: gemini-2.5-flash-preview-tts
    promptPrefix?: string; // prepended to each line, useful for forcing language
  };
  bgm: {
    enabled: boolean;
    file?: string; // path under public/, e.g. "music/bgm.mp3"
    volume?: number; // 0..1, default 0.55
    fadeInFrames?: number;
    fadeOutFrames?: number;
    ducking?: AudioDuckingConfig;
    attribution?: string; // CC BY etc., for your video description
  };
  thumbnails: {
    yt?: ThumbnailContent;
    ig?: ThumbnailContent;
    reel?: ThumbnailContent;
  };
};

import { AssetManifest, MediaAsset, VideoContent } from "../types";
import {
  AudioAssetTimelineClip,
  ImageAssetTimelineClip,
  Timeline,
  TimelineTrack,
  TitleOverlayTimelineClip,
  VideoAssetTimelineClip,
} from "../timeline/types";
import { EditPlan, EditPlanPlatform } from "./types";
import { validateEditPlan } from "./validate";

export type RuleBasedPlannerOptions = {
  brand: VideoContent["brand"];
  fps?: number;
};

const platformDimensions: Record<EditPlanPlatform, { width: number; height: number }> = {
  youtube: { width: 1920, height: 1080 },
  landscape: { width: 1920, height: 1080 },
  reel: { width: 1080, height: 1920 },
  shorts: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

function assetById(manifest: AssetManifest, id: string): MediaAsset {
  const asset = manifest.assets.find((item) => item.id === id);
  if (!asset) throw new Error(`Edit plan references missing asset: ${id}`);
  return asset;
}

function visualClipForAsset(
  asset: MediaAsset,
  from: number,
  durationInFrames: number,
): VideoAssetTimelineClip | ImageAssetTimelineClip | null {
  if (asset.kind === "video") {
    return {
      id: `video-${asset.id}`,
      type: "videoAsset",
      assetId: asset.id,
      from,
      durationInFrames,
      fit: "cover",
      muted: true,
    };
  }
  if (asset.kind === "image") {
    return {
      id: `image-${asset.id}`,
      type: "imageAsset",
      assetId: asset.id,
      from,
      durationInFrames,
      fit: "cover",
      dim: 0.08,
    };
  }
  return null;
}

export function planEditTimeline(
  plan: EditPlan,
  assets: AssetManifest,
  options: RuleBasedPlannerOptions,
): Timeline {
  const validation = validateEditPlan(plan);
  if (!validation.valid) {
    throw new Error(`Invalid edit plan:\n${validation.errors.join("\n")}`);
  }

  const fps = options.fps ?? 30;
  const dimensions = platformDimensions[plan.platform];
  const durationInFrames = Math.ceil(plan.targetDurationSeconds * fps);
  const resolvedAssets = plan.sourceAssetIds.map((id) => assetById(assets, id));
  const visualAssets = resolvedAssets.filter(
    (asset) => asset.kind === "video" || asset.kind === "image",
  );
  const audioAssets = resolvedAssets.filter((asset) => asset.kind === "audio");
  const visualDuration = Math.max(
    1,
    Math.floor(durationInFrames / Math.max(visualAssets.length, 1)),
  );

  const visualClips = visualAssets
    .map((asset, index) =>
      visualClipForAsset(asset, index * visualDuration, visualDuration),
    )
    .filter((clip): clip is VideoAssetTimelineClip | ImageAssetTimelineClip =>
      Boolean(clip),
    );

  const tracks: TimelineTrack[] = [];
  if (visualClips.length > 0) {
    tracks.push({ id: "visuals", kind: "video", clips: visualClips });
  }

  if (audioAssets.length > 0) {
    const audioClips: AudioAssetTimelineClip[] = audioAssets.map((asset) => ({
      id: `audio-${asset.id}`,
      type: "audioAsset",
      assetId: asset.id,
      from: 0,
      durationInFrames,
      volume: 0.85,
      loop: true,
    }));
    tracks.push({ id: "audio", kind: "audio", clips: audioClips });
  }

  if (plan.title) {
    const titleClip: TitleOverlayTimelineClip = {
      id: "title",
      type: "titleOverlay",
      title: plan.title,
      kicker: plan.stylePreset,
      subtitle: plan.objective,
      from: 0,
      durationInFrames: Math.min(durationInFrames, Math.max(fps * 2, Math.floor(durationInFrames / 4))),
    };
    tracks.push({ id: "overlays", kind: "overlay", clips: [titleClip] });
  }

  return {
    id: `edit-plan-${plan.platform}`,
    width: dimensions.width,
    height: dimensions.height,
    fps,
    durationInFrames,
    brand: options.brand,
    assets,
    tracks,
  };
}

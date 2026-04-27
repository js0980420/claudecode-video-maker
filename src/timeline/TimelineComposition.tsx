import React from "react";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { BLACK, WHITE } from "../constants";
import { SceneRenderer } from "../scenes/SceneRenderer";
import { ImageBackground } from "../scenes/templates/ImageBackground";
import { ThreeScene } from "../scenes/templates/ThreeScene";
import { VideoClip } from "../scenes/templates/VideoClip";
import { findAsset } from "../utils/assets";
import { SceneTimelineClip, Timeline, TimelineClip } from "./types";
import { transitionStyleForClip } from "./transitions";

export type TimelineCompositionProps = {
  timeline: Timeline;
};

const VisualClipFrame: React.FC<{
  clip: TimelineClip;
  children: React.ReactNode;
}> = ({ clip, children }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={transitionStyleForClip(clip, frame)}>
      {children}
    </AbsoluteFill>
  );
};

function renderSceneClip(timeline: Timeline, clip: SceneTimelineClip) {
  return (
    <Sequence
      key={clip.id}
      from={clip.from}
      durationInFrames={clip.durationInFrames}
      layout="none"
    >
      <VisualClipFrame clip={clip}>
        <SceneRenderer
          scene={clip.scene}
          sceneNumber={clip.sceneNumber}
          totalScenes={clip.totalScenes}
          sceneDuration={clip.durationInFrames}
          brand={timeline.brand}
          assets={timeline.assets}
        />
      </VisualClipFrame>
    </Sequence>
  );
}

function renderClip(timeline: Timeline, clip: TimelineClip) {
  switch (clip.type) {
    case "scene":
      return renderSceneClip(timeline, clip);
    case "videoAsset":
      return (
        <Sequence key={clip.id} from={clip.from} durationInFrames={clip.durationInFrames}>
          <VisualClipFrame clip={clip}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <VideoClip {...clip} assets={timeline.assets} />
            </AbsoluteFill>
          </VisualClipFrame>
        </Sequence>
      );
    case "imageAsset":
      return (
        <Sequence key={clip.id} from={clip.from} durationInFrames={clip.durationInFrames}>
          <VisualClipFrame clip={clip}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <ImageBackground {...clip} assets={timeline.assets} />
            </AbsoluteFill>
          </VisualClipFrame>
        </Sequence>
      );
    case "textOverlay":
      return (
        <Sequence key={clip.id} from={clip.from} durationInFrames={clip.durationInFrames}>
          <VisualClipFrame clip={clip}>
            <AbsoluteFill
              style={{
                alignItems: "center",
                justifyContent: "center",
                padding: 80,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  color: BLACK,
                  background: "rgba(255,255,255,0.86)",
                  padding: "18px 28px",
                  borderRadius: 14,
                  fontSize: clip.tone === "caption" ? 30 : clip.tone === "body" ? 42 : 64,
                  fontWeight: 900,
                  textAlign: "center",
                }}
              >
                {clip.text}
              </div>
            </AbsoluteFill>
          </VisualClipFrame>
        </Sequence>
      );
    case "titleOverlay":
      return (
        <Sequence key={clip.id} from={clip.from} durationInFrames={clip.durationInFrames}>
          <VisualClipFrame clip={clip}>
            <AbsoluteFill
              style={{
                justifyContent: "center",
                alignItems: "flex-start",
                padding: "0 120px",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  color: BLACK,
                  maxWidth: 1180,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {clip.kicker ? (
                  <div
                    style={{
                      color: timeline.brand.primaryColor,
                      fontSize: 30,
                      fontWeight: 900,
                      letterSpacing: 4,
                      textTransform: "uppercase",
                    }}
                  >
                    {clip.kicker}
                  </div>
                ) : null}
                <div style={{ fontSize: 86, fontWeight: 900, lineHeight: 1.05 }}>
                  {clip.title}
                </div>
                {clip.subtitle ? (
                  <div style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.25 }}>
                    {clip.subtitle}
                  </div>
                ) : null}
              </div>
            </AbsoluteFill>
          </VisualClipFrame>
        </Sequence>
      );
    case "lowerThird":
      return (
        <Sequence key={clip.id} from={clip.from} durationInFrames={clip.durationInFrames}>
          <VisualClipFrame clip={clip}>
            <AbsoluteFill
              style={{
                justifyContent: "flex-end",
                alignItems: "flex-start",
                padding: "0 0 92px 96px",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  minWidth: 520,
                  maxWidth: 860,
                  background: "rgba(255,255,255,0.92)",
                  borderLeft: `12px solid ${timeline.brand.primaryColor}`,
                  padding: "22px 28px",
                  boxShadow: "0 18px 60px rgba(0,0,0,0.18)",
                }}
              >
                {clip.label ? (
                  <div
                    style={{
                      color: timeline.brand.primaryColor,
                      fontSize: 22,
                      fontWeight: 900,
                      letterSpacing: 3,
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    {clip.label}
                  </div>
                ) : null}
                <div style={{ color: BLACK, fontSize: 42, fontWeight: 900 }}>
                  {clip.title}
                </div>
                {clip.subtitle ? (
                  <div style={{ color: BLACK, fontSize: 26, fontWeight: 700, marginTop: 4 }}>
                    {clip.subtitle}
                  </div>
                ) : null}
              </div>
            </AbsoluteFill>
          </VisualClipFrame>
        </Sequence>
      );
    case "subtitleCue": {
      const subtitleStyle = {
        standard: {
          padding: "0 120px 80px",
          fontSize: 34,
          borderRadius: 10,
          maxWidth: 1180,
          background: "rgba(0,0,0,0.72)",
          color: WHITE,
        },
        sentence: {
          padding: "0 160px 140px",
          fontSize: 46,
          borderRadius: 14,
          maxWidth: 1280,
          background: "rgba(0,0,0,0.72)",
          color: WHITE,
        },
        youtube: {
          padding: "0 160px 92px",
          fontSize: 42,
          borderRadius: 8,
          maxWidth: 1360,
          background: "rgba(0,0,0,0.78)",
          color: WHITE,
        },
        reel: {
          padding: "0 92px 210px",
          fontSize: 56,
          borderRadius: 18,
          maxWidth: 900,
          background: timeline.brand.primaryColor,
          color: WHITE,
        },
        tutorial: {
          padding: "0 140px 74px",
          fontSize: 34,
          borderRadius: 8,
          maxWidth: 1240,
          background: "rgba(255,255,255,0.92)",
          color: BLACK,
        },
      }[clip.style ?? "standard"];
      return (
        <Sequence key={clip.id} from={clip.from} durationInFrames={clip.durationInFrames}>
          <VisualClipFrame clip={clip}>
            <AbsoluteFill
              style={{
                justifyContent: "flex-end",
                alignItems: "center",
                padding: subtitleStyle.padding,
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  color: subtitleStyle.color,
                  background: subtitleStyle.background,
                  padding: "14px 24px",
                  borderRadius: subtitleStyle.borderRadius,
                  fontSize: subtitleStyle.fontSize,
                  fontWeight: 900,
                  lineHeight: 1.18,
                  textAlign: "center",
                  maxWidth: subtitleStyle.maxWidth,
                  boxShadow: "0 12px 44px rgba(0,0,0,0.18)",
                }}
              >
                {clip.text}
              </div>
            </AbsoluteFill>
          </VisualClipFrame>
        </Sequence>
      );
    }
    case "audioAsset": {
      const asset = findAsset(timeline.assets, clip.assetId, "audio");
      if (!asset) return null;
      return (
        <Sequence key={clip.id} from={clip.from} durationInFrames={clip.durationInFrames}>
          <Audio
            src={staticFile(asset.src)}
            loop={clip.loop}
            volume={() => clip.volume ?? 1}
          />
        </Sequence>
      );
    }
    case "threeScene":
      return (
        <Sequence key={clip.id} from={clip.from} durationInFrames={clip.durationInFrames}>
          <VisualClipFrame clip={clip}>
            <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
              <ThreeScene scene={clip.scene} assets={timeline.assets} />
            </AbsoluteFill>
          </VisualClipFrame>
        </Sequence>
      );
  }
}

export const TimelineComposition: React.FC<TimelineCompositionProps> = ({
  timeline,
}) => (
  <AbsoluteFill style={{ backgroundColor: WHITE }}>
    {timeline.tracks.map((track) =>
      track.clips.map((clip) => renderClip(timeline, clip)),
    )}
  </AbsoluteFill>
);

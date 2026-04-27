import { test } from "node:test";
import assert from "node:assert/strict";
import { planEditTimeline } from "./ruleBasedPlanner";

const brand = {
  name: "Demo",
  primaryColor: "#E63946",
};

test("planEditTimeline maps visual and audio assets into tracks", () => {
  const timeline = planEditTimeline(
    {
      objective: "Show the product",
      targetDurationSeconds: 12,
      platform: "reel",
      sourceAssetIds: ["clip", "photo", "music"],
      narration: { type: "none" },
      title: "Launch",
      stylePreset: "product",
    },
    {
      assets: [
        { id: "clip", kind: "video", src: "videos/clip.mp4" },
        { id: "photo", kind: "image", src: "images/photo.png" },
        { id: "music", kind: "audio", src: "music/bgm.mp3" },
      ],
    },
    { brand },
  );

  assert.equal(timeline.width, 1080);
  assert.equal(timeline.height, 1920);
  assert.equal(timeline.durationInFrames, 360);
  assert.equal(timeline.tracks.length, 3);
  assert.equal(timeline.tracks[0].clips[0].type, "videoAsset");
  assert.equal(timeline.tracks[0].clips[1].type, "imageAsset");
  assert.equal(timeline.tracks[1].clips[0].type, "audioAsset");
  assert.equal(timeline.tracks[2].clips[0].type, "titleOverlay");
});

test("planEditTimeline rejects missing assets", () => {
  assert.throws(
    () =>
      planEditTimeline(
        {
          objective: "Missing asset",
          targetDurationSeconds: 10,
          platform: "youtube",
          sourceAssetIds: ["missing"],
          narration: { type: "none" },
        },
        { assets: [] },
        { brand },
      ),
    /missing asset: missing/,
  );
});

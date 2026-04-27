import { VideoContent } from "./types";

// 快速測試用的最小化影片
export const content: VideoContent = {
  meta: {
    videoName: "測試影片",
    width: 1920,
    height: 1080,
    fps: 30,
    sceneTailSeconds: 0.4,
    fallbackSceneSeconds: 1,
  },

  brand: {
    name: "TEST",
    subtitle: "Demo",
    primaryColor: "#FF6B6B",
  },

  assets: {
    assets: [],
  },

  scenes: [
    {
      id: "scene-01",
      title: "This is a [test]",
      visual: {
        type: "iconPair",
        left: { kind: "builtin", name: "claudeCode" },
        right: { kind: "builtin", name: "remotion" },
        connector: "+",
      },
      description: "Quick test video",
      durationSeconds: 1,
    },
    {
      id: "scene-02",
      title: "[Done]",
      visual: {
        type: "centerText",
      },
      description: "That's it!",
      durationSeconds: 1,
    },
  ],

  voiceover: {
    enabled: false,
  },

  bgm: {
    enabled: false,
  },

  thumbnails: {},
};

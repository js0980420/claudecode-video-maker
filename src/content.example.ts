import { VideoContent } from "./types";

// ============================================================
// Demo content for the framework. Copy this file to
// `src/content.ts` (postinstall does this automatically) and
// edit it to make your own video.
//
// 框架示範內容。實際使用時請複製為 src/content.ts 後修改。
// （npm install 會自動建立 src/content.ts）
// ============================================================
//
// Quick reference / 速查
// ----------------------
// - Wrap text in [brackets] to color it with brand.primaryColor
//   用 [中括號] 包住的文字會被上重點色
// - Use \n in title/description for line breaks
//   title/description 中的 \n 會換行
// - To enable AI voiceover: set voiceover.enabled = true,
//   provide voiceover text per scene, then run `npm run voiceover`
//   啟用 AI 配音：把 voiceover.enabled 改成 true，
//   每個場景填 voiceover 文字，執行 npm run voiceover
// - To enable BGM: download a CC-licensed track to public/music/
//   and set bgm.file + bgm.enabled = true
//   啟用背景音樂：下載 CC 授權音樂到 public/music/，
//   設定 bgm.file 並把 bgm.enabled 改為 true

export const content: VideoContent = {
  meta: {
    videoName: "我的影片", // 改這裡可以自動分開不同影片，同名會覆蓋舊版本
    width: 1920,
    height: 1080,
    fps: 30,
    sceneTailSeconds: 0.4,
    fallbackSceneSeconds: 4,
  },

  brand: {
    name: "YOUR BRAND",
    subtitle: "demo video",
    primaryColor: "#E63946", // change to your brand color
  },

  // Add / remove / reorder scenes freely.
  // 場景數量可任意增減、重新排序。
  scenes: [
    {
      id: "scene-01",
      title: "Built with [Claude Code] + [Remotion]",
      visual: {
        type: "iconPair",
        left: { kind: "builtin", name: "claudeCode" },
        right: { kind: "builtin", name: "remotion" },
        connector: "+",
      },
      description: "Generated entirely through [conversation]",
      voiceover:
        "This video was made with Claude Code and Remotion — entirely through chat.",
      durationSeconds: 4,
    },
    {
      id: "scene-02",
      title: "No [video editor]\nNo [coding]",
      visual: {
        type: "crossedItems",
        left: { kind: "builtin", name: "editor", label: "EDITOR" },
        right: { kind: "builtin", name: "code", label: "CODE" },
      },
      description: "Anyone can do it",
      voiceover:
        "You don't need a video editor. You don't need to write code.",
      durationSeconds: 4,
    },
    {
      id: "scene-03",
      title: "Just [chat] to create",
      visual: {
        type: "terminal",
        appName: "terminal — claude code",
        lines: [
          { text: "$ npm install claude-code remotion", accent: true },
          { text: "$ make me a 30s product video..." },
        ],
      },
      description: "Type. Done.",
      voiceover:
        "Install Claude Code with Remotion. Then just chat to make a video.",
      durationSeconds: 5,
    },
    {
      id: "scene-04",
      title: "[Animation] + [AI voiceover]",
      visual: {
        type: "iconPair",
        left: { kind: "builtin", name: "animation", label: "ANIMATION" },
        right: { kind: "builtin", name: "voice", label: "AI VOICE" },
        connector: "+",
      },
      description: "Visuals and audio in one shot",
      voiceover: "Animation, plus AI-generated voiceover.",
      durationSeconds: 4,
    },
    {
      id: "scene-05",
      title: "DM [@your_handle]\nto learn more",
      visual: {
        type: "phoneCTA",
        senderName: "You",
        senderInitial: "Y",
        messagePreview: "Let me show you ✍",
        ctaText: "Message now →",
      },
      description: "I'll walk you through it [step by step]",
      voiceover: "Want to learn? Send me a message and I'll show you how.",
      durationSeconds: 4,
    },
  ],

  voiceover: {
    // Set to true after running `npm run voiceover` to generate WAVs.
    // The script reads scene.voiceover for each scene below.
    enabled: false,
    voice: "Puck", // Gemini TTS voice. Try: Puck, Kore, Aoede, Charon, Leda
    model: "gemini-2.5-flash-preview-tts",
    // For non-English content you can force a language with this prefix,
    // e.g. "Speak in Traditional Chinese: " or "請用繁體中文說："
    promptPrefix: "",
  },

  bgm: {
    // Set to true after placing a music file at public/music/<file>.
    enabled: false,
    file: "music/bgm.mp3",
    volume: 0.55,
    fadeInFrames: 18,
    fadeOutFrames: 30,
    attribution:
      "Music attribution goes here — required for CC BY tracks like Kevin MacLeod / incompetech.com",
  },

  thumbnails: {
    yt: {
      titleParts: ["Made with", "Claude Code", "and Remotion"],
      features: [
        "Script",
        "Animation",
        "Subtitles",
        "AI voiceover",
        "Background music",
        "Thumbnails",
      ],
      tagline: "All by [chat]",
      brand: "YOUR BRAND",
    },
    ig: {
      titleParts: ["Made with", "Claude Code", "and Remotion"],
      features: [
        "Script",
        "Animation",
        "Subtitles",
        "AI voice",
        "BGM",
        "Thumbnails",
      ],
      tagline: "All by [chat]",
      brand: "YOUR BRAND",
    },
    reel: {
      titleParts: ["Made with", "Claude Code", "+ Remotion"],
      features: [
        "Script",
        "Animation",
        "Subtitles",
        "AI voice",
        "BGM",
        "Thumbnails",
      ],
      tagline: "All by\n[chat]",
      brand: "YOUR BRAND",
    },
  },
};

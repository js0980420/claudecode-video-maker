import type { TutorialConfig } from "./types";

/**
 * Copy this to `config.ts` and edit for your video.
 * `config.ts` is gitignored so your personal branding stays local.
 * (postinstall 會自動 copy 一份,除非已存在)
 *
 * 浮水印預設用 src/tutorial/assets/zeabur.png(系列 brand,tracked 在 main)。
 * 換別的浮水印:把圖檔丟進 src/tutorial/assets/ 然後改下面 import 路徑;
 * 不要浮水印就把 watermark 行刪掉或註解掉。
 */
import watermarkImg from "./assets/zeabur.png";

export const TUTORIAL_CONFIG: TutorialConfig = {
  // 對應 public/screenshots/<videoName>/ 與 public/voiceover/<videoName>/ 的資料夾名。
  // 例:"tutorial-ch2"。共用元件靠這個 derive intro/step 音訊路徑與 composition id。
  videoName: "your-video-name",
  accentColor: "#E63946",
  intro: {
    titleAccent: "Your Topic",
    titleSuffix: "Tutorial",
    platform: { icon: "apple", label: "Mac" },
  },
  // 結尾場景(可選)。整個 outro 註解掉就不接結尾。
  // voiceover 寫在 steps.json 的 outro.voiceover,跟 intro 對稱。
  outro: {
    title: "恭喜!安裝完成",
    subtitle: "請看下一集",
    nextChapter: "Next Chapter Title", // 紅色 chip 包住的下一集名稱
  },
  watermark: { src: watermarkImg, size: 80 }, // 右下角浮水印,不要時刪掉這行
  thumbnail: {
    content: {
      titleParts: ["Audience", "Your Topic", "Value Prop"],
      features: ["Feature 1", "Feature 2", "Feature 3"],
      tagline: "[Your Topic] 最快上手",
      brand: "YOUR_BRAND",
    },
    platformBadge: { icon: "apple", label: "Mac" },
  },
};

import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT_FAMILY, WHITE } from "./constants";

// Instagram 4:5 動態貼文(1080x1350)—— 用來發 feed post,不是 profile 橫幅。
// 沿用 BannerFB 的視覺語彙(紅斜帶 + 主標+chip + 副標 + footer 雙短條 + tagline),
// 改為 portrait 排版:headline 更大、tagline 留在底部、上下留白更寬。
// IG feed post 不能點擊跳連結,所以 tagline 不要寫「點這張圖看連結」這類 CTA。
export type PostIGProps = {
  headlineLeft: string;
  headlineAccent: string;
  headlineRight: string;
  subline: string;
  footerLine: string;
  tagline: string[];
  primaryColor: string;
};

const BG = "#0F1419";
const SUB_GRAY = "#C5C9D0";

const CANVAS_W = 1080;
const CANVAS_H = 1350;

export const PostIG: React.FC<PostIGProps> = ({
  headlineLeft,
  headlineAccent,
  headlineRight,
  subline,
  footerLine,
  tagline,
  primaryColor,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        fontFamily: FONT_FAMILY,
        color: WHITE,
      }}
    >
      {/* 紅色斜帶 accent — 上下兩條,portrait 比例下角度更陡一點 */}
      <div
        style={{
          position: "absolute",
          left: -100,
          top: CANVAS_H * 0.16,
          width: CANVAS_W + 200,
          height: 6,
          background: primaryColor,
          opacity: 0.6,
          transform: "rotate(-2deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -100,
          top: CANVAS_H * 0.86,
          width: CANVAS_W + 200,
          height: 3,
          background: primaryColor,
          opacity: 0.3,
          transform: "rotate(-2deg)",
        }}
      />

      {/* 中央內容 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 38,
          padding: "0 60px",
        }}
      >
        {/* 主標 — portrait 大標題 */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: -2,
            lineHeight: 1.05,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            textAlign: "center",
          }}
        >
          {headlineLeft ? <span>{headlineLeft}</span> : null}
          <span
            style={{
              background: primaryColor,
              color: WHITE,
              padding: "8px 28px",
              borderRadius: 16,
            }}
          >
            {headlineAccent}
          </span>
          {headlineRight ? <span>{headlineRight}</span> : null}
        </div>

        {/* 副標 — 允許換行,IG portrait 有空間 */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: SUB_GRAY,
            letterSpacing: 1,
            textAlign: "center",
            lineHeight: 1.4,
            maxWidth: CANVAS_W - 200,
          }}
        >
          {subline}
        </div>

        {/* 底部強調 tag */}
        <div
          style={{
            fontSize: 36,
            color: WHITE,
            letterSpacing: 6,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginTop: 20,
          }}
        >
          <div
            style={{
              width: 90,
              height: 5,
              background: primaryColor,
            }}
          />
          {footerLine}
          <div
            style={{
              width: 90,
              height: 5,
              background: primaryColor,
            }}
          />
        </div>

        {/* 長句 tagline,放在 footer 底下 */}
        {tagline && tagline.length > 0 ? (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              fontSize: 26,
              fontWeight: 500,
              color: "#9098A4",
              lineHeight: 1.45,
              letterSpacing: 0.5,
              textAlign: "center",
              maxWidth: CANVAS_W - 160,
            }}
          >
            {tagline.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

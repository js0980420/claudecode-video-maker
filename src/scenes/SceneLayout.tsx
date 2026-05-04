import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { BLACK, FONT_FAMILY, GRAY, WHITE } from "../constants";
import { VideoContent } from "../types";

export const SceneLayout: React.FC<{
  brand: VideoContent["brand"];
  sceneNumber: number;
  totalScenes: number;
  sceneDuration: number;
  children: React.ReactNode;
}> = ({ brand, sceneNumber, totalScenes, sceneDuration, children }) => {
  const frame = useCurrentFrame();

  const safeDuration =
    typeof sceneDuration === "number" &&
    Number.isFinite(sceneDuration) &&
    sceneDuration > 0
      ? sceneDuration
      : 120;

  const fadeIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  // #4 出場:scale 縮小 + opacity 淡出 + blur 模糊
  const outProgress = interpolate(
    frame,
    [safeDuration - 13, safeDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const fadeOut = 1 - outProgress;
  const outScale = interpolate(outProgress, [0, 1], [1, 0.96], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outBlur = interpolate(outProgress, [0, 1], [0, 6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = Math.min(fadeIn, fadeOut);

  // #1 ambient 動態背景:中心點緩慢繞圓
  const cx = 50 + Math.sin(frame / 90) * 8;
  const cy = 50 + Math.cos(frame / 110) * 6;
  const ambientBg = `radial-gradient(circle at ${cx}% ${cy}%, ${brand.primaryColor}0F 0%, transparent 65%)`;

  // #2 Ken Burns:children wrapper 從 1.0 → 1.04
  const kenBurns = interpolate(frame, [0, safeDuration], [1.0, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: WHITE,
        color: BLACK,
        fontFamily: FONT_FAMILY,
        opacity,
        transform: `scale(${outScale})`,
        filter: outBlur > 0 ? `blur(${outBlur}px)` : undefined,
      }}
    >
      {/* #1 ambient 背景層 */}
      <AbsoluteFill style={{ background: ambientBg, pointerEvents: "none" }} />

      {/* #2 Ken Burns wrapper — 只包 children,不包頁碼/brand */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${kenBurns})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 60,
          fontSize: 22,
          color: GRAY,
          letterSpacing: 6,
          fontWeight: 700,
        }}
      >
        {String(sceneNumber).padStart(2, "0")}{" "}
        <span style={{ color: "#DDDDDD" }}>/</span>{" "}
        {String(totalScenes).padStart(2, "0")}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 60,
          fontSize: 20,
          color: GRAY,
          letterSpacing: 4,
          fontWeight: 700,
        }}
      >
        {brand.name}
        {brand.subtitle ? (
          <>
            <span style={{ color: "#DDDDDD" }}> · </span>
            {brand.subtitle}
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

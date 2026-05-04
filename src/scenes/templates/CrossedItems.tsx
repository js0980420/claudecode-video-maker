import React from "react";
import { useCurrentFrame, interpolate, Easing, spring, useVideoConfig } from "remotion";
import { IconRef, SceneVisual } from "../../types";
import { Icon } from "../../icons";
import { BLACK } from "../../constants";

type Props = Extract<SceneVisual, { type: "crossedItems" }> & {
  accentColor: string;
};

function backSlide(frame: number, delay: number): number {
  const f = Math.max(0, frame - delay);
  return interpolate(f, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.3)),
  });
}

export const CrossedItems: React.FC<Props> = ({
  left,
  right,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // #3 stagger: left 先(0),right 後(3)
  const leftP = backSlide(frame, 0);
  const rightP = backSlide(frame, 3);
  // 打叉線沿用 spring(視覺上需要有彈性的畫線感)
  const leftCross = spring({ frame: frame - 18, fps, config: { damping: 10 } });
  const rightCross = spring({ frame: frame - 26, fps, config: { damping: 10 } });

  return (
    <div style={{ display: "flex", gap: 80 }}>
      <CrossedItem
        ref_={left}
        accentColor={accentColor}
        progress={leftP}
        crossProgress={leftCross}
      />
      <CrossedItem
        ref_={right}
        accentColor={accentColor}
        progress={rightP}
        crossProgress={rightCross}
      />
    </div>
  );
};

const CrossedItem: React.FC<{
  ref_: IconRef;
  accentColor: string;
  progress: number;
  crossProgress: number;
}> = ({ ref_, accentColor, progress, crossProgress }) => (
  <div
    style={{
      opacity: progress,
      transform: `scale(${progress}) translateY(${(1 - progress) * 24}px)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      position: "relative",
    }}
  >
    <Icon ref_={ref_} color={BLACK} accent={accentColor} />
    {ref_.label ? (
      <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 3 }}>
        {ref_.label}
      </div>
    ) : null}
    <svg
      width="180"
      height="180"
      viewBox="0 0 180 180"
      style={{
        position: "absolute",
        top: -10,
        left: 10,
        pointerEvents: "none",
      }}
    >
      <line
        x1="30"
        y1="30"
        x2={30 + 120 * crossProgress}
        y2={30 + 120 * crossProgress}
        stroke={accentColor}
        strokeWidth="10"
        strokeLinecap="round"
      />
      <line
        x1="150"
        y1="30"
        x2={150 - 120 * crossProgress}
        y2={30 + 120 * crossProgress}
        stroke={accentColor}
        strokeWidth="10"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

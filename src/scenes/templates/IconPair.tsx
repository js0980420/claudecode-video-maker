import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { IconRef, SceneVisual } from "../../types";
import { Icon } from "../../icons";
import { BLACK } from "../../constants";

type Props = Extract<SceneVisual, { type: "iconPair" }> & {
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

export const IconPair: React.FC<Props> = ({
  left,
  right,
  connector,
  accentColor,
}) => {
  const frame = useCurrentFrame();

  // #3 stagger: left(0) → connector(3) → right(6), Back easing
  const leftP = backSlide(frame, 0);
  const connP = backSlide(frame, 3);
  const rightP = backSlide(frame, 6);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
      <Item ref_={left} accentColor={accentColor} progress={leftP} />
      {connector ? (
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: BLACK,
            opacity: connP,
            transform: `scale(${connP}) translateY(${(1 - connP) * 24}px)`,
          }}
        >
          {connector}
        </div>
      ) : null}
      <Item ref_={right} accentColor={accentColor} progress={rightP} />
    </div>
  );
};

const Item: React.FC<{
  ref_: IconRef;
  accentColor: string;
  progress: number;
}> = ({ ref_, accentColor, progress }) => (
  <div
    style={{
      opacity: progress,
      transform: `scale(${progress}) translateY(${(1 - progress) * 24}px)`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 14,
    }}
  >
    <Icon ref_={ref_} color={BLACK} accent={accentColor} />
    {ref_.label ? (
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 3 }}>
        {ref_.label}
      </div>
    ) : null}
  </div>
);

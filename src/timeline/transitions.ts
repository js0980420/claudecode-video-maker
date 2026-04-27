import { CSSProperties } from "react";
import { interpolate } from "remotion";
import { TimelineClipBase, TimelineTransition } from "./types";

function opacityForTransition(
  frame: number,
  transition: TimelineTransition | undefined,
  mode: "in" | "out",
  durationInFrames: number,
) {
  if (!transition || transition.type === "cut") return 1;
  const duration = Math.max(1, transition.durationFrames);
  if (transition.type !== "fade" && transition.type !== "crossfade") return 1;
  if (mode === "in") {
    return interpolate(frame, [0, duration], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  return interpolate(
    frame,
    [durationInFrames - duration, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
}

function transformForTransition(
  frame: number,
  transition: TimelineTransition | undefined,
  mode: "in" | "out",
  durationInFrames: number,
) {
  if (!transition || transition.type === "cut") return "";
  if (transition.type !== "slide" && transition.type !== "push") return "";

  const duration = Math.max(1, transition.durationFrames);
  const distance = transition.type === "push" ? 100 : 16;
  const sign = mode === "in" ? -1 : 1;
  const offset =
    mode === "in"
      ? interpolate(frame, [0, duration], [distance * sign, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : interpolate(
          frame,
          [durationInFrames - duration, durationInFrames],
          [0, distance * sign * -1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

  if (transition.direction === "left" || transition.direction === "right") {
    const directionSign = transition.direction === "left" ? 1 : -1;
    return `translateX(${offset * directionSign}%)`;
  }
  const directionSign = transition.direction === "up" ? 1 : -1;
  return `translateY(${offset * directionSign}%)`;
}

export function transitionStyleForClip(
  clip: TimelineClipBase,
  frame: number,
): CSSProperties {
  const opacity = Math.min(
    opacityForTransition(frame, clip.transitionIn, "in", clip.durationInFrames),
    opacityForTransition(frame, clip.transitionOut, "out", clip.durationInFrames),
  );
  const transforms = [
    transformForTransition(frame, clip.transitionIn, "in", clip.durationInFrames),
    transformForTransition(frame, clip.transitionOut, "out", clip.durationInFrames),
  ].filter(Boolean);

  return {
    opacity,
    transform: transforms.join(" ") || undefined,
  };
}

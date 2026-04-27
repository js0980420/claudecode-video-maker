import { ThreeCameraAnimation } from "../types";

export type CameraPosition = [number, number, number];

export function cameraPositionForFrame(
  animation: ThreeCameraAnimation | undefined,
  frame: number,
  defaultZ: number,
): CameraPosition {
  if (!animation || animation.type === "static") return [0, 0, defaultZ];

  if (animation.type === "dolly") {
    const durationFrames = Math.max(1, animation.durationFrames ?? 90);
    const progress = Math.max(0, Math.min(1, frame / durationFrames));
    return [0, 0, animation.fromZ + (animation.toZ - animation.fromZ) * progress];
  }

  const radius = animation.radius ?? defaultZ;
  const height = animation.height ?? 0;
  const speed = animation.speed ?? 0.018;
  return [
    Math.sin(frame * speed) * radius,
    height,
    Math.cos(frame * speed) * radius,
  ];
}

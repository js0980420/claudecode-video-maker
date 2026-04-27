import { TimingMarker } from "../types";
import type { TimelineMarker } from "../timeline/types";

export function timingMarkerFrame(marker: TimingMarker, fps: number): number {
  if (typeof marker.frame === "number") return Math.max(0, Math.round(marker.frame));
  return Math.max(0, Math.round((marker.seconds ?? 0) * fps));
}

export function timingMarkersToTimelineMarkers(
  markers: TimingMarker[] | undefined,
  fps: number,
): TimelineMarker[] | undefined {
  if (!markers || markers.length === 0) return undefined;
  return markers.map((marker) => ({
    id: marker.id,
    kind: marker.kind ?? "custom",
    frame: timingMarkerFrame(marker, fps),
    label: marker.label,
    sceneId: marker.sceneId,
  }));
}

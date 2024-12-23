// utils/snapUtils.ts

import { Clip, SnapGuide } from "@/types";

export const SNAP_THRESHOLD = 5; // 像素

export function calculateSnapGuides(
  clips: Clip[],
  activeClipId: string | null,
  scale: number,
  basePixelsPerSecond: number
): SnapGuide[] {
  const guides: SnapGuide[] = [];

  clips.forEach((clip) => {
    if (clip.id === activeClipId) return;

    // 添加片段起点对齐线
    guides.push({
      time: clip.startTime,
      type: "start",
      clipId: clip.id,
    });

    // 添加片段终点对齐线
    guides.push({
      time: clip.startTime + clip.duration,
      type: "end",
      clipId: clip.id,
    });

    // 添加片段中点对齐线
    guides.push({
      time: clip.startTime + clip.duration / 2,
      type: "clip",
      clipId: clip.id,
    });
  });

  return guides;
}

export function findNearestSnap(
  time: number,
  guides: SnapGuide[],
  scale: number,
  basePixelsPerSecond: number,
  threshold: number = SNAP_THRESHOLD
): { time: number; guide: SnapGuide | null } {
  let nearestGuide: SnapGuide | null = null;
  let nearestDistance = threshold + 1;

  guides.forEach((guide) => {
    const distance = Math.abs(guide.time - time) * scale * basePixelsPerSecond;
    if (distance < threshold && distance < nearestDistance) {
      nearestDistance = distance;
      nearestGuide = guide;
    }
  });

  return {
    // @ts-ignore
    time: nearestGuide ? nearestGuide?.time : time,
    guide: nearestGuide,
  };
}

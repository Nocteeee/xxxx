// src/utils/clipUtils.ts
import { Clip, ClipCollision, SnapGuide } from "../types";
import { SNAP_THRESHOLD } from "../constants";

export function detectClipCollisions(
  activeClip: Clip,
  otherClips: Clip[],
  proposedStartTime: number,
  snapThreshold: number
): ClipCollision[] {
  const collisions: ClipCollision[] = [];
  const activeEndTime = proposedStartTime + activeClip.duration;

  otherClips.forEach((clip) => {
    if (clip.id === activeClip.id) return;

    const clipEndTime = clip.startTime + clip.duration;
    const gap = Math.min(
      Math.abs(proposedStartTime - clipEndTime),
      Math.abs(activeEndTime - clip.startTime)
    );

    // 检测重叠
    if (
      !(activeEndTime <= clip.startTime || proposedStartTime >= clipEndTime)
    ) {
      collisions.push({
        clipId: clip.id,
        type: "overlap",
        position: proposedStartTime < clip.startTime ? "before" : "after",
        time: proposedStartTime < clip.startTime ? clip.startTime : clipEndTime,
      });
    }
    // 检测相邻
    else if (gap <= snapThreshold) {
      collisions.push({
        clipId: clip.id,
        type: "adjacent",
        position: proposedStartTime < clip.startTime ? "before" : "after",
        time: proposedStartTime < clip.startTime ? clip.startTime : clipEndTime,
      });
    }
  });

  return collisions;
}

export function findValidClipPosition(
  activeClip: Clip,
  otherClips: Clip[],
  proposedStartTime: number,
  snapThreshold: number
): number {
  const collisions = detectClipCollisions(
    activeClip,
    otherClips,
    proposedStartTime,
    snapThreshold
  );

  if (collisions.length === 0) return proposedStartTime;

  const overlapCollisions = collisions.filter((c) => c.type === "overlap");
  if (overlapCollisions.length > 0) {
    const lastPosition = activeClip.startTime;
    if (proposedStartTime > lastPosition) {
      return Math.max(...overlapCollisions.map((c) => c.time));
    } else {
      return Math.min(
        ...overlapCollisions.map((c) => c.time - activeClip.duration)
      );
    }
  }

  const adjacentCollisions = collisions.filter((c) => c.type === "adjacent");
  if (adjacentCollisions.length > 0) {
    return adjacentCollisions[0].time;
  }

  return proposedStartTime;
}

export function calculateSnapGuides(
  clips: Clip[],
  activeClipId: string | null,
  scale: number,
  basePixelsPerSecond: number
): SnapGuide[] {
  const guides: SnapGuide[] = [];

  clips.forEach((clip) => {
    if (clip.id === activeClipId) return;

    guides.push({
      time: clip.startTime,
      type: "start",
      clipId: clip.id,
    });

    guides.push({
      time: clip.startTime + clip.duration,
      type: "end",
      clipId: clip.id,
    });

    guides.push({
      time: clip.startTime + clip.duration / 2,
      type: "clip",
      clipId: clip.id,
    });
  });

  return guides;
}

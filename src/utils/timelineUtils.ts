// src/utils/timelineUtils.ts
import { Track, Clip, TrackType } from "../types";

export function canDropClipToTrack(
  clip: Clip,
  track: Track,
  trackClips: Clip[]
): boolean {
  if (!isClipTypeCompatibleWithTrack(clip, track)) return false;

  const clipEndTime = clip.startTime + clip.duration;
  return !trackClips.some((existingClip) => {
    const existingEndTime = existingClip.startTime + existingClip.duration;
    return !(
      clipEndTime <= existingClip.startTime || clip.startTime >= existingEndTime
    );
  });
}

export function isClipTypeCompatibleWithTrack(
  clip: Clip,
  track: Track
): boolean {
  const trackCompatibility: { [key in TrackType]: string[] } = {
    video: ["video"],
    audio: ["audio"],
    text: ["text"],
    image: ["image", "video"],
  };

  return trackCompatibility[track.type].includes(clip.type);
}

export function consolidateClips(clips: Clip[]): Clip[] {
  const clipsByTrack = clips.reduce((acc, clip) => {
    if (!acc[clip.trackId]) acc[clip.trackId] = [];
    acc[clip.trackId].push(clip);
    acc[clip.trackId].sort((a, b) => a.startTime - b.startTime);
    return acc;
  }, {} as { [trackId: string]: Clip[] });

  return Object.values(clipsByTrack).flatMap((trackClips) => {
    let lastEndTime = 0;
    return trackClips.map((clip) => {
      const newStartTime = Math.max(clip.startTime, lastEndTime);
      lastEndTime = newStartTime + clip.duration;
      return { ...clip, startTime: newStartTime };
    });
  });
}

export function drawTimeScale(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  offsetX: number,
  scale: number,
  basePixelsPerSecond: number
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#232323";
  ctx.fillRect(0, 0, width, height);

  const pixelsPerSecond = basePixelsPerSecond * scale;
  const secondsPerMajorTick = Math.pow(
    2,
    Math.floor(Math.log2(100 / pixelsPerSecond))
  );
  const pixelsPerMajorTick = secondsPerMajorTick * pixelsPerSecond;

  ctx.beginPath();
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 1;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "10px Arial";
  ctx.fillStyle = "#fff";

  const startTime = Math.floor(-offsetX / pixelsPerSecond);
  const endTime = Math.ceil((width - offsetX) / pixelsPerSecond);

  for (let time = startTime; time <= endTime; time += secondsPerMajorTick) {
    const x = time * pixelsPerSecond + offsetX;

    // 绘制主刻度线
    ctx.moveTo(x, height - 10);
    ctx.lineTo(x, height);

    // 绘制时间文本
    const timeText = formatTime(time);
    ctx.fillText(timeText, x, 2);

    // 绘制次刻度线
    for (let i = 1; i < 4; i++) {
      const minorX = x + (pixelsPerMajorTick * i) / 4;
      if (minorX < width) {
        ctx.moveTo(minorX, height - 5);
        ctx.lineTo(minorX, height);
      }
    }
  }

  ctx.stroke();
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(Math.abs(seconds) / 60);
  const remainingSeconds = Math.abs(seconds) % 60;
  const sign = seconds < 0 ? "-" : "";
  return `${sign}${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

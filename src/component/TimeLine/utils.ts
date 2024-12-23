export const TIME_INTERVALS = [
  1, 3, 5, 10, 30, 60, 180, 300, 600, 1800, 3600, 10800, 30000,
];

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function formatInterval(seconds: number): string {
  if (seconds >= 3600) {
    return `${seconds / 3600}小时`;
  }
  if (seconds >= 60) {
    return `${seconds / 60}分钟`;
  }
  return `${seconds}秒`;
}

export function getTimeInterval(
  scale: number,
  basePixelsPerSecond: number
): number {
  const pixelsPerSecond = basePixelsPerSecond * scale;
  const idealPixelsBetweenMarks = 100;
  const secondsPerPixel = 1 / pixelsPerSecond;
  const idealInterval = idealPixelsBetweenMarks * secondsPerPixel;

  let bestInterval = TIME_INTERVALS[0];
  let minDiff = Math.abs(Math.log(idealInterval) - Math.log(TIME_INTERVALS[0]));

  for (let interval of TIME_INTERVALS) {
    const diff = Math.abs(Math.log(idealInterval) - Math.log(interval));
    if (diff < minDiff) {
      minDiff = diff;
      bestInterval = interval;
    }
  }

  return bestInterval;
}

export function getMajorInterval(interval: number): number {
  const nextIndex = TIME_INTERVALS.indexOf(interval) + 1;
  return nextIndex < TIME_INTERVALS.length
    ? TIME_INTERVALS[nextIndex]
    : interval * 2;
}

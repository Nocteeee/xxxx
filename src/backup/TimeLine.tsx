import React, { useEffect, useRef, useState, useCallback } from "react";
// import { TimelineProps } from "../../types";
import {
  formatTime,
  formatInterval,
  getTimeInterval,
  getMajorInterval,
} from "../component/TimeLine/utils";
// import "./Timeline.css";
import { TimelineProps } from "@/types";

const defaultProps = {
  initialDuration: 7200, // 2小时
  basePixelsPerSecond: 50,
  maxScale: 5,
  wheelZoomRatio: 1.1,
  buttonZoomRatio: 1.2,
};

const Timeline: React.FC<TimelineProps> = (props) => {
  const {
    initialDuration,
    basePixelsPerSecond,
    maxScale,
    wheelZoomRatio,
    buttonZoomRatio,
  } = { ...defaultProps, ...props };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState<number>(1);
  const [minScale, setMinScale] = useState<number>(1);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; scrollX: number }>({
    x: 0,
    scrollX: 0,
  });

  // 示例视频片段
  // const sampleClips: VideoClip[] = [
  //   { startTime: 100, duration: 200, color: "#3498db" },
  //   { startTime: 400, duration: 150, color: "#e74c3c" },
  // ];

  const pixelsToTime = useCallback(
    (pixels: number, currentScale: number) => {
      return pixels / (basePixelsPerSecond * currentScale);
    },
    [basePixelsPerSecond]
  );

  const timeToPixels = useCallback(
    (time: number, currentScale: number) => {
      return time * basePixelsPerSecond * currentScale;
    },
    [basePixelsPerSecond]
  );

  // 计算当前视图需要显示的总时长
  const getVisibleDuration = useCallback(() => {
    if (!canvasRef.current) return initialDuration;
    const visibleWidth = canvasRef.current.width;
    const timeAtStart = pixelsToTime(-offsetX, scale);
    const visibleTime = pixelsToTime(visibleWidth, scale);
    return Math.max(timeAtStart + visibleTime, initialDuration);
  }, [initialDuration, offsetX, scale, pixelsToTime]);

  const calculateInitialScale = useCallback(() => {
    if (!canvasRef.current) return 1;
    const containerWidth = canvasRef.current.width;
    const targetWidth = containerWidth / 3;
    return targetWidth / (initialDuration * basePixelsPerSecond);
  }, [initialDuration, basePixelsPerSecond]);

  const constrainOffset = useCallback(
    (offset: number, currentScale: number) => {
      if (!canvasRef.current) return offset;
      const minOffset =
        -initialDuration * basePixelsPerSecond * currentScale +
        canvasRef.current.width;
      return Math.min(0, Math.max(minOffset, offset));
    },
    [initialDuration, basePixelsPerSecond]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const interval = getTimeInterval(scale, basePixelsPerSecond);
    const majorInterval = getMajorInterval(interval);
    const visibleDuration = getVisibleDuration();

    // 计算显示区域的时间范围
    const startTime = Math.max(0, pixelsToTime(-offsetX, scale));
    const endTime = startTime + pixelsToTime(canvas.width, scale);

    // 计算第一个刻度的时间（向下取整到最近的interval）
    const firstMarkTime = Math.floor(startTime / interval) * interval;
    // 计算最后一个刻度的时间（向上取整到最近的interval）
    const lastMarkTime = Math.ceil(endTime / interval) * interval;

    // 绘制刻度和标签
    ctx.strokeStyle = "#464646";
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Arial";

    for (let time = firstMarkTime; time <= lastMarkTime; time += interval) {
      const x = timeToPixels(time, scale) + offsetX;

      if (x < -50 || x > canvas.width + 50) continue;

      const isMajor = time % majorInterval === 0;
      const isMiddle = time % (interval * 2) === 0;

      ctx.beginPath();
      if (isMajor) {
        ctx.moveTo(x, canvas.height - 40);
        ctx.lineTo(x, canvas.height - 20);
        ctx.stroke();

        const timeText = formatTime(time);
        const textWidth = ctx.measureText(timeText).width;
        ctx.fillText(timeText, x - textWidth / 2, canvas.height - 5);
      } else if (isMiddle) {
        ctx.moveTo(x, canvas.height - 35);
        ctx.lineTo(x, canvas.height - 20);
        ctx.stroke();
      } else {
        ctx.moveTo(x, canvas.height - 30);
        ctx.lineTo(x, canvas.height - 20);
        ctx.stroke();
      }
    }

    // 绘制视频片段
    // sampleClips.forEach((clip) => {
    //   ctx.fillStyle = clip.color;
    //   ctx.fillRect(
    //     timeToPixels(clip.startTime, scale) + offsetX,
    //     20,
    //     timeToPixels(clip.duration, scale),
    //     40
    //   );
    // });
  }, [
    scale,
    offsetX,
    basePixelsPerSecond,
    timeToPixels,
    pixelsToTime,
    getVisibleDuration,
  ]);

  const performZoom = useCallback(
    (newScale: number, mouseX: number) => {
      const timeAtZero = pixelsToTime(-offsetX, scale);
      setScale(newScale);
      setOffsetX(
        constrainOffset(-timeToPixels(timeAtZero, newScale), newScale)
      );
    },
    [scale, offsetX, pixelsToTime, timeToPixels, constrainOffset]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const newScale =
        e.deltaY < 0
          ? Math.min(scale * wheelZoomRatio, maxScale)
          : Math.max(scale / wheelZoomRatio, minScale);

      if (newScale !== scale) {
        performZoom(newScale, (e as any).offsetX);
      }
    },
    [scale, minScale, maxScale, wheelZoomRatio, performZoom]
  );

  const startDragging = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX, scrollX: offsetX });
    },
    [offsetX]
  );

  const drag = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - dragStart.x;
      setOffsetX(constrainOffset(dragStart.scrollX + dx, scale));
    },
    [isDragging, dragStart, scale, constrainOffset]
  );

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResize = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    canvasRef.current.width = container.clientWidth;
    canvasRef.current.height = container.clientHeight;

    const newScale = calculateInitialScale();
    setScale(newScale);
    setMinScale(newScale);
  }, [calculateInitialScale]);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  useEffect(() => {
    if (!canvasRef.current) return;

    canvasRef.current.addEventListener("wheel", handleWheel);

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener("wheel", handleWheel);
      }
    };
  }, [handleWheel]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <>
      <div className="controls">
        <button
          onClick={() =>
            performZoom(
              Math.min(scale * buttonZoomRatio, maxScale),
              canvasRef.current?.width ?? 0 / 2
            )
          }
          disabled={scale >= maxScale}
        >
          放大
        </button>
        <button
          onClick={() =>
            performZoom(
              Math.max(scale / buttonZoomRatio, minScale),
              canvasRef.current?.width ?? 0 / 2
            )
          }
          disabled={scale <= minScale}
        >
          缩小
        </button>
        <span>缩放比例: {Math.round(scale * 100)}%</span>
        <span>
          刻度间隔:{" "}
          {formatInterval(getTimeInterval(scale, basePixelsPerSecond))}
        </span>
      </div>
      <div className="timeline-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDragging}
          onMouseMove={drag}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        />

      </div>
    </>
  );
};

export default Timeline;

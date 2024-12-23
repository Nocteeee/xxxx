import React, { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import "../../styles/Timeline.css";
import { TextClip } from "../clips/TextClip";
import { AudioClip } from "../clips/AudioClip";
import {
  SCALE_HEIGHT,
  MIN_SCALE,
  DEFAULT_TRACK_HEIGHT,
  TRACK_GAP,
  SNAP_THRESHOLD,
} from "../../constants";
import {
  TimelineProps,
  TimelineDimensions,
  TimelineState,
  ClipCollision,
  TrackType,
} from "../../types";
import {
  detectClipCollisions,
  findValidClipPosition,
} from "../../utils/clipUtils";
import { drawTimeScale } from "../../utils/timelineUtils";
import { ImageClip } from "../clips/ImageClip";
import { VideoClip } from "../clips/VideoClip";
import { Track } from "../Track";
import { formatTime, getMajorInterval, getTimeInterval } from "./utils";

const clipComponents = {
  text: TextClip,
  audio: AudioClip,
  image: ImageClip,
  video: VideoClip,
};

const defaultProps = {
  initialDuration: 7200, // 2小时
  basePixelsPerSecond: 50,
  maxScale: 5,
  wheelZoomRatio: 1.1,
  buttonZoomRatio: 1.2
};

export const Timeline: React.FC<TimelineProps> = (props) => {

  const {
    initialDuration,
    basePixelsPerSecond,
    maxScale,
    wheelZoomRatio,
    buttonZoomRatio
  } = { ...defaultProps, ...props };

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const timelineCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragClipRef = useRef<string | null>(null);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  const [dimensions, setDimensions] = useState<TimelineDimensions>({
    width: 0,
    height: 0,
  });

  const [state, setState] = useState<TimelineState>({
    tracks: [{ id: "1", name: "轨道1", locked: false, type: "video", height: 100 }, { id: "2", name: "轨道2", locked: false, type: "video", height: 100 }],
    clips: [{ id: "1", trackId: "1", type: "video", startTime: 0, duration: 100, src: "", thumbnails: [], volume: 1, name: "视频1", height: 100 }],
    selectedTrackId: null,
    selectedClipId: null,
    dragState: {
      type: null,
      id: null,
      startPosition: null,
      currentPosition: null,
    },
    resizeState: {
      clipId: null,
      handle: null,
      startTime: 0,
      startDuration: 0,
    },
  });

  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState<number>(1);
  const [offsetX, setOffsetX] = useState(0);
  const [clipCollisions, setClipCollisions] = useState<{
    [clipId: string]: ClipCollision[];
  }>({});
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; scrollX: number }>({ x: 0, scrollX: 0 });

  const pixelsToTime = useCallback((pixels: number, currentScale: number) => {
    return pixels / (basePixelsPerSecond * currentScale);
  }, [basePixelsPerSecond]);

  const timeToPixels = useCallback((time: number, currentScale: number) => {
    return time * basePixelsPerSecond * currentScale;
  }, [basePixelsPerSecond]);

  // 添加持续时间状态
  const [duration, setDuration] = useState(initialDuration);
  const [visibleTimeRange, setVisibleTimeRange] = useState({
    start: 0,
    end: initialDuration,
  });

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


  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    ctx.fillStyle = '#1a1a1a';
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
    ctx.strokeStyle = '#464646';
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';

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
  }, [scale, offsetX, basePixelsPerSecond, timeToPixels, pixelsToTime]);

  const constrainOffset = useCallback((offset: number, currentScale: number) => {
    if (!canvasRef.current) return offset;
    const minOffset = -initialDuration * basePixelsPerSecond * currentScale + canvasRef.current.width;
    return Math.min(0, Math.max(minOffset, offset));
  }, [initialDuration, basePixelsPerSecond]);

  const performZoom = useCallback((newScale: number, mouseX: number) => {
    const timeAtZero = pixelsToTime(-offsetX, scale);
    setScale(newScale);
    setOffsetX(constrainOffset(-timeToPixels(timeAtZero, newScale), newScale));
  }, [scale, offsetX, pixelsToTime, timeToPixels, constrainOffset]);

  // const handleWheel = useCallback((e: WheelEvent) => {
  //   e.preventDefault();

  //   const newScale = e.deltaY < 0
  //     ? Math.min(scale * wheelZoomRatio, maxScale)
  //     : Math.max(scale / wheelZoomRatio, minScale);

  //   if (newScale !== scale) {
  //     performZoom(newScale, (e as any).offsetX);
  //   }
  // }, [scale, minScale, maxScale, wheelZoomRatio, performZoom]);

  // 计算可见区域
  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;

    const visibleWidth = containerRef.current.clientWidth;
    const startTime = -offsetX / (basePixelsPerSecond * scale);
    const endTime = (visibleWidth - offsetX) / (basePixelsPerSecond * scale);

    setVisibleTimeRange({
      start: Math.max(0, startTime),
      end: Math.min(duration, endTime),
    });
  }, [offsetX, scale, basePixelsPerSecond, duration]);

  // 监听可视区域变化
  useEffect(() => {
    calculateVisibleRange();
  }, [calculateVisibleRange, dimensions.width]);

  // 自动调整持续时间
  const updateDuration = useCallback(() => {
    const maxClipEnd = Math.max(
      duration,
      ...state.clips.map((clip) => clip.startTime + clip.duration)
    );
    setDuration(Math.max(initialDuration, maxClipEnd));
  }, [state.clips, initialDuration, duration]);




  // 修改时间刻度绘制函数，添加持续时间支持
  const drawTimeline = useCallback(() => {
    const canvas = timelineCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 清除画布
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#232323';
    ctx.fillRect(0, 0, width, height);

    const pixelsPerSecond = basePixelsPerSecond * scale;
    const secondsPerMajorTick = Math.pow(2, Math.floor(Math.log2(100 / pixelsPerSecond)));
    const pixelsPerMajorTick = secondsPerMajorTick * pixelsPerSecond;

    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '10px Arial';
    ctx.fillStyle = '#fff';

    const startTime = Math.floor(-offsetX / pixelsPerSecond);
    const endTime = Math.min(
      Math.ceil((width - offsetX) / pixelsPerSecond),
      duration
    );

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
        const minorX = x + (pixelsPerMajorTick * i / 4);
        if (minorX < width) {
          ctx.moveTo(minorX, height - 5);
          ctx.lineTo(minorX, height);
        }
      }
    }

    // 绘制持续时间标记
    const durationX = duration * pixelsPerSecond + offsetX;
    if (durationX >= 0 && durationX <= width) {
      ctx.beginPath();
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 2;
      ctx.moveTo(durationX, 0);
      ctx.lineTo(durationX, height);
      ctx.stroke();
    }

    ctx.stroke();
  }, [offsetX, scale, basePixelsPerSecond, duration, dimensions.width]);

  useEffect(() => {
    updateDuration();
  }, [updateDuration]);

  // 更新尺寸
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // 绘制时间刻度
  useEffect(() => {
    const canvas = timelineCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawTimeScale(
      ctx,
      dimensions.width,
      SCALE_HEIGHT,
      offsetX,
      scale,
      basePixelsPerSecond
    );
  }, [dimensions, offsetX, scale, basePixelsPerSecond]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();

    const newScale = e.deltaY < 0
      ? Math.min(scale * wheelZoomRatio, maxScale)
      : Math.max(scale / wheelZoomRatio, minScale);

    if (newScale !== scale) {
      performZoom(newScale, (e as any).offsetX);
    }
  }, [scale, minScale, maxScale, wheelZoomRatio, performZoom]);

  const startDragging = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, scrollX: offsetX });
  }, [offsetX]);

  const drag = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStart.x;
    setOffsetX(constrainOffset(dragStart.scrollX + dx, scale));
  }, [isDragging, dragStart, scale, constrainOffset]);

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
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  useEffect(() => {
    if (!canvasRef.current) return;

    canvasRef.current.addEventListener('wheel', handleWheel);

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, [handleWheel]);

  useEffect(() => {
    draw();
  }, [draw]);


  // 处理鼠标事件
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 1) return; // 只响应中键
    setIsDragging(true);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !lastMousePosRef.current) return;

      const dx = e.clientX - lastMousePosRef.current.x;
      setOffsetX((prev) => prev + dx);
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    lastMousePosRef.current = null;
  }, []);

  // 片段事件处理
  const handleClipDragStart = (clipId: string) => {
    dragClipRef.current = clipId;
    setState((prev) => ({
      ...prev,
      selectedClipId: clipId,
      dragState: {
        type: "clip",
        id: clipId,
        startPosition: { x: offsetX, y: 0 },
        currentPosition: { x: offsetX, y: 0 },
      },
    }));
  };

  // 修改片段操作处理函数，添加持续时间限制
  const handleClipDragMove = (clipId: string, newX: number, newY: number) => {
    if (!dragClipRef.current) return;

    const clip = state.clips.find(c => c.id === clipId);
    if (!clip) return;

    // 计算目标轨道
    const trackY = Math.max(0, Math.min(
      Math.floor((newY - SCALE_HEIGHT) / (DEFAULT_TRACK_HEIGHT + TRACK_GAP)),
      state.tracks.length - 1
    ));
    const targetTrack = state.tracks[trackY];

    // 计算新的开始时间
    const proposedStartTime = (newX - offsetX) / (basePixelsPerSecond * scale);

    // 确保片段不会超出时间线范围
    const clampedStartTime = Math.max(0, proposedStartTime);
    const clampedEndTime = Math.min(
      clampedStartTime + clip.duration,
      duration
    );
    const finalStartTime = clampedEndTime - clip.duration;

    // 获取当前轨道上的其他片段
    const trackClips = state.clips.filter(c =>
      c.trackId === targetTrack.id && c.id !== clipId
    );

    // 检测碰撞
    const collisions = detectClipCollisions(
      clip,
      trackClips,
      finalStartTime,
      SNAP_THRESHOLD / (basePixelsPerSecond * scale)
    );

    setClipCollisions(prev => ({
      ...prev,
      [clipId]: collisions
    }));

    // 找到有效位置
    const validStartTime = findValidClipPosition(
      clip,
      trackClips,
      finalStartTime,
      SNAP_THRESHOLD / (basePixelsPerSecond * scale)
    );

    // 更新片段位置
    setState(prev => ({
      ...prev,
      clips: prev.clips.map(c =>
        c.id === clipId
          ? { ...c, startTime: validStartTime, trackId: targetTrack.id }
          : c
      )
    }));

    // 更新持续时间
    updateDuration();
  };

  const handleClipDragEnd = (clipId: string) => {
    dragClipRef.current = null;
    setClipCollisions((prev) => {
      const newState = { ...prev };
      delete newState[clipId];
      return newState;
    });
    setState((prev) => ({
      ...prev,
      dragState: {
        type: null,
        id: null,
        startPosition: null,
        currentPosition: null,
      },
    }));
  };

  // 修改片段调整大小处理函数，添加持续时间限制
  const handleClipResize = (
    clipId: string,
    newDuration: number,
    newStartTime: number
  ) => {
    const clip = state.clips.find(c => c.id === clipId);
    if (!clip) return;

    // 确保调整后的片段不会超出时间线范围
    const clampedStartTime = Math.max(0, newStartTime);
    const clampedEndTime = Math.min(
      clampedStartTime + newDuration,
      duration
    );
    const finalDuration = clampedEndTime - clampedStartTime;

    const trackClips = state.clips.filter(c =>
      c.trackId === clip.trackId && c.id !== clipId
    );

    const collisions = detectClipCollisions(
      { ...clip, startTime: clampedStartTime, duration: finalDuration },
      trackClips,
      clampedStartTime,
      SNAP_THRESHOLD / (basePixelsPerSecond * scale)
    );

    if (collisions.some(c => c.type === 'overlap')) return;

    setState(prev => ({
      ...prev,
      clips: prev.clips.map(c =>
        c.id === clipId
          ? { ...c, startTime: clampedStartTime, duration: finalDuration }
          : c
      )
    }));

    // 更新持续时间
    updateDuration();
  };

  // 渲染轨道和片段
  const renderTracks = () => {
    return state.tracks.map((track, index) => {
      const trackClips = state.clips.filter(
        (clip) => clip.trackId === track.id
      );

      return (
        <Track
          key={track.id}
          track={track}
          width={dimensions.width}
          height={DEFAULT_TRACK_HEIGHT}
          index={index}
          selected={state.selectedTrackId === track.id}
          dragEnabled={!track.locked}
          onSelect={() =>
            setState((prev) => ({ ...prev, selectedTrackId: track.id }))
          }
          onDragStart={() => { }}
          onDragMove={() => { }}
          onDragEnd={() => { }}
          clips={trackClips}
          scale={scale}
          offsetX={offsetX}
          basePixelsPerSecond={basePixelsPerSecond}
          snapGuides={[]}
          snapThreshold={SNAP_THRESHOLD}
          clipCollisions={clipCollisions}
        >
          {trackClips.map((clip) => {
            const ClipComponent = clipComponents[clip.type as TrackType];
            return (
              <ClipComponent
                key={clip.id}
                clip={clip}
                scale={scale}
                offsetX={offsetX}
                basePixelsPerSecond={basePixelsPerSecond}
                selected={state.selectedClipId === clip.id}
                dragEnabled={!track.locked}
                collisions={clipCollisions[clip.id] || []}
                snapGuides={[]}
                snapThreshold={SNAP_THRESHOLD}
                onSelect={(clipId) =>
                  setState((prev) => ({
                    ...prev,
                    selectedClipId: clipId,
                  }))
                }
                onDragStart={handleClipDragStart}
                onDragMove={handleClipDragMove}
                onDragEnd={handleClipDragEnd}
                onResizeStart={(clipId, handle) => { }}
                onResize={handleClipResize}
                onResizeEnd={() => { }}
              />
            );
          })}
        </Track>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="timeline-container"
      // onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={timelineCanvasRef}
        width={dimensions.width}
        height={SCALE_HEIGHT}
        className="timeline-scale"
      />

      {/* <div className="timeline-track-container">
        <Stage
          width={dimensions.width}
          height={dimensions.height - SCALE_HEIGHT - 40}
        >
          <Layer>{renderTracks()}</Layer>
        </Stage>
      </div>

      <div className="timeline-controls">
        <button
          onClick={() =>
            setScale((prev) => Math.min(prev * buttonZoomRatio, maxScale))
          }
          disabled={scale >= maxScale}
        >
          放大
        </button>
        <button
          onClick={() =>
            setScale((prev) => Math.max(prev / buttonZoomRatio, MIN_SCALE))
          }
          disabled={scale <= MIN_SCALE}
        >
          缩小
        </button>
        <span>缩放: {Math.round(scale * 100)}%</span>
      </div> */}
    </div>
  );
};

export default Timeline;

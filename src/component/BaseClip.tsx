// src/components/BaseClip.tsx
import React, { useRef, useState } from "react";
import { Group, Rect, Line } from "react-konva";
import { ClipProps } from "../types";
import { MIN_CLIP_WIDTH } from "../constants";

export const BaseClip: React.FC<
  ClipProps & { children?: React.ReactNode; color: string }
> = ({
  clip,
  scale,
  offsetX,
  basePixelsPerSecond,
  selected,
  dragEnabled,
  collisions,
  children,
  color,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onResizeStart,
  onResize,
  onResizeEnd,
}) => {
  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null);
  const startPosRef = useRef<{ x: number; time: number }>({ x: 0, time: 0 });

  const clipWidth = Math.max(
    clip.duration * basePixelsPerSecond * scale,
    MIN_CLIP_WIDTH
  );

  const handleResizeStart = (handle: "left" | "right") => (e: any) => {
    e.cancelBubble = true;
    setIsResizing(handle);
    startPosRef.current = {
      x: e.evt.clientX,
      time: clip.startTime,
    };
    onResizeStart(clip.id, handle);
  };

  const handleResizeMove = (e: any) => {
    if (!isResizing) return;

    const dx = e.evt.clientX - startPosRef.current.x;
    const dt = dx / (basePixelsPerSecond * scale);

    if (isResizing === "left") {
      const newStartTime = startPosRef.current.time + dt;
      const newDuration = clip.duration - dt;
      if (newDuration >= MIN_CLIP_WIDTH / (basePixelsPerSecond * scale)) {
        onResize(clip.id, newDuration, newStartTime);
      }
    } else {
      const newDuration = clip.duration + dt;
      if (newDuration >= MIN_CLIP_WIDTH / (basePixelsPerSecond * scale)) {
        onResize(clip.id, newDuration, clip.startTime);
      }
    }
  };

  const handleResizeEnd = () => {
    setIsResizing(null);
    onResizeEnd(clip.id);
  };

  return (
    <Group
      x={clip.startTime * basePixelsPerSecond * scale + offsetX}
      draggable={dragEnabled && !isResizing}
      onDragStart={() => onDragStart(clip.id)}
      onDragMove={(e) => {
        const node = e.target;
        onDragMove(clip.id, node.x(), node.y());
      }}
      onDragEnd={() => onDragEnd(clip.id)}
      onClick={() => onSelect(clip.id)}
    >
      {/* 底层背景 */}
      <Rect
        width={clipWidth}
        height={clip.height}
        fill={color}
        opacity={selected ? 1 : 0.8}
        strokeWidth={selected ? 2 : 1}
        stroke={selected ? "#3498db" : "#666"}
        cornerRadius={2}
      />

      {/* 调整大小的手柄 */}
      <Rect
        x={0}
        y={0}
        width={8}
        height={clip.height}
        fill="transparent"
        onMouseDown={handleResizeStart("left")}
        onMouseMove={handleResizeMove}
        onMouseUp={handleResizeEnd}
        onMouseLeave={handleResizeEnd}
        cursor="ew-resize"
      />
      <Rect
        x={clipWidth - 8}
        y={0}
        width={8}
        height={clip.height}
        fill="transparent"
        onMouseDown={handleResizeStart("right")}
        onMouseMove={handleResizeMove}
        onMouseUp={handleResizeEnd}
        onMouseLeave={handleResizeEnd}
        cursor="ew-resize"
      />

      {/* 碰撞警告 */}
      {collisions.some((c) => c.type === "overlap") && (
        <Rect
          width={clipWidth}
          height={clip.height}
          stroke="#e74c3c"
          strokeWidth={2}
          dash={[5, 5]}
        />
      )}

      {/* 片段内容 */}
      {children}
    </Group>
  );
};

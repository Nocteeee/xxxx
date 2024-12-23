// tracks/BaseTrack.tsx
import React, { useState } from "react";
import { Group, Rect, Text, Line } from "react-konva";
import { TrackProps, SnapGuide } from "../../types";
// import { findNearestSnap } from "../utils/snapUtils";

export const BaseTrack: React.FC<TrackProps> = ({
  track,
  clips,
  scale,
  offsetX,
  basePixelsPerSecond,
  width,
  height,
  index,
  selected,
  dragEnabled,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  snapGuides,
  snapThreshold,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragGuide, setDragGuide] = useState<SnapGuide | null>(null);

  return (
    <Group
      draggable={dragEnabled}
      onDragStart={() => {
        setIsDragging(true);
        onDragStart();
      }}
      onDragMove={(e) => {
        onDragMove(e.target.y());
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
    >
      {/* 拖拽时的视觉反馈 */}
      {isDragging && (
        <Rect
          width={width}
          height={height}
          fill="rgba(52, 152, 219, 0.2)"
          stroke="#3498db"
          strokeWidth={1}
        />
      )}

      {/* 轨道背景 */}
      <Rect
        width={width}
        height={height}
        fill={selected ? "#2a2a2a" : "#232323"}
        onClick={onSelect}
      />

      {/* 轨道内容 */}
      {children}

      {/* 对齐指示线 */}
      {dragGuide && (
        <Line
          points={[
            dragGuide.time * basePixelsPerSecond * scale + offsetX,
            0,
            dragGuide.time * basePixelsPerSecond * scale + offsetX,
            height,
          ]}
          stroke="#3498db"
          strokeWidth={1}
          dash={[5, 5]}
        />
      )}
    </Group>
  );
};

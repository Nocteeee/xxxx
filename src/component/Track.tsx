// src/components/Track.tsx
import React from "react";
import { Group, Rect, Text } from "react-konva";
import { TrackProps } from "../types";
import { COLORS } from "../constants";

export const Track: React.FC<TrackProps> = ({
  track,
  width,
  height,
  selected,
  dragEnabled,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  children,
}) => {
  return (
    <Group
      draggable={dragEnabled}
      onDragStart={onDragStart}
      onDragMove={(e) => onDragMove(e.target.y())}
      onDragEnd={onDragEnd}
    >
      {/* 轨道背景 */}
      <Rect
        width={width}
        height={height}
        fill={
          selected ? COLORS.trackBackgroundSelected : COLORS.trackBackground
        }
        onClick={onSelect}
      />

      {/* 轨道名称 */}
      <Text
        text={track.name}
        fill="#fff"
        fontSize={12}
        padding={8}
        width={100}
        height={height}
        verticalAlign="middle"
      />

      {/* 轨道内容 */}
      <Group x={100}>{children}</Group>

      {/* 锁定状态指示 */}
      {track.locked && (
        <Rect
          width={width}
          height={height}
          fill="rgba(0,0,0,0.3)"
          opacity={0.5}
        />
      )}
    </Group>
  );
};

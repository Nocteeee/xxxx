// tracks/TextTrack.tsx
import React from "react";
import { Group, Rect, Text } from "react-konva";
import { BaseTrack } from "./BaseTrack";
import { TrackProps, TextClip } from "../../types";

export const TextTrack: React.FC<TrackProps> = (props) => {
  const { clips, scale, offsetX, basePixelsPerSecond } = props;

  return (
    <BaseTrack {...props}>
      {clips.map((clip) => {
        const textClip = clip as TextClip;
        const clipX = clip.startTime * basePixelsPerSecond * scale + offsetX;
        const clipWidth = clip.duration * basePixelsPerSecond * scale;

        return (
          <Group key={clip.id} x={clipX} draggable={!props.track.locked}>
            <Rect
              width={clipWidth}
              height={props.track.height - 4}
              y={2}
              fill="#3498db"
              cornerRadius={2}
            />
            <Text
              text={textClip.content}
              fontSize={textClip.fontSize || 14}
              fill={textClip.color || "#fff"}
              padding={8}
              width={clipWidth}
              height={props.track.height - 4}
            />
          </Group>
        );
      })}
    </BaseTrack>
  );
};

// tracks/ImageTrack.tsx
import React from "react";
import { Group, Rect, Image } from "react-konva";
import { BaseTrack } from "./BaseTrack";
import { TrackProps, ImageClip } from "../../types";

export const ImageTrack: React.FC<TrackProps> = (props) => {
  const { clips, scale, offsetX, basePixelsPerSecond } = props;

  return (
    <BaseTrack {...props}>
      {clips.map((clip) => {
        const imageClip = clip as ImageClip;
        const clipX = clip.startTime * basePixelsPerSecond * scale + offsetX;
        const clipWidth = clip.duration * basePixelsPerSecond * scale;

        return (
          <Group key={clip.id} x={clipX} draggable={!props.track.locked}>
            <Rect
              width={clipWidth}
              height={props.track.height - 4}
              y={2}
              fill="#e74c3c"
              cornerRadius={2}
            />
            {/* 图片预览 */}
            <Image
              image={new window.Image()}
              width={clipWidth - 4}
              height={props.track.height - 8}
              x={2}
              y={4}
            />
          </Group>
        );
      })}
    </BaseTrack>
  );
};

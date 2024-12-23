import React from "react";
import { Group, Rect, Image } from "react-konva";
import { BaseTrack } from "./BaseTrack";
import { TrackProps, VideoClip } from "../../types";

export const VideoTrack: React.FC<TrackProps> = (props) => {
  const { clips, scale, offsetX, basePixelsPerSecond } = props;

  return (
    <BaseTrack {...props}>
      {clips.map((clip) => {
        const videoClip = clip as VideoClip;
        const clipX = clip.startTime * basePixelsPerSecond * scale + offsetX;
        const clipWidth = clip.duration * basePixelsPerSecond * scale;

        return (
          <Group key={clip.id} x={clipX} draggable={!props.track.locked}>
            <Rect
              width={clipWidth}
              height={props.track.height - 4}
              y={2}
              fill="#9b59b6"
              cornerRadius={2}
            />
            {/* 视频帧预览 */}
            {videoClip.thumbnails.map((thumbnail, index) => {
              const thumbWidth = clipWidth / videoClip.thumbnails.length;
              return (
                <Image
                  key={index}
                  image={new window.Image()}
                  width={thumbWidth - 2}
                  height={props.track.height - 8}
                  x={index * thumbWidth + 1}
                  y={4}
                />
              );
            })}
          </Group>
        );
      })}
    </BaseTrack>
  );
};

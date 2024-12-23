// tracks/AudioTrack.tsx
import React from "react";
import { Group, Rect, Line } from "react-konva";
import { BaseTrack } from "./BaseTrack";
import { TrackProps, AudioClip } from "../../types";

export const AudioTrack: React.FC<TrackProps> = (props) => {
  const { clips, scale, offsetX, basePixelsPerSecond } = props;

  return (
    <BaseTrack {...props}>
      {clips.map((clip) => {
        const audioClip = clip as AudioClip;
        const clipX = clip.startTime * basePixelsPerSecond * scale + offsetX;
        const clipWidth = clip.duration * basePixelsPerSecond * scale;

        return (
          <Group key={clip.id} x={clipX} draggable={!props.track.locked}>
            <Rect
              width={clipWidth}
              height={props.track.height - 4}
              y={2}
              fill="#2ecc71"
              cornerRadius={2}
            />
            {/* 音频波形 */}
            <Line
              points={audioClip.waveformData.flatMap((v, i) => [
                (i / audioClip.waveformData.length) * clipWidth,
                props.track.height / 2 + v * (props.track.height / 4),
              ])}
              stroke="#fff"
              strokeWidth={1}
            />
          </Group>
        );
      })}
    </BaseTrack>
  );
};

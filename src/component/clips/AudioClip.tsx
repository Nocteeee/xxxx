import React from "react";
import { Line, Group } from "react-konva";
import { BaseClip } from "../BaseClip";
import { ClipProps, AudioClip as AudioClipType } from "../../types";

export const AudioClip: React.FC<ClipProps> = (props) => {
  const clip = props.clip as AudioClipType;
  const clipWidth = Math.max(
    clip.duration * props.basePixelsPerSecond * props.scale,
    10
  );

  const waveformPoints = React.useMemo(() => {
    return clip.waveformData.flatMap((value, index) => {
      const x = (index / clip.waveformData.length) * clipWidth;
      const centerY = clip.height / 2;
      const amplitude = value * (clip.height / 2 - 4);
      return [x, centerY - amplitude, x, centerY + amplitude];
    });
  }, [clip.waveformData, clipWidth, clip.height]);

  return (
    <BaseClip {...props} color="#2ecc71">
      <Group
        clipX={4}
        clipY={4}
        clipWidth={clipWidth - 8}
        clipHeight={clip.height - 8}
      >
        <Line
          points={waveformPoints}
          stroke="#fff"
          strokeWidth={1}
          opacity={0.8}
        />
      </Group>
    </BaseClip>
  );
};

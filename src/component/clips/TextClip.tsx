import React from "react";
import { Text } from "react-konva";
import { BaseClip } from "../BaseClip";
import { ClipProps, TextClip as TextClipType } from "../../types";

export const TextClip: React.FC<ClipProps> = (props) => {
  const clip = props.clip as TextClipType;
  const clipWidth = Math.max(
    clip.duration * props.basePixelsPerSecond * props.scale,
    10
  );

  return (
    <BaseClip {...props} color="#3498db">
      <Text
        text={clip.content}
        fontSize={clip.fontSize || 14}
        fill={clip.color || "#fff"}
        padding={8}
        width={clipWidth - 16}
        height={clip.height - 16}
        align={clip.alignment || "left"}
        verticalAlign="middle"
        fontFamily={clip.fontFamily || "Arial"}
        ellipsis
      />
    </BaseClip>
  );
};

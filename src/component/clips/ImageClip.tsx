import React, { useState, useEffect } from "react";
import { Image } from "react-konva";
import { BaseClip } from "../BaseClip";
import { ClipProps, ImageClip as ImageClipType } from "../../types";

export const ImageClip: React.FC<ClipProps> = (props) => {
  const clip = props.clip as ImageClipType;
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = clip.src;
    img.onload = () => setImage(img);
    return () => {
      img.onload = null;
    };
  }, [clip.src]);

  return (
    <BaseClip {...props} color="#e67e22">
      {image && (
        <Image
          image={image}
          x={4}
          y={4}
          width={
            Math.max(
              clip.duration * props.basePixelsPerSecond * props.scale,
              10
            ) - 8
          }
          height={clip.height - 8}
          opacity={clip.opacity || 1}
        />
      )}
    </BaseClip>
  );
};

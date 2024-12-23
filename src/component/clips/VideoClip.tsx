import React, { useState, useEffect } from "react";
import { Group, Image } from "react-konva";
import { BaseClip } from "../BaseClip";
import { ClipProps, VideoClip as VideoClipType } from "../../types";

export const VideoClip: React.FC<ClipProps> = (props) => {
  const clip = props.clip as VideoClipType;
  const [thumbnails, setThumbnails] = useState<(HTMLImageElement | null)[]>([]);

  const clipWidth = Math.max(
    clip.duration * props.basePixelsPerSecond * props.scale,
    10
  );

  useEffect(() => {
    const loadThumbnails = async () => {
      const images = await Promise.all(
        clip.thumbnails.map((src) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new window.Image();
            img.src = src;
            img.onload = () => resolve(img);
            img.onerror = reject;
          }).catch(() => null)
        )
      );
      setThumbnails(images);
    };

    loadThumbnails();
  }, [clip.thumbnails]);

  return (
    <BaseClip {...props} color="#9b59b6">
      <Group
        clipX={4}
        clipY={4}
        clipWidth={clipWidth - 8}
        clipHeight={clip.height - 8}
      >
        {thumbnails.map((img, index) => {
          if (!img) return null;
          const segmentWidth = (clipWidth - 8) / thumbnails.length;
          return (
            <Image
              key={index}
              image={img}
              x={index * segmentWidth}
              width={segmentWidth}
              height={clip.height - 8}
            />
          );
        })}
      </Group>
    </BaseClip>
  );
};

// src/types.ts
export interface TimelineProps {
  initialDuration: number;
  basePixelsPerSecond: number;
  maxScale: number;
  wheelZoomRatio: number;
  buttonZoomRatio: number;
}

export type TrackType = "text" | "audio" | "image" | "video";

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  height: number;
  locked?: boolean;
  visible?: boolean;
  color?: string;
}

export interface BaseClip {
  id: string;
  trackId: string;
  startTime: number;
  duration: number;
  name: string;
  height: number;
}

export interface TextClip extends BaseClip {
  type: "text";
  content: string;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  alignment?: "left" | "center" | "right";
}

export interface AudioClip extends BaseClip {
  type: "audio";
  waveformData: number[];
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
}

export interface ImageClip extends BaseClip {
  type: "image";
  src: string;
  fit?: "contain" | "cover" | "fill";
  opacity?: number;
  filter?: string;
}

export interface VideoClip extends BaseClip {
  type: "video";
  src: string;
  thumbnails: string[];
  volume: number;
  speed?: number;
  trim?: { start: number; end: number };
}

export type Clip = TextClip | AudioClip | ImageClip | VideoClip;

export interface ClipCollision {
  clipId: string;
  type: "overlap" | "adjacent";
  position: "before" | "after";
  time: number;
}

export interface SnapGuide {
  time: number;
  type: "start" | "end" | "clip";
  clipId?: string;
}

export interface ClipProps {
  clip: Clip;
  scale: number;
  offsetX: number;
  basePixelsPerSecond: number;
  selected: boolean;
  dragEnabled?: boolean;
  collisions: ClipCollision[];
  snapGuides: SnapGuide[];
  snapThreshold: number;
  onSelect: (clipId: string) => void;
  onDragStart: (clipId: string) => void;
  onDragMove: (clipId: string, newX: number, newY: number) => void;
  onDragEnd: (clipId: string) => void;
  onResizeStart: (clipId: string, handle: "left" | "right") => void;
  onResize: (clipId: string, newDuration: number, newStartTime: number) => void;
  onResizeEnd: (clipId: string) => void;
}

export interface TrackProps {
  track: Track;
  clips: Clip[];
  scale: number;
  offsetX: number;
  basePixelsPerSecond: number;
  width: number;
  height: number;
  index: number;
  selected: boolean;
  dragEnabled: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragMove: (newY: number) => void;
  onDragEnd: () => void;
  snapGuides: SnapGuide[];
  snapThreshold: number;
  clipCollisions: { [clipId: string]: ClipCollision[] };
  children?: React.ReactNode;
}

export interface TimelineState {
  tracks: Track[];
  clips: Clip[];
  selectedTrackId: string | null;
  selectedClipId: string | null;
  dragState: {
    type: "track" | "clip" | null;
    id: string | null;
    startPosition: { x: number; y: number } | null;
    currentPosition: { x: number; y: number } | null;
  };
  resizeState: {
    clipId: string | null;
    handle: "left" | "right" | null;
    startTime: number;
    startDuration: number;
  };
}

export interface TimelineDimensions {
  width: number;
  height: number;
}

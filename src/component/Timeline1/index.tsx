import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { drawTimeLine, getSelectFrame } from "../../utils/canvasUtil";
import styles from "./index.module.less";

interface TimeLineProps {
  start?: number;
  step?: number;
  scale?: number;
  focusPosition?: { start: number; end: number; frameCount: number };
  onSelectFrame: (frameIndex: number) => void;
}

const TimeLine: React.FC<TimeLineProps> = (props) => {
  const {
    start = 0,
    step = 30,
    scale = 0,
    focusPosition = { start: 0, end: 0, frameCount: 0 },
  } = props;
  const canvasContainer = useRef<HTMLDivElement>(null);
  const timeLine = useRef<HTMLCanvasElement>(null);
  const [canvasContext, setCanvasContext] =
    useState<CanvasRenderingContext2D | null>(null);
  const [canvasAttr, setCanvasAttr] = useState({ width: 0, height: 0 });

  const canvasConfigs = useMemo(
    () => ({
      bgColor: "#E5E7EB",
      ratio: window.devicePixelRatio || 1,
      textSize: 12,
      textScale: 0.83,
      lineWidth: 1,
      textBaseline: "middle" as CanvasTextBaseline,
      textAlign: "center" as CanvasTextAlign,
      longColor: "#374151",
      shortColor: "#6B7280",
      textColor: "#374151",
      subTextColor: "#6B7280",
      focusColor: "#C4B5FD",
    }),
    []
  );

  const canvasStyle = {
    width: `${canvasAttr.width / canvasConfigs.ratio}px`,
    height: `${canvasAttr.height / canvasConfigs.ratio}px`,
  };

  const updateTimeLine = useCallback(() => {
    if (canvasContext) {
      drawTimeLine(
        canvasContext,
        { start, step, scale, focusPosition },
        {
          ...canvasAttr,
          ...canvasConfigs,
          lineColor: "",
        }
      );
    }
  }, [
    canvasContext,
    start,
    step,
    scale,
    focusPosition,
    canvasAttr,
    canvasConfigs,
  ]);

  const setCanvasContextFunc = useCallback(() => {
    if (timeLine.current) {
      const context = timeLine.current.getContext("2d");
      if (context) {
        // context.font = `${
        //   canvasConfigs.textSize * canvasConfigs.ratio
        // }px -apple-system, ".SFNSText-Regular", "SF UI Text", "PingFang SC", "Hiragino Sans GB", "Helvetica Neue", "WenQuanYi Zen Hei", "Microsoft YaHei", Arial, sans-serif`;
        context.lineWidth = canvasConfigs.lineWidth;
        context.textBaseline = canvasConfigs.textBaseline;
        context.textAlign = canvasConfigs.textAlign;
        setCanvasContext(context);
      }
    }
  }, [canvasConfigs]);

  const setCanvasRect = useCallback(() => {
    if (canvasContainer.current) {
      const { width, height } = canvasContainer.current.getBoundingClientRect();

      setCanvasAttr({
        width: width * canvasConfigs.ratio,
        height: height * canvasConfigs.ratio,
      });
      setCanvasContextFunc();
      updateTimeLine();
    }
  }, [canvasConfigs.ratio, setCanvasContextFunc, updateTimeLine]);

  useEffect(() => {
    setCanvasRect();
    window.addEventListener("resize", setCanvasRect);
    return () => {
      window.removeEventListener("resize", setCanvasRect);
    };
  }, []);

  useEffect(() => {
    updateTimeLine();
  }, [updateTimeLine]);

  return (
    <div
      ref={canvasContainer}
      className={styles.timeline}
      style={{ height: 25 }}
    >
      <canvas
        style={canvasStyle}
        width={canvasAttr.width}
        height={canvasAttr.height}
        ref={timeLine}
        // onClick={handleClick}
      />
    </div>
  );
};

export default TimeLine;

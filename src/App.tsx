import Timeline from "./component/TimeLine";

const App: React.FC = () => {
  return (
    <Timeline
      initialDuration={7200}
      basePixelsPerSecond={50}
      maxScale={5}
      wheelZoomRatio={1.1}
      buttonZoomRatio={1.2}
    />
  );
};

export default App;

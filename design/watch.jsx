/**
 * Watch device — bracelet chrome + screen carousel + side button + scenarios
 */

const { useState, useEffect, useRef, useCallback } = React;

const SCREEN_NAMES = ['SPARK', 'CLOCK', 'STEPS', 'TOUCH'];

function WatchDevice({
  sparkState = 'calm',
  initialScreen = 0,
  silent = false,
  sos = false,
  parentTouchKey = 0,
  goalKey = 0,
  steps = 4280,
  goal = 6000,
  battery = 74,
  onScreenChange,
}) {
  const [screenIdx, setScreenIdx] = useState(initialScreen);
  const [pressed, setPressed] = useState(false);
  const [hasMessage, setHasMessage] = useState(false);
  const [heartPulse, setHeartPulse] = useState(false);
  const [goalFlash, setGoalFlash] = useState(false);
  const [stepsTick, setStepsTick] = useState(false);
  const [sweepKey, setSweepKey] = useState(0);
  const returnRef = useRef(null);

  // SOS forces spark screen with worried state
  const effectiveSpark = sos ? 'worried' : sparkState;

  // Jump directly to a specific screen (used by dot indicators + nav arrows)
  const goTo = useCallback((idx) => {
    const target = ((idx % 4) + 4) % 4;
    setScreenIdx(target);
    setSweepKey((k) => k + 1);
    onScreenChange?.(target);
  }, [onScreenChange]);

  // Cycle screens via side button press
  const cycle = useCallback(() => {
    setPressed(true);
    setTimeout(() => setPressed(false), 180);
    goTo(screenIdx + 1);
  }, [goTo, screenIdx]);

  // Parent touch event: jump to message screen for 2.4s
  useEffect(() => {
    if (parentTouchKey === 0) return;
    if (returnRef.current) clearTimeout(returnRef.current);
    setHasMessage(true);
    setHeartPulse(true);
    setSweepKey((k) => k + 1);
    const prevIdx = screenIdx;
    setScreenIdx(3);
    returnRef.current = setTimeout(() => {
      setHeartPulse(false);
      setScreenIdx(prevIdx);
      setSweepKey((k) => k + 1);
    }, 2400);
    return () => clearTimeout(returnRef.current);
  }, [parentTouchKey]);

  // Goal reached: flash + bump steps tick
  useEffect(() => {
    if (goalKey === 0) return;
    setGoalFlash(true);
    setStepsTick(true);
    const a = setTimeout(() => setGoalFlash(false), 1400);
    const b = setTimeout(() => setStepsTick(false), 1400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [goalKey]);

  // Animate steps number when "active" — increments every 1.5s
  const [animSteps, setAnimSteps] = useState(steps);
  useEffect(() => { setAnimSteps(steps); }, [steps]);
  useEffect(() => {
    if (sparkState !== 'active') return;
    const t = setInterval(() => {
      setAnimSteps((s) => s + Math.floor(3 + Math.random() * 6));
      setStepsTick(true);
      setTimeout(() => setStepsTick(false), 360);
    }, 1800);
    return () => clearInterval(t);
  }, [sparkState]);

  const sparkSize = 260;

  return (
    <div className={`watch-frame ${sos ? 'sos' : ''}`}>
      {/* Outer corner brackets — chip-slot frame */}
      <div className="watch-chip-frame">
        <span className="cf tl"></span>
        <span className="cf tr"></span>
        <span className="cf bl"></span>
        <span className="cf br"></span>
      </div>

      {/* Bracelet straps fading out */}
      <div className="strap strap-top"></div>
      <div className="strap strap-bottom"></div>

      {/* Watch case body */}
      <div className="watch-case">
        {/* Side button */}
        <button
          className={`watch-btn ${pressed ? 'pressed' : ''}`}
          onClick={cycle}
          aria-label="press button"
        >
          <span className="watch-btn-cap"></span>
        </button>
        {/* Tiny status indicators above */}
        <div className="watch-top-strip mono">
          <span className="dot"></span>
          <span>BLE</span>
          <span className="watch-batt">
            <span className="watch-batt-fill" style={{ width: `${battery}%` }}></span>
          </span>
          <span>{battery}%</span>
          {silent && <span className="silent-tag">▮ SILENT</span>}
        </div>

        {/* AMOLED visible circle */}
        <div className="amoled">
          <div className="amoled-vignette"></div>

          {/* SOS overlay (red) */}
          {sos && <div className="sos-overlay">
            <div className="sos-ring"></div>
            <div className="sos-ring sos-ring-2"></div>
            <div className="sos-ring sos-ring-3"></div>
          </div>}

          {/* Goal celebration */}
          {goalFlash && <div className="goal-flash">
            <div className="goal-text pixel">GOAL!</div>
          </div>}

          {/* Carousel */}
          <div
            className="carousel"
            style={{ transform: `translateX(-${screenIdx * 25}%)` }}
          >
            <div className="screen">
              <Spark state={effectiveSpark} size={sparkSize} label={false} frame={false} />
            </div>
            <div className="screen">
              <ClockScreen />
            </div>
            <div className="screen">
              <StepsScreen steps={animSteps} goal={goal} animating={stepsTick} />
            </div>
            <div className="screen">
              {hasMessage
                ? <MessageScreen from="MAMA" time="14:21" pulse={heartPulse} />
                : <MessageEmpty />}
            </div>
          </div>

          {/* Sweep flash on screen change */}
          <div key={sweepKey} className="screen-sweep"></div>

          {/* Silent mode mini icon — only when active */}
          {silent && <div className="silent-mini pixel">▮</div>}

          {/* Screen dot indicators */}
          <div className="screen-dots">
            {SCREEN_NAMES.map((name, i) => (
              <button
                key={i}
                className={`s-dot ${i === screenIdx ? 'active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`go to ${name} screen`}
              ></button>
            ))}
          </div>

          {/* Wake-on-wrist scan line */}
          <div className="wake-scan"></div>
        </div>

        {/* Case label */}
        <div className="watch-bottom-strip mono">
          <span>KAIRO/SPARK</span>
          <span>·</span>
          <span>v0.1</span>
        </div>
      </div>

      {/* Screen label OUTSIDE the watch */}
      <div className="watch-screen-label">
        <button
          className="watch-screen-nav"
          onClick={() => goTo(screenIdx - 1)}
          aria-label="previous screen"
        >‹</button>
        <span className="mono dim">SCREEN_0{screenIdx + 1}</span>
        <span className="mono accent">{SCREEN_NAMES[screenIdx]}</span>
        <button
          className="watch-screen-nav"
          onClick={() => goTo(screenIdx + 1)}
          aria-label="next screen"
        >›</button>
      </div>
    </div>
  );
}

window.WatchDevice = WatchDevice;
window.SCREEN_NAMES = SCREEN_NAMES;

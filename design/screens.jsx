/**
 * Watch screens — Clock, Steps, Message
 * Rendered inside the round AMOLED area. Pixel font for numerals.
 */

const { useState, useEffect, useRef } = React;

const HEART_PIXELS = [
  [4,3],[5,3],[8,3],[9,3],
  [3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],
  [3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],
  [4,6],[5,6],[6,6],[7,6],[8,6],[9,6],
  [5,7],[6,7],[7,7],[8,7],
  [6,8],[7,8],
];

function HeartIcon({ size = 140, color = '#FAF6EC', pulse = false }) {
  return (
    <svg
      viewBox="3 3 8 6"
      width={size}
      height={size * 6/8}
      shapeRendering="crispEdges"
      className={pulse ? 'heart-pulse' : ''}
    >
      {HEART_PIXELS.map(([x,y], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill={color} />
      ))}
    </svg>
  );
}

// ── Clock screen ─────────────────────────────────────────────
function ClockScreen({ time = '23:47', day = 'WED · MAY 26' }) {
  const [shown, setShown] = useState(time);
  useEffect(() => {
    setShown(time);
  }, [time]);
  return (
    <div className="ws ws-clock">
      <div className="ws-tag mono">NOW</div>
      <div className="ws-clock-time pixel">{shown}</div>
      <div className="ws-clock-sub pixel">{day}</div>
      <div className="ws-clock-tick mono">TICK · 60s</div>
    </div>
  );
}

// ── Steps screen ─────────────────────────────────────────────
function StepsScreen({ steps = 4280, goal = 6000, animating = false }) {
  const pct = Math.min(100, (steps / goal) * 100);
  return (
    <div className="ws ws-steps">
      <div className="ws-tag mono">STEPS / TODAY</div>
      <div className={`ws-steps-num pixel ${animating ? 'tick' : ''}`}>
        {steps.toLocaleString()}
      </div>
      <div className="ws-steps-track">
        <div className="ws-steps-fill" style={{ width: `${pct}%` }}></div>
        {/* dotted goal marker */}
        <div className="ws-steps-goal" style={{ left: `${100}%` }}></div>
      </div>
      <div className="ws-steps-foot pixel">GOAL {goal.toLocaleString()}</div>
    </div>
  );
}

// ── Message screen ───────────────────────────────────────────
function MessageScreen({ from = 'MAMA', time = '14:21', pulse = false }) {
  return (
    <div className="ws ws-message">
      <div className="ws-tag mono">PARENT TOUCH</div>
      <HeartIcon size={140} color="#FAF6EC" pulse={pulse} />
      <div className="ws-message-from pixel">{from}</div>
      <div className="ws-message-time mono">{time} · HAP-03</div>
    </div>
  );
}

// ── Empty message screen (no messages) ───────────────────────
function MessageEmpty() {
  return (
    <div className="ws ws-message-empty">
      <div className="ws-tag mono">PARENT TOUCH</div>
      <div className="ws-empty-line pixel">— —</div>
      <div className="ws-message-time mono">NO TOUCH TODAY</div>
    </div>
  );
}

// ── Boot / wake sweep — pixel reveal ─────────────────────────
function BootSweep({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 700);
    return () => clearTimeout(t);
  }, []);
  return <div className="boot-sweep"></div>;
}

window.ClockScreen = ClockScreen;
window.StepsScreen = StepsScreen;
window.MessageScreen = MessageScreen;
window.MessageEmpty = MessageEmpty;
window.HeartIcon = HeartIcon;
window.BootSweep = BootSweep;
window.HEART_PIXELS = HEART_PIXELS;

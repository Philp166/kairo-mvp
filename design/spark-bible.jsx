/**
 * Spark Bible — documentation page components
 * - StaticFace: renders a single pose (no scheduling) for spec sheets
 * - State studies, reaction cards, motion cheat sheet, sprite contact sheet
 */

const { useState, useEffect } = React;

// ── StaticFace: render a single pose for the spec sheet ─────
function StaticFace({ frame, size = 80, bg = 'default', extra = null, label }) {
  const bgClass = bg === 'sleep' ? 'state-sleepy' : bg === 'worried' ? 'state-worried' : 'state-calm';
  return (
    <div className="static-face-wrap" style={{ width: size }}>
      <div className={`spark-stage static ${bgClass}`} style={{ width: size, height: size, '--breath-dur': '999s' }}>
        <div className="spark-face" />
        <svg viewBox="0 0 16 16" width={size} height={size} className="spark-svg">
          {/* scanlines */}
          {Array.from({ length: 16 }).map((_, y) => (
            <rect key={y} x={0} y={y + 0.95} width={16} height={0.05} fill="#1A1538" opacity={0.07} />
          ))}
          <g shapeRendering="crispEdges">
            {frame.map(([x, y, c], i) => (
              <rect key={i} x={x} y={y} width={1} height={1} fill={PX[c || 'ink']} />
            ))}
          </g>
        </svg>
      </div>
      {label && <div className="static-face-label mono dim">{label}</div>}
    </div>
  );
}

// ── State Study — one card per state ────────────────────────
const STATE_META = {
  calm: {
    label: 'CALM',
    desc: 'HR normal · motion low · all good',
    triggers: 'HR in normal range, motion low, worn=true',
    breath: 0.5,
    motion: 'breath only',
  },
  active: {
    label: 'ACTIVE',
    desc: 'Moving, energetic, playful',
    triggers: 'steps↑, HR↑, IMU motion',
    breath: 1.0,
    motion: 'breath + bob + sparkle',
  },
  sleepy: {
    label: 'SLEEPY',
    desc: 'Winding down, asleep, resting',
    triggers: 'night clock · HR↓ · motion=0',
    breath: 0.3,
    motion: 'breath + drift + Z',
  },
  worried: {
    label: 'WORRIED',
    desc: 'Pulse spike, temp anomaly, or SOS',
    triggers: 'HR > pediatric threshold · ΔT > 0.2°C · SOS',
    breath: 0.7,
    motion: 'breath + shake + sweat · ragged',
  },
};

function StateStudy({ state }) {
  const meta = STATE_META[state];
  const cfg = FACE[state];
  const poseNames = Object.keys(cfg.poses).filter((n) => n !== 'blink');
  const bg = state === 'sleepy' ? 'sleep' : state === 'worried' ? 'worried' : 'default';

  return (
    <div className={`state-study study-${state}`}>
      <div className="study-head">
        <div className="study-id mono accent">STATE / {state.toUpperCase()}</div>
        <div className="study-breath mono dim">{meta.breath} Hz</div>
      </div>

      <div className="study-main">
        <Spark state={state} size={180} label={false} frame={false} />
      </div>

      <div className="study-meta">
        <div className="study-desc">{meta.desc}</div>
        <div className="study-meta-row mono">
          <span className="dim">TRIGGER</span>
          <span>{meta.triggers}</span>
        </div>
        <div className="study-meta-row mono">
          <span className="dim">MOTION</span>
          <span>{meta.motion}</span>
        </div>
      </div>

      <div className="study-poses-head mono dim">POSES · {poseNames.length}</div>
      <div className="study-poses-grid">
        {poseNames.map((name) => (
          <StaticFace
            key={name}
            frame={cfg.poses[name]}
            size={60}
            bg={bg}
            label={name}
          />
        ))}
      </div>
    </div>
  );
}

// ── Reaction Card ────────────────────────────────────────────
function ReactionCard({ reactionKey }) {
  const data = REACTIONS[reactionKey];
  return (
    <div className="reaction-card">
      <div className="reaction-head">
        <div className="mono dim">REACTION/</div>
        <div className="mono accent">{reactionKey.toUpperCase()}</div>
      </div>
      <div className="reaction-main">
        <Spark state="calm" size={160} label={false} frame={false} reaction={reactionKey} />
      </div>
      <div className="reaction-meta">
        <div className="reaction-name">{data.name}</div>
        <div className="reaction-desc mono dim">{data.desc}</div>
      </div>
    </div>
  );
}

// ── Motion cheat sheet ──────────────────────────────────────
const MOTION_RULES = [
  { id: 'M-01', name: 'Breath',  desc: 'Scale 1.0 → 1.04 alternate. Frequency = state-dependent.', tokens: 'calm 0.5Hz · active 1.0Hz · sleepy 0.3Hz · worried 0.7Hz' },
  { id: 'M-02', name: 'Bob',     desc: 'Active-only. Vertical translate –3% on 0.6s loop.', tokens: 'active' },
  { id: 'M-03', name: 'Drift',   desc: 'Sleepy-only. Horizontal sway ±1% on 6s loop.', tokens: 'sleepy' },
  { id: 'M-04', name: 'Shake',   desc: 'Worried-only. ±1px micro-jitter, 180ms steps.', tokens: 'worried' },
  { id: 'M-05', name: 'Blink',   desc: 'Calm + active. Eyes flatten 110-130ms, every 1.8–4.2s.', tokens: 'calm · active' },
  { id: 'M-06', name: 'Pose-cycle', desc: 'Each state cycles micro-poses with weighted random duration.', tokens: '5 poses/state' },
  { id: 'M-07', name: 'Extras',  desc: 'Sparkle · Z-float · Sweat · Love-sparkle · Confetti.', tokens: 'state + reaction dependent' },
];

function MotionRow({ rule }) {
  return (
    <div className="motion-row">
      <span className="mono accent motion-id">{rule.id}</span>
      <span className="motion-name">{rule.name}</span>
      <span className="motion-desc">{rule.desc}</span>
      <span className="mono dim motion-tokens">{rule.tokens}</span>
    </div>
  );
}

// ── Sprite Contact Sheet — every pose in one grid ───────────
function SpriteSheet() {
  const rows = [];
  for (const state of ['calm', 'active', 'sleepy', 'worried']) {
    const cfg = FACE[state];
    const bg = state === 'sleepy' ? 'sleep' : state === 'worried' ? 'worried' : 'default';
    const poseNames = Object.keys(cfg.poses);
    rows.push(
      <div key={state} className="sprite-row">
        <div className="sprite-row-head mono">
          <span className="accent">{state.toUpperCase()}</span>
          <span className="dim">× {poseNames.length}</span>
        </div>
        <div className="sprite-row-grid">
          {poseNames.map((name) => (
            <StaticFace
              key={name}
              frame={cfg.poses[name]}
              size={52}
              bg={bg}
              label={name}
            />
          ))}
        </div>
      </div>,
    );
  }
  // reactions row
  const rxBg = (k) => REACTIONS[k].bg === 'sleep' ? 'sleep' : REACTIONS[k].bg === 'worried' ? 'worried' : 'default';
  rows.push(
    <div key="reactions" className="sprite-row">
      <div className="sprite-row-head mono">
        <span className="accent">REACTIONS</span>
        <span className="dim">× {Object.keys(REACTIONS).length}</span>
      </div>
      <div className="sprite-row-grid">
        {Object.keys(REACTIONS).map((k) => (
          <StaticFace
            key={k}
            frame={REACTIONS[k].frame}
            size={52}
            bg={rxBg(k)}
            label={k}
          />
        ))}
      </div>
    </div>,
  );
  return <div className="sprite-sheet">{rows}</div>;
}

// ── Transition demo — show one state morphing to another ────
function TransitionDemo({ from, to }) {
  const [phase, setPhase] = useState(from);
  useEffect(() => {
    const t = setInterval(() => {
      setPhase((p) => (p === from ? to : from));
    }, 2800);
    return () => clearInterval(t);
  }, [from, to]);
  return (
    <div className="transition-demo">
      <div className="trans-label mono">
        <span className="accent">{from.toUpperCase()}</span>
        <span className="dim">→</span>
        <span className="accent">{to.toUpperCase()}</span>
      </div>
      <Spark state={phase} size={120} label={false} frame={false} />
      <div className="trans-now mono dim">NOW: {phase.toUpperCase()}</div>
    </div>
  );
}

window.StaticFace = StaticFace;
window.StateStudy = StateStudy;
window.ReactionCard = ReactionCard;
window.MotionRow = MotionRow;
window.MOTION_RULES = MOTION_RULES;
window.SpriteSheet = SpriteSheet;
window.TransitionDemo = TransitionDemo;
window.STATE_META = STATE_META;

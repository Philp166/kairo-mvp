/**
 * Spark — pixel character with a live face
 * Each state has a small library of micro-poses cycled with weighted random
 * timing. Blinks interrupt poses randomly. Layered with state-specific motion
 * (breath, bob, drift, shake) and extras (sparkle, Z, sweat).
 */

const { useEffect, useState, useRef } = React;

const BREATH_DUR = { calm: 2.0, active: 1.0, sleepy: 3.3, worried: 1.4 };

const PX = {
  ink:    '#1A1538',
  cream:  '#FAF6EC',
  lav:    '#9B8EC4',
  warm:   '#FF8559',
};

const px = (x, y, c = 'ink') => [x, y, c];

// ── FACE LIBRARY — each state has multiple poses ─────────────
const FACE = {
  // ── CALM ────────────────────────────────────────────────
  calm: {
    poses: {
      open: [
        // 2×2 dot eyes
        px(4,7), px(5,7), px(4,8), px(5,8),
        px(10,7), px(11,7), px(10,8), px(11,8),
        // smile ‿
        px(6,11), px(7,12), px(8,12), px(9,11),
        // blush
        px(3,10,'lav'), px(12,10,'lav'),
      ],
      blink: [
        // eye lines
        px(3,8), px(4,8), px(5,8), px(6,8),
        px(9,8), px(10,8), px(11,8), px(12,8),
        px(6,11), px(7,12), px(8,12), px(9,11),
        px(3,10,'lav'), px(12,10,'lav'),
      ],
      lookLeft: [
        // both eyes shifted to looker's left
        px(3,7), px(4,7), px(3,8), px(4,8),
        px(9,7), px(10,7), px(9,8), px(10,8),
        px(6,11), px(7,12), px(8,12), px(9,11),
        px(3,10,'lav'), px(12,10,'lav'),
      ],
      lookRight: [
        px(5,7), px(6,7), px(5,8), px(6,8),
        px(11,7), px(12,7), px(11,8), px(12,8),
        px(6,11), px(7,12), px(8,12), px(9,11),
        px(3,10,'lav'), px(12,10,'lav'),
      ],
      smileWide: [
        // happy squinty arc eyes ⌒  ⌒
        px(3,7), px(4,8), px(5,8), px(6,7),
        px(9,7), px(10,8), px(11,8), px(12,7),
        // wide smile
        px(4,11), px(5,12), px(6,12), px(7,12), px(8,12), px(9,12), px(10,12), px(11,11),
        px(3,10,'lav'), px(12,10,'lav'),
      ],
      hum: [
        // small content "o" mouth — barely there
        px(4,7), px(5,7), px(4,8), px(5,8),
        px(10,7), px(11,7), px(10,8), px(11,8),
        px(7,11), px(8,11),
        px(3,10,'lav'), px(12,10,'lav'),
      ],
    },
    schedule: [
      { pose: 'open',      weight: 42, dur: [1800, 3200] },
      { pose: 'lookLeft',  weight: 12, dur: [600, 1000] },
      { pose: 'lookRight', weight: 12, dur: [600, 1000] },
      { pose: 'smileWide', weight: 18, dur: [900, 1400] },
      { pose: 'hum',       weight: 16, dur: [700, 1200] },
    ],
    blink: { interval: [2400, 4200], dur: 130 },
  },

  // ── ACTIVE ──────────────────────────────────────────────
  active: {
    poses: {
      open: [
        // 3×3 ink eyes with cream catchlight
        px(4,6), px(5,6), px(6,6),
        px(4,7), px(5,7,'cream'), px(6,7),
        px(4,8), px(5,8), px(6,8),
        px(9,6), px(10,6), px(11,6),
        px(9,7), px(10,7,'cream'), px(11,7),
        px(9,8), px(10,8), px(11,8),
        // open O mouth
        px(7,11), px(8,11), px(7,12), px(8,12),
        // cheek warmth
        px(2,9,'warm'), px(13,9,'warm'),
      ],
      blink: [
        // squint lines, O mouth
        px(4,7), px(5,7), px(6,7),
        px(9,7), px(10,7), px(11,7),
        px(7,11), px(8,11), px(7,12), px(8,12),
        px(2,9,'warm'), px(13,9,'warm'),
      ],
      bigSmile: [
        // round eyes + wide D smile
        px(4,6), px(5,6), px(6,6),
        px(4,7), px(5,7,'cream'), px(6,7),
        px(4,8), px(5,8), px(6,8),
        px(9,6), px(10,6), px(11,6),
        px(9,7), px(10,7,'cream'), px(11,7),
        px(9,8), px(10,8), px(11,8),
        // grin
        px(4,11), px(5,12), px(6,12), px(7,12), px(8,12), px(9,12), px(10,12), px(11,11),
        px(2,9,'warm'), px(13,9,'warm'),
      ],
      excited: [
        // ring eyes with bigger pupil-cream
        px(4,6), px(5,6), px(6,6),
        px(4,7), px(6,7),
        px(5,7,'cream'),
        px(4,8), px(5,8), px(6,8),
        px(9,6), px(10,6), px(11,6),
        px(9,7), px(11,7),
        px(10,7,'cream'),
        px(9,8), px(10,8), px(11,8),
        // raised brows
        px(4,4), px(5,4),
        px(10,4), px(11,4),
        // wide O
        px(7,11), px(8,11), px(7,12), px(8,12),
        px(2,9,'warm'), px(13,9,'warm'),
      ],
      sideGlance: [
        // eyes look right, energetic
        px(5,6), px(6,6), px(7,6),
        px(5,7), px(7,7),
        px(6,7,'cream'),
        px(5,8), px(6,8), px(7,8),
        px(10,6), px(11,6), px(12,6),
        px(10,7), px(12,7),
        px(11,7,'cream'),
        px(10,8), px(11,8), px(12,8),
        px(7,11), px(8,11), px(7,12), px(8,12),
        px(2,9,'warm'), px(13,9,'warm'),
      ],
    },
    schedule: [
      { pose: 'open',       weight: 35, dur: [700, 1200] },
      { pose: 'bigSmile',   weight: 28, dur: [600, 1100] },
      { pose: 'excited',    weight: 20, dur: [400, 800] },
      { pose: 'sideGlance', weight: 17, dur: [500, 900] },
    ],
    blink: { interval: [1800, 3000], dur: 110 },
  },

  // ── SLEEPY ──────────────────────────────────────────────
  sleepy: {
    poses: {
      closed: [
        // closed eyelid lines
        px(3,8), px(4,8), px(5,8), px(6,8),
        px(9,8), px(10,8), px(11,8), px(12,8),
        // pouty mouth
        px(7,12), px(8,12),
        px(2,9,'lav'), px(13,9,'lav'),
      ],
      yawn: [
        px(3,8), px(4,8), px(5,8), px(6,8),
        px(9,8), px(10,8), px(11,8), px(12,8),
        // big open yawn mouth
        px(6,11), px(7,11), px(8,11), px(9,11),
        px(6,12), px(7,12), px(8,12), px(9,12),
        px(7,13), px(8,13),
        px(2,9,'lav'), px(13,9,'lav'),
      ],
      peek: [
        // one eye slightly cracked open (left), other closed
        px(4,7), px(5,7),
        px(3,8), px(4,8), px(5,8), px(6,8),
        px(9,8), px(10,8), px(11,8), px(12,8),
        px(7,12), px(8,12),
        px(2,9,'lav'), px(13,9,'lav'),
      ],
      drowse: [
        // eyes drift, soft uneven lines
        px(3,7), px(4,7), px(5,8), px(6,8),
        px(9,8), px(10,8), px(11,7), px(12,7),
        px(8,12),
        px(2,9,'lav'), px(13,9,'lav'),
      ],
      micronap: [
        // very still, eyes shut tight
        px(4,8), px(5,8),
        px(10,8), px(11,8),
        // mouth slightly open
        px(7,12), px(8,12),
        px(2,9,'lav'), px(13,9,'lav'),
      ],
    },
    schedule: [
      { pose: 'closed',   weight: 55, dur: [2400, 4200] },
      { pose: 'drowse',   weight: 15, dur: [1000, 1600] },
      { pose: 'peek',     weight: 10, dur: [600, 1100] },
      { pose: 'yawn',     weight: 8,  dur: [900, 1300] },
      { pose: 'micronap', weight: 12, dur: [1400, 2200] },
    ],
    blink: null, // already closed
  },

  // ── WORRIED ─────────────────────────────────────────────
  worried: {
    poses: {
      open: [
        // tense 3×3 eyes
        px(4,6), px(5,6), px(6,6),
        px(4,7), px(5,7), px(6,7),
        px(4,8), px(5,8), px(6,8),
        px(9,6), px(10,6), px(11,6),
        px(9,7), px(10,7), px(11,7),
        px(9,8), px(10,8), px(11,8),
        // worried brows \  /
        px(4,4), px(5,4), px(5,5),
        px(10,4), px(10,5), px(11,4),
        // frown ︵
        px(6,12), px(7,11), px(8,11), px(9,12),
      ],
      dartLeft: [
        // smaller pupils shifted left within socket
        px(4,7), px(5,7), px(4,8), px(5,8),
        px(9,7), px(10,7), px(9,8), px(10,8),
        px(4,4), px(5,4), px(5,5),
        px(10,4), px(10,5), px(11,4),
        px(6,12), px(7,11), px(8,11), px(9,12),
      ],
      dartRight: [
        px(5,7), px(6,7), px(5,8), px(6,8),
        px(10,7), px(11,7), px(10,8), px(11,8),
        px(4,4), px(5,4), px(5,5),
        px(10,4), px(10,5), px(11,4),
        px(6,12), px(7,11), px(8,11), px(9,12),
      ],
      squeeze: [
        // squeezed-shut X eyes
        px(4,6), px(6,6), px(5,7), px(4,8), px(6,8),
        px(9,6), px(11,6), px(10,7), px(9,8), px(11,8),
        px(4,4), px(5,4), px(5,5),
        px(10,4), px(10,5), px(11,4),
        // grimace
        px(5,12), px(6,11), px(7,11), px(8,11), px(9,11), px(10,12),
      ],
      quiver: [
        // half-open mouth quiver, normal tense eyes
        px(4,6), px(5,6), px(6,6),
        px(4,7), px(5,7), px(6,7),
        px(4,8), px(5,8), px(6,8),
        px(9,6), px(10,6), px(11,6),
        px(9,7), px(10,7), px(11,7),
        px(9,8), px(10,8), px(11,8),
        px(4,4), px(5,4), px(5,5),
        px(10,4), px(10,5), px(11,4),
        // squiggle mouth ︵ ︵
        px(5,11), px(6,12), px(7,11), px(8,12), px(9,11), px(10,12),
      ],
    },
    schedule: [
      { pose: 'open',      weight: 36, dur: [700, 1200] },
      { pose: 'dartLeft',  weight: 18, dur: [350, 600] },
      { pose: 'dartRight', weight: 18, dur: [350, 600] },
      { pose: 'squeeze',   weight: 12, dur: [500, 900] },
      { pose: 'quiver',    weight: 16, dur: [600, 1000] },
    ],
    blink: null,
  },
};

const EXTRAS = { active: 'sparkle', sleepy: 'zfloat', worried: 'sweat' };

// ── EVENT REACTIONS — transient expressions for special moments ─
// Override the auto-cycled pose when a reaction is active.
const REACTIONS = {
  love: {
    name: 'heart eyes',
    desc: 'parent touch received',
    bg: 'default',
    extra: 'lovesparkle',
    frame: [
      // left heart eye (3×3-ish: top two pixels + middle row + bottom point)
      px(4,6), px(6,6),
      px(4,7), px(5,7,'warm'), px(6,7),
      px(5,8,'warm'),
      // right heart eye
      px(9,6), px(11,6),
      px(9,7), px(10,7,'warm'), px(11,7),
      px(10,8,'warm'),
      // big smile
      px(4,11), px(5,12), px(6,12), px(7,12), px(8,12), px(9,12), px(10,12), px(11,11),
      // warm cheeks
      px(2,9,'warm'), px(13,9,'warm'),
    ],
  },
  celebrate: {
    name: 'star eyes',
    desc: 'daily goal reached',
    bg: 'default',
    extra: 'celebrate',
    frame: [
      // star/plus eye left
      px(5,6),
      px(4,7), px(5,7,'cream'), px(6,7),
      px(5,8),
      // star/plus eye right
      px(10,6),
      px(9,7), px(10,7,'cream'), px(11,7),
      px(10,8),
      // happy open mouth
      px(6,11), px(7,11), px(8,11), px(9,11),
      px(7,12), px(8,12),
      // cheek glow
      px(2,9,'warm'), px(13,9,'warm'),
    ],
  },
  off: {
    name: 'not worn',
    desc: 'wear-detect lost · no PPG signal',
    bg: 'sleep',
    extra: null,
    frame: [
      // "— —" placeholder eyes
      px(3,8), px(4,8), px(5,8), px(6,8),
      px(9,8), px(10,8), px(11,8), px(12,8),
      // no mouth
    ],
  },
  low_batt: {
    name: 'low battery',
    desc: 'battery < 15%',
    bg: 'default',
    extra: null,
    frame: [
      // tired half-open eyes
      px(3,7), px(4,8), px(5,8), px(6,7),
      px(9,7), px(10,8), px(11,8), px(12,7),
      // flat mouth
      px(6,11), px(7,11), px(8,11), px(9,11),
      // pixel battery icon top-right
      px(11,2,'cream'), px(12,2,'cream'), px(13,2,'cream'),
      px(11,3,'cream'), px(13,3,'cream'),
      px(11,4,'cream'), px(12,4,'warm'), px(13,4,'cream'),
    ],
  },
  bootup: {
    name: 'booting',
    desc: 'firmware boot · 1.5s splash',
    bg: 'default',
    extra: null,
    frame: [
      // single center pixel growing — render as small dot
      px(7,7,'cream'), px(8,7,'cream'),
      px(7,8,'cream'), px(8,8,'cream'),
    ],
  },
};

// ── Scheduler hook — picks micro-poses with weighted random timing ──
function useFaceScheduler(state) {
  const defaultPose = state === 'sleepy' ? 'closed' : 'open';
  const [pose, setPose] = useState(defaultPose);

  useEffect(() => {
    const cfg = FACE[state];
    const fallback = state === 'sleepy' ? 'closed' : 'open';
    setPose(fallback);
    if (!cfg.schedule) return;

    let alive = true;
    let mainTimer, blinkTimer, restoreTimer;

    function pick() {
      const total = cfg.schedule.reduce((s, p) => s + p.weight, 0);
      let r = Math.random() * total;
      for (const it of cfg.schedule) {
        r -= it.weight;
        if (r <= 0) return it;
      }
      return cfg.schedule[0];
    }

    function cycle() {
      const item = pick();
      const dur = item.dur[0] + Math.random() * (item.dur[1] - item.dur[0]);
      setPose(item.pose);

      // blink interrupt
      if (cfg.blink && cfg.poses.blink && Math.random() < 0.8) {
        const earliest = 250;
        const latest = dur - 250;
        if (latest > earliest) {
          const at = earliest + Math.random() * (latest - earliest);
          blinkTimer = setTimeout(() => {
            if (!alive) return;
            setPose('blink');
            restoreTimer = setTimeout(() => {
              if (!alive) return;
              setPose(item.pose);
            }, cfg.blink.dur);
          }, at);
        }
      }

      mainTimer = setTimeout(() => { if (alive) cycle(); }, dur);
    }
    cycle();

    return () => {
      alive = false;
      clearTimeout(mainTimer);
      clearTimeout(blinkTimer);
      clearTimeout(restoreTimer);
    };
  }, [state]);

  return pose;
}

// ── Renderers ────────────────────────────────────────────────
function PixelGrid({ frame }) {
  return (
    <g shapeRendering="crispEdges">
      {frame.map(([x, y, c], i) => (
        <rect key={`${i}-${x}-${y}-${c}`} x={x} y={y} width={1} height={1} fill={PX[c]} />
      ))}
    </g>
  );
}

function Sparkle() {
  return (
    <g shapeRendering="crispEdges" className="x-sparkle">
      <rect x={13} y={2} width={1} height={1} fill={PX.cream} />
      <rect x={12} y={3} width={1} height={1} fill={PX.cream} />
      <rect x={14} y={3} width={1} height={1} fill={PX.cream} />
      <rect x={13} y={4} width={1} height={1} fill={PX.cream} />
      <g className="x-sparkle-2">
        <rect x={2} y={13} width={1} height={1} fill={PX.cream} />
        <rect x={3} y={14} width={1} height={1} fill={PX.cream} />
      </g>
    </g>
  );
}

function ZFloat() {
  return (
    <g shapeRendering="crispEdges" className="x-z">
      <rect x={12} y={3} width={1} height={1} fill={PX.cream} />
      <rect x={13} y={3} width={1} height={1} fill={PX.cream} />
      <rect x={14} y={3} width={1} height={1} fill={PX.cream} />
      <rect x={13} y={4} width={1} height={1} fill={PX.cream} />
      <rect x={12} y={5} width={1} height={1} fill={PX.cream} />
      <rect x={12} y={6} width={1} height={1} fill={PX.cream} />
      <rect x={13} y={6} width={1} height={1} fill={PX.cream} />
      <rect x={14} y={6} width={1} height={1} fill={PX.cream} />
    </g>
  );
}

function Sweat() {
  return (
    <g shapeRendering="crispEdges" className="x-sweat">
      <rect x={12} y={6} width={1} height={1} fill={PX.cream} />
      <rect x={11} y={7} width={1} height={1} fill={PX.cream} />
      <rect x={12} y={7} width={1} height={1} fill={PX.cream} />
      <rect x={13} y={7} width={1} height={1} fill={PX.cream} />
      <rect x={12} y={8} width={1} height={1} fill={PX.cream} />
    </g>
  );
}

// ── Reaction extras ──────────────────────────────────────────
function LoveSparkle() {
  // tiny floating hearts at 4 positions
  return (
    <g shapeRendering="crispEdges" className="x-love">
      {/* top-left tiny heart */}
      <g className="x-love-a">
        <rect x={2} y={2} width={1} height={1} fill={PX.warm} />
        <rect x={3} y={2} width={1} height={1} fill={PX.warm} />
        <rect x={2} y={3} width={1} height={1} fill={PX.warm} />
        <rect x={3} y={3} width={1} height={1} fill={PX.warm} />
        <rect x={2.5} y={4} width={1} height={1} fill={PX.warm} />
      </g>
      {/* top-right tiny heart */}
      <g className="x-love-b">
        <rect x={13} y={3} width={1} height={1} fill={PX.warm} />
        <rect x={14} y={3} width={1} height={1} fill={PX.warm} />
        <rect x={13} y={4} width={1} height={1} fill={PX.warm} />
        <rect x={14} y={4} width={1} height={1} fill={PX.warm} />
        <rect x={13.5} y={5} width={1} height={1} fill={PX.warm} />
      </g>
    </g>
  );
}

function Confetti() {
  // bursting cream + warm sparkles around the head
  return (
    <g shapeRendering="crispEdges" className="x-confetti">
      <rect x={2}  y={3} width={1} height={1} fill={PX.cream} className="cf-1" />
      <rect x={13} y={2} width={1} height={1} fill={PX.cream} className="cf-2" />
      <rect x={14} y={5} width={1} height={1} fill={PX.warm}  className="cf-3" />
      <rect x={1}  y={6} width={1} height={1} fill={PX.warm}  className="cf-4" />
      <rect x={3}  y={1} width={1} height={1} fill={PX.cream} className="cf-5" />
      <rect x={12} y={1} width={1} height={1} fill={PX.warm}  className="cf-6" />
      <rect x={1}  y={11} width={1} height={1} fill={PX.cream} className="cf-7" />
      <rect x={14} y={11} width={1} height={1} fill={PX.warm}  className="cf-8" />
    </g>
  );
}

function Scanlines() {
  const lines = [];
  for (let y = 0; y < 16; y += 1) {
    lines.push(<rect key={y} x={0} y={y + 0.95} width={16} height={0.05} fill={PX.ink} opacity={0.07} />);
  }
  return <g>{lines}</g>;
}

function ChipBrackets({ state }) {
  return (
    <div className={`spark-frame state-${state}`}>
      <span className="cf tl"></span>
      <span className="cf tr"></span>
      <span className="cf bl"></span>
      <span className="cf br"></span>
    </div>
  );
}

// ── Main Spark component ─────────────────────────────────────
function Spark({ state = 'calm', size = 200, label = true, frame = true, reaction = null, onClick }) {
  const poseName = useFaceScheduler(state);
  const cfg = FACE[state];
  const reactionData = reaction ? REACTIONS[reaction] : null;

  const currentFrame = reactionData
    ? reactionData.frame
    : (cfg.poses[poseName] || cfg.poses[state === 'sleepy' ? 'closed' : 'open']);

  const extra = reactionData ? reactionData.extra : EXTRAS[state];
  const bgState = reactionData
    ? (reactionData.bg === 'sleep' ? 'sleepy' : reactionData.bg === 'worried' ? 'worried' : 'calm')
    : state;

  return (
    <div
      className="spark-root"
      style={{ width: size }}
      onClick={onClick}
      data-state={state}
      data-reaction={reaction || ''}
    >
      <div
        className={`spark-stage state-${bgState} ${reaction ? `reaction-${reaction}` : ''}`}
        style={{ width: size, height: size, '--breath-dur': `${BREATH_DUR[state]}s` }}
      >
        <div className="spark-face" />
        <svg
          viewBox="0 0 16 16"
          width={size}
          height={size}
          className="spark-svg"
        >
          <Scanlines />
          <PixelGrid frame={currentFrame} />
          {extra === 'sparkle'     && <Sparkle />}
          {extra === 'zfloat'      && <ZFloat />}
          {extra === 'sweat'       && <Sweat />}
          {extra === 'lovesparkle' && <LoveSparkle />}
          {extra === 'celebrate'   && <Confetti />}
        </svg>
        {frame && <ChipBrackets state={reaction ? 'love' : state} />}
      </div>

      {label && (
        <div className="spark-label">
          <span className="mono dim">STATE</span>
          <span className="mono accent">{(reactionData?.name || state).toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}

window.Spark = Spark;
window.FACE = FACE;
window.REACTIONS = REACTIONS;
window.PX = PX;
window.BREATH_DUR = BREATH_DUR;

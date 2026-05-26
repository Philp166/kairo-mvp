/**
 * Style tile sections — typography, color, fragments, motion
 */

const { useState, useEffect, useRef } = React;

// ─── Color swatches ────────────────────────────────────────────
const LIGHT_TOKENS = [
  { name: '--bg',         hex: '#FEFCF9', label: 'page', role: 'surface' },
  { name: '--surface',    hex: '#F7F3ED', label: 'card', role: 'surface' },
  { name: '--line',       hex: '#E8E0D4', label: 'border', role: 'surface' },
  { name: '--ink',        hex: '#1A1538', label: 'ink', role: 'text' },
  { name: '--ink-2',      hex: '#3D365E', label: 'ink·2', role: 'text' },
  { name: '--muted',      hex: '#8C8279', label: 'muted', role: 'text' },
  { name: '--accent',     hex: '#D85A30', label: 'terracotta', role: 'accent' },
  { name: '--lavender',   hex: '#9B8EC4', label: 'lavender', role: 'accent' },
  { name: '--ok',         hex: '#5A9A6B', label: 'ok', role: 'semantic' },
  { name: '--alert',      hex: '#D84130', label: 'alert', role: 'semantic' },
];
const DARK_TOKENS = [
  { name: '--bg',         hex: '#0B0820', label: 'page', role: 'surface' },
  { name: '--surface',    hex: '#15102E', label: 'card', role: 'surface' },
  { name: '--line',       hex: '#261E48', label: 'border', role: 'surface' },
  { name: '--ink',        hex: '#F0EBE0', label: 'ink', role: 'text' },
  { name: '--ink-2',      hex: '#BFB6D9', label: 'ink·2', role: 'text' },
  { name: '--muted',      hex: '#6A6190', label: 'muted', role: 'text' },
  { name: '--accent',     hex: '#FF6B3D', label: 'terracotta·neon', role: 'accent' },
  { name: '--lavender',   hex: '#B5A8E0', label: 'lavender', role: 'accent' },
  { name: '--ok',         hex: '#6FBA82', label: 'ok', role: 'semantic' },
  { name: '--alert',      hex: '#FF4B30', label: 'alert', role: 'semantic' },
];

function Swatch({ hex, name, label }) {
  return (
    <div className="swatch">
      <div className="swatch-chip" style={{ background: hex }}>
        <div className="swatch-corner tl"></div>
        <div className="swatch-corner tr"></div>
        <div className="swatch-corner bl"></div>
        <div className="swatch-corner br"></div>
      </div>
      <div className="swatch-meta">
        <span className="mono dim">{name}</span>
        <span className="mono">{label}</span>
        <span className="mono dim">{hex}</span>
      </div>
    </div>
  );
}

function ColorBlock({ title, tokens, theme }) {
  return (
    <div className="color-block" data-block-theme={theme}>
      <div className="color-block-head">
        <span className="mono dim">PALETTE/</span>
        <span className="mono accent">{title}</span>
      </div>
      <div className="swatch-grid">
        {tokens.map((t) => <Swatch key={t.name} {...t} />)}
      </div>
    </div>
  );
}

// ─── Typography ────────────────────────────────────────────────
function TypeSection() {
  return (
    <div className="type-grid">
      <div className="type-card">
        <div className="type-head">
          <span className="mono dim">001 / DISPLAY</span>
          <span className="mono">Space Grotesk</span>
        </div>
        <div className="type-spec">Geometric grotesque · 400 / 500 / 600 · -0.02em tracking on display sizes</div>
        <div className="type-demo">
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 96, lineHeight: 0.95, fontWeight: 500, letterSpacing: '-0.03em' }}>
            Spark.
          </div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 12 }}>
            Active, all signals nominal
          </div>
          <div style={{ fontFamily: 'Space Grotesk', fontSize: 16, fontWeight: 400, marginTop: 8, color: 'var(--ink-2)' }}>
            Misha · 6 yrs · last sync 12s ago
          </div>
        </div>
      </div>

      <div className="type-card">
        <div className="type-head">
          <span className="mono dim">002 / MONO</span>
          <span className="mono">JetBrains Mono</span>
        </div>
        <div className="type-spec">Tech labels, data readouts, slot IDs · 400 / 500 · UPPERCASE +0.1em tracking</div>
        <div className="type-demo">
          <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>SYS · KAIRO/SPARK · v0.1</div>
          <div className="mono" style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>NODE_07 · HR · BPM</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 56, fontWeight: 500, color: 'var(--accent)', marginTop: 8, letterSpacing: '-0.02em' }}>
            82<span style={{ fontSize: 24, color: 'var(--muted)', marginLeft: 6 }}>bpm</span>
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
            BASELINE 78 · DELTA +4 · NORM_BAND 60–120
          </div>
        </div>
      </div>

      <div className="type-card pixel-card">
        <div className="type-head">
          <span className="mono dim">003 / PIXEL</span>
          <span className="mono">VT323</span>
        </div>
        <div className="type-spec">Watch-face only · times, step counts, on-device readouts · single weight</div>
        <div className="type-demo pixel-demo">
          <div style={{ fontFamily: 'VT323', fontSize: 96, lineHeight: 1, color: 'var(--ink-on-accent)' }}>
            23:47
          </div>
          <div style={{ fontFamily: 'VT323', fontSize: 32, lineHeight: 1, color: 'var(--ink-on-accent)', opacity: 0.7, marginTop: 4 }}>
            WED · 4,280 STEPS
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── UI Fragments ──────────────────────────────────────────────
function Sparkline({ data = [62, 68, 72, 70, 75, 78, 74, 80, 78, 82, 80, 82], color }) {
  const w = 120, h = 28;
  const min = Math.min(...data), max = Math.max(...data);
  const norm = (v) => h - ((v - min) / (max - min || 1)) * h;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${norm(v)}`).join(' ');
  return (
    <svg width={w} height={h} className="sparkline">
      <polyline points={points} fill="none" stroke={color || 'var(--accent)'} strokeWidth={1.2} />
      <circle cx={(data.length - 1) * step} cy={norm(data[data.length - 1])} r={2} fill={color || 'var(--accent)'} />
    </svg>
  );
}

function ChipKPI({ slot, label, value, unit, sparkline, delta, status = 'norm' }) {
  return (
    <div className={`chip-kpi status-${status}`}>
      <div className="chip-brackets">
        <span className="cb tl"></span>
        <span className="cb tr"></span>
        <span className="cb bl"></span>
        <span className="cb br"></span>
      </div>
      <div className="chip-head">
        <span className="mono dim">SLOT/{slot}</span>
        <span className={`chip-pip status-${status}`}></span>
      </div>
      <div className="chip-label mono">{label}</div>
      <div className="chip-value">
        <span className="chip-num">{value}</span>
        <span className="chip-unit mono">{unit}</span>
      </div>
      {sparkline && <div className="chip-spark"><Sparkline data={sparkline} /></div>}
      {delta && <div className="mono chip-delta">{delta}</div>}
    </div>
  );
}

function StateBadge({ state }) {
  const labels = {
    calm:    { txt: 'CALM',    sub: 'at home, all good' },
    active:  { txt: 'ACTIVE',  sub: 'moving, energetic' },
    sleepy:  { txt: 'SLEEPY',  sub: 'winding down' },
    worried: { txt: 'ALERT',   sub: 'check on her' },
  };
  return (
    <div className={`state-badge state-${state}`}>
      <div className="state-dot"></div>
      <div className="state-text">
        <div className="mono state-name">{labels[state].txt}</div>
        <div className="state-sub">{labels[state].sub}</div>
      </div>
    </div>
  );
}

function TouchButton({ glyph, label, hap, primary = false }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      className={`touch-btn ${primary ? 'primary' : ''} ${pressed ? 'pressed' : ''}`}
      onClick={() => { setPressed(true); setTimeout(() => setPressed(false), 600); }}
    >
      <span className="touch-glyph">{glyph}</span>
      <span className="touch-label">{label}</span>
      <span className="mono touch-hap">{hap}</span>
      <span className="touch-slot-line"></span>
    </button>
  );
}

function ScrubStrip() {
  return (
    <div className="scrub-strip">
      <div className="scrub-head">
        <span className="mono dim">TIMELINE/24H</span>
        <span className="mono">06:00 → NOW</span>
      </div>
      <div className="scrub-bar">
        <div className="scrub-seg seg-sleepy" style={{ width: '20%' }}></div>
        <div className="scrub-seg seg-calm"   style={{ width: '15%' }}></div>
        <div className="scrub-seg seg-active" style={{ width: '12%' }}></div>
        <div className="scrub-seg seg-calm"   style={{ width: '8%' }}></div>
        <div className="scrub-seg seg-active" style={{ width: '14%' }}></div>
        <div className="scrub-seg seg-worried" style={{ width: '3%' }}></div>
        <div className="scrub-seg seg-calm"   style={{ width: '18%' }}></div>
        <div className="scrub-seg seg-off"    style={{ width: '10%' }}></div>
      </div>
      <div className="scrub-ticks">
        {['06', '09', '12', '15', '18', '21', '00', '03'].map((t) => (
          <span key={t} className="mono">{t}:00</span>
        ))}
      </div>
    </div>
  );
}

function NotifCard({ kind, title, time, hap }) {
  return (
    <div className={`notif notif-${kind}`}>
      <div className="notif-rail"></div>
      <div className="notif-body">
        <div className="notif-head">
          <span className="mono dim">EVT_{kind.toUpperCase()}</span>
          <span className="mono dim">{time}</span>
        </div>
        <div className="notif-title">{title}</div>
        {hap && <div className="mono notif-hap">{hap}</div>}
      </div>
    </div>
  );
}

// ─── Motion demos ──────────────────────────────────────────────
function MotionCard({ title, code, children }) {
  return (
    <div className="motion-card">
      <div className="motion-head">
        <span className="mono dim">MOTION/</span>
        <span className="mono accent">{code}</span>
      </div>
      <div className="motion-title">{title}</div>
      <div className="motion-stage">{children}</div>
    </div>
  );
}

function BreathDemo() {
  return (
    <div className="m-breath">
      <div className="m-breath-orb"></div>
      <div className="m-breath-orb m-breath-orb-2"></div>
    </div>
  );
}

function ScrubDemo() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % 4), 1400);
    return () => clearInterval(t);
  }, []);
  const values = ['78', '82', '91', '88'];
  return (
    <div className="m-scrub">
      <div className="mono dim" style={{ fontSize: 10 }}>HR/SCRUB</div>
      <div className="m-scrub-val">
        {values[idx].split('').map((d, i) => (
          <span key={`${idx}-${i}`} className="m-scrub-digit">{d}</span>
        ))}
        <span className="mono m-scrub-unit">bpm</span>
      </div>
    </div>
  );
}

function SlotDemo() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % 3), 1500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="m-slot">
      <div className="m-slot-rail"></div>
      <div className={`m-slot-chip phase-${phase}`}>
        <div className="cb tl"></div>
        <div className="cb tr"></div>
        <div className="cb bl"></div>
        <div className="cb br"></div>
        <span className="mono" style={{ fontSize: 9 }}>HUG</span>
      </div>
    </div>
  );
}

function GlitchDemo() {
  return (
    <div className="m-glitch">
      <div className="m-glitch-label">ALERT</div>
      <div className="m-glitch-bar"></div>
    </div>
  );
}

window.LIGHT_TOKENS = LIGHT_TOKENS;
window.DARK_TOKENS = DARK_TOKENS;
window.ColorBlock = ColorBlock;
window.TypeSection = TypeSection;
window.ChipKPI = ChipKPI;
window.StateBadge = StateBadge;
window.TouchButton = TouchButton;
window.ScrubStrip = ScrubStrip;
window.NotifCard = NotifCard;
window.MotionCard = MotionCard;
window.BreathDemo = BreathDemo;
window.ScrubDemo = ScrubDemo;
window.SlotDemo = SlotDemo;
window.GlitchDemo = GlitchDemo;
window.Sparkline = Sparkline;

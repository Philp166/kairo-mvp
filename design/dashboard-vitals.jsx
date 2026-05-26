/**
 * Dashboard — Vitals + Spark with halo
 * - SparkHalo: concentric live rings around Spark (HR / SpO2 / Temp / Battery)
 * - VitalChip: expandable physical-chip card with sparkline + status
 * - VitalChipBank: row of 4 chips
 */

const { useState, useEffect, useRef } = React;

// ── Mock 24h sparklines for vitals ─────────────────────────
const HR_24H = [62,60,58,60,62,68,82,108,94,86,82,76,78,98,92,84,82,124,118,98,92,84,78,68];
const SPO2_24H = [96,96,96,97,97,97,98,98,97,98,98,98,98,97,97,98,98,96,97,98,98,98,98,97];
const TEMP_DELTA_24H = [-0.1,-0.1,-0.1,0,0,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.2,0.2,0.2,0.3,0.2,0.1,0.1,0.1,0,0];
const STEPS_24H = [0,0,0,0,0,0,80,540,820,1100,1400,1820,2300,2820,3200,3580,3800,3950,4080,4180,4240,4260,4280,4280];

// ── Sparkline (mini area chart for chip cards) ─────────────
function MicroSpark({ data, color = 'var(--accent)', w = 200, h = 44, highlight }) {
  const min = Math.min(...data), max = Math.max(...data);
  const norm = (v) => h - 4 - ((v - min) / (max - min || 1)) * (h - 8);
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${norm(v)}`);
  const areaPath = `M0,${h} ` + pts.map((p, i) => (i ? 'L' : 'L') + p).join(' ') + ` L${w},${h} Z`;
  const linePath = 'M' + pts.join(' L');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} className="micro-spark" preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`g-${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#g-${color.replace(/[^a-z0-9]/gi,'')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.2} />
      {/* tick marks */}
      {[0, 6, 12, 18, 23].map((i) => (
        <line key={i} x1={i * step} y1={h-2} x2={i * step} y2={h} stroke="var(--muted)" strokeOpacity={0.4} strokeWidth={0.5} />
      ))}
      {/* last point */}
      <circle cx={(data.length - 1) * step} cy={norm(data[data.length - 1])} r={2.5} fill={color} />
      {highlight != null && (
        <line x1={highlight * step} y1={0} x2={highlight * step} y2={h} stroke={color} strokeOpacity={0.6} strokeWidth={1} strokeDasharray="2 2" />
      )}
    </svg>
  );
}

// ── Vital Chip — expandable physical card ──────────────────
function VitalChip({ slot, label, value, unit, delta, status, color, data, scrubHour }) {
  const { t } = React.useContext(window.LangCtx);
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`vital-chip status-${status} ${expanded ? 'expanded' : ''}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="vital-cb tl"></div>
      <div className="vital-cb tr"></div>
      <div className="vital-cb bl"></div>
      <div className="vital-cb br"></div>

      <div className="vital-head">
        <span className="mono dim">SLOT/{slot}</span>
        <span className={`vital-pip status-${status}`}></span>
      </div>

      <div className="vital-label mono">{label}</div>

      <div className="vital-value">
        <span className="vital-num" style={{ color }}>{value}</span>
        <span className="vital-unit mono">{unit}</span>
      </div>

      <div className="vital-delta mono">{delta}</div>

      <div className="vital-spark">
        <MicroSpark data={data} color={color} w={200} h={44} highlight={scrubHour} />
      </div>

      {/* hover-only expansion details */}
      <div className="vital-expand">
        <div className="mono dim">{t('vital.range')}</div>
        <div className="vital-range">
          <span className="mono">{Math.min(...data)}</span>
          <span className="vital-range-bar">
            <span className="vital-range-fill" style={{ background: color }}></span>
          </span>
          <span className="mono">{Math.max(...data)}</span>
        </div>
      </div>
    </div>
  );
}

function VitalChipBank({ scrubHour, vitals }) {
  return (
    <div className="vital-bank">
      {vitals.map((v) => (
        <VitalChip key={v.slot} {...v} scrubHour={scrubHour} />
      ))}
    </div>
  );
}

// ── Spark Halo — concentric vital rings ────────────────────
function HaloRing({ radius, strokeWidth, fillPct, color, dasharray, animClass, opacity = 1 }) {
  const circ = 2 * Math.PI * radius;
  const filled = (fillPct / 100) * circ;
  return (
    <circle
      r={radius}
      cx={0} cy={0}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeDasharray={dasharray || `${filled} ${circ}`}
      strokeOpacity={opacity}
      transform="rotate(-90)"
      className={animClass}
      strokeLinecap="round"
    />
  );
}

function SparkHalo({ sparkState, vitals, size = 280 }) {
  // Inner sparkRing area roughly 220 (Spark size)
  const sparkSize = 200;
  const rOuter = (size / 2) - 6;
  const rHr   = rOuter - 2;
  const rSpo  = rOuter - 14;
  const rTemp = rOuter - 26;
  const rBatt = rOuter - 38;

  const norm = (val, min, max) => Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

  return (
    <div className="spark-halo-wrap" style={{ width: size, height: size }}>
      <svg viewBox={`-${size/2} -${size/2} ${size} ${size}`} width={size} height={size} className="halo-svg">
        {/* HR ring (pulses) */}
        <g className="halo-hr">
          <HaloRing radius={rHr} strokeWidth={1} fillPct={100} color="var(--line)" opacity={0.4} />
          <HaloRing radius={rHr} strokeWidth={2.5} fillPct={norm(vitals.hr.value, 40, 160)} color={vitals.hr.color} animClass="halo-pulse-hr" />
        </g>
        {/* tick marks around HR ring */}
        {Array.from({ length: 48 }).map((_, i) => {
          const ang = (i / 48) * 2 * Math.PI;
          const x1 = Math.cos(ang) * rHr;
          const y1 = Math.sin(ang) * rHr;
          const x2 = Math.cos(ang) * (rHr - 3);
          const y2 = Math.sin(ang) * (rHr - 3);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink)" strokeOpacity={0.15} strokeWidth={0.5} />;
        })}

        {/* SpO2 ring */}
        <HaloRing radius={rSpo} strokeWidth={1} fillPct={100} color="var(--line)" opacity={0.3} />
        <HaloRing radius={rSpo} strokeWidth={2} fillPct={norm(vitals.spo2.value, 90, 100)} color={vitals.spo2.color} />

        {/* Temp ring (delta from baseline, ±0.5 range) */}
        <HaloRing radius={rTemp} strokeWidth={1} fillPct={100} color="var(--line)" opacity={0.3} />
        <HaloRing radius={rTemp} strokeWidth={2} fillPct={norm(Math.abs(parseFloat(vitals.temp.value)), 0, 0.5)} color={vitals.temp.color} />

        {/* Battery ring */}
        <HaloRing radius={rBatt} strokeWidth={1} fillPct={100} color="var(--line)" opacity={0.3} />
        <HaloRing radius={rBatt} strokeWidth={2} fillPct={vitals.battery.value} color={vitals.battery.color} />

        {/* HR pulse dot floating along the ring */}
        <circle r="3" fill={vitals.hr.color} className="halo-dot">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 0"
            to="360 0 0"
            dur="60s"
            repeatCount="indefinite"
          />
          <animate attributeName="cx" values={`${rHr};${rHr}`} dur="60s" />
        </circle>
      </svg>
      {/* Spark in the center */}
      <div className="halo-center" style={{ width: sparkSize, height: sparkSize }}>
        <Spark state={sparkState} size={sparkSize} label={false} frame={false} />
      </div>
      {/* External labels (top: HR / right: SpO2 / bottom: Temp / left: Batt) */}
      <div className="halo-label halo-label-t mono">
        <span className="dim">HR</span>
        <span style={{ color: vitals.hr.color }}>{vitals.hr.value}</span>
      </div>
      <div className="halo-label halo-label-r mono">
        <span className="dim">SPO₂</span>
        <span style={{ color: vitals.spo2.color }}>{vitals.spo2.value}%</span>
      </div>
      <div className="halo-label halo-label-b mono">
        <span className="dim">ΔT</span>
        <span style={{ color: vitals.temp.color }}>{vitals.temp.value}°C</span>
      </div>
      <div className="halo-label halo-label-l mono">
        <span className="dim">BATT</span>
        <span style={{ color: vitals.battery.color }}>{vitals.battery.value}%</span>
      </div>
    </div>
  );
}

// ── HR 24h trend chart (full width) ────────────────────────
function HrTrendChart({ data, scrubHour }) {
  const { t } = React.useContext(window.LangCtx);
  const w = 720, h = 180;
  const min = 40, max = 140;
  const norm = (v) => h - 16 - ((v - min) / (max - min)) * (h - 32);
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${norm(v)}`);
  const areaPath = `M0,${h-12} ` + pts.map((p) => 'L' + p).join(' ') + ` L${w},${h-12} Z`;
  const linePath = 'M' + pts.join(' L');

  return (
    <div className="hr-trend">
      <div className="hr-trend-head">
        <div>
          <span className="mono dim">CHART/</span>
          <span className="mono accent">{t('hr.head.label')}</span>
        </div>
        <div className="mono dim">{t('hr.thresh')}</div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="hr-trend-svg" preserveAspectRatio="none">
        {/* sleep zones shaded */}
        <rect x={0} y={0} width={6 * step} height={h - 12} fill="var(--lavender)" opacity={0.06} />
        <rect x={21 * step} y={0} width={3 * step} height={h - 12} fill="var(--lavender)" opacity={0.06} />
        {/* pediatric threshold */}
        <line x1={0} y1={norm(120)} x2={w} y2={norm(120)} stroke="var(--alert)" strokeOpacity={0.5} strokeWidth={1} strokeDasharray="4 4" />
        {/* baseline */}
        <line x1={0} y1={norm(78)} x2={w} y2={norm(78)} stroke="var(--muted)" strokeOpacity={0.3} strokeWidth={1} strokeDasharray="2 4" />
        {/* area */}
        <path d={areaPath} fill="var(--accent)" opacity="0.12" />
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={1.6} />
        {/* hour ticks */}
        {[0,3,6,9,12,15,18,21].map((h_) => (
          <g key={h_}>
            <line x1={h_ * step} y1={h-12} x2={h_ * step} y2={h-8} stroke="var(--muted)" strokeOpacity={0.5} strokeWidth={0.5} />
            <text x={h_ * step} y={h-1} fontSize="9" fill="var(--muted)" textAnchor="middle" fontFamily="JetBrains Mono">{h_.toString().padStart(2,'0')}</text>
          </g>
        ))}
        {/* scrub highlight */}
        {scrubHour != null && (
          <g>
            <line x1={scrubHour * step} y1={0} x2={scrubHour * step} y2={h-12} stroke="var(--accent)" strokeWidth={1.5} />
            <circle cx={scrubHour * step} cy={norm(data[scrubHour])} r={4} fill="var(--accent)" />
            <circle cx={scrubHour * step} cy={norm(data[scrubHour])} r={7} fill="none" stroke="var(--accent)" strokeWidth={1} opacity={0.5} />
          </g>
        )}
      </svg>
      <div className="hr-trend-legend mono">
        <span><span className="leg leg-area"></span>{t('hr.leg.hr')}</span>
        <span><span className="leg leg-thresh"></span>{t('hr.leg.thresh')}</span>
        <span><span className="leg leg-base"></span>{t('hr.leg.base')}</span>
        <span><span className="leg leg-sleep"></span>{t('hr.leg.sleep')}</span>
      </div>
    </div>
  );
}

// ── Small stat cards (sleep, HRV) ──────────────────────────
function StatTile({ slot, label, value, unit, sub, color = 'var(--ink)', children }) {
  return (
    <div className="stat-tile">
      <div className="stat-head">
        <span className="mono dim">SLOT/{slot}</span>
      </div>
      <div className="stat-label mono">{label}</div>
      <div className="stat-value">
        <span className="stat-num" style={{ color }}>{value}</span>
        <span className="stat-unit mono">{unit}</span>
      </div>
      <div className="stat-sub mono">{sub}</div>
      {children}
    </div>
  );
}

// HRV gauge — simple half-circle
function HrvGauge({ value = 42, min = 20, max = 80 }) {
  const pct = (value - min) / (max - min);
  const ang = -Math.PI + pct * Math.PI;
  const r = 50;
  const cx = Math.cos(ang) * r;
  const cy = Math.sin(ang) * r;
  return (
    <svg viewBox="-60 -56 120 64" width="120" height="64" className="hrv-gauge">
      <path d={`M-${r},0 A${r},${r} 0 0 1 ${r},0`} fill="none" stroke="var(--line)" strokeWidth={3} />
      <path d={`M-${r},0 A${r},${r} 0 0 1 ${cx},${cy}`} fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="var(--accent)" />
    </svg>
  );
}

window.MicroSpark = MicroSpark;
window.VitalChip = VitalChip;
window.VitalChipBank = VitalChipBank;
window.SparkHalo = SparkHalo;
window.HrTrendChart = HrTrendChart;
window.StatTile = StatTile;
window.HrvGauge = HrvGauge;
window.HR_24H = HR_24H;
window.SPO2_24H = SPO2_24H;
window.TEMP_DELTA_24H = TEMP_DELTA_24H;
window.STEPS_24H = STEPS_24H;

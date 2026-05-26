/**
 * Dashboard — Timeline, Schedule, Location, Activity
 * - MoodScrub: draggable mood timeline → controls scrubbed Spark display
 * - ScheduleArc: 24h circular dial with bedtime + school windows
 * - LocationRadar: radial geofence display
 * - ActivityTape: vertical event log with HAP waveforms
 */

const { useState, useEffect, useRef, useCallback } = React;

// ── 24h mood timeline mock ────────────────────────────────
const DAY_MOODS = [
  // 0-5: deep sleep
  { state: 'sleepy', note: 'Deep sleep',           noteRu: 'Глубокий сон' },
  { state: 'sleepy', note: 'Deep sleep',           noteRu: 'Глубокий сон' },
  { state: 'sleepy', note: 'Deep sleep',           noteRu: 'Глубокий сон' },
  { state: 'sleepy', note: 'Deep sleep',           noteRu: 'Глубокий сон' },
  { state: 'sleepy', note: 'Deep sleep',           noteRu: 'Глубокий сон' },
  { state: 'sleepy', note: 'REM cycle',            noteRu: 'Быстрая фаза' },
  // 6-7: waking
  { state: 'sleepy', note: 'Light sleep',          noteRu: 'Лёгкий сон' },
  { state: 'calm',   note: 'Wake-up',              noteRu: 'Пробуждение' },
  // 8-9: school commute
  { state: 'active', note: 'Heading to school',    noteRu: 'По дороге в школу' },
  { state: 'calm',   note: 'Morning class',        noteRu: 'Утренний урок' },
  // 10-11: school
  { state: 'calm',   note: 'In class',             noteRu: 'На уроке' },
  { state: 'active', note: 'PE class',             noteRu: 'Физкультура' },
  // 12-13: lunch
  { state: 'active', note: 'Lunch break',          noteRu: 'Обеденная перемена' },
  { state: 'calm',   note: 'Afternoon class',      noteRu: 'Послеобеденный урок' },
  // 14: event
  { state: 'worried', note: 'HR spike — false alarm', noteRu: 'Скачок ЧСС — ложная тревога' },
  // 15-17: after-school
  { state: 'active', note: 'After-school play',    noteRu: 'Игра после школы' },
  { state: 'active', note: 'Park',                 noteRu: 'Парк' },
  { state: 'calm',   note: 'Heading home',         noteRu: 'По дороге домой' },
  // 18-20: home evening
  { state: 'calm',   note: 'Homework',             noteRu: 'Домашка' },
  { state: 'active', note: 'Dinner + family',      noteRu: 'Ужин с семьёй' },
  { state: 'calm',   note: 'Reading',              noteRu: 'Чтение' },
  // 21-23: bedtime
  { state: 'sleepy', note: 'Wind-down',            noteRu: 'Подготовка ко сну' },
  { state: 'sleepy', note: 'Bedtime',              noteRu: 'Отбой' },
  { state: 'sleepy', note: 'Asleep',               noteRu: 'Спит' },
];

const STATE_COLOR_VAR = {
  calm: 'var(--ok)',
  active: 'var(--accent)',
  sleepy: 'var(--lavender)',
  worried: 'var(--alert)',
};

// ── MOOD SCRUB — drag the playhead, Spark replays ──────────
function MoodScrub({ scrubHour, onScrub, day = DAY_MOODS }) {
  const { lang, t } = React.useContext(window.LangCtx);
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [hoverHour, setHoverHour] = useState(null);

  const update = useCallback((clientX) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const hour = Math.round((x / rect.width) * 23);
    onScrub(hour);
  }, [onScrub]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => update(e.clientX || e.touches?.[0]?.clientX);
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [dragging, update]);

  function onTrackMove(e) {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setHoverHour(Math.round((x / rect.width) * 23));
  }

  const moment = day[scrubHour] || day[0];
  const playheadPct = (scrubHour / 23) * 100;
  const hoverPct = hoverHour != null ? (hoverHour / 23) * 100 : null;

  return (
    <div className="mood-scrub">
      <div className="mood-scrub-head">
        <div>
          <span className="mono dim">{t('scrub.tag')}</span>
          <span className="mono accent">{t('scrub.mood')}</span>
        </div>
        <div className="mood-scrub-now mono dim">
          <span className="dim">{t('scrub.hint')}</span>
        </div>
      </div>

      <div className="mood-scrub-display">
        <div className="mood-card">
          <span className="mono dim">{scrubHour.toString().padStart(2,'0')}:00</span>
          <span className={`mood-card-state state-${moment.state}`}>
            <span className="mood-dot" style={{ background: STATE_COLOR_VAR[moment.state] }}></span>
            {t('mood.' + moment.state)}
          </span>
          <span className="mood-card-note">{lang === 'ru' ? moment.noteRu : moment.note}</span>
        </div>
      </div>

      <div
        className="mood-track"
        ref={trackRef}
        onMouseDown={(e) => { setDragging(true); update(e.clientX); }}
        onTouchStart={(e) => { setDragging(true); update(e.touches[0].clientX); }}
        onMouseMove={onTrackMove}
        onMouseLeave={() => setHoverHour(null)}
      >
        {/* 24 mood segments */}
        {day.map((m, i) => (
          <div
            key={i}
            className={`mood-seg seg-${m.state}`}
            style={{ background: STATE_COLOR_VAR[m.state], left: `${(i/24)*100}%`, width: `${100/24}%` }}
            title={`${i.toString().padStart(2,'0')}:00 · ${m.state} · ${m.note}`}
          ></div>
        ))}
        {/* hover indicator */}
        {hoverPct != null && !dragging && (
          <div className="mood-hover" style={{ left: `${hoverPct}%` }}></div>
        )}
        {/* playhead */}
        <div className={`mood-playhead ${dragging ? 'dragging' : ''}`} style={{ left: `${playheadPct}%` }}>
          <div className="mood-playhead-stick"></div>
          <div className="mood-playhead-handle">
            <span className="cf tl"></span>
            <span className="cf tr"></span>
            <span className="cf bl"></span>
            <span className="cf br"></span>
          </div>
        </div>
      </div>

      <div className="mood-ticks">
        {[0,3,6,9,12,15,18,21].map((h) => (
          <div key={h} className="mood-tick" style={{ left: `${(h/24)*100}%` }}>
            <span className="mono">{h.toString().padStart(2,'0')}:00</span>
          </div>
        ))}
      </div>

      <div className="mood-legend mono">
        <span><span className="leg-dot" style={{ background: STATE_COLOR_VAR.calm }}></span>{t('mood.calm')}</span>
        <span><span className="leg-dot" style={{ background: STATE_COLOR_VAR.active }}></span>{t('mood.active')}</span>
        <span><span className="leg-dot" style={{ background: STATE_COLOR_VAR.sleepy }}></span>{t('mood.sleepy')}</span>
        <span><span className="leg-dot" style={{ background: STATE_COLOR_VAR.worried }}></span>{t('mood.worried')}</span>
      </div>
    </div>
  );
}

// ── Schedule Arc — 24h circular dial ───────────────────────
function ScheduleArc({ bedStart = 21.5, bedEnd = 7, schoolStart = 8.5, schoolEnd = 14 }) {
  const { t } = React.useContext(window.LangCtx);
  const size = 280;
  const r = 110;
  const sw = 16;
  // angles: 0h = top, going clockwise. -90deg offset.
  const hourToAng = (h) => ((h / 24) * 360) - 90;

  function arcPath(startH, endH, radius) {
    // handle wrap (e.g. 21.5 → 7)
    const a1 = hourToAng(startH) * Math.PI / 180;
    const a2 = hourToAng(endH) * Math.PI / 180;
    let dur = (endH - startH + 24) % 24;
    const large = dur > 12 ? 1 : 0;
    const x1 = Math.cos(a1) * radius;
    const y1 = Math.sin(a1) * radius;
    const x2 = Math.cos(a2) * radius;
    const y2 = Math.sin(a2) * radius;
    return `M${x1},${y1} A${radius},${radius} 0 ${large} 1 ${x2},${y2}`;
  }

  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const nowAng = hourToAng(nowHour) * Math.PI / 180;
  const nowX = Math.cos(nowAng) * r;
  const nowY = Math.sin(nowAng) * r;

  return (
    <div className="sched-card panel-card">
      <div className="panel-card-head">
        <span className="mono dim">{t('sched.dial')}</span>
        <span className="mono accent">{t('sched.head')}</span>
      </div>
      <div className="sched-arc-wrap">
        <svg viewBox={`-${size/2} -${size/2} ${size} ${size}`} width={size} height={size}>
          {/* base ring */}
          <circle r={r} fill="none" stroke="var(--line)" strokeWidth={sw} />
          {/* hour marks */}
          {Array.from({length: 24}).map((_, h) => {
            const a = hourToAng(h) * Math.PI / 180;
            const x1 = Math.cos(a) * (r - sw/2);
            const y1 = Math.sin(a) * (r - sw/2);
            const x2 = Math.cos(a) * (r + sw/2);
            const y2 = Math.sin(a) * (r + sw/2);
            return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--bg)" strokeWidth={h % 3 === 0 ? 1.5 : 0.5} />;
          })}
          {/* bedtime arc */}
          <path d={arcPath(bedStart, bedEnd, r)} fill="none" stroke="var(--lavender)" strokeWidth={sw} strokeLinecap="butt" opacity={0.85} />
          {/* school arc */}
          <path d={arcPath(schoolStart, schoolEnd, r)} fill="none" stroke="var(--accent)" strokeWidth={sw} strokeLinecap="butt" opacity={0.85} />
          {/* now indicator */}
          <line x1={nowX * 0.7} y1={nowY * 0.7} x2={nowX * 1.15} y2={nowY * 1.15} stroke="var(--ink)" strokeWidth={2} />
          <circle cx={nowX * 1.15} cy={nowY * 1.15} r={5} fill="var(--bg)" stroke="var(--ink)" strokeWidth={2} />

          {/* hour labels */}
          {[0,6,12,18].map((h) => {
            const a = hourToAng(h) * Math.PI / 180;
            const x = Math.cos(a) * (r + 28);
            const y = Math.sin(a) * (r + 28) + 4;
            return (
              <text key={h} x={x} y={y} fontSize="11" fontFamily="JetBrains Mono" fill="var(--muted)" textAnchor="middle">
                {h === 0 ? '24' : h.toString().padStart(2,'0')}
              </text>
            );
          })}
          {/* center label */}
          <text x={0} y={-6} fontSize="10" fontFamily="JetBrains Mono" fill="var(--muted)" textAnchor="middle" letterSpacing="0.15em">{t('sched.now')}</text>
          <text x={0} y={14} fontSize="22" fontFamily="JetBrains Mono" fill="var(--ink)" textAnchor="middle" letterSpacing="-0.02em">
            {now.toTimeString().slice(0,5)}
          </text>
        </svg>
      </div>
      <div className="sched-rows">
        <div className="sched-row">
          <span className="sched-swatch" style={{ background: 'var(--lavender)' }}></span>
          <span className="mono dim">{t('sched.bed.label')}</span>
          <span className="mono">{fmtH(bedStart)} → {fmtH(bedEnd)}</span>
          <span className="mono dim">HAP-04</span>
        </div>
        <div className="sched-row">
          <span className="sched-swatch" style={{ background: 'var(--accent)' }}></span>
          <span className="mono dim">{t('sched.school.label')}</span>
          <span className="mono">{fmtH(schoolStart)} → {fmtH(schoolEnd)}</span>
          <span className="mono dim">{t('sched.silent')}</span>
        </div>
      </div>
    </div>
  );
}

function fmtH(h) {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh.toString().padStart(2,'0')}:${mm.toString().padStart(2,'0')}`;
}

// ── Location Map (radar-styled) ────────────────────────────
// Zones are laid out on an abstract top-down map. Coordinates are in
// the SVG's own 360×280 space — they're map positions, not GPS.
const MAP_ZONES = [
  { id: 'home',   key: 'home',   x:  56, y:  54, w: 58, h: 40, durKey: 'map.dur.home',   current: false, shape: 'rect' },
  { id: 'school', key: 'school', x: 210, y:  78, w: 76, h: 60, durKey: 'map.dur.school', current: true,  shape: 'rect' },
  { id: 'park',   key: 'park',   x: 244, y: 186, w: 62, h: 50, durKey: 'map.dur.none',   current: false, shape: 'circle' },
  { id: 'gym',    key: 'gym',    x:  44, y: 192, w: 54, h: 36, durKey: 'map.dur.none',   current: false, shape: 'rect' },
];

function LocationRadar() {
  const { t } = React.useContext(window.LangCtx);
  const W = 360, H = 280;
  // Child position: anchored inside the SCHOOL footprint
  const cx = 248, cy = 108;

  return (
    <div className="radar-card panel-card">
      <div className="panel-card-head">
        <span className="mono dim">{t('map.head')}</span>
        <span className="mono accent">{t('map.geofence')}</span>
        <span className="mono dim" style={{ marginLeft: 'auto' }}>{t('map.note')}</span>
      </div>
      <div className="radar-wrap">
        <svg className="radar-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--line)" strokeWidth="0.6" />
            </pattern>
            <pattern id="mapGridMajor" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="var(--line-2)" strokeWidth="0.6" />
            </pattern>
            <radialGradient id="rangeFade" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stopColor="var(--accent)" stopOpacity="0.10" />
              <stop offset="55%" stopColor="var(--accent)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"  stopColor="var(--accent)" stopOpacity="0.30" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <clipPath id="mapClip">
              <rect x="1" y="1" width={W - 2} height={H - 2} rx="0" />
            </clipPath>
          </defs>

          {/* frame */}
          <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="0" fill="var(--bg)" stroke="var(--line)" />

          <g clipPath="url(#mapClip)">
            {/* grid */}
            <rect x="0" y="0" width={W} height={H} fill="url(#mapGrid)" opacity="0.7" />
            <rect x="0" y="0" width={W} height={H} fill="url(#mapGridMajor)" />

            {/* abstract roads / paths */}
            <g fill="none" strokeLinecap="round">
              <path d="M -10 142 Q 110 118 200 134 T 380 158" stroke="var(--line-2)" strokeWidth="9" opacity="0.55" />
              <path d="M -10 142 Q 110 118 200 134 T 380 158" stroke="var(--bg)" strokeWidth="6" />
              <path d="M -10 142 Q 110 118 200 134 T 380 158" stroke="var(--line-2)" strokeWidth="1" strokeDasharray="4 6" />

              <path d="M 158 -10 Q 174 90 224 168 T 268 300" stroke="var(--line-2)" strokeWidth="7" opacity="0.45" />
              <path d="M 158 -10 Q 174 90 224 168 T 268 300" stroke="var(--bg)" strokeWidth="4" />

              <path d="M -10 226 L 380 232" stroke="var(--line-2)" strokeWidth="1.2" strokeDasharray="2 5" opacity="0.7" />
              <path d="M 60 -10 L 90 300" stroke="var(--line-2)" strokeWidth="1.2" strokeDasharray="2 5" opacity="0.5" />
            </g>

            {/* range rings centered on child (radar overlay) */}
            <g>
              {[42, 84, 126, 168].map((r) => (
                <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="var(--accent)" strokeOpacity="0.22" strokeDasharray="1 5" />
              ))}
              <circle cx={cx} cy={cy} r="168" fill="url(#rangeFade)" />
              {/* crosshair lines */}
              <line x1={cx - 174} y1={cy} x2={cx + 174} y2={cy} stroke="var(--accent)" strokeOpacity="0.18" strokeDasharray="1 4" />
              <line x1={cx} y1={cy - 174} x2={cx} y2={cy + 174} stroke="var(--accent)" strokeOpacity="0.18" strokeDasharray="1 4" />
            </g>

            {/* sweep beam — rotates around child position */}
            <g transform={`translate(${cx} ${cy})`}>
              <g className="radar-sweep" style={{ transformOrigin: '0 0' }}>
                <path d="M0,0 L168,0 A168,168 0 0 0 130,-106 Z" fill="url(#sweepGrad)" />
                <line x1="0" y1="0" x2="168" y2="0" stroke="var(--accent)" strokeOpacity="0.55" strokeWidth="0.8" />
              </g>
            </g>

            {/* zone footprints */}
            {MAP_ZONES.map((z) => {
              const isActive = z.current;
              const fill = isActive ? 'var(--accent)' : 'var(--surface-2)';
              const fillOp = isActive ? 0.12 : 1;
              const stroke = isActive ? 'var(--accent)' : 'var(--line-2)';
              const strokeW = isActive ? 1.6 : 1;
              const dash = isActive ? '0' : '3 3';
              const labelFill = isActive ? 'var(--accent)' : 'var(--ink-2)';
              const cxz = z.x + z.w / 2;
              const name = t('map.zone.' + z.key);
              const dur = t(z.durKey);
              return (
                <g key={z.id}>
                  {z.shape === 'circle' ? (
                    <circle cx={cxz} cy={z.y + z.h / 2} r={Math.max(z.w, z.h) / 2}
                      fill={fill} fillOpacity={fillOp} stroke={stroke} strokeWidth={strokeW} strokeDasharray={dash} />
                  ) : (
                    <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="3"
                      fill={fill} fillOpacity={fillOp} stroke={stroke} strokeWidth={strokeW} strokeDasharray={dash} />
                  )}
                  {/* label cartouche */}
                  <g transform={`translate(${cxz} ${z.y - 11})`}>
                    <rect x={-name.length * 4 - 4} y="-7" width={name.length * 8 + 8} height="12" rx="2"
                      fill="var(--bg)" stroke={stroke} strokeOpacity="0.6" strokeWidth="0.6" />
                    <text x="0" y="2" fontSize="8.5" fontFamily="JetBrains Mono" fill={labelFill}
                      textAnchor="middle" letterSpacing="0.15em" fontWeight="600">{name.toUpperCase()}</text>
                  </g>
                  <text x={cxz} y={z.y + z.h + 11} fontSize="8" fontFamily="JetBrains Mono"
                    fill="var(--muted)" textAnchor="middle" letterSpacing="0.08em">{dur.toUpperCase()}</text>
                </g>
              );
            })}

            {/* child position marker */}
            <g>
              <circle cx={cx} cy={cy} r="8" fill="var(--accent)" className="radar-pulse" opacity="0" />
              <circle cx={cx} cy={cy} r="8" fill="var(--accent)" className="radar-pulse-2" opacity="0" />
              <circle cx={cx} cy={cy} r="7" fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" />
              <circle cx={cx} cy={cy} r="2.2" fill="var(--bg)" />
              <g transform={`translate(${cx + 12} ${cy - 8})`}>
                <line x1="-6" y1="8" x2="0" y2="8" stroke="var(--accent)" strokeWidth="0.8" />
                <rect x="0" y="0" width="46" height="16" rx="2" fill="var(--bg)" stroke="var(--accent)" strokeWidth="0.8" />
                <text x="23" y="11" fontSize="9" fontFamily="JetBrains Mono" fill="var(--accent)"
                  textAnchor="middle" letterSpacing="0.18em" fontWeight="600">{t('map.misha')}</text>
              </g>
            </g>

            {/* compass rosette */}
            <g transform="translate(28 30)">
              <circle r="15" fill="var(--bg)" stroke="var(--line-2)" />
              <circle r="15" fill="none" stroke="var(--accent)" strokeOpacity="0.25" strokeDasharray="1 3" />
              <polygon points="0,-10 3,0 0,10 -3,0" fill="var(--ink-2)" />
              <polygon points="0,-10 3,0 0,0" fill="var(--accent)" />
              <text y="-17" fontSize="8" fontFamily="JetBrains Mono" fill="var(--muted)" textAnchor="middle" letterSpacing="0.15em">N</text>
            </g>

            {/* scale bar */}
            <g transform={`translate(24 ${H - 26})`}>
              <line x1="0" y1="0" x2="64" y2="0" stroke="var(--ink-2)" strokeWidth="1.2" />
              <line x1="0" y1="-3" x2="0" y2="3" stroke="var(--ink-2)" strokeWidth="1.2" />
              <line x1="32" y1="-2" x2="32" y2="2" stroke="var(--ink-2)" strokeWidth="1.2" />
              <line x1="64" y1="-3" x2="64" y2="3" stroke="var(--ink-2)" strokeWidth="1.2" />
              <text x="0" y="14" fontSize="8" fontFamily="JetBrains Mono" fill="var(--muted)" letterSpacing="0.12em">0</text>
              <text x="64" y="14" fontSize="8" fontFamily="JetBrains Mono" fill="var(--muted)" letterSpacing="0.12em" textAnchor="end">{t('map.scale')}</text>
            </g>

            {/* corner crosshairs */}
            <g stroke="var(--accent)" strokeWidth="1" opacity="0.6" fill="none">
              <path d="M 10 10 L 10 22 M 10 10 L 22 10" />
              <path d={`M ${W - 10} 10 L ${W - 10} 22 M ${W - 10} 10 L ${W - 22} 10`} />
              <path d={`M 10 ${H - 10} L 10 ${H - 22} M 10 ${H - 10} L 22 ${H - 10}`} />
              <path d={`M ${W - 10} ${H - 10} L ${W - 10} ${H - 22} M ${W - 10} ${H - 10} L ${W - 22} ${H - 10}`} />
            </g>

            {/* coord readout */}
            <text x={W - 14} y={H - 12} fontSize="8" fontFamily="JetBrains Mono" fill="var(--muted)"
              textAnchor="end" letterSpacing="0.15em">{t('map.coord')}</text>
          </g>
        </svg>
      </div>
      <div className="radar-meta mono">
        <span className="dim">{t('map.current')}</span>
        <span className="accent">{t('map.current.val')}</span>
        <span className="dim">·</span>
        <span>{t('map.arrived')}</span>
        <span className="dim" style={{ marginLeft: 'auto' }}>{t('map.updated')}</span>
      </div>
    </div>
  );
}

// ── Activity Tape — vertical punched-tape event log ────────
const EVENTS = [
  { id: 1, t: '—',         tKey: 'tape.just',     kind: 'touch',  msgKey: 'ev.hug',     hap: 'HAP-03', glyph: '♥' },
  { id: 2, t: '08:42',                            kind: 'geo',    msgKey: 'ev.arrive',  hap: 'ZONE',   glyph: '▸' },
  { id: 3, t: '14:21',                            kind: 'sos',    msgKey: 'ev.sos',     hap: 'HAP-01', glyph: '!' },
  { id: 4, t: '14:23',                            kind: 'sos-ok', msgKey: 'ev.sos.ok',  hap: 'ACK',    glyph: '○' },
  { id: 5, t: '14:55',                            kind: 'touch',  msgKey: 'ev.hug',     hap: 'HAP-03', glyph: '♥' },
  { id: 6, t: '16:21',                            kind: 'spike',  msgKey: 'ev.spike',   hap: 'WATCH',  glyph: '↗' },
  { id: 7, t: '19:30',                            kind: 'geo',    msgKey: 'ev.leave',   hap: 'ZONE',   glyph: '◂' },
];

function ActivityTape() {
  const { t } = React.useContext(window.LangCtx);
  return (
    <div className="tape-card panel-card">
      <div className="panel-card-head">
        <span className="mono dim">{t('tape.head')}</span>
        <span className="mono accent">{t('tape.today')}</span>
        <span className="mono dim" style={{ marginLeft: 'auto' }}>{EVENTS.length} {t('tape.entries')}</span>
      </div>
      <div className="tape-strip">
        {EVENTS.map((e) => (
          <div key={e.id} className={`tape-row tape-${e.kind}`}>
            <div className="tape-time mono">{e.tKey ? t(e.tKey) : e.t}</div>
            <div className="tape-glyph">{e.glyph}</div>
            <div className="tape-msg">{t(e.msgKey)}</div>
            <div className="tape-hap mono dim">{e.hap}</div>
            <div className="tape-waveform">
              <Waveform kind={e.kind} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// HAP waveform: 14 vertical bars representing pulse pattern
const WAVE_PATTERNS = {
  touch:  [0,0,3,2,0,0,3,2,0,0,0,0,0,0],          // 2 soft taps (HAP-03)
  sos:    [2,3,2,0,3,3,3,0,2,3,2,0,0,0],          // morse SOS
  geo:    [1,1,1,1,1,1,0,0,0,0,0,0,0,0],          // continuous low
  'sos-ok': [0,0,0,0,1,1,0,0,0,0,0,0,0,0],
  spike:  [0,0,3,3,3,3,3,3,3,0,0,0,0,0],
};

function Waveform({ kind }) {
  const data = WAVE_PATTERNS[kind] || WAVE_PATTERNS.touch;
  return (
    <svg viewBox="0 0 70 18" width="70" height="18" className="waveform">
      {data.map((v, i) => (
        <rect key={i} x={i * 5} y={9 - v} width={3} height={v * 2} fill="currentColor" opacity={v ? 0.8 : 0.15} />
      ))}
    </svg>
  );
}

window.MoodScrub = MoodScrub;
window.ScheduleArc = ScheduleArc;
window.LocationRadar = LocationRadar;
window.ActivityTape = ActivityTape;
window.DAY_MOODS = DAY_MOODS;
window.STATE_COLOR_VAR = STATE_COLOR_VAR;

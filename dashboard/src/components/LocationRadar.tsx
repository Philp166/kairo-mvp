import { useT } from '../lib/i18n'

/* ── Types ─────────────────────────────────────────────────── */

export interface RadarZone {
  id: string
  name: string
  kind: string
  active: boolean
  lastEvent?: { type: string; ts: string }
}

export interface LocationRadarProps {
  zones: RadarZone[]
  currentPlace: string
  currentDuration: string
  childName: string
  lastSync: string
}

/* ── SVG layout slots — fixed positions for up to 4 zones ── */

interface LayoutSlot {
  x: number; y: number; w: number; h: number; shape: 'rect' | 'circle'
}

const LAYOUT_SLOTS: LayoutSlot[] = [
  { x:  56, y:  54, w: 58, h: 40, shape: 'rect' },
  { x: 210, y:  78, w: 76, h: 60, shape: 'rect' },
  { x: 244, y: 186, w: 62, h: 50, shape: 'circle' },
  { x:  44, y: 192, w: 54, h: 36, shape: 'rect' },
]

/* ── Component ─────────────────────────────────────────────── */

export default function LocationRadar({
  zones,
  currentPlace,
  currentDuration,
  childName,
  lastSync,
}: LocationRadarProps) {
  const { t } = useT()
  const W = 360
  const H = 280

  const currentIdx = zones.findIndex(
    (z) => z.name === currentPlace || z.kind === 'school',
  )
  const childSlot = LAYOUT_SLOTS[Math.max(0, currentIdx)] ?? LAYOUT_SLOTS[1]
  const cx = childSlot.x + childSlot.w / 2
  const cy = childSlot.y + childSlot.h / 2

  return (
    <div className="radar-card panel-card">
      <div className="panel-card-head">
        <span className="mono dim">{t('map.head')}</span>
        <span className="mono accent">{t('map.geofence')}</span>
        <span className="mono dim" style={{ marginLeft: 'auto' }}>
          {t('map.note')}
        </span>
      </div>
      <div className="radar-wrap">
        <svg
          className="radar-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--line)" strokeWidth="0.6" />
            </pattern>
            <pattern id="mapGridMajor" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="var(--line-2)" strokeWidth="0.6" />
            </pattern>
            <radialGradient id="rangeFade" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.10} />
              <stop offset="55%" stopColor="var(--accent)" stopOpacity={0.04} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </radialGradient>
            <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.30} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
            <clipPath id="mapClip">
              <rect x="1" y="1" width={W - 2} height={H - 2} rx="0" />
            </clipPath>
          </defs>

          <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="0" fill="var(--bg)" stroke="var(--line)" />

          <g clipPath="url(#mapClip)">
            <rect x="0" y="0" width={W} height={H} fill="url(#mapGrid)" opacity={0.7} />
            <rect x="0" y="0" width={W} height={H} fill="url(#mapGridMajor)" />

            {/* abstract roads */}
            <g fill="none" strokeLinecap="round">
              <path d="M -10 142 Q 110 118 200 134 T 380 158" stroke="var(--line-2)" strokeWidth="9" opacity={0.55} />
              <path d="M -10 142 Q 110 118 200 134 T 380 158" stroke="var(--bg)" strokeWidth="6" />
              <path d="M -10 142 Q 110 118 200 134 T 380 158" stroke="var(--line-2)" strokeWidth="1" strokeDasharray="4 6" />
              <path d="M 158 -10 Q 174 90 224 168 T 268 300" stroke="var(--line-2)" strokeWidth="7" opacity={0.45} />
              <path d="M 158 -10 Q 174 90 224 168 T 268 300" stroke="var(--bg)" strokeWidth="4" />
              <path d="M -10 226 L 380 232" stroke="var(--line-2)" strokeWidth="1.2" strokeDasharray="2 5" opacity={0.7} />
              <path d="M 60 -10 L 90 300" stroke="var(--line-2)" strokeWidth="1.2" strokeDasharray="2 5" opacity={0.5} />
            </g>

            {/* range rings */}
            <g>
              {[42, 84, 126, 168].map((ringR) => (
                <circle key={ringR} cx={cx} cy={cy} r={ringR} fill="none" stroke="var(--accent)" strokeOpacity={0.22} strokeDasharray="1 5" />
              ))}
              <circle cx={cx} cy={cy} r={168} fill="url(#rangeFade)" />
              <line x1={cx - 174} y1={cy} x2={cx + 174} y2={cy} stroke="var(--accent)" strokeOpacity={0.18} strokeDasharray="1 4" />
              <line x1={cx} y1={cy - 174} x2={cx} y2={cy + 174} stroke="var(--accent)" strokeOpacity={0.18} strokeDasharray="1 4" />
            </g>

            {/* sweep beam */}
            <g transform={`translate(${cx} ${cy})`}>
              <g className="radar-sweep" style={{ transformOrigin: '0 0' }}>
                <path d="M0,0 L168,0 A168,168 0 0 0 130,-106 Z" fill="url(#sweepGrad)" />
                <line x1="0" y1="0" x2="168" y2="0" stroke="var(--accent)" strokeOpacity={0.55} strokeWidth="0.8" />
              </g>
            </g>

            {/* zone footprints from props */}
            {zones.map((z, i) => {
              const slot = LAYOUT_SLOTS[i % LAYOUT_SLOTS.length]
              if (!slot) return null
              const isCurrent = z.name === currentPlace
              const fill = isCurrent ? 'var(--accent)' : 'var(--surface-2)'
              const fillOp = isCurrent ? 0.12 : 1
              const stroke = isCurrent ? 'var(--accent)' : 'var(--line-2)'
              const strokeW = isCurrent ? 1.6 : 1
              const dash = isCurrent ? '0' : '3 3'
              const labelFill = isCurrent ? 'var(--accent)' : 'var(--ink-2)'
              const cxz = slot.x + slot.w / 2
              const name = z.name.toUpperCase()
              const dur = z.lastEvent ? z.lastEvent.ts.toUpperCase() : '— TODAY'
              return (
                <g key={z.id}>
                  {slot.shape === 'circle' ? (
                    <circle cx={cxz} cy={slot.y + slot.h / 2} r={Math.max(slot.w, slot.h) / 2}
                      fill={fill} fillOpacity={fillOp} stroke={stroke} strokeWidth={strokeW} strokeDasharray={dash} />
                  ) : (
                    <rect x={slot.x} y={slot.y} width={slot.w} height={slot.h} rx="3"
                      fill={fill} fillOpacity={fillOp} stroke={stroke} strokeWidth={strokeW} strokeDasharray={dash} />
                  )}
                  <g transform={`translate(${cxz} ${slot.y - 11})`}>
                    <rect x={-name.length * 4 - 4} y="-7" width={name.length * 8 + 8} height="12" rx="2"
                      fill="var(--bg)" stroke={stroke} strokeOpacity={0.6} strokeWidth="0.6" />
                    <text x="0" y="2" fontSize="8.5" fontFamily="JetBrains Mono" fill={labelFill}
                      textAnchor="middle" letterSpacing="0.15em" fontWeight="600">{name}</text>
                  </g>
                  <text x={cxz} y={slot.y + slot.h + 11} fontSize="8" fontFamily="JetBrains Mono"
                    fill="var(--muted)" textAnchor="middle" letterSpacing="0.08em">{dur}</text>
                </g>
              )
            })}

            {/* child marker */}
            <g>
              <circle cx={cx} cy={cy} r={8} fill="var(--accent)" className="radar-pulse" opacity={0} />
              <circle cx={cx} cy={cy} r={8} fill="var(--accent)" className="radar-pulse-2" opacity={0} />
              <circle cx={cx} cy={cy} r={7} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2} />
              <circle cx={cx} cy={cy} r={2.2} fill="var(--bg)" />
              <g transform={`translate(${cx + 12} ${cy - 8})`}>
                <line x1="-6" y1="8" x2="0" y2="8" stroke="var(--accent)" strokeWidth="0.8" />
                <rect x="0" y="0" width="46" height="16" rx="2" fill="var(--bg)" stroke="var(--accent)" strokeWidth="0.8" />
                <text x="23" y="11" fontSize="9" fontFamily="JetBrains Mono" fill="var(--accent)"
                  textAnchor="middle" letterSpacing="0.18em" fontWeight="600">{childName.toUpperCase()}</text>
              </g>
            </g>

            {/* compass */}
            <g transform="translate(28 30)">
              <circle r={15} fill="var(--bg)" stroke="var(--line-2)" />
              <circle r={15} fill="none" stroke="var(--accent)" strokeOpacity={0.25} strokeDasharray="1 3" />
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
            <g stroke="var(--accent)" strokeWidth="1" opacity={0.6} fill="none">
              <path d="M 10 10 L 10 22 M 10 10 L 22 10" />
              <path d={`M ${W - 10} 10 L ${W - 10} 22 M ${W - 10} 10 L ${W - 22} 10`} />
              <path d={`M 10 ${H - 10} L 10 ${H - 22} M 10 ${H - 10} L 22 ${H - 10}`} />
              <path d={`M ${W - 10} ${H - 10} L ${W - 10} ${H - 22} M ${W - 10} ${H - 10} L ${W - 22} ${H - 10}`} />
            </g>
          </g>
        </svg>
      </div>
      <div className="radar-meta mono">
        <span className="dim">CURRENT</span>
        <span className="accent">{currentPlace.toUpperCase()} · {currentDuration.toUpperCase()}</span>
        <span className="dim" style={{ marginLeft: 'auto' }}>UPDATED {lastSync.toUpperCase()}</span>
      </div>
    </div>
  )
}

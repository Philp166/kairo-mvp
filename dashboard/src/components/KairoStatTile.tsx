import type { FC, ReactNode } from 'react'

/* ── StatTile ─────────────────────────────────────────────── */

export interface StatTileProps {
  slot: string
  label: string
  value: string | number
  unit: string
  sub: string
  color?: string
  children?: ReactNode
}

export const StatTile: FC<StatTileProps> = ({
  slot,
  label,
  value,
  unit,
  sub,
  color = 'var(--ink)',
  children,
}) => (
  <div className="stat-tile">
    <div className="stat-head">
      <span className="mono dim">SLOT/{slot}</span>
    </div>
    <div className="stat-label mono">{label}</div>
    <div className="stat-value">
      <span className="stat-num" style={{ color }}>
        {value}
      </span>
      <span className="stat-unit mono">{unit}</span>
    </div>
    <div className="stat-sub mono">{sub}</div>
    {children}
  </div>
)

/* ── HrvGauge ─────────────────────────────────────────────── */

export interface HrvGaugeProps {
  value?: number
  min?: number
  max?: number
}

export const HrvGauge: FC<HrvGaugeProps> = ({
  value = 42,
  min = 20,
  max = 80,
}) => {
  const pct = (value - min) / (max - min)
  const ang = -Math.PI + pct * Math.PI
  const r = 50
  const cx = Math.cos(ang) * r
  const cy = Math.sin(ang) * r

  // background arc: full semicircle from left to right
  const bgArc = `M-${r},0 A${r},${r} 0 0 1 ${r},0`

  // filled arc: from left to current angle position
  // use large-arc flag when pct > 0.5
  const largeArc = pct > 0.5 ? 1 : 0
  const filledArc = `M-${r},0 A${r},${r} 0 ${largeArc} 1 ${cx},${cy}`

  return (
    <svg
      viewBox="-60 -56 120 64"
      width="120"
      height="64"
      className="hrv-gauge"
    >
      {/* background arc */}
      <path d={bgArc} fill="none" stroke="var(--line)" strokeWidth={3} />

      {/* filled arc */}
      <path
        d={filledArc}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* dot at current position */}
      <circle cx={cx} cy={cy} r={4} fill="var(--accent)" />
    </svg>
  )
}

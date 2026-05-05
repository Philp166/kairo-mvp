/**
 * Wear-time compliance ring — shown to parents per spec §4.5
 * (capacitive electrode reports wear/no-wear).
 */

interface WearTimeRingProps {
  /** 0..1 fraction of waking hours the watch was worn. */
  pct: number
  size?: number
  label?: string
}

export function WearTimeRing({ pct, size = 56, label }: WearTimeRingProps) {
  const r = size / 2 - 4
  const c = 2 * Math.PI * r
  const dash = c * Math.min(1, Math.max(0, pct))
  const display = Math.round(pct * 100)
  const color =
    pct >= 0.8 ? '#34C759' : pct >= 0.5 ? '#FF9500' : '#FF3B30'

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f1f1f3"
          strokeWidth={4}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      {label !== undefined && (
        <div className="leading-tight">
          <div className="text-[11px] uppercase tracking-[0.1em] text-app-muted">{label}</div>
          <div className="text-base font-semibold tabular">{display}%</div>
        </div>
      )}
    </div>
  )
}

export default WearTimeRing

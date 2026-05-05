/**
 * Sleep architecture card — visualises last night's sleep epochs as a stacked
 * timeline (Wake / Light / Deep / REM) per spec §5.3.
 */

export type SleepStage = 'wake' | 'light' | 'deep' | 'rem'

export interface SleepEpoch {
  /** Minutes since sleep onset (or any monotonic offset). */
  t: number
  stage: SleepStage
}

export interface SleepNight {
  bedTime: string // "22:30"
  wakeTime: string // "07:42"
  totalMin: number
  epochs: SleepEpoch[]
  rmssdMs: number // overnight HRV
  awakenings: number
  latencyMin: number
}

const stageMeta: Record<
  SleepStage,
  { label: string; color: string; row: number; rowH: number }
> = {
  wake: { label: 'Awake', color: '#FF9500', row: 0, rowH: 12 },
  rem: { label: 'REM', color: '#AF52DE', row: 1, rowH: 12 },
  light: { label: 'Light', color: '#5AC8FA', row: 2, rowH: 12 },
  deep: { label: 'Deep', color: '#0A4D9D', row: 3, rowH: 12 },
}

function computeSleepScore(n: SleepNight): number {
  // 0..100, deductions per Oura-style heuristic
  const deepMin = n.epochs.filter((e) => e.stage === 'deep').length * 5
  const remMin = n.epochs.filter((e) => e.stage === 'rem').length * 5
  const wakeMin = n.epochs.filter((e) => e.stage === 'wake').length * 5
  let score = 100
  if (n.totalMin < 480) score -= Math.min(20, ((480 - n.totalMin) / 480) * 60)
  if (deepMin / n.totalMin < 0.13) score -= 10
  if (remMin / n.totalMin < 0.18) score -= 10
  if (n.awakenings > 3) score -= Math.min(15, (n.awakenings - 3) * 4)
  if (n.latencyMin > 25) score -= 8
  if (wakeMin / n.totalMin > 0.08) score -= 8
  return Math.max(0, Math.min(100, Math.round(score)))
}

function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export function SleepCard({ night }: { night: SleepNight }) {
  const score = computeSleepScore(night)
  const W = 480
  const H = 96
  const padX = 8
  const innerW = W - padX * 2
  const epochCount = night.epochs.length
  const epochW = innerW / epochCount

  const totals = (['deep', 'rem', 'light', 'wake'] as SleepStage[]).map((s) => {
    const m = night.epochs.filter((e) => e.stage === s).length * 5
    return { stage: s, min: m, pct: Math.round((m / night.totalMin) * 100) }
  })

  return (
    <div>
      <div className="flex items-baseline gap-6 mb-4 tabular flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-app-muted">Sleep score</div>
          <div className="text-2xl font-semibold tracking-tight">
            {score}
            <span className="text-sm text-app-muted font-normal ml-1">/ 100</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-app-muted">Total</div>
          <div className="text-base font-medium text-app-ink-2">{fmtDuration(night.totalMin)}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-app-muted">HRV (night)</div>
          <div className="text-base font-medium text-app-ink-2">
            {night.rmssdMs} <span className="text-xs text-app-muted">ms</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-app-muted">Wake-ups</div>
          <div className="text-base font-medium text-app-ink-2">{night.awakenings}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-[11px] uppercase tracking-[0.1em] text-app-muted">Sleep</div>
          <div className="text-sm font-medium tabular">
            {night.bedTime} → {night.wakeTime}
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
        role="img"
        aria-label="Sleep stages"
      >
        {/* row labels (4 rows: wake top, rem, light, deep bottom) */}
        {(['wake', 'rem', 'light', 'deep'] as SleepStage[]).map((s, i) => {
          const y = 12 + i * 18
          return (
            <g key={s}>
              <line x1={padX} y1={y + 6} x2={W - padX} y2={y + 6} stroke="#f1f1f3" strokeWidth={1} />
              <text x={padX} y={y - 2} fontSize={9} fill="#86868b">
                {stageMeta[s].label}
              </text>
            </g>
          )
        })}

        {/* epochs as small rects on the row of their stage */}
        {night.epochs.map((e, i) => {
          const meta = stageMeta[e.stage]
          const rowIdx = e.stage === 'wake' ? 0 : e.stage === 'rem' ? 1 : e.stage === 'light' ? 2 : 3
          const y = 12 + rowIdx * 18
          return (
            <rect
              key={i}
              x={padX + i * epochW}
              y={y}
              width={Math.max(epochW, 1)}
              height={10}
              fill={meta.color}
              rx={1}
            />
          )
        })}
      </svg>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {totals.map(({ stage, min, pct }) => (
          <div key={stage} className="flex items-center gap-2">
            <span
              className="size-2 rounded-full shrink-0"
              style={{ background: stageMeta[stage].color }}
            />
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.08em] text-app-muted">
                {stageMeta[stage].label}
              </div>
              <div className="text-sm font-medium tabular">
                {fmtDuration(min)} <span className="text-app-muted">· {pct}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SleepCard

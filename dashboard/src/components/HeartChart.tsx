interface HeartChartProps {
  /** Series of HR values, oldest → newest. */
  data: number[]
  /** Pediatric reference: typical resting baseline (drawn as a dashed mid-line). */
  baseline?: number
  /** X-axis tick labels { i, label } where i is the index into data. */
  xLabels?: { i: number; label: string }[]
}

const W = 480
const H = 200
const PAD_X = 28
const PAD_Y_TOP = 12
const PAD_Y_BOT = 24

const Y_MIN = 50
const Y_MAX = 130

function yScale(v: number) {
  const innerH = H - PAD_Y_TOP - PAD_Y_BOT
  return PAD_Y_TOP + innerH - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * innerH
}
function xScale(i: number, n: number) {
  const innerW = W - PAD_X * 2
  return PAD_X + (i / (n - 1)) * innerW
}

export function HeartChart({ data, baseline, xLabels }: HeartChartProps) {
  if (data.length < 2) return null

  const points = data.map((v, i) => [xScale(i, data.length), yScale(v)] as const)
  const lineD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  const areaD = `${lineD} L ${xScale(data.length - 1, data.length)} ${H - PAD_Y_BOT} L ${PAD_X} ${H - PAD_Y_BOT} Z`

  const yTicks = [60, 80, 100, 120]
  const ticks = xLabels ?? [
    { i: 0, label: '00' },
    { i: Math.floor(data.length * 0.25), label: '06' },
    { i: Math.floor(data.length * 0.5), label: '12' },
    { i: Math.floor(data.length * 0.75), label: '18' },
    { i: data.length - 1, label: '24' },
  ]

  const min = Math.min(...data)
  const max = Math.max(...data)
  const avg = Math.round(data.reduce((a, b) => a + b, 0) / data.length)

  return (
    <div>
      <div className="flex items-baseline gap-6 mb-3 tabular">
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-app-muted">Average</div>
          <div className="text-2xl font-semibold tracking-tight">
            {avg} <span className="text-sm text-app-muted font-normal">bpm</span>
          </div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-app-muted">Range</div>
          <div className="text-base font-medium text-app-ink-2">
            {min}–{max}
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        preserveAspectRatio="none"
        role="img"
        aria-label="Heart rate today"
      >
        <defs>
          <linearGradient id="hr-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF3B30" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FF3B30" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={PAD_X}
              y1={yScale(v)}
              x2={W - PAD_X}
              y2={yScale(v)}
              stroke="#e5e5ea"
              strokeWidth={1}
              strokeDasharray="2 4"
            />
            <text
              x={PAD_X - 8}
              y={yScale(v) + 3}
              textAnchor="end"
              fontSize={10}
              fill="#86868b"
            >
              {v}
            </text>
          </g>
        ))}

        {baseline && (
          <line
            x1={PAD_X}
            y1={yScale(baseline)}
            x2={W - PAD_X}
            y2={yScale(baseline)}
            stroke="#86868b"
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.4}
          />
        )}

        <path d={areaD} fill="url(#hr-area)" />
        <path
          d={lineD}
          fill="none"
          stroke="#FF3B30"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {ticks.map(({ i, label }) => (
          <text
            key={label}
            x={xScale(i, data.length)}
            y={H - 6}
            textAnchor="middle"
            fontSize={10}
            fill="#86868b"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  )
}

export default HeartChart

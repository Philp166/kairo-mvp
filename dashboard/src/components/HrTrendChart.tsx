import type { FC } from 'react'
import { useT } from '../lib/i18n'

export interface HrTrendChartProps {
  data: number[]
  scrubHour?: number | null
}

const HrTrendChart: FC<HrTrendChartProps> = ({ data, scrubHour = null }) => {
  const { t } = useT()

  const w = 720
  const h = 180
  const min = 40
  const max = 140

  const norm = (v: number) => h - 16 - ((v - min) / (max - min)) * (h - 32)
  const step = w / (data.length - 1)

  const pts = data.map((v, i) => `${i * step},${norm(v)}`)
  const areaPath =
    `M0,${h - 12} ` + pts.map((p) => 'L' + p).join(' ') + ` L${w},${h - 12} Z`
  const linePath = 'M' + pts.join(' L')

  return (
    <div className="hr-trend">
      <div className="hr-trend-head">
        <div>
          <span className="mono dim">CHART/</span>
          <span className="mono accent">{t('hr.head.label')}</span>
        </div>
        <div className="mono dim">{t('hr.thresh')}</div>
      </div>

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="hr-trend-svg"
        preserveAspectRatio="none"
      >
        {/* sleep zone shading: hours 0-6 */}
        <rect
          x={0}
          y={0}
          width={6 * step}
          height={h - 12}
          fill="var(--lavender)"
          opacity={0.06}
        />
        {/* sleep zone shading: hours 21-24 */}
        <rect
          x={21 * step}
          y={0}
          width={3 * step}
          height={h - 12}
          fill="var(--lavender)"
          opacity={0.06}
        />

        {/* pediatric threshold at 120 bpm */}
        <line
          x1={0}
          y1={norm(120)}
          x2={w}
          y2={norm(120)}
          stroke="var(--alert)"
          strokeOpacity={0.5}
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        {/* baseline at 78 bpm */}
        <line
          x1={0}
          y1={norm(78)}
          x2={w}
          y2={norm(78)}
          stroke="var(--muted)"
          strokeOpacity={0.3}
          strokeWidth={1}
          strokeDasharray="2 4"
        />

        {/* area fill */}
        <path d={areaPath} fill="var(--accent)" opacity="0.12" />

        {/* line stroke */}
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth={1.6} />

        {/* hour ticks */}
        {[0, 3, 6, 9, 12, 15, 18, 21].map((hr) => (
          <g key={hr}>
            <line
              x1={hr * step}
              y1={h - 12}
              x2={hr * step}
              y2={h - 8}
              stroke="var(--muted)"
              strokeOpacity={0.5}
              strokeWidth={0.5}
            />
            <text
              x={hr * step}
              y={h - 1}
              fontSize="9"
              fill="var(--muted)"
              textAnchor="middle"
              fontFamily="JetBrains Mono"
            >
              {hr.toString().padStart(2, '0')}
            </text>
          </g>
        ))}

        {/* scrub highlight */}
        {scrubHour != null && (
          <g>
            <line
              x1={scrubHour * step}
              y1={0}
              x2={scrubHour * step}
              y2={h - 12}
              stroke="var(--accent)"
              strokeWidth={1.5}
            />
            <circle
              cx={scrubHour * step}
              cy={norm(data[scrubHour])}
              r={4}
              fill="var(--accent)"
            />
            {/* glow circle */}
            <circle
              cx={scrubHour * step}
              cy={norm(data[scrubHour])}
              r={7}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={1}
              opacity={0.5}
            />
          </g>
        )}
      </svg>

      <div className="hr-trend-legend mono">
        <span>
          <span className="leg leg-area" />
          {t('hr.leg.hr')}
        </span>
        <span>
          <span className="leg leg-thresh" />
          {t('hr.leg.thresh')}
        </span>
        <span>
          <span className="leg leg-base" />
          {t('hr.leg.base')}
        </span>
        <span>
          <span className="leg leg-sleep" />
          {t('hr.leg.sleep')}
        </span>
      </div>
    </div>
  )
}

export default HrTrendChart

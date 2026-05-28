import type { FC } from 'react'

export interface MicroSparkProps {
  data: number[]
  color?: string
  w?: number
  h?: number
  highlight?: number | null
}

const MicroSpark: FC<MicroSparkProps> = ({
  data,
  color = 'var(--accent)',
  w = 200,
  h = 44,
  highlight = null,
}) => {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const norm = (v: number) => h - 4 - ((v - min) / (max - min || 1)) * (h - 8)
  const step = w / (data.length - 1)

  const pts = data.map((v, i) => `${i * step},${norm(v)}`)
  const areaPath =
    `M0,${h} ` + pts.map((p) => 'L' + p).join(' ') + ` L${w},${h} Z`
  const linePath = 'M' + pts.join(' L')

  const gradId = `g-${color.replace(/[^a-z0-9]/gi, '')}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="100%"
      height={h}
      className="micro-spark"
      preserveAspectRatio="none"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={0.25} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* line stroke */}
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.2} />

      {/* tick marks at hours */}
      {[0, 6, 12, 18, 23].map((i) => (
        <line
          key={i}
          x1={i * step}
          y1={h - 2}
          x2={i * step}
          y2={h}
          stroke="var(--muted)"
          strokeOpacity={0.4}
          strokeWidth={0.5}
        />
      ))}

      {/* last-point dot */}
      <circle
        cx={(data.length - 1) * step}
        cy={norm(data[data.length - 1])}
        r={2.5}
        fill={color}
      />

      {/* highlight scrub line */}
      {highlight != null && (
        <line
          x1={highlight * step}
          y1={0}
          x2={highlight * step}
          y2={h}
          stroke={color}
          strokeOpacity={0.6}
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      )}
    </svg>
  )
}

export default MicroSpark

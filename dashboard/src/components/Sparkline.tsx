interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
  fill?: boolean
}

export function Sparkline({
  data,
  color = 'currentColor',
  width = 80,
  height = 24,
  fill = false,
}: SparklineProps) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 2) - 1
    return [x, y] as const
  })
  const lineD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
  const areaD = `${lineD} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      {fill && <path d={areaD} fill={color} opacity={0.12} />}
      <path
        d={lineD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Sparkline

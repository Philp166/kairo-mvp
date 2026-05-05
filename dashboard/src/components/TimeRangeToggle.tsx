export type TimeRange = '1d' | '7d' | '30d'

interface TimeRangeToggleProps {
  value: TimeRange
  onChange: (v: TimeRange) => void
}

const ranges: { id: TimeRange; label: string }[] = [
  { id: '1d', label: 'Day' },
  { id: '7d', label: 'Week' },
  { id: '30d', label: 'Month' },
]

export function TimeRangeToggle({ value, onChange }: TimeRangeToggleProps) {
  return (
    <div className="inline-flex rounded-full bg-app-line/70 p-0.5">
      {ranges.map((r) => (
        <button
          key={r.id}
          onClick={() => onChange(r.id)}
          className={`text-xs cursor-pointer px-3 py-1 rounded-full transition-colors duration-200 ${
            r.id === value
              ? 'bg-app-surface text-app-ink shadow-sm'
              : 'text-app-muted hover:text-app-ink'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

export default TimeRangeToggle

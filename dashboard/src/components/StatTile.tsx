import type { ReactNode } from 'react'

export type StatStatus = 'normal' | 'good' | 'attention'

interface StatTileProps {
  label: string
  value: string | number
  unit?: string
  hint?: string
  status?: StatStatus
  icon?: ReactNode
  accent?: string
  chart?: ReactNode
}

const hintColor: Record<StatStatus, string> = {
  normal: 'text-app-muted',
  good: 'text-app-green',
  attention: 'text-app-red',
}

export function StatTile({
  label,
  value,
  unit,
  hint,
  status = 'normal',
  icon,
  accent = 'text-app-muted',
  chart,
}: StatTileProps) {
  return (
    <div className="rounded-2xl bg-app-surface border border-app-line p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {icon && <span className={`shrink-0 ${accent}`}>{icon}</span>}
        <span className="text-[13px] font-medium text-app-ink-2">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1.5 tabular">
          <span className="text-[34px] leading-none font-semibold tracking-tight text-app-ink">
            {value}
          </span>
          {unit && <span className="text-sm text-app-muted">{unit}</span>}
        </div>
        {chart && <div className={`shrink-0 ${accent}`}>{chart}</div>}
      </div>
      {hint && <div className={`text-xs ${hintColor[status]}`}>{hint}</div>}
    </div>
  )
}

export default StatTile

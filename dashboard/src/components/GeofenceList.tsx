/**
 * Geofence zones list — per spec §4.11 (geozone notifications via clip-on
 * cellular). Spec doesn't define schema; we invent: circular zones, 50m–2km.
 */

import { HomeIcon, PinIcon, SchoolIcon } from './icons'

export interface GeoZone {
  id: string
  name: string
  kind: 'home' | 'school' | 'park' | 'custom'
  radiusM: number
  /** True if alerts on enter/exit are enabled. Visualised, not editable here. */
  active: boolean
  lastEvent?: { type: 'enter' | 'exit'; ts: string }
}

const kindIcon = {
  home: HomeIcon,
  school: SchoolIcon,
  park: PinIcon,
  custom: PinIcon,
} as const

interface GeofenceListProps {
  zones: GeoZone[]
  /** id of zone the child is currently inside, if any. */
  currentZoneId?: string
  /** time spent in the current zone, e.g. "1 ч 14 мин" */
  currentDuration?: string
}

export function GeofenceList({ zones, currentZoneId, currentDuration }: GeofenceListProps) {
  return (
    <div className="space-y-2">
      {zones.map((z) => {
        const Icon = kindIcon[z.kind]
        const last = z.lastEvent
        const isHere = z.id === currentZoneId
        return (
          <div
            key={z.id}
            className={`flex items-center gap-3 rounded-xl border p-3.5 ${
              isHere
                ? 'border-app-green/40 bg-app-green/5'
                : 'border-app-line bg-app-surface'
            }`}
          >
            <span
              className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                isHere ? 'bg-app-green/15 text-app-green' : 'bg-app-line text-app-muted'
              }`}
            >
              <Icon width={16} height={16} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-app-ink truncate">{z.name}</span>
                {isHere && (
                  <span className="text-[10px] uppercase tracking-[0.08em] font-medium text-app-green bg-app-green/10 rounded-full px-1.5 py-0.5">
                    here{currentDuration ? ` · ${currentDuration}` : ''}
                  </span>
                )}
              </div>
              <div className="text-xs text-app-muted">
                radius {z.radiusM < 1000 ? `${z.radiusM} m` : `${(z.radiusM / 1000).toFixed(1)} km`}
                {last && (
                  <>
                    {' · '}
                    <span className={last.type === 'enter' ? 'text-app-green' : 'text-app-muted'}>
                      {last.type === 'enter' ? 'entered' : 'left'} {last.ts}
                    </span>
                  </>
                )}
                {!z.active && ' · alerts off'}
              </div>
            </div>
          </div>
        )
      })}

      <button className="cursor-pointer w-full rounded-xl border border-dashed border-app-line-2 px-3.5 py-3 text-sm text-app-muted hover:text-app-ink hover:border-app-ink/30 transition-colors duration-200">
        + Add zone
      </button>
    </div>
  )
}

export default GeofenceList

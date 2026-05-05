/**
 * Geofence map — zone-based, not surveillance.
 *
 * Spec is explicit (§ ethics): "Kairo measures physiological signals for
 * health, not for surveillance. The system cannot do what it was not built
 * to do." We deliberately do NOT show precise GPS coordinates or a moving
 * dot. The parent sees only:
 *   - Which configured geofence the child is currently inside (if any)
 *   - The zone outlines on a static map for spatial context
 *   - When the band last reported (so they know data is fresh)
 *
 * The phone/clip-on knows lat/lng to compute zone membership; the parent app
 * does not need it, so we don't show it.
 */

import { useEffect, useState } from 'react'

interface LiveMapProps {
  /** Centre of the map view — usually the home zone */
  lat: number
  lng: number
  /** Bounding box span in degrees — controls zoom */
  spanDeg?: number
  /** "home" / "school" / "between" — driven by zone membership, not GPS */
  zoneStatus: 'home' | 'school' | 'between'
  /** Display name of the zone the child is in (e.g. "School No.42"). null when between. */
  currentZoneName?: string | null
  /** Time spent in current zone */
  currentDuration?: string
  /** Last time we got a fresh fix from the band */
  fixAgo?: string
}

const STATUS_META: Record<
  LiveMapProps['zoneStatus'],
  { label: string; color: string; bgClass: string; textClass: string }
> = {
  home: {
    label: 'At home',
    color: '#34C759',
    bgClass: 'bg-app-green/10 border-app-green/30',
    textClass: 'text-app-green',
  },
  school: {
    label: 'At school',
    color: '#007AFF',
    bgClass: 'bg-app-blue/10 border-app-blue/30',
    textClass: 'text-app-blue',
  },
  between: {
    label: 'Between zones',
    color: '#FF9500',
    bgClass: 'bg-app-orange/10 border-app-orange/30',
    textClass: 'text-app-orange',
  },
}

export function LiveMap({
  lat,
  lng,
  spanDeg = 0.012,
  zoneStatus,
  currentZoneName,
  currentDuration,
  fixAgo = 'updated just now',
}: LiveMapProps) {
  const span = spanDeg
  const bbox = `${lng - span},${lat - span},${lng + span},${lat + span}`
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`
  const meta = STATUS_META[zoneStatus]

  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setLoaded(true), 2000)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className="relative rounded-2xl overflow-hidden border border-app-line bg-app-surface aspect-[2/1]">
      <iframe
        title="Geofence overview"
        src={src}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ border: 0, filter: 'saturate(0.7) contrast(0.95) brightness(1.02)' }}
        referrerPolicy="no-referrer"
      />

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-app-muted">
          loading map…
        </div>
      )}

      {/* Top-left: zone status pill */}
      <div className={`absolute top-3 left-3 max-w-[70%] rounded-xl border px-3 py-2 backdrop-blur-sm bg-white/90 shadow-sm`}>
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full`} style={{ background: meta.color }} />
          <span className={`text-[12px] font-semibold ${meta.textClass}`}>
            {meta.label}
          </span>
        </div>
        {currentZoneName && (
          <div className="text-[11px] text-app-ink/80 leading-tight mt-0.5 truncate">
            {currentZoneName}
            {currentDuration ? ` · ${currentDuration}` : ''}
          </div>
        )}
      </div>

      {/* Top-right: privacy chip — anti-surveillance positioning */}
      <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-app-muted bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 border border-app-line">
        <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x={3} y={11} width={18} height={11} rx={2} />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        zone-based
      </div>

      {/* Bottom-right: last fix freshness only — no coords */}
      <div className="absolute bottom-3 right-3 text-[10px] text-app-ink/70 bg-white/85 rounded-md px-2 py-0.5 backdrop-blur-sm">
        {fixAgo}
      </div>
    </div>
  )
}

export default LiveMap

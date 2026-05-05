/**
 * Mock-but-live GPS map. Embeds an OpenStreetMap iframe (no API key needed)
 * and overlays a pulsing GPS dot at the child's position. Coordinates come
 * from mock data; real firmware will publish lat/lng over the same channel
 * as the rest of the snapshot.
 */

import { useEffect, useState } from 'react'

interface LiveMapProps {
  /** Decimal degrees */
  lat: number
  lng: number
  /** GPS reported accuracy, metres (Quectel BG77 typical: 2-5 m open sky) */
  accuracyM?: number
  /** Place name shown in the floating badge */
  place?: string
  /** Address shown under place */
  address?: string
  /** Child's emotional state — colours the dot */
  state?: 'calm' | 'active' | 'sleepy' | 'worried'
  /** Last fix timestamp shown in lower-right */
  fixAgo?: string
}

const STATE_COLOR: Record<NonNullable<LiveMapProps['state']>, string> = {
  calm: '#34C759',
  active: '#FF9500',
  sleepy: '#5AC8FA',
  worried: '#FF3B30',
}

export function LiveMap({
  lat,
  lng,
  accuracyM = 3,
  place,
  address,
  state = 'calm',
  fixAgo = 'live · 2s',
}: LiveMapProps) {
  // Bounding box ≈ ±0.004° around the point (≈ 400 m). Enough to give the
  // user spatial context without making the dot vanish.
  const span = 0.004
  const bbox = `${lng - span},${lat - span},${lng + span},${lat + span}`
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`
  const dotColor = STATE_COLOR[state]

  // light "loading" state until the iframe fires onLoad
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    // safety: assume loaded after 2s in case iframe fails silently
    const t = window.setTimeout(() => setLoaded(true), 2000)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <div className="relative rounded-2xl overflow-hidden border border-app-line bg-app-surface aspect-[2/1]">
      <iframe
        title="Location map"
        src={src}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ border: 0, filter: 'saturate(0.85) contrast(0.95)' }}
        referrerPolicy="no-referrer"
      />

      {/* Soft loading shimmer */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-app-muted">
          loading map…
        </div>
      )}

      {/* GPS dot overlay — pinned to map centre because bbox is symmetric */}
      <div
        className="absolute pointer-events-none"
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        aria-hidden="true"
      >
        <span
          className="block absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 36,
            height: 36,
            background: dotColor,
            opacity: 0.18,
            animation: 'live-gps-halo 1.8s ease-out infinite',
          }}
        />
        <span
          className="block absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white shadow-md"
          style={{ width: 14, height: 14, background: dotColor }}
        />
      </div>

      {/* Top-left: place + address pill */}
      {(place || address) && (
        <div className="absolute top-3 left-3 max-w-[60%] rounded-xl bg-white/90 backdrop-blur-sm border border-app-line px-3 py-2 shadow-sm">
          {place && <div className="text-[12px] font-semibold text-app-ink leading-tight truncate">{place}</div>}
          {address && (
            <div className="text-[11px] text-app-muted leading-tight truncate mt-0.5">{address}</div>
          )}
        </div>
      )}

      {/* Top-right: live GPS chip */}
      <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-app-ink bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 border border-app-line">
        <span className="size-1.5 rounded-full bg-app-green animate-pulse" />
        GPS · ±{accuracyM}m
      </div>

      {/* Bottom-right: tiny coords + last fix */}
      <div className="absolute bottom-3 right-3 text-right">
        <div className="text-[10px] text-app-ink/80 tabular bg-white/85 rounded-md px-2 py-0.5 backdrop-blur-sm">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </div>
        <div className="text-[10px] text-app-muted mt-0.5">{fixAgo}</div>
      </div>

      <style>{`
        @keyframes live-gps-halo {
          0%   { transform: translate(-50%, -50%) scale(0.6); opacity: 0.55; }
          70%  { transform: translate(-50%, -50%) scale(1.6); opacity: 0;    }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0;    }
        }
      `}</style>
    </div>
  )
}

export default LiveMap

import { PinIcon } from './icons'

interface LocationCardProps {
  place: string
  address: string
  duration: string
}

export function LocationCard({ place, address, duration }: LocationCardProps) {
  return (
    <div className="rounded-2xl border border-app-line bg-app-surface overflow-hidden">
      <div className="relative aspect-[2/1] bg-[#f1f1f3]">
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 400 200"
          aria-hidden="true"
        >
          {/* abstract street network */}
          <g stroke="#ffffff" strokeLinecap="round">
            <line x1="0" y1="74" x2="400" y2="62" strokeWidth="10" />
            <line x1="0" y1="138" x2="400" y2="148" strokeWidth="8" />
            <line x1="80" y1="0" x2="92" y2="200" strokeWidth="8" />
            <line x1="240" y1="0" x2="232" y2="200" strokeWidth="6" />
          </g>
          <g stroke="#e5e5ea" strokeLinecap="round" opacity="0.9">
            <line x1="0" y1="36" x2="400" y2="30" strokeWidth="2" />
            <line x1="0" y1="170" x2="400" y2="180" strokeWidth="2" />
            <line x1="160" y1="0" x2="158" y2="200" strokeWidth="2" />
            <line x1="320" y1="0" x2="318" y2="200" strokeWidth="2" />
          </g>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <span
              className="absolute inset-0 rounded-full bg-app-red/30 animate-ping"
              style={{ animationDuration: '2.4s' }}
            />
            <span className="relative size-10 rounded-full bg-app-red text-white flex items-center justify-center shadow-[0_4px_12px_rgba(255,59,48,0.3)]">
              <PinIcon width={18} height={18} />
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium text-app-ink truncate">{place}</div>
          <div className="text-xs text-app-muted mt-0.5 truncate">{address}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[11px] uppercase tracking-[0.1em] text-app-muted">здесь</div>
          <div className="text-sm font-medium text-app-ink tabular">{duration}</div>
        </div>
      </div>
    </div>
  )
}

export default LocationCard

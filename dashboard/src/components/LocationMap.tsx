import { HomeIcon, SchoolIcon } from './icons'

interface LocationMapProps {
  currentPlace: 'home' | 'school' | 'between'
  homeName?: string
  schoolName?: string
  childName: string
  state: 'calm' | 'active' | 'sleepy' | 'worried'
}

export function LocationMap({
  currentPlace,
  homeName = 'Дом',
  schoolName = 'Школа',
  childName,
  state,
}: LocationMapProps) {
  const homeX = 60
  const schoolX = 300
  const y = 120

  const childX =
    currentPlace === 'home'
      ? homeX
      : currentPlace === 'school'
      ? schoolX
      : (homeX + schoolX) / 2

  const dotColor =
    state === 'worried'
      ? 'var(--color-app-red)'
      : state === 'sleepy'
      ? 'var(--color-app-blue)'
      : state === 'active'
      ? 'var(--color-app-orange)'
      : 'var(--color-app-green)'

  return (
    <div className="rounded-2xl border border-app-line bg-app-surface overflow-hidden">
      <div className="relative aspect-[2/1] w-full">
        <svg
          viewBox="0 0 360 240"
          className="absolute inset-0 w-full h-full"
          aria-label="Карта дом и школа"
        >
          {/* background grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="var(--color-app-line)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="360" height="240" fill="url(#grid)" opacity="0.6" />

          {/* route path */}
          <path
            d={`M ${homeX} ${y} Q 180 ${y - 50} ${schoolX} ${y}`}
            fill="none"
            stroke="var(--color-app-line-2)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* home geofence */}
          <circle
            cx={homeX}
            cy={y}
            r="38"
            fill="var(--color-app-green)"
            fillOpacity="0.08"
            stroke="var(--color-app-green)"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle cx={homeX} cy={y} r="22" fill="var(--color-app-bg)" stroke="var(--color-app-ink)" strokeWidth="1" />

          {/* school geofence */}
          <circle
            cx={schoolX}
            cy={y}
            r="44"
            fill="var(--color-app-blue)"
            fillOpacity="0.08"
            stroke="var(--color-app-blue)"
            strokeOpacity="0.4"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <circle cx={schoolX} cy={y} r="22" fill="var(--color-app-bg)" stroke="var(--color-app-ink)" strokeWidth="1" />

          {/* child dot */}
          <circle
            cx={childX}
            cy={y}
            r="14"
            fill={dotColor}
            fillOpacity="0.18"
          >
            <animate attributeName="r" values="14;22;14" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.25;0;0.25" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx={childX} cy={y} r="6" fill={dotColor} stroke="white" strokeWidth="2" />
        </svg>

        {/* home label */}
        <div
          className="absolute flex items-center justify-center text-app-ink"
          style={{ left: `${(homeX / 360) * 100}%`, top: `${(y / 240) * 100}%`, transform: 'translate(-50%, -50%)' }}
        >
          <HomeIcon width={18} height={18} />
        </div>
        <div
          className="absolute text-[11px] uppercase tracking-[0.08em] text-app-muted whitespace-nowrap"
          style={{
            left: `${(homeX / 360) * 100}%`,
            top: `${((y + 38) / 240) * 100}%`,
            transform: 'translate(-50%, 4px)',
          }}
        >
          {homeName}
        </div>

        {/* school label */}
        <div
          className="absolute flex items-center justify-center text-app-ink"
          style={{ left: `${(schoolX / 360) * 100}%`, top: `${(y / 240) * 100}%`, transform: 'translate(-50%, -50%)' }}
        >
          <SchoolIcon width={18} height={18} />
        </div>
        <div
          className="absolute text-[11px] uppercase tracking-[0.08em] text-app-muted whitespace-nowrap"
          style={{
            left: `${(schoolX / 360) * 100}%`,
            top: `${((y + 44) / 240) * 100}%`,
            transform: 'translate(-50%, 4px)',
          }}
        >
          {schoolName}
        </div>

        {/* child name pill */}
        <div
          className="absolute text-[11px] font-medium px-2 py-0.5 rounded-full bg-app-ink text-white whitespace-nowrap"
          style={{
            left: `${(childX / 360) * 100}%`,
            top: `${((y - 18) / 240) * 100}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {childName}
        </div>
      </div>
    </div>
  )
}

export default LocationMap

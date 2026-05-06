import {
  AlertIcon,
  GoalIcon,
  DoorIcon,
  HomeIcon,
  BatteryLowIcon,
  MessageIcon,
  MoonIcon,
  SunIcon,
  HeartIcon,
} from './icons'
import type { ComponentType, SVGProps } from 'react'

export type EventKind =
  | 'sos'
  | 'goal'
  | 'leave_home'
  | 'arrive_home'
  | 'low_battery'
  | 'message'
  | 'sleep_start'
  | 'sleep_end'
  | 'parent_touch'

export interface KairoEvent {
  id: string
  kind: EventKind
  text: string
  ts: string
}

type IconComp = ComponentType<SVGProps<SVGSVGElement>>

const kindMeta: Record<EventKind, { Icon: IconComp; tone: 'normal' | 'good' | 'attention' }> = {
  sos: { Icon: AlertIcon, tone: 'attention' },
  goal: { Icon: GoalIcon, tone: 'good' },
  leave_home: { Icon: DoorIcon, tone: 'normal' },
  arrive_home: { Icon: HomeIcon, tone: 'good' },
  low_battery: { Icon: BatteryLowIcon, tone: 'attention' },
  message: { Icon: MessageIcon, tone: 'normal' },
  sleep_start: { Icon: MoonIcon, tone: 'normal' },
  sleep_end: { Icon: SunIcon, tone: 'normal' },
  parent_touch: { Icon: HeartIcon, tone: 'good' },
}

interface EventLogProps {
  events: KairoEvent[]
}

export function EventLog({ events }: EventLogProps) {
  return (
    <ul className="divide-y divide-app-line">
      {events.map((e) => {
        const m = kindMeta[e.kind]
        const iconColor =
          m.tone === 'attention'
            ? 'text-app-red'
            : m.tone === 'good'
            ? 'text-app-green'
            : 'text-app-muted'
        return (
          <li key={e.id} className="flex items-center gap-3 py-2.5">
            <span
              className={`shrink-0 size-7 rounded-full bg-app-line/70 flex items-center justify-center ${iconColor}`}
            >
              <m.Icon width={13} height={13} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-app-ink leading-tight truncate">{e.text}</div>
              <div className="text-[11px] text-app-muted mt-0.5">{e.ts}</div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default EventLog

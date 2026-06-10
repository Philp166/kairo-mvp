import type { FC, SVGProps } from 'react'
import { useT } from '../lib/i18n'
import {
  HeartIcon, StarIcon, MoonIcon, SunIcon, PinIcon, DoorIcon,
  BatteryLowIcon, AlertIcon, CheckIcon, SpikeIcon, MessageIcon,
} from './icons'

/* ── Types ─────────────────────────────────────────────────── */

export interface TapeEvent {
  id: string
  kind: string
  text: string
  ts: string
}

interface ActivityTapeProps {
  events: TapeEvent[]
}

/* ── Kind → visual mapping ────────────────────────────────── */

type IconC = FC<SVGProps<SVGSVGElement>>

const KIND_MAP: Record<string, { tapeKind: string; Icon: IconC; hap: string }> = {
  parent_touch: { tapeKind: 'touch', Icon: HeartIcon, hap: 'HAP-03' },
  cheer:        { tapeKind: 'touch', Icon: StarIcon,  hap: 'HAP-02' },
  bedtime:      { tapeKind: 'touch', Icon: MoonIcon,  hap: 'HAP-04' },
  arrive_home:  { tapeKind: 'geo',   Icon: PinIcon,   hap: 'ZONE' },
  leave_home:   { tapeKind: 'geo',   Icon: DoorIcon,  hap: 'ZONE' },
  goal:         { tapeKind: 'touch', Icon: StarIcon,  hap: 'HAP-02' },
  sleep_start:  { tapeKind: 'geo',   Icon: MoonIcon,  hap: 'HAP-04' },
  sleep_end:    { tapeKind: 'geo',   Icon: SunIcon,   hap: 'WAKE' },
  low_battery:  { tapeKind: 'spike', Icon: BatteryLowIcon, hap: 'WATCH' },
  sos:          { tapeKind: 'sos',   Icon: AlertIcon, hap: 'HAP-01' },
  sos_ok:       { tapeKind: 'sos-ok', Icon: CheckIcon, hap: 'ACK' },
  spike:        { tapeKind: 'spike', Icon: SpikeIcon, hap: 'WATCH' },
}

const WAVE_PATTERNS: Record<string, number[]> = {
  touch:    [0, 0, 3, 2, 0, 0, 3, 2, 0, 0, 0, 0, 0, 0],
  sos:      [2, 3, 2, 0, 3, 3, 3, 0, 2, 3, 2, 0, 0, 0],
  geo:      [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  'sos-ok': [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  spike:    [0, 0, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0],
}

function Waveform({ kind }: { kind: string }) {
  const data = WAVE_PATTERNS[kind] || WAVE_PATTERNS.touch
  return (
    <svg viewBox="0 0 70 18" width={70} height={18} className="waveform">
      {data.map((v, i) => (
        <rect
          key={i}
          x={i * 5}
          y={9 - v}
          width={3}
          height={v * 2}
          fill="currentColor"
          opacity={v ? 0.8 : 0.15}
        />
      ))}
    </svg>
  )
}

/* ── Component ─────────────────────────────────────────────── */

export default function ActivityTape({ events }: ActivityTapeProps) {
  const { t } = useT()

  return (
    <div className="tape-card panel-card">
      <div className="panel-card-head">
        <span className="mono dim">{t('tape.head')}</span>
        <span className="mono accent">{t('tape.today')}</span>
        <span className="mono dim" style={{ marginLeft: 'auto' }}>
          {events.length} {t('tape.entries')}
        </span>
      </div>
      <div className="tape-strip">
        {events.map((e) => {
          const m = KIND_MAP[e.kind] ?? { tapeKind: 'touch', Icon: MessageIcon, hap: '—' }
          return (
            <div key={e.id} className={`tape-row tape-${m.tapeKind}`}>
              <div className="tape-time mono">{e.ts}</div>
              <div className="tape-glyph"><m.Icon width={15} height={15} /></div>
              <div className="tape-msg">{e.text}</div>
              <div className="tape-hap mono dim">{m.hap}</div>
              <div className="tape-waveform">
                <Waveform kind={m.tapeKind} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

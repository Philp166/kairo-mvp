import { useT } from '../lib/i18n'

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

const KIND_MAP: Record<string, { tapeKind: string; glyph: string; hap: string }> = {
  parent_touch: { tapeKind: 'touch', glyph: '♥', hap: 'HAP-03' },
  arrive_home:  { tapeKind: 'geo',   glyph: '▸', hap: 'ZONE' },
  leave_home:   { tapeKind: 'geo',   glyph: '◂', hap: 'ZONE' },
  goal:         { tapeKind: 'touch', glyph: '★', hap: 'HAP-02' },
  sleep_start:  { tapeKind: 'geo',   glyph: '☾', hap: 'HAP-04' },
  sleep_end:    { tapeKind: 'geo',   glyph: '☀', hap: 'WAKE' },
  low_battery:  { tapeKind: 'spike', glyph: '⚡', hap: 'WATCH' },
  sos:          { tapeKind: 'sos',   glyph: '!', hap: 'HAP-01' },
  sos_ok:       { tapeKind: 'sos-ok', glyph: '○', hap: 'ACK' },
  spike:        { tapeKind: 'spike', glyph: '↗', hap: 'WATCH' },
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
          const m = KIND_MAP[e.kind] ?? { tapeKind: 'touch', glyph: '·', hap: '—' }
          return (
            <div key={e.id} className={`tape-row tape-${m.tapeKind}`}>
              <div className="tape-time mono">{e.ts}</div>
              <div className="tape-glyph">{m.glyph}</div>
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

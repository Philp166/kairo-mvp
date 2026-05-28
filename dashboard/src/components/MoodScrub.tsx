import { useState, useEffect, useRef, useCallback } from 'react'
import { useT } from '../lib/i18n'

/* ── Types ─────────────────────────────────────────────────── */

export interface DayMood {
  state: 'calm' | 'active' | 'sleepy' | 'worried'
  note: string
  noteRu: string
}

interface MoodScrubProps {
  scrubHour: number
  onScrub: (hour: number) => void
  day?: DayMood[]
}

/* ── 24h mood timeline mock ────────────────────────────────── */

export const DAY_MOODS: DayMood[] = [
  // 0-5: deep sleep
  { state: 'sleepy', note: 'Deep sleep',             noteRu: 'Глубокий сон' },
  { state: 'sleepy', note: 'Deep sleep',             noteRu: 'Глубокий сон' },
  { state: 'sleepy', note: 'Deep sleep',             noteRu: 'Глубокий сон' },
  { state: 'sleepy', note: 'Deep sleep',             noteRu: 'Глубокий сон' },
  { state: 'sleepy', note: 'Deep sleep',             noteRu: 'Глубокий сон' },
  { state: 'sleepy', note: 'REM cycle',              noteRu: 'Быстрая фаза' },
  // 6-7: waking
  { state: 'sleepy', note: 'Light sleep',            noteRu: 'Лёгкий сон' },
  { state: 'calm',   note: 'Wake-up',                noteRu: 'Пробуждение' },
  // 8-9: school commute
  { state: 'active', note: 'Heading to school',      noteRu: 'По дороге в школу' },
  { state: 'calm',   note: 'Morning class',          noteRu: 'Утренний урок' },
  // 10-11: school
  { state: 'calm',   note: 'In class',               noteRu: 'На уроке' },
  { state: 'active', note: 'PE class',               noteRu: 'Физкультура' },
  // 12-13: lunch
  { state: 'active', note: 'Lunch break',            noteRu: 'Обеденная перемена' },
  { state: 'calm',   note: 'Afternoon class',        noteRu: 'Послеобеденный урок' },
  // 14: event
  { state: 'worried', note: 'HR spike — false alarm', noteRu: 'Скачок ЧСС — ложная тревога' },
  // 15-17: after-school
  { state: 'active', note: 'After-school play',      noteRu: 'Игра после школы' },
  { state: 'active', note: 'Park',                   noteRu: 'Парк' },
  { state: 'calm',   note: 'Heading home',           noteRu: 'По дороге домой' },
  // 18-20: home evening
  { state: 'calm',   note: 'Homework',               noteRu: 'Домашка' },
  { state: 'active', note: 'Dinner + family',        noteRu: 'Ужин с семьёй' },
  { state: 'calm',   note: 'Reading',                noteRu: 'Чтение' },
  // 21-23: bedtime
  { state: 'sleepy', note: 'Wind-down',              noteRu: 'Подготовка ко сну' },
  { state: 'sleepy', note: 'Bedtime',                noteRu: 'Отбой' },
  { state: 'sleepy', note: 'Asleep',                 noteRu: 'Спит' },
]

export const STATE_COLOR_VAR: Record<DayMood['state'], string> = {
  calm:    'var(--ok)',
  active:  'var(--accent)',
  sleepy:  'var(--lavender)',
  worried: 'var(--alert)',
}

/* ── Component ─────────────────────────────────────────────── */

export default function MoodScrub({ scrubHour, onScrub, day = DAY_MOODS }: MoodScrubProps) {
  const { lang, t } = useT()
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [hoverHour, setHoverHour] = useState<number | null>(null)

  const update = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
      const hour = Math.round((x / rect.width) * 23)
      onScrub(hour)
    },
    [onScrub],
  )

  useEffect(() => {
    if (!dragging) return
    const move = (e: MouseEvent | TouchEvent) => {
      const cx =
        'clientX' in e ? e.clientX : (e as TouchEvent).touches?.[0]?.clientX
      if (cx != null) update(cx)
    }
    const up = () => setDragging(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move)
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
    }
  }, [dragging, update])

  function onTrackMove(e: React.MouseEvent) {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
    setHoverHour(Math.round((x / rect.width) * 23))
  }

  const moment = day[scrubHour] || day[0]
  const playheadPct = (scrubHour / 23) * 100
  const hoverPct = hoverHour != null ? (hoverHour / 23) * 100 : null

  return (
    <div className="mood-scrub">
      <div className="mood-scrub-head">
        <div>
          <span className="mono dim">{t('scrub.tag')}</span>
          <span className="mono accent">{t('scrub.mood')}</span>
        </div>
        <div className="mood-scrub-now mono dim">
          <span className="dim">{t('scrub.hint')}</span>
        </div>
      </div>

      <div className="mood-scrub-display">
        <div className="mood-card">
          <span className="mono dim">
            {scrubHour.toString().padStart(2, '0')}:00
          </span>
          <span className={`mood-card-state state-${moment.state}`}>
            <span
              className="mood-dot"
              style={{ background: STATE_COLOR_VAR[moment.state] }}
            />
            {t('mood.' + moment.state)}
          </span>
          <span className="mood-card-note">
            {lang === 'ru' ? moment.noteRu : moment.note}
          </span>
        </div>
      </div>

      <div
        className="mood-track"
        ref={trackRef}
        onMouseDown={(e) => {
          setDragging(true)
          update(e.clientX)
        }}
        onTouchStart={(e) => {
          setDragging(true)
          update(e.touches[0].clientX)
        }}
        onMouseMove={onTrackMove}
        onMouseLeave={() => setHoverHour(null)}
      >
        {/* 24 mood segments */}
        {day.map((m, i) => (
          <div
            key={i}
            className={`mood-seg seg-${m.state}`}
            style={{
              background: STATE_COLOR_VAR[m.state],
              left: `${(i / 24) * 100}%`,
              width: `${100 / 24}%`,
            }}
            title={`${i.toString().padStart(2, '0')}:00 · ${m.state} · ${m.note}`}
          />
        ))}
        {/* hover indicator */}
        {hoverPct != null && !dragging && (
          <div className="mood-hover" style={{ left: `${hoverPct}%` }} />
        )}
        {/* playhead */}
        <div
          className={`mood-playhead${dragging ? ' dragging' : ''}`}
          style={{ left: `${playheadPct}%` }}
        >
          <div className="mood-playhead-stick" />
          <div className="mood-playhead-handle">
            <span className="cf tl" />
            <span className="cf tr" />
            <span className="cf bl" />
            <span className="cf br" />
          </div>
        </div>
      </div>

      <div className="mood-ticks">
        {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
          <div
            key={h}
            className="mood-tick"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            <span className="mono">{h.toString().padStart(2, '0')}:00</span>
          </div>
        ))}
      </div>

      <div className="mood-legend mono">
        <span>
          <span className="leg-dot" style={{ background: STATE_COLOR_VAR.calm }} />
          {t('mood.calm')}
        </span>
        <span>
          <span className="leg-dot" style={{ background: STATE_COLOR_VAR.active }} />
          {t('mood.active')}
        </span>
        <span>
          <span className="leg-dot" style={{ background: STATE_COLOR_VAR.sleepy }} />
          {t('mood.sleepy')}
        </span>
        <span>
          <span className="leg-dot" style={{ background: STATE_COLOR_VAR.worried }} />
          {t('mood.worried')}
        </span>
      </div>
    </div>
  )
}

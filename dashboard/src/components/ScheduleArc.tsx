import { useT } from '../lib/i18n'

/* ── Types ─────────────────────────────────────────────────── */

interface ScheduleArcProps {
  bedStart?: number
  bedEnd?: number
  schoolStart?: number
  schoolEnd?: number
}

/* ── Helpers ───────────────────────────────────────────────── */

/** Format a decimal-hour value (e.g. 21.5) to "HH:MM" */
function fmtH(h: number): string {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
}

/** Convert an hour (0-24) to degrees: 0h = top, clockwise. */
function hourToAng(h: number): number {
  return (h / 24) * 360 - 90
}

/** SVG arc path from startH to endH on a circle of given radius.
 *  Handles wrap-around (e.g. 21.5 -> 7). */
function arcPath(startH: number, endH: number, radius: number): string {
  const a1 = (hourToAng(startH) * Math.PI) / 180
  const a2 = (hourToAng(endH) * Math.PI) / 180
  const dur = (endH - startH + 24) % 24
  const large = dur > 12 ? 1 : 0
  const x1 = Math.cos(a1) * radius
  const y1 = Math.sin(a1) * radius
  const x2 = Math.cos(a2) * radius
  const y2 = Math.sin(a2) * radius
  return `M${x1},${y1} A${radius},${radius} 0 ${large} 1 ${x2},${y2}`
}

/* ── Component ─────────────────────────────────────────────── */

export default function ScheduleArc({
  bedStart = 21.5,
  bedEnd = 7,
  schoolStart = 8.5,
  schoolEnd = 14,
}: ScheduleArcProps) {
  const { t } = useT()
  const size = 280
  const r = 110
  const sw = 16

  const now = new Date()
  const nowHour = now.getHours() + now.getMinutes() / 60
  const nowAng = (hourToAng(nowHour) * Math.PI) / 180
  const nowX = Math.cos(nowAng) * r
  const nowY = Math.sin(nowAng) * r

  return (
    <div className="sched-card panel-card">
      <div className="panel-card-head">
        <span className="mono dim">{t('sched.dial')}</span>
        <span className="mono accent">{t('sched.head')}</span>
      </div>
      <div className="sched-arc-wrap">
        <svg
          viewBox={`-${size / 2} -${size / 2} ${size} ${size}`}
          width={size}
          height={size}
        >
          {/* base ring */}
          <circle r={r} fill="none" stroke="var(--line)" strokeWidth={sw} />

          {/* hour marks */}
          {Array.from({ length: 24 }).map((_, h) => {
            const a = (hourToAng(h) * Math.PI) / 180
            const x1 = Math.cos(a) * (r - sw / 2)
            const y1 = Math.sin(a) * (r - sw / 2)
            const x2 = Math.cos(a) * (r + sw / 2)
            const y2 = Math.sin(a) * (r + sw / 2)
            return (
              <line
                key={h}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--bg)"
                strokeWidth={h % 3 === 0 ? 1.5 : 0.5}
              />
            )
          })}

          {/* bedtime arc */}
          <path
            d={arcPath(bedStart, bedEnd, r)}
            fill="none"
            stroke="var(--lavender)"
            strokeWidth={sw}
            strokeLinecap="butt"
            opacity={0.85}
          />

          {/* school arc */}
          <path
            d={arcPath(schoolStart, schoolEnd, r)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={sw}
            strokeLinecap="butt"
            opacity={0.85}
          />

          {/* now indicator */}
          <line
            x1={nowX * 0.7}
            y1={nowY * 0.7}
            x2={nowX * 1.15}
            y2={nowY * 1.15}
            stroke="var(--ink)"
            strokeWidth={2}
          />
          <circle
            cx={nowX * 1.15}
            cy={nowY * 1.15}
            r={5}
            fill="var(--bg)"
            stroke="var(--ink)"
            strokeWidth={2}
          />

          {/* hour labels */}
          {[0, 6, 12, 18].map((h) => {
            const a = (hourToAng(h) * Math.PI) / 180
            const x = Math.cos(a) * (r + 28)
            const y = Math.sin(a) * (r + 28) + 4
            return (
              <text
                key={h}
                x={x}
                y={y}
                fontSize="11"
                fontFamily="JetBrains Mono"
                fill="var(--muted)"
                textAnchor="middle"
              >
                {h === 0 ? '24' : h.toString().padStart(2, '0')}
              </text>
            )
          })}

          {/* center label */}
          <text
            x={0}
            y={-6}
            fontSize="10"
            fontFamily="JetBrains Mono"
            fill="var(--muted)"
            textAnchor="middle"
            letterSpacing="0.15em"
          >
            {t('sched.now')}
          </text>
          <text
            x={0}
            y={14}
            fontSize="22"
            fontFamily="JetBrains Mono"
            fill="var(--ink)"
            textAnchor="middle"
            letterSpacing="-0.02em"
          >
            {now.toTimeString().slice(0, 5)}
          </text>
        </svg>
      </div>

      <div className="sched-rows">
        <div className="sched-row">
          <span className="sched-swatch" style={{ background: 'var(--lavender)' }} />
          <span className="mono dim">{t('sched.bed.label')}</span>
          <span className="mono">
            {fmtH(bedStart)} &rarr; {fmtH(bedEnd)}
          </span>
          <span className="mono dim">HAP-04</span>
        </div>
        <div className="sched-row">
          <span className="sched-swatch" style={{ background: 'var(--accent)' }} />
          <span className="mono dim">{t('sched.school.label')}</span>
          <span className="mono">
            {fmtH(schoolStart)} &rarr; {fmtH(schoolEnd)}
          </span>
          <span className="mono dim">{t('sched.silent')}</span>
        </div>
      </div>
    </div>
  )
}

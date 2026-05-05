/**
 * Paediatrician brief — the longitudinal record screen.
 *
 * Spec vision (2036): "Parents bring data to the appointment instead of a
 * verbal description like 'she seems a bit wheezy'. The paediatrician has
 * access to annual summaries at every routine visit." This screen is exactly
 * that artefact — readable in print, dense but never noisy, anchored to
 * trends and to the questions worth raising at the next visit.
 *
 * Style anchors (per /ui-ux-pro-max — premium dashboard / data-visualisation):
 *   • Apple Health Records / Oura Insights energy
 *   • Mono numerics, generous tabular spacing, hairline rules
 *   • No "score / 100", no optimisation language
 *   • Print-friendly (single column at @media print)
 */

import { useState } from 'react'
import { mockChildren, type BriefAnnotation, type BriefModule } from '../mock'
import { HeartIcon, MoonIcon, LungsIcon, StepsIcon } from './icons'

interface BriefPageProps {
  childId?: string
}

const MODULE_STATUS_META: Record<
  BriefModule['status'],
  { label: string; tone: string; pill: string }
> = {
  monitoring: {
    label: 'Monitoring',
    tone: 'text-app-muted',
    pill: 'bg-app-line text-app-muted border-app-line-2',
  },
  flagged: {
    label: 'Flagged',
    tone: 'text-app-orange',
    pill: 'bg-app-orange/10 text-app-orange border-app-orange/30',
  },
  resolved: {
    label: 'Resolved',
    tone: 'text-app-green',
    pill: 'bg-app-green/10 text-app-green border-app-green/30',
  },
  paused: {
    label: 'Paused',
    tone: 'text-app-muted',
    pill: 'bg-app-line text-app-muted border-app-line-2',
  },
}

const ANN_KIND_META: Record<
  BriefAnnotation['kind'],
  { label: string; dotClass: string }
> = {
  milestone: { label: 'Milestone', dotClass: 'bg-app-blue' },
  flag: { label: 'Flag', dotClass: 'bg-app-orange' },
  consult: { label: 'Consult', dotClass: 'bg-app-green' },
  context: { label: 'Context', dotClass: 'bg-app-muted' },
}

function formatMonth(iso: string): string {
  // accepts "YYYY-MM" or "YYYY-MM-DD"
  const [y, m] = iso.split('-')
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${months[Number(m) - 1] ?? ''} ${y}`
}

export function BriefPage({ childId }: BriefPageProps) {
  const child = mockChildren.find((c) => c.id === childId) ?? mockChildren[0]
  const r = child.record
  const [tab, setTab] = useState<'hr' | 'sleep' | 'resp' | 'activity'>('hr')

  return (
    <div className="min-h-screen bg-app-bg text-app-ink">
      <header className="border-b border-app-line bg-app-bg/85 backdrop-blur-md sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 h-14 flex items-center justify-between">
          <a href="#dashboard" className="text-xs text-app-muted hover:text-app-ink transition-colors">
            ← back to dashboard
          </a>
          <span className="text-[15px] font-semibold tracking-tight">Paediatrician brief</span>
          <button
            onClick={() => window.print()}
            className="cursor-pointer text-xs text-app-muted hover:text-app-ink transition-colors inline-flex items-center gap-1"
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 9V2h12v7" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x={6} y={14} width={12} height={8} />
            </svg>
            Print / PDF
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-10 space-y-10 print:py-4">
        {/* ── Title block ───────────────────────────────────────── */}
        <section>
          <div className="text-[11px] uppercase tracking-[0.14em] text-app-muted">
            Longitudinal wellness record
          </div>
          <h1 className="mt-2 text-[36px] sm:text-[44px] leading-[1.05] font-semibold tracking-tight">
            {child.name}
            <span className="ml-3 text-app-muted font-normal text-xl align-middle">
              age {child.age}
            </span>
          </h1>
          <p className="mt-2 text-sm text-app-ink-2 max-w-2xl leading-relaxed">
            {r.monthsTracked} months of continuous wellness data ({r.totalNights} nights). Worth
            sharing at routine visits — Kairo doesn't replace the paediatrician's
            assessment, it makes the conversation more grounded.
          </p>
        </section>

        {/* ── Headline numbers row ──────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Headline label="Months tracked" value={`${r.monthsTracked}`} sub="continuous" />
          <Headline label="Nights of sleep" value={r.totalNights.toLocaleString('en')} sub="recorded" />
          <Headline
            label="HRV trend"
            value={`${Math.round(r.hrvMonths[r.hrvMonths.length - 1])}`}
            sub={`ms · ${trendWord(r.hrvMonths)}`}
          />
          <Headline
            label="Resting HR"
            value={`${Math.round(r.restingHrMonths[r.restingHrMonths.length - 1])}`}
            sub={`bpm · ${trendWord(r.restingHrMonths, true)}`}
          />
        </section>

        {/* ── Active modules ───────────────────────────────────── */}
        <section>
          <h2 className="text-[13px] uppercase tracking-[0.14em] text-app-muted mb-3">
            Active modules
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {r.modules.map((m) => {
              const meta = MODULE_STATUS_META[m.status]
              return (
                <div
                  key={m.id}
                  className="rounded-2xl border border-app-line bg-app-surface p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-sm font-medium leading-tight">{m.name}</div>
                    <span
                      className={`text-[10px] uppercase tracking-[0.08em] px-2 py-0.5 rounded-full border ${meta.pill}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="text-xs text-app-muted leading-relaxed">{m.summary}</div>
                  <div className="text-[11px] text-app-muted/70">
                    Active since {formatMonth(m.activeSince)}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Conversation prompts (the heart of the brief) ─────── */}
        <section>
          <h2 className="text-[13px] uppercase tracking-[0.14em] text-app-muted mb-3">
            Worth raising at the next visit
          </h2>
          <ol className="rounded-2xl border border-app-line bg-app-surface divide-y divide-app-line">
            {r.conversationPrompts.map((p, i) => (
              <li key={i} className="p-4 flex gap-4">
                <span className="text-[11px] tabular text-app-muted w-5 shrink-0 mt-0.5">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{p.topic}</div>
                  <div className="text-xs text-app-muted leading-relaxed mt-1">{p.evidence}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Deep-dive tabs: 24-month trend per metric ─────────── */}
        <section>
          <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
            <h2 className="text-[13px] uppercase tracking-[0.14em] text-app-muted">
              24-month trends
            </h2>
            <div className="inline-flex rounded-full bg-app-line/70 p-0.5">
              {(
                [
                  { id: 'hr', label: 'Resting HR' },
                  { id: 'sleep', label: 'Sleep' },
                  { id: 'resp', label: 'SpO₂' },
                  { id: 'activity', label: 'HRV' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`text-xs cursor-pointer px-3 py-1 rounded-full transition-colors duration-200 ${
                    t.id === tab
                      ? 'bg-app-surface text-app-ink shadow-sm'
                      : 'text-app-muted hover:text-app-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-app-line bg-app-surface p-5 sm:p-6">
            {tab === 'hr' && (
              <TrendChart
                title="Resting heart rate"
                series={r.restingHrMonths}
                unit="bpm"
                color="#FF3B30"
                icon={<HeartIcon width={14} height={14} />}
                range={{ min: 60, max: 110 }}
                interp="Resting HR usually trends down with age 4→14. Watch for sustained ↑ unrelated to growth."
              />
            )}
            {tab === 'sleep' && (
              <TrendChart
                title="Mean sleep quality (per month)"
                series={r.sleepMonths}
                unit=""
                color="#5AC8FA"
                icon={<MoonIcon width={14} height={14} />}
                range={{ min: 50, max: 100 }}
                interp="Stable run with seasonal variability is normal. Sustained drops worth flagging."
              />
            )}
            {tab === 'resp' && (
              <TrendChart
                title="Mean nightly SpO₂"
                series={r.spo2Months}
                unit="%"
                color="#34C759"
                icon={<LungsIcon width={14} height={14} />}
                range={{ min: 94, max: 100 }}
                interp="Children typically 96–99 % overnight. Drops below 94 % warrant clinical follow-up."
              />
            )}
            {tab === 'activity' && (
              <TrendChart
                title="Mean nightly HRV (RMSSD)"
                series={r.hrvMonths}
                unit="ms"
                color="#007AFF"
                icon={<StepsIcon width={14} height={14} />}
                range={{ min: 25, max: 70 }}
                interp="HRV grows through development. Five-week dips often correlate with stress or illness."
              />
            )}
          </div>
        </section>

        {/* ── Annotated timeline ────────────────────────────────── */}
        <section>
          <h2 className="text-[13px] uppercase tracking-[0.14em] text-app-muted mb-3">
            Annotated timeline
          </h2>
          <ol className="border-l border-app-line ml-2 space-y-5">
            {[...r.annotations].reverse().map((a, i) => {
              const meta = ANN_KIND_META[a.kind]
              return (
                <li key={i} className="pl-5 relative">
                  <span
                    className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full ring-4 ring-app-bg ${meta.dotClass}`}
                  />
                  <div className="text-[10px] uppercase tracking-[0.1em] text-app-muted">
                    {formatMonth(a.date)} · {meta.label}
                  </div>
                  <div className="text-sm font-medium mt-0.5">{a.title}</div>
                  <div className="text-xs text-app-muted leading-relaxed mt-1 max-w-2xl">
                    {a.body}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        {/* ── Footer disclaimer ─────────────────────────────────── */}
        <footer className="text-[11px] text-app-muted leading-relaxed border-t border-app-line pt-4 max-w-2xl">
          Generated by Kairo · {new Date().toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })}.
          Wellness signals only — Kairo doesn't diagnose, prescribe, or replace clinical assessment.
          The paediatrician remains the clinical authority. This brief exists to make that authority more effective.
        </footer>
      </main>
    </div>
  )
}

function Headline({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-2xl border border-app-line bg-app-surface p-4">
      <div className="text-[10px] uppercase tracking-[0.12em] text-app-muted">{label}</div>
      <div className="mt-1 text-[26px] leading-none font-semibold tracking-tight tabular">
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-app-muted">{sub}</div>}
    </div>
  )
}

function trendWord(series: number[], inverted = false): string {
  if (series.length < 4) return 'stable'
  const recent = series.slice(-3).reduce((a, b) => a + b, 0) / 3
  const older = series.slice(-12, -9).reduce((a, b) => a + b, 0) / 3
  const diff = recent - older
  const dir = diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'stable'
  if (inverted) {
    if (dir === 'up') return 'rising'
    if (dir === 'down') return 'easing'
  }
  if (dir === 'up') return 'rising'
  if (dir === 'down') return 'easing'
  return 'stable'
}

interface TrendChartProps {
  title: string
  series: number[]
  unit: string
  color: string
  icon: React.ReactNode
  range: { min: number; max: number }
  interp: string
}

function TrendChart({ title, series, unit, color, icon, range, interp }: TrendChartProps) {
  const W = 700
  const H = 180
  const padX = 32
  const padY = 24
  const innerW = W - padX * 2
  const innerH = H - padY * 2
  const min = Math.min(range.min, ...series)
  const max = Math.max(range.max, ...series)
  const xStep = innerW / Math.max(1, series.length - 1)
  const points = series.map((v, i) => {
    const x = padX + i * xStep
    const y = padY + (1 - (v - min) / (max - min)) * innerH
    return [x, y] as [number, number]
  })
  const path = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ')
  const area = `${path} L ${padX + innerW} ${padY + innerH} L ${padX} ${padY + innerH} Z`
  const last = series[series.length - 1]
  const yTicks = 4
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-1.5">
          <span style={{ color }}>{icon}</span>
          <span className="text-sm font-medium">{title}</span>
        </div>
        <div className="text-sm tabular text-app-muted">
          latest <span className="text-app-ink font-medium">{last.toFixed(unit === 'ms' || unit === 'bpm' ? 0 : 1)}</span>
          {unit && <span className="text-xs text-app-muted ml-1">{unit}</span>}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none" role="img">
        <defs>
          <linearGradient id={`tg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* y-axis ticks */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = padY + (i / yTicks) * innerH
          const v = max - (i / yTicks) * (max - min)
          return (
            <g key={i}>
              <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="#f1f1f3" strokeWidth={1} />
              <text x={padX - 6} y={y + 3} fontSize={9} fill="#86868b" textAnchor="end">
                {v.toFixed(unit === '%' ? 1 : 0)}
              </text>
            </g>
          )
        })}

        {/* x-axis labels — first / mid / last */}
        {[0, Math.floor(series.length / 2), series.length - 1].map((idx) => {
          const x = padX + idx * xStep
          const monthsAgo = series.length - 1 - idx
          const label = monthsAgo === 0 ? 'now' : `${monthsAgo}mo`
          return (
            <text key={idx} x={x} y={H - 6} fontSize={9} fill="#86868b" textAnchor="middle">
              {label}
            </text>
          )
        })}

        {/* area + line */}
        <path d={area} fill={`url(#tg-${color.replace('#', '')})`} />
        <path d={path} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />

        {/* end dot */}
        <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r={3} fill={color} />
        <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r={6} fill={color} fillOpacity={0.25} />
      </svg>

      <p className="mt-3 text-xs text-app-muted leading-relaxed max-w-2xl">{interp}</p>
    </div>
  )
}

export default BriefPage

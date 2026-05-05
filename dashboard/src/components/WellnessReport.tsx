/**
 * Wellness summary report — single source of truth for parent-facing
 * physiological data. Replaces the older "Now" tile grid + standalone HR
 * chart so each metric appears once.
 *
 * Layout (per /ui-ux-pro-max — premium minimalism, Apple Fitness vibe):
 *   Hero strip       — band freshness: battery, wear time, last sync
 *   Range tabs       — Day / Week / Month
 *   Six metric cards — HR, HRV, SpO₂, Skin temp, Sleep, Activity
 *   Disclaimer       — wellness, not medical
 *
 * Spec anchors:
 *   §5.2 sampling table  — HR / SpO₂ / temp / steps cadences
 *   §5.3 sleep classifier — Sleep score from 30-sec epochs
 *   §10 risk register     — temp Δ ≥ 0.2 °C and SpO₂ < 95 % alert thresholds
 *
 * The component intentionally keeps language *informational* — it surfaces
 * patterns to inform paediatrician conversations, never replaces them.
 */

import { useState } from 'react'
import { Sparkline } from './Sparkline'
import { WearTimeRing } from './WearTimeRing'
import {
  HeartIcon,
  LungsIcon,
  ThermometerIcon,
  StepsIcon,
  MoonIcon,
  BatteryIcon,
  GoalIcon,
} from './icons'

export type ReportRange = '1d' | '7d' | '30d'

interface WellnessReportProps {
  // current snapshot
  hr: number
  hrBaseline: number
  spo2: number
  tempC: number
  tempBaseline: number
  steps: number
  stepsGoal: number
  // band freshness
  battery: number
  wearPct: number
  lastSync: string
  // multi-window history
  hrSeries: number[]
  hrSeriesWeek: number[]
  hrSeriesMonth: number[]
  hrvSeries: number[]
  spo2NightSeries: number[]
  tempDeltaSeries: number[]
  sleepScore: number
  sleepScoreSeries: number[]
  stepsDailySeries: number[]
}

const ranges: { id: ReportRange; label: string }[] = [
  { id: '1d', label: 'Day' },
  { id: '7d', label: 'Week' },
  { id: '30d', label: 'Month' },
]

function stats(arr: number[]) {
  if (!arr.length) return { min: 0, avg: 0, max: 0 }
  const min = Math.min(...arr)
  const max = Math.max(...arr)
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length
  return { min, max, avg }
}

function trim(arr: number[], range: ReportRange): number[] {
  if (range === '7d') return arr.slice(-7)
  if (range === '30d') return arr.slice(-30)
  return arr
}

function fmtDelta(v: number) {
  return v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)
}

function sleepWord(score: number): string {
  if (score >= 88) return 'restful'
  if (score >= 75) return 'good'
  if (score >= 62) return 'okay'
  if (score >= 50) return 'restless'
  return 'rough'
}

export function WellnessReport(p: WellnessReportProps) {
  const [range, setRange] = useState<ReportRange>('1d')

  const hrWindow =
    range === '1d' ? p.hrSeries : range === '7d' ? p.hrSeriesWeek : p.hrSeriesMonth
  const hrStats = stats(hrWindow)

  const hrvWin = trim(p.hrvSeries, range)
  const spo2Win = trim(p.spo2NightSeries, range)
  const tempWin = trim(p.tempDeltaSeries, range)
  const sleepWin = trim(p.sleepScoreSeries, range)
  const stepsWin = trim(p.stepsDailySeries, range)

  const hrvStats = stats(hrvWin)
  const spo2Stats = stats(spo2Win)
  const tempAbs = tempWin.map((v) => Math.abs(v))
  const tempMaxAbs = tempAbs.length ? Math.max(...tempAbs) : 0
  const sleepStats = stats(sleepWin)
  const stepsAvg = stats(stepsWin).avg

  const tempBreach = tempMaxAbs >= 0.2
  const spo2Low = spo2Stats.min < 95
  const stepsPctToday = Math.round((p.steps / p.stepsGoal) * 100)

  const batteryColor =
    p.battery < 15 ? 'text-app-red' : p.battery < 30 ? 'text-app-orange' : 'text-app-green'

  return (
    <div>
      {/* ── Hero strip: band freshness ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-5 rounded-2xl bg-app-surface border border-app-line px-5 py-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={batteryColor}>
            <BatteryIcon width={14} height={14} />
          </span>
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-[0.1em] text-app-muted">Battery</div>
            <div className="text-sm font-medium tabular">{p.battery}%</div>
          </div>
        </div>
        <div className="h-7 w-px bg-app-line shrink-0" />
        <div className="flex items-center gap-2 min-w-0">
          <WearTimeRing pct={p.wearPct} size={20} />
          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-[0.1em] text-app-muted">Worn</div>
            <div className="text-sm font-medium tabular">{Math.round(p.wearPct * 100)}%</div>
          </div>
        </div>
        <div className="h-7 w-px bg-app-line shrink-0" />
        <div className="leading-tight min-w-0">
          <div className="text-[10px] uppercase tracking-[0.1em] text-app-muted">Last sync</div>
          <div className="text-sm font-medium truncate">{p.lastSync}</div>
        </div>
      </div>

      {/* ── Title row + range tabs ──────────────────────────────────── */}
      <div className="flex items-baseline justify-between mb-2 gap-3 flex-wrap">
        <h2 className="text-[13px] uppercase tracking-[0.12em] text-app-muted">
          Wellness report
        </h2>
        <div className="inline-flex rounded-full bg-app-line/70 p-0.5">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`text-xs cursor-pointer px-3 py-1 rounded-full transition-colors duration-200 ${
                r.id === range
                  ? 'bg-app-surface text-app-ink shadow-sm'
                  : 'text-app-muted hover:text-app-ink'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-app-muted mb-4 max-w-xl leading-relaxed">
        Gentle patterns over time. Kids aren't projects — these signals exist
        to help conversations with your paediatrician, not to optimise anyone.
      </p>

      {/* ── Six metric cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card
          title="Heart rate"
          icon={<HeartIcon width={14} height={14} />}
          accent="text-app-red"
          value={range === '1d' ? `${p.hr}` : `${Math.round(hrStats.avg)}`}
          unit="bpm"
          sub={`${Math.round(hrStats.min)}–${Math.round(hrStats.max)} · usually around ${p.hrBaseline}`}
          chart={<Sparkline data={hrWindow} color="#FF3B30" width={88} height={26} />}
        />

        <Card
          title="HRV (night)"
          icon={<HeartIcon width={14} height={14} />}
          accent="text-app-blue"
          value={`${Math.round(hrvStats.avg)}`}
          unit="ms"
          sub={`RMSSD · ${Math.round(hrvStats.min)}–${Math.round(hrvStats.max)} ${
            range === '1d' ? 'last night' : 'over period'
          }`}
          chart={<Sparkline data={hrvWin} color="#007AFF" width={88} height={26} />}
        />

        <Card
          title="SpO₂ at night"
          icon={<LungsIcon width={14} height={14} />}
          accent={spo2Low ? 'text-app-orange' : 'text-app-green'}
          value={range === '1d' ? `${p.spo2}` : spo2Stats.avg.toFixed(1)}
          unit="%"
          sub={`min ${spo2Stats.min.toFixed(1)} · ${
            spo2Low ? 'lower than usual — share with paediatrician' : 'within typical range'
          }`}
          chart={<Sparkline data={spo2Win} color="#34C759" width={88} height={26} />}
        />

        <Card
          title="Skin temp"
          icon={<ThermometerIcon width={14} height={14} />}
          accent={tempBreach ? 'text-app-orange' : 'text-app-ink-2'}
          value={range === '1d' ? p.tempC.toFixed(1) : fmtDelta(tempWin[tempWin.length - 1] ?? 0)}
          unit={range === '1d' ? '°C' : '°C Δ'}
          sub={
            tempBreach
              ? `swing of ${tempMaxAbs.toFixed(2)}° — wider than usual, keep an eye out`
              : `usually ${p.tempBaseline.toFixed(1)}° · steady`
          }
          chart={
            <Sparkline
              data={tempWin}
              color={tempBreach ? '#FF9500' : '#86868b'}
              width={88}
              height={26}
            />
          }
        />

        <Card
          title="Sleep"
          icon={<MoonIcon width={14} height={14} />}
          accent="text-app-blue"
          value={
            range === '1d'
              ? sleepWord(p.sleepScore)
              : sleepWord(Math.round(sleepStats.avg))
          }
          unit={range === '1d' ? 'last night' : 'most nights'}
          sub={`mostly ${sleepWord(Math.round(sleepStats.avg))} · sometimes ${sleepWord(
            Math.round(sleepStats.min),
          )}`}
          chart={<Sparkline data={sleepWin} color="#5AC8FA" width={88} height={26} />}
        />

        <Card
          title="Activity"
          icon={<StepsIcon width={14} height={14} />}
          accent="text-app-green"
          value={
            range === '1d'
              ? p.steps.toLocaleString('en')
              : Math.round(stepsAvg).toLocaleString('en')
          }
          unit="steps"
          sub={
            range === '1d'
              ? stepsPctToday >= 100
                ? `daily goal hit · ${p.stepsGoal.toLocaleString('en')}`
                : `goal ${p.stepsGoal.toLocaleString('en')} · plenty of day left`
              : `goal ${p.stepsGoal.toLocaleString('en')} · usually ${Math.round((stepsAvg / p.stepsGoal) * 100)}% there`
          }
          chart={<Sparkline data={stepsWin} color="#34C759" width={88} height={26} fill />}
        />
      </div>

      <p className="mt-4 text-[11px] text-app-muted px-1 flex items-center gap-1.5 leading-relaxed">
        <GoalIcon width={11} height={11} />
        Wellness signals only — Kairo doesn't diagnose, prescribe, or replace
        clinical assessment. Worth flagging to your paediatrician if a pattern
        sticks for 2+ days.
      </p>
    </div>
  )
}

interface CardProps {
  title: string
  icon: React.ReactNode
  accent: string
  value: string
  unit: string
  sub: string
  chart?: React.ReactNode
}

function Card({ title, icon, accent, value, unit, sub, chart }: CardProps) {
  return (
    <div className="rounded-2xl bg-app-surface border border-app-line p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className={accent}>{icon}</span>
          <span className="text-[11px] uppercase tracking-[0.1em] text-app-muted">
            {title}
          </span>
        </div>
        <div className="opacity-80">{chart}</div>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5 tabular">
        <span className="text-[26px] leading-none font-semibold tracking-tight">{value}</span>
        <span className="text-xs text-app-muted">{unit}</span>
      </div>
      <div className="mt-1 text-[11px] text-app-muted truncate">{sub}</div>
    </div>
  )
}

export default WellnessReport

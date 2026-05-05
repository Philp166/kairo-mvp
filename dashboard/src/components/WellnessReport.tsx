/**
 * Wellness summary report — covers the metrics flagged in the spec
 * (§5.2 sampling table + §5.3 sleep classifier + §10 risk register):
 *   - Resting HR + range
 *   - HRV (RMSSD, nightly)
 *   - Nightly SpO₂ mean (ODI3 driver per spec)
 *   - Skin temp deviation vs 14-day baseline (alert at ±0.2 °C)
 *   - Sleep score / architecture
 *   - Daily steps (active minutes proxy)
 *
 * Three windows: 1d (today snapshot), 7d, 30d. Each card shows the headline
 * value, a sub-line with min/avg/max for the window, and a tiny sparkline.
 */

import { useState } from 'react'
import { Sparkline } from './Sparkline'
import {
  HeartIcon,
  LungsIcon,
  ThermometerIcon,
  StepsIcon,
  MoonIcon,
  GoalIcon,
} from './icons'

export type ReportRange = '1d' | '7d' | '30d'

interface WellnessReportProps {
  hr: number
  hrBaseline: number
  hrSeries: number[]
  hrSeriesWeek: number[]
  hrSeriesMonth: number[]
  hrvSeries: number[]
  spo2: number
  spo2NightSeries: number[]
  tempC: number
  tempBaseline: number
  tempDeltaSeries: number[]
  sleepScore: number
  sleepScoreSeries: number[]
  steps: number
  stepsGoal: number
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

function fmtDelta(v: number, units = '') {
  const s = v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)
  return `${s}${units}`
}

export function WellnessReport(p: WellnessReportProps) {
  const [range, setRange] = useState<ReportRange>('7d')

  // HR window data
  const hrWindow =
    range === '1d' ? p.hrSeries : range === '7d' ? p.hrSeriesWeek : p.hrSeriesMonth
  const hrStats = stats(hrWindow)

  // HRV / SpO2 / temp / sleep / steps — series are daily and ≥30 entries
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

  // ⚑ thresholds straight from spec
  const tempBreach = tempMaxAbs >= 0.2
  const spo2Low = spo2Stats.min < 95

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
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

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card
          title="Heart rate"
          icon={<HeartIcon width={14} height={14} />}
          accent="text-app-red"
          value={range === '1d' ? `${p.hr}` : `${Math.round(hrStats.avg)}`}
          unit="bpm"
          sub={
            range === '1d'
              ? `range ${Math.round(hrStats.min)}–${Math.round(hrStats.max)} · baseline ${p.hrBaseline}`
              : `${Math.round(hrStats.min)}–${Math.round(hrStats.max)} · baseline ${p.hrBaseline}`
          }
          chart={<Sparkline data={hrWindow} color="#FF3B30" width={88} height={26} />}
        />

        <Card
          title="HRV (night)"
          icon={<HeartIcon width={14} height={14} />}
          accent="text-app-blue"
          value={`${Math.round(hrvStats.avg)}`}
          unit="ms"
          sub={`RMSSD · ${Math.round(hrvStats.min)}–${Math.round(hrvStats.max)} ${range === '1d' ? 'last night' : 'over period'}`}
          chart={<Sparkline data={hrvWin} color="#007AFF" width={88} height={26} />}
        />

        <Card
          title="SpO₂ at night"
          icon={<LungsIcon width={14} height={14} />}
          accent={spo2Low ? 'text-app-orange' : 'text-app-green'}
          value={range === '1d' ? `${p.spo2}` : spo2Stats.avg.toFixed(1)}
          unit="%"
          sub={`min ${spo2Stats.min.toFixed(1)} · ${spo2Low ? 'check ODI₃' : 'normal ≥ 95'}`}
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
              ? `peak Δ ${tempMaxAbs.toFixed(2)}° · alert threshold ±0.20°`
              : `baseline ${p.tempBaseline.toFixed(1)}° · max Δ ${tempMaxAbs.toFixed(2)}°`
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
          value={range === '1d' ? `${p.sleepScore}` : `${Math.round(sleepStats.avg)}`}
          unit="/100"
          sub={`min ${Math.round(sleepStats.min)} · max ${Math.round(sleepStats.max)} · ${range === '1d' ? 'last night' : 'avg over period'}`}
          chart={<Sparkline data={sleepWin} color="#5AC8FA" width={88} height={26} />}
        />

        <Card
          title="Activity"
          icon={<StepsIcon width={14} height={14} />}
          accent="text-app-green"
          value={range === '1d' ? p.steps.toLocaleString('en') : Math.round(stepsAvg).toLocaleString('en')}
          unit="steps"
          sub={`goal ${p.stepsGoal.toLocaleString('en')} · ${range === '1d' ? `${Math.round((p.steps / p.stepsGoal) * 100)}% today` : `avg ${Math.round((stepsAvg / p.stepsGoal) * 100)}%`}`}
          chart={
            <Sparkline data={stepsWin} color="#34C759" width={88} height={26} fill />
          }
        />
      </div>

      <p className="mt-4 text-[11px] text-app-muted px-1 flex items-center gap-1.5">
        <GoalIcon width={11} height={11} />
        Wellness signals only — not a medical diagnosis. Talk to a paediatrician
        if anything looks off for more than 2 days.
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

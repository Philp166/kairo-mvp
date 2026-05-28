import { useCallback, useEffect, useRef, useState } from 'react'
import { LangProvider, useT, type Lang } from './lib/i18n'
import { DashboardHeader } from './components/DashboardHeader'
import { HeroPanel } from './components/HeroPanel'
import { KairoToast, type ToastData } from './components/KairoToast'
import { SectionHead } from './components/SectionHead'
import { VitalChipBank, type VitalChipProps } from './components/VitalChip'
import MoodScrub, { DAY_MOODS } from './components/MoodScrub'
import HrTrendChart from './components/HrTrendChart'
import { StatTile, HrvGauge } from './components/KairoStatTile'
import Carousel from './components/Carousel'
import ScheduleArc from './components/ScheduleArc'
import LocationRadar from './components/LocationRadar'
import ActivityTape from './components/ActivityTape'
import { WatchPage } from './components/WatchPage'
import { BriefPage } from './components/BriefPage'
import { mockChildren } from './mock'
import { KairoBle, type KairoSnapshot, type KairoBleStatus } from './lib/bleClient'
import type { SparkState } from './components/Spark'

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

function App() {
  const [lang, setLang] = useState<Lang>('en')
  const hash = useHashRoute()

  if (hash.startsWith('#watch')) return <WatchPage childId={hash.split('/')[1]} />
  if (hash.startsWith('#brief')) return <BriefPage childId={hash.split('/')[1]} />

  return (
    <LangProvider lang={lang}>
      <DashboardMain lang={lang} onLang={setLang} />
    </LangProvider>
  )
}

function DashboardMain({ lang, onLang }: { lang: Lang; onLang: (l: Lang) => void }) {
  const { t } = useT()
  const child = mockChildren[0]

  const [bleStatus, setBleStatus] = useState<KairoBleStatus>('idle')
  const [liveSnap, setLiveSnap] = useState<KairoSnapshot | null>(null)
  const bleRef = useRef<KairoBle | null>(null)

  const [sparkState, setSparkState] = useState<SparkState>(child.state)
  const [scrubHour, setScrubHour] = useState(23)
  const [toast, setToast] = useState<ToastData | null>(null)

  useEffect(() => {
    if (scrubHour >= 23) {
      setSparkState(liveSnap ? (liveSnap.state as SparkState) : child.state)
    } else {
      setSparkState(DAY_MOODS[scrubHour].state)
    }
  }, [scrubHour, liveSnap, child.state])

  async function toggleBle() {
    if (bleStatus === 'connected' || bleStatus === 'connecting') {
      await bleRef.current?.disconnect()
      setLiveSnap(null)
      return
    }
    if (!bleRef.current) {
      const b = new KairoBle()
      b.onSnapshot((s) => {
        setLiveSnap(s)
        setSparkState(s.state as SparkState)
      })
      b.onStatus((status) => setBleStatus(status))
      bleRef.current = b
    }
    try {
      await bleRef.current.connect()
    } catch { /* status listener captured error */ }
  }

  const merged = liveSnap
    ? {
        hr: liveSnap.hr ?? child.hr,
        spo2: liveSnap.spo2 ?? child.spo2,
        tempC: liveSnap.tempC ?? child.tempC,
        steps: liveSnap.steps ?? child.steps,
        battery: liveSnap.battery ?? child.battery,
      }
    : child

  const handleTouch = useCallback(
    (kind: string) => {
      if (bleStatus === 'connected' && bleRef.current) {
        bleRef.current.sendHug().catch(() => {})
      }
      const map: Record<string, ToastData> = {
        hug:     { glyph: '♥', title: t('toast.hug.title'),   sub: t('toast.hug.sub'),   hap: 'HAP-03' },
        cheer:   { glyph: '★', title: t('toast.cheer.title'), sub: t('toast.cheer.sub'), hap: 'HAP-02' },
        bedtime: { glyph: '☾', title: t('toast.bed.title'),   sub: t('toast.bed.sub'),   hap: 'HAP-04' },
      }
      setToast(map[kind] ?? map.hug)
    },
    [bleStatus, t],
  )

  const tempDelta = merged.tempC - child.tempBaseline
  const tempStr = `${tempDelta >= 0 ? '+' : ''}${tempDelta.toFixed(1)}`

  const heroVitals = {
    hr:      { value: merged.hr, color: 'var(--accent)' },
    spo2:    { value: merged.spo2, color: 'var(--ok)' },
    temp:    { value: tempStr, color: tempDelta > 0.3 ? 'var(--alert)' : 'var(--ok)' },
    battery: { value: merged.battery, color: merged.battery < 20 ? 'var(--alert)' : 'var(--ok)' },
  }

  const scrubMoment = scrubHour < 23 ? DAY_MOODS[scrubHour] : undefined

  const vitals: VitalChipProps[] = [
    {
      slot: 'HR',
      label: t('v.hr.label'),
      value: merged.hr,
      unit: 'BPM',
      delta: t('v.hr.delta') + ` ${merged.hr > child.hrBaseline ? '+' : ''}${merged.hr - child.hrBaseline}`,
      status: merged.hr > 120 ? 'alert' : merged.hr > 100 ? 'warn' : 'norm',
      color: 'var(--accent)',
      data: child.hrSeries,
    },
    {
      slot: 'SPO2',
      label: t('v.spo2.label'),
      value: merged.spo2,
      unit: '%',
      delta: t('v.spo2.delta'),
      status: merged.spo2 < 94 ? 'alert' : merged.spo2 < 96 ? 'warn' : 'norm',
      color: 'var(--ok)',
      data: child.spo2NightSeries,
    },
    {
      slot: 'TEMP',
      label: t('v.temp.label'),
      value: merged.tempC?.toFixed(1) ?? '—',
      unit: '°C',
      delta: t('v.temp.delta'),
      status: Math.abs(tempDelta) > 0.5 ? 'warn' : 'norm',
      color: 'var(--lavender)',
      data: child.tempDeltaSeries.map((d) => child.tempBaseline + d),
    },
    {
      slot: 'STEP',
      label: t('v.step.label'),
      value: merged.steps.toLocaleString(),
      unit: '',
      delta: t('v.step.delta'),
      status: merged.steps >= child.stepsGoal ? 'norm' : 'warn',
      color: 'var(--ink-2)',
      data: child.stepsDailySeries,
    },
  ]

  return (
    <div className="dashboard-root">
      <DashboardHeader
        lang={lang}
        onLang={onLang}
        ble={bleStatus === 'connected' ? 'live' : 'mock'}
        onToggleBle={toggleBle}
        childName={child.name}
        childInitial={child.name[0]}
      />

      <main className="dash-main">
        <HeroPanel
          sparkState={sparkState}
          scrubHour={scrubHour}
          scrubMoment={scrubMoment}
          vitals={heroVitals}
          onTouch={handleTouch}
        />

        <SectionHead num="01" titleKey="sec.vitals.title" subKey="sec.vitals.sub" />
        <VitalChipBank vitals={vitals} scrubHour={scrubHour < 23 ? scrubHour : null} />

        <SectionHead num="02" titleKey="sec.scrub.title" subKey="sec.scrub.sub" />
        <MoodScrub scrubHour={scrubHour} onScrub={setScrubHour} />

        <SectionHead num="03" titleKey="sec.trends.title" subKey="sec.trends.sub" />
        <HrTrendChart data={child.hrSeries} scrubHour={scrubHour < 23 ? scrubHour : null} />

        <div className="stat-row">
          <StatTile
            slot="SLEEP"
            label={t('stat.sleep.label')}
            value={child.sleepScoreSeries[child.sleepScoreSeries.length - 1] ?? 87}
            unit="/100"
            sub={t('stat.sleep.sub')}
            color="var(--lavender)"
          />
          <StatTile
            slot="HRV"
            label={t('stat.hrv.label')}
            value={child.hrvSeries[child.hrvSeries.length - 1] ?? 42}
            unit="ms"
            sub={t('stat.hrv.sub')}
            color="var(--accent)"
          >
            <HrvGauge value={child.hrvSeries[child.hrvSeries.length - 1] ?? 42} />
          </StatTile>
        </div>

        <SectionHead num="04" titleKey="sec.rhythm.title" subKey="sec.rhythm.sub" />
        <Carousel
          items={[
            <ScheduleArc key="arc" bedStart={21.5} bedEnd={7} schoolStart={8.5} schoolEnd={14} />,
            <LocationRadar
              key="radar"
              zones={child.zones}
              currentPlace={child.location.place}
              currentDuration={child.location.duration}
              childName={child.name}
              lastSync={child.lastSync}
            />,
          ]}
          label="PANELS"
        />

        <SectionHead num="05" titleKey="sec.tape.title" subKey="sec.tape.sub" />
        <ActivityTape events={child.events} />

        <footer className="dash-footer mono">
          {t('footer.tag')}
        </footer>
      </main>

      <KairoToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

export default App

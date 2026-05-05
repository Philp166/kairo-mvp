import { useCallback, useEffect, useRef, useState } from 'react'
import { SparkV1, type SparkState, type SparkEvent } from './components/Spark/SparkV1'
import { StatTile } from './components/StatTile'
import { EventLog, type KairoEvent } from './components/EventLog'
import { HeartChart } from './components/HeartChart'
import { Sparkline } from './components/Sparkline'
import { SleepCard } from './components/SleepCard'
import { WearTimeRing } from './components/WearTimeRing'
import { TimeRangeToggle, type TimeRange } from './components/TimeRangeToggle'
import { MessageDialog } from './components/MessageDialog'
import { ScheduleCard, type ScheduleRule } from './components/ScheduleCard'
import { GeofenceList } from './components/GeofenceList'
import { SosBanner } from './components/SosBanner'
import { LiveMap } from './components/LiveMap'
import { ToastHost, type ToastSpec } from './components/Toast'
import { WatchPage } from './components/WatchPage'
import { mockChildren } from './mock'
import { KairoBle, type KairoSnapshot, type KairoBleStatus } from './lib/bleClient'
import {
  HeartIcon,
  LungsIcon,
  ThermometerIcon,
  StepsIcon,
  BatteryIcon,
  HugIcon,
  MessageIcon,
  PinIcon,
  SchoolIcon,
} from './components/icons'

function useHashRoute() {
  const [hash, setHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash : ''))
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

const stateLabels: Record<SparkState, { label: string; sub: string }> = {
  calm: { label: 'Calm', sub: 'at home, all good' },
  active: { label: 'Active', sub: 'moving, energetic' },
  sleepy: { label: 'Sleepy', sub: 'winding down' },
  worried: { label: 'Alert', sub: 'check on her' },
}

const stateOrder: SparkState[] = ['calm', 'active', 'sleepy', 'worried']

const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function App() {
  const hash = useHashRoute()
  if (hash.startsWith('#watch')) {
    const watchChildId = hash.split('/')[1]
    return <WatchPage childId={watchChildId} />
  }
  return <DashboardPage />
}

function DashboardPage() {
  const [childId, setChildId] = useState(mockChildren[0].id)
  const baseChild = mockChildren.find((c) => c.id === childId) ?? mockChildren[0]
  const [state, setState] = useState<SparkState>(baseChild.state)
  const [event, setEvent] = useState<SparkEvent>(null)
  const [eventKey, setEventKey] = useState(0)
  const [hrRange, setHrRange] = useState<TimeRange>('1d')
  const [msgOpen, setMsgOpen] = useState(false)
  const [transientLog, setTransientLog] = useState<KairoEvent[]>([])
  const [, setLastMsgOverride] = useState<
    { emoji: string; text: string; ts: string } | null | 'unset'
  >('unset')
  const [sosAcked, setSosAcked] = useState(false)
  const [rules, setRules] = useState<ScheduleRule[]>([
    {
      id: 'r-bed',
      kind: 'bedtime',
      label: 'Напоминание перед сном',
      enabled: true,
      time: '21:30',
    },
    {
      id: 'r-school',
      kind: 'school',
      label: 'Школьный режим',
      enabled: true,
      start: '08:30',
      end: '14:00',
    },
  ])
  const [liveSnap, setLiveSnap] = useState<KairoSnapshot | null>(null)
  const [bleStatus, setBleStatus] = useState<KairoBleStatus>('idle')
  const [bleError, setBleError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastSpec[]>([])
  const bleRef = useRef<KairoBle | null>(null)
  const eventTimer = useRef<number | null>(null)

  const dismissToast = useCallback((id: string) => {
    setToasts((arr) => arr.filter((t) => t.id !== id))
  }, [])
  const pushToast = useCallback((t: Omit<ToastSpec, 'id'>) => {
    setToasts((arr) => [...arr, { ...t, id: `t-${Date.now()}-${Math.random()}` }])
  }, [])

  useEffect(() => {
    setState(baseChild.state)
    setEvent(null)
    setTransientLog([])
    setLastMsgOverride('unset')
    setSosAcked(false)
  }, [baseChild.id, baseChild.state])

  useEffect(
    () => () => {
      if (eventTimer.current) window.clearTimeout(eventTimer.current)
    },
    [],
  )

  function fireEvent(e: SparkEvent, holdMs: number) {
    if (eventTimer.current) window.clearTimeout(eventTimer.current)
    setEvent(e)
    setEventKey((k) => k + 1)
    eventTimer.current = window.setTimeout(() => setEvent(null), holdMs)
  }

  function appendEvent(ev: KairoEvent) {
    setTransientLog((arr) => [ev, ...arr])
  }

  async function toggleLive() {
    if (bleStatus === 'connected' || bleStatus === 'connecting') {
      await bleRef.current?.disconnect()
      setLiveSnap(null)
      return
    }
    setBleError(null)
    if (!bleRef.current) {
      const b = new KairoBle()
      b.onSnapshot((s) => {
        setLiveSnap(s)
        setState(s.state)
      })
      b.onStatus((status, msg) => {
        setBleStatus(status)
        if (msg) setBleError(msg)
      })
      bleRef.current = b
    }
    try {
      await bleRef.current.connect()
    } catch {
      // Status listener already captured the error.
    }
  }

  const child = liveSnap
    ? {
        ...baseChild,
        hr: liveSnap.hr,
        spo2: liveSnap.spo2,
        tempC: liveSnap.tempC,
        steps: liveSnap.steps,
        battery: liveSnap.battery,
        lastSync: 'live',
      }
    : baseChild
  const stepsPct = Math.min(100, Math.round((child.steps / child.stepsGoal) * 100))
  const isWorried = state === 'worried'
  const tempDelta = +(child.tempC - child.tempBaseline).toFixed(2)
  const tempAttention = Math.abs(tempDelta) >= 0.2

  const hrData =
    hrRange === '1d'
      ? child.hrSeries
      : hrRange === '7d'
      ? child.hrSeriesWeek
      : child.hrSeriesMonth

  const hrLabels =
    hrRange === '1d'
      ? undefined
      : hrRange === '7d'
      ? weekLabels.map((l, i) => ({ i, label: l }))
      : [
          { i: 0, label: '1' },
          { i: 9, label: '10' },
          { i: 19, label: '20' },
          { i: 29, label: '30' },
        ]

  const ageWord = (n: number) => (n === 1 ? 'yr old' : 'yrs old')

  const allEvents = [...transientLog, ...child.events]

  const homeZone = child.zones.find((z) => z.kind === 'home')
  const schoolZone = child.zones.find((z) => z.kind === 'school')
  const place = child.location.place
  const currentPlace: 'home' | 'school' | 'between' =
    place === homeZone?.name
      ? 'home'
      : place === schoolZone?.name
      ? 'school'
      : /school|daycare|kinder/i.test(place)
      ? 'school'
      : /home/i.test(place)
      ? 'home'
      : 'between'

  const schoolRule = rules.find((r) => r.kind === 'school' && r.enabled)
  const inSchoolWindow = (() => {
    if (!schoolRule?.start || !schoolRule?.end) return false
    const now = new Date()
    const cur = now.getHours() * 60 + now.getMinutes()
    const [sh, sm] = schoolRule.start.split(':').map(Number)
    const [eh, em] = schoolRule.end.split(':').map(Number)
    return cur >= sh * 60 + sm && cur <= eh * 60 + em
  })()
  const schoolModeLive = !!schoolRule && currentPlace === 'school' && inSchoolWindow

  return (
    <div className="min-h-screen bg-app-bg text-app-ink">
      <header className="border-b border-app-line bg-app-bg/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-[15px] font-semibold tracking-tight">Kairo</span>
            <span className="text-xs text-app-muted">parent dashboard</span>
            <button
              onClick={toggleLive}
              title={bleError ?? ''}
              className={`cursor-pointer text-[11px] px-2 py-0.5 rounded-full border transition-colors duration-150 ${
                bleStatus === 'connected'
                  ? 'bg-app-green/10 border-app-green/30 text-app-green'
                  : bleStatus === 'connecting'
                  ? 'bg-app-line border-app-line-2 text-app-muted'
                  : bleStatus === 'unsupported'
                  ? 'bg-app-line border-app-line-2 text-app-muted/70 cursor-not-allowed'
                  : 'bg-app-surface border-app-line-2 text-app-muted hover:text-app-ink'
              }`}
            >
              {bleStatus === 'connected'
                ? '● live'
                : bleStatus === 'connecting'
                ? 'connecting…'
                : bleStatus === 'unsupported'
                ? 'live N/A'
                : 'mock'}
            </button>
          </div>
          <nav className="flex items-center gap-1">
            {stateOrder.map((s) => (
              <button
                key={s}
                onClick={() => setState(s)}
                className={`text-[13px] cursor-pointer px-3 py-1.5 rounded-full transition-colors duration-200 ${
                  s === state
                    ? 'bg-app-ink text-white'
                    : 'text-app-muted hover:text-app-ink'
                }`}
              >
                {stateLabels[s].label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-8 py-10 space-y-12">
        {/* Child switcher */}
        {mockChildren.length > 1 && (
          <nav className="flex gap-2">
            {mockChildren.map((c) => {
              const active = c.id === childId
              return (
                <button
                  key={c.id}
                  onClick={() => setChildId(c.id)}
                  className={`cursor-pointer text-[13px] px-3.5 py-1.5 rounded-full border transition-colors duration-200 ${
                    active
                      ? 'bg-app-ink text-white border-app-ink'
                      : 'border-app-line-2 text-app-muted hover:text-app-ink hover:border-app-ink/30'
                  }`}
                >
                  {c.name}
                  <span className={`ml-1.5 text-xs ${active ? 'text-white/60' : 'text-app-muted'}`}>
                    {c.age}
                  </span>
                </button>
              )
            })}
          </nav>
        )}

        {/* Hero */}
        <section className="grid sm:grid-cols-[auto_1fr] items-center gap-8 sm:gap-12">
          <div className="flex justify-center">
            <SparkV1 state={state} event={event} eventKey={eventKey} size={200} />
          </div>
          <div className="text-center sm:text-left">
            <div className="text-xs uppercase tracking-[0.12em] text-app-muted">
              {child.lastSync}
            </div>
            <h1 className="mt-2 text-[44px] sm:text-[56px] leading-[1.05] font-semibold tracking-tight">
              {child.name}
              <span className="text-app-muted font-normal text-2xl sm:text-3xl ml-3 align-middle">
                {child.age} {ageWord(child.age)}
              </span>
            </h1>
            <p
              className={`mt-3 text-lg ${
                isWorried ? 'text-app-red font-medium' : 'text-app-ink-2'
              }`}
            >
              {stateLabels[state].label} · {stateLabels[state].sub}
            </p>

            {schoolModeLive && (
              <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-app-blue bg-app-blue/10 rounded-full px-2.5 py-1">
                <SchoolIcon width={13} height={13} />
                School mode · quiet pulse every 20 min
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                data-testid="btn-hug"
                onClick={() => {
                  fireEvent('parent_touch', 1500)
                  appendEvent({
                    id: `hug-${Date.now()}`,
                    kind: 'parent_touch',
                    text: `You hugged ${child.name} through the band`,
                    ts: 'just now',
                  })
                  pushToast({
                    emoji: '💛',
                    title: `Hug sent to ${child.name}'s band`,
                    sub: 'soft buzz · HAP-03 · 2 pulses',
                  })
                }}
                className="cursor-pointer text-[14px] font-medium px-4 py-2.5 rounded-full bg-app-ink text-white hover:opacity-90 transition-opacity duration-200 inline-flex items-center gap-2"
              >
                <HugIcon width={15} height={15} />
                Hug
              </button>
              <button
                onClick={() => setMsgOpen(true)}
                className="cursor-pointer text-[14px] font-medium px-4 py-2.5 rounded-full bg-app-surface border border-app-line-2 hover:bg-app-line transition-colors duration-200 inline-flex items-center gap-2"
              >
                <MessageIcon width={15} height={15} />
                Message
              </button>
              <button className="cursor-pointer text-[14px] font-medium px-4 py-2.5 rounded-full bg-app-surface border border-app-line-2 hover:bg-app-line transition-colors duration-200 inline-flex items-center gap-2">
                <PinIcon width={15} height={15} />
                Locate
              </button>
            </div>
          </div>
        </section>

        {/* SOS — only when worried */}
        {isWorried && (
          <section>
            <SosBanner
              childName={child.name}
              acknowledged={sosAcked}
              onAcknowledge={() => {
                if (!sosAcked) {
                  appendEvent({
                    id: `sos-ack-${Date.now()}`,
                    kind: 'parent_touch',
                    text: `You acknowledged ${child.name}'s alert`,
                    ts: 'just now',
                  })
                }
                setSosAcked((v) => !v)
              }}
              triggeredAgo="2 min ago"
            />
          </section>
        )}

        {/* Stats */}
        <section>
          <h2 className="text-[13px] uppercase tracking-[0.12em] text-app-muted mb-4">
            Now
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatTile
              label="Heart rate"
              value={child.hr}
              unit="bpm"
              hint={isWorried ? 'above range' : `baseline ~${child.hrBaseline}`}
              status={isWorried ? 'attention' : 'normal'}
              icon={<HeartIcon width={16} height={16} />}
              accent="text-app-red"
              chart={<Sparkline data={child.hrSeries} color="#FF3B30" width={70} height={22} />}
            />
            <StatTile
              label="SpO₂"
              value={child.spo2}
              unit="%"
              hint="normal ≥ 95%"
              status="good"
              icon={<LungsIcon width={16} height={16} />}
              accent="text-app-blue"
            />
            <StatTile
              label="Temperature"
              value={child.tempC.toFixed(1)}
              unit="°C"
              hint={
                tempAttention
                  ? `Δ ${tempDelta > 0 ? '+' : ''}${tempDelta}° vs baseline`
                  : `baseline ${child.tempBaseline.toFixed(1)}° (14d)`
              }
              status={tempAttention ? 'attention' : 'normal'}
              icon={<ThermometerIcon width={16} height={16} />}
              accent="text-app-orange"
            />
            <StatTile
              label="Steps"
              value={child.steps.toLocaleString('en')}
              unit={`/ ${child.stepsGoal.toLocaleString('en')}`}
              hint={`${stepsPct}% of daily goal`}
              status="normal"
              icon={<StepsIcon width={16} height={16} />}
              accent="text-app-green"
              chart={
                <Sparkline data={child.stepsSeries} color="#34C759" width={70} height={22} fill />
              }
            />
            <StatTile
              label="Battery"
              value={child.battery}
              unit="%"
              hint={
                child.battery < 15
                  ? 'critical'
                  : child.battery < 30
                  ? 'charge soon'
                  : 'good for the day'
              }
              status={
                child.battery < 15
                  ? 'attention'
                  : child.battery < 30
                  ? 'attention'
                  : 'normal'
              }
              icon={<BatteryIcon width={16} height={16} />}
              accent={child.battery < 30 ? 'text-app-orange' : 'text-app-green'}
            />
            <div className="rounded-2xl bg-app-surface border border-app-line p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-app-ink-2">Wear time</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="tabular">
                  <div className="text-[34px] leading-none font-semibold tracking-tight">
                    {Math.round(child.wearPct * 100)}
                    <span className="text-sm text-app-muted font-normal ml-1">%</span>
                  </div>
                </div>
                <WearTimeRing pct={child.wearPct} size={48} />
              </div>
              <div className="text-xs text-app-muted">of awake hours</div>
            </div>
          </div>
        </section>

        {/* Heart chart */}
        <section>
          <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-[13px] uppercase tracking-[0.12em] text-app-muted">
              Heart rate
            </h2>
            <TimeRangeToggle value={hrRange} onChange={setHrRange} />
          </div>
          <div className="rounded-2xl bg-app-surface border border-app-line p-5 sm:p-6">
            <HeartChart data={hrData} baseline={child.hrBaseline} xLabels={hrLabels} />
          </div>
        </section>

        {/* Sleep */}
        <section>
          <h2 className="text-[13px] uppercase tracking-[0.12em] text-app-muted mb-4">
            Last night
          </h2>
          <div className="rounded-2xl bg-app-surface border border-app-line p-5 sm:p-6">
            <SleepCard night={child.sleep} />
          </div>
        </section>

        {/* Geo: live map + zones */}
        <section>
          <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
            <h2 className="text-[13px] uppercase tracking-[0.12em] text-app-muted">Location</h2>
            <span className="text-xs text-app-muted">{child.location.address}</span>
          </div>
          <div className="space-y-4">
            <LiveMap
              lat={child.location.lat}
              lng={child.location.lng}
              accuracyM={child.location.accuracyM}
              place={child.location.place}
              address={child.location.address}
              state={state}
              fixAgo={liveSnap ? 'live · 0s' : `updated ${child.lastSync}`}
            />
            <GeofenceList
              zones={child.zones}
              currentZoneId={
                currentPlace === 'home'
                  ? homeZone?.id
                  : currentPlace === 'school'
                  ? schoolZone?.id
                  : undefined
              }
              currentDuration={child.location.duration}
            />
          </div>
        </section>

        {/* Schedule */}
        <section>
          <h2 className="text-[13px] uppercase tracking-[0.12em] text-app-muted mb-4">
            Band schedule
          </h2>
          <ScheduleCard childName={child.name} rules={rules} onChange={setRules} />
        </section>

        {/* Events */}
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-[13px] uppercase tracking-[0.12em] text-app-muted">
              Activity
            </h2>
            <span className="text-xs text-app-muted">today</span>
          </div>
          <div className="rounded-2xl bg-app-surface border border-app-line px-5">
            <EventLog events={allEvents} />
          </div>
        </section>

        {/* Watch link */}
        <section>
          <a
            href={`#watch/${child.id}`}
            className="block rounded-2xl border border-app-line bg-app-surface p-5 sm:p-6 hover:border-app-ink/20 transition-colors duration-150 cursor-pointer"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] uppercase tracking-[0.12em] text-app-muted mb-1">
                  What {child.name} sees
                </div>
                <div className="text-base font-medium">
                  Open watch preview →
                </div>
                <div className="text-xs text-app-muted mt-1">
                  5-screen carousel as on the wrist
                </div>
              </div>
              <div className="hidden sm:block">
                <SparkV1 state={state} size={64} animate={false} />
              </div>
            </div>
          </a>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-6 sm:px-8 pb-10 pt-2 text-xs text-app-muted">
        Kairo · MVP demo · wellness signals, not medical diagnosis
      </footer>

      <MessageDialog
        open={msgOpen}
        childName={child.name}
        onClose={() => setMsgOpen(false)}
        onSend={(m) => {
          setMsgOpen(false)
          setLastMsgOverride({ emoji: m.emoji, text: m.text, ts: 'just now' })
          appendEvent({
            id: `msg-${Date.now()}`,
            kind: 'message',
            text: `Sent to ${child.name}: ${m.emoji} ${m.text}`,
            ts: 'just now',
          })
          pushToast({
            emoji: m.emoji,
            title: `Message sent to ${child.name}'s band`,
            sub: `${m.text} · HAP-06 buzz`,
          })
        }}
      />

      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

export default App

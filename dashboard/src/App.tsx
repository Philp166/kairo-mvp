import { useCallback, useEffect, useRef, useState } from 'react'
import { SparkV1, type SparkState, type SparkEvent } from './components/Spark/SparkV1'
import { EventLog, type KairoEvent } from './components/EventLog'
import { ScheduleCard, type ScheduleRule } from './components/ScheduleCard'
import { GeofenceList } from './components/GeofenceList'
import { SosBanner } from './components/SosBanner'
import { LiveMap } from './components/LiveMap'
import { WellnessReport } from './components/WellnessReport'
import { ToastHost, type ToastSpec } from './components/Toast'
import { WatchPage } from './components/WatchPage'
import { BriefPage } from './components/BriefPage'
import { mockChildren } from './mock'
import { KairoBle, type KairoSnapshot, type KairoBleStatus } from './lib/bleClient'
import { SchoolIcon } from './components/icons'
import { useLogout, useAuthEmail } from './components/AuthGate'
import { OnboardingBanner } from './components/OnboardingBanner'

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

function App() {
  const hash = useHashRoute()
  if (hash.startsWith('#watch')) {
    const watchChildId = hash.split('/')[1]
    return <WatchPage childId={watchChildId} />
  }
  if (hash.startsWith('#brief')) {
    const briefChildId = hash.split('/')[1]
    return <BriefPage childId={briefChildId} />
  }
  return <DashboardPage />
}

function DashboardPage() {
  const logout = useLogout()
  const authEmail = useAuthEmail()
  const [childId, setChildId] = useState(mockChildren[0].id)
  const baseChild = mockChildren.find((c) => c.id === childId) ?? mockChildren[0]
  const [state, setState] = useState<SparkState>(baseChild.state)
  const [event, setEvent] = useState<SparkEvent>(null)
  const [eventKey, setEventKey] = useState(0)
  const [transientLog, setTransientLog] = useState<KairoEvent[]>([])
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
        hr: liveSnap.hr ?? baseChild.hr,
        spo2: liveSnap.spo2 ?? baseChild.spo2,
        tempC: liveSnap.tempC ?? baseChild.tempC,
        steps: liveSnap.steps ?? baseChild.steps,
        battery: liveSnap.battery ?? baseChild.battery,
        lastSync: 'live',
      }
    : baseChild
  const isWorried = state === 'worried'
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
          {/* Brand */}
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[13px] font-semibold tracking-[0.3em] uppercase relative pl-4">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-app-orange rounded-[1px]" />
              KAIRO
            </span>
            <span className="hidden sm:inline mono text-app-muted">DASHBOARD</span>
          </div>

          {/* Child chip */}
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1 bg-app-surface border border-app-line rounded-full">
            <div className="w-6 h-6 rounded-full bg-app-orange text-white flex items-center justify-center text-[11px] font-semibold">
              {child.name[0]}
            </div>
            <span className="text-[13px] font-medium">{child.name}</span>
            <span className="mono text-app-muted" style={{ fontSize: 9 }}>{child.age}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${
              state === 'worried' ? 'bg-app-red shadow-[0_0_8px_var(--color-app-red)]'
                : state === 'active' ? 'bg-app-orange shadow-[0_0_8px_var(--color-app-orange)]'
                : state === 'sleepy' ? 'bg-app-blue shadow-[0_0_8px_var(--color-app-blue)]'
                : 'bg-app-green shadow-[0_0_8px_var(--color-app-green)]'
            }`} />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLive}
              title={bleError ?? ''}
              className={`cursor-pointer mono flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors duration-150 ${
                bleStatus === 'connected'
                  ? 'bg-app-green/10 border-app-green/30 text-app-green'
                  : bleStatus === 'connecting'
                  ? 'bg-app-line border-app-line-2 text-app-muted'
                  : bleStatus === 'unsupported'
                  ? 'bg-app-line border-app-line-2 text-app-muted/70 cursor-not-allowed'
                  : 'bg-app-surface border-app-line-2 text-app-muted hover:text-app-ink'
              }`}
              style={{ fontSize: 10 }}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                bleStatus === 'connected' ? 'bg-app-green shadow-[0_0_8px_var(--color-app-green)]' : 'bg-app-muted'
              }`} />
              {bleStatus === 'connected'
                ? 'LIVE'
                : bleStatus === 'connecting'
                ? '...'
                : bleStatus === 'unsupported'
                ? 'N/A'
                : 'MOCK'}
            </button>
            <nav className="hidden md:flex items-center gap-0.5 bg-app-surface border border-app-line-2 p-0.5">
              {stateOrder.map((s) => (
                <button
                  key={s}
                  onClick={() => setState(s)}
                  className={`mono cursor-pointer px-2.5 py-1 transition-colors duration-200 ${
                    s === state
                      ? 'bg-app-ink text-white'
                      : 'text-app-muted hover:text-app-ink'
                  }`}
                  style={{ fontSize: 10 }}
                >
                  {stateLabels[s].label}
                </button>
              ))}
            </nav>
            <div className="hidden sm:flex items-center gap-2 mono text-app-muted border-l border-app-line-2 pl-3" style={{ fontSize: 9 }}>
              <span className="truncate max-w-[100px]">{authEmail}</span>
              <button
                onClick={() => logout?.()}
                className="cursor-pointer text-app-muted hover:text-app-ink transition-colors"
              >
                EXIT
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12">
        {/* Child switcher */}
        {mockChildren.length > 1 && (
          <nav className="flex gap-2">
            {mockChildren.map((c) => {
              const active = c.id === childId
              return (
                <button
                  key={c.id}
                  onClick={() => setChildId(c.id)}
                  className={`cursor-pointer text-[13px] px-3.5 py-1.5 border transition-colors duration-200 ${
                    active
                      ? 'bg-app-ink text-white border-app-ink'
                      : 'border-app-line-2 text-app-muted hover:text-app-ink hover:border-app-orange/40'
                  }`}
                >
                  {c.name}
                  <span className={`ml-1.5 mono ${active ? 'text-white/60' : 'text-app-muted'}`} style={{ fontSize: 9 }}>
                    {c.age}
                  </span>
                </button>
              )
            })}
          </nav>
        )}

        {/* BLE onboarding */}
        <OnboardingBanner
          bleStatus={bleStatus}
          onConnect={toggleLive}
          lastDataAgo={liveSnap ? 'just now' : undefined}
        />

        {/* Hero */}
        <section className="relative bg-app-surface border border-app-line p-6 sm:p-8">
          <span className="absolute top-[-1px] left-[-1px] w-4 h-4 border-l-[1.5px] border-t-[1.5px] border-app-orange pointer-events-none" />
          <span className="absolute bottom-[-1px] right-[-1px] w-4 h-4 border-r-[1.5px] border-b-[1.5px] border-app-orange pointer-events-none" />
          <div className="grid sm:grid-cols-[auto_1fr] items-center gap-5 sm:gap-12">
            <div className="flex justify-center">
              <SparkV1
                state={state}
                event={event}
                eventKey={eventKey}
                size={140}
                className="sm:!w-[200px] sm:!h-[200px]"
              />
            </div>
            <div className="text-center sm:text-left">
              <div className="mono text-app-muted" style={{ fontSize: 9 }}>
                {child.lastSync === 'live' ? 'LIVE · SYNCED' : child.lastSync.toUpperCase()}
              </div>
              <h1 className="mt-1 sm:mt-2 text-[34px] sm:text-[56px] leading-[1.05] font-medium tracking-[-0.03em]">
                {child.name}
                <span className="text-app-muted font-normal text-lg sm:text-3xl ml-2 sm:ml-3 align-middle">
                  {child.age} {ageWord(child.age)}
                </span>
              </h1>
              <p
                className={`mt-2 sm:mt-3 text-base sm:text-lg ${
                  isWorried ? 'text-app-red font-medium' : 'text-app-ink-2'
                }`}
              >
                {stateLabels[state].label} · {stateLabels[state].sub}
              </p>

              {schoolModeLive && (
                <div className="mt-3 inline-flex items-center gap-1.5 mono text-app-blue bg-app-blue/10 px-2.5 py-1" style={{ fontSize: 10 }}>
                  <SchoolIcon width={13} height={13} />
                  SCHOOL MODE · QUIET PULSE / 20 MIN
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2.5 justify-center sm:justify-start">
                {(
                  [
                    { id: 'hug', glyph: '♥', label: 'Hug', primary: true, hap: 'HAP-03' },
                    { id: 'cheer', glyph: '★', label: 'Cheer', primary: false, hap: 'HAP-02' },
                    { id: 'bedtime', glyph: '☾', label: 'Bedtime', primary: false, hap: 'HAP-04' },
                    { id: 'home', glyph: '▲', label: 'Come home', primary: false, hap: 'HAP-03' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    data-testid={`btn-${t.id}`}
                    onClick={() => {
                      if (t.id === 'hug') fireEvent('parent_touch', 1500)
                      if (bleStatus === 'connected' && bleRef.current) {
                        bleRef.current.sendHug().catch(console.error)
                      }
                      appendEvent({
                        id: `tap-${t.id}-${Date.now()}`,
                        kind: 'parent_touch',
                        text: `${t.glyph} ${t.label} sent to ${child.name}`,
                        ts: 'just now',
                      })
                      pushToast({
                        emoji: t.glyph,
                        title: `${t.label} sent to ${child.name}'s band`,
                        sub: `soft buzz · ${t.hap}`,
                      })
                    }}
                    className={`cursor-pointer text-left px-3.5 py-2.5 border transition-all duration-150 active:scale-[0.97] ${
                      t.primary
                        ? 'bg-app-ink text-white border-app-ink hover:border-app-orange'
                        : 'bg-app-bg border-app-line text-app-ink hover:border-app-orange hover:-translate-y-px'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`text-base leading-none ${t.primary ? 'text-app-orange/80' : 'text-app-orange'}`}>{t.glyph}</span>
                      <span className="text-[13px] font-medium">{t.label}</span>
                      <span className="mono border-l border-dashed border-current/30 pl-2 ml-1" style={{ fontSize: 9, opacity: 0.5 }}>{t.hap}</span>
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-2 mono text-app-muted text-center sm:text-left" style={{ fontSize: 9 }}>
                ONE-TAP SIGNALS — NO CHAT, NO FREE TEXT. THE BAND BUZZES ONCE.
              </div>
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

        {/* Wellness report */}
        <section className="mt-10">
          <div className="flex items-baseline gap-4 mb-5 pb-3 border-b border-dashed border-app-line">
            <span className="mono text-app-orange" style={{ fontSize: 11, letterSpacing: '0.2em' }}>01 / WELLNESS</span>
            <span className="text-[20px] font-medium tracking-[-0.02em]">Daily report</span>
            <span className="text-[12px] text-app-muted ml-auto">signals, not diagnosis</span>
          </div>
          <WellnessReport
            hr={child.hr}
            hrBaseline={child.hrBaseline}
            spo2={child.spo2}
            tempC={child.tempC}
            tempBaseline={child.tempBaseline}
            steps={child.steps}
            stepsGoal={child.stepsGoal}
            battery={child.battery}
            wearPct={child.wearPct}
            lastSync={child.lastSync}
            hrSeries={child.hrSeries}
            hrSeriesWeek={child.hrSeriesWeek}
            hrSeriesMonth={child.hrSeriesMonth}
            hrvSeries={child.hrvSeries}
            spo2NightSeries={child.spo2NightSeries}
            tempDeltaSeries={child.tempDeltaSeries}
            sleepScore={child.sleepScoreSeries[child.sleepScoreSeries.length - 1] ?? 80}
            sleepScoreSeries={child.sleepScoreSeries}
            stepsDailySeries={child.stepsDailySeries}
            briefHref={`#brief/${child.id}`}
            briefMonths={child.record.monthsTracked}
          />
        </section>

        {/* Geo */}
        <section>
          <div className="flex items-baseline gap-4 mb-5 pb-3 border-b border-dashed border-app-line">
            <span className="mono text-app-orange" style={{ fontSize: 11, letterSpacing: '0.2em' }}>02 / GEO</span>
            <span className="text-[20px] font-medium tracking-[-0.02em]">Location</span>
            <span className="text-[12px] text-app-muted ml-auto">geofence overview</span>
          </div>
          <div className="space-y-4">
            <LiveMap
              lat={child.location.lat}
              lng={child.location.lng}
              zoneStatus={currentPlace}
              currentZoneName={
                currentPlace === 'home'
                  ? homeZone?.name
                  : currentPlace === 'school'
                  ? schoolZone?.name ?? child.location.place
                  : null
              }
              currentDuration={child.location.duration}
              fixAgo={liveSnap ? 'updated live' : `updated ${child.lastSync}`}
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
          <div className="flex items-baseline gap-4 mb-5 pb-3 border-b border-dashed border-app-line">
            <span className="mono text-app-orange" style={{ fontSize: 11, letterSpacing: '0.2em' }}>03 / SCHEDULE</span>
            <span className="text-[20px] font-medium tracking-[-0.02em]">Band schedule</span>
          </div>
          <ScheduleCard childName={child.name} rules={rules} onChange={setRules} />
        </section>

        {/* Events */}
        <section>
          <div className="flex items-baseline gap-4 mb-5 pb-3 border-b border-dashed border-app-line">
            <span className="mono text-app-orange" style={{ fontSize: 11, letterSpacing: '0.2em' }}>04 / ACTIVITY</span>
            <span className="text-[20px] font-medium tracking-[-0.02em]">Events</span>
            <span className="text-[12px] text-app-muted ml-auto">today</span>
          </div>
          <div className="bg-app-surface border border-app-line px-5">
            <EventLog events={allEvents} />
          </div>
        </section>

        {/* Watch preview link */}
        <section>
          <a
            href={`#watch/${child.id}`}
            className="relative block border border-app-line bg-app-surface p-5 sm:p-6 hover:border-app-orange/40 transition-colors duration-150 cursor-pointer"
          >
            <span className="absolute top-[-1px] left-[-1px] w-3 h-3 border-l-[1.5px] border-t-[1.5px] border-app-orange pointer-events-none" />
            <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 border-r-[1.5px] border-b-[1.5px] border-app-orange pointer-events-none" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="mono text-app-muted mb-1" style={{ fontSize: 9 }}>
                  WHAT {child.name.toUpperCase()} SEES
                </div>
                <div className="text-base font-medium">
                  Open watch preview →
                </div>
                <div className="mono text-app-muted mt-1" style={{ fontSize: 9, textTransform: 'none', letterSpacing: '0.04em' }}>
                  Glanceable faces — points back to the kid, not the device
                </div>
              </div>
              <div className="hidden sm:block">
                <SparkV1 state={state} size={64} animate={false} />
              </div>
            </div>
          </a>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-6 sm:px-8 pb-10 pt-4 mt-8 border-t border-app-line">
        <div className="mono text-app-muted" style={{ fontSize: 9 }}>
          KAIRO · MVP DEMO · WELLNESS SIGNALS, NOT MEDICAL DIAGNOSIS
        </div>
      </footer>

      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

export default App

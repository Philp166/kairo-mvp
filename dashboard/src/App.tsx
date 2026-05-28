import { useCallback, useEffect, useRef, useState } from 'react'
import { LangProvider, useT, type Lang } from './lib/i18n'
import { api, type Overview, type ApiEvent, type Zone, type Snapshot } from './lib/api'
import { DashboardHeader } from './components/DashboardHeader'
import { HeroPanel } from './components/HeroPanel'
import { KairoToast, type ToastData } from './components/KairoToast'
import { SectionHead } from './components/SectionHead'
import { VitalChipBank, type VitalChipProps } from './components/VitalChip'
import MoodScrub from './components/MoodScrub'
import HrTrendChart from './components/HrTrendChart'
import { StatTile, HrvGauge } from './components/KairoStatTile'
import ScheduleArc from './components/ScheduleArc'
import LocationRadar from './components/LocationRadar'
import ActivityTape from './components/ActivityTape'
import { WatchPage } from './components/WatchPage'
import { BriefPage } from './components/BriefPage'
import { KairoBle, type KairoSnapshot, type KairoBleStatus } from './lib/bleClient'
import { setPairedDeviceId } from './components/AuthGate'
import type { SparkState } from './components/Spark'

/* ── Helpers ──────────────────────────────────────────── */

const CHILD_ID = 'masha' // single-child MVP, auth later

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h ago`
  return `${Math.floor(h / 24)} d ago`
}

/** Convert API snapshot series → HR number array for chart (one per half-hour slot) */
function seriesToHr(snaps: Snapshot[]): number[] {
  if (!snaps.length) return []
  const slots: number[] = new Array(48).fill(0)
  const counts: number[] = new Array(48).fill(0)
  for (const s of snaps) {
    if (s.hr == null) continue
    const d = new Date(s.ts)
    const slot = d.getHours() * 2 + (d.getMinutes() >= 30 ? 1 : 0)
    slots[slot] += s.hr
    counts[slot]++
  }
  return slots.map((sum, i) => (counts[i] ? Math.round(sum / counts[i]) : 0))
}

/* ── Router ───────────────────────────────────────────── */

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

/* ── Empty state card ─────────────────────────────────── */

function EmptyCard({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="panel-card" style={{ padding: '32px 24px', textAlign: 'center', opacity: 0.6 }}>
      <div className="mono dim" style={{ fontSize: 11, letterSpacing: '0.15em', marginBottom: 8 }}>
        {title}
      </div>
      <div className="mono" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{sub}</div>
    </div>
  )
}

/* ── Main dashboard ───────────────────────────────────── */

function DashboardMain({ lang, onLang }: { lang: Lang; onLang: (l: Lang) => void }) {
  const { t } = useT()

  /* ── API state ── */
  const [overview, setOverview] = useState<Overview | null>(null)
  const [events, setEvents] = useState<ApiEvent[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [series, setSeries] = useState<Snapshot[]>([])
  const [childName, setChildName] = useState('—')
  const [apiOk, setApiOk] = useState<boolean | null>(null) // null = loading

  /* ── BLE state ── */
  const [bleStatus, setBleStatus] = useState<KairoBleStatus>('idle')
  const [liveSnap, setLiveSnap] = useState<KairoSnapshot | null>(null)
  const [historySnaps, setHistorySnaps] = useState<KairoSnapshot[]>([])
  const bleRef = useRef<KairoBle | null>(null)

  /* ── UI state ── */
  const [sparkState, setSparkState] = useState<SparkState>('calm')
  const [scrubHour, setScrubHour] = useState(23)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [bleEvents, setBleEvents] = useState<{ id: string; kind: string; text: string; ts: string }[]>([])

  /* ── Fetch data from API ── */
  const fetchAll = useCallback(async () => {
    try {
      const [ov, ev, zn, sr, ch] = await Promise.all([
        api.overview(CHILD_ID),
        api.events(CHILD_ID),
        api.zones(CHILD_ID),
        api.series(CHILD_ID, 24),
        api.child(CHILD_ID),
      ])
      setOverview(ov)
      setEvents(ev)
      setZones(zn)
      setSeries(sr)
      setChildName(ch?.name ?? 'Child')
      setApiOk(true)
      if (ov.snapshot?.state) setSparkState(ov.snapshot.state as SparkState)
    } catch (e) {
      console.error('[kairo] API fetch failed:', e)
      setApiOk(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Refresh data every 30s
  useEffect(() => {
    if (!apiOk) return
    const id = setInterval(fetchAll, 30_000)
    return () => clearInterval(id)
  }, [apiOk, fetchAll])

  /* ── BLE ── */
  async function toggleBle() {
    if (bleStatus === 'connected' || bleStatus === 'connecting') {
      await bleRef.current?.disconnect()
      setLiveSnap(null)
      return
    }
    if (!bleRef.current) {
      const b = new KairoBle()
      b.onSnapshot((s) => {
        if (s.isHistory) {
          setHistorySnaps(prev => [...prev, s])
          api.postSnapshot({
            childId: CHILD_ID,
            hr: s.hr || undefined,
            spo2: s.spo2 || undefined,
            tempC: s.tempC || undefined,
            steps: s.steps || undefined,
            battery: s.battery || undefined,
            state: s.state,
          }).catch(() => {})
          return
        }

        setLiveSnap(s)
        setSparkState(s.state as SparkState)
        if (s.event) {
          const eventText: Record<string, string> = {
            sos: 'SOS triggered on band',
            sos_clear: 'SOS cleared',
            goal_reached: 'Step goal reached!',
          }
          const eventToast: Record<string, ToastData> = {
            sos: { glyph: '!', title: 'SOS ALERT', sub: 'Child activated SOS on band', hap: 'HAP-01' },
            goal_reached: { glyph: '★', title: 'GOAL REACHED', sub: 'Step goal completed', hap: 'HAP-02' },
          }
          setBleEvents(prev => [{
            id: `ble-${Date.now()}`,
            kind: s.event!,
            text: eventText[s.event!] ?? s.event!,
            ts: 'just now',
          }, ...prev].slice(0, 50))
          if (eventToast[s.event!]) setToast(eventToast[s.event!])
        }
        api.postSnapshot({
          childId: CHILD_ID,
          hr: s.hr || undefined,
          spo2: s.spo2 || undefined,
          tempC: s.tempC || undefined,
          steps: s.steps || undefined,
          battery: s.battery || undefined,
          state: s.state,
        }).catch(() => {})
      })
      b.onStatus((status, _msg) => {
        setBleStatus(status)
        if (status === 'connected') {
          const devId = b.getDeviceId()
          if (devId) setPairedDeviceId(devId)
        }
      })
      b.onHistoryDone(() => {
        const count = historySnaps.length
        if (count > 0) {
          setToast({ glyph: '↓', title: 'SYNC DONE', sub: `${count} cached readings synced`, hap: 'HAP-02' })
          setHistorySnaps([])
          fetchAll()
        }
      })
      bleRef.current = b
    }
    try {
      await bleRef.current.connect()
    } catch { /* status listener captured error */ }
  }

  /* ── Derived data ── */
  const snap = overview?.snapshot
  const hasData = (overview?.snapshotCount ?? 0) > 0

  // Current vitals: live BLE > latest API snapshot > null
  const hr = liveSnap?.hr ?? snap?.hr ?? null
  const spo2 = liveSnap?.spo2 ?? snap?.spo2 ?? null
  const tempC = liveSnap?.tempC ?? snap?.temp_c ?? null
  const steps = liveSnap?.steps ?? snap?.steps ?? null
  const battery = liveSnap?.battery ?? snap?.battery ?? null

  const lastSync = snap?.ts ? timeAgo(snap.ts) : '—'
  const tempDelta = tempC != null ? tempC - 36.6 : 0
  const tempStr = tempC != null ? `${tempDelta >= 0 ? '+' : ''}${tempDelta.toFixed(1)}` : '—'

  const heroVitals = {
    hr:      { value: hr ?? '—', color: 'var(--accent)' },
    spo2:    { value: spo2 ?? '—', color: 'var(--ok)' },
    temp:    { value: tempStr, color: tempDelta > 0.3 ? 'var(--alert)' : 'var(--ok)' },
    battery: { value: battery ?? '—', color: battery != null && battery < 20 ? 'var(--alert)' : 'var(--ok)' },
  }

  const hrSeries = seriesToHr(series)

  const handleTouch = useCallback(
    (kind: string) => {
      if (bleStatus === 'connected' && bleRef.current) {
        const send = kind === 'cheer' ? bleRef.current.sendCheer()
                   : kind === 'bedtime' ? bleRef.current.sendBedtime()
                   : bleRef.current.sendHug()
        send.catch(() => {})
      }
      // Log event to backend
      const textMap: Record<string, string> = {
        hug: `You hugged ${childName} through the band`,
        cheer: `You cheered ${childName} on`,
        bedtime: `Bedtime signal sent to ${childName}`,
      }
      api.postEvent({
        childId: CHILD_ID,
        kind: kind === 'hug' ? 'parent_touch' : kind,
        text: textMap[kind] ?? `Touch: ${kind}`,
      }).then(() => fetchAll()).catch(() => {})

      const map: Record<string, ToastData> = {
        hug:     { glyph: '♥', title: t('toast.hug.title'),   sub: t('toast.hug.sub'),   hap: 'HAP-03' },
        cheer:   { glyph: '★', title: t('toast.cheer.title'), sub: t('toast.cheer.sub'), hap: 'HAP-02' },
        bedtime: { glyph: '☾', title: t('toast.bed.title'),   sub: t('toast.bed.sub'),   hap: 'HAP-04' },
      }
      setToast(map[kind] ?? map.hug)
    },
    [bleStatus, t, childName, fetchAll],
  )

  /* ── Vitals chips — only show data if we have it ── */
  const vitals: VitalChipProps[] = [
    {
      slot: 'HR',
      label: t('v.hr.label'),
      value: hr ?? '—',
      unit: hr != null ? 'BPM' : '',
      delta: hasData ? t('v.hr.delta') : 'NO DATA YET',
      status: hr != null ? (hr > 120 ? 'alert' : hr > 100 ? 'warn' : 'norm') : 'norm',
      color: 'var(--accent)',
      data: hrSeries.length ? hrSeries : [],
    },
    {
      slot: 'SPO2',
      label: t('v.spo2.label'),
      value: spo2 ?? '—',
      unit: spo2 != null ? '%' : '',
      delta: hasData ? t('v.spo2.delta') : 'NO DATA YET',
      status: spo2 != null ? (spo2 < 94 ? 'alert' : spo2 < 96 ? 'warn' : 'norm') : 'norm',
      color: 'var(--ok)',
      data: [],
    },
    {
      slot: 'TEMP',
      label: t('v.temp.label'),
      value: tempC?.toFixed(1) ?? '—',
      unit: tempC != null ? '°C' : '',
      delta: hasData ? t('v.temp.delta') : 'NO DATA YET',
      status: tempC != null ? (Math.abs(tempDelta) > 0.5 ? 'warn' : 'norm') : 'norm',
      color: 'var(--lavender)',
      data: [],
    },
    {
      slot: 'STEP',
      label: t('v.step.label'),
      value: steps != null ? steps.toLocaleString() : '—',
      unit: '',
      delta: hasData ? t('v.step.delta') : 'NO DATA YET',
      status: 'norm',
      color: 'var(--ink-2)',
      data: [],
    },
  ]

  /* ── Map API zones → LocationRadar props ── */
  const radarZones = zones.map((z) => ({
    id: z.id,
    name: z.name,
    kind: z.kind,
    active: z.active,
    lastEvent: z.last_event_type && z.last_event_ts
      ? { type: z.last_event_type, ts: timeAgo(z.last_event_ts) }
      : undefined,
  }))

  /* ── Map API events → ActivityTape props, merge BLE live events ── */
  const apiTapeEvents = events.map((e) => ({
    id: String(e.id),
    kind: e.kind,
    text: e.text,
    ts: timeAgo(e.ts),
  }))
  const tapeEvents = [...bleEvents, ...apiTapeEvents]

  /* ── Render ── */

  // API still loading
  if (apiOk === null) {
    return (
      <div className="dashboard-root">
        <div className="dash-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="mono dim" style={{ fontSize: 13, letterSpacing: '0.15em' }}>CONNECTING TO KAIRO...</div>
        </div>
      </div>
    )
  }

  // API unreachable
  if (apiOk === false) {
    return (
      <div className="dashboard-root">
        <div className="dash-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
          <div className="mono" style={{ fontSize: 15, color: 'var(--alert)', letterSpacing: '0.12em' }}>BACKEND OFFLINE</div>
          <div className="mono dim" style={{ fontSize: 12, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
            Server not reachable. Start it with: cd server && npm run dev
          </div>
          <button className="cartridge-btn" onClick={fetchAll} style={{ marginTop: 8 }}>
            RETRY
          </button>
        </div>
      </div>
    )
  }

  const sleepScore = overview?.lastSleep?.score ?? null
  const sleepSub = overview?.lastSleep
    ? `${overview.lastSleep.total_min ? Math.floor(overview.lastSleep.total_min / 60) + 'h ' + (overview.lastSleep.total_min % 60) + 'm' : '—'} · ${overview.lastSleep.awakenings} wake${overview.lastSleep.awakenings !== 1 ? 's' : ''}`
    : 'NO SLEEP DATA YET'

  return (
    <div className="dashboard-root">
      <DashboardHeader
        lang={lang}
        onLang={onLang}
        ble={bleStatus === 'connected' ? 'live' : hasData ? 'idle' : 'idle'}
        onToggleBle={toggleBle}
        childName={childName}
        childInitial={childName[0] ?? '?'}
      />

      <main className="dash-main">
        <HeroPanel
          sparkState={sparkState}
          scrubHour={scrubHour}
          scrubMoment={undefined}
          vitals={heroVitals}
          onTouch={handleTouch}
        />

        <SectionHead num="01" titleKey="sec.vitals.title" subKey="sec.vitals.sub" />
        {hasData ? (
          <VitalChipBank vitals={vitals} scrubHour={null} />
        ) : (
          <>
            <VitalChipBank vitals={vitals} scrubHour={null} />
            <div className="mono dim" style={{ textAlign: 'center', fontSize: 11, marginTop: -16, letterSpacing: '0.12em' }}>
              PAIR BAND TO START COLLECTING · NO READINGS YET
            </div>
          </>
        )}

        <SectionHead num="02" titleKey="sec.scrub.title" subKey="sec.scrub.sub" />
        {hasData ? (
          <MoodScrub scrubHour={scrubHour} onScrub={setScrubHour} />
        ) : (
          <EmptyCard title="MOOD TIMELINE" sub="Needs 24h of band data to reconstruct the day" />
        )}

        <SectionHead num="03" titleKey="sec.trends.title" subKey="sec.trends.sub" />
        {hrSeries.some(v => v > 0) ? (
          <HrTrendChart data={hrSeries} scrubHour={scrubHour < 23 ? scrubHour : null} />
        ) : (
          <EmptyCard title="HR 24H CHART" sub="Will populate as heart rate data arrives from the band" />
        )}

        <div className="stat-row">
          <StatTile
            slot="SLEEP"
            label={t('stat.sleep.label')}
            value={sleepScore ?? '—'}
            unit={sleepScore != null ? '/100' : ''}
            sub={sleepSub}
            color="var(--lavender)"
          />
          <StatTile
            slot="HRV"
            label={t('stat.hrv.label')}
            value={overview?.today?.hrv_rmssd != null ? Math.round(overview.today.hrv_rmssd) : '—'}
            unit={overview?.today?.hrv_rmssd != null ? 'ms' : ''}
            sub={overview?.today?.hrv_rmssd != null ? 'RMSSD · LAST 5 MIN · RESTING BAND' : 'NEEDS RESTING HR DATA'}
            color="var(--accent)"
          >
            {overview?.today?.hrv_rmssd != null && (
              <HrvGauge value={Math.round(overview.today.hrv_rmssd)} />
            )}
          </StatTile>
        </div>

        <SectionHead num="04" titleKey="sec.rhythm.title" subKey="sec.rhythm.sub" />
        <div className="rhythm-row">
          <ScheduleArc />
          {radarZones.length > 0 ? (
            <LocationRadar
              zones={radarZones}
              currentPlace={'—'}
              currentDuration={snap?.ts ? timeAgo(snap.ts) : '—'}
              childName={childName}
              lastSync={lastSync}
            />
          ) : (
            <EmptyCard title="LOCATION RADAR" sub="Add geofence zones to see the radar" />
          )}
        </div>

        <SectionHead num="05" titleKey="sec.tape.title" subKey="sec.tape.sub" />
        {tapeEvents.length > 0 ? (
          <ActivityTape events={tapeEvents} />
        ) : (
          <EmptyCard title="ACTIVITY TAPE" sub="Events will appear here as the band collects data" />
        )}

        <footer className="dash-footer mono">
          {t('footer.tag')}
        </footer>
      </main>

      <KairoToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}

export default App

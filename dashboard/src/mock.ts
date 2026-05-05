import type { SparkState } from './components/Spark/SparkV1'
import type { KairoEvent } from './components/EventLog'
import type { SleepEpoch, SleepNight, SleepStage } from './components/SleepCard'
import type { GeoZone } from './components/GeofenceList'

export interface ChildSnapshot {
  id: string
  name: string
  age: number
  state: SparkState
  stateLabel: string
  lastSync: string
  hr: number
  hrBaseline: number
  hrSeries: number[]
  hrSeriesWeek: number[]
  hrSeriesMonth: number[]
  spo2: number
  tempC: number
  tempBaseline: number
  steps: number
  stepsGoal: number
  stepsSeries: number[]
  battery: number
  wearPct: number
  location: { place: string; address: string; duration: string; lat: number; lng: number; accuracyM: number }
  events: KairoEvent[]
  sleep: SleepNight
  zones: GeoZone[]
  /** Wellness report series — last N days, oldest first. */
  reportDays: number
  hrvSeries: number[]      // RMSSD ms
  spo2NightSeries: number[] // mean nightly SpO2 %
  tempDeltaSeries: number[] // delta vs 14d baseline °C
  sleepScoreSeries: number[]
  stepsDailySeries: number[]
  /** Longitudinal record — for the paediatrician brief screen. */
  record: {
    monthsTracked: number
    totalNights: number
    modules: BriefModule[]
    /** Annotated key events on the timeline */
    annotations: BriefAnnotation[]
    /** "3 things to bring up at next visit" — generated from anomalies */
    conversationPrompts: BriefPrompt[]
    /** 24-month rolling resting HR (one point per month) */
    restingHrMonths: number[]
    /** 24-month rolling avg sleep score */
    sleepMonths: number[]
    /** 24-month avg nightly SpO₂ */
    spo2Months: number[]
    /** 24-month avg HRV */
    hrvMonths: number[]
  }
}

export type BriefModuleStatus = 'monitoring' | 'flagged' | 'resolved' | 'paused'

export interface BriefModule {
  id: string
  /** clinical-context name e.g. "Sleep architecture" */
  name: string
  status: BriefModuleStatus
  /** ISO month "2025-09" */
  activeSince: string
  summary: string
}

export interface BriefAnnotation {
  /** "2031-09" or "2031-09-12" */
  date: string
  kind: 'milestone' | 'flag' | 'consult' | 'context'
  title: string
  body: string
}

export interface BriefPrompt {
  topic: string
  evidence: string
}

function genHrSeries(profile: 'mash' | 'art' = 'mash'): number[] {
  const out: number[] = []
  const offset = profile === 'art' ? 8 : 0
  for (let i = 0; i < 48; i++) {
    const hour = i / 2
    let base = 0
    if (hour < 7) base = 65
    else if (hour < 9) base = 88
    else if (hour < 13) base = 100
    else if (hour < 14) base = 82
    else if (hour < 18) base = 105
    else if (hour < 21) base = 85
    else base = 70
    const noise = Math.sin(i * 1.3) * 5 + Math.cos(i * 0.7) * 4
    out.push(Math.max(50, Math.min(130, Math.round(base + offset + noise))))
  }
  return out
}

function genHrSeriesDaily(days: number, profile: 'mash' | 'art' = 'mash'): number[] {
  const out: number[] = []
  const offset = profile === 'art' ? 10 : 0
  for (let i = 0; i < days; i++) {
    const base = 86 + offset
    const noise = Math.sin(i * 0.9) * 3 + Math.cos(i * 0.5) * 2
    out.push(Math.round(base + noise))
  }
  return out
}

function genHrvSeries(days: number, profile: 'mash' | 'art' = 'mash'): number[] {
  const base = profile === 'art' ? 48 : 42
  const out: number[] = []
  for (let i = 0; i < days; i++) {
    out.push(Math.round(base + Math.sin(i * 0.6) * 4 + Math.cos(i * 0.35) * 3))
  }
  return out
}

function genSpo2NightSeries(days: number): number[] {
  const out: number[] = []
  for (let i = 0; i < days; i++) {
    out.push(+(97 + Math.cos(i * 0.4) * 0.8 + Math.sin(i * 0.7) * 0.4).toFixed(1))
  }
  return out
}

function genTempDeltaSeries(days: number): number[] {
  const out: number[] = []
  for (let i = 0; i < days; i++) {
    out.push(+((Math.sin(i * 0.5) * 0.12 + Math.cos(i * 0.7) * 0.06).toFixed(2)))
  }
  return out
}

function genSleepScoreSeries(days: number, profile: 'mash' | 'art' = 'mash'): number[] {
  const base = profile === 'art' ? 82 : 77
  const out: number[] = []
  for (let i = 0; i < days; i++) {
    out.push(Math.round(base + Math.sin(i * 0.4) * 6 + Math.cos(i * 0.9) * 3))
  }
  return out
}

function genMonthly(start: number, drift: number, months: number, profile: 'mash' | 'art' = 'mash'): number[] {
  const out: number[] = []
  const offset = profile === 'art' ? -2 : 0
  for (let i = 0; i < months; i++) {
    const v = start + drift * i + Math.sin(i * 0.6) * 1.6 + Math.cos(i * 0.35) * 1.0 + offset
    out.push(+v.toFixed(1))
  }
  return out
}

function genStepsDailySeries(days: number, goal: number): number[] {
  const out: number[] = []
  for (let i = 0; i < days; i++) {
    const swing = Math.sin(i * 0.55) * 0.35 + Math.cos(i * 0.3) * 0.15
    const v = goal * (0.7 + swing)
    out.push(Math.max(500, Math.round(v)))
  }
  return out
}

function genStepsSeries(): number[] {
  const out: number[] = []
  for (let h = 0; h < 24; h++) {
    let v = 0
    if (h >= 7 && h < 9) v = 350
    else if (h >= 9 && h < 13) v = 420
    else if (h >= 13 && h < 14) v = 120
    else if (h >= 14 && h < 18) v = 540
    else if (h >= 18 && h < 21) v = 240
    out.push(Math.max(0, Math.round(v + Math.sin(h) * 80)))
  }
  return out
}

function genSleepNight(
  profile: 'mash' | 'art',
  bedTime: string,
  wakeTime: string,
  totalMin: number,
): SleepNight {
  const epochs: SleepEpoch[] = []
  const epochCount = Math.floor(totalMin / 5)
  let awakenings = 0
  for (let i = 0; i < epochCount; i++) {
    const frac = i / epochCount
    let stage: SleepStage
    if (i < 3) stage = 'wake'
    else if (frac < 0.45) {
      const r = Math.sin(i * 0.55 + (profile === 'art' ? 1 : 0))
      if (i % 11 === 0 && i > 5) stage = 'wake'
      else if (r > 0.35) stage = 'light'
      else stage = 'deep'
    } else if (frac < 0.65) {
      const r = Math.sin(i * 0.3)
      if (i % 17 === 0) stage = 'wake'
      else if (r > 0.2) stage = 'rem'
      else if (r < -0.4) stage = 'deep'
      else stage = 'light'
    } else {
      const r = Math.sin(i * 0.4 + 0.3)
      if (i % 13 === 0) stage = 'wake'
      else if (r > 0.1) stage = 'rem'
      else stage = 'light'
    }
    if (stage === 'wake' && i > 4) awakenings++
    epochs.push({ t: i * 5, stage })
  }
  return {
    bedTime,
    wakeTime,
    totalMin,
    epochs,
    rmssdMs: profile === 'art' ? 48 : 42,
    awakenings,
    latencyMin: 15,
  }
}

const mashaEvents: KairoEvent[] = [
  { id: '1', kind: 'parent_touch', text: 'You hugged Masha through the band', ts: 'just now' },
  { id: '2', kind: 'arrive_home', text: 'Masha arrived home', ts: '14 min ago' },
  { id: '3', kind: 'goal', text: 'Masha hit half her step goal', ts: '1 h ago' },
  { id: '4', kind: 'leave_home', text: 'Masha left home', ts: '2 h ago' },
  { id: '5', kind: 'sleep_end', text: 'Masha woke up · 9h 12m sleep', ts: 'today 07:42' },
  { id: '6', kind: 'sleep_start', text: 'Masha went to bed', ts: 'yesterday 22:30' },
]

const artEvents: KairoEvent[] = [
  { id: 'a1', kind: 'goal', text: 'Artyom hit his daily step goal', ts: '20 min ago' },
  { id: 'a2', kind: 'arrive_home', text: 'Artyom arrived home', ts: '1 h ago' },
  { id: 'a3', kind: 'leave_home', text: 'Artyom left home', ts: '3 h ago' },
  { id: 'a4', kind: 'low_battery', text: 'Battery 18% — charge soon', ts: 'this morning' },
  { id: 'a5', kind: 'sleep_end', text: 'Artyom woke up · 10h 04m sleep', ts: 'today 07:18' },
]

const mashaZones: GeoZone[] = [
  {
    id: 'home',
    name: 'Home',
    kind: 'home',
    radiusM: 80,
    active: true,
    lastEvent: { type: 'enter', ts: '14 min ago' },
  },
  {
    id: 'school',
    name: 'School No.42',
    kind: 'school',
    radiusM: 120,
    active: true,
    lastEvent: { type: 'exit', ts: '2 h ago' },
  },
  { id: 'park', name: 'Local park', kind: 'park', radiusM: 250, active: false },
  { id: 'baba', name: "Grandma's", kind: 'custom', radiusM: 100, active: false },
]

const artZones: GeoZone[] = [
  {
    id: 'home',
    name: 'Home',
    kind: 'home',
    radiusM: 80,
    active: true,
    lastEvent: { type: 'exit', ts: '4 h ago' },
  },
  {
    id: 'sad',
    name: 'Romashka Daycare',
    kind: 'school',
    radiusM: 100,
    active: true,
    lastEvent: { type: 'enter', ts: '4 h ago' },
  },
]

export const mockChildren: ChildSnapshot[] = [
  {
    id: 'masha',
    name: 'Masha',
    age: 7,
    state: 'calm',
    stateLabel: 'calm, at home',
    lastSync: '1 min ago',
    hr: 84,
    hrBaseline: 86,
    hrSeries: genHrSeries('mash'),
    hrSeriesWeek: genHrSeriesDaily(7, 'mash'),
    hrSeriesMonth: genHrSeriesDaily(30, 'mash'),
    spo2: 98,
    tempC: 36.6,
    tempBaseline: 36.6,
    steps: 4823,
    stepsGoal: 8000,
    stepsSeries: genStepsSeries(),
    battery: 78,
    wearPct: 0.88,
    location: {
      place: 'School No.42',
      address: '15 Chaikovsky St.',
      duration: '1 h 14 m',
      lat: 59.9444,
      lng: 30.3454,
      accuracyM: 3,
    },
    events: mashaEvents,
    sleep: genSleepNight('mash', '22:30', '07:42', 552),
    zones: mashaZones,
    reportDays: 30,
    hrvSeries: genHrvSeries(30, 'mash'),
    spo2NightSeries: genSpo2NightSeries(30),
    tempDeltaSeries: genTempDeltaSeries(30),
    sleepScoreSeries: genSleepScoreSeries(30, 'mash'),
    stepsDailySeries: genStepsDailySeries(30, 8000),
    record: {
      monthsTracked: 38,
      totalNights: 1142,
      modules: [
        {
          id: 'sleep-arch',
          name: 'Sleep architecture',
          status: 'monitoring',
          activeSince: '2023-02',
          summary: 'Stable. Deep-sleep share trending up since 2024.',
        },
        {
          id: 'hrv-stress',
          name: 'HRV / autonomic balance',
          status: 'flagged',
          activeSince: '2024-08',
          summary: 'Five-week dip during recent academic period.',
        },
        {
          id: 'resp-spo2',
          name: 'Respiratory (nightly SpO₂)',
          status: 'monitoring',
          activeSince: '2023-02',
          summary: 'Within typical range. No desaturations 2 wks.',
        },
        {
          id: 'circadian',
          name: 'Circadian timing',
          status: 'monitoring',
          activeSince: '2024-01',
          summary: 'Bedtime drifted +35 min over 8 weeks.',
        },
      ],
      annotations: [
        {
          date: '2023-02',
          kind: 'milestone',
          title: 'Started tracking',
          body: 'Band first paired. Baselines established over 14 days.',
        },
        {
          date: '2023-11',
          kind: 'context',
          title: 'Started school',
          body: 'Sleep onset shifted earlier; HR baseline edged down.',
        },
        {
          date: '2024-04',
          kind: 'consult',
          title: 'Routine paediatrician visit',
          body: 'Annual brief shared. No follow-up flagged.',
        },
        {
          date: '2025-09',
          kind: 'flag',
          title: 'HRV dip · 5 weeks',
          body: 'Autonomic balance trended low during exam period. Resolved after autumn break.',
        },
        {
          date: '2026-04',
          kind: 'context',
          title: 'New baseline computed',
          body: '14-day rolling baselines re-anchored after growth spurt.',
        },
      ],
      conversationPrompts: [
        {
          topic: 'HRV trend over the last 5 weeks',
          evidence: 'Nightly RMSSD averaging 38 ms vs personal baseline of 44 ms.',
        },
        {
          topic: 'Bedtime drift since February',
          evidence: 'Sleep onset moved from 21:35 → 22:10. Total sleep down ~25 min.',
        },
        {
          topic: 'Skin temperature pattern',
          evidence: '3 nights with Δ ≥ 0.2 °C in the last 14 days. No fever events.',
        },
      ],
      restingHrMonths: genMonthly(82, 0.18, 24, 'mash'),
      sleepMonths: genMonthly(78, 0.12, 24, 'mash'),
      spo2Months: genMonthly(97.4, 0.01, 24, 'mash'),
      hrvMonths: genMonthly(40, 0.15, 24, 'mash'),
    },
  },
  {
    id: 'artyom',
    name: 'Artyom',
    age: 4,
    state: 'active',
    stateLabel: 'playing at daycare',
    lastSync: '3 min ago',
    hr: 108,
    hrBaseline: 96,
    hrSeries: genHrSeries('art'),
    hrSeriesWeek: genHrSeriesDaily(7, 'art'),
    hrSeriesMonth: genHrSeriesDaily(30, 'art'),
    spo2: 99,
    tempC: 36.8,
    tempBaseline: 36.7,
    steps: 6240,
    stepsGoal: 6000,
    stepsSeries: genStepsSeries(),
    battery: 42,
    wearPct: 0.76,
    location: {
      place: 'Romashka Daycare',
      address: '8 Lesnaya St.',
      duration: '4 h 02 m',
      lat: 55.7717,
      lng: 37.595,
      accuracyM: 4,
    },
    events: artEvents,
    sleep: genSleepNight('art', '21:00', '07:18', 618),
    zones: artZones,
    reportDays: 30,
    hrvSeries: genHrvSeries(30, 'art'),
    spo2NightSeries: genSpo2NightSeries(30),
    tempDeltaSeries: genTempDeltaSeries(30),
    sleepScoreSeries: genSleepScoreSeries(30, 'art'),
    stepsDailySeries: genStepsDailySeries(30, 6000),
    record: {
      monthsTracked: 14,
      totalNights: 412,
      modules: [
        {
          id: 'sleep-arch',
          name: 'Sleep architecture',
          status: 'monitoring',
          activeSince: '2025-03',
          summary: 'Long total sleep typical for age. Stable.',
        },
        {
          id: 'resp-spo2',
          name: 'Respiratory (nightly SpO₂)',
          status: 'monitoring',
          activeSince: '2025-03',
          summary: 'Mean nightly 97 %. No flagged dips.',
        },
        {
          id: 'activity-load',
          name: 'Daytime activity',
          status: 'monitoring',
          activeSince: '2025-04',
          summary: 'Active 4–6 h/day. Above typical for age range.',
        },
      ],
      annotations: [
        {
          date: '2025-03',
          kind: 'milestone',
          title: 'Started tracking',
          body: 'Band paired at 3 yo. Baselines anchored over 14 days.',
        },
        {
          date: '2025-11',
          kind: 'context',
          title: 'Started kindergarten',
          body: 'Daytime activity rose; nightly sleep length stayed stable.',
        },
        {
          date: '2026-02',
          kind: 'consult',
          title: 'Routine paediatrician visit',
          body: 'First annual brief shared. Growth and sleep on track.',
        },
      ],
      conversationPrompts: [
        {
          topic: 'Activity load — well above peer band',
          evidence: 'Steady 6 200 daily steps avg over 12 weeks.',
        },
        {
          topic: 'Long sleep duration',
          evidence: '10 h 04 m avg total. Within healthy range for age 4.',
        },
      ],
      restingHrMonths: genMonthly(96, -0.15, 24, 'art'),
      sleepMonths: genMonthly(82, 0.05, 24, 'art'),
      spo2Months: genMonthly(97.6, 0.0, 24, 'art'),
      hrvMonths: genMonthly(48, 0.2, 24, 'art'),
    },
  },
]

export const mockChild = mockChildren[0]
export const mockEvents = mockChildren[0].events

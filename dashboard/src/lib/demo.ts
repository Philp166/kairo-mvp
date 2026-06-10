/** Demo mode — hardcoded showcase data for customer demos.
 *  Activated by `?demo` in the URL, e.g. https://…/kairo-mvp/?demo
 *  The base URL without the param keeps real (Supabase + BLE) behavior. */

import type { Overview, ApiEvent, Zone, Snapshot } from './api'

export const IS_DEMO =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('demo')

const MIN = 60_000
const HOUR = 3_600_000
const NOW = Date.now()
const ago = (ms: number) => new Date(NOW - ms).toISOString()

export const DEMO_CHILD_NAME = 'Misha'
export const DEMO_PLACE = 'School No.42'
export const DEMO_PLACE_DURATION = '4 h 02 m'

/* ── HR rhythm by hour-of-day: low overnight, peaks at recess/PE ── */
function hrAt(hour: number, slot: number): number {
  let base: number
  if (hour < 7) base = 64
  else if (hour < 9) base = 88
  else if (hour < 13) base = 100
  else if (hour < 14) base = 82
  else if (hour < 18) base = 104
  else if (hour < 21) base = 84
  else base = 70
  const noise = Math.sin(slot * 1.3) * 5 + Math.cos(slot * 0.7) * 4
  return Math.max(52, Math.min(128, Math.round(base + noise)))
}

/* One snapshot per half-hour over the past 24 h — fills every chart slot */
export const DEMO_SERIES: Snapshot[] = Array.from({ length: 48 }, (_, k) => {
  const ts = new Date(NOW - (47 - k) * 30 * MIN)
  const slot = ts.getHours() * 2 + (ts.getMinutes() >= 30 ? 1 : 0)
  return {
    child_id: 'masha',
    hr: hrAt(ts.getHours() + ts.getMinutes() / 60, slot),
    spo2: 97,
    temp_c: 36.6,
    steps: null,
    battery: null,
    state: null,
    ts: ts.toISOString(),
  }
})

export const DEMO_OVERVIEW: Overview = {
  snapshot: {
    child_id: 'masha',
    hr: 84,
    spo2: 98,
    temp_c: 36.7,
    steps: 4823,
    battery: 78,
    state: 'calm',
    ts: ago(45_000), // renders as "just now"
  },
  snapshotCount: 12_480,
  today: {
    child_id: 'masha',
    day: new Date(NOW).toISOString().slice(0, 10),
    hr_avg: 88,
    hr_min: 58,
    hr_max: 124,
    spo2_avg: 97.6,
    temp_avg: 36.6,
    steps_total: 4823,
    hrv_rmssd: 42,
    sleep_score: 86,
  },
  lastSleep: {
    child_id: 'masha',
    bed_time: ago(20 * HOUR),
    wake_time: ago(11 * HOUR),
    total_min: 552, // 9 h 12 m
    score: 86,
    hr_avg: 64,
    hr_min: 52,
    awakenings: 1,
  },
}

export const DEMO_EVENTS: ApiEvent[] = [
  { id: 1, child_id: 'masha', kind: 'parent_touch', text: 'You hugged Misha through the band', ts: ago(2 * MIN) },
  { id: 2, child_id: 'masha', kind: 'goal', text: 'Misha hit half his step goal', ts: ago(1 * HOUR) },
  { id: 3, child_id: 'masha', kind: 'spike', text: 'HR peak 142 bpm — matched PE class, no alert raised', ts: ago(3 * HOUR) },
  { id: 4, child_id: 'masha', kind: 'arrive_home', text: 'Misha arrived at School No.42', ts: ago(10 * HOUR) },
  { id: 5, child_id: 'masha', kind: 'leave_home', text: 'Misha left home — usual route to school', ts: ago(10 * HOUR + 22 * MIN) },
  { id: 6, child_id: 'masha', kind: 'sleep_end', text: 'Misha woke up · 9 h 12 m sleep', ts: ago(11 * HOUR) },
  { id: 7, child_id: 'masha', kind: 'sleep_start', text: 'Misha went to bed', ts: ago(20 * HOUR) },
]

export const DEMO_ZONES: Zone[] = [
  { id: 'home', child_id: 'masha', name: 'Home', kind: 'home', radius_m: 80, active: true, last_event_type: 'exit', last_event_ts: ago(10 * HOUR + 22 * MIN) },
  { id: 'school', child_id: 'masha', name: 'School No.42', kind: 'school', radius_m: 120, active: true, last_event_type: 'enter', last_event_ts: ago(10 * HOUR) },
  { id: 'park', child_id: 'masha', name: 'Local park', kind: 'park', radius_m: 250, active: false, last_event_type: null, last_event_ts: null },
  { id: 'baba', child_id: 'masha', name: "Grandma's", kind: 'custom', radius_m: 100, active: false, last_event_type: null, last_event_ts: null },
]

/* ── Sparkline series for the SpO₂ / temp / steps chips ── */
export const DEMO_SPARK_SPO2 = Array.from({ length: 48 }, (_, i) =>
  +(97 + Math.cos(i * 0.4) * 0.8 + Math.sin(i * 0.7) * 0.4).toFixed(1),
)
export const DEMO_SPARK_TEMP = Array.from({ length: 48 }, (_, i) =>
  +(36.6 + Math.sin(i * 0.5) * 0.12 + Math.cos(i * 0.7) * 0.06).toFixed(2),
)
export const DEMO_SPARK_STEPS = (() => {
  let total = 0
  return Array.from({ length: 48 }, (_, i) => {
    const hour = i / 2
    let rate = 0
    if (hour >= 7 && hour < 9) rate = 320
    else if (hour >= 9 && hour < 13) rate = 180
    else if (hour >= 13 && hour < 14) rate = 90
    else if (hour >= 14 && hour < 18) rate = 260
    else if (hour >= 18 && hour < 21) rate = 140
    total += Math.max(0, Math.round(rate + Math.sin(i) * 40))
    return total
  })
})()

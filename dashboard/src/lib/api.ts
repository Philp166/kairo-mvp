/** Kairo API client — talks to Express backend */

const BASE = import.meta.env.VITE_API_URL ?? ''

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

/* ── Types from server ─────────────────────────────────── */

export interface Child {
  id: string
  name: string
  age: number
}

export interface Snapshot {
  hr: number | null
  spo2: number | null
  temp_c: number | null
  steps: number | null
  battery: number | null
  state: string | null
  ts: string
}

export interface ApiEvent {
  id: number
  kind: string
  text: string
  ts: string
}

export interface Zone {
  id: string
  name: string
  kind: string
  radius_m: number
  active: boolean
  last_event_type: string | null
  last_event_ts: string | null
}

export interface DailyStat {
  day: string
  hr_avg: number | null
  hr_min: number | null
  hr_max: number | null
  spo2_avg: number | null
  temp_avg: number | null
  steps_total: number | null
  hrv_rmssd: number | null
  sleep_score: number | null
}

export interface SleepSession {
  bed_time: string
  wake_time: string | null
  total_min: number | null
  score: number | null
  hr_avg: number | null
  hr_min: number | null
  awakenings: number
}

export interface Overview {
  snapshot: Snapshot | null
  snapshotCount: number
  today: DailyStat | null
  lastSleep: SleepSession | null
}

/* ── API calls ─────────────────────────────────────────── */

export const api = {
  /** List all children */
  children: () => get<Child[]>('/api/children'),

  /** Get child with latest snapshot */
  child: (id: string) => get<Child & { latestSnapshot: Snapshot | null }>(`/api/children/${id}`),

  /** Full dashboard overview — snapshot + today stats + last sleep */
  overview: (childId: string) => get<Overview>(`/api/stats/${childId}/overview`),

  /** Post a BLE snapshot */
  postSnapshot: (data: {
    childId: string
    hr?: number
    spo2?: number
    tempC?: number
    steps?: number
    battery?: number
    state?: string
  }) => post<{ id: number; ts: string }>('/api/snapshots', data),

  /** Get snapshot series for charts */
  series: (childId: string, hours = 24) =>
    get<Snapshot[]>(`/api/snapshots/${childId}/series?hours=${hours}`),

  /** Get recent events */
  events: (childId: string, limit = 20) =>
    get<ApiEvent[]>(`/api/events/${childId}?limit=${limit}`),

  /** Post an event (haptic touch, geofence, etc.) */
  postEvent: (data: { childId: string; kind: string; text: string }) =>
    post<{ id: number; ts: string }>('/api/events', data),

  /** Get geofence zones */
  zones: (childId: string) => get<Zone[]>(`/api/zones/${childId}`),

  /** Get daily stats for trend charts */
  daily: (childId: string, days = 30) =>
    get<DailyStat[]>(`/api/stats/${childId}/daily?days=${days}`),

  /** Get recent sleep sessions */
  sleep: (childId: string, days = 7) =>
    get<SleepSession[]>(`/api/stats/${childId}/sleep?days=${days}`),

  /** Health check */
  health: () => get<{ status: string; ts: string }>('/api/health'),
}

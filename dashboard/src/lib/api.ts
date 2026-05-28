/** Kairo API client — talks directly to Supabase */

import { supabase } from './supabase'

/* ── Types ────────────────────────────────────────────── */

export interface Child {
  id: string
  name: string
  age: number
}

export interface Snapshot {
  id?: number
  child_id: string
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
  child_id: string
  kind: string
  text: string
  ts: string
}

export interface Zone {
  id: string
  child_id: string
  name: string
  kind: string
  radius_m: number
  active: boolean
  last_event_type: string | null
  last_event_ts: string | null
}

export interface DailyStat {
  child_id: string
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
  id?: number
  child_id: string
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

/* ── API calls ────────────────────────────────────────── */

export const api = {
  /** Check if Supabase is configured */
  async health(): Promise<boolean> {
    const { error } = await supabase.from('children').select('id').limit(1)
    return !error
  },

  /** Get child by id */
  async child(id: string): Promise<Child | null> {
    const { data } = await supabase
      .from('children')
      .select('id, name, age')
      .eq('id', id)
      .single()
    return data
  },

  /** Full dashboard overview */
  async overview(childId: string): Promise<Overview> {
    const [snapRes, countRes, todayRes, sleepRes] = await Promise.all([
      supabase
        .from('snapshots')
        .select('*')
        .eq('child_id', childId)
        .order('ts', { ascending: false })
        .limit(1),
      supabase
        .from('snapshots')
        .select('id', { count: 'exact', head: true })
        .eq('child_id', childId),
      supabase
        .from('daily_stats')
        .select('*')
        .eq('child_id', childId)
        .eq('day', new Date().toISOString().slice(0, 10))
        .limit(1),
      supabase
        .from('sleep_sessions')
        .select('*')
        .eq('child_id', childId)
        .order('bed_time', { ascending: false })
        .limit(1),
    ])

    return {
      snapshot: snapRes.data?.[0] ?? null,
      snapshotCount: countRes.count ?? 0,
      today: todayRes.data?.[0] ?? null,
      lastSleep: sleepRes.data?.[0] ?? null,
    }
  },

  /** Post a BLE snapshot */
  async postSnapshot(data: {
    childId: string
    hr?: number
    spo2?: number
    tempC?: number
    steps?: number
    battery?: number
    state?: string
  }) {
    const { data: row, error } = await supabase
      .from('snapshots')
      .insert({
        child_id: data.childId,
        hr: data.hr ?? null,
        spo2: data.spo2 ?? null,
        temp_c: data.tempC ?? null,
        steps: data.steps ?? null,
        battery: data.battery ?? null,
        state: data.state ?? null,
      })
      .select('id, ts')
      .single()
    if (error) throw error
    return row
  },

  /** Get snapshot series for charts (last N hours) */
  async series(childId: string, hours = 24): Promise<Snapshot[]> {
    const since = new Date(Date.now() - hours * 3600_000).toISOString()
    const { data } = await supabase
      .from('snapshots')
      .select('*')
      .eq('child_id', childId)
      .gte('ts', since)
      .order('ts', { ascending: true })
    return data ?? []
  },

  /** Get recent events */
  async events(childId: string, limit = 20): Promise<ApiEvent[]> {
    const { data } = await supabase
      .from('events')
      .select('id, child_id, kind, text, ts')
      .eq('child_id', childId)
      .order('ts', { ascending: false })
      .limit(limit)
    return data ?? []
  },

  /** Post an event */
  async postEvent(data: { childId: string; kind: string; text: string }) {
    const { data: row, error } = await supabase
      .from('events')
      .insert({
        child_id: data.childId,
        kind: data.kind,
        text: data.text,
      })
      .select('id, ts')
      .single()
    if (error) throw error
    return row
  },

  /** Get geofence zones */
  async zones(childId: string): Promise<Zone[]> {
    const { data } = await supabase
      .from('zones')
      .select('*')
      .eq('child_id', childId)
      .order('name')
    return data ?? []
  },

  /** Get daily stats */
  async daily(childId: string, days = 30): Promise<DailyStat[]> {
    const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10)
    const { data } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('child_id', childId)
      .gte('day', since)
      .order('day', { ascending: true })
    return data ?? []
  },

  /** Get recent sleep sessions */
  async sleep(childId: string, days = 7): Promise<SleepSession[]> {
    const since = new Date(Date.now() - days * 86400_000).toISOString()
    const { data } = await supabase
      .from('sleep_sessions')
      .select('*')
      .eq('child_id', childId)
      .gte('bed_time', since)
      .order('bed_time', { ascending: false })
    return data ?? []
  },
}

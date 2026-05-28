import { Router } from 'express'
import pool from '../db.js'

const r = Router()

/** GET /api/stats/:childId/daily?days=30 — daily aggregates for trend charts */
r.get('/:childId/daily', async (req, res) => {
  const { childId } = req.params
  const days = Math.min(90, Number(req.query.days) || 30)

  const { rows } = await pool.query(
    `SELECT day, hr_avg, hr_min, hr_max, spo2_avg, temp_avg,
            steps_total, hrv_rmssd, sleep_score
     FROM daily_stats
     WHERE child_id = $1 AND day > current_date - $2::int
     ORDER BY day ASC`,
    [childId, days],
  )
  res.json(rows)
})

/** GET /api/stats/:childId/sleep?days=7 — recent sleep sessions */
r.get('/:childId/sleep', async (req, res) => {
  const { childId } = req.params
  const days = Math.min(30, Number(req.query.days) || 7)

  const { rows } = await pool.query(
    `SELECT bed_time, wake_time, total_min, score, hr_avg, hr_min, awakenings
     FROM sleep_sessions
     WHERE child_id = $1 AND bed_time > now() - make_interval(days => $2)
     ORDER BY bed_time DESC`,
    [childId, days],
  )
  res.json(rows)
})

/** GET /api/stats/:childId/overview — single summary for dashboard hero */
r.get('/:childId/overview', async (req, res) => {
  const { childId } = req.params

  // Latest snapshot
  const snapQ = pool.query(
    'SELECT hr, spo2, temp_c, steps, battery, state, ts FROM snapshots WHERE child_id = $1 ORDER BY ts DESC LIMIT 1',
    [childId],
  )
  // Snapshot count (to know if we have data)
  const countQ = pool.query(
    'SELECT count(*)::int as total FROM snapshots WHERE child_id = $1',
    [childId],
  )
  // Today's stats
  const todayQ = pool.query(
    'SELECT * FROM daily_stats WHERE child_id = $1 AND day = current_date',
    [childId],
  )
  // Last sleep
  const sleepQ = pool.query(
    'SELECT * FROM sleep_sessions WHERE child_id = $1 ORDER BY bed_time DESC LIMIT 1',
    [childId],
  )

  const [snap, count, today, sleep] = await Promise.all([snapQ, countQ, todayQ, sleepQ])

  res.json({
    snapshot: snap.rows[0] ?? null,
    snapshotCount: count.rows[0]?.total ?? 0,
    today: today.rows[0] ?? null,
    lastSleep: sleep.rows[0] ?? null,
  })
})

export default r

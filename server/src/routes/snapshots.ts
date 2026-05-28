import { Router } from 'express'
import pool from '../db.js'

const r = Router()

/** POST /api/snapshots — store a BLE reading */
r.post('/', async (req, res) => {
  const { childId, hr, spo2, tempC, steps, battery, state } = req.body
  if (!childId) return res.status(400).json({ error: 'childId required' })

  const { rows } = await pool.query(
    `INSERT INTO snapshots (child_id, hr, spo2, temp_c, steps, battery, state)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, ts`,
    [childId, hr ?? null, spo2 ?? null, tempC ?? null, steps ?? null, battery ?? null, state ?? null],
  )
  res.status(201).json(rows[0])
})

/** GET /api/snapshots/:childId/series?hours=24 — HR/SpO2/temp series for charts */
r.get('/:childId/series', async (req, res) => {
  const { childId } = req.params
  const hours = Math.min(168, Number(req.query.hours) || 24)

  const { rows } = await pool.query(
    `SELECT hr, spo2, temp_c, steps, battery, state, ts
     FROM snapshots
     WHERE child_id = $1 AND ts > now() - make_interval(hours => $2)
     ORDER BY ts ASC`,
    [childId, hours],
  )
  res.json(rows)
})

/** GET /api/snapshots/:childId/latest — most recent snapshot */
r.get('/:childId/latest', async (req, res) => {
  const { childId } = req.params
  const { rows } = await pool.query(
    'SELECT hr, spo2, temp_c, steps, battery, state, ts FROM snapshots WHERE child_id = $1 ORDER BY ts DESC LIMIT 1',
    [childId],
  )
  res.json(rows[0] ?? null)
})

export default r

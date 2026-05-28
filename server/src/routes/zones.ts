import { Router } from 'express'
import pool from '../db.js'

const r = Router()

/** GET /api/zones/:childId — all geofence zones */
r.get('/:childId', async (req, res) => {
  const { childId } = req.params
  const { rows } = await pool.query(
    `SELECT id, name, kind, radius_m, active, last_event_type, last_event_ts
     FROM zones WHERE child_id = $1 ORDER BY name`,
    [childId],
  )
  res.json(rows)
})

/** POST /api/zones — create a zone */
r.post('/', async (req, res) => {
  const { id, childId, name, kind, radiusM, active } = req.body
  if (!id || !childId || !name) {
    return res.status(400).json({ error: 'id, childId, name required' })
  }
  const { rows } = await pool.query(
    `INSERT INTO zones (id, child_id, name, kind, radius_m, active)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [id, childId, name, kind ?? 'custom', radiusM ?? 100, active ?? true],
  )
  res.status(201).json(rows[0])
})

/** PATCH /api/zones/:id/event — update last geofence event */
r.patch('/:id/event', async (req, res) => {
  const { id } = req.params
  const { type } = req.body // 'enter' | 'exit'
  const { rows } = await pool.query(
    `UPDATE zones SET last_event_type = $1, last_event_ts = now() WHERE id = $2 RETURNING *`,
    [type, id],
  )
  if (!rows[0]) return res.status(404).json({ error: 'zone not found' })
  res.json(rows[0])
})

export default r

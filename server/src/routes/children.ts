import { Router } from 'express'
import pool from '../db.js'

const r = Router()

/** GET /api/children — list all children */
r.get('/', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, age, created_at FROM children ORDER BY created_at',
  )
  res.json(rows)
})

/** GET /api/children/:id — single child with latest snapshot */
r.get('/:id', async (req, res) => {
  const { id } = req.params
  const child = await pool.query('SELECT * FROM children WHERE id = $1', [id])
  if (!child.rows[0]) return res.status(404).json({ error: 'not found' })

  const snap = await pool.query(
    'SELECT hr, spo2, temp_c, steps, battery, state, ts FROM snapshots WHERE child_id = $1 ORDER BY ts DESC LIMIT 1',
    [id],
  )

  res.json({
    ...child.rows[0],
    latestSnapshot: snap.rows[0] ?? null,
  })
})

export default r

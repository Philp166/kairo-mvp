import { Router } from 'express'
import pool from '../db.js'

const r = Router()

/** POST /api/events — log an activity event */
r.post('/', async (req, res) => {
  const { childId, kind, text } = req.body
  if (!childId || !kind || !text) {
    return res.status(400).json({ error: 'childId, kind, text required' })
  }
  const { rows } = await pool.query(
    `INSERT INTO events (child_id, kind, text) VALUES ($1,$2,$3) RETURNING id, ts`,
    [childId, kind, text],
  )
  res.status(201).json(rows[0])
})

/** GET /api/events/:childId?limit=20 — recent events */
r.get('/:childId', async (req, res) => {
  const { childId } = req.params
  const limit = Math.min(100, Number(req.query.limit) || 20)
  const { rows } = await pool.query(
    `SELECT id, kind, text, ts FROM events WHERE child_id = $1 ORDER BY ts DESC LIMIT $2`,
    [childId, limit],
  )
  res.json(rows)
})

export default r

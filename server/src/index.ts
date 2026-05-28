import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import childrenRoutes from './routes/children.js'
import snapshotsRoutes from './routes/snapshots.js'
import eventsRoutes from './routes/events.js'
import zonesRoutes from './routes/zones.js'
import statsRoutes from './routes/stats.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 3001

/* ── Middleware ──────────────────────────────────────────── */

app.use(cors())
app.use(express.json())

/* ── API routes ─────────────────────────────────────────── */

app.use('/api/children', childrenRoutes)
app.use('/api/snapshots', snapshotsRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/zones', zonesRoutes)
app.use('/api/stats', statsRoutes)

/* ── Health check ───────────────────────────────────────── */

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() })
})

/* ── Serve frontend (production) ────────────────────────── */

const staticDir = join(__dirname, '..', '..', 'dashboard', 'dist')
app.use(express.static(staticDir))
app.get('*', (_req, res) => {
  res.sendFile(join(staticDir, 'index.html'))
})

/* ── Start ──────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(`[kairo] API running on :${PORT}`)
})

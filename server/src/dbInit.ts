import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pool from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function init() {
  const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
  await pool.query(sql)
  console.log('[db] Schema applied ✓')

  // Seed default child if empty
  const { rowCount } = await pool.query('SELECT 1 FROM children LIMIT 1')
  if (!rowCount) {
    await pool.query(
      `INSERT INTO children (id, name, age) VALUES ($1, $2, $3)`,
      ['masha', 'Masha', 7],
    )
    console.log('[db] Seeded child: Masha')
  }

  await pool.end()
}

init().catch((e) => {
  console.error(e)
  process.exit(1)
})

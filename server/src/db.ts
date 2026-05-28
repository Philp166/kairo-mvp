import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
})

pool.on('error', (err) => {
  console.error('[db] Unexpected pool error', err)
})

export default pool

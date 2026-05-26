import 'dotenv/config'
import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set')
  throw new Error('DATABASE_URL is required but not configured')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

export default pool

import 'dotenv/config'
import { Pool } from 'pg'

let pool: Pool

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err)
  })
} catch (err) {
  console.warn('Failed to initialize PostgreSQL pool, using mock database')
  // Create a mock pool for development
  const mockData: any = {
    users: [
      { id: 1, user_id: 'user-1', email: 'admin-01@ecme.com', password_hash: '123Qwe', user_name: 'Admin', authority: 'admin', is_active: true, avatar: '', created_at: new Date(), updated_at: new Date() },
    ],
    candidates: [],
  }

  pool = {
    query: async (sql: string, params?: any[]) => {
      console.log('Mock query:', sql, params)

      if (sql.includes('CREATE TABLE IF NOT EXISTS')) {
        return { rows: [], rowCount: 0 }
      }

      if (sql.includes('SELECT * FROM users WHERE email')) {
        const email = params?.[0]
        return { rows: mockData.users.filter((u: any) => u.email === email), rowCount: 0 }
      }

      if (sql.includes('SELECT * FROM candidates')) {
        return { rows: mockData.candidates, rowCount: mockData.candidates.length }
      }

      if (sql.includes('INSERT INTO')) {
        return { rows: [{}], rowCount: 1 }
      }

      return { rows: [], rowCount: 0 }
    },
    on: () => {},
  } as any
}

export default pool

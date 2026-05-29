import pool from './db/config'

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()')
    console.log('✓ Database connected:', result.rows[0])

    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    console.log('✓ Available tables:', tables.rows)

    const usersSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `)
    console.log('✓ Users table schema:', usersSchema.rows)

    process.exit(0)
  } catch (error) {
    console.error('✗ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

testConnection()

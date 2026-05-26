import pool from '../db/connection.js'

async function checkUser() {
  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, user_name, authority, is_active FROM users WHERE email = $1',
      ['admin-01@ecme.com']
    )
    console.log('✓ User found:', result.rows)
    process.exit(0)
  } catch (error) {
    console.error('✗ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

checkUser()

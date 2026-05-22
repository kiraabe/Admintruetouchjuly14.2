import pool from '../config.ts'

export interface User {
  id: number
  user_id: string
  email: string
  password_hash: string
  user_name: string | null
  avatar: string | null
  authority: string
  is_active: boolean
  partnership_id?: string | null
  created_at: Date
  updated_at: Date
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
  return result.rows[0] || null
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [userId])
  return result.rows[0] || null
}

export async function createUser(
  email: string,
  passwordHash: string,
  userName: string,
): Promise<User> {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, user_name, authority)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [email, passwordHash, userName, 'user'],
  )
  return result.rows[0]
}

export async function updateUser(
  userId: string,
  data: Partial<Omit<User, 'id' | 'user_id' | 'created_at'>>,
): Promise<User> {
  const updates: string[] = []
  const values: any[] = []
  let paramCount = 1

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      updates.push(`${key} = $${paramCount}`)
      values.push(value)
      paramCount++
    }
  })

  updates.push(`updated_at = CURRENT_TIMESTAMP`)
  values.push(userId)

  const result = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
    values,
  )
  return result.rows[0]
}

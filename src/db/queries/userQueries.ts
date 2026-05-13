import pool from '../connection'

export interface User {
  id: number
  user_id: string
  email: string
  password_hash: string
  user_name: string | null
  is_active: boolean
  avatar: string | null
  authority: string
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const query = `
      SELECT id, user_id, email, password_hash, user_name, is_active, avatar, authority
      FROM users
      WHERE email = $1
    `
    const result = await pool.query(query, [email])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0] as User
  } catch (error) {
    console.error('Error fetching user by email:', error)
    throw error
  }
}

export async function createUser(
  email: string,
  passwordHash: string,
  userName: string,
): Promise<User> {
  try {
    const query = `
      INSERT INTO users (email, password_hash, user_name, is_active, authority)
      VALUES ($1, $2, $3, true, 'user')
      RETURNING *
    `
    const result = await pool.query(query, [email, passwordHash, userName])
    return result.rows[0] as User
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const query = 'SELECT * FROM users WHERE user_id = $1'
    const result = await pool.query(query, [userId])

    if (result.rows.length === 0) {
      return null
    }

    return result.rows[0] as User
  } catch (error) {
    console.error('Error fetching user by id:', error)
    throw error
  }
}

export async function getAdminUsers(): Promise<User[]> {
  try {
    const query = `
      SELECT id, user_id, email, password_hash, user_name, is_active, avatar, authority
      FROM users
      WHERE authority = 'admin'
    `
    const result = await pool.query(query)
    return result.rows as User[]
  } catch (error) {
    console.error('Error fetching admin users:', error)
    throw error
  }
}

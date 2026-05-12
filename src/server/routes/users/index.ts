import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../../db/config.ts'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, user_name, password, authority, partnership_id } = req.body

    if (!email || !user_name || !password) {
      return res.status(400).json({ error: 'Email, name, and password are required' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, user_name, authority, is_active, partnership_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, user_id, email, user_name, authority, is_active, avatar, partnership_id, created_at',
      [email, hashedPassword, user_name, authority || 'user', true, partnership_id || null]
    )

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'User created successfully',
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to create user'
    console.error('Error creating user:', error)
    res.status(500).json({ error: errorMsg })
  }
})

router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('Fetching users from database...')
    const page = Math.max(1, parseInt(req.query.page as string) || 1)
    const limit = Math.min(100, parseInt(req.query.limit as string) || 10)
    const offset = (page - 1) * limit
    const { partnership_id } = req.query

    let query = 'SELECT id, user_id, email, user_name, authority, is_active, avatar, partnership_id, created_at FROM users'
    const params: any[] = []

    if (partnership_id && typeof partnership_id === 'string') {
      query += ' WHERE partnership_id = $1'
      params.push(partnership_id)
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM users${partnership_id ? ' WHERE partnership_id = $1' : ''}`, partnership_id ? [partnership_id] : [])
    const total = parseInt(countResult.rows[0].count, 10)

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
    params.push(limit, offset)

    const result = await pool.query(query, params)
    console.log('Users fetched successfully:', result.rows.length)
    res.json({
      success: true,
      data: result.rows,
      total,
      page,
      limit,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch users'
    console.error('Error fetching users:', errorMsg, error)
    res.status(500).json({
      success: false,
      error: errorMsg,
      details: error instanceof Error ? error.stack : 'Unknown error'
    })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'SELECT id, user_id, email, user_name, authority, is_active, avatar, partnership_id, created_at FROM users WHERE user_id = $1 OR id = $2',
      [id, parseInt(id, 10) || 0]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch user'
    console.error('Error fetching user:', error)
    res.status(500).json({ error: errorMsg })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { email, user_name, authority, is_active, partnership_id } = req.body

    const result = await pool.query(
      'UPDATE users SET email = COALESCE($1, email), user_name = COALESCE($2, user_name), authority = COALESCE($3, authority), is_active = COALESCE($4, is_active), partnership_id = COALESCE($5, partnership_id), updated_at = CURRENT_TIMESTAMP WHERE user_id = $6 OR id = $7 RETURNING *',
      [email, user_name, authority, is_active, partnership_id, id, parseInt(id, 10) || 0]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'User updated successfully',
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to update user'
    console.error('Error updating user:', error)
    res.status(500).json({ error: errorMsg })
  }
})

router.patch('/:id/deactivate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 OR id = $2 RETURNING *',
      [id, parseInt(id, 10) || 0]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'User deactivated successfully',
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to deactivate user'
    console.error('Error deactivating user:', error)
    res.status(500).json({ error: errorMsg })
  }
})

router.patch('/:id/activate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      'UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 OR id = $2 RETURNING *',
      [id, parseInt(id, 10) || 0]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'User activated successfully',
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to activate user'
    console.error('Error activating user:', error)
    res.status(500).json({ error: errorMsg })
  }
})

router.patch('/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ error: 'Password is required' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 OR id = $3 RETURNING *',
      [hashedPassword, id, parseInt(id, 10) || 0]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      success: true,
      message: 'Password reset successfully',
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to reset password'
    console.error('Error resetting password:', error)
    res.status(500).json({ error: errorMsg })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      'DELETE FROM users WHERE user_id = $1 OR id = $2 RETURNING *',
      [id, parseInt(id, 10) || 0]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to delete user'
    console.error('Error deleting user:', error)
    res.status(500).json({ error: errorMsg })
  }
})

router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { password } = req.body
    const authHeader = req.headers.authorization

    if (!password) {
      return res.status(400).json({ error: 'Password is required' })
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const token = authHeader.substring(7)
    const jwt = await import('jsonwebtoken')
    let decoded: any

    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 OR id = $2 RETURNING id, user_id, email, user_name, authority',
      [hashedPassword, decoded.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to change password'
    console.error('Error changing password:', error)
    res.status(500).json({ error: errorMsg })
  }
})

export default router

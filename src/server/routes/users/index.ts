import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'

let pool: any = null

async function initPool() {
  if (!pool) {
    try {
      const poolModule = await import('../../db/config.ts')
      pool = poolModule.default
    } catch (err) {
      console.error('Failed to load db config:', err)
      throw new Error('Database connection not available')
    }
  }
  return pool
}

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const result = await dbPool.query(
      'SELECT id, user_id, email, user_name, authority, is_active, avatar, created_at FROM users ORDER BY created_at DESC'
    )
    res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch users'
    console.error('Error fetching users:', error)
    res.status(500).json({ error: errorMsg })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const dbPool = await initPool()
    const result = await dbPool.query(
      'SELECT id, user_id, email, user_name, authority, is_active, avatar, created_at FROM users WHERE user_id = $1 OR id = $2',
      [id, id]
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
    const { email, user_name, authority, is_active } = req.body
    const dbPool = await initPool()

    const result = await dbPool.query(
      'UPDATE users SET email = COALESCE($1, email), user_name = COALESCE($2, user_name), authority = COALESCE($3, authority), is_active = COALESCE($4, is_active), updated_at = CURRENT_TIMESTAMP WHERE user_id = $5 OR id = $5 RETURNING *',
      [email, user_name, authority, is_active, id]
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
    const dbPool = await initPool()

    const result = await dbPool.query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 OR id = $1 RETURNING *',
      [id]
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
    const dbPool = await initPool()

    const result = await dbPool.query(
      'UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 OR id = $1 RETURNING *',
      [id]
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

    const dbPool = await initPool()
    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await dbPool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 OR id = $2 RETURNING *',
      [hashedPassword, id]
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
    const dbPool = await initPool()

    const result = await dbPool.query(
      'DELETE FROM users WHERE user_id = $1 OR id = $1 RETURNING *',
      [id]
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

export default router

import { Router, type Request, type Response } from 'express'
import pool from '../../db/config.js'

const router = Router()

// Health check for notifications API
router.get('/health', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT 1')
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'notifications'
      ) as exists
    `)

    res.json({
      status: 'ok',
      database: 'connected',
      notifications_table_exists: tableCheck.rows[0]?.exists || false
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    res.status(500).json({
      status: 'error',
      error: errorMsg
    })
  }
})

// Get unread notification count from notifications table
router.get('/count', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({ error: 'user_id query parameter is required' })
    }

    const result = await pool.query(`
      SELECT COUNT(*)::INTEGER as count
      FROM notifications
      WHERE readed = false AND (user_id = $1 OR user_id IS NULL)
    `, [user_id])

    res.json({
      count: result.rows[0]?.count || 0
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error getting notification count:', errorMsg)
    res.status(500).json({ error: errorMsg })
  }
})

// Get notification list from notifications table
router.get('/list', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query

    if (!user_id) {
      return res.status(400).json({ error: 'user_id query parameter is required' })
    }

    const result = await pool.query(`
      SELECT
        notification_id as id,
        target,
        description,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as date,
        image_url as image,
        type,
        location,
        location_label as locationLabel,
        status,
        readed
      FROM notifications
      WHERE user_id = $1 OR user_id IS NULL
      ORDER BY created_at DESC
      LIMIT 50
    `, [user_id])

    res.json(result.rows)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error getting notification list:', errorMsg)
    res.status(500).json({ error: errorMsg })
  }
})

// Mark notification as read
router.put('/mark-read/:notificationId', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params

    const result = await pool.query(`
      UPDATE notifications
      SET readed = true, updated_at = CURRENT_TIMESTAMP
      WHERE notification_id = $1
      RETURNING *
    `, [notificationId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ success: true, notification: result.rows[0] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error marking notification as read:', errorMsg)
    res.status(500).json({ error: errorMsg })
  }
})

// Mark all notifications as read
router.put('/mark-all-read', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      UPDATE notifications
      SET readed = true, updated_at = CURRENT_TIMESTAMP
      WHERE readed = false
      RETURNING COUNT(*) as updated
    `)

    res.json({ success: true, updated: result.rows[0]?.updated || 0 })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error marking all as read:', errorMsg)
    res.status(500).json({ error: errorMsg })
  }
})

// Clear all notifications (soft delete by marking as read or hard delete)
router.delete('/clear', async (req: Request, res: Response) => {
  try {
    // Delete old notifications (older than 30 days) or all unread ones
    const result = await pool.query(`
      DELETE FROM notifications
      WHERE created_at < NOW() - INTERVAL '30 days'
      OR readed = true
      RETURNING COUNT(*) as deleted
    `)

    res.json({ success: true, deleted: result.rows[0]?.deleted || 0 })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error clearing notifications:', errorMsg)
    res.status(500).json({ error: errorMsg })
  }
})

// Create a new notification
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { target, description, type = 1, status = 'Pending', location, location_label, image_url, user_id, related_entity_id, related_entity_type } = req.body

    if (!target || !description) {
      return res.status(400).json({ error: 'target and description are required' })
    }

    const result = await pool.query(`
      INSERT INTO notifications (
        target, description, type, status, location, location_label, image_url, user_id, related_entity_id, related_entity_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [target, description, type, status, location, location_label, image_url, user_id, related_entity_id, related_entity_type])

    res.status(201).json({ success: true, notification: result.rows[0] })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error creating notification:', errorMsg)
    res.status(500).json({ error: errorMsg })
  }
})

export default router

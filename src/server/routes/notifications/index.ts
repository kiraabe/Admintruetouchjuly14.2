import { Router, type Request, type Response } from 'express'
import pool from '../../db/config.ts'

const router = Router()

// Get unread notification count from employee requests
router.get('/count', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM employee_requests 
      WHERE status IN ('Pending', 'In Progress')
    `)
    
    res.json({
      count: parseInt(result.rows[0].count, 10)
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error getting notification count:', errorMsg)
    res.status(500).json({ error: errorMsg })
  }
})

// Get notification list from employee requests
router.get('/list', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        request_id as id,
        company_name as target,
        CONCAT(position, ' - ', request_type) as description,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') as date,
        '' as image,
        1 as type,
        location as location,
        request_type as locationLabel,
        status as status,
        false as readed
      FROM employee_requests
      ORDER BY created_at DESC
      LIMIT 50
    `)
    
    res.json(result.rows)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error getting notification list:', errorMsg)
    res.status(500).json({ error: errorMsg })
  }
})

// Mark notification as read (optional - for future enhancement)
router.put('/mark-read/:notificationId', async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params
    // This could be extended to persist read status in database
    res.json({ success: true, message: 'Marked as read' })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error marking notification as read:', errorMsg)
    res.status(500).json({ error: errorMsg })
  }
})

// Clear all notifications (optional - could be archive instead of delete)
router.delete('/clear', async (req: Request, res: Response) => {
  try {
    // This endpoint is more of a UI operation, actual deletion depends on business logic
    res.json({ success: true, message: 'Notifications cleared' })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error clearing notifications:', errorMsg)
    res.status(500).json({ error: errorMsg })
  }
})

export default router

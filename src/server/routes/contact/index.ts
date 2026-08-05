import { Router, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import { publishContactMessageCreated, subscribeToContactMessages } from '../../contactEvents'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

let pool: any = null

async function initPool() {
  if (!pool) {
    try {
      const poolModule = await import('../../db/config')
      pool = poolModule.default
    } catch (err) {
      console.error('Failed to load db config:', err)
      throw new Error('Database connection not available')
    }
  }
  return pool
}

// Stream contact message creation events to authenticated admins.
router.get('/events', (req: Request, res: Response) => {
  const authorizationToken = req.headers.authorization?.split(' ')[1]
  const cookieToken = req.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('token='))
    ?.slice('token='.length)
  const token = authorizationToken || cookieToken

  try {
    const user = jwt.verify(token || '', JWT_SECRET) as { role?: string }
    console.info(`[SSE] Client connected, role: ${user.role}`)
    if (user.role !== 'admin') {
      console.warn(`[SSE] Non-admin user tried to connect: ${user.role}`)
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }
  } catch (err) {
    console.warn(`[SSE] Authentication failed:`, err instanceof Error ? err.message : err)
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  res.write(': connected\n\n')
  console.info('[SSE] Client subscribed to contact message events')
  subscribeToContactMessages(res)

  res.on('close', () => {
    console.info('[SSE] Client disconnected')
  })
})

// GET all contact messages
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const result = await dbPool.query('SELECT * FROM contact_us ORDER BY created_at DESC')
    res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error('Error fetching contact messages:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact messages',
    })
  }
})

// GET single contact message
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { id } = req.params
    const result = await dbPool.query('SELECT * FROM contact_us WHERE id = $1', [id])

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error fetching contact message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch contact message',
    })
  }
})

// POST create contact message
router.post('/', async (req: Request, res: Response) => {
  const { name, username, email, phone, subject, message } = req.body
  const contactUsername = username || name

  if (!contactUsername || !email || !phone || !subject || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: username, email, phone, subject, message',
    })
  }

  let client: any

  try {
    const dbPool = await initPool()
    client = await dbPool.connect()
    await client.query('BEGIN')

    const contactResult = await client.query(
      'INSERT INTO contact_us (name, email, phone, subject, message, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [contactUsername, email, phone, subject, message, 'new'],
    )
    const newContact = contactResult.rows[0]
    console.info(`[CONTACT] Created contact message ID: ${newContact.id}`)

    const notificationResult = await client.query(
      `INSERT INTO notifications (
        user_id, target, description, type, status, location, location_label, readed,
        related_entity_id, related_entity_type
      )
      SELECT user_id, $1, $2, $3, $4, $5, $6, $7, $8, $9
      FROM users
      WHERE LOWER(TRIM(authority::text)) LIKE '%admin%'
        AND is_active = true
      RETURNING notification_id, user_id`,
      [
        'admin',
        `New contact message received from ${contactUsername}`,
        1,
        'Pending',
        '/contact-us',
        'Contact Messages',
        false,
        newContact.contact_id || newContact.id,
        'contact_message',
      ],
    )

    console.info(`[NOTIFICATION] Created ${notificationResult.rowCount} notification(s) for contact message ${newContact.id}`)

    if (notificationResult.rowCount === 0) {
      console.warn('[NOTIFICATION] No active admin users found to send notifications')
    }

    await client.query('COMMIT')
    console.info(
      `[CONTACT] Transaction complete: contact ${newContact.id}, notifications: ${notificationResult.rowCount}`,
    )
    publishContactMessageCreated()
    res.status(201).json({ success: true, data: newContact })
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
        console.error('[CONTACT] Transaction rolled back due to error')
      } catch (rollbackError) {
        console.error('[CONTACT] Error rolling back contact message transaction:', rollbackError)
      }
    }
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[CONTACT] Error creating contact message:', errorMsg, error)
    res.status(500).json({
      success: false,
      error: 'Failed to create contact message',
      details: errorMsg,
    })
  } finally {
    client?.release()
  }
})

// POST mark a contact message as read on its first view
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { id } = req.params
    console.info(`[CONTACT] Marking contact message ${id} as read`)

    const transition = await dbPool.query(
      `UPDATE contact_us
      SET status = 'read',
          first_read_at = COALESCE(first_read_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'new'
      RETURNING *`,
      [id],
    )

    const message = transition.rows[0] || (
      await dbPool.query('SELECT * FROM contact_us WHERE id = $1', [id])
    ).rows[0]

    if (!message) {
      console.warn(`[CONTACT] Message not found: ${id}`)
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    const notificationResult = await dbPool.query(
      `UPDATE notifications
      SET readed = true, updated_at = CURRENT_TIMESTAMP
      WHERE related_entity_id = $1
        AND related_entity_type = 'contact_message'
        AND readed = false
      RETURNING notification_id`,
      [message.contact_id || message.id],
    )

    console.info(`[CONTACT] Marked ${notificationResult.rowCount} notifications as read for contact message ${id}`)
    res.json({
      success: true,
      data: message,
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[CONTACT] Error marking contact message as read:', errorMsg, error)
    res.status(500).json({
      success: false,
      error: 'Failed to mark contact message as read',
      details: errorMsg,
    })
  }
})

// PATCH update contact message status
// Requires the `status` column added by add_status_to_contact_us.sql
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      })
    }

    const result = await dbPool.query(
      'UPDATE contact_us SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    )

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error updating contact message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update contact message',
    })
  }
})

// DELETE contact message
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { id } = req.params

    const result = await dbPool.query('DELETE FROM contact_us WHERE id = $1 RETURNING *', [id])

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error deleting contact message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete contact message',
    })
  }
})

// POST send reply to contact message
// Requires the `status` column added by add_status_to_contact_us.sql
router.post('/:id/reply', async (req: Request, res: Response) => {
  try {
    const dbPool = await initPool()
    const { id } = req.params
    const { reply } = req.body

    if (!reply) {
      return res.status(400).json({
        success: false,
        error: 'Reply message is required',
      })
    }

    const result = await dbPool.query(
      'UPDATE contact_us SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['replied', id]
    )

    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: result.rows[0],
    })
  } catch (error) {
    console.error('Error sending reply:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to send reply',
    })
  }
})

export default router

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
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden' })
    }
  } catch {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  res.write(': connected\\n\\n')
  subscribeToContactMessages(res)
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
      'INSERT INTO contact_us (username, email, phone, subject, message, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [contactUsername, email, phone, subject, message, 'new'],
    )
    const newContact = contactResult.rows[0]

    const notificationResult = await client.query(
      `INSERT INTO notifications (
        target, description, type, status, location, location_label, readed,
        related_entity_id, related_entity_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING notification_id`,
      [
        'admin',
        `New contact message received from ${contactUsername}`,
        1,
        'Pending',
        '/contact-us',
        'Contact Messages',
        false,
        newContact.id,
        'contact_message',
      ],
    )

    await client.query('COMMIT')
    console.info(
      `Created contact message ${newContact.id} and notification ${notificationResult.rows[0].notification_id}`,
    )
    publishContactMessageCreated()
    res.status(201).json({ success: true, data: newContact })
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Error rolling back contact message transaction:', rollbackError)
      }
    }
    console.error('Error creating contact message notification:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create contact message',
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
    const transition = await dbPool.query(
      `UPDATE contact_us
      SET status = 'read',
          first_read_at = COALESCE(first_read_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
      WHERE id::text = $1 AND status = 'new'
      RETURNING *`,
      [id],
    )

    const message = transition.rows[0] || (
      await dbPool.query('SELECT * FROM contact_us WHERE id::text = $1', [id])
    ).rows[0]

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Contact message not found',
      })
    }

    await dbPool.query(
      `UPDATE notifications
      SET readed = true, updated_at = CURRENT_TIMESTAMP
      WHERE related_entity_id = $1::uuid
        AND related_entity_type = 'contact_message'
        AND readed = false`,
      [message.id],
    )

    res.json({
      success: true,
      data: message,
    })
  } catch (error) {
    console.error('Error marking contact message as read:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to mark contact message as read',
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
